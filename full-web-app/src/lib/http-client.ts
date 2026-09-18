import { env } from "../config/env";

export type ApiErrorKind =
  | "validation"
  | "authentication"
  | "conflict"
  | "timeout"
  | "network"
  | "unavailable"
  | "server"
  | "cancelled"
  | "unknown";

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

const defaultRequestTimeoutMs = 45_000;

export class ApiError extends Error {
  readonly status: number;
  readonly kind: ApiErrorKind;
  readonly retryable: boolean;

  constructor(
    message: string,
    status: number,
    kind = getApiErrorKind(status),
    retryable = isRetryableErrorKind(kind),
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
    this.retryable = retryable;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  token?: string,
): Promise<T> {
  const {
    timeoutMs = defaultRequestTimeoutMs,
    signal: callerSignal,
    ...requestOptions
  } = options;
  const requestController = new AbortController();
  let didTimeOut = false;
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;

  const abortFromCaller = () => requestController.abort(callerSignal?.reason);

  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
  }

  if (timeoutMs > 0) {
    timeoutId = globalThis.setTimeout(() => {
      didTimeOut = true;
      requestController.abort();
    }, timeoutMs);
  }

  try {
    const response = await fetch(`${env.apiUrl}${path}`, {
      ...requestOptions,
      signal: requestController.signal,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...requestOptions.headers,
      },
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const body = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(getResponseMessage(body, response.status), response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (didTimeOut) {
      throw new ApiError(
        "The request took too long to complete.",
        0,
        "timeout",
        true,
      );
    }

    if (callerSignal?.aborted) {
      throw new ApiError("The request was cancelled.", 0, "cancelled", false);
    }

    throw new ApiError(
      "The service could not be reached.",
      0,
      "network",
      true,
    );
  } finally {
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
    }
    callerSignal?.removeEventListener("abort", abortFromCaller);
  }
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getResponseMessage(body: unknown, status: number): string {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return `Request failed with status ${status}`;
}

function getApiErrorKind(status: number): ApiErrorKind {
  if (status === 400 || status === 422) return "validation";
  if (status === 401 || status === 403) return "authentication";
  if (status === 409) return "conflict";
  if (status === 408) return "timeout";
  if (status === 429 || status === 502 || status === 503 || status === 504) {
    return "unavailable";
  }
  if (status >= 500) return "server";
  return "unknown";
}

function isRetryableErrorKind(kind: ApiErrorKind): boolean {
  return kind === "network" || kind === "timeout" || kind === "unavailable";
}

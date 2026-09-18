import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "../../../lib/http-client";

export type ServiceReadinessStatus =
  | "checking"
  | "ready"
  | "delayed"
  | "unavailable";

const delayedNoticeMs = 3_000;
const readinessRequestTimeoutMs = 12_000;
const retryDelaysMs = [1_500, 3_000, 5_000];

export function useServiceReadiness() {
  const [status, setStatus] = useState<ServiceReadinessStatus>("checking");
  const [checkVersion, setCheckVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let isCancelled = false;
    const delayedTimer = window.setTimeout(() => {
      if (!isCancelled) {
        setStatus((currentStatus) =>
          currentStatus === "checking" ? "delayed" : currentStatus,
        );
      }
    }, delayedNoticeMs);

    async function checkReadiness() {
      setStatus("checking");

      for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
        try {
          await apiRequest<string>("/health/ready", {
            signal: controller.signal,
            timeoutMs: readinessRequestTimeoutMs,
          });

          if (!isCancelled) setStatus("ready");
          return;
        } catch (error) {
          if (isCancelled || controller.signal.aborted) return;

          const canRetry = error instanceof ApiError && error.retryable;
          if (!canRetry || attempt === retryDelaysMs.length) {
            setStatus("unavailable");
            return;
          }

          setStatus("delayed");
          const shouldContinue = await waitForRetry(
            retryDelaysMs[attempt],
            controller.signal,
          );
          if (!shouldContinue) return;
        }
      }
    }

    void checkReadiness();

    return () => {
      isCancelled = true;
      window.clearTimeout(delayedTimer);
      controller.abort();
    };
  }, [checkVersion]);

  const retry = useCallback(() => {
    setStatus("checking");
    setCheckVersion((currentVersion) => currentVersion + 1);
  }, []);

  return { retry, status };
}

function waitForRetry(delayMs: number, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const finish = (shouldContinue: boolean) => {
      window.clearTimeout(timer);
      signal.removeEventListener("abort", handleAbort);
      resolve(shouldContinue);
    };
    const handleAbort = () => finish(false);
    const timer = window.setTimeout(() => finish(true), delayMs);

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

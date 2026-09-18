import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/http-client";
import { useServiceReadiness } from "./use-service-readiness";

const httpClientMock = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock("../../../lib/http-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../lib/http-client")>();
  return { ...actual, apiRequest: httpClientMock.apiRequest };
});

describe("useServiceReadiness", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("marks the service ready after a successful health check", async () => {
    httpClientMock.apiRequest.mockResolvedValue("Healthy");

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(httpClientMock.apiRequest).toHaveBeenCalledWith(
      "/health/ready",
      expect.objectContaining({ timeoutMs: 12_000 }),
    );
  });

  it("reveals a delayed state when the health check remains pending", async () => {
    vi.useFakeTimers();
    httpClientMock.apiRequest.mockImplementation(() => new Promise(() => undefined));

    const { result, unmount } = renderHook(() => useServiceReadiness());

    await act(() => vi.advanceTimersByTimeAsync(3_000));
    expect(result.current.status).toBe("delayed");
    unmount();
  });

  it("allows a failed readiness check to be started again", async () => {
    httpClientMock.apiRequest
      .mockRejectedValueOnce(new ApiError("Unexpected", 500))
      .mockResolvedValueOnce("Healthy");

    const { result } = renderHook(() => useServiceReadiness());

    await waitFor(() => expect(result.current.status).toBe("unavailable"));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
  });
});

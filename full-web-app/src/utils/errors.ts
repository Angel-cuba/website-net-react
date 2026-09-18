import { ApiError } from "../lib/http-client";

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.kind) {
      case "network":
        return "We could not reach the demo service. Check your connection and try again.";
      case "timeout":
        return "The demo service is taking longer than expected. Please try again.";
      case "unavailable":
        return "The demo service is still starting or temporarily unavailable. Please try again in a moment.";
      case "server":
        return "We could not complete this request. Please try again.";
      case "cancelled":
        return "The request was cancelled.";
      default:
        return error.message;
    }
  }

  return error instanceof Error ? error.message : "Something went wrong.";
}

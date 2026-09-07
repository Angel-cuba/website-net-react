import { apiRequest } from "../../../lib/http-client";
import { readAuthToken } from "../token-storage";

export function authenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(path, options, readAuthToken());
}

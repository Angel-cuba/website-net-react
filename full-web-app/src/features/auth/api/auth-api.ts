import { apiRequest } from "../../../lib/http-client";
import type { ApiResponse } from "../../../types/api";
import type { AuthCredentials, AuthResponse } from "../types/auth";

export function register(credentials: AuthCredentials) {
  return apiRequest<ApiResponse<AuthResponse>>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function login(credentials: AuthCredentials) {
  return apiRequest<ApiResponse<AuthResponse>>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

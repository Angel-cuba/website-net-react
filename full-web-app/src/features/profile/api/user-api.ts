import type { IUserProfile } from "../types/IUserProfile";
import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";

export function getUserProfile() {
  return authenticatedRequest<ApiResponse<IUserProfile>>("/api/user/profile");
}

export function updateUserProfile(profile: IUserProfile) {
  return authenticatedRequest<ApiResponse<IUserProfile>>(
    "/api/user/profile/update",
    {
      method: "PUT",
      body: JSON.stringify(profile),
    },
  );
}
export function deleteUserProfile() {
  return authenticatedRequest<ApiResponse<IUserProfile>>("/api/user/profile", {
    method: "DELETE",
  });
}

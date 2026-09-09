import type {
  IUserProfile,
  UpdateUserProfileRequest,
} from "../types/IUserProfile";
import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";

export function getUserProfile() {
  return authenticatedRequest<ApiResponse<IUserProfile>>("/api/user/profile");
}

export function updateUserProfile(profile: UpdateUserProfileRequest) {
  return authenticatedRequest<ApiResponse<IUserProfile>>(
    "/api/user/profile",
    {
      method: "PUT",
      body: JSON.stringify(profile),
    },
  );
}
export function deleteUserProfile() {
  return authenticatedRequest<void>("/api/user/profile", {
    method: "DELETE",
  });
}

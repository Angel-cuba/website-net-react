import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";
import type { OwnedSharedTaskItem, SharedTaskItem } from "../types/shared-task";

export function getSharedTasks() {
  return authenticatedRequest<ApiResponse<SharedTaskItem[]>>("/api/tasks/shared");
}

export function getOwnedSharedTasks() {
  return authenticatedRequest<ApiResponse<OwnedSharedTaskItem[]>>(
    "/api/tasks/shared/owned",
  );
}

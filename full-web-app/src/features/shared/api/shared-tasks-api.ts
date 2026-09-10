import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";
import type { SharedTaskItem } from "../types/shared-task";

export function getSharedTasks() {
  return authenticatedRequest<ApiResponse<SharedTaskItem[]>>("/api/tasks/shared");
}

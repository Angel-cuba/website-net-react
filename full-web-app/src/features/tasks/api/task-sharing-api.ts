import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";
import type { TaskSharing } from "../types/task-sharing";

export function getTaskSharing(taskId: number) {
  return authenticatedRequest<ApiResponse<TaskSharing>>(
    `/api/tasks/${taskId}/sharing`,
  );
}

export function revokeTaskAccess(taskId: number, accessId: number) {
  return authenticatedRequest<void>(`/api/tasks/${taskId}/access/${accessId}`, {
    method: "DELETE",
  });
}

export function updateTaskAccessPermission(
  taskId: number,
  accessId: number,
  canEdit: boolean,
) {
  return authenticatedRequest<void>(`/api/tasks/${taskId}/access/${accessId}`, {
    method: "PATCH",
    body: JSON.stringify({ canEdit }),
  });
}

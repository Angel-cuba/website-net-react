import { authenticatedRequest } from "../../auth/api/authenticated-request";
import type { TaskItem, TaskPayload } from "../types/task";

export function getTasks() {
  return authenticatedRequest<TaskItem[]>("/api/tasks/all");
}

export function createTask(payload: TaskPayload) {
  return authenticatedRequest<TaskItem>(
    "/api/tasks/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateTask(id: number, payload: TaskPayload) {
  return authenticatedRequest<TaskItem>(
    `/api/tasks/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteTask(id: number) {
  return authenticatedRequest<void>(
    `/api/tasks/${id}`,
    {
      method: "DELETE",
    },
  );
}

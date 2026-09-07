import { apiRequest } from "../../../lib/http-client";
import type { TaskItem, TaskPayload } from "../types/task";

export function getTasks(token: string) {
  return apiRequest<TaskItem[]>("/api/tasks/all", {}, token);
}

export function createTask(payload: TaskPayload, token: string) {
  return apiRequest<TaskItem>(
    "/api/tasks/create",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function updateTask(id: number, payload: TaskPayload, token: string) {
  return apiRequest<TaskItem>(
    `/api/tasks/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export function deleteTask(id: number, token: string) {
  return apiRequest<void>(
    `/api/tasks/${id}`,
    {
      method: "DELETE",
    },
    token,
  );
}

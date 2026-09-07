import type { TaskPayload } from "../types/task";

export function normalizeTaskPayload(payload: TaskPayload): TaskPayload {
  return {
    ...payload,
    dueDate: payload.dueDate ? new Date(payload.dueDate).toISOString() : null,
    status: payload.isCompleted ? "completed" : payload.status,
  };
}

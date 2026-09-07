import { useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { getErrorMessage } from "../../../utils/errors";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  getTasks,
  updateTask,
} from "../api/tasks-api";
import type { TaskItem, TaskPayload } from "../types/task";
import { normalizeTaskPayload } from "../utils/task-payload";

export function useTasks() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [message, setMessage] = useState("Ready to test the API.");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      return;
    }

    let isCancelled = false;

    void getTasks(token)
      .then((nextTasks) => {
        if (isCancelled) {
          return;
        }

        setTasks(nextTasks);
        setMessage(`Loaded ${nextTasks.length} task${nextTasks.length === 1 ? "" : "s"}.`);
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setError(getErrorMessage(caughtError));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [token]);

  async function refreshTasks() {
    if (!token) {
      return;
    }

    await runTaskAction(async () => {
      const nextTasks = await getTasks(token);
      setTasks(nextTasks);
      setMessage(`Loaded ${nextTasks.length} task${nextTasks.length === 1 ? "" : "s"}.`);
    });
  }

  async function createTask(payload: TaskPayload): Promise<boolean> {
    if (!token) {
      setError("Login is required before creating tasks.");
      return false;
    }

    let succeeded = false;

    await runTaskAction(async () => {
      const createdTask = await createTaskRequest(normalizeTaskPayload(payload), token);
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setMessage(`Created task #${createdTask.id}.`);
      succeeded = true;
    });

    return succeeded;
  }

  async function toggleTask(task: TaskItem) {
    if (!token) {
      setError("Login is required before updating tasks.");
      return;
    }

    await runTaskAction(async () => {
      const updatedTask = await updateTask(
        task.id,
        normalizeTaskPayload({
          title: task.title,
          category: task.category ?? "",
          description: task.description ?? "",
          dueDate: task.dueDate,
          isCompleted: !task.isCompleted,
          priority: task.priority ?? "Medium",
          status: !task.isCompleted ? "completed" : "pending",
        }),
        token,
      );

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
      setMessage(`Updated task #${updatedTask.id}.`);
    });
  }

  async function removeTask(taskId: number) {
    if (!token) {
      setError("Login is required before deleting tasks.");
      return;
    }

    await runTaskAction(async () => {
      await deleteTaskRequest(taskId, token);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setMessage(`Deleted task #${taskId}.`);
    });
  }

  async function runTaskAction(action: () => Promise<void>) {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await action();
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    tasks,
    message,
    error,
    isLoading,
    refreshTasks,
    createTask,
    toggleTask,
    removeTask,
  };
}

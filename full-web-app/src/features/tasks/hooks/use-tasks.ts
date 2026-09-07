import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../lib/http-client";
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
  const { expireSession, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(isAuthenticated);

  const handleRequestError = useCallback(
    (caughtError: unknown) => {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        expireSession();
        return;
      }

      setError(getErrorMessage(caughtError));
    },
    [expireSession],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isCancelled = false;

    void getTasks()
      .then((nextTasks) => {
        if (isCancelled) {
          return;
        }

        setTasks(nextTasks);
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          handleRequestError(caughtError);
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
  }, [handleRequestError, isAuthenticated]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function refreshTasks() {
    if (!isAuthenticated) {
      return;
    }

    await runTaskAction(async () => {
      const nextTasks = await getTasks();
      setTasks(nextTasks);
      setMessage(`Loaded ${nextTasks.length} task${nextTasks.length === 1 ? "" : "s"}.`);
    });
  }

  async function createTask(payload: TaskPayload): Promise<boolean> {
    if (!isAuthenticated) {
      setError("Login is required before creating tasks.");
      return false;
    }

    return runTaskAction(async () => {
      const createdTask = await createTaskRequest(normalizeTaskPayload(payload));
      setTasks((currentTasks) => [createdTask, ...currentTasks]);
      setMessage(`Task “${createdTask.title}” created.`);
    });
  }

  async function saveTask(taskId: number, payload: TaskPayload): Promise<boolean> {
    if (!isAuthenticated) {
      setError("Login is required before updating tasks.");
      return false;
    }

    return runTaskAction(async () => {
      const updatedTask = await updateTask(taskId, normalizeTaskPayload(payload));
      setTasks((currentTasks) =>
        currentTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      );
      setMessage(`Task “${updatedTask.title}” saved.`);
    });
  }

  async function toggleTask(task: TaskItem) {
    if (!isAuthenticated) {
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
      );

      setTasks((currentTasks) =>
        currentTasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
      );
      setMessage(
        updatedTask.isCompleted
          ? `Task “${updatedTask.title}” completed.`
          : `Task “${updatedTask.title}” reopened.`,
      );
    });
  }

  async function removeTask(taskId: number): Promise<boolean> {
    if (!isAuthenticated) {
      setError("Login is required before deleting tasks.");
      return false;
    }

    return runTaskAction(async () => {
      await deleteTaskRequest(taskId);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
      setMessage("Task deleted.");
    });
  }

  async function runTaskAction(action: () => Promise<void>): Promise<boolean> {
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await action();
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
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
    saveTask,
    toggleTask,
    removeTask,
  };
}

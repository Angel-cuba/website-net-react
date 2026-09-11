import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { useRealtime } from "../../../hooks/use-realtime";
import { useAuth } from "../../auth";
import { updateTask } from "../../tasks/api/tasks-api";
import type { TaskPayload } from "../../tasks/types/task";
import { normalizeTaskPayload } from "../../tasks/utils/task-payload";
import { getOwnedSharedTasks, getSharedTasks } from "../api/shared-tasks-api";
import type { OwnedSharedTaskItem, SharedTaskItem } from "../types/shared-task";

export function useSharedTasks() {
  const { expireSession, isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const { sharedTasksRevision, taskSharingRevision } = useRealtime();
  const [sharedWithYou, setSharedWithYou] = useState<SharedTaskItem[]>([]);
  const [sharedByYou, setSharedByYou] = useState<OwnedSharedTaskItem[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const loadSharedTasks = useCallback(async () => {
    const [receivedResponse, ownedResponse] = await Promise.all([
      getSharedTasks(),
      getOwnedSharedTasks(),
    ]);

    if (!receivedResponse.data || !ownedResponse.data) {
      throw new Error("The API did not return shared task data.");
    }

    return {
      sharedWithYou: receivedResponse.data,
      sharedByYou: ownedResponse.data,
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCancelled = false;

    void loadSharedTasks()
      .then((nextTasks) => {
        if (isCancelled) return;

        setSharedWithYou(nextTasks.sharedWithYou);
        setSharedByYou(nextTasks.sharedByYou);
        setLoadedUserId(userId);
        setError("");
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setSharedWithYou([]);
          setSharedByYou([]);
          setLoadedUserId(userId);
          handleRequestError(caughtError);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    handleRequestError,
    isAuthenticated,
    loadSharedTasks,
    sharedTasksRevision,
    taskSharingRevision,
    userId,
  ]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function refreshSharedTasks(): Promise<boolean> {
    if (!isAuthenticated || !userId) return false;

    setError("");
    setIsRefreshing(true);

    try {
      const nextTasks = await loadSharedTasks();
      setSharedWithYou(nextTasks.sharedWithYou);
      setSharedByYou(nextTasks.sharedByYou);
      setLoadedUserId(userId);
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function saveSharedTask(
    taskId: number,
    payload: TaskPayload,
  ): Promise<boolean> {
    return persistSharedTask(
      taskId,
      payload,
      (title) => `Shared task “${title}” saved.`,
    );
  }

  async function toggleSharedTask(task: SharedTaskItem): Promise<void> {
    await persistSharedTask(
      task.id,
      {
        title: task.title,
        category: task.category ?? "",
        description: task.description ?? "",
        dueDate: task.dueDate,
        isCompleted: !task.isCompleted,
        priority: task.priority ?? "Medium",
        status: !task.isCompleted ? "completed" : "pending",
      },
      (title) =>
        task.isCompleted
          ? `Shared task “${title}” reopened.`
          : `Shared task “${title}” completed.`,
    );
  }

  async function persistSharedTask(
    taskId: number,
    payload: TaskPayload,
    getSuccessMessage: (title: string) => string,
  ): Promise<boolean> {
    if (!isAuthenticated) return false;

    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const updatedTask = await updateTask(taskId, normalizeTaskPayload(payload));
      setSharedWithYou((currentTasks) =>
        currentTasks.map((task) =>
          task.id === updatedTask.id
            ? {
                ...task,
                title: updatedTask.title,
                category: updatedTask.category,
                description: updatedTask.description,
                dueDate: updatedTask.dueDate,
                isCompleted: updatedTask.isCompleted,
                priority: updatedTask.priority,
                status: updatedTask.status,
                createdAt: updatedTask.createdAt,
                updatedAt: updatedTask.updatedAt,
              }
            : task,
        ),
      );
      setMessage(getSuccessMessage(updatedTask.title));
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasCurrentSharedTasks = Boolean(userId && loadedUserId === userId);
  const currentSharedWithYou = isAuthenticated && hasCurrentSharedTasks
    ? sharedWithYou
    : [];
  const currentSharedByYou = isAuthenticated && hasCurrentSharedTasks ? sharedByYou : [];
  const currentError = isAuthenticated && hasCurrentSharedTasks ? error : "";
  const isLoading = Boolean(
    isAuthenticated &&
      userId &&
      (!hasCurrentSharedTasks || isRefreshing || isSubmitting),
  );

  return {
    sharedWithYou: currentSharedWithYou,
    sharedByYou: currentSharedByYou,
    isLoading,
    message,
    error: currentError,
    refreshSharedTasks,
    saveSharedTask,
    toggleSharedTask,
  };
}

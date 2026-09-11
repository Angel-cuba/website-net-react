import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { useRealtime } from "../../../hooks/use-realtime";
import { useAuth } from "../../auth";
import { getSharedTasks } from "../api/shared-tasks-api";
import type { SharedTaskItem } from "../types/shared-task";

export function useSharedTasks() {
  const { expireSession, isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const { sharedTasksRevision } = useRealtime();
  const [sharedTasks, setSharedTasks] = useState<SharedTaskItem[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    const response = await getSharedTasks();

    if (!response.data) {
      throw new Error("The API did not return shared task data.");
    }

    return response.data;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCancelled = false;

    void loadSharedTasks()
      .then((nextTasks) => {
        if (isCancelled) return;

        setSharedTasks(nextTasks);
        setLoadedUserId(userId);
        setError("");
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setSharedTasks([]);
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
    userId,
  ]);

  async function refreshSharedTasks(): Promise<boolean> {
    if (!isAuthenticated || !userId) return false;

    setError("");
    setIsRefreshing(true);

    try {
      setSharedTasks(await loadSharedTasks());
      setLoadedUserId(userId);
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  const hasCurrentSharedTasks = Boolean(userId && loadedUserId === userId);
  const currentSharedTasks = isAuthenticated && hasCurrentSharedTasks ? sharedTasks : [];
  const currentError = isAuthenticated && hasCurrentSharedTasks ? error : "";
  const isLoading = Boolean(
    isAuthenticated && userId && (!hasCurrentSharedTasks || isRefreshing),
  );

  return {
    sharedTasks: currentSharedTasks,
    isLoading,
    error: currentError,
    refreshSharedTasks,
  };
}

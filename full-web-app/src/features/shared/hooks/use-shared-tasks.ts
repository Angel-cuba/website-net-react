import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { useRealtime } from "../../../hooks/use-realtime";
import { useAuth } from "../../auth";
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

  const hasCurrentSharedTasks = Boolean(userId && loadedUserId === userId);
  const currentSharedWithYou = isAuthenticated && hasCurrentSharedTasks
    ? sharedWithYou
    : [];
  const currentSharedByYou = isAuthenticated && hasCurrentSharedTasks ? sharedByYou : [];
  const currentError = isAuthenticated && hasCurrentSharedTasks ? error : "";
  const isLoading = Boolean(
    isAuthenticated && userId && (!hasCurrentSharedTasks || isRefreshing),
  );

  return {
    sharedWithYou: currentSharedWithYou,
    sharedByYou: currentSharedByYou,
    isLoading,
    error: currentError,
    refreshSharedTasks,
  };
}

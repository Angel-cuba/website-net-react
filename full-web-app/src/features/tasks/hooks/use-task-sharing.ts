import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth";
import {
  cancelInvitation,
  createInvitation,
} from "../../invitations/api/invitations-api";
import {
  getTaskSharing,
  revokeTaskAccess,
} from "../api/task-sharing-api";
import type { TaskSharing } from "../types/task-sharing";

export function useTaskSharing(taskId: number | null) {
  const { expireSession, isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [sharing, setSharing] = useState<TaskSharing | null>(null);
  const [loadedTaskId, setLoadedTaskId] = useState<number | null>(null);
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

  const loadTaskSharing = useCallback(async (currentTaskId: number) => {
    const response = await getTaskSharing(currentTaskId);

    if (!response.data) {
      throw new Error("The API did not return task sharing data.");
    }

    return response.data;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId || taskId === null) return;

    let isCancelled = false;

    void loadTaskSharing(taskId)
      .then((nextSharing) => {
        if (isCancelled) return;

        setSharing(nextSharing);
        setLoadedTaskId(taskId);
        setLoadedUserId(userId);
        setError("");
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setSharing(null);
          setLoadedTaskId(taskId);
          setLoadedUserId(userId);
          handleRequestError(caughtError);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [handleRequestError, isAuthenticated, loadTaskSharing, taskId, userId]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function refreshTaskSharing(): Promise<boolean> {
    if (!isAuthenticated || !userId || taskId === null) return false;

    setError("");
    setIsRefreshing(true);

    try {
      setSharing(await loadTaskSharing(taskId));
      setLoadedTaskId(taskId);
      setLoadedUserId(userId);
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  async function inviteUser(invitedEmail: string): Promise<boolean> {
    if (!isAuthenticated || taskId === null) return false;

    return runSharingAction(async () => {
      await createInvitation(taskId, { invitedEmail });
      setSharing(await loadTaskSharing(taskId));
      setMessage("Invitation sent.");
    });
  }

  async function cancelPendingInvitation(invitationId: number): Promise<boolean> {
    if (!isAuthenticated || taskId === null) return false;

    return runSharingAction(async () => {
      await cancelInvitation(invitationId);
      setSharing((currentSharing) =>
        currentSharing
          ? {
              ...currentSharing,
              pendingInvitations: currentSharing.pendingInvitations.filter(
                (invitation) => invitation.invitationId !== invitationId,
              ),
            }
          : null,
      );
      setMessage("Invitation cancelled.");
    });
  }

  async function revokeAccess(accessId: number): Promise<boolean> {
    if (!isAuthenticated || taskId === null) return false;

    return runSharingAction(async () => {
      await revokeTaskAccess(taskId, accessId);
      setSharing((currentSharing) =>
        currentSharing
          ? {
              ...currentSharing,
              members: currentSharing.members.filter(
                (member) => member.accessId !== accessId,
              ),
            }
          : null,
      );
      setMessage("Access revoked.");
    });
  }

  async function runSharingAction(action: () => Promise<void>): Promise<boolean> {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      await action();
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasCurrentSharing = Boolean(
    userId && loadedUserId === userId && taskId !== null && loadedTaskId === taskId,
  );
  const currentSharing = isAuthenticated && hasCurrentSharing ? sharing : null;
  const currentError = isAuthenticated && hasCurrentSharing ? error : "";
  const isLoading = Boolean(
    isAuthenticated &&
      userId &&
      taskId !== null &&
      (!hasCurrentSharing || isRefreshing),
  );

  return {
    sharing: currentSharing,
    isLoading,
    isSubmitting,
    message,
    error: currentError,
    refreshTaskSharing,
    inviteUser,
    cancelPendingInvitation,
    revokeAccess,
  };
}

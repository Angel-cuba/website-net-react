import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth";
import {
  getReceivedInvitations,
  respondToInvitation,
} from "../../features/invitations/api/invitations-api";
import type {
  InvitationDecision,
  InvitationItem,
} from "../../features/invitations/types/invitation";
import { ApiError } from "../../lib/http-client";
import { getErrorMessage } from "../../utils/errors";
import { InvitationsContext } from "./invitations-context";

type InvitationsProviderProps = {
  children: ReactNode;
};

export function InvitationsProvider({ children }: InvitationsProviderProps) {
  const { expireSession, isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [invitations, setInvitations] = useState<InvitationItem[]>([]);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [respondingInvitationId, setRespondingInvitationId] = useState<number | null>(
    null,
  );
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

  const loadInvitations = useCallback(async () => {
    const response = await getReceivedInvitations();

    if (!response.data) {
      throw new Error("The API did not return invitation data.");
    }

    return response.data;
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCancelled = false;

    void loadInvitations()
      .then((nextInvitations) => {
        if (isCancelled) return;

        setInvitations(nextInvitations);
        setLoadedUserId(userId);
        setError("");
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          setInvitations([]);
          setLoadedUserId(userId);
          handleRequestError(caughtError);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [handleRequestError, isAuthenticated, loadInvitations, userId]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  const refreshInvitations = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !userId) return false;

    setError("");
    setIsRefreshing(true);

    try {
      setInvitations(await loadInvitations());
      setLoadedUserId(userId);
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [handleRequestError, isAuthenticated, loadInvitations, userId]);

  const respond = useCallback(async (
    invitationId: number,
    decision: InvitationDecision,
  ): Promise<boolean> => {
    if (!isAuthenticated || !userId) return false;

    setError("");
    setMessage("");
    setRespondingInvitationId(invitationId);

    try {
      const response = await respondToInvitation(invitationId, { decision });

      if (!response.data) {
        throw new Error("The API did not return the updated invitation.");
      }

      const updatedInvitation = response.data;
      setInvitations((currentInvitations) =>
        currentInvitations.map((invitation) =>
          invitation.id === updatedInvitation.id ? updatedInvitation : invitation,
        ),
      );
      setMessage(
        decision === "accepted" ? "Invitation accepted." : "Invitation declined.",
      );
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setRespondingInvitationId(null);
    }
  }, [handleRequestError, isAuthenticated, userId]);

  const hasCurrentInvitations = Boolean(userId && loadedUserId === userId);
  const currentInvitations = useMemo(
    () => (isAuthenticated && hasCurrentInvitations ? invitations : []),
    [hasCurrentInvitations, invitations, isAuthenticated],
  );
  const currentError = isAuthenticated && hasCurrentInvitations ? error : "";
  const isLoading = Boolean(
    isAuthenticated && userId && (!hasCurrentInvitations || isRefreshing),
  );
  const value = useMemo(
    () => ({
      invitations: currentInvitations,
      isLoading,
      respondingInvitationId,
      message,
      error: currentError,
      refreshInvitations,
      respond,
    }),
    [
      currentError,
      currentInvitations,
      isLoading,
      message,
      refreshInvitations,
      respond,
      respondingInvitationId,
    ],
  );

  return (
    <InvitationsContext.Provider value={value}>
      {children}
    </InvitationsContext.Provider>
  );
}

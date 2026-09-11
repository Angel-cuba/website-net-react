import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { env } from "../../config/env";
import { useAuth } from "../../features/auth";
import { readAuthToken } from "../../features/auth/token-storage";
import { RealtimeContext } from "./realtime-context";

const initialRetryDelayMs = 5_000;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  const [invitationsRevision, setInvitationsRevision] = useState(0);
  const [sharedTasksRevision, setSharedTasksRevision] = useState(0);
  const [taskSharingRevision, setTaskSharingRevision] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    let isCancelled = false;
    let retryTimer: number | undefined;
    const connection = new HubConnectionBuilder()
      .withUrl(`${env.apiUrl}/hubs/notifications`, {
        accessTokenFactory: readAuthToken,
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("InvitationsChanged", () => {
      setInvitationsRevision((revision) => revision + 1);
    });
    connection.on("SharedTasksChanged", () => {
      setSharedTasksRevision((revision) => revision + 1);
    });
    connection.on("TaskSharingChanged", () => {
      setTaskSharingRevision((revision) => revision + 1);
    });

    function refreshAllResources() {
      setInvitationsRevision((revision) => revision + 1);
      setSharedTasksRevision((revision) => revision + 1);
      setTaskSharingRevision((revision) => revision + 1);
    }

    function scheduleInitialRetry() {
      if (isCancelled) return;
      scheduleConnectionStart(initialRetryDelayMs);
    }

    function scheduleConnectionStart(delayMs: number) {
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      retryTimer = window.setTimeout(() => {
        retryTimer = undefined;
        void startConnection();
      }, delayMs);
    }

    async function startConnection() {
      try {
        await connection.start();

        if (isCancelled) {
          await connection.stop();
          return;
        }

        refreshAllResources();
      } catch {
        scheduleInitialRetry();
      }
    }

    connection.onreconnected(refreshAllResources);
    connection.onclose(scheduleInitialRetry);
    scheduleConnectionStart(0);

    return () => {
      isCancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      void connection.stop();
    };
  }, [isAuthenticated, userId]);

  const value = useMemo(
    () => ({
      invitationsRevision,
      sharedTasksRevision,
      taskSharingRevision,
    }),
    [invitationsRevision, sharedTasksRevision, taskSharingRevision],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

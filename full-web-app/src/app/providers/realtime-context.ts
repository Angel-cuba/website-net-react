import { createContext } from "react";

export type RealtimeContextValue = {
  invitationsRevision: number;
  sharedTasksRevision: number;
  taskSharingRevision: number;
};

export const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined,
);

import { createContext } from "react";
import type {
  InvitationDecision,
  InvitationItem,
} from "../../features/invitations/types/invitation";

export type InvitationsContextValue = {
  invitations: InvitationItem[];
  isLoading: boolean;
  respondingInvitationId: number | null;
  message: string;
  error: string;
  refreshInvitations: () => Promise<boolean>;
  respond: (
    invitationId: number,
    decision: InvitationDecision,
  ) => Promise<boolean>;
};

export const InvitationsContext = createContext<InvitationsContextValue | undefined>(
  undefined,
);

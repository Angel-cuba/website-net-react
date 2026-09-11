export type InvitationStatus = "pending" | "accepted" | "rejected";

export type InvitationDecision = Exclude<InvitationStatus, "pending">;

export type InvitationItem = {
  id: number;
  taskId: number;
  taskTitle: string;
  invitedEmail: string;
  invitedByEmail: string;
  invitedByName: string;
  status: InvitationStatus;
  hasActiveAccess: boolean;
  createdAt: string;
  respondedAt: string | null;
};

export type CreateInvitationRequest = {
  invitedEmail: string;
};

export type RespondInvitationRequest = {
  decision: InvitationDecision;
};

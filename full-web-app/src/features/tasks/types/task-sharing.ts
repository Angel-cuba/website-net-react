export type PendingTaskInvitation = {
  invitationId: number;
  invitedEmail: string;
  invitedName: string;
  invitedAvatarUrl: string | null;
  createdAt: string;
};

export type TaskAccessMember = {
  accessId: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  canEdit: boolean;
  sharedAt: string;
};

export type TaskSharing = {
  taskId: number;
  taskTitle: string;
  pendingInvitations: PendingTaskInvitation[];
  members: TaskAccessMember[];
};

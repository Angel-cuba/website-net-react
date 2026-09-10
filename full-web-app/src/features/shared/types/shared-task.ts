export type SharedTaskItem = {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  priority: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  ownerEmail: string;
  ownerName: string;
  ownerAvatarUrl: string | null;
  canEdit: boolean;
  sharedAt: string;
};

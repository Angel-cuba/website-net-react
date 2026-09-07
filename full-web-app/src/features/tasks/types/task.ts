export type TaskItem = {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  ownerUserId: number | null;
  dueDate: string | null;
  isCompleted: boolean;
  priority: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
};

export type TaskPayload = {
  title: string;
  category: string;
  description: string;
  dueDate: string | null;
  isCompleted: boolean;
  priority: string;
  status: string;
};

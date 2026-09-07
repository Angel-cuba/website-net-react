import { ClipboardList } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import type { TaskItem } from "../types/task";
import { TaskCard } from "./task-card";

type TaskListProps = {
  isLoading: boolean;
  tasks: TaskItem[];
  onDelete: (taskId: number) => Promise<boolean>;
  onEdit: (taskId: number) => void;
  onToggle: (task: TaskItem) => Promise<void>;
};

export function TaskList({
  isLoading,
  tasks,
  onDelete,
  onEdit,
  onToggle,
}: TaskListProps) {
  if (isLoading && tasks.length === 0) {
    return (
      <div aria-label="Loading tasks" className="task-list" role="status">
        {[0, 1, 2].map((item) => <div className="task-skeleton" key={item} />)}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        description="Create your first task above."
        icon={<ClipboardList aria-hidden="true" />}
        title="No tasks yet"
      />
    );
  }

  return (
    <div aria-busy={isLoading} className="task-list">
      {tasks.map((task) => (
        <TaskCard
          disabled={isLoading}
          key={task.id}
          onDelete={onDelete}
          onEdit={onEdit}
          onToggle={onToggle}
          task={task}
        />
      ))}
    </div>
  );
}

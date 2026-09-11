import { ClipboardList } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";
import { SharedTaskCard } from "../../shared/components/shared-task-card";
import type { SharedTaskItem } from "../../shared/types/shared-task";
import type { TaskItem } from "../types/task";
import { TaskCard } from "./task-card";

type TaskListProps = {
  isLoading: boolean;
  sharedTasks: SharedTaskItem[];
  tasks: TaskItem[];
  onDelete: (taskId: number) => Promise<boolean>;
  onEdit: (taskId: number) => void;
  onShare: (taskId: number) => void;
  onToggle: (task: TaskItem) => Promise<void>;
};

export function TaskList({
  isLoading,
  sharedTasks,
  tasks,
  onDelete,
  onEdit,
  onShare,
  onToggle,
}: TaskListProps) {
  if (isLoading && tasks.length === 0 && sharedTasks.length === 0) {
    return (
      <div aria-label="Loading tasks" className="task-list" role="status">
        {[0, 1, 2].map((item) => <div className="task-skeleton" key={item} />)}
      </div>
    );
  }

  if (tasks.length === 0 && sharedTasks.length === 0) {
    return (
      <EmptyState
        description="Create your first task or accept a task invitation."
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
          onShare={onShare}
          onToggle={onToggle}
          task={task}
        />
      ))}
      {sharedTasks.map((task) => <SharedTaskCard key={`shared-${task.id}`} task={task} />)}
    </div>
  );
}

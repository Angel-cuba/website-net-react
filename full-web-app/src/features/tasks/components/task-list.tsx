import { Button } from "../../../components/button";
import { formatDate } from "../../../utils/date";
import type { TaskItem } from "../types/task";

type TaskListProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  tasks: TaskItem[];
  onDelete: (taskId: number) => Promise<void>;
  onToggle: (task: TaskItem) => Promise<void>;
};

export function TaskList({
  isAuthenticated,
  isLoading,
  tasks,
  onDelete,
  onToggle,
}: TaskListProps) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <article className="task-item" key={task.id}>
          <div>
            <div className="task-title-row">
              <h3>{task.title}</h3>
              <span>{task.priority ?? "No priority"}</span>
            </div>
            <p>{task.description || "No description."}</p>
            <div className="task-meta">
              <span>{task.category || "Uncategorized"}</span>
              <span>{task.status}</span>
              <span>{formatDate(task.dueDate)}</span>
            </div>
          </div>
          <div className="task-actions">
            <label className="checkbox-field">
              <input
                checked={task.isCompleted}
                disabled={isLoading}
                onChange={() => void onToggle(task)}
                type="checkbox"
              />
              Done
            </label>
            <Button
              disabled={isLoading}
              onClick={() => void onDelete(task.id)}
              type="button"
              variant="danger"
            >
              Delete
            </Button>
          </div>
        </article>
      ))}

      {isAuthenticated && tasks.length === 0 && (
        <div className="empty-state">No tasks yet for this user.</div>
      )}
      {!isAuthenticated && <div className="empty-state">Login to create and load tasks.</div>}
    </div>
  );
}

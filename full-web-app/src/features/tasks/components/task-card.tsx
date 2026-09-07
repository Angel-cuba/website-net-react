import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Trash2,
} from "lucide-react";
import { IconButton } from "../../../components/icon-button";
import { formatDate } from "../../../utils/date";
import type { TaskItem } from "../types/task";

type TaskCardProps = {
  disabled: boolean;
  onDelete: (taskId: number) => Promise<boolean>;
  onEdit: (taskId: number) => void;
  onToggle: (task: TaskItem) => Promise<void>;
  task: TaskItem;
};

export function TaskCard({ disabled, onDelete, onEdit, onToggle, task }: TaskCardProps) {
  const [currentTime] = useState(Date.now);
  const isOverdue = Boolean(
    !task.isCompleted && task.dueDate && new Date(task.dueDate).getTime() < currentTime,
  );
  const isInProgress = !task.isCompleted && task.status === "in-progress";
  const stateLabel = task.isCompleted
    ? "Completed"
    : isOverdue
      ? "Overdue"
      : isInProgress
        ? "In progress"
        : "Pending";
  const stateClass = task.isCompleted
    ? "completed"
    : isOverdue
      ? "overdue"
      : isInProgress
        ? "in-progress"
        : "pending";
  const StateIcon = task.isCompleted
    ? CheckCircle2
    : isOverdue
      ? AlertTriangle
      : isInProgress
        ? Clock3
        : Circle;

  async function confirmDelete() {
    if (!window.confirm(`Delete “${task.title}”? This action cannot be undone.`)) return;
    await onDelete(task.id);
  }

  return (
    <article
      className={`task-card ${task.isCompleted ? "is-completed" : ""} ${isOverdue ? "is-overdue" : ""}`}
    >
      <div className="task-card__check">
        <label title={task.isCompleted ? "Mark as pending" : "Mark as completed"}>
          <input
            aria-label={`${task.isCompleted ? "Reopen" : "Complete"} ${task.title}`}
            checked={task.isCompleted}
            disabled={disabled}
            onChange={() => void onToggle(task)}
            type="checkbox"
          />
        </label>
      </div>

      <div className="task-card__content">
        <div className="task-card__title-row">
          <div>
            <h3>{task.title}</h3>
            <span className={`task-state task-state--${stateClass}`}>
              <StateIcon aria-hidden="true" />
              {stateLabel}
            </span>
          </div>
          <div className="task-card__actions">
            <IconButton
              aria-label={`Edit ${task.title}`}
              disabled={disabled}
              onClick={() => onEdit(task.id)}
              type="button"
            >
              <Pencil aria-hidden="true" />
            </IconButton>
            <IconButton
              aria-label={`Delete ${task.title}`}
              disabled={disabled}
              onClick={() => void confirmDelete()}
              tone="danger"
              type="button"
            >
              <Trash2 aria-hidden="true" />
            </IconButton>
          </div>
        </div>

        <p className="task-card__description">{task.description || "No description."}</p>

        <div className="task-card__meta">
          <span>{task.category || "Uncategorized"}</span>
          <span>{task.priority ?? "No priority"}</span>
          <span>{formatStatus(task.status)}</span>
          <span>
            <CalendarDays aria-hidden="true" />
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>
    </article>
  );
}

function formatStatus(status: string): string {
  return status
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

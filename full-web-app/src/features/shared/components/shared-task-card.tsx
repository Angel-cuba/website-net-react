import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Pencil,
  Share2,
  UserRound,
} from "lucide-react";
import { IconButton } from "../../../components/icon-button";
import { formatDate } from "../../../utils/date";
import type { SharedTaskItem } from "../types/shared-task";

type SharedTaskCardProps = {
  disabled: boolean;
  onEdit: (taskId: number) => void;
  onToggle: (task: SharedTaskItem) => Promise<void>;
  task: SharedTaskItem;
};

export function SharedTaskCard({
  disabled,
  onEdit,
  onToggle,
  task,
}: SharedTaskCardProps) {
  const [currentTime] = useState(Date.now);
  const isOverdue = Boolean(
    !task.isCompleted && task.dueDate && new Date(task.dueDate).getTime() < currentTime,
  );
  const isInProgress = !task.isCompleted && task.status === "in-progress";
  const ownerName = task.ownerName || task.ownerEmail;
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

  return (
    <article
      className={`shared-task-card ${task.isCompleted ? "is-completed" : ""} ${isOverdue ? "is-overdue" : ""}`}
    >
      <div className="shared-task-card__heading">
        <div className="shared-task-card__title-row">
          {task.canEdit && (
            <label
              className="shared-task-card__check"
              title={task.isCompleted ? "Mark as pending" : "Mark as completed"}
            >
              <input
                aria-label={`${task.isCompleted ? "Reopen" : "Complete"} shared task ${task.title}`}
                checked={task.isCompleted}
                disabled={disabled}
                onChange={() => void onToggle(task)}
                type="checkbox"
              />
            </label>
          )}
          <div className="shared-task-card__title-copy">
            <h3>{task.title}</h3>
            <span className={`task-state task-state--${stateClass}`}>
              <StateIcon aria-hidden="true" />
              {stateLabel}
            </span>
          </div>
        </div>
        <div className="shared-task-card__actions">
          <span className={`shared-access shared-access--${task.canEdit ? "edit" : "view"}`}>
            <Share2 aria-hidden="true" />
            Shared · {task.canEdit ? "Can edit" : "View only"}
          </span>
          {task.canEdit && (
            <IconButton
              aria-label={`Edit shared task ${task.title}`}
              disabled={disabled}
              onClick={() => onEdit(task.id)}
              type="button"
            >
              <Pencil aria-hidden="true" />
            </IconButton>
          )}
        </div>
      </div>

      <p className="shared-task-card__description">
        {task.description || "No description."}
      </p>

      <div className="shared-task-card__meta">
        <span>{task.category || "Uncategorized"}</span>
        <span>{task.priority ?? "No priority"}</span>
        <span>
          <CalendarDays aria-hidden="true" />
          {formatDate(task.dueDate)}
        </span>
      </div>

      <footer className="shared-task-card__owner">
        <span className="shared-owner-avatar">
          {task.ownerAvatarUrl ? (
            <img alt="" src={task.ownerAvatarUrl} />
          ) : (
            <UserRound aria-hidden="true" />
          )}
        </span>
        <span className="shared-owner-identity">
          <span>Shared by</span>
          <strong>{ownerName}</strong>
          {ownerName !== task.ownerEmail && <span>{task.ownerEmail}</span>}
        </span>
        <span className="shared-at">
          Shared {formatActivityDate(task.sharedAt)}
        </span>
      </footer>
    </article>
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "on an unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

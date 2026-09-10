import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  Eye,
  Pencil,
  UserRound,
} from "lucide-react";
import { formatDate } from "../../../utils/date";
import type { SharedTaskItem } from "../types/shared-task";

type SharedTaskCardProps = {
  task: SharedTaskItem;
};

export function SharedTaskCard({ task }: SharedTaskCardProps) {
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
        <div>
          <h3>{task.title}</h3>
          <span className={`task-state task-state--${stateClass}`}>
            <StateIcon aria-hidden="true" />
            {stateLabel}
          </span>
        </div>
        <span className={`shared-access shared-access--${task.canEdit ? "edit" : "view"}`}>
          {task.canEdit ? <Pencil aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {task.canEdit ? "Can edit" : "View only"}
        </span>
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

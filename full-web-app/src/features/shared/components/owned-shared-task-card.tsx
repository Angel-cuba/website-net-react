import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  MailClock,
  Settings2,
  UsersRound,
} from "lucide-react";
import { Button } from "../../../components/button";
import { formatDate } from "../../../utils/date";
import type { OwnedSharedTaskItem } from "../types/shared-task";

type OwnedSharedTaskCardProps = {
  onManageAccess: (task: OwnedSharedTaskItem) => void;
  task: OwnedSharedTaskItem;
};

export function OwnedSharedTaskCard({ onManageAccess, task }: OwnedSharedTaskCardProps) {
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

  return (
    <article
      className={`shared-task-card owned-shared-task-card ${task.isCompleted ? "is-completed" : ""} ${isOverdue ? "is-overdue" : ""}`}
    >
      <div className="shared-task-card__heading">
        <div>
          <h3>{task.title}</h3>
          <span className={`task-state task-state--${stateClass}`}>
            <StateIcon aria-hidden="true" />
            {stateLabel}
          </span>
        </div>
        <span className="shared-access shared-access--owner">
          <UsersRound aria-hidden="true" />
          Owner
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

      <footer className="owned-sharing-summary">
        <div className="owned-sharing-metrics">
          <span>
            <UsersRound aria-hidden="true" />
            {formatAccessCount(task.activeAccessCount)}
          </span>
          <span className={task.pendingInvitationCount > 0 ? "has-pending" : ""}>
            <MailClock aria-hidden="true" />
            {formatPendingCount(task.pendingInvitationCount)}
          </span>
        </div>
        <Button onClick={() => onManageAccess(task)} type="button" variant="ghost">
          <Settings2 aria-hidden="true" />
          Manage access
        </Button>
      </footer>
    </article>
  );
}

function formatAccessCount(count: number): string {
  if (count === 0) return "No active access";
  return `${count} ${count === 1 ? "person" : "people"} with access`;
}

function formatPendingCount(count: number): string {
  if (count === 0) return "No pending invites";
  return `${count} pending ${count === 1 ? "invite" : "invites"}`;
}

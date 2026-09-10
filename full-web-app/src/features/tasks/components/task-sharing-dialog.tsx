import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import {
  Clock3,
  LoaderCircle,
  MailPlus,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "../../../components/button";
import { IconButton } from "../../../components/icon-button";
import { useTaskSharing } from "../hooks/use-task-sharing";
import type { TaskItem } from "../types/task";

type TaskSharingDialogProps = {
  onClose: () => void;
  task: TaskItem;
};

export function TaskSharingDialog({ onClose, task }: TaskSharingDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [invitedEmail, setInvitedEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const {
    sharing,
    isLoading,
    isSubmitting,
    message,
    error,
    inviteUser,
    cancelPendingInvitation,
    revokeAccess,
  } = useTaskSharing(task.id);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsInviting(true);

    try {
      const succeeded = await inviteUser(invitedEmail.trim());
      if (succeeded) setInvitedEmail("");
    } finally {
      setIsInviting(false);
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose();
    }
  }

  async function confirmRevoke(accessId: number, displayName: string) {
    if (!window.confirm(`Remove ${displayName}'s access to “${task.title}”?`)) return;
    await revokeAccess(accessId);
  }

  return (
    <dialog
      aria-labelledby="task-sharing-title"
      className="sharing-dialog"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) onClose();
      }}
      onClick={handleBackdropClick}
      ref={dialogRef}
    >
      <div className="sharing-dialog__surface">
        <header className="sharing-dialog__header">
          <div>
            <p className="eyebrow">Task access</p>
            <h2 id="task-sharing-title">Share “{task.title}”</h2>
          </div>
          <IconButton
            aria-label="Close sharing dialog"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" />
          </IconButton>
        </header>

        <form aria-busy={isInviting} className="sharing-form" onSubmit={handleInvite}>
          <label htmlFor="sharing-email">
            Invite by email
            <input
              autoComplete="email"
              autoFocus
              disabled={isLoading || isSubmitting}
              id="sharing-email"
              maxLength={255}
              onChange={(event) => setInvitedEmail(event.target.value)}
              placeholder="name@example.com"
              required
              type="email"
              value={invitedEmail}
            />
          </label>
          <Button
            disabled={isLoading || isSubmitting || !invitedEmail.trim()}
            type="submit"
            variant="primary"
          >
            {isInviting ? (
              <LoaderCircle aria-hidden="true" className="is-spinning" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {isInviting ? "Sending" : "Send invite"}
          </Button>
        </form>

        <div aria-atomic="true" aria-live="polite" className="sharing-feedback">
          {message && <p className="notice is-success">{message}</p>}
          {error && <p className="notice is-error" role="alert">{error}</p>}
        </div>

        {isLoading && !sharing ? (
          <div aria-label="Loading task access" className="sharing-loading" role="status">
            <LoaderCircle aria-hidden="true" className="is-spinning" />
            Loading access…
          </div>
        ) : (
          <div className="sharing-sections">
            <section aria-labelledby="pending-invitations-heading">
              <div className="sharing-section__heading">
                <div>
                  <MailPlus aria-hidden="true" />
                  <h3 id="pending-invitations-heading">Pending invitations</h3>
                </div>
                <span>{sharing?.pendingInvitations.length ?? 0}</span>
              </div>

              {sharing?.pendingInvitations.length ? (
                <ul className="sharing-list">
                  {sharing.pendingInvitations.map((invitation) => (
                    <li key={invitation.invitationId}>
                      <UserIdentity
                        avatarUrl={invitation.invitedAvatarUrl}
                        email={invitation.invitedEmail}
                        name={invitation.invitedName}
                      />
                      <div className="sharing-list__meta">
                        <span>
                          <Clock3 aria-hidden="true" />
                          {formatActivityDate(invitation.createdAt)}
                        </span>
                        <IconButton
                          aria-label={`Cancel invitation for ${invitation.invitedEmail}`}
                          disabled={isSubmitting}
                          onClick={() =>
                            void cancelPendingInvitation(invitation.invitationId)
                          }
                          tone="danger"
                          type="button"
                        >
                          <X aria-hidden="true" />
                        </IconButton>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="sharing-empty">No pending invitations.</p>
              )}
            </section>

            <section aria-labelledby="task-members-heading">
              <div className="sharing-section__heading">
                <div>
                  <ShieldCheck aria-hidden="true" />
                  <h3 id="task-members-heading">People with access</h3>
                </div>
                <span>{sharing?.members.length ?? 0}</span>
              </div>

              {sharing?.members.length ? (
                <ul className="sharing-list">
                  {sharing.members.map((member) => {
                    const displayName = member.name || member.email;

                    return (
                      <li key={member.accessId}>
                        <UserIdentity
                          avatarUrl={member.avatarUrl}
                          email={member.email}
                          name={member.name}
                        />
                        <div className="sharing-list__meta">
                          <span className="access-level">
                            {member.canEdit ? "Can edit" : "View only"}
                          </span>
                          <IconButton
                            aria-label={`Remove access for ${member.email}`}
                            disabled={isSubmitting}
                            onClick={() =>
                              void confirmRevoke(member.accessId, displayName)
                            }
                            tone="danger"
                            type="button"
                          >
                            <Trash2 aria-hidden="true" />
                          </IconButton>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="sharing-empty">Only you have access to this task.</p>
              )}
            </section>
          </div>
        )}
      </div>
    </dialog>
  );
}

type UserIdentityProps = {
  avatarUrl: string | null;
  email: string;
  name: string;
};

function UserIdentity({ avatarUrl, email, name }: UserIdentityProps) {
  const displayName = name || email;

  return (
    <div className="sharing-person">
      <span className="sharing-person__avatar">
        {avatarUrl ? (
          <img alt="" src={avatarUrl} />
        ) : (
          <UserRound aria-hidden="true" />
        )}
      </span>
      <span className="sharing-person__identity">
        <strong>{displayName}</strong>
        {displayName !== email && <span>{email}</span>}
      </span>
    </div>
  );
}

function formatActivityDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

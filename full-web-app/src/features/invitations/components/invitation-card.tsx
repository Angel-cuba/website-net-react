import { useState } from "react";
import type { FormEvent } from "react";
import {
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  ShieldOff,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "../../../components/button";
import type {
  InvitationDecision,
  InvitationItem,
} from "../types/invitation";

type InvitationCardProps = {
  disabled: boolean;
  invitation: InvitationItem;
  isResponding: boolean;
  onRespond: (
    invitationId: number,
    decision: InvitationDecision,
    rejectionReason?: string,
  ) => Promise<boolean>;
};

const rejectionReasonMaxLength = 500;

export function InvitationCard({
  disabled,
  invitation,
  isResponding,
  onRespond,
}: InvitationCardProps) {
  const [isDeclining, setIsDeclining] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const isPending = invitation.status === "pending";
  const isAccessRevoked =
    invitation.status === "accepted" && !invitation.hasActiveAccess;
  const normalizedRejectionReason = rejectionReason.trim();
  const inviterName = invitation.invitedByName || invitation.invitedByEmail;
  const displayStatus = isAccessRevoked ? "revoked" : invitation.status;
  const StatusIcon = isAccessRevoked
    ? ShieldOff
    : invitation.status === "accepted"
      ? CheckCircle2
      : XCircle;

  async function handleDecline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedRejectionReason) return;

    const succeeded = await onRespond(
      invitation.id,
      "rejected",
      normalizedRejectionReason,
    );

    if (succeeded) {
      setIsDeclining(false);
      setRejectionReason("");
    }
  }

  return (
    <article className={`invitation-card invitation-card--${displayStatus}`}>
      <div className="invitation-card__icon">
        <Mail aria-hidden="true" />
      </div>

      <div className="invitation-card__content">
        <div className="invitation-card__heading">
          <div>
            <p className="invitation-card__label">Task invitation</p>
            <h3>{invitation.taskTitle}</h3>
          </div>
          {!isPending && (
            <span className={`invitation-status invitation-status--${displayStatus}`}>
              <StatusIcon aria-hidden="true" />
              {isAccessRevoked
                ? "Access revoked"
                : invitation.status === "accepted"
                  ? "Accepted"
                  : "Declined"}
            </span>
          )}
        </div>

        <div className="invitation-card__details">
          <span>
            <UserRound aria-hidden="true" />
            <span>
              From <strong>{inviterName}</strong>
              {inviterName !== invitation.invitedByEmail && (
                <> · {invitation.invitedByEmail}</>
              )}
            </span>
          </span>
          <span>
            <Clock3 aria-hidden="true" />
            Sent {formatInvitationDate(invitation.createdAt)}
          </span>
        </div>

        {!isPending && invitation.rejectionReason && (
          <div className="invitation-card__reason">
            <strong>Reason</strong>
            <p>{invitation.rejectionReason}</p>
          </div>
        )}

        {isPending && !isDeclining && (
          <div className="invitation-card__actions">
            <Button
              disabled={disabled}
              onClick={() => setIsDeclining(true)}
              type="button"
            >
              <X aria-hidden="true" />
              Decline
            </Button>
            <Button
              disabled={disabled}
              onClick={() => void onRespond(invitation.id, "accepted")}
              type="button"
              variant="primary"
            >
              {isResponding ? (
                <LoaderCircle aria-hidden="true" className="is-spinning" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {isResponding ? "Saving" : "Accept"}
            </Button>
          </div>
        )}

        {isPending && isDeclining && (
          <form className="invitation-decline" onSubmit={handleDecline}>
            <label htmlFor={`invitation-${invitation.id}-rejection-reason`}>
              <span className="field-label-row">
                <span>
                  Reason for declining <small>Required</small>
                </span>
                <span className="character-counter">
                  {rejectionReason.length} / {rejectionReasonMaxLength}
                </span>
              </span>
              <textarea
                autoFocus
                disabled={disabled}
                id={`invitation-${invitation.id}-rejection-reason`}
                maxLength={rejectionReasonMaxLength}
                onChange={(event) => setRejectionReason(event.target.value)}
                placeholder="Add a short note for the task owner"
                required
                rows={3}
                value={rejectionReason}
              />
            </label>
            <div className="invitation-decline__actions">
              <Button
                disabled={disabled}
                onClick={() => {
                  setIsDeclining(false);
                  setRejectionReason("");
                }}
                type="button"
              >
                Cancel
              </Button>
              <Button
                disabled={disabled || !normalizedRejectionReason}
                type="submit"
                variant="danger"
              >
                {isResponding ? (
                  <LoaderCircle aria-hidden="true" className="is-spinning" />
                ) : (
                  <X aria-hidden="true" />
                )}
                {isResponding ? "Declining" : "Confirm decline"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

function formatInvitationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "on an unknown date";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

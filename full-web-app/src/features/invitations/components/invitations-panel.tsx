import { Inbox, RefreshCw } from "lucide-react";
import { Button } from "../../../components/button";
import { EmptyState } from "../../../components/empty-state";
import { useInvitations } from "../hooks/use-invitations";
import { InvitationCard } from "./invitation-card";

export function InvitationsPanel() {
  const {
    invitations,
    isLoading,
    respondingInvitationId,
    message,
    error,
    refreshInvitations,
    respond,
  } = useInvitations();
  const pendingInvitations = invitations.filter(
    (invitation) => invitation.status === "pending",
  );
  const invitationHistory = invitations.filter(
    (invitation) => invitation.status !== "pending",
  );

  return (
    <section aria-labelledby="invitations-heading" className="feature-view invitations-panel">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 id="invitations-heading">Invitations</h1>
        </div>
        <Button
          disabled={isLoading || respondingInvitationId !== null}
          onClick={() => void refreshInvitations()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isLoading ? "is-spinning" : ""} />
          Refresh
        </Button>
      </div>

      <div aria-atomic="true" aria-live="polite" className="invitations-feedback">
        {message && <p className="notice is-success">{message}</p>}
        {error && <p className="notice is-error" role="alert">{error}</p>}
      </div>

      {isLoading && invitations.length === 0 ? (
        <div aria-label="Loading invitations" className="invitation-list" role="status">
          {[0, 1].map((item) => <div className="invitation-skeleton" key={item} />)}
        </div>
      ) : invitations.length === 0 ? (
        <EmptyState
          description="New task invitations will appear here."
          icon={<Inbox aria-hidden="true" />}
          title="No invitations yet"
        />
      ) : (
        <div className="invitation-sections">
          <section aria-labelledby="pending-heading">
            <div className="subsection-heading invitation-section-heading">
              <div>
                <h2 id="pending-heading">Pending</h2>
                <span>Invitations waiting for your response</span>
              </div>
              <span className="task-count">{pendingInvitations.length}</span>
            </div>

            {pendingInvitations.length ? (
              <div className="invitation-list">
                {pendingInvitations.map((invitation) => (
                  <InvitationCard
                    disabled={isLoading || respondingInvitationId !== null}
                    invitation={invitation}
                    isResponding={respondingInvitationId === invitation.id}
                    key={invitation.id}
                    onRespond={respond}
                  />
                ))}
              </div>
            ) : (
              <p className="invitation-section-empty">Nothing needs your attention.</p>
            )}
          </section>

          {invitationHistory.length > 0 && (
            <section aria-labelledby="history-heading">
              <div className="subsection-heading invitation-section-heading">
                <div>
                  <h2 id="history-heading">History</h2>
                  <span>Previously answered invitations</span>
                </div>
                <span className="task-count">{invitationHistory.length}</span>
              </div>

              <div className="invitation-list">
                {invitationHistory.map((invitation) => (
                  <InvitationCard
                    disabled
                    invitation={invitation}
                    isResponding={false}
                    key={invitation.id}
                    onRespond={respond}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </section>
  );
}

import { Mail } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";

export function InvitationsPanel() {
  return (
    <section aria-labelledby="invitations-heading" className="feature-view">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 id="invitations-heading">Invitations</h1>
        </div>
      </div>
      <EmptyState
        description="New task invitations will appear here."
        icon={<Mail aria-hidden="true" />}
        title="No invitations yet"
      />
    </section>
  );
}

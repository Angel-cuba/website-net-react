import { UsersRound } from "lucide-react";
import { EmptyState } from "../../../components/empty-state";

export function SharedTasksPanel() {
  return (
    <section aria-labelledby="shared-heading" className="feature-view">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 id="shared-heading">Shared tasks</h1>
        </div>
      </div>
      <EmptyState
        description="Tasks shared with you will appear here."
        icon={<UsersRound aria-hidden="true" />}
        title="Nothing shared yet"
      />
    </section>
  );
}

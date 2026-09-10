import { RefreshCw, UsersRound } from "lucide-react";
import { Button } from "../../../components/button";
import { EmptyState } from "../../../components/empty-state";
import { useSharedTasks } from "../hooks/use-shared-tasks";
import { SharedTaskCard } from "./shared-task-card";

export function SharedTasksPanel() {
  const { sharedTasks, isLoading, error, refreshSharedTasks } = useSharedTasks();

  return (
    <section aria-labelledby="shared-heading" className="feature-view shared-panel">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 id="shared-heading">Shared tasks</h1>
        </div>
        <Button
          disabled={isLoading}
          onClick={() => void refreshSharedTasks()}
          type="button"
        >
          <RefreshCw aria-hidden="true" className={isLoading ? "is-spinning" : ""} />
          Refresh
        </Button>
      </div>

      <div aria-atomic="true" aria-live="polite" className="shared-feedback">
        {error && <p className="notice is-error" role="alert">{error}</p>}
      </div>

      {isLoading && sharedTasks.length === 0 ? (
        <div aria-label="Loading shared tasks" className="shared-task-list" role="status">
          {[0, 1].map((item) => <div className="shared-task-skeleton" key={item} />)}
        </div>
      ) : sharedTasks.length === 0 ? (
        <EmptyState
          description="Tasks shared with you will appear here."
          icon={<UsersRound aria-hidden="true" />}
          title="Nothing shared yet"
        />
      ) : (
        <>
          <div className="subsection-heading shared-list-heading">
            <div>
              <h2>Available to you</h2>
              <span>Tasks shared by other workspace members</span>
            </div>
            <span className="task-count">{sharedTasks.length}</span>
          </div>

          <div aria-busy={isLoading} className="shared-task-list">
            {sharedTasks.map((task) => <SharedTaskCard key={task.id} task={task} />)}
          </div>
        </>
      )}
    </section>
  );
}

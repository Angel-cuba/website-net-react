import { useState } from "react";
import { RefreshCw, Share2, UsersRound } from "lucide-react";
import { Button } from "../../../components/button";
import { EmptyState } from "../../../components/empty-state";
import { TaskForm } from "../../tasks/components/task-form";
import { TaskSharingDialog } from "../../tasks/components/task-sharing-dialog";
import type { TaskPayload } from "../../tasks/types/task";
import { useSharedTasks } from "../hooks/use-shared-tasks";
import type { OwnedSharedTaskItem } from "../types/shared-task";
import { OwnedSharedTaskCard } from "./owned-shared-task-card";
import { SharedTaskCard } from "./shared-task-card";

export function SharedTasksPanel() {
  const [managedTask, setManagedTask] = useState<OwnedSharedTaskItem | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const {
    sharedWithYou,
    sharedByYou,
    isLoading,
    message,
    error,
    refreshSharedTasks,
    saveSharedTask,
    toggleSharedTask,
  } = useSharedTasks();
  const selectedEditingTask = sharedWithYou.find(
    (task) => task.id === editingTaskId,
  );
  const editingTask = selectedEditingTask?.canEdit ? selectedEditingTask : null;
  const hasSharedTasks = sharedWithYou.length > 0 || sharedByYou.length > 0;

  async function updateEditingTask(payload: TaskPayload) {
    if (!editingTask) return false;

    const succeeded = await saveSharedTask(editingTask.id, payload);
    if (succeeded) setEditingTaskId(null);
    return succeeded;
  }

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

      {editingTask && (
        <TaskForm
          disabled={isLoading}
          editingTask={editingTask}
          isEditingSharedTask
          key={`${editingTask.id}:${editingTask.updatedAt}:${editingTask.isCompleted}`}
          onCancelEdit={() => setEditingTaskId(null)}
          onUpdate={updateEditingTask}
        />
      )}

      <div aria-atomic="true" aria-live="polite" className="shared-feedback">
        {message && <p className="notice is-success">{message}</p>}
        {error && <p className="notice is-error" role="alert">{error}</p>}
      </div>

      {isLoading && !hasSharedTasks ? (
        <div aria-label="Loading shared tasks" className="shared-task-list" role="status">
          {[0, 1].map((item) => <div className="shared-task-skeleton" key={item} />)}
        </div>
      ) : !hasSharedTasks ? (
        <EmptyState
          description="Tasks shared with you or by you will appear here."
          icon={<UsersRound aria-hidden="true" />}
          title="Nothing shared yet"
        />
      ) : (
        <div className="shared-overview-sections">
          <section aria-labelledby="shared-with-you-heading">
            <div className="subsection-heading shared-list-heading">
              <div>
                <h2 id="shared-with-you-heading">Shared with you</h2>
                <span>Tasks owned by other workspace members</span>
              </div>
              <span className="task-count">{sharedWithYou.length}</span>
            </div>

            {sharedWithYou.length > 0 ? (
              <div aria-busy={isLoading} className="shared-task-list">
                {sharedWithYou.map((task) => (
                  <SharedTaskCard
                    disabled={isLoading}
                    key={task.id}
                    onEdit={setEditingTaskId}
                    onToggle={toggleSharedTask}
                    task={task}
                  />
                ))}
              </div>
            ) : (
              <p className="shared-section-empty">No one has shared a task with you.</p>
            )}
          </section>

          <section aria-labelledby="shared-by-you-heading">
            <div className="subsection-heading shared-list-heading">
              <div>
                <h2 id="shared-by-you-heading">Shared by you</h2>
                <span>Tasks where you manage access</span>
              </div>
              <span className="task-count">{sharedByYou.length}</span>
            </div>

            {sharedByYou.length > 0 ? (
              <div aria-busy={isLoading} className="shared-task-list">
                {sharedByYou.map((task) => (
                  <OwnedSharedTaskCard
                    key={task.id}
                    onManageAccess={setManagedTask}
                    task={task}
                  />
                ))}
              </div>
            ) : (
              <p className="shared-section-empty">
                <Share2 aria-hidden="true" />
                You are not sharing any tasks.
              </p>
            )}
          </section>
        </div>
      )}

      {managedTask && (
        <TaskSharingDialog onClose={() => setManagedTask(null)} task={managedTask} />
      )}
    </section>
  );
}

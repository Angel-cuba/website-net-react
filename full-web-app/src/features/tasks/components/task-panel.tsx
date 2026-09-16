import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "../../../components/button";
import { useSharedTasks } from "../../shared/hooks/use-shared-tasks";
import { useTasks } from "../hooks/use-tasks";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";
import { TaskSharingDialog } from "./task-sharing-dialog";

type EditingTaskTarget = {
  id: number;
  source: "owned" | "shared";
};

export function TaskPanel() {
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingTaskTarget, setEditingTaskTarget] =
    useState<EditingTaskTarget | null>(null);
  const [sharingTaskId, setSharingTaskId] = useState<number | null>(null);
  const {
    tasks,
    message,
    error,
    isLoading,
    createTask,
    saveTask,
    toggleTask,
    removeTask,
  } = useTasks();
  const {
    sharedWithYou,
    isLoading: isLoadingSharedTasks,
    message: sharedTasksMessage,
    error: sharedTasksError,
    saveSharedTask,
    toggleSharedTask,
  } = useSharedTasks();
  const editingOwnedTask = editingTaskTarget?.source === "owned"
    ? tasks.find((task) => task.id === editingTaskTarget.id) ?? null
    : null;
  const editingSharedTask = editingTaskTarget?.source === "shared"
    ? sharedWithYou.find((task) => task.id === editingTaskTarget.id) ?? null
    : null;
  const editingTask = editingTaskTarget?.source === "shared"
    ? editingSharedTask?.canEdit
      ? editingSharedTask
      : null
    : editingOwnedTask;
  const sharingTask = tasks.find((task) => task.id === sharingTaskId) ?? null;
  const isWorkspaceLoading = isLoading || isLoadingSharedTasks;
  const workspaceTaskCount = tasks.length + sharedWithYou.length;

  async function updateEditingTask(payload: Parameters<typeof saveTask>[1]) {
    if (!editingTaskTarget) return false;

    const succeeded = editingTaskTarget.source === "shared"
      ? await saveSharedTask(editingTaskTarget.id, payload)
      : await saveTask(editingTaskTarget.id, payload);
    if (succeeded) setEditingTaskTarget(null);
    return succeeded;
  }

  async function createWorkspaceTask(payload: Parameters<typeof createTask>[0]) {
    const succeeded = await createTask(payload);
    if (succeeded) setIsComposerOpen(false);
    return succeeded;
  }

  function toggleComposer() {
    if (editingTaskTarget) {
      setEditingTaskTarget(null);
      setIsComposerOpen(true);
      return;
    }

    setIsComposerOpen((isOpen) => !isOpen);
  }

  async function deleteTask(taskId: number) {
    const succeeded = await removeTask(taskId);
    if (
      succeeded &&
      editingTaskTarget?.source === "owned" &&
      editingTaskTarget.id === taskId
    ) {
      setEditingTaskTarget(null);
    }
    if (succeeded && sharingTaskId === taskId) setSharingTaskId(null);
    return succeeded;
  }

  return (
    <section aria-labelledby="tasks-heading" className="feature-view task-panel">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 id="tasks-heading">Tasks</h1>
        </div>
        <div className="task-toolbar">
          <Button
            onClick={toggleComposer}
            type="button"
            variant="primary"
          >
            {isComposerOpen && !editingTask ? (
              <X aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {isComposerOpen && !editingTask ? "Close" : "New task"}
          </Button>
        </div>
      </div>

      {(isComposerOpen || editingTask) && (
        <TaskForm
          disabled={isWorkspaceLoading}
          editingTask={editingTask}
          isEditingSharedTask={editingTaskTarget?.source === "shared"}
          key={editingTask
            ? `${editingTaskTarget?.source}:${editingTask.id}:${editingTask.updatedAt}:${editingTask.isCompleted}`
            : "new"}
          onCancelEdit={() => setEditingTaskTarget(null)}
          onCreate={createWorkspaceTask}
          onUpdate={updateEditingTask}
        />
      )}

      <div aria-atomic="true" aria-live="polite" className="task-feedback">
        {message && <p className="notice is-success">{message}</p>}
        {sharedTasksMessage && (
          <p className="notice is-success">{sharedTasksMessage}</p>
        )}
        {error && <p className="notice is-error" role="alert">{error}</p>}
        {sharedTasksError && (
          <p className="notice is-error" role="alert">{sharedTasksError}</p>
        )}
      </div>

      <div className="subsection-heading task-list-heading">
        <h2>Workspace tasks</h2>
        <span className="task-count">{workspaceTaskCount}</span>
      </div>

      <TaskList
        isLoading={isWorkspaceLoading}
        onDelete={deleteTask}
        onEdit={(id) => setEditingTaskTarget({ id, source: "owned" })}
        onEditShared={(id) => setEditingTaskTarget({ id, source: "shared" })}
        onShare={setSharingTaskId}
        onToggle={toggleTask}
        onToggleShared={toggleSharedTask}
        sharedTasks={sharedWithYou}
        tasks={tasks}
      />

      {sharingTask && (
        <TaskSharingDialog
          onClose={() => setSharingTaskId(null)}
          task={sharingTask}
        />
      )}
    </section>
  );
}

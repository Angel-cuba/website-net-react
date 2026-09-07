import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "../../../components/button";
import { useTasks } from "../hooks/use-tasks";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";

export function TaskPanel() {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const {
    tasks,
    message,
    error,
    isLoading,
    refreshTasks,
    createTask,
    saveTask,
    toggleTask,
    removeTask,
  } = useTasks();
  const editingTask = tasks.find((task) => task.id === editingTaskId) ?? null;

  async function updateEditingTask(payload: Parameters<typeof saveTask>[1]) {
    if (!editingTaskId) return false;

    const succeeded = await saveTask(editingTaskId, payload);
    if (succeeded) setEditingTaskId(null);
    return succeeded;
  }

  async function deleteTask(taskId: number) {
    const succeeded = await removeTask(taskId);
    if (succeeded && editingTaskId === taskId) setEditingTaskId(null);
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
            disabled={isLoading}
            onClick={() => void refreshTasks()}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={isLoading ? "is-spinning" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      <TaskForm
        disabled={isLoading}
        editingTask={editingTask}
        key={editingTask ? `${editingTask.id}:${editingTask.updatedAt}:${editingTask.isCompleted}` : "new"}
        onCancelEdit={() => setEditingTaskId(null)}
        onCreate={createTask}
        onUpdate={updateEditingTask}
      />

      <div aria-atomic="true" aria-live="polite" className="task-feedback">
        {message && <p className="notice is-success">{message}</p>}
        {error && <p className="notice is-error" role="alert">{error}</p>}
      </div>

      <div className="subsection-heading task-list-heading">
        <h2>Your tasks</h2>
        <span className="task-count">{tasks.length}</span>
      </div>

      <TaskList
        isLoading={isLoading}
        onDelete={deleteTask}
        onEdit={setEditingTaskId}
        onToggle={toggleTask}
        tasks={tasks}
      />
    </section>
  );
}

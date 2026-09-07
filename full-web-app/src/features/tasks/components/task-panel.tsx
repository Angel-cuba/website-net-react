import { Button } from "../../../components/button";
import { useAuth } from "../../auth";
import { useTasks } from "../hooks/use-tasks";
import { TaskForm } from "./task-form";
import { TaskList } from "./task-list";

export function TaskPanel() {
  const { isAuthenticated } = useAuth();
  const {
    tasks,
    message,
    error,
    isLoading,
    refreshTasks,
    createTask,
    toggleTask,
    removeTask,
  } = useTasks();

  return (
    <section className="task-panel">
      <div className="section-header">
        <div>
          <h2>Tasks</h2>
          <p>POST /api/tasks/create</p>
        </div>
        <div className="task-toolbar">
          <Button
            disabled={!isAuthenticated || isLoading}
            onClick={() => void refreshTasks()}
            type="button"
          >
            Refresh
          </Button>
          <span className="task-count">{tasks.length}</span>
        </div>
      </div>

      <TaskForm disabled={!isAuthenticated || isLoading} onCreate={createTask} />

      {message && (
        <p aria-live="polite" className="notice is-success">
          {message}
        </p>
      )}
      {error && (
        <p aria-live="assertive" className="notice is-error" role="alert">
          {error}
        </p>
      )}

      <TaskList
        isAuthenticated={isAuthenticated}
        isLoading={isLoading}
        onDelete={removeTask}
        onToggle={toggleTask}
        tasks={tasks}
      />
    </section>
  );
}

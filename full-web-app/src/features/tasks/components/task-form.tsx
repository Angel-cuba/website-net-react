import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "../../../components/button";
import { getMinimumDueDateInputValue, toDateTimeInputValue } from "../../../utils/date";
import type { TaskItem, TaskPayload } from "../types/task";

const createEmptyTaskForm = (): TaskPayload => ({
  title: "",
  category: "Backend",
  description: "",
  dueDate: "",
  isCompleted: false,
  priority: "Medium",
  status: "pending",
});

type TaskFormProps = {
  disabled: boolean;
  editingTask: TaskItem | null;
  onCancelEdit: () => void;
  onCreate: (payload: TaskPayload) => Promise<boolean>;
  onUpdate: (payload: TaskPayload) => Promise<boolean>;
};

export function TaskForm({
  disabled,
  editingTask,
  onCancelEdit,
  onCreate,
  onUpdate,
}: TaskFormProps) {
  const [form, setForm] = useState<TaskPayload>(() =>
    editingTask
      ? {
          title: editingTask.title,
          category: editingTask.category ?? "",
          description: editingTask.description ?? "",
          dueDate: toDateTimeInputValue(editingTask.dueDate),
          isCompleted: editingTask.isCompleted,
          priority: editingTask.priority ?? "Medium",
          status: editingTask.status,
        }
      : createEmptyTaskForm(),
  );
  const [minimumDueDate, setMinimumDueDate] = useState(getMinimumDueDateInputValue);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinimumDueDate(getMinimumDueDateInputValue());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const succeeded = editingTask ? await onUpdate(form) : await onCreate(form);

    if (succeeded) {
      setForm(createEmptyTaskForm());
    }
  }

  function updateStatus(status: string) {
    setForm({ ...form, status, isCompleted: status === "completed" });
  }

  return (
    <section aria-labelledby="task-form-heading" className="task-composer">
      <div className="subsection-heading">
        <div>
          <h2 id="task-form-heading">{editingTask ? "Edit task" : "Create task"}</h2>
          {editingTask && <span>Task #{editingTask.id}</span>}
        </div>
        {editingTask && (
          <Button onClick={onCancelEdit} type="button" variant="ghost">
            <X aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>

      <form aria-busy={disabled} className="task-form" onSubmit={handleSubmit}>
        <label className="primary-field" htmlFor="task-title">
          Title
          <input
            id="task-title"
            maxLength={150}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="Add a clear task title"
            required
            value={form.title}
          />
        </label>

        <label className="primary-field" htmlFor="task-description">
          Description
          <textarea
            id="task-description"
            maxLength={1000}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Add the details needed to complete it"
            rows={3}
            value={form.description}
          />
        </label>

        <label htmlFor="task-category">
          Category
          <select
            id="task-category"
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            value={form.category}
          >
            <option>Backend</option>
            <option>Frontend</option>
            <option>Database</option>
            <option>Testing</option>
          </select>
        </label>

        <label htmlFor="task-priority">
          Priority
          <select
            id="task-priority"
            onChange={(event) => setForm({ ...form, priority: event.target.value })}
            value={form.priority}
          >
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
          </select>
        </label>

        <label htmlFor="task-status">
          Status
          <select
            id="task-status"
            onChange={(event) => updateStatus(event.target.value)}
            value={form.status}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In progress</option>
            <option value="completed">Completed</option>
          </select>
        </label>

        <label htmlFor="task-due-date">
          Due date
          <input
            aria-describedby="task-due-date-hint"
            id="task-due-date"
            min={minimumDueDate}
            onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            onFocus={() => setMinimumDueDate(getMinimumDueDateInputValue())}
            type="datetime-local"
            value={form.dueDate ?? ""}
          />
          <span className="field-hint" id="task-due-date-hint">
            At least 5 hours from now.
          </span>
        </label>

        <label className="checkbox-field">
          <input
            checked={form.isCompleted}
            onChange={(event) =>
              setForm({
                ...form,
                isCompleted: event.target.checked,
                status: event.target.checked ? "completed" : "pending",
              })
            }
            type="checkbox"
          />
          Completed
        </label>

        <div className="form-actions">
          <Button disabled={disabled} type="submit" variant="primary">
            {editingTask ? <Save aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {disabled ? "Saving" : editingTask ? "Save changes" : "Create task"}
          </Button>
        </div>
      </form>
    </section>
  );
}

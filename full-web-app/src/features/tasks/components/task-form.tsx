import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/button";
import type { TaskPayload } from "../types/task";

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
  onCreate: (payload: TaskPayload) => Promise<boolean>;
};

export function TaskForm({ disabled, onCreate }: TaskFormProps) {
  const [form, setForm] = useState<TaskPayload>(createEmptyTaskForm);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (await onCreate(form)) {
      setForm(createEmptyTaskForm());
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <label className="wide-field">
        Title
        <input
          maxLength={150}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          placeholder="Build task ownership UI"
          required
          value={form.title}
        />
      </label>

      <label>
        Category
        <select
          onChange={(event) => setForm({ ...form, category: event.target.value })}
          value={form.category}
        >
          <option>Backend</option>
          <option>Frontend</option>
          <option>Database</option>
          <option>Testing</option>
        </select>
      </label>

      <label>
        Priority
        <select
          onChange={(event) => setForm({ ...form, priority: event.target.value })}
          value={form.priority}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </label>

      <label>
        Due date
        <input
          onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
          type="datetime-local"
          value={form.dueDate ?? ""}
        />
      </label>

      <label>
        Status
        <select
          onChange={(event) => setForm({ ...form, status: event.target.value })}
          value={form.status}
        >
          <option value="pending">pending</option>
          <option value="in-progress">in-progress</option>
          <option value="completed">completed</option>
        </select>
      </label>

      <label className="wide-field">
        Description
        <textarea
          maxLength={1000}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Describe the work you want to verify."
          rows={4}
          value={form.description}
        />
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

      <Button disabled={disabled} type="submit" variant="primary">
        Create task
      </Button>
    </form>
  );
}

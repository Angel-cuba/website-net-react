import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, X } from "lucide-react";
import { Button } from "../../../components/button";
import { LoadingButtonContent } from "../../../components/loading-button-content";
import { SelectField } from "../../../components/select-field";
import {
  getMinimumDueDateInputValue,
  toDateTimeInputValue,
} from "../../../utils/date";
import type { TaskItem, TaskPayload } from "../types/task";

const taskTitleMaxLength = 150;
const taskDescriptionMaxLength = 1000;

type CharacterLimitState = "calm" | "attention" | "warning" | "limit";

function getCharacterLimitState(
  currentLength: number,
  maxLength: number,
): CharacterLimitState {
  const usage = currentLength / maxLength;

  if (currentLength >= maxLength) {
    return "limit";
  }
  if (usage >= 0.8) {
    return "warning";
  }
  if (usage >= 0.6) {
    return "attention";
  }
  return "calm";
}

type CharacterCounterProps = {
  currentLength: number;
  id: string;
  maxLength: number;
  state: CharacterLimitState;
};

function CharacterCounter({
  currentLength,
  id,
  maxLength,
  state,
}: CharacterCounterProps) {
  return (
    <span className="character-counter" id={id}>
      {state === "limit" && <strong role="status">Limit reached</strong>}
      <span>
        {currentLength} / {maxLength}
      </span>
    </span>
  );
}

type TaskFormItem = Pick<
  TaskItem,
  | "id"
  | "title"
  | "category"
  | "description"
  | "dueDate"
  | "isCompleted"
  | "priority"
  | "status"
>;

const createEmptyTaskForm = (): TaskPayload => ({
  title: "",
  category: "Backend",
  description: "",
  dueDate: "",
  isCompleted: false,
  priority: "Medium",
  status: "pending",
});

const categoryOptions = ["Backend", "Frontend", "Database", "Testing"].map(
  (value) => ({ label: value, value }),
);

const priorityOptions = ["Low", "Medium", "High"].map((value) => ({
  label: value,
  value,
}));

const statusOptions = [
  { label: "Pending", value: "pending" },
  { label: "In progress", value: "in-progress" },
  { label: "Completed", value: "completed" },
];

type TaskFormProps = {
  disabled: boolean;
  editingTask: TaskFormItem | null;
  isEditingSharedTask: boolean;
  onCancelEdit: () => void;
  onCreate?: (payload: TaskPayload) => Promise<boolean>;
  onUpdate: (payload: TaskPayload) => Promise<boolean>;
};

export function TaskForm({
  disabled,
  editingTask,
  isEditingSharedTask,
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
  const [minimumDueDate, setMinimumDueDate] = useState(
    getMinimumDueDateInputValue,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleLimitState = getCharacterLimitState(
    form.title.length,
    taskTitleMaxLength,
  );
  const descriptionLimitState = getCharacterLimitState(
    form.description.length,
    taskDescriptionMaxLength,
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMinimumDueDate(getMinimumDueDateInputValue());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const succeeded = editingTask
        ? await onUpdate(form)
        : onCreate
          ? await onCreate(form)
          : false;

      if (succeeded) {
        setForm(createEmptyTaskForm());
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateStatus(status: string) {
    setForm({ ...form, status, isCompleted: status === "completed" });
  }

  function updateLimitedText(
    field: "title" | "description",
    value: string,
    maxLength: number,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value.slice(0, maxLength),
    }));
  }

  return (
    <section aria-labelledby="task-form-heading" className="task-composer">
      <div className="subsection-heading">
        <div>
          <h2 id="task-form-heading">
            {editingTask
              ? isEditingSharedTask
                ? "Edit shared task"
                : "Edit task"
              : "Create task"}
          </h2>
          {editingTask && <span>Task #{editingTask.id}</span>}
        </div>
        {editingTask && (
          <Button onClick={onCancelEdit} type="button" variant="ghost">
            <X aria-hidden="true" />
            Cancel
          </Button>
        )}
      </div>

      <form
        aria-busy={isSubmitting}
        className="task-form"
        onSubmit={handleSubmit}
      >
        <label
          className="character-field primary-field"
          data-limit-state={titleLimitState}
          htmlFor="task-title"
        >
          <span className="field-label-row">
            <span>Title</span>
            <CharacterCounter
              currentLength={form.title.length}
              id="task-title-character-count"
              maxLength={taskTitleMaxLength}
              state={titleLimitState}
            />
          </span>
          <input
            aria-describedby="task-title-character-count"
            aria-label="Title"
            disabled={disabled}
            id="task-title"
            maxLength={taskTitleMaxLength}
            onChange={(event) =>
              updateLimitedText("title", event.target.value, taskTitleMaxLength)
            }
            placeholder="Add a clear task title"
            required
            value={form.title}
          />
        </label>

        <label
          className="character-field primary-field"
          data-limit-state={descriptionLimitState}
          htmlFor="task-description"
        >
          <span className="field-label-row">
            <span>Description</span>
            <CharacterCounter
              currentLength={form.description.length}
              id="task-description-character-count"
              maxLength={taskDescriptionMaxLength}
              state={descriptionLimitState}
            />
          </span>
          <textarea
            aria-describedby="task-description-character-count"
            aria-label="Description"
            disabled={disabled}
            id="task-description"
            maxLength={taskDescriptionMaxLength}
            onChange={(event) =>
              updateLimitedText(
                "description",
                event.target.value,
                taskDescriptionMaxLength,
              )
            }
            placeholder="Add the details needed to complete it"
            rows={3}
            value={form.description}
          />
        </label>

        <label htmlFor="task-category">
          Category
          <SelectField
            disabled={disabled}
            id="task-category"
            onValueChange={(category) => setForm({ ...form, category })}
            options={categoryOptions}
            value={form.category}
          />
        </label>

        <label htmlFor="task-priority">
          Priority
          <SelectField
            disabled={disabled}
            id="task-priority"
            onValueChange={(priority) => setForm({ ...form, priority })}
            options={priorityOptions}
            value={form.priority ?? "Medium"}
          />
        </label>

        <label htmlFor="task-status">
          Status
          <SelectField
            disabled={disabled}
            id="task-status"
            onValueChange={updateStatus}
            options={statusOptions}
            value={form.status}
          />
        </label>

        <label htmlFor="task-due-date">
          Due date
          <input
            aria-describedby="task-due-date-hint"
            disabled={disabled}
            id="task-due-date"
            min={minimumDueDate}
            onChange={(event) =>
              setForm({ ...form, dueDate: event.target.value })
            }
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
            disabled={disabled}
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
          <Button
            disabled={disabled || isSubmitting}
            type="submit"
            variant="primary"
          >
            <LoadingButtonContent
              icon={
                editingTask ? (
                  <Save aria-hidden="true" />
                ) : (
                  <Plus aria-hidden="true" />
                )
              }
              isLoading={isSubmitting}
              loadingLabel={editingTask ? "Saving..." : "Creating..."}
            >
              {editingTask ? "Save changes" : "Create task"}
            </LoadingButtonContent>
          </Button>
        </div>
      </form>
    </section>
  );
}

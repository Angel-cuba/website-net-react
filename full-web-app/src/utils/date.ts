export function formatDate(value: string | null): string {
  if (!value) {
    return "No due date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function toDateTimeInputValue(value: string | null): string {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

const minimumDueDateOffsetMs = 5 * 60 * 60 * 1000;

export function getMinimumDueDateInputValue(referenceDate = new Date()): string {
  const minimumDueDate = new Date(referenceDate.getTime() + minimumDueDateOffsetMs);
  minimumDueDate.setSeconds(0, 0);
  minimumDueDate.setMinutes(minimumDueDate.getMinutes() + 1);
  return toDateTimeInputValue(minimumDueDate.toISOString());
}

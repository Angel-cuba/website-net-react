import { CircleAlert, Info, LoaderCircle } from "lucide-react";
import { Button } from "../button";

type RequestStatusNoticeProps = {
  actionLabel?: string;
  description: string;
  id?: string;
  isBusy?: boolean;
  onAction?: () => void;
  title: string;
  tone?: "info" | "warning" | "error";
};

export function RequestStatusNotice({
  actionLabel,
  description,
  id,
  isBusy = false,
  onAction,
  title,
  tone = "info",
}: RequestStatusNoticeProps) {
  const StatusIcon = isBusy ? LoaderCircle : tone === "error" ? CircleAlert : Info;

  return (
    <div
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`request-status request-status--${tone}`}
      id={id}
      role={tone === "error" ? "alert" : "status"}
    >
      <StatusIcon
        aria-hidden="true"
        className={isBusy ? "is-spinning" : undefined}
      />
      <div className="request-status__copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} type="button" variant="ghost">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

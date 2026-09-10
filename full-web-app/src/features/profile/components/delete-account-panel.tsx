import { useState } from "react";
import type { FormEvent } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { Button } from "../../../components/button";

type DeleteAccountPanelProps = {
  disabled: boolean;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: (password: string) => Promise<boolean>;
};

export function DeleteAccountPanel({
  disabled,
  isDeleting,
  onCancel,
  onDelete,
}: DeleteAccountPanelProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [password, setPassword] = useState("");

  function cancelDelete() {
    setIsConfirming(false);
    setPassword("");
    onCancel();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const deleted = await onDelete(password);
    if (deleted) setPassword("");
  }

  return (
    <section aria-labelledby="delete-account-heading" className="account-danger-zone">
      <div className="account-danger-zone__heading">
        <div>
          <h2 id="delete-account-heading">Delete account</h2>
          <p id="delete-account-warning">
            Permanently removes your profile, tasks, shared access, invitations, and
            notifications.
          </p>
        </div>

        {!isConfirming && (
          <Button
            disabled={disabled}
            onClick={() => setIsConfirming(true)}
            type="button"
            variant="danger"
          >
            <Trash2 aria-hidden="true" />
            Delete account
          </Button>
        )}
      </div>

      {isConfirming && (
        <form
          aria-busy={isDeleting}
          aria-describedby="delete-account-warning"
          className="delete-account-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="delete-account-password">
            Current password
            <input
              autoComplete="current-password"
              disabled={disabled}
              id="delete-account-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>

          <div className="delete-account-form__actions">
            <Button disabled={disabled} onClick={cancelDelete} type="button">
              <X aria-hidden="true" />
              Cancel
            </Button>
            <Button disabled={disabled} type="submit" variant="danger">
              {isDeleting ? (
                <LoaderCircle aria-hidden="true" className="is-spinning" />
              ) : (
                <Trash2 aria-hidden="true" />
              )}
              {isDeleting ? "Deleting" : "Delete permanently"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

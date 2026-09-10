import type { FormEvent } from "react";
import { LoaderCircle, Save, X } from "lucide-react";
import { Button } from "../../../components/button";
import type { IUserProfile } from "../types/IUserProfile";

type ProfileFormProps = {
  disabled: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onChange: (field: keyof IUserProfile, value: string) => void;
  onSubmit: () => Promise<void>;
  profile: IUserProfile;
};

export function ProfileForm({
  disabled,
  isSaving,
  onCancel,
  onChange,
  onSubmit,
  profile,
}: ProfileFormProps) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit();
  }

  return (
    <section aria-labelledby="profile-form-heading" className="profile-editor">
      <div className="profile-editor__heading">
        <h2 id="profile-form-heading">Edit profile</h2>
      </div>

      <form aria-busy={isSaving} className="profile-form" onSubmit={handleSubmit}>
        <label htmlFor="profile-first-name">
          First name
          <input
            autoComplete="given-name"
            disabled={disabled}
            id="profile-first-name"
            name="firstName"
            onChange={(event) => onChange("firstName", event.target.value)}
            placeholder="First name"
            type="text"
            value={profile.firstName}
          />
        </label>

        <label htmlFor="profile-last-name">
          Last name
          <input
            autoComplete="family-name"
            disabled={disabled}
            id="profile-last-name"
            name="lastName"
            onChange={(event) => onChange("lastName", event.target.value)}
            placeholder="Last name"
            type="text"
            value={profile.lastName}
          />
        </label>

        <label className="profile-form__wide" htmlFor="profile-bio">
          Biography
          <textarea
            autoComplete="off"
            disabled={disabled}
            id="profile-bio"
            name="bio"
            onChange={(event) => onChange("bio", event.target.value)}
            placeholder="Biography"
            rows={4}
            value={profile.bio}
          />
        </label>

        <label className="profile-form__wide" htmlFor="profile-avatar-url">
          Avatar URL
          <input
            autoComplete="photo"
            disabled={disabled}
            id="profile-avatar-url"
            name="avatarUrl"
            onChange={(event) => onChange("avatarUrl", event.target.value)}
            placeholder="https://example.com/avatar.jpg"
            type="url"
            value={profile.avatarUrl}
          />
        </label>

        <div className="profile-form__actions">
          <Button disabled={disabled} onClick={onCancel} type="button">
            <X aria-hidden="true" />
            Cancel
          </Button>
          <Button disabled={disabled} type="submit" variant="primary">
            {isSaving ? (
              <LoaderCircle aria-hidden="true" className="is-spinning" />
            ) : (
              <Save aria-hidden="true" />
            )}
            {isSaving ? "Saving" : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}

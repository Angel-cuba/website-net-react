import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { deleteUserAccount, updateUserProfile, useProfile } from "../index";
import type { IUserProfile } from "../index";
import { DeleteAccountPanel } from "./delete-account-panel";
import { UserCard } from "./user-card";
import { ProfileForm } from "./profile-form";

const emptyProfile: IUserProfile = {
  firstName: "",
  lastName: "",
  avatarUrl: "",
  bio: "",
};

export function ProfilePanel() {
  const { expireSession, logout, user } = useAuth();
  const {
    isProfileLoading,
    profile,
    profileError,
    replaceProfile,
  } = useProfile();
  const [draftProfile, setDraftProfile] = useState<IUserProfile>(emptyProfile);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleRequestError = useCallback(
    (caughtError: unknown) => {
      if (caughtError instanceof ApiError && caughtError.status === 401) {
        expireSession();
        return;
      }

      setError(getErrorMessage(caughtError));
    },
    [expireSession],
  );

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleSubmit() {
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      const response = await updateUserProfile(draftProfile);

      if (!response.data) {
        throw new Error("The API did not return the updated profile.");
      }

      replaceProfile(response.data);
      setIsEditing(false);
      setMessage(response.message || "Profile updated successfully.");
    } catch (caughtError) {
      handleRequestError(caughtError);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function updateField(field: keyof IUserProfile, value: string) {
    setDraftProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  function beginEditing() {
    setDraftProfile({ ...(profile ?? emptyProfile) });
    setError("");
    setMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraftProfile({ ...(profile ?? emptyProfile) });
    setError("");
    setIsEditing(false);
  }

  async function handleDeleteAccount(password: string): Promise<boolean> {
    setError("");
    setMessage("");
    setIsDeletingAccount(true);

    try {
      await deleteUserAccount({ password });
      logout();
      return true;
    } catch (caughtError) {
      handleRequestError(caughtError);
      return false;
    } finally {
      setIsDeletingAccount(false);
    }
  }

  const isBusy = isProfileLoading || isSavingProfile || isDeletingAccount;
  const currentProfile = profile ?? emptyProfile;

  return (
    <section aria-labelledby="profile-heading" className="feature-view">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1 id="profile-heading">Profile</h1>
        </div>
      </div>

      {isProfileLoading ? (
        <p>Loading profile...</p>
      ) : isEditing ? (
        <ProfileForm
          disabled={isBusy}
          isSaving={isSavingProfile}
          onCancel={cancelEditing}
          onChange={updateField}
          onSubmit={handleSubmit}
          profile={draftProfile}
        />
      ) : (
        <UserCard
          email={user?.email ?? "Email not provided"}
          onEdit={beginEditing}
          profile={currentProfile}
        />
      )}

      {!isProfileLoading && !isEditing && (
        <DeleteAccountPanel
          disabled={isBusy}
          isDeleting={isDeletingAccount}
          onCancel={() => setError("")}
          onDelete={handleDeleteAccount}
        />
      )}

      <div aria-atomic="true" aria-live="polite" className="auth-feedback">
        {message && (
          <p className="notice is-success" role="status">
            {message}
          </p>
        )}
        {(error || profileError) && (
          <p className="notice is-error" role="alert">
            {error || profileError}
          </p>
        )}
      </div>
    </section>
  );
}

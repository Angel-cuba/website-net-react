import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { getUserProfile, updateUserProfile } from "../index";
import type { IUserProfile } from "../index";
import { UserCard } from "./user-card";

const emptyProfile: IUserProfile = {
  firstName: "",
  lastName: "",
  avatarUrl: "",
  bio: "",
};

export function ProfilePanel() {
  const { expireSession, user } = useAuth();
  const userId = user?.id;
  const [userProfile, setUserProfile] = useState<IUserProfile>(emptyProfile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
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
    if (!userId) return;

    let isCancelled = false;

    void getUserProfile()
      .then((response) => {
        if (isCancelled) return;

        if (!response.data) {
          throw new Error("The API did not return profile data.");
        }

        setUserProfile(normalizeProfile(response.data));
      })
      .catch((caughtError: unknown) => {
        if (!isCancelled) {
          handleRequestError(caughtError);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [handleRequestError, userId]);

  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(() => setMessage(""), 3_000);
    return () => window.clearTimeout(timer);
  }, [message]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSavingProfile(true);

    try {
      const response = await updateUserProfile(userProfile);

      if (!response.data) {
        throw new Error("The API did not return the updated profile.");
      }

      setUserProfile(normalizeProfile(response.data));
      setIsEditing(false);
      setMessage(response.message || "Profile updated successfully.");
    } catch (caughtError) {
      handleRequestError(caughtError);
    } finally {
      setIsSavingProfile(false);
    }
  }

  function updateField(field: keyof IUserProfile, value: string) {
    setUserProfile((currentProfile) => ({
      ...currentProfile,
      [field]: value,
    }));
  }

  const isBusy = isLoadingProfile || isSavingProfile;

  return (
    <section aria-labelledby="profile-heading" className="feature-view">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1 id="profile-heading">Profile</h1>
        </div>
      </div>

      {isLoadingProfile ? (
        <p>Loading profile...</p>
      ) : isEditing ? (
        <form aria-busy={isBusy} className="auth-form" onSubmit={handleSubmit}>
          <label className="name" htmlFor="name">
            <input
              aria-label="Name"
              disabled={isBusy}
              id="name"
              name="firstName"
              onChange={(event) => updateField("firstName", event.target.value)}
              placeholder="Name"
              type="text"
              value={userProfile.firstName}
            />
          </label>
          <label className="name" htmlFor="last-name">
            <input
              aria-label="Last Name"
              disabled={isBusy}
              id="last-name"
              name="lastName"
              onChange={(event) => updateField("lastName", event.target.value)}
              placeholder="Last Name"
              type="text"
              value={userProfile.lastName}
            />
          </label>
          <label className="name" htmlFor="bio">
            <input
              aria-label="Bio"
              disabled={isBusy}
              id="bio"
              name="bio"
              onChange={(event) => updateField("bio", event.target.value)}
              placeholder="Bio"
              type="text"
              value={userProfile.bio}
            />
          </label>
          <label className="name" htmlFor="avatar-url">
            <input
              aria-label="Avatar URL"
              disabled={isBusy}
              id="avatar-url"
              name="avatarUrl"
              onChange={(event) => updateField("avatarUrl", event.target.value)}
              placeholder="Avatar URL"
              type="url"
              value={userProfile.avatarUrl}
            />
          </label>
          <button disabled={isBusy} type="submit">
            {isSavingProfile ? "Updating profile" : "Update Profile"}
          </button>
        </form>
      ) : (
        <UserCard
          email={user?.email ?? "Email not provided"}
          onEdit={() => setIsEditing(true)}
          profile={userProfile}
        />
      )}

      <div aria-atomic="true" aria-live="polite" className="auth-feedback">
        {message && (
          <p className="notice is-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="notice is-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function normalizeProfile(profile: IUserProfile): IUserProfile {
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    avatarUrl: profile.avatarUrl ?? "",
    bio: profile.bio ?? "",
  };
}

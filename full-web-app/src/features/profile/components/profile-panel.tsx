import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { UserRound } from "lucide-react";
import { useAuth } from "../../auth";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { getUserProfile, updateUserProfile } from "../index";
import type { IUserProfile } from "../index";

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
  const hasProfileDetails = Boolean(
    userProfile.firstName ||
      userProfile.lastName ||
      userProfile.avatarUrl ||
      userProfile.bio,
  );

  return (
    <section aria-labelledby="profile-heading" className="feature-view">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1 id="profile-heading">Profile</h1>
        </div>
      </div>

      <div className="profile-details">
        <UserRound aria-hidden="true" />
        <dl>
          <div>
            <dt>Email</dt>
            <dd>{user?.email ?? "Not provided"}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{user?.id ?? "Not provided"}</dd>
          </div>
        </dl>
      </div>

      {isLoadingProfile ? (
        <p>Loading profile...</p>
      ) : hasProfileDetails ? (
        <div>
          <p>
            Welcome, {userProfile.firstName} {userProfile.lastName}!
          </p>
          {userProfile.bio && <p>{userProfile.bio}</p>}
          {userProfile.avatarUrl && (
            <img alt="Avatar" className="avatar" src={userProfile.avatarUrl} />
          )}
        </div>
      ) : (
        <div>
          <p>Welcome, {user?.email ?? "User"}!</p>
          <span>You don&apos;t have profile details yet.</span>
        </div>
      )}

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

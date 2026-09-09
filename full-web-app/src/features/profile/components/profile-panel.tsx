import { UserRound } from "lucide-react";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "../../auth";
import { getUserProfile, updateUserProfile } from "../index";
import type { IUserProfile } from "../index";
export function ProfilePanel() {
  const [userProfile, setUserProfile] = useState<IUserProfile>({
    FirstName: "",
    LastName: "",
    AvatarUrl: "",
    Bio: "",
  });
  console.log("🚀 ~ ProfilePanel ~ userProfile:", userProfile);

  const { user } = useAuth();
  console.log("🚀 ~ ProfilePanel ~ user:", user);
  const [isLoading, setIsLoading] = useState(false);
  const [userHasProfile, setUserHasProfile] = useState(false);
  useEffect(() => {
    if (user) {
      getUserProfile().then((response) => {
        console.log("🚀 ~ ProfilePanel ~ getUserProfile response:", response);
        if (response.data) {
          setUserProfile(response.data);
          setUserHasProfile(true);
        }
      });
    }
  }, [user, userProfile]);
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      // Handle profile update logic here
      console.log("Updated profile:", userProfile);
      const userToUpdate: IUserProfile = {
        FirstName: userProfile.FirstName,
        LastName: userProfile.LastName,
        AvatarUrl: userProfile.AvatarUrl,
        Bio: userProfile.Bio,
      };
      console.log(userToUpdate);
      await updateUserProfile(userToUpdate);
    } catch (caughtError) {
      console.error("Failed to update profile:", caughtError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
      {userHasProfile ? (
        <div className="">
          <p>
            Welcome, {userProfile.FirstName} {userProfile.LastName}!
          </p>
          {userProfile.Bio && <p>{userProfile.Bio}</p>}
          {userProfile.AvatarUrl && (
            <img src={userProfile.AvatarUrl} alt="Avatar" className="avatar" />
          )}
        </div>
      ) : (
        <div className="">
          <p>Welcome, {user?.email ?? "User"}!</p>
          <span>
            You don&apos;t have a profile yet. Please update your profile.
          </span>
        </div>
      )}
      <form aria-busy={isLoading} className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="name" className="name">
          <input
            type="text"
            id="name"
            name="FirstName"
            defaultValue={userProfile.FirstName}
            aria-label="Name"
            placeholder="Name"
            onChange={handleInputChange}
          />
        </label>
        <label htmlFor="last-name" className="name">
          <input
            type="text"
            id="last-name"
            name="LastName"
            defaultValue={userProfile.LastName}
            aria-label="Last Name"
            placeholder="Last Name"
            onChange={handleInputChange}
          />
        </label>
        <label htmlFor="bio" className="name">
          <input
            type="text"
            id="bio"
            name="Bio"
            defaultValue={userProfile.Bio}
            aria-label="Bio"
            placeholder="Bio"
            onChange={handleInputChange}
          />
        </label>
        <label htmlFor="avatar-url" className="name">
          <input
            type="text"
            id="avatar-url"
            name="AvatarUrl"
            defaultValue={userProfile.AvatarUrl}
            aria-label="Avatar URL"
            placeholder="Avatar URL"
            onChange={handleInputChange}
          />
        </label>
        <button type="submit" disabled={isLoading}>
          Update Profile
        </button>
      </form>
    </section>
  );
}

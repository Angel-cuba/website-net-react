import { Pencil, UserRound } from "lucide-react";
import { IconButton } from "../../../components/icon-button";
import type { IUserProfile } from "../types/IUserProfile";

type UserCardProps = {
  email: string;
  onEdit: () => void;
  profile: IUserProfile;
};

export function UserCard({ email, onEdit, profile }: UserCardProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim();
  const displayName = fullName || "Your profile";

  return (
    <article className="user-card">
      <div className="user-card__avatar">
        {profile.avatarUrl ? (
          <img alt={`${displayName} profile avatar`} src={profile.avatarUrl} />
        ) : (
          <UserRound aria-hidden="true" />
        )}
      </div>

      <div className="user-card__content">
        <div className="user-card__heading">
          <div>
            <h2>{displayName}</h2>
            <p className="user-card__email">{email}</p>
          </div>
          <IconButton aria-label="Edit profile" onClick={onEdit} type="button">
            <Pencil aria-hidden="true" />
          </IconButton>
        </div>

        <p className="user-card__bio">{profile.bio || "No biography provided."}</p>
      </div>
    </article>
  );
}

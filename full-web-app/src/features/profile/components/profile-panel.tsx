import { UserRound } from "lucide-react";
import { useAuth } from "../../auth";

export function ProfilePanel() {
  const { user } = useAuth();

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
    </section>
  );
}

import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { InvitationsProvider } from "./invitations-provider";
import { ProfileProvider } from "./profile-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <InvitationsProvider>{children}</InvitationsProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

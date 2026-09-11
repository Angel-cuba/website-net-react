import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { InvitationsProvider } from "./invitations-provider";
import { ProfileProvider } from "./profile-provider";
import { RealtimeProvider } from "./realtime-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <ProfileProvider>
          <InvitationsProvider>{children}</InvitationsProvider>
        </ProfileProvider>
      </RealtimeProvider>
    </AuthProvider>
  );
}

import { useContext } from "react";
import { InvitationsContext } from "../../../app/providers/invitations-context";

export function useInvitations() {
  const context = useContext(InvitationsContext);

  if (!context) {
    throw new Error("useInvitations must be used inside InvitationsProvider.");
  }

  return context;
}

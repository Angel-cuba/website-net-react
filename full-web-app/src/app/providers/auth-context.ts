import { createContext } from "react";
import type { AuthStatus, AuthUser } from "../../features/auth/types/auth";

export type AuthContextValue = {
  user: AuthUser | null;
  status: AuthStatus;
  error: string;
  isAuthenticated: boolean;
  beginAuthentication: () => void;
  authenticate: (token: string) => void;
  failAuthentication: (message: string) => void;
  clearAuthFeedback: () => void;
  expireSession: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

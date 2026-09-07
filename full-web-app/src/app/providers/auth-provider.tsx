import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  clearAuthToken,
  readAuthToken,
  storeAuthToken,
} from "../../features/auth/token-storage";
import type { AuthStatus, AuthUser } from "../../features/auth/types/auth";
import { AuthContext } from "./auth-context";

const maxTimerDelay = 2_147_483_647;

type StoredSession = {
  token: string;
  user: AuthUser | null;
  expiresAt: number | null;
  status: AuthStatus;
  error: string;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<StoredSession>(readStoredSession);

  const clearSession = useCallback((status: "guest" | "expired") => {
    setSession({ token: "", user: null, expiresAt: null, status, error: "" });
    clearAuthToken();
  }, []);

  useEffect(() => {
    if (!session.expiresAt || session.status !== "authenticated") {
      return;
    }

    const delay = session.expiresAt - Date.now();

    const timer = window.setTimeout(
      () => clearSession("expired"),
      Math.max(0, Math.min(delay, maxTimerDelay)),
    );

    return () => window.clearTimeout(timer);
  }, [clearSession, session.expiresAt, session.status]);

  const beginAuthentication = useCallback(() => {
    setSession((current) => ({ ...current, status: "authenticating", error: "" }));
  }, []);

  const authenticate = useCallback((nextToken: string) => {
    const parsedToken = parseToken(nextToken);

    if (!parsedToken || (parsedToken.expiresAt && parsedToken.expiresAt <= Date.now())) {
      clearAuthToken();
      setSession({
        token: "",
        user: null,
        expiresAt: null,
        status: "error",
        error: "The API returned an invalid or expired session.",
      });
      return;
    }

    storeAuthToken(nextToken);
    setSession({
      token: nextToken,
      user: parsedToken.user,
      expiresAt: parsedToken.expiresAt,
      status: "authenticated",
      error: "",
    });
  }, []);

  const failAuthentication = useCallback((message: string) => {
    setSession((current) => ({ ...current, status: "error", error: message }));
  }, []);

  const clearAuthFeedback = useCallback(() => {
    setSession((current) => ({
      ...current,
      status: current.token ? "authenticated" : "guest",
      error: "",
    }));
  }, []);

  const logout = useCallback(() => {
    clearSession("guest");
  }, [clearSession]);

  const expireSession = useCallback(() => {
    clearSession("expired");
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user: session.user,
      status: session.status,
      error: session.error,
      isAuthenticated: session.status === "authenticated",
      beginAuthentication,
      authenticate,
      failAuthentication,
      clearAuthFeedback,
      expireSession,
      logout,
    }),
    [
      authenticate,
      beginAuthentication,
      clearAuthFeedback,
      expireSession,
      failAuthentication,
      logout,
      session,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function readStoredSession(): StoredSession {
  const token = readAuthToken();

  if (!token) {
    return { token: "", user: null, expiresAt: null, status: "guest", error: "" };
  }

  const parsedToken = parseToken(token);

  if (!parsedToken || (parsedToken.expiresAt && parsedToken.expiresAt <= Date.now())) {
    clearAuthToken();
    return { token: "", user: null, expiresAt: null, status: "expired", error: "" };
  }

  return {
    token,
    user: parsedToken.user,
    expiresAt: parsedToken.expiresAt,
    status: "authenticated",
    error: "",
  };
}

function parseToken(token: string): { user: AuthUser; expiresAt: number | null } | null {
  try {
    const encodedPayload = token.split(".")[1];

    if (!encodedPayload) {
      return null;
    }

    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );
    const bytes = Uint8Array.from(atob(paddedPayload), (character) => character.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : null;
    const id = readClaim(
      payload,
      "sub",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
    );
    const email = readClaim(
      payload,
      "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
    );

    return { user: { id, email }, expiresAt };
  } catch {
    return null;
  }
}

function readClaim(payload: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    if (typeof payload[key] === "string") {
      return payload[key];
    }
  }

  return null;
}

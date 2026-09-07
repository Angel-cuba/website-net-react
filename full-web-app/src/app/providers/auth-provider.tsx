import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./auth-context";

const tokenStorageKey = "wapp2.auth.token";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState(() => localStorage.getItem(tokenStorageKey) ?? "");

  const authenticate = useCallback((nextToken: string) => {
    localStorage.setItem(tokenStorageKey, nextToken);
    setToken(nextToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenStorageKey);
    setToken("");
  }, []);

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: token.length > 0,
      authenticate,
      logout,
    }),
    [authenticate, logout, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

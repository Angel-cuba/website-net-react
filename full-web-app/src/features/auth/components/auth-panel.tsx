import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../../components/button";
import { getErrorMessage } from "../../../utils/errors";
import { login, register } from "../api/auth-api";
import { useAuth } from "../hooks/use-auth";
import type { AuthMode } from "../types/auth";

export function AuthPanel() {
  const { authenticate, isAuthenticated, logout, token } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const tokenPreview = useMemo(() => {
    if (!token) {
      return "No token stored";
    }

    return `${token.slice(0, 18)}...${token.slice(-12)}`;
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const credentials = { email, password };
      const response = mode === "login" ? await login(credentials) : await register(credentials);
      const nextToken = response.data?.token;

      if (!nextToken) {
        throw new Error("The API did not return a token.");
      }

      authenticate(nextToken);
      setPassword("");
      setMessage(response.message);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setIsLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setError("");
  }

  function handleLogout() {
    logout();
    setMessage("Logged out.");
    setError("");
  }

  return (
    <aside className="auth-panel">
      <div className="section-header">
        <h2>Session</h2>
        <div className="segmented-control" aria-label="Authentication mode">
          <Button
            className={mode === "login" ? "is-active" : ""}
            onClick={() => changeMode("login")}
            type="button"
          >
            Login
          </Button>
          <Button
            className={mode === "register" ? "is-active" : ""}
            onClick={() => changeMode("register")}
            type="button"
          >
            Register
          </Button>
        </div>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            autoComplete="email"
            name="email"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Password
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        <Button disabled={isLoading} type="submit" variant="primary">
          {isLoading ? "Working..." : mode === "login" ? "Login" : "Create user"}
        </Button>
      </form>

      <div className="token-box">
        <span>Token</span>
        <code>{tokenPreview}</code>
      </div>

      <Button className="logout-button" disabled={!isAuthenticated} onClick={handleLogout}>
        Logout
      </Button>

      {message && (
        <p aria-live="polite" className="notice is-success">
          {message}
        </p>
      )}
      {error && (
        <p aria-live="assertive" className="notice is-error" role="alert">
          {error}
        </p>
      )}
    </aside>
  );
}

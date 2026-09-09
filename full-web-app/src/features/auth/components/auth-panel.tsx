import { useState } from "react";
import type { FormEvent } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "../../../components/button";
import { getErrorMessage } from "../../../utils/errors";
import { login, register } from "../api/auth-api";
import { useAuth } from "../hooks/use-auth";
import type { AuthMode } from "../types/auth";

export function AuthPanel() {
  const {
    authenticate,
    beginAuthentication,
    clearAuthFeedback,
    error,
    failAuthentication,
    status,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const isLoading = status === "authenticating";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthFeedback();
    setMessage("");
    beginAuthentication();

    try {
      const credentials = { email, password };
      const response =
        mode === "login"
          ? await login(credentials)
          : await register(credentials);
      const nextToken = response.data?.token;

      if (!nextToken) {
        throw new Error("The API did not return a token.");
      }

      authenticate(nextToken);
      setPassword("");
      setMessage(response.message);
    } catch (caughtError) {
      failAuthentication(getErrorMessage(caughtError));
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    clearAuthFeedback();
  }

  return (
    <section aria-labelledby="auth-heading" className="auth-panel">
      <div className="auth-heading">
        <p className="eyebrow">Private workspace</p>
        <h1 id="auth-heading">Welcome to Wapp2</h1>
      </div>

      <div
        className="segmented-control"
        aria-label="Authentication mode"
        role="group"
      >
        <Button
          aria-pressed={mode === "login"}
          className={mode === "login" ? "is-active" : ""}
          onClick={() => changeMode("login")}
          type="button"
        >
          Login
        </Button>
        <Button
          aria-pressed={mode === "register"}
          className={mode === "register" ? "is-active" : ""}
          onClick={() => changeMode("register")}
          type="button"
        >
          Register
        </Button>
      </div>

      <form aria-busy={isLoading} className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="auth-email">
          Email
          <input
            autoComplete="email"
            id="auth-email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              if (status === "error") clearAuthFeedback();
            }}
            required
            type="email"
            value={email}
          />
        </label>

        <label htmlFor="auth-password">
          Password
          <input
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            id="auth-password"
            minLength={6}
            name="password"
            onChange={(event) => {
              setPassword(event.target.value);
              if (status === "error") clearAuthFeedback();
            }}
            required
            type="password"
            value={password}
          />
        </label>

        <Button disabled={isLoading} type="submit" variant="primary">
          {mode === "login" ? (
            <LogIn aria-hidden="true" />
          ) : (
            <UserPlus aria-hidden="true" />
          )}
          {isLoading
            ? "Please wait"
            : mode === "login"
              ? "Login"
              : "Create account"}
        </Button>
      </form>

      <div aria-atomic="true" aria-live="polite" className="auth-feedback">
        {status === "expired" && (
          <p className="notice is-warning" role="status">
            Your session expired. Please log in again.
          </p>
        )}
        {message && <p className="notice is-success">{message}</p>}
        {error && (
          <p className="notice is-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

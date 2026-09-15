import { useState } from "react";
import type { FormEvent } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { Button } from "../../../components/button";
import { getErrorMessage } from "../../../utils/errors";
import { login, register } from "../api/auth-api";
import { useAuth } from "../hooks/use-auth";
import type { AuthMode } from "../types/auth";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  validateAuthCredentials,
} from "../utils/auth-validation";
import type { AuthValidationErrors } from "../utils/auth-validation";

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
  const [validationErrors, setValidationErrors] =
    useState<AuthValidationErrors>({});
  const isLoading = status === "authenticating";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthFeedback();
    setMessage("");

    const validation = validateAuthCredentials({ email, password });
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    beginAuthentication();

    try {
      const response =
        mode === "login"
          ? await login(validation.credentials)
          : await register(validation.credentials);
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
    setValidationErrors({});
    clearAuthFeedback();
  }

  return (
    <section aria-labelledby="auth-heading" className="auth-panel">
      <div className="auth-heading">
        <p className="eyebrow">Private workspace</p>
        <h1 id="auth-heading">Welcome to Wappy</h1>
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

      <form
        aria-busy={isLoading}
        className="auth-form"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="auth-field">
          <label htmlFor="auth-email">Email</label>
          <input
            aria-describedby={validationErrors.email ? "auth-email-error" : undefined}
            aria-invalid={Boolean(validationErrors.email)}
            autoCapitalize="none"
            autoComplete="email"
            id="auth-email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setValidationErrors((current) => ({
                ...current,
                email: undefined,
              }));
              if (status === "error") clearAuthFeedback();
            }}
            required
            spellCheck={false}
            type="email"
            value={email}
          />
          {validationErrors.email && (
            <span className="field-error" id="auth-email-error" role="alert">
              {validationErrors.email}
            </span>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="auth-password">Password</label>
          <input
            aria-describedby={
              validationErrors.password ? "auth-password-error" : undefined
            }
            aria-invalid={Boolean(validationErrors.password)}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            id="auth-password"
            maxLength={AUTH_PASSWORD_MAX_LENGTH}
            minLength={AUTH_PASSWORD_MIN_LENGTH}
            name="password"
            onChange={(event) => {
              setPassword(event.target.value);
              setValidationErrors((current) => ({
                ...current,
                password: undefined,
              }));
              if (status === "error") clearAuthFeedback();
            }}
            required
            type="password"
            value={password}
          />
          {validationErrors.password && (
            <span
              className="field-error"
              id="auth-password-error"
              role="alert"
            >
              {validationErrors.password}
            </span>
          )}
        </div>

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

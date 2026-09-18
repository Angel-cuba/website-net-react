import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { LockKeyhole, LogIn, RefreshCw, Share2, UserPlus } from "lucide-react";
import { Button } from "../../../components/button";
import { LoadingButtonContent } from "../../../components/loading-button-content";
import { RequestStatusNotice } from "../../../components/request-status-notice";
import { ApiError } from "../../../lib/http-client";
import { getErrorMessage } from "../../../utils/errors";
import { login, register } from "../api/auth-api";
import { useAuth } from "../hooks/use-auth";
import { useServiceReadiness } from "../hooks/use-service-readiness";
import type { AuthMode } from "../types/auth";
import type { AuthCredentials } from "../types/auth";
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
  const { retry: retryReadiness, status: readinessStatus } =
    useServiceReadiness();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [validationErrors, setValidationErrors] =
    useState<AuthValidationErrors>({});
  const [requestFailure, setRequestFailure] = useState<{
    error: unknown;
    message: string;
  } | null>(null);
  const [isSlowRequest, setIsSlowRequest] = useState(false);
  const isLoading = status === "authenticating";
  const feedbackError = requestFailure?.message || error;
  const isRecoverableFailure =
    requestFailure?.error instanceof ApiError &&
    ["network", "timeout", "unavailable", "server"].includes(
      requestFailure.error.kind,
    );

  useEffect(() => {
    if (!isLoading) return;

    const timer = window.setTimeout(() => setIsSlowRequest(true), 3_000);
    return () => window.clearTimeout(timer);
  }, [isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAuthFeedback();
    setMessage("");

    const validation = validateAuthCredentials({ email, password });
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      return;
    }

    await submitCredentials(validation.credentials);
  }

  async function submitCredentials(credentials: AuthCredentials) {
    beginAuthentication();
    setIsSlowRequest(false);
    setRequestFailure(null);

    try {
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
      const nextMessage = getErrorMessage(caughtError);
      setRequestFailure({ error: caughtError, message: nextMessage });
      failAuthentication(nextMessage);
    }
  }

  async function retryAuthentication() {
    const validation = validateAuthCredentials({ email, password });
    setValidationErrors(validation.errors);
    if (!validation.isValid) return;

    await submitCredentials(validation.credentials);
  }

  function clearRequestFeedback() {
    setRequestFailure(null);
    clearAuthFeedback();
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setValidationErrors({});
    setRequestFailure(null);
    clearAuthFeedback();
  }

  return (
    <section aria-labelledby="auth-heading" className="auth-panel">
      <div className="auth-heading">
        <p className="eyebrow">Private workspace</p>
        <h1 id="auth-heading">Welcome to Wappy</h1>
        <p className="auth-subheading">
          Create private tasks, share them with registered accounts, and control
          who can view or edit — kept in sync in real time.
        </p>
      </div>

      <div
        className="segmented-control"
        aria-label="Authentication mode"
        role="group"
      >
        <Button
          aria-pressed={mode === "login"}
          className={mode === "login" ? "is-active" : ""}
          disabled={isLoading}
          onClick={() => changeMode("login")}
          type="button"
        >
          Login
        </Button>
        <Button
          aria-pressed={mode === "register"}
          className={mode === "register" ? "is-active" : ""}
          disabled={isLoading}
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
            disabled={isLoading}
            id="auth-email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setValidationErrors((current) => ({
                ...current,
                email: undefined,
              }));
              if (status === "error" || requestFailure) clearRequestFeedback();
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
            disabled={isLoading}
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
              if (status === "error" || requestFailure) clearRequestFeedback();
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
          <LoadingButtonContent
            icon={
              mode === "login" ? (
                <LogIn aria-hidden="true" />
              ) : (
                <UserPlus aria-hidden="true" />
              )
            }
            isLoading={isLoading}
            loadingLabel={mode === "login" ? "Signing in..." : "Creating account..."}
          >
            {mode === "login" ? "Login" : "Create account"}
          </LoadingButtonContent>
        </Button>
      </form>

      <div aria-atomic="true" aria-live="polite" className="auth-feedback">
        {status === "expired" && (
          <p className="notice is-warning" role="status">
            Your session expired. Please log in again.
          </p>
        )}
        {message && <p className="notice is-success">{message}</p>}
        {isRecoverableFailure && requestFailure ? (
          <RequestStatusNotice
            actionLabel="Try again"
            description={
              requestFailure.error instanceof ApiError &&
              requestFailure.error.kind === "server"
                ? "The request did not complete successfully. Your details are still here, so you can try once more."
                : "This demo uses on-demand hosting and may still be starting. Your details are still here; wait a moment and try again."
            }
            onAction={() => void retryAuthentication()}
            title={
              requestFailure.error instanceof ApiError &&
              requestFailure.error.kind === "server"
                ? "We couldn't complete the request"
                : "The demo service needs a little more time"
            }
            tone="error"
          />
        ) : feedbackError ? (
          <p className="notice is-error" role="alert">
            {feedbackError}
          </p>
        ) : (isLoading && isSlowRequest) || readinessStatus === "delayed" ? (
          <RequestStatusNotice
            description="This demo uses on-demand hosting. The first request after inactivity can take a little longer; keep this tab open and it will continue automatically."
            isBusy
            title={isLoading ? "Preparing your workspace" : "Waking the demo service"}
            tone="warning"
          />
        ) : readinessStatus === "unavailable" ? (
          <RequestStatusNotice
            actionLabel="Check again"
            description="It may still be starting. You can enter your details while we check the service again."
            onAction={retryReadiness}
            title="The demo service is not ready yet"
            tone="warning"
          />
        ) : null}
      </div>

      <ul className="auth-highlights" aria-label="What you can do with Wappy">
        <li>
          <LockKeyhole aria-hidden="true" />
          <span>Private, per-account task lists</span>
        </li>
        <li>
          <Share2 aria-hidden="true" />
          <span>Share with view-only or edit access</span>
        </li>
        <li>
          <RefreshCw aria-hidden="true" />
          <span>Real-time sync across accounts</span>
        </li>
      </ul>
    </section>
  );
}

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../lib/http-client";
import { AuthPanel } from "./auth-panel";

const authApiMock = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  authenticate: vi.fn(),
  beginAuthentication: vi.fn(),
  clearAuthFeedback: vi.fn(),
  failAuthentication: vi.fn(),
  current: { error: "", status: "guest" },
}));

const readinessMock = vi.hoisted(() => ({
  current: { retry: vi.fn(), status: "ready" },
}));

vi.mock("../api/auth-api", () => ({
  login: authApiMock.login,
  register: authApiMock.register,
}));

vi.mock("../hooks/use-auth", () => ({
  useAuth: () => ({
    ...authMock.current,
    authenticate: authMock.authenticate,
    beginAuthentication: authMock.beginAuthentication,
    clearAuthFeedback: authMock.clearAuthFeedback,
    failAuthentication: authMock.failAuthentication,
  }),
}));

vi.mock("../hooks/use-service-readiness", () => ({
  useServiceReadiness: () => readinessMock.current,
}));

describe("AuthPanel", () => {
  beforeEach(() => {
    authMock.current = { error: "", status: "guest" };
    readinessMock.current = { retry: vi.fn(), status: "ready" };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows both validation errors without starting authentication", async () => {
    const user = userEvent.setup();
    render(<AuthPanel />);
    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Password");

    await user.type(emailInput, "person@example");
    await user.type(passwordInput, "short");
    await user.click(screen.getAllByRole("button", { name: "Login" })[1]);

    expect(screen.getByText("Enter a valid email address.")).toBeVisible();
    expect(
      screen.getByText("Password must be between 6 and 20 characters."),
    ).toBeVisible();
    expect(emailInput).toHaveAttribute("aria-invalid", "true");
    expect(passwordInput).toHaveAttribute("aria-invalid", "true");
    expect(authMock.beginAuthentication).not.toHaveBeenCalled();
    expect(authApiMock.login).not.toHaveBeenCalled();
    expect(authApiMock.register).not.toHaveBeenCalled();
  });

  it("submits a valid login with a normalized email", async () => {
    const user = userEvent.setup();
    authApiMock.login.mockResolvedValue({
      success: true,
      message: "Logged in.",
      data: { token: "token" },
    });
    render(<AuthPanel />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "  person@example.com  " },
    });
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getAllByRole("button", { name: "Login" })[1]);

    await waitFor(() => {
      expect(authApiMock.login).toHaveBeenCalledWith({
        email: "person@example.com",
        password: "secret",
      });
    });
    expect(authMock.beginAuthentication).toHaveBeenCalledOnce();
    expect(authMock.authenticate).toHaveBeenCalledWith("token");
    expect(authApiMock.register).not.toHaveBeenCalled();
  });

  it("uses the same validation before registration", async () => {
    const user = userEvent.setup();
    render(<AuthPanel />);

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.type(screen.getByLabelText("Email"), "person@example.com");
    const passwordInput = screen.getByLabelText("Password");
    await user.type(passwordInput, "12345");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      screen.getByText("Password must be between 6 and 20 characters."),
    ).toBeVisible();
    expect(authApiMock.register).not.toHaveBeenCalled();
    expect(authMock.beginAuthentication).not.toHaveBeenCalled();
    expect(passwordInput).toHaveAttribute("minlength", "6");
    expect(passwordInput).toHaveAttribute("maxlength", "20");
  });

  it("shows a spinner and blocks the form while authentication is pending", () => {
    authMock.current = { error: "", status: "authenticating" };

    render(<AuthPanel />);

    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    expect(screen.getByLabelText("Email")).toBeDisabled();
    expect(screen.getByLabelText("Password")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Register" })).toBeDisabled();
  });

  it("adds context when authentication takes longer than three seconds", async () => {
    vi.useFakeTimers();
    authMock.current = { error: "", status: "authenticating" };

    render(<AuthPanel />);

    await act(() => vi.advanceTimersByTimeAsync(3_000));

    expect(screen.getByText("Preparing your workspace")).toBeVisible();
    expect(screen.getByText(/continue automatically/i)).toBeVisible();
  });

  it("explains when the demo service is taking longer to wake", () => {
    readinessMock.current = { retry: vi.fn(), status: "delayed" };

    render(<AuthPanel />);

    expect(screen.getByText("Waking the demo service")).toBeVisible();
    expect(screen.getByText(/on-demand hosting/i)).toBeVisible();
  });

  it("keeps credentials and offers a manual retry after a temporary failure", async () => {
    const user = userEvent.setup();
    authApiMock.login.mockRejectedValueOnce(
      new ApiError("Service unavailable", 503),
    );
    render(<AuthPanel />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getAllByRole("button", { name: "Login" })[1]);

    expect(
      await screen.findByText("The demo service needs a little more time"),
    ).toBeVisible();
    expect(screen.getByLabelText("Email")).toHaveValue("person@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("secret");

    authApiMock.login.mockResolvedValueOnce({
      success: true,
      message: "Logged in.",
      data: { token: "token" },
    });
    await user.click(screen.getByRole("button", { name: "Try again" }));

    await waitFor(() => expect(authApiMock.login).toHaveBeenCalledTimes(2));
    expect(authMock.authenticate).toHaveBeenCalledWith("token");
  });

  it("keeps credential errors distinct from hosting availability", async () => {
    const user = userEvent.setup();
    authApiMock.login.mockRejectedValue(
      new ApiError("Invalid email or password.", 401),
    );
    render(<AuthPanel />);

    await user.type(screen.getByLabelText("Email"), "person@example.com");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getAllByRole("button", { name: "Login" })[1]);

    expect(await screen.findByText("Invalid email or password.")).toBeVisible();
    expect(
      screen.queryByText("The demo service needs a little more time"),
    ).not.toBeInTheDocument();
  });
});

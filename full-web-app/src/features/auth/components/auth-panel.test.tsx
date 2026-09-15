import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("AuthPanel", () => {
  beforeEach(() => {
    authMock.current = { error: "", status: "guest" };
    vi.clearAllMocks();
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
});

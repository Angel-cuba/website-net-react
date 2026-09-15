import { describe, expect, it } from "vitest";
import {
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  validateAuthCredentials,
} from "./auth-validation";

describe("validateAuthCredentials", () => {
  it("accepts valid credentials and trims the email", () => {
    const result = validateAuthCredentials({
      email: "  person@example.com  ",
      password: "secret",
    });

    expect(result).toEqual({
      credentials: {
        email: "person@example.com",
        password: "secret",
      },
      errors: {},
      isValid: true,
    });
  });

  it.each([
    "",
    "person",
    "@example.com",
    "person@",
    "person@example",
    "person@example..com",
    "person @example.com",
  ])("rejects the invalid email %j", (email) => {
    const result = validateAuthCredentials({ email, password: "secret" });

    expect(result.errors.email).toBe("Enter a valid email address.");
    expect(result.isValid).toBe(false);
  });

  it("accepts passwords at both length boundaries", () => {
    expect(
      validateAuthCredentials({
        email: "person@example.com",
        password: "a".repeat(AUTH_PASSWORD_MIN_LENGTH),
      }).isValid,
    ).toBe(true);
    expect(
      validateAuthCredentials({
        email: "person@example.com",
        password: "a".repeat(AUTH_PASSWORD_MAX_LENGTH),
      }).isValid,
    ).toBe(true);
  });

  it.each([AUTH_PASSWORD_MIN_LENGTH - 1, AUTH_PASSWORD_MAX_LENGTH + 1])(
    "rejects a password with %s characters",
    (length) => {
      const result = validateAuthCredentials({
        email: "person@example.com",
        password: "a".repeat(length),
      });

      expect(result.errors.password).toBe(
        "Password must be between 6 and 20 characters.",
      );
      expect(result.isValid).toBe(false);
    },
  );
});

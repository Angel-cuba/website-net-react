import type { AuthCredentials } from "../types/auth";

export const AUTH_PASSWORD_MIN_LENGTH = 6;
export const AUTH_PASSWORD_MAX_LENGTH = 20;

export type AuthValidationErrors = Partial<
  Record<keyof AuthCredentials, string>
>;

type AuthValidationResult = {
  credentials: AuthCredentials;
  errors: AuthValidationErrors;
  isValid: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export function validateAuthCredentials(
  values: AuthCredentials,
): AuthValidationResult {
  const normalizedCredentials = {
    email: values.email.trim(),
    password: values.password,
  };
  const errors: AuthValidationErrors = {};

  if (!emailPattern.test(normalizedCredentials.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (
    normalizedCredentials.password.length < AUTH_PASSWORD_MIN_LENGTH ||
    normalizedCredentials.password.length > AUTH_PASSWORD_MAX_LENGTH
  ) {
    errors.password = "Password must be between 6 and 20 characters.";
  }

  return {
    credentials: normalizedCredentials,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}

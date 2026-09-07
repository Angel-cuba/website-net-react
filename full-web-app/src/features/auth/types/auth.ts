export type AuthMode = "login" | "register";

export type AuthStatus =
  | "guest"
  | "authenticating"
  | "authenticated"
  | "error"
  | "expired";

export type AuthUser = {
  id: string | null;
  email: string | null;
};

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
};

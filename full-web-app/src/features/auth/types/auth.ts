export type AuthMode = "login" | "register";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  token: string;
};

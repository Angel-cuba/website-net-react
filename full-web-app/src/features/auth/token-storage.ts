const tokenStorageKey = "wapp2.auth.token";

export function readAuthToken(): string {
  const token = sessionStorage.getItem(tokenStorageKey);

  if (token) {
    return token;
  }

  localStorage.removeItem(tokenStorageKey);
  return "";
}

export function storeAuthToken(token: string): void {
  localStorage.removeItem(tokenStorageKey);
  sessionStorage.setItem(tokenStorageKey, token);
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(tokenStorageKey);
}

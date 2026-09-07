const tokenStorageKey = "wapp2.auth.token";

export function readAuthToken(): string {
  return localStorage.getItem(tokenStorageKey) ?? "";
}

export function storeAuthToken(token: string): void {
  localStorage.setItem(tokenStorageKey, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(tokenStorageKey);
}

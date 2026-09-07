function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set it.`,
    );
  }

  return value.replace(/\/+$/, "");
}

export const env = {
  apiUrl: requireEnv("VITE_API_URL", import.meta.env.VITE_API_URL),
} as const;

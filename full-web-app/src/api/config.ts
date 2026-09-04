/**
 * Base URLs for the .NET APIs, read from the environment.
 *
 * No fallback values on purpose: a missing variable fails right away with a
 * readable message instead of firing requests at "undefined/api/...".
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set it.`
    );
  }
  return value.replace(/\/+$/, "");
}

const employeesApi = requireEnv(
  "VITE_EMPLOYEES_API_URL",
  import.meta.env.VITE_EMPLOYEES_API_URL
);

const charactersApi = requireEnv(
  "VITE_CHARACTERS_API_URL",
  import.meta.env.VITE_CHARACTERS_API_URL
);

export const endpoints = {
  employees: `${employeesApi}/api/employee/all`,
  characters: `${charactersApi}/api/characters`,
};

/**
 * Base URLs for the .NET APIs, read from the environment.
 *
 * No fallback values on purpose: a missing variable fails right away with a
 * readable message instead of firing requests at "undefined/api/...".
 */
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set it.`,
    );
  }
  return value.replace(/\/+$/, "");
}

export const employeesApiUrl = requireEnv(
  "VITE_EMPLOYEES_API_URL",
  import.meta.env.VITE_EMPLOYEES_API_URL,
);
export const fetchAll = async (urlString: string) => {
  try {
    const response = await fetch(employeesApiUrl + "/" + urlString);
    if (!response.ok) {
      throw new Error(`Failed to fetch from ${urlString}`);
    }
    const data = await response.json();
    console.log(`Data from ${urlString}:`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching from ${urlString}:`, error);
  }
};

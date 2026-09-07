export type AppPath = "/tasks" | "/invitations" | "/shared" | "/profile";

export const defaultPath: AppPath = "/tasks";

export function getAppPath(pathname: string): AppPath {
  if (
    pathname === "/tasks" ||
    pathname === "/invitations" ||
    pathname === "/shared" ||
    pathname === "/profile"
  ) {
    return pathname;
  }

  return defaultPath;
}

import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  CheckSquare2,
  LogOut,
  Mail,
  Menu,
  Share2,
  UserRound,
  X,
} from "lucide-react";
import { IconButton } from "../../components/icon-button";
import { AuthPanel, useAuth } from "../../features/auth";
import type { AppPath } from "../router/routes";

type AppShellProps = {
  activePath: AppPath;
  children: ReactNode;
  onNavigate: (path: AppPath) => void;
};

type NavigationItem = {
  icon: LucideIcon;
  label: string;
  path: AppPath;
};

const navigationItems: NavigationItem[] = [
  { icon: CheckSquare2, label: "Tasks", path: "/tasks" },
  { icon: Mail, label: "Invitations", path: "/invitations" },
  { icon: Share2, label: "Shared tasks", path: "/shared" },
  { icon: UserRound, label: "Profile", path: "/profile" },
];

export function AppShell({ activePath, children, onNavigate }: AppShellProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  function handleNavigation(
    event: MouseEvent<HTMLAnchorElement>,
    path: AppPath,
  ) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;

    event.preventDefault();
    setIsMenuOpen(false);
    onNavigate(path);
  }

  return (
    <div
      className={`app-layout ${isAuthenticated ? "is-authenticated" : "is-guest"}`}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>

      {isAuthenticated && (
        <header className="mobile-header">
          <a
            href="/tasks"
            onClick={(event) => handleNavigation(event, "/tasks")}
          >
            <span className="brand-mark" aria-hidden="true">
              W
            </span>
            <span>Wapp2</span>
          </a>
          <IconButton
            aria-controls="app-sidebar"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
            type="button"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" />
            ) : (
              <Menu aria-hidden="true" />
            )}
          </IconButton>
        </header>
      )}

      <aside
        className={`sidebar ${isMenuOpen ? "is-open" : ""}`}
        id="app-sidebar"
      >
        <div className="sidebar-brand" aria-label="Wapp2">
          <span className="brand-mark" aria-hidden="true">
            W
          </span>
          <div>
            <strong>Wapp2</strong>
            <span>Task workspace</span>
          </div>
        </div>

        {!isAuthenticated ? (
          <AuthPanel />
        ) : (
          <>
            <nav aria-label="Main navigation" className="sidebar-nav">
              <ul>
                {navigationItems.map(({ icon: Icon, label, path }) => (
                  <li key={path}>
                    <a
                      aria-current={activePath === path ? "page" : undefined}
                      href={path}
                      onClick={(event) => handleNavigation(event, path)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="sidebar-footer">
              <div className="user-summary">
                <span className="user-avatar" aria-hidden="true">
                  {(user?.email?.[0] ?? "U").toUpperCase()}
                </span>
                <div>
                  <strong>{user?.email ?? "Signed in"}</strong>
                  <span>{user?.id ? `User ${user.id}` : "Authenticated"}</span>
                </div>
              </div>
              <button
                className="logout-action"
                onClick={() => logout()}
                type="button"
              >
                <LogOut aria-hidden="true" />
                <span>Logout</span>
              </button>
            </div>
          </>
        )}
      </aside>

      {isAuthenticated && isMenuOpen && (
        <button
          aria-label="Close navigation"
          className="sidebar-backdrop"
          onClick={() => setIsMenuOpen(false)}
          type="button"
        />
      )}

      <main id="main-content">{children}</main>
    </div>
  );
}

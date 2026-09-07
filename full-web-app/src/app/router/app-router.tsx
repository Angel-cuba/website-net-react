import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { EmptyState } from "../../components/empty-state";
import { useAuth } from "../../features/auth";
import { InvitationsPanel } from "../../features/invitations/components/invitations-panel";
import { ProfilePanel } from "../../features/profile/components/profile-panel";
import { SharedTasksPanel } from "../../features/shared/components/shared-tasks-panel";
import { TaskPanel } from "../../features/tasks";
import { AppShell } from "../layout/app-shell";
import { getAppPath } from "./routes";
import type { AppPath } from "./routes";

export function AppRouter() {
  const { isAuthenticated } = useAuth();
  const [activePath, setActivePath] = useState<AppPath>(() => getAppPath(window.location.pathname));

  useEffect(() => {
    function syncRoute() {
      setActivePath(getAppPath(window.location.pathname));
    }

    window.addEventListener("popstate", syncRoute);

    if (window.location.pathname !== activePath) {
      window.history.replaceState(null, "", activePath);
    }

    return () => window.removeEventListener("popstate", syncRoute);
  }, [activePath]);

  function navigate(path: AppPath) {
    if (path === activePath) return;

    window.history.pushState(null, "", path);
    setActivePath(path);
  }

  return (
    <AppShell activePath={activePath} onNavigate={navigate}>
      {!isAuthenticated ? (
        <div className="guest-workspace">
          <div aria-hidden="true" className="guest-motion">
            <span className="guest-motion__lane guest-motion__lane--one">
              <span />
            </span>
            <span className="guest-motion__lane guest-motion__lane--two">
              <span />
            </span>
            <span className="guest-motion__lane guest-motion__lane--three">
              <span />
            </span>
          </div>
          <EmptyState
            description="Sign in to open your private workspace."
            icon={<LockKeyhole aria-hidden="true" />}
            title="Your workspace is protected"
          />
        </div>
      ) : (
        renderRoute(activePath)
      )}
    </AppShell>
  );
}

function renderRoute(path: AppPath) {
  switch (path) {
    case "/tasks":
      return <TaskPanel />;
    case "/invitations":
      return <InvitationsPanel />;
    case "/shared":
      return <SharedTasksPanel />;
    case "/profile":
      return <ProfilePanel />;
  }
}

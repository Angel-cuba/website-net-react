import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  ListChecks,
  LockKeyhole,
} from "lucide-react";
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
          <div aria-hidden="true" className="guest-preview">
            <div className="guest-preview__summary">
              <span className="guest-preview__metric guest-preview__metric--today">
                <Clock3 />
                <strong>Today</strong>
                <b>3</b>
              </span>
              <span className="guest-preview__metric guest-preview__metric--scheduled">
                <CalendarDays />
                <strong>Scheduled</strong>
                <b>5</b>
              </span>
              <span className="guest-preview__metric guest-preview__metric--all">
                <ListChecks />
                <strong>All tasks</strong>
                <b>8</b>
              </span>
            </div>
            <div className="guest-preview__tasks">
              <span><i />Plan the next release</span>
              <span><i />Review workspace access</span>
              <span className="is-complete"><CheckCircle2 />Update profile</span>
            </div>
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

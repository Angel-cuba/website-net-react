import { AuthPanel, useAuth } from "./features/auth";
import { TaskPanel } from "./features/tasks";
import "./styles/app.css";

function App() {
  const { isAuthenticated, token } = useAuth();

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Wapp2 API tester</p>
          <h1>Auth and task flow</h1>
        </div>
        <div className="session-panel">
          <span className={isAuthenticated ? "status-dot is-online" : "status-dot"} />
          <span>{isAuthenticated ? "Authenticated" : "Logged out"}</span>
        </div>
      </header>

      <section className="workspace-grid">
        <AuthPanel />
        <TaskPanel key={token || "guest"} />
      </section>
    </main>
  );
}

export default App;

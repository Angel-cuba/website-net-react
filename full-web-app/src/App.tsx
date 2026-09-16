import { AppProviders } from "./app/providers/app-providers";
import { AppRouter } from "./app/router/app-router";
import "./styles/layout.css";
import "./styles/app.css";
import "./styles/theme.css";

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;

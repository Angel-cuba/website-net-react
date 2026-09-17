import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const nextLabel = isDark ? "light" : "dark";

  return (
    <button
      aria-label={`Switch to ${nextLabel} theme`}
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${nextLabel} theme`}
      type="button"
    >
      {isDark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

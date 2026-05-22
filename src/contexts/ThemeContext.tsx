import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { Theme, ThemeContextValue } from "@/types/theme";

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "plc.theme";

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
    applyTheme(initial);
    setThemeState(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

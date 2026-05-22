import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { AuthContextValue, AuthUser } from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "plc.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, _password: string) => {
    // TODO: substituir pela chamada real à API de auth
    const next: AuthUser = { name: email.split("@")[0] || "Operador", email };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
    setUser(next);
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

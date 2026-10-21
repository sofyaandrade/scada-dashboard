import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import {
  clearAuthSession,
  loginWithBackend,
  persistAuthSession,
  readStoredAuthSession,
} from "@/services/authService";
import type { AuthContextValue, AuthSession } from "@/types/auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(readStoredAuthSession());
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await loginWithBackend(email, password);
    persistAuthSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        ready,
        accessToken: session?.accessToken ?? null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

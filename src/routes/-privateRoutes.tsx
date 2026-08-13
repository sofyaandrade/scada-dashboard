import { Navigate, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";

export function PrivateRoute() {
  const { ready, user } = useAuth();

  if (!ready) return null;
  return user ? <Outlet /> : <Navigate to="/login" />;
}

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { UserRegistrationPage } from "@/pages/UserRegistrationPage";
import { useAuth } from "@/hooks/useAuth";
import { canManageUsers } from "@/lib/permissions";

export const Route = createFileRoute("/_app/usuarios/cadastro")({
  component: UserRegistrationRoute,
});

function UserRegistrationRoute() {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!canManageUsers(user)) return <Navigate to="/dashboard" replace />;

  return <UserRegistrationPage />;
}

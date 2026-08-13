import { createFileRoute } from "@tanstack/react-router";
import { UserRegistrationPage } from "@/pages/UserRegistrationPage";

export const Route = createFileRoute("/_app/usuarios/cadastro")({
  component: UserRegistrationPage,
});

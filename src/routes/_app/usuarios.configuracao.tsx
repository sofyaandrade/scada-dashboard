import { createFileRoute } from "@tanstack/react-router";
import { UserSettingsPage } from "@/pages/UserSettingsPage";

export const Route = createFileRoute("/_app/usuarios/configuracao")({
  component: UserSettingsPage,
});

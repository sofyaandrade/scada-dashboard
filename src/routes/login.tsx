import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/pages/LoginPage";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar · PLC.Bridge" },
      { name: "description", content: "Acesso ao middleware de comunicação com CLPs em tempo real." },
    ],
  }),
  component: LoginPage,
});

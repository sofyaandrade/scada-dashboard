import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { ApiError, api } from "@/services/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserSettingsForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const initialForm: UserSettingsForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

function messageFromError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.message === "error.current.password") return "A senha atual esta incorreta.";
    if (error.message === "error.password.required") return "Informe a senha atual e a nova senha.";
    if (error.message === "error.hash.password") return "Nao foi possivel proteger a nova senha.";
    if (error.message === "error.update") return "Nao foi possivel atualizar a senha.";
    return error.message;
  }
  return "Nao foi possivel atualizar a senha.";
}

export function UserSettingsPage() {
  const [form, setForm] = useState<UserSettingsForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.currentPassword || !form.newPassword) {
      setError("Informe a senha atual e a nova senha.");
      setSuccess("");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("As senhas nao conferem.");
      setSuccess("");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("users/password/", {
        senhaAtual: form.currentPassword,
        senhaNova: form.newPassword,
      });

      setForm(initialForm);
      setSuccess("Senha atualizada com sucesso.");
    } catch (err) {
      console.error("[UserSettingsPage] troca de senha falhou:", err);
      setError(messageFromError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <header className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          configuracoes
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Configuracao de senha</h1>
      </header>

      <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
            <KeyRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-semibold">Alterar senha</h2>
            <p className="text-sm text-muted-foreground">
              Confirme sua senha atual antes de definir uma nova.
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={(event) => setForm({ ...form, currentPassword: event.target.value })}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={(event) => setForm({ ...form, newPassword: event.target.value })}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao atualizar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-5 border-status-online/40 text-status-online">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Senha alterada</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar senha
          </Button>
        </div>
      </form>
    </div>
  );
}

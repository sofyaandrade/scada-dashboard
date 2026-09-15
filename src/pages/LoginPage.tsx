import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Activity, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/theme-toggle";

export function LoginPage() {
  const { accessToken, user, ready, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && user && accessToken) navigate({ to: "/dashboard" });
  }, [accessToken, ready, user, navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute -top-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Activity className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-semibold tracking-tight">PLC.Bridge</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              middleware - tempo real - industrial
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className="rounded-xl border border-border bg-card/80 p-6 shadow-card backdrop-blur"
        >
          <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
            <h2 className="font-mono text-sm font-medium">Entrar no painel</h2>
            <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="status-dot status-online" /> sys ready
            </span>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="email" className="font-mono text-[11px] uppercase tracking-widest">
                E-mail ou usuário
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adm"
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="password" className="font-mono text-[11px] uppercase tracking-widest">
                Senha
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="pl-9 font-mono"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90"
            >
              {loading ? "Autenticando..." : "Acessar painel"}
            </Button>
          </div>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            Acesso restrito - sessão monitorada
          </p>
        </form>
      </div>
    </div>
  );
}

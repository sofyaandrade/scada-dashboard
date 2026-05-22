import { Link } from "@tanstack/react-router";
import { Activity, Cpu, Wifi, WifiOff, Loader2 } from "lucide-react";
import { usePlc } from "@/hooks/usePlc";
import type { ConnectionStatus } from "@/types/plc";

const ICONS: Record<ConnectionStatus, typeof Wifi> = {
  online: Wifi,
  offline: WifiOff,
  connecting: Loader2,
};

const LABELS: Record<ConnectionStatus, string> = {
  online: "Conectado",
  offline: "Offline",
  connecting: "Conectando",
};

export function DashboardPage() {
  const { plcs } = usePlc();
  const counts = plcs.reduce(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    {} as Record<ConnectionStatus, number>,
  );
  const totalTags = plcs.reduce((n, p) => n + p.tags.length, 0);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            visão geral
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Equipamentos</h1>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs">
          <Stat label="Online" value={counts.online ?? 0} color="text-status-online" />
          <Stat label="Conectando" value={counts.connecting ?? 0} color="text-status-connecting" />
          <Stat label="Offline" value={counts.offline ?? 0} color="text-status-offline" />
          <Stat label="Tags" value={totalTags} />
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plcs.map((p) => {
          const Icon = ICONS[p.status];
          const spinning = p.status === "connecting";
          return (
            <Link
              key={p.id}
              to="/plcs/$plcId"
              params={{ plcId: p.id }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition hover:border-primary/50 hover:shadow-glow"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-primary opacity-0 transition group-hover:opacity-100" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-semibold">{p.name}</h3>
                    <p className="font-mono text-[11px] text-muted-foreground">{p.protocol}</p>
                  </div>
                </div>
                <span className={`status-dot status-${p.status}`} />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 font-mono text-xs">
                <Field label="Endereço" value={`${p.ip}:${p.port}`} />
                <Field label="Tags" value={String(p.tags.length)} />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest ${
                  p.status === "online" ? "text-status-online"
                  : p.status === "connecting" ? "text-status-connecting"
                  : "text-status-offline"
                }`}>
                  <Icon className={`h-3.5 w-3.5 ${spinning ? "animate-spin" : ""}`} />
                  {LABELS[p.status]}
                </span>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, color = "text-foreground" }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-right">
      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate">{value}</div>
    </div>
  );
}

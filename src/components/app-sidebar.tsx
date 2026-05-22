import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Cpu, Loader2, LogOut, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePlc } from "@/hooks/usePlc";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConnectionStatus } from "@/types/plc";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  online: "Online",
  offline: "Offline",
  connecting: "Conectando",
};

export function StatusDot({ status }: { status: ConnectionStatus }) {
  return <span className={`status-dot status-${status}`} aria-label={STATUS_LABEL[status]} />;
}

interface PlcFormState {
  name: string;
  ip: string;
  port: number;
  typeClpId: number;
  idPlc: number;
  description: string;
}

const EMPTY_PLC: PlcFormState = {
  name: "",
  ip: "",
  port: 502,
  typeClpId: 0,
  idPlc: 1,
  description: "",
};

function AddPlcDialog() {
  const [open, setOpen] = useState(false);
  const { addPlc, typeClps } = usePlc();
  const [form, setForm] = useState<PlcFormState>(EMPTY_PLC);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && form.typeClpId === 0 && typeClps[0]) {
      setForm((current) => ({ ...current, typeClpId: typeClps[0].ID }));
    }
  }, [form.typeClpId, open, typeClps]);

  const submit = async () => {
    if (!form.name.trim() || !form.ip.trim()) {
      setError("Preencha nome e IP.");
      return;
    }
    if (!form.typeClpId) {
      setError("Selecione o tipo do CLP.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addPlc({
        ...form,
        name: form.name.trim(),
        ip: form.ip.trim(),
        description: form.description.trim() || undefined,
      });
      setOpen(false);
      setForm(EMPTY_PLC);
    } catch (err) {
      console.error("[AddPlcDialog] create falhou:", err);
      setError("Nao foi possivel cadastrar o CLP.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> Cadastrar CLP
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Novo CLP</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="CLP-Linha-02" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>IP</Label>
              <Input value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="192.168.1.20" />
            </div>
            <div className="grid gap-1.5">
              <Label>Porta</Label>
              <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: +e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>ID CLP</Label>
              <Input type="number" value={form.idPlc} onChange={(e) => setForm({ ...form, idPlc: +e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.typeClpId ? String(form.typeClpId) : ""}
                onValueChange={(v) => setForm({ ...form, typeClpId: Number(v) })}
                disabled={typeClps.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {typeClps.map((typeClp) => (
                    <SelectItem key={typeClp.ID} value={String(typeClp.ID)}>
                      {typeClp.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Descrição (opcional)</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        {error && <p className="px-6 text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppSidebar() {
  const { plcs } = usePlc();
  const { user, logout } = useAuth();
  const currentPath = useRouterState({ select: (r) => r.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-primary shadow-glow">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="font-mono text-sm font-semibold tracking-tight">PLC.Bridge</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              real-time middleware
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-widest">
            Equipamentos ({plcs.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {plcs.map((p) => {
                const url = `/plcs/${p.id}`;
                const active = currentPath === url;
                return (
                  <SidebarMenuItem key={p.id}>
                    <SidebarMenuButton asChild isActive={active} className="h-auto py-2">
                      <Link to="/plcs/$plcId" params={{ plcId: p.id }}>
                        <Cpu className="h-4 w-4 shrink-0" />
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 group-data-[collapsible=icon]:hidden">
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium">{p.name}</span>
                            <span className="truncate text-[11px] text-muted-foreground font-mono">
                              {p.ip}:{p.port}
                            </span>
                          </div>
                          <StatusDot status={p.status} />
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent className="px-2 group-data-[collapsible=icon]:hidden">
            <AddPlcDialog />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
            <User className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-medium">{user?.name ?? "Convidado"}</span>
            <span className="truncate text-[11px] text-muted-foreground">{user?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-8 w-8 group-data-[collapsible=icon]:hidden"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

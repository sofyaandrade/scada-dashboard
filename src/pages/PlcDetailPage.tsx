import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Cpu,
  Wifi,
  WifiOff,
  Loader2,
  Power,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlc } from "@/hooks/usePlc";
import type { ConnectionStatus, Tag, TagDataType } from "@/types/plc";

const STATUS_META: Record<ConnectionStatus, { label: string; cls: string; Icon: typeof Wifi }> = {
  online: { label: "Conectado", cls: "text-status-online", Icon: Wifi },
  offline: { label: "Offline", cls: "text-status-offline", Icon: WifiOff },
  connecting: { label: "Conectando", cls: "text-status-connecting", Icon: Loader2 },
};

interface PlcDetailPageProps {
  plcId: string;
}

export function PlcDetailPage({ plcId }: PlcDetailPageProps) {
  const { plcs, removePlc, setStatus } = usePlc();
  const plc = plcs.find((p) => p.id === plcId);

  if (!plc) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">CLP não encontrado.</p>
        <Link to="/dashboard" className="mt-4 inline-block text-primary underline">
          Voltar
        </Link>
      </div>
    );
  }

  const meta = STATUS_META[plc.status];
  const Icon = meta.Icon;

  return (
    <div className="mx-auto max-w-7xl p-6">
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Equipamentos
      </Link>

      <div className="mb-6 rounded-xl border border-border bg-gradient-surface p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight">{plc.name}</h1>
                <span className={`status-dot status-${plc.status}`} />
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {plc.protocol} · {plc.ip}:{plc.port}
              </p>
              {plc.description && (
                <p className="mt-2 text-sm text-muted-foreground">{plc.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 font-mono text-xs ${meta.cls}`}>
              <Icon className={`h-4 w-4 ${plc.status === "connecting" ? "animate-spin" : ""}`} />
              {meta.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setStatus(plc.id, plc.status === "online" ? "offline" : "connecting")
              }
            >
              <Power className="mr-1.5 h-3.5 w-3.5" />
              {plc.status === "online" ? "Desconectar" : "Conectar"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => removePlc(plc.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Tags ({plc.tags.length})
        </h2>
        <AddTagDialog plcId={plc.id} />
      </div>

      {plc.tags.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Nenhuma tag cadastrada. Adicione tags para monitorar valores em tempo real.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plc.tags.map((t) => (
            <TagCard key={t.id} plcId={plc.id} tag={t} live={plc.status === "online"} />
          ))}
        </div>
      )}
    </div>
  );
}

interface TagCardProps {
  plcId: string;
  tag: Tag;
  live: boolean;
}

function TagCard({ plcId, tag, live }: TagCardProps) {
  const { removeTag } = usePlc();
  const lastValueRef = useRef(tag.value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (tag.value !== lastValueRef.current) {
      lastValueRef.current = tag.value;
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 450);
      return () => clearTimeout(id);
    }
  }, [tag.value]);

  const formatted =
    tag.type === "bool"
      ? tag.value
        ? "TRUE"
        : "FALSE"
      : tag.type === "float"
        ? (tag.value as number).toFixed(2)
        : String(tag.value);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-card transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-medium">{tag.name}</h3>
          <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {tag.address} · {tag.type}
          </p>
        </div>
        <button
          onClick={() => removeTag(plcId, tag.id)}
          className="opacity-0 transition group-hover:opacity-100"
          aria-label="Remover"
        >
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
        </button>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span
          key={String(tag.lastUpdate)}
          className={`font-mono text-3xl font-semibold tabular-nums ${
            !live ? "text-muted-foreground" : flash ? "tag-tick text-primary" : "text-foreground"
          } ${tag.type === "bool" && tag.value ? "text-status-online" : ""}`}
        >
          {live ? formatted : "—"}
        </span>
        {tag.unit && live && (
          <span className="font-mono text-xs text-muted-foreground">{tag.unit}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 font-mono text-[10px] text-muted-foreground">
        <span>{live ? "live" : "stale"}</span>
        <span>{new Date(tag.lastUpdate).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}

interface TagFormState {
  name: string;
  address: string;
  type: TagDataType;
  unit: string;
}

const EMPTY_TAG: TagFormState = { name: "", address: "", type: "float", unit: "" };

function AddTagDialog({ plcId }: { plcId: string }) {
  const [open, setOpen] = useState(false);
  const { addTag } = usePlc();
  const [form, setForm] = useState<TagFormState>(EMPTY_TAG);

  const submit = () => {
    if (!form.name || !form.address) return;
    addTag(plcId, {
      name: form.name,
      address: form.address,
      type: form.type,
      unit: form.unit || undefined,
    });
    setOpen(false);
    setForm(EMPTY_TAG);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> Nova tag
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Cadastrar tag</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Temperatura_Forno" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="%MW200" />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as TagDataType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bool">Bool</SelectItem>
                  <SelectItem value="int">Int</SelectItem>
                  <SelectItem value="float">Float</SelectItem>
                  <SelectItem value="string">String</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Unidade (opcional)</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="°C, bar, rpm..." />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit}>Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

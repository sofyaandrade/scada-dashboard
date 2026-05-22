import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Cpu,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  Wifi,
  WifiOff,
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
import type { ConnectionStatus, NewPlcInput, NewTagInput, PLC, Tag } from "@/types/plc";

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
  const [deletingPlc, setDeletingPlc] = useState(false);
  const [plcError, setPlcError] = useState("");
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

  const handleRemovePlc = async () => {
    setDeletingPlc(true);
    setPlcError("");

    try {
      await removePlc(plc.id);
    } catch (err) {
      console.error("[PlcDetailPage] delete CLP falhou:", err);
      setPlcError("Nao foi possivel excluir o CLP.");
    } finally {
      setDeletingPlc(false);
    }
  };

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
            <EditPlcDialog plc={plc} />
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deletingPlc}
              onClick={handleRemovePlc}
            >
              {deletingPlc ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {plcError && <p className="mt-4 text-xs text-destructive">{plcError}</p>}
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

function formFromPlc(plc: PLC): NewPlcInput {
  return {
    name: plc.name,
    ip: plc.ip,
    port: plc.port,
    typeClpId: plc.typeClpId,
    idPlc: plc.idPlc,
    description: plc.description,
  };
}

function EditPlcDialog({ plc }: { plc: PLC }) {
  const { updatePlc, typeClps } = usePlc();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<NewPlcInput>(() => formFromPlc(plc));

  useEffect(() => {
    if (open) {
      setForm(formFromPlc(plc));
      setError("");
    }
  }, [open, plc]);

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
      await updatePlc(plc.id, {
        ...form,
        name: form.name.trim(),
        ip: form.ip.trim(),
        description: form.description?.trim() || undefined,
      });
      setOpen(false);
    } catch (err) {
      console.error("[EditPlcDialog] update falhou:", err);
      setError("Nao foi possivel salvar o CLP.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Editar CLP</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="CLP-Linha-02"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>IP</Label>
              <Input
                value={form.ip}
                onChange={(e) => setForm({ ...form, ip: e.target.value })}
                placeholder="192.168.1.20"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Porta</Label>
              <Input
                type="number"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>ID CLP</Label>
              <Input
                type="number"
                value={form.idPlc}
                onChange={(e) => setForm({ ...form, idPlc: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.typeClpId ? String(form.typeClpId) : ""}
                onValueChange={(value) => setForm({ ...form, typeClpId: Number(value) })}
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
            <Label>Descricao (opcional)</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TagCard({ plcId, tag, live }: TagCardProps) {
  const { removeTag } = usePlc();
  const lastValueRef = useRef(tag?.value);
  const [flash, setFlash] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (tag?.value !== lastValueRef.current) {
      lastValueRef.current = tag?.value;
      setFlash(true);
      const id = setTimeout(() => setFlash(false), 450);
      return () => clearTimeout(id);
    }
  }, [tag?.value]);

  const formatted =
    tag.type === "bool"
      ? tag?.value
        ? "TRUE"
        : "FALSE"
      : tag.type === "float"
        ? (tag?.value as number)
        : String(tag?.value);

  const handleRemove = async () => {
    setDeleting(true);
    setError("");

    try {
      await removeTag(plcId, tag.id);
    } catch (err) {
      console.error("[TagCard] delete falhou:", err);
      setError("Nao foi possivel excluir.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-card transition hover:border-primary/40">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-sm font-medium">{tag.name}</h3>
          <p className="truncate font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {tag.address} - {tag.typeOption?.description ?? tag.type}
          </p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <EditTagDialog plcId={plcId} tag={tag} />
          <button onClick={handleRemove} disabled={deleting} aria-label="Remover">
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span
          key={String(tag.lastUpdate)}
          className={`font-mono text-3xl font-semibold tabular-nums ${
            !live ? "text-muted-foreground" : flash ? "tag-tick text-primary" : "text-foreground"
          } ${tag?.type === "bool" && tag?.value ? "text-status-online" : ""}`}
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
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

interface TagFormState {
  name: string;
  typeId: number;
  swapId: number;
  operationId: number;
  offset: number;
  unit: string;
}

const EMPTY_TAG: TagFormState = {
  name: "",
  typeId: 0,
  swapId: 0,
  operationId: 0,
  offset: 0,
  unit: "",
};

function formFromTag(tag: Tag): TagFormState {
  return {
    name: tag.name,
    typeId: tag.typeId,
    swapId: tag.swapId,
    operationId: tag.operationId,
    offset: tag.offset,
    unit: tag.unit ?? "",
  };
}

function withDefaultTagOptions(
  form: TagFormState,
  typeTags: Array<{ ID: number }>,
  swaps: Array<{ ID: number }>,
  typeOperations: Array<{ ID: number }>,
) {
  return {
    ...form,
    typeId: form.typeId || typeTags[0]?.ID || 0,
    swapId: form.swapId || swaps[0]?.ID || 0,
    operationId: form.operationId || typeOperations[0]?.ID || 0,
  };
}

function EditTagDialog({ plcId, tag }: { plcId: string; tag: Tag }) {
  const { updateTag, typeTags, swaps, typeOperations } = usePlc();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<TagFormState>(() => formFromTag(tag));

  useEffect(() => {
    if (open) {
      setForm(withDefaultTagOptions(formFromTag(tag), typeTags, swaps, typeOperations));
      setError("");
    }
  }, [open, swaps, tag, typeOperations, typeTags]);

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Preencha o nome.");
      return;
    }
    if (!form.typeId || !form.swapId || !form.operationId) {
      setError("Selecione tipo, swap e operacao.");
      return;
    }

    const nextTag = {
      name: form.name.trim(),
      typeId: form.typeId,
      swapId: form.swapId,
      operationId: form.operationId,
      offset: form.offset,
      unit: form.unit.trim() || undefined,
    };

    setSaving(true);
    setError("");

    try {
      await updateTag(plcId, tag.id, nextTag);
      setOpen(false);
    } catch (err) {
      console.error("[EditTagDialog] update falhou:", err);
      setError("Nao foi possivel salvar a tag.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button aria-label="Editar">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-mono">Editar tag</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nome</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Temperatura_Forno"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Offset</Label>
              <Input
                type="number"
                value={form.offset}
                onChange={(e) => setForm({ ...form, offset: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.typeId ? String(form.typeId) : ""}
                onValueChange={(v) => setForm({ ...form, typeId: Number(v) })}
                disabled={typeTags.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {typeTags.map((typeTag) => (
                    <SelectItem key={typeTag.ID} value={String(typeTag.ID)}>
                      {typeTag.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Swap</Label>
              <Select
                value={form.swapId ? String(form.swapId) : ""}
                onValueChange={(v) => setForm({ ...form, swapId: Number(v) })}
                disabled={swaps.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {swaps.map((swap) => (
                    <SelectItem key={swap.ID} value={String(swap.ID)}>
                      {swap.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Operacao</Label>
              <Select
                value={form.operationId ? String(form.operationId) : ""}
                onValueChange={(v) => setForm({ ...form, operationId: Number(v) })}
                disabled={typeOperations.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {typeOperations.map((operation) => (
                    <SelectItem key={operation.ID} value={operation.description}>
                      {operation.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Unidade (opcional)</Label>
            <Input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="C, bar, rpm..."
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddTagDialog({ plcId }: { plcId: string }) {
  const [open, setOpen] = useState(false);
  const { addTag, typeTags, swaps, typeOperations } = usePlc();
  const [form, setForm] = useState<TagFormState>(EMPTY_TAG);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm((current) => withDefaultTagOptions(current, typeTags, swaps, typeOperations));
    }
  }, [open, swaps, typeOperations, typeTags]);

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Preencha o nome.");
      return;
    }
    if (!form.typeId || !form.swapId || !form.operationId) {
      setError("Selecione tipo, swap e operacao.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await addTag(plcId, {
        name: form.name.trim(),
        typeId: form.typeId,
        swapId: form.swapId,
        operationId: form.operationId,
        offset: form.offset,
        unit: form.unit.trim() || undefined,
      });
      setOpen(false);
      setForm(EMPTY_TAG);
    } catch (err) {
      console.error("[AddTagDialog] create falhou:", err);
      setError("Nao foi possivel cadastrar a tag.");
    } finally {
      setSaving(false);
    }
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
              <Label>Offset</Label>
              <Input type="number" value={form.offset} onChange={(e) => setForm({ ...form, offset: Number(e.target.value) })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select
                value={form.typeId ? String(form.typeId) : ""}
                onValueChange={(v) => setForm({ ...form, typeId: Number(v) })}
                disabled={typeTags.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {typeTags.map((typeTag) => (
                    <SelectItem key={typeTag.ID} value={String(typeTag.ID)}>
                      {typeTag.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Swap</Label>
              <Select
                value={form.swapId ? String(form.swapId) : ""}
                onValueChange={(v) => setForm({ ...form, swapId: Number(v) })}
                disabled={swaps.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {swaps.map((swap) => (
                    <SelectItem key={swap.ID} value={String(swap.ID)}>
                      {swap.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Operacao</Label>
              <Select
                value={form.operationId ? String(form.operationId) : ""}
                onValueChange={(v) => setForm({ ...form, operationId: Number(v) })}
                disabled={typeOperations.length === 0}
              >
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {typeOperations.map((operation) => (
                    <SelectItem key={operation.ID} value={String(operation.ID)}>
                      {operation.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Unidade (opcional)</Label>
            <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="°C, bar, rpm..." />
          </div>
        </div>
        {error && <p className="px-6 text-xs text-destructive">{error}</p>}
        <DialogFooter>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchTags } from "@/services/plcApi";
import type {
  ConnectionStatus,
  NewPlcInput,
  NewTagInput,
  PLC,
  Tag,
  TagValue,
} from "@/types/plc";

export interface PlcContextValue {
  plcs: PLC[];
  addPlc: (input: NewPlcInput) => void;
  removePlc: (id: string) => void;
  setStatus: (id: string, status: ConnectionStatus) => void;
  addTag: (plcId: string, tag: NewTagInput) => void;
  removeTag: (plcId: string, tagId: string) => void;
  refresh: () => Promise<void>;
}

export const PlcContext = createContext<PlcContextValue | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);

function defaultValueFor(type: NewTagInput["type"]): TagValue {
  if (type === "bool") return false;
  if (type === "string") return "";
  return 0;
}

export function PlcProvider({ children }: { children: ReactNode }) {
  const [plcs, setPlcs] = useState<PLC[]>([]);
  // Mantém a versão mais recente para o intervalo sem recriar timers.
  const plcsRef = useRef<PLC[]>(plcs);
  useEffect(() => {
    plcsRef.current = plcs;
  }, [plcs]);

  const addPlc = useCallback((input: NewPlcInput) => {
    setPlcs((prev) => [
      ...prev,
      { ...input, id: uid(), status: "connecting", tags: [] },
    ]);
  }, []);

  const removePlc = useCallback((id: string) => {
    setPlcs((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const setStatus = useCallback((id: string, status: ConnectionStatus) => {
    setPlcs((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const addTag = useCallback((plcId: string, tag: NewTagInput) => {
    setPlcs((prev) =>
      prev.map((p) =>
        p.id === plcId
          ? {
              ...p,
              tags: [
                ...p.tags,
                {
                  ...tag,
                  id: uid(),
                  value: defaultValueFor(tag.type),
                  lastUpdate: Date.now(),
                } satisfies Tag,
              ],
            }
          : p,
      ),
    );
  }, []);

  const removeTag = useCallback((plcId: string, tagId: string) => {
    setPlcs((prev) =>
      prev.map((p) =>
        p.id === plcId ? { ...p, tags: p.tags.filter((t) => t.id !== tagId) } : p,
      ),
    );
  }, []);

  const refresh = useCallback(async () => {
    try {
      const payload = await fetchTags();
      const incoming = new Map(payload.plcs.map((p) => [p.id, p]));
      const now = Date.now();
      setPlcs((prev) =>
        prev.map((p) => {
          const upd = incoming.get(p.id);
          if (!upd) return { ...p, status: "offline" };
          const tagMap = new Map((upd.tags ?? []).map((t) => [t.id, t.value]));
          return {
            ...p,
            status: upd.status ?? p.status,
            tags: p.tags.map((t) =>
              tagMap.has(t.id)
                ? { ...t, value: tagMap.get(t.id) as TagValue, lastUpdate: now }
                : t,
            ),
          };
        }),
      );
    } catch (err) {
      console.error("[PlcContext] refresh falhou:", err);
      setPlcs((prev) => prev.map((p) => ({ ...p, status: "offline" })));
    }
  }, []);

  // Poll 1Hz contra o backend.
  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const value = useMemo<PlcContextValue>(
    () => ({ plcs, addPlc, removePlc, setStatus, addTag, removeTag, refresh }),
    [plcs, addPlc, removePlc, setStatus, addTag, removeTag, refresh],
  );

  return <PlcContext.Provider value={value}>{children}</PlcContext.Provider>;
}

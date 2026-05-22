import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type IClp from "@/interface/IClp/IClp";
import type ITypeClp from "@/interface/IClp/ITypeClp";
import type ITypeOperation from "@/interface/ITag/IAreaModbus";
import type ITag from "@/interface/ITag/ITag";
import type ISwap from "@/interface/ITag/ISwap";
import type ITypeTag from "@/interface/ITag/ITypeTag";
import { useAppDispatch } from "@/store/hooks";
import { addClp, deleteClp, getClps, readStatusClps, updateClp } from "@/services/clpService";
import { addTags, deleteTag, readTagsRealTime, updateTags } from "@/services/tagsService";
import { getSwap } from "@/services/swapService";
import { getTypeClp } from "@/services/typeClpService";
import { getTypeOperation } from "@/services/typeOperationService";
import { getTypeTag } from "@/services/typeTagService";
import type {
  ConnectionStatus,
  NewPlcInput,
  NewTagInput,
  PLC,
  Tag,
  TagDataType,
  TagValue,
} from "@/types/plc";

export interface PlcContextValue {
  plcs: PLC[];
  typeClps: ITypeClp[];
  typeTags: ITypeTag[];
  swaps: ISwap[];
  typeOperations: ITypeOperation[];
  addPlc: (input: NewPlcInput) => Promise<void>;
  updatePlc: (id: string, input: NewPlcInput) => Promise<void>;
  removePlc: (id: string) => Promise<void>;
  setStatus: (id: string, status: ConnectionStatus) => void;
  addTag: (plcId: string, tag: NewTagInput) => Promise<void>;
  updateTag: (plcId: string, tagId: string, tag: NewTagInput) => Promise<void>;
  removeTag: (plcId: string, tagId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

type RealTimePayload = Record<string, Record<string, TagValue>>;
type StatusPayload = Record<string, boolean>;

export const PlcContext = createContext<PlcContextValue | null>(null);

function defaultValueFor(type?: string): TagValue {
  const normalized = type?.toLowerCase() ?? "";
  if (normalized.includes("bool") || normalized.includes("coil")) return false;
  if (normalized.includes("string") || normalized.includes("texto")) return "";
  return 0;
}

function protocolFromClp(clp: IClp): string {
  return clp.type_clp?.description?.trim() || `Tipo ${clp.type_clp_id}`;
}

function tagTypeFromDescription(description?: string): TagDataType {
  const normalized = description?.toLowerCase() ?? "";

  if (normalized.includes("bool") || normalized.includes("coil")) return "bool";
  if (normalized.includes("string") || normalized.includes("texto")) return "string";
  if (normalized.includes("float") || normalized.includes("real")) return "float";

  return "int";
}

function formatTagAddress(tag: ITag): string {
  const area = tag.operation_type?.description?.trim();
  const offset = Number.isFinite(tag.offset) ? tag.offset : 0;

  return area ? `${area} ${offset}` : String(offset);
}

function valueForTag(tag: ITag, realtimeByClp?: Record<string, TagValue>): TagValue {
  const value = realtimeByClp?.[String(tag.ID)];
  if (value !== undefined && value !== null) return value;

  return defaultValueFor(tag.type?.description);
}

function mapTag(tag: ITag, realtimeByClp?: Record<string, TagValue>, now = Date.now()): Tag {
  const type = tagTypeFromDescription(tag.type?.description);

  return {
    id: String(tag.ID),
    name: tag.description || `Tag ${tag.ID}`,
    address: formatTagAddress(tag),
    type,
    typeId: tag.type_id,
    swapId: tag.swap_id,
    operationId: tag.operation_id,
    consumerId: tag.consumer_id,
    offset: tag.offset,
    typeOption: tag.type,
    swap: tag.swap,
    operationType: tag.operation_type,
    value: valueForTag(tag, realtimeByClp),
    lastUpdate: now,
    backendTag: tag,
  };
}

function mapClp(clp: IClp, realtime: RealTimePayload, statuses: StatusPayload, now = Date.now()): PLC {
  const id = String(clp.ID);
  const realtimeByClp = realtime[id];
  const hasRealtime = realtimeByClp !== undefined;
  const status = statuses[id] ?? hasRealtime;

  return {
    id,
    name: clp.description || `CLP ${clp.ID}`,
    ip: clp.ip || "0.0.0.0",
    port: clp.port || 0,
    protocol: protocolFromClp(clp),
    typeClpId: clp.type_clp_id,
    idPlc: clp.id_plc,
    typeClp: clp.type_clp,
    status: status ? "online" : "offline",
    description: clp.description,
    tags: (clp.tags ?? []).map((tag) => mapTag(tag, realtimeByClp, now)),
    backendClp: clp,
  };
}

function normalizeList<T>(payload: unknown): T[] {
  return Array.isArray(payload) ? (payload as T[]) : [];
}

function normalizeClps(payload: unknown): IClp[] {
  return Array.isArray(payload) ? (payload as IClp[]) : [];
}

function normalizeRealTime(payload: unknown): RealTimePayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as RealTimePayload;
}

function normalizeStatuses(payload: unknown): StatusPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
  return payload as StatusPayload;
}

function findById<T extends { ID: number }>(items: T[], id: number): T | undefined {
  return items.find((item) => item.ID === id);
}

function emptyTypeClp(id: number): ITypeClp {
  return { ID: id, description: "" };
}

function clpInputToBackend(input: NewPlcInput, typeClps: ITypeClp[]): IClp {
  const typeClp = findById(typeClps, input.typeClpId) ?? emptyTypeClp(input.typeClpId);

  return {
    ID: 0,
    description: input.name || input.description || "CLP",
    ip: input.ip,
    type_clp_id: input.typeClpId,
    type_clp: typeClp,
    port: input.port,
    id_plc: input.idPlc,
    tags: [],
  };
}

function mergePlcInput(plc: PLC | undefined, input: NewPlcInput, typeClps: ITypeClp[]): IClp {
  const typeClp = findById(typeClps, input.typeClpId) ?? plc?.backendClp?.type_clp ?? emptyTypeClp(input.typeClpId);

  return {
    ...(plc?.backendClp ?? clpInputToBackend(input, typeClps)),
    ID: Number(plc?.id ?? plc?.backendClp?.ID ?? 0),
    description: input.name || input.description || plc?.name || "CLP",
    ip: input.ip,
    port: input.port,
    type_clp_id: input.typeClpId,
    type_clp: typeClp,
    id_plc: input.idPlc,
    tags: plc?.backendClp?.tags ?? [],
  };
}

function clpFallback(plc: PLC | undefined): IClp {
  const typeClp = plc?.typeClp ?? emptyTypeClp(plc?.typeClpId ?? 0);

  return {
    ID: Number(plc?.id ?? 0),
    description: plc?.name ?? "CLP",
    ip: plc?.ip ?? "",
    type_clp_id: plc?.typeClpId ?? 0,
    type_clp: typeClp,
    port: plc?.port ?? 0,
    id_plc: plc?.idPlc ?? 0,
    tags: [],
  };
}

function tagInputToBackend(
  plc: PLC | undefined,
  input: NewTagInput,
  typeTags: ITypeTag[],
  swaps: ISwap[],
  typeOperations: ITypeOperation[],
): ITag {
  const backendClp = plc?.backendClp;
  const type = findById(typeTags, input.typeId) ?? { ID: input.typeId, description: "" };
  const swap = findById(swaps, input.swapId) ?? { ID: input.swapId, description: "" };
  const operationType = findById(typeOperations, input.operationId) ?? {
    ID: input.operationId,
    description: "",
  };

  return {
    ID: 0,
    description: input.name,
    consumer_id: backendClp?.type_clp_id ?? plc?.typeClpId ?? 0,
    type_id: input.typeId,
    type,
    swap_id: input.swapId,
    swap,
    operation_id: input.operationId,
    operation_type: operationType,
    offset: input.offset,
    id_clp: Number(plc?.id ?? 0),
    CLP: backendClp ?? clpFallback(plc),
  };
}

function mergeTagInput(
  plc: PLC | undefined,
  tag: Tag | undefined,
  input: NewTagInput,
  typeTags: ITypeTag[],
  swaps: ISwap[],
  typeOperations: ITypeOperation[],
): ITag {
  const nextTag = tagInputToBackend(plc, input, typeTags, swaps, typeOperations);

  return {
    ...nextTag,
    ...(tag?.backendTag ?? {}),
    ID: Number(tag?.id ?? tag?.backendTag?.ID ?? 0),
    description: input.name,
    consumer_id: nextTag.consumer_id,
    type_id: input.typeId,
    type: nextTag.type,
    swap_id: input.swapId,
    swap: nextTag.swap,
    operation_id: input.operationId,
    operation_type: nextTag.operation_type,
    offset: input.offset,
    id_clp: Number(plc?.id ?? tag?.backendTag?.id_clp ?? 0),
    CLP: plc?.backendClp ?? tag?.backendTag?.CLP ?? nextTag.CLP,
  };
}

export function PlcProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const [plcs, setPlcs] = useState<PLC[]>([]);
  const [typeClps, setTypeClps] = useState<ITypeClp[]>([]);
  const [typeTags, setTypeTags] = useState<ITypeTag[]>([]);
  const [swaps, setSwaps] = useState<ISwap[]>([]);
  const [typeOperations, setTypeOperations] = useState<ITypeOperation[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const [typeClpsResponse, typeTagsResponse, swapsResponse, typeOperationsResponse] =
        await Promise.all([
          dispatch(getTypeClp()),
          dispatch(getTypeTag()),
          dispatch(getSwap()),
          dispatch(getTypeOperation()),
        ]);

      setTypeClps(normalizeList<ITypeClp>(typeClpsResponse.payload));
      setTypeTags(normalizeList<ITypeTag>(typeTagsResponse.payload));
      setSwaps(normalizeList<ISwap>(swapsResponse.payload));
      setTypeOperations(normalizeList<ITypeOperation>(typeOperationsResponse.payload));
    } catch (err) {
      console.error("[PlcContext] load options falhou:", err);
    }
  }, [dispatch]);

  const refresh = useCallback(async () => {
    try {
      const [clpsResponse, realTimeResponse, statusResponse] = await Promise.all([
        dispatch(getClps()),
        dispatch(readTagsRealTime()),
        dispatch(readStatusClps()),
      ]);

      const clps = normalizeClps(clpsResponse.payload);
      const realtime = normalizeRealTime(realTimeResponse.payload);
      const statuses = normalizeStatuses(statusResponse.payload);
      const now = Date.now();

      setPlcs(clps.map((clp) => mapClp(clp, realtime, statuses, now)));
    } catch (err) {
      console.error("[PlcContext] refresh falhou:", err);
      setPlcs((prev) => prev.map((p) => ({ ...p, status: "offline" })));
    }
  }, [dispatch]);

  const addPlc = useCallback(async (input: NewPlcInput) => {
    await dispatch(addClp(clpInputToBackend(input, typeClps))).unwrap();
    await refresh();
  }, [dispatch, refresh, typeClps]);

  const updatePlc = useCallback(async (id: string, input: NewPlcInput) => {
    const plc = plcs.find((p) => p.id === id);
    await dispatch(updateClp(mergePlcInput(plc, input, typeClps))).unwrap();
    await refresh();
  }, [dispatch, plcs, refresh, typeClps]);

  const removePlc = useCallback(async (id: string) => {
    await dispatch(deleteClp(Number(id))).unwrap();
    await refresh();
  }, [dispatch, refresh]);

  const setStatus = useCallback((id: string, status: ConnectionStatus) => {
    setPlcs((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const addTag = useCallback(async (plcId: string, tag: NewTagInput) => {
    const plc = plcs.find((p) => p.id === plcId);
    await dispatch(addTags(tagInputToBackend(plc, tag, typeTags, swaps, typeOperations))).unwrap();
    await refresh();
  }, [dispatch, plcs, refresh, swaps, typeOperations, typeTags]);

  const updateTag = useCallback(async (plcId: string, tagId: string, tag: NewTagInput) => {
    const plc = plcs.find((p) => p.id === plcId);
    const currentTag = plc?.tags.find((t) => t.id === tagId);
    await dispatch(updateTags(mergeTagInput(plc, currentTag, tag, typeTags, swaps, typeOperations))).unwrap();
    await refresh();
  }, [dispatch, plcs, refresh, swaps, typeOperations, typeTags]);

  const removeTag = useCallback(async (plcId: string, tagId: string) => {
    await dispatch(deleteTag(Number(tagId))).unwrap();
    await refresh();
  }, [dispatch, refresh]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const value = useMemo<PlcContextValue>(
    () => ({
      plcs,
      typeClps,
      typeTags,
      swaps,
      typeOperations,
      addPlc,
      updatePlc,
      removePlc,
      setStatus,
      addTag,
      updateTag,
      removeTag,
      refresh,
    }),
    [
      plcs,
      typeClps,
      typeTags,
      swaps,
      typeOperations,
      addPlc,
      updatePlc,
      removePlc,
      setStatus,
      addTag,
      updateTag,
      removeTag,
      refresh,
    ],
  );

  return <PlcContext.Provider value={value}>{children}</PlcContext.Provider>;
}

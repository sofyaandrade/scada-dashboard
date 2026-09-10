import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type IClp from "@/interface/IClp/IClp";
import type ITypeClp from "@/interface/IClp/ITypeClp";
import type ITypeOperation from "@/interface/ITag/IAreaModbus";
import type ITag from "@/interface/ITag/ITag";
import type ISwap from "@/interface/ITag/ISwap";
import type ITypeTag from "@/interface/ITag/ITypeTag";
import { useAuth } from "@/hooks/useAuth";
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

type RealTimeTagSnapshot =
  | TagValue
  | {
      value?: unknown;
      quality?: unknown;
      last_successful_read?: unknown;
      last_successful_read_unix_nano?: unknown;
    };
type RealTimePayload = Record<string, Record<string, RealTimeTagSnapshot>>;
type StatusPayload = Record<string, boolean>;
type BackendEntity = {
  ID?: number | string;
  id?: number | string;
};
type BackendDescription = {
  description?: string;
  Description?: string;
};

export const PlcContext = createContext<PlcContextValue | null>(null);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function numberFrom(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const next = Number(value);
    if (Number.isFinite(next)) return next;
  }
  return fallback;
}

function entityId(entity?: BackendEntity | null): number {
  return numberFrom(entity?.ID ?? entity?.id);
}

function descriptionFrom(item?: BackendDescription | null): string {
  return item?.description?.trim() || item?.Description?.trim() || "";
}

function isTagValue(value: unknown): value is TagValue {
  return ["number", "boolean", "string"].includes(typeof value);
}

function defaultValueFor(type?: string): TagValue {
  const normalized = type?.toLowerCase() ?? "";
  if (normalized.includes("bool") || normalized.includes("coil")) return false;
  if (normalized.includes("string") || normalized.includes("texto")) return "";
  return 0;
}

function valueFromRealtime(entry: RealTimeTagSnapshot | undefined, fallback: TagValue): TagValue {
  const value = isObject(entry) && "value" in entry ? entry.value : entry;
  return isTagValue(value) ? value : fallback;
}

function timestampFromRealtime(entry: RealTimeTagSnapshot | undefined, fallback: number): number {
  if (!isObject(entry)) return fallback;

  const readAt = entry.last_successful_read;
  if (typeof readAt === "string" && readAt.trim() && !readAt.startsWith("0001-01-01")) {
    const timestamp = Date.parse(readAt);
    if (Number.isFinite(timestamp)) return timestamp;
  }

  const unixNano = entry.last_successful_read_unix_nano;
  if (typeof unixNano === "string" && unixNano.trim()) {
    const timestamp = Number(unixNano) / 1_000_000;
    if (Number.isFinite(timestamp) && timestamp > 0) return timestamp;
  }

  return fallback;
}

function protocolFromClp(clp: IClp): string {
  return descriptionFrom(clp.type_clp) || `Tipo ${clp.type_clp_id}`;
}

function tagTypeFromDescription(description?: string): TagDataType {
  const normalized = description?.toLowerCase() ?? "";

  if (normalized.includes("bool") || normalized.includes("coil")) return "bool";
  if (normalized.includes("string") || normalized.includes("texto")) return "string";
  if (normalized.includes("float") || normalized.includes("real")) return "float";

  return "int";
}

function formatTagAddress(tag: ITag): string {
  const area = descriptionFrom(tag.operation_type);
  const offset = numberFrom(tag.offset);

  return area ? `${area} ${offset}` : String(offset);
}

function valueForTag(
  tag: ITag,
  realtimeByClp?: Record<string, RealTimeTagSnapshot>,
  fallback?: TagValue,
): TagValue {
  const tagId = entityId(tag);
  const value = valueFromRealtime(realtimeByClp?.[String(tagId)], fallback ?? defaultValueFor());
  if (value !== undefined && value !== null) return value;

  return defaultValueFor(descriptionFrom(tag.type));
}

function mapTag(
  tag: ITag,
  realtimeByClp?: Record<string, RealTimeTagSnapshot>,
  now = Date.now(),
): Tag {
  const tagId = entityId(tag);
  const typeId = numberFrom(tag.type_id, entityId(tag.type));
  const swapId = numberFrom(tag.swap_id, entityId(tag.swap));
  const operationId = numberFrom(tag.operation_id, entityId(tag.operation_type));
  const typeDescription = descriptionFrom(tag.type);
  const type = tagTypeFromDescription(typeDescription);
  const fallbackValue = defaultValueFor(typeDescription);
  const realtimeEntry = realtimeByClp?.[String(tagId)];

  return {
    id: String(tagId),
    name: descriptionFrom(tag) || `Tag ${tagId}`,
    address: formatTagAddress(tag),
    type,
    typeId,
    swapId,
    operationId,
    consumerId: numberFrom(tag.consumer_id),
    offset: numberFrom(tag.offset),
    typeOption: tag.type,
    swap: tag.swap,
    operationType: tag.operation_type,
    value: valueForTag(tag, realtimeByClp, fallbackValue),
    lastUpdate: timestampFromRealtime(realtimeEntry, now),
    backendTag: tag,
  };
}

function mapClp(
  clp: IClp,
  realtime: RealTimePayload,
  statuses: StatusPayload,
  now = Date.now(),
): PLC {
  const numericId = entityId(clp);
  const id = String(numericId);
  const realtimeByClp = realtime[id];
  const hasRealtime = realtimeByClp !== undefined;
  const status = statuses[id] ?? hasRealtime;
  const tags = Array.isArray(clp.tags) ? clp.tags.filter((tag): tag is ITag => isObject(tag)) : [];

  return {
    id,
    name: descriptionFrom(clp) || `CLP ${numericId}`,
    ip: clp.ip || "0.0.0.0",
    port: numberFrom(clp.port),
    protocol: protocolFromClp(clp),
    typeClpId: numberFrom(clp.type_clp_id, entityId(clp.type_clp)),
    idPlc: numberFrom(clp.id_plc),
    typeClp: clp.type_clp,
    status: status ? "online" : "offline",
    description: descriptionFrom(clp),
    tags: tags.map((tag) => mapTag(tag, realtimeByClp, now)),
    backendClp: clp,
  };
}

function normalizeList<T>(payload: unknown): T[] {
  return Array.isArray(payload) ? (payload.filter(isObject) as T[]) : [];
}

function normalizeClps(payload: unknown): IClp[] {
  return normalizeList<IClp>(payload);
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
  const typeClp =
    findById(typeClps, input.typeClpId) ??
    plc?.backendClp?.type_clp ??
    emptyTypeClp(input.typeClpId);

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
  const { accessToken, ready } = useAuth();
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

  const addPlc = useCallback(
    async (input: NewPlcInput) => {
      await dispatch(addClp(clpInputToBackend(input, typeClps))).unwrap();
      await refresh();
    },
    [dispatch, refresh, typeClps],
  );

  const updatePlc = useCallback(
    async (id: string, input: NewPlcInput) => {
      const plc = plcs.find((p) => p.id === id);
      await dispatch(updateClp(mergePlcInput(plc, input, typeClps))).unwrap();
      await refresh();
    },
    [dispatch, plcs, refresh, typeClps],
  );

  const removePlc = useCallback(
    async (id: string) => {
      await dispatch(deleteClp(Number(id))).unwrap();
      await refresh();
    },
    [dispatch, refresh],
  );

  const setStatus = useCallback((id: string, status: ConnectionStatus) => {
    setPlcs((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }, []);

  const addTag = useCallback(
    async (plcId: string, tag: NewTagInput) => {
      const plc = plcs.find((p) => p.id === plcId);
      await dispatch(
        addTags(tagInputToBackend(plc, tag, typeTags, swaps, typeOperations)),
      ).unwrap();
      await refresh();
    },
    [dispatch, plcs, refresh, swaps, typeOperations, typeTags],
  );

  const updateTag = useCallback(
    async (plcId: string, tagId: string, tag: NewTagInput) => {
      const plc = plcs.find((p) => p.id === plcId);
      const currentTag = plc?.tags.find((t) => t.id === tagId);
      await dispatch(
        updateTags(mergeTagInput(plc, currentTag, tag, typeTags, swaps, typeOperations)),
      ).unwrap();
      await refresh();
    },
    [dispatch, plcs, refresh, swaps, typeOperations, typeTags],
  );

  const removeTag = useCallback(
    async (plcId: string, tagId: string) => {
      await dispatch(deleteTag(Number(tagId))).unwrap();
      await refresh();
    },
    [dispatch, refresh],
  );

  useEffect(() => {
    if (!ready || !accessToken) {
      setTypeClps([]);
      setTypeTags([]);
      setSwaps([]);
      setTypeOperations([]);
      return;
    }

    void loadOptions();
  }, [accessToken, loadOptions, ready]);

  useEffect(() => {
    if (!ready || !accessToken) {
      setPlcs([]);
      return;
    }

    void refresh();
    const id = window.setInterval(() => void refresh(), 1000);
    return () => window.clearInterval(id);
  }, [accessToken, ready, refresh]);

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

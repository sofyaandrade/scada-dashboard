import type IClp from "@/interface/IClp/IClp";
import type ITypeClp from "@/interface/IClp/ITypeClp";
import type ITypeOperation from "@/interface/ITag/IAreaModbus";
import type ITag from "@/interface/ITag/ITag";
import type ISwap from "@/interface/ITag/ISwap";
import type ITypeTag from "@/interface/ITag/ITypeTag";

export type ConnectionStatus = "online" | "offline" | "connecting";

export type TagDataType = string;

export type PlcProtocol = string;

export type TagValue = number | boolean | string;

export interface Tag {
  id: string;
  name: string;
  address: string;
  type: TagDataType;
  typeId: number;
  swapId: number;
  operationId: number;
  consumerId: number;
  offset: number;
  typeOption?: ITypeTag;
  swap?: ISwap;
  operationType?: ITypeOperation;
  unit?: string;
  value: TagValue;
  lastUpdate: number;
  backendTag?: ITag;
}

export interface PLC {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: PlcProtocol;
  typeClpId: number;
  idPlc: number;
  typeClp?: ITypeClp;
  status: ConnectionStatus;
  description?: string;
  tags: Tag[];
  backendClp?: IClp;
}

export interface NewPlcInput {
  name: string;
  ip: string;
  port: number;
  typeClpId: number;
  idPlc: number;
  description?: string;
}

export interface NewTagInput {
  name: string;
  typeId: number;
  swapId: number;
  operationId: number;
  offset: number;
  unit?: string;
}

export interface BackendTagsResponse {
  plcs: Array<{
    id: string;
    status?: ConnectionStatus;
    tags?: Array<{ id: string; value: TagValue }>;
  }>;
}

export type ConnectionStatus = "online" | "offline" | "connecting";

export type TagDataType = "bool" | "int" | "float" | "string";

export type PlcProtocol = "Modbus TCP" | "S7" | "OPC UA" | "EtherNet/IP";

export type TagValue = number | boolean | string;

export interface Tag {
  id: string;
  name: string;
  address: string;
  type: TagDataType;
  unit?: string;
  value: TagValue;
  lastUpdate: number;
}

export interface PLC {
  id: string;
  name: string;
  ip: string;
  port: number;
  protocol: PlcProtocol;
  status: ConnectionStatus;
  description?: string;
  tags: Tag[];
}

export type NewPlcInput = Omit<PLC, "id" | "tags" | "status">;
export type NewTagInput = Omit<Tag, "id" | "value" | "lastUpdate">;

export interface BackendTagsResponse {
  plcs: Array<{
    id: string;
    status?: ConnectionStatus;
    tags?: Array<{ id: string; value: TagValue }>;
  }>;
}

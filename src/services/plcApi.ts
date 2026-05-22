import type { BackendTagsResponse } from "@/types/plc";

/**
 * Base URL do backend. Configure via VITE_BACKEND_URL no .env se quiser
 * sobrescrever (ex: VITE_BACKEND_URL=http://192.168.0.10:1710).
 */
export const BACKEND_URL: string =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_BACKEND_URL) ||
  "http://localhost:1710";

export async function fetchTags(): Promise<BackendTagsResponse> {
  const res = await fetch(`${BACKEND_URL}/tags`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as BackendTagsResponse;
}

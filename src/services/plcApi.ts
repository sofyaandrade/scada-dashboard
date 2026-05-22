import type { BackendTagsResponse } from "@/types/plc";
import { api, authHeader } from "@/services/api";
export { BACKEND_URL } from "@/services/api";

/**
 * Base URL do backend. Configure via VITE_BACKEND_URL no .env se quiser
 * sobrescrever (ex: VITE_BACKEND_URL=http://192.168.0.10:1710).
 */
export async function fetchTags(): Promise<BackendTagsResponse> {
  const response = await api.get<BackendTagsResponse | Record<string, unknown>>(
    "tags/real-time/",
    { headers: authHeader() },
  );

  if (
    response.data &&
    typeof response.data === "object" &&
    Array.isArray((response.data as BackendTagsResponse).plcs)
  ) {
    return response.data as BackendTagsResponse;
  }

  return { plcs: [] };
}

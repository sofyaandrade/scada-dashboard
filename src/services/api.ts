export const BACKEND_URL: string =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) ||
  "http://localhost:1710";

export const AUTH_STORAGE_KEY = "plc.auth";
export const ACCESS_TOKEN_KEY = "AccessToken";
export const REFRESH_TOKEN_KEY = "RefreshToken";
export const USER_ID_KEY = "Id";
export const USER_NAME_KEY = "User";

type RequestConfig = {
  headers?: HeadersInit;
};

export type ApiResponse<T> = {
  data: T;
  headers: Headers;
  status: number;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function storageGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return storageGet(window.sessionStorage, ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return storageGet(window.sessionStorage, REFRESH_TOKEN_KEY);
}

export function authHeader(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function resolveUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

function parseResponseBody(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(data: unknown, status: number): string {
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return `Erro HTTP ${status}`;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  config?: RequestConfig,
): Promise<ApiResponse<T>> {
  const headers = new Headers({
    Accept: "application/json",
    ...authHeader(),
  });

  if (config?.headers) {
    new Headers(config.headers).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const hasBody = body !== undefined && body !== null;
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(resolveUrl(path), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  });

  const data = parseResponseBody(await response.text());

  if (!response.ok) {
    throw new ApiError(errorMessage(data, response.status), response.status, data);
  }

  return {
    data: data as T,
    headers: response.headers,
    status: response.status,
  };
}

export const api = {
  get: <T = unknown>(path: string, config?: RequestConfig) =>
    request<T>("GET", path, undefined, config),
  post: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>("POST", path, body, config),
  patch: <T = unknown>(path: string, body?: unknown, config?: RequestConfig) =>
    request<T>("PATCH", path, body, config),
  delete: <T = unknown>(path: string, config?: RequestConfig) =>
    request<T>("DELETE", path, undefined, config),
};

export default authHeader;

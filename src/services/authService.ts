import type { AuthSession, AuthUser, LoginResponse } from "@/types/auth";
import {
  ACCESS_TOKEN_KEY,
  AUTH_STORAGE_KEY,
  REFRESH_TOKEN_KEY,
  USER_ID_KEY,
  USER_NAME_KEY,
  api,
} from "@/services/api";

type JwtPayload = {
  Id?: number | string;
  Role?: string;
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload {
  const payload = token.split(".")[1];
  if (!payload || typeof globalThis.atob !== "function") return {};

  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    return JSON.parse(globalThis.atob(base64)) as JwtPayload;
  } catch {
    return {};
  }
}

export function isAccessTokenExpired(token: string): boolean {
  const { exp } = decodeJwtPayload(token);
  if (!exp) return false;
  return Date.now() >= (exp - 30) * 1000;
}

function userFromToken(accessToken: string, email: string): AuthUser {
  const payload = decodeJwtPayload(accessToken);
  const fallbackName = email.includes("@") ? email.split("@")[0] : email;

  return {
    id: payload.Id === undefined ? undefined : String(payload.Id),
    name: payload.Role || fallbackName ,
    email,
    role: payload.Role,
  };
}

function normalizeLoginResponse(data: LoginResponse): Pick<AuthSession, "accessToken" | "refreshToken"> {
  const accessToken = data.access_token ?? data.AccessToken ?? data.accessToken;
  const refreshToken = data.refresh_token ?? data.RefreshToken ?? data.refreshToken;

  if (!accessToken || !refreshToken) {
    throw new Error("Resposta de login invalida: tokens nao encontrados.");
  }

  return { accessToken, refreshToken };
}

function setStorageItem(storage: Storage, key: string, value: string) {
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function removeStorageItem(storage: Storage, key: string) {
  try {
    storage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export async function loginWithBackend(email: string, password: string): Promise<AuthSession> {
  const login = email.trim();

  if (!login || !password) {
    throw new Error("Informe usuario e senha.");
  }

  try {
    const response = await api.post<LoginResponse>("login/", {
      email: login,
      password,
    });
    const tokens = normalizeLoginResponse(response.data);

    return {
      ...tokens,
      user: userFromToken(tokens.accessToken, login),
    };
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error("Nao foi possivel conectar ao backend. Confira se a API esta rodando na porta 1710.");
    }
    throw new Error("Nao foi possivel autenticar. Confira usuario e senha.");
  }
}

export function persistAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(session);

  setStorageItem(window.sessionStorage, AUTH_STORAGE_KEY, serialized);
  setStorageItem(window.sessionStorage, ACCESS_TOKEN_KEY, session.accessToken);
  setStorageItem(window.sessionStorage, REFRESH_TOKEN_KEY, session.refreshToken);

  if (session.user.id) setStorageItem(window.sessionStorage, USER_ID_KEY, session.user.id);
  setStorageItem(window.sessionStorage, USER_NAME_KEY, session.user.name);
}

export function readStoredAuthSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  removeStorageItem(window.localStorage, AUTH_STORAGE_KEY);
  removeStorageItem(window.localStorage, ACCESS_TOKEN_KEY);
  removeStorageItem(window.localStorage, REFRESH_TOKEN_KEY);
  removeStorageItem(window.localStorage, USER_ID_KEY);
  removeStorageItem(window.localStorage, USER_NAME_KEY);

  const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as AuthSession;
    if (!session.accessToken || isAccessTokenExpired(session.accessToken)) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;

  for (const storage of [window.localStorage, window.sessionStorage]) {
    removeStorageItem(storage, AUTH_STORAGE_KEY);
    removeStorageItem(storage, ACCESS_TOKEN_KEY);
    removeStorageItem(storage, REFRESH_TOKEN_KEY);
    removeStorageItem(storage, USER_ID_KEY);
    removeStorageItem(storage, USER_NAME_KEY);
  }
}

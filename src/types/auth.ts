export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  AccessToken?: string;
  RefreshToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

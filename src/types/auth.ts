export interface AuthUser {
  name: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

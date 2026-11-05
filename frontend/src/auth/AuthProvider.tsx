import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { post } from '../services/httpClient';
import {
  AUTH_CHANGED_EVENT,
  clearStoredTokens,
  getStoredTokens,
  storeSession,
  type CurrentUser
} from './authStorage';

interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: CurrentUser;
}

export interface AuthContextValue {
  user: CurrentUser | null;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(() => getStoredTokens()?.user ?? null);

  useEffect(() => {
    const sync = () => setUser(getStoredTokens()?.user ?? null);
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await post<LoginResponse>('/api/v1/auth/login', { email, password });
    storeSession({
      accessToken: result.accessToken,
      expiresAt: Date.now() + result.expiresIn * 1000,
      user: result.user
    });
    return result.user;
  }, []);

  const logout = useCallback(() => clearStoredTokens(), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

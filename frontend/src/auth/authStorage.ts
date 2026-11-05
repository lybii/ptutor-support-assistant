// Lưu access token và người dùng hiện tại trong localStorage.
export type UserRole = 'STUDENT' | 'TUTOR' | 'EMPLOYEE' | 'ADMIN';

export interface CurrentUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
}

export interface StoredSession {
  accessToken: string;
  expiresAt: number;
  user: CurrentUser;
}

const KEY = 'ptutor.session';
export const AUTH_CHANGED_EVENT = 'ptutor:auth-changed';

export function getStoredTokens(): StoredSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (!session.accessToken || session.expiresAt <= Date.now()) {
      localStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function storeSession(session: StoredSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function clearStoredTokens(): void {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

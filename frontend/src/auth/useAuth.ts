import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function homePathFor(role: string | undefined): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'TUTOR') return '/tutor';
  if (role === 'ADMIN') return '/admin/assistant/documents';
  if (role === 'EMPLOYEE') return '/admin/support-requests';
  return '/login';
}

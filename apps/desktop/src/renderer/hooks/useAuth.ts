'use client';

import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const status = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const devSkip = useAuthStore((s) => s.devSkip);
  const logout = useAuthStore((s) => s.logout);
  const clearError = useAuthStore((s) => s.clearError);
  const expireSession = useAuthStore((s) => s.expireSession);

  return {
    status,
    session,
    error,
    isAuthenticated: status === 'authenticated' && session !== null,
    isLoading: status === 'idle' || status === 'loading',
    login,
    devSkip,
    logout,
    clearError,
    expireSession,
  };
}

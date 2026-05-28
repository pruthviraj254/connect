import { create } from 'zustand';

import * as authService from '@/services/auth';
import type {
  AuthSession,
  DeviceApprovalPending,
  LoginCredentials,
  LoginResult,
} from '@rx-connect/shared';
import { isDeviceApprovalPending } from '@rx-connect/shared';

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  status: AuthStatus;
  session: AuthSession | null;
  error: string | null;
  deviceApproval: DeviceApprovalPending | null;
  pendingLoginRetry: LoginCredentials | null;
  hydrate: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  devSkip: () => Promise<AuthSession>;
  logout: () => Promise<void>;
  clearError: () => void;
  clearDeviceApproval: () => void;
  expireSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'idle',
  session: null,
  error: null,
  deviceApproval: null,
  pendingLoginRetry: null,

  clearError: () => set({ error: null }),

  clearDeviceApproval: () => set({ deviceApproval: null, pendingLoginRetry: null }),

  hydrate: async () => {
    set({ status: 'loading', error: null });
    try {
      const session = await authService.fetchSession();
      if (session) {
        set({
          status: 'authenticated',
          session,
          error: null,
          deviceApproval: null,
          pendingLoginRetry: null,
        });
      } else {
        set({
          status: 'unauthenticated',
          session: null,
          error: null,
        });
      }
    } catch {
      set({
        status: 'unauthenticated',
        session: null,
        error: 'Could not restore your session. Please sign in again.',
      });
    }
  },

  login: async (credentials) => {
    set({ status: 'loading', error: null });
    try {
      const result = await authService.login(credentials);
      if (isDeviceApprovalPending(result)) {
        set({
          status: 'unauthenticated',
          session: null,
          error: null,
          deviceApproval: result,
          pendingLoginRetry: credentials,
        });
        return result;
      }
      set({
        status: 'authenticated',
        session: result,
        error: null,
        deviceApproval: null,
        pendingLoginRetry: null,
      });
      return result;
    } catch (error) {
      const message = authService.formatAuthError(error);
      set({
        status: 'unauthenticated',
        session: null,
        error: message,
        deviceApproval: null,
        pendingLoginRetry: null,
      });
      throw error;
    }
  },

  devSkip: async () => {
    set({ status: 'loading', error: null });
    const session = await authService.devSkip();
    set({
      status: 'authenticated',
      session,
      error: null,
      deviceApproval: null,
      pendingLoginRetry: null,
    });
    return session;
  },

  logout: async () => {
    await authService.logout();
    set({
      status: 'unauthenticated',
      session: null,
      error: null,
      deviceApproval: null,
      pendingLoginRetry: null,
    });
  },

  expireSession: async () => {
    try {
      await authService.logout();
    } catch {
      /* Main may already have cleared tokens. */
    }
    set({
      status: 'unauthenticated',
      session: null,
      error: 'Your session has expired. Please sign in again.',
      deviceApproval: null,
      pendingLoginRetry: null,
    });
  },
}));

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.status === 'authenticated' && s.session !== null);
}

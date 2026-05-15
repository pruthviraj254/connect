import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { setApiAuthToken } from '@/lib/api/client';

type AuthState = {
  token: string | null;
  email: string | null;
  displayName: string | null;
  setSession: (session: { token: string; email: string; displayName: string }) => void;
  clearSession: () => void;
};

type PersistedSlice = Pick<AuthState, 'token' | 'email' | 'displayName'>;

/**
 * SSR-safe localStorage wrapper. Returns null on the server so Zustand's persist middleware
 * always attaches `api.persist` and completes hydration synchronously (no thrown errors).
 * Corrupt JSON is caught and the key is removed.
 */
const resilientWebStorage: PersistStorage<PersistedSlice> = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      if (parsed === null || typeof parsed !== 'object' || !('state' in parsed)) {
        window.localStorage.removeItem(name);
        return null;
      }
      return parsed as { state: PersistedSlice; version?: number };
    } catch {
      try { window.localStorage.removeItem(name); } catch { /* ignore */ }
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      email: null,
      displayName: null,
      setSession: (session) => {
        setApiAuthToken(session.token);
        set({
          token: session.token,
          email: session.email,
          displayName: session.displayName,
        });
      },
      clearSession: () => {
        setApiAuthToken(null);
        set({ token: null, email: null, displayName: null });
      },
    }),
    {
      name: 'rx-connect-auth-v2',
      storage: resilientWebStorage,
      partialize: (state) => ({
        token: state.token,
        email: state.email,
        displayName: state.displayName,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          setApiAuthToken(null);
          return;
        }
        setApiAuthToken(state?.token ?? null);
      },
    },
  ),
);

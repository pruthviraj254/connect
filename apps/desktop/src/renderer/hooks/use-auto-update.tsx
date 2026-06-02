'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  UPDATE_GATE_BLOCKING_STATUSES,
  type UpdateGateState,
  type UpdateGateStatus,
} from '@rx-manager/shared';
import { isElectronApp } from '@/lib/electron';
import {
  checkForUpdates as checkForUpdatesIpc,
  getUpdateGate,
  installPendingUpdate,
  retryUpdate,
} from '@/lib/app';

type UpdateGateContextValue = {
  gate: UpdateGateState;
  isSupported: boolean;
  loading: boolean;
  isBlocked: boolean;
  check: () => Promise<void>;
  retry: () => Promise<void>;
  restart: () => Promise<void>;
};

const defaultGate: UpdateGateState = {
  status: 'ok',
  currentVersion: '0.0.0',
  minimumVersion: null,
  requiredVersion: null,
  message: null,
  progress: null,
  error: null,
  pendingVersion: null,
  updateReady: false,
  lastUpdateError: null,
  supported: false,
};

const UpdateGateContext = createContext<UpdateGateContextValue | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [gate, setGate] = useState<UpdateGateState>(defaultGate);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isElectronApp()) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const state = await getUpdateGate();
        setGate(state);
      } catch {
        /* IPC unavailable during web-only dev */
      } finally {
        setLoading(false);
      }
    })();

    if (window.electronAPI?.onUpdateGateChanged) {
      unsubscribe = window.electronAPI.onUpdateGateChanged((next) => {
        setGate(next);
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  const check = useCallback(async () => {
    if (!gate.supported) return;
    try {
      await checkForUpdatesIpc();
    } catch (e) {
      setGate((prev) => ({
        ...prev,
        status: 'ok',
        lastUpdateError: e instanceof Error ? e.message : 'Could not check for updates',
      }));
    }
  }, [gate.supported]);

  const retry = useCallback(async () => {
    if (!gate.supported) return;
    try {
      await retryUpdate();
    } catch (e) {
      setGate((prev) => ({
        ...prev,
        status: 'error',
        error: e instanceof Error ? e.message : 'Could not retry update',
      }));
    }
  }, [gate.supported]);

  const restart = useCallback(async () => {
    if (!gate.supported) return;
    try {
      await installPendingUpdate();
    } catch (e) {
      setGate((prev) => ({
        ...prev,
        status: 'ok',
        lastUpdateError: e instanceof Error ? e.message : 'Could not restart to update',
      }));
    }
  }, [gate.supported]);

  const isBlocked = gate.supported && UPDATE_GATE_BLOCKING_STATUSES.has(gate.status);

  const value = useMemo<UpdateGateContextValue>(
    () => ({
      gate,
      isSupported: gate.supported,
      loading,
      isBlocked,
      check,
      retry,
      restart,
    }),
    [gate, loading, isBlocked, check, retry, restart],
  );

  return <UpdateGateContext.Provider value={value}>{children}</UpdateGateContext.Provider>;
}

export function useUpdateGate(): UpdateGateContextValue {
  const ctx = useContext(UpdateGateContext);
  if (ctx) return ctx;

  return {
    gate: defaultGate,
    isSupported: false,
    loading: false,
    isBlocked: false,
    check: async () => {},
    retry: async () => {},
    restart: async () => {},
  };
}

/** @deprecated use useUpdateGate */
export const useAutoUpdate = useUpdateGate;

export function gateStatusLabel(status: UpdateGateStatus, gate: UpdateGateState): string {
  switch (status) {
    case 'checking':
      return 'Checking updates…';
    case 'required':
      return 'Update required';
    case 'downloading':
      return `Downloading${gate.progress != null ? ` (${gate.progress}%)` : '…'}`;
    case 'ready':
      return gate.updateReady || gate.requiredVersion
        ? `Update ${gate.requiredVersion ?? gate.pendingVersion ?? ''} ready`
        : 'Installing update…';
    case 'error':
      return gate.error ?? gate.lastUpdateError ?? 'Update failed';
    case 'ok':
      if (gate.updateReady && gate.pendingVersion) {
        return `Update ${gate.pendingVersion} ready`;
      }
      if (gate.lastUpdateError) {
        return 'Update check failed';
      }
      return 'Up to date';
    default:
      return '';
  }
}

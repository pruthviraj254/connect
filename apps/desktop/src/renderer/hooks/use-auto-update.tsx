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
import type { UpdateStatus } from '@rx-connect/shared';
import { isElectronApp } from '@/lib/auth/auth-actions';
import {
  checkForUpdates as checkForUpdatesIpc,
  getAppVersion,
  getUpdateCapabilities,
  quitAndInstallUpdate as quitAndInstallUpdateIpc,
} from '@/lib/app';

type UpdateContextValue = {
  version: string | null;
  status: UpdateStatus;
  isSupported: boolean;
  loading: boolean;
  check: () => Promise<void>;
  restart: () => Promise<void>;
  isBusy: boolean;
  /** True when user should see the global update banner. */
  showBanner: boolean;
  dismissBanner: () => void;
};

const UpdateContext = createContext<UpdateContextValue | null>(null);

export function UpdateProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState<string | null>(null);
  const [status, setStatus] = useState<UpdateStatus>({ phase: 'idle' });
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    if (!isElectronApp()) {
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const [appVersion, capabilities] = await Promise.all([
          getAppVersion(),
          getUpdateCapabilities(),
        ]);
        setVersion(appVersion);
        setIsSupported(capabilities.supported);
        setStatus(capabilities.status);
      } catch {
        /* IPC unavailable during web-only dev */
      } finally {
        setLoading(false);
      }
    })();

    if (window.electronAPI?.onUpdateStatus) {
      unsubscribe = window.electronAPI.onUpdateStatus((next) => {
        setStatus(next);
        if (
          next.phase === 'available' ||
          next.phase === 'downloading' ||
          next.phase === 'downloaded'
        ) {
          setBannerDismissed(false);
        }
      });
    }

    return () => {
      unsubscribe?.();
    };
  }, []);

  const check = useCallback(async () => {
    if (!isSupported) return;
    try {
      await checkForUpdatesIpc();
    } catch (e) {
      setStatus({
        phase: 'error',
        message: e instanceof Error ? e.message : 'Could not check for updates',
      });
    }
  }, [isSupported]);

  const restart = useCallback(async () => {
    if (!isSupported) return;
    try {
      await quitAndInstallUpdateIpc();
    } catch (e) {
      setStatus({
        phase: 'error',
        message: e instanceof Error ? e.message : 'Could not restart to update',
      });
    }
  }, [isSupported]);

  const isBusy =
    status.phase === 'checking' ||
    status.phase === 'downloading' ||
    status.phase === 'available';

  const showBanner =
    isSupported &&
    !bannerDismissed &&
    (status.phase === 'available' ||
      status.phase === 'downloading' ||
      status.phase === 'downloaded' ||
      status.phase === 'error');

  const value = useMemo<UpdateContextValue>(
    () => ({
      version,
      status,
      isSupported,
      loading,
      check,
      restart,
      isBusy,
      showBanner,
      dismissBanner: () => setBannerDismissed(true),
    }),
    [version, status, isSupported, loading, check, restart, isBusy, showBanner],
  );

  return <UpdateContext.Provider value={value}>{children}</UpdateContext.Provider>;
}

export function useUpdateContext(): UpdateContextValue {
  const ctx = useContext(UpdateContext);
  if (!ctx) {
    throw new Error('useUpdateContext must be used within UpdateProvider');
  }
  return ctx;
}

/** Safe hook for components that may render outside UpdateProvider (returns inert defaults). */
export function useAutoUpdate(): UpdateContextValue {
  const ctx = useContext(UpdateContext);
  if (ctx) return ctx;

  return {
    version: null,
    status: { phase: 'idle' },
    isSupported: false,
    loading: false,
    check: async () => {},
    restart: async () => {},
    isBusy: false,
    showBanner: false,
    dismissBanner: () => {},
  };
}

export function getUpdateVersion(status: UpdateStatus): string | null {
  if (status.phase === 'available' || status.phase === 'downloaded') {
    return status.version;
  }
  return null;
}

export function formatUpdateStatus(status: UpdateStatus): string {
  switch (status.phase) {
    case 'idle':
      return '';
    case 'checking':
      return 'Checking for updates…';
    case 'available':
      return `Version ${status.version} is available`;
    case 'not-available':
      return "You're on the latest version";
    case 'downloading':
      return `Downloading version ${status.percent}% complete`;
    case 'downloaded':
      return `Version ${status.version} is ready to install`;
    case 'error':
      return status.message;
    default:
      return '';
  }
}

'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { isElectronApp } from '@/lib/electron';

/** Subscribe to main-process in-app navigation (tray, intercepted hard navigations). */
export function useElectronNavigation(): void {
  const router = useRouter();

  useEffect(() => {
    if (!isElectronApp() || !window.electronAPI?.onNavigate) {
      return;
    }

    return window.electronAPI.onNavigate((pathname) => {
      router.push(pathname);
    });
  }, [router]);
}

export function ElectronNavigationProvider({ children }: { children: ReactNode }) {
  useElectronNavigation();
  return children;
}

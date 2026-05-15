'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `true` once the component has mounted on the client.
 *
 * Zustand persist with `resilientWebStorage` hydrates synchronously during store
 * creation, so `hasHydrated()` is already `true` before any component renders.
 * We only gate on client mount to avoid SSR/client hydration mismatches (server
 * always has token=null, client may have a restored token).
 */
export function useAuthPersistReady(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return mounted;
}

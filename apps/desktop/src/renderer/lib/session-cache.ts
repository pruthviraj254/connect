import type { AuthSession } from '@rx-manager/shared';

const SESSION_DISPLAY_CACHE_KEY = 'rx-manager-session-display';

/** Display-only session snapshot for optimistic hydrate on reload (no tokens). */
export function readSessionDisplayCache(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(SESSION_DISPLAY_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.user?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSessionDisplayCache(session: AuthSession): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(
      SESSION_DISPLAY_CACHE_KEY,
      JSON.stringify({
        user: session.user,
        expiresAt: session.expiresAt,
      }),
    );
  } catch {
    /* sessionStorage unavailable */
  }
}

export function clearSessionDisplayCache(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(SESSION_DISPLAY_CACHE_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}

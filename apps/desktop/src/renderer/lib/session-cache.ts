import type { AuthSession } from '@rx-manager/shared';

const SESSION_DISPLAY_CACHE_KEY = 'rx-manager-session-display';
const SESSION_VERSION_KEY = 'rx-manager-app-version';

function invalidateIfVersionMismatch(appVersion: string | null): void {
  if (!appVersion || typeof window === 'undefined') {
    return;
  }
  try {
    const storedVersion = sessionStorage.getItem(SESSION_VERSION_KEY);
    if (storedVersion && storedVersion !== appVersion) {
      sessionStorage.removeItem(SESSION_DISPLAY_CACHE_KEY);
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

/** Display-only session snapshot for optimistic hydrate on reload (no tokens). */
export function readSessionDisplayCache(appVersion: string | null = null): AuthSession | null {
  if (typeof window === 'undefined') {
    return null;
  }

  invalidateIfVersionMismatch(appVersion);

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

export function writeSessionDisplayCache(session: AuthSession, appVersion: string | null = null): void {
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
    if (appVersion) {
      sessionStorage.setItem(SESSION_VERSION_KEY, appVersion);
    }
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

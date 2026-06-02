import { createRequire } from 'node:module';

import type { AuthSession } from '@rx-manager/shared';

/** Runtime require so Vite does not statically bundle keytar's native `.node` addon. */
const keytar = createRequire(import.meta.url)('keytar') as typeof import('keytar');

const SERVICE_NAME = 'rx-manager-desktop';
const ACCESS_ACCOUNT = 'access_token';
const REFRESH_ACCOUNT = 'refresh_token';
const REMEMBER_ACCOUNT = 'remember_session';
const SESSION_META_ACCOUNT = 'session_meta';

interface MemoryTokens {
  accessToken: string;
  refreshToken: string;
}

let memoryTokens: MemoryTokens | null = null;
let memorySessionMeta: AuthSession | null = null;
let rememberSession = false;

export async function loadRememberPreference(): Promise<boolean> {
  const stored = await keytar.getPassword(SERVICE_NAME, REMEMBER_ACCOUNT);
  rememberSession = stored === '1';
  return rememberSession;
}

export function isRememberSessionEnabled(): boolean {
  return rememberSession;
}

export async function setRememberSession(enabled: boolean): Promise<void> {
  rememberSession = enabled;
  if (enabled) {
    await keytar.setPassword(SERVICE_NAME, REMEMBER_ACCOUNT, '1');
  } else {
    await keytar.deletePassword(SERVICE_NAME, REMEMBER_ACCOUNT);
    await clearPersistedTokens();
  }
}

async function clearPersistedTokens(): Promise<void> {
  await Promise.all([
    keytar.deletePassword(SERVICE_NAME, ACCESS_ACCOUNT).catch(() => undefined),
    keytar.deletePassword(SERVICE_NAME, REFRESH_ACCOUNT).catch(() => undefined),
    keytar.deletePassword(SERVICE_NAME, SESSION_META_ACCOUNT).catch(() => undefined),
  ]);
}

export async function saveTokens(
  accessToken: string,
  refreshToken: string,
  persist: boolean,
): Promise<void> {
  memoryTokens = { accessToken, refreshToken };
  rememberSession = persist;
  await setRememberSession(persist);

  if (persist) {
    await keytar.setPassword(SERVICE_NAME, ACCESS_ACCOUNT, accessToken);
    await keytar.setPassword(SERVICE_NAME, REFRESH_ACCOUNT, refreshToken);
  } else {
    await clearPersistedTokens();
  }
}

export async function getAccessToken(): Promise<string | null> {
  if (memoryTokens?.accessToken) return memoryTokens.accessToken;
  if (!rememberSession) return null;
  return keytar.getPassword(SERVICE_NAME, ACCESS_ACCOUNT);
}

export async function getRefreshToken(): Promise<string | null> {
  if (memoryTokens?.refreshToken) return memoryTokens.refreshToken;
  if (!rememberSession) return null;
  return keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT);
}

export async function hydrateFromKeychain(): Promise<boolean> {
  await loadRememberPreference();
  if (!rememberSession) return false;

  const [access, refresh] = await Promise.all([
    keytar.getPassword(SERVICE_NAME, ACCESS_ACCOUNT),
    keytar.getPassword(SERVICE_NAME, REFRESH_ACCOUNT),
  ]);

  if (access && refresh) {
    memoryTokens = { accessToken: access, refreshToken: refresh };
    memorySessionMeta = await loadSessionMetaFromStore();
    return true;
  }
  return false;
}

export async function saveSessionMeta(session: AuthSession): Promise<void> {
  memorySessionMeta = session;
  if (rememberSession) {
    await keytar.setPassword(SERVICE_NAME, SESSION_META_ACCOUNT, JSON.stringify(session));
  }
}

async function loadSessionMetaFromStore(): Promise<AuthSession | null> {
  if (memorySessionMeta) return memorySessionMeta;
  if (!rememberSession) return null;
  const raw = await keytar.getPassword(SERVICE_NAME, SESSION_META_ACCOUNT);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export async function loadSessionMeta(): Promise<AuthSession | null> {
  return loadSessionMetaFromStore();
}

export async function clearAllTokens(): Promise<void> {
  memoryTokens = null;
  memorySessionMeta = null;
  rememberSession = false;
  await clearPersistedTokens();
  await keytar.deletePassword(SERVICE_NAME, REMEMBER_ACCOUNT).catch(() => undefined);
}

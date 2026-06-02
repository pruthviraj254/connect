import {
  AUTH_PLATFORM,
  type AuthSession,
  type AuthUser,
  type DeviceApprovalPending,
  type LoginRequest,
  type LoginResult,
  isPortalDeviceApprovalData,
  type PortalLoginData,
  type PortalLoginResponseData,
  unwrapPortalApiBody,
} from '@rx-manager/shared';

import { config } from '../config.js';
import { HttpError, portalRequest } from './httpClient.js';
import { getJwtExpiryMs, isJwtValid } from './jwt.js';
import { getMachineId } from './machineId.js';
import * as tokenStore from './tokenStore.js';

let cachedSession: AuthSession | null = null;
let devBypassActive = false;

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired. Please sign in again.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

function mapUser(data: PortalLoginData): AuthUser {
  return {
    email: data.email,
    role: data.role,
    userType: data.userType,
    pharmacyId: data.pharmacyId,
    pharmacyName: data.pharmacyName,
    licenseeFirstName: data.licenseeFirstName,
    licenseeLastName: data.licenseeLastName,
    licenseeEmail: data.licenseeEmail,
    mustChangePassword: data.mustChangePassword ?? false,
    accessToSelfAssessment: data.accessToSelfAssessment ?? false,
    accessToCQIMeetings: data.accessToCQIMeetings ?? false,
    accessToAllIncidents: data.accessToAllIncidents ?? false,
    accessToDocumentFolder: data.accessToDocumentFolder ?? false,
  };
}

function buildSession(data: PortalLoginData): AuthSession {
  const jwtExp = getJwtExpiryMs(data.access_token);
  return {
    user: mapUser(data),
    expiresAt: jwtExp ?? Date.now() + data.expires_in * 1000,
  };
}

function extractApiMessage(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null;
  const row = body as Record<string, unknown>;
  if (typeof row.message === 'string' && row.message.trim()) return row.message;
  if (typeof row.error === 'string' && row.error.trim()) return row.error;
  if (row.error && typeof row.error === 'object') {
    const nested = row.error as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message;
    }
  }
  return null;
}

export function getCachedSession(): AuthSession | null {
  return cachedSession;
}

export function isDevBypassActive(): boolean {
  return devBypassActive;
}

function accessTokenStillValid(access: string): boolean {
  return isJwtValid(access, config.authRefreshSkewMs);
}

export async function hydrateSession(): Promise<AuthSession | null> {
  if (devBypassActive && cachedSession) {
    return cachedSession;
  }

  const hasTokens = await tokenStore.hydrateFromKeychain();
  if (!hasTokens) {
    cachedSession = null;
    return null;
  }

  const access = await tokenStore.getAccessToken();
  if (!access) {
    cachedSession = null;
    return null;
  }

  const storedMeta = await tokenStore.loadSessionMeta();
  if (storedMeta && accessTokenStillValid(access)) {
    const jwtExp = getJwtExpiryMs(access);
    cachedSession = {
      ...storedMeta,
      expiresAt: jwtExp ?? storedMeta.expiresAt,
    };
    return cachedSession;
  }

  if (accessTokenStillValid(access) && cachedSession) {
    return cachedSession;
  }

  try {
    await refreshAccessToken();
    return cachedSession;
  } catch {
    if (accessTokenStillValid(access) && storedMeta) {
      cachedSession = storedMeta;
      return cachedSession;
    }
    await logout();
    return null;
  }
}

function toDeviceApprovalPending(data: {
  status?: string;
  message?: string;
}): DeviceApprovalPending {
  return {
    kind: 'device_approval_pending',
    status: data.status?.trim() || 'pending',
    message:
      data.message?.trim() || 'Device registered and pending admin approval.',
  };
}

export async function login(req: LoginRequest): Promise<LoginResult> {
  try {
    const raw = await portalRequest<unknown>('/api/auth/login', {
      method: 'POST',
      body: {
        email: req.email.trim(),
        password: req.password.trim(),
        platform: AUTH_PLATFORM,
        deviceId: getMachineId(),
      },
      maxRetries: 0,
    });

    let data: PortalLoginResponseData;
    try {
      data = unwrapPortalApiBody<PortalLoginResponseData>(raw);
    } catch (unwrapError) {
      throw new Error(
        extractApiMessage(raw) ??
          (unwrapError instanceof Error
            ? unwrapError.message
            : 'Sign in failed. Check your credentials.'),
      );
    }

    if (isPortalDeviceApprovalData(data)) {
      return toDeviceApprovalPending(data);
    }

    if (!data.access_token) {
      throw new Error(
        extractApiMessage(raw) ?? 'Sign in failed. Check your credentials.',
      );
    }

    const tokens = data as PortalLoginData;
    devBypassActive = false;
    await tokenStore.saveTokens(
      tokens.access_token,
      tokens.refresh_token,
      req.rememberSession,
    );
    cachedSession = buildSession(tokens);
    await tokenStore.saveSessionMeta(cachedSession);
    return cachedSession;
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.status === 401) {
        throw new Error('Invalid email or password. Please try again.');
      }
      if (error.status === 403 && error.message.trim()) {
        throw new Error(error.message);
      }
    }
    throw error;
  }
}

let refreshInFlight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await tokenStore.getRefreshToken();
    if (!refreshToken) {
      throw new Error('Session expired. Please sign in again.');
    }

    const raw = await portalRequest<unknown>('/api/auth/refresh-token', {
      method: 'POST',
      body: { refresh_token: refreshToken },
      maxRetries: 0,
    });

    let data: PortalLoginData;
    try {
      data = unwrapPortalApiBody<PortalLoginData>(raw);
    } catch (unwrapError) {
      throw new Error(
        extractApiMessage(raw) ??
          (unwrapError instanceof Error
            ? unwrapError.message
            : 'Session expired. Please sign in again.'),
      );
    }

    if (!data.access_token) {
      throw new Error(
        extractApiMessage(raw) ?? 'Session expired. Please sign in again.',
      );
    }
    const persist = tokenStore.isRememberSessionEnabled();
    await tokenStore.saveTokens(data.access_token, data.refresh_token, persist);
    cachedSession = buildSession(data);
    await tokenStore.saveSessionMeta(cachedSession);
    return data.access_token;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function logout(): Promise<void> {
  devBypassActive = false;
  const accessToken = await tokenStore.getAccessToken();
  if (accessToken) {
    try {
      await portalRequest('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: { platform: AUTH_PLATFORM },
        maxRetries: 0,
        skipAuthRetry: true,
      });
    } catch {
      /* Revoke locally even if the server call fails. */
    }
  }
  cachedSession = null;
  await tokenStore.clearAllTokens();
}

export async function getAuthorizationHeader(): Promise<Record<string, string>> {
  if (devBypassActive) {
    return {};
  }

  let token = await tokenStore.getAccessToken();
  if (!token) {
    throw new SessionExpiredError();
  }

  if (!accessTokenStillValid(token)) {
    try {
      token = await refreshAccessToken();
    } catch {
      await logout();
      throw new SessionExpiredError();
    }
  }

  return { Authorization: `Bearer ${token}` };
}

export async function handleUnauthorized(): Promise<boolean> {
  if (devBypassActive) return true;
  try {
    await refreshAccessToken();
    return true;
  } catch {
    await logout();
    return false;
  }
}

/** Dev-only: enter app without portal tokens until login API is ready. */
export async function devSkipAuth(): Promise<AuthSession> {
  devBypassActive = true;
  cachedSession = {
    user: {
      email: 'dev@onerx.health',
      role: 'owner',
      userType: 'pharmacy',
      pharmacyId: 'BC_00022',
      pharmacyName: 'Dev Pharmacy',
      licenseeFirstName: 'Dev',
      licenseeLastName: 'Operator',
      licenseeEmail: 'dev@onerx.health',
      mustChangePassword: false,
      accessToSelfAssessment: true,
      accessToCQIMeetings: true,
      accessToAllIncidents: true,
      accessToDocumentFolder: true,
    },
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  return cachedSession;
}

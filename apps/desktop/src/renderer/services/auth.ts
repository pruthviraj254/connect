import {
  isDeviceApprovalPending,
  isPortalDeviceApprovalData,
  unwrapPortalApiBody,
  type AuthSession,
  type DeviceApprovalPending,
  type LoginCredentials,
  type LoginResult,
  type PortalLoginData,
  type PortalLoginResponseData,
} from '@rx-connect/shared';

import { stripIpcErrorPrefix } from '@/lib/ipcError';

function hasAuthBridge(): boolean {
  return typeof window !== 'undefined' && !!window.api?.auth;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
}

function stripIpcError(message: string): string {
  return message.replace(/^Error invoking remote method '[^']+': Error: /, '').trim();
}

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  if (hasAuthBridge()) {
    return window.api.auth.login(credentials);
  }
  throw new Error('Sign in is only available in the Rx-Connect desktop app.');
}

export async function logout(): Promise<void> {
  if (hasAuthBridge()) {
    await window.api.auth.logout();
  }
}

export async function fetchSession(): Promise<AuthSession | null> {
  if (hasAuthBridge()) {
    return window.api.auth.getSession();
  }
  return null;
}

export async function devSkip(): Promise<AuthSession> {
  if (!window.api?.auth?.devSkip) {
    throw new Error('Developer sign-in skip is not available.');
  }
  return window.api.auth.devSkip();
}

export function formatAuthError(
  error: unknown,
  fallback = 'Sign in failed. Please try again.',
): string {
  const raw = stripIpcErrorPrefix(stripIpcError(getErrorMessage(error, fallback)));

  if (/invalid email or password/i.test(raw)) {
    return 'Invalid email or password. Please try again.';
  }
  if (/\b401\b/.test(raw) || /unauthorized/i.test(raw)) {
    return 'Invalid email or password. Please try again.';
  }
  if (/device was rejected/i.test(raw)) {
    return 'This workstation was rejected. Contact your pharmacy administrator.';
  }
  if (/device limit reached|maximum devices/i.test(raw)) {
    return 'Your pharmacy has reached the maximum number of workstations. Contact your administrator.';
  }
  if (/deviceid is required/i.test(raw)) {
    return 'Workstation ID could not be resolved. Restart Rx-Connect or contact support.';
  }
  if (/failed to fetch|network error|enotfound|econnrefused/i.test(raw)) {
    return 'Could not reach the sign-in server. Check your connection and try again.';
  }
  if (/timed out|timeout/i.test(raw)) {
    return 'Sign-in timed out. Please try again.';
  }
  if (/session expired/i.test(raw) || raw.startsWith('[SESSION_EXPIRED]')) {
    return 'Your session has expired. Please sign in again.';
  }

  return raw;
}

export function loginSuccessMessage(session: AuthSession): string {
  const pharmacy = session.user.pharmacyName?.trim();
  if (pharmacy) return `Signed in to ${pharmacy}.`;
  const name = [session.user.licenseeFirstName, session.user.licenseeLastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (name) return `Welcome back, ${name}.`;
  return 'Signed in successfully.';
}

export { isDeviceApprovalPending, isPortalDeviceApprovalData, unwrapPortalApiBody };

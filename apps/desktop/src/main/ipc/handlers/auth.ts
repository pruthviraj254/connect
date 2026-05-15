import { ipcMain } from 'electron';
import {
  IpcChannel,
  type IpcResult,
  type AuthLoginPayload,
  type AuthLoginData,
  type AuthRegisterPayload,
  type AuthForgotPasswordPayload,
  type AuthForgotPasswordData,
} from '@rx-connect/shared';
import {
  createSession,
  deleteSession,
  findUser,
  getSession,
  registerTempUser,
  rotatePasswordForUser,
  verifyPassword,
} from '../../auth-temp-db.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLoginPayload(value: unknown): AuthLoginPayload | null {
  if (!isRecord(value)) return null;
  const email = value.email;
  const password = value.password;
  if (typeof email !== 'string' || typeof password !== 'string') return null;
  return { email, password };
}

function parseForgotPayload(value: unknown): AuthForgotPasswordPayload | null {
  if (!isRecord(value)) return null;
  const email = value.email;
  if (typeof email !== 'string') return null;
  return { email };
}

function parseRegisterPayload(value: unknown): AuthRegisterPayload | null {
  if (!isRecord(value)) return null;
  const email = value.email;
  const password = value.password;
  const displayName = value.displayName;
  if (typeof email !== 'string' || typeof password !== 'string' || typeof displayName !== 'string') {
    return null;
  }
  if (displayName.trim().length === 0) return null;
  return { email, password, displayName };
}

export function registerAuthHandlers(): void {
  ipcMain.handle(
    IpcChannel.AuthLogin,
    async (_event, raw: unknown): Promise<IpcResult<AuthLoginData>> => {
      const payload = parseLoginPayload(raw);
      if (!payload) {
        return { ok: false, error: 'invalid_payload' };
      }
      const user = findUser(payload.email);
      if (!user || !verifyPassword(payload.email, payload.password)) {
        return { ok: false, error: 'invalid_credentials' };
      }
      const token = createSession(user.email, user.displayName);
      return {
        ok: true,
        data: { token, email: user.email, displayName: user.displayName },
      };
    },
  );

  ipcMain.handle(
    IpcChannel.AuthRegister,
    async (_event, raw: unknown): Promise<IpcResult<AuthLoginData>> => {
      const payload = parseRegisterPayload(raw);
      if (!payload) {
        return { ok: false, error: 'invalid_payload' };
      }
      const created = registerTempUser(payload.email, payload.password, payload.displayName);
      if (!created.ok) {
        return { ok: false, error: 'email_taken' };
      }
      const token = createSession(created.user.email, created.user.displayName);
      return {
        ok: true,
        data: {
          token,
          email: created.user.email,
          displayName: created.user.displayName,
        },
      };
    },
  );

  ipcMain.handle(IpcChannel.AuthLogout, async (_event, raw: unknown): Promise<IpcResult<null>> => {
    if (typeof raw !== 'string' || raw.length === 0) {
      return { ok: false, error: 'invalid_payload' };
    }
    deleteSession(raw);
    return { ok: true, data: null };
  });

  ipcMain.handle(
    IpcChannel.AuthRefresh,
    async (_event, raw: unknown): Promise<IpcResult<{ token: string }>> => {
      if (typeof raw !== 'string' || raw.length === 0) {
        return { ok: false, error: 'invalid_payload' };
      }
      if (!getSession(raw)) {
        return { ok: false, error: 'session_invalid' };
      }
      return { ok: true, data: { token: raw } };
    },
  );

  ipcMain.handle(
    IpcChannel.AuthRequestPasswordReset,
    async (_event, raw: unknown): Promise<IpcResult<AuthForgotPasswordData>> => {
      const payload = parseForgotPayload(raw);
      if (!payload) {
        return { ok: false, error: 'invalid_payload' };
      }
      const user = findUser(payload.email);
      if (!user) {
        return {
          ok: true,
          data: { message: 'If an account exists, password reset instructions were applied.' },
        };
      }
      const devTemporaryPassword = rotatePasswordForUser(payload.email);
      return {
        ok: true,
        data: {
          message: 'Password reset (in-memory demo). Use the new password below to sign in.',
          devTemporaryPassword: devTemporaryPassword ?? undefined,
        },
      };
    },
  );
}

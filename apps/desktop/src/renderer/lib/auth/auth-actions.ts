import {
  IpcChannel,
  type IpcResult,
  type AuthLoginPayload,
  type AuthLoginData,
  type AuthRegisterPayload,
  type AuthForgotPasswordData,
} from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export function isElectronApp(): boolean {
  return typeof window !== 'undefined' && Boolean(window.electronAPI);
}

export async function loginWithTempDb(payload: AuthLoginPayload): Promise<AuthLoginData> {
  const result = await ipcInvoke<IpcResult<AuthLoginData>>(IpcChannel.AuthLogin, payload);
  return unwrapIpc(result);
}

export async function registerWithTempDb(payload: AuthRegisterPayload): Promise<AuthLoginData> {
  const result = await ipcInvoke<IpcResult<AuthLoginData>>(IpcChannel.AuthRegister, payload);
  return unwrapIpc(result);
}

export async function logoutWithTempDb(token: string): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.AuthLogout, token);
  unwrapIpc(result);
}

export async function requestPasswordResetWithTempDb(email: string): Promise<AuthForgotPasswordData> {
  const result = await ipcInvoke<IpcResult<AuthForgotPasswordData>>(IpcChannel.AuthRequestPasswordReset, {
    email,
  });
  return unwrapIpc(result);
}

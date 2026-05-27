import { IpcChannel, type IpcResult } from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export type AppSettings = {
  theme: 'system' | 'light' | 'dark';
  openAtLogin: boolean;
};

export async function getAppSettings(): Promise<AppSettings> {
  const result = await ipcInvoke<IpcResult<Record<string, unknown>>>(IpcChannel.SettingsGet);
  const data = unwrapIpc(result);
  return {
    theme: (data.theme as AppSettings['theme']) ?? 'light',
    openAtLogin: Boolean(data.openAtLogin),
  };
}

export async function setAppSettings(patch: Partial<AppSettings>): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.SettingsSet, patch);
  unwrapIpc(result);
}

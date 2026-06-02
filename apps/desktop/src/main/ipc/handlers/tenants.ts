import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-manager/shared';

export function registerTenantsHandlers(): void {
  ipcMain.handle(IpcChannel.TenantsList, async (): Promise<IpcResult<unknown[]>> => ({ ok: true, data: [] }));

  ipcMain.handle(IpcChannel.TenantsGet, async (): Promise<IpcResult<unknown>> => ({
    ok: false,
    error: 'Not implemented',
  }));
}

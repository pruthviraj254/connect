import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-manager/shared';

export function registerBlacklistHandlers(): void {
  ipcMain.handle(IpcChannel.BlacklistList, async (): Promise<IpcResult<unknown[]>> => ({ ok: true, data: [] }));

  ipcMain.handle(IpcChannel.BlacklistAdd, async (): Promise<IpcResult<null>> => ({
    ok: false,
    error: 'Not implemented',
  }));
}

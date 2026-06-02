import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-manager/shared';

export function registerRxHandlers(): void {
  ipcMain.handle(IpcChannel.RxList, async (): Promise<IpcResult<unknown[]>> => ({ ok: true, data: [] }));

  ipcMain.handle(IpcChannel.RxGet, async (): Promise<IpcResult<unknown>> => ({
    ok: false,
    error: 'Not implemented',
  }));
}

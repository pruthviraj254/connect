import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-connect/shared';

export function registerFaxHandlers(): void {
  ipcMain.handle(IpcChannel.FaxList, async (): Promise<IpcResult<unknown[]>> => ({ ok: true, data: [] }));

  ipcMain.handle(IpcChannel.FaxSend, async (): Promise<IpcResult<null>> => ({
    ok: false,
    error: 'Not implemented',
  }));
}

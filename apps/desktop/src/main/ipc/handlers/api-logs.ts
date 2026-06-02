import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-manager/shared';

export function registerApiLogsHandlers(): void {
  ipcMain.handle(IpcChannel.ApiLogsList, async (): Promise<IpcResult<unknown[]>> => ({ ok: true, data: [] }));
}

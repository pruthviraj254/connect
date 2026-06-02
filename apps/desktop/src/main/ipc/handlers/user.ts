import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-manager/shared';

export function registerUserHandlers(): void {
  ipcMain.handle(IpcChannel.UserGetProfile, async (): Promise<IpcResult<{ email: string; name: string }>> => ({
    ok: true,
    data: { email: 'admin@onerx.health', name: 'Alex Operator' },
  }));
}

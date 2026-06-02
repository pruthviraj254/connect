import { ipcMain } from 'electron';
import { IpcChannel } from '@rx-manager/shared';
import {
  checkForUpdates,
  getUpdateGate,
  installPendingUpdateNow,
  retryForcedUpdate,
} from '../../update-service.js';

export function registerUpdaterHandlers(): void {
  ipcMain.handle(IpcChannel.UpdateGetGate, async () => {
    return { ok: true as const, data: getUpdateGate() };
  });

  ipcMain.handle(IpcChannel.UpdateCheck, async () => {
    checkForUpdates();
    return { ok: true as const, data: undefined };
  });

  ipcMain.handle(IpcChannel.UpdateRetry, async () => {
    await retryForcedUpdate();
    return { ok: true as const, data: undefined };
  });

  ipcMain.handle(IpcChannel.UpdateInstallPending, async () => {
    installPendingUpdateNow();
    return { ok: true as const, data: undefined };
  });
}

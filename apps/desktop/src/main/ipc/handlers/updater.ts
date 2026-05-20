import { ipcMain } from 'electron';
import { IpcChannel } from '@rx-connect/shared';
import { checkForUpdates, quitAndInstallUpdate } from '../../auto-updater.js';

export function registerUpdaterHandlers(): void {
  ipcMain.handle(IpcChannel.UpdateCheck, async () => {
    checkForUpdates();
    return { ok: true as const, data: undefined };
  });

  ipcMain.handle(IpcChannel.UpdateQuitAndInstall, async () => {
    quitAndInstallUpdate();
    return { ok: true as const, data: undefined };
  });
}

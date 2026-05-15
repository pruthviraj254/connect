import { ipcMain, Notification, app, dialog, net } from 'electron';
import { IpcChannel } from '@rx-connect/shared';
import log from 'electron-log';
import { getMainWindow } from '../../lifecycle.js';

export function registerAppHandlers(): void {
  ipcMain.handle(IpcChannel.AppGetVersion, async () => app.getVersion());

  ipcMain.handle(IpcChannel.AppGetPath, async (_e, name: 'home' | 'userData' | 'sessionData' | 'temp') =>
    app.getPath(name),
  );

  ipcMain.handle(IpcChannel.AppSetBadgeCount, async (_e, count: number) => {
    if (process.platform === 'darwin') {
      app.setBadgeCount(count);
    }
  });

  ipcMain.handle(
    IpcChannel.AppShowNotification,
    async (_e, payload: { title: string; body: string }) => {
      if (!Notification.isSupported()) {
        log.warn('Notifications not supported');
        return { ok: false as const, error: 'unsupported' };
      }
      const notification = new Notification({ title: payload.title, body: payload.body });
      notification.show();
      return { ok: true as const, data: undefined };
    },
  );

  ipcMain.handle(IpcChannel.AppSetLoginItemOpenAtLogin, async (_e, open: boolean) => {
    app.setLoginItemSettings({ openAtLogin: open });
    return { ok: true as const, data: open };
  });

  ipcMain.handle(IpcChannel.AppGetOnlineStatus, async () => ({ online: net.isOnline() }));

  ipcMain.handle(IpcChannel.DialogOpenFile, async () => {
    const win = getMainWindow();
    if (win) {
      return dialog.showOpenDialog(win, { properties: ['openFile'] });
    }
    return dialog.showOpenDialog({ properties: ['openFile'] });
  });

  ipcMain.handle(IpcChannel.DialogSaveFile, async () => {
    const win = getMainWindow();
    if (win) {
      return dialog.showSaveDialog(win, {});
    }
    return dialog.showSaveDialog({});
  });
}

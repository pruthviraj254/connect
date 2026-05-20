import { app, BrowserWindow, dialog } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { getMainWindow } from './lifecycle.js';

const TAG = '[auto-updater]';

function notifyRenderer(channel: string, payload: unknown): void {
  const win = getMainWindow() ?? BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

export function initAutoUpdater(): void {
  if (process.platform !== 'win32') {
    return;
  }
  if (!app.isPackaged) {
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => {
    log.info(`${TAG} checking-for-update`);
    notifyRenderer('update:checking', null);
  });

  autoUpdater.on('update-available', (info) => {
    log.info(`${TAG} update-available`, info.version);
    notifyRenderer('update:available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info(`${TAG} update-not-available`, info?.version ?? 'current');
    notifyRenderer('update:not-available', info);
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info(`${TAG} download-progress`, Math.round(progress.percent));
    notifyRenderer('update:progress', progress);
  });

  autoUpdater.on('error', (err) => {
    log.error(`${TAG} error`, err);
    notifyRenderer('update:error', { message: err.message });
  });

  autoUpdater.on('update-downloaded', async (info) => {
    log.info(`${TAG} update-downloaded`, info.version);
    notifyRenderer('update:downloaded', info);

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Update ready',
      message: `Rx-Connect ${info.version} has been downloaded.`,
      detail:
        'Restart now to apply the update, or it will be applied automatically when you quit the app.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall(false, true);
    }
  });

  void autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error(`${TAG} initial check failed`, err);
  });
}

export function checkForUpdates(): void {
  if (process.platform !== 'win32' || !app.isPackaged) {
    return;
  }
  void autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error(`${TAG} manual check failed`, err);
  });
}

export function quitAndInstallUpdate(): void {
  if (process.platform !== 'win32' || !app.isPackaged) {
    return;
  }
  autoUpdater.quitAndInstall(false, true);
}

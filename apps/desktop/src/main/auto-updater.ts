import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import type { UpdateStatus } from '@rx-connect/shared';
import { getMainWindow } from './lifecycle.js';

const TAG = '[auto-updater]';

const SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);

let currentStatus: UpdateStatus = { phase: 'idle' };

function isUpdaterSupported(): boolean {
  return SUPPORTED_PLATFORMS.has(process.platform) && app.isPackaged;
}

function setStatus(status: UpdateStatus): void {
  currentStatus = status;
  notifyRenderer('update:status', status);
}

function notifyRenderer(channel: string, payload: unknown): void {
  const win = getMainWindow() ?? BrowserWindow.getAllWindows()[0];
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, payload);
  }
}

export function getUpdateCapabilities(): { supported: boolean; status: UpdateStatus } {
  return {
    supported: isUpdaterSupported(),
    status: currentStatus,
  };
}

export function initAutoUpdater(): void {
  if (!isUpdaterSupported()) {
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on('checking-for-update', () => {
    log.info(`${TAG} checking-for-update`);
    setStatus({ phase: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    log.info(`${TAG} update-available`, info.version);
    setStatus({ phase: 'available', version: info.version });
  });

  autoUpdater.on('update-not-available', (info) => {
    log.info(`${TAG} update-not-available`, info?.version ?? 'current');
    setStatus({ phase: 'not-available', version: info?.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    log.info(`${TAG} download-progress`, Math.round(progress.percent));
    setStatus({ phase: 'downloading', percent: Math.round(progress.percent) });
  });

  autoUpdater.on('error', (err) => {
    log.error(`${TAG} error`, err);
    setStatus({ phase: 'error', message: err.message });
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`${TAG} update-downloaded`, info.version);
    setStatus({ phase: 'downloaded', version: info.version });
  });

  void autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error(`${TAG} initial check failed`, err);
  });
}

export function checkForUpdates(): void {
  if (!isUpdaterSupported()) {
    return;
  }
  void autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error(`${TAG} manual check failed`, err);
  });
}

export function quitAndInstallUpdate(): void {
  if (!isUpdaterSupported()) {
    return;
  }
  autoUpdater.quitAndInstall(false, true);
}

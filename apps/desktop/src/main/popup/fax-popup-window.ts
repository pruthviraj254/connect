import path from 'node:path';
import { app, BrowserWindow } from 'electron';
import log from 'electron-log';
import type { PrintJobRecord } from '@rx-connect/shared';
import { getMainWindow } from '../lifecycle.js';

const popupJobs = new Map<number, PrintJobRecord>();
let activePopup: BrowserWindow | null = null;

export function getJobForSender(senderId: number): PrintJobRecord | null {
  return popupJobs.get(senderId) ?? null;
}

export function closePopupForSender(sender: Electron.WebContents): void {
  const win = BrowserWindow.fromWebContents(sender);
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

function focusPopupWindow(win: BrowserWindow): void {
  if (win.isDestroyed()) return;
  win.show();
  win.focus();
  if (process.platform === 'win32') {
    win.setAlwaysOnTop(true, 'screen-saver');
    win.flashFrame(true);
    app.focus({ steal: true });
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(false);
      }
    }, 800);
  }
}

export async function openFaxPopup(job: PrintJobRecord): Promise<void> {
  const pathKey = job.pdfPath.toLowerCase();

  if (activePopup && !activePopup.isDestroyed()) {
    const senderId = activePopup.webContents.id;
    const current = popupJobs.get(senderId);
    if (current?.pdfPath.toLowerCase() === pathKey) {
      popupJobs.set(senderId, job);
      log.info('[fax-popup] refocus existing', job.id);
      focusPopupWindow(activePopup);
      return;
    }
    activePopup.close();
    activePopup = null;
  }

  const preloadPath = path.join(__dirname, 'preload.js');
  const mainWin = getMainWindow();

  const win = new BrowserWindow({
    width: 520,
    height: 720,
    minWidth: 480,
    minHeight: 600,
    show: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    title: 'OneRx Fax',
    parent: process.platform === 'win32' && mainWin && !mainWin.isDestroyed() ? mainWin : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  activePopup = win;
  win.setMenu(null);
  const senderId = win.webContents.id;
  popupJobs.set(senderId, job);

  win.once('ready-to-show', () => {
    focusPopupWindow(win);
  });

  win.on('closed', () => {
    popupJobs.delete(senderId);
    if (activePopup === win) {
      activePopup = null;
    }
    log.info('[fax-popup] closed', job.id);
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  const url = devUrl
    ? `${devUrl.replace(/\/$/, '')}/fax-popup/?jobId=${encodeURIComponent(job.id)}`
    : `app://rxconnect/fax-popup/?jobId=${encodeURIComponent(job.id)}`;

  log.info('[fax-popup] opening', { jobId: job.id, pdfPath: job.pdfPath, url });
  await win.loadURL(url);
}

import path from 'node:path';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import type { PrintJobRecord } from '@rx-connect/shared';
import { captureMainUiBeforePopup, restoreMainUiAfterPopup } from '../lifecycle.js';
import { getRendererLoadUrl } from '../renderer-url.js';

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
  if (win.isMinimized()) {
    win.restore();
  }
  if (process.platform === 'win32') {
    // Independent top-level window — must stay above other apps when main is minimized.
    win.setAlwaysOnTop(true, 'screen-saver');
  }
  win.show();
  win.focus();
  if (process.platform === 'win32') {
    win.moveTop();
    win.flashFrame(true);
    // Do not app.focus({ steal: true }) — that raises the hidden main window too.
    win.once('blur', () => {
      if (!win.isDestroyed()) {
        win.setAlwaysOnTop(false);
      }
    });
  }
}

export async function openFaxPopup(job: PrintJobRecord): Promise<void> {
  captureMainUiBeforePopup();
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
    // No parent on Windows — child windows are hidden when the main window is minimized.
    skipTaskbar: process.platform === 'win32',
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
    restoreMainUiAfterPopup();
    log.info('[fax-popup] closed', job.id);
  });

  const url = getRendererLoadUrl(`/fax-popup/?jobId=${encodeURIComponent(job.id)}`);

  log.info('[fax-popup] opening', { jobId: job.id, pdfPath: job.pdfPath, url });
  await win.loadURL(url);
}

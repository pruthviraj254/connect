import path from 'node:path';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import type { PrintJobRecord } from '@rx-connect/shared';

const popupJobs = new Map<number, PrintJobRecord>();

export function getJobForSender(senderId: number): PrintJobRecord | null {
  return popupJobs.get(senderId) ?? null;
}

export function closePopupForSender(sender: Electron.WebContents): void {
  const win = BrowserWindow.fromWebContents(sender);
  if (win && !win.isDestroyed()) {
    win.close();
  }
}

export async function openFaxPopup(job: PrintJobRecord): Promise<void> {
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
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  win.setMenu(null);
  const senderId = win.webContents.id;
  popupJobs.set(senderId, job);

  win.once('ready-to-show', () => {
    if (!win.isDestroyed()) {
      win.show();
    }
  });

  win.on('closed', () => {
    // webContents is destroyed on 'closed' — do not touch win.webContents here.
    popupJobs.delete(senderId);
    log.info('[fax-popup] closed', job.id);
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL;
  const url = devUrl
    ? `${devUrl.replace(/\/$/, '')}/fax-popup/?jobId=${encodeURIComponent(job.id)}`
    : `app://rxconnect/fax-popup/?jobId=${encodeURIComponent(job.id)}`;

  log.info('[fax-popup] opening', { jobId: job.id, pdfPath: job.pdfPath, url });
  await win.loadURL(url);
}

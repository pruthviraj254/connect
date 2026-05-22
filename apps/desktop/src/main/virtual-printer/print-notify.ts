import { BrowserWindow } from 'electron';
import type { PrintJobRecord } from '@rx-connect/shared';
import { hideMainWindow } from '../lifecycle.js';
import { openFaxPopup } from '../popup/fax-popup-window.js';
import { refreshTrayMenu } from '../tray.js';
import { PRINT_JOB_INCOMING_CHANNEL } from './spool-paths.js';

/** Avoid duplicate popups when raw-print-server and spool watcher both see the same file. */
const recentlyNotified = new Map<string, number>();
const NOTIFY_DEDUPE_MS = 15_000;

function shouldNotify(job: PrintJobRecord): boolean {
  const key = job.pdfPath.toLowerCase();
  const now = Date.now();
  const last = recentlyNotified.get(key);
  if (last !== undefined && now - last < NOTIFY_DEDUPE_MS) {
    return false;
  }
  recentlyNotified.set(key, now);
  for (const [k, t] of recentlyNotified) {
    if (now - t > NOTIFY_DEDUPE_MS) recentlyNotified.delete(k);
  }
  return true;
}

export function broadcastPrintJobToAll(job: PrintJobRecord): void {
  if (!shouldNotify(job)) {
    return;
  }
  hideMainWindow();
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && !win.webContents.getURL().includes('/fax-popup')) {
      win.webContents.send(PRINT_JOB_INCOMING_CHANNEL, job);
    }
  }
  void openFaxPopup(job);
  refreshTrayMenu();
}

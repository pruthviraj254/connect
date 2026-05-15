import { BrowserWindow } from 'electron';
import type { PrintJobRecord } from '@rx-connect/shared';
import { getMainWindow } from '../lifecycle.js';
import { PRINT_JOB_INCOMING_CHANNEL } from './spool-paths.js';

export function broadcastPrintJobToAll(job: PrintJobRecord): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(PRINT_JOB_INCOMING_CHANNEL, job);
    }
  }
  const primary = getMainWindow();
  if (primary && !primary.isDestroyed()) {
    void primary.focus();
  }
}

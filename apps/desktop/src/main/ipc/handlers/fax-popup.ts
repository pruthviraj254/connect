import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { BrowserWindow, dialog, ipcMain } from 'electron';
import { IpcChannel, type IpcResult, type PrintJobRecord } from '@rx-manager/shared';
import log from 'electron-log';
import {
  closePopupForSender,
  getJobForSender,
} from '../../popup/fax-popup-window.js';
import { getWritableSpoolDir } from '../../virtual-printer/spool-paths.js';

export function registerFaxPopupHandlers(): void {
  ipcMain.handle(IpcChannel.FaxPopupGetJob, async (event): Promise<IpcResult<PrintJobRecord>> => {
    const job = getJobForSender(event.sender.id);
    if (!job) {
      log.warn('[fax-popup] get-job: no job for sender', event.sender.id);
      return { ok: false, error: 'job_not_found' };
    }
    return { ok: true, data: job };
  });

  ipcMain.handle(IpcChannel.FaxPopupClose, async (event): Promise<IpcResult<null>> => {
    const sender = event.sender;
    // Reply before closing so the renderer IPC call does not hit a destroyed webContents.
    setImmediate(() => closePopupForSender(sender));
    return { ok: true, data: null };
  });

  ipcMain.handle(IpcChannel.FaxPopupBrowsePdf, async (event): Promise<IpcResult<string | null>> => {
    const parent = BrowserWindow.fromWebContents(event.sender);
    const dialogOpts = {
      properties: ['openFile' as const],
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const result = parent
      ? await dialog.showOpenDialog(parent, dialogOpts)
      : await dialog.showOpenDialog(dialogOpts);
    if (result.canceled || !result.filePaths[0]) {
      return { ok: true, data: null };
    }
    const chosen = result.filePaths[0];
    const spoolDir = getWritableSpoolDir();
    await fs.mkdir(spoolDir, { recursive: true });
    const dest = path.join(spoolDir, `browse_${randomUUID()}.pdf`);
    await fs.copyFile(chosen, dest);
    log.info('[fax-popup] browse copied to spool', dest);
    return { ok: true, data: dest };
  });
}

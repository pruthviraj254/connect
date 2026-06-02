import fs from 'node:fs/promises';
import path from 'node:path';
import { dialog, ipcMain } from 'electron';
import log from 'electron-log';
import { IpcChannel, type IpcResult, type PrintJobRecord } from '@rx-manager/shared';
import {
  deletePrintJob,
  getPrintJobAbsolutePdfPath,
  getPrintJobPagePngs,
  listPrintJobs,
  readPdfAsBase64,
  resolvePrintJobPreviewPath,
} from '../../virtual-printer/job-store.js';

export function registerPrintJobHandlers(): void {
  ipcMain.handle(IpcChannel.PrintJobList, async (): Promise<IpcResult<PrintJobRecord[]>> => {
    try {
      const data = await listPrintJobs();
      return { ok: true, data };
    } catch {
      return { ok: false, error: 'list_failed' };
    }
  });

  ipcMain.handle(
    IpcChannel.PrintJobGetPdfBase64,
    async (_e, raw: unknown): Promise<IpcResult<string>> => {
      if (typeof raw !== 'string' || raw.length === 0) {
        return { ok: false, error: 'invalid_payload' };
      }
      return readPdfAsBase64(raw);
    },
  );

  ipcMain.handle(
    IpcChannel.PrintJobGetPreviewPath,
    async (_e, raw: unknown): Promise<IpcResult<string>> => {
      if (typeof raw !== 'string' || raw.length === 0) {
        return { ok: false, error: 'invalid_payload' };
      }
      return resolvePrintJobPreviewPath(raw);
    },
  );

  ipcMain.handle(
    IpcChannel.PrintJobGetPagePngs,
    async (_e, raw: unknown): Promise<IpcResult<string[]>> => {
      if (typeof raw !== 'string' || raw.length === 0) {
        return { ok: false, error: 'invalid_payload' };
      }
      return getPrintJobPagePngs(raw);
    },
  );

  ipcMain.handle(
    IpcChannel.PrintJobDownload,
    async (_e, raw: unknown): Promise<IpcResult<string | null>> => {
      if (typeof raw !== 'string' || raw.length === 0) {
        return { ok: false, error: 'invalid_payload' };
      }

      const resolved = await getPrintJobAbsolutePdfPath(raw);
      if (!resolved.ok) return resolved;

      const defaultName = `${path.basename(resolved.data, path.extname(resolved.data))}.pdf`;
      const result = await dialog.showSaveDialog({
        title: 'Save fax PDF',
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        return { ok: true, data: null };
      }

      try {
        await fs.copyFile(resolved.data, result.filePath);
        log.info('[print-job] downloaded to', result.filePath);
        return { ok: true, data: result.filePath };
      } catch (e) {
        log.error('[print-job] download failed', e);
        return { ok: false, error: 'download_failed' };
      }
    },
  );

  ipcMain.handle(IpcChannel.PrintJobDelete, async (_e, raw: unknown): Promise<IpcResult<null>> => {
    if (typeof raw !== 'string' || raw.length === 0) {
      return { ok: false, error: 'invalid_payload' };
    }
    return deletePrintJob(raw);
  });
}

import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult, type PrintJobRecord } from '@rx-connect/shared';
import { deletePrintJob, listPrintJobs, readPdfAsBase64 } from '../../virtual-printer/job-store.js';

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

  ipcMain.handle(IpcChannel.PrintJobDelete, async (_e, raw: unknown): Promise<IpcResult<null>> => {
    if (typeof raw !== 'string' || raw.length === 0) {
      return { ok: false, error: 'invalid_payload' };
    }
    return deletePrintJob(raw);
  });
}

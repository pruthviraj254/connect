import { ipcMain } from 'electron';
import {
  IpcChannel,
  type FaxSendPayload,
  type FaxSendResult,
  type IpcResult,
  type PrintJobRecord,
} from '@rx-connect/shared';
import { sendFaxWithConfiguredProvider } from '../../fax/send-fax.js';
import { isAllowedSpoolPath, listPrintJobs } from '../../virtual-printer/job-store.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseFaxSend(value: unknown): FaxSendPayload | null {
  if (!isRecord(value)) return null;
  const to = value.to;
  const pdfPath = value.pdfPath;
  if (typeof to !== 'string' || typeof pdfPath !== 'string') return null;
  const from = value.from;
  return {
    to,
    pdfPath,
    from: typeof from === 'string' ? from : undefined,
  };
}

export function registerFaxHandlers(): void {
  ipcMain.handle(IpcChannel.FaxList, async (): Promise<IpcResult<PrintJobRecord[]>> => {
    try {
      const jobs = await listPrintJobs();
      const pdfs = jobs.filter((j) => j.fileName.toLowerCase().endsWith('.pdf'));
      return { ok: true, data: pdfs };
    } catch {
      return { ok: false, error: 'list_failed' };
    }
  });

  ipcMain.handle(
    IpcChannel.FaxSend,
    async (_event, raw: unknown): Promise<IpcResult<FaxSendResult>> => {
      const payload = parseFaxSend(raw);
      if (!payload) {
        return { ok: false, error: 'invalid_payload' };
      }
      if (!isAllowedSpoolPath(payload.pdfPath)) {
        return { ok: false, error: 'path_not_allowed' };
      }
      try {
        const data = await sendFaxWithConfiguredProvider(payload);
        return { ok: true, data };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'send_failed';
        return { ok: false, error: msg };
      }
    },
  );
}

import { ipcMain } from 'electron';
import log from 'electron-log';
import {
  IpcChannel,
  type FaxSendPayload,
  type FaxSendResult,
  type FaxSendLogEntry,
  type IpcResult,
  type PrintJobRecord,
} from '@rx-connect/shared';
import { sendFaxWithConfiguredProvider } from '../../fax/send-fax.js';
import { appendSendLog, clearSendLog, listSendLog } from '../../fax/send-log-store.js';
import { isAllowedSpoolPath, listPrintJobs } from '../../virtual-printer/job-store.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseResolution(value: unknown): FaxSendPayload['resolution'] | undefined {
  if (value === 'standard' || value === 'fine' || value === 'superfine') return value;
  return undefined;
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
    resolution: parseResolution(value.resolution),
    coverSubject: typeof value.coverSubject === 'string' ? value.coverSubject : undefined,
    coverMessage: typeof value.coverMessage === 'string' ? value.coverMessage : undefined,
    jobId: typeof value.jobId === 'string' ? value.jobId : undefined,
    jobTitle: typeof value.jobTitle === 'string' ? value.jobTitle : undefined,
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

      log.info('[fax-popup] send', {
        to: payload.to,
        pdfPath: payload.pdfPath,
        jobId: payload.jobId,
      });

      try {
        const data = await sendFaxWithConfiguredProvider(payload);
        appendSendLog({ payload, result: data, status: 'sent' });
        return { ok: true, data };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'send_failed';
        appendSendLog({ payload, status: 'failed', error: msg });
        return { ok: false, error: msg };
      }
    },
  );

  ipcMain.handle(IpcChannel.FaxSendLogList, async (): Promise<IpcResult<FaxSendLogEntry[]>> => {
    return { ok: true, data: listSendLog() };
  });

  ipcMain.handle(IpcChannel.FaxSendLogClear, async (): Promise<IpcResult<null>> => {
    clearSendLog();
    return { ok: true, data: null };
  });
}

import { randomUUID } from 'node:crypto';
import { BrowserWindow } from 'electron';
import log from 'electron-log';
import type { FaxSendLogEntry, FaxSendPayload, FaxSendResult } from '@rx-connect/shared';
import { getStore } from '../store.js';

const STORE_KEY = 'fax-send-log';
const MAX_ENTRIES = 500;
export const FAX_SEND_LOG_UPDATED_CHANNEL = 'fax-send-log:updated' as const;

function readAll(): FaxSendLogEntry[] {
  const raw = getStore().get(STORE_KEY);
  return Array.isArray(raw) ? (raw as FaxSendLogEntry[]) : [];
}

function writeAll(entries: FaxSendLogEntry[]): void {
  getStore().set(STORE_KEY, entries.slice(0, MAX_ENTRIES));
}

export function listSendLog(): FaxSendLogEntry[] {
  return readAll().sort((a, b) => (a.sentAt < b.sentAt ? 1 : -1));
}

export function clearSendLog(): void {
  writeAll([]);
  log.info('[send-log-store] cleared');
  broadcastSendLogUpdated();
}

export function appendSendLog(params: {
  payload: FaxSendPayload;
  result?: FaxSendResult;
  status: FaxSendLogEntry['status'];
  error?: string;
}): FaxSendLogEntry {
  const entry: FaxSendLogEntry = {
    id: randomUUID(),
    jobId: params.payload.jobId ?? 'unknown',
    jobTitle: params.payload.jobTitle ?? 'Print job',
    pdfPath: params.payload.pdfPath,
    to: params.payload.to,
    from: params.payload.from,
    resolution: params.payload.resolution,
    coverSubject: params.payload.coverSubject,
    coverMessage: params.payload.coverMessage,
    provider: params.result?.provider ?? 'unknown',
    externalId: params.result?.externalId,
    status: params.status,
    error: params.error,
    sentAt: new Date().toISOString(),
  };

  const all = readAll();
  all.unshift(entry);
  writeAll(all);
  log.info('[send-log-store] appended', {
    id: entry.id,
    jobId: entry.jobId,
    to: entry.to,
    status: entry.status,
    provider: entry.provider,
  });
  broadcastSendLogUpdated();
  return entry;
}

export function broadcastSendLogUpdated(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(FAX_SEND_LOG_UPDATED_CHANNEL);
    }
  }
}

import fs from 'node:fs/promises';
import path from 'node:path';
import log from 'electron-log';
import type { FaxSendPayload, FaxSendResult } from '@rx-connect/shared';
import { isAllowedSpoolPath } from '../virtual-printer/job-store.js';

async function readPdfMeta(pdfPath: string): Promise<{ sizeBytes: number; fileName: string }> {
  const stat = await fs.stat(pdfPath);
  return { sizeBytes: stat.size, fileName: path.basename(pdfPath) };
}

async function sendViaMock(payload: FaxSendPayload): Promise<FaxSendResult> {
  if (!isAllowedSpoolPath(payload.pdfPath)) {
    throw new Error('path_not_allowed');
  }
  const meta = await readPdfMeta(payload.pdfPath);
  const head = await fs.readFile(payload.pdfPath);
  const isPdf = head.length >= 5 && head.subarray(0, 5).toString() === '%PDF-';
  if (!isPdf) {
    throw new Error('file_is_not_pdf');
  }
  await new Promise((r) => setTimeout(r, 800));
  const externalId = `mock-${Date.now()}`;
  log.info('[send-fax] mock send', {
    to: payload.to,
    pdfPath: payload.pdfPath,
    fileName: meta.fileName,
    sizeBytes: meta.sizeBytes,
    externalId,
    resolution: payload.resolution,
    coverSubject: payload.coverSubject,
  });
  return {
    provider: 'mock',
    externalId,
    raw: {
      ok: true,
      message: 'mock provider — no fax was actually sent',
      pdfPath: payload.pdfPath,
      fileName: meta.fileName,
      sizeBytes: meta.sizeBytes,
    },
  };
}

async function sendViaTelnyx(payload: FaxSendPayload): Promise<FaxSendResult> {
  if (!isAllowedSpoolPath(payload.pdfPath)) {
    throw new Error('path_not_allowed');
  }
  const key = process.env.TELNYX_API_KEY;
  const connectionId = process.env.TELNYX_FAX_CONNECTION_ID;
  const from = payload.from ?? process.env.TELNYX_FAX_FROM;
  if (!key || !connectionId || !from) {
    throw new Error('missing_telnyx_env');
  }
  const bytes = await fs.readFile(payload.pdfPath);
  const form = new FormData();
  form.set('connection_id', connectionId);
  form.set('from', from);
  form.set('to', payload.to);
  form.append(
    'media',
    new Blob([bytes], { type: 'application/pdf' }),
    'document.pdf',
  );
  const res = await fetch('https://api.telnyx.com/v2/faxes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as { data?: { id?: string } };
  if (!res.ok) {
    throw new Error(`telnyx_http_${res.status}`);
  }
  return {
    provider: 'telnyx',
    externalId: json.data?.id,
    raw: json,
  };
}

export async function sendFaxWithConfiguredProvider(payload: FaxSendPayload): Promise<FaxSendResult> {
  const provider = (process.env.FAX_PROVIDER ?? 'mock').toLowerCase();
  if (provider === 'mock') return sendViaMock(payload);
  if (provider === 'telnyx') return sendViaTelnyx(payload);
  throw new Error(`unsupported_fax_provider: ${provider}`);
}

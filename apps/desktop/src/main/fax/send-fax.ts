import fs from 'node:fs/promises';
import type { FaxSendPayload, FaxSendResult } from '@rx-connect/shared';
import { isAllowedSpoolPath } from '../virtual-printer/job-store.js';

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
  const provider = (process.env.FAX_PROVIDER ?? 'telnyx').toLowerCase();
  if (provider !== 'telnyx') {
    throw new Error('unsupported_fax_provider_set_FAX_PROVIDER_telnyx');
  }
  return sendViaTelnyx(payload);
}

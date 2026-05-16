import { protocol } from 'electron';
import fs from 'node:fs/promises';
import { ensureJobPdf, extractEmbeddedPdfIfAny } from './virtual-printer/ensure-job-pdf.js';
import { isAllowedSpoolPath } from './virtual-printer/job-store.js';

export const RX_PDF_SCHEME = 'rx-pdf';

async function pathToServe(filePath: string): Promise<string | null> {
  let resolved = filePath;
  if (process.platform === 'win32') {
    const embedded = await extractEmbeddedPdfIfAny(resolved);
    if (embedded) resolved = embedded;
    const pdf = await ensureJobPdf(resolved);
    if (pdf) resolved = pdf;
  }
  try {
    const head = Buffer.alloc(5);
    const fh = await fs.open(resolved, 'r');
    try {
      await fh.read(head, 0, 5, 0);
    } finally {
      await fh.close();
    }
    if (head.toString('utf8') !== '%PDF-') {
      return null;
    }
    return resolved;
  } catch {
    return null;
  }
}

export function registerPdfPreviewProtocol(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: RX_PDF_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        corsEnabled: true,
      },
    },
  ]);
}

export function wirePdfPreviewProtocol(): void {
  protocol.handle(RX_PDF_SCHEME, async (request) => {
    const url = new URL(request.url);
    if (url.hostname !== 'open') {
      return new Response('Not found', { status: 404 });
    }
    const filePath = url.searchParams.get('path');
    if (!filePath || !isAllowedSpoolPath(filePath)) {
      return new Response('Forbidden', { status: 403 });
    }

    const servePath = await pathToServe(filePath);
    if (!servePath) {
      return new Response('Not a PDF', { status: 415 });
    }

    const body = await fs.readFile(servePath);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': String(body.length),
        'Cache-Control': 'no-store',
      },
    });
  });
}

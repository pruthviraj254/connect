import { net, protocol } from 'electron';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs/promises';
import { isAllowedSpoolPath } from './virtual-printer/job-store.js';

export const RX_PDF_SCHEME = 'rx-pdf';

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
    try {
      const head = Buffer.alloc(5);
      const fh = await fs.open(filePath, 'r');
      try {
        await fh.read(head, 0, 5, 0);
      } finally {
        await fh.close();
      }
      if (head.toString('utf8') !== '%PDF-') {
        return new Response('Not a PDF', { status: 415 });
      }
    } catch {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).href);
  });
}

import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { getWritableSpoolDir, RAW_PRINT_PORT } from './spool-paths.js';
import { tryConvertToPdfWithGhostscript } from './gs-convert.js';

let server: net.Server | null = null;

async function persistRawJob(body: Buffer): Promise<void> {
  const spool = getWritableSpoolDir();
  await fs.mkdir(spool, { recursive: true });
  const stamp = Date.now();
  const base = path.join(spool, `raw_${stamp}_${randomUUID().slice(0, 8)}`);

  if (body.length >= 5 && body.subarray(0, 5).toString() === '%PDF-') {
    const pdfPath = `${base}.pdf`;
    await fs.writeFile(pdfPath, body);
    return;
  }

  const rawPath = `${base}.bin`;
  await fs.writeFile(rawPath, body);
  const pdfPath = `${base}.pdf`;
  const ok = await tryConvertToPdfWithGhostscript(rawPath, pdfPath);
  if (ok) {
    await fs.unlink(rawPath).catch(() => undefined);
  }
}

export function startRawPrintServer(): void {
  if (process.platform !== 'win32') {
    return;
  }
  if (server) {
    return;
  }
  server = net.createServer((socket) => {
    const chunks: Buffer[] = [];
    socket.on('data', (d) => {
      chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d));
    });
    socket.on('end', () => {
      void persistRawJob(Buffer.concat(chunks)).catch(() => undefined);
    });
    socket.on('error', () => undefined);
  });
  server.on('error', (err) => {
    console.error('[virtual-printer] raw print server error', err);
  });
  server.listen(RAW_PRINT_PORT, '127.0.0.1', () => {
    console.info(`[virtual-printer] Windows raw print listener on 127.0.0.1:${RAW_PRINT_PORT}`);
  });
}

export function stopRawPrintServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}

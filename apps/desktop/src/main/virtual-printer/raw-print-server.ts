import net from 'node:net';
import path from 'node:path';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import { randomUUID } from 'node:crypto';
import type { PrintJobRecord } from '@rx-connect/shared';
import log from 'electron-log';
import { getWritableSpoolDir, RAW_PRINT_PORT } from './spool-paths.js';
import { convertRawFileToPdf } from './gs-convert.js';
import { pdfByteOffset } from './raw-print-format.js';
import { broadcastPrintJobToAll } from './print-notify.js';

let server: net.Server | null = null;

const JOB_IDLE_MS = 2000;
const RAW_PRINT_DEBUG_LOG = path.join(
  process.env.ProgramData ?? 'C:\\ProgramData',
  'Rx-Connect',
  'logs',
  'raw-print.log',
);

function debugLog(message: string): void {
  if (process.platform !== 'win32') return;
  const line = `${new Date().toISOString()} ${message}\n`;
  try {
    const dir = path.dirname(RAW_PRINT_DEBUG_LOG);
    if (!fsSync.existsSync(dir)) {
      fsSync.mkdirSync(dir, { recursive: true });
    }
    fsSync.appendFileSync(RAW_PRINT_DEBUG_LOG, line, 'utf8');
  } catch {
    /* ignore */
  }
}

function idFromFile(name: string): string {
  const base = path.basename(name, path.extname(name));
  return base || name;
}

async function persistRawJob(body: Buffer): Promise<PrintJobRecord | null> {
  if (body.length === 0) {
    debugLog('ignored empty payload');
    return null;
  }

  if (body[0] === 0x02) {
    debugLog('LPR-like payload (port may not be RAW); bytes=' + body.length);
    log.warn('[virtual-printer] received LPR-like data — reinstall printer to use RAW port');
  }

  const spool = getWritableSpoolDir();
  await fs.mkdir(spool, { recursive: true });
  const stamp = Date.now();
  const base = path.join(spool, `raw_${stamp}_${randomUUID().slice(0, 8)}`);
  const receivedAt = new Date().toISOString();

  const pdfStart = pdfByteOffset(body);
  const payload = pdfStart > 0 ? body.subarray(pdfStart) : body;

  if (payload.length >= 5 && payload.subarray(0, 5).toString() === '%PDF-') {
    const fileName = `${path.basename(base)}.pdf`;
    const pdfPath = `${base}.pdf`;
    await fs.writeFile(pdfPath, payload);
    debugLog(`saved pdf ${pdfPath} (${payload.length} bytes)`);
    const record: PrintJobRecord = {
      id: idFromFile(fileName),
      title: fileName.replace(/\.pdf$/i, ''),
      fileName,
      pdfPath,
      receivedAt,
    };
    return record;
  }

  const rawPath = `${base}.bin`;
  await fs.writeFile(rawPath, body);
  debugLog(`saved raw ${rawPath} (${body.length} bytes)`);

  const pdfPath = `${base}.pdf`;
  const ok = await convertRawFileToPdf(rawPath, pdfPath);
  if (ok) {
    await fs.unlink(rawPath).catch(() => undefined);
    const fileName = `${path.basename(base)}.pdf`;
    debugLog(`ghostscript converted to ${pdfPath}`);
    return {
      id: idFromFile(fileName),
      title: fileName.replace(/\.pdf$/i, ''),
      fileName,
      pdfPath,
      receivedAt,
    };
  }

  const fileName = `${path.basename(base)}.bin`;
  debugLog(`kept raw job ${rawPath} (no PDF conversion yet)`);

  const record: PrintJobRecord = {
    id: idFromFile(fileName),
    title: fileName.replace(/\.bin$/i, ''),
    fileName,
    pdfPath: rawPath,
    receivedAt,
  };

  void convertRawFileToPdf(rawPath, pdfPath).then(async (ok) => {
    if (!ok) return;
    try {
      const st = await fs.stat(pdfPath);
      if (st.size < 32) return;
      await fs.unlink(rawPath).catch(() => undefined);
      const pdfRecord: PrintJobRecord = {
        id: idFromFile(`${path.basename(base)}.pdf`),
        title: path.basename(base),
        fileName: `${path.basename(base)}.pdf`,
        pdfPath,
        receivedAt: new Date().toISOString(),
      };
      debugLog(`background conversion ok ${pdfPath}`);
      broadcastPrintJobToAll(pdfRecord);
    } catch {
      /* ignore */
    }
  });

  return record;
}

function handlePrintSocket(socket: net.Socket): void {
  const chunks: Buffer[] = [];
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let finished = false;

  const remote = `${socket.remoteAddress ?? '?'}:${socket.remotePort ?? '?'}`;
  debugLog(`connection from ${remote}`);
  log.info('[virtual-printer] raw print connection', remote);

  const finish = () => {
    if (finished) return;
    finished = true;
    if (idleTimer) clearTimeout(idleTimer);
    socket.destroy();

    void (async () => {
      try {
        const body = Buffer.concat(chunks);
        debugLog(`job complete from ${remote}, ${body.length} bytes`);
        const record = await persistRawJob(body);
        if (record) {
          broadcastPrintJobToAll(record);
          log.info('[virtual-printer] print job captured', record.pdfPath);
        }
      } catch (err) {
        log.error('[virtual-printer] failed to persist raw job', err);
        debugLog(`persist error: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  };

  const scheduleIdleFinish = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(finish, JOB_IDLE_MS);
  };

  socket.on('data', (d) => {
    chunks.push(Buffer.isBuffer(d) ? d : Buffer.from(d));
    scheduleIdleFinish();
  });
  socket.on('end', finish);
  socket.on('close', finish);
  socket.on('error', (err) => {
    debugLog(`socket error ${remote}: ${err.message}`);
    finish();
  });
}

export function startRawPrintServer(): void {
  if (process.platform !== 'win32') {
    return;
  }
  if (server) {
    return;
  }
  server = net.createServer(handlePrintSocket);
  server.on('error', (err) => {
    log.error('[virtual-printer] raw print server error', err);
    debugLog(`server error: ${err.message}`);
  });
  server.listen(RAW_PRINT_PORT, '127.0.0.1', () => {
    const spool = getWritableSpoolDir();
    log.info(`[virtual-printer] Windows raw print listener on 127.0.0.1:${RAW_PRINT_PORT}, spool=${spool}`);
    debugLog(`listening on 127.0.0.1:${RAW_PRINT_PORT}, spool=${spool}`);
  });
}

export function stopRawPrintServer(): void {
  if (server) {
    server.close();
    server = null;
  }
}

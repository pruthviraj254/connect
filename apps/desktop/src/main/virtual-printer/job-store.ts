import fs from 'node:fs/promises';
import path from 'node:path';
import type { IpcResult, PrintJobRecord } from '@rx-connect/shared';
import { getWritableSpoolDir, resolveSpoolDir } from './spool-paths.js';

function idFromFile(name: string): string {
  const base = path.basename(name, path.extname(name));
  return base || name;
}

async function statSafe(p: string): Promise<{ mtimeMs: number } | null> {
  try {
    const s = await fs.stat(p);
    return { mtimeMs: s.mtimeMs };
  } catch {
    return null;
  }
}

async function collectFromDir(dir: string, seen: Set<string>, out: PrintJobRecord[]): Promise<void> {
  let names: string[] = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return;
  }
  for (const name of names) {
    if (!name.endsWith('.pdf') && !name.endsWith('.bin')) continue;
    const full = path.join(dir, name);
    if (seen.has(full)) continue;
    const st = await statSafe(full);
    if (!st) continue;
    seen.add(full);
    out.push({
      id: idFromFile(name),
      title: name.replace(/\.(pdf|bin)$/i, ''),
      fileName: name,
      pdfPath: full,
      receivedAt: new Date(st.mtimeMs).toISOString(),
    });
  }
}

/** Lists jobs from shared spool (if readable) and always from writable user spool. */
export async function listPrintJobs(): Promise<PrintJobRecord[]> {
  const shared = resolveSpoolDir();
  const writable = getWritableSpoolDir();
  const seen = new Set<string>();
  const out: PrintJobRecord[] = [];
  await collectFromDir(shared, seen, out);
  if (writable !== shared) {
    await collectFromDir(writable, seen, out);
  }
  out.sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1));
  return out;
}

export function isAllowedSpoolPath(absPath: string): boolean {
  const allowedDirs = [resolveSpoolDir(), getWritableSpoolDir()];
  const resolved = path.resolve(absPath);
  return allowedDirs.some((d) => {
    const root = path.resolve(d);
    return resolved === root || resolved.startsWith(root + path.sep);
  });
}

export async function readPdfAsBase64(absPath: string): Promise<IpcResult<string>> {
  if (!isAllowedSpoolPath(absPath)) {
    return { ok: false, error: 'path_not_allowed' };
  }
  const resolved = path.resolve(absPath);
  try {
    const buf = await fs.readFile(resolved);
    if (buf.length >= 5 && buf.subarray(0, 5).toString() === '%PDF-') {
      return { ok: true, data: buf.toString('base64') };
    }
    return { ok: false, error: 'not_pdf' };
  } catch {
    return { ok: false, error: 'read_failed' };
  }
}

export async function deletePrintJob(absPath: string): Promise<IpcResult<null>> {
  if (!isAllowedSpoolPath(absPath)) {
    return { ok: false, error: 'path_not_allowed' };
  }
  const resolved = path.resolve(absPath);
  try {
    await fs.unlink(resolved);
    return { ok: true, data: null };
  } catch {
    return { ok: false, error: 'delete_failed' };
  }
}

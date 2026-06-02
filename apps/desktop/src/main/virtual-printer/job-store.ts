import fs from 'node:fs/promises';
import path from 'node:path';
import type { IpcResult, PrintJobRecord } from '@rx-manager/shared';
import { ensureJobPdf, extractEmbeddedPdfIfAny } from './ensure-job-pdf.js';
import { isGhostscriptAvailable, renderPdfToPngs } from './gs-convert.js';
import { getWritableSpoolDir, isAllowedSpoolPath, resolveSpoolDir } from './spool-paths.js';

export { isAllowedSpoolPath } from './spool-paths.js';

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
  const byStem = new Map<string, PrintJobRecord>();
  for (const name of names) {
    if (!name.endsWith('.pdf') && !name.endsWith('.bin')) continue;
    const full = path.join(dir, name);
    const st = await statSafe(full);
    if (!st) continue;
    const stem = name.replace(/\.(pdf|bin)$/i, '');
    const record: PrintJobRecord = {
      id: idFromFile(name),
      title: stem,
      fileName: name,
      pdfPath: full,
      receivedAt: new Date(st.mtimeMs).toISOString(),
    };
    const prev = byStem.get(stem);
    if (!prev || name.toLowerCase().endsWith('.pdf')) {
      byStem.set(stem, record);
    }
  }
  for (const record of byStem.values()) {
    if (seen.has(record.pdfPath)) continue;
    seen.add(record.pdfPath);
    out.push(record);
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

async function resolveToReadablePdfPath(absPath: string): Promise<IpcResult<string>> {
  if (!isAllowedSpoolPath(absPath)) {
    return { ok: false, error: 'path_not_allowed' };
  }

  let resolved = path.resolve(absPath);

  if (process.platform === 'win32') {
    const embedded = await extractEmbeddedPdfIfAny(resolved);
    if (embedded) resolved = embedded;
    const pdfPath = await ensureJobPdf(resolved);
    if (pdfPath) resolved = pdfPath;
  }

  try {
    const buf = await fs.readFile(resolved);
    if (buf.length >= 5 && buf.subarray(0, 5).toString() === '%PDF-') {
      return { ok: true, data: resolved };
    }
    return {
      ok: false,
      error: process.platform === 'win32' ? 'conversion_failed' : 'not_pdf',
    };
  } catch {
    return { ok: false, error: 'read_failed' };
  }
}

/** Resolves spool path to a PDF on disk (converts on Windows). Used for rx-pdf preview. */
export async function resolvePrintJobPreviewPath(absPath: string): Promise<IpcResult<string>> {
  return resolveToReadablePdfPath(absPath);
}

export async function readPdfAsBase64(absPath: string): Promise<IpcResult<string>> {
  const resolved = await resolveToReadablePdfPath(absPath);
  if (!resolved.ok) return resolved;
  try {
    const buf = await fs.readFile(resolved.data);
    return { ok: true, data: buf.toString('base64') };
  } catch {
    return { ok: false, error: 'read_failed' };
  }
}

/**
 * Renders the print job's PDF to base64 PNG pages for safe in-renderer preview.
 * Resolves/converts spool file to a valid PDF first, then rasterizes via Ghostscript.
 */
export async function getPrintJobPagePngs(absPath: string): Promise<IpcResult<string[]>> {
  const resolved = await resolveToReadablePdfPath(absPath);
  if (!resolved.ok) return resolved;

  if (!isGhostscriptAvailable()) {
    return { ok: false, error: 'ghostscript_unavailable' };
  }

  try {
    const pages = await renderPdfToPngs(resolved.data);
    if (pages.length === 0) {
      return { ok: false, error: 'render_failed' };
    }
    return { ok: true, data: pages };
  } catch {
    return { ok: false, error: 'render_failed' };
  }
}

/** Returns the resolved PDF path so the IPC layer can copy it to a user-chosen location. */
export async function getPrintJobAbsolutePdfPath(absPath: string): Promise<IpcResult<string>> {
  return resolveToReadablePdfPath(absPath);
}

export async function deletePrintJob(absPath: string): Promise<IpcResult<null>> {
  if (!isAllowedSpoolPath(absPath)) {
    return { ok: false, error: 'path_not_allowed' };
  }
  const resolved = path.resolve(absPath);
  const stem = resolved.replace(/\.(pdf|bin)$/i, '');
  const siblings = [`${stem}.pdf`, `${stem}.bin`];
  let deleted = false;
  for (const p of [resolved, ...siblings]) {
    try {
      await fs.unlink(p);
      deleted = true;
    } catch {
      /* file may not exist */
    }
  }
  return deleted ? { ok: true, data: null } : { ok: false, error: 'delete_failed' };
}

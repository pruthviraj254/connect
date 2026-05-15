import fs from 'node:fs/promises';
import path from 'node:path';
import log from 'electron-log';
import { convertRawFileToPdf, isGhostscriptAvailable } from './gs-convert.js';
import { isAllowedSpoolPath } from './spool-paths.js';
import { pdfByteOffset } from './raw-print-format.js';

async function isValidPdfFile(filePath: string): Promise<boolean> {
  try {
    const head = await fs.readFile(filePath);
    return head.length >= 5 && head.subarray(0, 5).toString() === '%PDF-';
  } catch {
    return false;
  }
}

/**
 * Ensures a spool job path points to a readable PDF (converts .bin / raw on Windows).
 * Returns resolved PDF path or null. No-op path on macOS when file is already PDF.
 */
export async function ensureJobPdf(absPath: string): Promise<string | null> {
  if (!isAllowedSpoolPath(absPath)) return null;

  const resolved = path.resolve(absPath);
  if (await isValidPdfFile(resolved)) {
    return resolved;
  }

  if (process.platform !== 'win32') {
    return null;
  }

  const pdfOut =
    resolved.toLowerCase().endsWith('.pdf') ? resolved : `${resolved.replace(/\.bin$/i, '')}.pdf`;

  if (resolved !== pdfOut && (await isValidPdfFile(pdfOut))) {
    return pdfOut;
  }

  log.info('[virtual-printer] converting job to PDF', resolved);
  const ok = await convertRawFileToPdf(resolved, pdfOut);
  if (ok && (await isValidPdfFile(pdfOut))) {
    if (resolved !== pdfOut && resolved.toLowerCase().endsWith('.bin')) {
      await fs.unlink(resolved).catch(() => undefined);
    }
    return pdfOut;
  }

  if (!isGhostscriptAvailable()) {
    log.warn('[virtual-printer] Ghostscript unavailable — rebuild installer with bundled ghostscript-win');
  }

  return null;
}

/** Extract embedded PDF from a file if present (PJL-wrapped jobs). */
export async function extractEmbeddedPdfIfAny(absPath: string): Promise<string | null> {
  if (!isAllowedSpoolPath(absPath)) return null;
  const resolved = path.resolve(absPath);
  if (await isValidPdfFile(resolved)) return resolved;

  let body: Buffer;
  try {
    body = await fs.readFile(resolved);
  } catch {
    return null;
  }

  const offset = pdfByteOffset(body);
  if (offset < 0) return null;

  const pdfOut = `${resolved.replace(/\.bin$/i, '')}.pdf`;
  await fs.writeFile(pdfOut, body.subarray(offset));
  if (await isValidPdfFile(pdfOut)) {
    return pdfOut;
  }
  return null;
}

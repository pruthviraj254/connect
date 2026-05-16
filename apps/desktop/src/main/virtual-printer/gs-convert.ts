import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { app } from 'electron';
import log from 'electron-log';
import { detectRawPrintFormat, pdfByteOffset, type RawPrintFormat } from './raw-print-format.js';

let cachedGsBin: string | null | undefined;

function bundledGhostscriptCandidates(): string[] {
  if (process.platform !== 'win32') return [];

  const out: string[] = [];
  if (process.resourcesPath) {
    out.push(path.join(process.resourcesPath, 'ghostscript-win', 'bin', 'gswin64c.exe'));
  }

  const devRoots = [
    path.join(process.cwd(), 'resources', 'ghostscript-win'),
    path.join(process.cwd(), 'apps', 'desktop', 'resources', 'ghostscript-win'),
  ];
  try {
    const appPath = app.getAppPath();
    devRoots.push(path.join(appPath, '..', 'resources', 'ghostscript-win'));
    devRoots.push(path.join(appPath, '..', '..', 'resources', 'ghostscript-win'));
  } catch {
    /* app not ready */
  }

  for (const root of devRoots) {
    out.push(path.join(root, 'bin', 'gswin64c.exe'));
  }
  return out;
}

function scanWindowsGhostscriptDirs(): string | null {
  const roots = [process.env.ProgramFiles, process.env['ProgramFiles(x86)']].filter(
    (v): v is string => Boolean(v),
  );
  for (const root of roots) {
    const gsRoot = path.join(root, 'gs');
    if (!fs.existsSync(gsRoot)) continue;
    let versions: string[] = [];
    try {
      versions = fs.readdirSync(gsRoot);
    } catch {
      continue;
    }
    versions.sort().reverse();
    for (const ver of versions) {
      for (const exe of ['gswin64c.exe', 'gswin32c.exe']) {
        const candidate = path.join(gsRoot, ver, 'bin', exe);
        if (fs.existsSync(candidate)) return candidate;
      }
    }
  }
  return null;
}

function resolveGhostscriptBin(): string | null {
  if (cachedGsBin !== undefined) return cachedGsBin;

  for (const candidate of bundledGhostscriptCandidates()) {
    if (fs.existsSync(candidate)) {
      cachedGsBin = candidate;
      log.info('[virtual-printer] using bundled Ghostscript', candidate);
      return cachedGsBin;
    }
  }

  const names = process.platform === 'win32' ? ['gswin64c', 'gswin32c', 'gs'] : ['gs'];

  for (const name of names) {
    const which = spawnSync(process.platform === 'win32' ? 'where' : 'which', [name], {
      encoding: 'utf8',
      windowsHide: true,
    });
    if (which.status === 0 && which.stdout.trim()) {
      const first = which.stdout.trim().split(/\r?\n/)[0]?.trim();
      if (first && fs.existsSync(first)) {
        cachedGsBin = first;
        return cachedGsBin;
      }
    }
  }

  if (process.platform === 'win32') {
    const scanned = scanWindowsGhostscriptDirs();
    if (scanned) {
      cachedGsBin = scanned;
      log.info('[virtual-printer] using system Ghostscript', scanned);
      return cachedGsBin;
    }
  }

  cachedGsBin = null;
  return null;
}

function ghostscriptRoot(binPath: string): string {
  const binDir = path.dirname(binPath);
  return path.basename(binDir).toLowerCase() === 'bin' ? path.dirname(binDir) : binDir;
}

function ghostscriptRuntime(binPath: string): { cwd: string; env: NodeJS.ProcessEnv; root: string } {
  const binDir = path.dirname(binPath);
  const root = ghostscriptRoot(binPath);
  const lib = path.join(root, 'lib');
  const resource = path.join(root, 'Resource');
  const env: NodeJS.ProcessEnv = { ...process.env };
  if (fs.existsSync(lib)) env.GS_LIB = lib;
  if (fs.existsSync(resource)) env.GS_RESOURCE_DIR = resource;
  return { cwd: binDir, env, root };
}

function gsArgsForFormat(
  format: RawPrintFormat,
  outputPdfPath: string,
  inputPath: string,
  gsRoot: string,
): string[] {
  const base = [
    '-dNOPAUSE',
    '-dBATCH',
    process.platform === 'win32' ? '-dNOSAFER' : '-dSAFER',
    '-sDEVICE=pdfwrite',
    `-sOutputFile=${outputPdfPath}`,
  ];
  const resource = path.join(gsRoot, 'Resource');
  if (fs.existsSync(resource)) {
    base.push(`-I${resource}`);
  }
  if (format === 'postscript' || format === 'pcl') {
    base.push('-dPDFSETTINGS=/prepress');
  }
  base.push(inputPath);
  return base;
}

function runGhostscript(args: string[]): Promise<boolean> {
  const bin = resolveGhostscriptBin();
  if (!bin) {
    log.warn('[virtual-printer] Ghostscript not found');
    return Promise.resolve(false);
  }

  const runtime = ghostscriptRuntime(bin);

  return new Promise((resolve) => {
    const gs = spawn(bin, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
      cwd: runtime.cwd,
      env: runtime.env,
    });
    let stderr = '';
    gs.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    gs.on('error', () => resolve(false));
    gs.on('close', (code) => {
      if (code !== 0 && stderr.trim()) {
        log.warn('[virtual-printer] ghostscript stderr', stderr.trim().slice(0, 500));
      }
      resolve(code === 0);
    });
  });
}

function runMagickConvert(inputPath: string, outputPdfPath: string): Promise<boolean> {
  if (process.platform !== 'win32') return Promise.resolve(false);

  return new Promise((resolve) => {
    const magick = spawn('magick', ['convert', inputPath, outputPdfPath], {
      stdio: 'ignore',
      windowsHide: true,
    });
    magick.on('error', () => resolve(false));
    magick.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function outputPdfValid(outputPdfPath: string): Promise<boolean> {
  try {
    const st = await fsPromises.stat(outputPdfPath);
    if (st.size < 32) return false;
    const buf = await fsPromises.readFile(outputPdfPath);
    if (buf.length < 5 || buf.subarray(0, 5).toString() !== '%PDF-') return false;

    // Reject "blank" PDFs that Ghostscript produces when fed Text-Only driver output
    // (no /Page objects + no content streams = effectively empty). A real PDF will
    // always have at least one /Type /Page and a stream block.
    const ascii = buf.toString('latin1');
    const hasPage = /\/Type\s*\/Page[^s]/.test(ascii);
    const hasStream = ascii.includes('stream\n') || ascii.includes('stream\r');
    if (!hasPage || !hasStream) {
      log.warn(
        `[virtual-printer] produced PDF has no real content (size=${st.size}, hasPage=${hasPage}, hasStream=${hasStream}) — driver likely Text-Only`,
      );
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** Convert a raw spool file (PS/PCL/EMF/XPS) to PDF. Windows-focused; safe on macOS (returns false if no gs). */
export async function convertRawFileToPdf(inputPath: string, outputPdfPath: string): Promise<boolean> {
  let body: Buffer;
  try {
    body = await fsPromises.readFile(inputPath);
  } catch {
    return false;
  }

  const embedded = pdfByteOffset(body);
  if (embedded >= 0) {
    await fsPromises.writeFile(outputPdfPath, body.subarray(embedded));
    return outputPdfValid(outputPdfPath);
  }

  const format = detectRawPrintFormat(body);
  const bin = resolveGhostscriptBin();
  if (!bin) return false;
  const gsRoot = ghostscriptRoot(bin);

  const gsOk = await runGhostscript(gsArgsForFormat(format, outputPdfPath, inputPath, gsRoot));
  if (gsOk && (await outputPdfValid(outputPdfPath))) {
    return true;
  }

  if (format === 'emf' || format === 'xps') {
    const magickOk = await runMagickConvert(inputPath, outputPdfPath);
    if (magickOk && (await outputPdfValid(outputPdfPath))) {
      return true;
    }
  }

  return false;
}

/** @deprecated Use convertRawFileToPdf */
export async function tryConvertToPdfWithGhostscript(
  inputPath: string,
  outputPdfPath: string,
): Promise<boolean> {
  return convertRawFileToPdf(inputPath, outputPdfPath);
}

export function isGhostscriptAvailable(): boolean {
  return resolveGhostscriptBin() !== null;
}

/**
 * Renders a PDF file's pages to PNG images and returns each as a base64 string.
 * Bulletproof preview path: images always render in the renderer, no PDF.js required.
 * Returns empty array if Ghostscript unavailable (caller can show a friendly message).
 *
 * @param pdfPath absolute path to a valid PDF file (must already start with %PDF-)
 * @param maxPages safety cap; defaults to 20 pages
 * @param dpi raster DPI; 150 is a good preview/quality balance
 */
export async function renderPdfToPngs(
  pdfPath: string,
  maxPages = 20,
  dpi = 150,
): Promise<string[]> {
  const bin = resolveGhostscriptBin();
  if (!bin) {
    log.warn('[virtual-printer] renderPdfToPngs: Ghostscript not available');
    return [];
  }

  let tempBase: string;
  try {
    tempBase = app.getPath('temp');
  } catch {
    tempBase = os.tmpdir();
  }
  const tempDir = path.join(tempBase, `rxconnect-preview-${Date.now()}-${randomUUID().slice(0, 8)}`);
  await fsPromises.mkdir(tempDir, { recursive: true });

  const outputPattern = path.join(tempDir, 'page-%d.png');
  const gsRoot = ghostscriptRoot(bin);
  const args = [
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    process.platform === 'win32' ? '-dNOSAFER' : '-dSAFER',
    '-sDEVICE=png16m',
    `-r${dpi}`,
    '-dFirstPage=1',
    `-dLastPage=${maxPages}`,
    `-sOutputFile=${outputPattern}`,
  ];
  const resource = path.join(gsRoot, 'Resource');
  if (fs.existsSync(resource)) {
    args.push(`-I${resource}`);
  }
  args.push(pdfPath);

  const ok = await runGhostscript(args);
  if (!ok) {
    log.warn('[virtual-printer] renderPdfToPngs: Ghostscript exited non-zero');
    await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    return [];
  }

  const pages: string[] = [];
  for (let i = 1; i <= maxPages; i += 1) {
    const pagePath = path.join(tempDir, `page-${i}.png`);
    try {
      const buf = await fsPromises.readFile(pagePath);
      pages.push(buf.toString('base64'));
    } catch {
      break;
    }
  }

  await fsPromises.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);

  if (pages.length === 0) {
    log.warn('[virtual-printer] renderPdfToPngs: no pages produced');
  }
  return pages;
}

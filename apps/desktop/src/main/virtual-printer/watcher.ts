import fs from 'node:fs/promises';
import { FSWatcher, watch } from 'node:fs';
import { listPrintJobs } from './job-store.js';
import { broadcastPrintJobToAll } from './print-notify.js';
import { getWritableSpoolDir, resolveSpoolDir } from './spool-paths.js';

const knownPaths = new Set<string>();

/** Jobs older than this are treated as already seen on startup (avoids popup flood). */
const STALE_JOB_MS = 30_000;

async function seedKnown(): Promise<void> {
  const jobs = await listPrintJobs();
  const staleBefore = Date.now() - STALE_JOB_MS;
  for (const j of jobs) {
    const mtime = new Date(j.receivedAt).getTime();
    // Do not mark very recent files — cold start after print service must still popup once.
    if (mtime < staleBefore) {
      knownPaths.add(j.pdfPath);
    }
  }
}

async function scanAndEmit(): Promise<void> {
  const jobs = await listPrintJobs();
  for (const j of jobs) {
    if (!knownPaths.has(j.pdfPath)) {
      knownPaths.add(j.pdfPath);
      broadcastPrintJobToAll(j);
    }
  }
}

const watchers: FSWatcher[] = [];
let scanTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleScan(): void {
  if (scanTimer) clearTimeout(scanTimer);
  const delay = process.platform === 'win32' ? 400 : 0;
  scanTimer = setTimeout(() => {
    scanTimer = null;
    void scanAndEmit();
  }, delay);
}

export async function startSpoolWatchers(): Promise<void> {
  await seedKnown();
  const dirs = new Set<string>();
  dirs.add(getWritableSpoolDir());
  const shared = resolveSpoolDir();
  if (shared !== getWritableSpoolDir()) {
    dirs.add(shared);
  }
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch {
      /* ignore */
    }
    try {
      const w = watch(dir, { persistent: true }, () => {
        scheduleScan();
      });
      watchers.push(w);
    } catch {
      /* cannot watch */
    }
  }
  await scanAndEmit();
}

/** Force a spool scan (e.g. second-instance print wake while app already in tray). */
export function flushSpoolScan(): void {
  scheduleScan();
}

export function stopSpoolWatchers(): void {
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  for (const w of watchers) {
    w.close();
  }
  watchers.length = 0;
  knownPaths.clear();
}

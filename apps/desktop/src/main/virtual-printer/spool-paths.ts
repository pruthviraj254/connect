import path from 'node:path';
import { app } from 'electron';

const SHARED_MAC = '/Library/Application Support/Rx-Connect/print-spool';
const SHARED_LINUX = '/var/spool/rx-connect';
const SHARED_WIN = path.join(process.env.ProgramData ?? 'C:\\ProgramData', 'Rx-Connect', 'print-spool');

function envOverride(): string | null {
  const v = process.env.RX_CONNECT_PRINT_SPOOL;
  return v && v.trim().length > 0 ? path.resolve(v.trim()) : null;
}

function sharedCandidate(): string | null {
  if (process.platform === 'darwin') return SHARED_MAC;
  if (process.platform === 'linux') return SHARED_LINUX;
  if (process.platform === 'win32') return SHARED_WIN;
  return null;
}

/**
 * Directory where print jobs land (CUPS backend, Windows raw port, or dev).
 * Prefer installer-created shared dir when present; otherwise per-user app data.
 */
export function resolveSpoolDir(): string {
  const override = envOverride();
  if (override) return override;
  const shared = sharedCandidate();
  if (shared) return shared;
  return path.join(app.getPath('userData'), 'print-spool');
}

/** Writable spool: on Windows/macOS installer paths when set; else userData (dev). */
export function getWritableSpoolDir(): string {
  const override = envOverride();
  if (override) return override;
  const shared = sharedCandidate();
  if (shared) return shared;
  if (app.isReady()) {
    return path.join(app.getPath('userData'), 'print-spool');
  }
  // Dev / early boot before Electron paths exist (e.g. service cold-start).
  if (process.platform === 'win32') {
    return path.join(process.env.ProgramData ?? 'C:\\ProgramData', 'Rx-Connect', 'print-spool');
  }
  return path.join(app.getPath('userData'), 'print-spool');
}

export const RAW_PRINT_PORT = Number(process.env.RX_CONNECT_RAW_PRINT_PORT ?? 19101);

export const PRINT_JOB_INCOMING_CHANNEL = 'print-job:incoming' as const;

export function isAllowedSpoolPath(absPath: string): boolean {
  const allowedDirs = [resolveSpoolDir(), getWritableSpoolDir()];
  const resolved = path.resolve(absPath);
  return allowedDirs.some((d) => {
    const root = path.resolve(d);
    return resolved === root || resolved.startsWith(root + path.sep);
  });
}

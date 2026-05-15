import path from 'node:path';
import { app } from 'electron';

const SHARED_MAC = '/Library/Application Support/Rx-Connect/print-spool';
const SHARED_LINUX = '/var/spool/rx-connect';

function envOverride(): string | null {
  const v = process.env.RX_CONNECT_PRINT_SPOOL;
  return v && v.trim().length > 0 ? path.resolve(v.trim()) : null;
}

function sharedCandidate(): string | null {
  if (process.platform === 'darwin') return SHARED_MAC;
  if (process.platform === 'linux') return SHARED_LINUX;
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

/** Writable spool: shared path may not exist in dev — fall back to userData. */
export function getWritableSpoolDir(): string {
  const override = envOverride();
  if (override) return override;
  return path.join(app.getPath('userData'), 'print-spool');
}

export const RAW_PRINT_PORT = Number(process.env.RX_CONNECT_RAW_PRINT_PORT ?? 19101);

export const PRINT_JOB_INCOMING_CHANNEL = 'print-job:incoming' as const;

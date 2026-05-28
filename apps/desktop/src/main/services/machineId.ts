import { execSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { app } from 'electron';

const DEVICE_ID_FILENAME = 'device-id.txt';

let cachedDisplayId: string | null = null;

export function getMachineId(): string {
  if (cachedDisplayId) return cachedDisplayId;
  cachedDisplayId = resolveMachineId();
  return cachedDisplayId;
}

function resolveMachineId(): string {
  if (process.platform === 'win32') {
    const guid = readWindowsMachineGuid();
    if (guid) return toDisplayId(hashNormalizedGuid(guid));
  }
  return loadOrCreateDevDeviceId();
}

function readWindowsMachineGuid(): string | null {
  try {
    const output = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: 'utf8', windowsHide: true },
    );
    const match = output.match(/MachineGuid\s+REG_SZ\s+(\S+)/i);
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

function normalizeGuid(guid: string): string {
  return guid.replace(/[{}-\s]/g, '').toUpperCase();
}

function hashNormalizedGuid(guid: string): string {
  return createHash('sha256').update(normalizeGuid(guid), 'utf8').digest('hex');
}

function toDisplayId(hashHex: string): string {
  const raw = hashHex.slice(0, 16).toUpperCase();
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
}

function loadOrCreateDevDeviceId(): string {
  const userData = app.getPath('userData');
  mkdirSync(userData, { recursive: true });
  const filePath = join(userData, DEVICE_ID_FILENAME);

  if (existsSync(filePath)) {
    const existing = readFileSync(filePath, 'utf8').trim();
    if (existing) return existing;
  }

  const id = toDisplayId(createHash('sha256').update(randomUUID(), 'utf8').digest('hex'));
  writeFileSync(filePath, id, 'utf8');
  return id;
}

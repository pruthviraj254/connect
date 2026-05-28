import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import { app } from 'electron';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, '../../../..');

function configSearchRoots(): string[] {
  const roots = [repoRoot];
  if (app.isPackaged && process.resourcesPath) {
    roots.unshift(process.resourcesPath);
  }
  return roots;
}

if (!app.isPackaged) {
  for (const root of configSearchRoots()) {
    dotenv.config({ path: path.join(root, '.env') });
  }
} else {
  for (const root of configSearchRoots()) {
    dotenv.config({ path: path.join(root, '.env') });
  }
}

const DEFAULT_API_BASE_URL = 'https://portal-api.myonerx.com/api';
const DEFAULT_PORTAL_API_BASE_URL = 'https://portal-api.myonerx.ca';
const DEFAULT_HTTP_TIMEOUT_MS = 15_000;
const DEFAULT_AUTH_REFRESH_SKEW_MS = 60_000;
const DEFAULT_INGEST_SECRET =
  '166be1ad06e5c1e9990ccf573143e1ebf1f47301ce45b7bb463b75be5c2a2638';

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readBooleanEnv(name: string, defaultWhenUnset: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return defaultWhenUnset;
  if (raw === '0' || raw.toLowerCase() === 'false') return false;
  return raw === '1' || raw.toLowerCase() === 'true';
}

declare const __RX_API_BASE_URL__: string | undefined;
declare const __RX_INGEST_SECRET__: string | undefined;

function bakedApiBaseUrl(): string | undefined {
  try {
    return typeof __RX_API_BASE_URL__ === 'string' && __RX_API_BASE_URL__
      ? __RX_API_BASE_URL__
      : undefined;
  } catch {
    return undefined;
  }
}

function bakedIngestSecret(): string | undefined {
  try {
    return typeof __RX_INGEST_SECRET__ === 'string' && __RX_INGEST_SECRET__
      ? __RX_INGEST_SECRET__
      : undefined;
  } catch {
    return undefined;
  }
}

const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

export const config = Object.freeze({
  isDev,
  apiBaseUrl:
    process.env.RX_CONNECT_API_BASE_URL?.trim() ||
    bakedApiBaseUrl() ||
    DEFAULT_API_BASE_URL,
  portalApiBaseUrl:
    process.env.RX_CONNECT_PORTAL_API_BASE_URL?.trim() || DEFAULT_PORTAL_API_BASE_URL,
  httpTimeoutMs: readPositiveInt('RX_CONNECT_HTTP_TIMEOUT_MS', DEFAULT_HTTP_TIMEOUT_MS),
  authRefreshSkewMs: readPositiveInt(
    'RX_CONNECT_AUTH_REFRESH_SKEW_MS',
    DEFAULT_AUTH_REFRESH_SKEW_MS,
  ),
  rxConnectIngestSecret:
    process.env.RX_CONNECT_INGEST_SECRET?.trim() ||
    bakedIngestSecret() ||
    DEFAULT_INGEST_SECRET,
  devSkipAuth: readBooleanEnv('RX_CONNECT_DEV_SKIP_AUTH', false) && !app.isPackaged,
});

export type AppConfig = typeof config;

import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

export type BuildMetadata = {
  channel: 'production' | 'staging';
  updateChannel: string;
  protocolScheme: string;
  policyFileName: string;
  policyRemotePath: string;
  appEnv: string;
  appUserModelId: string;
};

const PRODUCTION_DEFAULTS: BuildMetadata = {
  channel: 'production',
  updateChannel: 'latest',
  protocolScheme: 'rxconnect',
  policyFileName: 'update-policy.json',
  policyRemotePath: 'apps/desktop/update-policy.json',
  appEnv: 'production',
  appUserModelId: 'health.onerx.rxconnect',
};

const STAGING_DEFAULTS: BuildMetadata = {
  channel: 'staging',
  updateChannel: 'staging',
  protocolScheme: 'rxconnect-staging',
  policyFileName: 'update-policy.staging.json',
  policyRemotePath: 'apps/desktop/update-policy.staging.json',
  appEnv: 'staging',
  appUserModelId: 'health.onerx.rxconnect.staging',
};

let cached: BuildMetadata | null = null;

export function getBuildMetadata(): BuildMetadata {
  if (cached) {
    return cached;
  }

  try {
    const metaPath = path.join(app.getAppPath(), 'build-metadata.json');
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as Partial<BuildMetadata>;
    if (parsed.channel === 'staging') {
      cached = { ...STAGING_DEFAULTS, ...parsed };
    } else {
      cached = { ...PRODUCTION_DEFAULTS, ...parsed };
    }
    return cached;
  } catch {
    cached = PRODUCTION_DEFAULTS;
    return cached;
  }
}

export function getProtocolScheme(): string {
  return getBuildMetadata().protocolScheme;
}

export function getAppUserModelId(): string {
  return getBuildMetadata().appUserModelId;
}

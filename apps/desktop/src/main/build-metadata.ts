import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import {
  getBakedAppUserModelId,
  getBakedChannel,
  getBakedDefaultsForChannel,
} from './build-constants.js';

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
  protocolScheme: 'rxmanager',
  policyFileName: 'update-policy.json',
  policyRemotePath: 'apps/desktop/update-policy.json',
  appEnv: 'production',
  appUserModelId: 'health.onerx.rxmanager',
};

const STAGING_DEFAULTS: BuildMetadata = {
  channel: 'staging',
  updateChannel: 'staging',
  protocolScheme: 'rxmanager-staging',
  policyFileName: 'update-policy.staging.json',
  policyRemotePath: 'apps/desktop/update-policy.staging.json',
  appEnv: 'staging',
  appUserModelId: 'health.onerx.rxmanager.staging',
};

let cached: BuildMetadata | null = null;

function resolveMetadataPath(): string | null {
  const candidates = [
    path.join(process.resourcesPath, 'app.asar', 'build-metadata.json'),
    path.join(process.resourcesPath, 'app', 'build-metadata.json'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  try {
    const fromAppPath = path.join(app.getAppPath(), 'build-metadata.json');
    if (fs.existsSync(fromAppPath)) {
      return fromAppPath;
    }
  } catch {
    // app.getAppPath() unavailable before ready
  }
  return null;
}

export function getBuildMetadata(): BuildMetadata {
  if (cached) {
    return cached;
  }

  const bakedChannel = getBakedChannel();
  const bakedDefaults = getBakedDefaultsForChannel(bakedChannel);

  try {
    const metaPath = resolveMetadataPath();
    if (!metaPath) {
      throw new Error('build-metadata.json not found');
    }
    const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8')) as Partial<BuildMetadata>;
    if (parsed.channel === 'staging') {
      cached = { ...STAGING_DEFAULTS, ...parsed };
    } else {
      cached = { ...PRODUCTION_DEFAULTS, ...parsed };
    }
    return cached;
  } catch {
    cached =
      bakedChannel === 'staging'
        ? { ...STAGING_DEFAULTS, appUserModelId: bakedDefaults.appUserModelId }
        : { ...PRODUCTION_DEFAULTS, appUserModelId: bakedDefaults.appUserModelId };
    return cached;
  }
}

export function getProtocolScheme(): string {
  return getBuildMetadata().protocolScheme;
}

export function getAppUserModelId(): string {
  return getBakedAppUserModelId();
}

/**
 * Single source of truth for production vs staging desktop builds.
 * Set RX_CONNECT_CHANNEL=staging | production (default).
 */

/** @typedef {'production' | 'staging'} BuildChannelId */

/** @typedef {object} BuildChannelProfile
 * @property {BuildChannelId} id
 * @property {string} updateChannel electron-updater channel (latest | staging)
 * @property {string} appId
 * @property {string} productName
 * @property {string} executableName
 * @property {string} protocolScheme
 * @property {string} protocolName
 * @property {string} packagerName Forge/electron-builder product folder name
 * @property {string} updaterCacheDirName
 * @property {string} policyFileName bundled + remote policy filename
 * @property {string} policyRemotePath path in repo for raw GitHub fetch
 * @property {string} defaultApiBaseUrl
 * @property {string} appEnv NEXT_PUBLIC_APP_ENV
 * @property {string} artifactPrefix installer file prefix
 */

/** @type {Record<BuildChannelId, BuildChannelProfile>} */
const PROFILES = {
  production: {
    id: 'production',
    updateChannel: 'latest',
    appId: 'health.onerx.rxmanager',
    productName: 'Rx-Manager',
    executableName: 'rx-manager',
    protocolScheme: 'rxmanager',
    protocolName: 'Rx Manager',
    packagerName: 'Rx-Manager',
    updaterCacheDirName: 'rx-manager-updater',
    policyFileName: 'update-policy.json',
    policyRemotePath: 'apps/desktop/update-policy.json',
    defaultApiBaseUrl: 'https://portal-api.myonerx.com/api',
    appEnv: 'production',
    artifactPrefix: 'Rx-Manager',
  },
  staging: {
    id: 'staging',
    updateChannel: 'staging',
    appId: 'health.onerx.rxmanager.staging',
    productName: 'Rx-Manager Staging',
    executableName: 'rx-manager-staging',
    protocolScheme: 'rxmanager-staging',
    protocolName: 'Rx Manager Staging',
    packagerName: 'Rx-Manager-Staging',
    updaterCacheDirName: 'rx-manager-staging-updater',
    policyFileName: 'update-policy.staging.json',
    policyRemotePath: 'apps/desktop/update-policy.staging.json',
    defaultApiBaseUrl: 'https://api.staging.onerx.com/api',
    appEnv: 'staging',
    artifactPrefix: 'Rx-Manager-Staging',
  },
};

/** @returns {BuildChannelId} */
function normalizeChannelId(raw) {
  const value = (raw ?? 'production').trim().toLowerCase();
  return value === 'staging' ? 'staging' : 'production';
}

/** @returns {BuildChannelProfile} */
function getBuildChannel() {
  return PROFILES[normalizeChannelId(process.env.RX_CONNECT_CHANNEL)];
}

/** @param {BuildChannelProfile} profile */
function applyChannelEnv(profile) {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) {
    process.env.NEXT_PUBLIC_API_BASE_URL = profile.defaultApiBaseUrl;
  }
  process.env.NEXT_PUBLIC_APP_ENV = profile.appEnv;
  process.env.RX_CONNECT_PROTOCOL_SCHEME = profile.protocolScheme;
}

/**
 * @param {'win32' | 'darwin'} platform
 * @param {'x64' | 'arm64'} [arch]
 * @param {BuildChannelProfile} [profile]
 */
function getPrepackagedDir(platform, arch, profile = getBuildChannel()) {
  const root = profile.packagerName;
  if (platform === 'win32') {
    return `out/${root}-win32-x64`;
  }
  if (platform === 'darwin') {
    return arch === 'x64' ? `out/${root}-darwin-x64` : `out/${root}-darwin-arm64`;
  }
  throw new Error(`Unsupported platform: ${platform}`);
}

/**
 * @param {'win32' | 'darwin-arm64' | 'darwin-x64'} target
 * @param {BuildChannelProfile} [profile]
 */
function resolvePrepackagedPath(target, profile = getBuildChannel()) {
  const desktopRoot = require('node:path').join(__dirname, '..');
  const rel =
    target === 'win32'
      ? getPrepackagedDir('win32', 'x64', profile)
      : target === 'darwin-x64'
        ? getPrepackagedDir('darwin', 'x64', profile)
        : getPrepackagedDir('darwin', 'arm64', profile);
  return require('node:path').join(desktopRoot, rel);
}

module.exports = {
  PROFILES,
  getBuildChannel,
  normalizeChannelId,
  applyChannelEnv,
  getPrepackagedDir,
  resolvePrepackagedPath,
};

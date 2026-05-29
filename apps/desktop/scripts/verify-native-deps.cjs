/**
 * Fail the build if keytar (native auth token store) is missing from the Forge package.
 * Run immediately after `electron-forge package` and before `electron-builder`.
 */
const fs = require('node:fs');
const path = require('node:path');
const { getBuildChannel, resolvePrepackagedPath } = require('./build-channel.cjs');

/** @param {string} dir @returns {string[]} */
function findNodeBinaries(dir) {
  /** @type {string[]} */
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findNodeBinaries(full));
    } else if (entry.name.endsWith('.node')) {
      results.push(full);
    }
  }
  return results;
}

/** @param {string[]} files @returns {boolean} */
function listingIncludesKeytarPackage(files) {
  return files.some((file) => {
    const normalized = file.replace(/\\/g, '/');
    return (
      normalized.endsWith('node_modules/keytar/package.json') ||
      normalized.endsWith('/keytar/package.json')
    );
  });
}

/** @param {string} prepackagedDir */
function verifyKeytarPackaged(prepackagedDir) {
  const resourcesDir = path.join(prepackagedDir, 'resources');
  const appDir = path.join(resourcesDir, 'app');
  const asarPath = path.join(resourcesDir, 'app.asar');
  const unpackedDir = path.join(resourcesDir, 'app.asar.unpacked');

  const appKeytarPkg = path.join(appDir, 'node_modules', 'keytar', 'package.json');
  if (fs.existsSync(appKeytarPkg)) {
    const nodes = findNodeBinaries(path.join(appDir, 'node_modules', 'keytar'));
    if (nodes.length === 0) {
      throw new Error('[verify-native-deps] keytar package found but no .node binary under resources/app');
    }
    console.log('[verify-native-deps] OK — keytar in resources/app/node_modules with', nodes.length, '.node file(s)');
    return;
  }

  if (!fs.existsSync(asarPath)) {
    throw new Error(`[verify-native-deps] neither resources/app nor resources/app.asar found under ${prepackagedDir}`);
  }

  const asar = require('@electron/asar');
  const listing = asar.listPackage(asarPath);
  if (!listingIncludesKeytarPackage(listing)) {
    throw new Error(
      `[verify-native-deps] keytar not found inside ${asarPath} — app will crash with "Cannot find module 'keytar'"`,
    );
  }

  const keytarNodesInAsar = listing.filter((file) => {
    const normalized = file.replace(/\\/g, '/');
    return normalized.includes('keytar') && normalized.endsWith('.node');
  });
  const unpackedNodes = findNodeBinaries(unpackedDir).filter((file) => file.includes(`${path.sep}keytar${path.sep}`));

  if (keytarNodesInAsar.length === 0 && unpackedNodes.length === 0) {
    throw new Error(
      `[verify-native-deps] keytar package found in app.asar but no .node binary in asar or app.asar.unpacked`,
    );
  }

  console.log(
    '[verify-native-deps] OK — keytar in app.asar',
    keytarNodesInAsar.length ? `(${keytarNodesInAsar.length} .node in asar)` : '',
    unpackedNodes.length ? `(${unpackedNodes.length} .node unpacked)` : '',
  );
}

const target = process.argv[2];
const profile = getBuildChannel();

const targets = {
  win32: resolvePrepackagedPath('win32', profile),
  'darwin-arm64': resolvePrepackagedPath('darwin-arm64', profile),
  'darwin-x64': resolvePrepackagedPath('darwin-x64', profile),
};

const prepackaged = targets[target];
if (!prepackaged) {
  console.error('[verify-native-deps] usage: node verify-native-deps.cjs <win32|darwin-arm64|darwin-x64>');
  process.exit(1);
}

if (!fs.existsSync(prepackaged)) {
  console.error('[verify-native-deps] prepackaged app not found:', prepackaged);
  process.exit(1);
}

try {
  verifyKeytarPackaged(prepackaged);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

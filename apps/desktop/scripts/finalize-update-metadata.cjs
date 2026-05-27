/**
 * electron-builder on GitHub often writes latest.yml even when publish.channel is set.
 * Staging clients expect staging.yml / staging-mac.yml (see update-feed.ts).
 */
const fs = require('node:fs');
const path = require('node:path');
const { getBuildChannel } = require('./build-channel.cjs');

const profile = getBuildChannel();
const distDir = path.join(__dirname, '../dist');

/** @param {string} from @param {string} to */
function renameIfNeeded(from, to) {
  const fromPath = path.join(distDir, from);
  const toPath = path.join(distDir, to);
  if (fs.existsSync(toPath)) {
    return toPath;
  }
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`[finalize-update-metadata] renamed ${from} → ${to}`);
    return toPath;
  }
  return null;
}

function listDistYml() {
  if (!fs.existsSync(distDir)) {
    return [];
  }
  return fs.readdirSync(distDir).filter((name) => name.endsWith('.yml'));
}

if (profile.updateChannel === 'staging') {
  renameIfNeeded('latest.yml', 'staging.yml');
  renameIfNeeded('latest-mac.yml', 'staging-mac.yml');

  const ymlFiles = listDistYml();
  const hasStagingWin = fs.existsSync(path.join(distDir, 'staging.yml'));
  const hasStagingMac = fs.existsSync(path.join(distDir, 'staging-mac.yml'));

  if (!hasStagingWin && !hasStagingMac) {
    console.error('[finalize-update-metadata] expected staging.yml and/or staging-mac.yml in dist');
    console.error('[finalize-update-metadata] found:', ymlFiles.join(', ') || '(none)');
    process.exit(1);
  }

  console.log('[finalize-update-metadata] OK', {
    channel: profile.updateChannel,
    yml: ymlFiles,
  });
}

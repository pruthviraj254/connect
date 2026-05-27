/**
 * Publish pre-built dist artifacts to GitHub Releases (after finalize-update-metadata).
 * Usage: node scripts/publish-desktop-artifacts.cjs
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getBuildChannel } = require('./build-channel.cjs');

const profile = getBuildChannel();
const distDir = path.join(__dirname, '../dist');
const configFile =
  profile.id === 'staging' ? 'electron-builder.staging.yml' : 'electron-builder.yml';

if (!fs.existsSync(distDir)) {
  console.error('[publish-desktop-artifacts] dist folder missing:', distDir);
  process.exit(1);
}

const files = fs
  .readdirSync(distDir)
  .flatMap((name) => {
    const full = path.join(distDir, name);
    if (!fs.statSync(full).isFile()) {
      return [];
    }
    if (name.endsWith('.yml') || name.endsWith('.blockmap') || name.endsWith('.exe') || name.endsWith('.zip')) {
      return [full];
    }
    return [];
  })
  .sort();

if (files.length === 0) {
  console.error('[publish-desktop-artifacts] no publishable artifacts in dist');
  process.exit(1);
}

console.log('[publish-desktop-artifacts] publishing', files.map((f) => path.basename(f)).join(', '));

const args = ['electron-builder', 'publish', '--config', configFile, ...files.flatMap((f) => ['--files', f])];

const result = spawnSync('npx', args, {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit',
  shell: true,
  env: process.env,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

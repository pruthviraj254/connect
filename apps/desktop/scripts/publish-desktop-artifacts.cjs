/**
 * Upload pre-built dist artifacts to the GitHub Release for the current CI tag.
 * Runs after finalize-update-metadata.cjs (staging.yml must exist).
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { getBuildChannel } = require('./build-channel.cjs');

const profile = getBuildChannel();
const distDir = path.join(__dirname, '../dist');

function resolveReleaseTag() {
  const fromEnv = process.env.GITHUB_REF_NAME?.trim();
  if (fromEnv) {
    return fromEnv;
  }
  const ref = process.env.GITHUB_REF?.trim() ?? '';
  if (ref.startsWith('refs/tags/')) {
    return ref.slice('refs/tags/'.length);
  }
  return null;
}

function collectPublishFiles() {
  if (!fs.existsSync(distDir)) {
    return [];
  }

  const winYml = profile.updateChannel === 'staging' ? 'staging.yml' : 'latest.yml';
  const macYml = profile.updateChannel === 'staging' ? 'staging-mac.yml' : 'latest-mac.yml';

  return fs
    .readdirSync(distDir)
    .flatMap((name) => {
      if (name === 'builder-debug.yml') {
        return [];
      }

      const full = path.join(distDir, name);
      if (!fs.statSync(full).isFile()) {
        return [];
      }

      if (name.endsWith('.yml')) {
        return name === winYml || name === macYml ? [full] : [];
      }

      if (name.endsWith('.exe') || name.endsWith('.zip') || name.endsWith('.blockmap')) {
        return [full];
      }

      return [];
    })
    .sort();
}

const tag = resolveReleaseTag();
const files = collectPublishFiles();

if (!tag) {
  console.error('[publish-desktop-artifacts] no release tag (GITHUB_REF_NAME / GITHUB_REF)');
  process.exit(1);
}

if (files.length === 0) {
  console.error('[publish-desktop-artifacts] no publishable artifacts in dist');
  process.exit(1);
}

console.log(
  '[publish-desktop-artifacts] uploading to',
  tag,
  files.map((f) => path.basename(f)).join(', '),
);

const token = process.env.GH_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
if (!token) {
  console.error('[publish-desktop-artifacts] GH_TOKEN or GITHUB_TOKEN is required');
  process.exit(1);
}

// Ensure release exists (tag push alone does not create a GitHub Release).
const createResult = spawnSync(
  'gh',
  ['release', 'view', tag, '--repo', `${process.env.GH_OWNER || 'pruthviraj254'}/${process.env.GH_REPO || 'connect'}`],
  {
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    stdio: 'pipe',
    shell: false,
  },
);

if (createResult.status !== 0) {
  const owner = process.env.GH_OWNER || 'pruthviraj254';
  const repo = process.env.GH_REPO || 'connect';
  console.log('[publish-desktop-artifacts] creating release for', tag);
  const mkResult = spawnSync(
    'gh',
    ['release', 'create', tag, '--repo', `${owner}/${repo}`, '--title', tag, '--generate-notes'],
    {
      env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
      stdio: 'inherit',
      shell: false,
    },
  );
  if (mkResult.status !== 0) {
    process.exit(mkResult.status ?? 1);
  }
}

const uploadResult = spawnSync(
  'gh',
  ['release', 'upload', tag, ...files, '--clobber', '--repo', `${process.env.GH_OWNER || 'pruthviraj254'}/${process.env.GH_REPO || 'connect'}`],
  {
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    stdio: 'inherit',
    shell: false,
  },
);

if (uploadResult.status !== 0) {
  process.exit(uploadResult.status ?? 1);
}

console.log('[publish-desktop-artifacts] OK');

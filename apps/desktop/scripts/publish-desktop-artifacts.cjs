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

function repoSlug() {
  const owner = process.env.GH_OWNER || 'pruthviraj254';
  const repo = process.env.GH_REPO || 'connect';
  return `${owner}/${repo}`;
}

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

function isStagingReleaseTag(tag) {
  return tag.startsWith('staging-v') || tag.endsWith('-staging');
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

function assertRequiredArtifacts(files, tag) {
  const names = files.map((f) => path.basename(f));
  const hasYml =
    names.includes('staging.yml') ||
    names.includes('latest.yml') ||
    names.includes('staging-mac.yml') ||
    names.includes('latest-mac.yml');

  if (!hasYml) {
    console.error('[publish-desktop-artifacts] missing updater metadata yml in dist');
    process.exit(1);
  }

  const isWindowsCi = process.platform === 'win32';
  const isMacCi = process.platform === 'darwin';

  if (isWindowsCi && !names.some((n) => n.endsWith('.exe'))) {
    console.error('[publish-desktop-artifacts] missing Windows .exe in dist:', names.join(', '));
    process.exit(1);
  }

  if (isMacCi && !names.some((n) => n.endsWith('.zip'))) {
    console.error('[publish-desktop-artifacts] missing macOS .zip in dist:', names.join(', '));
    process.exit(1);
  }

  if (isStagingReleaseTag(tag) && names.some((n) => n.includes(' '))) {
    console.error('[publish-desktop-artifacts] artifact names must not contain spaces:', names);
    process.exit(1);
  }
}

function gh(args, inherit = false) {
  const token = process.env.GH_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  return spawnSync('gh', args, {
    env: { ...process.env, GH_TOKEN: token, GITHUB_TOKEN: token },
    stdio: inherit ? 'inherit' : 'pipe',
    shell: false,
  });
}

const tag = resolveReleaseTag();
const files = collectPublishFiles();
const repo = repoSlug();
const stagingRelease = profile.updateChannel === 'staging' || isStagingReleaseTag(tag ?? '');

if (!tag) {
  console.error('[publish-desktop-artifacts] no release tag (GITHUB_REF_NAME / GITHUB_REF)');
  process.exit(1);
}

if (files.length === 0) {
  console.error('[publish-desktop-artifacts] no publishable artifacts in dist');
  process.exit(1);
}

assertRequiredArtifacts(files, tag);

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

const viewResult = gh(['release', 'view', tag, '--repo', repo]);
if (viewResult.status !== 0) {
  console.log('[publish-desktop-artifacts] creating release for', tag, stagingRelease ? '(prerelease)' : '');
  const createArgs = [
    'release',
    'create',
    tag,
    '--repo',
    repo,
    '--title',
    tag,
    '--generate-notes',
  ];
  if (stagingRelease) {
    createArgs.push('--prerelease');
  }
  const mkResult = gh(createArgs, true);
  if (mkResult.status !== 0) {
    process.exit(mkResult.status ?? 1);
  }
} else if (stagingRelease) {
  // Ensure existing staging releases stay prerelease so prod /releases/latest ignores them.
  gh(['release', 'edit', tag, '--repo', repo, '--prerelease'], true);
}

const uploadResult = gh(['release', 'upload', tag, ...files, '--clobber', '--repo', repo], true);
if (uploadResult.status !== 0) {
  process.exit(uploadResult.status ?? 1);
}

const verify = gh(['release', 'view', tag, '--repo', repo, '--json', 'assets', 'isPrerelease']);
if (verify.status === 0) {
  const payload = JSON.parse(verify.stdout.toString());
  const assetNames = (payload.assets ?? []).map((a) => a.name);
  console.log('[publish-desktop-artifacts] release assets:', assetNames.join(', '));
  if (process.platform === 'win32' && !assetNames.some((n) => n.endsWith('.exe'))) {
    console.error('[publish-desktop-artifacts] GitHub release is missing Windows .exe');
    process.exit(1);
  }
  if (stagingRelease && !payload.isPrerelease) {
    console.error('[publish-desktop-artifacts] staging release must be marked prerelease');
    process.exit(1);
  }
}

console.log('[publish-desktop-artifacts] OK');

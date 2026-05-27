/**
 * Writes resources/app-update.yml into Forge prepackaged output before electron-builder.
 * Required because --prepackaged does not always generate this file for electron-updater.
 */
const fs = require('node:fs');
const { getBuildChannel, resolvePrepackagedPath } = require('./build-channel.cjs');

const owner = process.env.GH_OWNER || 'pruthviraj254';
const repo = process.env.GH_REPO || 'connect';
// Long-lived read token for private-repo clients only. Never use CI GITHUB_TOKEN here —
// it expires when the workflow ends and causes 401 Bad credentials on user machines.
const token = process.env.UPDATER_GH_TOKEN?.trim();

function writeAppUpdateYml(prepackagedDir, profile) {
  const resourcesDir = require('node:path').join(prepackagedDir, 'resources');
  fs.mkdirSync(resourcesDir, { recursive: true });

  const lines = [
    `owner: ${owner}`,
    `repo: ${repo}`,
    'provider: github',
    `updaterCacheDirName: ${profile.updaterCacheDirName}`,
  ];

  if (profile.updateChannel !== 'latest') {
    lines.push(`channel: ${profile.updateChannel}`);
  }

  if (token) {
    lines.push(`token: ${token}`);
  }

  const contents = `${lines.join('\n')}\n`;

  const dest = require('node:path').join(resourcesDir, 'app-update.yml');
  fs.writeFileSync(dest, contents, 'utf8');
  console.log(
    '[write-app-update-yml] wrote',
    dest,
    `(${profile.id}, channel=${profile.updateChannel})`,
    token ? 'with token' : 'no token',
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
  console.error('[write-app-update-yml] usage: node write-app-update-yml.cjs <win32|darwin-arm64|darwin-x64>');
  process.exit(1);
}

if (!fs.existsSync(prepackaged)) {
  console.error('[write-app-update-yml] prepackaged app not found:', prepackaged);
  process.exit(1);
}

writeAppUpdateYml(prepackaged, profile);

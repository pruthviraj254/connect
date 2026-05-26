/**
 * Writes resources/app-update.yml into Forge prepackaged output before electron-builder.
 * Required because --prepackaged does not always generate this file for electron-updater.
 */
const fs = require('node:fs');
const path = require('node:path');

const owner = process.env.GH_OWNER || 'pruthviraj254';
const repo = process.env.GH_REPO || 'connect';

function writeAppUpdateYml(prepackagedDir) {
  const resourcesDir = path.join(prepackagedDir, 'resources');
  fs.mkdirSync(resourcesDir, { recursive: true });

  const contents = [
    `owner: ${owner}`,
    `repo: ${repo}`,
    'provider: github',
    'updaterCacheDirName: rx-connect-updater',
    '',
  ].join('\n');

  const dest = path.join(resourcesDir, 'app-update.yml');
  fs.writeFileSync(dest, contents, 'utf8');
  console.log('[write-app-update-yml] wrote', dest);
}

const target = process.argv[2];
const desktopRoot = path.join(__dirname, '..');

const targets = {
  win32: path.join(desktopRoot, 'out', 'Rx-Connect-win32-x64'),
  'darwin-arm64': path.join(desktopRoot, 'out', 'Rx-Connect-darwin-arm64'),
  'darwin-x64': path.join(desktopRoot, 'out', 'Rx-Connect-darwin-x64'),
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

writeAppUpdateYml(prepackaged);

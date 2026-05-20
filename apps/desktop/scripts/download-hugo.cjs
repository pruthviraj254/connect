/**
 * Downloads Hugo Extended binaries for macOS (arm64 + x64), Windows, and Linux.
 * Safe to run multiple times (cached per platform).
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

const DESKTOP_ROOT = path.join(__dirname, '..');
const BIN_ROOT = path.join(DESKTOP_ROOT, 'resources', 'bin');

const HUGO_VERSION = process.env.HUGO_VERSION || '0.139.4';

const TARGETS = [
  {
    id: 'darwin',
    asset: `hugo_extended_${HUGO_VERSION}_darwin-universal.tar.gz`,
    destDir: 'darwin',
    binary: 'hugo',
  },
  {
    id: 'darwin-x64',
    asset: `hugo_extended_${HUGO_VERSION}_darwin-universal.tar.gz`,
    destDir: 'darwin-x64',
    binary: 'hugo',
  },
  {
    id: 'win32',
    asset: `hugo_extended_${HUGO_VERSION}_windows-amd64.zip`,
    destDir: 'win32',
    binary: 'hugo.exe',
  },
  {
    id: 'linux',
    asset: `hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz`,
    destDir: 'linux',
    binary: 'hugo',
  },
];

function log(msg) {
  console.log(`[download-hugo] ${msg}`);
}

async function download(url, dest) {
  await fs.promises.mkdir(path.dirname(dest), { recursive: true });
  return new Promise((resolve, reject) => {
    const request = (fetchUrl) => {
      https
        .get(fetchUrl, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            request(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${fetchUrl}`));
            return;
          }
          const file = fs.createWriteStream(dest);
          pipeline(res, file).then(resolve).catch(reject);
        })
        .on('error', reject);
    };
    request(url);
  });
}

function extractArchive(archivePath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  if (archivePath.endsWith('.zip')) {
    if (process.platform === 'win32') {
      execSync(
        `powershell -NoProfile -Command "Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`,
        { stdio: 'inherit' },
      );
    } else {
      execSync(`unzip -o -q "${archivePath}" -d "${destDir}"`, { stdio: 'inherit' });
    }
  } else {
    execSync(`tar -xzf "${archivePath}" -C "${destDir}"`, { stdio: 'inherit' });
  }
}

function findBinary(searchDir, name) {
  const direct = path.join(searchDir, name);
  if (fs.existsSync(direct)) return direct;
  for (const entry of fs.readdirSync(searchDir, { withFileTypes: true })) {
    const full = path.join(searchDir, entry.name);
    if (entry.isDirectory()) {
      const found = findBinary(full, name);
      if (found) return found;
    }
  }
  return null;
}

async function vendorTarget(target) {
  const destBinary = path.join(BIN_ROOT, target.destDir, target.binary);
  if (fs.existsSync(destBinary)) {
    log(`skip ${target.destDir} (already present)`);
    return;
  }

  const url = `https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/${target.asset}`;
  const cacheDir = path.join(DESKTOP_ROOT, '.cache', 'hugo-vendor');
  const archivePath = path.join(cacheDir, target.asset);

  log(`downloading ${url}`);
  await download(url, archivePath);

  const extractDir = path.join(cacheDir, `extract-${target.destDir}`);
  fs.rmSync(extractDir, { recursive: true, force: true });
  extractArchive(archivePath, extractDir);

  const found = findBinary(extractDir, target.binary);
  if (!found) {
    throw new Error(`Could not find ${target.binary} in ${extractDir}`);
  }

  fs.mkdirSync(path.dirname(destBinary), { recursive: true });
  fs.copyFileSync(found, destBinary);
  if (process.platform !== 'win32') {
    fs.chmodSync(destBinary, 0o755);
  }
  log(`installed ${destBinary}`);
}

async function main() {
  const unique = new Map();
  for (const t of TARGETS) {
    if (!unique.has(t.asset + t.destDir)) unique.set(t.asset + t.destDir, t);
  }
  for (const t of unique.values()) {
    await vendorTarget(t);
  }
  log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

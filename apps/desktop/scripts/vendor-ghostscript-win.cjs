/**
 * Downloads Ghostscript (Windows x64) into resources/ghostscript-win for packaging.
 * Skips on non-Windows. Safe to run multiple times (cached).
 *
 * License: Ghostscript is AGPL — see COPYING in the vendored folder.
 */
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

const DESKTOP_ROOT = path.join(__dirname, '..');
const DEST_ROOT = path.join(DESKTOP_ROOT, 'resources', 'ghostscript-win');
const MARKER = path.join(DEST_ROOT, 'bin', 'gswin64c.exe');

const GS_TAG = process.env.GS_WINDOWS_TAG || 'gs10051';
const GS_ZIP = process.env.GS_WINDOWS_ZIP || `${GS_TAG}w64.zip`;
const GS_URL =
  process.env.GS_WINDOWS_URL ||
  `https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/${GS_TAG}/${GS_ZIP}`;

function log(msg) {
  console.log(`[vendor-ghostscript] ${msg}`);
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

function rmrf(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    const to = path.join(dest, name);
    const st = fs.statSync(from);
    if (st.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function findGsRoot(extractedDir) {
  const queue = [extractedDir];
  while (queue.length) {
    const dir = queue.shift();
    const binExe = path.join(dir, 'bin', 'gswin64c.exe');
    if (fs.existsSync(binExe)) return dir;
    for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
      if (name.isDirectory()) queue.push(path.join(dir, name.name));
    }
  }
  return null;
}

async function main() {
  if (process.platform !== 'win32') {
    log('skip (not Windows — Ghostscript bundling runs on windows-latest CI or local Windows make)');
    return;
  }

  if (fs.existsSync(MARKER) && process.env.GS_VENDOR_FORCE !== '1') {
    log(`already vendored: ${MARKER}`);
    return;
  }

  const tmp = path.join(DESKTOP_ROOT, '.cache', 'ghostscript-vendor');
  const zipPath = path.join(tmp, GS_ZIP);
  const extractDir = path.join(tmp, 'extract');

  rmrf(tmp);
  fs.mkdirSync(tmp, { recursive: true });

  log(`downloading ${GS_URL}`);
  await download(GS_URL, zipPath);

  log('extracting…');
  const escapedZip = zipPath.replace(/'/g, "''");
  const escapedOut = extractDir.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedOut}' -Force"`,
    { stdio: 'inherit' },
  );

  const gsRoot = findGsRoot(extractDir);
  if (!gsRoot) {
    throw new Error('gswin64c.exe not found in extracted Ghostscript archive');
  }

  log(`packaging from ${gsRoot}`);
  rmrf(DEST_ROOT);
  fs.mkdirSync(DEST_ROOT, { recursive: true });

  for (const name of ['bin', 'lib', 'Resource']) {
    const src = path.join(gsRoot, name);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(DEST_ROOT, name));
    }
  }

  for (const name of ['COPYING', 'LICENSE']) {
    const src = path.join(gsRoot, name);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DEST_ROOT, name));
    }
  }

  fs.writeFileSync(
    path.join(DEST_ROOT, 'VENDOR.txt'),
    `Ghostscript ${GS_TAG} (Windows x64) bundled for Rx-Connect print preview.\n` +
      `Source: ${GS_URL}\n` +
      `License: AGPL — see COPYING in this folder.\n`,
    'utf8',
  );

  if (!fs.existsSync(MARKER)) {
    throw new Error(`vendor failed: ${MARKER} missing`);
  }

  log(`done: ${MARKER}`);
  rmrf(tmp);
}

main().catch((err) => {
  console.error('[vendor-ghostscript] FAILED', err);
  process.exit(1);
});

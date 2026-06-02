/**
 * Downloads Ghostscript (Windows x64) into resources/ghostscript-win for packaging.
 * Skips on non-Windows. Safe to run multiple times (cached).
 *
 * gs10051 ships gs10051w64.exe (Inno Setup). CI hangs on /S silent install — we use 7-Zip instead.
 * License: Ghostscript is AGPL — see COPYING in the vendored folder.
 */
const { execSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const { pipeline } = require('node:stream/promises');

const DESKTOP_ROOT = path.join(__dirname, '..');
const DEST_ROOT = path.join(DESKTOP_ROOT, 'resources', 'ghostscript-win');
const MARKER = path.join(DEST_ROOT, 'bin', 'gswin64c.exe');

const GS_TAG = process.env.GS_WINDOWS_TAG || 'gs10051';
const GS_INSTALLER = process.env.GS_WINDOWS_INSTALLER || `${GS_TAG}w64.exe`;
const GS_URL =
  process.env.GS_WINDOWS_URL ||
  `https://github.com/ArtifexSoftware/ghostpdl-downloads/releases/download/${GS_TAG}/${GS_INSTALLER}`;

const EXTRACT_TIMEOUT_MS = 5 * 60 * 1000;
const SILENT_INSTALL_TIMEOUT_MS = 2 * 60 * 1000;

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

function findGsRoot(searchDir) {
  const queue = [searchDir];
  while (queue.length) {
    const dir = queue.shift();
    const binExe = path.join(dir, 'bin', 'gswin64c.exe');
    if (fs.existsSync(binExe)) return dir;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) queue.push(path.join(dir, entry.name));
    }
  }
  return null;
}

function find7z() {
  const candidates = [
    process.env.SEVEN_ZIP_PATH,
    'C:\\Program Files\\7-Zip\\7z.exe',
    'C:\\Program Files (x86)\\7-Zip\\7z.exe',
  ].filter(Boolean);
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function extractWith7z(sevenZ, archivePath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  log(`7z extract → ${outDir}`);
  execSync(`"${sevenZ}" x "${archivePath}" -o"${outDir}" -y`, {
    stdio: 'inherit',
    timeout: EXTRACT_TIMEOUT_MS,
  });
}

/** Inno .exe often needs a second 7z pass on an inner archive. */
function extractInnoInstaller(sevenZ, installerPath, extractDir) {
  extractWith7z(sevenZ, installerPath, extractDir);
  let gsRoot = findGsRoot(extractDir);
  if (gsRoot) return gsRoot;

  const innerArchives = [];
  const walk = (dir) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
        continue;
      }
      const lower = e.name.toLowerCase();
      if (lower.endsWith('.7z') || lower.endsWith('.cab') || lower === '{app}.7z') {
        innerArchives.push(full);
      }
    }
  };
  walk(extractDir);

  for (const inner of innerArchives) {
    const innerOut = path.join(extractDir, `_7z_${path.basename(inner)}`);
    log(`7z inner archive: ${inner}`);
    extractWith7z(sevenZ, inner, innerOut);
    gsRoot = findGsRoot(innerOut) || findGsRoot(extractDir);
    if (gsRoot) return gsRoot;
  }

  return findGsRoot(extractDir);
}

function silentInstallWithTimeout(installerPath, installDir) {
  const dest = path.resolve(installDir);
  fs.mkdirSync(dest, { recursive: true });
  log(`silent install fallback (max ${SILENT_INSTALL_TIMEOUT_MS / 1000}s) → ${dest}`);

  return new Promise((resolve, reject) => {
    const child = spawn(installerPath, ['/S', `/D=${dest}`], {
      stdio: 'ignore',
      windowsHide: true,
    });
    const timer = setTimeout(() => {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      reject(new Error('Ghostscript silent install timed out'));
    }, SILENT_INSTALL_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`installer exited with code ${code}`));
    });
  });
}

async function extractZipArchive(zipPath, extractDir) {
  log('extracting zip (Expand-Archive)…');
  const escapedZip = zipPath.replace(/'/g, "''");
  const escapedOut = extractDir.replace(/'/g, "''");
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${escapedZip}' -DestinationPath '${escapedOut}' -Force"`,
    { stdio: 'inherit', timeout: EXTRACT_TIMEOUT_MS,
    },
  );
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
  const installerPath = path.join(tmp, GS_INSTALLER);
  const extractDir = path.join(tmp, 'extract');
  const installDir = path.join(tmp, 'install');

  rmrf(tmp);
  fs.mkdirSync(tmp, { recursive: true });

  log(`downloading ${GS_URL}`);
  await download(GS_URL, installerPath);

  let gsRoot = null;
  const lower = GS_INSTALLER.toLowerCase();

  if (lower.endsWith('.zip')) {
    await extractZipArchive(installerPath, extractDir);
    gsRoot = findGsRoot(extractDir);
  } else if (lower.endsWith('.exe')) {
    const sevenZ = find7z();
    if (sevenZ) {
      gsRoot = extractInnoInstaller(sevenZ, installerPath, extractDir);
    } else {
      log('7-Zip not found, skipping exe extract');
    }
    if (!gsRoot) {
      await silentInstallWithTimeout(installerPath, installDir);
      gsRoot = findGsRoot(installDir);
    }
  } else {
    throw new Error(`unsupported Ghostscript asset type: ${GS_INSTALLER}`);
  }

  if (!gsRoot) {
    throw new Error('gswin64c.exe not found after Ghostscript extract/install');
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
    `Ghostscript ${GS_TAG} (Windows x64) bundled for Rx-Manager print preview.\n` +
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

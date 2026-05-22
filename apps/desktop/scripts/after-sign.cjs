/**
 * electron-builder afterSign: also sign the Windows print service if CSC_* env is set.
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

module.exports = async function afterSign(context) {
  if (process.platform !== 'win32') return;
  if (!process.env.CSC_LINK) {
    console.log('[after-sign] CSC_LINK not set — skipping print-service signing');
    return;
  }

  const serviceExe = path.join(
    context.appOutDir,
    'resources',
    'print-service',
    'rxconnect-print-service.exe',
  );
  if (!fs.existsSync(serviceExe)) {
    console.log('[after-sign] no print service exe at', serviceExe);
    return;
  }

  // electron-builder signs via its internal pipeline; reuse windows signtool via electron-builder helper
  try {
    const builder = require('app-builder-lib');
    const { sign } = require('app-builder-lib/out/codeSign/windowsCodeSign');
    const packager = context.packager;
    await sign(serviceExe, packager);
    console.log('[after-sign] signed print service', serviceExe);
  } catch (err) {
    console.warn('[after-sign] could not sign print service via app-builder-lib:', err.message);
    console.warn('[after-sign] sign manually or ensure app-builder-lib is available');
  }
};

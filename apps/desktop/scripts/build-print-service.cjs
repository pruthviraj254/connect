/**
 * Cross-compile RxConnectPrintService for Windows.
 * Requires Go 1.22+ on PATH, or a prebuilt exe at resources/print-service/.
 */
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const srcDir = path.join(root, '..', '..', 'services', 'print-service');
const outDir = path.join(root, 'resources', 'print-service');
const outExe = path.join(outDir, 'rxconnect-print-service.exe');

function hasGo() {
  const r = spawnSync('go', ['version'], { encoding: 'utf8', shell: false });
  return r.status === 0;
}

function build() {
  fs.mkdirSync(outDir, { recursive: true });
  console.log('[build-print-service] building', outExe);
  // Single -ldflags= value — on Windows, shell:true splits "-s -w" and Go sees orphan "-w".
  const r = spawnSync(
    'go',
    ['build', '-ldflags=-s -w', '-o', outExe, '.'],
    {
      cwd: srcDir,
      env: { ...process.env, GOOS: 'windows', GOARCH: 'amd64', CGO_ENABLED: '0' },
      stdio: 'inherit',
      shell: false,
    },
  );
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
  console.log('[build-print-service] ok', outExe);
}

if (hasGo()) {
  build();
} else if (fs.existsSync(outExe)) {
  console.warn('[build-print-service] go not on PATH — using existing', outExe);
} else {
  console.error(
    '[build-print-service] Install Go 1.22+ or copy rxconnect-print-service.exe into resources/print-service/',
  );
  process.exit(1);
}

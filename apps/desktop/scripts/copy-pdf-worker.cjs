/**
 * Copies pdfjs worker into Next static output + public so app:// and dev can load it.
 */
const fs = require('node:fs');
const path = require('node:path');

const desktopRoot = path.join(__dirname, '..');

function resolveWorkerSrc() {
  const candidates = [
    path.join(desktopRoot, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs'),
  ];
  try {
    candidates.unshift(
      path.join(path.dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs'),
    );
  } catch {
    /* not installed */
  }
  return candidates.find((p) => fs.existsSync(p)) ?? null;
}

const workerSrc = resolveWorkerSrc();

if (!workerSrc) {
  console.warn('[copy-pdf-worker] pdfjs-dist worker not found — run pnpm install');
  process.exit(0);
}

const targets = [
  path.join(desktopRoot, 'src', 'renderer', 'public', 'pdf.worker.min.mjs'),
  path.join(desktopRoot, 'src', 'renderer', 'out', 'pdf.worker.min.mjs'),
];

for (const dest of targets) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(workerSrc, dest);
  console.log('[copy-pdf-worker] copied to', dest);
}

/**
 * Run Next.js CLI from src/renderer (cross-platform; Windows CI cannot use `cd … && ../.bin/next`).
 */
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const rendererDir = path.join(__dirname, '..', 'src', 'renderer');
const nextBin = require.resolve('next/dist/bin/next');
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node scripts/run-next.cjs <next-subcommand> [args…]');
  process.exit(1);
}

const result = spawnSync(process.execPath, [nextBin, ...args], {
  cwd: rendererDir,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);

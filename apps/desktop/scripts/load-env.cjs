/**
 * Load repo-root (or apps/desktop) .env for dev scripts and Electron main.
 */
const path = require('node:path');
const fs = require('node:fs');
const dotenv = require('dotenv');

function loadEnvFrom(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i += 1) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return envPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

loadEnvFrom(process.cwd());

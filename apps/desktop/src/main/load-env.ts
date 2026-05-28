import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

function loadEnvFrom(startDir: string): boolean {
  let dir = startDir;
  for (let i = 0; i < 6; i += 1) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return true;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return false;
}

// Packaged apps must not load a repo .env from the user's cwd (e.g. opening from the dev tree).
if (!app.isPackaged) {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  loadEnvFrom(process.cwd()) || loadEnvFrom(moduleDir);
}

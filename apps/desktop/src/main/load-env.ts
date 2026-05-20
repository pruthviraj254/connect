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

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
loadEnvFrom(process.cwd()) || loadEnvFrom(moduleDir);

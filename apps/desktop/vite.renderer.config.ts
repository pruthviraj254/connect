import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal Forge renderer bundle — primary UI is the Next.js app (dev server or static export).
export default defineConfig({
  root: path.join(__dirname, 'src/renderer-shell'),
  plugins: [react()],
});

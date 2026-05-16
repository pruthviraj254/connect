import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import MakerRxPKG from './forge-makers/maker-rx-pkg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const virtualPrinterPkgScripts = path.join(
  __dirname,
  'resources',
  'virtual-printer',
  'pkg',
);

const virtualPrinterResource = path.join(__dirname, 'resources', 'virtual-printer');
const ghostscriptWinResource = path.join(__dirname, 'resources', 'ghostscript-win');
const extraResources = [virtualPrinterResource];
if (fsSync.existsSync(path.join(ghostscriptWinResource, 'bin', 'gswin64c.exe'))) {
  extraResources.push(ghostscriptWinResource);
} else if (process.platform === 'win32') {
  console.warn(
    '[forge] ghostscript-win not vendored — run `node scripts/vendor-ghostscript-win.cjs` before make for Windows PDF preview.',
  );
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'rx-connect',
    extraResource: extraResources,
    protocols: [
      {
        name: 'Rx Connect',
        schemes: ['rxconnect'],
      },
    ],
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      // Squirrel/NuGet id must be alphanumeric (no @scope/name from package.json).
      name: 'RxConnect',
      setupExe: 'Rx-Connect-Setup.exe',
    }),
    new MakerDMG({}),
    new MakerRxPKG({
      scripts: virtualPrinterPkgScripts,
    }),
    new MakerDeb({
      options: {
        maintainer: 'OneRx Health',
        homepage: 'https://onerx.health',
        scripts: {
          postinst: path.join(__dirname, 'resources', 'virtual-printer', 'after-install-linux.sh'),
        },
      },
    }),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  hooks: {
    packageAfterCopy: async (_config, buildPath) => {
      const src = path.join(__dirname, 'src', 'renderer', 'out');
      const dest = path.join(buildPath, 'renderer-out');
      try {
        await fs.access(src);
        await fs.cp(src, dest, { recursive: true });
        let workerSrc = path.join(__dirname, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
        try {
          workerSrc = path.join(
            path.dirname(require.resolve('pdfjs-dist/package.json')),
            'build',
            'pdf.worker.min.mjs',
          );
        } catch {
          /* use local node_modules path */
        }
        if (fsSync.existsSync(workerSrc)) {
          await fs.copyFile(workerSrc, path.join(dest, 'pdf.worker.min.mjs'));
          console.log('[forge] Copied pdf.worker.min.mjs to renderer-out');
        } else {
          console.warn('[forge] pdf.worker.min.mjs not found — PDF preview may not work');
        }
      } catch {
        console.warn('[forge] Skipping renderer copy — run `pnpm run build:renderer` before packaging.');
      }
    },
  },
};

export default config;

import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { MakerDeb } from '@electron-forge/maker-deb';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import MakerRxPKG from './forge-makers/maker-rx-pkg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const virtualPrinterPkgScripts = path.join(
  __dirname,
  'resources',
  'virtual-printer',
  'pkg',
);

const virtualPrinterResource = path.join(__dirname, 'resources', 'virtual-printer');
const ghostscriptWinResource = path.join(__dirname, 'resources', 'ghostscript-win');
const hugoTemplateResource = path.join(__dirname, 'resources', 'hugo-template');
const iconsResource = path.join(__dirname, 'resources', 'icons');
const printServiceResource = path.join(__dirname, 'resources', 'print-service');
const hugoBinResource = path.join(__dirname, 'resources', 'bin');
const extraResources = [virtualPrinterResource, hugoTemplateResource, iconsResource];
if (fsSync.existsSync(printServiceResource)) {
  extraResources.push(printServiceResource);
}
if (fsSync.existsSync(hugoBinResource)) {
  extraResources.push(hugoBinResource);
}
if (fsSync.existsSync(path.join(ghostscriptWinResource, 'bin', 'gswin64c.exe'))) {
  extraResources.push(ghostscriptWinResource);
} else if (process.platform === 'win32') {
  console.warn(
    '[forge] ghostscript-win not vendored — run `node scripts/vendor-ghostscript-win.cjs` before make for Windows PDF preview.',
  );
}

const config: ForgeConfig = {
  packagerConfig: {
    // Stable folder name for electron-builder --prepackaged (out/Rx-Connect-win32-x64).
    name: 'Rx-Connect',
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
    new MakerDMG({}),
    new MakerRxPKG({
      scripts: virtualPrinterPkgScripts,
    }),
    new MakerDeb({
      options: {
        maintainer: 'OneRx Inc',
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
      } catch {
        console.warn('[forge] Skipping renderer copy — run `pnpm run build:renderer` before packaging.');
      }
    },
  },
};

export default config;

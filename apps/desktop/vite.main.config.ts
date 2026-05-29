import { builtinModules } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { getBuildChannel } = require('./scripts/build-channel.cjs') as {
  getBuildChannel: () => { appId: string; productName: string; id: 'production' | 'staging' };
};

const channelProfile = getBuildChannel();

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || channelProfile.defaultApiBaseUrl;
const ingestSecret =
  process.env.RX_CONNECT_INGEST_SECRET?.trim() ||
  process.env.NEXT_PUBLIC_RX_CONNECT_INGEST_SECRET?.trim() ||
  '166be1ad06e5c1e9990ccf573143e1ebf1f47301ce45b7bb463b75be5c2a2638';

/** Staging CI/local dist only — never baked into production channel builds. */
const devSkipAuthAtBuild =
  channelProfile.id === 'staging' &&
  (process.env.RX_CONNECT_DEV_SKIP_AUTH?.trim() === 'true' ||
    process.env.RX_CONNECT_DEV_SKIP_AUTH === '1');

/** Match @electron-forge/plugin-vite defaults + native addons (keytar `.node` must not be bundled). */
const mainExternals = [
  'electron',
  'electron/common',
  ...builtinModules.map((m) => [m, `node:${m}`]).flat(),
  'electron/main',
  'keytar',
  'electron-log',
  'electron-store',
  'electron-updater',
];

function isMainExternal(id: string): boolean {
  return (
    mainExternals.includes(id) ||
    id === 'keytar' ||
    id.startsWith('keytar/') ||
    id.includes('node_modules/keytar')
  );
}

export default defineConfig({
  build: {
    rollupOptions: {
      external: (id) => isMainExternal(id),
    },
  },
  define: {
    __RX_BUILD_APP_USER_MODEL_ID__: JSON.stringify(channelProfile.appId),
    __RX_BUILD_PRODUCT_NAME__: JSON.stringify(channelProfile.productName),
    __RX_BUILD_CHANNEL__: JSON.stringify(channelProfile.id),
    __RX_API_BASE_URL__: JSON.stringify(apiBaseUrl),
    __RX_INGEST_SECRET__: JSON.stringify(ingestSecret),
    __RX_DEV_SKIP_AUTH__: JSON.stringify(devSkipAuthAtBuild),
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@rx-connect/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});

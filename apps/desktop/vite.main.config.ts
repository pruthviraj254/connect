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

export default defineConfig({
  define: {
    __RX_BUILD_APP_USER_MODEL_ID__: JSON.stringify(channelProfile.appId),
    __RX_BUILD_PRODUCT_NAME__: JSON.stringify(channelProfile.productName),
    __RX_BUILD_CHANNEL__: JSON.stringify(channelProfile.id),
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@rx-connect/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
});

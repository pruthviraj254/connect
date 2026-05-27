/** Compile-time channel identity (set in vite.main.config.ts from RX_CONNECT_CHANNEL). */
declare const __RX_BUILD_APP_USER_MODEL_ID__: string;
declare const __RX_BUILD_PRODUCT_NAME__: string;
declare const __RX_BUILD_CHANNEL__: 'production' | 'staging';

const PRODUCTION_APP_USER_MODEL_ID = 'health.onerx.rxconnect';
const STAGING_APP_USER_MODEL_ID = 'health.onerx.rxconnect.staging';

export function getBakedAppUserModelId(): string {
  if (typeof __RX_BUILD_APP_USER_MODEL_ID__ === 'string' && __RX_BUILD_APP_USER_MODEL_ID__) {
    return __RX_BUILD_APP_USER_MODEL_ID__;
  }
  return PRODUCTION_APP_USER_MODEL_ID;
}

export function getBakedProductName(): string {
  if (typeof __RX_BUILD_PRODUCT_NAME__ === 'string' && __RX_BUILD_PRODUCT_NAME__) {
    return __RX_BUILD_PRODUCT_NAME__;
  }
  return 'Rx-Connect';
}

export function getBakedChannel(): 'production' | 'staging' {
  if (typeof __RX_BUILD_CHANNEL__ === 'string' && __RX_BUILD_CHANNEL__ === 'staging') {
    return 'staging';
  }
  return 'production';
}

export function getBakedDefaultsForChannel(channel: 'production' | 'staging') {
  return channel === 'staging'
    ? {
        channel: 'staging' as const,
        appUserModelId: STAGING_APP_USER_MODEL_ID,
        productName: 'Rx-Connect Staging',
      }
    : {
        channel: 'production' as const,
        appUserModelId: PRODUCTION_APP_USER_MODEL_ID,
        productName: 'Rx-Connect',
      };
}

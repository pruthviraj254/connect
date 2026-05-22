import { app } from 'electron';
import Store from 'electron-store';

import type { PharmacyWebsiteData } from '@rx-connect/shared';

type AppStoreSchema = {
  theme: 'system' | 'light' | 'dark';
  openAtLogin: boolean;
  firstRunCompleted: boolean;
  trayHintShown: boolean;
  zustandPersist: Record<string, string>;
  websiteBuilder: Record<string, PharmacyWebsiteData>;
};

const defaults: AppStoreSchema = {
  theme: 'system',
  openAtLogin: false,
  firstRunCompleted: false,
  trayHintShown: false,
  zustandPersist: {},
  websiteBuilder: {},
};

let store: Store<AppStoreSchema> | null = null;

/** Must run after app.whenReady() — electron-store needs app.getPath('userData'). */
export function initStore(): void {
  if (store) return;
  store = new Store<AppStoreSchema>({
    name: 'rx-connect-config',
    defaults,
  });
}

export function getStore(): Store<AppStoreSchema> {
  if (!store) {
    if (!app.isReady()) {
      throw new Error('Store accessed before app.whenReady() — call initStore() first');
    }
    initStore();
  }
  return store as Store<AppStoreSchema>;
}

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

const store = new Store<AppStoreSchema>({
  name: 'rx-connect-config',
  defaults: {
    theme: 'system',
    openAtLogin: false,
    firstRunCompleted: false,
    trayHintShown: false,
    zustandPersist: {},
    websiteBuilder: {},
  },
});

export function getStore(): Store<AppStoreSchema> {
  return store;
}

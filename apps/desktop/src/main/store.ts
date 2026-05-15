import Store from 'electron-store';

type AppStoreSchema = {
  theme: 'system' | 'light' | 'dark';
  openAtLogin: boolean;
  zustandPersist: Record<string, string>;
};

const store = new Store<AppStoreSchema>({
  name: 'rx-connect-config',
  defaults: {
    theme: 'system',
    openAtLogin: false,
    zustandPersist: {},
  },
});

export function getStore(): Store<AppStoreSchema> {
  return store;
}

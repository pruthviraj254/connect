import { ipcMain } from 'electron';
import { IpcChannel } from '@rx-manager/shared';
import { getStore } from '../../store.js';

export function registerStoreHandlers(): void {
  ipcMain.handle(IpcChannel.StoreGet, async (_e, key: string) => {
    const store = getStore();
    const bucket = store.get('zustandPersist');
    return bucket[key] ?? null;
  });

  ipcMain.handle(IpcChannel.StoreSet, async (_e, payload: { key: string; value: string }) => {
    const store = getStore();
    const bucket = { ...store.get('zustandPersist') };
    bucket[payload.key] = payload.value;
    store.set('zustandPersist', bucket);
  });

  ipcMain.handle(IpcChannel.StoreDelete, async (_e, key: string) => {
    const store = getStore();
    const bucket = { ...store.get('zustandPersist') };
    delete bucket[key];
    store.set('zustandPersist', bucket);
  });
}

import { ipcMain, app, nativeTheme } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-connect/shared';
import { getStore } from '../../store.js';

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannel.SettingsGet, async (): Promise<IpcResult<Record<string, unknown>>> => {
    const store = getStore();
    const openAtLogin = process.platform === 'win32' ? true : store.get('openAtLogin');
    return {
      ok: true,
      data: {
        theme: 'light',
        openAtLogin,
      },
    };
  });

  ipcMain.handle(
    IpcChannel.SettingsSet,
    async (_e, payload: { theme?: 'system' | 'light' | 'dark'; openAtLogin?: boolean }) => {
      const store = getStore();
      if (payload.theme) {
        store.set('theme', 'light');
        nativeTheme.themeSource = 'light';
      }
      if (typeof payload.openAtLogin === 'boolean' && process.platform !== 'win32') {
        store.set('openAtLogin', payload.openAtLogin);
        app.setLoginItemSettings({
          openAtLogin: payload.openAtLogin,
          openAsHidden: payload.openAtLogin,
          args: [],
        });
      }
      return { ok: true as const, data: null };
    },
  );
}

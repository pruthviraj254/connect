import { ipcMain, app, nativeTheme } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-connect/shared';
import { getStore } from '../../store.js';

export function registerSettingsHandlers(): void {
  ipcMain.handle(IpcChannel.SettingsGet, async (): Promise<IpcResult<Record<string, unknown>>> => {
    const store = getStore();
    return {
      ok: true,
      data: {
        theme: store.get('theme'),
        openAtLogin: store.get('openAtLogin'),
      },
    };
  });

  ipcMain.handle(
    IpcChannel.SettingsSet,
    async (_e, payload: { theme?: 'system' | 'light' | 'dark'; openAtLogin?: boolean }) => {
      const store = getStore();
      if (payload.theme) {
        store.set('theme', payload.theme);
        nativeTheme.themeSource = payload.theme;
      }
      if (typeof payload.openAtLogin === 'boolean') {
        store.set('openAtLogin', payload.openAtLogin);
        app.setLoginItemSettings({
          openAtLogin: payload.openAtLogin,
          openAsHidden: payload.openAtLogin,
          args: process.platform === 'win32' && payload.openAtLogin ? ['--hidden'] : [],
        });
      }
      return { ok: true as const, data: null };
    },
  );
}

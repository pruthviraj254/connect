import { app, Notification } from 'electron';
import log from 'electron-log';
import { getStore } from './store.js';

export function applyFirstRunDefaults(): void {
  const store = getStore();
  if (store.get('firstRunCompleted')) {
    return;
  }
  store.set('firstRunCompleted', true);
  store.set('openAtLogin', true);
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      args: process.platform === 'win32' ? ['--hidden'] : [],
    });
    log.info('[first-run] enabled openAtLogin + openAsHidden');
  } catch (err) {
    log.warn('[first-run] setLoginItemSettings failed', err);
  }
}

/** Windows: always launch at login (no Settings toggle — enforced every startup). */
export function ensureOpenAtLoginEnabled(): void {
  if (process.platform !== 'win32') {
    return;
  }
  const store = getStore();
  store.set('openAtLogin', true);
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      openAsHidden: true,
      args: ['--hidden'],
    });
    log.info('[startup] openAtLogin enforced on Windows');
  } catch (err) {
    log.warn('[startup] setLoginItemSettings failed', err);
  }
}

export function maybeShowTrayHint(): void {
  if (process.platform === 'darwin') return;
  const store = getStore();
  if (store.get('trayHintShown')) return;
  store.set('trayHintShown', true);
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Rx-Manager',
        body: 'Rx-Manager keeps running in the system tray after you close the window. Right-click the tray icon to quit.',
      });
      n.show();
    }
  } catch (err) {
    log.warn('[tray] hint notification failed', err);
  }
}

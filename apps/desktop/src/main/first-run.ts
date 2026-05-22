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

export function maybeShowTrayHint(): void {
  if (process.platform === 'darwin') return;
  const store = getStore();
  if (store.get('trayHintShown')) return;
  store.set('trayHintShown', true);
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Rx-Connect',
        body: 'Rx-Connect keeps running in the system tray after you close the window. Right-click the tray icon to quit.',
      });
      n.show();
    }
  } catch (err) {
    log.warn('[tray] hint notification failed', err);
  }
}

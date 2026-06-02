import { app, BrowserWindow } from 'electron';
import type { UpdateGateState } from '@rx-manager/shared';

const GATE_EVENT = 'update:gateChanged';

export function broadcastUpdateGate(state: UpdateGateState): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send(GATE_EVENT, state);
    }
  }
}

let forwarderRegistered = false;

/** Push current gate state to every window, including ones created later. */
export function registerUpdateGateForwarder(getState: () => UpdateGateState): void {
  if (forwarderRegistered) {
    return;
  }
  forwarderRegistered = true;

  app.on('browser-window-created', (_event, win) => {
    win.webContents.once('did-finish-load', () => {
      if (!win.isDestroyed()) {
        win.webContents.send(GATE_EVENT, getState());
      }
    });
  });
}

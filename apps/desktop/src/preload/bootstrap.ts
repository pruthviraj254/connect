import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannel,
  type ElectronAPI,
  type PrintJobRecord,
  type UpdateGateState,
} from '@rx-connect/shared';

import { buildBridge } from './bridge.js';

const allowed = new Set<string>(Object.values(IpcChannel));

function invoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
  if (!allowed.has(channel)) {
    return Promise.reject(new Error(`IPC channel not allowed: ${channel}`));
  }
  return ipcRenderer.invoke(channel, ...args) as Promise<T>;
}

const electronAPI: ElectronAPI = {
  invoke,
  onDeepLink: (handler: (url: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, url: string) => {
      handler(url);
    };
    ipcRenderer.on('app:deep-link', listener);
    return () => {
      ipcRenderer.removeListener('app:deep-link', listener);
    };
  },
  onNetworkStatus: (handler: (payload: { online: boolean }) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: { online: boolean }) => {
      handler(payload);
    };
    ipcRenderer.on('app:network-status', listener);
    return () => {
      ipcRenderer.removeListener('app:network-status', listener);
    };
  },
  onPrintJob: (handler: (job: PrintJobRecord) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, job: PrintJobRecord) => {
      handler(job);
    };
    ipcRenderer.on('print-job:incoming', listener);
    return () => {
      ipcRenderer.removeListener('print-job:incoming', listener);
    };
  },
  onFaxSendLogUpdated: (handler: () => void) => {
    const listener = () => handler();
    ipcRenderer.on('fax-send-log:updated', listener);
    return () => {
      ipcRenderer.removeListener('fax-send-log:updated', listener);
    };
  },
  onUpdateGateChanged: (handler: (state: UpdateGateState) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, state: UpdateGateState) => {
      handler(state);
    };
    ipcRenderer.on('update:gateChanged', listener);
    return () => {
      ipcRenderer.removeListener('update:gateChanged', listener);
    };
  },
};

contextBridge.exposeInMainWorld('api', buildBridge(ipcRenderer));
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

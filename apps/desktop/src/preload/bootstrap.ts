import { contextBridge, ipcRenderer } from 'electron';
import {
  IpcChannel,
  type ElectronAPI,
  type PrintJobRecord,
  type UpdateStatus,
} from '@rx-connect/shared';

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
  onUpdateStatus: (handler: (status: UpdateStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, status: UpdateStatus) => {
      handler(status);
    };
    ipcRenderer.on('update:status', listener);
    return () => {
      ipcRenderer.removeListener('update:status', listener);
    };
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

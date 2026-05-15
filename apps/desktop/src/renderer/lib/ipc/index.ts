import { IpcChannel } from '@rx-connect/shared';

export async function ipcInvoke<T>(channel: IpcChannel, ...args: unknown[]): Promise<T> {
  if (typeof window === 'undefined' || !window.electronAPI) {
    throw new Error('electronAPI is not available (not running inside Electron?)');
  }
  return window.electronAPI.invoke<T>(channel, ...args);
}

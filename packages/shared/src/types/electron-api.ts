import type { IpcChannel } from '../ipc-channels';

export type ElectronAPI = {
  invoke: <T>(channel: IpcChannel, ...args: unknown[]) => Promise<T>;
  onDeepLink: (handler: (url: string) => void) => () => void;
  onNetworkStatus: (handler: (payload: { online: boolean }) => void) => () => void;
};

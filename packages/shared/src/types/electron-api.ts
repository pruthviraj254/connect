import type { IpcChannel } from '../ipc-channels';
import type { PrintJobRecord } from './print-job-ipc';
import type { UpdateGateState } from './update';

export type ElectronAPI = {
  invoke: <T>(channel: IpcChannel, ...args: unknown[]) => Promise<T>;
  onDeepLink: (handler: (url: string) => void) => () => void;
  onNetworkStatus: (handler: (payload: { online: boolean }) => void) => () => void;
  onPrintJob: (handler: (job: PrintJobRecord) => void) => () => void;
  onFaxSendLogUpdated: (handler: () => void) => () => void;
  onUpdateGateChanged: (handler: (state: UpdateGateState) => void) => () => void;
};

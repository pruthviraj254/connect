import { IpcChannel, type IpcResult, type UpdateGateState } from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export async function getAppVersion(): Promise<string> {
  return ipcInvoke<string>(IpcChannel.AppGetVersion);
}

export async function getUpdateGate(): Promise<UpdateGateState> {
  const result = await ipcInvoke<IpcResult<UpdateGateState>>(IpcChannel.UpdateGetGate);
  return unwrapIpc(result);
}

export async function checkForUpdates(): Promise<void> {
  const result = await ipcInvoke<IpcResult<undefined>>(IpcChannel.UpdateCheck);
  unwrapIpc(result);
}

export async function retryUpdate(): Promise<void> {
  const result = await ipcInvoke<IpcResult<undefined>>(IpcChannel.UpdateRetry);
  unwrapIpc(result);
}

export async function installPendingUpdate(): Promise<void> {
  const result = await ipcInvoke<IpcResult<undefined>>(IpcChannel.UpdateInstallPending);
  unwrapIpc(result);
}

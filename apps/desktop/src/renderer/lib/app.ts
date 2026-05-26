import { IpcChannel, type IpcResult, type UpdateCapabilities } from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export async function getAppVersion(): Promise<string> {
  return ipcInvoke<string>(IpcChannel.AppGetVersion);
}

export async function checkForUpdates(): Promise<void> {
  const result = await ipcInvoke<IpcResult<undefined>>(IpcChannel.UpdateCheck);
  unwrapIpc(result);
}

export async function quitAndInstallUpdate(): Promise<void> {
  const result = await ipcInvoke<IpcResult<undefined>>(IpcChannel.UpdateQuitAndInstall);
  unwrapIpc(result);
}

export async function getUpdateCapabilities(): Promise<UpdateCapabilities> {
  const result = await ipcInvoke<IpcResult<UpdateCapabilities>>(IpcChannel.UpdateGetCapabilities);
  return unwrapIpc(result);
}

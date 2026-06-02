import type { IpcResult } from '@rx-manager/shared';

export function unwrapIpc<T>(result: IpcResult<T>): T {
  if (result.ok) {
    return result.data;
  }
  throw new Error(result.error);
}

import { ipcMain, type IpcMainInvokeEvent } from 'electron';
import type { ZodType } from 'zod';

import { IpcChannel } from '@rx-connect/shared';
import type { IpcContracts, IpcRequest, IpcResponse } from '@rx-connect/shared';

import { isMainWebContents } from '../lib/mainWindow.js';
import { serializeErrorForIpc } from '../lib/ipcErrors.js';

export type TypedIpcChannel = keyof IpcContracts;

export type IpcHandler<K extends TypedIpcChannel> = (
  req: IpcRequest<K>,
) => Promise<IpcResponse<K>> | IpcResponse<K>;

interface RegisterOptions<K extends TypedIpcChannel> {
  channel: K;
  schema: ZodType<IpcRequest<K>>;
  handler: IpcHandler<K>;
}

const registered = new Set<string>();

function isTrustedSender(event: IpcMainInvokeEvent): boolean {
  const frame = event.senderFrame;
  if (!frame) return false;
  if (frame.parent !== null) return false;
  if (!isMainWebContents(event.sender.id)) return false;
  return true;
}

export function registerHandler<K extends TypedIpcChannel>(options: RegisterOptions<K>): void {
  const { channel, schema, handler } = options;

  if (registered.has(channel)) {
    throw new Error(`IPC channel "${channel}" was registered twice.`);
  }
  registered.add(channel);

  ipcMain.handle(channel, async (event, rawPayload: unknown) => {
    if (!isTrustedSender(event)) {
      throw new Error(`IPC channel "${channel}" rejected: untrusted sender.`);
    }

    const parsed = schema.safeParse(rawPayload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const detail = issue
        ? `${issue.path.join('.') || '(root)'}: ${issue.message}`
        : 'invalid payload';
      throw new Error(`IPC channel "${channel}" rejected: ${detail}`);
    }

    try {
      return await handler(parsed.data as IpcRequest<K>);
    } catch (error) {
      throw serializeErrorForIpc(error);
    }
  });
}

/** Legacy handlers still use IpcChannel enum values outside IpcContracts. */
export function registerLegacyHandler(
  channel: IpcChannel,
  handler: (event: IpcMainInvokeEvent, ...args: unknown[]) => unknown,
): void {
  if (registered.has(channel)) {
    throw new Error(`IPC channel "${channel}" was registered twice.`);
  }
  registered.add(channel);
  ipcMain.handle(channel, handler);
}

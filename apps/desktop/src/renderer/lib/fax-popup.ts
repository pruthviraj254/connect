import {
  IpcChannel,
  type FaxContact,
  type FaxContactCreate,
  type FaxSendLogEntry,
  type FaxSendPayload,
  type FaxSendResult,
  type IpcResult,
  type PrintJobRecord,
} from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export async function getPopupJob(): Promise<PrintJobRecord> {
  const result = await ipcInvoke<IpcResult<PrintJobRecord>>(IpcChannel.FaxPopupGetJob);
  return unwrapIpc(result);
}

export async function listContacts(query?: string): Promise<FaxContact[]> {
  const result = await ipcInvoke<IpcResult<FaxContact[]>>(IpcChannel.ContactsList, query);
  return unwrapIpc(result);
}

export async function addContact(input: FaxContactCreate): Promise<FaxContact> {
  const result = await ipcInvoke<IpcResult<FaxContact>>(IpcChannel.ContactsAdd, input);
  return unwrapIpc(result);
}

export async function sendFaxFromPopup(payload: FaxSendPayload): Promise<FaxSendResult> {
  const result = await ipcInvoke<IpcResult<FaxSendResult>>(IpcChannel.FaxSend, payload);
  return unwrapIpc(result);
}

export async function closeFaxPopup(): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.FaxPopupClose);
  unwrapIpc(result);
}

export async function browsePopupPdf(): Promise<string | null> {
  const result = await ipcInvoke<IpcResult<string | null>>(IpcChannel.FaxPopupBrowsePdf);
  return unwrapIpc(result);
}

export async function listFaxSendLog(): Promise<FaxSendLogEntry[]> {
  const result = await ipcInvoke<IpcResult<FaxSendLogEntry[]>>(IpcChannel.FaxSendLogList);
  return unwrapIpc(result);
}

export async function clearFaxSendLog(): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.FaxSendLogClear);
  unwrapIpc(result);
}

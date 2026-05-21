import { ipcMain } from 'electron';
import { IpcChannel, type FaxContact, type FaxContactCreate, type IpcResult } from '@rx-connect/shared';
import { addContact, deleteContact, listContacts } from '../../contacts/contacts-store.js';

function parseCreate(raw: unknown): FaxContactCreate | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.name !== 'string' || typeof o.faxNumber !== 'string') return null;
  return {
    name: o.name,
    faxNumber: o.faxNumber,
    company: typeof o.company === 'string' ? o.company : undefined,
  };
}

export function registerContactsHandlers(): void {
  ipcMain.handle(
    IpcChannel.ContactsList,
    async (_e, query?: unknown): Promise<IpcResult<FaxContact[]>> => {
      const q = typeof query === 'string' ? query : undefined;
      return { ok: true, data: listContacts(q) };
    },
  );

  ipcMain.handle(
    IpcChannel.ContactsAdd,
    async (_e, raw: unknown): Promise<IpcResult<FaxContact>> => {
      const input = parseCreate(raw);
      if (!input || !input.name.trim() || !input.faxNumber.trim()) {
        return { ok: false, error: 'invalid_contact' };
      }
      return { ok: true, data: addContact(input) };
    },
  );

  ipcMain.handle(IpcChannel.ContactsDelete, async (_e, id: unknown): Promise<IpcResult<null>> => {
    if (typeof id !== 'string' || !id.trim()) {
      return { ok: false, error: 'invalid_id' };
    }
    const ok = deleteContact(id);
    return ok ? { ok: true, data: null } : { ok: false, error: 'not_found' };
  });
}

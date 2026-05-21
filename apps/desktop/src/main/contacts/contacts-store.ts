import { randomUUID } from 'node:crypto';
import log from 'electron-log';
import type { FaxContact, FaxContactCreate } from '@rx-connect/shared';
import { getStore } from '../store.js';

const STORE_KEY = 'fax-contacts';

const SEED_CONTACTS: FaxContact[] = [
  { id: 'seed-1', name: 'Dr. Smith Office', faxNumber: '+15551234001', company: 'Smith Medical' },
  { id: 'seed-2', name: 'City Pharmacy', faxNumber: '+15551234002', company: 'City Pharmacy LLC' },
  { id: 'seed-3', name: 'Regional Lab', faxNumber: '+15551234003' },
];

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase();
}

function matches(contact: FaxContact, query: string): boolean {
  if (!query) return true;
  const hay = `${contact.name} ${contact.faxNumber} ${contact.company ?? ''}`.toLowerCase();
  return hay.includes(query);
}

function readAll(): FaxContact[] {
  const store = getStore();
  let list = store.get(STORE_KEY) as FaxContact[] | undefined;
  if (!Array.isArray(list) || list.length === 0) {
    list = [...SEED_CONTACTS];
    store.set(STORE_KEY, list);
    log.info('[contacts-store] seeded dummy contacts', list.length);
  }
  return list;
}

function writeAll(contacts: FaxContact[]): void {
  getStore().set(STORE_KEY, contacts);
}

/** Dummy API — replace internals when real contacts API is wired. */
export function listContacts(query?: string): FaxContact[] {
  const q = normalizeQuery(query ?? '');
  const all = readAll();
  const filtered = all.filter((c) => matches(c, q));
  log.info('[contacts-store] list', { query: q || '(all)', count: filtered.length });
  return filtered.sort((a, b) => a.name.localeCompare(b.name));
}

export function addContact(input: FaxContactCreate): FaxContact {
  const contact: FaxContact = {
    id: randomUUID(),
    name: input.name.trim(),
    faxNumber: input.faxNumber.trim(),
    company: input.company?.trim() || undefined,
  };
  const all = readAll();
  all.push(contact);
  writeAll(all);
  log.info('[contacts-store] added', contact.id, contact.name);
  return contact;
}

export function deleteContact(id: string): boolean {
  const all = readAll();
  const next = all.filter((c) => c.id !== id);
  if (next.length === all.length) return false;
  writeAll(next);
  log.info('[contacts-store] deleted', id);
  return true;
}

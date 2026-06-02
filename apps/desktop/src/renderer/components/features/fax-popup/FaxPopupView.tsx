'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import type { FaxContact, PrintJobRecord } from '@rx-manager/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addContact,
  browsePopupPdf,
  closeFaxPopup,
  getPopupJob,
  listContacts,
  sendFaxFromPopup,
} from '@/lib/fax-popup';

type Resolution = 'standard' | 'fine' | 'superfine';

export function FaxPopupView() {
  const [job, setJob] = useState<PrintJobRecord | null>(null);
  const [pdfPath, setPdfPath] = useState('');
  const [faxNumber, setFaxNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<FaxContact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [resolution, setResolution] = useState<Resolution>('fine');
  const [coverOpen, setCoverOpen] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [coverSubject, setCoverSubject] = useState('');
  const [coverMessage, setCoverMessage] = useState('');
  const [newName, setNewName] = useState('');
  const [newFax, setNewFax] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [status, setStatus] = useState('Print job received — enter fax number and send');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshContacts = useCallback(async (q?: string) => {
    const list = await listContacts(q);
    setContacts(list);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const incoming = await getPopupJob();
        setJob(incoming);
        setPdfPath(incoming.pdfPath);
        await refreshContacts();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load print job');
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshContacts]);

  const onSearch = () => {
    void refreshContacts(searchQuery);
  };

  const onToggleContact = (contact: FaxContact) => {
    setSelectedContactIds((prev) => {
      const next = prev.includes(contact.id)
        ? prev.filter((id) => id !== contact.id)
        : [...prev, contact.id];
      const count = next.length;
      setStatus(count === 0 ? 'No contacts selected' : `${count} contact${count === 1 ? '' : 's'} selected`);
      return next;
    });
  };

  const selectedContacts = contacts.filter((c) => selectedContactIds.includes(c.id));

  const buildRecipients = (): string[] => {
    const fromContacts = selectedContacts.map((c) => c.faxNumber.trim()).filter(Boolean);
    const manual = faxNumber.trim();
    const all = manual ? [...fromContacts, manual] : fromContacts;
    return [...new Set(all)];
  };

  const onAddContact = async () => {
    if (!newName.trim() || !newFax.trim()) return;
    try {
      const created = await addContact({
        name: newName.trim(),
        faxNumber: newFax.trim(),
        company: newCompany.trim() || undefined,
      });
      setNewName('');
      setNewFax('');
      setNewCompany('');
      setAddContactOpen(false);
      await refreshContacts(searchQuery);
      setSelectedContactIds((prev) =>
        prev.includes(created.id) ? prev : [...prev, created.id],
      );
      setStatus(`Added ${created.name}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not add contact');
    }
  };

  const onBrowse = async () => {
    try {
      const path = await browsePopupPdf();
      if (path) {
        setPdfPath(path);
        setStatus('Using selected PDF file');
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Browse failed');
    }
  };

  const onSend = async () => {
    if (!job) return;
    const recipients = buildRecipients();
    if (recipients.length === 0) {
      setStatus('Select at least one contact or enter a fax number');
      return;
    }
    setSending(true);
    setStatus(`Sending to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'}…`);
    let lastFileHint = '';
    try {
      for (let i = 0; i < recipients.length; i++) {
        const to = recipients[i];
        setStatus(`Sending ${i + 1}/${recipients.length} to ${to}…`);
        const result = await sendFaxFromPopup({
          to,
          pdfPath,
          resolution,
          coverSubject: coverOpen ? coverSubject.trim() || undefined : undefined,
          coverMessage: coverOpen ? coverMessage.trim() || undefined : undefined,
          jobId: job.id,
          jobTitle: job.title,
        });
      const raw = result.raw as
        | { fileName?: string; sizeBytes?: number; pdfPath?: string }
        | undefined;
      const sizeHint =
        typeof raw?.sizeBytes === 'number'
          ? ` (${raw.sizeBytes.toLocaleString()} bytes)`
          : '';
      const nameHint = raw?.fileName ? ` — ${raw.fileName}` : '';
      const pathHint = raw?.pdfPath ? `\n${raw.pdfPath}` : '';
      lastFileHint = `${nameHint}${sizeHint}${pathHint}`;
      }
      setStatus(
        `Sent to ${recipients.length} recipient${recipients.length === 1 ? '' : 's'} (mock)${lastFileHint}`,
      );
      try {
        await closeFaxPopup();
      } catch {
        /* window may already be closing */
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'send_failed';
      setStatus(`Send failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-sm text-muted-foreground">
        Loading print job…
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6 text-center text-sm text-destructive">
        {error ?? 'Print job not found'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <header className="px-5 py-4 border-b border-border bg-card shrink-0">
        <h1 className="text-lg font-semibold text-navy">OneRx Fax</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fax-number">Fax Number (optional if contacts selected)</Label>
          <Input
            id="fax-number"
            value={faxNumber}
            onChange={(e) => setFaxNumber(e.target.value)}
            placeholder="+15551234567"
          />
          {selectedContacts.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedContacts.map((c) => c.name).join(', ')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Search Contacts (click to select multiple)</Label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, company, or number"
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            />
            <Button type="button" variant="secondary" size="icon" onClick={onSearch} aria-label="Search">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          <div className="border border-border rounded-md h-36 overflow-y-auto bg-white">
            {contacts.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No contacts found</p>
            ) : (
              contacts.map((c) => {
                const selected = selectedContactIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onToggleContact(c)}
                    className={`w-full text-left px-3 py-2 text-sm border-b border-border/50 hover:bg-muted/60 flex gap-2 items-start ${
                      selected ? 'bg-teal/10' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center text-[10px] ${
                        selected
                          ? 'border-teal bg-teal text-teal-foreground'
                          : 'border-border bg-background'
                      }`}
                      aria-hidden
                    >
                      {selected ? '✓' : ''}
                    </span>
                    <span className="min-w-0 flex-1">
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.faxNumber}
                        {c.company ? ` · ${c.company}` : ''}
                      </div>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="border border-border rounded-md">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-left hover:bg-muted/40"
            onClick={() => setAddContactOpen((v) => !v)}
          >
            {addContactOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Plus className="h-4 w-4" />
            Add New Contact
          </button>
          {addContactOpen && (
            <div className="px-3 pb-3 space-y-2 border-t border-border">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Fax Number</Label>
                <Input value={newFax} onChange={(e) => setNewFax(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Company (optional)</Label>
                <Input value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={() => void onAddContact()}>
                Add Contact
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>File</Label>
          <div className="flex gap-2">
            <Input readOnly value={pdfPath} className="font-mono text-xs" />
            <Button type="button" variant="outline" onClick={() => void onBrowse()}>
              Browse
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Resolution</Label>
          <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="fine">Fine (sharper)</SelectItem>
              <SelectItem value="superfine">Superfine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border border-border rounded-md">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-left hover:bg-muted/40"
            onClick={() => setCoverOpen((v) => !v)}
          >
            {coverOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Cover Sheet
          </button>
          {coverOpen && (
            <div className="px-3 pb-3 space-y-2 border-t border-border">
              <div className="space-y-1">
                <Label>Subject</Label>
                <Input value={coverSubject} onChange={(e) => setCoverSubject(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Message</Label>
                <textarea
                  className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={coverMessage}
                  onChange={(e) => setCoverMessage(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className="shrink-0 border-t border-border px-5 py-3 flex items-center justify-between gap-3 bg-muted/30">
        <p className="text-xs text-muted-foreground flex-1 whitespace-pre-wrap break-all">{status}</p>
        <Button
          type="button"
          className="bg-teal text-teal-foreground shrink-0"
          disabled={sending}
          onClick={() => void onSend()}
        >
          {sending ? 'Sending…' : 'Send Fax'}
        </Button>
      </footer>
    </div>
  );
}

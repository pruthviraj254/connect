'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import type { FaxSendLogEntry } from '@rx-connect/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { PrintJobRecord } from '@rx-connect/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  clearFaxSendLog,
  deletePrintJobFile,
  downloadPrintJob,
  getPrintJobPagePngs,
  getPrinterStatus,
  installVirtualPrinter,
  listFaxSendLog,
  listIncomingPrintJobs,
  sendFaxFromPdf,
} from '@/lib/fax-print';
import { PdfPreviewPanel } from '@/components/features/fax/PdfPreviewPanel';
import { isElectronApp } from '@/lib/electron';

const faxSchema = z.object({
  to: z.string().min(8, 'Enter a fax destination number'),
  from: z.string().optional(),
});

type FaxForm = z.infer<typeof faxSchema>;

export function FaxInboxView() {
  const [jobs, setJobs] = useState<PrintJobRecord[]>([]);
  const [sendLog, setSendLog] = useState<FaxSendLogEntry[]>([]);
  const [inboxTab, setInboxTab] = useState<'jobs' | 'sent'>('jobs');
  const [selected, setSelected] = useState<PrintJobRecord | null>(null);
  const [pagePngs, setPagePngs] = useState<string[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [printerInstalled, setPrinterInstalled] = useState<boolean | null>(null);
  const [printerInstalling, setPrinterInstalling] = useState(false);
  const [printerName, setPrinterName] = useState('RxConnect');
  const [driverName, setDriverName] = useState<string | null>(null);
  const [driverOk, setDriverOk] = useState<boolean>(true);

  const refresh = useCallback(async () => {
    if (!isElectronApp()) return;
    try {
      const [list, log] = await Promise.all([listIncomingPrintJobs(), listFaxSendLog()]);
      setJobs(list);
      setSendLog(log);
    } catch {
      toast.error('Could not load print jobs.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const refreshPrinterStatus = useCallback(async () => {
    if (!isElectronApp()) return;
    try {
      const status = await getPrinterStatus();
      setPrinterInstalled(status.installed);
      if (status.printerName) setPrinterName(status.printerName);
      setDriverName(status.driverName ?? null);
      setDriverOk(status.driverOk !== false);
    } catch {
      setPrinterInstalled(null);
    }
  }, []);

  useEffect(() => {
    void refreshPrinterStatus();
  }, [refreshPrinterStatus]);

  const onInstallPrinter = async () => {
    setPrinterInstalling(true);
    try {
      const result = await installVirtualPrinter();
      if (result.ok) {
        setPrinterInstalled(true);
        toast.success(`${printerName} printer installed`);
        await refreshPrinterStatus();
      } else {
        const hint =
          result.error === 'uac_cancelled'
            ? 'Admin permission was denied.'
            : result.logPath
              ? `See log: ${result.logPath}`
              : 'Could not install printer.';
        toast.error(hint, {
          description: result.logTail?.split('\n').slice(-2).join(' ') ?? undefined,
          duration: 8000,
        });
      }
    } catch {
      toast.error('Printer install failed');
    } finally {
      setPrinterInstalling(false);
    }
  };

  useEffect(() => {
    if (!isElectronApp() || !window.electronAPI?.onPrintJob) return;
    const unsub = window.electronAPI.onPrintJob((job) => {
      setJobs((prev) => {
        if (prev.some((p) => p.pdfPath === job.pdfPath)) return prev;
        return [job, ...prev];
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!isElectronApp() || !window.electronAPI?.onFaxSendLogUpdated) return;
    const unsub = window.electronAPI.onFaxSendLogUpdated(() => {
      void listFaxSendLog()
        .then(setSendLog)
        .catch(() => undefined);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!selected || !isElectronApp()) {
      setPagePngs(null);
      setPreviewError(null);
      setPreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPagePngs(null);
    setPreviewError(null);
    setPreviewLoading(true);
    void (async () => {
      try {
        const pages = await getPrintJobPagePngs(selected.pdfPath);
        if (!cancelled) {
          setPagePngs(pages);
          setPreviewError(null);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'preview_failed';
          setPreviewError(msg);
          setPagePngs(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  const form = useForm<FaxForm>({
    resolver: zodResolver(faxSchema),
    defaultValues: { to: '', from: '' },
  });

  const onSend = form.handleSubmit(async (values) => {
    if (!selected || !isElectronApp()) {
      toast.error('Select a PDF job in the Electron app.');
      return;
    }
    setBusy(true);
    try {
      await sendFaxFromPdf({
        to: values.to,
        from: values.from?.trim() ? values.from.trim() : undefined,
        pdfPath: selected.pdfPath,
      });
      toast.success('Fax queued with provider');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'send_failed';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  });

  const onDelete = async () => {
    if (!selected || !isElectronApp()) return;
    try {
      await deletePrintJobFile(selected.pdfPath);
      toast.success('Job removed');
      setSelected(null);
      await refresh();
    } catch {
      toast.error('Could not delete job.');
    }
  };

  const onDownload = async () => {
    if (!selected || !isElectronApp()) return;
    try {
      const savedTo = await downloadPrintJob(selected.pdfPath);
      if (savedTo) {
        toast.success('PDF saved', { description: savedTo });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'download_failed';
      toast.error('Could not download PDF', { description: msg });
    }
  };

  const aside = useMemo(
    () => (
      <div className="border-r border-border bg-card flex flex-col w-72 shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-navy">Fax inbox</h2>
          <p className="text-xs text-muted-foreground mt-1">Print jobs & sent log</p>
          <div className="flex gap-1 mt-2">
            <Button
              type="button"
              size="sm"
              variant={inboxTab === 'jobs' ? 'default' : 'outline'}
              className={inboxTab === 'jobs' ? 'bg-teal text-teal-foreground' : ''}
              onClick={() => setInboxTab('jobs')}
            >
              Jobs
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inboxTab === 'sent' ? 'default' : 'outline'}
              className={inboxTab === 'sent' ? 'bg-teal text-teal-foreground' : ''}
              onClick={() => setInboxTab('sent')}
            >
              Sent
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {inboxTab === 'jobs' ? (
            jobs.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Print to <span className="font-mono">{printerName}</span> with Rx-Connect running. A fax popup opens
                automatically — the main window stays in the background.
              </p>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.pdfPath}
                  type="button"
                  onClick={() => setSelected(job)}
                  className={`w-full text-left px-4 py-3 text-sm border-b border-border/60 hover:bg-muted/50 ${
                    selected?.pdfPath === job.pdfPath ? 'bg-muted' : ''
                  }`}
                >
                  <div className="font-medium truncate">{job.title}</div>
                  <div className="text-xs text-muted-foreground">{new Date(job.receivedAt).toLocaleString()}</div>
                </button>
              ))
            )
          ) : sendLog.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No faxes sent yet from the print popup.</p>
          ) : (
            <>
              {sendLog.map((entry) => (
                <div
                  key={entry.id}
                  className="px-4 py-3 text-sm border-b border-border/60"
                >
                  <div className="font-medium truncate">{entry.jobTitle}</div>
                  <div className="text-xs text-muted-foreground">To: {entry.to}</div>
                  <div className="text-xs mt-0.5">
                    <span
                      className={
                        entry.status === 'sent' ? 'text-teal font-medium' : 'text-destructive font-medium'
                      }
                    >
                      {entry.status}
                    </span>
                    {' · '}
                    {new Date(entry.sentAt).toLocaleString()}
                  </div>
                  {entry.externalId && (
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{entry.externalId}</div>
                  )}
                </div>
              ))}
              <div className="p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    void clearFaxSendLog().then(() => refresh());
                  }}
                >
                  Clear sent log
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    ),
    [jobs, sendLog, inboxTab, selected?.pdfPath, printerName, refresh],
  );

  if (!isElectronApp()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fax inbox</CardTitle>
          <CardDescription>Open this page from the Rx-Connect desktop app to manage print jobs.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 bg-background">
      {aside}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {printerInstalled === false && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p>
              <span className="font-medium">{printerName}</span> is not installed. Accept the Windows admin prompt to
              add it. Keep Rx-Connect open while printing.
            </p>
            <Button
              type="button"
              size="sm"
              className="shrink-0 bg-teal text-teal-foreground"
              disabled={printerInstalling}
              onClick={() => void onInstallPrinter()}
            >
              {printerInstalling ? 'Installing…' : 'Install printer'}
            </Button>
          </div>
        )}
        {printerInstalled === true && !driverOk && (
          <div className="flex items-center justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950">
            <p>
              <span className="font-medium">{printerName}</span> is using an outdated driver
              {driverName ? <> (<span className="font-mono text-xs">{driverName}</span>)</> : null}
              {' '}that produces blank PDFs. Click <span className="font-medium">Reinstall printer</span> to upgrade
              to a PostScript driver.
            </p>
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              variant="destructive"
              disabled={printerInstalling}
              onClick={() => void onInstallPrinter()}
            >
              {printerInstalling ? 'Reinstalling…' : 'Reinstall printer'}
            </Button>
          </div>
        )}
        <PdfPreviewPanel
          pagePngs={pagePngs}
          loading={previewLoading}
          error={previewError}
        />
        <div className="border-t border-border p-4 space-y-3 bg-muted/30 shrink-0">
          <form onSubmit={onSend} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="fax-to">Fax number</Label>
              <Input id="fax-to" placeholder="+15551234567" {...form.register('to')} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fax-from">From (optional)</Label>
              <Input id="fax-from" placeholder="Caller ID" {...form.register('from')} />
            </div>
            <Button type="submit" disabled={!selected || busy} className="bg-teal text-teal-foreground">
              {busy ? 'Sending…' : 'Send fax'}
            </Button>
            <Button type="button" variant="outline" disabled={!selected || busy} onClick={() => void onDownload()}>
              Download
            </Button>
            <Button type="button" variant="outline" disabled={!selected || busy} onClick={() => void onDelete()}>
              Delete job
            </Button>
          </form>
          {(form.formState.errors.to || form.formState.errors.from) && (
            <p className="text-xs text-destructive">
              {form.formState.errors.to?.message ?? form.formState.errors.from?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FaxInboxView;

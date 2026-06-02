'use client';

import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { gateStatusLabel, useUpdateGate } from '@/hooks/use-auto-update';
import { UpdateBanner } from '@/components/features/settings/UpdateBanner';

function ForcedUpdateScreen() {
  const { gate, retry } = useUpdateGate();
  const isReady = gate.status === 'ready';
  const isError = gate.status === 'error';
  const isDownloading = gate.status === 'downloading';

  const title = isReady
    ? 'Installing update…'
    : isError
      ? 'Update required'
      : 'Updating Rx-Manager';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-6 text-center">
      <Loader2 className="mb-6 h-10 w-10 animate-spin text-teal" aria-hidden />
      <h1 className="text-2xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {gate.message ??
          (isReady
            ? 'Rx-Manager will restart momentarily.'
            : 'A required update is available. Rx-Manager will restart after the update finishes.')}
      </p>
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        Current: v{gate.currentVersion}
        {gate.minimumVersion ? ` · Required: v${gate.minimumVersion}` : ''}
        {gate.requiredVersion ? ` · Downloading: v${gate.requiredVersion}` : ''}
      </p>

      {isDownloading && gate.progress != null ? (
        <div className="mt-6 w-full max-w-sm">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Download progress</span>
            <span>{gate.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-teal transition-all duration-300"
              style={{ width: `${gate.progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {isError ? (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-destructive">{gate.error}</p>
          <Button
            type="button"
            className="bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => void retry()}
          >
            Retry update
          </Button>
        </div>
      ) : null}

      {isReady ? (
        <p className="mt-6 text-sm text-muted-foreground">Rx-Manager will restart momentarily.</p>
      ) : null}
    </div>
  );
}

export function UpdateGate({ children }: { children: React.ReactNode }) {
  const { gate, isBlocked, loading } = useUpdateGate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </div>
    );
  }

  if (isBlocked) {
    return <ForcedUpdateScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {gate.status === 'ok' ? <UpdateBanner /> : null}
      <div className={cn('flex min-h-0 flex-1 flex-col')}>{children}</div>
    </div>
  );
}

export function AppVersionBadge() {
  const { gate, loading } = useUpdateGate();

  if (loading || !gate.supported) return null;

  const label = gateStatusLabel(gate.status, gate);
  const dotClass =
    gate.status === 'error' || gate.lastUpdateError
      ? 'bg-destructive'
      : gate.updateReady
        ? 'bg-emerald-500'
        : gate.status === 'downloading' || gate.status === 'checking'
          ? 'bg-amber-500'
          : 'bg-teal';

  return (
    <div
      className="hidden items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground md:flex"
      title={label}
    >
      <span className={cn('h-2 w-2 rounded-full', dotClass)} />
      <span className="font-mono">v{gate.currentVersion}</span>
    </div>
  );
}

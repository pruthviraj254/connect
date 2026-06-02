'use client';

import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RxGlyph } from '@/components/auth/OneRxLogo';
import { useUpdateGate } from '@/hooks/use-auto-update';
import { UpdateExperience } from '@/components/features/settings/UpdateExperience';

function ForcedUpdateScreen() {
  const { gate, retry } = useUpdateGate();
  const isReady = gate.status === 'ready';
  const isError = gate.status === 'error';
  const isDownloading = gate.status === 'downloading';
  const isChecking = gate.status === 'checking' || gate.status === 'required';
  const progress = gate.progress ?? 0;
  const targetVersion = gate.requiredVersion ?? gate.pendingVersion;

  const title = isReady
    ? 'Restarting Rx-Manager…'
    : isError
      ? 'Update required'
      : isDownloading
        ? 'Downloading update…'
        : isChecking
          ? 'Checking for updates…'
          : 'Updating Rx-Manager';

  const showProgressBar = isDownloading || isReady;
  const progressWidth = isReady ? 100 : progress;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-muted/60 px-6 py-12 text-center">
      <span
        className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-warm-900 text-terra-100 shadow-md"
        aria-hidden
      >
        <RxGlyph size={22} />
      </span>

      {isChecking && !isDownloading && !isReady && !isError ? (
        <Loader2 className="mb-6 h-10 w-10 animate-spin text-teal" aria-hidden />
      ) : null}

      <h1 className="text-2xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {gate.message ??
          (isReady
            ? 'Rx-Manager will restart momentarily to complete the update.'
            : 'A required update keeps your pharmacy desk secure and compatible with OneRx services.')}
      </p>

      <div className="mt-6 w-full max-w-sm">
        {showProgressBar ? (
          <div className="space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-teal transition-all duration-300 ease-out"
                style={{ width: `${progressWidth}%` }}
              />
            </div>
            {isDownloading ? (
              <p className="text-xs tabular-nums text-muted-foreground">{progress}%</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <p className="mt-5 font-mono text-xs text-muted-foreground">
        v{gate.currentVersion}
        {targetVersion ? ` → v${targetVersion}` : ''}
        {gate.minimumVersion ? ` · Required ≥ v${gate.minimumVersion}` : ''}
      </p>

      {isError ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-destructive">{gate.error}</p>
          <Button
            type="button"
            className="bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => void retry()}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Retry update
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function UpdateGate({ children }: { children: React.ReactNode }) {
  const { gate, isBlocked, loading } = useUpdateGate();

  if (isBlocked) {
    return <ForcedUpdateScreen />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {!loading && gate.supported ? <UpdateExperience /> : null}
      <div className={cn('flex min-h-0 flex-1 flex-col')}>{children}</div>
    </div>
  );
}

export function AppVersionBadge() {
  const { gate, loading } = useUpdateGate();

  if (loading || !gate.supported) return null;

  const hasError = gate.status === 'error' || Boolean(gate.lastUpdateError);
  const updateReady = gate.updateReady && Boolean(gate.pendingVersion);

  const dotClass = hasError
    ? 'bg-destructive'
    : updateReady
      ? 'bg-emerald-500'
      : 'bg-teal';

  const title = hasError
    ? gate.error ?? gate.lastUpdateError ?? 'Update check failed — see Settings'
    : updateReady
      ? `Update ${gate.pendingVersion} ready — restart to install`
      : `Rx-Manager v${gate.currentVersion} — up to date`;

  return (
    <div
      className="hidden items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground md:flex"
      title={title}
    >
      <span className={cn('h-2 w-2 rounded-full', dotClass)} aria-hidden />
      <span className="font-mono">v{gate.currentVersion}</span>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateGate } from '@/hooks/use-auto-update';
import { UpdateExperience } from '@/components/features/settings/UpdateExperience';

const STEPS = [
  { id: 'check', label: 'Check' },
  { id: 'download', label: 'Download' },
  { id: 'install', label: 'Install' },
  { id: 'restart', label: 'Restart' },
] as const;

function stepIndex(status: string, updateReady: boolean): number {
  if (updateReady || status === 'ready') return 3;
  if (status === 'downloading') return 1;
  if (status === 'required' || status === 'checking') return 0;
  if (status === 'error') return 1;
  return 0;
}

function ForcedUpdateScreen() {
  const { gate, retry } = useUpdateGate();
  const [countdown, setCountdown] = useState<number | null>(null);
  const isReady = gate.status === 'ready';
  const isError = gate.status === 'error';
  const isDownloading = gate.status === 'downloading';
  const progress = gate.progress ?? 0;
  const activeStep = stepIndex(gate.status, isReady);
  const targetVersion = gate.requiredVersion ?? gate.pendingVersion;

  useEffect(() => {
    if (!isReady) {
      setCountdown(null);
      return;
    }
    setCountdown(3);
    const interval = window.setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isReady]);

  const title = isReady
    ? 'Restarting Rx-Manager…'
    : isError
      ? 'Update required'
      : isDownloading
        ? 'Downloading update…'
        : 'Updating Rx-Manager';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-muted/60 px-6 py-12 text-center">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-navy-foreground shadow-md">
        Rx
      </div>

      <div className="mb-8 flex w-full max-w-lg items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                index <= activeStep
                  ? 'bg-teal text-white'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {index < activeStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={cn(
                'hidden text-xs font-medium sm:inline',
                index <= activeStep ? 'text-navy' : 'text-muted-foreground',
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <div
                className={cn(
                  'hidden h-px w-8 sm:block',
                  index < activeStep ? 'bg-teal' : 'bg-border',
                )}
              />
            ) : null}
          </div>
        ))}
      </div>

      <div className="relative mb-6 flex h-28 w-28 items-center justify-center">
        {isDownloading ? (
          <>
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted" />
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinecap="round"
                className="text-teal transition-all duration-300"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
              />
            </svg>
            <span className="text-lg font-semibold tabular-nums text-navy">{progress}%</span>
          </>
        ) : (
          <Loader2 className="h-12 w-12 animate-spin text-teal" aria-hidden />
        )}
      </div>

      <h1 className="text-2xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {gate.message ??
          (isReady
            ? 'Rx-Manager will restart momentarily to complete the update.'
            : 'A required update keeps your pharmacy desk secure and compatible with OneRx services.')}
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-full border bg-card/80 px-3 py-1.5 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5 text-teal" />
        <span className="font-mono">
          v{gate.currentVersion}
          {targetVersion ? ` → v${targetVersion}` : ''}
          {gate.minimumVersion ? ` · Required ≥ v${gate.minimumVersion}` : ''}
        </span>
      </div>

      {isReady && countdown !== null ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Download className="h-4 w-4" />
          Restarting in {countdown}s…
        </p>
      ) : null}

      {isError ? (
        <div className="mt-6 space-y-3">
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

  const isDownloading =
    !gate.updateReady && gate.progress != null && gate.progress < 100 && Boolean(gate.pendingVersion);

  const dotClass =
    gate.status === 'error' || gate.lastUpdateError
      ? 'bg-destructive'
      : gate.updateReady
        ? 'bg-emerald-500'
        : isDownloading || gate.status === 'checking' || gate.status === 'downloading'
          ? 'bg-amber-500'
          : 'bg-teal';

  return (
    <div
      className="hidden items-center gap-2 rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground md:flex"
      title={
        gate.updateReady
          ? `Update ${gate.pendingVersion} ready`
          : isDownloading
            ? `Downloading ${gate.pendingVersion}…`
            : `v${gate.currentVersion}`
      }
    >
      <span className={cn('h-2 w-2 rounded-full', dotClass)} />
      <span className="font-mono">v{gate.currentVersion}</span>
    </div>
  );
}

'use client';

import {
  ArrowDownToLine,
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { gateStatusLabel, useUpdateGate } from '@/hooks/use-auto-update';
import { isElectronApp } from '@/lib/electron';

function StatusIcon({ gate }: { gate: ReturnType<typeof useUpdateGate>['gate'] }) {
  if (gate.updateReady) return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (gate.status === 'downloading' || gate.pendingVersion) {
    return <ArrowDownToLine className="h-5 w-5 text-teal animate-pulse" />;
  }
  if (gate.status === 'checking') return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
  if (gate.status === 'error' || gate.lastUpdateError) {
    return <RefreshCw className="h-5 w-5 text-destructive" />;
  }
  return <Sparkles className="h-5 w-5 text-muted-foreground" />;
}

export function DesktopUpdatePanel() {
  const inElectron = isElectronApp();
  const { gate, isSupported, loading, check, restart } = useUpdateGate();

  if (!inElectron) return null;

  const nextVersion = gate.pendingVersion ?? gate.requiredVersion;
  const showProgress = gate.status === 'downloading' && gate.progress != null;
  const progressValue = gate.progress ?? 0;
  const statusLabel = gateStatusLabel(gate.status, gate);
  const isBusy = gate.status === 'checking' || gate.status === 'downloading';

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <Label>Software updates</Label>
          <p className="text-xs text-muted-foreground">
            Rx-Manager checks GitHub Releases for new versions automatically.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 font-mono text-xs">
          v{loading ? '…' : gate.currentVersion}
        </span>
      </div>

      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          gate.updateReady && 'border-emerald-500/40 bg-emerald-50/80',
          (gate.status === 'error' || gate.lastUpdateError) && 'border-destructive/30 bg-destructive/5',
          !gate.updateReady &&
            gate.status !== 'error' &&
            !gate.lastUpdateError &&
            'border-border bg-muted/30',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <StatusIcon gate={gate} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-snug">
              {gate.updateReady && nextVersion
                ? `Version ${nextVersion} is ready`
                : nextVersion
                  ? `Version ${nextVersion} available`
                  : isSupported
                    ? 'Stay up to date'
                    : 'Update status'}
            </p>
            <p
              className={cn(
                'text-xs',
                gate.status === 'error' || gate.lastUpdateError
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {statusLabel ||
                (isSupported
                  ? 'Click below to check manually, or wait for automatic checks on launch.'
                  : 'Install the packaged desktop app to receive automatic updates.')}
            </p>

            {showProgress ? (
              <div className="pt-2">
                <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>Download progress</span>
                  <span>{progressValue}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal to-emerald-500 transition-all duration-300"
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {isSupported ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {gate.updateReady ? (
              <Button
                type="button"
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={() => void restart()}
              >
                <Download className="mr-1.5 h-4 w-4" />
                Restart to install
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading || isBusy}
                onClick={() => void check()}
              >
                {isBusy ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Checking…
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-1.5 h-4 w-4" />
                    Check for updates
                  </>
                )}
              </Button>
            )}
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Running in development mode — updates apply only to the installed NSIS/ZIP build from
            GitHub Releases.
          </p>
        )}
      </div>
    </div>
  );
}

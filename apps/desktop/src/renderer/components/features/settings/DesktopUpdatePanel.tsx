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
import { formatUpdateStatus, getUpdateVersion, useAutoUpdate } from '@/hooks/use-auto-update';
import { isElectronApp } from '@/lib/auth/auth-actions';

function StatusIcon({ phase }: { phase: string }) {
  if (phase === 'downloaded') return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (phase === 'downloading' || phase === 'available') {
    return <ArrowDownToLine className="h-5 w-5 text-teal animate-pulse" />;
  }
  if (phase === 'checking') return <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />;
  if (phase === 'error') return <RefreshCw className="h-5 w-5 text-destructive" />;
  if (phase === 'not-available') return <CheckCircle2 className="h-5 w-5 text-teal" />;
  return <Sparkles className="h-5 w-5 text-muted-foreground" />;
}

export function DesktopUpdatePanel() {
  const inElectron = isElectronApp();
  const {
    version,
    status,
    isSupported,
    loading,
    check,
    restart,
    isBusy,
  } = useAutoUpdate();

  if (!inElectron) return null;

  const nextVersion = getUpdateVersion(status);
  const showProgress =
    status.phase === 'downloading' ||
    status.phase === 'available';
  const progressValue =
    status.phase === 'downloading' ? status.percent : status.phase === 'available' ? 12 : 0;

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <Label>Software updates</Label>
          <p className="text-xs text-muted-foreground">
            Rx-Connect checks GitHub Releases for new versions automatically.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 font-mono text-xs">
          v{loading ? '…' : (version ?? '?')}
        </span>
      </div>

      <div
        className={cn(
          'rounded-lg border p-4 transition-colors',
          status.phase === 'downloaded' && 'border-emerald-500/40 bg-emerald-50/80',
          status.phase === 'error' && 'border-destructive/30 bg-destructive/5',
          status.phase !== 'downloaded' &&
            status.phase !== 'error' &&
            'border-border bg-muted/30',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <StatusIcon phase={status.phase} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-medium leading-snug">
              {status.phase === 'idle' && isSupported
                ? 'Stay up to date'
                : status.phase === 'downloaded' && nextVersion
                  ? `Version ${nextVersion} is ready`
                  : nextVersion
                    ? `Version ${nextVersion} available`
                    : formatUpdateStatus(status) || 'Update status'}
            </p>
            <p
              className={cn(
                'text-xs',
                status.phase === 'error' ? 'text-destructive' : 'text-muted-foreground',
              )}
            >
              {formatUpdateStatus(status) ||
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
            {status.phase === 'downloaded' ? (
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

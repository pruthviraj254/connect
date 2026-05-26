'use client';

import Link from 'next/link';
import {
  ArrowDownToLine,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatUpdateStatus, getUpdateVersion, useAutoUpdate } from '@/hooks/use-auto-update';

function UpdateProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      <div
        className="h-full rounded-full bg-white transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function UpdateBanner() {
  const { status, showBanner, check, restart, isBusy, dismissBanner, version } = useAutoUpdate();

  if (!showBanner) return null;

  const nextVersion = getUpdateVersion(status);
  const isReady = status.phase === 'downloaded';
  const isDownloading = status.phase === 'downloading' || status.phase === 'available';
  const isError = status.phase === 'error';

  return (
    <div
      className={cn(
        'relative shrink-0 border-b px-4 py-3 sm:px-6',
        isReady
          ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
          : isError
            ? 'border-destructive/30 bg-destructive/10 text-destructive'
            : 'border-teal/30 bg-gradient-to-r from-navy to-navy/90 text-white',
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 sm:gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            isReady ? 'bg-white/20' : isError ? 'bg-destructive/15' : 'bg-white/10',
          )}
        >
          {isReady ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : isDownloading ? (
            <ArrowDownToLine className="h-5 w-5 animate-pulse" />
          ) : isError ? (
            <RefreshCw className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            {isReady
              ? `Update ready — Rx-Connect ${nextVersion}`
              : isError
                ? 'Update check failed'
                : nextVersion
                  ? `Rx-Connect ${nextVersion} is available`
                  : 'Checking for updates…'}
          </p>
          <p
            className={cn(
              'mt-0.5 text-xs',
              isError ? 'text-destructive/80' : 'text-white/80',
            )}
          >
            {formatUpdateStatus(status)}
            {version && !isError ? (
              <span className="opacity-70"> · Current: v{version}</span>
            ) : null}
          </p>
          {status.phase === 'downloading' ? (
            <UpdateProgressBar percent={status.percent} />
          ) : null}
          {status.phase === 'available' ? <UpdateProgressBar percent={8} /> : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isReady ? (
            <Button
              size="sm"
              className="bg-white text-emerald-700 hover:bg-white/90"
              onClick={() => void restart()}
            >
              Restart now
            </Button>
          ) : isError ? (
            <Button
              size="sm"
              variant="outline"
              className="border-destructive/40 bg-background text-destructive hover:bg-destructive/5"
              disabled={isBusy}
              onClick={() => void check()}
            >
              Try again
            </Button>
          ) : isDownloading ? (
            <div className="flex items-center gap-2 px-2 text-xs text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading…
            </div>
          ) : null}

          {!isReady ? (
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                'hidden sm:inline-flex',
                isError
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-white hover:bg-white/10 hover:text-white',
              )}
              asChild
            >
              <Link href="/settings/">Settings</Link>
            </Button>
          ) : null}

          {!isReady && !isDownloading ? (
            <button
              type="button"
              onClick={dismissBanner}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                isError
                  ? 'text-destructive hover:bg-destructive/10'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              )}
              aria-label="Dismiss update banner"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

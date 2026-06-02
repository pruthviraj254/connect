'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, RefreshCw, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateGate } from '@/hooks/use-auto-update';

const DISMISS_KEY = 'rx-manager-update-card-dismissed';

function getDismissedVersion(): string | null {
  try {
    return sessionStorage.getItem(DISMISS_KEY);
  } catch {
    return null;
  }
}

function setDismissedVersion(version: string | null): void {
  try {
    if (version) {
      sessionStorage.setItem(DISMISS_KEY, version);
    } else {
      sessionStorage.removeItem(DISMISS_KEY);
    }
  } catch {
    /* sessionStorage unavailable */
  }
}

export function UpdateExperience() {
  const { gate, loading, isBlocked, restart, check } = useUpdateGate();
  const [cardDismissed, setCardDismissed] = useState(false);
  const toastedVersion = useRef<string | null>(null);

  const nextVersion = gate.pendingVersion ?? gate.requiredVersion;
  const isDownloading =
    !isBlocked &&
    !gate.updateReady &&
    gate.progress != null &&
    gate.progress < 100 &&
    Boolean(nextVersion);
  const isChecking = gate.status === 'checking';
  const showTopBar =
    !loading &&
    gate.supported &&
    !isBlocked &&
    (isChecking || isDownloading || Boolean(gate.lastUpdateError));
  const showBottomCard =
    !loading &&
    gate.supported &&
    !isBlocked &&
    gate.updateReady &&
    Boolean(nextVersion) &&
    !cardDismissed;

  useEffect(() => {
    if (!gate.updateReady || !nextVersion) {
      return;
    }
    setCardDismissed(getDismissedVersion() === nextVersion);
    if (toastedVersion.current !== nextVersion) {
      toastedVersion.current = nextVersion;
      toast.success(`Update ${nextVersion} is ready`, {
        description: 'Restart Rx-Manager when convenient to finish installing.',
        duration: 6000,
      });
    }
  }, [gate.updateReady, nextVersion]);

  if (!showTopBar && !showBottomCard) {
    return null;
  }

  const progress = gate.progress ?? 0;

  return (
    <>
      {showTopBar ? (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100]">
          {gate.lastUpdateError && !isDownloading && !isChecking ? (
            <div className="pointer-events-auto border-b border-destructive/30 bg-destructive/10 px-4 py-2">
              <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs">
                <p className="text-destructive">
                  Update check failed: {gate.lastUpdateError}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-destructive hover:text-destructive"
                  onClick={() => void check()}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative h-1 w-full overflow-hidden bg-muted/80">
              {isChecking || (isDownloading && progress === 0) ? (
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-teal to-transparent" />
              ) : (
                <div
                  className="h-full bg-gradient-to-r from-teal to-emerald-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.max(progress, isChecking ? 35 : 8)}%` }}
                />
              )}
            </div>
          )}
          {(isDownloading || isChecking) && !gate.lastUpdateError ? (
            <div className="pointer-events-none border-b border-teal/20 bg-teal/5 px-4 py-1.5 text-center text-[11px] font-medium text-teal-900/80">
              {isChecking
                ? 'Checking for updates…'
                : `Downloading v${nextVersion}… ${progress}%`}
            </div>
          ) : null}
        </div>
      ) : null}

      {showBottomCard ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center p-4 pb-6">
          <div
            className={cn(
              'pointer-events-auto w-full max-w-md rounded-xl border border-teal/30 bg-card p-4 shadow-lg',
              'animate-in slide-in-from-bottom-4 fade-in duration-300',
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal/10 text-teal">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-navy">Update ready</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Version {nextVersion} is downloaded. Restart to finish installing (you are on v
                      {gate.currentVersion}).
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label="Dismiss update reminder"
                    onClick={() => {
                      setCardDismissed(true);
                      if (nextVersion) {
                        setDismissedVersion(nextVersion);
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-navy text-navy-foreground hover:bg-navy/90"
                    onClick={() => void restart()}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Restart now
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCardDismissed(true);
                      if (nextVersion) {
                        setDismissedVersion(nextVersion);
                      }
                    }}
                  >
                    Later
                  </Button>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Or close Rx-Manager completely to install automatically.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
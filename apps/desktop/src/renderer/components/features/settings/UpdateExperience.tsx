'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

/** Optional update ready — single inline banner; downloads stay silent. */
export function UpdateExperience() {
  const { gate, loading, isBlocked, restart } = useUpdateGate();
  const [dismissed, setDismissed] = useState(false);

  const nextVersion = gate.pendingVersion ?? gate.requiredVersion;
  const showBanner =
    !loading &&
    gate.supported &&
    !isBlocked &&
    gate.updateReady &&
    Boolean(nextVersion) &&
    !dismissed;

  useEffect(() => {
    if (!gate.updateReady || !nextVersion) {
      return;
    }
    setDismissed(getDismissedVersion() === nextVersion);
  }, [gate.updateReady, nextVersion]);

  if (!showBanner || !nextVersion) {
    return null;
  }

  function dismiss() {
    setDismissed(true);
    setDismissedVersion(nextVersion);
  }

  return (
    <div
      className="shrink-0 border-b border-teal/25 bg-teal/5 px-4 py-2.5 sm:px-6"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 text-sm">
          <p className="font-medium text-navy">
            Version {nextVersion} is ready
          </p>
          <p className="text-xs text-muted-foreground">
            Restart to finish installing, or quit Rx-Manager to update automatically.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => void restart()}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Restart now
          </Button>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Dismiss update reminder"
            onClick={dismiss}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

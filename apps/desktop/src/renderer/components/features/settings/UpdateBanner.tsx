'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUpdateGate } from '@/hooks/use-auto-update';

export function UpdateBanner() {
  const { gate, restart } = useUpdateGate();

  if (gate.status !== 'ok') {
    return null;
  }

  if (gate.updateReady && gate.pendingVersion) {
    return (
      <div
        className="shrink-0 border-b border-teal/30 bg-teal/10 px-4 py-3 sm:px-6"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            <p className="font-medium text-navy">
              Update {gate.pendingVersion} is ready (you have {gate.currentVersion}).
            </p>
            <p className="text-xs text-muted-foreground">
              Or close Rx-Connect completely to install automatically.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="bg-navy text-navy-foreground hover:bg-navy/90"
            onClick={() => void restart()}
          >
            Restart now
          </Button>
        </div>
      </div>
    );
  }

  if (gate.lastUpdateError) {
    return (
      <div
        className={cn(
          'shrink-0 border-b border-destructive/30 bg-destructive/10 px-4 py-3 sm:px-6',
        )}
        role="alert"
      >
        <div className="mx-auto max-w-6xl text-sm">
          <p className="font-medium text-destructive">Auto-update check failed</p>
          <p className="mt-1 text-xs text-destructive/80">{gate.lastUpdateError}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Download and run the latest Rx-Connect Setup installer from GitHub Releases if this
            persists.
          </p>
        </div>
      </div>
    );
  }

  return null;
}

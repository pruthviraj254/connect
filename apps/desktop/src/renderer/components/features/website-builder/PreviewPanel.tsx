'use client';

import { ExternalLink, Loader2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  previewUrl: string | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
};

export function PreviewPanel({ previewUrl, loading, error, onRefresh }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-100/80 border-l border-border">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-navy">
          <Monitor className="h-4 w-4 text-teal" />
          Live preview
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Updating…
            </span>
          )}
          {onRefresh && (
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={onRefresh}>
              Refresh
            </Button>
          )}
          {previewUrl && (
            <Button type="button" variant="ghost" size="sm" asChild>
              <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0 flex flex-col">
        <div className="flex-1 flex flex-col rounded-lg border border-border bg-white shadow-lg overflow-hidden min-h-0">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border-b border-border shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="flex-1 mx-2 h-6 rounded-md bg-white border border-border text-[10px] text-muted-foreground flex items-center px-2 truncate">
              {previewUrl ?? 'Preview will appear here'}
            </span>
          </div>

          <div className="flex-1 relative min-h-[320px] bg-white overflow-x-auto overflow-y-hidden">
            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-white">
                <div className="max-w-sm text-center space-y-2">
                  <p className="text-sm font-medium text-destructive">Preview could not load</p>
                  <p className="text-xs text-muted-foreground">{error}</p>
                </div>
              </div>
            )}
            {!previewUrl && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground text-center max-w-xs">
                  Fill in your pharmacy details on the left. Your site preview will appear here automatically.
                </p>
              </div>
            )}
            {loading && !previewUrl && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-teal" />
                <p className="text-sm text-muted-foreground">Building your site…</p>
              </div>
            )}
            {previewUrl && (
              <iframe
                key={previewUrl}
                title="Website preview"
                src={previewUrl}
                className="absolute inset-0 w-full h-full border-0 min-w-[720px]"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

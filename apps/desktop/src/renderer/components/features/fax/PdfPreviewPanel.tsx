'use client';

import { printJobPreviewUrl } from '@/lib/pdf-preview';

type PdfPreviewPanelProps = {
  /** Absolute path to a PDF on disk (Electron main serves via rx-pdf://). */
  previewPath: string | null;
  loading?: boolean;
  error?: string | null;
};

export function PdfPreviewPanel({ previewPath, loading, error }: PdfPreviewPanelProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading preview…
      </div>
    );
  }

  if (error === 'not_pdf' || error === 'conversion_failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-8 text-center gap-2">
        <p>Could not show a PDF preview for this print job.</p>
        {error === 'conversion_failed' ? (
          <p className="text-xs max-w-md">
            Could not convert this print job to PDF. Try printing again with Rx-Connect open, or reinstall
            the app from the latest installer.
          </p>
        ) : (
          <p className="text-xs">The spool file may still be converting — try again in a moment.</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
        Could not load preview ({error}).
      </div>
    );
  }

  if (!previewPath) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
        Select a job to preview.
      </div>
    );
  }

  return (
    <iframe
      key={previewPath}
      src={printJobPreviewUrl(previewPath)}
      title="PDF preview"
      className="flex-1 w-full min-h-[480px] border-0 bg-white"
    />
  );
}

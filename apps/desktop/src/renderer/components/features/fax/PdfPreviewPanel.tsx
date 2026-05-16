'use client';

import { useEffect, useMemo, useState } from 'react';

type PdfPreviewPanelProps = {
  previewBase64: string | null;
  loading?: boolean;
  error?: string | null;
};

function base64ToBlob(b64: string, mime = 'application/pdf'): Blob {
  const raw = atob(b64);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function PdfPreviewPanel({ previewBase64, loading, error }: PdfPreviewPanelProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!previewBase64) {
      setBlobUrl(null);
      setDecodeError(null);
      return;
    }
    try {
      const blob = base64ToBlob(previewBase64);
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);
      setDecodeError(null);
      return () => URL.revokeObjectURL(url);
    } catch (e) {
      setDecodeError(e instanceof Error ? e.message : 'decode_failed');
      setBlobUrl(null);
    }
  }, [previewBase64]);

  const displayError = error || decodeError;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-muted/20">
        Loading preview…
      </div>
    );
  }

  if (displayError === 'not_pdf' || displayError === 'conversion_failed') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-8 text-center gap-2 bg-muted/20">
        <p className="font-medium">Could not show PDF preview</p>
        <p className="text-xs max-w-md">
          The print data could not be converted to a viewable PDF. Try printing again with Rx-Connect
          open, or reinstall from the latest installer.
        </p>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-sm p-8 text-center gap-2 bg-muted/20">
        <p className="font-medium">Preview error</p>
        <p className="text-xs">{displayError}</p>
      </div>
    );
  }

  if (!previewBase64 || !blobUrl) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center bg-muted/20">
        Select a job to preview.
      </div>
    );
  }

  return (
    <iframe
      key={blobUrl}
      src={blobUrl}
      title="PDF preview"
      className="flex-1 w-full border-0"
      style={{ minHeight: 400 }}
    />
  );
}

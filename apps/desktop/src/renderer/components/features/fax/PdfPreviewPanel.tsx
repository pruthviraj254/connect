'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { base64ToUint8Array } from '@/lib/pdf-preview';
import { PDFJS_WORKER_BASE64 } from '@/lib/pdfjs-worker-inline';

type PdfPreviewPanelProps = {
  previewBase64: string | null;
  loading?: boolean;
  error?: string | null;
};

let workerBlobUrl: string | null = null;

function ensureWorker(): void {
  if (workerBlobUrl || typeof window === 'undefined') return;
  const code = atob(PDFJS_WORKER_BASE64);
  const blob = new Blob([code], { type: 'application/javascript' });
  workerBlobUrl = URL.createObjectURL(blob);
  pdfjs.GlobalWorkerOptions.workerSrc = workerBlobUrl;
}

export function PdfPreviewPanel({ previewBase64, loading, error }: PdfPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    ensureWorker();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    setRenderError(null);
    setRendering(false);

    if (!previewBase64) return;

    let cancelled = false;
    setRendering(true);

    void (async () => {
      try {
        ensureWorker();
        const data = base64ToUint8Array(previewBase64);
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        if (doc.numPages < 1) {
          setRenderError('empty_pdf');
          return;
        }

        const containerWidth = Math.max(container.clientWidth, 320);
        const scaleBase = containerWidth / 612;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
          if (cancelled) return;
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: Math.max(0.85, scaleBase) });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.className = 'mx-auto mb-4 max-w-full shadow-sm bg-white block';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (!cancelled) container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'pdf_render_failed';
          setRenderError(msg);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewBase64]);

  const displayError = error || renderError;
  const showOverlay =
    loading ||
    rendering ||
    Boolean(displayError) ||
    !previewBase64;

  let overlayContent: React.ReactNode = null;
  if (loading) {
    overlayContent = <p className="text-muted-foreground text-sm">Loading preview…</p>;
  } else if (rendering) {
    overlayContent = <p className="text-muted-foreground text-sm">Rendering PDF…</p>;
  } else if (displayError === 'not_pdf' || displayError === 'conversion_failed') {
    overlayContent = (
      <div className="flex flex-col items-center text-muted-foreground text-sm p-8 text-center gap-2">
        <p className="font-medium">Could not show PDF preview</p>
        <p className="text-xs max-w-md">
          The print data could not be converted to a viewable PDF. Try printing again with Rx-Connect
          open, or reinstall from the latest installer.
        </p>
      </div>
    );
  } else if (displayError) {
    overlayContent = (
      <div className="flex flex-col items-center text-muted-foreground text-sm p-8 text-center gap-2">
        <p className="font-medium">Preview error</p>
        <p className="text-xs max-w-md">{displayError}</p>
      </div>
    );
  } else if (!previewBase64) {
    overlayContent = (
      <p className="text-muted-foreground text-sm p-8 text-center">Select a job to preview.</p>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-neutral-100">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 min-h-0"
        aria-label="PDF preview"
      />
      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-[2px]">
          {overlayContent}
        </div>
      )}
    </div>
  );
}

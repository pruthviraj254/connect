'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { base64ToUint8Array } from '@/lib/pdf-preview';

type PdfPreviewPanelProps = {
  previewBase64: string | null;
  loading?: boolean;
  error?: string | null;
};

let workerConfigured = false;

function configureWorker(): void {
  if (workerConfigured || typeof window === 'undefined') return;
  workerConfigured = true;
  // Resolves to http://…/pdf.worker.min.mjs in dev and app://rxconnect/pdf.worker.min.mjs in prod
  const url = new URL('/pdf.worker.min.mjs', window.location.href);
  pdfjs.GlobalWorkerOptions.workerSrc = url.href;
}

export function PdfPreviewPanel({ previewBase64, loading, error }: PdfPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    configureWorker();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    setRenderError(null);

    if (!previewBase64) return;

    let cancelled = false;

    void (async () => {
      try {
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
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewBase64]);

  const displayError = error || renderError;

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
        <p className="text-xs max-w-md">{displayError}</p>
      </div>
    );
  }

  if (!previewBase64) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center bg-muted/20">
        Select a job to preview.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-neutral-100 min-h-0"
      aria-label="PDF preview"
    />
  );
}

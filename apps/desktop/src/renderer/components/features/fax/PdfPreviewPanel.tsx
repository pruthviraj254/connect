'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { base64ToUint8Array } from '@/lib/pdf-preview';

function workerSrc(): string {
  if (typeof window === 'undefined') return '/pdf.worker.min.mjs';
  return `${window.location.origin}/pdf.worker.min.mjs`;
}

type PdfPreviewPanelProps = {
  base64: string | null;
  loading?: boolean;
  error?: string | null;
};

export function PdfPreviewPanel({ base64, loading, error }: PdfPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.replaceChildren();
    setRenderError(null);

    if (!base64) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = base64ToUint8Array(base64);
        const doc = await pdfjs.getDocument({ data }).promise;
        if (cancelled) return;

        const containerWidth = container.clientWidth || 800;
        const scaleBase = containerWidth / 612;

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
          if (cancelled) return;
          const page = await doc.getPage(pageNum);
          const viewport = page.getViewport({ scale: Math.max(0.75, scaleBase) });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.className = 'mx-auto mb-4 max-w-full shadow-sm bg-white';
          const ctx = canvas.getContext('2d');
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (!cancelled) container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) {
          setRenderError(e instanceof Error ? e.message : 'pdf_render_failed');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [base64]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Loading preview…
      </div>
    );
  }

  if (error === 'not_pdf') {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
        This job is not a PDF yet (or conversion failed).
      </div>
    );
  }

  if (error || renderError) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
        Could not load preview ({error ?? renderError}).
      </div>
    );
  }

  if (!base64) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
        Select a job to preview.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 bg-muted/20 min-h-[480px]"
      aria-label="PDF preview"
    />
  );
}

'use client';

type PdfPreviewPanelProps = {
  pagePngs: string[] | null;
  loading?: boolean;
  error?: string | null;
};

const FRIENDLY_ERROR_CODES = new Set([
  'not_pdf',
  'conversion_failed',
  'render_failed',
  'ghostscript_unavailable',
]);

function errorMessage(code: string): { title: string; detail: string } {
  switch (code) {
    case 'ghostscript_unavailable':
      return {
        title: 'Preview engine missing',
        detail:
          'Ghostscript is required to render the preview. Reinstall Rx-Manager from the latest installer to bundle it automatically.',
      };
    case 'not_pdf':
    case 'conversion_failed':
      return {
        title: 'Could not show PDF preview',
        detail:
          'The print data could not be converted to a viewable PDF. Try printing again with Rx-Manager open, or reinstall from the latest installer.',
      };
    case 'render_failed':
      return {
        title: 'Could not render PDF',
        detail:
          'The PDF was captured but rendering its pages failed. The original PDF is still available for sending or download.',
      };
    default:
      return { title: 'Preview error', detail: code };
  }
}

export function PdfPreviewPanel({ pagePngs, loading, error }: PdfPreviewPanelProps) {
  let overlayContent: React.ReactNode = null;
  if (loading) {
    overlayContent = <p className="text-muted-foreground text-sm">Rendering preview…</p>;
  } else if (error && FRIENDLY_ERROR_CODES.has(error)) {
    const { title, detail } = errorMessage(error);
    overlayContent = (
      <div className="flex flex-col items-center text-muted-foreground text-sm p-8 text-center gap-2">
        <p className="font-medium">{title}</p>
        <p className="text-xs max-w-md">{detail}</p>
      </div>
    );
  } else if (error) {
    overlayContent = (
      <div className="flex flex-col items-center text-muted-foreground text-sm p-8 text-center gap-2">
        <p className="font-medium">Preview error</p>
        <p className="text-xs max-w-md">{error}</p>
      </div>
    );
  } else if (!pagePngs) {
    overlayContent = (
      <p className="text-muted-foreground text-sm p-8 text-center">Select a job to preview.</p>
    );
  } else if (pagePngs.length === 0) {
    overlayContent = (
      <p className="text-muted-foreground text-sm p-8 text-center">No pages to display.</p>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 relative bg-neutral-100">
      <div className="flex-1 overflow-y-auto p-4 min-h-0" aria-label="PDF preview">
        {pagePngs && pagePngs.length > 0 && !overlayContent
          ? pagePngs.map((png, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`data:image/png;base64,${png}`}
                alt={`Page ${i + 1}`}
                className="mx-auto mb-4 max-w-full shadow-sm bg-white block"
                draggable={false}
              />
            ))
          : null}
      </div>
      {overlayContent && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-[2px]">
          {overlayContent}
        </div>
      )}
    </div>
  );
}

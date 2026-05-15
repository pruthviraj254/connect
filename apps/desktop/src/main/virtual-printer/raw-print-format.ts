export type RawPrintFormat = 'pdf' | 'postscript' | 'pcl' | 'emf' | 'xps' | 'unknown';

export function pdfByteOffset(body: Buffer): number {
  const marker = Buffer.from('%PDF-');
  return body.indexOf(marker);
}

/** Detect spool payload from Windows raw port (PostScript, PCL, EMF, XPS, or embedded PDF). */
export function detectRawPrintFormat(body: Buffer): RawPrintFormat {
  if (body.length < 4) return 'unknown';

  if (pdfByteOffset(body) >= 0) return 'pdf';

  const head = body.subarray(0, Math.min(2048, body.length)).toString('latin1');

  if (head.includes('%!PS') || head.startsWith('%!')) return 'postscript';
  if (head.includes('@PJL')) return 'postscript';
  if (head.includes('PCL') || body[0] === 0x1b) return 'pcl';

  if (body[0] === 0x50 && body[1] === 0x4b) return 'xps';

  if (body.readUInt32LE(0) === 1) return 'emf';

  return 'unknown';
}

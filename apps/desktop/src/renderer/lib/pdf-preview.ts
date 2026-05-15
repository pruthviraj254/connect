/** Electron-only: load PDF from spool via main-process protocol (no blob/CSP). */
export function printJobPreviewUrl(absPath: string): string {
  return `rx-pdf://open?path=${encodeURIComponent(absPath)}`;
}

/** Decode base64 from IPC without blowing the stack on large PDFs. */
export function base64ToUint8Array(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function pdfBytesToObjectUrl(bytes: Uint8Array): string {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

import {
  IpcChannel,
  type FaxSendPayload,
  type FaxSendResult,
  type IpcResult,
  type PrintJobRecord,
  type PrinterInstallResult,
  type PrinterStatus,
} from '@rx-connect/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export async function listIncomingPrintJobs(): Promise<PrintJobRecord[]> {
  const result = await ipcInvoke<IpcResult<PrintJobRecord[]>>(IpcChannel.PrintJobList);
  return unwrapIpc(result);
}

export async function getPrintJobPdfBase64(pdfPath: string): Promise<string> {
  const result = await ipcInvoke<IpcResult<string>>(IpcChannel.PrintJobGetPdfBase64, pdfPath);
  return unwrapIpc(result);
}

/** Returns base64 PNG renderings of each PDF page (Ghostscript). Bulletproof preview path. */
export async function getPrintJobPagePngs(pdfPath: string): Promise<string[]> {
  const result = await ipcInvoke<IpcResult<string[]>>(IpcChannel.PrintJobGetPagePngs, pdfPath);
  return unwrapIpc(result);
}

/** Resolves/converts spool file to PDF path for rx-pdf:// preview (Windows converts PostScript). */
export async function getPrintJobPreviewPath(spoolPath: string): Promise<string> {
  const result = await ipcInvoke<IpcResult<string>>(IpcChannel.PrintJobGetPreviewPath, spoolPath);
  return unwrapIpc(result);
}

/** Opens a save dialog and copies the PDF to the chosen location. Returns the saved path or null if cancelled. */
export async function downloadPrintJob(pdfPath: string): Promise<string | null> {
  const result = await ipcInvoke<IpcResult<string | null>>(IpcChannel.PrintJobDownload, pdfPath);
  return unwrapIpc(result);
}

export async function deletePrintJobFile(pdfPath: string): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.PrintJobDelete, pdfPath);
  unwrapIpc(result);
}

export async function sendFaxFromPdf(payload: FaxSendPayload): Promise<FaxSendResult> {
  const result = await ipcInvoke<IpcResult<FaxSendResult>>(IpcChannel.FaxSend, payload);
  return unwrapIpc(result);
}

export async function getPrinterStatus(): Promise<PrinterStatus> {
  const result = await ipcInvoke<IpcResult<PrinterStatus>>(IpcChannel.PrinterGetStatus);
  return unwrapIpc(result);
}

export async function installVirtualPrinter(): Promise<PrinterInstallResult> {
  const result = await ipcInvoke<IpcResult<PrinterInstallResult>>(IpcChannel.PrinterInstall);
  return unwrapIpc(result);
}

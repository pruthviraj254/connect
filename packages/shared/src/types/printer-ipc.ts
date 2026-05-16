export type PrinterStatus = {
  installed: boolean;
  /** win32 only; always true on macOS/linux */
  platform: 'win32' | 'darwin' | 'linux';
  printerName: string;
  logPath?: string;
  /** Windows-only: current driver name attached to the print queue. */
  driverName?: string | null;
  /**
   * Windows-only: true when the driver can produce PostScript that Ghostscript
   * can convert to a real PDF. False for "Generic / Text Only" (blank PDFs).
   */
  driverOk?: boolean;
};

export type PrinterInstallResult = {
  ok: boolean;
  error?: string;
  logPath?: string;
  logTail?: string;
};

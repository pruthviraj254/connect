export type PrinterStatus = {
  installed: boolean;
  /** win32 only; always true on macOS/linux */
  platform: 'win32' | 'darwin' | 'linux';
  printerName: string;
  logPath?: string;
};

export type PrinterInstallResult = {
  ok: boolean;
  error?: string;
  logPath?: string;
};

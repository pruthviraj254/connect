import { ipcMain } from 'electron';
import { IpcChannel, type IpcResult, type PrinterInstallResult, type PrinterStatus } from '@rx-connect/shared';
import {
  installWindowsPrinterElevated,
  isWindowsPlatform,
  isWindowsPrinterInstalled,
  PRINTER_INSTALL_LOG_PATH,
  WINDOWS_PRINTER_NAME,
} from '../../virtual-printer/windows-printer.js';

function platformTag(): PrinterStatus['platform'] {
  if (process.platform === 'win32') return 'win32';
  if (process.platform === 'darwin') return 'darwin';
  return 'linux';
}

export function registerPrinterHandlers(): void {
  ipcMain.handle(IpcChannel.PrinterGetStatus, async (): Promise<IpcResult<PrinterStatus>> => {
    if (!isWindowsPlatform()) {
      return {
        ok: true,
        data: {
          installed: true,
          platform: platformTag(),
          printerName: WINDOWS_PRINTER_NAME,
        },
      };
    }
    const installed = await isWindowsPrinterInstalled();
    return {
      ok: true,
      data: {
        installed,
        platform: 'win32',
        printerName: WINDOWS_PRINTER_NAME,
        logPath: PRINTER_INSTALL_LOG_PATH,
      },
    };
  });

  ipcMain.handle(IpcChannel.PrinterInstall, async (): Promise<IpcResult<PrinterInstallResult>> => {
    if (!isWindowsPlatform()) {
      return { ok: true, data: { ok: true } };
    }
    const result = installWindowsPrinterElevated();
    if (result.ok) {
      return { ok: true, data: { ok: true, logPath: result.logPath } };
    }
    return {
      ok: true,
      data: {
        ok: false,
        error: result.error ?? 'install_failed',
        logPath: result.logPath,
      },
    };
  });
}

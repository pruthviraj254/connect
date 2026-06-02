import { dialog } from 'electron';
import log from 'electron-log';
import {
  getInstalledPrinterDriver,
  installWindowsPrinterElevated,
  isAcceptablePrinterDriver,
  isWindowsPrinterInstalled,
  isWindowsPlatform,
  PRINTER_INSTALL_LOG_PATH,
  readPrinterInstallLogTail,
  WINDOWS_PRINTER_NAME,
} from './virtual-printer/windows-printer.js';

/** Prompt user and install RxConnect (runtime fallback when NSIS install missed or driver is outdated). */
export async function promptWindowsPrinterInstallIfMissing(): Promise<void> {
  if (!isWindowsPlatform()) {
    return;
  }

  const installed = await isWindowsPrinterInstalled();
  const currentDriver = installed ? getInstalledPrinterDriver() : null;
  const driverOk = isAcceptablePrinterDriver(currentDriver);

  if (installed && driverOk) {
    return;
  }

  const isUpgradeFix = installed && !driverOk;
  log.info('[windows-runtime] printer needs install/upgrade', {
    installed,
    currentDriver,
    driverOk,
    isUpgradeFix,
  });

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: isUpgradeFix ? 'Update virtual printer' : 'Install virtual printer',
    message: isUpgradeFix
      ? `"${WINDOWS_PRINTER_NAME}" is using an outdated driver that produces blank PDFs.`
      : `Rx-Manager needs to add the "${WINDOWS_PRINTER_NAME}" printer.`,
    detail: isUpgradeFix
      ? `Current driver: "${currentDriver ?? 'unknown'}".\n\n` +
        'Click "Reinstall printer" to upgrade to a PostScript driver. ' +
        'Windows will ask for administrator permission (UAC).\n\n' +
        'After upgrading, all newly printed jobs will render correctly in Fax Inbox.'
      : 'Windows will ask for administrator permission (UAC). Accept to print from any app into Fax Inbox.\n\nKeep Rx-Manager running while you print.',
    buttons: [isUpgradeFix ? 'Reinstall printer' : 'Install printer', 'Not now'],
    defaultId: 0,
    cancelId: 1,
  });

  if (response !== 0) {
    return;
  }

  const result = installWindowsPrinterElevated();

  if (result.ok) {
    await dialog.showMessageBox({
      type: 'info',
      title: 'Printer installed',
      message: `"${WINDOWS_PRINTER_NAME}" is ready.`,
      detail: 'Choose it in any app’s Print dialog. Keep Rx-Manager open while printing.',
      buttons: ['OK'],
    });
    return;
  }

  const logTail = result.logTail ?? readPrinterInstallLogTail();
  const reason =
    result.error === 'uac_cancelled'
      ? 'Administrator permission was not granted.'
      : result.error === 'script_not_found'
        ? 'Install scripts were missing from the app package.'
        : 'The elevated install script did not register the printer.';

  await dialog.showMessageBox({
    type: 'warning',
    title: 'Printer not installed',
    message: `Could not add ${WINDOWS_PRINTER_NAME}.`,
    detail: `${reason}\n\nLog file:\n${result.logPath}\n\nRecent log:\n${logTail}\n\nRetry from Fax Inbox → Install printer.`,
    buttons: ['OK'],
  });

  log.warn('[windows-runtime] printer install failed', result);
}

export { isWindowsPrinterInstalled, installWindowsPrinterElevated, PRINTER_INSTALL_LOG_PATH };

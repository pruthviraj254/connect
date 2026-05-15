import { spawn } from 'node:child_process';
import path from 'node:path';
import { dialog } from 'electron';
import log from 'electron-log';
import {
  installWindowsPrinterElevated,
  isWindowsPrinterInstalled,
  isWindowsPlatform,
  PRINTER_INSTALL_LOG_PATH,
  WINDOWS_PRINTER_NAME,
} from './virtual-printer/windows-printer.js';

function runUpdateExe(args: string[]): void {
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  spawn(updateExe, args, { detached: true, stdio: 'ignore' }).unref();
}

/**
 * Handle Squirrel.Windows install/update/uninstall events.
 * Returns true when the app should exit immediately (installer-driven launch).
 */
export function handleWindowsSquirrelStartup(): boolean {
  if (!isWindowsPlatform()) {
    return false;
  }

  const cmd = process.argv[1];
  if (!cmd?.startsWith('--squirrel')) {
    return false;
  }

  const target = path.basename(process.execPath);
  log.info('[win-squirrel] handling', cmd);

  if (cmd === '--squirrel-install' || cmd === '--squirrel-updated') {
    runUpdateExe([`--createShortcut=${target}`]);
    void installWindowsPrinterElevated();
    return true;
  }

  if (cmd === '--squirrel-uninstall') {
    runUpdateExe([`--removeShortcut=${target}`]);
    void runElevatedUninstall();
    return true;
  }

  if (cmd === '--squirrel-obsolete') {
    return true;
  }

  return false;
}

function runElevatedUninstall(): void {
  const scriptPath = path.join(process.resourcesPath, 'virtual-printer', 'uninstall-windows-printer.ps1');
  const launcherPath = path.join(process.resourcesPath, 'virtual-printer', 'elevate-run-script.ps1');
  spawn(
    'powershell.exe',
    [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      launcherPath,
      '-TargetScript',
      scriptPath,
    ],
    { stdio: 'ignore', windowsHide: false },
  ).unref();
}

/** Prompt user and install RxConnectFax (primary path on Windows). */
export async function promptWindowsPrinterInstallIfMissing(): Promise<void> {
  if (!isWindowsPlatform()) {
    return;
  }

  const installed = await isWindowsPrinterInstalled();
  if (installed) {
    return;
  }

  log.info('[win-squirrel] RxConnectFax missing — showing install dialog');

  const { response } = await dialog.showMessageBox({
    type: 'info',
    title: 'Install virtual printer',
    message: `Rx-Connect needs to add the "${WINDOWS_PRINTER_NAME}" printer.`,
    detail:
      'Windows will ask for administrator permission (UAC). Accept to print from any app into Fax Inbox.\n\nKeep Rx-Connect running while you print.',
    buttons: ['Install printer', 'Not now'],
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
      detail: 'Choose it in any app’s Print dialog. Keep Rx-Connect open while printing.',
      buttons: ['OK'],
    });
    return;
  }

  await dialog.showMessageBox({
    type: 'warning',
    title: 'Printer not installed',
    message: 'Could not add RxConnectFax.',
    detail: `Log file:\n${result.logPath}\n\nYou can retry from Fax Inbox → Install printer.`,
    buttons: ['OK'],
  });

  log.warn('[win-squirrel] printer install failed', result);
}

export { isWindowsPrinterInstalled, installWindowsPrinterElevated, PRINTER_INSTALL_LOG_PATH };

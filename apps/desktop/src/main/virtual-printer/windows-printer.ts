import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';

export const WINDOWS_PRINTER_NAME = 'RxConnectFax';

export const PRINTER_INSTALL_LOG_PATH = path.join(
  process.env.ProgramData ?? 'C:\\ProgramData',
  'Rx-Connect',
  'logs',
  'printer-install.log',
);

export type PrinterInstallResult = {
  ok: boolean;
  exitCode: number | null;
  logPath: string;
  error?: string;
};

function virtualPrinterDir(): string {
  return path.join(process.resourcesPath, 'virtual-printer');
}

function scriptPath(name: string): string {
  return path.join(virtualPrinterDir(), name);
}

/** Run install-windows-printer.ps1 elevated via a launcher script (reliable quoting on Windows). */
export function installWindowsPrinterElevated(): PrinterInstallResult {
  const logPath = PRINTER_INSTALL_LOG_PATH;
  const installScript = scriptPath('install-windows-printer.ps1');

  if (!fs.existsSync(installScript)) {
    const error = `install script not found: ${installScript}`;
    log.error('[windows-printer]', error);
    return { ok: false, exitCode: null, logPath, error };
  }

  const launcherPath = scriptPath('elevate-run-script.ps1');
  if (!fs.existsSync(launcherPath)) {
    const error = `elevate launcher not found: ${launcherPath}`;
    log.error('[windows-printer]', error);
    return { ok: false, exitCode: null, logPath, error };
  }

  const args = [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    launcherPath,
    '-TargetScript',
    installScript,
    '-LogPath',
    logPath,
  ];

  log.info('[windows-printer] requesting elevated install', installScript);

  const result = spawnSync('powershell.exe', args, {
    stdio: 'pipe',
    windowsHide: false,
    encoding: 'utf8',
  });

  const exitCode = result.status;
  const stderr = result.stderr?.trim() ?? '';
  if (stderr) {
    log.warn('[windows-printer] elevate stderr', stderr);
  }

  const installed = exitCode === 0 && checkWindowsPrinterInstalledSync();
  if (!installed) {
    const error =
      exitCode === 2
        ? 'admin_required'
        : exitCode === 1
          ? 'install_script_failed'
          : 'printer_not_registered';
    log.warn('[windows-printer] install failed', { exitCode, error });
    return { ok: false, exitCode, logPath, error };
  }

  log.info('[windows-printer] RxConnectFax installed');
  return { ok: true, exitCode, logPath };
}

function checkWindowsPrinterInstalledSync(): boolean {
  const result = spawnSync(
    'powershell.exe',
    [
      '-NoProfile',
      '-Command',
      `if (Get-Printer -Name '${WINDOWS_PRINTER_NAME}' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }`,
    ],
    { windowsHide: true, encoding: 'utf8' },
  );
  return result.status === 0;
}

export function isWindowsPrinterInstalled(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return Promise.resolve(true);
  }
  return Promise.resolve(checkWindowsPrinterInstalledSync());
}

export function isWindowsPlatform(): boolean {
  return process.platform === 'win32';
}

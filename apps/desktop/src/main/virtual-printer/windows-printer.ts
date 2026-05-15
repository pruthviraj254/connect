import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import log from 'electron-log';

/** Windows queue name — avoid "Fax" in the name (OS opens Windows Fax and Scan). */
export const WINDOWS_PRINTER_NAME = 'RxConnect';

/** Legacy Windows install name; removed on reinstall. */
export const WINDOWS_LEGACY_PRINTER_NAME = 'RxConnectFax';

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
  logTail?: string;
};

function virtualPrinterDir(): string {
  const bundled = path.join(process.resourcesPath, 'virtual-printer');
  if (fs.existsSync(path.join(bundled, 'install-windows-printer.ps1'))) {
    return bundled;
  }

  const devCandidates = [
    path.join(app.getAppPath(), '..', 'resources', 'virtual-printer'),
    path.join(app.getAppPath(), 'resources', 'virtual-printer'),
    path.resolve(process.cwd(), 'resources', 'virtual-printer'),
    path.resolve(process.cwd(), 'apps', 'desktop', 'resources', 'virtual-printer'),
  ];

  for (const candidate of devCandidates) {
    if (fs.existsSync(path.join(candidate, 'install-windows-printer.ps1'))) {
      log.info('[windows-printer] using dev script path', candidate);
      return candidate;
    }
  }

  return bundled;
}

function scriptPath(name: string): string {
  return path.join(virtualPrinterDir(), name);
}

export function readPrinterInstallLogTail(maxLines = 12): string {
  try {
    if (!fs.existsSync(PRINTER_INSTALL_LOG_PATH)) {
      return '(no log file yet — install script may not have started)';
    }
    const content = fs.readFileSync(PRINTER_INSTALL_LOG_PATH, 'utf8');
    const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0) {
      return '(log file is empty)';
    }
    return lines.slice(-maxLines).join('\n');
  } catch (e) {
    return e instanceof Error ? e.message : 'could_not_read_log';
  }
}

function mapExitCodeToError(exitCode: number | null): string {
  if (exitCode === 2) return 'admin_required';
  if (exitCode === 3) return 'script_not_found';
  if (exitCode === 5) return 'elevation_failed';
  if (exitCode === 1223) return 'uac_cancelled';
  if (exitCode === 1) return 'install_script_failed';
  return 'printer_not_registered';
}

/** Run install-windows-printer.ps1 elevated via a launcher script (reliable quoting on Windows). */
export function installWindowsPrinterElevated(): PrinterInstallResult {
  const logPath = PRINTER_INSTALL_LOG_PATH;
  const installScript = scriptPath('install-windows-printer.ps1');

  if (!fs.existsSync(installScript)) {
    const error = `install script not found: ${installScript}`;
    log.error('[windows-printer]', error);
    return { ok: false, exitCode: null, logPath, error, logTail: readPrinterInstallLogTail() };
  }

  const launcherPath = scriptPath('elevate-run-script.ps1');
  if (!fs.existsSync(launcherPath)) {
    const error = `elevate launcher not found: ${launcherPath}`;
    log.error('[windows-printer]', error);
    return { ok: false, exitCode: null, logPath, error, logTail: readPrinterInstallLogTail() };
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

  log.info('[windows-printer] requesting elevated install', { installScript, launcherPath });

  const result = spawnSync('powershell.exe', args, {
    stdio: 'pipe',
    windowsHide: false,
    encoding: 'utf8',
  });

  const exitCode = result.status;
  const stderr = result.stderr?.trim() ?? '';
  const stdout = result.stdout?.trim() ?? '';
  if (stderr) log.warn('[windows-printer] elevate stderr', stderr);
  if (stdout) log.info('[windows-printer] elevate stdout', stdout);

  const logTail = readPrinterInstallLogTail();
  const installed = exitCode === 0 && checkWindowsPrinterInstalledSync();

  if (!installed) {
    const error = mapExitCodeToError(exitCode);
    log.warn('[windows-printer] install failed', { exitCode, error, logTail });
    return { ok: false, exitCode, logPath, error, logTail };
  }

  log.info(`[windows-printer] ${WINDOWS_PRINTER_NAME} installed`);
  return { ok: true, exitCode, logPath, logTail };
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

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import log from 'electron-log';

function virtualPrinterDir(): string {
  return path.join(process.resourcesPath, 'virtual-printer');
}

function runUpdateExe(args: string[]): void {
  const updateExe = path.resolve(path.dirname(process.execPath), '..', 'Update.exe');
  spawn(updateExe, args, { detached: true, stdio: 'ignore' }).unref();
}

/** Launch a PowerShell script elevated (UAC). */
function runElevatedPs1(scriptName: string, wait = false): void {
  const scriptPath = path.join(virtualPrinterDir(), scriptName);
  const escaped = scriptPath.replace(/'/g, "''");
  const psCommand = `Start-Process powershell.exe -Verb RunAs -Wait -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','${escaped}'`;

  const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psCommand];

  try {
    if (wait) {
      const result = spawnSync('powershell.exe', args, { stdio: 'inherit', windowsHide: false });
      if (result.status !== 0) {
        log.warn(`[win-squirrel] ${scriptName} exited with code ${result.status ?? 'unknown'}`);
      }
      return;
    }
    const child = spawn('powershell.exe', args, { stdio: 'ignore', windowsHide: false });
    child.on('error', (err) => log.error('[win-squirrel] elevated script spawn failed', err));
    child.on('close', (code) => {
      if (code !== 0) log.warn(`[win-squirrel] ${scriptName} exited with code ${code}`);
    });
  } catch (err) {
    log.error('[win-squirrel] failed to run elevated script', err);
  }
}

/**
 * Handle Squirrel.Windows install/update/uninstall events (replaces electron-squirrel-startup).
 * Returns true when the app should exit immediately (installer-driven launch).
 */
export function handleWindowsSquirrelStartup(): boolean {
  if (process.platform !== 'win32') {
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
    runElevatedPs1('install-windows-printer.ps1', true);
    return true;
  }

  if (cmd === '--squirrel-uninstall') {
    runUpdateExe([`--removeShortcut=${target}`]);
    runElevatedPs1('uninstall-windows-printer.ps1', true);
    return true;
  }

  if (cmd === '--squirrel-obsolete') {
    return true;
  }

  return false;
}

/** Is RxConnectFax registered in Windows? */
export async function isWindowsPrinterInstalled(): Promise<boolean> {
  if (process.platform !== 'win32') return true;
  return new Promise((resolve) => {
    const child = spawn(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        "if (Get-Printer -Name 'RxConnectFax' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }",
      ],
      { windowsHide: true },
    );
    child.on('close', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/** Fallback if Squirrel install was skipped or UAC was denied. */
export function scheduleWindowsPrinterInstallIfMissing(): void {
  if (process.platform !== 'win32') return;
  void (async () => {
    const installed = await isWindowsPrinterInstalled();
    if (installed) return;
    log.info('[win-squirrel] RxConnectFax missing — running elevated install');
    runElevatedPs1('install-windows-printer.ps1', false);
  })();
}

import type { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

export function setMainWindow(win: BrowserWindow | null): void {
  mainWindow = win;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function setQuitting(value: boolean): void {
  isQuitting = value;
}

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function showMainWindow(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  win.focus();
}

export function hideMainWindow(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  win.hide();
}

/** Main window is on screen (not closed to tray). */
export function isMainWindowOnScreen(): boolean {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return false;
  return win.isVisible();
}

/**
 * When a print job opens the fax popup, only hide main if it was already in the tray.
 * If the user had the dashboard open or minimized on the taskbar, leave it alone.
 */
export function hideMainForPrintPopupIfNeeded(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (isMainWindowOnScreen()) return;
  win.hide();
}

/** Set when the print service (or CLI) wakes the app for a new spool job — do not show main window. */
export function isWakeForPrint(argv: string[] = process.argv): boolean {
  return argv.includes('--wake-for-print');
}

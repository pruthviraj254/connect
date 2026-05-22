import type { BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

/** How the main window was shown before a fax popup opened. */
type MainUiState = 'visible' | 'minimized' | 'hidden';

let mainUiBeforePopup: MainUiState | null = null;

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

function resolveMainUiState(win: BrowserWindow): MainUiState {
  if (!win.isVisible()) return 'hidden';
  if (win.isMinimized()) return 'minimized';
  return 'visible';
}

/** Remember main window state before showing the fax popup. */
export function captureMainUiBeforePopup(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) {
    mainUiBeforePopup = 'hidden';
    return;
  }
  mainUiBeforePopup = resolveMainUiState(win);
}

/** Restore main window to how it was before the fax popup (not forced to tray). */
export function restoreMainUiAfterPopup(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed() || !mainUiBeforePopup) return;
  const prior = mainUiBeforePopup;
  mainUiBeforePopup = null;

  switch (prior) {
    case 'hidden':
      return;
    case 'minimized':
      if (!win.isVisible()) {
        win.show();
      }
      if (!win.isMinimized()) {
        win.minimize();
      }
      return;
    case 'visible':
      if (win.isMinimized()) {
        win.restore();
      }
      if (!win.isVisible()) {
        win.show();
      }
      return;
  }
}

async function ensureMainContentLoaded(win: BrowserWindow): Promise<void> {
  const url = win.webContents.getURL();
  if (url && url !== 'about:blank' && !win.webContents.isLoadingMainFrame()) {
    return;
  }
  const devUrl = process.env.ELECTRON_RENDERER_URL;
  await win.loadURL(devUrl ?? 'app://rxconnect/');
}

export function showMainWindow(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) {
    win.restore();
  }
  if (!win.isVisible()) {
    win.show();
  }
  void ensureMainContentLoaded(win).then(() => {
    if (!win.isDestroyed()) {
      win.focus();
    }
  });
}

export function hideMainWindow(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  win.hide();
}

/**
 * When a print job opens the fax popup, only hide main if it was already in the tray.
 * On Windows, minimized taskbar windows often report isVisible() === false — never hide those.
 */
export function hideMainForPrintPopupIfNeeded(): void {
  const win = mainWindow;
  if (!win || win.isDestroyed()) return;
  if (win.isMinimized()) return;
  if (win.isVisible()) return;
  win.hide();
}

/** Set when the print service (or CLI) wakes the app for a new spool job — do not show main window. */
export function isWakeForPrint(argv: string[] = process.argv): boolean {
  return argv.includes('--wake-for-print');
}

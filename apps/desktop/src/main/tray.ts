import path from 'node:path';
import { app, Menu, Tray, nativeImage, shell } from 'electron';
import log from 'electron-log';
import { getStore } from './store.js';
import { getMainWindow, hideMainWindow, setQuitting, showMainWindow } from './lifecycle.js';
import { getRendererLoadUrl } from './renderer-url.js';
import { listPrintJobs } from './virtual-printer/job-store.js';

let tray: Tray | null = null;

function iconsDir(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'icons');
  }
  return path.join(app.getAppPath(), 'resources', 'icons');
}

function loadTrayIcon(): Electron.NativeImage {
  const dir = iconsDir();
  const isWin = process.platform === 'win32';
  const primary = path.join(dir, isWin ? 'tray.png' : 'tray.png');
  const retina = path.join(dir, 'tray@2x.png');
  let img = nativeImage.createFromPath(primary);
  if (img.isEmpty()) {
    img = nativeImage.createEmpty();
  }
  if (process.platform === 'darwin' && nativeImage.createFromPath(retina).isEmpty() === false) {
    img = nativeImage.createFromPath(retina);
    img.setTemplateImage(true);
  }
  return img;
}

function serviceLogPath(): string {
  if (process.platform === 'win32') {
    return path.join(process.env.ProgramData ?? 'C:\\ProgramData', 'Rx-Connect', 'logs', 'service.log');
  }
  return path.join(app.getPath('userData'), 'logs', 'service.log');
}

async function buildRecentPrintsSubmenu(): Promise<Electron.MenuItemConstructorOptions[]> {
  try {
    const jobs = await listPrintJobs();
    const recent = jobs.slice(0, 5);
    if (recent.length === 0) {
      return [{ label: 'No recent prints', enabled: false }];
    }
    return recent.map((j) => ({
      label: j.fileName,
      click: () => {
        void shell.openPath(j.pdfPath);
      },
    }));
  } catch {
    return [{ label: 'Could not load prints', enabled: false }];
  }
}

async function rebuildTrayMenu(): Promise<void> {
  if (!tray) return;
  const store = getStore();
  const openAtLogin = store.get('openAtLogin');
  const recentItems = await buildRecentPrintsSubmenu();

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Open Rx-Connect',
      click: () => showMainWindow(),
    },
    {
      label: 'Recent prints',
      submenu: recentItems,
    },
    {
      label: 'Open Fax Inbox',
      click: () => {
        const win = getMainWindow();
        showMainWindow();
        if (win && !win.isDestroyed()) {
          void win.loadURL(getRendererLoadUrl('/fax-inbox/'));
        }
      },
    },
    { type: 'separator' },
    ...(process.platform === 'win32'
      ? [
          {
            label: 'Open service log',
            click: () => {
              void shell.openPath(serviceLogPath());
            },
          },
          { type: 'separator' as const },
        ]
      : []),
    {
      label: 'Start at login',
      type: 'checkbox',
      checked: openAtLogin,
      click: (item) => {
        const checked = item.checked;
        store.set('openAtLogin', checked);
        app.setLoginItemSettings({
          openAtLogin: checked,
          openAsHidden: checked,
          args: process.platform === 'win32' && checked ? ['--hidden'] : [],
        });
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Rx-Connect',
      click: () => {
        setQuitting(true);
        app.quit();
      },
    },
  ];

  tray.setContextMenu(Menu.buildFromTemplate(template));
}

export function setupTray(): void {
  if (process.platform === 'darwin') {
    return;
  }
  if (tray) return;

  const icon = loadTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip('Rx-Connect');

  tray.on('double-click', () => {
    showMainWindow();
  });

  void rebuildTrayMenu();
  tray.on('right-click', () => {
    void rebuildTrayMenu();
  });

  log.info('[tray] system tray initialized');
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

export function refreshTrayMenu(): void {
  void rebuildTrayMenu();
}

/** Hide main window to tray instead of quitting (Windows/Linux). */
export function minimizeToTray(): void {
  hideMainWindow();
}

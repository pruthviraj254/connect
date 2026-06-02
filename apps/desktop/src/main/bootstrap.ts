import { app, BrowserWindow, nativeTheme, net, protocol, shell } from 'electron';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import log from 'electron-log';
import { initializeUpdateService } from './update-service.js';
import { promptWindowsPrinterInstallIfMissing } from './windows-runtime.js';
import { registerIpcHandlers } from './ipc/index.js';
import { buildAppMenu } from './menu.js';
import { getStore, initStore } from './store.js';
import { applyFirstRunDefaults, ensureOpenAtLoginEnabled, maybeShowTrayHint } from './first-run.js';
import {
  getIsQuitting,
  getMainWindow,
  isWakeForPrint,
  setMainWindow,
  setQuitting,
  showMainWindow,
} from './lifecycle.js';
import { clearMainWebContentsId, setMainWebContentsId } from './lib/mainWindow.js';
import { flushSpoolScan } from './virtual-printer/watcher.js';
import { destroyTray, setupTray } from './tray.js';
import { startPrintPipeline, stopPrintPipeline } from './virtual-printer/pipeline.js';
import { registerPdfPreviewProtocol, wirePdfPreviewProtocol } from './pdf-preview-protocol.js';
import { getProtocolScheme } from './build-metadata.js';
import { getBakedAppUserModelId, getBakedProductName } from './build-constants.js';
import { config } from './config.js';
import { getRendererLoadUrl } from './renderer-url.js';

// Unsigned macOS builds often crash in the GPU helper without this switch.
if (process.platform === 'darwin' && app.isPackaged) {
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    },
  },
]);
registerPdfPreviewProtocol();

log.transports.file.level = 'info';
log.errorHandler.startCatching();

process.on('uncaughtException', (error) => {
  log.error('uncaughtException', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('unhandledRejection', reason);
});

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.map': 'application/json; charset=utf-8',
};

function getRendererRoot(): string {
  return path.join(app.getAppPath(), 'renderer-out');
}

function registerAppProtocol(): void {
  const rendererRoot = path.resolve(getRendererRoot());

  protocol.handle('app', async (request) => {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);

    if (pathname === '/' || pathname === '') {
      pathname = '/index.html';
    }

    const rel = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    let filePath = path.resolve(path.join(rendererRoot, rel));

    try {
      const fileStat = await stat(filePath);
      if (fileStat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
    } catch {
      return new Response('Not Found', { status: 404 });
    }

    const resolved = path.resolve(filePath);
    if (!resolved.startsWith(rendererRoot + path.sep) && resolved !== rendererRoot) {
      return new Response('Forbidden', { status: 403 });
    }

    // fs.readFile works for paths inside app.asar; net.fetch(file://…) does not.
    const body = await readFile(resolved);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(body.length),
      },
    });
  });
}

function shouldStartHidden(): boolean {
  return process.argv.includes('--hidden');
}

async function createWindow(): Promise<void> {
  const startHidden = shouldStartHidden();

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      plugins: true,
    },
  });

  setMainWindow(mainWindow);
  setMainWebContentsId(mainWindow.webContents.id);
  mainWindow.on('closed', () => {
    clearMainWebContentsId();
  });

  const menu = buildAppMenu({
    onReload: () => mainWindow.reload(),
    onOpenDocs: () => void shell.openExternal('https://onerx.health'),
  });
  mainWindow.setMenu(menu);

  mainWindow.on('close', (event) => {
    if (!getIsQuitting() && process.platform !== 'darwin') {
      event.preventDefault();
      mainWindow.hide();
      maybeShowTrayHint();
    }
  });

  mainWindow.once('ready-to-show', () => {
    if (!startHidden) {
      mainWindow.show();
    }
  });

  mainWindow.webContents.on('did-fail-load', (_event, code, description, url) => {
    log.error('[window] did-fail-load', { code, description, url });
    if (!startHidden && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  });

  const loadUrl = getRendererLoadUrl('/');
  try {
    await mainWindow.loadURL(loadUrl);
    if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
  } catch (err) {
    log.error('[window] loadURL failed', loadUrl, err);
    if (!startHidden && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
    throw err;
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    void shell.openExternal(linkUrl);
    return { action: 'deny' };
  });

  await startPrintPipeline();
}

function registerDeepLinkProtocol(): void {
  const scheme = getProtocolScheme();
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(scheme, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(scheme);
  }
}

function wireNetworkStatus(): void {
  const emitter = app as NodeJS.EventEmitter;
  const broadcast = () => {
    const online = net.isOnline();
    BrowserWindow.getAllWindows().forEach((w) => {
      if (!w.isDestroyed()) {
        w.webContents.send('app:network-status', { online });
      }
    });
  };
  emitter.on('online', broadcast);
  emitter.on('offline', broadcast);
  app.on('browser-window-created', () => broadcast());
}

function wireCsp(): void {
  const isDev = !app.isPackaged && Boolean(process.env.ELECTRON_RENDERER_URL);

  app.on('web-contents-created', (_event, contents) => {
    contents.session.webRequest.onHeadersReceived((details, callback) => {
      const csp = isDev
        ? [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com data:",
            "img-src 'self' data: blob: https: http:",
            "frame-src 'self' blob: data: rx-pdf: http://127.0.0.1:* http://localhost:*",
            "object-src 'self' blob: data: rx-pdf:",
            "worker-src 'self' blob:",
            "connect-src 'self' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:* https: http:",
          ].join('; ')
        : [
            "default-src 'self' app:",
            "script-src 'self' 'unsafe-inline' app:",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com app:",
            "font-src 'self' https://fonts.gstatic.com data: app:",
            "img-src 'self' data: blob: app: https: http:",
            "frame-src 'self' app: blob: data: rx-pdf: http://127.0.0.1:* http://localhost:*",
            "object-src 'self' app: blob: data: rx-pdf:",
            "worker-src 'self' app: blob:",
            "connect-src 'self' app: https:",
          ].join('; ');
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
        },
      });
    });
  });
}

if (process.platform === 'win32') {
  app.setAppUserModelId(getBakedAppUserModelId());
  app.setName(getBakedProductName());
}

/** Packaged builds only — dev may relaunch while a zombie Electron is still running. */
const useSingleInstanceLock = app.isPackaged;
const gotLock = !useSingleInstanceLock || app.requestSingleInstanceLock();
if (!gotLock) {
  log.warn(
    '[app] Another Rx-Manager instance is already running — exiting. Quit the other app or kill stale Electron processes.',
  );
  app.quit();
} else {
  if (useSingleInstanceLock) {
  app.on('second-instance', (_event, argv) => {
    const scheme = getProtocolScheme();
    const deepLinkPrefix = `${scheme}://`;
    const deepLink = argv.find((a) => a.startsWith(deepLinkPrefix));
    if (deepLink) {
      getMainWindow()?.webContents.send('app:deep-link', deepLink);
    }
    if (isWakeForPrint(argv)) {
      log.info('[app] second-instance print wake — scan spool, keep main hidden');
      flushSpoolScan();
      return;
    }
    showMainWindow();
  });
  }

  app.whenReady().then(async () => {
    initStore();
    registerDeepLinkProtocol();
    registerAppProtocol();
    wirePdfPreviewProtocol();
    registerIpcHandlers();
    wireCsp();
    wireNetworkStatus();
    nativeTheme.themeSource = 'light';

    applyFirstRunDefaults();
    ensureOpenAtLoginEnabled();
    setupTray();

    await initializeUpdateService();

    await createWindow();
    await promptWindowsPrinterInstallIfMissing();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      } else {
        showMainWindow();
      }
    });
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    getMainWindow()?.webContents.send('app:deep-link', url);
  });

  app.on('before-quit', () => {
    setQuitting(true);
    stopPrintPipeline();
    destroyTray();
  });

  app.on('window-all-closed', () => {
    // Windows/Linux: stay alive in system tray when the main window is closed.
    if (process.platform === 'darwin' && !getIsQuitting()) {
      /* macOS: keep running in Dock until explicit Quit */
    }
  });
}

import { app, BrowserWindow, nativeTheme, net, protocol, shell } from 'electron';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stat } from 'node:fs/promises';
import log from 'electron-log';
import { initAutoUpdater } from './auto-updater.js';
import { promptWindowsPrinterInstallIfMissing } from './windows-runtime.js';
import { registerIpcHandlers } from './ipc/index.js';
import { buildAppMenu } from './menu.js';
import { getStore } from './store.js';
import { getMainWindow, setMainWindow } from './lifecycle.js';
import { startPrintPipeline, stopPrintPipeline } from './virtual-printer/pipeline.js';
import { registerPdfPreviewProtocol, wirePdfPreviewProtocol } from './pdf-preview-protocol.js';

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
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

    const upstream = await net.fetch(pathToFileURL(resolved).href);
    const ext = path.extname(resolved).toLowerCase();
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';
    const headers = new Headers(upstream.headers);
    headers.set('Content-Type', contentType);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  });
}

async function createWindow(): Promise<void> {
  const devUrl = process.env.ELECTRON_RENDERER_URL;

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

  const menu = buildAppMenu({
    onReload: () => mainWindow.reload(),
    onOpenDocs: () => void shell.openExternal('https://onerx.health'),
  });
  mainWindow.setMenu(menu);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadURL('app://rxconnect/');
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: linkUrl }) => {
    void shell.openExternal(linkUrl);
    return { action: 'deny' };
  });

  await startPrintPipeline();
}

function registerDeepLinkProtocol(): void {
  if (process.defaultApp && process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('rxconnect', process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient('rxconnect');
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
  const isDev = Boolean(process.env.ELECTRON_RENDERER_URL);

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

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const deepLink = argv.find((a) => a.startsWith('rxconnect://'));
    if (deepLink) {
      getMainWindow()?.webContents.send('app:deep-link', deepLink);
    }
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(async () => {
    registerDeepLinkProtocol();
    registerAppProtocol();
    wirePdfPreviewProtocol();
    registerIpcHandlers();
    wireCsp();
    wireNetworkStatus();
    nativeTheme.themeSource = getStore().get('theme', 'system') as 'system' | 'light' | 'dark';

    await createWindow();
    await promptWindowsPrinterInstallIfMissing();
    initAutoUpdater();

    app.on('activate', async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createWindow();
      }
    });
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    getMainWindow()?.webContents.send('app:deep-link', url);
  });

  app.on('before-quit', () => {
    stopPrintPipeline();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

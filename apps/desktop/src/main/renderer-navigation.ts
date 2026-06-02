import { app } from 'electron';
import type { WebContents } from 'electron';
import log from 'electron-log';
import { getProtocolScheme } from './build-metadata.js';

/** Main → renderer in-app navigation (client-side route change). */
export const APP_NAVIGATE_CHANNEL = 'app:navigate';

/** Normalize pathnames to match Next.js `trailingSlash: true`. */
export function normalizeAppPathname(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }

  let path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  if (path.endsWith('/index.html')) {
    path = path.slice(0, -'/index.html'.length) || '/';
  }
  if (path !== '/' && !path.endsWith('/')) {
    path += '/';
  }
  return path;
}

function isInAppNavigationUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'about:') {
      return false;
    }

    const devUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL?.trim() : undefined;
    if (devUrl) {
      const devOrigin = new URL(devUrl).origin;
      if (parsed.origin === devOrigin) {
        return true;
      }
    }

    if (parsed.protocol !== 'app:') {
      return false;
    }

    const scheme = getProtocolScheme();
    return parsed.host === scheme;
  } catch {
    return false;
  }
}

export function sendAppNavigate(webContents: WebContents, pathname: string): void {
  if (webContents.isDestroyed()) {
    return;
  }
  const normalized = normalizeAppPathname(pathname);
  log.info('[nav] IPC navigate', normalized);
  webContents.send(APP_NAVIGATE_CHANNEL, normalized);
}

/**
 * Prevent full document reloads for in-app route changes under `app://` or the dev server.
 * Initial load and `about:blank` navigations are always allowed.
 */
export function wireRendererNavigation(webContents: WebContents): void {
  webContents.on('will-navigate', (event, url) => {
    const currentUrl = webContents.getURL();
    if (!currentUrl || currentUrl === 'about:blank') {
      return;
    }

    if (!isInAppNavigationUrl(url)) {
      return;
    }

    const target = new URL(url);
    const current = new URL(currentUrl);

    if (target.href === current.href) {
      return;
    }

    event.preventDefault();
    const pathname = normalizeAppPathname(target.pathname);
    log.info('[nav] intercepted hard navigation', { from: current.pathname, to: pathname });
    sendAppNavigate(webContents, pathname);
  });
}

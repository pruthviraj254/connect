import type { WebContents } from 'electron';
import log from 'electron-log';

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

export function sendAppNavigate(webContents: WebContents, pathname: string): void {
  if (webContents.isDestroyed()) {
    return;
  }
  const normalized = normalizeAppPathname(pathname);
  log.info('[nav] IPC navigate', normalized);
  webContents.send(APP_NAVIGATE_CHANNEL, normalized);
}

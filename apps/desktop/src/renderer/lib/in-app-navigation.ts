import { isElectronApp } from '@/lib/electron';

/** Normalize pathnames to match Next.js `trailingSlash: true`. */
export function normalizeInAppPath(path: string): string {
  if (!path || path === '/') {
    return '/';
  }

  let normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.endsWith('/index.html')) {
    normalized = normalized.slice(0, -'/index.html'.length) || '/';
  }
  if (normalized !== '/' && !normalized.endsWith('/')) {
    normalized += '/';
  }
  return normalized;
}

export function normalizeRouteKey(pathname: string): string {
  const normalized = normalizeInAppPath(pathname);
  if (normalized === '/') {
    return '/';
  }
  return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
}

/** Routes that require a full document load in packaged Electron. */
const ELECTRON_HARD_LOAD_ROUTES = new Set([
  '/',
  '/login',
  '/login/device-pending',
  '/privacy',
  '/home',
]);

type AppRouter = {
  replace: (href: string) => void;
  push: (href: string) => void;
};

/** Post-auth entry — hard load in Electron so static export routing is reliable. */
export function redirectToWorkspace(router?: AppRouter): void {
  redirectInApp('/home/', router);
}

/**
 * Auth-safe navigation for Electron static export.
 * Login/public routes use full document load; dashboard routes use the Next router.
 */
export function redirectInApp(path: string, router?: AppRouter, replace = true): void {
  const normalized = normalizeInAppPath(path);
  const routeKey = normalizeRouteKey(normalized);

  if (isElectronApp() && ELECTRON_HARD_LOAD_ROUTES.has(routeKey)) {
    const target =
      normalized === '/' ? `${window.location.origin}/` : `${window.location.origin}${normalized}`;
    window.location.assign(target);
    return;
  }

  if (router) {
    if (replace) {
      router.replace(normalized);
    } else {
      router.push(normalized);
    }
    return;
  }

  if (isElectronApp()) {
    const target =
      normalized === '/' ? `${window.location.origin}/` : `${window.location.origin}${normalized}`;
    window.location.assign(target);
  }
}

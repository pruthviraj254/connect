import { app } from 'electron';

/** Dev server URL is ignored in packaged builds so a stray env var cannot break production. */
export function getRendererLoadUrl(pathSuffix = '/'): string {
  const devUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL?.trim() : undefined;
  if (devUrl) {
    const base = devUrl.replace(/\/$/, '');
    const path = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
    return `${base}${path}`;
  }
  const suffix = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  return `app://rxconnect${suffix === '/' ? '/' : suffix}`;
}

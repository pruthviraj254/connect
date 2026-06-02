import { app } from 'electron';

let staticServerPort: number | null = null;

/** Set after the loopback static server starts in packaged production builds. */
export function setRendererStaticServerPort(port: number): void {
  staticServerPort = port;
}

export function getRendererStaticServerPort(): number | null {
  return staticServerPort;
}

/** Dev server URL is ignored in packaged builds so a stray env var cannot break production. */
export function getRendererLoadUrl(pathSuffix = '/'): string {
  const devUrl = !app.isPackaged ? process.env.ELECTRON_RENDERER_URL?.trim() : undefined;
  if (devUrl) {
    const base = devUrl.replace(/\/$/, '');
    const path = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
    return `${base}${path}`;
  }

  const port = staticServerPort;
  if (port == null) {
    throw new Error('Renderer static server is not running');
  }

  const suffix = pathSuffix.startsWith('/') ? pathSuffix : `/${pathSuffix}`;
  return `http://127.0.0.1:${port}${suffix === '/' ? '/' : suffix}`;
}

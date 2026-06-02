import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import log from 'electron-log';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
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

export type StaticServerHandle = {
  port: number;
  close: () => Promise<void>;
};

/**
 * Serve the Next.js static export over loopback HTTP so client-side navigation
 * (RSC fetch) works in production — custom `app://` cannot be used with fetch().
 */
export async function startStaticServer(rendererRoot: string): Promise<StaticServerHandle> {
  const root = path.resolve(rendererRoot);

  const server = http.createServer((req, res) => {
    void (async () => {
      try {
        const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
        let pathname = decodeURIComponent(requestUrl.pathname);

        if (pathname === '/' || pathname === '') {
          pathname = '/index.html';
        }

        const rel = pathname.startsWith('/') ? pathname.slice(1) : pathname;
        let filePath = path.resolve(path.join(root, rel));

        try {
          const fileStat = await stat(filePath);
          if (fileStat.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
          }
        } catch {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }

        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(root + path.sep) && resolved !== root) {
          res.statusCode = 403;
          res.end('Forbidden');
          return;
        }

        const body = await readFile(resolved);
        const ext = path.extname(resolved).toLowerCase();
        const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(body.length));
        res.end(body);
      } catch (error) {
        log.error('[static-server] request failed', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    })();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  log.info('[static-server] listening', { port, root });

  return {
    port,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          log.info('[static-server] stopped');
          resolve();
        });
      }),
  };
}

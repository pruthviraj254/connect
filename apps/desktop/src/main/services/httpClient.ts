import { config } from '../config.js';
import * as authService from './authService.js';
import { SessionExpiredError } from './authService.js';

export class HttpError extends Error {
  public readonly status: number | null;
  public readonly url: string;
  public override readonly cause?: unknown;

  constructor(
    message: string,
    options: { status?: number | null; url: string; cause?: unknown },
  ) {
    super(message);
    this.name = 'HttpError';
    this.status = options.status ?? null;
    this.url = options.url;
    this.cause = options.cause;
  }
}

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
  maxRetries?: number;
  authenticated?: boolean;
  skipAuthRetry?: boolean;
}

export type HttpBase = 'api' | 'portal';

const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

/** Join API base URL with a path without dropping a trailing `/api` segment. */
export function resolveRequestUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.trim().replace(/\/+$/, '');
  const questionIndex = path.indexOf('?');
  const pathOnly = questionIndex >= 0 ? path.slice(0, questionIndex) : path;
  const query = questionIndex >= 0 ? path.slice(questionIndex) : '';
  const normalizedPath = pathOnly.startsWith('/') ? pathOnly : `/${pathOnly}`;
  const origin = new URL(trimmedBase).origin;

  if (normalizedPath === '/api' || normalizedPath.startsWith('/api/')) {
    return `${origin}${normalizedPath}${query}`;
  }

  if (trimmedBase.endsWith('/api')) {
    return `${trimmedBase}${normalizedPath}${query}`;
  }

  return `${trimmedBase}/api${normalizedPath}${query}`;
}

function isRetryable(status: number | null): boolean {
  if (status === null) return true;
  return RETRYABLE_STATUSES.has(status);
}

function backoffDelayMs(attempt: number): number {
  const base = 200;
  const jitter = Math.random() * 100;
  return base * 2 ** attempt + jitter;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nestedErrorMessage(errorField: unknown): string | null {
  if (typeof errorField === 'string' && errorField.trim()) return errorField;
  if (errorField && typeof errorField === 'object') {
    const row = errorField as Record<string, unknown>;
    if (typeof row.message === 'string' && row.message.trim()) return row.message;
  }
  return null;
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function parseJsonRecord(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

async function readErrorMessage(response: Response): Promise<string | null> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  const body = parseJsonRecord(await readResponseText(response));
  if (!body) return null;
  if (typeof body.message === 'string' && body.message.trim()) return body.message;
  if (typeof body.detail === 'string' && body.detail.trim()) return body.detail;
  const nested = nestedErrorMessage(body.error);
  if (nested) return nested;
  return null;
}

async function readSuccessJsonBody<T>(response: Response): Promise<T | undefined> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }
  const text = await readResponseText(response);
  if (!text.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new HttpError(`Invalid JSON in response from ${response.url}.`, {
      status: response.status,
      url: response.url,
      cause: error,
    });
  }
}

async function executeRequest<T>(
  base: HttpBase,
  path: string,
  options: HttpRequestOptions,
  authRetried: boolean,
): Promise<T> {
  const baseUrl = base === 'portal' ? config.portalApiBaseUrl : config.apiBaseUrl;
  const url = resolveRequestUrl(baseUrl, path);
  const method = options.method ?? 'GET';
  const timeoutMs = options.timeoutMs ?? config.httpTimeoutMs;
  const maxRetries = options.maxRetries ?? 2;
  const useAuth = options.authenticated !== false && base === 'api';

  let lastError: HttpError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const authHeaders = useAuth ? await authService.getAuthorizationHeader() : {};

      const response = await fetch(url, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...options.headers,
          ...authHeaders,
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const apiMessage = await readErrorMessage(response);
        const httpError = new HttpError(
          apiMessage ?? `${method} ${url} failed with status ${response.status}.`,
          { status: response.status, url },
        );

        if (
          response.status === 401 &&
          useAuth &&
          !options.skipAuthRetry &&
          !authRetried
        ) {
          const refreshed = await authService.handleUnauthorized();
          if (refreshed) {
            return executeRequest<T>(base, path, options, true);
          }
          throw new SessionExpiredError();
        }

        if (attempt < maxRetries && isRetryable(response.status)) {
          lastError = httpError;
          await sleep(backoffDelayMs(attempt));
          continue;
        }
        throw httpError;
      }

      return (await readSuccessJsonBody<T>(response)) as T;
    } catch (error) {
      if (error instanceof HttpError) throw error;
      if (error instanceof SessionExpiredError) throw error;

      const isAbort = error instanceof DOMException && error.name === 'AbortError';
      const wrapped = new HttpError(
        isAbort ? `${method} ${url} timed out after ${timeoutMs}ms.` : `${method} ${url} failed.`,
        { status: null, url, cause: error },
      );

      if (attempt < maxRetries && isRetryable(null)) {
        lastError = wrapped;
        await sleep(backoffDelayMs(attempt));
        continue;
      }
      throw wrapped;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError ?? new HttpError(`${method} ${url} failed.`, { url });
}

export async function request<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
  return executeRequest<T>('api', path, options, false);
}

export async function portalRequest<T>(
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  return executeRequest<T>('portal', path, { ...options, authenticated: false }, false);
}

import { SessionExpiredError } from '../services/authService.js';
import { HttpError } from '../services/httpClient.js';

const SESSION_PREFIX = '[SESSION_EXPIRED] ';
const HTTP_PREFIX = '[HTTP_ERROR:';

export function serializeErrorForIpc(error: unknown): Error {
  if (error instanceof SessionExpiredError) {
    return new Error(`${SESSION_PREFIX}${error.message}`);
  }
  if (error instanceof HttpError) {
    const status = error.status ?? 'null';
    return new Error(`${HTTP_PREFIX}${status}] ${error.message}`);
  }
  if (error instanceof Error) {
    return new Error(error.message);
  }
  return new Error('Unknown handler error.');
}

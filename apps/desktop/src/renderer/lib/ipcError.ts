const SESSION_PREFIX = '[SESSION_EXPIRED] ';

export function stripIpcErrorPrefix(message: string): string {
  if (message.startsWith(SESSION_PREFIX)) {
    return message.slice(SESSION_PREFIX.length);
  }
  const httpMatch = /^\[HTTP_ERROR:[^\]]+\]\s*/.exec(message);
  if (httpMatch) return message.slice(httpMatch[0].length);
  return message.replace(/^Error invoking remote method '[^']+': Error: /, '').trim();
}

export function isSerializedSessionExpired(message: string): boolean {
  return message.startsWith(SESSION_PREFIX) || /session expired/i.test(message);
}

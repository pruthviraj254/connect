import type { PortalApiEnvelope } from './auth';

export function isPortalApiEnvelope(raw: unknown): raw is PortalApiEnvelope<unknown> {
  if (raw === null || typeof raw !== 'object') return false;
  const row = raw as Record<string, unknown>;
  return typeof row.success === 'boolean';
}

function envelopeErrorMessage(envelope: PortalApiEnvelope<unknown>): string {
  if (typeof envelope.message === 'string' && envelope.message.trim()) {
    return envelope.message;
  }
  if (typeof envelope.error === 'string' && envelope.error.trim()) {
    return envelope.error;
  }
  return 'Request failed.';
}

export function unwrapPortalApiBody<T>(raw: unknown): T {
  if (isPortalApiEnvelope(raw)) {
    if (!raw.success) {
      throw new Error(envelopeErrorMessage(raw));
    }
    if (raw.data === undefined) {
      throw new Error(envelopeErrorMessage(raw));
    }
    return raw.data as T;
  }
  return raw as T;
}

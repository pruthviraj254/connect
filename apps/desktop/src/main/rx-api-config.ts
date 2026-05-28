/** Baked at compile time in vite.main.config.ts (matches renderer NEXT_PUBLIC_* defaults). */
declare const __RX_API_BASE_URL__: string;
declare const __RX_INGEST_SECRET__: string;

const DEFAULT_API_BASE_URL = 'https://portal-api.myonerx.com/api';
const DEFAULT_INGEST_SECRET =
  '166be1ad06e5c1e9990ccf573143e1ebf1f47301ce45b7bb463b75be5c2a2638';

export function getRxApiBaseUrl(): string {
  if (typeof __RX_API_BASE_URL__ === 'string' && __RX_API_BASE_URL__) {
    return __RX_API_BASE_URL__;
  }
  return DEFAULT_API_BASE_URL;
}

export function getRxIngestSecret(): string {
  if (typeof __RX_INGEST_SECRET__ === 'string' && __RX_INGEST_SECRET__) {
    return __RX_INGEST_SECRET__;
  }
  return DEFAULT_INGEST_SECRET;
}

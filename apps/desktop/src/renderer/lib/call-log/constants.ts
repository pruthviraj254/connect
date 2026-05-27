/** Temporary until auth provides the logged-in user's pharmacy id. */
export const DEV_PHARMACY_ID = 'BC_00022';

/** Production API (env override: NEXT_PUBLIC_API_BASE_URL). */
export const DEFAULT_API_BASE_URL = 'https://portal-api.myonerx.com/api';

/** CDR ingest key (env override: NEXT_PUBLIC_RX_CONNECT_INGEST_SECRET). */
export const DEFAULT_RX_CONNECT_INGEST_SECRET =
  '166be1ad06e5c1e9990ccf573143e1ebf1f47301ce45b7bb463b75be5c2a2638';

export function getRxConnectIngestSecret(): string {
  return (
    process.env.NEXT_PUBLIC_RX_CONNECT_INGEST_SECRET?.trim() ||
    DEFAULT_RX_CONNECT_INGEST_SECRET
  );
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;
}

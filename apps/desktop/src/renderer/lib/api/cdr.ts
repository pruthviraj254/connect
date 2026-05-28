import {
  directionToApiValue,
  dispositionToApiStatus,
  mapCdrRowToCallLogRecord,
  type RxConnectCdrRow,
} from '@/lib/call-log/map-cdr';
import type { CallLogRecord, CdrListFilters } from '@/lib/call-log/types';
import { isSerializedSessionExpired, stripIpcErrorPrefix } from '@/lib/ipcError';
import { useAuthStore } from '@/store/authStore';

export type CdrListResult = {
  items: CallLogRecord[];
  total: number;
  page: number;
  limit: number;
};

type CdrListPayload = {
  items: RxConnectCdrRow[];
  total: number;
  page: number;
  limit: number;
};

function unwrapListPayload(body: unknown): CdrListPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Unexpected CDR list response');
  }

  let current: unknown = body;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== 'object') break;

    if ('items' in current && Array.isArray((current as CdrListPayload).items)) {
      return current as CdrListPayload;
    }

    if ('data' in current) {
      current = (current as { data: unknown }).data;
      continue;
    }

    break;
  }

  throw new Error('Could not parse CDR list from API response');
}

function assertApi(): NonNullable<typeof window.api> {
  if (!window.api?.cdr) {
    throw new Error('CDR API is only available in the Rx-Connect desktop app.');
  }
  return window.api;
}

export async function fetchPharmacyCdrs(
  pharmacyId: string,
  filters: CdrListFilters = {},
): Promise<CdrListResult> {
  const params: Record<string, string | number> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 50,
  };

  const direction = directionToApiValue(filters.direction ?? 'all');
  const status = dispositionToApiStatus(filters.disposition ?? 'all');
  const search = filters.search?.trim();

  if (direction) params.direction = direction;
  if (status) params.status = status;
  if (search) params.search = search;

  try {
    const data = await assertApi().cdr.fetchList({ pharmacyId, params });
    const payload = unwrapListPayload(data);

    return {
      items: payload.items.map(mapCdrRowToCallLogRecord),
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
    };
  } catch (error) {
    const message = stripIpcErrorPrefix(
      error instanceof Error ? error.message : 'Failed to load call records.',
    );
    if (isSerializedSessionExpired(message)) {
      await useAuthStore.getState().expireSession();
    }
    throw new Error(message);
  }
}

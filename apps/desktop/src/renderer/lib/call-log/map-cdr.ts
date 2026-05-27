import type { CallDisposition, CallLogRecord } from './types';

export type RxConnectCdrRow = {
  id: string;
  pharmacy_id: string;
  extension_number: string | null;
  caller_id: string | null;
  destination: string | null;
  call_started_at: string;
  call_ended_at: string | null;
  duration_seconds: number | null;
  direction: string;
  call_status: string;
  recording_path: string | null;
  external_call_id: string | null;
  metadata: string | null;
};

const STATUS_TO_DISPOSITION: Record<string, CallDisposition> = {
  answered: 'Answered',
  missed: 'Missed',
  failed: 'Failed',
  busy: 'Busy',
  cancelled: 'Failed',
};

function formatTimestamp(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseMetadataNotes(metadata: string | null): string | undefined {
  if (!metadata?.trim()) return undefined;
  try {
    const parsed = JSON.parse(metadata) as unknown;
    if (typeof parsed === 'object' && parsed !== null && 'notes' in parsed) {
      const notes = (parsed as { notes?: unknown }).notes;
      return typeof notes === 'string' ? notes : metadata;
    }
  } catch {
    return metadata;
  }
  return metadata;
}

export function mapCdrRowToCallLogRecord(row: RxConnectCdrRow): CallLogRecord {
  const direction = row.direction === 'outbound' ? 'out' : 'in';
  const disposition = STATUS_TO_DISPOSITION[row.call_status.toLowerCase()] ?? 'Failed';

  return {
    id: row.id,
    direction,
    from: row.caller_id ?? '—',
    to: row.destination ?? '—',
    extension: row.extension_number ?? '—',
    startedAt: formatTimestamp(row.call_started_at),
    endedAt: formatTimestamp(row.call_ended_at),
    durationSec: row.duration_seconds ?? 0,
    disposition,
    sipCallId: row.external_call_id ?? '—',
    recordingAvailable: Boolean(row.recording_path),
    notes: parseMetadataNotes(row.metadata),
  };
}

export function dispositionToApiStatus(
  disposition: CallDisposition | 'all',
): string | undefined {
  if (disposition === 'all') return undefined;
  if (disposition === 'Voicemail') return 'missed';
  return disposition.toLowerCase();
}

export function directionToApiValue(direction: 'in' | 'out' | 'all'): string | undefined {
  if (direction === 'all') return undefined;
  return direction === 'in' ? 'inbound' : 'outbound';
}

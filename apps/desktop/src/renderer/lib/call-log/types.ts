export type CallDisposition = 'Answered' | 'Missed' | 'Voicemail' | 'Busy' | 'Failed';

export type CallLogRecord = {
  id: string;
  direction: 'in' | 'out';
  from: string;
  to: string;
  extension: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  disposition: CallDisposition;
  sipCallId: string;
  recordingAvailable: boolean;
  notes?: string;
};

export type CdrListFilters = {
  page?: number;
  limit?: number;
  direction?: 'in' | 'out' | 'all';
  disposition?: CallDisposition | 'all';
  search?: string;
};

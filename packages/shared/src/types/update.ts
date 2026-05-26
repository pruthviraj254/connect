export type UpdateGateStatus =
  | 'idle'
  | 'checking'
  | 'ok'
  | 'required'
  | 'downloading'
  | 'ready'
  | 'error';

export interface UpdateGateState {
  status: UpdateGateStatus;
  currentVersion: string;
  minimumVersion: string | null;
  requiredVersion: string | null;
  message: string | null;
  progress: number | null;
  error: string | null;
  pendingVersion: string | null;
  updateReady: boolean;
  lastUpdateError: string | null;
  /** True when running a packaged build with auto-update enabled. */
  supported: boolean;
}

export interface UpdatePolicy {
  minimumVersion: string;
  message?: string;
}

/** @deprecated Use UpdateGateState */
export type UpdateStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'not-available'; version?: string }
  | { phase: 'downloading'; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string };

/** @deprecated Use UpdateGateState */
export type UpdateCapabilities = {
  supported: boolean;
  status: UpdateStatus;
};

export const UPDATE_GATE_BLOCKING_STATUSES: ReadonlySet<UpdateGateStatus> = new Set([
  'checking',
  'required',
  'downloading',
  'ready',
  'error',
]);

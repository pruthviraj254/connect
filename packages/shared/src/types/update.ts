export type UpdateStatus =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'available'; version: string }
  | { phase: 'not-available'; version?: string }
  | { phase: 'downloading'; percent: number }
  | { phase: 'downloaded'; version: string }
  | { phase: 'error'; message: string };

export type UpdateCapabilities = {
  /** True when running a packaged build with auto-update enabled (Windows or macOS). */
  supported: boolean;
  /** Current update phase from the main process (for Settings mount). */
  status: UpdateStatus;
};

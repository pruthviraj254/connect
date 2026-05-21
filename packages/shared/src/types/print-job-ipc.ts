/** One captured print job surfaced to the renderer (paths are main-process only). */
export type PrintJobRecord = {
  id: string;
  title: string;
  fileName: string;
  /** Absolute path on the machine running Electron main (not usable in renderer). */
  pdfPath: string;
  receivedAt: string;
};

export type FaxSendPayload = {
  /** E.164 or provider-specific destination */
  to: string;
  /** Caller ID / from number if required by provider */
  from?: string;
  /** Absolute path to PDF readable by main process */
  pdfPath: string;
  /** Print/fax resolution hint for provider */
  resolution?: 'standard' | 'fine' | 'superfine';
  coverSubject?: string;
  coverMessage?: string;
  /** Links send log entry to the originating print job */
  jobId?: string;
  jobTitle?: string;
};

export type FaxSendResult = {
  provider: string;
  /** Provider job / fax id when available */
  externalId?: string;
  raw?: unknown;
};

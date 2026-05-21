export type FaxSendLogStatus = 'sent' | 'failed';

export type FaxSendLogEntry = {
  id: string;
  jobId: string;
  jobTitle: string;
  pdfPath: string;
  to: string;
  from?: string;
  resolution?: string;
  coverSubject?: string;
  coverMessage?: string;
  provider: string;
  externalId?: string;
  status: FaxSendLogStatus;
  error?: string;
  sentAt: string;
};

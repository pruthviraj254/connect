export { IpcChannel } from './ipc-channels';
export type { IpcContracts, IpcRequest, IpcResponse } from './ipc/contracts';
export {
  AUTH_PLATFORM,
  isDeviceApprovalPending,
  isPortalDeviceApprovalData,
} from './domain/auth';
export type {
  AuthSession,
  AuthUser,
  DeviceApprovalPending,
  LoginCredentials,
  LoginRequest,
  LoginResult,
  PortalLoginData,
  PortalLoginResponseData,
} from './domain/auth';
export { unwrapPortalApiBody } from './domain/portalApi';
export type { IpcResult } from './types/ipc';
export type { ElectronAPI } from './types/electron-api';
export type { UpdateGateState, UpdateGateStatus, UpdatePolicy, UpdateStatus, UpdateCapabilities } from './types/update';
export { UPDATE_GATE_BLOCKING_STATUSES } from './types/update';
export type { PrintJobRecord, FaxSendPayload, FaxSendResult } from './types/print-job-ipc';
export type { FaxContact, FaxContactCreate } from './types/fax-contact';
export type { FaxSendLogEntry, FaxSendLogStatus } from './types/fax-send-log';
export type { PrinterStatus, PrinterInstallResult } from './types/printer-ipc';
export type {
  PharmacyWebsiteData,
  PharmacyService,
  TeamMember,
  Testimonial,
  DayHours,
  ThemeId,
  ThemeConfig,
  WebBuilderBuildResult,
  WebBuilderPreviewResult,
  WebBuilderPublishResult,
} from './types/website-builder';
export { THEMES, DEFAULT_SERVICES, DEFAULT_HOURS, DEFAULT_TESTIMONIALS } from './types/website-builder';
export { assertNever } from './utils/assert';

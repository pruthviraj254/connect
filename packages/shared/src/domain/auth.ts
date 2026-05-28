/**
 * Auth domain types shared between main and renderer.
 * Tokens never cross the IPC boundary.
 */

export const AUTH_PLATFORM = 'rx-connect' as const;

export interface AuthUser {
  email: string;
  role: string;
  userType: string;
  pharmacyId: string;
  pharmacyName: string;
  licenseeFirstName: string;
  licenseeLastName: string;
  licenseeEmail: string;
  mustChangePassword: boolean;
  accessToSelfAssessment: boolean;
  accessToCQIMeetings: boolean;
  accessToAllIncidents: boolean;
  accessToDocumentFolder: boolean;
}

export interface AuthSession {
  user: AuthUser;
  /** Unix epoch ms when the access token expires. */
  expiresAt: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberSession: boolean;
}

export type LoginCredentials = LoginRequest;

/** Raw login payload from portal API `data` object (tokens issued). */
export interface PortalLoginData {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  email: string;
  pharmacyId: string;
  pharmacyName: string;
  licenseeFirstName: string;
  licenseeLastName: string;
  licenseeEmail: string;
  role: string;
  userType: string;
  mustChangePassword?: boolean;
  accessToSelfAssessment?: boolean;
  accessToCQIMeetings?: boolean;
  accessToAllIncidents?: boolean;
  accessToDocumentFolder?: boolean;
}

export interface PortalDeviceApprovalData {
  device_approval_required: true;
  status: string;
  message: string;
}

export type PortalLoginResponseData = PortalLoginData | PortalDeviceApprovalData;

export interface DeviceApprovalPending {
  kind: 'device_approval_pending';
  status: string;
  message: string;
}

export type LoginResult = AuthSession | DeviceApprovalPending;

export function isDeviceApprovalPending(result: LoginResult): result is DeviceApprovalPending {
  return 'kind' in result && result.kind === 'device_approval_pending';
}

export function isPortalDeviceApprovalData(
  data: PortalLoginResponseData,
): data is PortalDeviceApprovalData {
  return 'device_approval_required' in data && data.device_approval_required === true;
}

export interface PortalApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

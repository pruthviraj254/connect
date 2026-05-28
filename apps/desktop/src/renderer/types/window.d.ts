import type { AuthSession, LoginRequest, LoginResult } from '@rx-connect/shared';

export interface ConnectApi {
  app: {
    getMachineId(): Promise<string>;
    getPlatform(): Promise<NodeJS.Platform>;
  };
  auth: {
    login(req: LoginRequest): Promise<LoginResult>;
    logout(): Promise<void>;
    getSession(): Promise<AuthSession | null>;
    getAccessToken(): Promise<string | null>;
    devSkip?(): Promise<AuthSession>;
  };
  cdr: {
    fetchList(payload: {
      pharmacyId: string;
      params: Record<string, string | number>;
    }): Promise<unknown>;
  };
}

declare global {
  interface Window {
    api: ConnectApi;
  }
}

export {};

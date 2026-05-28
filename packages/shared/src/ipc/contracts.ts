import type {
  AuthSession,
  LoginRequest,
  LoginResult,
} from '../domain/auth';
import { IpcChannel } from '../ipc-channels';

export type IpcContracts = {
  [IpcChannel.AuthLogin]: { req: LoginRequest; res: LoginResult };
  [IpcChannel.AuthLogout]: { req: void; res: void };
  [IpcChannel.AuthGetSession]: { req: void; res: AuthSession | null };
  [IpcChannel.AuthGetAccessToken]: { req: void; res: { token: string | null } };
  [IpcChannel.AuthDevSkip]: { req: void; res: AuthSession };
  [IpcChannel.AppGetMachineId]: { req: void; res: string };
  [IpcChannel.AppGetPlatform]: { req: void; res: NodeJS.Platform };
  [IpcChannel.CdrFetchList]: {
    req: { pharmacyId: string; params: Record<string, string | number> };
    res: unknown;
  };
};

export type IpcRequest<K extends keyof IpcContracts> = IpcContracts[K]['req'];
export type IpcResponse<K extends keyof IpcContracts> = IpcContracts[K]['res'];

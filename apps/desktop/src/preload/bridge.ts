import type { ipcRenderer } from 'electron';

import {
  IpcChannel,
  type AuthSession,
  type IpcChannel as IpcChannelType,
  type IpcRequest,
  type IpcResponse,
  type LoginRequest,
  type LoginResult,
} from '@rx-connect/shared';

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

type TypedChannel = keyof {
  [IpcChannel.AuthLogin]: true;
  [IpcChannel.AuthLogout]: true;
  [IpcChannel.AuthGetSession]: true;
  [IpcChannel.AuthGetAccessToken]: true;
  [IpcChannel.AuthDevSkip]: true;
  [IpcChannel.AppGetMachineId]: true;
  [IpcChannel.AppGetPlatform]: true;
  [IpcChannel.CdrFetchList]: true;
};

export function buildBridge(renderer: typeof ipcRenderer): ConnectApi {
  const invoke = <K extends TypedChannel>(
    channel: K,
    payload: IpcRequest<K>,
  ): Promise<IpcResponse<K>> => renderer.invoke(channel, payload) as Promise<IpcResponse<K>>;

  const auth: ConnectApi['auth'] = {
    login: (req) => invoke(IpcChannel.AuthLogin, req),
    logout: () => invoke(IpcChannel.AuthLogout, undefined as void),
    getSession: () => invoke(IpcChannel.AuthGetSession, undefined as void),
    getAccessToken: async () => {
      const res = await invoke(IpcChannel.AuthGetAccessToken, undefined as void);
      return res.token;
    },
  };

  auth.devSkip = () => invoke(IpcChannel.AuthDevSkip, undefined as void);

  return {
    app: {
      getMachineId: () => invoke(IpcChannel.AppGetMachineId, undefined as void),
      getPlatform: () => invoke(IpcChannel.AppGetPlatform, undefined as void),
    },
    auth,
    cdr: {
      fetchList: (payload) => invoke(IpcChannel.CdrFetchList, payload),
    },
  };
}

/** Re-export for electronAPI allowlist compatibility. */
export const typedChannels: IpcChannelType[] = [
  IpcChannel.AuthLogin,
  IpcChannel.AuthLogout,
  IpcChannel.AuthGetSession,
  IpcChannel.AuthGetAccessToken,
  IpcChannel.AuthDevSkip,
  IpcChannel.AppGetMachineId,
  IpcChannel.AppGetPlatform,
  IpcChannel.CdrFetchList,
];

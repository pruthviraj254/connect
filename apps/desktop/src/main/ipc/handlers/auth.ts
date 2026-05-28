import type { AuthSession } from '@rx-connect/shared';
import { IpcChannel } from '@rx-connect/shared';

import * as authService from '../../services/authService.js';
import { SessionExpiredError } from '../../services/authService.js';
import { config } from '../../config.js';
import { registerHandler } from '../registry.js';
import { schemas } from '../schemas.js';

export function registerAuthHandlers(): void {
  registerHandler({
    channel: IpcChannel.AuthLogin,
    schema: schemas.authLogin,
    handler: async (req) => authService.login(req),
  });

  registerHandler({
    channel: IpcChannel.AuthLogout,
    schema: schemas.authLogout,
    handler: async () => {
      await authService.logout();
    },
  });

  registerHandler({
    channel: IpcChannel.AuthGetSession,
    schema: schemas.authGetSession,
    handler: async (): Promise<AuthSession | null> => {
      const cached = authService.getCachedSession();
      if (cached) return cached;
      return authService.hydrateSession();
    },
  });

  registerHandler({
    channel: IpcChannel.AuthGetAccessToken,
    schema: schemas.authGetAccessToken,
    handler: async () => {
      const session =
        authService.getCachedSession() ?? (await authService.hydrateSession());
      if (!session) return { token: null as string | null };
      try {
        const headers = await authService.getAuthorizationHeader();
        const token = headers.Authorization?.replace(/^Bearer\s+/i, '') ?? null;
        return { token };
      } catch (error) {
        if (error instanceof SessionExpiredError) throw error;
        return { token: null as string | null };
      }
    },
  });

  if (config.devSkipAuth) {
    registerHandler({
      channel: IpcChannel.AuthDevSkip,
      schema: schemas.authDevSkip,
      handler: async () => authService.devSkipAuth(),
    });
  }
}

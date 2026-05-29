import { IpcChannel } from '@rx-connect/shared';

import { config } from '../../config.js';
import * as authService from '../../services/authService.js';
import { HttpError, request } from '../../services/httpClient.js';
import { registerHandler } from '../registry.js';
import { schemas } from '../schemas.js';

export function registerCdrHandlers(): void {
  registerHandler({
    channel: IpcChannel.CdrFetchList,
    schema: schemas.cdrFetchList,
    handler: async (payload) => {
      const path = `/api/admin/pharmacies/${encodeURIComponent(payload.pharmacyId)}/rx-connect/cdrs`;
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(payload.params)) {
        search.set(key, String(value));
      }
      const query = search.toString();
      const urlPath = query ? `${path}?${query}` : path;

      const headers: Record<string, string> = {
        'x-rx-connect-ingest-key': config.rxConnectIngestSecret,
      };

      try {
        if (!authService.isDevBypassActive()) {
          const auth = await authService.getAuthorizationHeader();
          Object.assign(headers, auth);
        }

        return await request<unknown>(urlPath, {
          method: 'GET',
          headers,
          authenticated: false,
          maxRetries: 1,
        });
      } catch (error) {
        if (error instanceof HttpError) {
          throw new Error(`[HTTP_ERROR:${error.status ?? 'null'}] ${error.message}`);
        }
        throw error;
      }
    },
  });
}

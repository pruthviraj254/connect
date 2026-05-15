import { ipcMain, safeStorage } from 'electron';
import { IpcChannel, type IpcResult } from '@rx-connect/shared';
import log from 'electron-log';

/** Secrets IPC — keytar can be wired here once native rebuild is standardized for all targets. */
export function registerSecretsHandlers(): void {
  ipcMain.handle(IpcChannel.SecretsGet, async (): Promise<IpcResult<string | null>> => {
    log.warn('Secrets get: keytar not bundled; use platform keychain integration in a follow-up.');
    return { ok: false, error: 'not_configured' };
  });

  ipcMain.handle(
    IpcChannel.SecretsSet,
    async (_e, payload: { account: string; password: string }): Promise<IpcResult<null>> => {
      if (safeStorage.isEncryptionAvailable()) {
        safeStorage.encryptString(payload.password);
        log.info(`Secrets set requested for ${payload.account} (encrypted buffer discarded — implement persistence).`);
        return { ok: true, data: null };
      }
      return { ok: false, error: 'no_secret_backend' };
    },
  );

  ipcMain.handle(IpcChannel.SecretsDelete, async (): Promise<IpcResult<null>> => ({
    ok: false,
    error: 'not_configured',
  }));
}

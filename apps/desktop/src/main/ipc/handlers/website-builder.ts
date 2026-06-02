import fs from 'node:fs';
import { ipcMain } from 'electron';
import {
  IpcChannel,
  type IpcResult,
  type PharmacyWebsiteData,
  type WebBuilderBuildResult,
  type WebBuilderPreviewResult,
  type WebBuilderPublishResult,
} from '@rx-manager/shared';
import { getStore } from '../../store.js';
import {
  canonicalLiveUrl,
  deploySite,
  getDeploySettings,
  isDeployConfigured,
  resolveProjectName,
} from '../../services/deploy-service.js';
import path from 'node:path';
import {
  buildSite,
  getPharmacySitePath,
  initPharmacySite,
  startPreviewServer,
  stopPreviewServer,
  writePharmacyData,
} from '../../services/hugo-service.js';

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data };
}

function err(message: string): IpcResult<never> {
  return { ok: false, error: message };
}

export function registerWebsiteBuilderHandlers(): void {
  ipcMain.handle(
    IpcChannel.WebBuilderInit,
    async (_e, payload: { pharmacyId: string }): Promise<IpcResult<{ sitePath: string }>> => {
      try {
        const sitePath = await initPharmacySite(payload.pharmacyId);
        return ok({ sitePath });
      } catch (e) {
        return err(e instanceof Error ? e.message : 'init_failed');
      }
    },
  );

  ipcMain.handle(
    IpcChannel.WebBuilderBuild,
    async (_e, data: PharmacyWebsiteData): Promise<IpcResult<WebBuilderBuildResult>> => {
      try {
        const sitePath = await initPharmacySite(data.pharmacyId);
        await writePharmacyData(sitePath, data);
        const result = await buildSite(sitePath);
        return ok(result);
      } catch (e) {
        return err(e instanceof Error ? e.message : 'build_failed');
      }
    },
  );

  ipcMain.handle(
    IpcChannel.WebBuilderPreview,
    async (_e, payload: { pharmacyId: string; data?: PharmacyWebsiteData }): Promise<IpcResult<WebBuilderPreviewResult>> => {
      try {
        const sitePath = await initPharmacySite(payload.pharmacyId);
        const { url, port } = await startPreviewServer(sitePath, payload.data);
        return ok({ url, port });
      } catch (e) {
        return err(e instanceof Error ? e.message : 'preview_failed');
      }
    },
  );

  ipcMain.handle(IpcChannel.WebBuilderStopPreview, async (): Promise<IpcResult<null>> => {
    stopPreviewServer();
    return ok(null);
  });

  ipcMain.handle(
    IpcChannel.WebBuilderPublish,
    async (
      _e,
      payload: {
        pharmacyId: string;
        subdomain: string;
        customDomain?: string;
        data: PharmacyWebsiteData;
      },
    ): Promise<IpcResult<WebBuilderPublishResult & { deployConfigured: boolean }>> => {
      try {
        if (!isDeployConfigured()) {
          return err('deploy_not_configured');
        }

        const sitePath = await initPharmacySite(payload.pharmacyId);
        await writePharmacyData(sitePath, {
          ...payload.data,
          subdomain: payload.subdomain,
          customDomain: payload.customDomain,
        });
        const build = await buildSite(sitePath);
        if (!build.success) {
          return err(build.buildLog || 'build_failed');
        }

        const deploy = await deploySite({
          pharmacyId: payload.pharmacyId,
          subdomain: payload.subdomain,
          customDomain: payload.customDomain,
          publicFolderPath: build.outputPath,
        });

        const store = getStore();
        const bucket = { ...store.get('websiteBuilder') };
        const saved = bucket[payload.pharmacyId] ?? payload.data;
        const projectName = resolveProjectName(payload.pharmacyId, payload.subdomain);
        const publishedUrl = canonicalLiveUrl(
          payload.subdomain,
          payload.customDomain,
          projectName,
        );
        bucket[payload.pharmacyId] = {
          ...saved,
          ...payload.data,
          subdomain: payload.subdomain,
          customDomain: payload.customDomain,
          publishedUrl,
          lastPublishedAt: new Date().toISOString(),
        };
        store.set('websiteBuilder', bucket);

        return ok({ ...deploy, liveUrl: publishedUrl, deployConfigured: true });
      } catch (e) {
        return err(e instanceof Error ? e.message : 'publish_failed');
      }
    },
  );

  ipcMain.handle(
    IpcChannel.WebBuilderSave,
    async (_e, data: PharmacyWebsiteData): Promise<IpcResult<null>> => {
      try {
        const store = getStore();
        const bucket = { ...store.get('websiteBuilder') };
        bucket[data.pharmacyId] = data;
        store.set('websiteBuilder', bucket);

        const sitePath = getPharmacySitePath(data.pharmacyId);
        if (fs.existsSync(path.join(sitePath, 'hugo.toml'))) {
          await writePharmacyData(sitePath, data);
        }
        return ok(null);
      } catch (e) {
        return err(e instanceof Error ? e.message : 'save_failed');
      }
    },
  );

  ipcMain.handle(
    IpcChannel.WebBuilderDeployConfigured,
    async (): Promise<IpcResult<ReturnType<typeof getDeploySettings>>> => {
      return ok(getDeploySettings());
    },
  );

  ipcMain.handle(
    IpcChannel.WebBuilderLoad,
    async (_e, payload: { pharmacyId: string }): Promise<IpcResult<PharmacyWebsiteData | null>> => {
      try {
        const store = getStore();
        const data = store.get('websiteBuilder')[payload.pharmacyId] ?? null;
        return ok(data);
      } catch (e) {
        return err(e instanceof Error ? e.message : 'load_failed');
      }
    },
  );

}

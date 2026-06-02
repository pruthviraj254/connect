import {
  DEFAULT_HOURS,
  DEFAULT_SERVICES,
  DEFAULT_TESTIMONIALS,
  IpcChannel,
  THEMES,
  type IpcResult,
  type PharmacyWebsiteData,
  type WebBuilderBuildResult,
  type WebBuilderPreviewResult,
  type WebBuilderPublishResult,
} from '@rx-manager/shared';
import { ipcInvoke } from '@/lib/ipc';
import { unwrapIpc } from '@/lib/ipc/unwrap';

export async function initWebsiteSite(pharmacyId: string): Promise<string> {
  const result = await ipcInvoke<IpcResult<{ sitePath: string }>>(IpcChannel.WebBuilderInit, {
    pharmacyId,
  });
  return unwrapIpc(result).sitePath;
}

export async function buildWebsite(data: PharmacyWebsiteData): Promise<WebBuilderBuildResult> {
  const result = await ipcInvoke<IpcResult<WebBuilderBuildResult>>(IpcChannel.WebBuilderBuild, data);
  return unwrapIpc(result);
}

export async function startWebsitePreview(
  pharmacyId: string,
  data?: PharmacyWebsiteData,
): Promise<WebBuilderPreviewResult> {
  const result = await ipcInvoke<IpcResult<WebBuilderPreviewResult>>(IpcChannel.WebBuilderPreview, {
    pharmacyId,
    data,
  });
  return unwrapIpc(result);
}

export async function stopWebsitePreview(): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.WebBuilderStopPreview);
  unwrapIpc(result);
}

export async function publishWebsite(params: {
  pharmacyId: string;
  subdomain: string;
  customDomain?: string;
  data: PharmacyWebsiteData;
}): Promise<WebBuilderPublishResult> {
  const result = await ipcInvoke<
    IpcResult<WebBuilderPublishResult & { deployConfigured?: boolean }>
  >(IpcChannel.WebBuilderPublish, params);
  return unwrapIpc(result);
}

export async function saveWebsiteData(data: PharmacyWebsiteData): Promise<void> {
  const result = await ipcInvoke<IpcResult<null>>(IpcChannel.WebBuilderSave, data);
  unwrapIpc(result);
}

export type DeploySettings = {
  configured: boolean;
  usePlatformDomain: boolean;
  platformDomain: string | null;
};

export async function getDeploySettings(): Promise<DeploySettings> {
  const result = await ipcInvoke<IpcResult<DeploySettings>>(IpcChannel.WebBuilderDeployConfigured);
  return unwrapIpc(result);
}

export async function isDeployConfigured(): Promise<boolean> {
  return (await getDeploySettings()).configured;
}

export async function loadWebsiteData(pharmacyId: string): Promise<PharmacyWebsiteData | null> {
  const result = await ipcInvoke<IpcResult<PharmacyWebsiteData | null>>(IpcChannel.WebBuilderLoad, {
    pharmacyId,
  });
  return unwrapIpc(result);
}

export function defaultWebsiteData(pharmacyId: string): PharmacyWebsiteData {
  const theme = THEMES[0]!;
  return {
    pharmacyId,
    theme: theme.id,
    name: 'Your Pharmacy',
    tagline: 'Your neighborhood pharmacy',
    heroHeadline: 'Focused on your health needs',
    heroSubtext:
      'Convenient, accessible care with personalized service for you and your family. Book appointments online or visit us in store.',
    primaryColor: theme.primaryColor,
    accentColor: theme.accentColor,
    phone: '',
    fax: '',
    email: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    aboutText:
      'Patient-focused independent pharmacy with the primary goal of providing the best possible care while respecting your convenience, comfort, and safety.',
    locationNote: '',
    metaDescription:
      'Independent community pharmacy focused on personalized care, vaccinations, and convenient health services.',
    heroImages: [],
    galleryImages: [],
    patientConcernsUrl: 'https://abpharmacy.ca/sites/default/files/PatientConcernPoster.pdf',
    establishedYear: new Date().getFullYear().toString(),
    hours: { ...DEFAULT_HOURS },
    services: DEFAULT_SERVICES.map((s) => ({ ...s })),
    team: [],
    testimonials: DEFAULT_TESTIMONIALS.map((t) => ({ ...t })),
    social: {},
  };
}

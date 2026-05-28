'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PharmacyWebsiteData } from '@rx-connect/shared';
import { ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isElectronApp } from '@/lib/electron';
import {
  defaultWebsiteData,
  initWebsiteSite,
  getDeploySettings,
  loadWebsiteData,
  publishWebsite,
  saveWebsiteData,
  startWebsitePreview,
  stopWebsitePreview,
} from '@/lib/website-builder';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { BuilderStepNav, type BuilderStep } from './BuilderStepNav';
import { PreviewPanel } from './PreviewPanel';
import { StepContentEditor } from './StepContentEditor';
import { StepPharmacyInfo } from './StepPharmacyInfo';
import { StepPublish } from './StepPublish';
import { StepServicesEditor } from './StepServicesEditor';
import { StepThemeSelector } from './StepThemeSelector';

const STEPS: BuilderStep[] = [
  { id: 'info', label: 'Pharmacy info', description: 'Name, contact, hours, and location' },
  { id: 'theme', label: 'Theme', description: 'Colors and visual style' },
  { id: 'content', label: 'Content', description: 'Hero, about, testimonials, licenses' },
  { id: 'services', label: 'Services', description: 'Services shown on your homepage' },
  { id: 'publish', label: 'Publish', description: 'Go live with your subdomain' },
];

type StepId = (typeof STEPS)[number]['id'];

function pharmacyIdFromEmail(email: string | null): string {
  if (email?.trim()) {
    return email.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'pharmacy';
  }
  return 'pharmacy-demo';
}

export function WebsiteBuilderView() {
  const email = useAuthStore((s) => s.session?.user.email ?? null);
  const pharmacyId = pharmacyIdFromEmail(email);

  const [step, setStep] = useState<StepId>('info');
  const [data, setData] = useState<PharmacyWebsiteData>(() => defaultWebsiteData(pharmacyId));
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [publishPhase, setPublishPhase] = useState<'idle' | 'building' | 'deploying' | 'live' | 'error'>('idle');
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [deploySettings, setDeploySettings] = useState({
    configured: false,
    usePlatformDomain: false,
    platformDomain: null as string | null,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewGenRef = useRef(0);
  const hydratedRef = useRef(false);

  const refreshPreview = useCallback(async (siteData: PharmacyWebsiteData) => {
    if (!isElectronApp()) return;

    const gen = ++previewGenRef.current;
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      await initWebsiteSite(siteData.pharmacyId);
      const { url } = await startWebsitePreview(siteData.pharmacyId, siteData);

      if (gen !== previewGenRef.current) return;

      setPreviewUrl(`${url}?t=${Date.now()}`);
    } catch (e) {
      if (gen !== previewGenRef.current) return;
      const msg = e instanceof Error ? e.message : 'preview_failed';
      setPreviewError(msg);
      setPreviewUrl(null);
    } finally {
      if (gen === previewGenRef.current) {
        setPreviewLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!isElectronApp()) return;

    void (async () => {
      try {
        const [settings] = await Promise.all([getDeploySettings(), initWebsiteSite(pharmacyId)]);
        setDeploySettings(settings);

        const saved = await loadWebsiteData(pharmacyId);
        const defaults = defaultWebsiteData(pharmacyId);
        const next = saved
          ? {
              ...defaults,
              ...saved,
              pharmacyId,
              testimonials: saved.testimonials?.length ? saved.testimonials : defaults.testimonials,
              services: saved.services?.length ? saved.services : defaults.services,
              heroImages: saved.heroImages?.length ? saved.heroImages : defaults.heroImages,
              galleryImages: saved.galleryImages?.length ? saved.galleryImages : defaults.galleryImages,
            }
          : defaults;
        setData(next);
        if (next.publishedUrl) setLiveUrl(next.publishedUrl);
        hydratedRef.current = true;
        await refreshPreview(next);
      } catch {
        toast.error('Could not load website builder.');
        hydratedRef.current = true;
      }
    })();

    return () => {
      void stopWebsitePreview();
    };
  }, [pharmacyId, refreshPreview]);

  const schedulePreview = useCallback(
    (siteData: PharmacyWebsiteData) => {
      if (!hydratedRef.current) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void refreshPreview(siteData);
      }, 800);
    },
    [refreshPreview],
  );

  const scheduleSave = useCallback((siteData: PharmacyWebsiteData) => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      void saveWebsiteData(siteData).catch(() => undefined);
    }, 400);
  }, []);

  const updateData = useCallback(
    (next: PharmacyWebsiteData) => {
      const withId = { ...next, pharmacyId };
      setData(withId);
      if (isElectronApp()) {
        scheduleSave(withId);
        schedulePreview(withId);
      }
    },
    [schedulePreview, scheduleSave, pharmacyId],
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  const onPublish = async () => {
    if (!data.subdomain?.trim()) {
      toast.error('Choose a site ID first.');
      return;
    }
    setPublishPhase('building');
    setPublishError(null);
    try {
      setPublishPhase('deploying');
      const result = await publishWebsite({
        pharmacyId: data.pharmacyId,
        subdomain: data.subdomain.trim(),
        customDomain: data.customDomain,
        data,
      });
      setLiveUrl(result.liveUrl);
      setData({
        ...data,
        publishedUrl: result.liveUrl,
        lastPublishedAt: new Date().toISOString(),
      });
      setPublishPhase('live');
      toast.success('Website published!');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'publish_failed';
      setPublishError(msg);
      setPublishPhase('error');
      toast.error(msg === 'deploy_not_configured' ? 'Publishing is not configured on this build.' : msg);
    }
  };

  if (!isElectronApp()) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <div className="max-w-md text-center space-y-3">
          <Globe className="h-12 w-12 text-teal mx-auto" />
          <h1 className="text-xl font-semibold text-navy">Website Builder</h1>
          <p className="text-sm text-muted-foreground">
            Open Rx-Connect on desktop to create and publish your pharmacy website.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-navy">Website Builder</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Build a professional pharmacy site — styled like leading MedEssist templates.
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground hidden sm:block">
            <p className="font-medium text-navy truncate max-w-[200px]">{data.name || 'Your pharmacy'}</p>
            <p>Auto-saved · Live preview on the right</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-56 shrink-0 border-r border-border bg-slate-50/80 p-4 overflow-y-auto hidden lg:block">
          <BuilderStepNav steps={STEPS} current={step} onSelect={(id) => setStep(id as StepId)} />
        </aside>

        <div className="w-full max-w-xl overflow-y-auto p-5 shrink-0 border-r border-border">
          <div className="lg:hidden mb-4 flex gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id as StepId)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  step === s.id ? 'bg-teal text-teal-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {i + 1}. {s.label}
              </button>
            ))}
          </div>

          <h2 className="text-base font-semibold text-navy mb-1">{STEPS[stepIndex]?.label}</h2>
          <p className="text-xs text-muted-foreground mb-5">{STEPS[stepIndex]?.description}</p>

          {step === 'info' && <StepPharmacyInfo data={data} onChange={updateData} />}
          {step === 'theme' && <StepThemeSelector data={data} onChange={updateData} />}
          {step === 'content' && <StepContentEditor data={data} onChange={updateData} />}
          {step === 'services' && <StepServicesEditor data={data} onChange={updateData} />}
          {step === 'publish' && (
            <StepPublish
              data={data}
              onChange={updateData}
              phase={publishPhase}
              liveUrl={liveUrl}
              error={publishError}
              onPublish={() => void onPublish()}
              deploySettings={deploySettings}
            />
          )}

          <div className="flex gap-2 mt-8 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => setStep(STEPS[stepIndex - 1]!.id as StepId)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button
              type="button"
              className="bg-teal text-teal-foreground ml-auto"
              disabled={stepIndex >= STEPS.length - 1}
              onClick={() => setStep(STEPS[stepIndex + 1]!.id as StepId)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        <PreviewPanel
          previewUrl={previewUrl}
          loading={previewLoading}
          error={previewError}
          onRefresh={() => void refreshPreview(data)}
        />
      </div>
    </div>
  );
}

export default WebsiteBuilderView;

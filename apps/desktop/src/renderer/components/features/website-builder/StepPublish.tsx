'use client';

import type { PharmacyWebsiteData } from '@rx-manager/shared';
import { ExternalLink, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DeploySettings } from '@/lib/website-builder';
import { FormSection } from './FormSection';

type PublishPhase = 'idle' | 'building' | 'deploying' | 'live' | 'error';

type Props = {
  data: PharmacyWebsiteData;
  onChange: (data: PharmacyWebsiteData) => void;
  phase: PublishPhase;
  liveUrl: string | null;
  error: string | null;
  onPublish: () => void;
  deploySettings: DeploySettings;
};

function siteSlugSuffix(slug: string, settings: DeploySettings): string {
  if (settings.usePlatformDomain && settings.platformDomain) {
    return `${slug}.${settings.platformDomain}`;
  }
  return `rx-${slug || 'yoursite'}.vercel.app`;
}

export function StepPublish({
  data,
  onChange,
  phase,
  liveUrl,
  error,
  onPublish,
  deploySettings,
}: Props) {
  const slug = data.subdomain?.trim() ?? '';
  const previewHost = slug ? siteSlugSuffix(slug, deploySettings) : '…';

  return (
    <div className="space-y-5">
      <FormSection
        title="Your web address"
        description="Pick a short site ID. Republishing keeps the same URL when this ID stays the same."
      >
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-2">
          <p className="font-medium text-navy">How domains work</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Default (no OneRx domain needed):</strong> Vercel hosts at{' '}
              <code className="text-xs bg-white px-1 rounded">https://rx-yourid.vercel.app</code>
            </li>
            <li>
              <strong>Custom domain (pharmacyname.ca):</strong> Pharmacy buys the domain; after publish add CNAME →{' '}
              <code className="text-xs">cname.vercel-dns.com</code> at their registrar.
            </li>
            <li>
              <strong>Platform subdomain (later):</strong> If OneRx owns e.g. rxsites.com on Vercel, ops enables
              platform mode for <code className="text-xs">yourid.rxsites.com</code>.
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wb-subdomain">Site ID</Label>
          <Input
            id="wb-subdomain"
            placeholder="greenhealth"
            value={data.subdomain ?? ''}
            onChange={(e) =>
              onChange({
                ...data,
                subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
              })
            }
          />
          <p className="text-xs text-muted-foreground">
            Live URL: <span className="font-mono text-navy">https://{previewHost}</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wb-custom-domain">Custom domain (optional)</Label>
          <Input
            id="wb-custom-domain"
            placeholder="www.yourpharmacy.ca"
            value={data.customDomain ?? ''}
            onChange={(e) => onChange({ ...data, customDomain: e.target.value })}
          />
        </div>
      </FormSection>

      {!deploySettings.configured && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-4">
          Missing VERCEL_API_TOKEN in .env — preview works, publish does not.
        </p>
      )}

      <FormSection title="Go live">
        {phase === 'building' && <p className="text-sm text-muted-foreground">Building your site…</p>}
        {phase === 'deploying' && (
          <p className="text-sm text-muted-foreground">
            Deploying to Vercel… Usually under a minute (60s timeout if stuck).
          </p>
        )}
        {phase === 'live' && liveUrl && (
          <div className="rounded-lg border border-teal/30 bg-teal/5 p-4 space-y-2">
            <p className="font-medium text-navy flex items-center gap-2">
              <Rocket className="h-4 w-4 text-teal" />
              Your site is live
            </p>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal underline text-sm inline-flex items-center gap-1 break-all"
            >
              {liveUrl}
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}

        <p className="text-xs text-muted-foreground">
          Republishing updates the same address — keep the same site ID.
        </p>

        <Button
          type="button"
          className="w-full bg-teal text-teal-foreground"
          disabled={!slug || phase === 'building' || phase === 'deploying' || !deploySettings.configured}
          onClick={onPublish}
        >
          {phase === 'building' || phase === 'deploying' ? 'Publishing…' : 'Publish website'}
        </Button>

        {data.publishedUrl && phase === 'idle' && (
          <p className="text-xs text-muted-foreground">
            Last published: {data.lastPublishedAt ? new Date(data.lastPublishedAt).toLocaleString() : '—'} ·{' '}
            <a href={data.publishedUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">
              {data.publishedUrl}
            </a>
          </p>
        )}
      </FormSection>
    </div>
  );
}
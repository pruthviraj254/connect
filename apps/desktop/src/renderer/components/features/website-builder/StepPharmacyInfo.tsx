'use client';

import type { PharmacyWebsiteData } from '@rx-connect/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormSection } from './FormSection';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

type Props = {
  data: PharmacyWebsiteData;
  onChange: (data: PharmacyWebsiteData) => void;
};

export function StepPharmacyInfo({ data, onChange }: Props) {
  const patch = (partial: Partial<PharmacyWebsiteData>) => onChange({ ...data, ...partial });

  return (
    <div className="space-y-5">
      <FormSection title="Business identity" description="Shown in the header, hero, and footer of your site.">
        <div className="space-y-2">
          <Label htmlFor="wb-name">Pharmacy name</Label>
          <Input id="wb-name" value={data.name} onChange={(e) => patch({ name: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-tagline">Short tagline</Label>
          <Input
            id="wb-tagline"
            placeholder="Your neighborhood pharmacy & travel clinic"
            value={data.tagline}
            onChange={(e) => patch({ tagline: e.target.value })}
          />
        </div>
        <div  className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wb-logo">Header logo URL</Label>
            <Input
              id="wb-logo"
              placeholder="https://…/logo-horizontal.png"
              value={data.logoUrl ?? ''}
              onChange={(e) => patch({ logoUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wb-footer-logo">Footer logo URL</Label>
            <Input
              id="wb-footer-logo"
              placeholder="https://…/logo-vertical.png"
              value={data.footerLogoUrl ?? ''}
              onChange={(e) => patch({ footerLogoUrl: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wb-established">Serving since (year)</Label>
            <Input
              id="wb-established"
              placeholder="2021"
              value={data.establishedYear ?? ''}
              onChange={(e) => patch({ establishedYear: e.target.value })}
            />
          </div>
        </div>
      </FormSection>

      <FormSection title="Contact details" description="Displayed in the top bar and footer.">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wb-phone">Phone</Label>
            <Input id="wb-phone" placeholder="780-555-1234" value={data.phone} onChange={(e) => patch({ phone: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wb-fax">Fax</Label>
            <Input id="wb-fax" value={data.fax ?? ''} onChange={(e) => patch({ fax: e.target.value })} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-email">Email</Label>
          <Input id="wb-email" type="email" value={data.email} onChange={(e) => patch({ email: e.target.value })} />
        </div>
      </FormSection>

      <FormSection title="Location">
        <div className="space-y-2">
          <Label htmlFor="wb-address">Street address</Label>
          <Input id="wb-address" value={data.address} onChange={(e) => patch({ address: e.target.value })} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wb-city">City</Label>
            <Input id="wb-city" value={data.city} onChange={(e) => patch({ city: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wb-province">Province</Label>
            <Input id="wb-province" value={data.province} onChange={(e) => patch({ province: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wb-postal">Postal code</Label>
            <Input id="wb-postal" value={data.postalCode} onChange={(e) => patch({ postalCode: e.target.value })} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Opening hours" description="Matches the hours table in your site footer.">
        <div className="space-y-2">
          {DAYS.map((day) => {
            const h = data.hours[day] ?? { open: '9:00 AM', close: '6:00 PM', closed: false };
            return (
              <div key={day} className="flex items-center gap-2 text-sm rounded-lg bg-muted/30 px-2 py-1.5">
                <span className="w-20 capitalize font-medium text-navy">{day.slice(0, 3)}</span>
                <Switch
                  checked={!h.closed}
                  onCheckedChange={(on) =>
                    patch({
                      hours: {
                        ...data.hours,
                        [day]: { ...h, closed: !on },
                      },
                    })
                  }
                />
                {!h.closed ? (
                  <>
                    <Input
                      className="h-8 flex-1"
                      value={h.open}
                      onChange={(e) =>
                        patch({
                          hours: { ...data.hours, [day]: { ...h, open: e.target.value } },
                        })
                      }
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      className="h-8 flex-1"
                      value={h.close}
                      onChange={(e) =>
                        patch({
                          hours: { ...data.hours, [day]: { ...h, close: e.target.value } },
                        })
                      }
                    />
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">Closed</span>
                )}
              </div>
            );
          })}
        </div>
      </FormSection>
    </div>
  );
}

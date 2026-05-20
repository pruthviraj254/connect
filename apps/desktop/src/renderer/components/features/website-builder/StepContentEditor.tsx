'use client';

import type { PharmacyWebsiteData, TeamMember, Testimonial } from '@rx-connect/shared';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormSection } from './FormSection';
import { UrlListField } from './UrlListField';

type Props = {
  data: PharmacyWebsiteData;
  onChange: (data: PharmacyWebsiteData) => void;
};

export function StepContentEditor({ data, onChange }: Props) {
  const patch = (partial: Partial<PharmacyWebsiteData>) => onChange({ ...data, ...partial });

  const testimonials = data.testimonials ?? [];

  const updateTestimonial = (index: number, item: Testimonial) => {
    const next = [...testimonials];
    next[index] = item;
    patch({ testimonials: next });
  };

  const updateTeam = (index: number, member: TeamMember) => {
    const team = [...data.team];
    team[index] = member;
    patch({ team });
  };

  return (
    <div className="space-y-5">
      <FormSection title="Homepage hero" description="Large headline and intro text on your homepage.">
        <div className="space-y-2">
          <Label htmlFor="wb-hero-headline">Headline</Label>
          <Input
            id="wb-hero-headline"
            placeholder="Focused on your health needs"
            value={data.heroHeadline ?? ''}
            onChange={(e) => patch({ heroHeadline: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-hero-sub">Hero description</Label>
          <textarea
            id="wb-hero-sub"
            className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Convenient, accessible care with personalized service…"
            value={data.heroSubtext ?? ''}
            onChange={(e) => patch({ heroSubtext: e.target.value })}
          />
        </div>
        <UrlListField
          label="Hero carousel images"
          hint="Up to 4 image URLs for the homepage carousel."
          urls={data.heroImages ?? []}
          max={4}
          onChange={(heroImages) => patch({ heroImages: heroImages.filter(Boolean) })}
        />
      </FormSection>

      <FormSection title="Welcome section" description="Shown below the hero with a link to your About page.">
        <div className="space-y-2">
          <Label htmlFor="wb-meta">SEO description</Label>
          <textarea
            id="wb-meta"
            className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={data.metaDescription ?? ''}
            onChange={(e) => patch({ metaDescription: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-about">About your pharmacy</Label>
          <textarea
            id="wb-about"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={data.aboutText ?? ''}
            onChange={(e) => patch({ aboutText: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-location-note">Location note</Label>
          <Input
            id="wb-location-note"
            placeholder="e.g. Located next to Southwell Medical Centre"
            value={data.locationNote ?? ''}
            onChange={(e) => patch({ locationNote: e.target.value })}
          />
        </div>
      </FormSection>

      <FormSection title="Testimonials" description="Patient reviews displayed on the homepage.">
        <div className="space-y-3">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs text-muted-foreground">Review {i + 1}</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={t.enabled}
                    onCheckedChange={(enabled) => updateTestimonial(i, { ...t, enabled })}
                  />
                  <span className="text-xs text-muted-foreground">{t.enabled ? 'Show' : 'Hidden'}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => patch({ testimonials: testimonials.filter((_, j) => j !== i) })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <textarea
                className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Quote"
                value={t.quote}
                onChange={(e) => updateTestimonial(i, { ...t, quote: e.target.value })}
              />
              <Input
                placeholder="Author name"
                value={t.author}
                onChange={(e) => updateTestimonial(i, { ...t, author: e.target.value })}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() =>
              patch({
                testimonials: [...testimonials, { quote: '', author: '', enabled: true }],
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            Add testimonial
          </Button>
        </div>
      </FormSection>

      <FormSection title="Photo gallery" description="Optional scrolling gallery above the map (interior, shelves, team photos).">
        <UrlListField
          label="Gallery image URLs"
          urls={data.galleryImages ?? []}
          max={12}
          onChange={(galleryImages) => patch({ galleryImages: galleryImages.filter(Boolean) })}
        />
      </FormSection>

      <FormSection title="Licenses & compliance">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="wb-pharm-license">Pharmacy license #</Label>
            <Input
              id="wb-pharm-license"
              value={data.pharmacyLicense ?? ''}
              onChange={(e) => patch({ pharmacyLicense: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wb-rph-license">Pharmacist license #</Label>
            <Input
              id="wb-rph-license"
              value={data.pharmacistLicense ?? ''}
              onChange={(e) => patch({ pharmacistLicense: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-license-pdf">Pharmacy license PDF URL</Label>
          <Input
            id="wb-license-pdf"
            placeholder="https://…/license.pdf"
            value={data.pharmacyLicensePdfUrl ?? ''}
            onChange={(e) => patch({ pharmacyLicensePdfUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-patient-concerns">Patient concerns link</Label>
          <Input
            id="wb-patient-concerns"
            value={data.patientConcernsUrl ?? ''}
            onChange={(e) => patch({ patientConcernsUrl: e.target.value })}
          />
        </div>
      </FormSection>

      <FormSection title="Integrations" description="Optional embeds for maps and online booking.">
        <div className="space-y-2">
          <Label htmlFor="wb-maps">Google Maps embed URL</Label>
          <Input
            id="wb-maps"
            placeholder="https://www.google.com/maps/embed?pb=..."
            value={data.googleMapsEmbedUrl ?? ''}
            onChange={(e) => patch({ googleMapsEmbedUrl: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="wb-booking">Online booking URL</Label>
          <Input
            id="wb-booking"
            placeholder="https://your-booking-provider.com/..."
            value={data.bookingEmbedUrl ?? ''}
            onChange={(e) => patch({ bookingEmbedUrl: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Powers the “Book an appointment” button in the hero.</p>
        </div>
      </FormSection>

      <FormSection title="Team (optional)">
        <div className="space-y-3">
          {data.team.map((member, i) => (
            <div key={i} className="border rounded-lg p-3 space-y-2 bg-muted/20">
              <Input
                placeholder="Name"
                value={member.name}
                onChange={(e) => updateTeam(i, { ...member, name: e.target.value })}
              />
              <Input
                placeholder="Role"
                value={member.role}
                onChange={(e) => updateTeam(i, { ...member, role: e.target.value })}
              />
              <Input
                placeholder="Bio (optional)"
                value={member.bio ?? ''}
                onChange={(e) => updateTeam(i, { ...member, bio: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => patch({ team: data.team.filter((_, j) => j !== i) })}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => patch({ team: [...data.team, { name: '', role: '', bio: '' }] })}
          >
            Add team member
          </Button>
        </div>
      </FormSection>

      <FormSection title="Social links">
        <Input
          placeholder="Facebook URL"
          value={data.social.facebook ?? ''}
          onChange={(e) => patch({ social: { ...data.social, facebook: e.target.value } })}
        />
        <Input
          placeholder="Instagram URL"
          value={data.social.instagram ?? ''}
          onChange={(e) => patch({ social: { ...data.social, instagram: e.target.value } })}
        />
      </FormSection>
    </div>
  );
}

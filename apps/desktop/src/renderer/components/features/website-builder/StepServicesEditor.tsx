'use client';

import type { PharmacyWebsiteData } from '@rx-manager/shared';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { FormSection } from './FormSection';

type Props = {
  data: PharmacyWebsiteData;
  onChange: (data: PharmacyWebsiteData) => void;
};

export function StepServicesEditor({ data, onChange }: Props) {
  const updateService = (index: number, partial: Partial<(typeof data.services)[0]>) => {
    const services = [...data.services];
    services[index] = { ...services[index]!, ...partial };
    onChange({ ...data, services });
  };

  const enabledCount = data.services.filter((s) => s.enabled).length;

  return (
    <FormSection
      title="Homepage services"
      description={`${enabledCount} of ${data.services.length} shown on your homepage grid.`}
    >
      <div className="space-y-3">
        {data.services.map((service, i) => (
          <div
            key={i}
            className={`flex gap-3 items-start rounded-lg border p-3 transition-colors ${
              service.enabled ? 'border-teal/30 bg-teal/5' : 'border-border bg-muted/20 opacity-80'
            }`}
          >
            <Switch
              checked={service.enabled}
              onCheckedChange={(enabled) => updateService(i, { enabled })}
            />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex gap-2">
                <Input
                  className="w-14 text-center"
                  value={service.icon}
                  onChange={(e) => updateService(i, { icon: e.target.value })}
                  aria-label="Icon"
                />
                <Input
                  value={service.title}
                  onChange={(e) => updateService(i, { title: e.target.value })}
                />
              </div>
              <Input
                value={service.description}
                onChange={(e) => updateService(i, { description: e.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </FormSection>
  );
}

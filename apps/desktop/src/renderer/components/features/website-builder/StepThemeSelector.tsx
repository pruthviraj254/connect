'use client';

import { THEMES, type PharmacyWebsiteData, type ThemeId } from '@rx-manager/shared';
import { ThemeCard } from './ThemeCard';

type Props = {
  data: PharmacyWebsiteData;
  onChange: (data: PharmacyWebsiteData) => void;
};

export function StepThemeSelector({ data, onChange }: Props) {
  const select = (id: ThemeId) => {
    const theme = THEMES.find((t) => t.id === id);
    onChange({
      ...data,
      theme: id,
      primaryColor: theme?.primaryColor ?? data.primaryColor,
      accentColor: theme?.accentColor ?? data.accentColor,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
      {THEMES.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} selected={data.theme === theme.id} onSelect={select} />
      ))}
    </div>
  );
}

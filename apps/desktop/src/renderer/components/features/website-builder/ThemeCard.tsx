'use client';

import type { ThemeConfig, ThemeId } from '@rx-manager/shared';
import { cn } from '@/lib/utils';

type Props = {
  theme: ThemeConfig;
  selected: boolean;
  onSelect: (id: ThemeId) => void;
};

export function ThemeCard({ theme, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme.id)}
      className={cn(
        'text-left rounded-lg border-2 p-4 transition-all hover:shadow-md w-full',
        selected ? 'border-teal ring-2 ring-teal/30' : 'border-border',
      )}
    >
      <div
        className="h-16 rounded-md mb-3"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`,
        }}
      />
      <h3 className="font-semibold text-navy">{theme.name}</h3>
      <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
      <p className="text-xs mt-2">
        <span className="font-medium">{theme.mood}</span> · {theme.bestFor}
      </p>
    </button>
  );
}

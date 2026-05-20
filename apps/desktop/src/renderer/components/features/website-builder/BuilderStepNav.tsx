'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BuilderStep = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  steps: BuilderStep[];
  current: string;
  onSelect: (id: string) => void;
};

export function BuilderStepNav({ steps, current, onSelect }: Props) {
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <nav className="flex flex-col gap-1" aria-label="Website builder steps">
      {steps.map((step, index) => {
        const done = index < currentIndex;
        const active = step.id === current;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(step.id)}
            className={cn(
              'flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors w-full',
              active && 'bg-teal/10 border border-teal/30',
              !active && 'hover:bg-muted/60 border border-transparent',
            )}
          >
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
                active && 'bg-teal text-teal-foreground',
                done && !active && 'bg-teal/20 text-teal',
                !active && !done && 'bg-muted text-muted-foreground',
              )}
            >
              {done && !active ? <Check className="h-4 w-4" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span className={cn('block text-sm font-medium', active && 'text-navy')}>{step.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.description}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}

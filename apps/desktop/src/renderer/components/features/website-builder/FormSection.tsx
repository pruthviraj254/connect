'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function FormSection({ title, description, children, className }: Props) {
  return (
    <section className={cn('rounded-xl border border-border bg-card p-5 shadow-sm space-y-4', className)}>
      <div>
        <h3 className="text-sm font-semibold text-navy">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

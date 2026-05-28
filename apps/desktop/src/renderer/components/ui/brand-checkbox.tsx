'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface BrandCheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const BrandCheckbox = forwardRef<HTMLInputElement, BrandCheckboxProps>(
  ({ label, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <label
        htmlFor={inputId}
        className={[
          'flex cursor-pointer select-none items-center gap-2.5 text-sm text-warm-700',
          className,
        ].join(' ')}
      >
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className="h-4 w-4 rounded border-warm-300 text-terra-600 focus:ring-terra-200"
          {...props}
        />
        {label}
      </label>
    );
  },
);

BrandCheckbox.displayName = 'BrandCheckbox';

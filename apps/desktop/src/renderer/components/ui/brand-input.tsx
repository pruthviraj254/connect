'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

export interface BrandInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const BrandInput = forwardRef<HTMLInputElement, BrandInputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id ?? props.name;
    const hasError = Boolean(error);

    return (
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="block text-xs font-medium text-warm-600">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          className={[
            'w-full rounded-md border bg-white px-4 py-2.5 text-sm text-warm-900',
            'placeholder:text-warm-400 transition-colors duration-200',
            'focus:outline-none focus:border-terra-500 focus:ring-2 focus:ring-terra-100',
            hasError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
              : 'border-warm-200 hover:border-warm-300',
            className,
          ].join(' ')}
          {...props}
        />
        {hint && !error ? (
          <p id={`${inputId}-hint`} className="text-xs text-warm-500">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);

BrandInput.displayName = 'BrandInput';

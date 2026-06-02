import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Shell from '@/components/layout/Shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

describe('Shell', () => {
  it('renders children', () => {
    render(
      <Shell>
        <p>child</p>
      </Shell>,
    );
    expect(screen.getByText('child')).toBeInTheDocument();
  });

  it('renders Rx-Connect group with Dashboard child link', () => {
    render(
      <Shell>
        <p>child</p>
      </Shell>,
    );
    expect(screen.getByRole('button', { name: /Rx-Connect/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
  });
});

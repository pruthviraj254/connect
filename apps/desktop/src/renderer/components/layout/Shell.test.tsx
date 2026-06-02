import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Shell from '@/components/layout/Shell';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home/',
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

vi.mock('@/store/ui.store', () => ({
  useUiStore: (selector: (state: { sidebarCollapsed: boolean; setSidebarCollapsed: () => void }) => unknown) =>
    selector({ sidebarCollapsed: false, setSidebarCollapsed: vi.fn() }),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: unknown }) => children,
  Tooltip: ({ children }: { children: unknown }) => children,
  TooltipTrigger: ({ children }: { children: unknown }) => children,
  TooltipContent: ({ children }: { children: unknown }) => children,
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

  it('renders Rx-Connect section with Dashboard link', () => {
    render(
      <Shell>
        <p>child</p>
      </Shell>,
    );
    expect(screen.getByText('Rx-Connect')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dashboard/i })).toBeInTheDocument();
  });

  it('renders user profile in sidebar footer', () => {
    render(
      <Shell>
        <p>child</p>
      </Shell>,
    );
    expect(screen.getByLabelText('Account menu')).toBeInTheDocument();
  });
});

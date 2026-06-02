import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginForm } from '@/components/auth/LoginForm';

const motionPassthrough = (tag: keyof JSX.IntrinsicElements) =>
  function MotionStub({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) {
    return React.createElement(tag, props, children);
  };

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, prop: string) => motionPassthrough(prop as keyof JSX.IntrinsicElements),
    },
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    login: vi.fn(),
    skipLogin: vi.fn(),
    clearError: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { error: string | null }) => unknown) =>
    selector({ error: null }),
}));

describe('LoginForm', () => {
  it('renders Rx-Manager branding', () => {
    render(<LoginForm />);
    expect(screen.getByRole('heading', { name: /Rx-Manager/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
  });
});

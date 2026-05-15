import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ForgotPasswordForm from '@/components/features/auth/ForgotPasswordForm';

describe('ForgotPasswordForm', () => {
  it('renders email field', () => {
    render(<ForgotPasswordForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});

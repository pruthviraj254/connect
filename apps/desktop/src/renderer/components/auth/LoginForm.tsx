'use client';

import { FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { OneRxLogo } from '@/components/auth/OneRxLogo';
import { FORGOT_PASSWORD_URL, PRIVACY_URL } from '@/components/auth/loginConstants';
import { LoginSubmitButton } from '@/components/auth/LoginSubmitButton';
import { BrandCheckbox } from '@/components/ui/brand-checkbox';
import { BrandInput } from '@/components/ui/brand-input';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { formatAuthError, isDeviceApprovalPending, loginSuccessMessage } from '@/services/auth';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ease = [0.22, 1, 0.36, 1] as const;
const devSkipEnabled = process.env.NEXT_PUBLIC_RX_CONNECT_DEV_SKIP_AUTH === 'true';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.14 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease },
  },
};

export function LoginForm() {
  const router = useRouter();
  const { login, devSkip, clearError, isLoading } = useAuth();
  const sessionExpiredMessage = useAuthStore((s) => s.error);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberSession, setRememberSession] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  function validate(): boolean {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!emailPattern.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    clearError();

    if (!validate()) {
      toast.warning('Please enter a valid email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login({ email, password, rememberSession });
      if (isDeviceApprovalPending(result)) {
        router.replace('/login/device-pending/');
        return;
      }
      toast.success(loginSuccessMessage(result));
      router.replace('/home/');
    } catch (err) {
      toast.error(formatAuthError(err, 'Sign in failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevSkip() {
    if (!window.api?.auth?.devSkip) return;
    setSubmitting(true);
    try {
      const session = await devSkip();
      toast.success(loginSuccessMessage(session));
      router.replace('/home/');
    } catch (err) {
      toast.error(formatAuthError(err, 'Could not enter developer mode.'));
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || isLoading;

  useEffect(() => {
    if (!sessionExpiredMessage) return;
    toast.warning(sessionExpiredMessage);
    clearError();
  }, [sessionExpiredMessage, clearError]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.58, ease, delay: 0.1 }}
      className="login-glass-card login-glass-card--premium relative z-10 w-full"
    >
      <div className="login-card-inner-glow pointer-events-none" aria-hidden />
      <div className="login-card-edge-light pointer-events-none" aria-hidden />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative px-8 py-9 sm:px-9 sm:py-10"
      >
        <motion.header variants={item} className="space-y-6">
          <OneRxLogo size="md" />
          <motion.div className="space-y-2.5">
            <h1 className="login-title font-display text-[1.8125rem] font-semibold leading-[1.15] tracking-[-0.02em] text-warm-900">
              Rx-Connect
            </h1>
            <p className="login-subtitle max-w-[36ch] text-[15px] leading-[1.55] text-warm-600">
              Operator portal for OneRx pharmacy VoIP and fax management.
            </p>
          </motion.div>
        </motion.header>

        <form onSubmit={handleSubmit} className="mt-8 space-y-[1.375rem]" noValidate>
          <motion.div
            variants={item}
            className={
              focusedField === 'email' ? 'login-field-wrap login-field-wrap--focus' : 'login-field-wrap'
            }
          >
            <BrandInput
              name="email"
              type="email"
              autoComplete="email"
              label="Email"
              placeholder="you@pharmacy.ca"
              value={email}
              disabled={busy}
              error={fieldErrors.email}
              className="login-input"
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField((f) => (f === 'email' ? null : f))}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
          </motion.div>

          <motion.div
            variants={item}
            className={[
              'login-field-wrap relative',
              focusedField === 'password' ? 'login-field-wrap--focus' : '',
            ].join(' ')}
          >
            <BrandInput
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              disabled={busy}
              error={fieldErrors.password}
              className="login-input pr-12"
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField((f) => (f === 'password' ? null : f))}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <motion.button
              type="button"
              className="login-password-toggle absolute right-3 top-[38px] rounded-md p-1.5 text-warm-500"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <motion.span
                key={showPassword ? 'hide' : 'show'}
                initial={{ opacity: 0, rotate: -8 }}
                animate={{ opacity: 1, rotate: 0 }}
                transition={{ duration: 0.2 }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </motion.span>
            </motion.button>
          </motion.div>

          <motion.div
            variants={item}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 pt-0.5"
          >
            <BrandCheckbox
              name="remember"
              label="Remember this session"
              checked={rememberSession}
              disabled={busy}
              onChange={(e) => setRememberSession(e.target.checked)}
            />
            <Link
              href={FORGOT_PASSWORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="login-forgot-link text-[13px] font-medium text-terra-600"
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.div variants={item} className="pt-1">
            <LoginSubmitButton busy={busy} />
          </motion.div>

          {devSkipEnabled && typeof window !== 'undefined' && window.api?.auth?.devSkip ? (
            <motion.div variants={item} className="pt-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleDevSkip()}
                className="w-full rounded-md border border-dashed border-warm-300 px-4 py-2 text-xs font-medium text-warm-600 transition-colors hover:border-terra-400 hover:text-terra-700 disabled:opacity-50"
              >
                Developer: Continue without sign-in
              </button>
            </motion.div>
          ) : null}
        </form>

        <motion.footer
          variants={item}
          className="login-secure-note mt-8 border-t border-warm-200/50 pt-7"
        >
          <div className="flex items-start gap-2.5">
            <span className="login-secure-icon mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-terra-50 text-terra-600">
              <Lock className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden />
            </span>
            <p className="text-left text-[11.5px] leading-[1.55] text-warm-500">
              Protected &amp; secure healthcare platform. Session data is encrypted and stored
              locally on this workstation.
            </p>
          </div>
          <div className="mt-3.5 flex items-center justify-center">
            <Link
              href={PRIVACY_URL}
              className="login-privacy-link text-[11.5px] font-medium text-terra-600"
            >
              Privacy &amp; Trust Statement
            </Link>
          </div>
        </motion.footer>
      </motion.div>
    </motion.div>
  );
}

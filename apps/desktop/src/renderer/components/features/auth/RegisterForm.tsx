'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/auth.store';
import { isElectronApp, registerWithTempDb } from '@/lib/auth/auth-actions';

const schema = z
  .object({
    displayName: z.string().min(1, 'Name is required').max(120),
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

function mapRegisterError(message: string): string {
  if (message === 'email_taken') {
    return 'An account with this email already exists.';
  }
  if (message === 'invalid_payload') {
    return 'Something went wrong. Try again.';
  }
  return 'Could not create account. Try again.';
}

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [busy, setBusy] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isElectronApp()) {
      toast.error('Create an account from the Rx-Connect desktop app (Electron).');
      return;
    }
    setBusy(true);
    try {
      const data = await registerWithTempDb({
        email: values.email,
        password: values.password,
        displayName: values.displayName,
      });
      setSession({
        token: data.token,
        email: data.email,
        displayName: data.displayName,
      });
      toast.success('Account created — you are signed in');
      void router.replace('/home/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      toast.error(mapRegisterError(msg));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-navy">Create account</CardTitle>
        <CardDescription>
          In-memory demo: new accounts live in RAM until you quit the app. Seeded accounts cannot be re-registered with
          the same email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              type="text"
              autoComplete="name"
              {...form.register('displayName')}
            />
            {form.formState.errors.displayName && (
              <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-sm text-destructive">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-teal text-teal-foreground hover:bg-teal/90"
            disabled={busy}
          >
            {busy ? 'Creating account…' : 'Create account'}
          </Button>
          <div className="text-center text-sm">
            <Link href="/login/" className="text-teal hover:underline">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default RegisterForm;

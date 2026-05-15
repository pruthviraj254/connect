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
import { isElectronApp, loginWithTempDb } from '@/lib/auth/auth-actions';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormValues = z.infer<typeof schema>;

function mapLoginError(message: string): string {
  if (message === 'invalid_credentials') {
    return 'Invalid email or password.';
  }
  if (message === 'invalid_payload') {
    return 'Something went wrong. Try again.';
  }
  return 'Sign-in failed. Try again.';
}

export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [busy, setBusy] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isElectronApp()) {
      toast.error('Sign in from the Rx-Connect desktop app (Electron).');
      return;
    }
    setBusy(true);
    try {
      const data = await loginWithTempDb({ email: values.email, password: values.password });
      setSession({
        token: data.token,
        email: data.email,
        displayName: data.displayName,
      });
      toast.success('Signed in');
      void router.replace('/home/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      toast.error(mapLoginError(msg));
    } finally {
      setBusy(false);
    }
  });

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-navy">Sign in</CardTitle>
        <CardDescription>
          Use your OneRx operator credentials. In-memory demo:{' '}
          <span className="font-mono text-xs">admin@onerx.health</span> /{' '}
          <span className="font-mono text-xs">Operator123!</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...form.register('password')} />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-teal text-teal-foreground hover:bg-teal/90"
            disabled={busy}
          >
            {busy ? 'Signing in…' : 'Continue'}
          </Button>
          <div className="text-center text-sm space-y-2">
            <div>
              <Link href="/forgot-password/" className="text-teal hover:underline">
                Forgot password?
              </Link>
            </div>
            <div>
              <Link href="/register/" className="text-teal hover:underline">
                Create an account
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default LoginForm;

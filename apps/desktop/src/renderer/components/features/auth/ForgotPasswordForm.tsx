'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isElectronApp, requestPasswordResetWithTempDb } from '@/lib/auth/auth-actions';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [busy, setBusy] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    if (!isElectronApp()) {
      toast.error('Reset password from the Rx-Connect desktop app (Electron).');
      return;
    }
    setBusy(true);
    try {
      const data = await requestPasswordResetWithTempDb(values.email);
      toast.success(data.message);
      if (data.devTemporaryPassword) {
        toast.success(`Temporary password: ${data.devTemporaryPassword}`, { duration: 20_000 });
      }
    } catch {
      toast.error('Could not reset password. Try again.');
    } finally {
      setBusy(false);
    }
  });

  return (
    <Card className="w-full max-w-md border-border/60">
      <CardHeader>
        <CardTitle className="text-navy">Reset password</CardTitle>
        <CardDescription>
          In-memory demo: if the account exists, the password is rotated and a temporary password is shown
          in a toast (no email is sent).
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
          <Button type="submit" className="w-full bg-navy text-navy-foreground hover:bg-navy/90" disabled={busy}>
            {busy ? 'Submitting…' : 'Send reset link'}
          </Button>
          <div className="text-center text-sm">
            <Link href="/login/" className="text-teal hover:underline">
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ForgotPasswordForm;

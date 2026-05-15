'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthPersistReady } from '@/lib/auth/use-auth-persist-ready';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const ready = useAuthPersistReady();

  useEffect(() => {
    if (ready && !token) {
      void router.replace('/login/');
    }
  }, [ready, token, router]);

  if (!ready || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40 text-muted-foreground text-sm">
        {ready ? 'Redirecting to sign in…' : 'Loading…'}
      </div>
    );
  }

  return <>{children}</>;
}

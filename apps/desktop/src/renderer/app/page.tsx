'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthPersistReady } from '@/lib/auth/use-auth-persist-ready';
import { useAuthStore } from '@/store/auth.store';

export default function RootPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const ready = useAuthPersistReady();

  useEffect(() => {
    if (!ready) return;
    void router.replace(token ? '/home/' : '/login/');
  }, [ready, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 text-muted-foreground text-sm">
      {ready ? 'Redirecting…' : 'Loading…'}
    </div>
  );
}

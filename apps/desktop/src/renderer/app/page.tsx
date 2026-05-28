'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    void router.replace(isAuthenticated ? '/home/' : '/login/');
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 text-muted-foreground text-sm">
      {isLoading ? 'Loading…' : 'Redirecting…'}
    </div>
  );
}

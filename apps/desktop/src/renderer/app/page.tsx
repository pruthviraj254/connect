'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { redirectInApp } from '@/lib/in-app-navigation';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    redirectInApp(isAuthenticated ? '/home/' : '/login/', router);
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 text-muted-foreground text-sm">
      {isLoading ? 'Loading…' : 'Redirecting…'}
    </div>
  );
}

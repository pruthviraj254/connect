'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { UpdateGate } from '@/components/features/settings/UpdateGate';
import { UpdateProvider } from '@/hooks/use-auto-update';
import { ElectronNavigationProvider } from '@/hooks/use-electron-navigation';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
        <UpdateProvider>
          <AuthProvider>
            <ElectronNavigationProvider>
              <AuthGuard>
                <UpdateGate>{children}</UpdateGate>
                <Toaster richColors position="bottom-right" />
              </AuthGuard>
            </ElectronNavigationProvider>
          </AuthProvider>
        </UpdateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;

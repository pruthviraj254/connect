'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { UpdateGate } from '@/components/features/settings/UpdateGate';
import { UpdateProvider } from '@/hooks/use-auto-update';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" disableTransitionOnChange>
        <UpdateProvider>
          <UpdateGate>{children}</UpdateGate>
          <Toaster richColors position="bottom-right" />
        </UpdateProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;

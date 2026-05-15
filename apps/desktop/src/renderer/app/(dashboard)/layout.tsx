import { AuthGuard } from '@/components/features/auth/AuthGuard';
import { Shell } from '@/components/layout/Shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <Shell>{children}</Shell>
    </AuthGuard>
  );
}

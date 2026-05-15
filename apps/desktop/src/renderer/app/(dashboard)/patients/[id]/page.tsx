import { notFound } from 'next/navigation';
import { tenants } from '@/lib/mock-data';
import { TenantDetailView } from '@/components/features/patients/TenantDetailView';

export function generateStaticParams() {
  return tenants.map((t) => ({ id: t.id }));
}

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  const tenant = tenants.find((x) => x.id === params.id);
  if (!tenant) notFound();
  return <TenantDetailView tenant={tenant} />;
}

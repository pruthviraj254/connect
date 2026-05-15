'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/layout/StatusBadge';
import { tenants } from '@/lib/mock-data';

export function PatientsListView() {
  return (
    <>
      <PageHeader title="Tenants" description="Provisioned pharmacy tenants and SIP endpoints." />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Voice DID</TableHead>
              <TableHead>Fax DID</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>E911</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-xs">{t.voiceDid}</TableCell>
                <TableCell className="font-mono text-xs">{t.faxDid}</TableCell>
                <TableCell>{t.devices}</TableCell>
                <TableCell>
                  <StatusBadge status={t.e911Status} />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/patients/${t.id}/`} className="text-teal text-sm font-medium hover:underline">
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default PatientsListView;

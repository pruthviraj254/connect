'use client';

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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight } from 'lucide-react';
import { apiLogs } from '@/lib/mock-data';
import { useMemo, useState, Fragment } from 'react';
import { cn } from '@/lib/utils';

function statusClass(s: number) {
  if (s < 300) return 'bg-success/15 text-success border-success/30';
  if (s < 500) return 'bg-warning/20 text-foreground border-warning/40';
  return 'bg-destructive/15 text-destructive border-destructive/30';
}

export function ApiLogsView() {
  const [endpoint, setEndpoint] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const endpoints = Array.from(new Set(apiLogs.map((l) => l.endpoint)));

  const filtered = useMemo(
    () =>
      apiLogs.filter((l) => {
        if (endpoint !== 'all' && l.endpoint !== endpoint) return false;
        if (status !== 'all' && String(l.status)[0] !== status[0]) return false;
        if (q && !(l.endpoint + l.tenantId + l.operator).toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [endpoint, status, q],
  );

  return (
    <>
      <PageHeader
        title="Provisioning API Logs"
        description="All operator and system API calls with full request/response payloads."
      />

      <Card>
        <div className="p-4 border-b flex gap-2 flex-wrap">
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <Select value={endpoint} onValueChange={setEndpoint}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Endpoint" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All endpoints</SelectItem>
              {endpoints.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="2xx">2xx Success</SelectItem>
              <SelectItem value="4xx">4xx Client</SelectItem>
              <SelectItem value="5xx">5xx Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Timestamp</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Operator</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => {
              const isOpen = openId === l.id;
              return (
                <Fragment key={l.id}>
                  <TableRow
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setOpenId(isOpen ? null : l.id)}
                  >
                    <TableCell>
                      <ChevronRight className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{l.at}</TableCell>
                    <TableCell className="font-mono text-xs text-navy">{l.endpoint}</TableCell>
                    <TableCell className="font-mono text-xs">{l.tenantId}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-xs font-mono font-medium',
                          statusClass(l.status),
                        )}
                      >
                        {l.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{l.durationMs} ms</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.operator}</TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={7} className="bg-muted/30 p-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Request
                            </div>
                            <pre className="rounded-md bg-card border p-3 text-xs font-mono overflow-x-auto">
                              {JSON.stringify(l.request, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                              Response
                            </div>
                            <pre className="rounded-md bg-card border p-3 text-xs font-mono overflow-x-auto">
                              {JSON.stringify(l.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default ApiLogsView;

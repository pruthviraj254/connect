'use client';

import { Fragment, useMemo, useState } from 'react';
import { ChevronRight, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
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
import { callLogs, tenants, type CallDisposition, type CallLogRecord } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const tenantNameById = Object.fromEntries(tenants.map((t) => [t.id, t.name]));

function formatDuration(sec: number): string {
  if (sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function dispositionClass(d: CallDisposition): string {
  switch (d) {
    case 'Answered':
      return 'bg-success/15 text-success border-success/30';
    case 'Voicemail':
    case 'Missed':
      return 'bg-warning/20 text-foreground border-warning/40';
    case 'Busy':
    case 'Failed':
      return 'bg-destructive/15 text-destructive border-destructive/30';
  }
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className="text-sm font-mono">{value}</div>
    </div>
  );
}

function CallDetailPanel({ call }: { call: CallLogRecord }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <DetailField label="DID" value={call.did} />
      <DetailField label="Extension" value={`${call.extension} — ${call.extensionName}`} />
      <DetailField label="Started" value={call.startedAt} />
      <DetailField label="Ended" value={call.endedAt} />
      <DetailField label="Ring Duration" value={formatDuration(call.ringSec)} />
      <DetailField label="Talk Duration" value={formatDuration(call.durationSec)} />
      <DetailField label="Codec" value={call.codec} />
      <DetailField label="SIP Call ID" value={call.sipCallId} />
      <DetailField label="Hangup Cause" value={call.hangupCause} />
      <DetailField
        label="Recording"
        value={call.recordingAvailable ? 'Available' : 'Not available'}
      />
      {call.notes && (
        <div className="sm:col-span-2 lg:col-span-3">
          <DetailField label="Notes" value={call.notes} />
        </div>
      )}
    </div>
  );
}

export function CallLogView() {
  const [q, setQ] = useState('');
  const [direction, setDirection] = useState<string>('all');
  const [disposition, setDisposition] = useState<string>('all');
  const [tenantId, setTenantId] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      callLogs.filter((c) => {
        if (direction !== 'all' && c.direction !== direction) return false;
        if (disposition !== 'all' && c.disposition !== disposition) return false;
        if (tenantId !== 'all' && c.tenantId !== tenantId) return false;
        if (q) {
          const haystack = [
            c.from,
            c.to,
            c.did,
            c.extension,
            c.extensionName,
            tenantNameById[c.tenantId] ?? c.tenantId,
          ]
            .join(' ')
            .toLowerCase();
          if (!haystack.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [direction, disposition, tenantId, q],
  );

  const stats = useMemo(
    () => ({
      total: filtered.length,
      answered: filtered.filter((c) => c.disposition === 'Answered').length,
      missed: filtered.filter((c) => c.disposition === 'Missed' || c.disposition === 'Voicemail')
        .length,
    }),
    [filtered],
  );

  return (
    <>
      <PageHeader
        title="Call Log"
        description="VoIP call detail records across all tenants — inbound, outbound, and voicemail."
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total calls</div>
          <div className="text-2xl font-semibold tabular-nums mt-1">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Answered</div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-success">{stats.answered}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">
            Missed / Voicemail
          </div>
          <div className="text-2xl font-semibold tabular-nums mt-1 text-warning">{stats.missed}</div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b flex gap-2 flex-wrap">
          <Input
            placeholder="Search number, tenant, extension…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
          <Select value={direction} onValueChange={setDirection}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All directions</SelectItem>
              <SelectItem value="in">Inbound</SelectItem>
              <SelectItem value="out">Outbound</SelectItem>
            </SelectContent>
          </Select>
          <Select value={disposition} onValueChange={setDisposition}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Disposition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dispositions</SelectItem>
              <SelectItem value="Answered">Answered</SelectItem>
              <SelectItem value="Missed">Missed</SelectItem>
              <SelectItem value="Voicemail">Voicemail</SelectItem>
              <SelectItem value="Busy">Busy</SelectItem>
              <SelectItem value="Failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tenantId} onValueChange={setTenantId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tenant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tenants</SelectItem>
              {tenants.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Time</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Extension</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Disposition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No call records match your filters.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => {
              const isOpen = openId === c.id;
              return (
                <Fragment key={c.id}>
                  <TableRow
                    className="hover:bg-muted/40 cursor-pointer"
                    onClick={() => setOpenId(isOpen ? null : c.id)}
                  >
                    <TableCell>
                      <ChevronRight
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {c.startedAt}
                    </TableCell>
                    <TableCell className="text-sm">{tenantNameById[c.tenantId] ?? c.tenantId}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        {c.direction === 'in' ? (
                          <PhoneIncoming className="h-3.5 w-3.5 text-navy" />
                        ) : (
                          <PhoneOutgoing className="h-3.5 w-3.5 text-navy" />
                        )}
                        {c.direction === 'in' ? 'Inbound' : 'Outbound'}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{c.from}</TableCell>
                    <TableCell className="font-mono text-xs">{c.to}</TableCell>
                    <TableCell className="font-mono text-xs">{c.extension}</TableCell>
                    <TableCell className="text-sm tabular-nums">{formatDuration(c.durationSec)}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-xs font-medium',
                          dispositionClass(c.disposition),
                        )}
                      >
                        {c.disposition}
                      </span>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={9} className="bg-muted/30 p-0">
                        <CallDetailPanel call={c} />
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

export default CallLogView;

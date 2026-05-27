'use client';

import { Fragment, useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { fetchPharmacyCdrs } from '@/lib/api/cdr';
import { DEV_PHARMACY_ID } from '@/lib/call-log/constants';
import type { CallDisposition, CallLogRecord } from '@/lib/call-log/types';
import { cn } from '@/lib/utils';

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
      <DetailField label="Extension" value={call.extension} />
      <DetailField label="Started" value={call.startedAt} />
      <DetailField label="Ended" value={call.endedAt} />
      <DetailField label="Talk Duration" value={formatDuration(call.durationSec)} />
      <DetailField label="External Call ID" value={call.sipCallId} />
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
  const [openId, setOpenId] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(q.trim());

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ['call-log', DEV_PHARMACY_ID, direction, disposition, deferredSearch],
    queryFn: () =>
      fetchPharmacyCdrs(DEV_PHARMACY_ID, {
        direction: direction as 'in' | 'out' | 'all',
        disposition: disposition as CallDisposition | 'all',
        search: deferredSearch || undefined,
        page: 1,
        limit: 50,
      }),
  });

  const calls = useMemo(() => data?.items ?? [], [data?.items]);

  const stats = useMemo(
    () => ({
      total: data?.total ?? 0,
      answered: calls.filter((c) => c.disposition === 'Answered').length,
      missed: calls.filter((c) => c.disposition === 'Missed' || c.disposition === 'Voicemail')
        .length,
    }),
    [calls, data?.total],
  );

  const errorMessage =
    error instanceof Error ? error.message : isError ? 'Failed to load call records.' : null;

  return (
    <>
      <PageHeader
        title="Call Log"
        description={`VoIP call detail records for pharmacy ${DEV_PHARMACY_ID}.`}
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
        <div className="p-4 border-b flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Search caller, destination, extension…"
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
          {isFetching && !isLoading && (
            <span className="text-xs text-muted-foreground">Refreshing…</span>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Time</TableHead>
              <TableHead>Direction</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Extension</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Disposition</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Loading call records…
                </TableCell>
              </TableRow>
            )}
            {errorMessage && !isLoading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-destructive py-8">
                  {errorMessage}
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !errorMessage && calls.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No call records match your filters.
                </TableCell>
              </TableRow>
            )}
            {!isLoading &&
              !errorMessage &&
              calls.map((c) => {
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
                      <TableCell className="text-sm tabular-nums">
                        {formatDuration(c.durationSec)}
                      </TableCell>
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
                        <TableCell colSpan={8} className="bg-muted/30 p-0">
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

'use client';

import { PageHeader } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { blacklist as initial, tenants } from '@/lib/mock-data';
import { Plus, Trash2, ShieldBan, TrendingDown, DollarSign } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  accent: 'navy' | 'teal' | 'success';
}) {
  const cls = {
    navy: 'text-navy bg-navy/10',
    teal: 'text-teal bg-teal/10',
    success: 'text-success bg-success/10',
  }[accent];
  return (
    <Card>
      <CardContent className="p-5 flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {label}
          </div>
          <div className="text-2xl font-semibold text-navy mt-1.5 tabular-nums">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cls}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export function BlacklistView() {
  const [bl, setBl] = useState(initial);
  const [num, setNum] = useState('');
  const [platform, setPlatform] = useState(true);
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!num) return;
    const scope = platform ? 'Platform' : tenants.find((t) => t.id === tenantId)?.name ?? 'Platform';
    setBl([
      {
        id: `b${Date.now()}`,
        number: num,
        scope,
        addedBy: 'admin@onerx',
        addedAt: new Date().toISOString().slice(0, 10),
      },
      ...bl,
    ]);
    setNum('');
    toast.success(`Blocked ${num} (${scope})`);
  }

  return (
    <>
      <PageHeader
        title="Platform Blacklist"
        description="Manage blocked fax numbers across the platform."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={ShieldBan} label="Total Blocked" value={String(bl.length)} accent="navy" />
        <StatCard
          icon={TrendingDown}
          label="Rejections this month"
          value="847"
          sub="faxes intercepted"
          accent="teal"
        />
        <StatCard
          icon={DollarSign}
          label="Telnyx charges saved"
          value="$214.30"
          sub="approx, this month"
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blocked Number</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead>Added At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bl.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.number}</TableCell>
                  <TableCell>
                    {b.scope === 'Platform' ? (
                      <span className="inline-flex rounded-md bg-navy/10 text-navy border border-navy/20 px-2 py-0.5 text-xs font-medium">
                        Platform
                      </span>
                    ) : (
                      <span className="text-sm">{b.scope}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.addedBy}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.addedAt}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setBl(bl.filter((x) => x.id !== b.id));
                        toast('Removed');
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-navy mb-4">Add to blacklist</h3>
            <form onSubmit={add} className="space-y-4">
              <div>
                <Label>Phone Number</Label>
                <Input
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                  placeholder="+1 800 555 0000"
                  required
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">Platform-wide</div>
                  <div className="text-xs text-muted-foreground">Block across all tenants</div>
                </div>
                <Switch checked={platform} onCheckedChange={setPlatform} />
              </div>
              {!platform && (
                <div>
                  <Label>Tenant</Label>
                  <Select value={tenantId} onValueChange={setTenantId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tenants.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button type="submit" className="w-full bg-teal text-teal-foreground hover:bg-teal/90">
                <Plus className="h-4 w-4 mr-2" />
                Block Number
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default BlacklistView;

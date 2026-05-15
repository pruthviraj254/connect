'use client';

'use client';

import Link from 'next/link';
import { PageHeader } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Phone,
  Send,
  Activity,
  Plus,
  Ban,
  Server,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Voicemail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { recentActivity, tenants, faxes } from '@/lib/mock-data';

function Stat({
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
  accent?: 'navy' | 'teal' | 'success' | 'warning';
}) {
  const accentClass =
    {
      navy: 'text-navy bg-navy/10',
      teal: 'text-teal bg-teal/10',
      success: 'text-success bg-success/10',
      warning: 'text-foreground bg-warning/20',
    }[accent ?? 'navy'];

  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </div>
            <div className="mt-2 text-3xl font-semibold text-navy tabular-nums">{value}</div>
            {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function NodeRow({ label, ip, healthy }: { label: string; ip: string; healthy: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground font-mono">{ip}</div>
      </div>
      <span
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          healthy ? 'text-success' : 'text-destructive'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            healthy ? 'bg-success animate-pulse' : 'bg-destructive'
          }`}
        />
        {healthy ? 'Healthy' : 'Down'}
      </span>
    </div>
  );
}

export function DashboardHome() {
  const totalDevices = tenants.reduce((a, t) => a + t.devices, 0);
  const faxIn = faxes.filter((f) => f.direction === 'in').length;
  const faxOut = faxes.filter((f) => f.direction === 'out').length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Real-time platform health and operations overview."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/blacklist/">
                <Ban className="h-4 w-4 mr-2" />
                Add to Blacklist
              </Link>
            </Button>
            <Button asChild className="bg-teal hover:bg-teal/90 text-teal-foreground">
              <Link href="/patients/">
                <Plus className="h-4 w-4 mr-2" />
                Provision New Tenant
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          icon={Building2}
          label="Total Tenants"
          value={String(tenants.length)}
          sub={`${tenants.filter((t) => t.e911Status === 'Registered').length} E911 registered`}
          accent="navy"
        />
        <Stat
          icon={Phone}
          label="Active Phones"
          value={String(totalDevices)}
          sub="across all tenants"
          accent="teal"
        />
        <Stat
          icon={Send}
          label="Faxes Today"
          value={`${faxIn} in / ${faxOut} out`}
          sub="last 24 hours"
          accent="teal"
        />
        <Stat
          icon={Activity}
          label="Platform Uptime"
          value="99.98%"
          sub="last 30 days"
          accent="success"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-base">Live activity feed</CardTitle>
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="divide-y">
              {recentActivity.map((e, i) => {
                const Icon =
                  e.kind === 'fax'
                    ? Send
                    : e.kind === 'fax-fail'
                      ? AlertTriangle
                      : e.kind === 'vm'
                        ? Voicemail
                        : e.kind === 'alert'
                          ? AlertTriangle
                          : e.kind === 'sip'
                            ? Phone
                            : Phone;
                const tone =
                  e.kind === 'fax-fail' || e.kind === 'alert'
                    ? 'text-destructive bg-destructive/10'
                    : e.kind === 'vm'
                      ? 'text-foreground bg-warning/20'
                      : 'text-teal bg-teal/10';
                return (
                  <li key={i} className="flex items-start gap-3 py-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">{e.text}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 font-mono">{e.at}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-teal" />
              HA Cluster Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <NodeRow label="Active Node" ip="10.20.0.11" healthy />
            <NodeRow label="Passive Node" ip="10.20.0.12" healthy />
            <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floating IP</span>
                <span className="font-mono">10.20.0.10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last failover</span>
                <span className="font-mono">12 days ago</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Replication lag</span>
                <span className="font-mono text-success">0 ms</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-md border p-3">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <ArrowDownLeft className="h-3 w-3" />
                  Inbound
                </div>
                <div className="text-lg font-semibold text-navy mt-0.5">{faxIn}</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  Outbound
                </div>
                <div className="text-lg font-semibold text-navy mt-0.5">{faxOut}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default DashboardHome;

'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { getAppSettings, setAppSettings } from '@/lib/settings';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Server, KeyRound, Bell, Settings as SettingsIcon, Monitor } from 'lucide-react';
import { toast } from 'sonner';

const apiKeys = [
  { id: 'k1', name: 'Provisioning Master', prefix: 'rx_live_a4f8…91c', created: '2024-09-12', lastUsed: '2 min ago' },
  { id: 'k2', name: 'Webhook Telnyx', prefix: 'rx_live_b7c2…44e', created: '2025-01-04', lastUsed: '11 min ago' },
  { id: 'k3', name: 'Read-Only Reporting', prefix: 'rx_live_c9d1…77a', created: '2025-04-19', lastUsed: 'yesterday' },
];

function Field({
  label,
  defaultValue,
  mono,
  readOnly,
}: {
  label: string;
  defaultValue: string;
  mono?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} readOnly={readOnly} className={mono ? 'font-mono text-sm' : ''} />
    </div>
  );
}

export function SettingsView() {
  const [openAtLogin, setOpenAtLogin] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const s = await getAppSettings();
        setOpenAtLogin(s.openAtLogin);
      } catch {
        /* desktop IPC unavailable in web-only dev */
      } finally {
        setSettingsLoading(false);
      }
    })();
  }, []);

  const onToggleStartup = async (checked: boolean) => {
    setOpenAtLogin(checked);
    try {
      await setAppSettings({ openAtLogin: checked });
      toast.success(checked ? 'Rx-Connect will start at login' : 'Startup disabled');
    } catch (e) {
      setOpenAtLogin(!checked);
      toast.error(e instanceof Error ? e.message : 'Could not update startup setting');
    }
  };

  return (
    <>
      <PageHeader title="Settings" description="Platform configuration, notifications, and credentials." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-teal" />
              Desktop App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="open-at-login">Run on startup</Label>
                <p className="text-xs text-muted-foreground">
                  Start Rx-Connect when you sign in (minimized to the system tray on Windows).
                </p>
              </div>
              <Switch
                id="open-at-login"
                checked={openAtLogin}
                disabled={settingsLoading}
                onCheckedChange={(v) => void onToggleStartup(v)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <SettingsIcon className="h-4 w-4 text-teal" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Default voicemail retention (days)" defaultValue="90" />
            <Field label="Default ring timeout (seconds)" defaultValue="20" />
            <Field label="Fax webhook retry count" defaultValue="3" />
            <Button
              onClick={() => toast.success('Platform settings saved')}
              className="bg-navy text-navy-foreground hover:bg-navy/90"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-teal" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Platform alert email" defaultValue="alerts@onerx.health" />
            <Field label="UptimeRobot webhook URL" defaultValue="https://api.uptimerobot.com/v2/incoming/onerx-prod" />
            <Button
              onClick={() => toast.success('Notification settings saved')}
              className="bg-navy text-navy-foreground hover:bg-navy/90"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-teal" />
              Operator API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((k) => (
                  <TableRow key={k.id}>
                    <TableCell className="font-medium">{k.name}</TableCell>
                    <TableCell className="font-mono text-xs">{k.prefix}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{k.created}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{k.lastUsed}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => toast.success('New key generated')}>
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toast.error('Key revoked')}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-teal" />
              HA Cluster Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Active Node IP" defaultValue="10.20.0.11" mono />
            <Field label="Passive Node IP" defaultValue="10.20.0.12" mono />
            <Field label="Floating IP" defaultValue="10.20.0.10" mono />
            <Field label="Last Failover" defaultValue="2026-04-29 03:14 UTC" readOnly mono />
            <div className="md:col-span-2">
              <Button
                onClick={() => toast.success('Cluster configuration saved')}
                className="bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Save Cluster Config
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default SettingsView;

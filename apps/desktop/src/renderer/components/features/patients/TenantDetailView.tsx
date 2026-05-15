'use client';

import { PageHeader } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge, EventBadge } from '@/components/layout/StatusBadge';
import {
  devicesByTenant,
  extensionsByTenant,
  faxes,
  auditByTenant,
  blacklist as initialBL,
  type Tenant,
} from '@/lib/mock-data';
import { ArrowLeft, Copy, RefreshCw, Plus, Send, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

export function TenantDetailView({ tenant }: { tenant: Tenant }) {
  const devices = devicesByTenant[tenant.id] ?? [];
  const extensions = extensionsByTenant[tenant.id] ?? [];
  const inbound = faxes.filter((f) => f.tenantId === tenant.id && f.direction === 'in');
  const outbound = faxes.filter((f) => f.tenantId === tenant.id && f.direction === 'out');
  const audit = auditByTenant[tenant.id] ?? [];
  const [showPass, setShowPass] = useState(false);
  const [tenantBL, setTenantBL] = useState(initialBL.filter((b) => b.scope === tenant.name));
  const [blInput, setBlInput] = useState('');
  const [editingE911, setEditingE911] = useState(false);
  const [e911, setE911] = useState(tenant.e911);

  return (
    <>
      <Link
        href="/patients/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tenants
      </Link>
      <PageHeader
        title={tenant.name}
        description={`Provisioned ${tenant.createdAt} · ${devices.length} devices`}
        actions={<StatusBadge status={tenant.e911Status} />}
      />

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card border h-auto p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="extensions">Extensions & Ring Groups</TabsTrigger>
          <TabsTrigger value="fax">Fax</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pharmacy details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Name" value={tenant.name} />
              <Field label="Voice DID" value={tenant.voiceDid} mono />
              <Field label="Fax DID" value={tenant.faxDid} mono />
              <Field label="Notification email" value={tenant.email} />
              <Field label="Provisioned" value={tenant.createdAt} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                E911 Civic Address
              </CardTitle>
              {!editingE911 && (
                <Button size="sm" variant="outline" onClick={() => setEditingE911(true)}>
                  Update Address
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {!editingE911 ? (
                <>
                  <div>{e911.street}</div>
                  <div>
                    {e911.city}, {e911.province} {e911.postal}
                  </div>
                  <div className="pt-2">
                    <StatusBadge status={tenant.e911Status} />
                  </div>
                </>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    setE911({
                      street: String(fd.get('s')),
                      city: String(fd.get('c')),
                      province: String(fd.get('p')),
                      postal: String(fd.get('z')),
                    });
                    setEditingE911(false);
                    toast.success('E911 address updated');
                  }}
                  className="space-y-2"
                >
                  <Input name="s" defaultValue={e911.street} placeholder="Street" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      name="c"
                      defaultValue={e911.city}
                      placeholder="City"
                      className="col-span-2"
                    />
                    <Input name="p" defaultValue={e911.province} placeholder="Prov" maxLength={2} />
                  </div>
                  <Input name="z" defaultValue={e911.postal} placeholder="Postal" />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      type="submit"
                      className="bg-teal text-teal-foreground hover:bg-teal/90"
                    >
                      Save
                    </Button>
                    <Button size="sm" type="button" variant="ghost" onClick={() => setEditingE911(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">SIP Credentials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Field label="Username" value={tenant.sipUser} mono />
              <div>
                <div className="text-xs text-muted-foreground mb-1">Password</div>
                <div className="flex gap-2 items-center">
                  <code className="flex-1 rounded bg-muted px-2 py-1.5 text-xs font-mono">
                    {showPass ? tenant.sipPass : '••••••••••••'}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      void navigator.clipboard.writeText(tenant.sipPass);
                      toast('Password copied');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href={tenant.msiUrl}>
                  <Download className="h-4 w-4 mr-2" />
                  Download MSI Installer
                </a>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="mt-6">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-medium">{devices.length} provisioned devices</div>
              <Button size="sm" variant="outline" onClick={() => toast('Refreshing registrations…')}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extension</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d) => (
                  <TableRow key={d.mac}>
                    <TableCell className="font-mono">{d.ext}</TableCell>
                    <TableCell className="font-mono text-xs">{d.mac}</TableCell>
                    <TableCell>{d.model}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{d.lastSeen}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="extensions" className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="text-sm font-medium">Extensions</div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-teal text-teal-foreground hover:bg-teal/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Extension
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add extension</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success('Extension added');
                      (e.target as HTMLFormElement)
                        .closest('[role="dialog"]')
                        ?.querySelector<HTMLButtonElement>('[aria-label="Close"]')
                        ?.click();
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>Extension number</Label>
                      <Input required maxLength={4} placeholder="1005" />
                    </div>
                    <div>
                      <Label>Display name</Label>
                      <Input required placeholder="Back Office" />
                    </div>
                    <div>
                      <Label>Voicemail email</Label>
                      <Input required type="email" placeholder="vm@pharmacy.ca" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-teal text-teal-foreground hover:bg-teal/90">
                        Create
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ext</TableHead>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Voicemail Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extensions.map((x) => (
                  <TableRow key={x.ext}>
                    <TableCell className="font-mono">{x.ext}</TableCell>
                    <TableCell>{x.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{x.vmEmail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ring Group</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-2 font-medium">Ring extensions</div>
                <div className="space-y-1.5">
                  {extensions.map((x) => (
                    <label
                      key={x.ext}
                      htmlFor={`rg-${x.ext}`}
                      className="flex items-center gap-2 text-sm rounded-md p-2 hover:bg-muted cursor-pointer"
                    >
                      <Checkbox id={`rg-${x.ext}`} defaultChecked />{' '}
                      <span className="font-mono">{x.ext}</span>{' '}
                      <span className="text-muted-foreground">— {x.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Ring timeout (sec)</Label>
                  <Input type="number" defaultValue={20} />
                </div>
                <div>
                  <Label>After hours</Label>
                  <Select defaultValue="vm">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vm">Voicemail</SelectItem>
                      <SelectItem value="ivr">IVR</SelectItem>
                      <SelectItem value="ext">External Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => toast.success('Ring group saved')}
                className="bg-navy text-navy-foreground hover:bg-navy/90 w-full"
              >
                Save Ring Group
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fax" className="mt-6 space-y-4">
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Fax DID</div>
                <div className="font-mono text-navy font-semibold">{tenant.faxDid}</div>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-teal text-teal-foreground hover:bg-teal/90">
                    <Send className="h-4 w-4 mr-2" />
                    Send Test Fax
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send test fax</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      toast.success('Test fax queued for delivery');
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <Label>To Number</Label>
                      <Input required placeholder="+1 604 555 9999" />
                    </div>
                    <div>
                      <Label>PDF Attachment</Label>
                      <Input required type="file" accept="application/pdf" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-teal text-teal-foreground hover:bg-teal/90">
                        Send
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </Card>

          <Card>
            <div className="p-4 border-b text-sm font-medium">Inbound faxes</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbound.length ? (
                  inbound.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.at}</TableCell>
                      <TableCell className="font-mono text-xs">{f.from}</TableCell>
                      <TableCell>{f.pages}</TableCell>
                      <TableCell>
                        <StatusBadge status={f.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {f.emailSentAt ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      No inbound faxes yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <div className="p-4 border-b text-sm font-medium">Outbound faxes</div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Telnyx Job ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outbound.length ? (
                  outbound.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-mono text-xs">{f.at}</TableCell>
                      <TableCell className="font-mono text-xs">{f.to}</TableCell>
                      <TableCell>{f.pages}</TableCell>
                      <TableCell>
                        <StatusBadge status={f.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{f.jobId}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-sm">
                      No outbound faxes yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fax Blacklist (this tenant)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!blInput) return;
                  setTenantBL([
                    ...tenantBL,
                    {
                      id: `b${Date.now()}`,
                      number: blInput,
                      scope: tenant.name,
                      addedBy: 'admin@onerx',
                      addedAt: new Date().toISOString().slice(0, 10),
                    },
                  ]);
                  setBlInput('');
                  toast.success('Number blacklisted');
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="+1 800 555 0000"
                  value={blInput}
                  onChange={(e) => setBlInput(e.target.value)}
                />
                <Button type="submit" className="bg-navy text-navy-foreground hover:bg-navy/90">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tenantBL.length ? (
                    tenantBL.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-mono text-xs">{b.number}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.addedAt}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setTenantBL(tenantBL.filter((x) => x.id !== b.id));
                              toast('Removed from blacklist');
                            }}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground text-sm">
                        No tenant-specific blocks.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <Card>
            <div className="p-4 border-b flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2 flex-1">
                <Input placeholder="Search description…" className="max-w-xs" />
                <Input type="date" className="max-w-[180px]" />
                <Input type="date" className="max-w-[180px]" />
              </div>
              <Button variant="outline" onClick={() => toast('CSV exported')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Operator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audit.length ? (
                  audit.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.at}</TableCell>
                      <TableCell>
                        <EventBadge type={a.type} />
                      </TableCell>
                      <TableCell className="text-sm">{a.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.operator}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                      No audit events recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={mono ? 'font-mono text-sm' : 'text-sm'}>{value}</div>
    </div>
  );
}

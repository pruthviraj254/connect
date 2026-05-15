'use client';

import { PageHeader } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/layout/StatusBadge';
import { faxes, tenants, blacklist as initialBL } from '@/lib/mock-data';
import { Send, Eye, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function nameOf(id: string) {
  return tenants.find((t) => t.id === id)?.name ?? id;
}

export function FaxCenterView() {
  const inbound = faxes.filter((f) => f.direction === 'in');
  const outbound = faxes.filter((f) => f.direction === 'out');
  const [bl, setBl] = useState(initialBL.filter((b) => b.scope === 'Platform'));
  const [num, setNum] = useState('');

  return (
    <>
      <PageHeader
        title="Fax Center"
        description="Platform-wide inbound and outbound fax operations."
        actions={
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-teal text-teal-foreground hover:bg-teal/90">
                <Send className="h-4 w-4 mr-2" />
                Send Fax
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send fax</DialogTitle>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success('Fax queued for delivery');
                }}
                className="space-y-3"
              >
                <div>
                  <Label>Tenant</Label>
                  <Select defaultValue={tenants[0]?.id}>
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
                <div>
                  <Label>To Number</Label>
                  <Input required placeholder="+1 604 555 9999" />
                </div>
                <div>
                  <Label>From DID</Label>
                  <Input required placeholder="+1 604 555 0143" />
                </div>
                <div>
                  <Label>PDF</Label>
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
        }
      />

      <Tabs defaultValue="inbound">
        <TabsList className="bg-card border h-auto p-1">
          <TabsTrigger value="inbound">Inbound ({inbound.length})</TabsTrigger>
          <TabsTrigger value="outbound">Outbound ({outbound.length})</TabsTrigger>
          <TabsTrigger value="blacklist">Platform Blacklist</TabsTrigger>
        </TabsList>

        <TabsContent value="inbound" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>DID</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbound.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{nameOf(f.tenantId)}</TableCell>
                    <TableCell className="font-mono text-xs">{f.from}</TableCell>
                    <TableCell className="font-mono text-xs">{f.did}</TableCell>
                    <TableCell>{f.pages}</TableCell>
                    <TableCell className="font-mono text-xs">{f.at}</TableCell>
                    <TableCell>
                      <StatusBadge status={f.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => toast('Opening PDF preview…')}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="outbound" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>From DID</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Telnyx Job</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outbound.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{nameOf(f.tenantId)}</TableCell>
                    <TableCell className="font-mono text-xs">{f.to}</TableCell>
                    <TableCell className="font-mono text-xs">{f.did}</TableCell>
                    <TableCell>{f.pages}</TableCell>
                    <TableCell className="font-mono text-xs">{f.at}</TableCell>
                    <TableCell>
                      <StatusBadge status={f.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{f.jobId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="blacklist" className="mt-4">
          <Card>
            <div className="p-4 border-b">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!num) return;
                  setBl([
                    {
                      id: `b${Date.now()}`,
                      number: num,
                      scope: 'Platform',
                      addedBy: 'admin@onerx',
                      addedAt: new Date().toISOString().slice(0, 10),
                    },
                    ...bl,
                  ]);
                  setNum('');
                  toast.success('Added to platform blacklist');
                }}
                className="flex gap-2 max-w-md"
              >
                <Input
                  placeholder="+1 800 555 0000"
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                />
                <Button type="submit" className="bg-navy text-navy-foreground hover:bg-navy/90">
                  <Plus className="h-4 w-4 mr-1" />
                  Block
                </Button>
              </form>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Added At</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bl.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono text-xs">{b.number}</TableCell>
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
        </TabsContent>
      </Tabs>
    </>
  );
}

export default FaxCenterView;

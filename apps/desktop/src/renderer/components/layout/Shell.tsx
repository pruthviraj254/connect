'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Send,
  Ban,
  FileCode2,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Inbox,
  Globe,
  PhoneCall,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import { isElectronApp, logoutWithTempDb } from '@/lib/auth/auth-actions';
import { AppVersionBadge } from '@/components/features/settings/UpdateGate';
import { isStagingApp } from '@/lib/app-env';

function getInitials(displayName: string | null, email: string | null): string {
  const name = (displayName ?? '').trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  const em = (email ?? '').trim();
  if (em.length >= 2) {
    return em.slice(0, 2).toUpperCase();
  }
  return '??';
}

const nav = [
  { href: '/home/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients/', label: 'Tenants', icon: Users },
  { href: '/prescriptions/', label: 'Fax Center', icon: Send },
  { href: '/fax-inbox/', label: 'Fax Inbox', icon: Inbox },
  { href: '/call-log/', label: 'Call Log', icon: PhoneCall },
  { href: '/website-builder/', label: 'Website', icon: Globe },
  { href: '/blacklist/', label: 'Blacklist', icon: Ban },
  { href: '/api-logs/', label: 'API Logs', icon: FileCode2 },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

const alerts = [
  {
    kind: 'Fax Failed',
    text: 'MediCare Drug Store — fax from +1 416 555 0700 failed',
    at: '07:55',
  },
  {
    kind: 'Fax Failed',
    text: 'Westside Rx — outbound fax to +1 250 555 0111 failed',
    at: '06:22',
  },
  {
    kind: 'SIP Auth',
    text: 'Oakwood Pharmacy — auth failure from 185.220.101.44',
    at: 'Yesterday',
  },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const email = useAuthStore((s) => s.email);
  const displayName = useAuthStore((s) => s.displayName);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleLogout = async () => {
    try {
      if (isElectronApp() && token) {
        await logoutWithTempDb(token);
      }
    } catch {
      toast.error('Signed out locally (could not notify the app process).');
    }
    clearSession();
    toast.success('Signed out');
    void router.replace('/login/');
  };

  const isActive = (href: string) =>
    href === '/home/' ? pathname === '/home' || pathname === '/home/' : pathname.startsWith(href);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex h-16 items-center gap-2 px-5 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-teal text-teal-foreground font-bold">
            Rx
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">OneRx Inc</div>
            <div className="text-[11px] text-sidebar-foreground/60">Operator Portal · Build 0.0.4</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center gap-4 px-6 border-b bg-card">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tenants, DIDs, extensions…"
              className="pl-9 bg-muted/40 border-transparent focus-visible:bg-card"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="p-3 border-b font-medium text-sm">Recent alerts</div>
              <ul className="divide-y">
                {alerts.map((a) => (
                  <li key={`${a.kind}-${a.at}`} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-destructive">{a.kind}</span>
                      <span className="text-xs text-muted-foreground">{a.at}</span>
                    </div>
                    <div className="text-muted-foreground text-xs mt-0.5">{a.text}</div>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>
          {isStagingApp() ? (
            <span className="hidden rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-800 md:inline">
              Staging
            </span>
          ) : null}
          <AppVersionBadge />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-navy text-navy-foreground text-xs">
                    {getInitials(displayName, email)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left leading-tight hidden md:block">
                  <div className="text-sm font-medium">{displayName ?? 'Operator'}</div>
                  <div className="text-[11px] text-muted-foreground">{email ?? ''}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>API Tokens</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 flex flex-col overflow-hidden min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export default Shell;

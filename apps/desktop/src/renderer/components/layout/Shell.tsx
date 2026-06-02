'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  Ban,
  Settings,
  Bell,
  Search,
  Inbox,
  Globe,
  PhoneCall,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RxGlyph } from '@/components/auth/OneRxLogo';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AppVersionBadge } from '@/components/features/settings/UpdateGate';
import { isStagingApp } from '@/lib/app-env';
import { useUiStore } from '@/store/ui.store';

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

type NavItem = { href: string; label: string; icon: LucideIcon };

const rxConnectNav: NavItem[] = [
  { href: '/home/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/prescriptions/', label: 'Fax Sent', icon: Send },
  { href: '/fax-inbox/', label: 'Fax Receive', icon: Inbox },
  { href: '/blacklist/', label: 'Blacklist', icon: Ban },
  { href: '/call-log/', label: 'Call Records', icon: PhoneCall },
];

const toolsNav: NavItem[] = [
  { href: '/website-builder/', label: 'Website', icon: Globe },
  { href: '/settings/', label: 'Settings', icon: Settings },
];

const FULL_BLEED_PATH_PREFIXES = ['/fax-inbox', '/website-builder'];

function isFullBleedPath(pathname: string): boolean {
  const key = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
  return FULL_BLEED_PATH_PREFIXES.some(
    (prefix) => key === prefix || key.startsWith(`${prefix}/`),
  );
}

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

function SidebarSectionLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return <div className="my-2 border-t border-sidebar-border/60" aria-hidden />;
  }
  return (
    <p className="mb-1.5 mt-4 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted first:mt-0">
      {label}
    </p>
  );
}

function SidebarNavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        'group relative flex items-center gap-3 rounded-md py-2 text-sm transition-colors duration-150',
        collapsed ? 'justify-center px-2' : 'px-3',
        active
          ? 'bg-sidebar-accent/15 font-medium text-sidebar-foreground'
          : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground',
      )}
    >
      {active ? (
        <span
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-accent"
          aria-hidden
        />
      ) : null}
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-opacity',
          active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
        )}
      />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

function SidebarUserFooter({
  collapsed,
  displayName,
  email,
  onLogout,
}: {
  collapsed: boolean;
  displayName: string | null;
  email: string | null;
  onLogout: () => void;
}) {
  const initials = getInitials(displayName, email);

  const accountMenu = (
    <DropdownMenuContent align={collapsed ? 'center' : 'end'} side={collapsed ? 'right' : 'top'} className="w-52">
      <DropdownMenuLabel>Account</DropdownMenuLabel>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>API Tokens</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={(event) => {
          event.preventDefault();
          onLogout();
        }}
      >
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  if (collapsed) {
    return (
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-center rounded-md p-1.5 transition-colors hover:bg-white/5"
                  aria-label={displayName ?? 'Account menu'}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-navy text-navy-foreground text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">{displayName ?? 'Account'}</TooltipContent>
          </Tooltip>
          {accountMenu}
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="border-t border-sidebar-border p-3">
      <div className="flex items-center gap-2 rounded-md px-1 py-1">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-navy text-navy-foreground text-xs">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate text-sm font-medium text-sidebar-foreground">
            {displayName ?? 'Operator'}
          </div>
          <div className="truncate text-[11px] text-sidebar-muted">{email ?? ''}</div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
              aria-label="Account menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          {accountMenu}
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, logout } = useAuth();
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);

  const email = session?.user.email ?? null;
  const displayName =
    session?.user.licenseeFirstName && session?.user.licenseeLastName
      ? `${session.user.licenseeFirstName} ${session.user.licenseeLastName}`.trim()
      : session?.user.pharmacyName ?? null;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
    } catch {
      toast.error('Signed out locally (could not notify the app process).');
    }
    router.replace('/login/');
  };

  const isActive = (href: string) =>
    href === '/home/' ? pathname === '/home' || pathname === '/home/' : pathname.startsWith(href);

  const fullBleed = isFullBleedPath(pathname);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <TooltipProvider delayDuration={300}>
        <aside
          className={cn(
            'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out lg:flex',
            sidebarCollapsed ? 'w-[68px]' : 'w-60',
          )}
        >
          <div
            className={cn(
              'flex h-16 items-center border-b border-sidebar-border',
              sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4',
            )}
          >
            <div className={cn('flex items-center gap-2.5', sidebarCollapsed && 'justify-center')}>
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warm-900 text-terra-100 shadow-[0_2px_8px_-2px_rgba(26,21,18,0.4)]"
                aria-hidden
              >
                <RxGlyph size={14} />
              </span>
              {!sidebarCollapsed ? (
                <div className="leading-tight">
                  <div className="font-display text-sm font-semibold tracking-tight text-sidebar-foreground">
                    One<span className="text-sidebar-accent">Rx</span>
                  </div>
                  <div className="text-[10px] text-sidebar-muted">Rx-Manager</div>
                </div>
              ) : null}
            </div>
            {!sidebarCollapsed ? (
              <button
                type="button"
                onClick={() => setSidebarCollapsed(true)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          {sidebarCollapsed ? (
            <div className="flex justify-center border-b border-sidebar-border py-2">
              <button
                type="button"
                onClick={() => setSidebarCollapsed(false)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-sidebar-muted transition-colors hover:bg-white/5 hover:text-sidebar-foreground"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <nav className="flex flex-1 flex-col overflow-y-auto px-2 py-3">
            <SidebarSectionLabel label="Rx-Connect" collapsed={sidebarCollapsed} />
            <ul className="space-y-0.5">
              {rxConnectNav.map((item) => (
                <li key={item.href}>
                  <SidebarNavLink item={item} active={isActive(item.href)} collapsed={sidebarCollapsed} />
                </li>
              ))}
            </ul>

            <SidebarSectionLabel label="Tools" collapsed={sidebarCollapsed} />
            <ul className="space-y-0.5">
              {toolsNav.map((item) => (
                <li key={item.href}>
                  <SidebarNavLink item={item} active={isActive(item.href)} collapsed={sidebarCollapsed} />
                </li>
              ))}
            </ul>
          </nav>

          <SidebarUserFooter
            collapsed={sidebarCollapsed}
            displayName={displayName}
            email={email}
            onLogout={() => void handleLogout()}
          />
        </aside>
      </TooltipProvider>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-6">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tenants, DIDs, extensions…"
              className="border-transparent bg-muted/40 pl-9 focus-visible:bg-card"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="border-b p-3 text-sm font-medium">Recent alerts</div>
              <ul className="divide-y">
                {alerts.map((a) => (
                  <li key={`${a.kind}-${a.at}`} className="p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium text-destructive">{a.kind}</span>
                      <span className="text-xs text-muted-foreground">{a.at}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.text}</div>
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
        </header>
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col transition-opacity duration-150',
            fullBleed
              ? 'overflow-hidden'
              : 'mx-auto w-full max-w-[1600px] overflow-auto p-6 lg:p-8',
          )}
        >
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-navy">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export default Shell;

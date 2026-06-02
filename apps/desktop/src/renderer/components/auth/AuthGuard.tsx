"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { pathnameWithoutTrailingSlash } from "@/lib/pathname";

const PUBLIC_ROUTES = new Set(["/login", "/login/device-pending", "/privacy"]);
const POPUP_ROUTES = new Set(["/fax-popup"]);

const DASHBOARD_ROUTE_PREFIXES = [
  "/home",
  "/prescriptions",
  "/fax-inbox",
  "/blacklist",
  "/call-log",
  "/website-builder",
  "/settings",
];

function isPopupRoute(routeKey: string): boolean {
  return POPUP_ROUTES.has(routeKey) || routeKey.startsWith("/fax-popup");
}

function isDashboardRoute(routeKey: string): boolean {
  return DASHBOARD_ROUTE_PREFIXES.some(
    (prefix) => routeKey === prefix || routeKey.startsWith(`${prefix}/`),
  );
}

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const routeKey = pathnameWithoutTrailingSlash(pathname);
  const { isAuthenticated, isLoading } = useAuth();
  const popupRoute = isPopupRoute(routeKey);
  const dashboardRoute = isDashboardRoute(routeKey);

  useEffect(() => {
    if (popupRoute) return;
    if (isLoading) return;

    if (!isAuthenticated && !PUBLIC_ROUTES.has(routeKey)) {
      router.replace("/login/");
      return;
    }

    if (isAuthenticated && (routeKey === "/login" || routeKey === "/login/device-pending")) {
      router.replace("/home/");
    }
  }, [popupRoute, isAuthenticated, isLoading, routeKey, router]);

  if (popupRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    if (dashboardRoute) {
      return <DashboardChromeSkeleton />;
    }
    return (
      <AuthLoadingScreen>
        <span className="auth-spinner" aria-hidden />
        <p className="text-sm text-warm-600">Securing your session…</p>
      </AuthLoadingScreen>
    );
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.has(routeKey)) {
    if (dashboardRoute) {
      return <DashboardChromeSkeleton message="Redirecting to sign in…" />;
    }
    return (
      <AuthLoadingScreen>
        <p className="text-sm text-warm-600">Redirecting to sign in…</p>
      </AuthLoadingScreen>
    );
  }

  if (
    isAuthenticated &&
    (routeKey === "/login" || routeKey === "/login/device-pending")
  ) {
    return (
      <AuthLoadingScreen>
        <p className="text-sm text-warm-600">Opening workspace…</p>
      </AuthLoadingScreen>
    );
  }

  return <>{children}</>;
}

function AuthLoadingScreen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-warm-50">
      {children}
    </div>
  );
}

/** Keeps app chrome visible while auth hydrates on dashboard routes. */
function DashboardChromeSkeleton({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border" />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 border-b bg-card" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">{message}</p>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { redirectInApp, redirectToWorkspace, normalizeRouteKey } from "@/lib/in-app-navigation";

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
  const routeKey = normalizeRouteKey(pathname);
  const { isAuthenticated, isLoading } = useAuth();
  const popupRoute = isPopupRoute(routeKey);
  const dashboardRoute = isDashboardRoute(routeKey);
  const [redirectTimedOut, setRedirectTimedOut] = useState(false);
  const [workspaceTimedOut, setWorkspaceTimedOut] = useState(false);

  const needsLoginRedirect = !isAuthenticated && !PUBLIC_ROUTES.has(routeKey) && routeKey !== "/";
  const needsWorkspaceRedirect =
    isAuthenticated && (routeKey === "/login" || routeKey === "/login/device-pending");

  useEffect(() => {
    setRedirectTimedOut(false);
    setWorkspaceTimedOut(false);
  }, [routeKey, isAuthenticated]);

  useEffect(() => {
    if (popupRoute) return;
    if (isLoading) return;

    if (!isAuthenticated && !PUBLIC_ROUTES.has(routeKey) && routeKey !== "/") {
      redirectInApp("/login/", router);
      return;
    }

    if (routeKey === "/" && !isAuthenticated) {
      redirectInApp("/login/", router);
      return;
    }

    if (needsWorkspaceRedirect) {
      redirectToWorkspace(router);
    }
  }, [popupRoute, isAuthenticated, isLoading, routeKey, router, needsWorkspaceRedirect]);

  useEffect(() => {
    if (!needsLoginRedirect || isLoading) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRedirectTimedOut(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [needsLoginRedirect, isLoading, routeKey]);

  useEffect(() => {
    if (!needsWorkspaceRedirect || isLoading) {
      return;
    }
    const timer = window.setTimeout(() => {
      setWorkspaceTimedOut(true);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [needsWorkspaceRedirect, isLoading, routeKey]);

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

  if (needsLoginRedirect) {
    return (
      <RedirectToLoginScreen
        dashboardRoute={dashboardRoute}
        showFallback={redirectTimedOut}
        onContinue={() => redirectInApp("/login/", router)}
      />
    );
  }

  if (needsWorkspaceRedirect) {
    return (
      <AuthLoadingScreen>
        <p className="text-sm text-warm-600">Opening workspace…</p>
        {workspaceTimedOut ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => redirectToWorkspace(router)}
          >
            Continue to workspace
          </Button>
        ) : null}
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

function RedirectToLoginScreen({
  dashboardRoute,
  showFallback,
  onContinue,
}: {
  dashboardRoute: boolean;
  showFallback: boolean;
  onContinue: () => void;
}) {
  if (dashboardRoute) {
    return (
      <DashboardChromeSkeleton
        message="Redirecting to sign in…"
        showFallback={showFallback}
        onContinue={onContinue}
      />
    );
  }

  return (
    <AuthLoadingScreen>
      <p className="text-sm text-warm-600">Redirecting to sign in…</p>
      {showFallback ? (
        <Button type="button" variant="outline" size="sm" onClick={onContinue}>
          Continue to sign in
        </Button>
      ) : null}
    </AuthLoadingScreen>
  );
}

/** Keeps app chrome visible while auth hydrates on dashboard routes. */
function DashboardChromeSkeleton({
  message = "Loading…",
  showFallback = false,
  onContinue,
}: {
  message?: string;
  showFallback?: boolean;
  onContinue?: () => void;
}) {
  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-sidebar border-r border-sidebar-border" />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="h-16 border-b bg-card" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3">
          <p className="text-sm text-muted-foreground">{message}</p>
          {showFallback && onContinue ? (
            <Button type="button" variant="outline" size="sm" onClick={onContinue}>
              Continue to sign in
            </Button>
          ) : null}
        </main>
      </div>
    </div>
  );
}

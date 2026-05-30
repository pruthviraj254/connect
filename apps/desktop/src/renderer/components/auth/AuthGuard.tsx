"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { pathnameWithoutTrailingSlash } from "@/lib/pathname";

const PUBLIC_ROUTES = new Set(["/login", "/login/device-pending", "/privacy"]);
const POPUP_ROUTES = new Set(["/fax-popup"]);

function isPopupRoute(routeKey: string): boolean {
  return POPUP_ROUTES.has(routeKey) || routeKey.startsWith("/fax-popup");
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
    return (
      <AuthLoadingScreen>
        <span className="auth-spinner" aria-hidden />
        <p className="text-sm text-warm-600">Securing your session…</p>
      </AuthLoadingScreen>
    );
  }

  if (!isAuthenticated && !PUBLIC_ROUTES.has(routeKey)) {
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

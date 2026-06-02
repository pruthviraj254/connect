"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Copy, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DeviceApprovalAnimation } from "@/components/auth/DeviceApprovalAnimation";
import { OneRxLogo } from "@/components/auth/OneRxLogo";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkstationId } from "@/hooks/useWorkstationId";
import { redirectInApp, redirectToWorkspace } from "@/lib/in-app-navigation";
import {
  formatAuthError,
  isDeviceApprovalPending,
  loginSuccessMessage,
} from "@/services/auth";
import { useAuthStore } from "@/store/authStore";

const ease = [0.22, 1, 0.36, 1] as const;
const AUTO_CHECK_MS = 45_000;

export function DeviceApprovalPendingView() {
  const router = useRouter();
  const deviceApproval = useAuthStore((s) => s.deviceApproval);
  const pendingLoginRetry = useAuthStore((s) => s.pendingLoginRetry);
  const login = useAuthStore((s) => s.login);
  const clearDeviceApproval = useAuthStore((s) => s.clearDeviceApproval);
  const { workstationId, loading: workstationIdLoading } = useWorkstationId();
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!deviceApproval) {
      redirectInApp("/login/", router);
    }
  }, [deviceApproval, router]);

  const checkApproval = useCallback(async () => {
    if (!pendingLoginRetry) {
      toast.info("Sign in again with your email and password to check approval status.");
      redirectInApp("/login/", router);
      return;
    }

    setChecking(true);
    try {
      const result = await login(pendingLoginRetry);
      if (isDeviceApprovalPending(result)) {
        toast.info("Still waiting for administrator approval. Try again shortly.");
        return;
      }
      toast.success(loginSuccessMessage(result));
      redirectToWorkspace(router);
    } catch (err) {
      toast.error(formatAuthError(err, "Could not verify approval status."));
    } finally {
      setChecking(false);
    }
  }, [login, pendingLoginRetry, router]);

  useEffect(() => {
    if (!pendingLoginRetry) return;
    const timer = window.setInterval(() => {
      void checkApproval();
    }, AUTO_CHECK_MS);
    return () => window.clearInterval(timer);
  }, [checkApproval, pendingLoginRetry]);

  const handleCopyDeviceId = async () => {
    if (!workstationId) return;
    try {
      await navigator.clipboard.writeText(workstationId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.warning("Could not copy workstation ID.");
    }
  };

  if (!deviceApproval) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-terra-600" aria-hidden />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease }}
      className="login-glass-card login-glass-card--premium relative z-10 w-full"
    >
      <div className="login-card-inner-glow pointer-events-none" aria-hidden />
      <div className="relative px-8 py-9 sm:px-9 sm:py-10">
        <header className="space-y-5">
          <OneRxLogo size="md" />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-terra-600">
              Workstation registration
            </p>
            <h1 className="login-title font-display text-[1.65rem] font-semibold leading-tight tracking-[-0.02em] text-warm-900">
              Waiting for admin approval
            </h1>
            <p className="text-[15px] leading-relaxed text-warm-600">
              {deviceApproval.message}
            </p>
          </div>
        </header>

        <div className="mt-7">
          <DeviceApprovalAnimation />
        </div>

        <div className="mt-6 space-y-4 rounded-xl border border-warm-200/90 bg-warm-50/60 px-4 py-4">
          <p className="text-sm leading-relaxed text-warm-700">
            Your pharmacy administrator must approve this workstation in the OneRx
            admin portal. This usually takes a few minutes. When approved, sign in
            again with the same email and password.
          </p>
          <div className="rounded-lg border border-warm-200/80 bg-white px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-warm-600">
              Workstation ID
            </p>
            {workstationIdLoading ? (
              <p className="mt-1.5 text-sm text-warm-500">Loading…</p>
            ) : workstationId ? (
              <button
                type="button"
                onClick={() => void handleCopyDeviceId()}
                className="mt-1.5 inline-flex max-w-full items-center gap-2 font-mono-data text-sm font-semibold text-warm-900 outline-none hover:text-terra-700 focus-visible:ring-2 focus-visible:ring-terra-300"
              >
                <span className="truncate">{workstationId}</span>
                {copied ? (
                  <CheckCircle2 size={14} className="shrink-0 text-success" />
                ) : (
                  <Copy size={14} className="shrink-0 text-warm-400" />
                )}
              </button>
            ) : (
              <p className="mt-1.5 text-xs text-warm-500">Unavailable on this device.</p>
            )}
            <p className="mt-1 text-[11px] text-warm-500">
              Share this ID with your administrator if they ask for it.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="flex-1"
            disabled={checking}
            onClick={() => void checkApproval()}
          >
            {checking ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden />
                Checking…
              </>
            ) : (
              <>
                <RefreshCw size={16} strokeWidth={2.2} aria-hidden />
                Check approval status
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={checking}
            onClick={() => {
              clearDeviceApproval();
              redirectInApp("/login/", router);
            }}
          >
            <ArrowLeft size={16} strokeWidth={2.2} aria-hidden />
            Back to sign in
          </Button>
        </div>

        <p className="mt-6 text-center text-[12px] text-warm-500">
          Already approved?{" "}
          <Link
            href="/login/"
            className="font-medium text-terra-600 underline-offset-2 hover:underline"
            onClick={() => clearDeviceApproval()}
          >
            Return to the sign-in page
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

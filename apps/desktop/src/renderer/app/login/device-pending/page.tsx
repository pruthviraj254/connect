'use client';

import { motion } from 'framer-motion';

import { DeviceApprovalPendingView } from '@/components/auth/DeviceApprovalPendingView';
import { LoginAmbient } from '@/components/auth/LoginAmbient';
import { LoginHero } from '@/components/auth/LoginHero';

const ease = [0.22, 1, 0.36, 1] as const;

export default function DevicePendingPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease }}
      className="login-page relative grid min-h-screen lg:grid-cols-2"
    >
      <LoginAmbient />
      <LoginHero />

      <section className="login-panel relative flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10 lg:border-l lg:border-warm-200/40 lg:px-14 xl:px-16">
        <div className="relative z-10 w-full max-w-[432px]">
          <DeviceApprovalPendingView />
        </div>
      </section>
    </motion.main>
  );
}

'use client';

import { motion } from 'framer-motion';

import { LoginAmbient } from '@/components/auth/LoginAmbient';
import { LoginForm } from '@/components/auth/LoginForm';
import { LoginHero } from '@/components/auth/LoginHero';

const ease = [0.22, 1, 0.36, 1] as const;

export default function LoginPage() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease }}
      className="login-page relative grid min-h-screen lg:grid-cols-2"
    >
      <LoginAmbient />
      <LoginHero />

      <motion.section
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease, delay: 0.06 }}
        className="login-panel relative flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10 lg:border-l lg:border-warm-200/40 lg:px-14 xl:px-16"
      >
        <motion.div
          className="login-panel-radial pointer-events-none absolute inset-0"
          aria-hidden
          animate={{ opacity: [0.55, 0.85, 0.55] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="login-panel-orb login-panel-orb-a pointer-events-none"
          aria-hidden
          animate={{ opacity: [0.4, 0.72, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="login-panel-orb login-panel-orb-b pointer-events-none"
          aria-hidden
          animate={{ opacity: [0.28, 0.55, 0.28], x: [0, -12, 0] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />

        <div className="relative z-10 w-full max-w-[432px]">
          <LoginForm />
        </div>
      </motion.section>
    </motion.main>
  );
}

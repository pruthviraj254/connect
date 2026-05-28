"use client";

import { motion } from "framer-motion";
import { Monitor, ShieldCheck, UserCheck } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * Ambient “waiting for admin approval” animation for the device-pending screen.
 */
export function DeviceApprovalAnimation() {
  return (
    <div
      className="device-approval-animation relative mx-auto flex h-[220px] w-full max-w-sm items-center justify-center"
      aria-hidden
    >
      <motion.div
        className="absolute h-40 w-40 rounded-full border border-terra-200/80"
        animate={{ scale: [1, 1.35, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute h-32 w-32 rounded-full border border-terra-300/70"
        animate={{ scale: [1, 1.28, 1], opacity: [0.65, 0.08, 0.65] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeOut", delay: 0.45 }}
      />
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-terra-50/90"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-200/90 bg-white shadow-[0_12px_40px_-18px_rgba(46,37,32,0.22)]">
          <Monitor className="h-7 w-7 text-terra-600" strokeWidth={1.75} />
          <motion.span
            className="absolute -right-1.5 -top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-terra-500 text-white shadow-md"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.25} />
          </motion.span>
        </div>

        <div className="flex items-center gap-3">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-terra-500"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.18,
              }}
            />
          ))}
          <motion.div
            animate={{ x: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <UserCheck className="h-5 w-5 text-terra-600" strokeWidth={2} />
          </motion.div>
          {[0, 1, 2].map((i) => (
            <motion.span
              key={`r-${i}`}
              className="h-1.5 w-1.5 rounded-full bg-terra-400"
              animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
              transition={{
                duration: 1.1,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5 + i * 0.18,
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute inset-x-8 top-3 h-px bg-gradient-to-r from-transparent via-terra-300/60 to-transparent"
        animate={{ opacity: [0.2, 0.85, 0.2], scaleX: [0.6, 1, 0.6] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

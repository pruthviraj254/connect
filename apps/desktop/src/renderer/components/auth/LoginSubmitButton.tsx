"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

type LoginSubmitButtonProps = {
  busy: boolean;
  disabled?: boolean;
};

export function LoginSubmitButton({ busy, disabled }: LoginSubmitButtonProps) {
  const isDisabled = disabled ?? busy;

  return (
    <motion.button
      type="submit"
      disabled={isDisabled}
      className="login-submit-btn group relative inline-flex h-11 w-full items-center justify-center overflow-hidden rounded-md bg-terra-500 px-5 text-[15px] font-semibold text-white outline-none transition-[box-shadow,background-color] duration-300 disabled:cursor-not-allowed disabled:opacity-55"
      whileHover={!isDisabled ? { scale: 1.008, y: -1 } : undefined}
      whileTap={!isDisabled ? { scale: 0.992, y: 0 } : undefined}
      transition={{ duration: 0.22, ease }}
    >
      <span className="login-submit-shine pointer-events-none" aria-hidden />

      <AnimatePresence mode="wait" initial={false}>
        {busy ? (
          <motion.span
            key="loading"
            className="relative z-10 flex items-center justify-center gap-2.5"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease }}
          >
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.25} aria-hidden />
            <span>Signing in</span>
            <motion.span
              className="inline-flex gap-0.5"
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              aria-hidden
            >
              <span className="login-submit-dot" />
              <span className="login-submit-dot [animation-delay:0.15s]" />
              <span className="login-submit-dot [animation-delay:0.3s]" />
            </motion.span>
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="relative z-10 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease }}
          >
            <span>Sign in</span>
            <motion.span
              className="inline-flex opacity-80"
              initial={false}
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} />
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>

      <motion.span
        className="login-submit-glow-ring pointer-events-none absolute inset-0 rounded-md"
        animate={
          busy
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(204, 120, 92, 0)",
                  "0 0 0 6px rgba(204, 120, 92, 0.12)",
                  "0 0 0 0 rgba(204, 120, 92, 0)",
                ],
              }
            : { boxShadow: "0 0 0 0 rgba(204, 120, 92, 0)" }
        }
        transition={{ duration: 1.6, repeat: busy ? Infinity : 0, ease: "easeInOut" }}
        aria-hidden
      />
    </motion.button>
  );
}

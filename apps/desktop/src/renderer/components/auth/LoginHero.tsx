"use client";

import { motion } from "framer-motion";

import { LOGIN_HERO_CAPTION } from "@/components/auth/loginConstants";
import { LoginHeroAnimation } from "@/components/auth/LoginHeroAnimation";

const ease = [0.22, 1, 0.36, 1] as const;

const HERO_PARTICLES = [
  { left: "14%", top: "22%", delay: 0 },
  { left: "28%", top: "68%", delay: 1.4 },
  { left: "72%", top: "32%", delay: 0.7 },
  { left: "88%", top: "58%", delay: 2.2 },
] as const;

export function LoginHero() {
  return (
    <aside className="login-hero-panel relative z-[2] hidden min-h-screen overflow-hidden lg:flex lg:flex-col">
      <motion.div
        className="login-hero-glow login-hero-glow-a"
        aria-hidden
        animate={{ opacity: [0.65, 0.92, 0.65], scale: [1, 1.03, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="login-hero-glow login-hero-glow-b"
        aria-hidden
        animate={{ opacity: [0.5, 0.8, 0.5], x: [0, 10, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="login-hero-glow login-hero-glow-c"
        aria-hidden
        animate={{ opacity: [0.38, 0.65, 0.38], y: [0, -14, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.1 }}
      />
      <motion.div
        className="login-hero-glow login-hero-glow-bridge hidden lg:block"
        aria-hidden
        animate={{ opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />

      <motion.div
        className="login-hero-grid pointer-events-none absolute inset-0"
        aria-hidden
        animate={{ opacity: [0.28, 0.42, 0.28] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      {HERO_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="login-particle login-particle--hero"
          style={{ left: p.left, top: p.top, animationDelay: `${p.delay}s` }}
          aria-hidden
        />
      ))}

      <motion.div
        className="login-hero-data-edge pointer-events-none hidden lg:block"
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="login-hero-data-dot"
            animate={{
              y: [0, -6, 0],
              opacity: [0.2, 0.65, 0.2],
              scale: [0.85, 1, 0.85],
            }}
            transition={{
              duration: 3.2 + i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.9,
            }}
            style={{ top: `${36 + i * 14}%` }}
          />
        ))}
      </motion.div>

      <motion.div className="relative z-10 flex min-h-0 flex-1 flex-col p-6 xl:p-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.62, ease }}
          className="flex min-h-0 flex-1 flex-col items-center justify-center"
        >
          <motion.div
            className="login-media-frame login-media-frame--connected relative w-full max-w-[min(94%,44rem)]"
            whileHover={{ scale: 1.006 }}
            transition={{ duration: 0.4, ease }}
          >
            <motion.div
              className="login-media-inner login-media-inner--anim relative aspect-[16/11] min-h-[320px]"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease, delay: 0.08 }}
            >
              <LoginHeroAnimation />
              <div className="login-media-shine login-media-shine--drift pointer-events-none" aria-hidden />
            </motion.div>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.38, ease }}
          className="login-hero-caption mt-6 text-center xl:mt-8"
        >
          {LOGIN_HERO_CAPTION}
        </motion.p>
      </motion.div>
    </aside>
  );
}

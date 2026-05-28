"use client";

import { motion } from "framer-motion";

const PARTICLES = [
  { left: "8%", top: "14%", size: 3, delay: 0, duration: 14 },
  { left: "22%", top: "72%", size: 2, delay: 1.2, duration: 16 },
  { left: "38%", top: "28%", size: 2.5, delay: 0.6, duration: 18 },
  { left: "54%", top: "58%", size: 2, delay: 2.1, duration: 15 },
  { left: "68%", top: "18%", size: 3, delay: 0.9, duration: 17 },
  { left: "82%", top: "44%", size: 2, delay: 1.8, duration: 19 },
  { left: "91%", top: "78%", size: 2.5, delay: 2.6, duration: 14 },
  { left: "46%", top: "86%", size: 2, delay: 3.2, duration: 16 },
  { left: "12%", top: "48%", size: 2, delay: 1.5, duration: 20 },
  { left: "74%", top: "62%", size: 3, delay: 0.4, duration: 13 },
] as const;

const DATA_PULSES = [
  { y: "38%", delay: 0, duration: 5.5 },
  { y: "52%", delay: 1.8, duration: 6.2 },
  { y: "66%", delay: 3.1, duration: 5.8 },
] as const;

/** Full-page ambient layer: particles + cross-panel data flow (desktop). */
export function LoginAmbient() {
  return (
    <motion.div
      className="login-ambient pointer-events-none absolute inset-0 z-[1] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2 }}
      aria-hidden
    >
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="login-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      <motion.div
        className="login-bridge-glow hidden lg:block"
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="login-bridge-track hidden lg:block">
        {DATA_PULSES.map((pulse, i) => (
          <motion.span
            key={i}
            className="login-data-pulse"
            style={{ top: pulse.y }}
            initial={{ left: "46%", opacity: 0, scale: 0.6 }}
            animate={{
              left: ["46%", "54%"],
              opacity: [0, 0.7, 0.55, 0],
              scale: [0.6, 1, 0.85, 0.5],
            }}
            transition={{
              duration: pulse.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: pulse.delay,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

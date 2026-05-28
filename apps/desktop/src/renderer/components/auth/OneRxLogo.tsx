"use client";

import { motion } from "framer-motion";

type OneRxLogoProps = {
  size?: "sm" | "md";
  showWordmark?: boolean;
  className?: string;
};

export function OneRxLogo({
  size = "md",
  showWordmark = true,
  className = "",
}: OneRxLogoProps) {
  const markSize = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const glyphSize = size === "sm" ? 14 : 16;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-3 ${className}`}
    >
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-terra-950 text-terra-100 shadow-[0_4px_14px_-4px_rgba(61,26,10,0.35)] ${markSize}`}
        aria-hidden
      >
        <RxGlyph size={glyphSize} />
      </span>
      {showWordmark ? (
        <span className="font-display text-lg font-semibold tracking-tight text-warm-900">
          One<span className="text-terra-600">Rx</span>
        </span>
      ) : null}
    </motion.div>
  );
}

function RxGlyph({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 2h5.2c2 0 3.3 1.2 3.3 3 0 1.6-1 2.7-2.5 3l3 4H9.7L7 8.4H5.2V12H3V2zm2.2 1.7v3h2.7c1 0 1.6-.5 1.6-1.5s-.6-1.5-1.6-1.5H5.2zm6.1 6.1l3.1 3.1-1.2 1.2-3-3.1 1.1-1.2z"
        fill="currentColor"
      />
    </svg>
  );
}

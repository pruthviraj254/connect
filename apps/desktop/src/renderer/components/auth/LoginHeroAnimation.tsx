"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CheckCircle2,
  Inbox,
  Phone,
  Printer,
  Send,
  Sparkles,
} from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

const MODULES = [
  {
    id: "inbox",
    name: "Fax Inbox",
    tagline: "Review jobs from your virtual printer",
    steps: ["Receive", "Preview", "Annotate", "Send"],
  },
  {
    id: "printer",
    name: "Virtual Printer",
    tagline: "Print-to-fax from any Windows or Mac app",
    steps: ["Print", "Spool", "Convert", "Queue"],
  },
  {
    id: "outbound",
    name: "Send Fax",
    tagline: "Deliver PDFs to contacts & pharmacies",
    steps: ["Document", "Recipient", "Review", "Transmit"],
  },
  {
    id: "cdr",
    name: "Call Activity",
    tagline: "CDR visibility for your pharmacy line",
    steps: ["Sync", "Filter", "Review", "Log"],
  },
] as const;

const DOC_LINES = [
  { width: "88%", delay: 0 },
  { width: "72%", delay: 0.12 },
  { width: "94%", delay: 0.24 },
  { width: "61%", delay: 0.36 },
  { width: "78%", delay: 0.48 },
];

const CYCLE_MS = 5200;

export function LoginHeroAnimation() {
  const [moduleIndex, setModuleIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [docCycle, setDocCycle] = useState(0);

  const activeModule = MODULES[moduleIndex];
  const progress = useSpring(0, { stiffness: 90, damping: 22 });
  const progressWidth = useTransform(progress, (v) => `${v * 100}%`);

  useEffect(() => {
    progress.set((stepIndex + 1) / activeModule.steps.length);
  }, [stepIndex, activeModule.steps.length, progress]);

  useEffect(() => {
    const stepTimer = window.setInterval(() => {
      setStepIndex((i) => {
        if (i >= activeModule.steps.length - 1) {
          setDocCycle((c) => c + 1);
          return 0;
        }
        return i + 1;
      });
    }, CYCLE_MS / activeModule.steps.length);

    return () => window.clearInterval(stepTimer);
  }, [moduleIndex, activeModule.steps.length]);

  useEffect(() => {
    const moduleTimer = window.setInterval(() => {
      setModuleIndex((i) => (i + 1) % MODULES.length);
      setStepIndex(0);
    }, CYCLE_MS);

    return () => window.clearInterval(moduleTimer);
  }, []);

  return (
    <motion.div
      className="login-hero-animation absolute inset-0 flex items-center justify-center p-5 sm:p-7"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7, ease }}
      aria-hidden
    >
      <FloatingOrb className="login-anim-orb login-anim-orb-a" delay={0} />
      <FloatingOrb className="login-anim-orb login-anim-orb-b" delay={1.4} />

      <div className="login-anim-export-edge pointer-events-none" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            className="login-anim-export-dot"
            style={{ top: `${28 + i * 16}%` }}
            animate={{
              x: [0, 28, 52],
              opacity: [0, 0.55, 0],
              scale: [0.7, 1, 0.6],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.65,
            }}
          />
        ))}
      </div>

      <motion.div
        className="login-anim-scene relative w-full max-w-md"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease, delay: 0.1 }}
      >
        <motion.div
          className="login-anim-app mb-4 overflow-hidden rounded-xl border border-warm-200/90 bg-white/92 shadow-[0_20px_50px_-24px_rgba(46,37,32,0.2)] backdrop-blur-md"
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="flex items-center gap-2 border-b border-warm-200/80 bg-warm-50/90 px-3 py-2"
            layout
          >
            <span className="h-2 w-2 rounded-full bg-terra-300/90" />
            <span className="h-2 w-2 rounded-full bg-warm-300" />
            <span className="h-2 w-2 rounded-full bg-warm-300" />
            <span className="ml-auto text-[10px] font-medium tracking-wide text-warm-500">
              Rx-Manager
            </span>
          </motion.div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-1.5">
              {MODULES.map((m, i) => (
                <motion.span
                  key={m.id}
                  layout
                  className={[
                    "rounded-md px-2 py-1 text-[10px] font-semibold transition-colors duration-300",
                    i === moduleIndex
                      ? "bg-terra-500 text-white shadow-sm shadow-terra-500/25"
                      : "bg-warm-100 text-warm-500",
                  ].join(" ")}
                  animate={
                    i === moduleIndex
                      ? { scale: [1, 1.03, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.35 }}
                >
                  {m.name}
                </motion.span>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeModule.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease }}
                className="space-y-3"
              >
                <div>
                  <p className="font-display text-sm font-semibold text-warm-900">
                    {activeModule.name}
                  </p>
                  <p className="text-[11px] text-warm-500">{activeModule.tagline}</p>
                </div>

                <div className="space-y-2">
                  <motion.div
                    className="h-1 overflow-hidden rounded-full bg-warm-200/80"
                    layout
                  >
                    <motion.div
                      className="login-anim-progress h-full rounded-full bg-gradient-to-r from-terra-400 to-terra-600"
                      style={{ width: progressWidth }}
                    />
                  </motion.div>

                  <motion.div className="flex justify-between gap-1" layout>
                    {activeModule.steps.map((label, i) => (
                      <StepNode
                        key={`${activeModule.id}-${label}`}
                        label={label}
                        index={i}
                        active={i === stepIndex}
                        done={i < stepIndex}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>

            <motion.div
              className="rounded-lg border border-warm-200/80 bg-warm-50/60 p-3"
              layout
            >
              <motion.div
                className="mb-2 flex items-center gap-2"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles className="h-3.5 w-3.5 text-terra-600" strokeWidth={2} />
                <span className="text-label text-terra-700">Preparing fax preview</span>
              </motion.div>

              <div className="space-y-2" key={docCycle}>
                {DOC_LINES.map((line, i) => (
                  <motion.div
                    key={`${docCycle}-${i}`}
                    className="h-2 rounded-full bg-warm-200/90"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{
                      width: stepIndex >= activeModule.steps.length - 2 ? line.width : "28%",
                      opacity: stepIndex >= activeModule.steps.length - 2 ? 1 : 0.35,
                    }}
                    transition={{
                      duration: 0.55,
                      delay: line.delay,
                      ease,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        <FlowCard
          icon={<Printer className="h-4 w-4" strokeWidth={2} />}
          label="Virtual printer"
          x="-6%"
          y="8%"
          delay={0.2}
        />
        <FlowCard
          icon={<Inbox className="h-4 w-4" strokeWidth={2} />}
          label="Fax inbox"
          x="78%"
          y="22%"
          delay={0.5}
        />
        <FlowCard
          icon={<Send className="h-4 w-4" strokeWidth={2} />}
          label="Send outbound"
          x="4%"
          y="72%"
          delay={0.8}
        />
        <FlowCard
          icon={<Phone className="h-4 w-4" strokeWidth={2} />}
          label="Call activity"
          x="82%"
          y="78%"
          delay={1.1}
          accent
        />
      </motion.div>
    </motion.div>
  );
}

function StepNode({
  label,
  index,
  active,
  done,
}: {
  label: string;
  index: number;
  active: boolean;
  done: boolean;
}) {
  return (
    <motion.div
      className="flex min-w-0 flex-1 flex-col items-center gap-1"
      initial={false}
      animate={{ opacity: active || done ? 1 : 0.45 }}
    >
      <motion.span
        className={[
          "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
          done
            ? "bg-terra-500 text-white"
            : active
              ? "bg-terra-100 text-terra-700 ring-2 ring-terra-300/80"
              : "bg-warm-200 text-warm-500",
        ].join(" ")}
        animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
        transition={{ duration: 0.5, repeat: active ? Infinity : 0, repeatDelay: 0.6 }}
      >
        {done ? "✓" : index + 1}
      </motion.span>
      <span
        className={[
          "max-w-full truncate text-center text-[9px] font-medium leading-tight",
          active ? "text-terra-700" : "text-warm-500",
        ].join(" ")}
      >
        {label}
      </span>
    </motion.div>
  );
}

function FlowCard({
  icon,
  label,
  x,
  y,
  delay,
  accent,
}: {
  icon: ReactNode;
  label: string;
  x: string;
  y: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <motion.div
      className={[
        "login-anim-flow-card absolute z-20 flex items-center gap-2 rounded-lg border px-2.5 py-2 shadow-md backdrop-blur-sm",
        accent
          ? "border-terra-300/80 bg-terra-50/95 text-terra-800"
          : "border-warm-200/90 bg-white/95 text-warm-700",
      ].join(" ")}
      style={{ left: x, top: y }}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [0, -5, 0],
      }}
      transition={{
        opacity: { duration: 0.45, delay },
        scale: { duration: 0.45, delay },
        y: { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: delay + 0.3 },
      }}
    >
      <span
        className={[
          "flex h-7 w-7 items-center justify-center rounded-md",
          accent ? "bg-terra-500/15 text-terra-600" : "bg-warm-100 text-warm-600",
        ].join(" ")}
      >
        {icon}
      </span>
      <span className="text-[10px] font-semibold whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

function FloatingOrb({ className, delay }: { className: string; delay: number }) {
  return (
    <motion.div
      className={className}
      animate={{
        opacity: [0.35, 0.65, 0.35],
        scale: [1, 1.08, 1],
        y: [0, -12, 0],
      }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

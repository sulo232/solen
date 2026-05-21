"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/**
 * LiveActivityCard — Q58 (locked 2026-05-02) profile hero card.
 *
 * iOS Live-Activity-inspired event-driven card. Shows ONE state at a time
 * picked by server-side priority (NOT auto-rotating). Morphs ONLY when the
 * resolved state changes — never on a timer.
 *
 * 6 priority states (server picks the first qualifying):
 *   1. upcoming     — appointment within 24h
 *   2. loyalty      — ≤2 stamps from reward at any salon
 *   3. deal         — favorited salon has off-peak deal today
 *   4. reply        — review reply from salon owner in last 7d
 *   5. rebook       — average booking-cycle reached for any past salon
 *   6. empty        — no qualifying state, fallback CTA to /entdecken
 *
 * Anatomy per state varies by register (see STATES below).
 *
 * Reduced-motion: instant swap, no slide, no cross-fade.
 *
 * Accepts pre-resolved state from caller (typically from /api/profile/live-state).
 */
export type LiveActivityState =
  | { kind: "upcoming"; eyebrow: string; headline: string; meta: string; href: string }
  | { kind: "loyalty"; eyebrow: string; headline: string; meta: string; href: string; filled: number; total: number }
  | { kind: "deal"; eyebrow: string; headline: string; meta: string; href: string }
  | { kind: "reply"; eyebrow: string; headline: string; meta: string; href: string }
  | { kind: "rebook"; eyebrow: string; headline: string; meta: string; href: string }
  | { kind: "empty"; headline: string; href: string };

interface LiveActivityCardProps {
  state: LiveActivityState | null;
  /** Loading skeleton flag for initial fetch */
  loading?: boolean;
  className?: string;
}

const REGISTERS = {
  upcoming: {
    bg: "linear-gradient(135deg,#1B4D1B 0%,#F3A864 100%)",
    text: "#ffffff",
    border: "transparent",
  },
  loyalty: {
    bg: "linear-gradient(135deg,#1B4D1B 0%,#F3A864 100%)",
    text: "#ffffff",
    border: "transparent",
  },
  deal: {
    bg: "linear-gradient(135deg,#1A1108 0%,#3C3128 100%)",
    text: "#ffffff",
    border: "transparent",
  },
  reply: {
    bg: "#FFF4E8",
    text: "#1A1209",
    border: "#F3D8B8",
  },
  rebook: {
    bg: "#FAF7F3",
    text: "#1A1209",
    border: "transparent",
  },
  empty: {
    bg: "#ffffff",
    text: "#1A1209",
    border: "rgba(27, 77, 27,.4)",
  },
} as const;

export default function LiveActivityCard({ state, loading, className }: LiveActivityCardProps) {
  const prefersReducedMotion = useReducedMotion();

  const morph = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 4 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.4, ease: [0.2, 0.8, 0.4, 1] as const },
      };

  if (loading) {
    return (
      <div
        className={[
          "rounded-[16px] h-[120px] animate-pulse bg-s-bg-sunken",
          className ?? "",
        ].join(" ")}
        aria-busy
      />
    );
  }

  if (!state) return null;

  const reg = REGISTERS[state.kind];
  const isDashed = state.kind === "empty";

  return (
    <AnimatePresence mode="wait">
      <motion.div key={state.kind} {...morph}>
        <Link
          href={state.href}
          className={[
            "block rounded-[16px] p-4 sm:p-5 min-h-[120px]",
            "transition-[transform] duration-150 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2",
            className ?? "",
          ].join(" ")}
          style={{
            background: reg.bg,
            color: reg.text,
            border: isDashed ? `2px dashed ${reg.border}` : reg.border !== "transparent" ? `1px solid ${reg.border}` : undefined,
          }}
        >
          {state.kind === "empty" ? (
            <EmptyContent state={state} />
          ) : state.kind === "loyalty" ? (
            <LoyaltyContent state={state} />
          ) : (
            <StandardContent state={state} register={state.kind} />
          )}
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Per-state content blocks ────────────────────────────────────── */

function StandardContent({
  state,
  register,
}: {
  state: Extract<LiveActivityState, { kind: "upcoming" | "deal" | "reply" | "rebook" }>;
  register: "upcoming" | "deal" | "reply" | "rebook";
}) {
  // Eyebrow color shifts by register: amber on dark gradient, coral on light bg
  const eyebrowColor = register === "deal" ? "#F3A864" : register === "upcoming" ? "rgba(255,255,255,.85)" : "#0F3010";

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p
          className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-[.20em]"
          style={{ color: eyebrowColor }}
        >
          {state.eyebrow}
        </p>
        <h3
          className="mt-1.5 font-heading text-[18px] sm:text-[22px] leading-[0.98] uppercase"
          style={{ letterSpacing: "0.01em" }}
        >
          {state.headline}
        </h3>
        <p className="mt-2 font-body text-[12px] sm:text-[13px] opacity-85">{state.meta}</p>
      </div>
      <ArrowRight size={20} className="shrink-0 mt-1 opacity-90" aria-hidden />
    </div>
  );
}

function LoyaltyContent({
  state,
}: {
  state: Extract<LiveActivityState, { kind: "loyalty" }>;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p
          className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-[.20em]"
          style={{ color: "rgba(255,255,255,.85)" }}
        >
          {state.eyebrow}
        </p>
        <h3
          className="mt-1.5 font-heading text-[18px] sm:text-[22px] leading-[0.98] uppercase"
          style={{ letterSpacing: "0.01em" }}
        >
          {state.headline}
        </h3>
        <p className="mt-2 font-body text-[12px] sm:text-[13px] opacity-85">{state.meta}</p>
        {/* Inline stamp dots */}
        <div className="mt-3 flex items-center gap-1.5">
          {Array.from({ length: state.total }).map((_, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i < state.filled ? "#ffffff" : "rgba(255,255,255,.3)",
              }}
              aria-hidden
            />
          ))}
          <span className="ml-1 font-body text-[10px] tabular-nums opacity-90">
            {state.filled}/{state.total}
          </span>
        </div>
      </div>
      <ArrowRight size={20} className="shrink-0 mt-1 opacity-90" aria-hidden />
    </div>
  );
}

function EmptyContent({
  state,
}: {
  state: Extract<LiveActivityState, { kind: "empty" }>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="flex-1 min-w-0">
        <h3
          className="font-heading text-[16px] sm:text-[18px] leading-[1] uppercase"
          style={{ letterSpacing: "0.01em", color: "#1A1209" }}
        >
          {state.headline}
        </h3>
        <p className="mt-1 font-body text-[12px] text-s-ink/60">Wo · Was · Wann</p>
      </div>
      <ArrowRight size={20} className="shrink-0 text-s-coral" aria-hidden />
    </div>
  );
}

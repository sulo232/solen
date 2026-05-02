"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

/**
 * CelebrationRing — Q36 celebration grammar primitive.
 *
 * Q36 locks 5 celebration moments across the product:
 *   1. Booking confirmed (BookingSuccess) — `kind="booking"`, ~700ms ring
 *   2. Payment confirmed (PayConfirmStep success) — `kind="payment"`, ~700ms ring
 *   3. Favorite added (heart click) — `kind="favorite"`, ~500ms ring (lighter)
 *   4. Loyalty reward unlocked (StampCard milestone) — `kind="loyalty"`, ~1200ms ring (milestone scale)
 *   5. Review submitted (ReviewPrompt) — `kind="review"`, ~700ms ring
 *
 * Anatomy:
 *   - coral ring expand (1px -> N px) with ease-out (200/400ms baseline; longer for loyalty)
 *   - amber checkmark scale-in with overshoot ~200ms after ring fires
 *   - optional dark-ink toast slides up from bottom (caller dispatches via Toast context separately)
 *
 * Reduced-motion: instant overlay swap, no expand, no scale (per `prefers-reduced-motion`).
 *
 * Caller passes children as the "subject" (a card, a button, a chip, or even just a coordinate
 * point) and the ring expands FROM around it. Position: absolute over the subject's bounding box.
 */
type Kind = "booking" | "payment" | "favorite" | "loyalty" | "review";

const TIMINGS: Record<Kind, { ring: number; checkmark: { delay: number; ringColor: string } }> = {
  booking:  { ring: 700,  checkmark: { delay: 100, ringColor: "#E8624A" } },
  payment:  { ring: 700,  checkmark: { delay: 100, ringColor: "#E8624A" } },
  favorite: { ring: 500,  checkmark: { delay: 80,  ringColor: "#E8624A" } },
  loyalty:  { ring: 1200, checkmark: { delay: 200, ringColor: "#F3A864" } }, // amber for milestone register-shift
  review:   { ring: 700,  checkmark: { delay: 100, ringColor: "#E8624A" } },
};

interface CelebrationRingProps {
  /** Which celebration moment is firing — sets ring + checkmark timing */
  kind: Kind;
  /** Toggle to fire the celebration. Setting true triggers one-shot animation; reset to false to allow re-fire. */
  active: boolean;
  /** Maximum ring radius in px (relative to subject center). Default 60. */
  maxRadius?: number;
  /** Show the checkmark? Default true. Set false for surfaces that have their own success symbol. */
  showCheckmark?: boolean;
  /** Optional className for the absolute-positioned wrapper */
  className?: string;
}

export default function CelebrationRing({
  kind,
  active,
  maxRadius = 60,
  showCheckmark = true,
  className,
}: CelebrationRingProps) {
  const prefersReducedMotion = useReducedMotion();
  const [internalActive, setInternalActive] = useState(false);
  const t = TIMINGS[kind];

  // Drive a one-shot reset so the same `active=true` won't keep replaying.
  useEffect(() => {
    if (!active) {
      setInternalActive(false);
      return;
    }
    setInternalActive(true);
    const total = (t.checkmark.delay + 600) + 200;
    const timer = setTimeout(() => setInternalActive(false), total);
    return () => clearTimeout(timer);
  }, [active, t.checkmark.delay]);

  if (!internalActive) return null;

  // Reduced-motion: instant checkmark only, no ring expand
  if (prefersReducedMotion) {
    return showCheckmark ? (
      <div
        className={[
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          className ?? "",
        ].join(" ")}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: t.checkmark.ringColor }}
        >
          <Check size={18} strokeWidth={3} />
        </div>
      </div>
    ) : null;
  }

  return (
    <div
      className={[
        "absolute inset-0 flex items-center justify-center pointer-events-none",
        className ?? "",
      ].join(" ")}
      aria-hidden
    >
      {/* Coral ring expand */}
      <motion.div
        initial={{ width: 8, height: 8, opacity: 1 }}
        animate={{ width: maxRadius * 2, height: maxRadius * 2, opacity: 0 }}
        transition={{ duration: t.ring / 1000, ease: [0.2, 0.8, 0.4, 1] }}
        className="absolute rounded-full border-2"
        style={{ borderColor: t.checkmark.ringColor }}
      />

      {/* Checkmark scale-in with overshoot */}
      <AnimatePresence>
        {showCheckmark && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: t.checkmark.delay / 1000,
              duration: 0.4,
              ease: [0.4, 1.4, 0.5, 1], // overshoot
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md"
            style={{ background: t.checkmark.ringColor }}
          >
            <Check size={18} strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";

/**
 * CountUp — animates a number from 0 → `to` (de-CH formatted, optional "+")
 * when scrolled into view, once. ~1.4s easeOut. Respects prefers-reduced-motion
 * (snaps to final). Page-scoped (used on /fuer-salons stat cards).
 *
 * NOTE: requires a real numeric value. The /fuer-salons stats are still demo
 * figures flagged "echte Daten folgen" — swap `to` for the real numbers when known.
 */
export function CountUp({
  to,
  plus = false,
  className,
}: {
  to: number;
  plus?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    // Deterministic Swiss apostrophe grouping (matches EarningsCalculator; avoids Intl).
    const fmt = (v: number) =>
      Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "’") + (plus ? "+" : "");
    if (reduce) {
      node.textContent = fmt(to);
      return;
    }
    const controls = animate(0, to, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
  }, [inView, to, plus, reduce]);

  return (
    <span ref={ref} className={className}>
      0
    </span>
  );
}

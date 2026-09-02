'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  className?: string;
  // Optional formatter for the displayed (already-rounded) integer, e.g. Swiss
  // thousands grouping ("1'200") for totals >= 1000. Defaults to a bare String()
  // so callers that don't need grouping (minutes) are unaffected.
  format?: (n: number) => string;
}

// Owner-approved count-up (comparison lab, public/_mockups/liftup-services-motion,
// owner 2026-07-18: "count up is good"). The number climbs from its CURRENT value
// to the new one, never from zero, over a CONSTANT duration regardless of the
// delta , the owner's fear was a big jump (e.g. 0 -> CHF 200) taking longer to
// count than a small one (65 -> 93), so the duration never scales with the
// delta, only the per-frame step size does. Ease-out cubic, number only, no
// scale/blur/pop. The CHF label and " min" unit are rendered OUTSIDE this
// component by the caller and stay static.
const DURATION_MS = 480;
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);

export default function CountUpNumber({ value, className, format }: CountUpNumberProps) {
  const [display, setDisplay] = useState(value);
  const displayRef = useRef(value);
  const mountedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // First mount: show the value immediately, no animation from 0.
    if (!mountedRef.current) {
      mountedRef.current = true;
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    // Cancel any in-flight animation before starting a new one, so a rapid
    // add/remove mid-count restarts cleanly from wherever the number currently
    // sits (no stale overwrite, no leak, no glitch).
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const from = displayRef.current;
    const to = value;
    if (from === to) return;

    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
      displayRef.current = to;
      setDisplay(to);
      return;
    }

    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / DURATION_MS, 1);
      const eased = easeOutCubic(p);
      // Intermediate frames round to clean integers for the visual count-up,
      // but the final frame (p >= 1) settles on the exact `to` so a fractional
      // total (e.g. 65.50) is never rounded away from the true value.
      const next = p >= 1 ? to : Math.round(from + (to - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    // Safety net (2026-09-01): the count is driven ENTIRELY by animation frames, and a
    // browser stops delivering them whenever the tab is hidden or backgrounded. Measured
    // live: 0 frames in 1500ms in a hidden tab, during which this component was receiving
    // value 190 and painting 0. So a customer who backgrounds the page mid-animation and
    // comes back reads CHF 0 next to a service they picked. There was a fallback for
    // reduced-motion but none for "frames never arrive". This timer settles on the exact
    // value if the animation has not finished a little after its own duration. On a
    // normal run it is either cleared by the cleanup below (the value changed again, or
    // the component unmounted) or it fires onto a number already equal to `to`, which
    // React's same-value bail-out drops, so it never repaints and never wobbles.
    const settle = setTimeout(() => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      displayRef.current = to;
      setDisplay(to);
    }, DURATION_MS + 120);

    return () => {
      clearTimeout(settle);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value]);

  return <span className={className}>{format ? format(display) : display}</span>;
}

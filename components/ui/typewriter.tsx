"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Typewriter — V3-D75-typewriter (2026-05-18).
 *
 * Animated text component that types characters one at a time, pauses, then
 * deletes and types the next string in the array. Loops indefinitely (or
 * `loop={false}` to stop after the last string).
 *
 * Inspired by motion-primitives' Typewriter pattern but rebuilt locally so we
 * own the timing constants and the blinking caret.
 *
 * Usage:
 *   <Typewriter
 *     texts={["First message", "Second message", "Third"]}
 *     delay={45}            // ms between characters when typing
 *     deleteDelay={25}      // ms between characters when deleting
 *     pauseBetween={2500}   // ms to hold finished text before deleting
 *     baseText="Yo "        // optional static prefix
 *     loop                  // restart from texts[0] after last (default true)
 *   />
 *
 * Respects prefers-reduced-motion: shows the first text statically with no
 * animation, no caret blink.
 */

interface TypewriterProps {
  texts: string[];
  /** ms per char when typing. Default 60. */
  delay?: number;
  /** ms per char when deleting. Default = delay/2. */
  deleteDelay?: number;
  /** ms to hold finished text before deleting. Default 2000. */
  pauseBetween?: number;
  /** Static prefix that doesn't animate. */
  baseText?: string;
  /** Loop forever. Default true. */
  loop?: boolean;
  /** Tailwind classes for the wrapper span. */
  className?: string;
  /** Caret color override. */
  caretClassName?: string;
}

export function Typewriter({
  texts,
  delay = 60,
  deleteDelay,
  pauseBetween = 2000,
  baseText = "",
  loop = true,
  className,
  caretClassName,
}: TypewriterProps) {
  // Start with first text visible so even if useEffect doesn't fire (SSR /
  // hydration edge case), the static reply is readable.
  const [displayed, setDisplayed] = React.useState(() => texts[0] ?? "");
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    // Reduced-motion: show first text statically, no animation.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayed(texts[0] ?? "");
      setDone(true);
      return;
    }

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let textIdx = 0;
    let charIdx = 0;
    let mode: "type" | "pause" | "delete" = "type";
    const delDelay = deleteDelay ?? Math.round(delay / 2);

    const tick = () => {
      if (cancelled) return;
      const text = texts[textIdx];
      if (!text) return;

      if (mode === "type") {
        if (charIdx < text.length) {
          charIdx++;
          setDisplayed(text.slice(0, charIdx));
          timerId = setTimeout(tick, delay);
        } else {
          mode = "pause";
          timerId = setTimeout(tick, pauseBetween);
        }
      } else if (mode === "pause") {
        mode = "delete";
        timerId = setTimeout(tick, delDelay);
      } else if (mode === "delete") {
        if (charIdx > 0) {
          charIdx--;
          setDisplayed(text.slice(0, charIdx));
          timerId = setTimeout(tick, delDelay);
        } else {
          const next = textIdx + 1;
          if (next >= texts.length && !loop) {
            setDone(true);
            return;
          }
          textIdx = next % texts.length;
          mode = "type";
          timerId = setTimeout(tick, delay);
        }
      }
    };

    timerId = setTimeout(tick, delay);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [texts, delay, deleteDelay, pauseBetween, loop]);

  return (
    <span className={cn(className)}>
      {baseText}
      {displayed}
      {!done && (
        <span
          aria-hidden
          className={cn(
            "ml-[1px] inline-block h-[0.9em] w-[2px] -translate-y-[1px] animate-pulse bg-current align-middle",
            caretClassName,
          )}
        />
      )}
    </span>
  );
}

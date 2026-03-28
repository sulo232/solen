"use client";

import { useRef, useState, useEffect, type ReactNode } from "react";

/* ────────────────────────────────────────────────────────────────────────────
 * ScrollableFilterRow — single horizontal row of filter pills
 *
 * Two variants:
 *   1. Text pills (default)  — small rounded-pill buttons
 *   2. Icon circles          — 40×40 circle with SVG + small label below
 *
 * Features:
 *   • Right-edge fade gradient when scrollable
 *   • .scrollbar-hide for invisible scrollbar
 *   • URL-driven or local state — consumer handles state
 * ──────────────────────────────────────────────────────────────────────── */

// ── Types ────────────────────────────────────────────────────────────────

export interface PillOption {
  value: string;
  label: string;
}

export interface IconOption {
  value: string;
  label: string;
  icon: ReactNode;
}

interface BaseProps {
  /** Category label displayed on the left */
  label: string;
  /** Currently selected value (null = nothing selected) */
  activeValue: string | null;
  /** Called when a pill is toggled (null = deselected) */
  onSelect: (value: string | null) => void;
}

interface TextPillProps extends BaseProps {
  variant?: "pill";
  options: PillOption[];
}

interface IconCircleProps extends BaseProps {
  variant: "icon";
  options: IconOption[];
}

export type ScrollableFilterRowProps = TextPillProps | IconCircleProps;

// ── Component ────────────────────────────────────────────────────────────

export default function ScrollableFilterRow(props: ScrollableFilterRowProps) {
  const { label, activeValue, onSelect, variant } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check if overflowing to show/hide the fade
  const checkOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 4);
  };

  useEffect(() => {
    checkOverflow();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkOverflow, { passive: true });
    window.addEventListener("resize", checkOverflow);
    return () => {
      el.removeEventListener("scroll", checkOverflow);
      window.removeEventListener("resize", checkOverflow);
    };
  }, []);

  const handleToggle = (value: string) => {
    onSelect(activeValue === value ? null : value);
  };

  return (
    <div className="relative flex items-center gap-3">
      {/* Label */}
      <span className="text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold shrink-0 min-w-[60px]">
        {label}
      </span>

      {/* Scrollable strip */}
      <div
        ref={scrollRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-hide"
      >
        {variant === "icon"
          ? (props as IconCircleProps).options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                className={`shrink-0 flex flex-col items-center gap-1 transition-[background-color,color,box-shadow] duration-150`}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-[background-color,color,box-shadow] duration-150 ${
                    activeValue === opt.value
                      ? "bg-s-coral border-s-coral text-white shadow-warm-sm"
                      : "bg-white dark:bg-s-dm-surface border-[#e0dcd6] dark:border-white/15 text-s-ink/50 dark:text-s-dm-text/50 hover:border-s-coral/40"
                  }`}
                >
                  {opt.icon}
                </span>
                <span
                  className={`text-[10px] font-heading font-semibold leading-none transition-colors ${
                    activeValue === opt.value
                      ? "text-s-coral"
                      : "text-s-ink/50 dark:text-s-dm-text/50"
                  }`}
                >
                  {opt.label}
                </span>
              </button>
            ))
          : (props as TextPillProps).options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleToggle(opt.value)}
                className={`shrink-0 px-[14px] py-[6px] rounded-full text-[12px] font-semibold tracking-[0.04em] border-[1.5px] transition-[background-color,color,box-shadow] duration-150 whitespace-nowrap ${
                  activeValue === opt.value
                    ? "bg-s-coral border-s-coral text-white shadow-warm-sm"
                    : "bg-white dark:bg-s-dm-surface border-[#e0dcd6] dark:border-white/15 text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40"
                }`}
              >
                {opt.label}
              </button>
            ))}
      </div>

      {/* Right fade indicator */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 pointer-events-none bg-gradient-to-l from-white dark:from-s-dm-surface to-transparent rounded-r-[16px]" />
      )}
    </div>
  );
}

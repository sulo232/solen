"use client";

import { AlertTriangle, RotateCcw, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * ErrorState: inline "a fetch failed" state with a Retry button.
 *
 * Companion to <EmptyState> (genuinely-no-data). This one is for the
 * "something broke while loading" case so a panel NEVER shows an
 * indefinite spinner. Matches the approved mockup
 * (public/solen-qa-fixes.html section 2): red icon chip + headline +
 * subtext + ink "Try again" pill.
 *
 * Distinct from <ErrorFallback> (the route-level error-boundary fallback,
 * which takes { error, reset }). This is a plain inline panel you render
 * from a page's own error state. Layer 3 (semantic UI, red = error).
 */
interface ErrorStateProps {
  /** Headline. Keep it short + reassuring. */
  title: string;
  /** Optional one-line subtext under the headline. */
  message?: string;
  /** Retry handler, wired to the page's re-fetch. */
  onRetry: () => void;
  /** Retry button label. */
  retryLabel: string;
  /** Override the icon (default: AlertTriangle). */
  icon?: LucideIcon;
  className?: string;
}

export default function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  icon: Icon = AlertTriangle,
  className,
}: ErrorStateProps) {
  const prefersReducedMotion = useReducedMotion();
  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.97 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.25, ease: [0.2, 0.8, 0.4, 1] as const },
      };

  return (
    <motion.div
      role="alert"
      className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}
      {...animationProps}
    >
      <div className="mb-5 flex items-center justify-center w-12 h-12 rounded-[14px] bg-s-error-bg">
        <Icon size={24} className="text-s-error" strokeWidth={2.4} />
      </div>
      <h3 className="font-heading text-s-ink text-lg mb-1.5">{title}</h3>
      {message && (
        <p className="font-body text-s-ink-2 text-sm max-w-xs leading-relaxed mb-5">{message}</p>
      )}
      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-pill bg-s-ink text-white text-sm font-medium hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 shadow-warm-sm"
      >
        <RotateCcw size={14} strokeWidth={1.6} />
        {retryLabel}
      </button>
    </motion.div>
  );
}

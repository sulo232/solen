"use client";

import Image from "next/image";
import { type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const ILLUSTRATIONS = {
  "no-results": "/illustrations/no-results.svg",
  "coming-soon": "/illustrations/coming-soon.svg",
} as const;

/**
 * EmptyState — generic icon-led empty state.
 *
 * For Q60 surfaces (consumer profile sub-pages — bookings, favorites, looks, stamps),
 * prefer the more specific variants:
 *   - <EmptyStateFTU>      — full-screen first-time user (Treatment A)
 *   - <EmptyStateInline>   — no-upcoming-has-past inline tile (Treatment B)
 *   - <EmptyStateFiltered> — filter returned nothing, neutral (Treatment C)
 *
 * This generic version stays for legacy surfaces and admin tools.
 *
 * `zone` prop removed 2026-05-02 per Q62 (zones retired). Animation now driven by
 * `prefers-reduced-motion` only.
 */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  action?: React.ReactNode;
  illustration?: keyof typeof ILLUSTRATIONS;
  eyebrow?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  illustration,
  eyebrow,
  className,
}: EmptyStateProps) {
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
      className={cn("flex flex-col items-center justify-center text-center py-16 px-6", className)}
      {...animationProps}
    >
      {illustration && (
        <Image
          src={ILLUSTRATIONS[illustration]}
          alt=""
          width={120}
          height={120}
          className="mb-4 opacity-80"
          priority={false}
        />
      )}
      <div className="relative mb-5 flex items-center justify-center w-16 h-16">
        {/* Soft halo — NO scale, explicit negative inset */}
        <div className="absolute -inset-5 rounded-full blur-xl bg-s-bg-sunken" />
        <div className="relative flex items-center justify-center w-16 h-16 rounded-[20px] bg-s-bg-sunken">
          <Icon size={32} className="text-s-ink-2" strokeWidth={1.5} />
        </div>
      </div>
      {eyebrow && (
        <p className="text-[12px] font-body font-bold uppercase tracking-[.22em] text-s-ink/30 mb-2">
          {eyebrow}
        </p>
      )}
      <h3 className="font-heading text-s-ink text-lg mb-1.5">{title}</h3>
      {message && (
        <p className="font-body text-s-ink-2 text-sm max-w-xs leading-relaxed">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

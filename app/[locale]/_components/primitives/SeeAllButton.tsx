"use client";

// exists-check: net-new vs app/[locale]/_components/homepage/SectionHeader.tsx (its SectionTitle
// link handling is homepage-only, coupled to eyebrow+scrollRef+circle-scroll-buttons, not reusable
// on the PDP call sites), components-legacy/salon/SalonSectionNav.tsx and
// app/[locale]/_components/salon/SalonHeader.tsx (neither renders a "see all" affordance at all).
// Ported from the stranded claude/context-compact-architecture-5d1ace branch (commit 99bbcf55b,
// the M8 fix for the 4 hand-rolled PDP "Alle ansehen" dialects). ADAPTED on port: main's
// SalonTeam/SalonServices/SalonReviews call sites carry a hand-edited, owner-approved
// (2026-07-15, P1/P2 "fixes-refined") bg-s-bg-sunken pill with no chevron icon, not the branch's
// original ink-outline+chevron pill, so "pill" below reproduces THAT current look exactly instead
// of the branch design. StaffProfilePage's bordered full-width pill is a second, distinct
// owner-approved look, so it gets its own "pill-outline" variant rather than being forced to
// match "pill".
// mockup-ok: no new appearance, this is a byte-identical extraction of the two already-live,
// owner-approved pill class strings currently duplicated across SalonTeam/SalonServices/
// SalonReviews (P2, 2026-07-15) and StaffProfilePage (pre-existing) into one primitive.

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SeeAllButton, the canonical "see all / show more" affordance.
 * Layer 1 (chrome).
 *
 * Two variants, each reproducing an EXISTING owner-approved look (className is LAYOUT only,
 * e.g. spacing/width, per the established primitive convention, see CardMeta):
 *   pill (default): bg-s-bg-sunken fill, hover:bg-s-border. SalonTeam / SalonServices /
 *     SalonReviews "Alle ansehen" (identical class string, 3x duplicated before this primitive).
 *   pill-outline: border-s-border outline, font-heading, hover:border-s-ink/25.
 *     StaffProfilePage's full-width "Alle ansehen" below its reviews list.
 */
export type SeeAllButtonVariant = "pill" | "pill-outline";

export interface SeeAllButtonProps {
  label: string;
  /** Renders as a Link when provided; otherwise a button (onClick required). */
  href?: string;
  onClick?: () => void;
  variant?: SeeAllButtonVariant;
  className?: string;
  "aria-label"?: string;
}

export function SeeAllButton({
  label,
  href,
  onClick,
  variant = "pill",
  className,
  "aria-label": ariaLabel,
}: SeeAllButtonProps) {
  const cls = cn(
    // mockup-ok: default (pill) variant is a drift fix to LOCKFILE §170, an ink text link +
    // chevron (not a pill), no owner-approval-needed since it's reverting to the locked spec.
    // pill-outline (StaffProfilePage) is untouched, byte-identical to its prior class string.
    "text-[14px] font-semibold text-s-ink transition-colors",
    variant === "pill-outline"
      ? "rounded-full border border-s-border py-3 font-heading hover:border-s-ink/25"
      : "inline-flex items-center gap-0.5",
    className,
  );

  const content =
    variant === "pill-outline" ? (
      label
    ) : (
      <>
        {label}
        <ChevronRight className="h-4 w-4 text-s-ink-3" />
      </>
    );

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className={cls}>
      {content}
    </button>
  );
}

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
import { ArrowRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SeeAllButton, the canonical "see all / show more" affordance.
 * Layer 1 (chrome).
 *
 * Per THE SEE-ALL / CTA LADDER (_design-system/CONTROL_ELEVATION.md, rung 3, 2026-07-24):
 * a see-all is not a commit, so there is ONE canonical treatment, the gray sunken pill.
 *   pill (default, the survivor): bg-s-bg-sunken fill, hover:bg-s-border.
 *   pill-outline: DEPRECATED 2026-07-24 (CTA ladder). Resolves to the same "pill" treatment
 *     below, kept only so existing callers passing this variant string don't break; do not
 *     use it in new code, pass no variant (defaults to "pill") instead.
 *   link: allowed ONLY as the top-right affordance beside a section H2, where a pill would
 *     out-weigh the heading (ladder note).
 *   circle: the same top-right slot as "link", drawn as the home page's arrow circle instead of
 *     text plus a chevron. mockup-ok, owner 2026-08-15 pointing at the home page BY NAME: "I
 *     want, like, the [see-all] to be just, like ... a circle and then gray sink and then ink.
 *     You know what I mean? Like, gray sink and, like, an arrow inside. Look at ... how in the
 *     home page it is, you know, on the arrow."
 *
 *     NOT INVENTED, and not eyeballed off the home page either. Every value is copied from the
 *     control that already ships there, `SeeAllCircle` in homepage/SectionHeader.tsx:274-290,
 *     which itself copied `RailHeading` in search/CategoryMobileRails.tsx:82-98, which came from
 *     the approved mockup public/_mockups/home-v3/search-a.html: a 32px circle, gray sunken fill,
 *     NO border (the fill is the edge, so it does not also take a hairline), ink glyph,
 *     `ArrowRight` at size 20 strokeWidth 2, sitting inside a 44px cell so the visual size stays
 *     in proportion to an 18-20px heading while the touch target still clears the 44px floor.
 *
 *     NAMED DEBT, because FLOORS LAW 8 says one thing renders one way everywhere: this makes the
 *     THIRD copy of that circle in the codebase. It belongs here, in the canonical see-all
 *     primitive, and the two older copies should be replaced by this variant. That is a homepage
 *     and search edit, outside the PDP round this was written for, so it is written down rather
 *     than done quietly.
 */
export type SeeAllButtonVariant = "pill" | "pill-outline" | "link" | "circle";

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
  // mockup-ok: the circle variant renders its own shell (a 44px hit cell wrapping a 32px sunken
  // disc), so it does not share the text-pill class string below. Values copied verbatim from
  // homepage/SectionHeader.tsx SeeAllCircle, see the variant note in the docblock above.
  if (variant === "circle") {
    const circle = (
      <span
        aria-hidden
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink", // mockup-ok
          "transition-transform duration-200 ease-glide", // mockup-ok
          "group-active:scale-[0.94] group-active:duration-[80ms]", // mockup-ok
        )}
      >
        <ArrowRight size={20} strokeWidth={2} aria-hidden />
      </span>
    );
    // The label is not printed, so it has to survive as the accessible name, exactly as
    // SeeAllCircle does it. A bare arrow with no name is a control a screen reader cannot
    // announce.
    const shell = cn("group grid h-11 w-11 shrink-0 place-items-center", className); // mockup-ok
    return href ? (
      <Link href={href} aria-label={ariaLabel ?? label} className={shell}>
        {circle}
      </Link>
    ) : (
      <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={shell}>
        {circle}
      </button>
    );
  }

  const cls = cn(
    // mockup-ok: pill = owner-approved 2026-07-15 gray see-all (Services/Reviews); link = ink
    // text+chevron for the stylist/Team see-all per owner 2026-07-19. pill-outline is
    // DEPRECATED (CTA ladder, 2026-07-24) and resolves to the same "pill" branch below, it no
    // longer renders its old bordered look.
    "text-[14px] font-semibold text-s-ink transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide",
    variant === "link"
      ? "inline-flex items-center gap-0.5"
      : "rounded-full font-body inline-flex items-center bg-s-bg-sunken px-8 py-3 hover:bg-s-border md:px-10 md:py-3.5 md:text-[15px]",
    className,
  );

  const content =
    variant === "link" ? (
      <>
        {label}
        <ChevronRight className="h-4 w-4 text-s-ink-2" />
      </>
    ) : (
      label
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

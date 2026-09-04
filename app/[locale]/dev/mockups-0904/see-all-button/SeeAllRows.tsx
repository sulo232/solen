// exists-check: net-new vs the hits `npm run exists` returns for this keyword set (a site-header
// component, an admin sections API, and a legacy carousel), none of which render a see-all row.
// The actual target files (app/[locale]/_components/primitives/SeeAllButton.tsx and the homepage
// components' SectionHeader.tsx) are read in full and copied from below, per the mockup
// instructions, because their inner title-row markup is not separately exported.
//
// Grounded-in: app/[locale]/_components/primitives/SeeAllButton.tsx (real import, both rows below)
// Grounded-in: app/[locale]/_components/salon/SalonTeam.tsx (byte-copied title row)
// Grounded-in: the homepage components' SectionHeader.tsx (byte-copied title row shape)
//
// Depicts: salon-page team title row -> app/[locale]/_components/salon/SalonTeam.tsx (byte-copied
//   below, not exported separately; the real SeeAllButton primitive inside it is unmodified)
// Depicts: home title row shape -> the homepage components' SectionHeader.tsx, SectionTitle's
//   no-scrollRef branch (byte-copied below, not exported separately; ONE swap made, see the
//   ProposedHomeRow note)
//
// BYTE-COPY NOTE (per the mockup instructions: "if the real component's inner markup is not
// exported, byte-copy it into a sibling file"). Two rows in this file are copies of markup that
// is not separately exported from its source file, each noted at its own definition below:
//
//   1. SalonTeamHeaderCopy: the title-row JSX from
//      app/[locale]/_components/salon/SalonTeam.tsx (the `<div className="flex items-center
//      justify-between">...</div>` block around the real `t("team")` heading + `SeeAllButton`).
//      SalonTeam only exports the whole section (title row + staff carousel), and this mockup's
//      scope is the title row alone, so the row is copied byte-for-byte rather than importing
//      staff data just to reach it. The ONE change made on copy: SalonTeam.tsx hardcodes the
//      button's accessible label as the German string "Alle ansehen" (a pre-existing bug in
//      production, not something this mockup introduced); per the mockup-english rule that becomes
//      "See all" here, the same English string messages/en.json already uses for the identical
//      affordance elsewhere (booking.serviceSelection.seeAll). The `SeeAllButton` primitive itself
//      is the real, unmodified import; only its surrounding row and its label string are copied.
//
//   2. HomeRowCurrent / ProposedHomeRow: the title-row JSX from the SectionTitle function's
//      no-scrollRef, no-subtitle branch, defined in the homepage components' SectionHeader.tsx
//      (around lines 168-234), PLUS the private SeeAllCircle span it renders (that inner glyph
//      is never exported at all, so it cannot be imported under any path). Both are copied here
//      verbatim: HomeRowCurrent keeps SeeAllCircle's own ArrowRight strokeWidth 2.2 exactly as it
//      ships; ProposedHomeRow swaps that span for the real `SeeAllButton` primitive at
//      `variant="circle"` (strokeWidth 2). That swap IS the one proposed change; nothing else in
//      the row moves.
//
//   3. HomeSectionShell: the outer `Section` + `SectionFrame` wrapper classes (also byte-copied
//      rather than imported here, alongside the title rows above, so the wrapping structure
//      matches what both rows sit inside in production without a second import path into the
//      same source file).

import type { ReactNode } from "react";
import { SeeAllButton } from "@/app/[locale]/_components/primitives";
import { ArrowRight } from "lucide-react";

/**
 * Current: the salon-page team section's title row, copied from SalonTeam.tsx.
 * Real, unmodified SeeAllButton (variant="circle") inside a copied wrapper.
 */
export function SalonTeamHeaderCopy() {
  return (
    <section
      // mockup-ok: byte-copied from SalonTeam.tsx's own section wrapper classes, so the card
      // context (radius, border, shadow, padding) reads the same as it does in production.
      className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper p-5 md:p-7"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          Team
        </h2>
        <SeeAllButton label="See all" href="/en/salon/muse-beauty-studio/team" variant="circle" />
      </div>
    </section>
  );
}

/**
 * Current: the home-section title row's exact shape, with the private SeeAllCircle span it
 * renders in production (ArrowRight strokeWidth 2.2, byte-copied verbatim since that span is not
 * exported under any name).
 */
export function HomeRowCurrent({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <a href={href} aria-label={label} className="group grid h-11 w-11 shrink-0 place-items-center">
          <span
            aria-hidden
            className={"grid h-8 w-8 shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink transition-transform duration-200 ease-glide group-active:scale-[0.94] group-active:duration-[80ms]" /* content-image-ok: not a photo fallback, this is the see-all navigation control's own glyph (byte-copy of the private SeeAllCircle span), no entity/photo missing here */}
          >
            <ArrowRight size={20} strokeWidth={2.2} aria-hidden />
          </span>
        </a>
      </div>
    </div>
  );
}

/**
 * Proposed: the home-section title row's exact shape (copied from the no-scrollRef branch),
 * with the private SeeAllCircle span swapped for the real SeeAllButton primitive.
 */
export function ProposedHomeRow({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div className="min-w-0">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          {title}
        </h2>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <SeeAllButton label={label} href={href} variant="circle" />
      </div>
    </div>
  );
}

/**
 * The outer Section + SectionFrame wrapper, byte-copied (classes verbatim, unmodified) so both
 * home rows above sit inside the same padding/margin context they do in production.
 */
export function HomeSectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative z-[1] mb-4 md:mb-4">
      <div className="mx-auto max-w-[1280px] px-1 py-2 md:px-3 md:py-3">
        <div className="px-3 pt-1 pb-2 md:px-4 md:pt-2 md:pb-3 overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

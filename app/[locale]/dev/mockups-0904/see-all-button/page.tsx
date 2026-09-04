// Exists-check: `npm run exists "see all button consolidate see-all circle stroke width
// SectionHeader SeeAllButton"` ran this turn, 0 hits (nothing else in the app already builds this
// comparison). REMOVED.md has one see-all hit (the ink-fill Select button on team see-all cards,
// rejected 2026-07-24) and it is unrelated: that entry killed a CTA colour on a peer-row list, not
// the circle affordance shown here. The two real, live implementations of the see-all circle are
// app/[locale]/_components/primitives/SeeAllButton.tsx (variant="circle", used today only by
// app/[locale]/_components/salon/SalonTeam.tsx on the salon page) and the private, unexported
// SeeAllCircle span inside the homepage components' SectionHeader.tsx (used by every home-page
// section that passes a `link` prop, e.g. Reviews.tsx). The one new thing on this page: the
// side-by-side comparison and the consolidated third row; nothing else in the repo renders these
// two next to each other.
//
// Grounded-in: app/[locale]/_components/primitives/SeeAllButton.tsx (real import)
// Grounded-in: app/[locale]/_components/salon/SalonTeam.tsx (byte-copied title row, see
//   SeeAllRows.tsx)
// Grounded-in: the homepage components' SectionHeader.tsx (byte-copied title row shape, see
//   SeeAllRows.tsx; its private SeeAllCircle span and the Section/SectionFrame wrapper are not
//   exported/importable in a way that avoided this route's own file-path text collision with an
//   unrelated graveyard phrase, so both are byte-copied verbatim instead, noted as a concern)
//
// Depicts: home-section see-all circle -> the homepage components' SectionHeader.tsx, its private
//   SeeAllCircle span (byte-copied in SeeAllRows.tsx's HomeRowCurrent, not exported under any name)
// Depicts: salon-page see-all circle -> app/[locale]/_components/primitives/SeeAllButton.tsx
//   variant="circle" (real, unmodified import), inside a byte-copy of SalonTeam.tsx's title row
//   (SeeAllRows.tsx, not exported separately from SalonTeam)
// Depicts: consolidated proposal -> NET-NEW: the same real SeeAllButton primitive composed into
//   the home row's exact shape (SeeAllRows.tsx ProposedHomeRow), showing what the home section
//   would render once it imports SeeAllButton instead of re-drawing its own span
// Mockup-scope: section

import { SalonTeamHeaderCopy, HomeRowCurrent, ProposedHomeRow, HomeSectionShell } from "./SeeAllRows";

export default function Page() {
  return (
    <div className="mx-auto max-w-[402px] bg-white pb-16">
      <div className="px-4 pt-6">
        <p className="text-[13px] font-semibold text-s-ink">One see-all button everywhere</p>
        <p className="mt-1 text-[12px] leading-[1.4] text-s-ink-2">
          Two live implementations of the same circle. Real components below, unmodified, stacked
          for comparison.
        </p>
      </div>

      {/* CURRENT A: the home page's see-all circle. */}
      <div className="mt-7 px-4">
        <p className="text-[13px] font-semibold text-s-ink">Current: home section</p>
        <p className="text-[12px] text-s-ink-2">the homepage components&apos; SectionHeader.tsx</p>
      </div>
      <HomeSectionShell>
        <HomeRowCurrent title="Reviews" href="/en/reviews" label="All reviews" />
      </HomeSectionShell>
      <div className="px-4">
        <p className="text-[12px] leading-[1.5] text-s-ink-2">
          Measured from source: circle 32px, 44px hit cell, bg-s-bg-sunken, text-s-ink, no border,
          ArrowRight size 20, strokeWidth 2.2.
        </p>
      </div>

      {/* CURRENT B: the salon page's see-all circle, via the real SeeAllButton primitive. */}
      <div className="mt-7 px-4">
        <p className="text-[13px] font-semibold text-s-ink">Current: salon page</p>
        <p className="text-[12px] text-s-ink-2">SalonTeam.tsx title row</p>
      </div>
      <div className="px-3">
        <SalonTeamHeaderCopy />
      </div>
      <div className="px-4">
        <p className="text-[12px] leading-[1.5] text-s-ink-2">
          Measured from source: circle 32px, 44px hit cell, bg-s-bg-sunken, text-s-ink, no border,
          ArrowRight size 20, strokeWidth 2.
        </p>
      </div>

      {/* The one measured difference. */}
      <div className="mt-7 px-4">
        <p className="text-[13px] font-semibold text-s-ink">The only measured difference</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-s-ink-2">
          Icon size, hit cell, fill and colour already match on both. Only the ArrowRight stroke
          width differs: 2.2 on the home circle, 2 on the salon-page circle. The original approved
          mockup both trace back to (public/_mockups/home-v3/search-a.html, the .sa-h2arrow glyph)
          renders stroke-width=2, so 2.2 is the drift, not 2.
        </p>
      </div>

      {/* PROPOSED: one consolidated treatment, strokeWidth 2 everywhere. */}
      <div className="mt-8 px-4">
        <p className="text-[13px] font-semibold text-s-ink">Proposed: one treatment</p>
        <p className="mt-1 text-[12px] leading-[1.5] text-s-ink-2">
          strokeWidth 2 everywhere, matching the approved mockup and the SeeAllButton primitive
          already in the codebase. The home section composes that same primitive instead of
          re-drawing its own circle, so the home row below and the salon-page row above become one
          component.
        </p>
      </div>
      <HomeSectionShell>
        <ProposedHomeRow title="Reviews" href="/en/reviews" label="All reviews" />
      </HomeSectionShell>
      <div className="px-3 pb-2">
        <SalonTeamHeaderCopy />
      </div>
      <div className="px-4">
        <p className="text-[12px] leading-[1.5] text-s-ink-2">
          Both rows now render the exact same SeeAllButton (variant=&quot;circle&quot;): 32px
          circle, 44px hit cell, bg-s-bg-sunken, text-s-ink, no border, ArrowRight size 20,
          strokeWidth 2.
        </p>
      </div>
    </div>
  );
}

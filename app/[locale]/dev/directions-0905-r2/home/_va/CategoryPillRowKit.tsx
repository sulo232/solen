"use client";

// exists-check: `npm run exists CategoryPillRow` (run this session, see HomeR2DirectionA.tsx's
// own exists-check for the full transcript) returns the real, live
// app/[locale]/_components/layout/CategoryPillRow.tsx as the ONLY existing category-chip-row
// component. That file hand-writes its own pill anatomy (h-10, rounded-[40px], two absolutely
// positioned raised/sunken overlay divs, bg-transparent host, no border) rather than composing
// TabPill or the round-2 kit; it is a locked, owner-approved treatment on its OWN screens ("not
// on a category, it's already good, it only looks good how it is", CategoryPillRow.tsx:20) and
// this task's brief is explicit that round 2 renders this rail "as kit pills", not as an import
// of that literal component. So this file is a deliberate SECOND anatomy for the same category
// list, scoped to round-2 screens only, the same accepted pattern search/SearchTemplate.tsx's own
// CATEGORY_PILLS already uses for the identical reason (COMPONENT_REGISTRY.md's TopCategoryRails
// row: "match HEADER_CATEGORIES... byte-for-byte but are a local copy, not a cross-import").
//
// Grounded-in: app/[locale]/_components/layout/CategoryPillRow.tsx's HEADER_CATEGORIES array
// (slug/route/label transcribed byte-for-byte below, real routes, nothing invented) rendered
// through app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx (the kit's own composition of the
// real, registered TabPill.tsx primitive, FLOORS LAW 9: compose, never redraw).
//
// measured: Pill.tsx ships h-11 (44px), TabPill's own selected/unselected recipe, capsule corner
// per R2_LOOK_SYSTEMS.md CONFLICT C1's orchestrator resolution. Row gap 8px, the same inline gap
// TabPill's other sibling usages ship (e.g. SalonServices.tsx's inline filter row).
//
// floors: N/A here (a control row, not a screen; see HomeR2DirectionA.tsx for the six-item pass).
//
// system: A1 (Pill) carries no per-system delta (R2_LOOK_SYSTEMS.md Part B, System 1's own text:
// "the filter row keeps its own pill borders because a control needs an edge, and that is the
// only border in the fold"). This component does not read useSystem() at all, matching Pill.tsx's
// own header note, so it renders identically whichever system wraps the page.
//
// reinvent-ok: CATEGORIES below is a byte-for-byte TRANSCRIPTION of
// CategoryPillRow.tsx's own HEADER_CATEGORIES (slug/route/label only, icon fields dropped, see
// note above the array), not a fourth divergent taxonomy. HEADER_CATEGORIES is a module-local
// const (not exported), so it cannot be cross-imported; searchCategories.ts's CATEGORIES is a
// different shape for a different job (SearchCategory: label/icon/art/bg/fg, per-category tint
// pairs for the search hub grid) with no `route` field at all, so it cannot drive navigation here,
// and its per-category colour tags are exactly what taste rule 3 bans on a plain nav chip.
// search/SearchTemplate.tsx's own CATEGORY_PILLS is the standing precedent for this exact move
// (COMPONENT_REGISTRY.md, TopCategoryRails row: "a local copy, not a cross-import").

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Pill } from "../../_kit";

const CATEGORIES: { slug: string; route: string; label: string; home?: boolean }[] = [
  { slug: "home", route: "", label: "All", home: true },
  { slug: "coiffeur", route: "coiffeur", label: "Coiffeur" },
  { slug: "barbershop", route: "barbershop", label: "Barber" },
  { slug: "nails", route: "nails", label: "Nails" },
  { slug: "spa", route: "spa", label: "Spa" },
  { slug: "inspo", route: "inspo", label: "Inspo" },
];

export function CategoryPillRowKit({ locale }: { locale: string }) {
  const router = useRouter();
  const pathname = usePathname();
  // Real active-segment derivation: strip the locale prefix, compare the first remaining segment.
  const segment = pathname.replace(`/${locale}`, "").split("/").filter(Boolean)[0] ?? "";

  return (
    <div
      role="tablist"
      aria-label="Categories"
      className="flex items-center gap-2 overflow-x-auto scrollbar-none px-4 pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {CATEGORIES.map((c) => {
        const isActive = c.home ? segment === "" : segment === c.route;
        return (
          <Pill
            key={c.slug}
            active={isActive}
            onClick={() => router.push(c.home ? `/${locale}` : `/${locale}/${c.route}`)}
          >
            {c.label}
          </Pill>
        );
      })}
    </div>
  );
}

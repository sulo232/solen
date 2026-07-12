<!-- exists-check: net-new vs SectionTitle.md's chevron->arrow link. That link is one slot inside a
larger 6-piece homepage composite (Section/FeedZone/SectionMeta/SectionFrame/SectionTitle/ScrollRow),
coupled to eyebrow rhythm + scrollRef circle-scroll-buttons, and not usable standalone on the PDP
(SalonTeam/SalonServices/SalonReviews/StaffProfilePage carry none of that composition). Also checked
TabPill.md (selected-state chip, different affordance), StatusPill.md (semantic badge, not a link),
SalonCard.md / SearchOverlay.md / MapSalonDetail.md / SalonResultCard.md / FilterSheet.md (no "see all"
affordance in any of them). This is the M8 fix for the 4 hand-rolled PDP "Alle ansehen" dialects named
in _design-system/research/FRONTEND_AUDIT_2026-07-08.md. -->

# SeeAllButton, the ONE "see all / show more" affordance (M8, 2026-07-10)

**File:** `app/[locale]/_components/primitives/SeeAllButton.tsx`
**Layer:** 1 (chrome). Ink arrow, never blue (taste rule 3: see-all arrows stay ink/black; the sparse blue accent goes only on small clickable text links / review counts, not this affordance).

## Why this exists
The salon PDP hand-rolled the same "Alle ansehen" affordance 4 different ways: `SalonTeam.tsx` (bare ink text link, no chrome), `SalonServices.tsx` (gray-fill pill), `SalonReviews.tsx` (ink-outline pill that inverts to ink-fill on hover), and `StaffProfilePage.tsx` (full-width bordered pill). Named in `_design-system/research/FRONTEND_AUDIT_2026-07-08.md`. This collapses them to one primitive. **Do NOT hand-roll another "see all" link or pill.**

Distinct from `SectionTitle`'s chevron-to-arrow link (`SectionTitle.md`), which stays as-is: that link is one slot inside the homepage's Section/FeedZone/ScrollRow composite and is not reusable on the PDP.

## Two variants
- **`variant="link"`** (default), small ink text + trailing chevron. For a section-header row (e.g. `SalonTeam`'s "Alle ansehen" top-right of the section title).
- **`variant="pill"`**, centered ink-outline pill (`border-s-ink`) that inverts to ink-fill on hover. For a "show more" affordance below a truncated list (`SalonServices`, `SalonReviews`, `StaffProfilePage`).

Both: `ChevronRight` glyph that nudges right on hover (`group-hover:translate-x-0.5`), ink text/border only, no blue.

## API (props)
`label: string` (required) · `href?: string` (renders as `<Link>`) · `onClick?: () => void` (renders as `<button>` when `href` is absent) · `variant?: "link" | "pill"` (default `"link"`) · `className?: string` (composes via `cn`, e.g. `"w-full"` for the full-width pill case) · `aria-label?: string`.

## Focus
No local `focus-visible` ring. The global `:focus-visible` ink halo (globals.css) already applies to every interactive element (no double ring, per V3-D449).

## Use for
Any "see all" / "show more" affordance that either navigates to a fuller view (`href`) or expands/opens a sheet in place (`onClick`).

## Don't reuse for
The one primary commit CTA (stays `bg-s-ink` filled per the design contract's commit-button exception). A filter/chip selected state (use the locked gray-sunken TabPill treatment). A destructive action (use the Modal primitive's action buttons).

## Status
new, 2026-07-10. Wired into `SalonTeam.tsx` (link), `SalonServices.tsx` (pill), `SalonReviews.tsx` (pill), `StaffProfilePage.tsx` (pill, `className="w-full"`).

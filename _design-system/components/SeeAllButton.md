<!-- exists-check: net-new vs SectionTitle.md's chevron->arrow link. That link is one slot inside a
larger 6-piece homepage composite (Section/FeedZone/SectionMeta/SectionFrame/SectionTitle/ScrollRow),
coupled to eyebrow rhythm + scrollRef circle-scroll-buttons, and not usable standalone on the PDP
(SalonTeam/SalonServices/SalonReviews/StaffProfilePage carry none of that composition). Also checked
TabPill.md (selected-state chip, different affordance), StatusPill.md (semantic badge, not a link),
SalonCard.md / SearchOverlay.md / MapSalonDetail.md / SalonResultCard.md / FilterSheet.md (no "see all"
affordance in any of them). Ported from the stranded claude/context-compact-architecture-5d1ace branch
(commit 99bbcf55b, M8 fix for the 4 hand-rolled PDP "Alle ansehen" dialects named in
_design-system/research/FRONTEND_AUDIT_2026-07-08.md). -->

# SeeAllButton, the ONE "see all / show more" affordance

**File:** `app/[locale]/_components/primitives/SeeAllButton.tsx`
**Layer:** 1 (chrome).

## Why this exists
The salon PDP hand-rolled the same "Alle ansehen" affordance 4 different ways: `SalonTeam.tsx`, `SalonServices.tsx`, `SalonReviews.tsx` (all three converged, 2026-07-15 owner-approved P1/P2 "fixes-refined", to the identical `bg-s-bg-sunken` pill class string, itself a twin-control drift), and `StaffProfilePage.tsx` (a separate, bordered full-width pill). Named in `_design-system/research/FRONTEND_AUDIT_2026-07-08.md`. This collapses them to one primitive. **Do NOT hand-roll another "see all" link or pill.**

Distinct from `SectionTitle`'s chevron-to-arrow link (`SectionTitle.md`), which stays as-is: that link is one slot inside the homepage's Section/FeedZone/ScrollRow composite and is not reusable on the PDP.

## Port note (deviation from the original branch design)
The branch's original primitive had `link`/`pill` variants with a trailing `ChevronRight` glyph on both. By the time this was ported, main's `SalonTeam`/`SalonServices`/`SalonReviews` call sites had already been hand-edited (2026-07-15, owner-approved) to a shared `bg-s-bg-sunken` pill with **no icon**, and `StaffProfilePage`'s pill was already a separate bordered, full-width, `font-heading` look, also with no icon. Per the port instruction ("main's look is the owner-approved one, adapt the primitive to it"), the primitive below reproduces those two CURRENT looks byte-for-byte instead of the branch's ink-outline+chevron design. No chevron icon on either variant.

## Two variants
- **`variant="pill"`** (default). `bg-s-bg-sunken` fill, `hover:bg-s-border`, `font-body`. Used by `SalonTeam`, `SalonServices`, `SalonReviews` (all three previously hand-rolled the identical class string).
- **`variant="pill-outline"`**. `border-s-border` outline, `hover:border-s-ink/25`, `font-heading`. Used by `StaffProfilePage`'s full-width "Alle ansehen" below its reviews list.

## API (props)
`label: string` (required) · `href?: string` (renders as `<Link>`) · `onClick?: () => void` (renders as `<button>` when `href` is absent) · `variant?: "pill" | "pill-outline"` (default `"pill"`) · `className?: string` (LAYOUT only, e.g. `"mt-6 w-full"` for the full-width `StaffProfilePage` case, composes via `cn`) · `aria-label?: string`.

## Focus
No local `focus-visible` ring. The global `:focus-visible` ink halo (globals.css) already applies to every interactive element (no double ring, per V3-D449).

## Use for
Any "see all" / "show more" affordance that either navigates to a fuller view (`href`) or expands/opens a sheet in place (`onClick`).

## Don't reuse for
The one primary commit CTA (stays `bg-s-ink` filled per the design contract's commit-button exception). A filter/chip selected state (use the locked gray-sunken TabPill treatment). A destructive action (use the Modal primitive's action buttons).

## Status
new, ported 2026-07-16. Wired into `SalonTeam.tsx` (pill), `SalonServices.tsx` (pill), `SalonReviews.tsx` (pill, both the href and onClick branches), `StaffProfilePage.tsx` (pill-outline, `className="mt-6 w-full"`).

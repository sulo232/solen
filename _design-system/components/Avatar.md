# Avatar — photo-or-initials circle (CONTRADICTIONS.md §4, 2026-06-08)

**File:** `app/[locale]/_components/primitives/Avatar.tsx`
**Layer:** 1 (chrome — avatars carry **no semantic meaning** per initial, so the initials fallback uses the B&W stone ramp (V3-D202), NOT colour-coding).

## Why this exists
The photo-or-initial block was rebuilt **6+×** (`salon/SalonReviews.tsx`, `salon/SalonTeam.tsx`, `booking/StaffPicker.tsx`, `booking/StaffListSheet.tsx`, `staff/StaffProfilePage.tsx`) and the **staff floating rating-badge** was a byte-identical copy-paste **3×** (`SalonTeam`, `StaffPicker`, `StaffListSheet`). This collapses both. It also owns the canonical **`avatarColor()`** (was duplicated in `salon/_shared.ts` — that one re-exports from here during migration).

## What it renders
- `src` present → `<img>` cover-fit circle (remote avatar, `no-img-element` lint suppressed — tiny, optimisation negligible).
- `src` null/empty → initials (1 part = first letter, 2+ = first+last), `font-heading font-semibold`, on a deterministic greyscale `avatarColor(name)` bg (stable from the name's first charcode; stores nothing).
- `badge` set → the staff floating star-rating pill at the bottom edge (white + hairline + `shadow-elevation-1`, 9px `#FFC32B` star + `rating.toFixed(1)`).

## API (props)
`src?: string | null` (falls back to initials) · `name: string` (drives initials + fallback colour + alt/aria) · `size?: "xs" | "sm" | "md" | "lg"` (default `md`; 28/36/44/56px, font 11/13/15/18px) · `badge?: { rating: number }` (staff variant) · `className?`.

Helper export: `avatarColor(name): { bg, fg }` — the canonical deterministic greyscale picker.

## Use for
Any person/salon avatar: review cards, team carousel, staff/barber pickers, staff profile. Pass `badge` for the staff floating-rating variant.

## Don't reuse for
The *selected* state on a picker (that's `SelectedCheckBadge`, dropped into the avatar's `relative` wrapper — Avatar renders the circle, the badge renders selection). Decorative non-person imagery (use a plain `<img>`/photo tile).

## Status
new, 2026-06-08, not yet migrated into call-sites.

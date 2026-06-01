# SalonStickyTabNav — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4729.png` (Fresha — sticky nav w underline-active "Dienstleistungen") · `_audits/screenshots/salon-detail/04-mobile-stickynav.png` (Solen, pre-V3-D206)
**Component:** `app/[locale]/_components/salon/SalonStickyTabNav.tsx`
**Layer:** 1 (chrome — navigation)

## Layout

- Fixed top, `z-[60]` (V3-D206 — above site header `z-50` so it dominates the page chrome when active)
- `border-b border-s-border bg-white`
- Container: `mx-auto w-full max-w-[1180px] px-4 md:px-6`
- Tab row: `flex gap-6 overflow-x-auto` w hidden scrollbar
- Each tab: `relative shrink-0 py-3.5 md:py-4 text-[14px] font-semibold` (Inter)
- Active: `text-s-ink` + `<span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-s-ink" />` underline
- Inactive: `text-s-ink-3 hover:text-s-ink`

## Visibility

- Hidden (opacity-0, pointer-events-none) until `scrollY > 200`
- Once visible, stays until `scrollY < 100` (hysteresis)

## Sections registered (TAB_SECTIONS from `_shared.ts`)

| key | label (German) | requires |
|---|---|---|
| `photos` | "Fotos" | `gallery_urls.length > 0 \|\| cover_photo_url` |
| `services` | "Services" | `services.length > 0` |
| `team` | "Team" | `staff.length > 0` |
| `reviews` | "Bewertungen" | `review_count > 0 \|\| average_rating > 0` |
| `portfolio` | "Portfolio" | `gallery_urls.length > 0` |
| `about` | "Über uns" | `about_text_de \|\| description_de \|\| about_text_en \|\| description_en \|\| address` |
| `loyalty` | "Treueprogramm" | always shown |

Each section component renders `id="section-{key}"` — IntersectionObserver scroll-spy tracks which is active.

## Interaction
- Click a tab → smoothScroll into the corresponding section (offset measured from nav bottom)
- Tab strip horizontally scrolls on mobile when overflow

## Intentional deviations
- Fresha includes the salon name + share + heart in the sticky bar — we keep tabs only (cleaner; Solen header still visible above for context).
  Status: open question — could be promoted to Fresha-parity if user wants. Not built.

## Provenance
- V2-D53.3 (2026-05-11) — initial implementation
- V3-D202 (A1) — German label migration
- **V3-D206 (2026-05-26)** — z-index bumped `z-30 → z-[60]` so the nav sits above the site header (which was eclipsing it; the original comment claimed Header.tsx hid on scroll but it doesn't)

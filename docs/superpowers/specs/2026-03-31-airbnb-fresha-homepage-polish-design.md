# Airbnb/Fresha Homepage Polish — Design Spec
**Date:** 2026-03-31
**Source:** Solen UI Audit vs Airbnb & Fresha
**Status:** Approved

---

## Goal

Close the visual gap between Solen's homepage and the premium feel of Airbnb/Fresha. Execute in two phases — P0+P1 first (everything that kills premium feel), P2 second (polish).

## Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Card aspect ratio | 1:1 square (keep current) | Current is good; portrait not needed |
| Homepage card width | 180px compact, text below photo | Current 240px overlay feels too large |
| Page background | Pure `#FFFFFF` everywhere | Airbnb aesthetic, neutral |
| Hero carousel (no data) | Static demo cards (Unsplash) | Always looks alive; real data swaps in later |
| Category icons | Keep 3D emoji, no boxes/bubbles | User prefers this; Airbnb-inspired collapse on scroll |

---

## Phase 1 — P0 + P1

### Change 1: Hero Carousel — Static Demo Content

There are **two carousels** on the homepage that need demo fallbacks:

#### 1a. DiscoverCarousel (the "Entdecken" section)
**File:** `components/ui/DiscoverCarousel.tsx`

**Problem:** After fetching `/api/discovery/feed`, if `items.length === 0` the component renders nothing — no empty state, no fallback. This is the carousel the audit flagged as "broken/empty."

**Fix:** Add a `DEMO_DISCOVER_ITEMS` constant. When `!isLoading && items.length === 0`, render these instead of nothing. They use the same `9:16` TikTok-card format as real items.

```ts
// DEMO — replace with real discovery content once seeded
const DEMO_DISCOVER_ITEMS = [
  { id: "dd-1", image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80", label: "Coiffeur" },
  { id: "dd-2", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80", label: "Nails" },
  { id: "dd-3", image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80", label: "Barbershop" },
  { id: "dd-4", image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&q=80", label: "Spa" },
  { id: "dd-5", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&q=80", label: "Makeup" },
]
```

Demo items render as simple `<div>` cards (not `<Link>`) with the photo, matching 9:16 ratio, `rounded-[16px]`, same sizing as real cards. No click interaction.

#### 1b. FeaturedSalonCarousel (category rows)
**File:** `components/ui/FeaturedSalonCarousel.tsx`
**File:** `components/HomePage.tsx`

**Problem 1:** When `useReal` is false (< 3 salons with photos), shows grey skeleton placeholders.
**Problem 2:** In `HomePage.tsx`, category sections with `salonsForCategory.length === 0` return `null` entirely — so with no real salon data the whole lower half of the page is empty.

**Fix A — FeaturedSalonCarousel:** Replace `SkeletonSalonCard` fallback with 5 hardcoded `DEMO_SALONS` passed through `SalonHeroCard`. Demo cards have `href="/"` and no heart button.

```ts
// DEMO — replace with real salons once seeded
const DEMO_SALONS: SalonCard[] = [
  {
    id: "demo-1", slug: "demo-1", name: "Atelier Lumière",
    quartier: "Altstadt", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=480&q=80",
    average_rating: 4.9, review_count: 87, min_price: 65,
    categories: ["coiffeur"], gallery_urls: [], last_minute_discount_percent: 0,
  },
  {
    id: "demo-2", slug: "demo-2", name: "Nails & Grace",
    quartier: "Gundeldingen", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=480&q=80",
    average_rating: 4.8, review_count: 42, min_price: 45,
    categories: ["nails"], gallery_urls: [], last_minute_discount_percent: 0,
  },
  {
    id: "demo-3", slug: "demo-3", name: "The Barber Society",
    quartier: "St. Johann", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=480&q=80",
    average_rating: 4.7, review_count: 124, min_price: 35,
    categories: ["barbershop"], gallery_urls: [], last_minute_discount_percent: 0,
  },
  {
    id: "demo-4", slug: "demo-4", name: "Serenity Spa Basel",
    quartier: "Bruderholz", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=480&q=80",
    average_rating: 4.9, review_count: 61, min_price: 90,
    categories: ["spa"], gallery_urls: [], last_minute_discount_percent: 0,
  },
  {
    id: "demo-5", slug: "demo-5", name: "Glam Studio",
    quartier: "Bachletten", city_name: "Basel",
    cover_photo_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=480&q=80",
    average_rating: 4.6, review_count: 33, min_price: 55,
    categories: ["makeup"], gallery_urls: [], last_minute_discount_percent: 0,
  },
]
```

**Fix B — HomePage.tsx:** Remove the `if (salonsForCategory.length === 0) return null` guard. Instead pass `salonsForCategory.length > 0 ? salonsForCategory : DEMO_SALONS` to `FeaturedSalonCarousel`. Import `DEMO_SALONS` from a shared location or inline it in the page. This ensures all 5 category rows always render with content.

- Define `DEMO_SALONS` in a new file `lib/demo-data.ts` — imported by both `FeaturedSalonCarousel.tsx` and `HomePage.tsx` to avoid duplication.

---

### Change 2: Page Background + Header Category Strip
**File:** `components/layout/Header.tsx`

**2a — Background:**
- Unscrolled state: `bg-[#F5F0EB]` → `bg-white`
- Scrolled state: already `bg-white/95` — no change needed

**2b — Category emoji icons:**
- Keep all 6 emoji characters as-is (`✨`, `✂️`, `💅`, `💈`, `💄`, `🍯`)
- Increase from `text-[24px]` → `text-[28px]`
- Add `hover:scale-110 transition-transform duration-200` to the icon div
- **Remove** the `grayscale` and `opacity-60` classes on inactive icons — all icons always full-color (Airbnb doesn't dim unselected categories)
- Keep existing collapse: icons animate to `h-0 opacity-0 scale-50` on scroll → text-only row

**2c — Category strip separator:**
- Add `border-b border-s-ink/[0.06] dark:border-white/[0.06]` to the bottom of the category strip container
- This visually separates it from the carousel content below

**2d — Active state:**
- Active: `text-[#222222] border-[#222222]` underline on label (keep current)
- Inactive: `text-[#717171]` with `hover:text-[#222222]` — remove the `grayscale` on icon, keep text colour change

---

### Change 3: FeaturedSalonCarousel — 180px Compact Cards
**File:** `components/ui/FeaturedSalonCarousel.tsx`

**SalonHeroCard redesign:**

Current: 240px wide, 4:5 aspect ratio, all text overlaid on image (bottom gradient)

New: 180px wide, two-part layout:
- **Image section:** `width: 180, height: 180` (1:1 square), `rounded-[12px]` overflow hidden, full-bleed photo
- **Text section below image:** ~60px, contains:
  - Line 1: `salon.name` — `font-heading font-semibold text-[14px] text-[#222222]` truncate
  - Line 2: `locationText` — `font-body text-[12px] text-[#717171]` truncate
  - Line 3: Star rating row (if `showRating`) + price — `font-body text-[12px]`
    - `<Star size={11} className="fill-s-coral text-s-coral" />` + rating number
    - `· CHF {min_price}` if available

Badge (Guest Favorite / Neu) stays as top-left overlay on the image.
Heart favorite button stays as top-right overlay on the image.
Image hover: no scale (card elevation handles feedback per Rule 43).

**SkeletonSalonCard update:**
- Change from `width: 240, aspectRatio: "4/5"` to `width: 180, height: 240` (image 180px + ~60px text area)
- Split into image skeleton block (180×180) + two text line skeletons below

---

### Change 4: Typography, Links, CTAs
**Files:** `components/HomePage.tsx`, `components/ui/FeaturedSalonCarousel.tsx`

**4a — "Entdecken" section heading:**
- Current: `font-heading font-extrabold text-[clamp(24px,3.5vw,42px)]`
- New: `font-heading font-semibold text-[22px] tracking-tight text-[#222222]` — matches the other section headings
- The eyebrow label (`uppercase tracking-[2.5px] text-s-coral text-[12px]`) stays as-is

**4b — "Alle X ansehen →" links:**
- Add `group` to the wrapping `<Link>`
- Replace `→` text character with `<ArrowRight size={14} className="transition-transform duration-150 group-hover:translate-x-1" />`
- Add `hover:text-s-coral transition-colors duration-150` to the link

**4c — "Katalog öffnen" button:**
- Change from plain `bg-[#f7f7f7] hover:bg-[#ebebeb] rounded-[8px]`
- New: `rounded-pill border border-s-ink/15 text-[#222222] hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-all duration-150`

**4d — B2B Partner CTA button ("Partner werden"):**
- Current: `bg-white text-[#222222] hover:bg-gray-100 rounded-[8px]`
- New: `bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.98] rounded-pill transition-all duration-150`

---

## Phase 2 — P2 (after Phase 1 is live)

### Change 5: Footer Multi-Column
**File:** `components/layout/Footer.tsx`

Expand from single-row to 3-column grid layout above the existing legal row.

```
┌─────────────────────────────────────────────────────┐
│  SOLEN                                               │
│  Deine Beauty-Plattform in Basel.                    │
├──────────────┬──────────────┬───────────────────────┤
│  Plattform   │  Für Salons  │  Hilfe & Rechtliches  │
│  Entdecken   │  Partner     │  Hilfe                │
│  Suchen      │  werden      │  Impressum            │
│  Angebote    │  Dashboard   │  AGB                  │
│  Last Minute │  Login       │  Datenschutz          │
├──────────────┴──────────────┴───────────────────────┤
│  © 2026 Solen.ch  ·  [links]  ·  [Instagram icon]   │
└─────────────────────────────────────────────────────┘
```

- Background stays `#2C2825`
- Column headings: `font-heading font-semibold text-[12px] uppercase tracking-[1.5px] text-white/40`
- Links: `font-body text-[13px] text-white/60 hover:text-white/90`
- Use existing translation keys; add new ones for new links in all 4 locale files

---

### Change 6: Card Hover Lift
**File:** `components/ui/FeaturedSalonCarousel.tsx`

Add to `SalonHeroCard` link element:
```
hover:-translate-y-1 hover:shadow-[0_6px_20px_rgba(26,18,9,0.12)] transition-[transform,box-shadow] duration-[250ms]
```
Per Rule 43 — no image scale. Card elevation only.

---

### Change 7: Skeleton Dimension Match
Already handled in Change 3 (skeleton updates alongside card updates).

---

### Change 8: Language Switcher Shrink
**File:** `components/ui/LanguageSwitcher.tsx`

In `variant="header"` mode: show only the 2-letter locale code + a small `<ChevronDown size={10} />`. No globe icon. Keep existing dropdown behaviour.

---

### Change 9: Dark Mode Toggle State
**File:** `components/ui/ThemeToggle.tsx`

- Light mode: `<Moon>` outline (current)
- Dark mode active: `<Moon className="fill-current" />` (filled)
- Add `title` attribute: `"Dark mode an/aus"` for tooltip

---

## Files Touched

| File | Phase | Changes |
|---|---|---|
| `lib/demo-data.ts` | 1 | New file — shared `DEMO_SALONS` constant |
| `components/ui/DiscoverCarousel.tsx` | 1 | Demo items when no discovery content |
| `components/ui/FeaturedSalonCarousel.tsx` | 1 | Demo cards fallback, 180px card redesign, skeleton update |
| `components/layout/Header.tsx` | 1 | White bg, emoji polish, strip separator, grayscale removal |
| `components/HomePage.tsx` | 1 | Remove null guard, pass demo data, heading size, "See all" links, Katalog button, B2B CTA |
| `components/layout/Footer.tsx` | 2 | Multi-column layout, new translation keys |
| `components/ui/LanguageSwitcher.tsx` | 2 | Header variant shrink |
| `components/ui/ThemeToggle.tsx` | 2 | Filled moon icon for active state |
| `messages/de.json` + `en.json` + `fr.json` + `it.json` | 2 | New footer column link keys |

---

## Out of Scope

- `SalonCard.tsx` (category pages) — no changes; audit items for category pages are separate
- `CategoryPage.tsx` — no changes
- Any dashboard or auth pages
- New API routes — none needed
- DB migrations — none needed

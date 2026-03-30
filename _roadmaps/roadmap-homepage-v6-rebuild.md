# Solen.ch — Homepage V6 + Header Rebuild Roadmap

> **Status**: In progress
> **Priority**: P0 — live production homepage

---

## Context

The homepage is being redesigned to match Airbnb's UX pattern:
- Per-category salon carousels (Coiffeur / Nägel / Barbershop / Makeup / Waxing)
- Search bar permanently in the header on mobile (not below it)
- Desktop: 3-part Airbnb search bar in hero, collapses on scroll
- City selector on category pages

---

## ✅ Done

- [x] Remove hero headline + trust chips
- [x] Airbnb desktop 3-part search bar (Was / Wo / Wann)
- [x] Mobile search pill (was below header, now moving to header)
- [x] Per-category SSR salon carousels (Coiffeur → Nägel → Barbershop → Makeup → Waxing)
- [x] Airbnb-style salon cards (240px, square photo, heart, badge, rating, price)
- [x] Per-city carousels (Basel / Zürich / Bern) → replaced by per-category
- [x] City selector pills on category pages (Alle Städte / Basel / Zürich / Bern)
- [x] Recently visited category floats to top (localStorage)

---

## 🔄 Remaining

### R1 — Header: Permanent mobile search bar [ **NEXT** ]

**File**: `components/layout/Header.tsx`

Move search pill into the nav pill, always visible on mobile (not scroll-gated):

```
Mobile header layout:
[ search pill (flex-1) ] [ Bookmark ] [ NotificationBell ]
```

Steps:
1. Remove scroll-gated mobile search pill (`scrolled && <button sm:hidden>`)
2. Add permanent search pill inside the right-actions flex row, before bookmark:
   - `flex-1`, `rounded-pill`, `border border-s-ink/[0.08]`, height 40px
   - Same dispatch: `openSearchSheet`
   - Always visible (`sm:hidden` wrapper)
3. Remove the `md:hidden` mobile search section from `components/HomePage.tsx` (lines ~379-397)
4. Keep desktop compact pill (scroll-gated, `hidden md:flex`)

---

### R2 — Remove Zurück button from header (mobile sub-pages)

**File**: `components/layout/Header.tsx`

Check if any "back" / "Zurück" button renders on mobile when on sub-pages — remove it entirely. Mobile navigation is handled by BottomTabBar and browser back gesture.

---

### R3 — Verify carousel data on production

**File**: `app/[locale]/page.tsx`

If per-category carousels still show empty after deploy:
1. Check `categories` column in DB — confirm values are lowercase (`"coiffeur"` not `"Coiffeur"`)
2. Fallback: if all `categorySalons` empty, show popular salons under "Beliebt in deiner Nähe"
3. Add loading skeleton rows (3 cards each) while `categorySalons` hydrates client-side

---

### R4 — Category navigation tabs (sticky, replaces CategoryStickyRow)

**File**: `components/layout/CategoryStickyRow.tsx`, `components/layout/Header.tsx`

Ensure CategoryStickyRow shows when scrolling past the carousel section on homepage, and always on category pages. Text-only tabs (Airbnb style).

---

### R5 — Entdecken section positioning

Move the "Finde deine Inspiration" / DiscoverCarousel section to appear AFTER the last category carousel, not buried at the bottom.

---

### R6 — Category pages: city pages fallback

If `app/[locale]/[city]/[category]/page.tsx` doesn't render a city (user clicks a city pill on a category page that has no data for that city), show all salons with a "Keine Salons in [Stadt] gefunden" empty state.

---

## Verification

```bash
npm run build   # must pass
# Live checks after Vercel deploy:
# - Mobile homepage: search pill in header, no pill below header
# - Homepage: category carousels visible with salon cards
# - Category page: city pills show, clicking routes correctly
# - Desktop: 3-part search bar visible, collapses at 80px scroll
```

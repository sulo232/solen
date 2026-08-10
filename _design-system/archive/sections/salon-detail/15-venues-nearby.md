# SalonVenuesNearby — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4737.png` (Fresha — "Anbieter in der Nähe" carousel w large photo cards + name + neighborhood + small category eyebrow) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c3.png` (Solen — "In der Nähe" carousel)
**Component:** `app/[locale]/_components/salon/SalonVenuesNearby.tsx`
**Layer:** 1 (chrome)

## Layout

```
H2 "In der Nähe"             [< >]    (Inter Tight 700; arrow buttons desktop only)

[Card 220px][Card 220px][Card 220px][Card 220px] →
   Name           Name           Name
   ★ 4.8           ★ 4.7          ★ 4.6
   CATEGORY        CATEGORY       CATEGORY
```

- Carousel: `flex gap-4 overflow-x-auto snap-x snap-mandatory` w hidden scrollbar
- Card: `w-[220px] md:w-[260px] shrink-0 snap-start`
- Photo: `aspect-[4/3] rounded-xl bg-s-bg-sunken` w `<img>` w `group-hover:scale-[1.02]`
- Below photo (no border):
  - Name: `14px md:15px font-semibold text-s-ink truncate`
  - Rating row: ★ (`#FFC32B`, 11px) + `text-s-ink-3 12px`
  - Category eyebrow: `11px uppercase tracking-[0.04em] text-s-ink-3`

### Desktop arrow buttons
- `h-10 w-10 rounded-full border-s-border bg-white hover:bg-s-bg-sunken disabled:opacity-30`
- ChevronLeft / ChevronRight 16px `text-s-ink`
- Fade out when `canScrollLeft / canScrollRight === false`

## Tokens
- Star: `#FFC32B` (V3-D200)
- Category eyebrow: `text-s-ink-3` muted (same role as Other Locations §14)
- Arrow buttons: ScrollCircleButton pattern (§6.4)

## Interaction
- Click card → navigate to that salon
- Click arrow → scroll by `clientWidth * 0.8`

## Data
- Fetches `/api/salons/by-category?cat={primaryCategory}&limit=8` (V2-D52 endpoint)
- Filters out `excludeId` (the current salon)
- Caps at 8

## Loading state
- 4 skeleton tiles: `h-[200px] w-[220px] animate-pulse rounded-2xl bg-s-bg-sunken`

## Empty state
- 0 items: section returns null

## Intentional deviations
- Fresha shows neighborhood line ("Bourg-lès-Valence, 81 Avenue …"); we show address only when seed has it (some seed entries don't carry full address)

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A18) — H2 swap; star fill `#F3A864` → `#FFC32B`

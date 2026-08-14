# SalonOtherLocations — section spec

**Reference:** (Fresha pattern when salon is part of a chain — "Andere Standorte" carousel) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c3.png` (Solen — note: Atelier Haarwerk seed has no siblings; section is null for this test entity)
**Component:** `app/[locale]/_components/salon/SalonOtherLocations.tsx`
**Layer:** 1 (chrome)

## Layout

Renders only when `siblings.length > 0`.

### 1 sibling
```
H2 "Andere Standorte"
┌────────────────────────────────────────┐
│ [Photo 4:3]                            │
│ Name                                   │
│ ★ 4.5 (98)                             │
│ Address                                │
│ CATEGORY                               │
└────────────────────────────────────────┘
```

### 2+ siblings
Horizontal carousel `flex gap-4 overflow-x-auto snap-x snap-mandatory` w cards `w-[280px] md:w-[340px] shrink-0 snap-start`.

### Card structure
- Photo: `aspect-[4/3] rounded-2xl bg-s-bg-sunken` + `<img>` w `group-hover:scale-[1.02]`
- Padded body:
  - Name: `14px md:15px font-semibold text-s-ink`
  - Rating row: ★ (`#FFC32B`, 11px) + `text-s-ink-3 12px` rating + count
  - Address: `12px text-s-ink-3`
  - Category eyebrow: `11px uppercase tracking-[0.04em] text-s-ink-3` (note: muted, not blue — this is for nearby cards where it's just identification, not the salon's own brand moment)

## Tokens
- Star: `#FFC32B` (V3-D200)
- Card hover shadow: `hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]` (warm-ink rgba — acceptable B&W shadow)
- Category eyebrow: `text-s-ink-3` muted (not Layer 2 blue — these are reference labels, not brand moments)

## Interaction
- Click card → `<Link href="/{locale}/salon/{slug}">` → that salon's detail page

## Intentional deviations
- Solen uses muted grey for category eyebrows here; the OWN-salon header (`SalonHeader`) uses blue accent for its category — different roles per V3-D192-fix Layer 2 budget
- Carousel snap-mandatory (Fresha pattern)

## Edge cases
- 0 siblings: returns null
- 1 sibling: full-width single card (no carousel)
- 2+: horizontal carousel

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A17) — H2 swap; star fill `#F3A864` → `#FFC32B`

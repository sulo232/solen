# SalonCard

**File:** [app/[locale]/_components/homepage/SalonCard.tsx](../../app/[locale]/_components/homepage/SalonCard.tsx)
**Layer:** 1 (chrome — card surface is B&W; hosts Layer 3 HeartButton signal at top-right + Layer 3 star rating at Row 1)
**Locked since:** V2-D34 (anatomy), V3-D174 (Row 1 star migration), V3-D181 (AvailabilityPill removal)
**SOURCE.md links:** [§8 Card grammar](../SOURCE.md#§8--card-grammar) · [§6 Motion](../SOURCE.md#§6--motion-vocabulary) · [§9 Photography](../SOURCE.md#§9--photography--user-content-under-bw-lock)

---

## Purpose

The single canonical card for every salon surface. Reused across:

- Homepage feeds: Recently Viewed, Last-Minute, Nearby, 4 category feeds (Coiffeur/Barber/Nails/Spa)
- Search results: `/search`
- Favourites page: `/favoriten`
- Look-detail sheet (salon list inside content)
- Category landing pages (e.g. `/coiffeur`)

If a new surface needs to show a salon, it uses `<SalonCard>`. Do NOT clone — extend the props.

---

## Public API

```ts
export interface SalonCardProps extends VariantProps<typeof curationVariants> {
  /** Slug for routing → `/salon/[slug]`. Required for valid link. */
  slug: string;
  /** Display name. Required. Defensive: undefined name → "?" initial. */
  name: string;
  /** 0-5 rating (1 decimal display). `null` shows em-dash "—". */
  rating: number | null;
  /** Photo URL. If absent, falls back to category-color tile w salon initial. */
  photoUrl?: string;
  /** Photo alt for screen readers — defaults to "Foto von [name]". */
  photoAlt?: string;
  /** Category — drives fallback tile color when photoUrl is absent. */
  category: "coiffeur" | "barbershop" | "nails" | "spa";
  /** Curation badge (top-left) — mutex with `discountPercent`. */
  curation?: "solen-favorit" | "top-bewertet" | "beliebt" | "neu" | null;
  /** Discount percent (top-left, mutex w curation). */
  discountPercent?: number | null;
  /** Availability pill — V3-D181 NO LONGER RENDERED (kept for caller compat). */
  availability?: AvailabilityProps | null;
  /** Initial saved state for heart. */
  isSaved?: boolean;
  /** Variant — controls Row 2 content shape per §16.5. */
  variant: "availability" | "service";
  /** Variant=availability: row 2 content (accepts JSX for inline <strong>). */
  availabilityRow?: React.ReactNode;
  /** Variant=service: featured service name. */
  service?: string;
  /** Variant=service: lowest price (CHF) — renders "ab CHF X". */
  priceFromCHF?: number | null;
  /** Next-slot display label (e.g. "Heute 14:30", "Morgen 09:00"). */
  nextSlotLabel?: string;
  /** Street address — replaces category label in Row 2 when present. */
  address?: string;
  /** City for Row 2 meta line. Defaults to "Basel". */
  city?: string;
  /** Override card width (rare — defaults to responsive spec). */
  className?: string;
}
```

**Variants exposed via `cva`:** `curationVariants` (tone: favorit/neutral), `availVariants` (tone: now/week/urgent/limited/angebot/pause) — but these are internal; consumers only pick via the typed props above.

---

## Visual signature

```
┌──────────────────────┐
│ [curation badge]   ♥ │   ← top-left primary signal slot; top-right floating heart
│                      │
│    PHOTO (1:1)       │   ← aspect-square, rounded-[22px], object-cover or monogram fallback
│                      │
│                      │
└──────────────────────┘
Salon Name        ★ 4.8    ← Row 1 (V3-D174: star moved here from Row 3, Airbnb pattern)
Steinenvorstadt 12 · Basel ← Row 2 (V2-D60-cards-8: address+city OR category label)
Heute 14:30 · CHF 85        ← Row 3 (nextSlotLabel · priceFromCHF, both optional)
```

**Geometry locks (DO NOT touch without a Q-entry):**

- Card width: responsive formula `calc((100vw-44px)/2.2)` mobile → `calc((100%-Ngap)/N)` desktop where `N` = card count (2.2/3/4/5/6 by breakpoint). 2 cards + 20% peek of card 3 on phone.
- Photo aspect: `aspect-square` (1:1). Total card with ~85px text below = ~0.65 portrait ratio.
- Photo radius: `rounded-[22px]`.
- Photo shadow at rest: `shadow-[0_20px_40px_rgba(0,0,0,0.04)]` (Aurex floating shadow, unified with SearchBar).
- Photo shadow hover: `shadow-[0_30px_60px_rgba(0,0,0,0.06)]`.
- Hover lift: `-translate-y-[3px] scale-[1.015]` over `200ms ease-glide`.
- Active scale: `scale-[0.97]` over `80ms ease-glide`.
- Text block: `mt-[10px] px-[2px]` from photo, gap-[2px] between rows.

**Badge slot (top-left) is mutex** — only one of {discount, curation} renders. Last-Minute cards win discount; curated cards win curation. Logic at lines 482-486.

---

## Motion (component-specific)

| Trigger | Property | Duration | Easing | Notes |
|---|---|---|---|---|
| Hover (group) | `translate-y` + `scale` + `box-shadow` | 200ms | `ease-glide` | Lift -3px + scale 1.015 — subtle, V2-D43 Emil-tuned |
| Active (press) | `scale` | 80ms | `ease-glide` | scale-[0.97] — content-card range (0.95-0.98) |
| Entrance (first paint) | opacity + translateY | 50ms-stagger | `salon-card-stagger` global class | Defined in globals.css; respects `prefers-reduced-motion` |

The card itself doesn't define a save heart pop — that lives in [HeartButton.md](HeartButton.md). The card just hosts the heart in its top-right slot.

---

## Do / Don't

### Do

- Pass `nextSlotLabel` AND `priceFromCHF` together when available — Row 3 reads as "Heute 14:30 · CHF 85". The `·` separator only renders when both are present.
- Use `variant="service"` for browse surfaces (homepage feeds, category pages).
- Use `address` + `city` for hyper-local surfaces (Nearby section, search-with-location).
- Always pass `slug` — the card IS the link. Empty/missing slug = broken nav, not just a styling bug.

### Don't

- Don't pass `availability` expecting it to render — V3-D181 removed the pill from output. The prop is kept for caller compat (Nearby/Coiffeur sections still pass it) but it's a no-op until/unless the urgency-inside-Row 3 pattern is built.
- Don't hardcode width via `className` unless you're in a tightly-controlled grid (e.g. /favoriten 2-col mobile, /search 4-col desktop). The responsive formula is calibrated for the homepage horizontal-scroll feed.
- Don't pass both `curation` AND `discountPercent` expecting both to render — discount wins. If both signals are needed (rare), pick one and surface the other in Row 2 or Row 3.
- Don't introduce a new badge variant inline — add it to `availVariants` or `curationVariants` cva config so the geometry stays consistent.
- Don't strip the `V3-D{n}` provenance comments — they're load-bearing changelog per [SOURCE.md §15](../SOURCE.md#§15--provenance--changelog-rules).

---

## Edge cases

| Case | Behavior |
|---|---|
| `name` is `undefined` or empty | Renders "?" initial in monogram tile (V2-D67-fu13 defensive guard, line 404). Prevents homepage crash on stale localStorage entries. |
| `photoUrl` is `undefined` | Falls back to category-color tile with name initial in Inter Tight Black 64px (mobile) / 80px (desktop). Background color: `cardCategoryColors[category].bg` (paired-color identity). |
| `rating` is `null` | Row 1 renders `—` em-dash next to star. Star icon still renders (yellow `#FFC32B`). |
| `nextSlotLabel` AND `priceFromCHF` both `null` | Row 3 renders empty (just whitespace from the `<div>`). Card height unchanged. |
| `discountPercent` and `curation` both passed | Discount badge wins. Curation silently dropped. |
| Long `name` (>~20 chars at mobile width) | `truncate min-w-0 flex-1` clips with ellipsis. Star+rating stay flush right. |
| Long `nextSlotLabel` + `priceFromCHF` together | Whole Row 3 `truncate`s — price may get cut. Consider dropping `nextSlotLabel` on tightly-budget rows. |
| User has `prefers-reduced-motion` | Hover lift + stagger entrance are bypassed. Active scale stays (it's a press-affordance, not a decoration). |

---

## Variant decision tree

```
Is this card on a homepage feed (Top/Nearby/Categories)?
├─ YES → variant="service" + nextSlotLabel + priceFromCHF + (optional) curation
└─ NO
   ├─ Is this a Last-Minute feed card?
   │  └─ YES → variant="service" + discountPercent + nextSlotLabel
   └─ Is this a saved/favorites card?
      └─ YES → variant="service" + isSaved={true} (heart pre-filled)
```

Currently only `variant="service"` is meaningfully different in the V3-D174 unified-3-row world. `variant="availability"` is a legacy path that still works but produces the same output as service when both `nextSlotLabel` and `priceFromCHF` are passed.

---

## Provenance

Selected V3-D{n} milestones (full list in code):

- **V2-D34** — original card lock, anatomy + slot map fixed.
- **V2-D60-cards-3** (2026-05-14) — Airbnb-style responsive widths; viewport-relative formula on mobile.
- **V2-D60-cards-6** (2026-05-14) — `aspect-[6/5]` → `aspect-square` (1:1). More portrait card overall.
- **V2-D60-cards-7** (2026-05-14) — unified 3-row hierarchy across all sections.
- **V2-D63** (2026-05-15) — vibrant liquid-glass badge recipe (`glassStyle`); badge geometry shared across discount/availability/curation.
- **V2-D67-fu7** (2026-05-16) — layered-glass recipe restored from V2-D34-fu (3-color: green / yellow / blue families).
- **V2-D67-fu11** (2026-05-16) — unified ALL badges on `layeredGlass` formula.
- **V2-D67-fu13** (2026-05-16) — defensive `name ?? ""` guard against stale localStorage crashes.
- **V2-D70** (2026-05-18) — warm-minimal SOLID-color badges (mint #E5F2EA, terracotta #D87352).
- **V3-D72** (2026-05-18) — Aurex floating shadow `0_20px_40px_rgba(0,0,0,0.04)` unified with SearchBar.
- **V3-D85-semantic** (2026-05-19) — yellow `#FFC32B` retired from chips; reserved for star + logo only. (Q1 in [QUESTIONS.md](../QUESTIONS.md) — yellow still ships on stars.)
- **V3-D90** (2026-05-21) — Fresha pixel-exact card geometry applied.
- **V3-D101** (2026-05-22) — stock photos restored; monogram fallback retained.
- **V3-D126** (2026-05-24) — mint bg saturation bumped (`#D1F0DC`).
- **V3-D146** (2026-05-25) — B&W palette pivot Phase 1: green CTAs → ink.
- **V3-D173** (2026-05-26) — corner-SVG arrows retired; `Flame` icon on urgent/limited only; `state="now"` short-circuits.
- **V3-D174** (2026-05-26) — Star + rating MOVED from Row 3 to Row 1 (Airbnb pattern).
- **V3-D175** (2026-05-26) — badge max-width `calc(100%-56px)` so it can't overrun the heart.
- **V3-D181** (2026-05-26) — AvailabilityPill ENTIRELY REMOVED from output ("Heute frei" / "Nur 1 heute" badges retired; prop kept for caller compat).

---

## Related

- **HeartButton** — top-right floating heart. See [HeartButton.md](HeartButton.md).
- **SectionTitle / ScrollRow** — feed-row container that hosts the cards. See [SectionTitle.md](SectionTitle.md).
- **AvailabilityPill** (internal, retired) — kept in code as a function but doesn't render. Resurrection path: inline-in-Row 3 with `Flame` prefix instead of competing absolute badge (per V3-D181 reasoning).

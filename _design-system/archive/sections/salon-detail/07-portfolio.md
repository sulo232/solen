# SalonPortfolio — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4733.png` + `IMG_4734.png` (Fresha — "Portfolio 14" h2 + 3-col square grid + "+5" overlay on last tile)
**Component:** `app/[locale]/_components/salon/SalonPortfolio.tsx`
**Layer:** 1 (chrome — image grid)

## Layout

```
H2 "Portfolio  N"   (count after title, muted)

[img][img][img]
[img][img][img]
[img][img][+N overlay]
```

- Uniform 3-col square grid (mobile + desktop), 9 visible tiles max
- Gap: `gap-1.5 md:gap-2.5`
- Tile aspect: `aspect-square`
- Tile radius: `rounded-md md:rounded-lg`
- Tile fallback bg: `bg-s-bg-sunken`
- "+N" overlay (when `urls.length > 9`): `bg-black/55` + `font-display 24px md:32px font-extrabold text-white` (V3-D202 — was `font-black`)

## Tokens
- Count badge: `14px md:15px font-normal text-s-ink-3` (no border)
- Overlay text: `font-extrabold` (V3-D202 — §3 says 800; was `font-black 900`)
- Hover: `hover:scale-[0.99] active:scale-[0.98]` transform

## Interaction
- Click any tile → `onOpen(index)` opens `SalonLightbox` modal at that photo

## Intentional deviations
- Fresha shows the count in a grey pill chip "14"; we render it inline next to the h2 as `text-s-ink-3` — softer hierarchy, matches our typographic eyebrow patterns elsewhere
- Earlier desktop variant used an irregular Fresha-style grid (1 large + 5 smaller); V2-D53.3 reverted to uniform 3-col per literal spec wording

## Edge cases
- 0 photos: returns null (orchestrator `availableSections` flag prevents Portfolio tab from rendering)
- 1-9 photos: no overlay (just visible tiles)
- 10+ photos: "+N" overlay on the 9th tile

## Provenance
- V2-D53.3 — initial impl
- V2-D53.3 fix #5 — collapsed to uniform 3-col per literal spec
- V3-D202 (A10) — H2 swap; overlay weight `font-black 900 → font-extrabold 800` for systemic consistency

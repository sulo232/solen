# SalonAbout — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4728.png` ("Über" h2 + paragraph) · `/Users/sulo/solen/screenshots/IMG_4736.png` + `IMG_4737.png` (Fresha — map block w pin + address + "Route" link)
**Component:** `app/[locale]/_components/salon/SalonAbout.tsx`
**Layer:** 1 (chrome)

## Layout

```
H2 "Über uns"                (Inter Tight 700 clamp 18-23px)

About paragraph(s)           (14px md:15px leading-relaxed text-s-ink-2 max-w-3xl)
  EN text on top, DE underneath (or just one)

┌────────────────────────────────────────┐
│  [SVG grid pattern bg]                 │
│         [Pin with rating]              │
│         Interaktive Karte folgt        │
│                                        │
└────────────────────────────────────────┘
📍 Address  Wegbeschreibung
```

## Tokens
- About paragraph: `text-s-ink-2` (primary EN text), `text-s-ink-3` for the secondary DE if both render
- Map placeholder bg: `bg-gradient-to-br from-s-bg-sunken via-white to-s-bg-sunken`
- Map grid stroke: `#E7E5E4` (`s-border`, V3-D202 — was retired sage `#A8B89A`)
- Map pin: `bg-s-ink text-white rounded-full h-12 w-12`
- Map caption pill: `bg-white/90 text-s-ink-3 text-[11px] font-semibold`
- Address row: `text-s-ink-2`, pin icon `text-s-ink-3`, Wegbeschreibung link `text-s-ink font-semibold hover:underline`

## Interaction
- Click Wegbeschreibung → opens Google Maps in new tab w pre-filled query
- Map placeholder is non-interactive — real Mapbox renders when `NEXT_PUBLIC_MAPBOX_TOKEN` lands (deferred)

## Intentional deviations
- Map is currently a placeholder (Solen-deferred until token configured); Fresha shows live Mapbox + interactive pan
- Both EN + DE about texts render when both present and distinct; Fresha picks one based on Accept-Language

## Edge cases
- 0 about text + no address: returns null (orchestrator's `availableSections` excludes About tab too)
- Only one language present: renders it; no styling differentiation

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A12) — H2 swap; SVG grid stroke `#A8B89A` → `#E7E5E4` (retired sage → s-border)
- Future V3-D — Mapbox integration when token ships, w `pin-s+0A0A0A` ink marker (NOT terracotta retired pin)

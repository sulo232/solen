# SalonSidebar — section spec

**Reference:** (Fresha mobile doesn't have a sidebar — its bottom CTA is the equivalent. Desktop Fresha shows a sticky right-rail booking card.) · `_audits/screenshots/salon-detail/05-desktop-top.png` (Solen — desktop sidebar w "Termin buchen" pill, collapsed initial state) · `_audits/screenshots/salon-detail/06-desktop-services.png` (Solen — sidebar expanded after scroll)
**Component:** `app/[locale]/_components/salon/SalonSidebar.tsx`
**Layer:** 1 chrome + Layer 2 Featured pill + Layer 3 StatusPill

## Layout

Desktop only (`lg:block`, 1024px+). Sticky `top-24`.

### Collapsed (initial, scrollY ≤ 200)
```
┌─────────────────────────┐
│  [   Termin buchen   ]  │
└─────────────────────────┘
```

### Expanded (after scrollY > 200)
```
┌─────────────────────────┐
│  Salon Name (h2)        │
│  ★ 4.8 (211)            │
│  [EMPFOHLEN]            │
│  [   Termin buchen   ]  │
│  ─────────────────────  │
│  🕐 Geöffnet bis 19:30  │
│       (expandable hours table)
│  📍 Address              │
│  Wegbeschreibung ↗      │
│  ─────────────────────  │
│  📞 Phone               │
│  🌐 Website ↗            │
│  📷 Instagram ↗          │
│  ─────────────────────  │
│  Gutscheine    [Kaufen] │
└─────────────────────────┘
```

## Measured (1440 desktop)
- Outer card: `rounded-2xl border-s-border bg-white p-5 md:p-6 shadow-elevation-3`
- Salon name h2: `font-display clamp(20px,1.5vw,22px) font-bold tracking-[-0.03em] text-s-ink`
- CTA pill: `rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white shadow-elevation-2`
- Star: `13px fill="#FFC32B"`
- Featured pill: `bg-s-accent/15 text-s-accent` (Layer 2 royal blue)
- StatusPill: `size="md"`, `showDot={false}` (the Clock icon provides the visual anchor instead)
- Hours table (collapsed inside status row): `rounded-lg bg-s-bg-sunken/50 px-3 py-2.5 pl-7 space-y-1.5 text-[12px]`

## Tokens
- Card shadow: `shadow-elevation-3` (V3-D202 — was arbitrary `rgba(0,0,0,0.08)`)
- CTA shadow: `shadow-elevation-2` (V3-D202 — was tinted emerald)
- StatusPill: imports the shared component (V3-D201)
- Hours bg: `bg-s-bg-sunken/50` mini-card

## Transition
- Expand/collapse via `max-height + opacity` transition (300ms `ease-out`)
- Hysteresis: expand at `scrollY > 200`, collapse at `scrollY < 50` (tight, single-gesture)

## Interaction
- Click "Termin buchen" → booking route
- Click status row → toggles inline hours table (`showHours` state)
- Click address Wegbeschreibung → Google Maps in new tab
- Phone / Website / Instagram rows → respective handlers (tel:, target=_blank)
- Click Gift Cards "Kaufen" → gift-card route

## Intentional deviations
- Two-state collapse-on-scroll (Solen-specific UX); Fresha desktop sidebar is always-expanded
- Collapsed shows ONLY the CTA — minimal noise when title block has the same info inches above
- Always renders card chrome (border + shadow), only content expands; avoids "naked floating button" look

## Edge cases
- No phone/website/IG: contact section block hidden
- `salon.opening_hours == null`: chevron + hours table hidden
- Featured `false`: pill omitted

## Provenance
- V2-D53.3 — initial impl + expand-on-scroll polish
- V3-D202 (A19) — outer shadow → `shadow-elevation-3`; salon name → `font-display`; star fill `#F3A864` → `#FFC32B`; CTA tinted shadow → `shadow-elevation-2`; inline emerald/amber status → `<StatusPill>`

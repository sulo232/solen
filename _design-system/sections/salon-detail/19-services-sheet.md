# SalonServicesSheet — section spec

**Reference:** Fresha booking-step-1 (full-screen w step breadcrumb "Services › Profi › Zeit › Bestätigen", chip filter, sticky cart sidebar)
**Component:** `app/[locale]/_components/salon/SalonServicesSheet.tsx`
**Layer:** 1 chrome (full-screen overlay)

## Purpose

Full-screen sheet that opens when the user taps "Alle ansehen" on Services. Acts as booking step 1 — service selection. Single source of truth for the full service catalog (the Services section shows only the first 5).

## Layout

```
[X close]                                                  Services
                                                           {salon.name}

[Alle] [Subcat 1] [Subcat 2] ... (sticky chip filter row)

┌─────────────────────────────┐     ┌─────────────────────┐
│ Service row (clickable)     │     │ Cart sidebar         │
│   Name                       │     │ (desktop only)       │
│   Duration · Price           │     │                      │
│ ────────────────────────    │     │ Selected services    │
│ Service row                  │     │ Total: CHF X         │
│ …                            │     │                      │
│                              │     │ [Continue]           │
└─────────────────────────────┘     └─────────────────────┘
```

## Tokens
- Sheet h1: `font-display clamp(25px,4vw,40px) font-extrabold tracking-[-0.03em]` (V3-D202 — was `font-body 28/40`)
- Sheet category h2: `font-display clamp(20px,2.5vw,26px) font-bold` (V3-D202)
- Active chip shadow: `shadow-elevation-1` (V3-D202 — was tinted emerald)
- Selected service card shadow: `shadow-elevation-2` (V3-D202)
- Cart card shadow: `shadow-elevation-3` (V3-D202)
- Star fill: `#FFC32B` (×2 instances)
- Empty-star: `#E7E5E4` (was retired cream `#E8DFD2`)
- Continue CTA shadow: `shadow-elevation-2`
- Filter pills: imports `<TabPill>` primitive

## Interaction
- Click X → `onClose()` closes sheet
- Click chip → filter by subcategory
- Click service row → toggle into cart (selected card gets shadow + ring)
- Click "Continue" → navigate to booking step 2

## Intentional deviations
- Solen "Continue" stays `bg-s-ink`; Fresha uses brand green
- Star yellow `#FFC32B` (V3-D200) — universal

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A21) — full detox: h1/h2 swap to Inter Tight; chip + card + cart shadows → elevation tokens; star fills → `#FFC32B`; empty-star → `#E7E5E4`; Continue CTA shadow → `shadow-elevation-2`

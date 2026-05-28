# SalonLoyalty — section spec

**Reference:** (Solen-only — Fresha doesn't have a per-salon loyalty pillar list) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c3.png` (Solen — Treueprogramm cards)
**Component:** `app/[locale]/_components/salon/SalonLoyalty.tsx`
**Layer:** 1 (chrome)

## Layout

```
H2 "Treueprogramm"           (Inter Tight 700 clamp 18-23px)

┌────────────────────────────────────────┐
│ ◆  Punkte sammeln                  [>] │
│    Erfahre, wie du Punkte sammelst     │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ ✨  Belohnungen                    [>] │
│    Lös spannende Belohnungen ein        │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ 👑  Stufen                         [>] │
│    Entdecke unser Stufenprogramm        │
└────────────────────────────────────────┘
┌────────────────────────────────────────┐
│ 👥+  Freund:in einladen            [>] │
│    Empfiehl uns weiter                  │
└────────────────────────────────────────┘
```

4 cards: Punkte (Diamond) / Belohnungen (Sparkles) / Stufen (Crown) / Freund:in einladen (UserPlus).

- Each card: `rounded-2xl border-s-border bg-white p-4 md:p-5` w `hover:shadow-elevation-2` (V3-D202 — replaced arbitrary shadow)
- Icon container: `h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white grid place-items-center`
- Icon: lucide `size={20} strokeWidth={2} text-s-ink`
- Title: `14px md:15px font-semibold text-s-ink`
- Subtitle: `12px md:13px text-s-ink-3`
- ChevronRight: `16px text-s-ink-3 strokeWidth={2.5}` — rotates 90° on open

## Tokens
- All chrome (no Layer 2 / Layer 3 — pure B&W informational cards)
- Hover shadow: `hover:shadow-elevation-2` (V3-D202)

## Interaction
- Click card → toggles inline description text below (`openIdx` state, single-card-open at a time)
- Future: when `/loyalty/{type}` routes exist, swap each `<button>` for `<Link>` + drop `openIdx`

## Intentional deviations
- Solen-only section — no Fresha equivalent
- Inline disclosure pattern instead of route-link until loyalty pages are built

## Edge cases
- None — always renders (the orchestrator's `availableSections.add("loyalty")` unconditional)

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A16) — H2 swap; arbitrary shadow `rgba(0,0,0,0.04)` → `hover:shadow-elevation-2`

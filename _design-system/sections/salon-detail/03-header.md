# SalonHeader — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4728.png` (Fresha — "Petit Bout d'Nails" w "Nägel" eyebrow + 5.0 (19) row + status + address) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c1.png` (Solen — Atelier Haarwerk w "EMPFOHLEN" pill, post-V3-D206)
**Component:** `app/[locale]/_components/salon/SalonHeader.tsx`
**Layer:** 1 chrome + Layer 2 eyebrow + Layer 3 StatusPill

## Layout

```
H1 (Inter Tight 800 clamp 28-44px)         [Share][Heart cluster on desktop only]
Category eyebrow (royal-blue uppercase 11px / 12px md)
Meta row: ★ rating · StatusPill · 📍address Wegbeschreibung
[Featured pill] [Last-Minute Flame pill]
```

### Measured (375 mobile, populated seed Atelier Haarwerk)
- H1: `28px / lh 29.4px / weight 800 / tracking -0.84px` (clamp at min) — Inter Tight
- Category eyebrow: `11px font-bold uppercase tracking-[0.06em] text-s-accent` (Layer 2 royal blue)
- Meta row: `13px text-s-ink-2` w `font-body` weight 300 default — star is 14px yellow filled
- Featured pill: `bg-s-accent/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.06em] text-s-accent rounded-full`
- Last-Minute pill: `bg-[#FFF1E6] text-[#9A3412] border border-[rgba(154,52,18,0.22)]` (Flame token)

## Tokens
- H1 color: `text-s-ink`
- Eyebrow: `text-s-accent` (#276EF1, V3-D204)
- Meta secondary: `text-s-ink-2`, dot separator: `text-s-ink-3`
- Star fill: `#FFC32B` (`s-star` — V3-D200 universal yellow)
- Featured pill: `bg-s-accent/15` + `text-s-accent` (Layer 2)
- Urgency pill: inline `#FFF1E6` / `#9A3412` (§2.1 inline urgency band)

## Interaction
- Click "Wegbeschreibung" → opens Google Maps in new tab
- Click Share (desktop only) → `navigator.share()` w clipboard fallback
- Click HeartButton (desktop only — mobile uses hero overlay) → toggle saved + toast

## Intentional deviations
- Solen Featured pill uses royal blue `s-accent` instead of Fresha's purple — V3-D204 brand lock
- Last-Minute pill uses Solen Flame token (burnt amber on peach) instead of Fresha's amber-light — §2.5 catalog row
- H1 uses Inter Tight (Fresha uses different sans) — V3-D190 Solen lock

## Category labels

Per V3-D206 eyebrow addition (`SalonHeader.tsx` `CATEGORY_LABEL` table):

| Slug | Label |
|---|---|
| `coiffeur` | Coiffeur |
| `barbershop` | Barbershop |
| `nails` | Nägel |
| `spa` | Spa & Wellness |
| `makeup` | Make-up |
| `waxing` | Waxing |

Falls back to `capitalize(slug)` for unknown categories.

## Provenance
- V2-D53.3 — initial impl + meta-row layout
- V3-D202 (A3) — H1 swap to `font-display` Inter Tight 800; star fill `#FFC32B`; StatusPill replacing inline emerald/amber; Flame badge tokens
- **V3-D206 (2026-05-26)** — category eyebrow added under H1 (was missing — Fresha has "Nägel" / "Coiffeur" between name + rating row)

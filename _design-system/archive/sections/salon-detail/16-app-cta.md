# SalonAppCta — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4738.png` (Fresha — "Gönn dir ein Verwöhnprogramm – wo du willst und wann du willst" + chip rows + Andere Unternehmen) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c3.png` (Solen — "Verwöhne dich jederzeit, überall")
**Component:** `app/[locale]/_components/salon/SalonAppCta.tsx`
**Layer:** 1 (chrome)

## Layout

```
H2 "Verwöhne dich jederzeit, überall"    (Inter Tight 700 clamp 20-26px)

[Andere Salons in Basel] [Andere Salons in Grossbasel] [Coiffeure]
[Barbershops] [Nagelstudios] [Spa & Wellness]

                  [Termin buchen >]                 (ink pill, centered)
```

## Measured
- H2: `clamp(20px,2.5vw,26px) font-bold tracking-[-0.03em] text-s-ink`
- Chip pills: `rounded-full border-s-border bg-white px-4 py-2 text-[13px] font-medium text-s-ink-2 hover:border-s-ink hover:text-s-ink`
- CTA pill: `rounded-full bg-s-ink px-7 py-3.5 text-[14px] md:text-[15px] font-semibold text-white shadow-elevation-2 hover:bg-black`

## Tokens
- All chrome: `bg-white`, `text-s-ink`, `border-s-border`
- CTA: `bg-s-ink` + `shadow-elevation-2` (V3-D202 — replaced tinted emerald `rgba(31,92,66,0.20)`)
- ChevronRight: `16px text-white strokeWidth={2.5}`

## Interaction
- Chip click → `/{locale}/search?city=X` or `/{locale}/{category}` route
- CTA click → `/{locale}/salon/{slug}/booking`

## Chip routing
| Chip | Route |
|---|---|
| `Andere Salons in {City}` | `/{locale}/search?city={City}` |
| `Andere Salons in {Quartier}` | `/{locale}/search?q={Quartier}` (only if quartier differs from city) |
| `Coiffeure` | `/{locale}/coiffeur` |
| `Barbershops` | `/{locale}/barbershop` |
| `Nagelstudios` | `/{locale}/nails` |
| `Spa & Wellness` | `/{locale}/spa` |

## Intentional deviations
- Solen CTA stays `bg-s-ink` (V3-D192-fix); Fresha uses green/branded
- Solen voice "Verwöhne dich" (Solen "du" register per §18); Fresha uses "Gönn dir"

## Edge cases
- `quartier` same as `city`: omit the duplicate chip
- `quartier` null: skip that chip

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A22) — H2 swap to Inter Tight 700; CTA tinted shadow → `shadow-elevation-2`

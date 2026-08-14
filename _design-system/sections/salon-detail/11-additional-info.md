# SalonAdditionalInfo — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4735.png` + `IMG_4736.png` (Fresha — "Zusätzliche Informationen" h2 + vertical checklist: Sofortige Bestätigung / Nur für Erwachsene / Parkplätze vorhanden / Gute Erreichbarkeit ÖV)
**Component:** `app/[locale]/_components/salon/SalonAdditionalInfo.tsx`
**Layer:** 1 (chrome)

## Layout

```
H2 "Zusatzinformationen"     (Inter Tight 700 clamp 18-23px)

✓ [Icon 16px]  Sofortbestätigung
✓ [Icon 16px]  Online bezahlen
✓ [Icon 16px]  Kostenlos bis 24h vorher stornieren
✓ [Icon 16px]  Haustiere willkommen
…etc (up to 12)
```

- Each row: `flex items-start gap-3 text-[14px] text-s-ink`
- Icon container: `h-5 w-5 inline-flex items-center justify-center text-s-ink-2` w lucide icon `size={16} strokeWidth={2}`
- Label: `leading-relaxed`
- List spacing: `space-y-3`

## Tokens
- Icon color: `text-s-ink-2` (muted — these are passive indicators, not interactive)
- Label color: `text-s-ink` (full ink — these are scannable facts)

## Amenities mapping (12 boolean flags → lucide icon + German label)

| Flag | Icon | Label |
|---|---|---|
| `instant_booking_enabled \|\| booking_confirmation_mode === "instant"` | ShieldCheck | Sofortbestätigung |
| `accepts_online_payment` | CreditCard | Online bezahlen |
| `free_cancel_hours > 0` | Repeat | Kostenlos bis {N}h vorher stornieren |
| `pet_friendly` | Dog | Haustiere willkommen |
| `kid_friendly` | Baby | Kinderfreundlich |
| `wifi_friendly` | Wifi | Kostenloses WLAN |
| `wheelchair_accessible` | Accessibility | Rollstuhlgerecht |
| `near_public_transport` | Bus | Nähe ÖV |
| `lgbtq_friendly` | Heart | LGBTQ+ willkommen |
| `woman_owned` | Star | Frauengeführt |
| `family_owned` | Home | Familiengeführt |
| `student_discount` | GraduationCap | Studentenrabatt |

## Interaction
- None (display-only)

## Intentional deviations
- Solen uses lucide icons; Fresha uses custom-illustrated icons (a person, a paw, etc.)
- Each row is single-icon-and-label (Fresha has a "✓" checkmark + secondary icon double; ours is single icon)

## Edge cases
- 0 flags true: returns null (no empty section header)

## Provenance
- V2-D53.3 — initial impl (replaced V2-D53.0 chip-treatment)
- V3-D202 (A14) — H2 swap to Inter Tight 700

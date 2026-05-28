# SalonServices — section spec

**Reference:** `/Users/sulo/solen/screenshots/IMG_4729.png` (Fresha — sticky chip row "Empfohlen / Prestation MAINS / Re..." + service rows w "Buchen" buttons + "ab 45 €" price) · `/Users/sulo/solen/screenshots/IMG_4730.png` (Fresha — "Alle anzeigen" full-width pill) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c1.png` (Solen)
**Component:** `app/[locale]/_components/salon/SalonServices.tsx` (+ `SalonServicesSheet` modal)
**Layer:** 1 chrome + Layer 2 filter pills (via TabPill primitive)

## Layout

```
H2 "Services" (Inter Tight 700 clamp 18-23px)
[Alle] [Subcategory 1] [Subcategory 2] ...    (TabPill row, horizontal scroll)

Service row (mobile = divider, desktop = bordered card):
  Name (15px font-semibold)
  Description (13px text-s-ink-3 line-clamp-2)
  ⏱ Duration · CHF Price
                                                          [Buchen outline pill]

…up to 5 rows shown, then:
[Alle ansehen]   (outline-pill, full-width center)
```

## Measured (375 mobile)
- H2: `18px font-bold tracking-[-0.03em]` Inter Tight
- Filter chip (TabPill `size="sm"`): `h-8 px-3 text-[13px]`
- Service row name: `15px font-semibold text-s-ink`
- Description: `13px text-s-ink-3 line-clamp-2`
- Duration row: `12px text-s-ink-3` w Clock icon 12px
- Price: `14px font-semibold text-s-ink`
- Book button: `rounded-full border-s-ink bg-white px-5 py-2 text-[13px] font-semibold` (hover: `bg-s-ink text-white`)

## Tokens
- Chip active: `border-s-ink bg-s-ink text-white` (TabPill outline-active)
- Chip inactive: `border-s-border bg-white text-s-ink-2` (hover → `border-s-ink text-s-ink`)
- All Book buttons use outline-pill `s-ink` — primary CTAs stay ink (V3-D192-fix)

## Interaction
- Click filter chip → sets `activeCat`, filters service list
- Click "Buchen" on a row → `/{locale}/salon/{slug}/booking?service={service.id}`
- Click "Alle ansehen" → opens `SalonServicesSheet` overlay (full-screen, booking step 1)

## Intentional deviations
- Fresha's "Buchen" buttons are filled green on hover; ours are outline-ink (Solen `bg-s-ink` only on primary "Termin buchen" Page CTA — service rows are secondary affordances per V3-D192-fix)
- No "ab 45 €" prefix — we always show absolute price (data model doesn't yet support "from X"; future-friendly when it does)

## Empty state
- 0 services: `<p>Dieser Salon hat noch keine Services hinterlegt.</p>` (italic, `text-s-ink-3`)

## Provenance
- V2-D53.3 — initial impl
- V3-D202 (A6) — H2 to `font-display` Inter Tight; chip row extracted to `<TabPill>` primitive
- V3-D207 — pending: ChevronRight on "Buchen" buttons? Open Q.

# HOMEPAGE , design pass (9-item owner feedback)

> Status: **ACTIVE** (2026-06-29). Mockup-first for new looks; auto-commit small consistency polishes.

## Items (owner's 9-point list)
1. [x] Hero copy , killed "Termin in 30 Sekunden" -> "Termine, sofort bestätigt." (`027c9c016`).
2. [x] Search-bar shadow reduced -> `elevation-2` (killed the mobile halo).
3. [x] Card shadow , single-layer `elevation-2`/`-3` (killed the double-line artifact).
4. [x] Icon flat-vs-shadowed , council confirmed flat chrome is COHERENT; kept flat.
5. [x] Home icon -> Solen logo on homepage (Header `isHome` branch) (`2be43681a`).
6. [~] Category-page cards , treatment ALREADY EXISTS (`SalonResultCard` via `SearchTemplate`: price=`avg_price` renders, next-slot wired via `with_slots=1`+`nextSlotLabel`). Swapped `Clock`->`Calendar` to match the homepage card. DONE except the next-slot is sparse (real availability), which is a data matter, not the card.
7. [ ] **Walk-in redesign + clarify** , NOT started. Homepage `WalkInBand` + `queue/[token]`. Vision: pay upfront -> queue number -> show on arrival; `queue/[token]` is THE tracker (see memory project_walkin_vision / project_walkin_single_tracker).
8. [x] Inspo preview , clean 9:16 tiles + top-left "TikTok" pill + creator·price caption from real feed (`2cedef343` + caption + CTA-alignment fix).
9. [x] Reviews block , cool `elevation-2`/`-3` shadow + 14px focal quote.

## PARKED (decide)
- **Inspo "ab CHF" i18n** (`Entdecken.tsx` ~368): German "ab" leaks on /en /fr /it; SalonCard uses bare "CHF X". Pick: drop "ab" (match SalonCard) / localize via existing `fromPrice` key / keep.
- **Reviews date** (`Reviews.tsx` ~146): full "11. Juni 2026" -> relative "vor 2 Wo." (needs `Intl.RelativeTimeFormat`). Owner said commit+move-on; optional.
- **Homepage FABRICATED next-slot times** (no-fab): Nearby/RecentlyViewed hardcode "Heute 15:30" (`Nearby.tsx:76`, `RecentlyViewed.tsx:55-57`). The honest fix behind item-6's next-slot gap is to make THESE real (or drop them), not to fake the category cards.

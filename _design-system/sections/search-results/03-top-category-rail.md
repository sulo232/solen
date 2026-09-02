# Top <Category> rail , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, bands 2 and 3. Band 3 is the heading row wrapper (`div.mb-[14px] flex items-center justify-between gap-4`), fully contained in band 2 and carrying the same heading, so it is folded into this file rather than given one of its own.
**Component:** `app/[locale]/_components/search/CategoryMobileRails.tsx` (`Rail` and `RailHeading`), composing `homepage/SalonCard.tsx` and `homepage/SectionHeader.tsx` (`ScrollRow`)
**Layer:** 1 chrome (the heading row) + Layer 2 `SalonCard` + Layer 3 `RatingStars`, `HeartButton`, `PriceFrom`

## Layout

```
y 166  ┌ Top Coiffeur ──────────────────────── (32) → ┐   heading row, 366 x 32
       │                                              │   14px gap
       │  ╭─────────────╮ ╭─────────────╮ ╭──────     │   ScrollRow, snap x mandatory
       │  │             │ │             │ │           │   photo 231 x 185, radius 22
       │  │   PHOTO 5:4 │ │   PHOTO 5:4 │ │  PHOTO    │   elevation-2, no border
       │  ╰─────────────╯ ╰─────────────╯ ╰──────     │   gap 12, bleeds past 390
       │   Haarsalon Margot        ★ 4.8              │   name 14/600, rating 12/400
       │   Coiffeur                                    │   12/400 grey
       │   4051 Basel            ab 35 CHF             │   12/400 grey + 12/600 ink
y 469  └──────────────────────────────────────────────┘
```

## Measured

Band 2 box: top **166**, left **12**, width **366**, height **303**. Surface `rgba(0, 0, 0, 0)`, padding `0px`, radius `0px`. Band 3 (heading row) box: top **166**, left **12**, width **366**, height **32**.

Text roles, band 2, verbatim from the JSON:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 18 | 600 | Inter Tight | `rgb(10, 10, 10)` | 22.5 | -0.18px | 1 | `Top Coiffeur` |
| 14 | 600 | Inter | `rgb(10, 10, 10)` | 17.5 | normal | 8 | `Haarsalon Margot` |
| 12 | 400 | Inter | `rgb(107, 107, 107)` | 18 | normal | 8 | `4.8` |
| 12 | 400 | Inter | `rgb(107, 107, 107)` | 16.2 | normal | 24 | `Coiffeur` |
| 12 | 600 | Inter | `rgb(10, 10, 10)` | 16.2 | normal | 8 | `35 CHF` |

Card anatomy, band 2: radius **22px**, shadow `rgba(50, 47, 44, 0.09) 0px 2px 8px` (= `shadow-elevation-2`), border **none**, background `rgb(244, 244, 245)` (= `s-bg-sunken` `#F4F4F5`), padding `0px`, count **8**, example size **231x185**.

Imagery, band 2: **8** images, **340,477 px** total area.

**Everything above reconciles with the source, checked rather than assumed.** `SalonCard.tsx:404` sets the card width to `calc((100vw-44px)/1.5)`, which is 230.67 at a 390 viewport and rounds to the measured 231. `:426` sets `aspect-[5/4] rounded-[22px]`, so 230.67 / 1.25 is 184.53, rounding to the measured 185. `:427` sets `shadow-elevation-2`. The background is the monogram fallback tile `#F4F4F5`, which is the measured card background because the photo sits over it. 8 images at 230.6667 x 184.5333 is **340,525.5 px**, against the measured **340,477**: a gap of 48.5 px over eight images, 0.014%. **Corrected 2026-08-27**, this line gave the computed figure as 340,481, which is not what the formula produces. The reconciliation still holds and holds tightly; only the arithmetic was wrong. Per image the computed 42,565.7 px sits against a measured 42,559.6 px.

**The 24-count 12px role is three lines per card, not one.** `SalonCard.tsx:534` is the category label at `text-[12px] font-normal leading-[1.35]` (12 x 1.35 = the measured 16.2), and `:543` / `:548` are the postal-city line and the `ab` price prefix, both `CardMeta` at `text-[12px] leading-[1.35]`. Three lines x 8 cards is 24.

**The rating line reads line-height 18 rather than 16.2** because `CardMeta` at `:523` carries `text-[12px] tabular-nums` with no `leading-*`, so it takes the default 1.5.

## Chrome position

Not applicable to this section. The search pill's box is recorded in `02-search-band.md`.

## Tokens

- Heading: `font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink`. At 390 the clamp resolves to its 18px lower bound, which the measurement confirms, along with 18 x 1.25 = 22.5 line-height and 18 x 0.01 = 0.18px negative tracking.
- Heading trailing glyph: `h-8 w-8 rounded-full bg-s-bg-sunken text-s-ink`, lucide `ArrowRight` size 20 strokeWidth 2.2, `aria-hidden`
- Card photo: `rounded-[22px] shadow-elevation-2`, fallback tile `#F4F4F5` with a `#0A0A0A` monogram at `text-[64px]`
- Card name: `text-s-ink`, measured weight 600
- Card meta: `text-s-ink-2` `#6B6B6B`, measured `rgb(107, 107, 107)`
- Price: `PriceFrom` with `emphasis`, measured 12 / 600 ink; the `ab` prefix stays `text-s-ink-2`
- Rail: `mt-1 flex gap-3 overflow-x-auto py-1 -mx-3 px-3 scroll-pl-3`, `scroll-snap-type: x mandatory`

## Interaction

- Each card is a `Link` from `next-view-transitions`, so the photo morphs into the PDP hero.
- Horizontal scroll with snap alignment at the card start. The negative margin lets the row bleed to the viewport edge while the section's own gutter stays at 12.
- Photo hover raises to `shadow-elevation-3`.
- `HeartButton` toggles saved state.
- **The 32px circular arrow beside the heading is inert.** It is `aria-hidden="true"` and carries no handler, and the component's own comment says so: no see-all destination was specified for this rail set. It is chrome that looks like a control.

## Intentional deviations

- **This route does not render a search-results list on mobile.** Owner 2026-08-01 ("remove cz we made it carousel right did u forget") replaced the flat `SalonResultCard` feed with these rails on any route where `activeCategory` is set. `CORPUS.md` section 4 describes the vertical one-column list this screen used to be, and it now describes a screen that is not rendered here at 390. The corpus is not wrong; it is older than the change, and `CORPUS.md` sections 4, 5, 7 and 8 all read against `SalonResultCard`, not `SalonCard`.
- **Two rails show the same eight salons.** Both band 2 and band 4 measure exactly 8 cards and an identical 340,477 px of imagery. `RAIL_CAP` is 10, and both rails slice from the same fetched `salons` array, so a count of 8 against a cap of 10 means the pool holds 8 rows and each rail renders all of them. Top sorts by rating descending (sample `4.8` first); Nearby keeps the fetch order (sample `4.2` first). See `04-nearby-rail.md`.
- **`CardName` is overridden to weight 600 at the call site, and the override is a dated owner decision. Amended 2026-08-27.** The mechanics as recorded are right: `CardText.tsx` bakes `font-medium` (500) and its docstring says className is for layout only and never weight; `SalonCard.tsx:517` passes `font-semibold`; `cn()` is clsx with no tailwind-merge, so both classes ship and the measurement shows 600 winning. What this file omitted is the two-line comment directly above that call, `SalonCard.tsx:515-516`: **"OWNER PICK 2026-08-06, direction D: tracking off, name weight up to 600."** By the precedence chain a dated owner decision outranks a component docstring, so this is not drift to be tidied away, and nobody should "fix" it back to 500 on the strength of the docstring alone. It remains true that this is where the screen departs from the owner's target ladder, which carries emphasis at 500. Those are two dated owner positions, 2026-08-06 on this card and 2026-08-27 on the ladder, and reconciling them is his call, not this file's.
- **The photo carries `shadow-elevation-2`, and the design-contract surface table says a SalonCard is photo plus `shadow-whisper` and no border.** Measured value is elevation-2. Recorded, not changed.
- **The heading row is hand-built rather than composed from `SectionTitle`, and the registry documents that as deliberate (FLOORS LAW 9, added 2026-08-27).** FLOORS LAW 9 asks whether a screen re-implements something the registry owns. `SectionTitle` (`homepage/SectionHeader.tsx`, `COMPONENT_REGISTRY.md:173`, locked) is the registered "H2 plus optional link plus desktop scroll arrows" heading, and `CategoryMobileRails.tsx:56-58` states why it is not used here: `SectionTitle` puts its arrow bare inside the `h2` by a dated 2026-05-15/16 decision, and this rail's source of truth is the mockup's pinned 32px circular `.sa-h2arrow`. The registry's own `CategoryMobileRails` row (`:199`) carries the same sentence. So this is a divergence with a named reason recorded in two places, which is what FLOORS LAW 9 asks for, and not an undocumented hand-draw. Everything else in the rail composes registered components: `SalonCard` (`:137`), `ScrollRow` (`:175`), and inside the card `CardName`, `CardMeta`, `RatingStars`, `PriceFrom` (`:84`) and `HeartButton`, all imported at `SalonCard.tsx:8-9`. The one section on this route that DOES re-implement a registered component is the FAQ; see `06-faq.md`.

## Empty state

`Rail` returns `null` when `salons.length < 2` (`CategoryMobileRails.tsx:126`), and `CategoryMobileRails` returns `null` entirely when the Top rail has fewer than 2. There is no empty variant: a rail that cannot fill is not drawn. That is why the third rail defined in this component, `Bald frei` (`TITLES.soon`), appears nowhere in the measurement. At most one of the eight salons had a slot inside the next seven days.

## Against the floors

**This section owns both failing floors on `/de/basel/coiffeur`.**

- **F6 display anchor 18px FAIL against 28.** The 18px `RailHeading` `h2` measured in this band is the largest text rendered on the screen. Nothing else in the first viewport is larger: `02-search-band.md`'s label is 14, the cards are 14 and 12, the bottom nav is 12, and the header has no text. The 22px footer wordmark and the 17px newsletter heading sit at y 1374 and below, outside the first viewport.
- **F7b anchor ratio 1.5x FAIL against 1.8.** 18 / 12. The median text size on this screen is 12px, which is what the checker uses as the body term, and this band supplies 40 of its own text elements at 12px against 8 at 14px and 1 at 18px.
- **F2 imagery 41.03% PASS against the 33% floor.** This band and band 4 are the entire imagery of the screen. Two rails, each 366px of visible width by 184.53 tall inside the viewport, is 135,076 px against the 329,160 px of a 390x844 viewport, which is 41.0%.
- **F7a bold share 28.57% PASS against the 30% ceiling.** This band contributes 17 of its 49 text elements at weight 600 or more (1 heading, 8 names, 8 prices), which is 34.7% inside the band alone. The screen passes because bands with no bold text (the bottom nav's 4, the header's 0) pull the whole-viewport figure down. The band on its own is over the ceiling.
- **F7c four distinct sizes PASS.** This band uses 3 of the 4: 18, 14 and 12.
- **ELEVATION five levels PASS against a floor of 2.** This band supplies `elevation-2`.

Against the owner's target ladder (anchor 30, body 14, ratio 2.14x, bold share 30% carried at weight 500, imagery 34.66%): this screen sits at anchor 18, body 12, ratio 1.5x, and its bold is carried at 600. Imagery is the one axis where this screen is ahead of the salon page, 41.03% against 34.66%.

## Provenance

- Owner 2026-08-01, "remove cz we made it carousel right did u forget" , the flat feed becomes rails on category routes
- `public/_mockups/home-v3/search-a.html` `categorySections()` / `railCard()` / `sectionFrame()` , the approved source for the 32px pinned arrow, the `bg-s-bg-sunken` fill, the 14px heading gap and the `.sa-h2` 18/600 clamp
- `/dev/card-ratio` V2, owner 2026-07-03 (R4-2) , the `calc((100vw-44px)/1.5)` card width
- CARD_REDESIGN_2026-07-13 C1 , the 5:4 photo and the 22px radius
- V3-D348 / V3-D346 (LOCKFILE A13) , `CardName` is the one ink anchor of a card
- V3-D442 , two-anchor card rule, name larger than price
- V3-D200 , star `#FFC32B`
- Art. 13 PBV , the from-price must name the offer it buys, which is why `priceFromService` is threaded through

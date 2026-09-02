# City-category FAQ , section spec

**Reference:** `_design-system/sections/_measured/search-results.json`, band 7.
**Component:** `app/[locale]/[city]/[category]/page.tsx`, the local `CityCategoryFaq` function (defined in the route file, not in a shared component)
**Layer:** 1 (chrome, SEO content)

## Layout

```
y 868  ────────────────────────────────────────────  border-t hairline
       │  py-12 (48px)                             │
       │  Häufig gestellte Fragen                  │  18/600 Inter Tight
       │  (24px gap)                               │
       │  ┌────────────────────────────────────┐   │  326 x 244, radius 16
       │  │ Wie viel kostet ein Besuch ...   ▸ │   │  summary 16/600 Inter
       │  ├────────────────────────────────────┤   │  hairline between rows
       │  │ Wie finde ich den besten ...     ▸ │   │
       │  ├────────────────────────────────────┤   │
       │  │ Kann ich online einen Termin ... ▸ │   │
       │  └────────────────────────────────────┘   │
       │  py-12 (48px)                             │
y 1255 ────────────────────────────────────────────
```

## Measured

Band 7 box: top **868**, left **12**, width **366**, height **387**. Surface `rgba(0, 0, 0, 0)`, padding `48px 20px`, radius `0px`. The measured 366 width against a `px-5` (20px) padding gives a 326px content width, which is the measured card width.

Text roles, verbatim:

| size | weight | family | colour | line-height | letter-spacing | count | sample |
|---|---|---|---|---|---|---|---|
| 18 | 600 | Inter Tight | `rgb(10, 10, 10)` | 21.6 | -0.36px | 1 | `Häufig gestellte Fragen` |
| 16 | 600 | Inter | `rgb(10, 10, 10)` | 24 | normal | 3 | `Wie viel kostet ein Besuch bei einem Coiffeur in Basel?` |
| 14 | 400 | Inter | `rgb(107, 107, 107)` | 20 | normal | 3 | `Die Preise variieren je nach Salon und Service. Nutzen Sie u` |

Card anatomy: radius **16px**, shadow **none**, border **`1px solid rgb(228, 228, 231)`**, background `rgb(255, 255, 255)`, padding `0px`, count **1**, example size **326x244**.

Imagery: **0** images.

**Three answers measured as visible.** `<details>` renders its `<p>` only when open, and `visible()` in the measure script rejects zero-height nodes, so a count of 3 on the 14px answer role means all three rows were open at measurement time. The source sets no `open` attribute. This is **not explained**: the JSON records no interaction, and nothing in `CityCategoryFaq` opens them. Recorded as unexplained rather than rationalised.

**The heading's clamp resolves to 18 at 390.** `clamp(18px, 2vw, 20px)` with 2vw = 7.8px takes the 18px lower bound, and 18 x 1.2 = the measured 21.6 line-height, 18 x 0.02 = the measured 0.36px negative tracking.

## Chrome position

Not applicable to this section. The search pill's box is recorded in `02-search-band.md`.

## Tokens

- Section: `px-5 md:px-6 lg:px-10 xl:px-20 py-12 border-t border-s-border max-w-[800px] mx-auto`
- H2: `font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-6`
- Group card: `rounded-card` (16) `border border-s-border bg-white overflow-hidden`, one grouped list card with rows sharing a hairline rather than each carrying its own chrome
- Row: `border-t border-s-border p-4 cursor-pointer first:border-t-0`
- Question: `font-body font-semibold text-base text-s-ink` (16px)
- Answer: `font-body text-sm text-s-ink-2 mt-3` (14px)

## Interaction

- Native `<details>` / `<summary>`. Tapping a row toggles that row. No JavaScript, no shared accordion state, so more than one row opens at a time.
- The default disclosure triangle is not suppressed in this markup.

## Intentional deviations

- **This section lives inside the route file, not in a shared component, and the registry already owns the component it hand-draws. Named 2026-08-27.** FLOORS LAW 9 says a screen is composed from registered components rather than drawn inline. `CityCategoryFaq` is a local function in `page.tsx` and it hand-builds both its grouped list card and its disclosure rows. **It should compose `FAQItem`** (`_components/business/FAQItem.tsx`, `COMPONENT_REGISTRY.md:220`, locked V3-D220), whose registry entry is `<FAQItem q a defaultOpen?>`, a native `<details><summary>` accordion with a chevron that rotates 180 on open, and whose stated Use is "FAQ lists (5 to 20 items)". Three things the swap would settle rather than preserve: `FAQItem` ships the rotating chevron this markup leaves as the browser's default disclosure triangle, which the Interaction section above already records as unsuppressed; it carries a `defaultOpen` prop, which is the only documented way a row here is meant to start open, and all three of this screen's rows measured open with no `open` attribute anywhere in the route file; and it is the component every other FAQ on the site renders through, so a later change to disclosure behaviour would reach this screen instead of stopping short of it. Recorded, not changed, and no swap is applied in this folder.
- **The registry rules out the other candidate by name.** `ServiceDisclosureRow` (`COMPONENT_REGISTRY.md:88`) is the system's other registered disclosure, and its own Don't clause reads "FAQ prose (use `FAQItem`)". So the registry does not merely happen to own a fitting component; it has already answered which of its two disclosures this section takes.
- **The 16px question is the only 16px visible text on the screen.** The design contract's text-size row names 14 for body and 12 for meta, and there is no 16 in it. The design contract's radius row does name 16 for a form or summary card, which this card matches.
- The German copy in this section is one of four locale blocks that interpolate the real city and category name, so nothing here is a hardcoded "Basel" (A7-city-category-seo, 2026-07-27).

## Empty state

None. The three questions are static per locale and are always present.

## Against the floors

**This band sits entirely below the fold** (top 868 against a viewport of 844), so it contributes to none of the six first-viewport floors. It is listed here so a later reader does not go looking for its contribution.

- Its 18px `h2` is the same size as the two rail headings, so promoting it would not change F6 either.
- Its 16px question rows sit fourth in the document's size list, behind the footer's 22px wordmark, the 18px headings this band shares with the two rails, and the footer's 17px newsletter heading. Nothing on this screen reaches 28px anywhere, above or below the fold.
- Whole-document totals from the JSON's `screen` block, for contrast with the first-viewport figures: **8 distinct sizes** (22, 18, 17, 16, 15, 14, 13, 12), **4 distinct weights** (400, 500, 600, 700), **138 text elements of which 48 are weight 600 or more, which is 34.78%**. The design contract's ceiling of 4 sizes and 2 weights is a per-screen number, and the first-viewport measurement is what the checker grades; the whole-document figure is recorded so the gap between the two is visible rather than hidden.

Against the owner's target ladder (`/de/salon/cuts-and-culture`, measured 2026-08-27: anchor 30px over a 14px body, ratio 2.14x, 5 distinct sizes, weight-600 share 30%, 3 elevations, 34.66% photographic): this band's 16px question sits nearer the ladder's 14px body than its 30px anchor, and the 18px `h2` it shares with the two rails is 12px short of that anchor. The ladder's five distinct sizes are drawn from a screen whose largest is 30, so its range is 30 down to a small meta size; this band's own contribution to this screen's eight document-wide sizes is a 16px that no other band uses, which adds spread without adding range. That is the failure FLOORS LAW 7(c) names: size variety is not range.

## Provenance

- V3-D262 (W4, 2026-05-27) , the FAQ h2 moved to the LOCKFILE section spec, and the route was rewired from a handcrafted page to `SearchTemplate`
- A7-city-category-seo (2026-07-27) , per-locale FAQ copy interpolated with the real city and category, replacing German-only literals served under `/en/`, `/fr/` and `/it/`
- S1 fix, approved at `public/_mockups/fixes-refined` , one grouped list card, rows share a hairline

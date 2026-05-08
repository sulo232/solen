# Solen — Live Truth (V3, V2-D15-3 lock)

> **Status:** ACTIVE · **Locked:** 2026-05-07 (V2-D15-3 — V3 brand pivot to dark teal `#043338` + Cooper BT + Avant Garde Gothic + 4 categories) · **V3 Preview:** `public/solen-v2-republik-teal.html` (homepage) · `public/solen-v2-palette.html` (palette) · `public/solen-v2-combos.html` (31-combo grid) — serve via `npx serve public -p 4747`
>
> Single source of truth for solen.ch's frontend. V3 foundations locked 2026-05-07 (V2-D15-3) grounded in research on Republik · Yuh · Fresha · Uber · Airbnb. Foundations originally rewritten V2-D15 (hybrid scratch reset) then pivoted V2-D15-3 (orange retired → dark teal + 6 cats → 4 cats + Cooper/Avant Garde). Component patterns + form primitives + category page + accessibility + analytics preserved through both pivots. v2-prelim archived at `_tasks/archive/SOLEN_LIVE_TRUTH_v2-prelim.archived.md`.
>
> **Hierarchy when docs conflict** (per CLAUDE.md): this doc wins over Q-locks wins over reference HTML wins over component JSDoc. If this doc is wrong, fix it FIRST, then propagate.

---

## §0 What this is

Solen is a Swiss beauty + wellness booking marketplace. Multi-city from launch (Basel, Zürich, Bern). Mobile-first. The product is finding a salon and booking a service. Everything in this spec serves that product.

**The brand voice in one paragraph:** confident, useful, Swiss-direct. Not literary. Not "magazine that printed your haircut" — that V1 framing is retired. Not corporate either. Solen sounds like a competent friend in Zürich who actually books appointments and tells you which salon is good. Du-form German is the default; switch to formal Sie only in legal copy.

**Anti-patterns retired explicitly:** "editorial-magazine" framing, italic-as-moment ornament (Instrument Serif retired), separate mono numerics font (JetBrains Mono retired), warm cream substrate (white substrate now), "Like a Swiss independent magazine printed your haircut" voice.

---

## Index

**Foundations**
- [§1 Brand color](#1-brand-color) · [§1b Geographic scope](#1b-geographic-scope)
- [§2 Per-category colorways](#2-per-category-colorways) · [§3 Semantic colors](#3-semantic-colors)
- [§4 Warm-ink scale + substrate](#4-warm-ink-scale--substrate)
- [§5 Typography](#5-typography) · [§5a Pill rule](#5a-pill-rule-v2-d15-3-lock) · [§5b Depth system](#5b-depth-system) · [§5c Personality tokens](#5c-personality-tokens) · [§5d Inline emphasis](#5d-inline-emphasis) · [§5e Iconography](#5e-iconography) · [§5f Hierarchy: one hero per info block](#5f-hierarchy-one-hero-per-info-block) · [§5g Atmosphere wash](#5g-atmosphere-wash-recipe-v2-d15-3-lock) · [§5h Color philosophy](#5h-color-philosophy-the-locked-design-law-v2-d15-3) · [§5i Combo library](#5i-combo-library-reference-for-future-categories)

**Layout fundamentals**
- §6 Spacing scale · §6b Breakpoints · §6c Container & max-width
- §7 Radius scale · §8 Z-index · §9 Scroll behavior · §10 Safe areas · §11 Hit targets

**Foundation primitives (Phase 0)**
- §F.1 Form primitives — text input · textarea · select · checkbox · radio · switch (locked V2-D14)
- §F.2 Modal · §F.3 Bottom sheet · §F.4 Toast · §F.5 Date/time picker · §F.6 Skip-link · §F.7 Font fallback · §F.8 Cookie consent (PENDING — locked iteratively)

**Locked components & patterns**
- §12 Header · §13 Hero · §14 Search system · §15 Section header pattern
- §16 Salon card · §17 Horizontal scroll row container
- §18 Entdecken (looks) · §19 City tiles · §20 B2B promo card
- §21 Footer · §22 Browse-by-city SEO link wall
- §23 Final v1 homepage flow

**Cross-cutting**
- §24b Accessibility baseline · §24c Analytics events (PostHog)

**Page templates**
- §25 Category page — `/[city]/[category]` (Republik colorway applied per §2)

**Verification**
- Component PR checklist

**Roadmap**
- What's still missing (Phase 0–6 surface gaps)

---

## §1 Brand color

Solen runs on **one accent: dark teal `#043338`** (Republik panel #4 — locked V2-D15-3). Used densely as connective tissue (Yuh discipline): logo, active nav, inline links, list bullets, ONE word per hero h1, CTA pills, status text, ONE saturated feature card per page. **Never as a hero panel bg.**

|Role                  |Hex      |Token            |Where it appears                                                                                          |
|----------------------|---------|-----------------|----------------------------------------------------------------------------------------------------------|
|Brand primary         |`#043338`|`s-brand.DEFAULT`|Logo, active nav state + underline, all CTA pills (white text per pill rule), inline links, "Heute frei" status, hero accent word, stat circles, Solen Pro feature panel bg |
|Brand pale            |`#C2F0F1`|`s-brand.pale`   |Text on dark-teal panels (Republik exact pair from panel #4). Atmospheric wash component.                  |
|Brand subtle          |`#E1F4F4`|`s-brand.subtle` |Soft teal-tinted pill bgs (live-counter pill, hint chips). Body text on this bg is `#1A1209`.              |

**Tailwind classes:** `bg-s-brand`, `text-s-brand`, `border-s-brand`, `focus-visible:ring-s-brand`. Token name matches the value — no legacy aliases.

**Contrast (WCAG):**
- `#043338` on white = **14.74 : 1 AAA** — body-safe at any size, no `text-deep` variant needed (the orange-era `s-brand.text-deep` is retired)
- `#C2F0F1` on `#043338` = 11.09 : 1 AAA — Republik panel #4 exact pair, the locked dark-teal-panel typography pair
- White on `#043338` = 14.74 : 1 AAA — pill rule default for CTAs

### §1.1 · The Yuh-density discipline (the law)

Brand teal is used **60–100× per page** in tiny accents. The discipline is **density, not size** (Yuh's actual pattern, verified across yuh.com home/pricing/about — coral appears 35–101× per page, ~80% of uses are <18px text). Distribution per page:

- ~80% small text (<18px): inline links, list bullets, "Heute frei" status, words inside body copy
- ~10% mid text (18–40px): section CTAs, sub-headers, accent words in headlines
- ~5% headline-size (one word per hero h1, max one per heading)
- 1–2 saturated CTA pills (filled brand bg + white text)
- 1 saturated feature card per page (Solen Pro — same pattern as Yuh's "Swissqoins for the win")

**The brand color is NEVER:**
- A hero substrate (white substrate is permanent — Yuh law)
- A category panel bg (categories have their own colorways per §2)
- The body text color (body is ink-1 `#1A1209`)
- More than 1 saturated panel per page

### §1.2 · The Republik-monochrome rule (for the saturated brand panel)

When the Solen Pro feature panel appears as a full-saturated brand bg `#043338`, ALL text inside is `#C2F0F1` pale teal. Headline, deck, byline, link — same color. No multi-color text within a saturated panel (Republik Law 1 from `/tmp/republik-research/colorways.md`).

**Anti-pattern:**
- Reintroducing brand orange `#E8742A` (retired V2-D15-3 — orange is in retired-list)
- Inventing `#043338` near-misses like `#0A4A52` or `#053B40`
- Tinted-of-bg text inside CTA pills — pill text is white-or-black per §pill-rule
- Brand teal as a hero panel — that's a category panel job, not brand

### §1.3 · The Solen logo wordmark (V2-D27 lock — 2026-05-09)

The brand mark is a typography-rendered wordmark, not a graphic logo. **No icon, no symbol, no monogram beyond the dot accent.** The wordmark IS the brand.

|element  |spec                                                                                                                                  |
|---------|--------------------------------------------------------------------------------------------------------------------------------------|
|wordmark |"Solen" rendered in **Cooper BT** (locked display font per §5; free fallback **Sansita 900** since cdnfonts.com Cooper CDN is HTTP 500)|
|case     |Mixed case (uppercase S, lowercase olen) — Cooper Black's chunky character lives in the lowercase forms                              |
|color    |ink-1 `#1A1209` on white substrate, white `#FFFFFF` on dark substrate (footer / dark CTAs)                                            |
|tracking |`-0.025em` letter-spacing (tight, matches Cooper's natural compactness)                                                                |
|dot accent|trailing dot in **brand-teal `#043338`** (or `brand-pale #C2F0F1` on dark substrate). Sized proportional to font size — see size scale.|
|dot alignment|baseline-aligned (sits on the wordmark's baseline, NOT centered vertically — gives the dot a "punctuation" feel like a period after Solen)|
|gap      |`3-6px` between final 'n' and dot (scales with size — see scale table)                                                                 |

**Size scale (V2-D27):**

|size|font size|dot size|dot gap|use                                                                |
|----|---------|--------|-------|-------------------------------------------------------------------|
|sm  |18px     |4px     |2px    |Header collapsed / mobile small / footer secondary                |
|md  |28px     |6px     |3px    |**Default** — app top bar, login modal header, primary brand-mark |
|lg  |40px     |8px     |4px    |Marketing hero / "Made in Basel" footer brand block               |
|xl  |64px     |12px    |6px    |Landing splash / brand-mark moments / og:image                    |

**Implementations:**
- React: `<Logo size="md" />` from `@/app/[locale]/_components/primitives` — uses loaded V3 fonts, perfect rendering
- Static SVG (favicon / og:image / metadata): `public/logo.svg` — same wordmark as `<text>` with font fallback chain (Sansita / Cooper Black / Georgia / serif). Not pixel-perfect outside contexts where Sansita is loaded, but acceptable for small-format usage.
- HTML mockups: inline CSS, `font-family: 'Cooper BT', 'Cooper Black Std', 'Cooper Black', 'Sansita', Georgia, serif` + `::after` pseudo-element for the dot.

**Anti-pattern:**
- Reintroducing the V1/V2 Bebas Neue tall-narrow caps logo (retired V2-D27)
- Coral / orange dot accent — banned (retired V2-D15-3, dot is brand-teal `#043338` only)
- All-caps SOLEN — banned (loses Cooper Black's character)
- Logo as a graphic icon (S in a circle, abstract mark) — banned. The wordmark IS the brand.
- Multi-color logo (e.g. teal "Sol" + ink "en") — banned. Single ink-1 color + brand-teal dot only.
- Italic logo — banned per V2-D15.
- Decorative effects (drop shadow, gradient, outline) — banned. The logo is flat ink + flat teal dot.

---

## §1b Geographic scope

Solen is a **multi-city Swiss platform from launch**. Not hyperlocal.

- **Launch cities:** Basel, Zürich, Bern.
- **Tagline:** "Die Schweizer Salon-Plattform" (NOT "Von Basel, für Basel" — retired with V1).
- **Homepage city section:** "Stadt wählen" with 3 photo tiles (Basel · Zürich · Bern) + salon counts.
- **Hero copy is city-aware:** "47 Salons in [city] haben heute frei" — the city resolves to the user's detected/selected city.
- **Salon detail pages can name districts** (e.g. "Kleinbasel", "Kreis 4 Zürich") — districts are metadata on a salon, not a top-level browse axis.
- **Footer:** "🇨🇭 Made in Switzerland" — not Made in Basel.

**Anti-pattern:** any "Quartier wählen" / "Browse Kleinbasel" navigation. Districts are metadata, not browse.

---

## §2 Per-category colorways

The Republik treatment. **4 categories** (V2-D15-3 lock — was 6, dropped Wellness as separate + retired Makeup). Each category has its own colorway — a saturated bg + monochrome text pair, used as the page-identity color on category-specific surfaces. Combo letters reference the 31-combo library at `public/solen-v2-combos.html`.

|Category        |Combo|Bg hex   |Text hex |Contrast       |Soft tile bg|Republik / Solen origin                              |
|----------------|-----|---------|---------|---------------|------------|------------------------------------------------------|
|Coiffeur        |**Z**|`#FFF1DD`|`#B5345A`|5.24 : 1 AA    |`#FFF1DD`   |Cream + cherry — soft warm, hair-salon feeling       |
|Barbershop      |**G**|`#D8D6CB`|`#000000`|14.40 : 1 AAA  |`#D8D6CB`   |Bone + black — Republik panel #7 (Strassberg)         |
|Nails           |**A**|`#CAE8FF`|`#B50051`|5.35 : 1 AA    |`#CAE8FF`   |Pale ice blue + magenta — Republik panel #1 (Zumthor) |
|Spa & Wellness  |**I**|`#193120`|`#948565`|3.86 : 1 AA-l  |`#C2F0F1`   |Forest green + sandy beige — Republik panel #9 (Westjordanland — user-flagged screenshot) |

**Visual rhythm:** 3 light panels (cream / bone / pale ice blue) with saturated text accents + 1 dark panel (Spa forest green) as the grounding moment. The dark Spa panel anchors the set; the others are airy.

**Naming notes:**
- `barbershop` (not "Barber") — matches `messages/de.json` i18n key
- `Spa & Wellness` (combined) — Wellness is no longer a separate category; subsumed under Spa. FAQ copy already merged ("Spa & Wellness").
- `Makeup` retired (V2-D15-3). 4 categories for v1 launch. Waxing deferred to post-launch.

### §2.1 · Where category color appears (full panel commitment, Republik discipline)

The category page IS the colorway. Brand teal retreats from category pages to GLOBAL elements (logo, nav, save-heart, footer) — the per-category combo takes page-identity ownership.

- **Category tile bgs** (homepage cat-strip discovery pills): soft tile bg, black text per pill rule
- **Salon-card photo placeholders** when no real photo: soft tile bg w light vignette
- **Category icon fills** when active/hovered (otherwise inherit `currentColor`)
- **`/[city]/[category]` category page header band:** combo bg at full saturation (cream / bone / pale ice blue / forest)
- **Category page h1:** combo text color on combo bg (Republik monochrome rule — text inside saturated panel is one color)
- **Category page sub-text + byline + inline link inside panel:** SAME combo text color (Republik monochrome rule)
- **Filter pill active state on category page:** brand teal `#043338` bg + white text (the connective tissue — categories don't override pill rule)
- **Section dividers** within category page: 1px line in combo text color at 30% opacity
- **Primary "Buchen →" CTA on category page:** brand teal pill + white text. Brand teal is the constant CTA across all category pages — that's the Yuh tie-back.
- **`/salon/[slug]` salon detail page:** salon's primary category combo used the same way

### §2.2 · Where category color does NOT appear

- **Homepage hero** — white substrate + atmospheric wash + brand teal. Not category-themed.
- **Header logo, nav, CTA, save-heart** — always brand teal `#043338` + ink-1 + love-red regardless of which page is below
- **Save heart** — always love-red `#FF4A6B` (semantic, never overridden)
- **Status indicators** — green for available, red for closed, amber for warning (semantic, never overridden)
- **Footer** — brand teal links on white substrate
- **Cross-link footer block on category page** ("Andere Kategorien in Basel"): links use ink + brand-teal-on-hover (cross-category context)
- **Body text on category pages OUTSIDE the saturated panel** — use ink-2 / ink-3, NOT category color (combos with low-saturation bg are designed for the panel only)

### §2.3 · The Republik+Yuh hybrid discipline

Republik gives each article its own colorway with monochrome typography inside. Yuh keeps ONE brand color across all sub-products. Solen does both: each category page gets a Republik-style saturated panel (combo Z/G/A/I), but the brand teal stays as connective tissue (logo, CTAs, links, hearts) across all 4 categories. The brand teal is the masthead; the combo is the article.

### §2.4 · Anti-patterns

- Reintroducing the retired V2 6-cat hexes (V2-D15-3 lock): `#B5588A` rose (Coiffeur — replaced by combo Z `#FFF1DD` cream), `#E8A957` sunny (Barber — replaced by combo G `#D8D6CB` bone), `#C77A5C` clay (Nails — replaced by combo A `#CAE8FF` pale ice blue), `#88B89E` sage (Spa — replaced by combo I `#193120` forest), `#D66547` coral-orange (Makeup — RETIRED entirely), `#A66E3D` camel (Wellness — merged into Spa & Wellness, replaced by combo I forest), `#9B7BB8` plum (V2-D15-2 purple ban). Plus their deep variants: `#6B2D4D`, `#7A4F1F`, `#7A4030`, `#3F6F55`, `#7C3520`, `#5C3D22` — all retired.
- Reintroducing Makeup as a 5th category before launch data exists
- Mixing two category combos on the same surface (one category per surface)
- "Multi-category gradient" bgs — banned, reads as marketing visual not booking app
- Treating combos as "secondary brand accents" — they live INSIDE category-page saturated panels, never elsewhere
- Using black-on-bone (combo G text) outside the Barbershop context — combos belong to their category

---

## §3 Semantic colors

Universal-convention colors. **Distinct from brand and category. Never collapse.** Brand color does not do "success" or "error" — those have their own hexes.

|Semantic         |Hex                         |When to use                                                                                                     |
|-----------------|----------------------------|----------------------------------------------------------------------------------------------------------------|
|Love-red         |`#FF4A6B`                   |All heart-save icons (favorites, "love this"). Saved = filled, unsaved = stroke `currentColor` ink.              |
|Status success   |`#16A34A`                   |Success toasts, "Heute frei" availability chips, confirmation checkmarks, walk-in queue confirmations           |
|Status warning   |`#F59E0B`                   |Warning toasts, soft notifications, "fast voll" chips                                                           |
|Status error     |`#D32F2F`                   |Error toasts, form errors, destructive action confirmations                                                     |
|Open-state green |`#16A34A` (= status success)|Salon "Jetzt offen" indicator                                                                                   |
|Closed-state red |`#DC2626`                   |Salon "geschlossen" indicator                                                                                   |
|Star/rating amber|`#F3A864`                   |Rating stars only — utility color, NOT a second brand accent                                                    |

**Anti-pattern:**
- Using `s-brand` token for hearts → use literal `#FF4A6B`
- Using `s-brand` for success/error → use the semantic hex
- Using star-amber `#F3A864` for anything other than rating stars

**In code:** semantic colors stay as literal hexes (or `s-love`, `s-success`, `s-error` tokens). They never reference the brand token.

---

## §4 Warm-ink scale + substrate

The warmth of the ink scale is what keeps Solen feeling warm without resorting to a colored substrate. Substrate is **white** (V2-D15: was warm cream in v2-prelim — research showed all 4 reference brands use white). Cool greys are banned.

|Role                  |Hex      |Tailwind                 |Use                                                                                                |
|----------------------|---------|-------------------------|---------------------------------------------------------------------------------------------------|
|Ink-1 (primary text)  |`#1A1209`|`text-s-ink` / `bg-s-ink`|All body text, headlines, dark register backgrounds (footer, dark CTAs)                            |
|Ink-2 (secondary)     |`#56463E`|`text-s-ink-2`           |Secondary text — body sub-lines, meta, small labels                                                |
|Ink-3 (warm grey)     |`#7A6957`|`text-s-ink-3`           |Tertiary text — sub-headers, location lines, count chips, "(142)" review counts                    |
|Ink-disabled          |`#C4B8A6`|`text-s-ink-disabled`    |Disabled state text, placeholder separators                                                        |

|Surface                  |Hex                |Tailwind         |Use                                                                       |
|-------------------------|-------------------|-----------------|--------------------------------------------------------------------------|
|Page substrate (white)   |`#FFFFFF`          |`bg-s-bg`        |The phone/page background. Was warm cream in v2-prelim; now white per V2-D15. |
|Sunken (deeper grey)     |`#FAF7F3`          |`bg-s-bg-sunken` |Search bar inactive state, header icon button bg, disabled input bg        |
|Card surface (white)     |`#FFFFFF`          |`bg-white`       |Salon cards, dropdowns, sheets — same as substrate. Cards delineate via shadow + border, not color shift. |
|Border (warm hairline)   |`rgba(26,18,9,.06)`|inline           |Hairline borders, dividers, separators                                    |
|Border (warm hairline+)  |`#E8DFD2`          |`border-s-border`|Visible warm-cream borders — search bar inactive, chip outlines           |

**Note on substrate change:** because cards are now white-on-white, **cards depend on shadow + border for separation** instead of cream-vs-white contrast. This raises the importance of §5b depth system. The visual delineation of "this is a card lifted off the page" is now done entirely by warm-tinted shadow.

**Shadows are warm-tinted, never pure black, never pure ink.** Two acceptable shadow families:
- **Warm-ink tint** `rgba(26,18,9, X)` — for general elevation. Alpha values: `0.03 / 0.04 / 0.06 / 0.08 / 0.12 / 0.18`.
- **Brand peach tint** `rgba(4,51,56, X)` — for surfaces that interact w brand or want extra warmth. Alpha values: `0.04 / 0.06 / 0.08 / 0.12 / 0.24 / 0.32`.

Pick **one tint per shadow stack** — don't mix.

**Anti-pattern:**
- Pure black `#000000` body text → use ink-1 `#1A1209`
- Pure-black shadows `rgba(0,0,0, X)` → use warm-ink or brand-peach tint
- Cool-grey hexes anywhere: `#9E958C`, `#767676`, `#EBEBEB`, Tailwind default `#e5e7eb`, `gray-400`, `slate-500` etc. → always warm-ink tints
- Mixing both shadow tints in one stack
- Reverting substrate to warm cream — explicitly retired V2-D15

---

## §5 Typography

Solen runs on **2 typefaces, no exceptions** (V2-D15-3 lock — Bricolage Grotesque + Inter Tight retired). **Cooper BT** carries display/headlines (chunky warm slab — the brand-mark moments), **ITC Avant Garde Gothic Std** handles body/UI/section heads (clean geometric grotesque). The pairing was user-locked from a graphic-design reference (`Avant Garde Gothic + Cooper BT` — see V2_REBUILD_LOG V2-D15-3).

|Role                                              |Family                                          |Weight       |Use                                                                                                                  |
|--------------------------------------------------|------------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------------------|
|Display (hero h1, logo, feature panel h2, brand-mark moments)|**Cooper BT** (paid) / **Cooper Black Std** / **Sansita 900** (free fallback)|400 (single-weight) / 900 fallback|Hero h1, "Solen" logo, Solen Pro feature h2, category panel h1s. Tight letter-spacing -0.02em.|
|Body + UI + section h2 + section heads + everything else      |**ITC Avant Garde Gothic Std** (paid) / **League Spartan** (free fallback)    |300/400/500/600/700|All body, sub-text, meta, button labels, form fields, microcopy, eyebrow text, section h2s, card titles, AND numerics (use `font-variant-numeric: tabular-nums` for prices/counts/ratings). |

**Free Google Fonts fallbacks (always-load):**
- Cooper BT → **Sansita** (weights 400/700/900) — closest free Cooper Black analog, chunky rounded slab
- ITC Avant Garde Gothic Std → **League Spartan** (weights 300/400/500/600/700) — closest free Avant Garde analog, geometric grotesque
- Final fallback: **Inter Tight** — neutral catch-all (kept only as last-resort sans)

**Font stacks (locked):**
- Display: `'Cooper BT', 'Cooper Black Std', 'Cooper Black', 'Sansita', Georgia, serif`
- Body/UI: `'ITC Avant Garde Gothic Std', 'Avant Garde', 'League Spartan', 'Inter Tight', system-ui, sans-serif`

**Sizes (mobile-first, scale up at 768px+):**

|Use                  |Size                          |Weight|Line height|Letter spacing       |Font          |
|---------------------|------------------------------|------|-----------|---------------------|--------------|
|Hero h1              |clamp(56px, 7.4vw, 104px)     |900   |0.96       |-0.02em              |Cooper        |
|Logo "Solen"         |36px (28px mobile)            |900   |1.0        |-0.015em             |Cooper        |
|Section h2 (general) |clamp(28px, 3.2vw, 40px)      |600   |1.1        |-0.018em             |Avant Garde   |
|Feature panel h2     |clamp(36px, 4vw, 52px)        |900   |1.0        |-0.02em              |Cooper        |
|Category panel h1    |clamp(36px, 4.2vw, 56px)      |900   |0.96       |-0.018em             |Cooper        |
|Card title h3        |18px                          |600   |1.2        |-0.005em             |Avant Garde   |
|Body                 |16-17px                       |400   |1.5        |0                    |Avant Garde   |
|Small / meta         |13-14px                       |400/500|1.4-1.45   |0                    |Avant Garde   |
|Eyebrow              |11-13px                       |600   |1.4        |0.16-0.18em uppercase|Avant Garde   |
|Big numerics         |clamp(36px, 4vw, 52px)        |900   |1.0        |-0.02em              |Cooper        |
|Prices (inline)      |16px                          |600   |1.0        |0 (tabular-nums)     |Avant Garde   |

### §5.1 · Display vs Text rule (Uber lesson, V2-D15-3 reapplication)

Uber's discipline: "Use the display font for large titles only. Don't apply it to most other UI text — labels, paragraphs, buttons." Solen applies this to Cooper:

**Cooper ONLY at:** hero h1, "Solen" logo, feature panel h2 (Solen Pro), category panel h1s (Coiffeur "Schnitt für deinen Look", Barbershop "Bart und Schnitt", Nails "Nägel, perfekt gemacht", Spa "Entspannung, ganz nah"). That's it. Cooper is the brand-mark moment, not the workhorse.

**DO NOT apply Cooper to:**
- Body paragraphs (any size)
- Button labels (CTAs, secondary buttons, chip pills) → Avant Garde 700
- Form labels and helper text → Avant Garde 500
- Microcopy / meta text / sub-text → Avant Garde 400
- Section h2s on the homepage (e.g. "In Basel diese Woche") → Avant Garde 600
- Counter-pill text, footer link text, toasts, tooltips → Avant Garde

**Why this matters:** Cooper at small sizes loses its chunky character and just reads as "old-fashioned bold." Reserving it for display moments creates the punch where it lands. Avant Garde at body scales feels clean and modern — and modern IS the goal for body. Cooper for personality, Avant Garde for function.

### §5.2 · Numerics rule

Prices, ratings, counts, dates, times all use Avant Garde Gothic with `font-variant-numeric: tabular-nums`:
- Salon card rating: Avant Garde 600 11px tabular-nums
- Prices "ab CHF **85**": Avant Garde 600 ink-1 inline w body Avant Garde 400 ink-2 surrounding text
- Counts "**23 Salons**": same pattern
- Swiss apostrophe thousands: `1'247 Salons` not `1247` and not `1,247`
- Big-numerics (e.g. "1'247 Salons" hero stat): switch to Cooper 900 for hero impact moments only

### §5.3 · No italic accent moments

V1 used Instrument Serif italic for emphasis words in headlines. **Retired V2-D15.** No italic anywhere in UI. If a word needs emphasis inside a headline, use **brand-teal color swap** (the locked V3 emphasis rule — single word in `#043338` per hero h1).

**Retired typography (do NOT reintroduce):**
- Avant Garde Gothic (V2 display — replaced by Cooper)
- Inter Tight as PRIMARY body (V2 body — kept only as final fallback)
- Instrument Serif (V1 italic accent — retired V2-D15)
- JetBrains Mono (V1 numerics — retired V2-D15)
- Peace Sans (briefly considered, retired — too "Yuh-chunky shapes")
- Open Sauce Sans (briefly considered, retired — too rounded)
- Fraunces (briefly considered as Republik-serif analog, retired)
- Anton, Bebas Neue, DM Sans, Plus Jakarta, Outfit, Phosphor (font), Figtree

**Anti-pattern:**
- Cooper on a button label or form input → reject (pattern is wrong even if it "looks fine")
- All-caps Cooper display text → reads novelty/awkward. Mixed-case only.
- Negative letter-spacing on body or UI text → only on display sizes 22px+
- Italic anywhere in UI → period.
- Mixing Cooper + Avant Garde at the same size in the same component (e.g. half a headline in each) — the discipline is by ROLE, not by mood

---

## §5a Pill rule (V2-D15-3 / V2-D15-4 lock)

### §5a.1 · Pill text color

**Every pill-shaped UI element with text uses `#FFFFFF` on dark or `#000000` on light. No tinted-of-the-bg colors inside pills.** This applies to: CTA buttons, category tags/chips, badges, numbered step circles, salon-card heart icons (heart character is a text glyph), dropdown triggers, filter pills, toast pills.

**Locked pairings:**
- Brand teal `#043338` pill → **white** text
- Pastel pill (cream / bone / pale ice blue / pale teal) → **black** text
- Saturated category panel CTA pill (inside Republik panel, e.g. inside the cream Coiffeur panel) → **brand teal** pill bg + **white** text (the connective tissue)
- Solen Pro saturated brand panel inner CTA → pale teal `#C2F0F1` pill bg + **black** text

**Where the rule does NOT apply** (tinted text is fine for these):
- Inline body links (e.g. "So funktioniert's →" in body copy) → brand teal text
- Status text like "Heute frei" / "Morgen frei" inline on cards → brand teal text
- Eyebrow labels above hero h1 → brand teal text
- Section "Alle ansehen →" inline links → brand teal text underlined
- Inline accent words inside category panels (Republik monochrome rule — text is the combo's text color)

**Why:** pills are functional UI primitives. Tinted-of-bg text inside a pill (e.g. dark teal text on pale teal pill) reads as "category-themed" but creates ambiguity — is this a CTA or a tag? Black-or-white text removes the ambiguity. Inline text is editorial — color expresses voice.

### §5a.2 · Pill surface treatment (V2-D15-4 de-gloss lock)

Pills are FLAT. Drop the Web 2.0 gloss tricks. The §5b depth system applies to CARDS / surfaces / overlays — not to pills.

**Required on pills:**
- Flat solid background fill (no gradient — even on hover)
- Hover state via `transition: background 150ms ease` to a slightly lighter or darker variant of the same hue (e.g. brand `#043338` → `#0A6873` mid-teal). NEVER `linear-gradient(180deg, lighter 0%, darker 100%)` — that's the retired Web 2.0 glossy button.
- Optional `transform: translateY(-1px)` on hover for subtle lift
- 1px hairline border on light pills (`rgba(26,18,9,.08)` to `rgba(26,18,9,.12)`)
- Active/pressed: `transform: scale(0.98)` + `transition-duration: 100ms`

**Banned on pills (V2-D15-4):**
- `inset 0 1px 0 rgba(255,255,255, X)` — the Web 2.0 inner-glow highlight
- `linear-gradient` backgrounds (flat fill only, even when "modulating" hover)
- Stacked multi-shadow (`box-shadow: shadow1, shadow2, shadow3` — pills get max ONE soft shadow, and ONLY for elevated/floating contexts like a frosted-glass badge over a photo)
- `backdrop-filter: ... saturate(1.4)` — the iOS 7 vibrance pump. Use `saturate(1)` for clean glass. (Also see §5b L4.)
- Brand-color glow ring on dots (`box-shadow: 0 0 0 3px rgba(brand, .2)`) — replace with plain dot
- Tinted brand-color drop shadows on CTAs (`rgba(4,51,56, .18)`) — use warm-ink tint shadows only on pills, and only when contextually elevated

**Why:** pills are clicked dozens of times per session. Glossy pills age poorly and feel dated within 12-18 months. Flat pills + crisp transitions read as durable / 2026-current. Yuh, Linear, Stripe, Vercel — every modern booking/SaaS app ships flat pills.

### §5a.3 · Two pill-treatment surfaces

For reference (locked from V2-D15-4 preview at `public/solen-v3-pills-titles-tweaks.html`):

| Pill type | Bg | Text | Border | Shadow | Hover |
|---|---|---|---|---|---|
| Primary CTA (brand) | `#043338` | white | none | none | bg → `#0A6873`, `translateY(-1px)` |
| Secondary CTA (ghost) | transparent | ink-1 | `1.5px solid #1A1209` | none | bg → ink-1, text → white |
| Filter chip (default) | white | ink-1 | `1px solid rgba(26,18,9,.12)` | none | border → brand teal, bg → brand subtle `#E1F4F4` |
| Filter chip (active) | brand teal `#043338` | white | none | none | bg → `#0A6873` |
| Glassy badge (over photo) | `rgba(255,255,255,.94)` | ink-1 | `1px solid rgba(26,18,9,.08)` | none | n/a (badges aren't interactive) |
| Salon-card heart (over photo) | `rgba(255,255,255,.94)` | brand teal | `1px solid rgba(26,18,9,.08)` | none | bg → white, scale(1.04) |
| Numbered step circle | brand teal `#043338` | white | none | none | n/a |
| Status dot | solid hue (`#16A34A` / `#043338` / `#D32F2F`) | n/a | none | none | pulse animation per §5c |

---

## §5g Atmosphere wash recipe (V2-D15-3 lock)

The hero substrate is **white** with a layered radial gradient ("atmosphere wash") behind text — pale cyan core + navy framing. NOT a flat colored bg, NOT a saturated panel, NOT four rainbow blobs (those iterations retired).

**Locked CSS recipe (`.hero::before`):**
```css
position: absolute;
inset: 0;
background:
  /* Cyan core — pale ice blue + pale teal, kept light */
  radial-gradient(ellipse 65% 55% at 72% 28%, rgba(202, 232, 255, 0.78) 0%, transparent 55%),
  radial-gradient(ellipse 58% 50% at 22% 78%, rgba(194, 240, 241, 0.72) 0%, transparent 60%),
  /* Navy frame — royal blue around the corners, depth without saturation */
  radial-gradient(ellipse 55% 65% at 100% 105%, rgba(0, 88, 152, 0.32) 0%, transparent 55%),
  radial-gradient(ellipse 45% 55% at 0% -5%, rgba(0, 88, 152, 0.28) 0%, transparent 50%),
  /* Subtle deep-navy bleed at the bottom edge — horizon line */
  linear-gradient(180deg, transparent 65%, rgba(3, 30, 72, 0.06) 100%);
z-index: 0;
pointer-events: none;
```

**Color stops decoded:**
- `#CAE8FF` pale ice blue at 78% opacity (upper-right cyan core)
- `#C2F0F1` pale teal at 72% opacity (lower-left cyan core)
- `#005898` royal blue at 32% opacity (bottom-right navy framing)
- `#005898` royal blue at 28% opacity (top-left navy framing)
- `#031E48` deep navy at 6% opacity linear bleed (horizon line)

**Per-category atmospheric variant** (if/when category pages get hero washes per Yuh's sub-product pattern): same recipe but swap the cyan core hexes for the category's light-tier hexes. Coiffeur cyan core → cream-tinted; Nails cyan core → ice-blue (already matches); Spa cyan core → pale teal (already matches).

**Anti-pattern:**
- Flat colored hero bgs (Republik mode for HEROES specifically — only for category panels below)
- 4-blob rainbow gradients (retired — read as "Apple Music splash")
- Painterly SVG illustration assets like Yuh uses (deferred — would need a designer to draw, costs out of scope)
- Atmosphere with saturation > opacity 0.4 — that's no longer "atmosphere," that's a panel

---

## §5h Color philosophy (the locked design law, V2-D15-3)

The synthesis of Republik (colorways) + Yuh (discipline) studied at `/tmp/republik-research/colorways.md` and `/tmp/yuh-research/yuh-system.md`:

1. **White substrate is permanent.** Every page, every screen. ~70-80% of viewport. White is non-negotiable. Yuh-anchored.
2. **One brand color used densely.** Brand teal `#043338` appears 60–100× per page in tiny accents. Density, not size, is the brand. Yuh-anchored.
3. **Brand color is NEVER a hero substrate.** Hero is white + atmosphere wash. Brand teal lives in logo / CTAs / links / words / icons / hearts. Yuh-anchored.
4. **Saturated panels are editorial, not decorative.** When a panel goes saturated (category panels Z/G/A/I, Solen Pro feature card), it follows Republik's monochrome rule: ALL text inside the panel is one color. No multi-color text. Republik-anchored.
5. **Pastels live as soft tiles or cyan atmosphere only.** Never as section bgs that text reads on at any reasonable density. Pastels organize discovery; saturated panels carry editorial moments.
6. **Semantic colors stay semantic.** Love-red `#FF4A6B`, success `#16A34A`, warning `#F59E0B`, error `#D32F2F`, closed `#DC2626`, star `#F3A864` — these never collapse into brand or category. Universal-convention beats brand-derivation.
7. **Pill text is white-or-black.** No tinted-of-bg. (See §5a.)
8. **One typeface for display, one for everything else.** Cooper for brand-mark moments, Avant Garde Gothic for the rest. The discipline is by ROLE, not by mood. (See §5.)

### §5h.1 · The cumulative palette (every hex authorized for v3)

This is the EXHAUSTIVE list of colors authorized for Solen V3. Anything not in this list is a violation.

**Foundation:**
- `#FFFFFF` substrate
- `#FAF7F3` sunken
- `#1A1209` ink-1
- `#56463E` ink-2
- `#7A6957` ink-3
- `#C4B8A6` ink-disabled
- `rgba(26,18,9,.06)` hairline
- `#E8DFD2` border

**Brand:**
- `#043338` brand primary
- `#C2F0F1` brand pale (= category Spa text + atmosphere)
- `#E1F4F4` brand subtle

**Atmosphere wash colors (CSS gradient stops only):**
- `#CAE8FF` pale ice blue (also: Nails category bg)
- `#C2F0F1` pale teal (also: brand pale, Spa soft tile)
- `#005898` royal blue (atmosphere depth, no other use)
- `#031E48` deep navy (horizon bleed only, no other use)

**Categories (locked V2-D15-3):**
- Coiffeur Z: bg `#FFF1DD` cream + text `#B5345A` cherry
- Barbershop G: bg `#D8D6CB` bone + text `#000000` black
- Nails A: bg `#CAE8FF` pale ice blue + text `#B50051` magenta
- Spa & Wellness I: bg `#193120` forest green + text `#948565` sandy beige

**Semantic:**
- `#FF4A6B` love-red
- `#16A34A` success / open
- `#F59E0B` warning
- `#D32F2F` error
- `#DC2626` closed
- `#F3A864` star/rating

**Total authorized hexes: 24.** Anything outside this list is unauthorized in production code.

---

## §5i Combo library (reference for future categories)

The 31-combo grid lives at `public/solen-v2-combos.html` (rendered preview) — labeled A–EE. 19 are Republik-extracted (A–S, see `/tmp/republik-research/colorways.md`); 12 are fresh combos following the same monochrome-per-panel discipline (T–EE).

This grid is **the exclusive source** when adding a 5th category (e.g. Waxing post-launch) or themed feature pages. Pick a combo letter; the bg + text + contrast are pre-verified WCAG-compliant.

**Currently locked combos:** D (Brand) · Z (Coiffeur) · G (Barbershop) · A (Nails) · I (Spa & Wellness).
**13 unassigned alternatives:** B, C, H, J, K, L, M, N, O, Q, R, S, plus T, U, V, W, X, Y, AA, BB, CC, DD, EE.

When picking a new combo: select one with hue + value diversity from existing locked combos. Don't add a 5th cream-bg panel (Z is already cream) — pick something with a different hue to maintain visual variety.

---

## §5b Depth system

Lift, never weight. Single-shadow approach (Yuh-style) — each elevated surface gets ONE drop shadow, not stacked layers. Warm-tinted shadows, top-down highlights via inset.

|Level                  |Where it appears                                              |Shadow                                                                  |
|-----------------------|--------------------------------------------------------------|------------------------------------------------------------------------|
|**L0 · base**          |Page bg, no shadow                                            |none — flat white `#FFFFFF`                                             |
|**L1 · raised**        |Header icon buttons, chips, small interactive elements        |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 1px 1px rgba(26,18,9,.04)`    |
|**L2 · surface**       |Search bar, secondary cards                                   |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 2px 8px rgba(26,18,9,.06)`    |
|**L3 · elevated**      |Salon cards, b2b promo card, modals                           |`inset 0 1px 0 rgba(255,255,255,.6)` + `0 4px 16px rgba(26,18,9,.08)` + `0 16px 40px rgba(4,51,56,.06)` |
|**L4 · overlay**       |Glassy badges (top-left), heart buttons (top-right), dropdowns|`backdrop-filter: blur(12px) saturate(1)` + `0 1px 2px rgba(0,0,0,.06)` |
|**L5 · accent glow**   |Live pills, active brand-CTA elements that need to "glow"     |`inset 0 1px 0 rgba(255,255,255,.32)` + `0 2px 6px rgba(4,51,56,.28)` — toned, not aggressive |

**Photo treatment (salon-card placeholders w no real photo):**
```
background:
  linear-gradient(180deg, rgba(255,255,255,.18) 0%, transparent 35%, transparent 70%, rgba(4,51,56,.08) 100%),
  radial-gradient(ellipse at 50% 0%, rgba(255,255,255,.25), transparent 60%),
  var(--photo-bg);
```
Top-down highlight (sky look), tiny peach kiss at bottom (warm sunset edge), category color underneath.

**Two shadow families:**
- **Warm-ink** `rgba(26,18,9, X)` — general elevation
- **Brand-peach** `rgba(4,51,56, X)` — surfaces interacting w brand

Pick **one family per shadow stack**. Pick warmer (peach) when surface contains brand-teal elements. Pick warm-ink for neutral surfaces.

**Anti-pattern:**
- Pure black shadows `rgba(0,0,0, X)`
- Bottom-down dark vignettes on photos — moody, pulls down
- Aggressive glow shadows `rgba(4,51,56, .32+)` on every button — restraint
- Mixing both shadow families in one stack
- Stacked-shadow layers on every element (was a v2-prelim anti-pattern; the single-drop-shadow Yuh approach is preferred for cleaner rendering at scale)

---

## §5c Personality tokens

The animation vocabulary. 4 named easing curves, 6 micro-interactions, 3 signature flourishes. Airbnb principle: **motion is for state continuity, not decoration.** Every motion below maps to a state-change moment.

### Easing curves (CSS variables)

|Token          |Cubic-bezier                     |Duration|Use                                                                                              |
|---------------|---------------------------------|--------|-------------------------------------------------------------------------------------------------|
|`--ease-snap`  |`cubic-bezier(.4, 0, .2, 1)`     |200ms   |Default UI — buttons, hovers, tab switches, search-card transitions, chip toggles                |
|`--ease-spring`|`cubic-bezier(.34, 1.56, .64, 1)`|400ms   |Delight — heart save, badge appear, "+1" counter pop. Slight overshoot.                          |
|`--ease-glide` |`cubic-bezier(.16, 1, .3, 1)`    |600ms   |Long sweeps — sheet open, modal in, full-page route transitions                                  |
|`--ease-thud`  |`cubic-bezier(.7, 0, .84, 0)`    |150ms   |Decisive — press states, toast dismiss, confirm tap. Fast accelerate, instant impact             |

**Pick by intent:** snap = "I clicked." spring = "yay!" glide = "we're moving." thud = "done."

### Motion tokens

|Token           |Value                                            |Use                                                   |
|----------------|-------------------------------------------------|------------------------------------------------------|
|`--press-scale` |`scale(.94)` 100ms snap                          |Active state on tappable elements (buttons, cards)    |
|`--lift-y`      |`translateY(-1px)` + brighter shadow + 200ms snap|Hover state on buttons, cards                         |

### Micro-interactions (6 every screen needs)

|Name         |Trigger                        |Animation                                                                                                                                   |
|-------------|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
|Heart save   |Tap heart icon                 |Spring 400ms — scale 1 → 1.4 → 1 + fill color swap to `#FF4A6B`                                                                             |
|Live pulse   |Always (when live data is real)|Snap 1.6s loop — 5px dot scales 1 → 2.5 + fades opacity 0.6 → 0                                                                             |
|Chip toggle  |Tap filter chip                |Snap 180ms — bg + text + border color swap                                                                                                  |
|Skeleton load|Initial data fetch             |Linear 1.6s loop — gradient sweep across placeholder. **Stops after 2 cycles** if data still missing (don't loop forever — anxiety-inducing)|
|Press scale  |Tap any button/card            |Snap 100ms — scale .94 on `:active`                                                                                                         |
|Success draw |Booking confirmation           |Glide 850ms — circle stroke draws (500ms) + checkmark stroke draws (350ms, 150ms delay)                                                     |

### Signature flourishes (1-2 per screen max)

|Name                     |Where                                              |Behavior                                                                                                                                        |
|-------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
|Magnetic arrow           |Section "→" links, "Mehr erfahren →" links         |Gap text↔arrow grows from 4px → 10px on hover (200ms snap). Arrow itself translates 2px right.                                                  |
|Confetti pop             |Booking confirmation button (ONLY)                 |4 colored dots fly up + fade out on hover/click. Stagger 50ms each. Spring 600ms. NEVER on save/like/generic CTA.                               |
|Brand-color number accent|Big numbers that "matter" — counts, ratings, prices|Number itself is brand-teal (or category-deep on category pages), surrounding text stays ink. Context-dependent — not all numbers, just the headline. |

### Motion principle (Airbnb lesson, V2-D15 commit)

**Motion is for state-change continuity, not decoration.** Airbnb's published rationale: "fluid transitions between states and screens help users preserve context while navigating." Every animation in §5c maps to a moment where user state actually changes (toggle, save, navigate, succeed). Implementation discipline: when a primitive ships, motion MUST be applied at its state-change moments — not specced and forgotten.

### §5c.7 · Motion application checklist (every state-change → required treatment)

Implementation rule per V2-D15: every component PR for a primitive or surface MUST verify these motion moments are wired with the named easing tokens. Catalog of state-change moments and their required motion treatments:

|state-change moment                            |required motion                                                                              |easing             |
|-----------------------------------------------|---------------------------------------------------------------------------------------------|-------------------|
|Heart save toggle                              |scale 1 → 1.4 → 1, fill color swap to `#FF4A6B`, 400ms                                       |`--ease-spring`    |
|Heart unsave                                   |scale 1 → 0.9 → 1, 200ms                                                                     |`--ease-snap`      |
|Filter chip toggle                             |bg + text + border color swap, 180ms                                                         |`--ease-snap`      |
|Card press (any tappable card)                 |scale .94 on `:active`, 100ms                                                                |`--ease-snap`      |
|Button press (any CTA)                         |scale .96 on `:active`, 100ms                                                                |`--ease-thud`      |
|Card hover (desktop)                           |translateY(-1px) + brighter shadow, 200ms                                                    |`--ease-snap`      |
|Live counter pulse (counter pill, badge dots)  |opacity 1↔.5, scale 1↔1.3, 1.6s loop infinite                                                |`--ease-snap`      |
|Skeleton shimmer                               |gradient sweep L→R, 1.6s loop, max 2 cycles then static                                      |linear             |
|Booking success draw                           |circle stroke draws (500ms) + checkmark stroke draws (350ms, 150ms delay), 850ms total       |`--ease-glide`     |
|Sheet open (filter sheet, sortieren sheet, look-detail sheet, city-dropdown mobile)|translateY 100% → 0 + dim fade-in, 600ms                  |`--ease-glide`     |
|Sheet swipe-down dismiss                       |translateY 0 → 100% + dim fade-out, 400ms                                                    |`--ease-snap`      |
|Modal open (login modal, confirm dialog)       |scale 0.96 → 1 + opacity 0 → 1 + dim fade-in, 600ms                                          |`--ease-glide`     |
|Modal close                                    |scale 1 → 0.96 + opacity 1 → 0, 300ms                                                        |`--ease-snap`      |
|Toast appear                                   |translateY 100% → 0 + opacity 0 → 1, 400ms                                                   |`--ease-spring`    |
|Toast dismiss                                  |opacity 1 → 0, 150ms                                                                          |`--ease-thud`      |
|Page route transition                          |cross-fade + 8px translateY drift, 600ms                                                     |`--ease-glide`     |
|Magnetic arrow (Alle →, Mehr erfahren →)       |gap 4 → 10px + arrow translateX(2px), 200ms                                                  |`--ease-snap`      |
|Confetti pop (booking confirm CTA only)        |4 dots fly up + fade out, stagger 50ms each, 600ms                                           |`--ease-spring`    |
|Search bar tap → /search transition            |Full-screen route transition (per route-transition row above)                                |`--ease-glide`     |
|Calendar date select (in WANN search state)    |bg + text color swap, 200ms                                                                  |`--ease-snap`      |
|Filter pill count badge appear                 |scale 0 → 1 + opacity 0 → 1, 300ms                                                           |`--ease-spring`    |
|B2B card dismiss                               |opacity 1 → 0 + scale 0.95 (200ms) → max-height collapse 1000 → 0 (additional 200ms), 400ms total|`--ease-snap`  |
|Number counter increment (live counter pill update)|number swaps with subtle slide-up of new digit, 300ms                                    |`--ease-spring`    |
|Avatar dropdown open                           |scale 0.96 → 1 + opacity 0 → 1 + translateY -4px → 0, 300ms                                  |`--ease-glide`     |

**PR checklist requirement (extends Component PR checklist below):** every component PR must list which of the above moments the component encounters and confirm the motion is wired. If a component has 0 state-change moments, that's a flag — most components have at least press-scale.

**Anti-pattern:**
- Motion that doesn't tie to a state change ("decorative bounce on page load") — banned
- Motion without easing token (raw `ease-in-out` or arbitrary `cubic-bezier(...)`) — must use one of the 4 named easings
- Motion specced but not applied in implementation — fails PR checklist

### Reduced motion

When `prefers-reduced-motion: reduce`:
- Pulse animations disabled (static dot)
- Shimmer loading skeletons disabled (static rect)
- Magnetic arrow flourishes disabled
- Card press scale disabled
- Entdecken video autoplay disabled (per §18)

**DO disable animation, DO NOT disable functional state changes** (color shifts, opacity for visibility) — those convey info.

---

## §5d Inline emphasis

When you want to emphasize a word inside a sentence, **swap its color to brand-teal** (or category-deep on category pages). Don't use:

- Bold weight (already too much for body)
- Italic (retired V2-D15 — italic moments are gone from the system)
- Underline (reserved for inline-prose links)
- Highlighter bg (banned — too "marker" / Notion-pages-2018)

Example: "Buche jetzt, [heute hingehen](#)." → the words "heute hingehen" are color `#043338`, no other styling.

**Use sparingly — max 1 emphasis per paragraph, max 3 per screen.**

---

## §5e Iconography

Solen uses **Lucide** (lucide-react / lucide-icons) as the base icon library. 1500+ icons, MIT licensed, monoline aesthetic at 1.5-2px stroke, professionally drawn, free.

**Implementation:**
- React: `import { Heart, MapPin, Clock, Star } from 'lucide-react'` → `<Heart size={16} strokeWidth={1.8} />`
- HTML/inline SVG: copy from lucide.dev, paste with `stroke="currentColor"` so color inherits from parent.

**Icon spec:**
- `viewBox="0 0 24 24"` (default)
- `stroke="currentColor"` — always inherit from parent element
- `stroke-width="1.8"` (Lucide's recommendation for 24px viewBox)
- `stroke-linecap="round"` · `stroke-linejoin="round"`
- `fill="none"` (default) — use filled variant only on saved-state hearts and active rating stars

**Sizes:**
- 13-14px in chips and small pills
- 16-18px in buttons and inline UI
- 20-24px in standalone icon buttons (nav, header)
- 28-44px in hero/category tile contexts

### §5e.1 · 10 signature icons (Uber lesson, deferred to v2-launch polish)

Future custom-tweak set. Once v1 ships, these 8 booking-marketplace-specific icons get owned/redrawn for distinctiveness (V2-D15-3 update: 4 categories, was 10 icons w 6 cats):

1. Heart (save) — Lucide currently
2. Location pin — Lucide currently
3. Calendar — Lucide currently
4. Clock — Lucide currently
5. Scissors (Coiffeur) — Lucide currently
6. Razor / barber-pole (Barbershop) — Lucide currently
7. Nail-paint (Nails) — Lucide currently
8. Spa-leaf (Spa & Wellness — covers spa + wellness merged) — Lucide currently

**Retired V2-D15-3:** Brush icon (Makeup category retired), Yoga-pose icon (Wellness merged into Spa & Wellness).

**Status:** v1 uses Lucide as-is for all 8. Custom commissioning deferred to v2-launch polish phase. CHF 200-500 budget per Fiverr/Dribbble.

**Anti-pattern:**
- Unicode emoji (👋 ✨ ⚡ 📅 🎉 🔥) — banned. Reads inconsistent across OS, no brand control.
- Hand-drawing SVG paths in code from scratch — banned. Use the library.
- Mixing icon libraries (lucide + phosphor + iconoir in same project) — pick one. Lucide.
- Font-icon libraries (Font Awesome via CSS class) — outdated. SVG only.
- Color-locking icons — they should always inherit `currentColor`.

**Custom illustrations / hero graphics:**
For brand-defining moments (logo, hero illustrations, success screens), use:
- **Lottie animations** from lottiefiles.com for animated moments
- **Custom commissioned SVGs** (designer on Fiverr/Dribbble ~$200-500) for the 5-10 brand-signature illustrations
- **AI-generated → traced clean in Figma** for one-off scene illustrations

NEVER hand-craft via prompt-to-SVG-paths in code.

---

## 5f. Hierarchy: one hero per info block

Every panel that shows 3+ pieces of information must have **one hero metric** — the data point the user is actually scanning for. The rest demote to secondary or tertiary.

This rule is what separates "info dump" from "scannable UI." Equal-weight stat rows (Distance / Pace / Time at the same size, color, and weight) read as a wall of text — the user has to parse all four to find the one they want. Picking a hero turns the panel from "read everything" into "read the hero, glance at context."

### The three weights

|level    |role                                            |how it shows                                                                                                                                                          |
|---------|------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|hero     |the answer to "what is this card about?"        |Avant Garde Gothic 700 at the panel's display size (per §5), ink-1 `#1A1209`. Optionally brand-teal `#043338` if the number is the celebratory headline (per §5c (signature flourishes)).|
|secondary|context the hero needs to make sense            |Avant Garde Gothic 400-500, ink-2 `#56463E`, smaller — typically 11-13px. Often dot-separated `·` per §5d typography rules.                                                  |
|tertiary |meta / source / location / timestamps           |Avant Garde Gothic 400, ink-3 `#7A6957`, 10-12px. Lives at the edge — bottom of card, corner pill, or floating overlay (e.g. location badge ON the map, not in metadata list).|

### Picking the hero — by surface

|surface                                |hero                                                          |secondary                            |tertiary                          |
|---------------------------------------|--------------------------------------------------------------|-------------------------------------|----------------------------------|
|salon card §16 (availability variant)  |salon name (already locked Avant Garde Gothic 700 14px)                |rating · row 2 availability/price    |badge top-left                    |
|category sub-text §25.4                |`[N] heute frei` (the actionable count) — brand-teal or ink-1|`[N] Salons` total                   |pulse dot                         |
|booking confirmation summary §C (Phase 2)|date + time (`Mo. 12. Mai · 14:30`) — Cooper BT 900 hero               |service · staff · salon name         |location · cancellation policy    |
|profile bookings row §AC.2 (Phase 3)   |time-until (`Heute · 14:30` / `In 3 Tagen` / `Vor 2 Wochen`)  |salon name · service                 |status pill · cancel link         |
|salon detail header §SD (Phase 2)      |rating + open-now state combined                              |service categories · price range     |address · phone · opening hours   |
|search results count §SR (Phase 2)     |`[N] Salons gefunden`                                         |active filter chips · sort indicator |total before filter               |

### Anti-patterns

- **Equal-weight stat rows.** Three or four numbers at the same size, weight, and color. The reader's eye has nowhere to land.
- **Sub-line repeats hero.** Hero says `35m 37s`, secondary says `Time: 35m 37s` — drop the label.
- **Decorative metadata above the hero.** Source / category / timestamp pinned ABOVE the headline pushes the headline down. Hero leads, meta follows.
- **Brand-teal stacking on hero (anti-pattern).** §1 one-accent rule still applies — if hero already has brand-teal CTA + accent word + numbered circles, the badge goes ink (white-on-ink-1 pill).

### Compress before you stack

Before adding a new line of metadata to a card or panel, try compressing what's already there into a dot-separated single line:

- Bad: `Yesterday at 12:10` / `London, United Kingdom` / `Run summary` (three lines)
- Good: `Zander Whitehurst · Lunch run · vor 1 Tag` (one scannable line, location moved into the map as a corner pill)

Use the same `·` separator already locked across §15 / §16 / §18. Keep separator gap 6-8px.

### Wow moments earn their visual weight

Achievement chips, "New PB!" pills, "Sofort frei" badges (§16.3), "+1 saved" counter pops — these EARN brand-teal or green by being **rare** and **rewarding**. If a panel has more than one wow moment, none of them are wow anymore. **Max 1 wow chip per panel.**

This is the toolkit version of §5c "Brand-color number accent" — but applied at panel composition time, not just typography time.

-----

*Phase 1 step 2 ends here. Step 3 covers the locked patterns: header / hero / search / cards / sections / detail / booking / confirmation / footer.*

# SOLEN — Live Truth · Step 3

> Step 3: layout fundamentals. Without this, every component placement decision is vibes. Agents drift.

-----

-----

## 6. Spacing scale

Solen uses a **4px-based scale**. Every padding, margin, and gap is one of these values. Anything else is a bug.

|Token       |Value|Use                                                                                          |
|------------|-----|---------------------------------------------------------------------------------------------|
|`--space-0` |0    |reset                                                                                        |
|`--space-1` |4px  |inside chips, between adjacent dots/stars, icon-to-label gap in tight pills                  |
|`--space-2` |8px  |between chips in a row, between salon-card photo and meta block, small grid gaps             |
|`--space-3` |12px |between cards in a section, padding inside small cards, between section header and first card|
|`--space-4` |16px |page horizontal padding (mobile), card body padding, search bar internal padding             |
|`--space-5` |20px |section vertical rhythm (margin-top between sections on mobile)                              |
|`--space-6` |24px |larger card body padding, between hero block and search bar                                  |
|`--space-7` |32px |hero vertical breathing, between major page sections (desktop)                               |
|`--space-8` |48px |between hero and first feed section, page-bottom safe area (mobile)                          |
|`--space-9` |64px |footer top padding, large empty states, page-top hero on desktop                             |
|`--space-10`|96px |reserved for landing-page-only hero verticals (homepage on desktop)                          |

**Application rules:**

- **Page horizontal padding:** `--space-4` (16px) on mobile, `--space-6` (24px) on tablet (≥768px), `--space-8` (48px) on desktop (≥1024px). Never inline-style different values per section.
- **Section vertical rhythm:** every section starts with `margin-top: --space-5` (20px) on mobile, `--space-7` (32px) tablet+. Section header to first content = `--space-3` (12px).
- **Card-to-card gaps:** horizontal scroll rows use `gap: --space-3` (12px). Grid sections use `gap: --space-2` (8px) for tight grids (categories), `--space-3` (12px) for relaxed (city tiles).
- **Inside cards:** padding `--space-3` (12px) for small cards (200px wide salon cards), `--space-4` (16px) for medium (search results), `--space-5` (20px) — `--space-6` (24px) for large (b2b promo, modals).

**Anti-pattern:**

- Random pixel values like `padding: 14px 16px 18px` (yes, the og had this — it’s not a scale value, it’s vibes).
- `padding-top` ≠ `padding-bottom` unless there’s an explicit reason (e.g. asymmetric photo-to-text card layout). Default to symmetric.
- Negative margins to “cheat” a layout — refactor instead.

-----

## 6b. Breakpoints

Solen is mobile-first. 3 breakpoints, no more.

|Token    |Min-width    |Trigger                     |Notes                                                        |
|---------|-------------|----------------------------|-------------------------------------------------------------|
|`mobile` |0px (default)|base styles                 |every style is mobile-first. no `@media` needed for mobile.  |
|`tablet` |`768px`      |`@media (min-width: 768px)` |iPad portrait, larger phones in landscape, small laptops     |
|`desktop`|`1024px`     |`@media (min-width: 1024px)`|full desktop layouts kick in                                 |
|`wide`   |`1280px`     |`@media (min-width: 1280px)`|OPTIONAL — only for max-width container caps + grid expansion|

**Why 3 breakpoints, not 5+:**

- Most salon discovery happens on phones. Tablet + desktop are secondary.
- Each breakpoint = exponential test surface. 3 = tractable. 5+ = chaos.
- Components should use **container queries** (`@container`) for component-level responsiveness, not page breakpoints.

**Container query rule:** card grids, search bars, and reusable components that appear in different contexts use `container-type: inline-size` and `@container (min-width: Xpx)` rules — so a card behaves the same way regardless of where it’s mounted (homepage feed vs sidebar vs modal).

**Anti-pattern:**

- Adding `xs` (≤375px) — base styles already handle this; don’t double-spec.
- Using `xl` / `2xl` — collapse into `desktop` + optional `wide`.
- Using viewport-width units (`vw`, `vh`) for layout. They break on iOS safari w dynamic toolbar. Use `dvh` if needed for mobile full-height, otherwise stick to `%` and px.

-----

## 6c. Container & max-width

|Element                            |Mobile                                                        |Tablet (≥768px)|Desktop (≥1024px)|Wide (≥1280px)                                                                                  |
|-----------------------------------|--------------------------------------------------------------|---------------|-----------------|------------------------------------------------------------------------------------------------|
|Page max-width                     |`100%`                                                        |`100%`         |`1024px`         |`1200px`                                                                                        |
|Page horizontal padding            |`16px`                                                        |`24px`         |`48px`           |`48px`                                                                                          |
|Hero vertical padding (top)        |`24px`                                                        |`40px`         |`64px`           |`64px`                                                                                          |
|Hero vertical padding (bottom)     |`32px`                                                        |`48px`         |`64px`           |`64px`                                                                                          |
|Section gap (between feed sections)|`20px`                                                        |`32px`         |`40px`           |`40px`                                                                                          |
|Card row width (horizontal scroll) |overflow phone edge to edge (`-16px` margins, `+16px` padding)|same           |same             |same — horizontal scroll never centered, always edge-bleed for “more cards offscreen” affordance|

**Reading width:**
Body copy max-width = **`60ch`** (~600px at 16px font). Headlines can stretch wider — max **`24ch`** for hero h1, **`32ch`** for sub-text. This is for desktop reading; on mobile, content fills the container.

-----

## 7. Radius scale

|Token           |Value       |Use                                                                                            |
|----------------|------------|-----------------------------------------------------------------------------------------------|
|`--radius-sm`   |6px         |tiny inline pills (count badges, small status chips)                                           |
|`--radius-md`   |10px        |search bar internal cells, segmented controls, list rows                                       |
|`--radius-lg`   |12px        |medium cards, salon-card photo (rounded square), b2b promo card (smaller variant), input fields|
|`--radius-xl`   |14px        |salon-card outer photo wrapper, neighborhood tile photos                                       |
|`--radius-2xl`  |16px        |category tiles, salon cards (when wrapped), photo-tile content cards                           |
|`--radius-3xl`  |18px        |large cards (b2b promo full size, modals desktop, recap sections)                              |
|`--radius-pill` |99px        |all pills (chips, buttons, search bar outer, live pills, toast pills, badges)                  |
|`--radius-full` |50% / 9999px|circles (avatars, icon buttons, dots)                                                          |
|`--radius-phone`|26px        |the “phone shell” outer container in mockups + onboarding/walkthrough faux-phone elements      |

**Application rules:**

- Pills use `--radius-pill` (99px) — always. Never round corners on something that should be a pill.
- Cards have one rule: their inner content matches the outer radius minus 2px. So if salon-card outer = 16px, photo inside = 14px. If outer card not wrapped, photo standalone = 14px.
- **Buttons are pills.** Never use `--radius-md` (10px) for a button — that’s a “rounded rectangle” 2018 look. CTA / icon-button / chip-style toggle = pill.
- **Inputs are not pills.** Search bar outer is a pill (it contains a button), but text inputs inside forms use `--radius-lg` (12px) — looks like a “field,” not a “button waiting to be pressed.”

**Anti-pattern:**

- `border-radius: 8px` everywhere “to be safe” — kills hierarchy. Use the scale.
- Mixing pill + rounded rect inside the same component (e.g. pill outer + 10px inner) — pick one shape language per component.
- `border-radius: 50%` on non-square elements — they don’t render as circles, they render as ellipses.

-----

## 8. Z-index scale

Z-index is a **declared scale**. No inline `z-index: 9999`. No `z-index: 1` reflexive add.

|Layer         |Token         |Value      |Use                                                                           |
|--------------|--------------|-----------|------------------------------------------------------------------------------|
|Below content |`--z-below`   |-1         |decorative bg shapes, blob accents that sit behind content                    |
|Default       |`--z-base`    |0 (or auto)|normal flow content — most elements need no z-index at all                    |
|Raised        |`--z-raised`  |10         |cards lifting above siblings during hover, focused inputs in a stack          |
|Sticky        |`--z-sticky`  |100        |sticky section headers, sticky tab bars, sticky search bars                   |
|Header        |`--z-header`  |200        |the global app header (when sticky on scroll)                                 |
|Dropdown      |`--z-dropdown`|300        |select dropdowns, autocomplete suggestions, menu pop-ups attached to a trigger|
|Sheet backdrop|`--z-sheet-bg`|400        |the dimmed bg behind a bottom-sheet/modal (`rgba(26,18,9,.4)` w blur)         |
|Sheet         |`--z-sheet`   |410        |bottom sheets, side sheets — the actual sheet content above its bg            |
|Modal backdrop|`--z-modal-bg`|500        |dimmed bg behind a centered modal                                             |
|Modal         |`--z-modal`   |510        |the modal content above its bg                                                |
|Toast         |`--z-toast`   |600        |toast notifications — always above modals so users see “saved!” even mid-modal|
|Tooltip       |`--z-tooltip` |700        |tooltips on hover — always topmost                                            |
|Critical alert|`--z-alert`   |800        |reserved for full-page critical alerts (network down, auth expired)           |

### Stacking context warnings (CRITICAL — agents miss this constantly)

These CSS properties create a **new stacking context**, which means `z-index` only works *within* that context, not against parent siblings:

- `transform: anything` (including `translateY(0)` to enable GPU)
- `opacity` < 1
- `filter: anything` (blur, drop-shadow, etc.)
- `backdrop-filter: anything`
- `will-change: transform | opacity | filter`
- `mix-blend-mode: anything`
- `isolation: isolate`
- Any element w `position: fixed` or `position: sticky`
- A flex/grid item w `z-index` set

**Practical consequence:** if a parent card has `transform: translateY(-1px)` on hover, a modal nested inside that card with `z-index: 510` will NOT escape the card. It’s trapped in the card’s stacking context.

**The rule for modals/sheets/toasts/tooltips:** always render via React Portal to `document.body`. NEVER nest modal markup inside a transformed/filtered/blurred parent.

```jsx
// CORRECT — portal escapes any parent stacking context
import { createPortal } from 'react-dom';
return createPortal(<Modal />, document.body);

// WRONG — modal trapped in parent context if parent transforms
return <div className="card-w-hover-transform"><Modal /></div>;
```

**Anti-pattern:**

- Adding `z-index` outside the scale.
- Using arbitrary high values (`z-index: 9999`) — meaningless, breaks the scale.
- Stacking context bugs from `transform: translateZ(0)` for GPU performance + nested z-index — refactor or portal.

-----

## 9. Scroll behavior

Solen has 4 distinct scroll patterns. Each has a spec.

### 9a. Page scroll (the obvious one)

- **Native browser scroll.** No scroll-jacking, no scroll-driven parallax, no “fancy” scroll experiences.
- iOS momentum scroll preserved (`-webkit-overflow-scrolling: touch` is default on `overflow: auto` containers).
- Scroll restoration on browser back: enabled (Next.js App Router default).

### 9b. Horizontal card row scroll

The pattern used in feed sections (Heute frei / Empfohlen / Trending / Neu).

```css
.hscroll {
  display: flex;
  gap: var(--space-3);                /* 12px */
  overflow-x: auto;
  scrollbar-width: none;              /* Firefox */
  margin: 0 calc(-1 * var(--space-4)); /* edge-bleed */
  padding: 0 var(--space-4);          /* re-add for first/last card */
  scroll-snap-type: x proximity;      /* soft snap, not mandatory */
  scroll-padding-left: var(--space-4);
  -webkit-overflow-scrolling: touch;
}
.hscroll::-webkit-scrollbar { display: none; } /* WebKit */
.hscroll > .salon-card {
  scroll-snap-align: start;
  flex-shrink: 0;
}
```

**Rules:**

- `scroll-snap-type: x proximity` — soft snap, doesn’t fight the user’s scroll velocity.
- Cards bleed past the page horizontal padding — affordance for “more offscreen.”
- No “pagination dots” or “next arrow” overlays. Native scroll only.
- First card is fully visible at scroll-start. Last card sits flush w right edge at scroll-end.

### 9c. Sticky elements

- **Sticky section headers:** the section title can stick on scroll within long lists (search results page) but NOT on the homepage feed. On homepage, headers scroll w content.
- **Sticky tab bar (salon detail page):** sticks at top after scrolling past the photo. Bg becomes opaque white (`#FFFFFF`) w `backdrop-filter: blur(12px) saturate(1)` once stuck.
- **Sticky bottom-CTA:** booking wizard’s “Weiter →” button sticks at bottom of viewport always. Has a soft top-shadow `0 -4px 12px rgba(4,51,56,.06)` to separate from content.

### 9d. Pull-to-refresh

- Mobile-only, native iOS/Android behavior preserved.
- On homepage feed: triggers data re-fetch.
- On salon detail: disabled (no need to refresh static content).
- Visual: native refresh indicator, no custom — keeps OS expectation.

**Anti-pattern:**

- Custom scrollbars styled to look fancy (gradient, animated, fat) — distracts from content.
- `scroll-snap-type: x mandatory` — fights user gesture, feels broken.
- Auto-scroll / carousel auto-rotate — banned (per og rule, kept).
- Parallax / scroll-jacking — banned.
- Disabling browser scroll restoration — breaks back-button UX.

-----

## 10. Safe areas (mobile-specific)

iOS notch / dynamic island, Android gesture bar, etc. Solen handles these correctly.

```css
:root {
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
body {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
  padding-left: var(--safe-left);
  padding-right: var(--safe-right);
}
```

**Rules:**

- Bottom nav bar / sticky CTA buttons: `padding-bottom: calc(var(--space-3) + var(--safe-bottom))` so they sit above the iOS home indicator.
- Header / sticky top elements: `padding-top: calc(var(--space-3) + var(--safe-top))` to avoid notch overlap.
- Modals + sheets: respect both top + bottom safe areas.
- Edge-bleed photos / horizontal scroll: extend through safe-left/right via `padding-left/right: var(--safe-left/right)` on the scroll container.

-----

## 11. Hit targets (touch + keyboard)

Every tappable element has a minimum hit target:

- **44×44px** minimum on mobile (Apple HIG / Google Material standard).
- 36px height pills/buttons are OK *visually* if their hit target extends invisibly to 44px (use `padding` or pseudo-element to extend).
- Spacing between adjacent tappable elements: minimum `--space-2` (8px) — prevents fat-finger mis-taps.

**Focus targets (keyboard):**

- 2px brand outline + 2px outside offset (per §1).
- `:focus-visible` only — no focus ring on mouse click, only on keyboard tab.
- Skip-to-content link in page header (visible on `:focus`, hidden otherwise) — accessibility-mandatory.

-----

# SOLEN — Live Truth · Phase 0: Foundation primitives

> Phase 0 covers the primitives every later surface composes. Locked draft started 2026-05-05. §F.1 (forms) lands first because Phase 1 auth + Phase 2 booking wizard can't start without it.
>
> Cluster anchors: §F.1 forms · §F.2 modal · §F.3 bottom sheet · §F.4 toast · §F.5 date/time picker · §F.6 skip-link · §F.7 font fallback strategy · §F.8 cookie consent. Each lands in its own iteration of the spec → mockup → implement → lock loop.

-----


-----

## §F.1 · Form primitives

The form vocabulary every surface uses: text input, textarea, select, checkbox, radio, switch. Each primitive has a fixed anatomy, a fixed state matrix, and 3 sizes. New form patterns DO NOT invent new visual language — they compose these primitives.

**Anchors to existing locks:** the hero search bar (§13.4) is a composite of 3 text inputs visually merged into one container; the sort sheet (§25.6) uses §F.1.5 radio rows; the filter sheet (§25.7) uses §F.1.4 checkbox-as-pill toggles; the active-row state in /search (§14.3) is the §F.1.1 text input focus state. When those references change, this section is the source of truth — fix this first.

### §F.1.0 · Anatomy (universal)

```
┌─────────────────────────────────────┐
│ Label                               │ ← always above field, never inside
│ ┌─────────────────────────────────┐ │
│ │ Field                           │ │ ← input / textarea / select / etc
│ └─────────────────────────────────┘ │
│ Helper text or error message        │ ← below field, optional
└─────────────────────────────────────┘
```

|element       |spec                                                                                                                                   |
|--------------|---------------------------------------------------------------------------------------------------------------------------------------|
|label         |Avant Garde Gothic 600 14px, ink-1 `#1A1209`, line-height 1.3. Always above field. Required = trailing `·` red dot 5px (`#D32F2F`). Bumped from 12px in V2-D26 (size refresh).|
|field bg      |default white `#FFFFFF` raised over white substrate (cards lift via shadow + border, not color shift). Active state bg = `#FFF4E8` (matches §14.3 lock). |
|field border  |1px `rgba(26,18,9,.10)` default. Active = 2px brand-teal `#043338`. Error = 2px error red `#D32F2F`. Success = 2px success `#16A34A`. |
|field radius  |`var(--radius-lg)` (12px) — fields are NOT pills (per §7 anti-pattern: pill-shaped inputs read as buttons-waiting-to-be-pressed)         |
|field padding |See size table §F.1.0a. md size locks at `padding 12px 16px` (12px vertical, 16px horizontal) to match §13.4 hero search row.           |
|helper text   |Avant Garde Gothic 400 13px, ink-3 `#7A6957`, line-height 1.4, margin-top 6px. Max 1 line preferred. (Bumped from 11px in V2-D26.)             |
|error message |Avant Garde Gothic 500 13px, error red `#D32F2F`, line-height 1.4, margin-top 6px. Optional inline icon: 14px Lucide `alert-circle` before text.|
|warning msg   |Avant Garde Gothic 500 13px, warning amber `#F59E0B` (use `#7A4A14` deepened on cream for body-text contrast), 14px Lucide `alert-triangle`.   |
|success msg   |Avant Garde Gothic 500 13px, success green `#16A34A`, 14px Lucide `check-circle`.                                                             |
|field gap     |`var(--space-2)` (8px) between label-bottom and field-top                                                                              |

**Stacking:** labels NEVER inside the field as floating placeholders. Floating labels were popular 2018-2022 but read as decorative animation, hurt accessibility (screen readers + autofill confusion), and break in dense layouts. Solen uses static labels above.

### §F.1.0a · Sizes

|size|use                                                                                                                                       |height|font-size|padding-x|padding-y|
|----|------------------------------------------------------------------------------------------------------------------------------------------|------|---------|---------|---------|
|sm  |Compact filter rows, dropdown w short text, search bars inside list items                                                                 |40px  |14px     |12px     |10px     |
|md  |**Default for all forms** — booking wizard, login, signup, settings, salon profile editor (B2B). Hero search rows §13.4 lock at md/56px tall.|56px  |16px     |16px     |12px     |
|lg  |Reserved for hero/landing search inputs only (currently §13.4 hero is the only md/lg-tall surface; lg used if a future hero needs even more emphasis).|64px  |18px     |20px     |18px     |

**iOS zoom on focus (V2-D14 → resolved by V2-D26, 2026-05-09):** original V2-D14 picked "decision B" — keep 14px on md inputs, accept iOS auto-zoom. **V2-D26 resolves this:** md now locks at 16px (the V2-D14 alternative), which prevents iOS auto-zoom AND fixes the user feedback about subtexts feeling small. sm stays at 14px (compact filter contexts where iOS zoom is acceptable per the original V2-D14 trade-off). lg locks at 18px. The §F.1.7 anti-pattern below ("all text inputs `font-size ≥ 16px`") is now satisfied by md + lg by default; sm is the explicit exception for compact contexts.

**Touch target:** every interactive form element ≥ 44px hit area per §11. Sm fields visually 40px tall MUST extend hit area via `padding` or pseudo-element to 44px.

### §F.1.0b · State matrix

Every primitive supports these states. NOT every state applies to every primitive (e.g. checkboxes have no `loading` — but switches do).

|state          |trigger                                                |visual change                                                                                                                                                              |
|---------------|-------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|default        |idle, no user interaction yet                          |1px ink-1 `.10` border, white `#FFFFFF` bg, no outline.                                                                                                                    |
|focus          |`:focus-visible` (keyboard tab in)                     |2px brand-teal `#043338` outline, 2px offset (per §1). Border + bg unchanged. **NO focus ring on mouse click** — `:focus-visible` only.                                  |
|active         |currently being typed in / interacted with (mouse focus)|2px brand-teal border replaces the 1px default border. Bg shifts to `#FFF4E8` (matches §14.3 search-row active state).                                                  |
|filled         |has a value / non-empty                                |label color stays ink-1 (NOT a different color — per §F.1.0 floating-label anti-pattern, filled fields don't change label).                                                |
|error          |validation failed (after submit OR live per §F.1.8 prevention rules)|2px error red `#D32F2F` border. Error message renders below. Field bg unchanged (don't tint red — too aggressive).                                                |
|warning        |non-blocking concern (e.g. password "weak" but accepted)|2px amber `#F59E0B` border. Warning message below. Use sparingly — most "warnings" are actually errors.                                                                    |
|success        |validation passed live (e.g. email format valid + available)|2px success green `#16A34A` border. Optional inline checkmark icon on right side of field. **No success message text** — green border + checkmark is enough; words are noise.|
|disabled       |form not yet ready / field locked / loading parent     |opacity 0.5, cursor not-allowed, bg `#FAF7F3` (sunken from §4), label color ink-3. NO hover/focus states.                                                            |
|loading        |async validation in flight (e.g. checking email availability)|spinner inline at right side of field, 14px brand-teal. Field still editable. Don't lock the field while loading.                                                        |

**Note on focus + active co-occurrence (V2-D14, 2026-05-05):** the spec defines each state in isolation. In practice, mouse-click focus and keyboard-tab focus rarely co-occur on the same field — `:focus-visible` only fires for keyboard, so a click-and-typing field renders the active state w/o the outline. If both somehow fire (programmatic focus + click), both render and that's accepted — visually busy but not broken. Locked: 3 reference states are sufficient.

### §F.1.1 · Text input

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|HTML element        |`<input type="text|email|tel|url|password|search|number">`                                                            |
|font                |Avant Garde Gothic 400 (filled state goes 500 weight if the form has a "filled vs empty" visual signal — opt-in per surface) |
|color               |ink-1 `#1A1209`                                                                                                       |
|placeholder         |Avant Garde Gothic 400, ink-3 `#7A6957`. Used for short hint, NOT for label text.                                           |
|caret               |brand-teal `#043338`                                                                                                |
|selection bg        |`rgba(4,51,56,.18)` (brand-tinted)                                                                                 |
|autocomplete        |always opt-in via `autoComplete="..."` attr; never disable for "design" reasons — autofill saves users time           |
|password reveal     |inline 24px button on right, Lucide `eye` (hidden) / `eye-off` (visible), ink-2 stroke, tap to toggle                 |
|password strength   |optional inline meter below, see §F.1.10 inline validation                                                            |
|number step buttons |hidden by default (`appearance: textfield`) — Solen does not show native number spinners; if increment needed, ship a custom stepper as a separate primitive in v2|

#### Variants by `type`

|type     |keyboard (mobile)                |inputmode      |autocomplete sample        |notes                                                                                                  |
|---------|---------------------------------|---------------|---------------------------|-------------------------------------------------------------------------------------------------------|
|text     |default                          |text           |`name` / `given-name`       |default                                                                                                |
|email    |email keyboard (with @ shortcut) |email          |`email`                     |use `<input type="email">` so iOS shows @-key                                                          |
|tel      |numeric phone keyboard           |tel            |`tel`                       |strip non-digits server-side; allow `+`, spaces, dashes in display                                     |
|password |default keyboard, hidden chars   |text           |`current-password` / `new-password`|reveal toggle per row above                                                                            |
|search   |"Go" key on iOS                  |search         |`off`                       |used inside search bars (§13.4, §14)                                                                   |
|number   |numeric                          |numeric/decimal|`off`                       |for prices, counts. NOT for phone/postal-code (those use `tel`/`postal-code`)                          |
|url      |URL keyboard (with .com shortcut)|url            |`url`                       |for B2B salon-profile website field                                                                    |

### §F.1.2 · Textarea

|prop                |spec                                                                                                                          |
|--------------------|------------------------------------------------------------------------------------------------------------------------------|
|HTML element        |`<textarea>`                                                                                                                   |
|min-height          |88px (md size, ~3 lines visible)                                                                                              |
|max-height          |280px (~10 lines) — beyond that, internal scroll within textarea                                                              |
|resize              |`resize: vertical` only. Never `resize: both` (horizontal resize breaks layouts).                                             |
|line-height         |1.5                                                                                                                           |
|character counter   |optional, bottom-right outside the field. Avant Garde Gothic 400 12px ink-3 (`[N] / [max]`). Brand-teal `#043338` when within 20% of max. (Bumped from 11px in V2-D26.)|
|enter behavior      |`Enter` = newline. `Cmd/Ctrl + Enter` = submit form (when textarea is the only field, e.g. review write).                     |
|use cases (v1)      |review write (§RV Phase 2), report-content reason (§CO.5 Phase 4), salon profile bio (§B.5 Phase 6), B2B reply-to-review (§B.9)|

### §F.1.3 · Select (dropdown)

**v1 decision: native `<select>` for desktop AND mobile.** Custom-built dropdowns are expensive to ship correctly (focus trap, keyboard nav, virtual scrolling, mobile picker UX) and Solen v1 has no select use case complex enough to need it. Native `<select>` gets us platform-correct mobile pickers (iOS wheel, Android sheet) for free.

|prop                  |spec                                                                                                                            |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------|
|HTML element          |`<select>`                                                                                                                       |
|appearance reset      |`appearance: none` to strip browser-default chevron                                                                              |
|custom chevron        |Lucide `chevron-down` 14px ink-2, positioned `right: 14px; top: 50%; transform: translateY(-50%);` via wrapper `<div>` w background-image OR positioned absolutely|
|padding-right         |40px (to leave room for chevron — overrides default 16px right padding)                                                         |
|all other properties  |inherit from §F.1.1 text input                                                                                                  |
|disabled option       |use `<option disabled>` for placeholder-style first row when no value selected (e.g. `<option value="" disabled selected>Stadt wählen</option>`)|

#### When NOT to use native `<select>`

If you ever need: searchable / typeahead / multi-select / tag-pill selection / virtualized long lists / icons inside options — those become a separate primitive (defer to v2 unless a v1 surface forces it). For v1, every dropdown can be:

- 3-10 short text options → native `<select>`
- Toggle group (e.g. service-type filter) → §F.1.4 checkbox-as-pill (multi) or §F.1.5 radio-as-pill (single)
- Bottom sheet w options (sort, filter sub-menus) → §F.3 bottom sheet primitive composing §F.1.5 radio rows

### §F.1.4 · Checkbox

Solen has TWO checkbox visual variants. The data binding (`<input type="checkbox">`) is identical; only the rendering differs.

#### Variant A — boxed checkbox (used in classic forms)

```
┌─┐
│ │  Label text
└─┘
```

|prop          |spec                                                                                                            |
|--------------|----------------------------------------------------------------------------------------------------------------|
|box size      |20×20px hit (44px hit area extended via wrapper label padding)                                                  |
|box border    |2px ink-1 `.25` (`rgba(26,18,9,.25)`)                                                                           |
|box bg        |white                                                                                                           |
|box radius    |`var(--radius-sm)` (6px) — squared not pill (distinguishes checkbox from radio per §F.1.5)                       |
|checked bg    |brand-teal `#043338`                                                                                          |
|checked icon  |Lucide `check` 14px white stroke 2.5px, centered                                                                |
|checked border|brand-teal `#043338` (matches bg, no contrast border)                                                         |
|indeterminate |Lucide `minus` 14px white (use case: parent-toggle for nested option groups)                                    |
|disabled      |opacity 0.4, cursor not-allowed                                                                                 |
|focus-visible |2px brand-teal outline, 2px offset                                                                            |
|label gap     |10px between box right edge and label left edge                                                                 |
|label font    |Avant Garde Gothic 400 16px ink-1 (bumped from 14px in V2-D26)                                                       |
|press         |scale(.92) 100ms `var(--ease-thud)` on the box                                                                  |
|toggle        |spring scale 1 → 1.15 → 1 over 300ms `var(--ease-spring)` on check                                              |

Used in: B2B settings forms (§B.5), profile settings (§AC.5), cookie consent categories (§F.8 / §SY.9), report-content reasons (§CO.5).

#### Variant B — pill checkbox (used in filter sheets)

Already locked in §25.7 — repeat the spec here so it's anchored:

|prop           |spec                                                            |
|---------------|----------------------------------------------------------------|
|layout         |flex-wrap row, gap 6px                                          |
|inactive bg    |`linear-gradient(180deg, #fff, #FDFAF5)`                        |
|inactive border|1px `rgba(26,18,9,.06)`                                         |
|inactive color |ink-1, font-weight 500                                          |
|inactive padding|`7px 12px`                                                     |
|inactive radius|`var(--radius-pill)` (99px)                                     |
|active bg      |ink-1 `#1A1209`                                                 |
|active color   |white, font-weight 600                                          |
|active border  |ink-1                                                           |
|font           |Avant Garde Gothic 13px (bumped from 12px in V2-D26)                  |
|tap            |toggles state, fires whatever debounced recount/recompute applies|

Used in: filter sheets §25.7, future B2B service-type tagging, future entdecken category multi-select.

### §F.1.5 · Radio

Solen has TWO radio visual variants. Data binding identical; rendering differs.

#### Variant A — radio row (used in sheets and forms)

Already locked in §25.6 — repeat here as the canonical primitive:

|prop                   |spec                                                                                                                    |
|-----------------------|------------------------------------------------------------------------------------------------------------------------|
|row layout             |flex row, align-center, gap 12px                                                                                        |
|row padding            |`14px 0` (vertical only, container padding handles horizontal)                                                          |
|row separator          |`1px rgba(26,18,9,.05)` bottom border (last row no border)                                                              |
|circle size            |18×18px (44px hit area via wrapper label)                                                                              |
|circle border (default)|2px ink-1 `.25` (`rgba(26,18,9,.25)`)                                                                                   |
|circle bg              |transparent                                                                                                             |
|circle radius          |`var(--radius-full)` (50%) — actual circle, distinguishes radio from checkbox                                          |
|circle border (selected)|2px brand-teal `#043338`                                                                                              |
|inner dot (selected)   |8px brand-teal `#043338`, centered via `radial-gradient(circle, #043338 0%, #043338 50%, transparent 50%)` or pseudo-element|
|label font             |Avant Garde Gothic 400 16px ink-1 (bumped from 14px in V2-D26)                                                                  |
|label (selected)       |font-weight 600                                                                                                         |
|focus-visible          |2px brand-teal outline on circle, 2px offset                                                                          |
|press                  |scale(.94) 100ms `var(--ease-thud)`                                                                                     |
|switch animation       |new selection's inner dot fades in 150ms `var(--ease-snap)`; old selection's dot fades out same duration                |

Used in: sort sheets §25.6, future booking wizard step-selection, future B2B booking-policy single-select fields.

#### Variant B — pill radio (single-select toggle group)

Same shape as §F.1.4 Variant B (pill checkbox) — only difference is single-select semantics. Used when 3-5 mutually exclusive options need to be visually compact (e.g. "Damen / Herren / Kinder" in a salon-profile editor where a row of radio buttons would feel formal).

Visual spec identical to §F.1.4 Variant B. Behavior: tap deselects all others in group, can't deselect the last selected without choosing a new one.

### §F.1.6 · Switch (toggle)

For boolean settings. Distinct from checkbox: a checkbox says "include this in a list," a switch says "turn this feature on/off."

```
Notifications                 [●○]
```

|prop                  |spec                                                                                                            |
|----------------------|----------------------------------------------------------------------------------------------------------------|
|track size            |44×24px (44px wide, 24px tall)                                                                                  |
|track bg (off)        |ink-1 `.15` (`rgba(26,18,9,.15)`)                                                                               |
|track bg (on)         |brand-teal `#043338` (V2-D14 lock 2026-05-05 — accepted exception to §1 "≤4 brand instances per screen" rule for settings pages w many switches; brand color holds at scale per §AC.5 review)|
|track radius          |`var(--radius-pill)` (99px)                                                                                     |
|knob size             |20×20px white circle, `var(--radius-full)` (50%)                                                                |
|knob position (off)   |left, 2px inset                                                                                                 |
|knob position (on)    |right, 2px inset                                                                                                |
|knob shadow           |`0 1px 2px rgba(0,0,0,.12), 0 2px 4px rgba(0,0,0,.04)`                                                         |
|toggle animation      |knob slides 200ms `var(--ease-snap)`, track bg color crossfades same duration                                   |
|press                 |knob scale 1 → .92 100ms `var(--ease-thud)` then back                                                           |
|disabled              |opacity 0.4, cursor not-allowed                                                                                 |
|focus-visible         |2px brand-teal outline on track, 2px offset                                                                   |
|label                 |Avant Garde Gothic 400 16px ink-1, left of switch by 16px gap (switch is right-aligned in row). Bumped from 14px in V2-D26. |
|sub-label (optional)  |Avant Garde Gothic 400 13px ink-3, 4px below label. Bumped from 12px in V2-D26.                                       |
|aria-checked          |reflects state                                                                                                  |
|role                  |`role="switch"` (better screen-reader UX than checkbox-styled-as-switch)                                        |

Used in: settings (§AC.5), notification preferences, B2B availability toggles (§B.7), cookie consent category toggles (§F.8).

**Anti-pattern:** using a switch for "select one of 2-5 mutually exclusive options" — that's a radio group. Switch = on/off ONLY.

### §F.1.7 · Mobile-specific behavior

|concern              |rule                                                                                                                                                |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|iOS zoom on focus    |all text inputs `font-size ≥ 16px` (per §F.1.0a) — prevents iOS auto-zooming when user focuses a field                                              |
|autofocus            |opt-in only. Auto-focus on page load IS allowed for single-field modals (login email, search bar opening). NOT auto-focus on multi-field forms (overwhelming + steals scroll).|
|keyboard avoidance   |when keyboard opens, sticky bottom CTAs should sit above keyboard via `:focus-within` + `padding-bottom: calc(safe-area + keyboard-height)` if env supports it; otherwise scroll into view |
|return key           |submit form on `Enter` if focus is in last field; advance to next field if not last (per Apple HIG)                                                 |
|tap target           |label is part of the hit area — tapping label focuses field (HTML `<label for>` standard)                                                           |
|paste handling       |never strip pasted content silently. Email field can normalize (lowercase + trim) on blur, with no warning                                          |
|input modes          |use `inputmode` attr (numeric / decimal / tel / email / search) — improves iOS keyboard switching                                                   |
|capitalization       |`autocapitalize="words"` for name fields, `none` for emails / passwords / URLs, default for free text                                               |

### §F.1.8 · Inline validation (the prevention rule)

Per the §F.1 prevention principle (and reinforced by external UX consensus): **catch errors before submit, not after.** 80% of form errors can be prevented with live validation.

#### When to validate live

|trigger                              |behavior                                                                                                                            |
|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|on blur (user leaves field)          |run sync validation (format checks, length checks). Show error immediately if invalid.                                              |
|on input (per keystroke)             |only for show-as-you-type validators (password strength meter, char counter on textarea, "available username" check)               |
|on submit                            |all validators run again; first invalid field gets focus + error message; page scrolls to it                                       |
|debounced async (e.g. email available)|debounce 400ms after last keystroke, then fire async validator. Show inline spinner during request. On result: success/error state.|

#### What to validate live

- **Format** — email syntax, phone format, URL validity, number range
- **Length** — min/max char count (textarea, password)
- **Password strength** — show meter (4 levels: zu schwach / schwach / gut / sehr gut). Don't block weak passwords if they meet the minimum (e.g. ≥ 8 chars + 1 number); just warn.
- **Availability** — email already in use, username taken, domain available
- **Confirmation match** — `password` vs `password-confirm` (live, on second field's blur)

#### What NOT to validate live

- **Required-ness on first interaction** — don't show "Email ist erforderlich" before user has even typed anything. Show only after blur OR submit attempt.
- **Server-side business rules** — "credit card declined", "no slots available at this time" — these can ONLY be checked on submit.

### §F.1.9 · Error message copy rules

Pulls from §1b voice + the human-copy principle. Lock in this section for forms specifically.

|do                                                                                  |don't                                                              |
|------------------------------------------------------------------------------------|-------------------------------------------------------------------|
|Describe what's wrong: `Diese E-Mail-Adresse ist nicht gültig.`                     |"Invalid email" / "Email is invalid" — passive voice + machine speak|
|Describe what to do: `Mindestens 8 Zeichen, mit einer Zahl.`                        |"Password too weak" — vague, no path forward                        |
|Use du-form: `Du hast diese E-Mail bereits verwendet.`                              |"This email is already in use." — passive, ignores user             |
|Show error code ONLY when user needs it for support: `Buchung fehlgeschlagen (Code: B1432) — Schreib an support@solen.ch.`|`Error 0x80004005` as the entire user-facing message              |
|Match severity: typos = inline · network = toast · server = full-screen retry      |500-modal for a typo (overkill, dead-end UX)                       |

Reuse §F.4 toast and §SY.2 error boundary specs when those land — same copy rules apply there.

### §F.1.10 · Anti-patterns

- **Floating labels** (label inside field, animates up on focus) — banned. Static label above field.
- **Pill-shaped text inputs** — banned (per §7). Pills look tappable; text inputs are typeable.
- **Required-field asterisks `*`** — use `·` red dot 5px instead OR put "Optional" tag on optional fields (let required be the default visual state). Asterisk reads as a footnote marker.
- **Disabling the submit button until form is valid** — mostly OK, but ALWAYS show why it's disabled (inline "Mindestens 8 Zeichen, mit einer Zahl" under password field). Otherwise users tap a dead button and have no recourse.
- **Showing all errors on first render** — only show errors after first blur or first submit attempt per field.
- **Clearing field on error** — never. The user typed it; preserve it. Let them edit.
- **Custom dropdowns when native works** — see §F.1.3.
- **Error messages that say "Try again."** — say WHY and HOW.
- **Different focus-ring styles per primitive** — every field uses the §1 brand-teal 2px outline. No exceptions.

-----

*§F.1 ends here. Phase 0 continues with §F.2 modal primitive — locked next.*

-----

## §F.2 · Modal primitive

The centered overlay every Solen surface uses for confirmations, login flows, focused single-task interactions, and content that must steal user attention until resolved. Modal is **distinct from sheet** (§F.3): sheets are mobile-only filter / sort / share affordances; modals are confirmation-and-focus dialogs that work identically on mobile and desktop. Modals never auto-dismiss and never stack — one at a time.

**Anchors to existing locks:** the auth-as-modal pattern referenced in §A.1 / §A.2 (Phase 1 to be specced) composes §F.2.1-§F.2.5; the report-content flow in §CO.5 (Phase 4) uses §F.2 lg size; destructive-confirmation flows (delete account §AC.5, cancel booking §AC.2) use §F.2 sm size with `isDismissable={false}` per §F.2.6.

### §F.2.0 · Anatomy (universal)

```
┌────── Backdrop (dim + blur) ───────────────────────────┐
│                                                        │
│      ┌─── Modal surface ─────────────────────────┐     │
│      │ Header                            [×]     │     │ ← border-bottom 1px ink/.06
│      ├────────────────────────────────────────── │     │
│      │ Body (scrollable when content exceeds)    │     │
│      │                                           │     │
│      │                                           │     │
│      ├─────────────────────────────────────────  │     │
│      │             [Abbrechen]  [Bestätigen]     │     │ ← border-top 1px ink/.06, sticky
│      └───────────────────────────────────────────┘     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

|element       |spec                                                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|backdrop      |`rgba(26,18,9,0.40)` warm-ink dim (NOT pure black per §4) + `backdrop-filter: blur(4px)`. Click = dismiss (overridable). z-index `var(--z-modal-bg)` per §8.|
|surface       |white `#FFFFFF`, radius `var(--radius-2xl)` (16px). Centered via flex centering on the overlay.                                              |
|shadow        |`elevation-3` warm-tinted from §4: `0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)`                                            |
|width         |`min(size-max-width, calc(100vw - 32px))` — mobile gets 16px margin each side, desktop centers within max-width.                              |
|height        |`max-height: min(size-max-height, calc(100vh - 32px))` — body scrolls internally if content exceeds.                                          |
|header        |Avant Garde Gothic 600 18px ink-1 title. Optional eyebrow above (Avant Garde 700 11px uppercase ink-3 tracking 0.16em). Close X right.        |
|close button  |Lucide `x` 24px ink-2 stroke 2. Hit area 44×44 via `padding: 10px` extension. Hover transitions to ink-1 over 150ms ease-snap.                |
|body          |Padding per size table. Overflow-y auto when content exceeds available height. Default browser scrollbar (no custom styling in v1).          |
|footer        |Sticky bottom, border-top 1px rgba(26,18,9,0.06). Buttons right-aligned, gap `var(--space-3)` (12px). Optional destructive tertiary left.    |

### §F.2.0a · Sizes

|size|use                                                                              |max-width|header pad |body pad   |footer pad |
|----|---------------------------------------------------------------------------------|---------|-----------|-----------|-----------|
|sm  |Confirm dialogs (delete account, cancel booking, leave-without-saving, sign out)|360px    |20px / 24px|0 24px 20px|16px / 24px|
|md  |**Default** — login modal, share modal, edit single field, generic confirmations|480px    |20px / 24px|0 24px 20px|16px / 24px|
|lg  |Report content with reasons + free-text, complex forms in a modal context        |640px    |24px / 28px|0 28px 24px|20px / 28px|

**Anti-pattern (banned):** XL or full-screen modals. If content needs more than 640px width or full-height, it's a page route or a §F.3 sheet — not a modal. The whole point of a modal is focused single-task overlay; oversizing breaks that.

### §F.2.0b · State matrix

|state       |trigger                                |visual change                                                                                                                                  |
|------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
|closed      |`open=false`, mounted but not displayed|not rendered (or `display: none`). No DOM nodes for the modal interior.                                                                        |
|opening     |`open` flips false → true              |backdrop fades opacity 0 → 1 over 200ms `ease-snap`. Modal `scale(0.95) → scale(1)` + opacity 0 → 1 over 250ms `ease-snap`. Body scroll locked.|
|open        |fully visible, user interacting        |static. Backdrop stays at 0.40 dim. Modal at scale 1.                                                                                          |
|dismissing  |user closes (X / esc / backdrop click) |modal `scale(1) → scale(0.95)` + opacity 1 → 0 over 150ms `ease-snap`. Backdrop fades 1 → 0 over 150ms. Then unmount.                          |

**Note on motion:** modals do NOT spring or bounce — they're functional confirmations, not playful reveals. Use `ease-snap` (standard ease-in-out) for both entry and exit. Reserve `ease-spring` / `ease-thud` for toggles + presses (§F.1.4 / §F.1.6 / §F.1.5).

### §F.2.1 · Modal element

**Implementation:** `react-aria-components` `<Modal>` + `<ModalOverlay>` + `<Dialog>`. Already installed at `^1.16.0`. This is the explicit V2-D## architecture deviation from V2-D17 native-first — there is no native `<dialog>` element with the focus-trap + scroll-lock + portal behavior the spec needs across browsers.

|prop                  |spec                                                                                                                  |
|----------------------|----------------------------------------------------------------------------------------------------------------------|
|HTML role             |`role="dialog"` on the inner Dialog. `role="presentation"` on the ModalOverlay backdrop.                              |
|aria-labelledby       |references the ModalHeader title's id automatically (react-aria handles via Dialog's `aria-labelledby`).              |
|aria-describedby      |optional — references ModalBody's first paragraph if it's a description (caller passes `aria-describedby` to Dialog).|
|portal                |renders to document.body via react-aria `<Modal>` (escapes parent stacking context — prevents z-index issues).        |
|scroll-lock           |body scroll locked while open (react-aria handles via `usePreventScroll`).                                            |
|focus-trap            |focus stays within modal while open (react-aria handles).                                                             |
|focus-restore         |on close, returns to trigger element (react-aria handles).                                                            |
|initial-focus         |first focusable element by default. Override via `autoFocus` on a specific child control.                             |

### §F.2.2 · Backdrop

|prop          |spec                                                                                                              |
|--------------|------------------------------------------------------------------------------------------------------------------|
|background    |`rgba(26,18,9,0.40)` — warm-ink tint per §4 anti-pattern (NEVER pure black `rgba(0,0,0,X)`)                       |
|backdrop-filter|`blur(4px)` — tasteful, not aggressive. Pairs with dim for legibility on busy bg photos.                         |
|click behavior|dismisses by default. Disable via `isDismissable={false}` for destructive-confirm flows where accidental click loss = bad UX.|
|positioning   |`position: fixed; inset: 0;` — covers entire viewport regardless of scroll position.                              |
|z-index       |`var(--z-modal-bg)` per §8                                                                                  |

### §F.2.3 · Header (ModalHeader)

|prop                |spec                                                                                                                |
|--------------------|--------------------------------------------------------------------------------------------------------------------|
|layout              |flex row, `justify-content: space-between`, `align-items: center`, `gap: var(--space-3)` (12px)                     |
|padding             |per size table §F.2.0a                                                                                              |
|border              |`border-bottom: 1px solid rgba(26,18,9,0.06)`                                                                       |
|title font          |Avant Garde Gothic 600 18px ink-1 line-height 1.3                                                                   |
|title element       |`<h2>` with id auto-wired to Dialog's `aria-labelledby`                                                              |
|eyebrow (optional)  |Avant Garde Gothic 700 13px uppercase ink-3, letter-spacing 0.16em, margin-bottom 4px above title (bumped from 11px in V2-D26)|
|close X             |Lucide `x` 24px stroke 2 ink-2, hover ink-1 transition 150ms `ease-snap`. Hit area 44×44 via `padding: 10px`.       |
|close X position    |right side of header row, after title                                                                                |
|close X aria-label  |"Schließen" (or `t('close')` via next-intl in caller)                                                                |

**Anti-pattern:** title in the body instead of the header — banned. Header anchors navigation/dismissal; body is content. Mixing breaks the mental model.

### §F.2.4 · Body (ModalBody)

|prop          |spec                                                                                                                  |
|--------------|----------------------------------------------------------------------------------------------------------------------|
|padding       |per size table §F.2.0a (no top padding — header's border serves as separator)                                         |
|overflow-y    |`auto` — body scrolls internally when content exceeds available height                                                |
|max-height    |computed: `min(size-max-height, 100vh - 32px) - header-height - footer-height`                                        |
|font          |Avant Garde Gothic 400 16px ink-1 line-height 1.55 (body text default; bumped from 14px in V2-D26)                  |
|scrollbar     |default browser. No custom styling in v1 — modals are short enough that scrolling is rare; when needed, default works.|

### §F.2.5 · Footer (ModalFooter)

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|layout              |flex row, `justify-content: flex-end`, `gap: var(--space-3)` (12px). On sm size: full-width buttons stacked vertically.|
|padding             |per size table §F.2.0a                                                                                                |
|border              |`border-top: 1px solid rgba(26,18,9,0.06)`                                                                            |
|sticky              |always visible at bottom; pinned via `flex-shrink: 0` in flex column layout (not CSS sticky — modal interior is flex).|
|primary CTA         |right-most. Brand-teal flat pill per §5a.2 / §1 hover gradient retired V2-D15-4.                                      |
|secondary           |"Abbrechen" / "Zurück" — ghost button left of primary.                                                                |
|tertiary destructive|optional — far left, weight 500 ink-3 14px, hover error-red. Used for "Konto löschen" type irreversibles.            |
|empty footer        |allowed — for read-only confirmation modals where the only action is the close X.                                     |

### §F.2.6 · Dismiss behavior

|trigger              |default action |overridable via                                            |
|---------------------|---------------|-----------------------------------------------------------|
|Escape key           |closes modal   |`keyboardDismissDisabled={true}` (destructive flows)       |
|Backdrop click       |closes modal   |`isDismissable={false}` (destructive flows + form-in-progress)|
|Close X button       |closes modal   |always closes — never disable. Only render close X if user has a sane way to exit.|
|Programmatic close   |caller controls|via `onOpenChange(false)` callback                          |

**Pattern:** for "you have unsaved changes" flows, intercept `onOpenChange` to first show a nested confirm dialog. Never silently lose user input. (See §F.2.10 anti-patterns — nested-modals are banned, so this pattern uses the SAME modal swapped to a "discard changes?" body, not a second modal stacked on top.)

### §F.2.7 · Focus management

|behavior              |how                                                                                                                    |
|----------------------|-----------------------------------------------------------------------------------------------------------------------|
|focus on open         |first focusable child (or element marked `autoFocus`). For confirmation dialogs, prefer focusing primary CTA — but ONLY if the action is non-destructive. Destructive (delete) defaults focus to "Abbrechen" so accidental Enter doesn't fire the destructive action.|
|tab navigation        |cycles within modal forward + backward. react-aria handles.                                                            |
|focus restore on close|returns to trigger element (the button/link that opened the modal). Caller does not manage this manually.              |
|outside-modal focus   |blocked while open. Tab key cycles only within modal.                                                                  |

### §F.2.8 · Mobile vs desktop

Modals are **identical primitives on both platforms** — no mobile-specific morph. Differences:

|breakpoint        |behavior                                                                                                             |
|------------------|---------------------------------------------------------------------------------------------------------------------|
|mobile (< 640px)  |width = `min(max-width, calc(100vw - 32px))`. 16px margin each side. No swipe-to-dismiss gesture in v1 (close X is the explicit affordance).|
|desktop (≥ 640px) |width = `max-width` from size table, centered. Backdrop blur fully effective on busy bg.                              |

**Anti-pattern:** auto-morphing modal to bottom sheet on mobile — banned. Sheets are §F.3, distinct primitive with distinct UX (swipe down, snap heights, mobile-only). A confirmation modal stays a centered modal everywhere because that's its UX semantics.

### §F.2.9 · Motion specs

Both entry and exit use `ease-snap` (`cubic-bezier(0.4, 0, 0.2, 1)`) — modals are functional, not playful. No `ease-spring` / `ease-thud` overshoot.

|phase   |element  |property              |from         |to           |duration|easing  |
|--------|---------|----------------------|-------------|-------------|--------|--------|
|entry   |backdrop |opacity               |0            |1            |200ms   |ease-snap|
|entry   |modal    |opacity               |0            |1            |250ms   |ease-snap|
|entry   |modal    |transform: scale(N)   |scale(0.95)  |scale(1)     |250ms   |ease-snap|
|exit    |modal    |opacity               |1            |0            |150ms   |ease-snap|
|exit    |modal    |transform: scale(N)   |scale(1)     |scale(0.95)  |150ms   |ease-snap|
|exit    |backdrop |opacity               |1            |0            |150ms   |ease-snap|

**Reduced motion:** if `prefers-reduced-motion: reduce`, both entry and exit collapse to opacity-only (no scale transform), duration shortened to 100ms. Per §24b.3 baseline.

### §F.2.10 · Anti-patterns

- **Nested modals (modal-on-modal)** — banned. Open one at a time. For "discard unsaved changes?" flows, swap the SAME modal's body content; don't stack a second modal.
- **Auto-dismiss timeouts** — banned. Modals never auto-close. User dismisses explicitly. (Auto-dismiss = §F.4 toast — different primitive, different semantics.)
- **Title in body instead of header** — banned. Header anchors navigation/dismissal; body is content. Mixing breaks the mental model.
- **Dim backdrop without blur** — banned. Too aggressive on busy bg photos. Always pair `rgba(26,18,9,0.40)` dim + `blur(4px)`.
- **Pure black backdrop** — banned per §4 (warm-ink tint always). `rgba(0,0,0,X)` reads cold.
- **Close button hidden until hover** — banned per §11. Always visible.
- **Modals as marketing prompts** — banned. Use §F.4 toasts for non-actionable info, or pages for marketing content. Modals interrupt; reserve them for must-resolve interactions.
- **Disabling escape AND backdrop click AND hiding close X** — banned. User must always have at least one explicit way to exit. Trapping users in a modal violates §11 hit-target + §24b.1 keyboard-nav baselines.
- **Stacking shadows pumped past elevation-3** — banned. Modals already feel "high" in the depth system; over-shadowing them creates floaty unease. Stay at elevation-3 from §4.
- **Italic anywhere in modal title or body** — banned per V2-D15.

-----

*§F.2 ends here. Phase 0 continues with §F.3 bottom sheet primitive — locked next.*

-----

## §F.3 · Bottom sheet primitive

The mobile-only bottom-anchored overlay for filters, sort, share, look-detail, and any list-of-options UX where a centered modal would feel cramped on small screens. **Distinct from §F.2 modal:** sheets slide up from the bottom edge, anchor to the bottom of the viewport, and have a visual drag handle. Modals are centered, sized fixed, and confirmation-flow oriented. **On desktop (≥ 768px), Sheet falls back to §F.2 modal** — `useSheet` hook returns the appropriate primitive based on viewport width.

**Anchors to existing locks:** the sort sheet (§25.6) and filter sheet (§25.7) compose §F.3.1-§F.3.5; the look-detail sheet (§18.4) uses §F.3 with full-height variant; future share-modal mobile variant (§F.2 falls back). Note: §25.6 spec text cites a pure-black backdrop hex which contradicts §4 anti-pattern — when §25.6 is implemented via §F.3, the warm-ink hex from this primitive prevails (doc-cleanup TODO logged in V2-D19 Bucket B).

### §F.3.0 · Anatomy (universal)

```
┌────────── Backdrop (dim + blur) ────────────┐
│                                             │
│                                             │
│                                             │
│                                             │
│  ┌───────────────────────────────────────┐  │ ← top corners rounded 28px
│  │              ─── handle ───           │  │ ← drag handle (visual only v1)
│  ├───────────────────────────────────────┤  │
│  │ Header                          [×]   │  │ ← border-bottom 1px ink/.06
│  ├───────────────────────────────────────┤  │
│  │                                       │  │
│  │ Body (scrollable)                     │  │
│  │                                       │  │
│  ├───────────────────────────────────────┤  │
│  │           [Anwenden (47 Salons)]      │  │ ← sticky bottom CTA
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

|element       |spec                                                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|backdrop      |`rgba(26,18,9,0.40)` warm-ink + `backdrop-filter: blur(4px)` (matches §F.2 modal — same warm-ink discipline per §4)                            |
|surface       |white `#FFFFFF`, top-only radius `var(--radius-sheet)` 28px (bottom flush with viewport edge). Bottom corners NOT rounded.                     |
|shadow        |`0 -4px 28px rgba(50,47,44,0.12), 0 -2px 8px rgba(50,47,44,0.06)` — inverted elevation-3 (shadow projects upward since the sheet is bottom-anchored)|
|width         |`100vw` (full viewport width — sheets are full-bleed on mobile)                                                                              |
|height        |default 75vh; max-height `calc(100dvh - 64px)` (always 64px gap from top — preserves user's spatial anchor that "the page is still up there")|
|drag handle   |36px wide × 4px tall pill, `rgba(26,18,9,0.20)`, centered, 12px from top                                                                       |
|header        |20/24 padding, border-bottom 1px `rgba(26,18,9,0.06)`                                                                                        |
|body          |overflow-y auto, padding per spec, fills remaining height                                                                                      |
|sticky CTA    |bottom-anchored, padding-top 16, padding-bottom 16 + safe-area-inset-bottom, border-top 1px `rgba(26,18,9,0.06)`                              |

### §F.3.0a · Snap heights

**v1: single fixed height — 75vh (default).** No multi-snap, no swipe gesture. Sheet opens to its locked height; user scrolls within if content exceeds.

**v2 (deferred):** multi-snap (peek 50vh / expanded 90vh) with swipe gesture. v2 needs a JS gesture lib — out of scope for v1.

For surfaces that need different heights:
- **Sort sheet (§25.6):** short content (4 radio rows) → height auto-fits content (overrides 75vh default with `height: auto`).
- **Filter sheet (§25.7):** medium content (8-12 chip groups) → 75vh default.
- **Look-detail sheet (§18.4):** image + meta + actions → 90vh (full).

Caller passes `height="auto" | "default" | "full"` prop. v1 ships these 3 values, no swipe-able multi-snap.

### §F.3.0b · State matrix

|state       |trigger                                |visual change                                                                                                                       |
|------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|closed      |`open=false`, mounted but not displayed|not rendered (or `display: none`). No DOM nodes for sheet interior.                                                                |
|opening     |`open` flips false → true              |backdrop fades 0 → 1 over 300ms `ease-snap`. Sheet `translateY(100%) → translateY(0)` over 600ms `ease-glide`. Body scroll locked.   |
|open        |fully visible, user interacting        |static. Backdrop at 0.40 dim.                                                                                                       |
|dismissing  |user closes (X / esc / backdrop click) |sheet `translateY(0) → translateY(100%)` over 200ms `ease-snap`. Backdrop fades 1 → 0 over 200ms. Then unmount.                     |

**Note on motion:** sheet uses `ease-glide` (cubic-bezier(.16, 1, .3, 1)) for entry — matches §5b motion vocabulary (sheets travel further than modals, glide easing handles long-distance smooth). Exit uses `ease-snap` for snappy dismissal. Reduced-motion: collapse to opacity-only fade, 100ms.

### §F.3.1 · Sheet element

**Implementation:** `react-aria-components` `<Modal>` + `<ModalOverlay>` + `<Dialog>` — same primitives as §F.2 modal. Sheet differs from modal ONLY in CSS positioning (bottom-anchored vs centered) + transform-from-100% animation. The accessibility behavior (focus trap, scroll lock, portal, escape, restore-focus) is identical.

|prop                  |spec                                                                                                                                  |
|----------------------|--------------------------------------------------------------------------------------------------------------------------------------|
|HTML role             |`role="dialog"` on the inner Dialog (same as §F.2)                                                                                   |
|aria-labelledby       |references SheetHeader title's id (auto via Dialog's `aria-labelledby`)                                                              |
|portal                |renders to document.body via react-aria `<Modal>`                                                                                     |
|scroll-lock           |body scroll locked while open                                                                                                          |
|focus-trap            |focus stays within sheet                                                                                                              |
|focus-restore         |on close, returns to trigger                                                                                                          |
|positioning           |`position: fixed; bottom: 0; left: 0; right: 0; transform: translateY(0)` when open                                                  |

### §F.3.2 · Drag handle

|prop          |spec                                                                                                            |
|--------------|----------------------------------------------------------------------------------------------------------------|
|visual        |36×4px pill, `rgba(26,18,9,0.20)`, border-radius 99px, centered horizontally, 12px from top of sheet            |
|behavior (v1) |purely visual — no swipe-to-dismiss, no drag interaction                                                        |
|aria          |`aria-hidden="true"` — purely decorative in v1                                                                  |
|behavior (v2) |drag-to-dismiss + drag-between-snap-heights (deferred; needs JS gesture lib)                                    |

**Anti-pattern:** showing a drag handle when no drag is wired up creates an affordance lie. v1 accepts this trade-off because mobile users expect a handle visually even without gesture (familiar from iOS / Material). When users discover swipe doesn't work, they fall back to X tap. Not ideal, but acceptable v1 compromise. v2 adds the gesture.

### §F.3.3 · Header

|prop                |spec                                                                                                                |
|--------------------|--------------------------------------------------------------------------------------------------------------------|
|layout              |flex row, justify between, align center, gap 12px                                                                  |
|padding             |`16px 20px` (smaller than modal — sheets are full-width, less side breathing room needed)                          |
|border              |`border-bottom: 1px solid rgba(26,18,9,0.06)`                                                                      |
|title font          |Avant Garde Gothic 600 18px ink-1 line-height 1.3 (matches §F.2 modal title)                                       |
|title element       |`<h2>` with id auto-wired to Dialog                                                                                  |
|close X             |Lucide `x` 24px stroke 2 ink-2, hover ink-1, hit area 44×44 via negative margin (same pattern as §F.2)            |
|optional eyebrow    |Avant Garde 700 13px uppercase ink-3 above title (rare — sort/filter sheets typically have no eyebrow). Bumped from 11px in V2-D26.|

### §F.3.4 · Body

|prop          |spec                                                                                                                  |
|--------------|----------------------------------------------------------------------------------------------------------------------|
|padding       |`12px 20px 16px` — top is reduced because header's border serves as separator                                          |
|overflow-y    |`auto` — body scrolls internally. Sheet height is fixed; content scrolls.                                              |
|font          |Avant Garde Gothic 400 16px ink-1 line-height 1.55 (bumped from 14px in V2-D26)                                       |
|scroll behavior|momentum scroll on iOS via `-webkit-overflow-scrolling: touch` (default in modern Safari, no opt-in needed)         |
|scrollbar     |default browser. Mobile = invisible until scroll. Desktop fallback = §F.2 modal (different primitive).               |

### §F.3.5 · Sticky CTA at bottom

The sheet's defining feature vs modal: a sticky bottom action area ALWAYS visible while body scrolls. Used for "Anwenden", "Filter zurücksetzen", "Bestätigen", etc.

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|layout              |single full-width primary CTA OR two buttons (secondary left + primary right). Stacked vertically only on extremely narrow screens (< 360px).|
|padding             |`16px 20px` + `padding-bottom: max(16px, env(safe-area-inset-bottom))` — respects iOS home-indicator safe area      |
|border              |`border-top: 1px solid rgba(26,18,9,0.06)`                                                                            |
|background          |white (NOT translucent — clear contrast against scrolling body content above)                                          |
|primary CTA         |full-width on filter/sort sheets ("Anwenden (47 Salons)"). Avant Garde 600 14px white on brand-teal flat pill per §5a.2.|
|reset button        |optional left-aligned text button "Filter zurücksetzen" (Avant Garde 500 14px ink-3, hover ink-1) — for filter sheet only|
|empty CTA           |allowed — for read-only sheets (look-detail) where bottom interaction lives in body                                  |

### §F.3.6 · Dismiss behavior

|trigger              |default action |overridable via                                            |
|---------------------|---------------|-----------------------------------------------------------|
|Escape key           |closes         |`keyboardDismissDisabled={true}` — same as §F.2             |
|Backdrop click       |closes         |`isDismissable={false}` — same as §F.2                       |
|Close X              |always closes  |never disable                                               |
|Swipe down (v2)      |closes         |deferred — v1 uses tap X / backdrop / escape only           |

### §F.3.7 · Mobile-only — desktop falls back to modal

`<Sheet>` and `<Modal>` are SEPARATE primitive components. Caller decides which to use based on responsive context. Helper hook `useResponsiveOverlay()` returns the appropriate primitive based on viewport width:

```tsx
// Returns "sheet" | "modal" depending on viewport.
const overlayType = useResponsiveOverlay();
const Overlay = overlayType === "sheet" ? Sheet : Modal;

return <Overlay isOpen={open} onOpenChange={setOpen}>...</Overlay>;
```

**Breakpoint:** sheet renders on `< 768px` (mobile + small tablet). Modal renders on `≥ 768px` (desktop). The breakpoint matches Solen's existing mobile/desktop divide in §6 layout.

The `useResponsiveOverlay` hook is implemented in v1 React. Hook NOT specced in detail here — see component implementation. Caller responsibility: ensure body content composes with both Sheet and Modal layouts (avoid sheet-specific padding that breaks in modal).

**Anti-pattern:** rendering Sheet on desktop (full-width bottom-anchored on a 1440px screen looks like a banner ad). Always use the responsive helper or split the component manually.

### §F.3.8 · Motion specs

|phase   |element  |property                |from                |to                  |duration|easing  |
|--------|---------|------------------------|--------------------|--------------------|--------|--------|
|entry   |backdrop |opacity                 |0                   |1                   |300ms   |ease-snap|
|entry   |sheet    |transform: translateY(N)|translateY(100%)    |translateY(0)       |600ms   |ease-glide|
|exit    |sheet    |transform: translateY(N)|translateY(0)       |translateY(100%)    |200ms   |ease-snap|
|exit    |backdrop |opacity                 |1                   |0                   |200ms   |ease-snap|

**Reduced motion:** if `prefers-reduced-motion: reduce`, both entry and exit collapse to opacity-only fade, 100ms duration. No transform animation. Per §24b.3 baseline.

### §F.3.9 · Anti-patterns

- **Sheet on desktop** — banned. Sheets are mobile-only. Use `useResponsiveOverlay()` or split components manually.
- **Multiple sheets stacked** — banned (matches §F.2 anti-pattern). Open one at a time.
- **Sheet without sticky bottom CTA when there's a confirm action** — banned. The sticky CTA is the sheet's defining UX vs modal. If there's no action, use a sheet anyway (look-detail does this), but if there IS an action, it MUST be sticky bottom.
- **Drag handle without functional swipe (in v1)** — accepted compromise per §F.3.2. Document, don't fight.
- **Pure black backdrop** — banned per §4 (warm-ink tint always). Note: §25.6 surface spec has a stale `rgba(0,0,0,.35)` reference — when §25.6 implements via §F.3, this primitive's warm-ink hex prevails.
- **Sheet height changing without animation** — if content shrinks/grows after open, animate the height change. Don't snap-resize.
- **Italic anywhere in sheet** — banned per V2-D15.
- **Bottom corners rounded** — banned. Sheet flush-bottoms to viewport edge. Top-only radius makes the "this slides up from below" affordance clear.
- **Hidden close X** — banned per §11. Always visible.

-----

*§F.3 ends here. Phase 0 continues with §F.4 toast primitive — locked next.*

-----

## §F.4 · Toast primitive

The transient notification surface for non-blocking feedback: heart-saved confirmations, copy-to-clipboard success, save-look acknowledgments, network errors, and any "hey here's what just happened" message that doesn't need user response. **Distinct from §F.2 modal:** modals demand user resolution; toasts auto-dismiss. **Distinct from inline `<FieldHelper>`:** helpers are anchored to a specific field; toasts float above all content.

**Anchors to existing locks:** the heart-save confirmation (referenced §16 salon card heart icon), the save-look acknowledgement (§18.4 look-detail share button), the booking-saved-as-draft toast (§BW Phase 2 booking wizard), and any future "Link kopiert" / "Look gespeichert" / "Filter zurückgesetzt" feedback. Toasts NEVER replace error messages on form fields — those use `<FieldHelper tone="error">` anchored to the field per §F.1.0.

### §F.4.0 · Anatomy (universal)

```
┌────── Toast ─────────────────────────────────────────┐
│ [icon] Title (optional description below)   [Action] │  ← optional action btn
│                                              [×]     │  ← close X
└──────────────────────────────────────────────────────┘
```

|element       |spec                                                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|surface       |white `#FFFFFF`, radius `var(--radius-lg)` (12px). NOT pill — toast is a notification card, not a button.                                       |
|width         |min 280px, max 480px on desktop. Mobile: `calc(100vw - 32px)` with 16px margin each side.                                                       |
|shadow        |`elevation-3` warm-tinted from §4: `0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)`                                              |
|tone bar      |left edge 4px-wide vertical bar, color = tone (success green / info brand-teal / warning amber / error red). Acts as the visual category cue.   |
|padding       |`14px 16px` (compact — toasts are not the focus, just an aside)                                                                                  |
|icon          |Lucide 18px stroke 2, color = tone, left of title with 12px gap. Icons: `check-circle` (success) / `info` (info) / `alert-triangle` (warning) / `alert-circle` (error)|
|title         |Avant Garde Gothic 600 15px ink-1 line-height 1.3 (bumped from 14px in V2-D26)                                                                  |
|description   |optional, Avant Garde Gothic 400 13px ink-3 line-height 1.4, margin-top 2px below title (bumped from 12px in V2-D26)|
|action button |optional, right-aligned, Avant Garde 600 13px brand-teal text-only button (no border). Hover ink-1.                                             |
|close X       |Lucide `x` 16px ink-3 stroke 2, hover ink-1, hit area 32×32 via padding. Always visible.                                                       |

### §F.4.0a · Tone variants

|tone     |bar color       |icon             |use                                                                                          |
|---------|----------------|-----------------|---------------------------------------------------------------------------------------------|
|success  |`#16A34A`       |`check-circle`   |"Look gespeichert", "Link kopiert", "Buchung bestätigt", any "yes, that worked" feedback     |
|info     |`#043338` (brand)|`info`          |Neutral notifications: "Ein neuer Salon in deiner Stadt", soft network-state info             |
|warning  |`#F59E0B`       |`alert-triangle` |"Du hast unsaved changes", "Internetverbindung instabil" (action recommended but not blocking)|
|error    |`#D32F2F`       |`alert-circle`   |"Buchung fehlgeschlagen", "Netzwerkfehler — bitte erneut versuchen" (action required)         |

**Anti-pattern:** using brand-teal as the success color. Solen V3 has explicit semantic colors per §3 — `s-success #16A34A` for confirmations. Brand-teal is for navigation + CTAs, not for "this thing succeeded." Mixing breaks the semantic system.

### §F.4.0b · State matrix

|state       |trigger                              |visual change                                                                                                                       |
|------------|-------------------------------------|------------------------------------------------------------------------------------------------------------------------------------|
|queued      |toast triggered, but ≥3 already shown|stays in queue, not rendered. When a visible toast dismisses, the next queued one slides in.                                       |
|opening     |slot becomes available, toast renders|`translateY(20px) → translateY(0)` + opacity 0 → 1 over 200ms `ease-snap`. New toast appears at the BOTTOM of the stack.            |
|open        |fully visible, auto-dismiss countdown|static. Auto-dismiss timer (per tone — see §F.4.1). Hovering pauses timer. Action button click triggers `onAction` + dismisses.    |
|dismissing  |timer fires OR user closes (X / action)|`translateY(0) → translateY(-10px)` + opacity 1 → 0 over 150ms `ease-snap`. Stack above shifts down to fill the gap.               |
|closed      |after exit animation completes       |unmounted from DOM. Next queued toast (if any) immediately enters opening state.                                                    |

### §F.4.1 · Auto-dismiss timing

|tone     |default duration|behavior                                                                                                                              |
|---------|----------------|--------------------------------------------------------------------------------------------------------------------------------------|
|success  |3000ms          |dismisses automatically after 3s. Hovering pauses timer; mouse-leave restarts countdown.                                              |
|info     |3000ms          |same as success.                                                                                                                      |
|warning  |6000ms          |longer because user may need to read + decide. Hover pauses.                                                                          |
|error    |sticky          |does NOT auto-dismiss. User must click X or action button. Errors are too important to flash + disappear.                            |

**Override rule:** any toast can pass `duration={N}` to override default. Pass `duration={Infinity}` (or `sticky={true}`) to make a non-error toast persistent. Pass `duration={N}` on an error to allow auto-dismiss (rare — only for errors that're informational, e.g. "offline mode aktiviert").

**Hover-pause:** timer pauses while pointer is over the toast. Restarts on mouse-leave. Touch devices: tap pauses for 4 seconds, then resumes.

### §F.4.2 · Position

|breakpoint        |position                                                          |
|------------------|------------------------------------------------------------------|
|mobile (< 768px)  |bottom-center: `bottom: max(16px, env(safe-area-inset-bottom)+16px)`, `left/right: 16px`. Stacks vertically.|
|desktop (≥ 768px) |bottom-right: `bottom: 24px`, `right: 24px`. Max width 480px. Stacks vertically.|

Toasts always render at z-index `var(--z-toast)` per §8 — above modals (per §8 line 866 lock: "always above modals so users see 'saved!' even mid-modal").

### §F.4.3 · Stacking

|rule                        |behavior                                                                                                       |
|----------------------------|---------------------------------------------------------------------------------------------------------------|
|max visible                 |3 toasts simultaneously. 4th+ goes into queue.                                                                |
|stack direction             |new toast appears at the BOTTOM of the visible stack (newest closest to user's spatial anchor — viewport edge).|
|gap between toasts          |8px vertical gap                                                                                                |
|queue order                 |FIFO — first triggered, first rendered when slot opens.                                                        |
|priority override           |error tone toasts skip the queue if 3 success/info/warning are visible — error replaces oldest non-error.    |

### §F.4.4 · Action button slot

Optional. Used for "Rückgängig" (undo), "Erneut versuchen" (retry), "Anzeigen" (view-the-thing-just-saved).

|prop                |spec                                                                                                                |
|--------------------|--------------------------------------------------------------------------------------------------------------------|
|placement           |right-aligned, between description and close X                                                                       |
|font                |Avant Garde Gothic 600 14px brand-teal `#043338`, hover ink-1 (bumped from 13px in V2-D26)                          |
|background          |transparent (text-only button — toast surface is already a card, button-on-button feels too heavy)                  |
|behavior            |click fires `onAction` callback then dismisses the toast                                                            |
|examples            |"Rückgängig" (undo a save), "Erneut versuchen" (retry a failed network call), "Anzeigen" (jump to the saved thing) |

**Anti-pattern:** TWO action buttons on a toast — banned. If you need 2 actions, that's a §F.2 modal (action-required user resolution). Toast = at most 1 action + dismiss.

### §F.4.5 · ARIA live region

|tone     |role            |aria-live           |behavior                                                                                  |
|---------|----------------|--------------------|------------------------------------------------------------------------------------------|
|success  |`role="status"` |`aria-live="polite"`|announces after current screen-reader speech finishes. Doesn't interrupt.                  |
|info     |`role="status"` |`aria-live="polite"`|same as success.                                                                          |
|warning  |`role="status"` |`aria-live="polite"`|same as success — warnings are not interruptions, just cautions.                          |
|error    |`role="alert"`  |`aria-live="assertive"`|interrupts current speech. User must hear errors immediately.                            |

Toasts that contain ONLY text + optional action button are friendly to screen readers. Avoid putting interactive widgets (form inputs, multi-step controls) inside toasts — that's modal territory.

### §F.4.6 · Motion specs

|phase   |property                |from                |to                  |duration|easing  |
|--------|------------------------|--------------------|--------------------|--------|--------|
|entry   |opacity                 |0                   |1                   |200ms   |ease-snap|
|entry   |transform: translateY(N)|translateY(20px)    |translateY(0)       |200ms   |ease-snap|
|exit    |opacity                 |1                   |0                   |150ms   |ease-snap|
|exit    |transform: translateY(N)|translateY(0)       |translateY(-10px)   |150ms   |ease-snap|
|stack-shift|transform: translateY(N) on remaining toasts when one above dismisses|prev-position|new-position|150ms|ease-snap|

**Reduced motion:** `prefers-reduced-motion: reduce` collapses all motion to opacity-only fade, 100ms. Per §24b.3.

### §F.4.7 · Hand-rolled queue (architecture note)

**v1 implementation: hand-rolled `<ToastProvider>` + `useToast()` hook.** `react-aria-components` exports only `UNSTABLE_Toast*` primitives at version `^1.16.0` — the API is explicitly marked unstable, locking ourselves in is risky. Hand-rolled queue achieves the same UX with stable API surface + zero new dependencies.

Architecture:
- `<ToastProvider>` rendered once at the app root (in `app/[locale]/layout.tsx`). Provides Context with `addToast()` + manages the queue.
- `useToast()` hook returns `{ success, info, warning, error, custom }` methods. Each accepts `{ title, description?, action?, onAction?, duration?, sticky? }`.
- Toasts rendered into a fixed-position region (per §F.4.2) using a portal to escape parent overflow / stacking context.
- Auto-dismiss timer is per-toast `setTimeout`, cleared on hover, restarted on mouse-leave.
- ARIA live region rendered as `<ol role="region" aria-label="Notifications">` per WAI-ARIA pattern.

Migration path: when react-aria-components stabilizes Toast (drops UNSTABLE_ prefix), we MAY migrate. Not before. The hand-roll is intentionally minimal — no swipe-to-dismiss, no rich content widgets — to keep migration easy.

### §F.4.8 · Anti-patterns

- **Toasts replacing form-field error messages** — banned. Field errors use `<FieldHelper tone="error">` anchored to the field (§F.1.0). Toasts are for non-anchored feedback.
- **Modals masquerading as toasts** — banned. If user must respond, it's a modal. If they don't HAVE to respond, it's a toast.
- **Two action buttons on a toast** — banned. Toast = at most 1 action + dismiss. Two actions means modal.
- **Toast that auto-dismisses an error** — banned by default. Errors stick until user acts. Override only for informational errors ("offline mode aktiviert" — informational, not blocking).
- **Toast stack of 4+ visible** — banned. Max 3 visible. 4th+ queues. Higher visual stack = noise.
- **Top-of-screen toasts** — banned for v1. Bottom is the locked position (matches user's mobile thumb position, doesn't block primary content).
- **Brand-teal as success color** — banned per §3 semantic system. Use `#16A34A`.
- **Italic anywhere in toast** — banned per V2-D15.
- **Toasts with form inputs / multi-step controls** — banned. That's a modal.

-----

*§F.4 ends here. Phase 0 continues with §F.5 date/time picker primitive — locked next.*

-----

## §F.5 · Date / time picker primitive

> **Status: spec drafted 2026-05-09 overnight (V2-D21, autonomous). Mockup + React deferred to next session — date/time picker is the largest single primitive (calendar grid + time slot list + range variant) and half-shipping is worse than scheduling cleanly.**

The booking-flow primitive for picking a single date + a time slot. Powers booking wizard step 2 (`/book/[slug]`), salon profile editor (B2B closed-day picker), search filter "available date" (deferred to v2), and any other UX where a user selects from constrained calendar dates.

**Anchors to existing locks:** the booking wizard (§BW Phase 2) uses §F.5 for date+time; the search system (§14.4 State C `WANN focused`) uses §F.5 calendar grid embedded in the search sheet; B2B availability (§B.7 calendar / availability) reuses §F.5 with multi-date selection (deferred). When booking wizard is specced, this primitive is the source of truth — surface composes, doesn't reinvent.

### §F.5.0 · Anatomy (universal)

```
┌─── Calendar grid (month view) ──────────────┐
│ [‹ Mai 2026 ›]                              │ ← month nav
│ Mo Di Mi Do Fr Sa So                        │ ← weekday header (DE locale)
│             1  2  3  4                      │
│  5  6  7  8  9 10 11                        │
│ 12 13 14 15 16 17 18                        │
│ 19 20 21 22 23 24 25                        │
│ 26 27 28 29 30 31                           │
└─────────────────────────────────────────────┘

┌─── Time slot list (after date pick) ────────┐
│ Vormittag                                   │ ← slot group label
│ [09:00] [09:30] [10:00] [10:30]             │
│ [11:00] [11:30]                             │
│                                             │
│ Nachmittag                                  │
│ [14:00] [14:30] [15:00] [15:30]             │
│ ...                                         │
└─────────────────────────────────────────────┘
```

|element       |spec                                                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|calendar surface|white `#FFFFFF`, radius `var(--radius-lg)` (12px), padding 16px                                                                                |
|month header  |Avant Garde Gothic 600 14px ink-1, centered. `‹` `›` Lucide chevron-left/right 18px ink-2 in 36px hit-area buttons (left + right of label).        |
|weekday header|Avant Garde Gothic 600 11px uppercase ink-3 letter-spacing 0.08em, 7-column grid                                                                  |
|day cell      |36×36px, font Avant Garde Gothic 400 14px ink-1, centered, radius 50% on hover/selected                                                          |
|day · selected|brand-teal bg `#043338`, white text, weight 600                                                                                                  |
|day · today (no selection yet)|brand-pale border 2px `#C2F0F1`, brand-teal text                                                                       |
|day · outside month|opacity 0.4 (greyed but tappable for prev/next month nav)                                                                                  |
|day · disabled|opacity 0.3, cursor not-allowed (e.g. past dates, salon closed days)                                                                              |
|day · in range (v2)|bg `#E1F4F4` (brand-subtle), text ink-1                                                                                                       |
|time slot     |pill button, padding `10px 14px`, border 1px `rgba(26,18,9,.10)`, radius `var(--radius-pill)` (99px), Avant Garde Gothic 600 13px ink-1            |
|slot · selected|bg `#043338`, color white, border `#043338`                                                                                                     |
|slot · disabled|opacity 0.4, cursor not-allowed (e.g. already-booked, closed)                                                                                   |
|slot · hovered|border `rgba(26,18,9,.20)`, bg `#FFF4E8` warm tint                                                                                              |
|group label   |Avant Garde Gothic 600 12px ink-3 uppercase letter-spacing 0.08em, margin 16px top + 8px bottom                                                  |

### §F.5.0a · Variants

|variant          |use                                                                                                                |
|-----------------|-------------------------------------------------------------------------------------------------------------------|
|`single-date`    |default — pick one date, no time. Used in search filter "verfügbar am" (deferred) + B2B closed-day toggle.         |
|`date-and-time`  |**most-used** — pick one date + one time slot. Booking wizard step 2.                                              |
|`time-only`      |reserved — time-slot picker without date (rare; e.g. "wann am heutigen Tag"). v1 uses date-and-time always.        |
|`date-range` (v2)|deferred — pick start + end date. Used for B2B vacation blocks. Out of v1 scope.                                  |

### §F.5.0b · State matrix

|state       |applies to     |trigger                                |visual change                                                                                                |
|------------|---------------|---------------------------------------|--------------------------------------------------------------------------------------------------------------|
|default     |day cell       |idle                                  |1px ink-1 .10 hairline on hover (subtle), no fill                                                            |
|today       |day cell       |is-today, no selection                |2px brand-pale border, brand-teal text                                                                       |
|hover       |day cell       |pointer over                          |bg ink-1 .04, weight 500                                                                                      |
|selected    |day cell       |user picks                             |brand-teal bg, white text, weight 600                                                                         |
|disabled    |day cell       |past date / closed day                 |opacity 0.3, cursor not-allowed                                                                              |
|outside-month|day cell      |belongs to prev or next month          |opacity 0.4, tap navigates to that month                                                                     |
|loading     |time slot list |fetching availability                  |skeleton placeholders (gray pills, 6 of them, animated shimmer per existing animation token from V2)         |
|empty       |time slot list |no slots available for selected date   |"Keine freien Termine. Wähle einen anderen Tag." centered ink-3 14px                                          |

### §F.5.1 · Calendar grid

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|locale              |DE-CH default — `de-CH` locale via `Intl.DateTimeFormat`. Month names + weekday labels localized via existing next-intl.|
|first day of week   |Monday (per Swiss + EU convention). Override via `weekStartsOn` prop only if a future surface needs Sunday-first.    |
|month navigation    |`‹` `›` chevrons + clickable month-name (opens year-month picker — deferred to v2; v1 = chevrons only)                |
|keyboard nav        |arrow keys move focus by 1 day; PageUp/Down moves by 1 month; Home/End jumps to start/end of week. Enter selects.     |
|min/max date        |props `minDate` and `maxDate` constrain selectable range. Default: `minDate=today` for booking flows.                |
|disabled dates      |prop `isDateDisabled(date) => boolean` callback. Booking flow: returns true for salon-closed days + past dates.        |
|aria-labelledby     |month header text auto-wired                                                                                          |
|aria-label per cell |"Montag, 12. Mai 2026, verfügbar" / "...nicht verfügbar"                                                              |

### §F.5.2 · Time slot list

|prop                |spec                                                                                                                  |
|--------------------|----------------------------------------------------------------------------------------------------------------------|
|grouping            |"Vormittag" (06:00-11:59), "Nachmittag" (12:00-17:59), "Abend" (18:00-23:59). Empty groups not rendered.              |
|slot duration       |passed by caller (booking flow uses 30min slots; B2B can override to 15 / 60min).                                     |
|slot data shape     |`{ time: ISO8601 string, available: boolean, unavailableReason?: string }` — caller fetches from backend.            |
|aria-label per slot |"14:30 Uhr verfügbar" / "14:30 Uhr nicht verfügbar"                                                                   |
|loading state       |6 skeleton pills with shimmer animation (use existing `animate-shimmer` token from tailwind.config.js)                |
|empty state         |"Keine freien Termine. Wähle einen anderen Tag." with cal icon — centered ink-3                                       |

### §F.5.3 · Composition

```tsx
<DateTimePicker
  variant="date-and-time"
  value={{ date, time }}
  onChange={({ date, time }) => ...}
  minDate={new Date()}
  isDateDisabled={(d) => salonClosedDays.includes(d.toISOString())}
  fetchSlots={(date) => fetchAvailableSlots(salonId, date)}
  slotDuration={30}
/>
```

Internal composition (implementation detail, not exposed):
- `<DateTimePicker>` — root, manages combined state
- `<CalendarGrid>` — month view + nav
- `<DayCell>` — single day (button)
- `<TimeSlotList>` — async fetch + render
- `<TimeSlot>` — single slot (button)

### §F.5.4 · Mobile vs desktop

|breakpoint        |layout                                                                                                                |
|------------------|----------------------------------------------------------------------------------------------------------------------|
|mobile (< 768px)  |stacked vertical: calendar on top, time slots below. Both within a §F.3 sheet (booking wizard mobile).               |
|desktop (≥ 768px) |side-by-side: calendar left (320px wide), time slots right. Both within a centered card on /book/[slug].             |

### §F.5.5 · Motion specs

|phase   |element       |property              |from         |to           |duration|easing  |
|--------|--------------|----------------------|-------------|-------------|--------|--------|
|month transition|grid|opacity            |0.6          |1            |200ms   |ease-snap|
|day select|day cell    |scale + bg crossfade  |scale 1, bg transparent|scale 1, bg brand|150ms|ease-snap|
|slot select|slot       |scale + bg crossfade  |scale 1, bg white|scale 0.98, bg brand|100ms|ease-thud|
|loading shimmer|skeleton|background-position |-200% 0       |200% 0       |1500ms (loop)|ease-snap|

**Reduced motion:** all transitions collapse to opacity-only, 100ms.

### §F.5.6 · ARIA + accessibility

- Calendar role: `role="grid"` per WAI-ARIA combobox-with-grid pattern
- Day cell role: `role="gridcell"` w `aria-selected` reflecting state
- Day cell label: includes full date + availability ("Montag, 12. Mai 2026, verfügbar")
- Time slot role: `role="option"` w `aria-selected`
- Time slot list role: `role="listbox"` w `aria-label="Verfügbare Zeiten"`
- Keyboard nav fully functional: Tab to enter grid, Arrow keys within grid, Enter to select
- Focus rings: §1 brand-teal 2px outline + 2px offset on focus-visible

### §F.5.7 · Anti-patterns

- **Year-month picker as scrolling wheel** — banned for v1 (iOS-specific UX, doesn't translate to desktop). Use chevron month-nav instead. v2 may add a year-picker overlay.
- **Showing all 24 hours as time slots** — banned. Group by day-period (Vormittag / Nachmittag / Abend). Reduces visual load + matches mental model.
- **Date picker without disabled-date support** — banned. Booking flow MUST disable past dates + salon-closed days. Default `minDate=today` for any booking-context picker.
- **Native `<input type="date">` / `<input type="time">`** — banned (per V2-D17 native-first principle, EXCEPTION here). Native pickers vary wildly across iOS / Android / desktop browsers; we lose visual control over the most user-facing primitive. v1 uses custom calendar grid via `react-aria-components` `Calendar` (already installed; the date-picker building blocks like `useDateField`, `useCalendar` exist in the package — see `useDateField` types). Implementation will compose those with V3 styling.
- **Range picker in v1** — deferred. Pick single date only.
- **Italic anywhere** — banned per V2-D15.

### §F.5.8 · Implementation TODO (for next session)

- Build `app/[locale]/_components/primitives/DateTimePicker.tsx` using `react-aria-components` `Calendar` + `DateField` + `Heading` (already installed). Wrap with V3 styling via cva.
- Build `public/solen-v2-datetime.html` mockup with calendar grid + time slot list in all states (default / today / selected / disabled / loading / empty).
- Extend dev test page with date+time picker demo (booking-style: pick a date → fetch fake slots → render).
- Add to barrel `index.ts`.
- The `slot-loading-skeleton` shimmer animation is already in tailwind config (`animate-shimmer`).

-----

*§F.5 ends here. Phase 0 continues with §F.6 skip-to-main link.*

-----

## §F.6 · Skip-to-main link

The first focusable element on every page. Hidden visually until the user tabs into it via keyboard — then it becomes a visible CTA-style link that, on activation, jumps focus to the page's main content area, bypassing the header / nav. Required for keyboard-only and screen-reader users per WCAG 2.4.1 (Bypass Blocks, Level A).

**Anchors to existing locks:** §11 hit-target rules apply (44×44 hit area when visible); §1 brand-teal for the visible state; mounted in `app/[locale]/layout.tsx` as the very first child of `<body>`.

### §F.6.0 · Anatomy

- An anchor `<a href="#main">Direkt zum Inhalt</a>` (or `t('skipToMain')` via next-intl).
- Hidden by default via `sr-only` (the standard accessible "screen-reader only" pattern: 1×1 pixel + `clip` + `clip-path` + absolute positioning off-screen, but discoverable to screen readers and to keyboard tab focus).
- On `:focus` / `:focus-visible`: jumps to a fixed-position visible state in the top-left, brand-teal pill, white text, 2px brand outline. Click / Enter triggers the anchor jump.

### §F.6.1 · Visible (focused) state

|prop          |spec                                                                                                      |
|--------------|----------------------------------------------------------------------------------------------------------|
|position      |`fixed; top: 16px; left: 16px;` — top-left of viewport, above all other surfaces                          |
|z-index       |`var(--z-tooltip)` (per §8) — above modals, sheets, toasts. Skip-link must always be reachable.          |
|background    |brand-teal `#043338`                                                                                      |
|color         |white                                                                                                      |
|padding       |`12px 20px`                                                                                                |
|border-radius |`var(--radius-pill)` (99px)                                                                               |
|font          |Avant Garde Gothic 600 14px, line-height 1.3                                                              |
|outline       |2px brand outline, 2px offset (matches §1 focus ring)                                                     |
|transition    |`opacity 150ms ease-snap` — appears instantly on focus                                                    |

### §F.6.2 · Hidden (default) state

Use Tailwind's `sr-only` utility (which sets `position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border-width: 0;`). On focus, override with `not-sr-only` + the visible-state styles.

### §F.6.3 · Anchor target

The skip-link's `href="#main"` jumps to a `<main id="main">` element wrapping the page's primary content. `app/[locale]/layout.tsx` enforces this — the layout `<main>` always has `id="main"`. Pages don't need to add their own `<main>` — the layout's wraps them.

### §F.6.4 · Anti-patterns

- **Always-visible skip link** — banned. Distracting for sighted/mouse users. Must be `sr-only` until focused.
- **`display: none` to hide** — banned. Removes from focus order entirely (defeats the purpose). Use `sr-only` (off-screen but focusable).
- **Skip link to a non-existent anchor** — banned. The `<main id="main">` MUST exist in the layout.
- **Italic in the link text** — banned per V2-D15.

-----

*§F.6 ends here. Phase 0 continues with §F.7 font-display strategy.*

-----

## §F.7 · Font fallback stack + `font-display` strategy

The strategy that makes V3 typography survive bad networks, broken CDNs, and slow first-paint. The §5 typography lock specifies Cooper BT for display + ITC Avant Garde Gothic Std for body — both via cdnfonts.com (paid CDN). cdnfonts.com is unreliable (Cooper Black Std currently returns HTTP 500 — see V2-D27 callout). The fallback chain is what keeps the brand alive when the primary font CDN fails.

### §F.7.1 · `font-display` value

**Lock: `font-display: swap` on every web font.**

| value | behavior | Solen verdict |
|-------|----------|---------------|
| `auto` | browser default — usually treats like `block` (invisible text up to 3s) | banned — too aggressive |
| `block` | invisible text 3s, then fallback, then swap | banned — flash-of-invisible-text is the worst UX |
| `swap` ✅ | show fallback immediately, swap to web font when loaded | **locked** — text is always visible |
| `fallback` | invisible 100ms, then fallback, then swap with 3s window | rejected — close to swap but with brief FOIT |
| `optional` | invisible 100ms, then fallback. NO swap if not loaded in time. | rejected — would mean some users never see Cooper |

**Locked rationale:** Solen's brand is the warm slab + clean grotesque pairing. If a user sees Georgia + Inter for the first 200ms of a slow connection, that's acceptable — it's still a credible brand. If they see invisible text for 3 seconds (`block`), they bounce. Always-visible-text wins.

### §F.7.2 · The fallback chains

Locked in `tailwind.config.js` + globals.css:

**Display stack:** `'Cooper BT', 'Cooper Black Std', 'Cooper Black', 'Sansita', Georgia, serif`
- Cooper BT (paid, our preference) — chunky friendly slab
- Cooper Black Std / Cooper Black — same family, alternate names some systems use
- **Sansita 900** (free Google Fonts, always loads via `display=swap`) — closest free Cooper analog
- Georgia (universal system serif) — last-resort serif, maintains "warm display" feel
- `serif` — generic ultimate fallback

**Body stack:** `'ITC Avant Garde Gothic Std', 'Avant Garde', 'League Spartan', 'Inter Tight', system-ui, sans-serif`
- ITC Avant Garde Gothic Std (paid, our preference) — geometric grotesque
- Avant Garde — same family alt name
- **League Spartan** (free Google Fonts) — closest free Avant Garde analog
- **Inter Tight** (free Google Fonts) — backup neutral grotesque
- system-ui — OS default sans (SF on macOS, Segoe on Windows)
- `sans-serif` — generic ultimate fallback

### §F.7.3 · Loading mechanism

**Google Fonts (Sansita / League Spartan / Inter Tight):** loaded via single `@import url('...&display=swap')` in `app/globals.css`. The `&display=swap` query parameter forces all 3 fonts to use swap. Always reliable — Google's CDN is rock solid.

**cdnfonts.com (Cooper Black Std / ITC Avant Garde Gothic Std):** loaded via separate `@import url('...')` lines. cdnfonts CSS files set their own `font-display`. We don't control this parameter — cdnfonts uses `font-display: auto` in their CSS (verified). This means cdnfonts fonts might cause slight FOIT before failing over.

**Mitigation in v1:** the fallback chain catches every failure case. Even when Cooper Black returns HTTP 500 (current state), Sansita 900 takes its slot in the chain — page renders correctly with no broken text. Same for Avant Garde.

**Future hardening (v2):** self-host Cooper + Avant Garde from solen.ch's own static origin. Removes dependency on cdnfonts.com. Cost: licensing concerns (need to verify the paid licenses allow self-hosting).

### §F.7.4 · Visual reference

The dev test page at `/[locale]/dev/primitives` and the V3 mockup at `solen-v2-republik-teal.html` demonstrate the live fallback chain. Currently both render Sansita (Cooper fallback) silently — visually nearly identical to true Cooper. Brand integrity is preserved.

### §F.7.5 · Anti-patterns

- **`display: block` on web fonts** — banned. Causes 3-second flash-of-invisible-text on slow connections.
- **No fallback chain (single font-family)** — banned. If the font fails to load, the page renders in browser default (Times New Roman on most systems).
- **System UI fonts as primary brand** — banned. SF / Segoe / Roboto are functional but not brand-distinctive. Solen needs Cooper warmth.
- **JavaScript-based font loaders (e.g. Web Font Loader)** — banned. CSS `@import` + `display: swap` is sufficient and lighter.
- **Variable-weight web fonts via JS subsetting** — banned in v1. Adds complexity for marginal byte savings.

-----

*§F.7 ends here. Phase 0 continues with §F.8 cookie consent banner.*

-----

## §F.8 · Cookie consent banner

The legal-baseline GDPR / Swiss DSG (Datenschutzgesetz) consent banner. **Non-negotiable before launch — DACH market requires explicit opt-in for analytics + marketing cookies.** Necessary cookies (auth session, language preference, cart state) are always on (legitimate interest exemption); analytics + marketing require active user consent.

**Anchors to existing locks:** §F.4 toast (pattern reference), §F.2 modal (settings panel uses modal), §F.1.6 switch (per-category toggle), §F.4 sticky-bottom positioning (cookie banner pattern matches toast region).

### §F.8.0 · Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ Wir verwenden Cookies                                               │
│ Notwendige Cookies sind immer aktiv. Analytics + Marketing helfen   │
│ uns, Solen zu verbessern. Du kannst jede Kategorie einzeln steuern. │
│                                                                     │
│           [Anpassen]  [Nur notwendige]  [Alle akzeptieren]          │
└─────────────────────────────────────────────────────────────────────┘
```

|element       |spec                                                                                                                                          |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|position      |`fixed; bottom: 0; left: 0; right: 0;` — full-width sticky bottom strip. Mobile: 16px margin each side.                                       |
|surface       |white `#FFFFFF`, top-only border 1px `rgba(26,18,9,0.10)`, top-only shadow `0 -4px 16px rgba(50,47,44,0.08)`                                  |
|padding       |`20px 24px` desktop, `16px 20px` mobile                                                                                                       |
|max-width     |none — full-bleed bottom strip on all sizes (it's a system-level interruption)                                                                |
|z-index       |`var(--z-tooltip)` (per §8) — above modals + sheets. Cookie consent must always be reachable + always interrupt (it's legally blocking).      |
|title         |Avant Garde Gothic 600 16px ink-1 line-height 1.3                                                                                            |
|body copy     |Avant Garde Gothic 400 14px ink-2 line-height 1.55                                                                                           |
|button row    |right-aligned, gap 8px. Stacked vertically only on extremely narrow screens (< 360px).                                                        |
|primary CTA   |"Alle akzeptieren" — brand-teal flat pill, padding 12/20, white text, weight 600                                                              |
|secondary     |"Nur notwendige" — ghost button, ink-1 text on white, 1px ink-1.10 border, padding 12/20                                                      |
|tertiary link |"Anpassen" — text-only button left of the action group, brand-teal text, no underline, hover ink-1                                            |

### §F.8.1 · Cookie categories

|key         |label              |default state |purpose                                                                            |always-on |
|------------|-------------------|--------------|-----------------------------------------------------------------------------------|----------|
|`necessary` |Notwendig          |on            |Auth session, language preference, cookie consent record itself                    |yes (legit interest)|
|`analytics` |Analyse            |off           |PostHog event tracking, anonymous usage stats — helps us improve Solen             |no (consent)|
|`marketing` |Marketing          |off           |Conversion tracking, retargeting pixels (Meta / Google), referral attribution      |no (consent)|

**v1 ships these 3 categories.** v2 may add a 4th `preferences` category if we add user-level personalization cookies.

### §F.8.2 · State matrix

|state             |trigger                                       |banner visibility                                                              |
|------------------|----------------------------------------------|-------------------------------------------------------------------------------|
|first-visit       |no consent record in localStorage              |banner visible at bottom of viewport                                           |
|customizing       |user clicks "Anpassen"                        |banner remains visible; settings modal (§F.2 size lg) opens above              |
|consent-given     |user clicks accept-all / accept-necessary / save-from-modal|banner hidden, choices persisted to localStorage `solen-cookie-consent` key |
|revisit-w-consent |existing consent record in localStorage        |banner not rendered                                                            |
|consent-changed   |user opens consent again from footer link      |banner hidden, settings modal opens directly (re-edit existing consent)        |

### §F.8.3 · Persistence

|where         |what stored                                                                                              |
|--------------|---------------------------------------------------------------------------------------------------------|
|localStorage  |key `solen-cookie-consent`, value `JSON.stringify({ necessary: true, analytics: bool, marketing: bool, timestamp: ISO })`|
|why localStorage |the cookie banner CANNOT use cookies to persist its own consent (chicken-and-egg) — localStorage is the GDPR-compliant alternative |
|expiration    |consent valid 12 months — after that, banner re-shows on next visit                                     |
|withdrawal    |footer "Cookie-Einstellungen" link reopens the settings modal where user can withdraw consent           |

### §F.8.4 · Settings modal (§F.2 size lg)

Opens via "Anpassen" button. Composed via §F.2 modal primitive at `size="lg"` — header "Cookie-Einstellungen" + body containing the 3 category toggles + footer with "Speichern" primary + "Abbrechen" secondary.

|category row anatomy|spec                                                                                          |
|--------------------|---------------------------------------------------------------------------------------------|
|layout              |`<div role="group">` with name + description on left + §F.1.6 switch on right                |
|category name       |Avant Garde Gothic 600 15px ink-1 (e.g. "Analyse")                                           |
|category description|Avant Garde Gothic 400 13px ink-3 (e.g. "Anonyme Nutzungsstatistiken via PostHog…")          |
|switch              |§F.1.6 switch primitive. `disabled={category === 'necessary'}` — necessary is always on.    |
|row separator       |1px `rgba(26,18,9,0.05)` bottom border between rows; last row no border                      |
|row padding         |`14px 0` (matches §F.1.6 switch row spacing)                                                 |

### §F.8.5 · Analytics gating

The cookie consent state controls whether analytics scripts run. Implementation:
- `<CookieProvider>` exposes `useCookieConsent()` hook returning `{ consent, hasConsented, ... }`
- `app/[locale]/layout.tsx` checks `consent.analytics === true` before mounting `<PostHogProvider>` (or equivalent)
- Same pattern for marketing (Meta Pixel, etc.) — only mounted when consent.marketing is true
- Re-renders on consent change (e.g. user opens settings + flips analytics on, PostHog provider mounts)

**Anti-pattern:** running analytics scripts before consent is given — banned per Swiss DSG + GDPR. Even "anonymous" analytics needs consent in DACH.

### §F.8.6 · Mobile vs desktop

|breakpoint        |layout                                                                                            |
|------------------|--------------------------------------------------------------------------------------------------|
|mobile (< 768px)  |banner stacks vertically: title + copy on top, buttons in a row below (or stacked if < 360px). Padding 16/20.|
|desktop (≥ 768px) |banner two-column: title + copy left, buttons right. Padding 20/24.                              |

### §F.8.7 · Motion

|phase   |property              |from         |to           |duration|easing  |
|--------|----------------------|-------------|-------------|--------|--------|
|entry   |translateY            |translateY(100%)|translateY(0)|400ms|ease-glide|
|entry   |opacity               |0           |1           |400ms   |ease-glide|
|exit    |translateY            |translateY(0)|translateY(100%)|200ms|ease-snap|
|exit    |opacity               |1           |0           |200ms   |ease-snap|

**Reduced motion:** opacity-only fade, 100ms.

### §F.8.8 · Anti-patterns

- **Pre-checked analytics / marketing toggles** — banned per GDPR. Default state is OFF. User opts in.
- **"Reject all" hidden / harder to find than "Accept all"** — banned per "dark pattern" GDPR clarifications. Both buttons must be equally prominent.
- **Auto-accept on continued browsing** — banned. Active consent only.
- **Cookie banner that blocks page interaction** — banned. Page must be fully usable while banner is visible (cookies are a layer above content, not a modal).
- **Persisting consent in cookies** — banned (chicken-and-egg). Use localStorage.
- **Loading analytics before consent** — banned per Swiss DSG. Analytics scripts mount only after `consent.analytics === true`.
- **Italic in banner copy** — banned per V2-D15.

-----

*§F.8 ends here. Phase 0 is complete: §F.1 / §F.2 / §F.3 / §F.4 / §F.5 / §F.6 / §F.7 / §F.8 all locked.*

-----

*Step 3 ends here. Step 4 covers §12 the locked patterns: header / hero / search / cards / sections / b2b / footer.*

# SOLEN_LIVE_TRUTH_v2 — Step 4: Locked Patterns

> Components and screen patterns. Continues from step 3 (spacing + breakpoints + radius + z-index + scroll + safe areas + hit targets).
> 
> Every section gives exact pixel/hex values, every UI state, every conditional render, every interaction trigger w from+to+duration+cubic-bezier. No “consider removing” — DELETE explicit. No vibes — exact triggers.

-----


-----

## §12 · Header

### §12.1 · Anatomy

```
┌────────────────────────────────────────────────────────┐
│ [solen]      [Basel ▾]   [🔔]   [avatar]              │
└────────────────────────────────────────────────────────┘
```

Layout left-to-right:

- Logo wordmark “solen”
- City pill `[Basel ▾]`
- Bell icon w optional badge count
- Avatar (initial circle or photo)

### §12.2 · Heights (per breakpoint)

|breakpoint         |height|
|-------------------|------|
|mobile (< 768px)   |`56px`|
|tablet (768–1023px)|`64px`|
|desktop (≥ 1024px) |`72px`|

Padding inside: `var(--space-4)` (16px) horizontal on mobile, `var(--space-5)` (20px) on tablet+, `var(--space-6)` (24px) on desktop.

### §12.3 · Logo “Solen”

- Font: **Cooper BT 900** (per §5.1 — logo is one of the brand-mark moments)
- Size: `clamp(28px, 2.6vw, 36px)`
- Letter-spacing: `-0.015em`
- Case: title-case "Solen" (Cooper is mixed-case display; lowercase-only Anton-style retired V2-D15-3)
- Color: brand teal `#043338` (NOT ink-1 — logo is brand color, see §1)
- NO sprout glyph in header (sprout glyph is footer-only — see §21)

### §12.4 · City pill `[Basel ▾]`

Tap target: 44px × 36px hit area, visual size 32px tall.

#### City source precedence (which city to display)

URL is source of truth. Cookie is fallback.

|user state                         |shown city                                                                          |
|-----------------------------------|------------------------------------------------------------------------------------|
|on `/[city]` route (e.g. `/zurich`)|URL city wins, regardless of cookie                                                 |
|on `/` (root)                      |cookie `solen_active_city` value                                                    |
|no cookie + on `/`                 |IP-based geolocation guess (Cloudflare header), defaulting to `Basel` if guess fails|
|user changes city via pill         |update cookie + navigate to `/[new-city]`                                           |
|user navigates to a category page  |URL city wins, cookie syncs to URL on landing                                       |

|element             |spec                                                                                             |
|--------------------|-------------------------------------------------------------------------------------------------|
|label format        |text only — `Basel ▾` (no pin/flag/icon)                                                         |
|typography          |Avant Garde Gothic 600 13px, `-0.005em`                                                                 |
|chevron             |12px Lucide `chevron-down`, ink-2 `#56463E`                                                      |
|chevron gap         |4px                                                                                              |
|bg                  |`linear-gradient(180deg, #fff, #FDFAF5)`                                                         |
|shadow              |`inset 0 1px 0 rgba(255,255,255,.8), 0 1px 1px rgba(26,18,9,.04), 0 2px 6px rgba(4,51,56,.06)`|
|radius              |`var(--radius-pill)` (99px)                                                                      |
|padding             |`7px 14px`                                                                                       |
|pressed state       |`scale(0.96)` 100ms `var(--ease-thud)`                                                           |
|hover (desktop only)|brighter shadow, no transform                                                                    |

#### City dropdown (on tap)

Sheet anchored bottom on mobile, dropdown anchored to pill on desktop.

Content:

- Header label: “Stadt wählen” (Avant Garde Gothic 700 16px)
- 3 city rows (Basel, Zürich, Bern) — NO salon counts inside dropdown
- Active city: brand-teal `#043338` text + checkmark right
- Inactive: ink-1, hover bg `#F5F0E8`
- Each row: 48px height, 14px Avant Garde Gothic 500, 16px horizontal padding
- Dismiss: tap outside, swipe down (mobile), Esc key

#### City dropdown DO NOT

- Do NOT show category-filtered counts (“47 Coiffeur”)
- Do NOT show flags or country emojis
- Do NOT add a “Andere Städte” row — defer to v2 when more cities exist

### §12.5 · Bell icon

|state                              |spec                                                                                 |
|-----------------------------------|-------------------------------------------------------------------------------------|
|default                            |Lucide `bell`, 22px, ink-1 stroke 2px                                                |
|with notifications                 |8px brand-teal `#043338` dot at top-right corner of bell, 1px ink-1 ring around dot|
|count ≥ 100                        |dot only — never numeric badge                                                       |
|press                              |`scale(0.94)` 100ms `var(--ease-thud)`                                               |
|count increments while user on page|dot pulses scale 1→1.3→1 over 400ms `var(--ease-spring)`                             |
|tap                                |opens `/notifications` page (full-screen on mobile, sheet on desktop)                |
|aria-label                         |`Benachrichtigungen` (when 0), `Benachrichtigungen, [N] neue` (when count > 0)       |

### §12.6 · Avatar

|condition                                         |display                                                                       |
|--------------------------------------------------|------------------------------------------------------------------------------|
|logged in w photo                                 |32px circle, photo `background-size: cover`, 1px ink-1 `.06` ring             |
|logged in w name (no photo)                       |initial of first name in 32px circle, bg ink-1, white Avant Garde Gothic 700 14px      |
|logged in w no name + no photo (email-only signup)|first letter of email (uppercase), same styling as name initial               |
|logged out                                        |32px circle, ink-2 bg, white Lucide `user` 14px stroke icon — taps to `/login`|
|photo loading                                     |skeleton circle w shimmer per §5c (skeleton shimmer)                                           |
|photo failed to load                              |falls back to initial display                                                 |

Tap target: 44px hit area.

Tap → opens user menu drawer (mobile) or popover (desktop) w: profile / bookings / favorites / settings / sign out.

aria-label: `Mein Konto, [name]` when logged-in, `Einloggen` when logged out.

### §12.7 · Sticky behavior

Header is sticky. Scroll past `8px` from top:

- Add bottom shadow `0 1px 0 rgba(26,18,9,.04), 0 2px 8px rgba(26,18,9,.04)`
- Bg shifts from white `#FFFFFF` to opaque white `rgba(255,255,255,.92)` w `backdrop-filter: blur(10px) saturate(1)`
- Transition: 200ms `var(--ease-snap)`

### §12.8 · Scroll-up vs scroll-down behavior

DO NOT hide header on scroll-down + show on scroll-up. Header is ALWAYS visible. Reasoning: nav is too sparse (4 elements) to justify hide animation, plus city pill needs to be reachable at any scroll depth.

### §12.9 · Salon detail page header variant

When on `/salon/[slug]` page, header transforms:

|element              |change                                                                                                                                                          |
|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
|bg                   |transparent over hero photo → opaque cream once scrolled past hero (transition 250ms)                                                                           |
|logo                 |replaced w back-arrow (Lucide `arrow-left` 22px ink-1) at left                                                                                                  |
|city pill            |hidden on this page                                                                                                                                             |
|bell + avatar        |unchanged                                                                                                                                                       |
|back-arrow target    |`history.back()` if there’s history within solen.ch domain (i.e. user navigated from a feed). otherwise `/[city]` (the user’s current city homepage) as fallback|
|back-arrow aria-label|`Zurück`                                                                                                                                                        |

### §12.10 · NO nav links in header

DO NOT add any of: “Salons”, “Entdecken”, “Für Salons”, “Login”, “Sign up”. All navigation lives in:

- Search bar (in hero, not header)
- Avatar menu (logged-in user actions)
- Footer (legal, b2b, secondary)

This is intentional. Fresha-style minimal header. NO megamenu. NO horizontal nav. NO breadcrumbs.

-----

## §13 · Hero

### §13.1 · Layout

```
┌────────────────────────────────────────────────────────┐
│  [pulse · 47 Salons in Basel haben heute frei]        │  ← live counter pill
│                                                        │
│  Guten Morgen, Sulo                                   │  ← time-based greeting
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │ WAS  Service oder Salon                       │    │  ← search bar row 1
│  ├──────────────────────────────────────────────┤    │
│  │ WO   Basel · Kleinbasel                       │    │  ← row 2
│  ├──────────────────────────────────────────────┤    │
│  │ WANN Heute · 14:30                            │    │  ← row 3
│  └──────────────────────────────────────────────┘    │
│  [Solen durchsuchen →]                                │  ← CTA
│                                                        │
│  [Heute] [Last-Min] [In der Nähe] [Mehr Filter →]   │  ← dynamic chips
└────────────────────────────────────────────────────────┘
```

### §13.2 · Counter pill (top of hero)

|element                      |spec                                                                                            |
|-----------------------------|------------------------------------------------------------------------------------------------|
|copy template (count ≥ 2)    |`[count] Salons in [city] haben heute frei`                                                     |
|copy template (count = 1)    |`1 Salon in [city] hat heute frei` (singular: `Salon` + `hat`)                                  |
|copy template (count = 0)    |`Heute keine freien Termine in [city] — Morgen ab 09:00 verfügbar`                              |
|copy when API fails          |`Tausende Salons in der Schweiz` (generic fallback, no count)                                   |
|copy while loading first time|skeleton: 240px wide × 24px tall pill w shimmer per §5c (skeleton shimmer)                                       |
|number formatting            |Swiss apostrophe thousands per §8 i18n: `1'247 Salons` not `1247` and not `1,247`               |
|typography                   |Avant Garde Gothic 600 12px, `-0.005em`                                                                |
|pulse dot                    |6px brand-teal `#043338`, animates pulse 1.6s infinite (opacity 1↔.5, scale 1↔1.3) — see §5c.7|
|pulse dot when API failed    |hidden (no fake real-time signal when there’s no real-time data)                                |
|pill bg                      |`rgba(255,255,255,.65)` w `backdrop-filter: blur(12px) saturate(1)`                           |
|pill border                  |1px `rgba(4,51,56,.12)`                                                                      |
|pill padding                 |`6px 12px`                                                                                      |
|pill radius                  |`var(--radius-pill)` (99px)                                                                     |
|update                       |counter is REAL-TIME — refetches every 60s OR on visibility change (page becomes active)        |
|city                         |matches header city pill — when user changes city, both update simultaneously                   |
|not tappable                 |counter pill is NOT a button. no hover, no press, no link. purely informational.                |
|aria-live                    |`polite` — screen reader announces count updates without interrupting current task              |
|aria-label                   |full sentence read out (uses `<p>` tag inside, not just text spans)                             |

### §13.3 · Greeting line

Time-based, NOT day-based:

|time       |copy                           |
|-----------|-------------------------------|
|04:00–10:59|`Guten Morgen`                 |
|11:00–17:59|`Guten Tag`                    |
|18:00–22:59|`Guten Abend`                  |
|23:00–03:59|`Hallo` (no specific time word)|

|state           |full copy                        |
|----------------|---------------------------------|
|logged in w name|`[Greeting], [first name].`      |
|logged out      |`[Greeting].` (no name, no comma)|

|element       |spec                                                                                                     |
|--------------|---------------------------------------------------------------------------------------------------------|
|typography    |Avant Garde Gothic 700                                                                                  |
|size          |`clamp(28px, 6vw, 44px)`                                                                                 |
|line-height   |1.05                                                                                                     |
|letter-spacing|`-0.03em`                                                                                                |
|color         |ink-1 `#1A1209`                                                                                          |
|spacing       |margin-top `var(--space-3)` (12px) from counter pill, margin-bottom `var(--space-5)` (20px) to search bar|

#### Long name behavior

|condition                   |behavior                                                                                                                                       |
|----------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
|name ≤ 15 chars             |render on single line if width allows, wrap naturally if not                                                                                   |
|name 16-25 chars            |force wrap after comma — `Guten Morgen,\n[name].` (`\n` = literal line break via `<br>` or block element)                                      |
|name > 25 chars             |truncate to first 25 chars + `…` (e.g. `Maximilianoexample…`) — the salon-side b2b doesn’t enforce real-name policy so don’t trust input length|
|no first_name in user object|use `username` field if present, else fall back to logged-out greeting                                                                         |

DO NOT add wave emoji, sun illustration, or any decorative SVG to the greeting. Pure typography only.

aria-level: `<h1>` (page-level heading for SEO + screen reader hierarchy).

### §13.4 · Search bar — stacked 3-row format

Same on mobile and desktop. Stacked vertical, NOT horizontal columns.

|row|label |placeholder (empty) |default value (filled from context)                                                               |
|---|------|--------------------|--------------------------------------------------------------------------------------------------|
|1  |`WAS` |`Service oder Salon`|empty until user types                                                                            |
|2  |`WO`  |`Wo bist du?`       |matches header city pill (e.g. `Basel`). adds `· [neighborhood]` if geolocation permission granted|
|3  |`WANN`|`Wann passt's?`     |empty until user picks (NOT pre-filled with `Heute` — leaving empty signals “any time” to API)    |

#### Row anatomy

```
┌─────────────────────────────────┐
│ [LABEL]  [Value or placeholder] │
└─────────────────────────────────┘
```

|element                    |spec                                                                                                                                                                                               |
|---------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|label                      |Avant Garde Gothic 700 9px, brand-teal `#043338`, letter-spacing 0.18em, uppercase                                                                                                                      |
|value (filled)             |Avant Garde Gothic 600 14px ink-1 `#1A1209`                                                                                                                                                               |
|placeholder (empty)        |Avant Garde Gothic 400 14px ink-2 `#7A6957`                                                                                                                                                               |
|row height                 |56px                                                                                                                                                                                               |
|row padding                |`12px 16px`                                                                                                                                                                                        |
|row gap (label↔value)      |8px                                                                                                                                                                                                |
|filled vs empty visual diff|filled rows show value in ink-1 600 weight; empty rows show placeholder in ink-2 400 weight. NO icon, NO checkmark, NO bg color change — typography weight + color is the only filled-state signal.|

#### Container

|element      |spec                                                                                              |
|-------------|--------------------------------------------------------------------------------------------------|
|bg           |`linear-gradient(180deg, #fff 0%, #FDFAF5 100%)`                                                  |
|radius       |`var(--radius-2xl)` (16px)                                                                        |
|border       |1px `rgba(26,18,9,.06)`                                                                           |
|shadow       |`inset 0 1px 0 rgba(255,255,255,.8), 0 1px 2px rgba(26,18,9,.04), 0 8px 24px rgba(4,51,56,.06)`|
|row separator|`1px rgba(26,18,9,.06)` between rows                                                              |

#### CTA button (below container)

|element         |spec                                                                                                      |
|----------------|----------------------------------------------------------------------------------------------------------|
|copy            |`Solen durchsuchen →`                                                                                     |
|typography      |Avant Garde Gothic 700 14px                                                                                      |
|bg              |`#043338` flat (V2-D15-4: gradient retired — flat brand teal, hover transitions to `#0A6873` mid-teal via `transition: background 150ms ease`)                                                       |
|color           |white                                                                                                     |
|radius          |`var(--radius-pill)` (99px)                                                                               |
|padding         |`14px 24px`                                                                                               |
|margin-top      |`var(--space-3)` (12px)                                                                                   |
|width on mobile |100%                                                                                                      |
|width on tablet+|auto, anchored left of container                                                                          |
|arrow           |Lucide `arrow-right` 14px, magnetic flourish (gap 4→10px on hover, arrow translates 2px right, 200ms snap)|

### §13.5 · Search bar tap behavior

Tap any row → opens full-screen search page `/search` (NOT a modal, NOT a dropdown). See §14.

### §13.6 · Quick chips (below search bar)

Dynamic via cookie tracking. Shows top 3 most-used filters by user, plus “Mehr Filter →” as 4th slot.

|state                      |order                                                    |
|---------------------------|---------------------------------------------------------|
|cold visit (no cookie data)|`Heute` · `Last-Minute` · `In der Nähe` · `Mehr Filter →`|
|returning user             |top 3 most-tapped chips by user, then `Mehr Filter →`    |

|chip      |spec                                       |
|----------|-------------------------------------------|
|typography|Avant Garde Gothic 600 12px                       |
|bg default|`linear-gradient(180deg, #fff, #FDFAF5)`   |
|bg active |ink-1 `#1A1209`, white text                |
|border    |1px `rgba(26,18,9,.06)`                    |
|radius    |`var(--radius-pill)` (99px)                |
|padding   |`8px 14px`                                 |
|icon      |optional, 12px Lucide, before text, 4px gap|
|height    |32px                                       |
|spacing   |gap `var(--space-2)` (8px) between chips   |
|margin-top|`var(--space-4)` (16px) from search CTA    |

#### Chip behaviors

|chip           |behavior on tap                                                 |
|---------------|----------------------------------------------------------------|
|`Heute`        |adds filter `available=today`, navigates to `/[city]/heute`     |
|`Last-Minute`  |adds filter `available_within=2h`, navigates to `/[city]/sofort`|
|`In der Nähe`  |requests geolocation permission, sorts by distance              |
|`Mehr Filter →`|opens full search page `/search` w filters tab focused          |

#### Cookie tracking

Cookie `solen_chip_usage` stores `{[chipKey]: tapCount}` per user. Updated on tap. Read on hero render. Top 3 by count win the slots, ties broken by recency.

|rule                                     |spec                                                                                                    |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
|cookie expiry                            |90 days from last update — refreshed on every tap                                                       |
|insufficient data (< 3 chips ever tapped)|fall back to default order: `Heute` · `Last-Minute` · `In der Nähe` · `Mehr Filter →` for unfilled slots|
|user clears cookies                      |reverts to default order                                                                                |
|slot 4 (`Mehr Filter →`)                 |always last, never replaced by tracked chips                                                            |
|chip not tapped in 60 days               |decay weight by 50% each subsequent week (so old preferences fade)                                      |

### §13.7 · Hero spacing

|spacing                   |value                                                                 |
|--------------------------|----------------------------------------------------------------------|
|header → counter pill     |`var(--space-6)` (24px) on mobile, `var(--space-8)` (32px) on tablet+ |
|counter pill → greeting   |`var(--space-3)` (12px)                                               |
|greeting → search bar     |`var(--space-5)` (20px)                                               |
|search bar → chips        |`var(--space-4)` (16px)                                               |
|chips → first feed section|`var(--space-8)` (32px) on mobile, `var(--space-10)` (48px) on tablet+|

-----

## §14 · Search system

`/search` is a full-screen page (NOT modal, NOT sheet). Activated when user taps any search bar row in hero.

### §14.1 · Layout

```
┌─────────────────────────────────────┐
│ [×]  Suche                          │  ← top bar
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ WAS  Service oder Salon         │ │  ← compact stacked search bar (sticky)
│ │ WO   Basel · Kleinbasel         │ │
│ │ WANN Heute · 14:30              │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│  [body changes by focused row]      │
│                                     │
└─────────────────────────────────────┘
[3 Filter · 47 Salons in Basel] ← sticky bottom CTA
```

### §14.2 · Top bar

- 56px tall on mobile, 64px on tablet+
- Left: close X (Lucide `x` 22px ink-1) — closes page, returns to previous
- Center: title `Suche` (Avant Garde Gothic 700 16px, ink-1)
- Right: empty (no nav actions)

### §14.3 · Sticky compact search bar

Same 3-row stacked format from hero, but:

- Container shrinks slightly: row height 48px
- Active row gets brand-teal border `2px #043338` + bg `#FFF4E8`
- Inactive rows: bg `#fff`, no border highlight
- Sticky at top below top bar (z-index `var(--z-sticky)` per §8)

### §14.4 · Three states (driven by which row is focused)

#### State A — WAS focused (default on entry from hero `Service oder Salon` tap)

Body shows:

- Mobile keyboard pushes up automatically
- Live suggestions list as user types (debounced 150ms)
- Section header: `Beliebt in [city]` (Avant Garde Gothic 700 14px ink-1)
- Pill row: top 6 popular service categories in current city
- Below: list of recent searches by user (max 5)

|typed input|result list shows                                           |
|-----------|------------------------------------------------------------|
|empty      |popular services in city + recent searches                  |
|1+ chars   |matching salons (up to 5) + matching services (up to 5)     |
|0 results  |“Keine Treffer für ‘[query]’” + “Beliebt in [city]” fallback|

Tap suggestion → fills WAS row, auto-advances focus to WO row.

#### State B — WO focused

Body shows:

- “In der Nähe” button at top w geo pin icon → requests geolocation, fills WO w “In der Nähe”
- Section header: `Stadt`
- 3 city rows w salon counts:
  - `Basel · 47 Salons`
  - `Zürich · 128 Salons`
  - `Bern · 62 Salons`
- Tapping city → fills WO row, auto-advances focus to WANN

#### State C — WANN focused

Body shows:

- 3 quick chips: `Heute` · `Morgen` · `Wochenende`
- Below chips: real calendar grid (current month, next month tab to switch)
- Time-of-day filter NOT included in v1 (defer time-slot picking to v2)

Tap date or chip → fills WANN row.

### §14.5 · Focus auto-advance

When a row is filled (via tap on suggestion), focus auto-advances to next empty row in order WAS → WO → WANN. If all 3 are filled, focus stays on last edited row.

User can also tap any row directly to switch focus.

### §14.6 · Sticky bottom CTA

|state            |copy                                                                         |
|-----------------|-----------------------------------------------------------------------------|
|no rows filled   |`Solen durchsuchen →` (disabled state, ink-3 `#7A6957` bg)                   |
|1+ row filled    |`[N] Filter · [count] Salons in [city]` (active state, brand-teal gradient)|
|count is updating|spinner replaces count, copy: `[N] Filter · zähle...`                        |

|element   |spec                                                                                     |
|----------|-----------------------------------------------------------------------------------------|
|bg active |`#043338` flat (V2-D15-4: gradient retired — flat brand teal, hover transitions to `#0A6873` mid-teal via `transition: background 150ms ease`)                                      |
|color     |white                                                                                    |
|radius    |`var(--radius-pill)` (99px)                                                              |
|padding   |`14px 24px`                                                                              |
|typography|Avant Garde Gothic 700 14px                                                                     |
|position  |sticky bottom, with `var(--space-4)` margin all sides, `safe-area-inset-bottom` respected|
|shadow    |`0 1px 2px rgba(26,18,9,.04), 0 16px 32px rgba(4,51,56,.18)`                          |
|z-index   |`var(--z-sticky)` per §8                                                                 |

Tap CTA → navigates to `/search/results?q=[was]&city=[wo]&date=[wann]`.

### §14.7 · Search system DO NOT

- DO NOT show a horizontal “filters” tab — search bar IS the filter system
- DO NOT auto-search as user types — only fetch suggestions, not full results
- DO NOT add a “Karte” tab inside search — map is part of `/search/results` not `/search`
- DO NOT include sort options inside `/search` — they live on the results page
- DO NOT lock keyboard open if user scrolls — close keyboard on scroll-down

-----

## §15 · Section header pattern (V2-D15-4 lock — editorial section-break)

Reusable component for every horizontal scroll row on homepage and category pages. **V2-D15-4 update:** the V2-D15 minimalist `clean` layout (h2 left + `Alle →` right, no eyebrow / no meta) is **retired**. Replaced with the editorial section-break pattern below — adds magazine-style structure that fixes the "bland section title" feedback.

### §15.1 · Anatomy (Option D — V2-D15-4 lock)

```
─────────────────────────────────────────────────────────  ← 1px ink-1 top rule
BASEL · DIESE WOCHE              23 SALONS · 8 HEUTE FREI  ← eyebrow-left + meta-right
                                                                (Avant Garde 11px 700,
                                                                letter-spacing 0.18em,
                                                                uppercase)

In Basel diese Woche                                  Alle →  ← Cooper BT h2 + Alle link
─────────────────────────────────────────────────────────
[horizontal scroll row of cards]
```

### §15.2 · Locked decisions

|element                          |locked                                                                                                     |
|---------------------------------|-----------------------------------------------------------------------------------------------------------|
|top rule                         |1px solid ink-1 `#1A1209`, full-width within container, margin-bottom 14px                                 |
|eyebrow (left)                   |Avant Garde Gothic 700 11px, ink-1, `letter-spacing: 0.18em`, `text-transform: uppercase`. Carries section context — typically `[CITY] · [SECTION-LABEL]` (e.g. `BASEL · DIESE WOCHE` / `BASEL · COIFFEUR` / `SOLEN · CITIES`). |
|eyebrow brand-teal accent        |Optional: lead with a 5px brand-teal `#043338` round dot before the eyebrow text (acts as a section-marker)|
|meta (right)                     |Avant Garde Gothic 700 10-11px, ink-3 `#7A6957`, `letter-spacing: 0.18em`, `text-transform: uppercase`, `font-variant-numeric: tabular-nums`. Carries the live count (e.g. `23 SALONS · 8 HEUTE FREI`). Hide if no meta is meaningful (e.g. on the city tiles section).|
|h2 (title row)                   |Cooper BT 900 (display), `clamp(28px, 3.4vw, 40px)`, `letter-spacing: -0.018em`, `line-height: 1.05`, ink-1. NOT Avant Garde 700 (V2-D15 was Avant Garde 700; replaced V2-D15-4 with Cooper for editorial weight)|
|h2 to title row spacing          |16px between top-rule + 12px between eyebrow row and h2 row                                                |
|`Alle →` link                    |Avant Garde Gothic 600 13px, brand teal `#043338`, underline-offset 3px, hover → `#0A6873`. Right-aligned in the h2 row, baseline-aligned with h2.|
|Alle text                        |exactly `Alle →` (just word + arrow), nothing more (count locked OUT — meta carries the count instead)     |
|arrow                            |Lucide `arrow-right` 12px                                                                                  |
|arrow flourish                   |gap text↔arrow: 4px → 10px on hover, arrow `translateX(2px)` on hover, both 200ms `var(--ease-snap)`       |
|URL on tap title or Alle         |`/[city]/[category]` per §15.5                                                                             |

### §15.3 · Spacing

|spacing                          |value                                          |
|---------------------------------|-----------------------------------------------|
|margin-top from previous section |48px mobile / 64px tablet+ (V2-D15-4 — increased from 32/48 to give the editorial section-break more breathing room) |
|top rule to eyebrow row          |14px                                           |
|eyebrow row to h2 row            |12px                                           |
|h2 row to scroll row             |16px                                           |
|section header horizontal padding|matches page padding (16px mobile, 24px tablet)|

### §15.4 · DO NOT

- DO NOT skip the top rule — it's the editorial section-break signature
- DO NOT add a hairline color other than ink-1 to the top rule (no brand-teal, no category color)
- DO NOT add count to the `Alle →` link (count goes in the meta-right slot)
- DO NOT use Avant Garde 700 on h2 (replaced V2-D15-4 with Cooper BT 900 for editorial weight)
- DO NOT add a second eyebrow row (e.g. eyebrow + sub-eyebrow) — one eyebrow only
- DO NOT vary section header style by section — single pattern for ALL sections including entdecken
- DO NOT use the V2-D15 minimalist layout (no eyebrow / no meta / Avant Garde h2) — retired V2-D15-4

### §15.7 · Eyebrow + meta examples per section

| Section | Eyebrow (left) | Meta (right) |
|---|---|---|
| `Heute frei in Basel` | `BASEL · DIESE WOCHE` | `[N] SALONS · [M] HEUTE FREI` |
| `Empfohlen für dich` | `BASEL · FÜR DICH` | `BASIEREND AUF DEINEN BUCHUNGEN` |
| `Entdecken in Basel` | `LOOKS · DIESE WOCHE` | `[N] NEUE LOOKS` |
| `Coiffeur in Basel` | `BASEL · COIFFEUR` | `[N] SALONS · AB CHF [P]` |
| `Barbershop in Basel` | `BASEL · BARBERSHOP` | `[N] SALONS · AB CHF [P]` |
| `Nails in Basel` | `BASEL · NAILS` | `[N] STUDIOS · AB CHF [P]` |
| `Spa & Wellness in Basel` | `BASEL · SPA & WELLNESS` | `[N] HÄUSER · AB CHF [P]` |
| `Solen in deiner Stadt` | `SOLEN · IN DER SCHWEIZ` | `3 STÄDTE · WACHSEND` |
| `Salons nach Stadt` (link wall) | `SOLEN · ALLE STÄDTE` | (no meta — link wall is its own section) |

### §15.5 · URL convention

When user taps section title OR “Alle →”, navigate to `/[city]/[category]` where:

|section                                     |URL                                                                     |
|--------------------------------------------|------------------------------------------------------------------------|
|`Heute frei in Basel`                       |`/basel/heute`                                                          |
|`Empfohlen für dich`                        |`/basel/empfohlen` (logged-in)                                          |
|`Entdecken in Basel`                        |`/entdecken` (no city — entdecken is global)                            |
|`Coiffeur in Basel`                         |`/basel/coiffeur`                                                       |
|`Barbershop in Basel`                       |`/basel/barbershop`                                                     |
|`Nails in Basel`                            |`/basel/nails`                                                          |
|`Spa & Wellness in Basel`                   |`/basel/spa`                                                            |
|`Solen in deiner Stadt` (city tiles section)|`/staedte` (city directory — special case, not city/category structured)|

NO query strings (`?city=basel&service=coiffeur`). City-first URL structure for SEO. Each URL is a unique landing page w unique `<title>` + `<meta description>`.

The `Solen in deiner Stadt` section is an exception — it’s not city/category content, it’s a meta-section listing all cities. Its “Alle →” goes to a city directory page (`/staedte`), not a category landing page.

### §15.6 · When to hide “Alle →”

DO NOT hide. Always show “Alle →” — even if scroll row has only 3 cards. Tapping it goes to category page where same 3 are shown in grid format.

Exception: section is hidden entirely if 0 cards (see §16.6 empty states).

-----

## §16 · Salon card

Reusable component. 2 variants for v1 (`availability`, `service`). 2 more variants (`trust`, `joined`) deferred to v2 — see §16.8.

### §16.1 · Anatomy

```
┌──────────────────┐
│ [badge] [♥]      │ ← photo overlays
│                  │
│   PHOTO 1:1      │
│                  │
│                  │
└──────────────────┘
Salon Name             4.8 ⭐  ← row 1
Heute frei ab 14:30 · ab CHF 85   ← row 2
```

### §16.2 · Dimensions

|element           |spec                                               |
|------------------|---------------------------------------------------|
|width mobile      |160px                                              |
|width tablet+     |180px                                              |
|photo aspect ratio|1:1                                                |
|photo radius      |`var(--radius-xl)` (14px)                          |
|photo to text gap |8px                                                |
|total height      |~250-260px (160-180px photo + 8px gap + ~30px text)|

### §16.3 · Photo overlays

Badge state and row 2 text are TWO SEPARATE renders driven by the SAME data (next available slot). They coexist and reinforce each other — they’re not redundant. Example:

```
[● Sofort frei]   ← badge (orange dot, "Sofort frei")
   [photo]
Salon Crémant            4.9 ⭐
In 25 Min frei           ← row 2 (matching specific time)
```

The badge says the *category* of availability (now / today / not today), the row 2 gives the *specific time*.

#### Badge (top-left)

State-driven — exactly one state per card per render. Driven by `next_available_slot` data:

|state condition                                            |copy                                                           |bg                                           |dot color             |
|-----------------------------------------------------------|---------------------------------------------------------------|---------------------------------------------|----------------------|
|next slot is within 30 min from now                        |`Sofort frei`                                                  |glass white `rgba(255,255,255,.85)` w blur 12|brand-teal `#043338`|
|next slot is later today (30 min < t ≤ end of business day)|`Heute frei`                                                   |glass white `rgba(255,255,255,.85)` w blur 12|green `#16A34A`       |
|next slot is tomorrow or later                             |(no badge)                                                     |—                                            |—                     |
|salon is permanently closed / deactivated                  |(card hidden from feeds entirely — see §16.6)                  |—                                            |—                     |
|salon is temporarily closed (vacation, sickness)           |small ink-2 pill `Pause bis [date]` instead of green/orange dot|glass white                                  |(no dot)              |

|element        |spec                                                                           |
|---------------|-------------------------------------------------------------------------------|
|position       |`top: 8px; left: 8px;`                                                         |
|typography     |Avant Garde Gothic 700 10px, ink-1 `#1A1209`                                          |
|dot size       |5px diameter                                                                   |
|dot ring       |`box-shadow: 0 0 0 3px rgba(<dotcolor>, .2)`                                   |
|dot pulse      |opacity 1↔.5, scale 1↔1.3, 1.6s infinite                                       |
|padding        |`4px 9px`                                                                      |
|radius         |`var(--radius-pill)` (99px)                                                    |
|backdrop-filter|`blur(12px) saturate(1)`                                                     |
|shadow         |`0 1px 2px rgba(0,0,0,.06)`                                                    |
|aria-label     |full pill text read out (e.g. `Heute frei`, `Sofort frei`, `Pause bis 15. Mai`)|

#### Heart icon (top-right)

|state                               |spec                                                                                                                           |
|------------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
|not saved                           |Lucide `heart` 14px ink-1 stroke 2px, fill none                                                                                |
|saved                               |Lucide `heart` filled w love-red `#FF4A6B`, stroke same color                                                                  |
|size                                |28px circle button                                                                                                             |
|bg                                  |glass white `rgba(255,255,255,.85)` w blur 12                                                                                  |
|shadow                              |`0 1px 2px rgba(0,0,0,.06)`                                                                                                    |
|position                            |`top: 8px; right: 8px;`                                                                                                        |
|tap                                 |toggles save state, optimistic UI update, syncs to backend                                                                     |
|animation on save                   |pulse scale `1 → 1.3 → 1` over 300ms `var(--ease-spring)`                                                                      |
|animation on unsave                 |scale `1 → 0.9 → 1` over 200ms `var(--ease-snap)`                                                                              |
|aria-label not saved                |`Speichern`                                                                                                                    |
|aria-label saved                    |`Gespeichert`                                                                                                                  |
|screen reader announcement on toggle|`[Salon Name] gespeichert` / `[Salon Name] entfernt` (aria-live=“polite”)                                                      |
|logged-out user tap                 |opens login modal w copy `Speichere deine Lieblings-Salons. Melde dich an oder erstelle ein Konto.` — return to card after auth|

### §16.4 · Row 1 — Name + Rating

|element           |spec                                                                       |
|------------------|---------------------------------------------------------------------------|
|layout            |flex row, baseline aligned, justify-between                                |
|name typography   |Avant Garde Gothic 700 14px, `-0.01em`, line-height 1.1, ink-1            |
|name truncation   |single line, ellipsis if overflow                                          |
|name flex         |1, min-width 0                                                             |
|rating typography |Avant Garde Gothic 600 (tabular-nums) 11px, ink-1                                             |
|star icon         |10px, fill `#F3A864` (amber), no stroke                                    |
|star icon position|left of number, 2px gap                                                    |
|rating format     |`[star] 4.8` — one decimal, NO review count, NO `/5` suffix                |
|rating shown when |always, even if 0 reviews (shows `—` instead of number when no rating data)|

### §16.5 · Row 2 — Variant content

#### Variant `availability`

Used in: `Heute frei in Basel`, `Empfohlen für dich`, `/favoriten` page, `/search/results`, look-detail sheet salon list.

Format determined by next-available-slot logic:

|condition                     |row 2 format                                                                  |
|------------------------------|------------------------------------------------------------------------------|
|has 3+ slots today            |`[time1], [time2], [time3]` (e.g. `14:30, 15:00, 16:30`) — all bold ink-1     |
|has 1-2 slots today           |shown as `[time1], [time2]`                                                   |
|has slot in next 30 min       |`In [N] Min frei` — bold ink-1 (e.g. `In 25 Min frei`)                        |
|no slots today, has tomorrow  |`Nächster Termin Mo. [time]` — “Nächster Termin Mo.” in ink-2, time bold ink-1|
|no slots today, has later week|`Nächster Termin [Mo./Di./...] [time]`                                        |
|no slots ever (closed)        |`Geschlossen` — ink-3 only, no badge                                          |

Typography: Avant Garde Gothic 400 11px, line-height 1.3, ink-2 `#7A6957`. Bold parts use Avant Garde Gothic 600 ink-1 `#1A1209`.

#### Variant `service`

Used in: all category feeds (`Coiffeur in Basel`, `Barber in Basel`, etc), `/[city]/[category]` category page, `/search/results` w category filter.

Format: `[Featured Service] · ab CHF [price]`

|condition                                       |row 2 format                                               |
|------------------------------------------------|-----------------------------------------------------------|
|salon has services in section’s category        |`[most-booked service in category] · ab CHF [lowest price]`|
|salon has no services in category but is in feed|`[any service] · ab CHF [price]`                           |
|salon has services but no pricing data          |`[service]` only, no `· ab CHF X`                          |

Typography: Avant Garde Gothic 400 11px, ink-2. Service name plain, `· ab CHF X` plain ink-2 BUT the number `CHF 85` is Avant Garde Gothic 600 ink-1.

### §16.6 · States

|state               |spec                                                                   |
|--------------------|-----------------------------------------------------------------------|
|default             |as specified above                                                     |
|press (on tap)      |`scale(0.94)` 100ms `var(--ease-thud)`                                 |
|hover (desktop only)|`translateY(-1px)` + brighter shadow on photo, 200ms `var(--ease-snap)`|
|focus-visible       |2px brand-teal `#043338` outline, 2px offset, around the entire card |
|loading             |skeleton — see §16.7                                                   |
|heart toggle        |see §16.3                                                              |

Tap card → navigates to `/salon/[slug]`.

### §16.7 · Loading skeleton

|element|skeleton                                                                      |
|-------|------------------------------------------------------------------------------|
|photo  |rounded rect 1:1, bg `#F0EAE0`, left-to-right shimmer (per §5c (skeleton shimmer)) max 2 cycles|
|name   |rect 60% width × 14px height, bg `#E8DFD3`                                    |
|rating |rect 30px × 11px height, right-aligned                                        |
|row 2  |rect 80% width × 11px height                                                  |

Shimmer animation: `linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent)` translates left to right over 1.4s `var(--ease-glide)`, repeats max 2 times.

### §16.7b · Photo handling

|condition                                 |behavior                                                                                                                                                                                                                           |
|------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|salon has photo (≥ 1 uploaded)            |use first/primary photo, displayed as `next/image` with `fill` + `style={{objectFit: 'cover'}}`                                                                                                                                    |
|salon has no photo                        |fallback to category-color tile w salon initials in white Avant Garde Gothic 700 32px centered. category colors per §2 — combo Z `#FFF1DD` (Coiffeur), G `#D8D6CB` (Barbershop), A `#CAE8FF` (Nails), I `#193120` (Spa & Wellness). Initial text color uses the combo text pair (e.g. `#B5345A` cherry on Coiffeur cream). Per V2-D15-3.|
|photo upload is landscape (W > H)         |smart-crop centered (CSS `object-fit: cover` + `object-position: center`)                                                                                                                                                          |
|photo upload is portrait (H > W)          |smart-crop centered, top-aligned (`object-position: 50% 30%`) so faces aren’t cut off                                                                                                                                              |
|photo file size limits (salon-side upload)|min 800×800px, max 4000×4000px, max 5MB, formats: jpg/png/webp                                                                                                                                                                     |
|CDN                                       |Supabase Storage w `next/image` for responsive sizing — request 240px (mobile retina) and 360px (tablet retina) variants                                                                                                           |
|photo loading                             |skeleton shimmer until loaded, fallback to category tile if load fails after 8s                                                                                                                                                    |

### §16.7c · Chain stores (multi-location salons)

When a brand has multiple locations (e.g. `Klipp Tisi - Bahnhof` + `Klipp Tisi - Aeschenplatz`):

|context                      |behavior                                                                                                                                        |
|-----------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
|in feeds                     |each location is its own card. name format: `[Brand] · [Neighborhood]` if neighborhood is short enough to fit, else `[Brand] · [Locality short]`|
|name truncation              |“Klipp Tisi · Bahnhof” wraps to ellipsis if longer than card width — neighborhood is sacrificed first, brand name kept                          |
|same brand on /search/results|locations grouped by brand only when 5+ locations of same brand match query (then we show a “Klipp Tisi (5 Standorte) →” expandable group)      |
|chain logo / branding        |NOT shown on card v1. all visual signals come from photo + name                                                                                 |

### §16.8 · DEFER TO V2

These card variants are NOT built in v1:

- `trust` — line 2 = `[N] Bewertungen`, used in “Top bewertet” feed. Defer until 5+ salons have 50+ reviews (otherwise feed is empty/sparse).
- `joined` — line 2 = `Neu seit [Monat]`, used in “Neu auf Solen” feed. Defer until salon onboarding rate is 5+/month (otherwise feed is stale).

Corresponding homepage feeds also killed for v1: `Top bewertet in Basel`, `Neu auf Solen`.

-----

## §17 · Horizontal scroll row container

The container that holds salon cards in horizontal-scrolling sections.

### §17.1 · Layout

|element                   |spec                                                                                    |
|--------------------------|----------------------------------------------------------------------------------------|
|display                   |flex row                                                                                |
|gap between cards         |`var(--space-3)` (12px)                                                                 |
|padding                   |`0 var(--space-4)` (16px sides) on mobile, `0 var(--space-6)` (24px) on tablet+         |
|overflow-x                |auto                                                                                    |
|overflow-y                |visible (so hover/focus shadows aren’t clipped)                                         |
|scroll-behavior           |smooth                                                                                  |
|-webkit-overflow-scrolling|touch (iOS momentum scroll)                                                             |
|scrollbar                 |hidden (webkit `::-webkit-scrollbar { display: none }`, firefox `scrollbar-width: none`)|

### §17.2 · Scroll snap

|property        |value                                    |
|----------------|-----------------------------------------|
|scroll-snap-type|`x proximity` (NOT mandatory — soft snap)|
|each card       |`scroll-snap-align: start`               |

Reasoning: `proximity` lets user free-scroll without snap fighting them, but snaps gently when scroll velocity slows.

### §17.3 · Edge bleed

Cards extend past page horizontal padding to imply “more offscreen.” Implementation:

- Container has `padding-left: var(--space-4)` matching page padding
- Container has `padding-right: var(--space-4)`
- Last card aligns w right edge of viewport when scrolled to end
- First card aligns w page left padding when scrolled to start

### §17.4 · Cards per row

8-10 cards loaded server-side per row. NOT infinite scroll within the row — user uses “Alle →” link in section header to see more (per §15).

### §17.5 · End-of-scroll

DO NOT add a “View all →” CTA card at the end. The section header “Alle →” link is the only “see more” affordance.

### §17.6 · Empty states

|condition                                                  |behavior                                                                                                                                     |
|-----------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------|
|0 cards in row                                             |hide entire section (header + scroll row disappear)                                                                                          |
|`Empfohlen für dich` w no logged-in user                   |section hidden by default, no placeholder                                                                                                    |
|`Empfohlen für dich` w logged-in user but 0 booking history|section hidden — show generic `Heute frei` instead. v2 may add cold-start recommendations based on city + popular categories.                |
|`Heute frei` w 0 salons free today                         |section title changes to `Diese Woche frei in [city]`, shows next-7-day availability instead. NEVER hide entirely — too important to user UX.|
|API error / fetch failed                                   |show 2-3 skeleton cards + small inline retry link `Erneut laden`                                                                             |
|feed loading                                               |show 3-5 skeleton cards in shimmer state                                                                                                     |
|salon permanently deactivated                              |filtered out at API level, never reaches frontend                                                                                            |
|salon temporarily closed (vacation)                        |INCLUDED in feeds w `Pause bis [date]` badge per §16.3, but ranked lower in sort                                                             |

DO NOT show empty-state copy (“Komm bald, wir lernen deinen Geschmack kennen”) in v1. Just hide the section. v2 may add empty-state UX once recommendation engine is mature.

### §17.7 · Sort order within rows

|section                               |sort order                                                                                              |
|--------------------------------------|--------------------------------------------------------------------------------------------------------|
|`Heute frei in [city]`                |by next-available-time ascending (earliest slots first)                                                 |
|`Empfohlen für dich`                  |by personalization score (logged-in user only)                                                          |
|`Entdecken in [city]`                 |by recency of look upload, mixed w popularity (engagement-weighted)                                     |
|`[Category] in [city]` (Coiffeur, etc)|by mix: 40% rating × 40% bookings-last-30-days × 20% recency joined. salons paused/closed pushed to end.|

Server-side sort. Client never re-sorts.

### §17.8 · Desktop scroll affordance

|breakpoint             |affordance                                                                                                                                                                       |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|mobile + tablet        |swipe only, no arrows                                                                                                                                                            |
|desktop (≥ 1024px)     |when scrollable (cards extend past viewport), show 32px circle arrow buttons left + right of row, glass white bg, ink-1 chevron, fades in on row hover (200ms `var(--ease-snap)`)|
|desktop arrows position|absolute, `top: 50%` of photo (centered vertically with card photos), `left: 8px` and `right: 8px`                                                                               |
|arrow hidden           |when scroll is at start (left arrow) or end (right arrow) — fade out 150ms                                                                                                       |
|arrow tap              |scrolls one card-width forward/back (172px = card width 160 + gap 12)                                                                                                            |
|keyboard nav           |Tab focuses cards individually; Arrow Left/Right scrolls when row has focus                                                                                                      |

-----

## §18 · Entdecken (inspo / look discovery)

A separate content type from salon cards. TikTok-sourced video looks → tap → see which salons in user’s city offer that look → book.

### §18.1 · Homepage presence

Section “Entdecken in Basel →” is a horizontal scroll row, same shape as other sections (per §17). 5-6 cards visible.

Section header per §15. Tap title or `Alle →` → `/entdecken` page.

### §18.2 · Look card

Different from salon card — vertical video tile, not 1:1 photo.

|element     |spec                                                         |
|------------|-------------------------------------------------------------|
|width       |200px (slightly wider than salon card to fit vertical aspect)|
|aspect ratio|varies for masonry — 3:4 short, 3:5 medium, 9:16 tall        |
|radius      |`var(--radius-xl)` (14px)                                    |
|video       |TikTok video, autoplays muted on viewport visibility, loops  |
|poster frame|first frame, shown before video loads                        |

#### Video autoplay performance rules

CRITICAL: do NOT autoplay all videos in viewport at once. This kills mobile battery + crashes low-end devices.

|rule                    |behavior                                                                                                                             |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
|simultaneous video count|max 2 videos playing at any time across entire page                                                                                  |
|start playing trigger   |only when card is fully in viewport (IntersectionObserver `threshold: 1.0`) AND user has stopped scrolling for 200ms                 |
|pause trigger           |card leaves viewport (threshold 0.5), user scrolls fast (scroll velocity > 800 px/s), or another card starts playing (replace oldest)|
|data saver mode         |check `navigator.connection.saveData` — if true, never autoplay, show poster + tappable play button                                  |
|reduce-motion preference|check `prefers-reduced-motion: reduce` — same as data saver: poster only                                                             |
|audio                   |always muted by default, can NOT be unmuted in feed view (only in look-detail sheet §18.4)                                           |
|sound icon (in feed)    |NOT shown — videos are silent in feed by design                                                                                      |
|mobile data warning     |NOT shown — autoplay is silent so data usage is comparable to GIFs                                                                   |

#### Look card overlays

|element                   |spec                                                                                                                                                |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|source pill (top-left)    |format `[Category] · [Source]` (e.g. `Hair · TikTok`). Bg gold `rgba(4,51,56,.85)` w blur, ink-1 text, Avant Garde Gothic 700 10px                      |
|heart icon (top-right)    |same as salon card (28px glass)                                                                                                                     |
|bookmark icon             |28px glass, Lucide `bookmark` 14px ink-1, positioned 4px left of heart — saves to “Mein Look” board (see §18.5)                                     |
|play indicator (centered) |40px coral circle `#043338`, white play arrow, only visible when video paused or before play                                                        |
|service name pill (bottom)|bg glass white `rgba(255,255,255,.85)` w blur, ink-1 text, Avant Garde Gothic 600 12px, truncated w ellipsis, position `bottom: 8px; left: 8px; right: 8px`|

### §18.3 · /entdecken page

Pinterest-style masonry feed:

|element        |spec                                                                     |
|---------------|-------------------------------------------------------------------------|
|layout         |CSS columns (multi-column) for masonry                                   |
|column count   |2 mobile / 3 tablet / 4 desktop                                          |
|column gap     |`var(--space-3)` (12px)                                                  |
|infinite scroll|yes — load 20 looks per page, fetch more on scroll within 200px of bottom|
|skeleton state |rectangles in masonry pattern w shimmer                                  |

### §18.4 · Look-detail sheet (tap card)

Opens fullscreen sheet (mobile) or centered modal (desktop). NOT a navigation — sheet over current page, dismissible to return.

#### Dismiss behavior

|trigger                          |behavior                                                                         |
|---------------------------------|---------------------------------------------------------------------------------|
|close X tap                      |dismiss, video pauses                                                            |
|swipe down (mobile, top of sheet)|dismiss when swipe distance > 80px AND velocity > 200 px/s                       |
|swipe down on video              |NOT dismissable from video area (user might scrub) — only from sheet header/edges|
|Esc key (desktop)                |dismiss                                                                          |
|backdrop tap (desktop)           |dismiss                                                                          |
|browser back button              |dismiss (use `history.pushState` to capture back nav)                            |

#### Audio in detail sheet

|state             |behavior                                                                                                    |
|------------------|------------------------------------------------------------------------------------------------------------|
|sheet opens       |video autoplays w SOUND ON if user has previously unmuted any look in this session, else muted              |
|mute/unmute toggle|top-right of video, 28px circle glass button, Lucide `volume-2` (unmuted) / `volume-x` (muted), ink-1 stroke|
|session preference|stored in `sessionStorage` as `solen_entdecken_audio` — persists tab session, resets on new tab             |

#### Anatomy

```
[× close]            [♥] [⚓] [↗ share]

  ┌───────────────┐
  │ TikTok video  │
  │ autoplay loop │
  │ full size     │
  └───────────────┘

  Hair · TikTok · @creator
  Textured Shaggy Bob

  Verfügbar bei [N] Salons in [city]:
  ┌──────────────────────────────────┐
  │ [photo] Salon Crémant · 4.8 ⭐    │
  │ Schnitt + Föhnen · CHF 85         │
  │ Heute verfügbar 14:30 →           │
  └──────────────────────────────────┘
  ...

  ━━━━━━ sticky bottom CTA ━━━━━━
  [Buche diesen Look →]
```

|element                 |spec                                                                                                                                                                                  |
|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|close X                 |top-left                                                                                                                                                                              |
|heart / bookmark / share|top-right (3 icons in row, 8px gap)                                                                                                                                                   |
|video container         |16:9 max, centered, padding `var(--space-4)`                                                                                                                                          |
|meta line               |`[Category] · [Source] · @creator` (Avant Garde Gothic 500 12px ink-2)                                                                                                                       |
|look name               |Avant Garde Gothic 700 22px ink-1, `-0.025em`                                                                                                                                                  |
|salon list header       |Avant Garde Gothic 600 13px ink-2: `Verfügbar bei [N] Salons in [city]:`                                                                                                                     |
|salon row               |mini horizontal card: photo 64px circle, name + rating, service + price, availability + arrow                                                                                         |
|sticky bottom CTA       |`Buche diesen Look →` (button bg brand-teal gradient) — when tapped, picks salon (auto-picks top one or shows picker if user hasn’t tapped a salon row), navigates to booking wizard|

### §18.5 · Heart vs Bookmark

|action  |behavior                                                                                                                                                                               |
|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|heart   |private like — saved to user’s `Likes` list (single flat list, no organization). Visible only to user. Tap heart again to unlike.                                                      |
|bookmark|save to a “Mein Look” board (collection). User can have multiple boards (e.g. Hair / Nails / Sommer-Inspo). On tap: shows board picker sheet — select existing board or create new one.|

Both states visible simultaneously on a card (a look can be both liked AND bookmarked). Bookmark icon shows filled brand-teal when at least one board contains the look.

### §18.5b · No salons match the look

|condition                                                              |sheet behavior                                                                                                                         |
|-----------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
|0 salons in user’s current city offer this service                     |section header changes to `Andere Städte:` and shows salons from other cities. CTA copy: `Buche in einer anderen Stadt →`              |
|0 salons anywhere offer this service yet                               |section becomes notice card: `Dieser Look ist neu auf Solen — bald verfügbar.` w heart-it CTA `Speichere ihn, wir benachrichtigen dich`|
|salons match service category but none have today/tomorrow availability|section header still shows salons, CTA shows next-available date per salon                                                             |

### §18.6 · TikTok ToS compliance flag

Implementation note for backend: ingestion method must comply w TikTok’s Terms of Service. Verify current method (partner-uploaded vs official API vs scraping) before scaling. Document chosen method in repo `docs/tiktok-integration.md`.

-----

## §19 · City tiles (Solen in deiner Stadt)

Section that lets user switch which city’s homepage they’re seeing. Sits between category feeds and b2b card on homepage.

### §19.1 · Anatomy

```
[Solen in deiner Stadt]                        [Alle →]
─────────────────────────────────────────────────────────
[ tile · Basel · Aktuell ] [ tile · Zürich ] [ tile · Bern ]
```

### §19.2 · Section header

|element            |spec                                       |
|-------------------|-------------------------------------------|
|title              |`Solen in deiner Stadt`                    |
|Alle link          |`Alle →` → `/staedte` (city directory page)|
|follows §15 pattern|yes                                        |

### §19.3 · Tile container

Horizontal scroll row, same pattern as §17.

### §19.4 · Tile dimensions

|element     |spec                                           |
|------------|-----------------------------------------------|
|width       |220px                                          |
|aspect ratio|4:3 (landscape — distinct from 1:1 salon cards)|
|radius      |`var(--radius-2xl)` (16px)                     |
|overflow    |hidden                                         |

### §19.5 · Tile content (D · custom illustration when available, solid color fallback v1)

#### v1 fallback (no illustration available)

|element           |spec                                                                        |
|------------------|----------------------------------------------------------------------------|
|bg                |brand-teal gradient (V2-D15-3: cities share brand teal, no per-city accent — Yuh discipline):|
|                  |Basel: `linear-gradient(160deg, #0A6873 0%, #043338 100%)` (brand teal)      |
|                  |Zürich: `linear-gradient(160deg, #0A6873 0%, #043338 100%)` (brand teal)     |
|                  |Bern: `linear-gradient(160deg, #0A6873 0%, #043338 100%)` (brand teal)       |
|highlight gradient|`linear-gradient(180deg, rgba(255,255,255,.22) 0%, transparent 50%)` overlay|
|city name         |Avant Garde Gothic 700 22px white, `-0.025em`, line-height 1                         |
|city meta         |Avant Garde Gothic 500 11px `rgba(255,255,255,.85)` — `[N] Salons`                 |
|icon              |22px Lucide `map-pin`, `rgba(255,255,255,.95)`, top-left of content area    |
|content padding   |14px                                                                        |
|content layout    |flex column, justify-between (icon top, name+meta bottom)                   |

#### v1.5 / v2 — custom illustration

When illustration assets land, swap fallback for SVG illustration on `bg: linear-gradient(180deg, #FBF8F3 0%, #F0E6D6 100%)` w 1px ink `.06` border.

|element               |spec                                                                                       |
|----------------------|-------------------------------------------------------------------------------------------|
|illustration container|absolute, inset 0, z-index 0, flex center align                                            |
|illustration          |SVG, viewBox `0 0 200 100`, max 80% width × 80% height, max-height 140px, max-width 200px  |
|illustration color    |brand-teal `#043338` w opacity 0.85                                                      |
|city name             |Avant Garde Gothic 700 20px ink-1 `#1A1209`                                                         |
|city meta             |Avant Garde Gothic 500 10px ink-2 `#7A6957` — `[N] Salons · [Landmark]` (e.g. `47 Salons · Rhein`)|

#### Illustration commission spec

For when illustrations are commissioned:

|element     |spec                                                                                                                   |
|------------|-----------------------------------------------------------------------------------------------------------------------|
|format      |SVG, single file per city                                                                                              |
|viewBox     |`0 0 200 100` (4:3 ratio compatible)                                                                                   |
|stroke width|1.8px                                                                                                                  |
|stroke color|`currentColor` (so we can color-tint per tile)                                                                         |
|stroke caps |round                                                                                                                  |
|stroke joins|round                                                                                                                  |
|fill        |none (line-only illustration)                                                                                          |
|max paths   |4-6 path elements per illustration                                                                                     |
|style       |monoline, single-stroke, slight imperfection allowed                                                                   |
|subjects    |Basel: Münster + Rhein bend / Zürich: lake + Grossmünster / Bern: Aare bend + Zytglogge / future cities: local landmark|
|budget guide|CHF 200-500 for set of 3 (Fiverr/Upwork) or CHF 1000-2000 (swiss illustrator)                                          |

### §19.6 · “Aktuell” badge on current city

|element                        |spec                                                                                                                           |
|-------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
|visible on                     |the tile matching the user’s currently-selected city (the one in header pill)                                                  |
|visibility when no city set yet|hidden — first cold visit shows no Aktuell badge (city pill defaults to Basel via IP, but no badge until user actively engages)|
|position                       |`top: 10px; left: 10px;`                                                                                                       |
|copy                           |`Aktuell`                                                                                                                      |
|typography                     |Avant Garde Gothic 700 9px, letter-spacing 0.04em                                                                                     |
|dot                            |5px brand-teal `#043338`, before text, 4px gap                                                                               |
|bg                             |`rgba(255,255,255,.85)` w `backdrop-filter: blur(8px) saturate(1)`                                                           |
|color                          |ink-1 `#1A1209`                                                                                                                |
|padding                        |`4px 8px`                                                                                                                      |
|radius                         |`var(--radius-pill)` (99px)                                                                                                    |
|z-index                        |3 (above overlay, above content)                                                                                               |
|aria-label                     |`Aktuelle Stadt`                                                                                                               |

### §19.7 · Tile order

Current city always first, then by salon supply (descending). For v1: `[current city] · Zürich · Basel · Bern` (excluding current from list).

If current city IS Zürich: `Zürich · Basel · Bern`. If current is Basel: `Basel · Zürich · Bern`. If Bern: `Bern · Zürich · Basel`.

### §19.8 · Tap behavior

Tap tile → navigates to `/[city]` (e.g. `/zurich`).

The `/[city]` page in v1 = same homepage layout but city-filtered, w that city set in header pill. v2 may add city-specific content (neighborhood breakdown, popular categories per city).

### §19.8b · Non-v1 city handling

If user deep-links to a city not in v1 (e.g. `/genf`, `/luzern`, `/lausanne`):

|condition                               |behavior                                                                                                                                                                     |
|----------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|city slug exists in DB but no salons yet|render homepage layout w hero counter `Solen kommt bald nach [City]` + waitlist CTA `Benachrichtige mich` (email signup), feeds replaced w “Andere Städte” recommendation row|
|city slug NOT in DB                     |404 — `Diese Stadt gibt es bei uns noch nicht` w link back to `/` and link to nearest city in v1                                                                             |
|city has only 1-3 salons                |render normally — salons shown even if sparse (no minimum count to display a city)                                                                                           |

### §19.9 · States

|state          |spec                                       |
|---------------|-------------------------------------------|
|default        |as specified                               |
|hover (desktop)|`translateY(-2px)` 200ms `var(--ease-snap)`|
|press          |`scale(0.97)` 100ms `var(--ease-thud)`     |
|focus-visible  |2px brand-teal outline, 2px offset       |

-----

## §20 · B2B promo card

Single full-width card on consumer homepage encouraging salon owners to join.

### §20.1 · Position

In homepage flow: after city tiles, before SEO link wall + footer.

Shown on:

- `/` (root homepage)
- `/[city]` (every city homepage — same card, same copy)

Not shown on:

- `/[city]/[category]` (category pages — too deep into consumer flow)
- `/salon/[slug]` (salon detail)
- `/entdecken`, `/staedte`, `/search`, `/business*`
- any logged-in salon-side pages (when v2 adds them)

### §20.2 · Visibility

|condition                         |shown?                                         |
|----------------------------------|-----------------------------------------------|
|user has not dismissed            |yes                                            |
|user dismissed within last 30 days|hidden                                         |
|logged-in salon owner             |DEFER TO V2 — for v1, always shown to all users|

Dismiss persistence: cookie `solen_b2b_dismissed_until=<timestamp>`. On render, check timestamp; if `Date.now() < timestamp`, hide card. Timestamp = `Date.now() + 30 * 24 * 3600 * 1000` (30 days from dismiss action).

### §20.3 · Visual style — peach gradient

|element                 |spec                                                                                                 |
|------------------------|-----------------------------------------------------------------------------------------------------|
|bg                      |`linear-gradient(160deg, #E1F4F4 0%, #FBC9A8 100%)`                                                  |
|border                  |1px `rgba(4,51,56,.12)`                                                                           |
|radius                  |`var(--radius-3xl)` (20px)                                                                           |
|padding                 |`22px 24px`                                                                                          |
|shadow                  |`inset 0 1px 0 rgba(255,255,255,.6), 0 1px 2px rgba(4,51,56,.1), 0 16px 32px rgba(4,51,56,.18)`|
|margin (page horizontal)|matches page padding                                                                                 |

### §20.4 · Decorative blobs

Two blurred decorative blobs for warmth (per §5d emphasis pattern):

|blob                |spec                                                                                                           |
|--------------------|---------------------------------------------------------------------------------------------------------------|
|blob 1 (top-right)  |220px circle, bg `rgba(4,51,56,.5)`, filter `blur(40px)`, position `top: -60px; right: -60px;`, z-index 0   |
|blob 2 (bottom-left)|220px circle, bg `rgba(255,255,255,.5)`, filter `blur(40px)`, position `bottom: -80px; left: -40px;`, z-index 0|

### §20.5 · Content (z-index 2 above blobs)

```
FÜR SALONS                                              [×]
Solen für dein Studio.
Mehr Termine, weniger Anrufe.

Beauty + Wellness Buchungen direkt online.
Du behältst deinen Kalender, wir bringen dir die Kund:innen.

[Mehr erfahren →]    Schon Partner?
```

|element             |spec                                                                                                                                                                                   |
|--------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|eyebrow `FÜR SALONS`|Avant Garde Gothic 700 9px, brand-teal `#043338`, letter-spacing 0.22em, uppercase, margin-bottom 8px                                                                                       |
|heading             |`Solen für dein Studio.` (line 1), `Mehr Termine, weniger Anrufe.` (line 2) — Avant Garde Gothic 700 24px, `-0.025em`, line-height 1.05, ink-1 `#1A1209`, margin-bottom 4px                     |
|sub-text            |`Beauty + Wellness Buchungen direkt online. Du behältst deinen Kalender, wir bringen dir die Kund:innen.` — Avant Garde Gothic 400 13px, line-height 1.45, ink-2 `#56463E`, margin-bottom 16px|
|primary CTA         |`Mehr erfahren →` (button)                                                                                                                                                             |
|secondary link      |`Schon Partner?` (text link)                                                                                                                                                           |

### §20.6 · Primary CTA

|element   |spec                                                                                                       |
|----------|-----------------------------------------------------------------------------------------------------------|
|copy      |`Mehr erfahren →` (Lucide `arrow-right` 12px after text, 6px gap)                                          |
|bg        |ink-1 `#1A1209` (NOT brand-teal — contrast against peach)                                                |
|color     |white                                                                                                      |
|typography|Avant Garde Gothic 700 13px                                                                                       |
|radius    |`var(--radius-pill)` (99px)                                                                                |
|padding   |`11px 18px`                                                                                                |
|shadow    |`inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(0,0,0,.1)`                                            |
|hover     |`translateY(-1px)` + magnetic arrow flourish (gap 6→10px, arrow `translateX(2px)`) 200ms `var(--ease-snap)`|
|tap       |`/business`                                                                                                |

### §20.7 · Secondary link

|element    |spec                                                     |
|-----------|---------------------------------------------------------|
|copy       |`Schon Partner?`                                         |
|typography |Avant Garde Gothic 500 12px ink-2 `#043338`                     |
|decoration |`text-decoration: underline; text-underline-offset: 3px;`|
|margin-left|14px (inline w CTA, on same row)                         |
|tap        |`/business/login`                                        |

### §20.8 · Dismiss X

|element   |spec                                                                               |
|----------|-----------------------------------------------------------------------------------|
|position  |`top: 12px; right: 12px;` (z-index 3)                                              |
|size      |24px hit, 14px Lucide `x` icon, stroke-width 2.5                                   |
|color     |ink-2 `#56463E`                                                                    |
|bg        |transparent                                                                        |
|hover bg  |`rgba(26,18,9,.06)` 150ms                                                          |
|radius    |`var(--radius-pill)` (99px)                                                        |
|aria-label|`Schliessen`                                                                       |
|tap       |sets cookie `solen_b2b_dismissed_until=Date.now() + 30*86400000`, animates card out|

#### Dismiss animation sequence

1. card opacity 1 → 0 over 200ms `var(--ease-snap)`
1. card scale 1 → 0.95 simultaneously
1. card height max-height 1000px → 0px over additional 200ms `var(--ease-snap)` (collapses smoothly so footer rises up, no jump)
1. margin/padding collapses w max-height
1. element removed from DOM after 400ms total

Use `overflow: hidden` on the wrapper during animation to clip content cleanly.

-----

## §21 · Footer

Dark register. Sprout glyph lives here (footer-only). 4-column link grid.

### §21.1 · Container

|element             |spec                                               |
|--------------------|---------------------------------------------------|
|bg                  |`linear-gradient(180deg, #1A1209 0%, #0F0805 100%)`|
|color (default text)|`rgba(255,255,255,.78)`                            |
|padding (mobile)    |`36px 16px 20px`                                   |
|padding (tablet+)   |`48px 32px 24px`                                   |

### §21.2 · Decorative glow

Radial brand-teal glow in top-right, anchors warm tone:

|element       |spec                                                            |
|--------------|----------------------------------------------------------------|
|position      |`top: -100px; right: -100px;`                                   |
|size          |320px × 320px                                                   |
|bg            |`radial-gradient(circle, rgba(4,51,56,.18), transparent 70%)`|
|filter        |`blur(40px)`                                                    |
|z-index       |0 (behind content)                                              |
|pointer-events|none                                                            |

### §21.3 · Brand block (top of footer, before columns)

```
[🌱] solen
Die Schweizer Salon-Plattform.
Buche Beauty + Wellness in Basel, Zürich, Bern.

[ DE ] [EN] [FR] [IT]
```

|element                  |spec                                                                                                                                                |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
|sprout                   |28px, brand-teal `#043338`, stroke-width 1.8px, fill none, round caps + joins. SVG paths: stem (vertical line) + 2 sprouting leaves on either side|
|wordmark                 |Avant Garde Gothic 700 22px white, `-0.03em`                                                                                                                 |
|brand row gap            |10px between sprout and wordmark                                                                                                                    |
|tagline                  |Avant Garde Gothic 400 12px `rgba(255,255,255,.6)`, line-height 1.5, max-width 280px                                                                       |
|tagline copy             |`Die Schweizer Salon-Plattform. Buche Beauty + Wellness in Basel, Zürich, Bern.`                                                                    |
|brand block margin-bottom|28px                                                                                                                                                |

### §21.4 · Language switcher

|element                |spec                                                                              |
|-----------------------|----------------------------------------------------------------------------------|
|layout                 |inline pill row, 4 buttons: `DE` `EN` `FR` `IT`                                   |
|container bg           |`rgba(255,255,255,.05)`                                                           |
|container border       |1px `rgba(255,255,255,.08)`                                                       |
|container padding      |4px                                                                               |
|container radius       |`var(--radius-pill)` (99px)                                                       |
|margin-top from tagline|14px                                                                              |
|button typography      |Avant Garde Gothic 600 11px, letter-spacing 0.02em                                       |
|button padding         |`5px 11px`                                                                        |
|button radius          |`var(--radius-pill)`                                                              |
|inactive button        |bg transparent, color `rgba(255,255,255,.55)`                                     |
|active button          |bg `rgba(255,255,255,.95)` (white), color ink-1 `#1A1209`                         |
|transition             |bg + color 150ms `var(--ease-snap)`                                               |
|aria-label per button  |`Sprache: Deutsch` / `Language: English` / `Langue: Français` / `Lingua: Italiano`|
|aria-pressed           |`true` on active button, `false` on others                                        |

#### Language routing

Use Next.js i18n routing w URL-prefixed locales (NOT query strings, NOT cookie-only).

|current URL                            |tap `EN` →                           |
|---------------------------------------|-------------------------------------|
|`/`                                    |`/en`                                |
|`/basel`                               |`/en/basel`                          |
|`/basel/coiffeur`                      |`/en/basel/coiffeur`                 |
|`/de/basel/coiffeur` (already prefixed)|`/en/basel/coiffeur` (replace prefix)|
|`/entdecken`                           |`/en/entdecken`                      |
|`/salon/cremant`                       |`/en/salon/cremant`                  |

Default locale is `de` and is NOT URL-prefixed (`/basel` instead of `/de/basel`) — German speakers shouldn’t see `/de/` clutter. EN/FR/IT all get prefix.

Cookie `solen_locale` updated on every switch — used as fallback for cold visits when geo can’t determine.

DO NOT: dropdown style. DO NOT: flag icons. DO NOT: written language names (“Deutsch”, “English”) — abbreviations only.

### §21.5 · 4-column link grid

|column     |links                                                                |
|-----------|---------------------------------------------------------------------|
|Solen      |Über uns · Karriere · Press · Kontakt · Blog                         |
|Entdecken  |Alle Salons · Coiffeur · Barber · Nails · Spa & Wellness · Heute frei|
|Für Salons |Werde Partner · Pricing · Salon-Login · Hilfe für Salons             |
|Rechtliches|AGB · Datenschutz · Impressum · Cookies                              |

#### Column layout

|breakpoint         |columns                                                                    |
|-------------------|---------------------------------------------------------------------------|
|desktop (≥ 1024px) |4 equal cols, 32px gap                                                     |
|tablet (768-1023px)|4 equal cols, 24px gap                                                     |
|mobile (380-767px) |2 col grid, 28px row gap × 24px col gap, brand block stays full width above|
|tiny (< 380px)     |1 col, all stacked                                                         |

#### Column header

|element      |spec                                |
|-------------|------------------------------------|
|typography   |Avant Garde Gothic 700 12px white, `-0.005em`|
|margin-bottom|10px                                |

#### Column link

|element    |spec                  |
|-----------|----------------------|
|display    |block                 |
|typography |Avant Garde Gothic 400 12px  |
|color      |`rgba(255,255,255,.6)`|
|color hover|`#fff`                |
|padding    |4px 0                 |
|line-height|1.5                   |
|transition |color 150ms           |

### §21.6 · Bottom strip

```
© 2026 Solen GmbH                            🇨🇭 Made in Basel
```

|element      |spec                                                                                                                            |
|-------------|--------------------------------------------------------------------------------------------------------------------------------|
|margin-top   |36px                                                                                                                            |
|padding-top  |20px                                                                                                                            |
|border-top   |`1px rgba(255,255,255,.08)`                                                                                                     |
|layout       |flex row, justify-between, align-center, flex-wrap, gap 16px                                                                    |
|copyright    |Avant Garde Gothic 400 11px `rgba(255,255,255,.45)` — `© 2026 Solen GmbH`                                                              |
|Made in Basel|inline-flex, 6px gap. Swiss flag = filled brand-teal `#043338` 11px square. Text Avant Garde Gothic 400 11px `rgba(255,255,255,.45)`.|

### §21.7 · NO social media in v1

DO NOT add Instagram / TikTok / LinkedIn / Twitter icons. Add only when accounts exist + are actively maintained.

### §21.8 · Drop nonexistent links

If `Über uns` / `Karriere` / `Press` / `Blog` pages don’t exist yet at v1 launch, drop those line items from the column. Column shrinks naturally. DO NOT link to placeholder / coming-soon pages.

-----

## §22 · Browse-by-city SEO link wall (Salons nach Stadt)

Pure SEO content. Sits between b2b card and footer. Generates unique `/[city]/[category]` URL surface for google.

### §22.1 · Layout

```
Salons nach Stadt
Finde Beauty + Wellness Salons in der ganzen Schweiz —
nach Stadt und Kategorie.

Coiffeur          in Basel · in Zürich · in Bern
Barbershop        in Basel · in Zürich · in Bern
Nails             in Basel · in Zürich · in Bern
Spa & Wellness    in Basel · in Zürich · in Bern
```

### §22.2 · Section title

|element      |spec                                               |
|-------------|---------------------------------------------------|
|copy         |`Salons nach Stadt`                                |
|typography   |Avant Garde Gothic 700 20px ink-1, `-0.025em`, line-height 1|
|margin-bottom|6px                                                |
|tag          |`<h2>` (semantic, for SEO)                         |

### §22.3 · Intro line

|element      |spec                                                                              |
|-------------|----------------------------------------------------------------------------------|
|copy         |`Finde Beauty + Wellness Salons in der ganzen Schweiz — nach Stadt und Kategorie.`|
|typography   |Avant Garde Gothic 400 12px, ink-2 `#56463E`, line-height 1.5                            |
|max-width    |540px                                                                             |
|margin-bottom|20px                                                                              |

### §22.4 · Layout style — grouped by category

Each category is a row. City links separated by middle dots within each row.

```
Coiffeur · in Basel · in Zürich · in Bern
```

|element                        |spec                                                                                       |
|-------------------------------|-------------------------------------------------------------------------------------------|
|row layout                     |flex row, flex-wrap, baseline align                                                        |
|row gap (vertical between rows)|10px                                                                                       |
|line-height                    |1.7 (for natural wrapping)                                                                 |
|category name                  |Avant Garde Gothic 700 13px ink-1, `-0.005em`, margin-right 8px, flex-shrink 0                      |
|city link                      |Avant Garde Gothic 400 12px ink-2 `#56463E`, padding `0 8px`, border-right `1px rgba(26,18,9,.12)`|
|last link in row               |no border-right                                                                            |
|`<strong>` tag                 |wraps city name only (NOT “in”), Avant Garde Gothic 600 ink-1                                     |
|link hover                     |color → brand-teal `#043338`, no underline                                               |
|transition                     |color 150ms                                                                                |

### §22.5 · Categories included v1

In order (V2-D15-3 lock — 4 categories):

1. Coiffeur
1. Barbershop
1. Nails
1. Spa & Wellness

(Same 4 categories as homepage feeds. Makeup retired, Wellness merged into Spa.)

### §22.6 · Cities included v1

In order: Basel, Zürich, Bern.

When new cities launch, append to each row in onboard order. When 6+ cities exist, rows may need their own header line + dot-separated cities below — defer that decision until 6+ cities exist.

#### Current-city handling

ALL city links shown regardless of which city user is currently on. Reasoning:

- SEO benefits from rendering all internal links on every page render (Google crawls the wall on every page)
- the user-facing Aktuell badge from §19 is enough current-state indicator above the wall
- removing the user’s current city would lose the page’s link to itself (which Google uses for canonical signaling)

Instead, the link to the current city in this wall should still render but with `aria-current="page"` and an underline style indicating “you’re here.” NOT bolded, NOT colored differently — same visual weight as other links.

### §22.7 · Total link count

**4 categories × 3 cities = 12 unique links in v1** (V2-D15-3). Each link's URL: `/[city-slug]/[category-slug]` (matches §15.5 URL convention).

### §22.8 · Section padding

|breakpoint|padding    |
|----------|-----------|
|mobile    |`36px 16px`|
|tablet+   |`36px 24px`|

### §22.9 · Always visible

DO NOT add expand/collapse. The 18 links are all visible at all breakpoints.

When cities scale to 8+, reconsider — but for v1, always visible is locked.

### §22.10 · DO NOT

- DO NOT use pills/buttons for each link — plain text with separators only
- DO NOT use icons next to category names
- DO NOT add a CTA at the end (“Alle Städte zeigen →”) — already shown
- DO NOT animate hover beyond color change

-----

## §23 · Final v1 homepage flow

Locked component order on `/` (or `/[city]` city homepage):

```
1. [header]                     §12
   solen + Basel ▾ + bell + avatar

2. [hero]                       §13
   counter pill · greeting · stacked search · dynamic chips

3. [Heute frei in Basel →]      §15 + §16 (variant: availability)
4. [Empfohlen für dich →]       §15 + §16 (variant: availability) — logged-in only
5. [Entdecken in Basel →]       §15 + §18

6. [Coiffeur in Basel →]        §15 + §16 (variant: service)
7. [Barbershop in Basel →]      §15 + §16 (variant: service)
8. [Nails in Basel →]           §15 + §16 (variant: service)
9. [Spa & Wellness in Basel →]  §15 + §16 (variant: service)

10. [Solen in deiner Stadt]     §19
11. [B2B card]                  §20
12. [Salons nach Stadt]         §22
13. [Footer]                    §21
```

### §23.1 · Sections killed for v1 (re-add in v2)

- ❌ “Top bewertet in Basel” (requires `trust` card variant — see §16.8)
- ❌ “Neu auf Solen” (requires `joined` card variant — see §16.8)
- ❌ Category grid on homepage (replaced by per-category horizontal feeds)

### §23.2 · Total scroll depth (mobile estimate)

|section                                  |est. height                                                       |
|-----------------------------------------|------------------------------------------------------------------|
|header                                   |56px (sticky, not counted in scroll)                              |
|hero                                     |~440px                                                            |
|feed sections (×9 horizontal scroll rows)|~340px each = ~3060px                                             |
|city tiles                               |~250px                                                            |
|b2b card                                 |~240px                                                            |
|seo link wall                            |~280px                                                            |
|footer                                   |~440px                                                            |
|**total**                                |**~4710px** (~6.7 viewports on iPhone 14 Pro Max @ 700px viewport)|

Average user scrolls 60-70% per fresha analytics — entire flow optimized for engagement to depth, not depth to engagement.

-----

## §24b · Accessibility baseline

These rules apply globally to every component in §12-§22.

### §24b.1 · Required aria attributes per component type

|component type                                                           |required attrs                                              |
|-------------------------------------------------------------------------|------------------------------------------------------------|
|icon-only buttons (heart, bookmark, bell, dismiss X, lang buttons)       |`aria-label` w descriptive German text                      |
|toggle buttons (heart, bookmark, lang)                                   |`aria-pressed` reflecting state                             |
|disclosure buttons (city pill, avatar, sort dropdowns)                   |`aria-expanded`, `aria-haspopup`                            |
|current-state indicators (Aktuell badge, lang current, current page link)|`aria-current="page"` or `aria-current="true"`              |
|live regions (counter pill, search count CTA)                            |`aria-live="polite"` for non-urgent updates                 |
|modal dialogs (city dropdown, look-detail sheet, search page)            |`role="dialog"`, `aria-modal="true"`, focus trap, Esc closes|
|search inputs                                                            |`role="searchbox"`, `aria-label` w placeholder context      |

### §24b.2 · Focus management

|event                                |behavior                                                                      |
|-------------------------------------|------------------------------------------------------------------------------|
|modal/sheet opens                    |focus moves to first focusable element (close X if no input, else first input)|
|modal/sheet closes                   |focus returns to triggering element                                           |
|keyboard nav in horizontal scroll row|Tab focuses each card; Arrow Left/Right scrolls 1 card-width                  |
|skip-to-main link                    |hidden by default, visible on Tab from page top, jumps to `<main>` content    |

### §24b.3 · Reduced motion

When `prefers-reduced-motion: reduce`:

- pulse animations on dots (badges, counter pill) disabled — show static dot
- shimmer loading skeletons disabled — show static `#E8DFD3` rect
- magnetic arrow flourishes disabled — show static gap
- card press scale disabled
- entdecken video autoplay disabled (per §18.2)

DO disable animation, DO NOT disable functional state changes (color shifts, opacity changes for visibility) — those convey info.

### §24b.4 · Color contrast minimums

All text-on-bg combinations MUST meet WCAG AA:

- normal text (< 18px): contrast ≥ 4.5:1
- large text (≥ 18px or 14px bold): contrast ≥ 3:1

Already-locked safe pairings:

- ink-1 `#1A1209` on white `#FFFFFF` = 16.8:1 ✓
- ink-2 `#56463E` on white = 8.4:1 ✓
- ink-3 `#7A6957` on white = 5.0:1 ✓
- white on ink-1 = 16.8:1 ✓
- brand-teal `#043338` on white = **14.74:1** ✓ AAA — body-safe at any size, no text-deep variant needed (orange-era 3.34:1 retired V2-D15-3)
- white on brand-teal `#043338` = 14.74:1 ✓ AAA (same ratio, symmetric)
- pale teal `#C2F0F1` on brand-teal `#043338` = 11.09:1 ✓ AAA — Republik panel #4 exact pair (text-on-saturated-brand-panel)

**V3 category combo contrasts (text on combo bg, Republik exact pairs):**
- Coiffeur Z: cherry `#B5345A` on cream `#FFF1DD` = 5.24:1 ✓ AA
- Barbershop G: black `#000000` on bone `#D8D6CB` = 14.40:1 ✓ AAA
- Nails A: magenta `#B50051` on pale ice blue `#CAE8FF` = 5.35:1 ✓ AA
- Spa & Wellness I: sandy beige `#948565` on forest `#193120` = 3.86:1 ✓ AA-large (display headlines only, sub-text reads at AA-large minimum)

**On-white contrasts (for category-color text on white substrate, e.g., breadcrumb-current OUTSIDE the saturated panel):**
- Cherry `#B5345A` on white = 5.55:1 ✓ AA body
- Black `#000000` on white = 21:1 ✓ AAA
- Magenta `#B50051` on white = 8.97:1 ✓ AAA
- Sandy beige `#948565` on white = 3.34:1 — large text only — use forest `#193120` 14.49:1 for body-size
- Forest `#193120` on white = 14.49:1 ✓ AAA

DO NOT use combo bg colors (cream/bone/pale ice blue/forest) directly for text on white — they're substrate hues. Use combo TEXT colors for category-tinted text on white.

### §24b.5 · Keyboard support

Every interactive element MUST be reachable + actionable via keyboard:

- Tab navigation order matches visual order
- Enter/Space activates buttons
- Escape closes modals and dismissable overlays
- Arrow keys scroll horizontal scroll rows when row is focused
- Calendar grid (search WANN state): Arrow keys navigate dates, Enter selects

-----

## §24c · Analytics events (PostHog)

Event tracking is required for unit-economics + funnel analysis.

### §24c.1 · Event naming convention

Format: `[surface]_[object]_[action]` — all lowercase snake_case.

Examples: `home_card_viewed`, `search_submitted`, `b2b_dismissed`, `entdecken_look_opened`.

### §24c.2 · Required events for v1 homepage

|event                            |when                                                       |properties                                                         |
|---------------------------------|-----------------------------------------------------------|-------------------------------------------------------------------|
|`home_viewed`                    |homepage renders                                           |`city`, `is_logged_in`, `referrer`                                 |
|`home_counter_pill_viewed`       |counter pill becomes visible                               |`city`, `count`                                                    |
|`home_chip_tapped`               |quick chip tapped                                          |`city`, `chip_key`, `position`                                     |
|`home_search_opened`             |search bar tapped (any row)                                |`city`, `row_focused`                                              |
|`home_card_viewed`               |salon card enters viewport                                 |`salon_id`, `section`, `position`, `variant` (availability/service)|
|`home_card_tapped`               |salon card tapped                                          |`salon_id`, `section`, `position`                                  |
|`home_card_heart_toggled`        |heart tapped on card                                       |`salon_id`, `state` (saved/unsaved), `section`                     |
|`home_section_viewed`            |section header enters viewport                             |`section_key`, `card_count`                                        |
|`home_section_alle_tapped`       |“Alle →” link tapped                                       |`section_key`, `target_url`                                        |
|`home_city_pill_opened`          |city pill in header tapped                                 |`current_city`                                                     |
|`home_city_changed`              |new city selected from dropdown                            |`from_city`, `to_city`                                             |
|`home_city_tile_tapped`          |city tile in “Solen in deiner Stadt” tapped                |`from_city`, `to_city`                                             |
|`home_b2b_viewed`                |b2b card enters viewport                                   |`is_dismissed_history`                                             |
|`home_b2b_dismissed`             |b2b dismiss X tapped                                       |—                                                                  |
|`home_b2b_cta_tapped`            |b2b “Mehr erfahren” tapped                                 |—                                                                  |
|`home_b2b_link_tapped`           |b2b “Schon Partner?” tapped                                |—                                                                  |
|`home_seo_link_tapped`           |SEO link wall link tapped                                  |`category`, `city`                                                 |
|`home_footer_link_tapped`        |footer link tapped                                         |`column`, `link_label`                                             |
|`home_lang_changed`              |language switcher button tapped                            |`from_lang`, `to_lang`                                             |
|`entdecken_look_viewed`          |look card enters viewport (homepage row OR /entdecken page)|`look_id`, `surface` (home/entdecken), `position`                  |
|`entdecken_look_tapped`          |look card tapped (opens detail sheet)                      |`look_id`, `surface`                                               |
|`entdecken_look_heart_toggled`   |look heart toggled                                         |`look_id`, `state`                                                 |
|`entdecken_look_bookmark_toggled`|look bookmark toggled                                      |`look_id`, `state`, `board_id`                                     |
|`entdecken_look_share_tapped`    |share button on detail sheet                               |`look_id`, `share_method`                                          |
|`entdecken_look_book_tapped`     |“Buche diesen Look →” CTA on detail sheet                  |`look_id`, `salon_id`                                              |
|`search_opened`                  |/search page loaded                                        |`entry_point` (hero / chip / direct)                               |
|`search_submitted`               |search CTA tapped                                          |`was`, `wo`, `wann`, `result_count`                                |
|`search_state_changed`           |row focus changes in /search                               |`from_row`, `to_row`                                               |
|`search_suggestion_tapped`       |suggestion in WAS state tapped                             |`query`, `suggestion`, `position`                                  |

### §24c.3 · User properties to set

Set on PostHog `identify()` call:

- `current_city`
- `is_logged_in`
- `signup_date`
- `total_bookings_lifetime`
- `last_active_date`
- `preferred_language`
- `chip_usage_top_3` (computed)
- `is_partner` (b2b user flag)

### §24c.4 · DO NOT track

- exact GPS coordinates (use city + neighborhood only)
- user input typed into search WAS field (only on submit, not keystrokes)
- view durations under 1 second (filter out scroll-fly-bys)
- bot traffic (filter via PostHog server-side rules)

-----

## §25 · Category page — `/[city]/[category]`

The grid page user lands on when tapping any "Alle →" link from a category feed (e.g. tapping `Alle →` on "Coiffeur in Basel" homepage row navigates to `/basel/coiffeur`).

URL format: `/[city]/[category]` per §15.5. Examples: `/basel/coiffeur`, `/zurich/nails`, `/bern/spa`. NO query strings.

### Sequencing principle (Fresha lesson, V2-D15-1)

Fresha's verified booking-flow architecture: **search context → ranked options → social proof → platform expansion → SEO lattice.** Solen mirrors this on category pages:

1. **Header band** (search context) — sticky on scroll past h1: breadcrumbs + h1 + sub stat
2. **Filter pills row** (search refinement) — sticky on scroll, top: 48px
3. **Salon grid** (ranked options) — service-variant card, infinite scroll 12 per page
4. **End-of-list separator** ("Du hast alle 23 Salons gesehen")
5. **Cross-link footer** (SEO lattice) — "Andere Kategorien in [City]" + "[Category] in anderen Städten"
6. **Main footer §21**

The order is non-negotiable. Filter sheet results never break sequencing — they re-render the grid in place but never re-order the page. This sequencing applies the Fresha discipline: get user from "I want X" → "here are options" → "decision committed" with no detours.

### Colorway treatment (V2-D15-1, Level 3 Republik)

Per §2.1, this whole page IS the colorway. Every brand-teal reference in this section that existed in v2-prelim has been swapped to category-themed (h1 → category color, breadcrumb-current → category-deep, filter pill active → category color, sticky bottom CTA → category-deep gradient, count badge → category-deep, loading-more spinner → category color). **Brand teal `#043338` does not appear on this page.** It returns at the cross-link footer where multiple categories cross-reference (no single category wins) and at the main footer §21.

### §25.1 · Layout overview

```
┌────────────────────────────────────────────────┐
│  [← back]    [Basel ▾]   [🔔]   [avatar]      │  ← header (sticky per §12)
├────────────────────────────────────────────────┤
│  solen / Basel / Coiffeur                      │  ← breadcrumbs
│                                                │
│  Coiffeur in Basel                             │  ← h1
│  ● 23 Salons · 8 heute frei                    │  ← sub-text w pulse dot
├────────────────────────────────────────────────┤
│  [Alle] [Heute frei] [Sortieren ▾] [Filter]   │  ← filter pills
├────────────────────────────────────────────────┤
│  [salon card] [salon card]                     │  ← grid (2 cols mobile)
│  [salon card] [salon card]                     │
│  [salon card] [salon card]                     │
│  ... infinite scroll, 12 cards per page ...    │
│                                                │
│  Du hast alle 23 Salons gesehen                │  ← end of list
├────────────────────────────────────────────────┤
│  Andere Kategorien in Basel                    │  ← cross-link block 1
│  Barbershop · Nails · Spa & Wellness           │
│                                                │
│  Coiffeur in anderen Städten                   │  ← cross-link block 2
│  Coiffeur in Zürich · Coiffeur in Bern         │
├────────────────────────────────────────────────┤
│  [main footer §21]                             │
└────────────────────────────────────────────────┘
```

### §25.2 · Header

Same standard header from §12 (back arrow + city pill + bell + avatar). City pill reflects URL city per §12.4 precedence rule.

Back arrow target: `history.back()` if previous page is on solen.ch, else `/[city]` homepage as fallback.

### §25.3 · Breadcrumbs

Below header, before h1.

|element               |spec                                                        |
|----------------------|------------------------------------------------------------|
|layout                |flex row, wrap, baseline-aligned, gap 4px                   |
|padding               |`14px 16px 0`                                               |
|typography            |Avant Garde Gothic 400 11px                                        |
|non-current item color|ink-2 `#7A6957`                                             |
|current item color    |ink-1 `#1A1209`, font-weight 600                            |
|separator `/`         |ink-1 `.22` opacity, `0 1px` margin                         |
|structure             |`solen / [City] / [Category]`                               |
|`solen` link          |→ `/`                                                       |
|`[City]` link         |→ `/[city]` (e.g. `/basel`)                                 |
|`[Category]`          |not a link — current page (use `<span aria-current="page">`)|
|`<nav aria-label>`    |`breadcrumb`                                                |
|JSON-LD               |`BreadcrumbList` schema in `<head>` (per §25.10)            |

### §25.4 · Page title block — full Republik colorway treatment (V2-D15-1)

**Category page IS the colorway** per §2.1. Brand teal retreats to GLOBAL elements only on this page (logo, nav, save-heart, footer accent). The `[Category]` colorway owns:
- Page header band background tint (category color × 6% alpha)
- 3px solid stripe at top of header band in category color
- h1 text color: **the combo's text color** (e.g. Coiffeur cherry `#B5345A` on cream `#FFF1DD` band — combo Z exact pair, Republik monochrome rule)
- Breadcrumb-current text color: same combo text color (e.g. Coiffeur cherry `#B5345A`) — monochrome panel rule
- Sub-text count "**23 Salons**": same combo text color
- Filter pill active state: category-color bg, white text (per §25.5 update below)
- Section dividers: 1px line in category color at 30% opacity
- Primary "Buchen →" CTA on this page: brand teal `#043338` pill + white text per §25.8 (the brand-teal CTA is the connective tissue across all category pages, Yuh discipline)

**Header band layout:**

```
[3px solid category-color stripe]
[16px tinted-bg padding above breadcrumbs]
solen / Basel / Coiffeur (breadcrumb-current rose-deep)
Coiffeur in Basel (h1 in full saturated rose)
● 23 Salons · 8 heute frei (sub w pulse + count in rose-deep)
[16px tinted-bg padding below sub]
[bottom border: solid 1px category-color × 30% alpha]
[white substrate continues from here — filter pills row, grid, etc.]
```

|element                      |spec                                                                                                                                   |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
|header band bg               |`linear-gradient(180deg, [cat-color × 14% alpha] 0%, [cat-color × 6% alpha] 100%)` — subtle vertical gradient, top stronger             |
|header band top stripe       |3px solid in category color, 100% width, sits ABOVE the band content                                                                   |
|header band padding          |`16px` mobile / `20px` tablet+ — bottom of band has the 1px-30%-alpha category-color border                                            |
|h1                           |`[Category] in [City]` (e.g. `Coiffeur in Basel`) — Cooper BT 900, `clamp(36px, 4.2vw, 56px)`, `-0.018em`, line-height 0.96, **full saturated category color** (not deep — Republik energy per V2-D15-3) |
|breadcrumb-current           |Avant Garde Gothic 600 11px in **category-deep** variant (e.g. Coiffeur `#B5345A`, Spa `#948565`)                                            |
|sub-text                     |Avant Garde Gothic 400 12px ink-2, line-height 1.4                                                                                            |
|sub-text default format      |`[N] Salons · [M] heute frei` — count `<strong>` in **category-deep**                                                                  |
|sub-text w filters           |`[N] Salons · gefiltert` (replaces "M heute frei" indicator when filters active)                                                       |
|sub-text w 0 results         |`0 Salons · gefiltert · ` followed by inline link `Filter zurücksetzen` in brand-teal `#043338` underlined (the brand-teal CTA / link is the connective tissue across all category pages, Yuh discipline)|
|pulse dot                    |5px green `#16A34A` before `[N] Salons`, animates pulse 1.6s infinite (per §5c.7)                                                      |
|pulse dot when filters active|hidden (replaced by no dot — sub-text reflects filtered state instead)                                                                 |

### §25.5 · Filter pills row

|element|spec                                                                                                         |
|-------|-------------------------------------------------------------------------------------------------------------|
|padding|`14px 16px 16px`                                                                                             |
|layout |flex row, gap 6px, horizontal scroll on overflow, scrollbar hidden                                           |
|pill 1 |`Alle` — active by default. Tap → clears all filters, sets default sort.                                     |
|pill 2 |`Heute frei` — quick filter toggle. Tap → toggles `available_today=true`. Active state: ink-1 bg, white text.|
|pill 3 |`Sortieren ▾` — opens sort sheet (§25.6). Active state when not on default sort.                             |
|pill 4 |`Filter` — opens filter sheet (§25.7). When filters active: brand-teal count badge appears (`Filter (3)`). |

#### Pill base styling

|element        |spec                                                                                                                                   |
|---------------|---------------------------------------------------------------------------------------------------------------------------------------|
|typography     |Avant Garde Gothic 600 12px                                                                                                                   |
|padding        |`8px 13px`                                                                                                                             |
|radius         |`var(--radius-pill)` (99px)                                                                                                            |
|inactive bg    |`linear-gradient(180deg, #fff, #FDFAF5)`                                                                                               |
|inactive shadow|`inset 0 1px 0 rgba(255,255,255,.85), 0 1px 1px rgba(26,18,9,.04), 0 2px 4px rgba(4,51,56,.06)`                                     |
|active bg (V2-D15-1)|category color (e.g. Coiffeur `#FFF1DD`, Spa `#193120`) — full saturation, NOT ink-1. The page is themed; active filter participates in the colorway. |
|active color   |`#fff`                                                                                                                                 |
|active shadow  |`inset 0 1px 0 rgba(255,255,255,.22), 0 1px 2px rgba(category-color, .24)`                                                             |
|chevron / icon |10px Lucide, ink-2 (inactive) or `rgba(255,255,255,.85)` (active)                                                                      |
|count badge (V2-D15-1)|inline-flex, min-width 18px, height 18px, padding `0 5px`, bg **category-deep** (e.g. Coiffeur deep `#B5345A`), color white, Avant Garde Gothic (tabular-nums) 10px 700, radius pill — was brand-teal in v2-prelim, now category-themed per Level 3 commitment|

### §25.6 · Sortieren sheet

Bottom sheet, opened by tapping `Sortieren ▾` pill.

|element     |spec                                                                                                            |
|------------|----------------------------------------------------------------------------------------------------------------|
|presentation|bottom sheet, dimmed backdrop `rgba(0,0,0,.35)`, swipe-down-to-dismiss                                          |
|sheet bg    |white `#FFFFFF`                                                                                                  |
|sheet radius|`22px 22px 0 0`                                                                                                 |
|sheet shadow|`0 -8px 32px rgba(26,18,9,.18)`                                                                                 |
|handle      |36×4px ink-1 `.18` pill at top center, 8px margin                                                               |
|header      |`Sortieren nach` (Avant Garde Gothic 700 16px, `-0.02em`), padding `8px 18px 14px`, bottom border `1px rgba(26,18,9,.05)`|
|body padding|`14px 18px`                                                                                                     |
|z-index     |`var(--z-modal)` per §8                                                                                         |

#### Sort options (radio rows)

5 options in order:

1. `Empfohlen` — default. Server’s smart-mix algorithm (relevance score).
1. `Beste Bewertung` — rating descending.
1. `Heute am frühesten frei` — soonest available slot today ascending. Salons with no slot today pushed to end.
1. `Preis · niedrig zuerst` — lowest “ab CHF X” first.
1. `Nähe` — distance from user ascending. Requires geolocation permission. If not granted: option appears greyed out with “Standort aktivieren” hint.

#### Radio row styling

|element                |spec                                                                                                                   |
|-----------------------|-----------------------------------------------------------------------------------------------------------------------|
|layout                 |flex row, align-center, gap 12px, padding `14px 0`, bottom border `1px rgba(26,18,9,.05)` (last has no border)         |
|radio circle           |18×18px, 2px ink-1 `.25` border, radius pill, transparent bg                                                           |
|radio circle (selected)|2px brand-teal border, inner brand-teal dot via `radial-gradient(circle, #043338 0%, #043338 50%, transparent 50%)`|
|label                  |Avant Garde Gothic 400 14px, ink-1. Selected → 600 weight                                                                     |
|tap                    |sets sort, dismisses sheet, refetches grid w new sort                                                                  |

### §25.7 · Filter sheet

Bottom sheet, opened by tapping `Filter` pill.

Same shell as §25.6 (handle, header, dim, swipe-down). Header copy: `Filter`. Top-right of header: `Zurücksetzen` text link (Avant Garde Gothic 500 11px, ink-2 underlined, 3px offset).

#### v1 filter categories (3)

##### 1. Verfügbarkeit (pill multi-select)

Options:

- `Heute frei`
- `Sofort frei` (within 30 min)
- `Diese Woche`
- `Wochenende`
- `Abends nach 18:00`

##### 2. Service-Typ (pill multi-select)

For Coiffeur category. Options vary by category in DB.

Coiffeur: `Damen` · `Herren` · `Kinder` · `Schnitt` · `Föhnen` · `Coloration` · `Highlights`
Barber: `Bart` · `Schnitt + Bart` · `Walk-in` · `Termin`
Nails: `Gel` · `Acryl` · `Natur` · `Gel-Nägel` · `French` · `Nail Art`
Spa & Wellness: `Massage` · `Gesichtsbehandlung` · `Body Wrap` · `Sauna` · `Yoga` · `Meditation` · `Akupunktur` · `Energiearbeit`

##### 3. Preisspanne (range slider)

|element           |spec                                                                                                      |
|------------------|----------------------------------------------------------------------------------------------------------|
|range             |CHF 0–500                                                                                                 |
|default           |full range (no filter)                                                                                    |
|visual            |dual-thumb slider, ink-1 `.1` track, brand-teal filled portion                                          |
|thumbs            |16×16px white circles, 2px brand-teal border, soft shadow                                               |
|labels below track|`ab CHF [min]` (left) and `bis CHF [max]` (right) — Avant Garde Gothic 400 11px ink-2, value `<strong>` ink-1 600|

#### Pill toggle styling (Verfügbarkeit + Service-Typ)

|element         |spec                                                                                   |
|----------------|---------------------------------------------------------------------------------------|
|layout          |flex wrap, gap 6px                                                                     |
|inactive        |`linear-gradient(180deg, #fff, #FDFAF5)`, 1px ink-1 `.06` border, ink-1 text 500 weight|
|inactive padding|`7px 12px`                                                                             |
|inactive radius |pill                                                                                   |
|active          |bg ink-1, color white, border ink-1, font-weight 600                                   |
|typography      |Avant Garde Gothic, 12px                                                                      |
|tap             |toggles state, debounced 200ms recount fires                                           |

#### Section headers within sheet

|element                 |spec                                                                 |
|------------------------|---------------------------------------------------------------------|
|typography              |Avant Garde Gothic 700 11px, letter-spacing 0.04em, uppercase, ink-2 `#56463E`|
|margin-bottom           |10px                                                                 |
|copy                    |`Verfügbarkeit` / `Service-Typ` / `Preisspanne`                      |
|spacing between sections|18px                                                                 |

#### Sticky bottom CTA

Live-counted “[N] Salons anzeigen” button.

|element                     |spec                                                                                                                                    |
|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
|container                   |sticky bottom, `padding: 14px 18px 18px`, bg `rgba(255,255,255,.94)` w `backdrop-filter: blur(12px)`, top border `1px rgba(26,18,9,.05)` |
|button width                |100%                                                                                                                                    |
|button bg (active, ≥1 match) **(V2-D15-1)**|category-deep gradient (e.g. Coiffeur `linear-gradient(180deg, #8A4068, #B5345A)`, Spa `linear-gradient(180deg, #5B8B71, #948565)`) — was brand-teal in v2-prelim, now category-themed per Level 3 commitment |
|button bg (zero matches)    |ink-3 `#7A6957` muted, disabled cursor                                                                                                  |
|button bg (loading)         |active category-deep gradient w spinner                                                                                                 |
|button color                |white                                                                                                                                   |
|button typography           |Avant Garde Gothic 700 13px                                                                                                                    |
|button padding              |`13px 18px`                                                                                                                             |
|button radius               |pill                                                                                                                                    |
|button shadow               |`inset 0 1px 0 rgba(255,255,255,.18), 0 1px 2px rgba(4,51,56,.18)`                                                                   |
|copy default (no filters)   |`Alle [N] Salons anzeigen`                                                                                                              |
|copy w filters              |`[N] Salons anzeigen →` (live-counted, debounced 200ms after each filter toggle)                                                        |
|copy zero matches           |`Keine Treffer` (button disabled)                                                                                                       |
|copy loading                |`Zähle...` w spinner                                                                                                                    |
|tap                         |applies filters, dismisses sheet, scrolls grid to top, URL params sync                                                                  |

#### Apply / cancel behaviors

|trigger          |behavior                                                                                |
|-----------------|----------------------------------------------------------------------------------------|
|tap CTA          |sheet dismisses, filters apply, grid updates, URL params sync (`?heute=1&service=damen`)|
|swipe down       |sheet dismisses, filters NOT applied (cancels)                                          |
|tap backdrop     |sheet dismisses, filters NOT applied                                                    |
|tap Zurücksetzen |clears all filters in sheet, sheet stays open, count returns to default                 |
|Esc key (desktop)|sheet dismisses, filters NOT applied                                                    |

### §25.8 · Grid

|element                    |spec                                                                                           |
|---------------------------|-----------------------------------------------------------------------------------------------|
|variant                    |salon card `service` variant (per §16.5)                                                       |
|layout                     |CSS Grid                                                                                       |
|columns mobile (<768px)    |2                                                                                              |
|columns tablet (768-1023px)|3                                                                                              |
|columns desktop (≥1024px)  |4                                                                                              |
|gap mobile                 |10px                                                                                           |
|gap tablet                 |14px                                                                                           |
|gap desktop                |16px                                                                                           |
|padding mobile             |`4px 16px 18px`                                                                                |
|padding tablet+            |`4px 24px 24px`                                                                                |
|pagination                 |infinite scroll — load 12 cards initial, fetch next 12 when user scrolls within 400px of bottom|
|skeleton during fetch      |6 cards w left-to-right shimmer, max 2 cycles per skeleton                                     |
|loading-more indicator     |22×22px category-color spinner (e.g. Coiffeur rose `#FFF1DD`) + "Lade weitere Salons…" ink-3, shown grid-column 1 / -1 — was brand-teal in v2-prelim, now category-themed per Level 3 |

#### End of list

When all salons loaded (no more pages):

```
─────────
Du hast alle 23 Salons gesehen
```

|element   |spec                                                        |
|----------|------------------------------------------------------------|
|layout    |grid-column 1 / -1, padding `24px 0 12px`, text-align center|
|typography|Avant Garde Gothic 400 11px, ink-3 `#7A6957`                       |
|separator |32×2px ink-1 `.12` pill above text, 12px margin-bottom      |
|copy      |`Du hast alle [N] Salons gesehen`                           |

### §25.9 · Empty states

#### Zero filter matches

|element                                 |spec                                                                                                                                              |
|----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
|trigger                                 |filters applied, 0 salons match                                                                                                                   |
|illustration                            |88×88px ink `.06` background circle, brand-teal `#043338` Lucide `search-x` icon at 38×38px stroke 1.5 inside                                   |
|illustration margin-bottom              |20px                                                                                                                                              |
|title                                   |`Keine Salons mit diesen Filtern` — Avant Garde Gothic 700 19px, `-0.025em`, ink-1                                                                         |
|title margin-bottom                     |8px                                                                                                                                               |
|body                                    |`Versuch andere Optionen, oder lockere die Suche etwas.` — Avant Garde Gothic 400 13px, ink-2, line-height 1.55, max-width 280px                         |
|body margin-bottom                      |24px                                                                                                                                              |
|primary CTA                             |`Filter zurücksetzen` w refresh icon — ink-1 gradient bg, white, pill, 12×20px padding, hover `translateY(-1px)`                                  |
|CTA tap                                 |clears all filters, refetches w default sort                                                                                                      |
|secondary link                          |`Mit gleichen Filtern in Zürich suchen →` (or other city if user is in Zürich) — Avant Garde Gothic 400 12px ink-2 underlined 4px offset, margin-top 16px|
|secondary tap                           |navigates to `/[other-city]/[category]` w same filter params preserved                                                                            |
|section padding                         |`48px 28px 36px`                                                                                                                                  |
|sub-text in title block above filter row|`0 Salons · gefiltert · Filter zurücksetzen` (inline reset link, brand-teal)                                                                    |

#### Category not in city (e.g. `/bern/barbershop` w 0 barbershop salons)

|element       |spec                                                                                                                                                                                           |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
|trigger       |category exists in DB but 0 salons in current city                                                                                                                                             |
|illustration  |88×88px brand-subtle teal-tinted circle, soft Lucide icon (vary by category — `scissors` for coiffeur, `flower` for spa & wellness, etc)                                                       |
|h1 sub-text   |`Bald verfügbar` (replaces “X Salons · Y heute frei”)                                                                                                                                          |
|title         |`[Category] kommt bald nach [City]` — Avant Garde Gothic 700 19px                                                                                                                                       |
|body          |`Wir suchen die besten [Category]-Salons der Stadt. Trag dich ein und erfahre als Erste:r, wenn's los geht.` — ink-2 13px                                                                      |
|primary CTA   |`Benachrichtige mich` w bell icon — ink-1 gradient bg                                                                                                                                          |
|CTA tap       |opens email-only signup modal: `Ich benachrichtige dich, wenn [Category] in [City] startet.` + email input + `Anmelden` button. Email saved to `waitlist_signups` table w category + city tags.|
|secondary link|`[Category] in [other-city] oder [other-city] suchen →`                                                                                                                                        |
|secondary tap |navigates to nearest available city w same category                                                                                                                                            |
|filter pills  |hidden (no salons to filter)                                                                                                                                                                   |

#### API error

|element         |spec                                                                                                                      |
|----------------|--------------------------------------------------------------------------------------------------------------------------|
|trigger         |grid fetch fails after 3 retries                                                                                          |
|layout          |inline within grid area (NOT empty-state full block)                                                                      |
|copy            |`Konnte Salons nicht laden — ` + inline link `Erneut laden`                                                               |
|typography      |Avant Garde Gothic 400 12px ink-2, link brand-teal underlined                                                                  |
|icon            |small 14px Lucide `wifi-off` ink-2 before text                                                                            |
|tap retry       |refetches                                                                                                                 |
|after 5+ retries|escalate to full empty state w title `Etwas ist schief gelaufen` + Erneut laden CTA + `Hilfe kontaktieren` link to `/help`|

### §25.10 · Sticky scroll behavior

|state                             |spec                                                                                                                                              |
|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
|top of page (scrollY = 0)         |header sticky per §12 (no shadow). Crumbs + h1 + sub + filter pills all visible naturally.                                                        |
|scrolled past h1 (scrollY ≥ 120px)|filter pills row becomes sticky `position: sticky; top: 48px;`                                                                                    |
|both header + sticky pills        |gain `rgba(251,248,243,.94)` bg w `backdrop-filter: blur(12px) saturate(1)` and shadow `0 1px 0 rgba(26,18,9,.04), 0 4px 12px rgba(26,18,9,.04)`|
|transition into sticky            |200ms `var(--ease-snap)` opacity + bg + shadow                                                                                                    |
|z-index header                    |`var(--z-sticky)` (per §8)                                                                                                                        |
|z-index sticky pills              |`var(--z-sticky) - 1` (one below header)                                                                                                          |
|crumbs + h1 + sub                 |scroll naturally w content, NOT sticky                                                                                                            |

### §25.11 · Cross-link footer (SEO link blocks)

Lives between end-of-grid and main footer §21. Pure SEO link surface — google rewards internal link density.

|element             |spec                                               |
|--------------------|---------------------------------------------------|
|container padding   |`36px 18px 32px`                                   |
|container bg        |`linear-gradient(180deg, #FFFFFF 0%, #FAF7F3 100%)` (subtle warm-grey gradient — keeps the SEO-link block visually distinct from pure-white surrounding sections without reverting substrate to cream)|
|container top border|`1px rgba(26,18,9,.06)`                            |

#### Block 1: Andere Kategorien in [City]

|element         |spec                                                                                                                                                          |
|----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
|header          |`Andere Kategorien in [City]` — Avant Garde Gothic 700 15px, `-0.02em`, ink-1, margin-bottom 12px                                                                      |
|links           |flex wrap row, font Avant Garde Gothic 400 12px ink-2, line-height 1.7                                                                                               |
|each link       |padding `0 10px`, right border `1px rgba(26,18,9,.14)` (last has no border)                                                                                   |
|link strong     |category name in ink-1 600 weight                                                                                                                             |
|link hover      |brand-teal `#043338`, no underline                                                                                                                          |
|transition      |color 150ms                                                                                                                                                   |
|URL per link    |`/[city]/[other-category]`                                                                                                                                    |
|categories shown|all 3 other v1 categories (excluding current). Order: Barbershop · Nails · Spa & Wellness (if current is Coiffeur). Auto-scales as new categories launch.|

#### Block 2: [Category] in anderen Städten

|element                |spec                                                                                                              |
|-----------------------|------------------------------------------------------------------------------------------------------------------|
|header                 |`[Category] in anderen Städten`                                                                                   |
|spacing from block 1   |28px margin-top                                                                                                   |
|same styling as block 1|yes                                                                                                               |
|each link              |format `[Category] in [City]` (e.g. `Coiffeur in Zürich`). City name in `<strong>` ink-1 600.                     |
|URL per link           |`/[other-city]/[category]`                                                                                        |
|cities shown           |all v1 cities excluding current. Order alphabetical or by supply (descending). Auto-scales when new cities launch.|

### §25.12 · Meta + SEO `<head>`

All values dynamically generated server-side from city + category data.

|tag                               |format                                                                                                                             |example for /basel/coiffeur                                                                               |
|----------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|
|`<title>`                         |`[Category] Salons in [City] buchen — Solen` (60 char max)                                                                         |`Coiffeur Salons in Basel buchen — Solen`                                                                 |
|`<meta name="description">`       |`Buche [Category] Termine in [City] online — [N] Salons, ab CHF [min]. Heute frei: [M]. Ohne Anrufen, ohne Stress.` (155-160 chars)|`Buche Coiffeur Termine in Basel online — 23 Salons, ab CHF 65. Heute frei: 8. Ohne Anrufen, ohne Stress.`|
|`<link rel="canonical">`          |`https://solen.ch/[city]/[category]`                                                                                               |`https://solen.ch/basel/coiffeur`                                                                         |
|`<meta property="og:title">`      |`[Category] in [City] · [N] Salons                                                                                                 |Solen`                                                                                                    |
|`<meta property="og:description">`|`[N] [Category] Salons in [City] auf Solen. [M] heute frei, ab CHF [min]. Online buchen ohne Anrufen.`                             |`23 Coiffeur Salons in Basel auf Solen. 8 heute frei, ab CHF 65. Online buchen ohne Anrufen.`             |
|`<meta property="og:image">`      |`https://solen.ch/og/[city]-[category].jpg` (1200×630, dynamically generated w category color + city name)                         |—                                                                                                         |

#### JSON-LD structured data

`BreadcrumbList`:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "solen", "item": "https://solen.ch/"},
    {"@type": "ListItem", "position": 2, "name": "Basel", "item": "https://solen.ch/basel"},
    {"@type": "ListItem", "position": 3, "name": "Coiffeur", "item": "https://solen.ch/basel/coiffeur"}
  ]
}
```

`ItemList` of `HairSalon` (or category-appropriate type — `BeautySalon`, `DaySpa`, `NailSalon`):

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "HairSalon",
        "name": "Salon Crémant",
        "address": {...},
        "geo": {...},
        "aggregateRating": {"ratingValue": 4.9, "reviewCount": 218},
        "priceRange": "CHF 65 – CHF 180",
        "openingHours": [...],
        "image": "https://..."
      }
    },
    ...
  ]
}
```

#### hreflang alternates

```html
<link rel="alternate" hreflang="de" href="https://solen.ch/basel/coiffeur" />
<link rel="alternate" hreflang="en" href="https://solen.ch/en/basel/coiffeur" />
<link rel="alternate" hreflang="fr" href="https://solen.ch/fr/basel/coiffeur" />
<link rel="alternate" hreflang="it" href="https://solen.ch/it/basel/coiffeur" />
<link rel="alternate" hreflang="x-default" href="https://solen.ch/basel/coiffeur" />
```

DE is default, no URL prefix. EN/FR/IT all get prefix per §21.4 i18n routing.

#### h1 hierarchy

|heading level|content                                             |
|-------------|----------------------------------------------------|
|`<h1>`       |`[Category] in [City]` (visible)                    |
|`<h2>`       |`Andere Kategorien in [City]` (cross-link block 1)  |
|`<h2>`       |`[Category] in anderen Städten` (cross-link block 2)|

DO NOT have other h1s on page. Filter sheet section headers use `<h3>`. Card names use `<h3>` semantically (visually styled smaller).

### §25.13 · URL params (filter persistence)

When filters are applied, sync to URL as query params for shareability + back-button preservation.

|filter                 |param                                                  |
|-----------------------|-------------------------------------------------------|
|Heute frei toggle      |`?heute=1`                                             |
|Verfügbarkeit (multi)  |`?verfuegbar=heute,sofort,wochenende` (comma-separated)|
|Service-Typ (multi)    |`?service=damen,coloration` (comma-separated)          |
|Preisspanne            |`?preis=50-200`                                        |
|Sortieren (non-default)|`?sort=rating` (or `slot`, `price`, `distance`)        |

Combined example: `/basel/coiffeur?heute=1&service=damen&preis=50-150&sort=slot`

|rule                      |spec                                                                                                   |
|--------------------------|-------------------------------------------------------------------------------------------------------|
|URL update                |use Next.js `router.replace()` so filter changes don’t pollute history (back button skips through them)|
|URL parse on load         |parse params on mount, hydrate filter sheet state, fetch filtered grid                                 |
|invalid params            |silently ignored, default values used                                                                  |
|canonical on filtered page|still points to clean `/[city]/[category]` (filtered pages don’t get their own SEO weight)             |

### §25.14 · States summary

|state                 |trigger                                       |response                                                                           |
|----------------------|----------------------------------------------|-----------------------------------------------------------------------------------|
|default               |clean URL, no params                          |`Alle` pill active, grid loads first 12, sub-text “[N] Salons · [M] heute frei”    |
|filtered              |URL has filter params OR user toggled in sheet|`Alle` pill inactive, count badge on Filter pill, sub-text “[N] Salons · gefiltert”|
|sorted                |non-default sort                              |`Sortieren` pill active state, sort name in pill (e.g. `Sortieren: Bewertung ▾`)   |
|zero results          |filtered to 0                                 |empty state §25.9, sub-text “0 Salons · gefiltert · Filter zurücksetzen”           |
|category empty in city|DB has 0 salons of this category in city      |empty state §25.9 second variant, no filter pills, waitlist CTA                    |
|API error             |fetch failed                                  |inline retry + escalate to full empty after 5                                      |
|loading first paint   |navigate from homepage                        |header + crumbs + h1 + sub render server-side; grid shows skeleton cards w shimmer |

### §25.15 · Analytics events (extends §24c)

|event                           |when                            |properties                                                    |
|--------------------------------|--------------------------------|--------------------------------------------------------------|
|`category_page_viewed`          |category page renders           |`city`, `category`, `is_filtered`, `salon_count`              |
|`category_filter_pill_tapped`   |any filter pill in row          |`city`, `category`, `pill` (alle / heute / sortieren / filter)|
|`category_sort_opened`          |Sortieren sheet opens           |`city`, `category`, `current_sort`                            |
|`category_sort_changed`         |sort option selected            |`city`, `category`, `from_sort`, `to_sort`                    |
|`category_filter_opened`        |Filter sheet opens              |`city`, `category`, `current_filters`                         |
|`category_filter_changed`       |filter toggle within sheet      |`city`, `category`, `filter_key`, `filter_value`, `live_count`|
|`category_filter_applied`       |filter sheet CTA tapped         |`city`, `category`, `filters_count`, `result_count`           |
|`category_filter_reset`         |Zurücksetzen tapped             |`city`, `category`, `from_filter_count`                       |
|`category_card_tapped`          |salon card tapped               |`salon_id`, `city`, `category`, `position`, `sort`, `filters` |
|`category_load_more`            |infinite scroll triggered       |`city`, `category`, `page_num`, `total_loaded`                |
|`category_crosslink_tapped`     |link in cross-link footer tapped|`city`, `category`, `target_city`, `target_category`          |
|`category_empty_waitlist_signup`|Benachrichtige mich completed   |`city`, `category`, `email_hash` (hashed, not raw)            |

### §25.16 · DO NOT

- DO NOT pre-load all salons (e.g. for cities with 200+ salons) — infinite scroll only
- DO NOT add 4th filter category for v1 (Bewertung, Distanz, Sprachen all deferred to v2)
- DO NOT show map view in v1 (defer to v2 — `/[city]/[category]?view=map`)
- DO NOT show different sort options based on logged-in vs logged-out (always show all 5)
- DO NOT auto-detect “Heute frei” from time of day — always require explicit user action
- DO NOT save filter selections across sessions — reset on each visit (URL params are session-scoped)
- DO NOT show “Featured” / promoted salons mixed into grid — defer to v2 (no paid ranking in v1)
- DO NOT stretch grid columns beyond max-width 1200px on huge screens — center grid

-----


-----

## Component PR checklist

Before any homepage component PR merges, verify against this checklist:

### Tokens + structure

- [ ] All radii use `var(--radius-*)` tokens (no hardcoded `border-radius: 12px`)
- [ ] All spacing uses `var(--space-*)` tokens (no hardcoded `padding: 16px`)
- [ ] All colors use design tokens (no `#888888`, only ink-1/2/3 + brand)
- [ ] Z-index uses `var(--z-*)` tokens (per §8)
- [ ] If component contains modal/overlay, uses React portal (per §8 stacking context warning)

### Per-category colorway (per §2)

- [ ] Category pages (`/[city]/[category]`) carry the category color as page-identity (h1, breadcrumb-current, accent bar above breadcrumb)
- [ ] Brand teal retreats to GLOBAL elements only on category pages (logo, nav, footer). Save-heart stays love-red `#FF4A6B` always (semantic). Category colorway owns h1/header band/CTA per §2.1.
- [ ] Salon detail pages use the salon's primary category color as page-local accent
- [ ] Body text on category pages uses ink-2 / ink-3 (NOT category color — fails contrast on white)

### Hierarchy (per §5f)

- [ ] Data-dense panels (3+ info points) have **one hero** — no equal-weight stat rows
- [ ] Hero / secondary / tertiary type weights match the §5f surface table (or have an explicit reason to deviate, logged in PR description)
- [ ] Max one "wow moment" chip per panel (badge / PB pill / brand-teal accent number)
- [ ] Metadata compressed into dot-separated single line (`·` separator, 6-8px gap) before adding a new stacked row

### States

- [ ] All states specified: default, hover (desktop), press, focus-visible, disabled, loading
- [ ] Skeleton loading state implemented w left-to-right shimmer (per §5c (skeleton shimmer))
- [ ] Empty state behavior specified (hide section vs show copy)
- [ ] Real-time updates (counter pill, availability) refetch on visibility change
- [ ] API error states have inline retry affordance

### Animations

- [ ] Animations include `from`, `to`, `duration`, `cubic-bezier` (per §5c)
- [ ] Touch targets ≥ 44px (per §11)
- [ ] `prefers-reduced-motion` respected (animations disabled where appropriate per §24b.3)

### Copy + i18n

- [ ] DE copy uses du-form (informal “you”)
- [ ] Swiss number format (apostrophe thousands: `2'173` not `2,173`)
- [ ] Plural forms handled (count = 1 vs count ≥ 2 — different verb forms)
- [ ] Long-name + long-text truncation behavior specified
- [ ] All UI strings live in i18n locale files, NOT hardcoded
- [ ] No Instrument Serif italic accent moments anywhere (retired V2-D15 — use brand-teal color swap per §5d)
- [ ] No JetBrains Mono — numerics use Avant Garde Gothic + `font-variant-numeric: tabular-nums` (retired V2-D15)
- [ ] All 4 languages (DE, EN, FR, IT) have translations before launch
- [ ] DO NOT cases enumerated where applicable

### Accessibility (per §24b)

- [ ] Icon-only buttons have `aria-label`
- [ ] Toggle buttons have `aria-pressed`
- [ ] Disclosure buttons have `aria-expanded` + `aria-haspopup`
- [ ] Live regions have `aria-live` (counter pill, search count CTA)
- [ ] Modals have `role="dialog"`, `aria-modal="true"`, focus trap
- [ ] Color contrast meets WCAG AA (per §24b.4)
- [ ] Keyboard navigation works (Tab, Enter, Space, Esc, Arrow keys per §24b.5)
- [ ] Focus management on modal open/close

### Photos + media

- [ ] Salon photo fallback to category-color tile w initials (per §16.7b)
- [ ] Smart-crop position handles landscape/portrait uploads
- [ ] `next/image` used for all photos w responsive `sizes`
- [ ] Entdecken video autoplay respects max-2-simultaneous rule (per §18.2)
- [ ] Data saver mode + reduced motion disable autoplay

### Analytics (per §24c)

- [ ] All required events fire w correct properties
- [ ] User properties updated on `identify()`
- [ ] No PII in event payloads (no exact coords, no keystroke logging)

-----

*End of pasted v2 spec content (compiled from 4 sequential design steps in user's parallel Claude session, locked 2026-05-05). Forms primitives, additional surfaces, and the next wave of locks land via the phased plan in `_tasks/V2_REBUILD_LOG.md` (V2-D## decisions) — never in side docs.*

---


-----

## What's still missing

Tonight's audit (2026-05-05) of this spec found **36+ surface gaps** vs. what v1 needs. The phased plan in `_tasks/V2_REBUILD_LOG.md` and `/Users/sulo/.claude/plans/immutable-shimmying-meerkat.md` closes them in this order:

### Phase 0 — Foundation primitives (blocks every later phase)
- ~~§F.1 Form primitives~~ — **locked V2-D14 2026-05-05** at `public/solen-v2-primitives.html`
- §F.2 Modal primitive — centered dialog, sizes (sm/md/lg), focus trap, mobile vs desktop variant
- §F.3 Bottom sheet primitive — handle, dim, swipe-down, snap heights, sticky CTA at bottom (mobile-only; desktop falls back to modal)
- §F.4 Toast primitive — success/info/warning/error variants, auto-dismiss timing, action slot, stacking, ARIA live region
- §F.5 Date/time picker primitive — calendar grid, time slot list, range picker variant
- §F.6 Skip-to-main link — visible on `:focus`, hidden otherwise
- §F.7 Font fallback stack + `font-display` strategy (Cooper BT + ITC Avant Garde Gothic Std only — Bricolage Grotesque, Inter Tight as primary, Instrument Serif, JetBrains Mono all retired V2-D15-3)
- §F.8 Cookie consent banner — GDPR baseline (DACH market, non-negotiable)

### Phase 1 — Auth + identity (blocks favorites, bookings, profile)
- §A.1 Login modal (heart-save tap when logged out, save-look when logged out, write-review when logged out)
- §A.2 Login page `/auth/login` (full page when arrived from email link or direct URL)
- §A.3 Signup page `/auth/signup`
- §A.4 Password reset flow `/auth/reset-password` + email
- §A.5 OAuth (Google + Apple) — buttons, callback handling, error states
- §A.6 Guest checkout decision (V2-D09 PENDING — IN or OUT of v1)
- §A.7 Email transactional template baseline (auth emails first)
- §A.8 Auth state visibility — what avatar dropdown does, what heart icons render across logged-in / logged-out / loading

### Phase 2 — Critical funnel surfaces (the money path)
- §SD Salon detail page `/salon/[slug]` — hero photo gallery, sticky tab bar (Services / Über / Bewertungen / Standort), service list w prices, staff section, reviews tab summary + 3 latest, opening hours, sticky bottom booking CTA
- §BW Booking wizard `/book/[slug]` — 3 steps: Service+Staff → Date+Time → Pay+Confirm. Wizard chrome (progress bar, Weiter button, back, step indicator). Per-step layouts. State management. Cancel/exit handling.
- §SR Search results page `/search/results` — distinct from category page (§25): entry from search submit, filters from query, optional map view (V2-D10 PENDING)
- §C Booking confirmation `/book/[slug]/confirmation` — confetti pop (§5c (signature flourishes)), celebration ring per Q57, summary card (Was / Wann / Wo / Wer), 3 utility chips (Kalender / Wegbeschreibung / Teilen), secondary CTA `Zur Buchung →`. NO upsell, NO ReviewPrompt.
- §RV Reviews-write UX — accessed from `/profile/bookings` after a completed booking. Star slider, photo upload, text body, submit + cancel. Inline error states.

### Phase 3 — User account surfaces
- §AC.1 `/favoriten` — saved salons grid. **The heart-with-face empty state lives here** (see `public/heart-illustration-reference.html`).
- §AC.2 `/profile/bookings` — upcoming + past, per-booking actions: view detail, cancel (per cancel policy), rebook, write review.
- §AC.3 `/profile/looks` — saved entdecken looks. Two tabs: `Likes` (flat) + `Boards` (organized — see §18.5).
- §AC.4 `/profile` — main profile page: avatar, name, email, basic info display.
- §AC.5 `/profile/settings` — edit name, email, password, language, notification prefs, delete account (GDPR right-to-erasure).
- §AC.6 `/notifications` — list, mark-as-read, filter by type.
- §AC.7 Avatar dropdown menu (referenced in §12.6, never specified) — items: profile / bookings / favorites / settings / sign out. Mobile vs desktop layout.

### Phase 4 — Content + community
- §CO.1 `/entdecken` full page — masonry feed, filter bar, infinite scroll. Already in §18.3 — confirm complete.
- §CO.2 Look-detail sheet enhancements — share targets (per §18.4 share button), report-content flag.
- §CO.3 `/staedte` — city directory page. Per-city tile w salon count + featured salons + "Coming soon" cities. SEO content per city.
- §CO.4 Per-city homepage variants — `/[city]` reuses the homepage template; confirm anything city-specific needed.
- §CO.5 Report-content flow — abuse / inappropriate flag for reviews + entdecken looks. Modal w reasons + free-text. Submit → moderation queue.
- §CO.6 Mein-Look board management — create board, rename, delete, reorder, share. Modal-driven.

### Phase 5 — System + cross-cutting
- §SY.1 404 page (`/not-found.tsx`) — friendly empty state, search bar, link back to homepage
- §SY.2 500 / error boundary page — apology copy, retry, contact support
- §SY.3 Offline / network-down UX — service worker fallback, "you're offline" inline banners
- §SY.4 PWA manifest + install prompt UX
- §SY.5 Email transactional templates beyond auth — booking confirmation, reminder (24h before), cancellation, salon-side new-booking notification
- §SY.6 Print styles — booking confirmation must print cleanly (`@media print`)
- §SY.7 SEO sitemap.xml — dynamic per route + per locale
- §SY.8 robots.txt + crawl rules
- §SY.9 Cookie consent deeper integration (categories work + analytics consent gating)
- §SY.10 Image upload UX (B2B-side, but spec primitive here for reuse)
- §SY.11 Address autocomplete primitive (Google Places or Mapbox)
- §SY.12 Reduced-motion + reduced-data preferences (extends §24b.3) — full audit of every animation + auto-play
- §SY.13 LCP optimization rules — `priority` on hero photos, preload critical fonts, defer non-critical CSS
- §SY.14 URL canonicalization rules — trailing slash strategy, query param ordering, lowercase, protocol redirects

### Phase 6 — B2B side (parallel-able from Phase 3+)
- §B.1–§B.14 — `/business` landing, B2B login/signup, dashboard shell, KPIs, salon profile editor, service mgmt, calendar/availability, bookings mgmt, reviews mgmt, photo gallery mgmt, notifications, billing/subscription (V2-D12 Stripe Connect PENDING), multi-staff, onboarding wizard.

---

## Pending cross-cutting decisions

- **V2-D09** — Guest checkout IN or OUT of v1 (Phase 1)
- **V2-D10** — Map view on `/search/results` IN or OUT of v1 (Phase 2)
- **V2-D11** — Loyalty / packages / gift cards in v1 (Phase 2 booking wizard scope)
- **V2-D12** — Stripe Connect (marketplace payouts) vs Stripe regular (Phase 6 architecture)

These get resolved when their phase comes up. Default for all four: **OUT of v1, defer to v2.** Override only if a hard reason emerges.

---

*This doc is the principal. Do not split it into multiple files. Do not duplicate its specs in new top-level docs. Add new sections HERE as new surfaces lock (per V2-D06).*

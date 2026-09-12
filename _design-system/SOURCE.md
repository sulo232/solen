# Solen Design System — SOURCE.md (V3-D183, 2026-05-26)

Use the current checkout's [project instructions](../AGENTS.md#solen-precedence) for precedence, current owner decisions and approval. This file owns detailed design rules; existing code establishes observed behavior, not permission to change design law. Read the scoped contract below for visual work, then the sections relevant to the affected surface. Open choices follow the project's question and parking rules.

## Scoped design contract

The next three sections were moved verbatim from project AGENTS.md: [Taste rules](#taste-rules), [Visual acceptance floors](#visual-acceptance-floors), and [Locked design contract](#locked-design-contract). Read all three before visual judgment or changes; this contract ends before §0. Project precedence explicitly preserves their pinned-rule authority. The rest of SOURCE.md remains subject to the current owners and dated decisions; it does not gain this contract's precedence.

## Taste rules

These rules are the compact in-context layer. `_design-system/SOURCE.md` owns the full system, `_design-system/LOCKFILE.md` owns frozen literals, and `_design-system/TASTE_LOG.md` owns dated screen decisions. On an aesthetic conflict, LOCKFILE wins unless a later owner decision explicitly supersedes it.

1. **No fabricated data.** Never render a number or status without a live source. Omit it and name the wiring gap. Seeding the database is valid and expected when a real section is empty: data read through the normal query is sourced data. Hardcoded JSX or component values with no source remain fabrication.
2. **No decorative artifacts.** Remove separator dots, status pips, duplicate price text, and filler. When color or weight already separates adjacent facts, do not add another separator.
3. **Use neutral surfaces and sparse blue.** Aim for roughly 80 percent white or cool `#F4F4F5` surfaces, roughly 17 percent ink and supporting imagery, and sparse `#276EF1` only on small clickable accents such as text links, small buttons or chips, and tappable review counts. Big CTAs stay ink. See-all arrows stay ink. Secondary buttons are neutral outlines. Filters are neutral: selected is `bg-s-bg-sunken`, `text-s-ink`, semibold; never blue or ink-filled. Booking date and slot selections may use blue.
4. **Use semantic color by role and contrast.** Against white and `#F4F4F5`, respectively: star `#FFC32B` is 1.60/1.46, warning `#F1AE27` is 1.94/1.77, success `#16A34A` is 3.30/3.00, heart `#FF3366` is 3.55/3.23, accent `#276EF1` is 4.58/4.17, and error `#DC2626` is 4.83/4.39. Star and warning need a stroke or darker companion when they carry meaning alone. Success and heart are icon colors, not body text. Accent and error fail AA body text on the sunken surface. Keep universal colors: yellow star, normal green success disc with white check, availability green, red error, and pink save heart.
5. **Keep focal color vivid and emphasis coherent.** Never use dark `.text` tokens such as `#906309` or `#9A3412` as a focal fill. Use a vivid default token or surcharge orange `#EA580C` on a light tint. Apply emphasis to the complete meaningful unit. If a card has both an ink name and price, the name is larger.
6. **Use refined pastel status treatments.** Inline chips use pastel backgrounds, ink text, and a saturated icon. The success disc is `#16A34A` with a white check, not deep green or a pale disc.
7. **Elevation depends on context.** The one primary commit action uses ink fill. Controls over photos use `FROST_GLASS` from `lib/frost-glass.ts`. Calm controls on white or stone are flat with no shadow. Do not place a white shadowed control on a calm white surface.
8. **Use the locked fonts.** Inter Tight for display and headings, Inter for body, and Inter Tight with tabular numbers for codes. Never use Geist.
9. **Ground every value in the system.** Take size, affordance, selected state, copy, and tokens from a locked component or current owner. Refine an existing affordance instead of replacing it by eye. Ask when a required value remains unlocked after investigation.
10. **No long dashes or product emoji.** Do not use em dash or en dash characters in UI copy, code, comments, or commits. Emoji and playful tone are chat-only.

## Visual acceptance floors

Name the screen class before applying these rules. Customer screens include discovery, search, PDP, booking, checkout, profile, and Inspo. Operator screens include `/dashboard/*`, merchant terminal, and queue display.

Operator screens follow the current merchant rules in `_design-system/TASTE_LOG.md`: one carded hero per screen; remaining content is bare text on the canvas; gaps use 16 or 32; one pill specification per context; no colored edge bars; a person or event appears exactly once. A container is earned only when it does something whitespace cannot. Operator screens have no imagery, semantic-color, or sunken-tray floor. Their life source is live data.

For every customer UI or mockup, the working assistant runs a measured check against the correct screen scope. Inspect the rendered screenshot, DOM, interaction, accessibility, and real data. Measure font sizes and weights, focus state, content density, container boundaries, and the scroll distance from the last required input to the commit action. The global review threshold applies; use `design-verifier` when independent Solen visual acceptance is warranted. A customer UI that violates a floor is not ready.

For an explicit owner-commissioned multi-direction or net-new exploration, the aesthetic finished-screen floors and ceilings below diagnose each direction and expose tradeoffs; they do not reject an authorized alternative merely because it varies the production template. Accessible interactions, data truth, money and terms, security, and the approval boundary remain hard requirements.

### Never-again floors

1. **Web has one light theme.** No `prefers-color-scheme: dark`, `data-theme="dark"`, or dark-mode CSS in web files. iOS may retain dark mode.
2. **Type budget:** use 3 to 4 distinct font sizes and no more than 2 weights on one rendered screen.
3. **Empty state:** icon, message, and CTA form one vertically centered unit. Message-to-CTA gap is at most 24px. Trapped space below the primary action is less than 30 percent of the viewport.
4. **Dense commit screen:** the primary commit action is sticky/fixed or appears within roughly one additional viewport height after the last required input is satisfied, regardless of preceding content.
5. **Focal treatment:** use clean ink or a vivid default semantic token. Never use a washed-out gray disc or dark text-token fill as the focal.
6. **Measured reference:** pixel-measure the exact supplied reference. Use `pixel-spec-auto`; if borderless geometry defeats detection, sample pixels directly. Match measured size, ratio, gutter, and type. Record a `measured:` note.

### Customer finished-screen pass

Every customer screen and mockup answers all six in a `floors:` note:

1. A photographic focal is present unless the screen is an exempt form, checkout payment step, legal page, or receipt.
2. Exactly one element is clearly the biggest.
3. At least one real tabular number is present.
4. At least one semantic-color moment is present.
5. There is no dead-gray zone.
6. The longest plausible salon name, full review, and longest service name do not break the two-ink-anchor card rule, the 28px display anchor, or load-bearing copy.

### Customer density and hierarchy

- Imagery is satisfied by real salon content, never by a decorative hardcoded hero or banner. At 390x844, customer browse, discovery, and PDP screens carry roughly one-third photographic area. A SalonCard photo is its largest element. Missing imagery uses the specified sunken background, category icon, and initial fallback rather than an empty gray box. Mockups use real seeded photography.
- Design the populated state first. PDP gallery has at least 5 photos, reviews show at least 3, services show at least 6 rows, and home has at least 4 sections. A first viewport shows at least 4 content units on mobile or 6 on desktop plus a visibly cropped next item. Cards render their full data-backed information stack. Loading, empty, and error states derive from that layout.
- A real thin salon may fall below count floors. It keeps no-fabrication, the missing-photo fallback, and one honest sub-state for each below-floor section.
- Above roughly three times the floors, group and cap: 80 or more services by duration or category, more than 12 visible reviews behind recent-plus-distribution treatment, and more than 12 inline gallery photos behind a lightbox.
- Every elevated container needs a visible boundary on its actual background: sunken tray, flush photo edge, hairline on white, or elevation 2. Grouped content on white with no photo anchor uses a sunken tray. Alternate gray and white for rhythm. Cool chrome needs photography or semantic color in the viewport.
- A deletion must name the cue that remains. It is legal only when the survivor has a between-group gap at least twice the in-group gap or a full weight, size, or color step. Every new ceiling states its paired floor or states that none exists.
- Every customer screen has a display anchor at least 28px unless photography is the focal. Card name is larger at weight 600; price is smaller, weight 600, and tabular; rating is ink-2 beside a yellow star. `#9CA3AF` is chart-only. Chevrons, placeholders, timestamps, and hints use `#6B6B6B`; load-bearing copy does not.
- At most roughly 30 percent of visible text may be weight 600 or above. This is a house threshold with no external study; cite it as a Solen guardrail, not research. The anchor is at least 1.8 times body size, derived from the 28px anchor over the 16px body and rounded from 1.75. Count both type variety and total spread.
- Every paid commit action shows the base, surcharge, and VAT where applicable; the cancellation or refund term in the DOM above the action; and the salon or stylist identity above the action.

### Composition

- The same entity uses the same component and anatomy across screens. Different densities are named variants of one component.
- If `_design-system/COMPONENT_REGISTRY.md` owns an element, compose that component. Do not recreate it inline in a page or feature file.
- Name the screen's one job and justify every element against it. Remove an element that serves another screen's job.

## Locked design contract

Do not reopen a frozen row without the owner naming it. `public/solen-styleguide.html` is the visual rulebook. `_design-system/LOCKFILE.md` is the current literal owner.

| Axis | Current rule |
|---|---|
| Selected and active | Gray `bg-s-bg-sunken`, `text-s-ink`, semibold over white; menu/list options add a check. Content tabs use title plus 2px ink underline, active 600 ink, inactive 400 ink-2. Named exceptions: the one commit button stays ink; booking date/slot stays blue; `SelectedCheckBadge` stays ink over a photo; booking services-step category pills use ink fill. |
| Mockup base | Follow `public/_mockups/_BASE.md`: 402 device constant, full bleed, no fake phone, fonts measured by word width, full-coverage box diff, `-webkit-text-size-adjust:100%`, `100dvh`, safe area for fixed bars, real self-hosted salon photos, and no remote dependencies. Final visual comparison uses a full screenshot diff at the owner's viewport. |
| Links and buttons | Text links use `#276EF1` with underline on hover. See-all arrows and the primary CTA are ink. Secondary buttons are neutral outlines. |
| Depth | SalonCard uses photo plus `shadow-whisper` and no border. Grouped list card uses whisper. PDP/booking sidebar uses hairline only. A tile on gray is white with no shadow. Overlays use elevation 2 or 3. A card has either elevation or border, never both. Over-photo controls use frost; sticky bars use gradient fade. |
| Type | Name 14; meta 12; section H2 `clamp(18px,2vw,20px)`; body 14; CTA 14 on phone as the current working default and 15 on desktop while the phone value remains open; eyebrow 11; customer display anchor at least 28. For a fixed-height one-line control, measure the longest de/en/fr/it string against its maximum width; allow an intentional two-line design or prove it fits. |
| Imagery | Customer browse/discovery/PDP at 390x844 is roughly one-third photographic. SalonCard photo is largest. Missing-photo fallback is sunken plus category icon plus initial. Mockups use seeded photos. Forms, payment checkout, legal pages, and receipts are exempt. |
| Density | Populated target: gallery 5, reviews 3, services 6, home 4 sections; first viewport 4 mobile or 6 desktop plus cropped next item. Above roughly 80 services, 100 reviews, or 40 photos, group and cap. Real thin salons use honest below-floor substates. |
| Hierarchy | Name leads by size. Price is bold ink but smaller. Rating uses a yellow star. Category, city, and distance recede. |
| Availability | Plain ink text, never a green pill. |
| Radius | Form/summary card 16 with `rounded-card` and `shadow-elevation-1`; grouped category-member list card 24 with `rounded-[24px]` and `shadow-whisper`; individual entity card 16, flat with border and gaps; input 12; sheet 28; image flush 0. Button/chip remains 16 except for the unresolved approved payment-screen capsule choice stated above. |
| Spacing | 4px scale; card padding `p-4` or `p-3`; page maximum 1280px, PDP 1180px. |
| Wrapping | Name and meta truncate; title wraps; body clamps; price and rating do not wrap. |
| Icon button | `h-11 w-11`. |
| Hairline | `border-s-border` is `#E4E4E7`. |
| States | Loading uses `<Skeleton>` matching final geometry. Empty uses `<EmptyState>` with an 18/600 promise headline, gesture subline, filled ink CTA to the filling action, and a 3D category icon or ghost preview on a sunken tray. Error uses `<ErrorState>` inline or `ErrorFallback` for a route. Use registered components. |
| Focus | Inputs rest on white with a 1px `#E4E4E7` line, height 48, radius 12. Pointer click and tap change nothing visible. Keyboard focus uses a visible ink indicator on inputs, buttons, links, and other interactive elements. No halo. This decision may be ahead of merged implementation; verify the current code and rendered behavior. |
| Disabled | `opacity-50 cursor-not-allowed`. |
| Touch target | At least 44px, normally `h-11`. |
| Filter pill | Selected gray `bg-s-bg-sunken`, `text-s-ink`, semibold; unselected white with hairline; hover deepens text. Never blue-bordered or black. |
| Category tag | Neutral `bg-s-bg-sunken` plus `text-s-ink-2`; no per-category color. On-photo eyebrow is white. |
| Date/time | Use one `DateTimePicker` primitive with booking strip or search calendar layout. Do not build bespoke date UI. |
| Navigation | Sub-page navigation is single. Do not stack home and back. The city/category breadcrumb replacement is incomplete: current code can suppress the global breadcrumb without rendering the passed local chain. A visible restoration requires a mockup first. |
| Sticky CTA | A commit action is sticky/fixed or within roughly one viewport after the last required input. Reuse `SalonMobileBookBar` on PDP and the booking running-summary treatment where applicable. |
| Theme | Web is light-only. iOS may keep dark mode. |

States are componentized and locked. Use the registered components rather than hand-building equivalents.

## §0 · Source-of-truth reconciliation

This file consolidates four predecessor docs. To avoid ambiguity, here's exactly what happened to each, when, and what wins on conflict.

### Predecessor docs — fate

| File | Era | Decision | Where the content went |
|---|---|---|---|
| `SOLEN_LIVE_TRUTH.md` (976 lines, last touched 2026-05-18 / V2-D70; lived at _tasks/ root until archived 2026-07-06) | Pre-B&W pivot (Aurex/Fresha warm-minimal era with forest `#3B7A57`, terracotta `#D87352`, warm pearl `#F9F8F6`, Plus Jakarta Sans) | **ARCHIVED** → `_tasks/archive/SOLEN_LIVE_TRUTH.md` (full content; banner stub at `_tasks/archive/SOLEN_LIVE_TRUTH.archived.md`) | Almost everything in it contradicts current state. Section refs like §F.1 / §5b / §16 are kept alive here under refreshed token values. |
| `_tasks/SOLEN_DESIGN.md` (85 lines, 2026-05-25 / V3-D139) | Current B&W truth — `#16A34A` forest emerald + `#0A0A0A` ink + 80/17/3 rule | **EXTRACTED + ARCHIVED** → `_tasks/archive/SOLEN_DESIGN.archived.md` (filename corrected 2026-08-03; the `_pre-V3-D183` name this row used has never existed on disk or in git) | 100% of token content lives in §2 (Colors) of this file. §1 (Brand positioning) keeps its 80/17/3 rule. |
| `_rules/SOLEN_PATTERNS.md` (314 lines, 2026-05-10) | V2-D49 era — emerald `#1F5C42`, cream substrate, Peace Sans, atmosphere wash, 4 cat colorways | **PARTIAL EXTRACT; NOT ACTUALLY ARCHIVED** (corrected 2026-08-03: `_tasks/archive/SOLEN_PATTERNS_pre-V3-D183.archived.md` does not exist and never did , the source file is still live at `_rules/SOLEN_PATTERNS.md`, where the precedence chain's tier 8 makes its emerald/cream/Peace-Sans token specs history, not law) | Parts 4-5-8 (Fresha translation playbook + workflow + open questions) extracted into §21. Part 2 structural skeletons go into per-component `.md` files as "Anatomy" sections. Token specs all retired. |
| `_rules/SOLEN_UI.md` (398 lines, 2026-05-10) | Universal principles + V2-D49 token examples | **KEPT IN PLACE, NEEDS REFRESH** | The 10 principles + tactical heuristics + anti-patterns are universal and stay. Specific token mentions (Peace Sans, `#1F5C42` emerald, `#C97A57` terracotta, cream substrate, "60/30/10 split") MUST be updated to point at this file. Pending edit listed in QUESTIONS.md. |

### Precedence rule (what wins on conflict)

Follow [Solen precedence](../AGENTS.md#solen-precedence). Current explicit owner decisions, safety floors and LOCKFILE govern as specified there. Only the three named scoped contract sections above retain the moved AGENTS.md authority; this does not promote the rest of this document. A running implementation is evidence of what happens, not authority to overwrite a settled decision. Establish the cause of drift before changing code or its owner.

Per-component documents own their component specifics within those higher rules. `_rules/SOLEN_UI.md` supplies general UI principles and cannot override current tokens or decisions. Archived files describe retired states and are historical evidence only.

### Drift between this doc and code

**Q1-Q20 all RESOLVED 2026-05-26.** See [QUESTIONS.md](QUESTIONS.md) for the full decision log. Material resolutions baked into this doc:

- **Q1 (yellow stars)**: `s-star` is `#FFC32B` (yellow, universal signal). Supersedes V3-D95 "never yellow." `tailwind.config.js` `s-star` token to be updated from `#1A1A1A` → `#FFC32B` (Q1 follow-up).
- **Q4 (input font)**: Plus Jakarta Sans → Hanken Grotesk in `app/globals.css` — **shipped V3-D189**.
- **Q5 (focus ring)**: Teal `#043338` → `s-ink #0A0A0A` in `app/globals.css` — **shipped V3-D189**.
- **MAJOR (Q1 secondary, V3-D189)**: `s-brand` family (green) **retired as brand color**. Solen is B&W; CTAs/logo/chrome use `s-ink`. See §2.2.
- **Q2 / Q3 / Q15**: retired easings + retired color tokens stay defined for back-compat. Hard deletion backstop: **2026-08-26**.
- **Q19 (B&W photos)**: brand chrome stays B&W; user-uploaded photos stay color. Locked.
- **Q20 (IA references)**: Mobbin first; **Chrome (Playwright) live capture from Fresha when Mobbin lacks the screen.** See §21.

---

## §1 · Brand positioning

### The one-liner

> **Solen — Termin in 30 Sekunden. Beauty & Wellness in der ganzen Schweiz.**

Swiss-first beauty & wellness booking marketplace. The "30 Sekunden" claim is the entire competitive position — every UI decision should preserve or enhance that promise. If a flow takes longer than 30 seconds in user time, audit and shorten.

### Audience + market

- **Primary**: customers in Basel / Zürich / Bern (launch cities), expanding to French + Italian Switzerland
- **Secondary**: salon owners (`/business` / `/dashboard/*`)
- **Locale priority**: German first, then English, then French, then Italian (UI defaults `de`)
- **Devices**: Mobile-first design (≥75% of expected traffic). Desktop is a secondary surface — every feature must work on mobile before desktop work begins.

**Desktop-considered vs mobile-stretched (responsive-desktop-04, 2026-07-27):** a screen that renders identically at 375px and 1280px except for a wider centered container is NOT "desktop-considered", it is mobile-stretched, and the two must be distinguishable, never left implicit. For any screen with a real desktop layout, name explicitly what changes at `>= lg` (1024px): column count, whether secondary metadata hidden/truncated on mobile becomes visible, and whether a mobile bottom-sheet action promotes to inline/sidebar. Individual components already do this and are the reference examples: `SalonSidebar` (desktop-only contact/hours panel), `SalonHero`'s photo gallery, `SalonBreadcrumb`. Where a screen is intentionally mobile-stretched (owner accepted, not unbuilt), say so in its component doc or a code comment, so silence stops reading as an unmade decision. `WORK_TYPES.md`'s screenshot conditional ("desktop, if route has a desktop layout") should read from a real per-route table (desktop-considered / mobile-stretched-by-design / not-yet-built), not an eyeballed guess at screenshot time.

**Tablet (768-1024px) design intent (responsive-desktop-05, 2026-07-27):** tablet has an automated regression project (`playwright.config.ts`, 768x1024) that catches PIXEL DRIFT but never verifies the tablet render was ever an intentional design choice. Any screen where tablet renders materially differently from both mobile and desktop (not a pure interpolation of the two) must name that layout here or in the relevant component doc, same as mobile/desktop treatments are named. Where tablet is deliberately "just a wider mobile" or "just a narrower desktop", that inheritance is also a stated decision, not a default nobody chose. A regression baseline passing forever is not proof a human ever looked at or approved that layout.

### The color law — three-layer system (V3-D197, 2026-05-26)

**Supersedes the V3-D192 "80/17/3 + signals" framing.** That model was correct for chrome but didn't account for **semantic UI** — surfaces where color IS the meaning. This caused a recurring bug (Toast V3-D196 patch, would have hit StatusPill / AlertBanner / FormFieldError next). V3-D197 introduces a third layer that codifies the entire class.

Every color use on Solen belongs to **one of three layers**:

| Layer | Budget | What it is | Where it appears |
|---|---|---|---|
| **1 · Chrome** | ~97% (80% white surfaces + 17% ink) | Color is NOT the message. Pure B&W: white/sunken bg, ink text, ink hairlines, ink icons | Page bg, cards, modals, h1-h6, body, default buttons, dividers, footer, layout, photos |
| **2 · Interactive accent (blue)** | no budget cap — sized by how many interactive affordances are on screen | Color says "this is tappable." Single saturated hue `s-accent #276EF1`, ~~used GENEROUSLY on interactive affordances~~ (v2 wording, RETIRED by LOCKFILE §1.5 v3 2026-06-11: hyperlink-scope only) | Text links, see-all/view-all, active tab/segment state, secondary & ghost buttons, tappable row affordances, inline action labels (Buchen/Wegbeschreibung/Verwalten), interactive icon tints. NOT eyebrows or bullets (those stay text-s-ink-3) — blue marks interaction, never emphasis |
| **3 · Semantic UI** | Variable (each instance is small but unbudgeted) | **Color IS the message.** Universal-convention hues users recognize at-a-glance. | Toast tones, StatusPill, AlertBanner, FormFieldError, ProgressBar step state, urgency badges, rating, save-fill, validation states |

**The 80/17/3 numbers still describe chrome + brand-accent budget.** They're a budget, not a ceiling — semantic UI is unbudgeted because each instance is small and its presence is justified by meaning, not aesthetic.

### Decision tree — every new component component must answer in this order

```
1. Does this surface CONVEY semantic meaning by color?
   (success/error/warning/info/open/closed/active/inactive/urgent/rating/save/…)

   → YES → Layer 3 semantic UI (see §2.5 universal color conventions)
   → NO  → continue

2. Is this surface INTERACTIVE — can the user tap it?
   (text link, see-all/view-all, tab/segment, ghost/secondary button, tappable row, inline action label, interactive icon)

   → YES → Layer 2 interactive accent — ONLY if it reads as a hyperlink (LOCKFILE §1.5 v3 2026-06-11; the old "GENEROUSLY, no footprint cap" v2 wording is RETIRED). See-all / tabs / secondary buttons / icon tints = INK with affordance. The one primary COMMIT CTA is the exception — stays `bg-s-ink`. NON-interactive text (eyebrow, label, price, bullet) is NOT blue (v2 rule 2).
   → NO  → continue

3. Default: Layer 1 chrome (B&W, see §2.1 ink table)
```

This decision tree is the **canonical onboarding for every new component** (CLAUDE.md rule). Sub-agents building components must include this answer in their `_design-system/components/<Name>.md` Purpose section.

### Universal colors — we don't invent semantic hues

Solen uses **the colors humans already recognize** from a lifetime of UI exposure. We do not invent custom semantic colors. If a meaning has a universal hue, we adopt the universal hue and map to our token.

> **HEX SUPERSEDED (2026-06-01, V3-D421), see LOCKFILE §1 (CANON folded into LOCKFILE 2026-07-10):** `s-accent` = **#276EF1**. The "generously on everything tappable" wording that stood here was the v2 model, RETIRED by LOCKFILE §1.5 v3 (2026-06-11): blue is the HYPERLINK color (review counts, inline body links, Mehr lesen, the sparse hyperlink set) + system states; see-all / tabs / secondary & ghost buttons / icon tints = INK with affordance. `s-warning` = **#F1AE27** (the accent's amber twin). Closed + error share ONE red **`#DC2626`** (V3-D421 consolidated `s-error` onto the locked red; code-verified tailwind.config.js:178). Where a hex below conflicts with LOCKFILE, LOCKFILE wins.

| Universal semantic | Standard hue | Solen token | Hex | Where it shows up |
|---|---|---|---|---|
| Success / Go / Open | Green | `s-success` | `#16A34A` | Toast success, StatusPill "Geöffnet", booking confirmed states |
| Error / Danger / Closed | Red | `s-error` | `#DC2626` | Toast error, FormFieldError border + text, "Geschlossen", critical alerts |
| Warning / Caution | Amber | `s-warning` | `#F1AE27` | Toast warning, "Letzte Plätze" notices, validation that's not-blocking |
| Interactive / Info | Blue | `s-accent` | `#276EF1` | Links, inline body links, review counts, Mehr lesen, checkout jump-links; plus Toast info, Spinner, §13.2 stepper discs. ~~see-all/view-all, active tab/segment, ghost & secondary buttons, tappable rows, interactive icon tints, focus rings, input focus~~ , **RETIRED by LOCKFILE §1.5 v3 (2026-06-11, council), which supersedes the v2 "generous" scope by name: see-all / tabs / secondary buttons / icon tints = INK with affordance. Focus rings and input focus are additionally dead by the owner's 2026-08-09 decision (TASTE_LOG). Marker added 2026-08-17 by the weekly law pass; the two rows at §1 lines 80 and 97 already carried it and these two did not.** OFF non-interactive text (eyebrows, body, prices, headings) |
| Rating | Yellow | `s-star` | `-> LOCKFILE` | Stars only, universal across review surfaces |
| Save / Love | Hot pink | `--heart-active` | `#FF3366` | Saved-favorite heart fill only |
| Urgency / Hot | Vermilion | `s-urgency` | `#C2410C` text on `#FFF1E6` bg (V3-D424; was #9A3412) | "Nur X heute" Flame badge only |
| Disabled / Inactive | Muted grey | `s-ink-3` / `s-ink-disabled` | `#6B6B6B` / `#C5C8C4` | Disabled buttons, inactive tabs, low-importance text |

**Rule:** if a UI element conveys one of the meanings above, use the listed token. Don't invent a "Solen-specific" success green or warning amber. The universal hue is the whole point — users recognize it without thinking.

### The saturation contract (V3-D199, 2026-05-26)

Every semantic color in our system MUST exist in two forms with matched H but predictable L/S ranges:

| Form | Used for | HSL target |
|---|---|---|
| **`.DEFAULT`** — saturated signal | Icons, text-on-white, borders, fills, filled buttons | **L 36-60%**, **S 65-92%** (Tailwind-500/600 range) — V3-D204 widened from L 36-51% to accommodate brighter brand blues like `s-accent #276EF1` HSL(215°, 88%, 55%) |
| **`.bg`** / **`.pale`** — pastel surface | Layer 3 toast/alert/banner backgrounds, soft tints | **L 93-96%**, **S 25-100%** (Tailwind-50 range) |

When adding a new color token to `tailwind.config.js`, both forms MUST be defined together. **Recipe for the `.bg` variant:** keep the hue, push L to ~93%, lower S to ~25-65% (or higher for warm hues that naturally need more saturation to appear tinted).

**Anti-patterns:**
- ❌ Defining only `.DEFAULT` (forces future Layer 3 surfaces to invent on the fly)
- ❌ Defining a pastel that's L < 92% — reads as a "card bg color" not a "tinted air" surface
- ❌ Defining a saturated that's L < 36% — too dark, reads as ink-with-hue not as signal
- ❌ Mixing hues (defining `.bg` with a different H than `.DEFAULT` — drift)

**Already-in-system examples** (use as reference when adding new tokens):
- `s-success.DEFAULT #16A34A` (HSL 142, 76%, 36%) + `.bg #E8F5E9` (HSL 122, 28%, 93%)
- `s-error.DEFAULT #DC2626` + `.bg #FEE2E2` (V3-D421 one-red consolidation; corrected 2026-07-12, was #D32F2F/#FFEBEE)
- `s-warning.DEFAULT #F1AE27` (HSL 40, 88%, 55%) + `.bg #FDF6E7` (HSL 41, 80%, 95%) — the accent's amber twin (LOCKFILE §1)
- `s-accent.DEFAULT #276EF1` (HSL 215, 88%, 55%) + `.pale #EAEFFE` (HSL 226, 92%, 96%) — V3-D204

**What WE DON'T do:**
- ❌ Invent a custom "Solen success" that's slightly off-standard
- ❌ Use brand-accent royal blue for error/success/warning (it isn't those things)
- ❌ Default to ink chrome for components whose color IS their meaning (the recurring Agent D mistake — Toast got patched, but the rule now PREVENTS this for the next 10 components)
- ❌ Stack semantics: don't use 4 different greens for "success" depending on context. One green per role.

### Voice register (full rules in `COPY_LAW.md`; Solen patterns in §18)

Direct, action-oriented. **Formal register: `Sie` (de), `Lei` (it), `vous` (fr)** — owner 2026-07-29,
**supersedes** this line's former "German `du` not `Sie`". Canonical: `_design-system/COPY_LAW.md` §1.
Speed-anchored copy ("Nur 1 heute", "Termin in 30 Sek."). Avoid sales-y exclamation marks. Never invent claims.

---

## §2 · Color tokens

All tokens come from `tailwind.config.js` `theme.extend.colors`. Always reference tokens via Tailwind classes (`bg-s-bg-sunken`, `text-s-ink`) — never inline hex.

**Where the hex lives (single-sourced 2026-08-09).** A cell reading `-> LOCKFILE` means the value is
owned by [LOCKFILE.md](LOCKFILE.md) §1 and is deliberately NOT repeated here. Measured before the
change: 13 rows in this file restated a value LOCKFILE already froze. None of them disagreed yet,
which is exactly when to remove the duplicate, because a second copy is only ever one edit away from
becoming a second answer. What stays here is what LOCKFILE does not carry: the Tailwind class and
the use. The precedence chain already made LOCKFILE the owner on a conflict; this makes it the owner
on the page too.

### §2.1 · Live tokens (use freely)

#### Accent — Royal Blue (V3-D192-fix, 2026-05-26)

~~The interactivity signal, used GENEROUSLY on anything tappable~~ (v2, RETIRED by LOCKFILE §1.5 v3 2026-06-11): blue is the HYPERLINK color — review counts, inline body links, Mehr lesen + system states. See-all / tabs / ghost & secondary buttons / tappable rows / icon tints = INK with affordance. **NOT the single primary commit CTA** (that stays `bg-s-ink`, one per screen — v2 rule 3). Blue marks interaction, never emphasis: non-tappable text stays ink/grey.

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `s-accent.DEFAULT` | `#276EF1` | `bg-s-accent` / `text-s-accent` / `border-s-accent` | Text that reads as an `<a href>` inside prose: inline body links, review counts, Mehr lesen, Passwort vergessen, checkout Ändern jump-links. ~~see-all/view-all, active/selected tab text, ghost & secondary button text+border, tappable row affordances, "NEW" pill bg, interactive icon tints~~ , **RETIRED by LOCKFILE §1.5 v3 (2026-06-11), same supersession as the §2.5 row above; marker added 2026-08-17.** NOT eyebrows/bullets, NOT data-emphasis (non-interactive text stays ink) |
| `s-accent.deep` | `-> LOCKFILE` | `bg-s-accent-deep` / `text-s-accent-deep` | Link `:hover`, accent-on-bg `:hover` (DS-6 2026-06-11 re-activation; corrected 2026-07-12, was stale #0F2A99) |
| `s-accent.pale` | `-> LOCKFILE` | `bg-s-accent-pale` | "Selected" row bg, focus-glow tint, NEW pill bg-light variant |

**Contrast vs white** (`text-s-accent #276EF1` on white) = **4.58 : 1** (recomputed 2026-07-27 via `node scripts/check-contrast.mjs --self-test`, matches RATIONALE.md §4's measured table; the older `3.7:1` figure printed here was a stale hand calculation, corrected) — passes WCAG AA for normal-size text, but with almost no headroom. On `bg-s-bg-sunken` the SAME token drops to 4.17:1 and FAILS AA (RATIONALE.md §4), so blue links/labels on a sunken tray still need to lean large/bold or on-white; do NOT use #276EF1 for 11px metadata text on a sunken surface. (The old #1638C4 was ~9.6:1 / AAA; v2's brighter #276EF1 trades contrast for vibrancy.) Any NEW text/bg pairing should be checked with `scripts/check-contrast.mjs`, not assumed from this paragraph.

**Where to use:** text links (Mehr lesen →), see-all/view-all, active tab/segment state, ghost & secondary buttons, tappable row affordances, inline action labels, the chevron→arrow next to section titles. NOT eyebrows or decorative bullets — those stay text-s-ink-3 with no leading dot (v2 rule 2).

**Where NOT to use (V3-D192-fix lock):**
- ❌ Primary CTAs (Termine finden, Suchen, Booking) — stay `bg-s-ink`. Blue on the main button defeats the "accent" semantic; the eye has nowhere to land as a highlight if blue IS the dominant surface.
- ❌ Body text / headings / chrome that isn't a deliberate highlight
- ❌ Borders / hairlines / dividers
- ❌ Focus-visible ring (Q5 locked to `s-ink` for WCAG contrast and consistency)

#### Chrome (ink — used for all NON-accent UI)

`s-ink` is still the workhorse for all non-accent chrome: body text, headings, icons, secondary buttons, focus-visible outline (per §16.2), hairlines.

| Token | Hex | Tailwind class | Use |
|---|---|---|---|
| `s-ink` | `-> LOCKFILE` | `bg-s-ink` / `text-s-ink` / `border-s-ink` | Default body, h1-h6, secondary buttons, focus-visible outline (Q5 ruled) |

**Contrast vs white**:
- `text-s-ink #0A0A0A` on white = ~19.6 : 1 → **AAA** (passes all text sizes).
- `text-white` on `bg-s-ink` = ~19.6 : 1 → **AAA**. Used for secondary CTAs / dark sections.

#### Ink (the 17% band)

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `s-ink` | `-> LOCKFILE` | `text-s-ink` | Default body, h1, h2, primary text |
| `s-ink-2` / `s-ink.secondary` | `#6B6B6B` | `text-s-ink-2` | Secondary text, metadata, captions |
| `s-ink-3` | `#6B6B6B` (collapsed) | `text-s-ink-3` | Same as ink-2 in V3-D138. Tertiary text role. Still distinct semantically for future un-collapse. |
| `s-ink.disabled` | `#C5C8C4` | `text-s-ink-disabled` | Disabled state text |

**Never use** pure black `#000000` — causes eye strain on warm-ish surfaces. Always `s-ink #0A0A0A`.

#### Surfaces (the 80% band)

| Token | Hex | Tailwind | Use |
|---|---|---|---|
| `s-bg.base` | `-> LOCKFILE` | `bg-s-bg-base` | Page substrate |
| `s-bg.surface` | `-> LOCKFILE` | `bg-s-bg-surface` | Card / modal bg |
| `s-bg.raised` | `-> LOCKFILE` | `bg-s-bg-raised` | Tooltip / popover bg (same hex; semantic distinction reserved) |
| `s-bg.sunken` | `-> LOCKFILE` | `bg-s-bg-sunken` | Hover bg, input-active bg, inert recessed surfaces — COOL light grey, NOT warm cream/stone (v2 rule 4; reverses the V3-D460 warm #F8F5F2) |
| `s-bg.active` | `-> LOCKFILE` | `bg-s-bg-active` | Input typing state (same hex as sunken) |
| `s-border` | `-> LOCKFILE` | `border-s-border` | Hairlines, dividers, card outlines — COOL neutral (v2; reverses the V3-D460 warm #E8E4DF) |

#### Semantic colors (off-budget — they're signals, not branding)

| Token | Hex | Use |
|---|---|---|
| `s-love` DEFAULT | `#CC4A60` | Heart-saved fill, sale/discount chips (dual duty per Airbnb pattern) |
| `s-love.soft` | `#FAD2DA` | Light warm-red bg for sale chips |
| `s-love.deep` | `#A23548` | Dark warm-red text on `.soft` bg |
| `s-success` DEFAULT | `#16A34A` | Success state (same hue as brand — distinguish by context) |
| `s-success.bg` | `#E8F5E9` | Success surface tint |
| `s-warning` DEFAULT | `#F1AE27` | Warnings (the accent's amber twin, LOCKFILE §1) |
| `s-warning.bg` | `#FDF6E7` | Warning surface tint |
| `s-error` DEFAULT | `#DC2626` | Errors |
| `s-error.bg` | `#FFEBEE` | Error surface tint |
| `s-closed` | `-> LOCKFILE` | "Geschlossen" / closure states — distinct from error |
| **`s-star`** | `-> LOCKFILE` | **Rating stars — universal yellow signal. V3-D189 (2026-05-26, Q1 resolved): yellow is the locked color. Supersedes V3-D95 "never yellow." Update tailwind.config.js `s-star: "#FFC32B"`.** |
| **`--heart-active`** | **`#FF3366`** | **Saved-favorite heart fill (signal exception). V3-D103.** |

#### Inline urgency (currently only used in one place — Flame badge "Nur X heute")

The "Nur X heute" badge uses `s-urgency #C2410C` (V3-D424 vermilion text on `#FFF1E6` bg with `rgba(194,65,12,0.22)` border; was inline #9A3412, de-muddied). This is the **single sanctioned warm exception** in the locked B&W palette — urgency reads warm by physiological convention. It is an off-budget semantic exception (and v2 retired the old "3% accent" cap entirely — interactive blue is not budgeted).

### §2.2 · Retired but still defined (drift-checker target)

These tokens exist in `tailwind.config.js` for backwards compat with un-rebuilt routes. **Any usage in new code is drift.** Drift-checker flags. They will be deleted from config once usage drops to zero across the codebase.

| Token | Hex | Retired in | Reason |
|---|---|---|---|
| **`s-brand` family** | **`#16A34A` etc.** | **V3-D189 (2026-05-26)** | **Q1 decision: forest emerald is no longer a brand color. Solen is B&W; chrome is `s-ink`. All `s-brand` callsites must migrate to `s-ink` (CTAs) or be removed (logo dots already dropped). Hard backstop: 2026-08-26 (Q15).** |
| `s-brand-mid` `s-brand-deep` `s-brand-pale` `s-brand-subtle` | `#15803D` `#14532D` `#DCFCE7` `#F0FDF4` | V3-D189 | Same — brand-green family retired together. |
| `s-coral` family | `#3B7A57` etc. | V3-D139 | Pre-B&W pivot brand (V2-D70 Aurex era). Token name lies — value is forest emerald, not coral. |
| `s-cool` | `#89B4CA` | V3-D138 | Dusty blue — pre-B&W. Reserved for future use per memory `project_palette_b_w_pivot.md`. |
| `s-pop` | `-> LOCKFILE` | V3-D138 | Vermilion — pre-B&W. **UN-RETIRED V3-D424 (2026-06-02): live urgency-badge token, see LOCKFILE §1** |
| `s-wasabi` | `#F6EDE3` | V3-D138 | Cream section tint — pre-B&W |
| `s-droplet` | `#E8F0F4` | V3-D138 | Pale dusty blue — pre-B&W |
| `s-cream` | `#E9DFC8` | V3-D138 | Cream substrate — pre-B&W |
| `s-accent.*` | `#FFC32B` family | V3-D138 | Legacy golden amber accent — accent role retired entirely V3-D189 (no more accent band). |
| `s-butter` | `#F2D77B` | V3-D138 | Bright yellow stat-card highlight — pre-B&W |
| `s-sage` family | `#A8B89A` etc. | V2-D49j | Sage CTA color — too low contrast on cream (which is itself retired) |
| `s-cat-coiffeur*` `s-cat-barbershop*` `s-cat-nails*` `s-cat-spa*` | various | V3-D138 | Earthen Wellness category colorways — replaced by neutral grey tiles in MobileCategoriesRow |
| `s-atm-cream` `s-atm-terra` `s-atm-sage` `s-atm-bone` `s-atm-butter` | various | V2-D68 | Atmosphere wash colors — wash entirely retired |
| `--shadow-warm-*` aliases | various | (warm tint legacy) | Use `elevation-1/2/3` |
| `--ease-out-strong` `--ease-out-warm` `--ease-in-subtle` `--spring-bounce` `--ease-drawer` | various | V2-D16+ | Use canonical 4: `snap` / `spring` / `glide` / `thud` |

**Active accent (v3, 2026-06-11; v2 "generous" RETIRED):** Royal blue `s-accent #276EF1` is the HYPERLINK accent — hyperlink-reading text (review counts, inline body links, Mehr lesen) + system states only; tabs / ghost & secondary buttons / see-all / icon tints = INK with affordance. See LOCKFILE §1.5 v3 (CANON folded into LOCKFILE 2026-07-10). (Stale hex #1638C4 → #276EF1.)

### §2.3 · Color anti-patterns

- ❌ Hardcoded hex anywhere except inline urgency band (§2.1 Flame badge) and the universal-color signal tokens. Use Tailwind tokens.
- ❌ Reintroducing Peace Sans, terracotta, cream substrate, atmosphere wash. All retired.
- ❌ Using `s-brand` ANYWHERE in new code (V3-D189 — still retired). Token kept for back-compat only.
- ❌ Using `s-accent` (royal blue) on primary CTAs — accent ≠ primary action surface (V3-D192-fix). Primary CTAs stay `bg-s-ink`.
- ❌ Defaulting to chrome ink for a component whose color carries semantic meaning (V3-D197). If success/error/warning/info/open/closed/active is being communicated, the surface belongs to Layer 3 semantic UI — use the universal-color token. The recurring Agent-D-style mistake.
- ❌ Inventing custom semantic hues. There's only ONE green for success (`s-success #16A34A`), ONE red for error (`s-error #DC2626`), ONE amber for warning (`s-warning #F1AE27`). Don't shift them ±10° for "brand feel" — the universal hue IS the brand feel.
- ❌ Stacking semantics: do not use the brand-accent royal blue to mean "info" in one place and "selected tab" in another in the same module. Pick one role per surface.
- ❌ Tinted shadows (`rgba(R, G, B, ...)` where RGB matches a retired brand color). Shadows are warm-ink only.

### §2.5 · Semantic UI surfaces catalog (V3-D197, 2026-05-26)

Surfaces that obey **Layer 3 semantic UI** (color IS the meaning). Each entry maps a surface → universal hue → token → typical class string. **Adding a new component? Check this catalog first.** If the surface conveys a meaning listed here, use the listed token. If the meaning is new, propose it via QUESTIONS.md before inventing.

| Surface | Meaning | Hue / token | Typical class |
|---|---|---|---|
| `<Toast tone="success">` (inline transient status — KEEP pastel) | low-emphasis confirmation | green pastel + saturated icon (v2 rule 6 chip/badge carve-out) | `bg-s-success-bg text-s-ink border-s-success/15` + `<CheckCircle2 text-s-success>`. *(The FOCAL booking/payment confirmation is NOT a toast: normal-green `s-success #16A34A` disc + WHITE check + motion — see SuccessMark. Deep #15803D reverted 2026-06-10.)* |
| `<Toast tone="error">` | Failure, blocked action | red pastel + saturated icon | `bg-s-error-bg text-s-ink border-s-error/15` + `<AlertCircle text-s-error>` |
| `<Toast tone="warning">` | Caution, non-blocking advisory | amber pastel + saturated icon | `bg-s-warning-bg text-s-ink border-s-warning/20` + `<AlertTriangle text-s-warning>` |
| `<Toast tone="info">` | Neutral information, FYI | blue pastel + saturated icon | `bg-s-accent-pale text-s-ink border-s-accent/15` + `<Info text-s-accent>` |
| `<StatusPill state="open">` | "Geöffnet" (open now) | green / `s-success` | `text-s-success font-semibold` (text-only — color carries it) |
| `<StatusPill state="closed">` | "Geschlossen" | muted / `s-ink-3` | `text-s-ink-3 font-medium` |
| `<StatusPill state="urgent">` | "Schnell weg / Nur X heute" | amber / inline | `text-s-urgency bg-[#FFF1E6] border-[rgba(194,65,12,0.22)]` (V3-D424 token; was inline #9A3412) + `<Flame>` |
| `<FormFieldError>` | Validation failure | red / `s-error` | `border-s-error text-s-error` + helper text |
| `<FormFieldSuccess>` (rare) | Confirmed valid (e.g. unique email check passed) | green / `s-success` | `border-s-success text-s-success` |
| `<AlertBanner tone="X">` | Cross-page warnings (cookie banner, maintenance) | per-tone | mirror Toast tones; full-width strip |
| `<ProgressStep state="complete">` | Booking wizard step done | green / `s-success` | filled circle bg, white checkmark |
| `<ProgressStep state="current">` | Active step | blue / `s-accent` | filled circle bg, white number |
| `<ProgressStep state="pending">` | Future step | muted / `s-ink-3` | hollow circle, ink-3 border |
| Rating star (filled) | "This salon scored X" | yellow / `s-star` | `fill="#FFC32B"` (universal star convention) |
| Rating star (empty) | Score remainder | grey / `s-border` | `fill="#E4E4E7"` (corrected 2026-07-10; matches the live `s-border` token at SOURCE.md:211 and `RatingStars.tsx:183`'s `fill-s-border`) |
| Heart (saved) | "You saved this" | pink / `--heart-active` | `fill="#FF3366"` |
| Heart (unsaved) | Default | ink-stroke / `s-ink` | `stroke="var(--color-heading)" fill="none"` |
| "NEW" badge (brand) | Brand identity moment, not semantic | blue / `s-accent` | `bg-s-accent text-white` (Layer 2, NOT Layer 3 — listed here for the decision boundary) |
| Disabled / inactive surface | Affordance-off | muted / `s-ink-disabled` | `opacity-50 cursor-not-allowed` + neutral colors |

**When adding to this catalog:**
1. Identify the meaning (success / warning / open / closed / etc.)
2. Check universal-color table in §1 — does a standard hue exist for this meaning? Use it.
3. Add the row here with token + class
4. Add the per-component .md file referencing this row
5. NEVER skip step 2 and invent a new hue

---

## §3 · Typography — V3-D191 (2026-05-26)

> **VALUES SUPERSEDED (2026-06-01, V3-D421).** The literal type values in this section predate the V3-D325/D327/D410 sweeps. Single source of truth is now LOCKFILE §2 (CANON folded into LOCKFILE 2026-07-10): body = **Inter 400** (not Hanken 300), display = **Inter Tight** (not Bricolage), headings **600** (Hero **700**, never 800), eyebrow tracking **0.08em**. This section stays for rationale; where a value here conflicts with LOCKFILE, LOCKFILE wins.

### Fonts (locked)

| Family | Tailwind | Files using it |
|---|---|---|
| **Inter Tight** | `font-display`, `font-heading` (alias) | Page H1s ("Termin in 30 Sek."), Section H2s, MobileCategoriesRow H2 — all display headings. V3-D190 swap (supersedes Bricolage Grotesque). |
| **Inter** | `font-body` (default) | Everything else: body, labels, buttons, captions, metadata, numerics. **V3-D410: replaced Hanken Grotesk; default weight 400 (Inter 400 reads solid where Hanken 400 read thin).** |

Both loaded via `app/globals.css` Google Fonts `@import` with `display=swap`. Inter Tight weights 500/600/700/800/900. Hanken weights **300/400/500/600/700/800**.

**The contrast formula (V3-D191):** display Inter Tight **900** ↔ body Hanken **300** = **3.0× weight ratio**. The thin body is what makes the heavy display feel intentional rather than uniformly chunky. Without this contrast (the V3-D190 version), the whole page read "loud" — no place for the eye to rest. With Hanken 300 body, the H1 dominates by *weight contrast* the way Uber's display does.

**Why both families (not single-family like Uber Move):** Inter Tight at thin weights (300) doesn't have the slightly warmer letter aperture Hanken Grotesk does. Hanken at 300 reads as a "calmer" body than Inter Tight 300 — better for German compound words. We get the Uber weight-contrast principle without losing body legibility.

### Type role table — Scale B (V3-D190, -10% from V3-D75 baseline)

The canonical roles. Pick a role; use its exact spec. Don't invent new sizes.

| Role | Class | Size (px / clamp) | Weight | Tracking | Line-height | Case | Use |
|---|---|---|---|---|---|---|---|
| Hero H1 | `font-display text-[clamp(36px,9vw,46px)] font-extrabold leading-[1.0] tracking-[-0.03em]` | clamp(36, 9vw, 46) | **800** | -0.03em | 1.0 | sentence | Page hero only (`Termin in 30 Sekunden.`) — V3-D193 weight 900→800 |
| Page H2 | `font-display text-[clamp(25px,4vw,40px)] font-extrabold leading-[1.0] tracking-[-0.03em]` | clamp(25, 4vw, 40) | **800** | -0.03em | 1.0 | sentence | BusinessTeaser-style h2 — V3-D193 weight 900→800 |
| Section H2 | `font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink` | clamp(18, 2vw, 20) | **600** | -0.01em | 1.25 | sentence | "Top auf Solen", "In der Nähe", "Profis in deiner Nähe", "Finde deine Inspiration.", "Bewertungen" — **corrected 2026-07-10 to match LOCKFILE:227 (the CONSISTENCY_AUDIT.md fix flagged 2026-06-07, never applied); this row previously read clamp→23px/700/-0.03em, which conflicted with LOCKFILE. LOCKFILE wins on the aesthetic axis (dual-axis rule) — 20px/600 is canonical.** |
| MobileCategoriesRow H2 | `font-display text-[clamp(18px,5vw,20px)] font-bold leading-[1.2] tracking-[-0.03em]` | clamp(18, 5vw, 20) | **700** | -0.03em | 1.2 | sentence | "Für dich" only — V3-D193 weight 800→700 |
| Logo wordmark | `font-display font-extrabold leading-none tracking-normal` | per size variant | **800** | normal | 1 | sentence | "Solen" header logo — V3-D193 weight 900→800 |
| Card name (h3) | `font-body text-[14px] font-medium leading-[1.25] tracking-[-0.01em] text-s-ink` | 14 | **500** | -0.01em | 1.25 | sentence | SalonCard name (V3-D191: 600→500) |
| Card name (stylist) | `font-body text-[15px] font-medium leading-[1.2] tracking-[-0.01em] text-s-ink` | 15 | **500** | -0.01em | 1.2 | sentence | FeaturedStylists name (V3-D191: 700→500) |
| Hero sub | `font-body text-[clamp(14px,3.5vw,16px)] font-light leading-[1.4] tracking-[-0.025em] text-s-ink-2` | clamp(14, 3.5vw, 16) | **300** | -0.025em | 1.4 | sentence | "Beauty & Wellness in der ganzen Schweiz." (V3-D191: 500→300) |
| Body primary | `font-body text-[14px] font-light leading-[1.55] text-s-ink` | 14 | **300** | normal | 1.55 | sentence | Most paragraphs (V3-D191: 400→300) |
| Body secondary | `font-body text-[12px] font-light leading-[1.35] text-s-ink-2` | 12 | **300** | normal | 1.35 | sentence | Address rows, metadata, next-slot (V3-D191: 400→300) |
| Caption / Metadata | `font-body text-[11px] font-medium text-s-ink-3 tabular-nums` | 11 | 500 | normal | 1.4 | sentence | "vor 2 Wochen", review counts, distance |
| Pill text | `font-body text-[11px] font-semibold leading-[1.2] tracking-[0.01em]` | 11 | 600 | +0.01em | 1.2 | sentence | "Nur 1 heute" — sentence case per V2-D67-fu7 |
| Author/handle | `font-body text-[11px] font-semibold text-s-ink` | 11 | 600 | normal | 1.2 | sentence | EntdeckenCard `@rissa` pill |
| Button CTA | `font-body text-[15px] font-bold tracking-[-0.01em]` | 15 | 700 | -0.01em | 1 | sentence | "Termine finden", "Solen durchsuchen" |
| Marquee text | `font-body text-[11px] font-normal text-white` | 11 | 400 | normal | 1 | sentence | EntdeckenCard "TikTok · TikTok ·" attribution |
| Eyebrow | `font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3` | 12 | 600 | +0.08em | 1 | UPPERCASE | BusinessTeaser "Für Salons" only (V3-D421: 0.16em→0.08em, 700→600) |

### Numerics

Use `tabular-nums` on prices, ratings, counts, dates, times so digits don't jitter when values change. Always. The general test (typography-08, 2026-07-27): any numeral that updates live, ticks down, or sits in a repeating column where digits must stay aligned across sibling rows (a countdown timer, a queue-position counter, a dashboard KPI/stat tile, a calendar day grid, a star-rating value) needs `tabular-nums` for the same physical reason codes and prices do, proportional digits have variable per-digit width, so an un-tabular number re-flows its own width on every tick and a column of numbers doesn't stay aligned. This is a behavior test (does the number change, or sit beside a sibling it must align with), not a fixed list of contexts, codes and prices are the worked examples, not the whole rule. See LOCKFILE §13.4 for the code-specific recipe.

### Long-form measure

Any body-copy block whose rendered width would otherwise exceed roughly 75 characters per line (salon descriptions, review text, legal prose, help-center answers, empty-state explanations) uses the shared `.prose-measure` utility (`app/globals.css`, 68ch), not an ad hoc `max-w-*` value or no width constraint at all. Reach for it the moment a new long-form-copy component is built, don't wait for a retrofit pass.

### Inline emphasis

Don't use `<em>` (italic banned per V2-D15) or `<u>` (underline banned). To emphasize a word inside a sentence, ALL legal options:
- Wrap in `<strong className="font-semibold text-s-ink">` (bold + ink — extra visual weight)
- Color it `text-s-ink` against `text-s-ink-2` parent (contrast emphasis)
- Don't swap to brand color (reads as "this is clickable")

### Anti-patterns

- ❌ Inline `style={{ fontFamily: '...' }}` — use Tailwind `font-display` / `font-body` classes
- ❌ Plus Jakarta Sans (V2-D70 era — retired V3-D75)
- ❌ Peace Sans / Open Sauce One (V2-D42 era — retired V3-D75)
- ❌ Italic (`<em>`, `italic` class, font-style:italic)
- ❌ Underline on RESTING text (body, labels, headings) and on resting links. EXCEPTION (v2 rule 7): a blue text link MAY show an animated underline ON HOVER ONLY — resting links stay un-underlined; static body/labels never underline.
- ❌ Inventing new sizes outside the role table
- ❌ `<h1>` more than once per page (semantic)

---

## §4 · Spatial rhythm

Everything is on a 4-point scale. Tailwind's defaults (`p-1` = 4px / `p-2` = 8px / `p-3` = 12px / etc.) ARE the scale. Use them.

### Section vertical rhythm

| Spacing role | Value | Tailwind | Use |
|---|---|---|---|
| Hero → FeedZone top edge | `mt-10 md:mt-8` (40/32px) | — | V3-D170b: the FeedZone container's `margin-top`. Creates visible breathing room between SearchCard and "Für dich". |
| FeedZone top padding | `pt-2 md:pt-4` (8/16px) | — | Internal padding before first content. Combined with `mt-X` above. |
| Section → Section gap | `mb-2 md:mb-3` (8/12px) | per Section component | Between adjacent feed sections inside FeedZone |
| Section title → carousel | `mt-3` (12px) | per ScrollRow | Tight by design. Section title is part of the surface, not a separator. |
| BusinessTeaser top padding | `py-12 md:py-20` (48/80px) | — | Page-level CTA section. More breathing room because it's a transition out of the feed. |
| Hero top padding | `pt-8` (32px) | — | V3-D151 — was `pt-[100px]`, pulled up per user. |

### Card padding by surface type

| Card type | Padding | Reason |
|---|---|---|
| SalonCard (photo-first) | `p-0` outer, photo fills, text below at `mt-[10px] px-[2px]` | Photo is the hero; text breathes via mt, not card padding |
| ReviewCard (text-first) | `p-4` (16px all sides) | Text-card needs interior breathing room |
| FeaturedStylists ProCard (list row) | `p-3` (12px) + `gap-4` photo-to-content | List row pattern — tight horizontal, vertical varies |
| EntdeckenCard (media-first) | `p-0` (image fills) | Pills positioned absolute over media |
| BusinessTeaser inner | `p-0` (no inner padding; section has its own `py-12`) | Image+text grid sits directly in page |

### Icon-to-text gaps

| Pattern | Gap | Tailwind |
|---|---|---|
| Tight inline (rating star + number) | 3px | `gap-[3px]` |
| Standard inline (icon + label) | 4-6px | `gap-1` or `gap-1.5` |
| Pill/badge interior (icon + text inside pill) | 4px | `gap-1` |
| Toolbar (icon + label, header) | 8px | `gap-2` |
| Floating button (icon + label) | 8-12px | `gap-2` to `gap-3` |

### Gutter math

Page-level horizontal padding (the "gutter" around all content):

| Viewport | Container padding | Max width |
|---|---|---|
| Mobile (< md) | `px-4` (16px) for most sections, `px-6` (24px) for MobileCategoriesRow | — |
| md (≥768px) | `px-8` (32px) | `max-w-[1280px] mx-auto` |
| lg+ | `px-8` | `max-w-[1280px] mx-auto` |

ScrollRow children use **negative-margin bleed**: card carousel children get `-mx-3 px-3 md:-mx-4 md:px-4` so card edges reach the section's rounded edge. Scroll-padding-left/right match the visual padding so snap targets align.

---

## §5 · Radius / shadow / elevation

### Radius scale (from `tailwind.config.js`)

| Token | Value | Use |
|---|---|---|
| `rounded-card` | 16px | Salon cards, listing cards, content blocks |
| `rounded-card-lg` | 20px | Hero cards, feature cards, modals |
| `rounded-panel` | 16px | Inner panels within a card, review cards |
| `rounded-search` | 99px | Search bar outer container (fully rounded pill) |
| `rounded-pill` | 9999px | Availability pills, tags |
| `rounded-btn` | 99px | CTA buttons, action pills |
| `rounded-input` | 12px | Form inputs (stable, NOT pill). Owner kept shipped 12 over 16, 2026-06-08 (LOCKFILE radius table); corrected here 2026-07-12 |
| `rounded-sheet` | 28px | Bottom sheets |

Tailwind defaults (`rounded-xl` = 12, `rounded-2xl` = 16, `rounded-3xl` = 24) are also acceptable when they match these values. Prefer `rounded-card` etc. for semantic clarity in new code; `rounded-2xl` is fine in existing code.

### Shadow / elevation system

Three-level system. Warm-tinted RGB `(50, 47, 44)` — not pure black (clinical), not pure ink (heavy-handed).

| Token | Value | Use |
|---|---|---|
| `shadow-elevation-1` | `0 1px 3px rgba(50,47,44,0.04), 0 1px 2px rgba(50,47,44,0.03)` | Card at rest (default) |
| `shadow-elevation-2` | `0 4px 12px rgba(50,47,44,0.08), 0 2px 4px rgba(50,47,44,0.04)` | Card on hover, surface emphasis |
| `shadow-elevation-3` | `0 8px 28px rgba(50,47,44,0.12), 0 4px 10px rgba(50,47,44,0.06)` | Floating: modals, sheets, dropdowns, popovers |

**Legacy aliases** (mapped to the 3-level system, OK to use): `shadow-card` → elevation-1, `shadow-card-hover` → elevation-2, `shadow-surface` / `surface-hover` → elevation-2/3, `shadow-warm-xs/sm/md/lg/xl/float` → elevation-1/2/3, `shadow-v5-card` etc. → elevation-1/2.

### Shadow rules

- Cards default to elevation-1, lift to elevation-2 on hover
- Floating elements (modals, sheets, dropdowns) start at elevation-3
- Never use `shadow-2xl` Tailwind defaults — too harsh
- Never use colored shadows (`rgba(brand, ...)`) — clinical / off-brand
- Always pair shadow change with motion (`transition-shadow duration-200`)
- **Controls follow CONTROL_ELEVATION (V3-D420):** white+shadow on a button / pill / icon-control is only for glass-over-photo (`FROST_GLASS`, `lib/frost-glass.ts`) or the one ink CTA. Calm controls on white / `s-bg-sunken` cast NO shadow (text → flat sunken, icon → `bg-white border-s-border`). See `_design-system/CONTROL_ELEVATION.md`. The elevation-1-at-rest above is for SURFACES, not controls.

---

## §6 · Motion vocabulary

Motion is a first-class citizen in Solen. Every interactive element earns a state. This section is the LAW for motion choices.

### §6.1 · Duration ladder

| Token | Value | Use |
|---|---|---|
| `duration-75` | 75ms | (rare) Instant state flips. Avoid; usually feels too fast. |
| `duration-100` | 100ms | (rare) Almost-instant. Use for state-only toggles (radio fill, checkbox check). |
| `duration-150` | 150ms | Secondary feedback (icon hover color, link color, small chevron rotation) |
| `duration-200` | 200ms | **THE STANDARD.** Card hover lift, button press, color fade, all common transitions. |
| `duration-250` | 250ms | Slightly slower variants — EntdeckenCard transforms, larger surface shifts |
| `duration-300` | 300ms | Reveals and larger motions — CategoryPromos zoom, BentoBusiness shadow bloom |
| `duration-500` | 500ms | Image zoom hover, page-entrance animations. Use sparingly. |
| `duration-[80ms]` (arbitrary) | 80ms | **Active press feedback** — always paired with `active:` modifier. Allowed because it's a deliberate spec, not drift. |
| `duration-[700ms]` (arbitrary) | 700ms | BellIcon ring swing animation. Allowed: deliberate one-off. |
| `duration-[12000ms]` etc. | 12s | Marquee scroll cycle. Allowed: motion artifact. |

**Anti-pattern**: `duration-[123ms]` or `duration-[400ms]` — random values not on the ladder. Drift-checker flags.

### §6.2 · Easings (canonical 4)

| Token | Curve | Use |
|---|---|---|
| `ease-snap` | `cubic-bezier(0.4, 0, 0.2, 1)` | Fast UI feedback (button press, toggle, focus). 100-200ms duration. |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy entry (modal scale-in, dropdown reveal, heart-pop). 250-400ms. Overshoots target slightly. |
| `ease-glide` | `cubic-bezier(0.16, 1, 0.3, 1)` | **THE DEFAULT.** Long-distance smooth (hover lift, scroll-in, sheet open). 200-300ms. |
| `ease-thud` | `cubic-bezier(0.7, 0, 0.84, 0)` | Decisive press-down feel (button press scale). 200ms. |

**Legacy / retired aliases (drift-checker flags)**: `ease-out-strong`, `ease-out-warm`, `ease-out-back`, `ease-in-subtle`, `spring-bounce`, `ease-drawer`, `ease-in-out-strong`. Most are duplicates or near-duplicates of the canonical 4. Use canonical names.

**Anti-pattern**: `ease-out` / `ease-in` / `ease-in-out` (browser defaults) — generic, no character. Always use named easing.

### §6.3 · Named keyframes (catalog)

Defined in `app/globals.css`. Use via Tailwind animation classes or CSS class.

| Keyframe | Class | Duration | Use |
|---|---|---|---|
| `marquee` | `animate-marquee` | 12s linear infinite | EntdeckenCard "TikTok · TikTok" attribution scroll. GPU-composited via `translate3d` + `will-change`. |
| `heart-pop` | `animate-heart-pop` | 350ms ease-out-strong | HeartButton scale 0.5 → 1.15 → 1.0 on save toggle. Re-mounted on each toggle via React `key` change. |
| `fade-in` | `animate-fade-in` | 0.3s | Generic entrance |
| `slide-in-up` | `animate-slide-in-up` | 0.4s | Drawer-style entry |
| `shimmer` | `animate-shimmer` | 1.5s infinite | Skeleton loader bg-position loop |
| `v4-reveal` | `animate-v4-reveal` | 0.5s | Scroll-triggered reveal (opacity + translateY) |
| `v4-scale-in` | `animate-v4-scale-in` | 0.4s | Alternative scale-based reveal |
| `card-stagger-in` | (used via `.salon-card-stagger > *` CSS) | 350ms each | Cascading reveal — 40ms between siblings |
| `heart-bounce` | `.heart-bounce` class | 0.5s | Elastic bounce feedback on like |
| `stamp-new` | `.stamp-new` class | 0.4s | Loyalty stamp earn animation |
| `confetti` | `.confetti` class | 1.5s | Celebratory falling confetti (special moments only) |
| `count-up` | `animate-count-up` | 0.6s | Numeric counter ease-up |

### §6.4 · Interaction patterns (THE LOCKED RULES)

These are non-negotiable across the system. Drift-checker can flag deviations.

| Element type | Rest state | Hover state | Active state |
|---|---|---|---|
| **Card (photo-first)** | scale-1, shadow-elevation-1 | `hover:-translate-y-[2px] hover:shadow-elevation-2` over 200ms ease-glide | `active:scale-[0.97] active:duration-[80ms]` |
| **Card (list-row, e.g. ProCard)** | scale-1, shadow-elevation-1 | `hover:-translate-y-[1px] hover:shadow-elevation-2` over 150ms ease-glide | `active:scale-[0.98] active:duration-[80ms]` |
| **Primary CTA button** | bg-s-ink | `hover:bg-black` over 200ms ease-glide | `active:scale-[0.97] active:duration-[80ms]` |
| **Heart button** | scale-1, outline icon | `hover:scale-110` over 200ms ease-glide; outline → fill on save with spring-pop | `active:scale-[0.97] active:duration-[80ms]` |
| **Section chevron arrow** | chevron only (stem invisible via `stroke-dashoffset:14`) | `group-hover:` draws stem in over 200ms ease-glide + chevron translates `+0.5px` right | (no active state) |
| **Bell icon** | upright | `whileHover` swings via rotate keyframes `[0, -15, 13, -9, 6, -3, 0]` over 700ms ease-out | — |
| **Icon-only button (hamburger, X)** | scale-1 | (none typically) | `active:scale-[0.94] active:duration-[200ms]` |
| **Tile (MobileCategoriesRow)** | scale-1, bg-[#F3F3F3] | `hover:-translate-y-[2px] hover:bg-[#EFEFEF]` 200ms ease-glide | `active:scale-[0.97] active:duration-[80ms]` |
| **Pill / badge** | static | (none — they're labels, not buttons) | — |
| **Link (text)** | text-s-accent (#276EF1) | `hover:text-s-accent` + `hover:underline` 150ms (underline-on-hover only — v2 rule 7) | — |

### §6.5 · Anti-patterns (where NOT to use motion)

- ❌ Body text or table cells — text isn't interactive, animation distracts from reading
- ❌ Long-form copy (paragraphs) — same
- ❌ Static labels (pills that aren't tappable) — they're informational, motion implies interaction
- ❌ Decorative elements (separator lines, background gradients) — they're not earning attention
- ❌ Every CTA — pick the primary, let the rest stay calm. If everything pops, nothing pops.
- ❌ Auto-playing motion (carousel auto-advance, hero zoom) without user input — users hate hijacked attention
- ❌ Hover lift on touch-only devices — covered by `@media (hover: hover)` if needed (most Tailwind hover utilities handle this automatically)

**Pointer vs touch, the house rule (responsive-desktop-09, 2026-07-27):** the line above and the
media-first-card line below (§6.7) are both special cases of ONE rule, named here so a new component
gets checked against the rule instead of each author re-deciding: pointer-fine/hover-hover input gets
progressive enhancement (hover-lift, hover-reveal decoration, cursor-tracked tilt); pointer-coarse/
hover-none input gets an ALWAYS-VISIBLE or tap-triggered equivalent for anything FUNCTIONAL. The two
existing lines cover the decorative case, where losing the effect on touch costs nothing. They do not
cover a control whose only way to become clickable is a hover reveal starting from `opacity-0` — that
is a dead click by omission on any touch device, not a graceful degradation, and is a DISTINCT,
higher-severity case (responsive-desktop-03, 2026-07-27; found live and fixed in
`app/[locale]/dashboard/calendar/page.tsx`'s slot-delete and add-slot controls, which shipped
hover-only with no `md:`/pointer gate — contrast the correct pattern already at
`app/[locale]/_components/homepage/Entdecken.tsx`: `opacity-100 md:opacity-0 group-hover:md:opacity-100`,
visible by default, hover-hidden only at `md` and up). Rule: any `opacity-0` → `group-hover:opacity-100`
reveal on an element containing a functional control (`onClick`, a `<button>`, `role="button"`) must be
gated the same way — visible-by-default, hover-hidden only at `md:` and up — never hover-only with no
touch fallback.

### §6.6 · GPU-compositing rules (mobile perf)

Required hints for smooth motion:

```css
/* On any element doing transform animation: */
.animate-marquee {
  animation: marquee 12s linear infinite;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

/* And use translate3d in keyframes, not translateX: */
@keyframes marquee {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-50%, 0, 0); }
}
```

Without these hints, browsers re-paint text per frame on the CPU → visible jitter. With them, the entire layer is composited on the GPU → smooth.

---

## §7 · Iconography

**Lucide React** (`lucide-react` package) is the canonical icon library. No Phosphor, no Heroicons, no Feather, no custom SVGs without a documented reason.

**ZERO EMOJI in ANY file, EVER.** No emojis in UI text, code, comments, mockups, demo pages, .md docs, JSX strings, anywhere. Even "harmless" decorative ones (`⭐` `🎉` `✨`). Reasons: (1) emoji rendering varies by OS/browser, breaks visual consistency; (2) emoji ≠ iconography — for icons use lucide; (3) emoji presence undermines the disciplined chrome register Solen targets. **Unicode geometric shapes are NOT emoji and ARE allowed** when used as typography: `·` (middot, MetaDot), `→` (arrow), `●` (filled circle as dot indicator), `★` (text star — though prefer lucide `Star` for consistency). If unsure whether a glyph is emoji, use lucide instead. **Drift checker will flag emoji-block Unicode going forward** (V3-D203, 2026-05-26).

### Size scale

| Context | `size` prop | Common pairings |
|---|---|---|
| Inline-with-text badge (Flame in "Nur 1 heute") | 10-11 | Pill text |
| Inline-with-text rating (Star next to "4.9") | 11-12 | Card name row |
| Action triangles (ChevronRight after a link) | 11-14 | Inside small buttons |
| Primary icon glyph (Heart, Bell, Menu, X) | 18-22 | Inside h-11 w-11 button |
| Nav icon (header logo wordmark adjacency) | 22 | Header |
| Hero illustration (no example in current homepage but reserved) | 24+ | Marketing surfaces |

### Stroke width

Lucide defaults to `strokeWidth={2}`. Solen overrides:
- `strokeWidth={2.2}` — hamburger Menu, X close — slightly heavier for "system control" feel
- `strokeWidth={2.25}` — HeartButton — gives the outline its presence on photo backgrounds
- `strokeWidth={2.5}` — ChevronDown / ChevronRight / X dismiss — small icons need more weight
- `strokeWidth={2}` — default everywhere else

### Color

Lucide icons inherit `color` from CSS — set via parent's `text-s-ink-X` class. Floating-on-photo icons use `text-white` + `filter: drop-shadow(0 1px 2px rgba(0,0,0,0.6))` for legibility.

### Fill rules

- Heart icon: `fill="none"` rest, `fill="#FF3366"` on save (saved state)
- Star icon (rating): `fill="#FFC32B"` + `stroke="none"` (legacy yellow per Q1)
- Clapperboard, Bell, etc.: `fill="none"` always (outline only)

### When 3D PNGs are appropriate

ONLY for branded category illustrations (MobileCategoriesRow icons: scissors, clippers, nails bottle, walking person, rainbow map pin, spa stones, leaf). Stored at `public/icons/categories/<name>.png`. Background must be transparent (PIL-stripped). Sizes ~64-84px wide, max 80px.

For ALL UI affordances (buttons, controls, labels), use lucide. No mixing.

### Anti-patterns

- ❌ Mixing icon libraries on the same surface
- ❌ Unicode emoji in UI
- ❌ Inventing SVGs that duplicate a lucide icon
- ❌ Inline SVG without a documented reason (one is the SectionTitle stem-draw chevron — V3-D156, deliberate split-path SVG for the draw animation)
- ❌ Lucide icons + 3D PNGs in the same row/component (visual language clash)

---

## §8 · Card grammar

### Card invariants (shared across SalonCard / ReviewCard / ProCard / EntdeckenCard)

| Property | Invariant |
|---|---|
| Border radius | 16-22px (use `rounded-card` 16 or `rounded-2xl` 16) |
| Background | white (`bg-s-bg-surface`) — never coloured |
| Shadow rest | `shadow-elevation-1` |
| Shadow hover | `shadow-elevation-2` |
| Hover transform | `-translate-y-[1px]` to `-translate-y-[3px]` depending on density (smaller cards lift more) |
| Hover duration | 150-200ms ease-glide |
| Active feedback | scale 0.97-0.98 over 80ms ease-glide |
| Border | `border border-s-border` (1px hairline) for text-first cards; photo-first cards usually no border |
| Focus ring | `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2` (or `-offset-4` for cards with rounded interior) |

### Per-card divergences

| Card | Surface | Padding | Hover lift | Photo aspect | Notable |
|---|---|---|---|---|---|
| SalonCard | photo-first | text mt-[10px] px-[2px] | -2 to -3px | 1:1 square | Heart top-right, rating row 1 right (Airbnb pattern), 3-row text |
| ReviewCard | text-first | p-4 | -2px | (no photo) | Stars+date row, quote (line-clamp-3), avatar + name + salon link |
| ProCard (FeaturedStylists) | list-row | p-3 + gap-4 | -1px | 72px circle | Photo left, text col right, Save heart on photo corner, availability pill row 3 |
| EntdeckenCard | media-first | (no padding) | none on mobile / scale on desktop hover | 9:16 portrait | Marquee top-left, Heart top-right, @author pill bottom-left, Clapperboard bottom-right |

### When to break the grammar

- Photo-first cards on light-content (white-walled salon photos) need MORE shadow contrast than dark-content (barbershop interiors). Acceptable to bump from elevation-1 to a slightly stronger custom shadow for photo legibility.
- Media-first cards (EntdeckenCard) skip hover-lift on mobile because there's no hover; replace with appropriate active feedback if needed.
- Card-in-card patterns (e.g. SalonCard inside a CategoryPromos card) should NOT both have shadows — outer card carries the depth, inner is flat.

### Card anti-patterns

- ❌ Coloured card backgrounds outside the soft-grey tiles in MobileCategoriesRow
- ❌ Multiple shadows on the same card (drop + inset). One shadow, one depth.
- ❌ Different hover behaviors on adjacent cards in the same row
- ❌ Rounded corners that don't match the family (e.g. `rounded-3xl` 24px on a SalonCard alongside `rounded-2xl` 16px Reviews — discord)

---

## §9 · Photography & user content under B&W lock

**The B&W palette is locked for CHROME, not for CONTENT.** User-uploaded salon photos, stylist headshots, Entdecken TikTok thumbnails are inherently color content — they appear within a B&W frame.

### The rule

- **Brand chrome stays B&W** — headers, footers, buttons, links, text, icons, badges, hairlines
- **User content stays color** — salon photos, stylist headshots, look thumbnails, salon hero galleries
- **The transition between them** is handled by:
  - Generous white space around photo cards (the photo is "framed" by the white card)
  - Subtle shadow (elevation-1) anchors photos to the white surface
  - 1px hairline border (`border-s-border`) on text cards prevents content-color from bleeding into the chrome

### Specific cases

| Surface | Color treatment |
|---|---|
| SalonCard photo | Full color, no filter applied. Photo is content; card chrome around it is B&W. |
| EntdeckenCard background | Full color (TikTok thumbnail via `/api/discovery/thumb/[id]`). Layered gradient (color image + brand-grey gradient fallback) so failed image still shows something. |
| FeaturedStylists photo | Full color (Unsplash placeholder; real `staff_portfolio_images` later). Save Heart on top is white-frosted (chrome). |
| BusinessTeaser hero | Currently a grey placeholder (`<ImageIcon>` in `bg-s-bg-sunken` square). When a real illustration ships, it stays color but in a controlled palette. |
| MobileCategoriesRow icons | 3D-rendered PNGs with their own colors (scissors orange handles, nail polish peach, rainbow map pin, spa stone grey-green). Each is content; their tiles are `bg-[#F3F3F3]` neutral grey. |

### Anti-patterns

- ❌ `filter: grayscale(100%)` on user photos — strips the content's purpose (showing what the salon looks like)
- ❌ Tinting photos with brand color overlay (`mix-blend-color`) — manipulates the content
- ❌ Allowing chrome elements to take ON user-content colors (e.g. CTA button matching a salon's brand color)

---

## §10 · Loading / empty / error / async state grammar

### §10.0 · The populated state is the design target (owner-approved 2026-07-21, FLOORS LAW)

Every surface is specced and mocked at IDEAL density first, from the SEED library (seed data is real
wired data, so it satisfies no-fabrication): PDP gallery >= 5 photos, reviews >= 3 visible, services
>= 6 rows, home feed >= 4 sections; a populated list/grid first viewport shows >= 4 content units
mobile / >= 6 desktop plus a visibly cropped next item (the scroll promise); a card renders its FULL
info stack (photo, name, star+rating+count, category, city/distance, ab-CHF price) whenever the data
exists , omission is legal only for null data, never for minimalism. Loading/empty/error DERIVE from
the populated layout, not the reverse. Boundary: the dead-affordance + no-fabrication rules bind
production and current-state mockups; a TARGET-state mockup renders full seeded content and carries a
one-line footer naming what is not yet wired. Root cause + evidence:
`research/UNFINISHED_AUDIT_2026-07-21.md`.

**Every Supabase-backed surface must define all four states.** Card grammar only covers the populated case.

### §10.0a · Sparse-but-real state (hierarchy-density-04)

A fifth case sits between §10.0 (populated) and §10.2 (empty): a production salon page with REAL,
non-fabricated content that is genuinely thin , a newly onboarded salon with 2 photos and 0 reviews,
below every §10.0 density number. This is NOT EmptyState (the data is not zero) and it is NOT covered
by the target-state mockup boundary above (that boundary is scoped to design ARTIFACTS, not to what a
real production page renders for a real thin salon). It is also not on the exemption list (forms,
checkout payment, legal, receipts) that the imagery/density floors name.

State plainly which floors still bind and which waive, so no engineer has to invent a special case:

- **Still bind (non-negotiable even when thin):** no-fabrication (never pad with placeholder photos,
  invented reviews, or a fake count); the missing-photo fallback (`s-bg-sunken` + 3D category icon +
  salon initial, never a bare grey box); the two-ink-anchor card rule; no dead-grey zone.
- **Waived (cannot be met honestly with real data):** the >= 5 gallery / >= 3 reviews / >= 6 services
  COUNTS. A page may legitimately show 2 photos and 0 reviews. Render what exists; do not stretch the
  layout to fake a floor-sized set.
- **New requirement this state adds:** below-floor sections get a one-line honest sub-state, not
  silent omission , e.g. a reviews section with 0 reviews renders "Noch keine Bewertungen" (not the
  full `EmptyState` component, which is scoped to a whole-page zero-data case) rather than disappearing
  entirely, so the salon still reads as a real, growing listing rather than a broken one.

### §10.1 · Loading state

Skeletons mirror the eventual layout. Use `bg-s-bg-sunken` (#F4F4F5) with `animate-shimmer` for a subtle background-position loop.

**Patterns:**

| Element being loaded | Skeleton pattern |
|---|---|
| Salon card (in carousel) | Full card with `bg-s-bg-sunken aspect-square rounded-card`, name row `h-4 w-3/4 rounded`, meta row `h-3 w-1/2 rounded` |
| Stylist row | 72px circle + 3 stacked text bars |
| Review card | Stars row (5 small circles), 3 text bars, avatar+name row |
| Hero search dropdown | 4-6 list rows with icon-square + text-line |

**Skeleton component** (to-be-built):
```tsx
<div className="bg-s-bg-sunken rounded-card animate-shimmer" />
```

Shimmer should be **calm** (1.5s cycle, 200% bg-position range), not strobe-fast.

**Anti-pattern**: full-page spinner for content loads. Reserve spinner for inline button-state (network call confirming user's tap).

### §10.2 · Empty state

Each list/grid section needs a designed empty state. Pattern:

```
[ICON / illustration]
"No salons in {city} yet."        ← clear status (1 line)
"Try a different city, or be the first to bring beauty here." ← helpful next action (1-2 lines)
[ Button: "Andere Stadt wählen" ]  ← CTA, primary action
```

Empty states are FRIENDLY, NEVER apologetic ("Sorry, no results"). Always actionable. (~~German `du` voice~~ , register went FORMAL 2026-07-29, supersedes it; `COPY_LAW.md` §1 owns it. Warmth inside formality is the point, and COPY_LAW §1 says how , formal address does not make a string cold.)

### §10.3 · Error state

Pattern:

```
[ Error icon (AlertCircle from lucide, s-error color) ]
"Etwas ist schiefgelaufen."         ← honest, no blame
"Wir konnten die Salons nicht laden." ← what specifically failed
[ Button: "Erneut versuchen" ]      ← retry action
```

If the error is recoverable (network), include retry. If unrecoverable (404, permission denied), provide an alternative path ("Zur Startseite").

### §10.4 · Optimistic UI / async patterns

For mutations (save heart, post review):
1. **Update local state immediately** — UI reflects "saved" before backend confirms
2. **Send the mutation in background**
3. **On success**: do nothing (UI already shows success)
4. **On failure**: rollback local state + show toast "Konnte nicht gespeichert werden. Erneut versuchen?"

**Never lock the UI** while waiting for a mutation. Never show a spinner over a save-heart. Optimism is the default.

---

## §11 · Clickable Surface Contract

**Every interactive surface MUST satisfy ONE of the following.** Empty `onClick={() => {}}` is forbidden. Drift-checker enforces.

| Pattern | What it means | Example |
|---|---|---|
| **A. Working destination** | The `href` routes to a real page that renders content | `<Link href="/salon/atelier-coiffure">` IF that slug exists in DB |
| **B. Working handler** | The `onClick` produces an observable, intentional effect | `setMenuOpen(true)` that visibly opens MobileMenu |
| **C. Optimistic local + backend-gap toast** | Local state changes + user sees a "Wird gespeichert..." or "Notification: feature coming" toast | HeartButton (currently local-only + visible save state) |
| **D. Explicit "Coming Soon" affordance** | Visibly disabled OR has a "kommt bald" badge + toast on tap | Bell icon currently — fire toast "Benachrichtigungen kommen bald 🔔" |

### Enforcement rules

- `onClick={() => {}}` → **forbidden**. Either remove the handler (make it non-interactive) or add real behavior.
- `href=""` or `href="#"` → **forbidden**. Remove or fix.
- `<Link href="/x">` where `/x` has no `app/[locale]/x/page.tsx` → **drift-flagged**. Either create the route, redirect, or change the destination.
- `<button>` with no `onClick`, no `type`, not inside `<form>` → **drift-flagged**. Either it's decorative (make it `<div>` or `<span>`) or it needs a handler.
- Save controls (HeartButton, SaveHeart) without a real `itemId`/`salonId` → currently OK in dev (Q1.6 pending — backend wiring).

### Limits of static checking

The drift-checker catches LITERAL patterns. It cannot catch:
- `salonId={salon?.id}` that's syntactically present but `salon` is null at runtime (false negative — passes static, fails real)
- `onClick={handleClick}` where `handleClick` is defined but is a no-op function
- **A computed/templated href whose static prefix points at a route that was never built** (ia-navigation-07, 2026-07-27). `_docs/FRONTEND.md:778` and `:2051` document a live instance found by hand: `RefundCaseView` + `UpchargeApproveView` both receive `receiptHref = /[locale]/bookings/[id]`, but there is no `app/[locale]/bookings/[id]/page.tsx`, so the link falls through to the home shell. The current drift skill only detects selected literal patterns, so a template-built route needs direct route-manifest inspection and an exercised navigation path. Do not add a new checker without the current enforcement procedure's incident, coverage, reject/pass, and runtime evidence.

Runtime probes via Playwright catch these. The static checker is one layer; visual/functional verification is another.

---

## §12 · z-index / overlay layering scale

| Tier | Token | Value | Use |
|---|---|---|---|
| Surface chrome | (none / implicit) | 0-10 | Card hover lift, search dropdown |
| Sticky header | `z-50` | 50 | Header (sticky) |
| CityTopBar | `z-[60]` | 60 | Above header so its dropdown clears header content |
| Toolbar (in-page) | `z-[70]` | 70 | Reserved |
| **Sheet backdrop** | `z-sheet-bg` | 400 | MobileMenu / BookingSheet backdrop dim |
| **Sheet content** | `z-sheet` | 410 | Sheet itself |
| **Modal backdrop** | `z-modal-bg` | 500 | Higher than sheets — modals override sheets |
| **Modal content** | `z-modal` | 510 | Modal itself |
| **Toast** | `z-toast` | 600 | Above everything except tooltips |
| **Tooltip** | `z-tooltip` | 700 | Highest UI tier |

### Stacking rules

- Sticky Header (`z-50`) is below CityTopBar (`z-60`) so the city dropdown can extend below the bar without being clipped by header
- MobileMenu is a sheet — uses `z-[40]` in its current implementation (predates token; should migrate to `z-sheet` 410). Tracked Q in QUESTIONS.md.
- Toasts always render above sheets and modals
- Tooltips are highest — fine on mobile because tooltips are rare on touch

### Anti-patterns

- ❌ `z-[9999]` to "fix" a stacking issue — that's a patch, not a fix. Use the scale.
- ❌ Mixing arbitrary z-values (`z-[55]`, `z-[123]`) in new code. Stick to the scale.

---

## §13 · Mobile perf rules

iOS Safari is the strictest perf budget. Optimize for it.

### Rules

1. **`backdrop-filter` is expensive.** Inside scrolling containers (carousels, lists), gate with `md:` so it's desktop-only. Mobile uses solid bg or skips the blur. Example: `bg-white/95 md:backdrop-blur-panel md:bg-white/85`.
2. **Use `will-change: transform` only DURING animation.** Setting `will-change` at rest causes blurry text on Safari. Add via class only when the animation is active, remove after.
3. **`translate3d(x, 0, 0)` over `translateX(x)`** for animated transforms. Forces GPU layer promotion.
4. **`backface-visibility: hidden`** on animated elements — iOS Safari sometimes won't promote without it.
5. **Don't animate `width`/`height`/`left`/`top`** — these trigger layout. Animate `transform` and `opacity` only.
6. **`animation: ... infinite`** elements (marquee, shimmer) MUST be GPU-composited or they tank scroll FPS.
7. **`scroll-snap-type: x mandatory`** — keeps horizontal carousels snappy. Avoid `mandatory` on long lists.
8. **Lazy-load below-fold images** — `loading="lazy"` on `<img>` / `<Image>`. Already default for next/image but worth confirming.

### Anti-patterns

- ❌ `backdrop-filter` on every card in a scrolling carousel (~11 compositor layers per scroll frame on iOS, kills FPS)
- ❌ Setting `will-change` permanently in CSS
- ❌ Animating `top` / `left` instead of `transform`
- ❌ `position: fixed` elements inside scroll containers (iOS Safari positioning bug)

---

## §14 · Component authoring contract

Every shared component (anything imported by 2+ files) MUST follow this:

### §14.0 · The color-layer decision tree (FIRST QUESTION before writing any class)

V3-D197 lock. Before picking ANY color class, answer in order:

```
1. Does this surface CONVEY semantic meaning by color?
   (success/error/warning/info/open/closed/active/inactive/urgent/rating/save/…)

   → YES → Layer 3 semantic UI. Look up the surface in §2.5 catalog.
            If listed: use the listed token. If not listed: propose a new
            row in §2.5 via QUESTIONS.md before inventing.
            Universal colors only — never invent custom semantic hues.
   → NO  → continue

2. Is this surface INTERACTIVE — can the user tap it?
   (text link, see-all/view-all, tab/segment, ghost/secondary button, tappable row, inline action label, interactive icon)

   → YES → Layer 2 interactive accent — hyperlink-reading text only (LOCKFILE §1.5 v3 2026-06-11; v2 "GENEROUSLY" RETIRED).
            The single primary COMMIT CTA is the exception — it stays `bg-s-ink` (v2 rule 3).
            NON-interactive text (eyebrow, label, price, heading, bullet) is NOT blue — blue marks interaction, never emphasis (v2 rule 2).
   → NO  → continue

3. Default: Layer 1 chrome. Use `s-ink` / `s-ink-2` / `s-ink-3` for text,
   `bg-s-bg-base` / `bg-s-bg-sunken` for surfaces, `border-s-border` for
   hairlines.
```

**Companion tree (V3-D420), control elevation:** the color tree above picks the *hue*; `_design-system/CONTROL_ELEVATION.md` picks the *elevation* (white-glass A over photo / flat B on a calm surface / ink C primary). Run both before styling any control.

**This must be answered in the component's `_design-system/components/<Name>.md` Purpose section.** Drift checker will eventually enforce: every new component .md file must include a line `Layer: 1 / 2 / 3` so the classification is grep-able.

### §14.1 · File location + naming

- Shared components live under `app/[locale]/_components/` organized by purpose:
  - `_components/homepage/` — homepage-specific
  - `_components/layout/` — Header / Footer / Menu / CityTopBar
  - `_components/primitives/` — Toast / Modal / Sheet / inputs
- File name = PascalCase component name (`SalonCard.tsx`, `HeartButton.tsx`)
- One component per file (subcomponents OK inline, but the primary exported component is the file name)

### §14.2 · TypeScript

- Public props always have an `interface ComponentNameProps { ... }`
- No `any`. Where the type is genuinely unknown, use `unknown` + narrow
- Optional props have defaults; required props throw at runtime if missing

### §14.3 · Variants via cva

Components with 2+ visual variants MUST use `class-variance-authority` (cva), not naked ternaries.

```ts
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[10px] px-3 py-1.5",  // base
  {
    variants: {
      tone: {
        urgent: "bg-[#FFF1E6] text-s-urgency",  <!-- V3-D424; was inline #9A3412 -->
        info: "bg-s-bg-sunken text-s-ink-2",
      },
    },
    defaultVariants: { tone: "info" },
  },
);
```

Use `cn()` (from `lib/utils.ts`) for ALL class composition — never template strings. `cn()` handles conditional classes and Tailwind class-merging (`clsx` + `tailwind-merge`).

### §14.4 · Server vs Client

Default to server components. Mark `"use client"` ONLY when the component:
- Uses `useState`, `useEffect`, `useRef`, or other hooks
- Has `onClick` / `onChange` / event handlers
- Uses browser-only APIs (`window`, `document`)
- Uses `motion/react` (Framer Motion)

Server components are cheaper at runtime (no JS shipped). Use them by default.

### §14.5 · Provenance comments

Every locked decision earns a `V3-D{n}` provenance comment in the code:

```tsx
{/* V3-D177 (2026-05-26, council item #4): H1 max 64 → 52px.
    Mobile unchanged (clamp picks 10vw ~40-50px there). */}
<h1 className="text-[clamp(40px,10vw,52px)] ...">
```

Comments are LOAD-BEARING. Never strip. Each is an audit trail entry.

### §14.6 · Required exports

The default export is the component. Named exports for subcomponents (e.g. `Section / SectionFrame / SectionTitle / ScrollRow / FeedZone` from `SectionHeader.tsx`).

### §14.7 · Component .md docs

When you create a new shared component, you MUST ALSO write `_design-system/components/<Name>.md` in the same turn. This is enforced via CLAUDE.md rule. No new components without docs.

### Anti-patterns

- ❌ Nested ternary classNames (`className={a ? (b ? "X" : "Y") : "Z"}`) — use cva
- ❌ `style={{ ... }}` inline overrides for token-shaped values (color, padding) — use Tailwind class. Inline style OK for measured one-offs (background gradient layers, drop-shadow with specific RGBA).
- ❌ `"use client"` on components that don't need it
- ❌ Default props via `props.x || defaultValue` instead of destructuring defaults `({ x = defaultValue })`

---

## §15 · Provenance & changelog rules

V3-D{n} provenance comments in code files are the per-file changelog. They tell the next reader:
- When the line was last decided
- What rule motivated it
- What was the previous state

### Format

```tsx
// V3-D{number} ({date}): {what changed} per {who/why}.
// {Optional follow-up — reason this matters, alternative considered, link to spec}.
```

### Numbering

Increment globally — the highest V3-D{n} in the codebase is the latest. Get current max:
```bash
grep -rho "V3-D[0-9]\+" app/ | sort -u | sort -V | tail -5
```

Don't skip numbers. Don't backdate. Don't reuse.

### What earns a V3-D entry

- A locked decision (color, size, spacing, copy)
- A retirement (removed feature, deprecated token)
- A user-explicit choice ("user said X")
- A fix to a real bug

What does NOT earn an entry: trivial refactors, formatting, lint fixes. They go in commit messages instead.

### What SOURCE.md tracks

Same numbering scheme. When a decision changes the design system itself (not just one component), it gets a V3-D entry here AND in the affected file.

### Anti-patterns

- ❌ Removing V3-D comments to "clean up" — they're a load-bearing changelog
- ❌ Creating a V3-D entry for a typo fix or formatting change
- ❌ Skipping numbers (V3-D180 → V3-D182 with no V3-D181)
- ❌ Reusing a number for a different decision

---

## §16 · Accessibility rules

**WCAG 2.2 level A and AA is the floor** (accessibility-10, 2026-07-27: corrected from "2.1 AA"
here, which had drifted out of sync with CLAUDE.md's precedence-chain statutory-floors tier
already naming 2.2 A+AA; one number now, not two). This is also where Solen's legal accessibility
exposure beyond WCAG-as-taste lives, named explicitly instead of assumed: Switzerland's BehiG
(Behindertengleichstellungsgesetz) sets eCH-0059/WCAG 2.1 AA as the national standard today, mainly
binding on federal/public bodies, with a pending revision extending comprehensive private-company
obligations (accessibility statement, conformance declaration) from 2027; the EU Accessibility Act
(EN 301 549 / WCAG 2.1 AA baseline) has applied to covered digital services since 28 June 2025 but
only reaches Solen once it actually offers services to, or targets, EU-domiciled consumers, and its
microenterprise exemption does not cover e-commerce/booking services regardless of size. Full
sourcing: `_design-system/research/PSYCH_BUSINESS_IMPACT.md`'s BehiG/EAA rows.

### §16.1 · Landmarks

Every page MUST have:
- `<main>` element wrapping the primary content (already in `app/[locale]/layout.tsx`)
- `<header>` element for the Header component (already present)
- `<footer>` element for the Footer (already present)
- `<nav>` element for the MobileMenu and any other nav (currently missing — Q in QUESTIONS)

**This rule is NOT customer-only (accessibility-04, 2026-07-27).** It binds the dashboard the
same way: salon owners and staff are real end users of a 49-page admin surface, not an exempt
internal tool. `DashboardLayout.tsx` (`components-legacy/dashboard/`, used by 44 of 49 dashboard
`page.tsx` files) already wraps its children in `<main>`; both its desktop icon-rail `<nav>` and
mobile slide-out `<nav>` now carry `aria-label="Dashboard-Navigation"`. The 5 dashboard pages that
render OUTSIDE `DashboardLayout` (`editor`, `gallery`, `queue-display`, `setup`, plus `messages`
which is a server redirect with no UI) each got their own root `<main>` landmark at the component
that owns their real page shell (`EditorPage.tsx`, `gallery/page.tsx`, `queue-display/page.tsx`,
`SetupWizard.tsx`). Not yet swept: icon-only buttons inside individual dashboard pages missing
`aria-label` (§16.3 already states the rule; 33 of 49 dashboard `page.tsx` files carry zero
`aria-*` at all, this needs a dedicated per-page pass, not a landmark-level fix).

### §16.2 · Focus management

- Every interactive element MUST have `focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2` (or `-offset-4` for rounded corners)
- Focus ring color: **`s-ink` `#0A0A0A`** (~5.8:1 on white — AA Normal). Resolved Q5 2026-05-26. Migrated from legacy teal `#043338` in `app/globals.css` V3-D189.
- Tab order matches visual order (top-to-bottom, left-to-right)
- Focus is RETURNED after closing modals/sheets to the element that opened them (use `useEffect` + `ref.current.focus()` cleanup)
- `Escape` closes overlays (already in MobileMenu)

### §16.3 · aria

- Icon-only buttons MUST have `aria-label`:
  ```tsx
  <button aria-label="Benachrichtigungen"> <BellIcon /> </button>
  ```
- State buttons use `aria-pressed`:
  ```tsx
  <button aria-pressed={isSaved} aria-label={isSaved ? "Gespeichert" : "Speichern"}>
  ```
- Multi-select uses `aria-pressed` on each option (NOT `aria-selected` which is for listbox patterns)
- Live regions for dynamic content updates: `<span aria-live="polite">` for save toggles, and (accessibility-08, 2026-07-27) for any result COUNT that re-renders in place on a filter/keystroke change without a page navigation — `SearchTemplate.tsx` now carries a persistent `sr-only` `aria-live="polite"` region mirroring its visible count (not `aria-live` directly on the visible element, since that element unmounts/remounts across a loading/error/total ternary and wouldn't reliably fire), and `FilterSheet.tsx`'s Apply button (whose own label text already carries the live count) carries `aria-live="polite"` directly since focus during filtering usually stays on the toggle/checkbox just touched, not that button.
- `aria-hidden` on purely decorative SVGs

**Alt text content policy (accessibility-06, 2026-07-27).** A salon/portfolio photo whose entire
on-screen purpose is customer evaluation (a haircut result, salon interior, stylist's past work) is
NEVER `alt=""` and never a bare index (`"{salonName} - {i}"`) or generic filler (`"Foto von
{name}"`) — those describe nothing a screen-reader user can act on when the whole point of the
gallery is helping a sighted user judge a hairstyle before booking. Use whatever structured metadata
already exists (portfolio `category`, the stylist's name) to say WHAT the photo shows, not just whose
it is: `SalonImageGallery.tsx` now reads its category-labeled photos this way (`getPortfolioCategoryLabel`)
and names the active stylist for team-tab photos instead of `alt=""`; `SalonCard.tsx`'s fallback names
the salon's category instead of echoing the name already read by `CardName` next to it. Only chrome,
pattern, or purely repeated-elsewhere images qualify as decorative under WCAG 1.1.1.

### §16.4 · Color contrast

| Combination | Ratio | Pass |
|---|---|---|
| `text-s-ink #0A0A0A` on `bg-s-bg-base #FFFFFF` | 19.6:1 | AAA |
| `text-s-ink-2 #6B6B6B` on white | 5.2:1 | AA Normal |
| `text-white` on `bg-s-ink #0A0A0A` | 19.6:1 | AAA — **canonical CTA combo (V3-D189)** |
| `outline-s-ink` on white (focus ring) | ~5.8:1 | AA — Q5 resolved |
| ~~`text-white` on `bg-s-brand #16A34A`~~ | 3.6:1 | **Retired V3-D189** — CTAs use `bg-s-ink` |
| Pill borders (`rgba(154, 52, 18, 0.22)`) | n/a | Decorative — don't rely on for content |
| `text-s-chart-2 #9CA3AF` on white | 2.54:1 | **FAIL, even large-text (3:1)** — chart-only (§1 data-vis rows), never text (accessibility-05) |
| `text-s-chart-2 #9CA3AF` on `bg-s-bg-sunken` | 2.31:1 | **FAIL** — same restriction |

Test all new color pairings before shipping, and RECORD the computed ratio in the SAME commit that
authorizes a token for text use (accessibility-05, 2026-07-27) — a token not re-verified against
this table is not authorized for prose, no matter what a later rule elsewhere implies. Tools: WebAIM
Contrast Checker, or `node scripts/check-contrast.mjs --self-test` (color-tokens-05; extend
`TOKEN_HEX` there when a new token enters text use, self-test its ratio against this table).

### §16.5 · Touch targets

- Minimum 44×44 px hit area per WCAG 2.1 (some platforms 48). Some Solen components use 44; the HeartButton's pattern (44 outer hit area, 32 visible glass) is the canonical solution.
- For very small avatars (FeaturedStylists SaveHeart 28×28), acceptable to break the 44px floor because the parent card is the primary tap target and the heart is secondary.

### §16.6 · Keyboard nav

- `Tab` cycles through interactive elements in source order
- `Space` / `Enter` activates buttons and links
- `Escape` closes overlays (consistent across MobileMenu, modals, sheets)
- `Arrow keys` navigate within composite widgets (when applicable — e.g. radio groups, tab lists)
- Avoid `tabindex={X}` with positive integers — disrupts natural flow

### §16.7 · Text spacing (WCAG 1.4.12) — typography-09, 2026-07-27

Content must survive a user's stylesheet forcing: line-height to at least 1.5x the font size, paragraph
spacing to at least 2x the font size, letter spacing to at least 0.12x the font size, and word spacing to
at least 0.16x the font size. At the 14px body role that is a 21px line-height and a 28px paragraph gap.
No content may clip, overlap, or lose functionality under these forced values.

Highest-risk pattern: fixed-height containers with clamped or line-clamped text (`line-clamp-*`, a
fixed-height card, a truncated review preview). These must not clip at forced spacing, if a
line-clamp block would clip, the container needs to grow with content rather than crop it, or the
truncation needs to happen at the character/word level (an ellipsis a user can expand) rather than by
cutting off a now-taller block.

This closes a gap that was already decided and never applied: `RATIONALE.md` line 138 (dated
2026-07-17) named this exact requirement and its destination ("add to the a11y checklist in SOURCE
section 16") nine days before this subsection existed.

### Anti-patterns

- ❌ Using `outline: none` without a replacement focus indicator
- ❌ Color as the ONLY signal of state (e.g. "selected = green border" with no other indicator)
- ❌ Tooltips required for understanding (use visible labels)
- ❌ `aria-label` that duplicates visible text
- ❌ Focus trap that doesn't release on Escape

---

## §17 · i18n rules

Solen ships in `de` (primary), `en`, `fr`, `it`. All locales use the same UI; only strings change.

### §17.1 · Strings live in `messages/{locale}.json`

Components import via `useTranslations` (from `next-intl`):

```tsx
"use client";
import { useTranslations } from "next-intl";

export default function MyComponent() {
  const t = useTranslations("homepage");
  return <h2>{t("section.title")}</h2>;
}
```

### §17.2 · No hardcoded German in components

Many existing components have hardcoded German strings (`"Nur 1 heute"`, `"Profis in deiner Nähe"`, `"Bewertungen"`, etc.). New code MUST extract these to message files. Migration of existing components is JIT — when we touch a component, we extract its strings.

### §17.3 · German text expands ~30% vs English

Design layouts to accommodate longer German strings:
- Button labels: "Sign in" → "Anmelden" (similar), but "Sign up" → "Registrieren" (longer)
- Section titles: "Reviews" → "Bewertungen" (3 chars → 11 chars)
- Always allow text to wrap; never force single-line

### §17.4 · Plural forms

German has plural forms different from English. Use `next-intl` plural handling:
```tsx
t("results", { count: salons.length })
// messages/de.json: "results": "{count, plural, one {# Salon} other {# Salons}}"
```

**Never a hardcoded ternary** (`count === 1 ? "Salon" : "Salons"`) as a substitute for the pattern above: it freezes the text in whatever language the author typed and drops the locale's real plural grammar (French treats 0 as singular; German/French/Italian all differ at higher counts). copy-i18n-04 (2026-07-27) found and fixed 7 live instances of this exact anti-pattern (brand/[slug]/page.tsx, FavoritesList.tsx, SalonReviews.tsx, SalonResultCard.tsx, MapSalonDetail.tsx, queue/[token]/page.tsx, behandlungen/[...slug]/*.tsx). Review changed plural render sites through the current i18n path; no automatic blocker is claimed here.

### §17.5 · Date / time / currency

Use Swiss formats:
- Currency: `CHF 80` (CHF prefix, no decimals for whole amounts, decimal-point for fractions)
- Time: 24-hour `14:30`
- Date: `21. Mai 2026` or `21.05.2026`
- Relative time: `vor 2 Wochen`, `gestern`, `heute`

### §17.6 · Long unbroken German compound words inside fixed-width, single-line atoms

§17.3's "always allow text to wrap" only works when a string has spaces to break at. A single German compound word has none (`Stornierungsbedingungen`, `Stornierungsrichtlinie`, `Handelsregistereintrag`, `Zahlungsinformationen`, all 20-23 chars, live in `messages/de.json`), so the same overflow failure §17.3 exists to prevent reappears the moment the string is one long word instead of a short phrase, and it hits hardest inside a component that is single-line **by design** (a TabPill, filter chip, category tag, button label, badge) where wrapping the label would break the component's own visual contract.

Rule: any such fixed-width single-line atom sets `overflow-wrap: break-word` on its text, never `hyphens: auto` (German needs correctly placed dictionary breaks to avoid mangling a word like `Stornierungsbedingungen` mid-syllable; the CSS auto-hyphenator does not reliably know German hyphenation points). If the component cannot tolerate a mid-word break either, it must be explicitly exempted with a documented fallback (truncate + a tooltip or the full text on tap), not silently left to overflow its container. Before shipping a new fixed-width chip/pill/tab component, check its longest live `de.json` string against this rule.

### Anti-patterns

- ❌ Hardcoded German in new components
- ❌ Using English in `de` locale strings
- ❌ Assuming text fits in a fixed pixel width
- ❌ Imperial units (use metric: km, m)

---

## §18 · Brand voice / copy

> **SUPERSEDED IN PART, 2026-08-03 (weekly law pass).** The REGISTER half of this section is dead.
> `_design-system/COPY_LAW.md` §1 (written 2026-07-29) is now the canonical writing law for all four
> locales and **supersedes** the `du` line below by owner decision, quoted there verbatim: *"make it
> the Sie instead of the du"*. Applied in code the same week: 330 German strings swapped plus 161
> conjugated by hand (`69fc74d65`), Italian moved to `Lei` and French reconciled to `vous`
> (`a0423867d`). Read COPY_LAW.md for register, sentence shape, punctuation, numbers/dates/money,
> per-string-type shape and translation mechanics; what stays live below is the Solen-specific
> pattern table and the anti-pattern list, and even those defer to COPY_LAW.md where they disagree.

### Voice register

- **Direct** — say what the user can do, not how they should feel
- **Formal register** — German `Sie`, Italian `Lei`, and French `vous` across product copy, as owned by `_design-system/COPY_LAW.md`. Apply the register through the translation review and rendered locale path; no automatic register blocker is claimed here.
- **Owner-facing chrome vs. owner-to-customer templates (copy-i18n-10, 2026-07-27):** a dashboard translation key is one of two different audiences, and nothing structural told them apart before this note. Most `dashboard.*` keys are Solen UI CHROME speaking TO the salon owner (`dashboard.settings.vatNumberHint`, "Deine Schweizer..."). A small set are TEMPLATES the owner sends onward TO their own customer (`dashboard.settings.quickReplyDefault1/2`, `dashboard.messagesPage.quickReplyThanks`/`quickReplyConfirmed`, the pre-filled quick-reply message text) — a genuinely different audience that could, in principle, carry its own register decision. The 2026-07-27 register sweep (copy-i18n-02) resolved the immediate collision by converting those 4 keys to `du` too, matching every other Solen-to-owner string in the same namespace, so today there is no register split to get wrong. The naming convention that marks a key as "sent onward to the owner's own customer" going forward: a `quickReply*` (or, for a net-new feature, an explicit `*Template`) key name. If a future key needs a genuinely different register from the rest of its namespace, name it with that suffix so the register-gate's allowlist (copy-i18n-02) and any translator editing the file can tell the audience apart at a glance, instead of guessing from surrounding keys.
- ~~**Conversational** — German `du` not `Sie` (per audience research)~~ **DEAD 2026-07-29** — the
  owner chose formal `Sie` (de), `Lei` (it), `vous` (fr). See `COPY_LAW.md` §1. Warmth inside the
  formal register is COPY_LAW.md §3, which exists precisely so formal does not read institutional.
- **Action-oriented** — verbs over nouns where possible ("Termine finden" > "Termin-Suche")
- **Confident but not boastful** — "Über 1'200 Salons sind dabei" not "Wir haben den besten Service"
- **Speed-anchored** — references "30 Sekunden" promise where relevant

### Sentence-case everywhere

- Page titles: "Termin in 30 Sekunden." (period at end)
- Section h2s: "Profis in deiner Nähe" (no period)
- Pills / chips: "Nur 1 heute", "Heute frei" (sentence case, NOT UPPERCASE)
- Buttons: "Termine finden", "Anmelden"
- Eyebrows: sentence case like everything else. ~~"FÜR SALONS" — the ONE place UPPERCASE is allowed
  (BusinessTeaser eyebrow)~~ **DEAD 2026-06-18** — the owner banned caps outright ("Never fucking
  caps lock"). **Supersedes** this carve-out. See
  `LOCKFILE.md` "Uppercase application policy (rule A7)" and `COPY_LAW.md` §4.4.

### Specific patterns

| Surface | Pattern | Example |
|---|---|---|
| Urgency pill | "Nur X {timeword}" | "Nur 1 heute", "Nur 3 freie diese Woche" |
| Availability pill | Status word | "Heute frei", "Morgens frei", "Vollgebucht" |
| Empty state | Friendly + action | "Keine Salons in Bern. Andere Stadt wählen →" |
| Error state | Honest + retry | "Etwas ist schiefgelaufen. Erneut versuchen?" |
| CTA primary | Verb-first | "Termine finden" not "Suche starten" |
| Save action | "Speichern" (toggle) | Aria says "Gespeichert" when saved |
| Confirmation | Brief, no exclamation | "Gebucht." not "Gebucht!" |

### Anti-patterns

- ❌ Exclamation marks (sales-y, undermines confidence)
- ❌ ALL CAPS outside the one eyebrow exception
- ❌ Em-dashes in user-facing prose (use comma, colon, or `·` middle-dot)
- ❌ Italics (banned per V2-D15)
- ❌ "Click here" or generic CTAs (always say what tapping does)
- ❌ Invented claims ("the fastest", "the best") — quantify or omit
- ❌ Inviting language ("Please") — direct is friendlier in German voice
- ❌ Apologetic empty states ("Sorry, no results found")

---

## §19 · Supabase async patterns

Supabase backs every persistent operation (auth, bookings, reviews, favorites). Each operation has failure modes; the UI must handle each.

### §19.1 · RLS denial

If Row-Level Security denies an operation, Supabase returns an error. Pattern:

```tsx
try {
  const { error } = await supabase.from("favorites").insert({ ... });
  if (error) {
    if (error.code === "42501") {  // RLS denial
      toast("Bitte melde dich an, um zu speichern.");
      router.push("/auth/login");
      return;
    }
    throw error;
  }
} catch (err) {
  console.error("[Favorites] save failed:", err);
  toast("Konnte nicht gespeichert werden.");
}
```

### §19.2 · Rate limiting

If Supabase returns 429 (rate limit), show a toast asking the user to wait. Don't auto-retry — user might be in a loop.

### §19.3 · Realtime sync

For real-time subscriptions (bookings list, availability), the optimistic update + on-success-confirm pattern from §10.4 applies:
1. Update local state immediately on user action
2. Supabase realtime channel will eventually fire and reflect server state
3. If diverged (user offline, network drop), reconcile on next focus

### §19.4 · Auth-required pages

Server components check session; redirect to `/auth/login` with `?from=<current-path>` query param if missing. After login, return to `?from` path.

Client components use a `useSession` hook (TBD — currently checks done in server components only).

**Session-expiry mid-form (states-forms-08, added 2026-07-27):** until the `useSession` hook above
ships, any client-side write that can fail on an expired session (a 401, distinct from a validation
4xx or a network failure) must branch on `res.status === 401` specifically and show a message naming
that cause ("Deine Sitzung ist abgelaufen…"), not the same generic save-failed toast as every other
error, then redirect to `/auth/login?redirect=<current-path>` (existing return-path infra, §19.4
above) so the user lands back where they were after re-auth. Reference implementation: `saveProfile`
in `app/[locale]/profile/settings/SettingsForm.tsx`. Full draft-value preservation through the
re-login round trip is still TBD (needs the `useSession` hook or a form-draft persistence layer,
§14.7 in LOCKFILE.md); the path-return is the interim floor every write-handler should meet now.

### Anti-patterns

- ❌ Blocking UI on Supabase calls (always optimistic, see §10.4)
- ❌ Generic "Network error" toast for everything — distinguish RLS / 4xx / 5xx / network. Positive
  content template (what failed + why/next-step, states-forms-09): `_design-system/LOCKFILE.md` §14.11.
- ❌ Silent failure (no console.error, no toast)
- ❌ Auto-retry without exponential backoff

---

## §20 · Locked decisions

The running list of "we already decided this, don't re-litigate." If you find yourself wanting to change one, raise as a new QUESTIONS.md entry.

| Decision | Locked at | Where the lock lives |
|---|---|---|
| B&W chrome palette, no green/no color in chrome | V3-D138 | This doc §2 + memory project_palette_b_w_pivot |
| Accent = blue `s-accent` #276EF1, sparse HYPERLINK scope (v3 2026-06-11 supersedes v2 "not budgeted"; forest emerald #16A34A retired as accent, survives as success-status hue) | v3 | LOCKFILE §1.5 v3 |
| Inter Tight (display + codes-as-tabular) + Inter (body) — Bricolage + Hanken + JetBrains Mono retired (mono retired 2026-06-10 / V3-D470; codes → Inter Tight tabular per LOCKFILE §13.4) | LOCKFILE §2 / V3-D410 / V3-D470 | This doc §3 |
| 80 / 17 surfaces+ink; interactive blue NOT budgeted (the old "3%" accent cap reversed, v2 2026-06-09) | V3-D138 + v2 | This doc §1 |
| Blue `s-accent` #276EF1 = the HYPERLINK accent, sparse (v3 2026-06-11; the v2 "generous on all tappable" row is RETIRED) | v3 | LOCKFILE §1.5 v3 + SOURCE §1/§2.1 |
| "Termin in 30 Sekunden" is THE positioning | V3-D86 | This doc §1 |
| German `du` not `Sie`, except `legal.*`/`discovery_tos.*` which stay formal | (since launch; exception + gate added copy-i18n-02, 2026-07-27) | This doc §18 |
| ~~German `du` not `Sie`~~ , **REVERSED 2026-07-29: formal `Sie` / `Lei` / `vous`** (supersedes this row) | owner, *"make it the Sie instead of the du"* | `COPY_LAW.md` §1 |
| `card` radius = 16px | V4 era | This doc §5 |
| `ease-glide` is the default easing | V2-D16 | This doc §6 |
| 4 categories on homepage: Coiffeur / Barber / Nails / Karte / Walk-in / Spa | V3-D154 | MobileCategoriesRow.tsx + this doc §21 |
| "Stadt" h2 in MobileMenu removed | V3-D171 | MobileMenu.tsx |
| AvailabilityPill on SalonCard removed | V3-D181 | SalonCard.tsx |
| Centered play orb on EntdeckenCard removed | V3-D162 | Entdecken.tsx |
| Heart-save pattern: HeartButton (44 hit, 32 visible glass) | V3-D72 | components/HeartButton.md |
| Rating star location on cards: Row 1 right (Airbnb pattern) | V3-D174 | SalonCard.tsx |
| TikTok marquee on EntdeckenCard top-left, 12s loop | V3-D165 + V3-D179 | Entdecken.tsx |
| Reviews card structure: stars+date row, line-clamp-3, no divider | V3-D180 (council variant B) | components/ReviewCard.md (JIT) |
| `/entdecken` is a thin re-export of `/discover` | V3-D159 | app/[locale]/entdecken/*.tsx |
| HeartButton heart color when saved: `#FF3366` | V3-D103 | HeartButton.tsx |
| Photography under B&W lock: brand-chrome-B&W + content-color two-tier | V3-D183 (this doc) | This doc §9 |
| Atmosphere wash retired | V2-D68 | (and never reintroduced) |
| AI-generated icons retired (lucide canonical + 3D category PNGs only) | V3-D183 (this doc) | This doc §7 |
| Breadcrumbs reserved for deep pages (≥2 levels); top-level browse uses title-in-header that taps → home, NOT a breadcrumb | V3-D411 (2026-05-31) | §20 note below + Header.tsx |

### Navigation pattern — breadcrumbs (V3-D411, 2026-05-31)

**Breadcrumbs earn their place by DEPTH, not by default.** A breadcrumb's only job is to show position in a hierarchy and let you climb *up* it — value that scales with depth, against a cost of visual clutter + tiny tap targets on mobile.

- **Top-level browse destinations** (Discover/Entdecken; the category landings — reached from nav like a tab, ~1 level deep): **no breadcrumb.** The global header shows the **page title in the logo slot**, and the title taps → home. A 1-level "Home › X" crumb is a dressed-up home link = noise. (This is what the Discover header does — see Header.tsx `isDiscover`.)
- **Deep pages (≥2 levels)** — detail pages (`/discover/[id]`, salon PDP): a **back affordance / breadcrumb is fine** — climbing up genuinely helps, and breadcrumb structured data earns SEO there.
- **Rationale (first-principles, not imitation):** Solen is an app-like consumer product (Pinterest / Uber / Airbnb register) → bottom-tab + back-button + clear-title navigation, *not* the e-commerce/docs breadcrumb tree. Confirmed twice: V3-D384 removed the global breadcrumb on /discover; V3-D410/411 made the title the header and dropped the crumb.

---

## §21 · Fresha translation playbook (extracted from SOLEN_PATTERNS Parts 4-5-8)

### §21.1 · The translation principle

**Fresha = costume. Solen V3 = anchor.**

For each Fresha element on a screen we're rebuilding:
1. Identify what it COMMUNICATES (info / action / photo / decoration)
2. Strip the Fresha visual treatment (colors, type, shadows, icons, copy voice)
3. Re-deliver the same communication using Solen's tokens + components + voice

Fresha is reference for **information architecture** (what content, in what order). Solen is the visual + voice.

### §21.2 · Per-route-class IA reference index

Mobbin **first**; Chrome live capture **fallback** when Mobbin lacks the screen. Both are valid — choose by availability.

**Mobbin:** Pull fresh via `mcp__mobbin__search_screens`. Curated + measurement-tagged.

| Solen route class | Mobbin query | Reference for |
|---|---|---|
| Homepage / discovery feed | `"Fresha landing"` or `"Fresha marketplace search"` | Hero + search + curated lists IA |
| Salon detail page (`/salon/[slug]`) | `"Fresha salon detail"` | Hero gallery, services list, staff, reviews, booking entry |
| Booking flow (`/salon/[slug]/booking` → `/checkout` → `/confirmation`) | `"Fresha booking flow"` | Service select, time select, professional select, review+confirm, deposit |
| Profile / saved (`/profile/*`) | `"Fresha customer profile"` | Past bookings, saved salons, gift cards |
| Search results (`/search`, `/coiffeur`, `/barbershop` etc.) | `"Fresha search results"` | Filterable result lists |

**Chrome live capture (Q20 fallback):** When Mobbin doesn't have a needed screen, capture Fresha live via Playwright or the `pixel-ref-collect` skill at standard viewports — 375 (iPhone SE), 768 (iPad), 1440 (desktop). Save to `public/_pixel-refs/fresha/<route>/<viewport>.png` and run `pixel-spec-auto` for measurement extraction. The captures live in the repo; we re-capture as Fresha updates so we always have a current reference.

Example: Fresha's "stylist availability" view (per-staff calendar) — not curated on Mobbin as of 2026-05-26. Capture live in Chrome → `public/_pixel-refs/fresha/stylist-availability/375.png` → run pixel-spec-auto → extract measurements. **The Chrome capture IS the reference** when Mobbin doesn't have one.

### §21.3 · Fresha→Solen element mappings (general)

| Fresha element | Solen pattern |
|---|---|
| Photo gallery hero | SalonCard or full-bleed gallery + section title |
| Sticky tab bar | New `<TabBar>` primitive (TBD); s-ink active underline, no color flood |
| Service list with prices | List row pattern (similar to FeaturedStylists ProCard) with service name + price right-aligned |
| Staff section | FeaturedStylists ProCard pattern |
| Reviews | ReviewCard horizontal carousel (extracted from homepage Reviews) |
| Photo carousel | ScrollRow + circle scroll arrows (desktop) |
| Sticky bottom booking CTA | **`s-ink` pill** at `fixed bottom-4 inset-x-3` mobile (V3-D189: s-brand retired) |
| Opening hours table | Custom table; status pills for "Heute frei" |
| Map | Mapbox embed; SolenMap component (TBD) — V2-D10 locked OUT for v1 |

### §21.4 · What to KEEP from Fresha (IA)

- Page IA — what content appears, in what order
- Tab structure (services / about / reviews / location / staff)
- Booking CTA wiring (CTA → booking wizard)
- Per-service "Buchen" buttons
- Photo gallery order (hero → all photos)
- Empty-state messaging structure

### §21.5 · What to DROP from Fresha (visual)

- All Fresha colors → Solen chrome (B&W) for NON-interactive surfaces; interactive affordances (links, tabs, ghost/secondary buttons, tappable rows, inline action labels) take the blue interactivity accent `s-accent #276EF1` (v2 rule 1). The single primary commit CTA stays `bg-s-ink`. Semantic signals unchanged: `s-star`, `--heart-active`, urgency amber, `s-success`/`s-error`/`s-warning`.
- All Fresha typography → Bricolage + Hanken
- All Fresha button styles → `bg-s-ink text-white` primary CTA
- All Fresha card shadows → elevation-1/2/3
- All Fresha icons → lucide
- Fresha pill styles → §6.4 interaction patterns

### §21.6 · What to ADAPT (voice)

- Section h2s → Section Title pattern with chevron-stem-draw on hover
- Vertical rhythm → `mb-2 md:mb-3` between sections
- Highlight words → no terracotta heartbeat (retired); use bold weight + ink color for emphasis
- ~~All copy in German `du` voice per §18~~ , register went FORMAL 2026-07-29 (supersedes this line); see `COPY_LAW.md` §1

### §21.7 · Open IA questions

When tackling a new route class, raise these (extracted from SOLEN_PATTERNS Part 8):

1. Booking flow integration — wizard route or modal?
2. Photo gallery interaction — lightbox or scroll?
3. Sticky CTA on mobile — single button or expanded with date+time?
4. Per-service quick-book or only page-level CTA?
5. Auth gate before booking — required or guest-checkout?
6. Hero treatment — Bricolage display headline or other?

---

## §22 · How to use this doc

### Reading order for a new session

Start with the current project's UI reading order and the three [scoped contract sections](#scoped-design-contract). Then select affected sections: color/type (§2/§3), components (§8/§14 and the registered component contract), states/controls (§10/§11), accessibility/i18n (§16/§17), or reference structure (§21). Motion and performance use their applicable current owners and §6/§13 when relevant. Read surrounding context when it changes interpretation and reuse unchanged accepted evidence. A new session does not require reading every section.

Current LOCKFILE and dated owner decisions govern older examples here. Use the project's named-reference capture procedure; an old Mobbin example is not a substitute for an exact requested capture. Open choices route through TASTE_AUTHORITY and the existing decision record.

### When to update this doc

- A new locked decision → §20 + the relevant section
- A new component → its `components/<Name>.md` AND a one-line entry under §20 if it locks new behavior
- A new token in `tailwind.config.js` → §2 (or retired-but-defined table if removed)
- A new keyframe in globals.css → §6.3
- A new route class to rebuild → §21.2 with its Mobbin query

### When to RESIST updating this doc

- Style tweaks that don't lock behavior
- One-off measurements (those live in component .md files)
- Bug fixes (those go in code + V3-D provenance comments)
- Anything that's not "the system" (those go in `_rules/SOLEN_UI.md` or stay in code)

### Pairings

- **QUESTIONS.md** — open decisions accumulating during builds
- **components/<Name>.md** — per-component specifics
- **`_rules/SOLEN_UI.md`** — universal UI/UX principles (orthogonal — tokens here, thinking there)
- **`solen-drift-check` skill** — explicitly targeted, report-only candidates for token drift and clickable surfaces

---


---

## §23 · Forms

The one layer this document did not have. Probed 2026-08-09 against the 22 layers a complete design
system carries: 21 were specified somewhere, forms was not, and the product had filled the gap on
its own with **111 labels in 8 different styles**. What follows is written from measurements of the
live product and of the two references the owner named, not from preference.

### 23.1 The field , LOCKED 2026-08-09 (owner decision, see TASTE_LOG)

| property | value |
|---|---|
| height | **48** (`min-height: 48px`, the base rule in `globals.css`) |
| corner | **12** |
| fill | **white** |
| line | **1px `#E4E4E7`**, always visible |
| when tapped | **nothing changes** |
| error | the same line turns `--color-error` (`.input-error`) |

Owner verbatim: *"make like airbnb but without the focus line when tapped in"*, after being shown
Airbnb measured at 60 tall / 12 corner / no fill / 1px grey, and Uber at 48 / 8 / grey fill / 2px
black on focus. This supersedes the 2026-07-17 filled-grey-at-rest decision and the LOCKFILE §3.5
depth note, both of which now describe history.

**The known cost, recorded because it was raised before the decision and accepted:** with no change
on focus there is no visible indicator of which field is active, which WCAG 2.4.7 asks for. On a
phone the caret and keyboard cover it; on a laptop keyboard navigation has nothing. The smallest
change that would satisfy both is the line darkening to `s-ink-2`, and it remains available.

**One implementation fact that matters more than it looks:** the base rule in `globals.css`
out-specifies Tailwind utilities on every input in the product. A field styled with classes on the
element will silently render as the base rule instead. This was measured on 2026-08-09, when a
comparison page built from real `<input>` elements rendered three "different" designs identically.
Change the base rule, or the change does not happen.

### 23.2 The label , OPEN, and the only thing in this section that is not settled

**111 labels, 8 styles.** The three actually in use: `text-xs / font-medium / s-ink-2` (69 places),
`text-[12px] / s-ink` (8), `text-[12px] / font-semibold / s-ink` (4). Seventeen more carry no
explicit style at all.

Both references reject the whole idiom: Airbnb floats a 16px grey label INSIDE the field, Uber uses
no label and asks a 20px black question above it. The five options are rendered at
`/dev/form-labels`. Until this is settled, **use the 69-place style** and do not invent a sixth.

### 23.3 Everything else, and where it already lives

Not repeated here, because a value written twice is a value that will disagree with itself:

- helper text, validation, required marking, disabled , SOURCE §10 (state grammar)
- select, checkbox, radio , COMPONENT_REGISTRY
- multi-step progress , SOURCE §13.2 (stepper)
- keyboard and autofill hints , `_rules/` i18n and a11y
- copy inside a field (placeholder, helper, error wording) , COPY_LAW

### 23.4 The rule this section exists to prevent

A layer nobody writes down does not stay empty. It gets filled by whoever touches it next, once per
touch. Eight label styles is not eight decisions; it is one decision nobody made, taken 111 times.

---

*End of SOURCE.md. Last updated 2026-08-09 , §23 Forms added (the one missing layer).*

# Control elevation & emphasis: when white-elevated vs flat vs ink

**V3-D420 (2026-06-01).** Council-ratified (3 lenses: Uber-fidelity, Solen-brand, affordance/a11y, unanimous).
Researched against 6 real Uber Eats iOS screens (Mobbin). Companion to LOCKFILE §3 (shadow tokens) +
SOURCE §14 (color decision tree). **Read before styling any add-button, quantity stepper, or action pill.**

---

## THE PHILOSOPHY (one line)

> **Elevation is earned by the background, not by the button.** A control wears white + shadow ONLY when it
> sits on a photo it must stay legible over; on Solen's flat white/stone chrome, emphasis comes from FILL,
> quiet controls go soft-grey (text) or bordered-white (icon), the single primary goes ink, and shadow is
> reserved for that one ink lift and for glass-over-photo. **White-elevated-on-white is not a third button; it's noise.**

### Why (so we don't cargo-cult the look)
Uber Eats is ~60% photography; every control floats over unpredictable pixels, so elevation does real
**legibility** work (a white pad manufactures a guaranteed local-contrast field). Solen is the inverse: B&W
chrome on white, photos confined to ~4 framed slots. Porting "elevation everywhere" onto white chrome makes
shadows accumulate as grey haze, inverts hierarchy (if everything lifts, the one primary can't be found), and
adds a 4th visual dialect the LOCKFILE exists to prevent. **The look the user likes (A) comes from the photo
contrast, not the shadow, so keep A unmistakably the over-photo treatment, and let calm surfaces stay flat.**

---

## THE DECISION TREE (first match wins)

**Q1: Is it THE one primary commit action of the region?** (pay / confirm / book)
→ **(C) INK-FILLED** `bg-s-ink text-white`, `rounded-btn`/pill. Max ONE per region (CTA lock). Fill, not
  elevation, encodes "the destination." Ink CTAs MAY carry `shadow-elevation-2` (the one deliberate lift).

**Q1.5: Is it a secondary ACTION on a FLAT white / `s-bg-sunken` surface** (NOT over a photo — that's Q2 → A frosted glass; and NOT the one primary commit) — Wegbeschreibung, Kalender hinzufügen, Teilen, Verwalten, a see-all/view-all, a tappable inline label?
→ **(E) BLUE-GHOST** `bg-white border border-s-accent text-s-accent`, press-scale(.97). v2 rule 1: secondary actions are blue, not flat-grey. A plain text link uses `text-s-accent` directly (hover-underline). (B flat-grey below is for genuinely quiet/decorative controls — filters, the `(i)`, steppers — NOT a labeled secondary action.) Never a blue-FILLED button (that reads as a 2nd primary). **Over-photo controls fall through to Q2 (A frosted glass) — first-match-wins, so a Share/back/heart button on a hero photo is A, NOT blue-ghost (CANON §5).**

**Q2: Does the control sit OVER a photo / image / non-flat surface?** (hero, gallery, Entdecken thumb, lightbox)
→ **(A) ELEVATED WHITE GLASS.** Use the canonical `FROST_GLASS` recipe (frosted white `rgba(255,255,255,.80)`
  + `blur(4px)` + 1px white inner border + soft shadow), already in `SalonHero.tsx`. Over a *light* photo,
  bump to `shadow-elevation-2` (elevation-1 under-reads on small circles). This is the ONLY place A is allowed.

**Q3: Calm control on a flat white / `s-bg-sunken` surface** (steppers, secondary pills, the `(i)`, filters)
→ **(B) FLAT**, split by whether text carries the affordance:
  - **Text control** (Anstehen, Buchen, TabPill) → `bg-s-bg-sunken` fill, ink text, **no shadow**. Hover deepens
    fill to `bg-s-border` (never adds a shadow). The text carries legibility, so the low-contrast fill is fine.
  - **Icon-only / shape control** (a "+", a stepper end-cap) → `bg-white border border-s-border` (bordered-white),
    OR live inside a bordered/elevated shell. **NEVER borderless `bg-s-bg-sunken` on white** (see contrast trap).
  - Inline `−/+` over a no-image add-on row → bare **ink glyph** (Uber's inline circles); ink does the contrast
    job on plain white. Lightest possible.

**(D) hybrid, REJECTED as a resting treatment.** Fill + shadow + border = three separation mechanisms doing one
job. The only legit "hybrid moment" is a **pressed state**: an elevated control swaps shadow → inset on `:active`.

**Compressed:** `primary → C (ink)` · `secondary action → E (blue-ghost: bg-white border-s-accent text-s-accent, press-scale)` · `over imagery → A (frosted white)` · `calm/quiet → B (flat: text=soft-grey, icon=bordered-white)`. (v2: a tappable secondary action is blue-ghost, not flat-grey; B is for genuinely quiet/decorative controls only.)

---

## HARD RULES (a11y + tokens)

1. **Contrast trap, the big one.** `s-bg-sunken #F4F4F5` on white `#FFFFFF` is **~1.03:1**, an invisible edge,
   AND it's already the codebase's "inert/placeholder" signal (avatars, disabled). So a borderless grey *icon/shape*
   control on white reads as dead. Any control whose boundary is the affordance must clear **≥3:1** (WCAG 1.4.11)
   → border it (`border-s-border`) or shell it. Text controls are exempt (text carries it).
2. **Tap target ≥ 44×44.** Visible glyph circle may be 32-40px, but the hit area is ≥44px (HeartButton 44-hit/32-visible).
3. **Shadow lives in exactly two places:** the one ink primary, and glass-over-photo. Zero box-shadow on any control
   resting on white or `s-bg-sunken`. (Drift-check candidate: `bg-white` + `shadow-*` NOT over an image/hero/modal.)
4. **Stepper state:** qty 1 shows a **trash** glyph; qty ≥2 shows **−**. Same chrome, swap glyph + `aria-label` only.
   Quantity numeral = `tabular-nums text-s-ink` (calm, not bold). Disabled `−/+` at min/max = `text-s-ink-3 opacity-30`.
5. ~~**Blue = interactivity (v2).** A resting secondary/ghost control MAY wear blue — the blue-ghost recipe... active tab/segmented states, and interactive icon tints.~~ **SUPERSEDED by LOCKFILE §1.5 v3 (2026-06-11) + the gray-selected lock (owner 2026-06-29); noted here 2026-07-10 (doc-vs-law drift, same class as the design-governance audit findings).** Current law: blue is the HYPERLINK color only (review counts, inline body links, Mehr lesen, the sparse set) + system states (focus ring / spinner / input focus / §13.2 stepper discs). Secondary/ghost buttons = NEUTRAL outline (`bg-white border-s-border text-s-ink`), NOT blue-ghost; tabs/segmented selected = calm gray `bg-s-bg-sunken`, never blue; icon tints = ink. Never a blue-FILLED primary; never blue on body/labels/prices/headings/eyebrows.

---

## MATERIALS: text on glass + material weight + a11y fallbacks (owner-approved 2026-07-10; Apple materials guidance via the emilkowalski apple-design skill)

Applies to every translucent surface: `FROST_GLASS` controls, the sheet/backdrop blurs, dashboard glass panels.

1. **Vibrancy — text over glass is never flat grey.** Over a blurred/translucent surface the background shifts under the text, so mid-grey (`s-ink-2/3`) loses legibility exactly when the photo behind is busy. On glass: use `s-ink` (or white over dark scrims) at weight **500+**, optionally a hair of positive tracking on small sizes. Semantic COLOR (green/red/blue) belongs on a solid layer, never on the glass foreground where the backdrop pollutes it.
2. **Material weight encodes hierarchy.** A small control keeps the light 4px-blur `FROST_GLASS`; a large structural surface (sheet backdrop, nav layer, dashboard panel) reads as a thicker material: stronger blur (12-24px, the globals.css glass classes) + the deeper shadow it already carries. Small chip = thin glass, big surface = thick glass; never the reverse.
3. **Never stack light glass on light glass.** Legibility collapses. A control sitting on a glass surface goes FLAT (B) or ink (C), not a second frost layer.
4. **Three-signal a11y (the web trio; we previously handled only the first):**
   - `prefers-reduced-motion` — already law (§16.5.8 / sheet fade path).
   - `prefers-reduced-transparency: reduce` — every glass surface goes frosty-to-SOLID: background opacity → ~0.98, `backdrop-filter` dropped. Implemented centrally in globals.css via the `.frost-glass` utility + the glass classes.
   - `prefers-contrast: more` — glass surfaces take a near-solid background + a defined `border-s-border` edge.
5. **Implementation note (why the utility class exists):** the old `FROST_GLASS` inline-style object could never be overridden by the media queries above (inline styles beat stylesheets), so the recipe lives as the `.frost-glass` class in globals.css; `lib/frost-glass.ts` re-exports the class name for the 13 migrated callsites (count verified in the 2026-07-10 migration; grep `frost-glass` for the live list). New glass = the class, never a re-derived inline recipe.

---

## AUDIT + SWEEP LOG (V3-D420, swept 2026-06-01)

Verified against the codebase by an inventory agent. ✅ = fixed this pass · ✓ = already correct · ⏸️ = deferred.

| Component | Was | Verdict | Action |
|---|---|---|---|
| `SalonHero` back/share/heart | frosted glass over photo | ✓ correct (A) | promoted recipe to `lib/frost-glass.ts` |
| `SalonWalkInPanel` `(i)` button | `bg-white shadow-[…]` on a sunken strip | ❌ degraded-A | ✅ flat bare-glyph (B) |
| `TabPill` inactive (registered primitive) | `hover:shadow-[…]` lift on white | ❌ lift on calm | ✅ flat hover (text+border deepen), propagates app-wide |
| `Header` mobile hamburger | `bg-white shadow-[0_6px_18px…]` on frosted bar | ❌ heavy shadow on white | ✅ bare icon (matches sibling bell) |
| `CardFilterRow` filter pill | `shadow-elevation-1` resting on white (both states) | ❌ resting shadow | ✅ dropped (kept border) |
| `FeaturedSalonCarousel` arrows | `hover:shadow-elevation-1` on white | ❌ hover lift | ✅ `hover:bg-s-bg-sunken` (flat) |
| `CityTopBar` city picker | `shadow-[0_1px_2px…]` resting on white | ❌ resting shadow | ✅ dropped (kept border + hover translate) |
| `FeaturedStylists` SaveHeart | verbatim FROST_GLASS re-derive over photo | ⚠️ ad-hoc A | ✅ repointed to shared `FROST_GLASS` |
| `Anstehen` / `Buchen` text pills | flat `bg-s-bg-sunken` + text | ✓ correct (B-text) | keep |
| `WalkInPaymentForm` pay CTA | `bg-s-ink text-white` | ✓ correct (C) | keep |
| `SalonServicesSheet` / `ToggleCircle` add-toggles | bordered-white ↔ ink-fill, no shadow | ✓ already compliant | follow-up: unify as `IconToggleButton` |
| `BentoBusiness` white+shadow (`:485`/`:591`) | white-fill on a `bg-s-ink` surface | ✓ correct INVERSE-primary (first audit was wrong) | keep |
| `MarketplaceVisual` faux-card (`:55`/`:60`) | decorative `aria-hidden` mimic | ✓ surface, not a control | keep |
| discovery `VideoCard` / `ItemCard` circles | ad-hoc frosted-A over photo | ⏸️ DEFERRED (user excluded discovery) | adopt `FROST_GLASS` in a later pass |

**Enforcement (new this pass):** drift-checker rule **A14** flags `rounded-full/btn/pill` + `bg-white` + `shadow-*` not-over-image (INFO, heuristic). The scanner now also covers `components-legacy/**` (was `app/**`-only, so it had been blind to most shared components).

**Structural root (still open):** there is no shared `QuantityStepper` primitive, BUT the inventory found ZERO quantity-stepper callsites in the app (you add a service once, you don't buy N of it), so building one now would be dead code. The live add-control is the already-compliant toggle (`SalonServicesSheet` / `ToggleCircle`); its only real debt is duplication, fixable as an `IconToggleButton` primitive. `QuantityStepper` stays a documented spec (the mockup) until a multi-quantity surface needs it.

**Dashboard (`/dashboard/*`) is EXEMPT:** it has its own vibrant skin (LOCKFILE §12). **Discovery (`components-legacy/discovery/**`) is DEFERRED, not exempt:** the rule applies, the user just excluded it from this sweep.


## Grouped list cards (2026-06-11 owner addition)

The Atelier service-grouping pattern is the ONE sanctioned at-rest shadow on a calm
surface: a grouped rows-in-one-card list may carry `shadow-whisper` (0 1px 3px 4% +
0 10px 28px -14px 10%). It is a whisper, not a lift — anything heavier (elevation-1/2/3
at rest, hover shadow bumps) on a list card is the grey-haze drift this doc bans.
Full rule: LOCKFILE "Grouped list cards".

---

## THE SEE-ALL / CTA LADDER (owner-requested 2026-07-24: "we have multiple CTA variations, we need ONE principle variation, right now it's so inconsistent between itself")

### The measured inconsistency
`app/[locale]/_components/primitives/SeeAllButton.tsx:35` exports THREE variants,
`"pill" | "pill-outline" | "link"`, and the file's own header states why: each was added to
"reproduce an EXISTING owner-approved look" from a different surface. Seven files import it, and
several sections still hand-roll their own "Alle ansehen". Same job, three looks, chosen by SURFACE
instead of by JOB. Nobody decided that; it accumulated.

**CONTRADICTION SURFACED (rule 18):** Q1.5 above lists "a see-all/view-all" under (E) BLUE-GHOST,
but every shipped see-all is the GRAY SUNKEN pill (owner-approved 2026-07-15, Services/Reviews/Team).
Code + the dated owner approval win over the older prose. Q1.5 is hereby corrected: a see-all is
rung 3 below, NOT blue-ghost. Blue-ghost stays for genuine secondary ACTIONS (Directions, Share, Manage).

### THE LADDER , rung is chosen by the ACTION'S WEIGHT, never by the surface it sits on
| Rung | Job | Treatment | Per screen |
|---|---|---|---|
| 1. Commit | The action the screen exists for: Book, Pay, Join queue, Select in a picker list | INK-FILLED `bg-s-ink text-white`, pill, may carry `shadow-elevation-2` | ONE job; a LIST of peer choices may repeat it once per row |
| 2. Secondary action | A real labelled action that is not the commit: Directions, Add to calendar, Share, Manage | BLUE-GHOST `bg-white border border-s-accent text-s-accent`, press-scale. Never blue-FILLED | Any number, all identical |
| 3. Expand / navigate (see-all) | Reveal the rest of a list, or go to that list's own page | THE canonical see-all: gray sunken pill (`bg-s-bg-sunken`, `text-s-ink`, semibold, hover `bg-s-border`), centred under the list, label folds the count in ("All 16 reviews") | ONE per section |
| 4. Quiet control | Filters, steppers, the `(i)`, chips | FLAT neutral: white + hairline; selected = `bg-s-bg-sunken` + ink + semibold. Never blue, never black fill | Any number |

### What collapses into what
- variant `pill` , **the survivor.** It is the only see-all.
- variant `pill-outline` , RETIRED. Its caller (StaffProfilePage's full-width bordered pill) adopts rung 3.
  A see-all is not a commit, so it must not wear button-like outline weight.
- variant `link` , allowed ONLY as the top-right affordance beside a section H2 ("Team ... See all >"),
  where a pill would out-weigh the heading. Everywhere else: rung 3.
- Hand-rolled "Alle ansehen" markup in section components , replaced by the primitive.

### The test
Point at any button and ask: WHICH RUNG IS THIS JOB? If two buttons doing the same job on two screens
answer the same rung and still look different, one is drift. If a button's look was chosen because
"that's how this surface already did it", that is exactly the failure this ladder exists to stop.

STATUS: principle written 2026-07-24, owner sign-off pending. Applying it retires a variant and touches
7 importers (shipped surfaces), so it waits for the yes, then goes through the normal loop.

---

## AMENDMENT 2026-07-24 (owner-driven, after a REJECTION the tree itself caused)

The owner rejected an ink-filled Select button on the "Select professional" picker with:
"that's not at all what I asked you to do, and that's completely against the design and taste file...
if this is the design and taste file, then fix the taste file." Two gaps are being closed, because the
tree above is what produced the wrong answer.

### GAP 1 , the tree had no rung for a LIST OF PEER COMMITS
Q1 says "the one primary commit action of the region -> INK-FILLED, max ONE per region (CTA lock)".
A picker LIST (choose a stylist, choose a slot, choose an address) is neither: every row carries the
same commit, so applying Q1 literally multiplies the ink CTA down the page and destroys the very
hierarchy the CTA lock exists to protect.

**NEW Q1.2 (insert before Q1.5): Is this the commit action of ONE ROW in a list of PEER CHOICES?**
-> **(F) ROW-COMMIT.** NOT ink. A calm pill that reads tappable without claiming page-level primacy:
   white fill + pill radius + `shadow-whisper` (the "floating" lift the owner asked for, see GAP 2),
   `text-s-ink` semibold, >= 44px. Identical on every row , never promote one row over another.
   The page's ONE ink CTA, if it has one, stays reserved for a page-level commit (e.g. the sticky
   Book bar), never for a row.

### GAP 2 , "white + shadow" is not always the grey-haze
Taste rule 7 says elevation is earned by the background, and bans white-elevated-on-white as noise.
That holds for DECORATIVE lift. It does NOT hold for a row-commit control, which needs to read as
liftable/tappable against a card that is itself white. Owner decision 2026-07-24, chosen from a
rendered comparison: the row-commit pill is **white + a soft shadow (floating)**.
Scope of this exception: row-commit controls only (F above). Everywhere else taste rule 7 is unchanged,
and a white card on white still needs a hairline or a sunken tray, never a shadow alone (FLOORS LAW 4).

### CONSEQUENCE
The ink Select shipped on 2026-07-24 is REVERTED and graveyarded (REMOVED.md). Any future picker list
uses (F), not Q1.

---

## FINAL TASTE PRINCIPLE , the CHIP ROW is the one selection grammar (owner 2026-07-24)

Owner, on picking filter direction F2 for reviews: "in all these type of styles, we already have it in
the other section, so I can make this like a taste final principle for consistencies."

He is right that it already exists , `app/[locale]/_components/primitives/TabPill.tsx:73/79` is the
shipped grammar (selected `border-s-border bg-s-bg-sunken text-s-ink`, unselected `bg-white text-s-ink-2`),
already used by SalonServices (category pills) and the search FilterSheet. The reviews filter was the
odd one out, first as single-select chips, then as a checkbox+bar chart. Both are now retired.

### THE PRINCIPLE
**Any "narrow this list by a known set of options" control is a CHIP ROW, and the chip row is TabPill.**
- Options render as horizontal pills, each carrying its own count when a count exists ("5 (13)").
- Selected = `bg-s-bg-sunken` + `text-s-ink` + semibold. Unselected = white + hairline.
  Never blue, never black fill (design contract "selected / active" row + taste rule 3).
- Multi-select and single-select use the SAME look; the difference is behaviour, not treatment.
- No bar charts. A distribution bar implies the distribution is worth reading; on real Solen volumes
  (a salon with 16 reviews) it is decoration that reads as a black mass. Owner rejected it by name.
- The only sanctioned neighbours of a chip row are a section label above it and a sort control beside it.

### WHY THIS IS A CONSISTENCY RULE, NOT A STYLE PREFERENCE
The reviews filter drifted three times (chips -> checkbox+bars -> chips) because each rebuild looked at
the SURFACE it was on instead of asking "what kind of control is this?". Same root cause as the three
divergent see-all variants above. One grammar per job is the fix; the ladder covers actions, this covers
selection.

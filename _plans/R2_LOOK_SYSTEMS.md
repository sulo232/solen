# Round 2: the base recipes, and three look systems

Written for `_plans/DIRECTIONS_0905_R2.md` boxes 10a, 10b, 11b and 13. His words that produced it,
dictated 2026-09-05:

> "there's gonna be now multiple pill shades, pill contrast or, like, typography, all of those. So
> maybe we look into that and actually fix up ... we have to, like, actually concise"

**How to read this.** Part A is ONE set of recipes every round-2 mockup uses, whichever look system it
belongs to. Part B is three ways of composing a screen out of them; they differ in STRATEGY, not in
paint, and a mockup belongs to exactly one. Part C is the list of decisions that are his.

**Tiers.** Every value carries one. **verified** = read this run from the file or command named beside
it. **cited** = measured in a named companion file from this same run and not re-measured here
(`ROUND1_LOOK_TABLE.md`, `WHY_UNFINISHED.md`, `_design-system/references/airbnb--look-recipes.md`,
`fresha--look-recipes.md`, `treatwell--look-recipes.md`). **not checked** = written as that, never as a
guess. Contrast figures were computed this run in `scratchpad/r2/contrast.py` and `contrast2.py`.

His source rule, 2026-09-05, governs every choice below: placement and anatomy from Fresha, the look
and the motion from Airbnb, both captured live, and "not completely" means both sit on Solen's own
contract (ink commit button, sparse blue, the locked radii, no dark mode, no fabricated data, the
FLOORS LAW minimums, WCAG AA).

---

# Part A. THE BASE

One recipe per element. A round-2 mockup that renders a value not on this page is out of the system,
whatever it looks like.

## A1. Pill and chip

| property | value | provenance | tier |
|---|---|---|---|
| height | 44px (`h-11`) | Solen lock, `CLAUDE.md:143` touch-target row. Airbnb's filter pill measures 34px and Fresha's category pill 36px, both under our floor, so neither height ports. | verified (lock); cited (both reference heights) |
| radius | **see CONFLICT C1.** The base ships `rounded-[16px]` per `CLAUDE.md:134` (dated 2026-08-16) and every mockup prints the conflict above the section. | `CLAUDE.md:134` verified; `tailwind.config.js:288` `btn: "99px"` verified | verified |
| unselected | fill `#FFFFFF`, border `1px #E4E4E7`, text `#6B6B6B`, 14px / weight 500 | Solen `TabPill.tsx` anatomy, transcribed verbatim at `press-motion/_va/PressPillA.tsx:57-74`. Convergent: Airbnb's filter pill is white + `1px #DDDDDD`; Fresha's unselected category pill is transparent + `inset 0 0 0 1px rgba(19,19,19,0.1)`. | verified (ours); cited (both references) |
| selected | fill `#F4F4F5`, border `#F4F4F5`, text `#0A0A0A`, semibold | Solen lock, `CLAUDE.md` design contract "selected / active" row; ink fill is dead by name at `REMOVED.md:41`, blue border dead with it. `PressPillA.tsx:66-69`. | verified |
| **the contrast fact he asked about** | the selected fill measures **1.10:1** against the white page and the unselected border measures **1.27:1**. Neither is a boundary on its own. The selected state is legal because THREE things change at once: the fill, the border colour (it disappears into the fill), and the weight (500 to semibold). Remove any one and the state stops reading. Text on the selected fill is 18.01:1. | computed this run, `contrast2.py` | verified |
| pill fills allowed on a round-2 screen | exactly three outside a badge: `#FFFFFF`, `#F4F4F5`, `#0A0A0A`. Round 1 shipped **15 distinct literal pill fills** across the picked screens. | cited, `ROUND1_LOOK_TABLE.md` cross-screen section | cited |

## A2. Status badge

He named this one: *"make it so we actually use the badge design system that we already have on other
places."* That is `components-legacy/booking/BookingCard.tsx:84-90` (the state map) and `:137-139` (the
render), which the live `/[locale]/profile/bookings` route renders through `BookingsList.tsx:6`.

**What the shipped recipe is** (verified, read this run):

```
statusConfig = {
  confirmed: { bg: 'bg-s-success/10', fg: 'text-s-success' },
  pending:   { bg: 'bg-s-warning/10', fg: 'text-s-warning' },
  cancelled: { bg: 'bg-s-error/10',   fg: 'text-s-error'   },
  completed: { bg: 'bg-s-ink/5',      fg: 'text-s-ink-2'   },
  no_show:   { bg: 'bg-s-ink/5',      fg: 'text-s-ink-2'   },
}
render: rounded-pill px-2.5 py-1 text-[12px] font-semibold {bg} {fg}
```

**What is KEPT, unchanged:** the shape, the `px-2.5 py-1` padding, the 12px size, the five states and
their `bookingCard.status.*` labels, and the pale semantic fill. That is the thing he recognises.

**What CHANGES, and why, with the number:**

| change | from | to | reason | tier |
|---|---|---|---|---|
| 1. the text colour | the semantic token itself | `s-ink` `#0A0A0A` | Computed this run: confirmed `#16A34A` on its own `/10` fill (`#E8F6ED`) is **2.96:1**, pending `#F1AE27` on `#FEF7E9` is **1.82:1**, cancelled `#DC2626` on `#FCE9E9` is **4.13:1**. WCAG AA for 12px text is 4.5:1, so three of five states fail, and pending fails even the 3:1 graphical floor. Ink on the same fill is 17.76:1. **This is not a new rule.** `CLAUDE.md` taste rule 6 already specifies the recipe as "pastel `.bg` + ink text + saturated icon", and taste rule 4 already says success "is legal as ICONS, never as body text". | verified (computed) |
| 2. a leading icon appears | none today | a 14px semantic glyph (check / clock / x / check-circle-off) | Same taste rule 6. The shipped badge has no icon at all, so once the text goes ink there is nothing left carrying the state's colour. Fresha does the same thing (its "Confirmed" pill carries a white check-circle icon) and Airbnb does not (see CONFLICT C2). | verified (rule); cited (Fresha) |
| 3. the fill comes from the token, not the alpha | `bg-s-success/10`, which computes to `#E8F6ED` | `s-success.bg` `#E8F5E9` | Round 1 shipped both literals on two different screens for the same green family, one blue-channel step apart. `LOCKFILE.md` §1 locks `.bg` values for exactly this. | cited (`ROUND1_LOOK_TABLE.md` inconsistency 7); verified (LOCKFILE §1) |
| 4. weight | `font-semibold` | unchanged in the source, and it renders at **500** | `app/globals.css:269` clamps `.font-semibold` to 500 inside `<main>`. Nothing to change; recorded so a critic measuring 500 does not file it as drift. | verified |

**One open number inside this recipe.** After change 1 the icon carries the hue, and `#16A34A` on its
own pale fill measures **2.96:1**, under the 3:1 floor for a graphical object. The `s-warning` family
already has the darker companion for this exact job (`.text` `#B45309`, 4.71:1 on its own fill,
V3-D424). `s-success` and `s-error` do not. See CONFLICT C3.

## A3. Primary button (the one commit action per screen)

| property | value | provenance | tier |
|---|---|---|---|
| count | exactly one per screen | Solen lock, `CLAUDE.md` taste rule 3 and the design contract | verified |
| fill | **`#1C1C1F`**, written as `bg-s-ink` | **Corrected in this pass; the row used to say `#0A0A0A` and that was wrong.** `LOCKFILE.md:41` makes `s-ink-soft` `#1C1C1F` "THE INK FILL. Every filled-black surface: primary CTAs, the sticky book bar, selected pills, filled icon buttons", owner-picked 2026-08-15 off the four-way mockup at `/dev/pill-ceramic` because "a large flat pure-black surface reads as a hole punched in the page". `app/globals.css:230-232` implements it as a one-line `.bg-s-ink` override so a newly typed `bg-s-ink` cannot be the old black; `tailwind.config.js:205` defines the token. `#0A0A0A` (`s-ink`) stays the TEXT ink, his explicit carve-out. Measured this run at 390x844 on `/en/dev/directions-0905-r2/salon-book-button`: the ink Book button computes `rgb(28,28,31)`. So round 1's four screens at `#1C1C1F` were correct and press-motion A's `#0A0A0A` was the outlier, because that file writes the raw hex instead of the class (its own header says so). **Write `bg-s-ink` and let the override do it; never hardcode either hex.** | verified (LOCKFILE:41, globals.css:230-232, tailwind.config.js:205, live computed value) |
| text | `#FFFFFF`, 15px / weight 500 | `CLAUDE.md:129` "CTA 15 (never <=13 on a button)" and `LOCKFILE` §2.5 Primary CTA 15px. See CONFLICT C7 for the third source that says 14. | verified |
| height | 52px, full content width | `BookingConfirmation.tsx`'s real "Add to calendar" button, transcribed at `press-motion/_va/PressMotionSceneA.tsx:180` | verified |
| radius | see CONFLICT C1 | | |
| what is NOT ported | Airbnb's Reserve button is a `999px` pill with a magenta-to-rose gradient (`#E41D56` to `#DD1063`, PIL-sampled). Treatwell's is `#1859F1` blue at radius 4. Neither ports: our commit button is flat ink. Airbnb's own flat ink "Next"/"Got it" is the aligned case and it is what we already do. | cited, `airbnb--look-recipes.md` Primary button + `treatwell--look-recipes.md` | cited |

## A4. Secondary button

| property | value | provenance | tier |
|---|---|---|---|
| fill / border / text | `#FFFFFF` / `1px #E4E4E7` / `#0A0A0A`, 15px / weight 500, height 50px | `BookingConfirmation.tsx`'s real "Directions" button, transcribed at `PressMotionSceneA.tsx:190` | verified |
| the concept, ported | two tiers separated by FILL and SIZE, not by colour: solid for the one commit, outline and smaller for every repeated inline action. Fresha does exactly this (primary 48px solid `#0D0D0D`, per-service "Buchen" 36px white with a `#D3D3D3` outline). | cited, `fresha--look-recipes.md` | cited |
| what is NOT ported | Fresha's 36px height (under our 44px floor) and its `999px` capsule and its `#D3D3D3` border (we keep our own `#E4E4E7`). | cited | cited |

**The per-row "Book" button is the concrete case, and it is measured, not argued.** Rendered this run at 390x844 on `/en/dev/directions-0905-r2/salon-book-button` (dev server on 3461, three variants on one page so they are comparable in one glance):

| variant | measured | verdict |
|---|---|---|
| what ships today | 74 x 38, radius 9999px, white fill, `1px rgb(228,228,231)` border, text `rgb(10,10,10)` 13px / weight 500 | **fails the 44px touch-target floor by 6px** (`CLAUDE.md` design contract, touch target, `h-11`), and 13px is below the 14px body step in A5. Source: `app/[locale]/_components/salon/SalonServices.tsx:250`, `px-5 py-2 text-[13px] font-medium`. |
| matched in shape | 87 x 44, radius 9999px, white fill, same border, 15px / weight 600 | clears the floor, keeps the outline tier, and is what A4 above describes. This is the round-2 default. |
| matched in full | 87 x 44, radius 9999px, fill `rgb(28,28,31)`, white text, 15px / weight 600 | **rejected for this slot.** A repeated per-row action taking the ink fill breaks "one commit action per screen" (A3): a services list with eight rows would render eight primary buttons. Kept in the table only so a builder can see what was ruled out and why. |

Radius stays open here: all three measure 9999px because that is what ships today, and CONFLICT C1 is what decides whether round 2 draws them at 16.

## A5. The type ramp, four sizes, integers only, one use each

Round 1's picked screens carried 18 distinct font sizes between them, including 13.5px, 15.5px and
12.5px (cited, `ROUND1_LOOK_TABLE.md`). The base closes that to four per screen, drawn from five values
that are all already on the locked ramp.

| size / weight | use | provenance | tier |
|---|---|---|---|
| **28 / 500** | the screen's anchor, and it is a SENTENCE carrying the fact, not a label with a number beside it | `CLAUDE.md` FLOORS LAW 6 (>=28px display anchor); the sentence rule is `LOCKFILE` §2 "State anchor", measured off Airbnb | verified |
| **18 / 500** | the section heading, and **this tier is mandatory, not optional** | `LOCKFILE` §2 Section H2, phone 18px. The reason it is mandatory: round 1's commit screens run 16px straight to 28px with one text run in between, a 12px hole; Airbnb listing goes 26 then 18 (x3) then 16 (x7), Airbnb home 28 then 18 (x2), Fresha venue 28 then 19 (x2). Their drop is 8 to 10px, ours is 12px into an empty tier. | verified (lock); cited (`WHY_UNFINISHED.md` reason 2) |
| **14 / 400** | body, row labels, and the CTA label at 500 | `LOCKFILE` §2.5 Core ramp, Body 14/400 phone; `TASTE_AUTHORITY` §3 "Workhorse body text on a dense screen: 14px. Not 13." | verified |
| **12 / 400** | meta, address, duration, timestamps, badge text | `LOCKFILE` §2.5 Core ramp phone column, reconciled 2026-09-04 at `LOCKFILE.md:393-397` | verified |
| 16 / 500 | the ONE legal substitution: a screen whose anchor is 22px (a list header rather than a fact) swaps 18 for 16 and keeps four sizes | `LOCKFILE` §2.5 Subsection H3 16/600 phone | verified |

**Illegal on any round-2 screen:** 12.5, 13.5, 14.5, 15.5, 17, 19. Anchor-to-body is 28/14 = **2.0x**,
over the 1.8x floor in `CLAUDE.md` EMPHASIS BUDGET (b). Four sizes, two weights, inside the enforced
ceiling. The ceiling itself is on his open list, see CONFLICT C6.

## A6. The spacing ladder

| tier | value | between | provenance | tier |
|---|---|---|---|---|
| section | 32px | one page section and the next | `LOCKFILE` §3 "Spacing rhythm" (2026-06-11, owner-approved) | verified |
| group | 16px | groups inside a card | same | verified |
| sibling | 12px | sibling cards or list items in a section | same | verified |
| home feed only | ~24px | the named exception; do NOT re-inflate home to 32 | same, "HOME-FEED EXCEPTION (measured 2026-06-11)" | verified |
| page margin | 16px each side (`px-4`) | the round-1 folds render 358px content in a 390px viewport, so 16 | Airbnb runs 24, Fresha 20, Treatwell 16. **Corrected in this pass; the row used to say "not locked as a single number in `LOCKFILE` §7 as far as this run checked", and it is locked.** `LOCKFILE.md` §7 Layout invariants, Container widths, row "Page outer": `max-w-[1280px]` with mobile padding `px-4`, which is 16. Three more rows in the same table (Salon PDP grid, /business hero, Dashboard content) repeat `px-4` for mobile. Measured live at 390x844 this run: 34 elements sit at x=16 on `/en`, 89 on the salon page. So 16 is not merely what ships, it is the lock, and round 2 has no decision to make here. A round-2 mockup at 20 or 24 is a lock break, not a look choice. | verified (`LOCKFILE.md:1065`, live x=16 counts); cited (references) |
| divider inset | 24px both sides, about 88% of width | a content hairline never touches the screen edge; only chrome boundaries may | `LOCKFILE` §3 THE CONTAINER TEST, measured 2026-07-28 | verified |

**The measured failure this closes:** confirmation C's fold renders **nine distinct** vertical band gaps
(24, 6, 6, 39, 27, 27, 20, 11, 10, 16, 23) against Fresha venue's six, which cluster into an in-group
13 to 15 and a between-group 44 to 59 (cited, `WHY_UNFINISHED.md`). The ladder exists; nothing was
counting it.

## A7. Card treatment

| case | recipe | provenance | tier |
|---|---|---|---|
| photo card (a salon) | photo + `shadow-whisper` + **no border**, radius 16 | `LOCKFILE` §17.2 depth table | verified |
| grouped list card (category members: services, staff) | radius 24 + `shadow-whisper` + hairline-divided rows INSIDE | `LOCKFILE` §3 "Grouped list cards" | verified |
| individual entity card (one person, one salon) | radius 16 + `1px #E4E4E7`, flat, gap-separated | `LOCKFILE` §3 Border radius, entity-card row (owner 2026-07-19) | verified |
| never | a border AND a shadow at once | `LOCKFILE` §17.2: "a card carrying elevation drops its border, never both". Round 1 broke it 15 times across the direction folds; the five reference folds break it once. | verified (rule); cited (counts) |
| salon photo ratio | 5/4 = 1.25, and it does not move | Owner picked A on 2026-08-14 from a measured three-stop toggle; `REMOVED.md:125` graveyards the 6/5 alternative. See CONFLICT C8 for what this costs. | verified |
| whether a card exists at all | THE CONTAINER TEST: earned only on a non-white surface, for peer items competing in one scroll, or when the whole box is tappable. Otherwise whitespace and an inset hairline. | `LOCKFILE` §3 (owner 2026-07-28) | verified |

## A8. Colour role table

| role | value | rule | tier |
|---|---|---|---|
| primary text, the one commit fill | `#0A0A0A` (19.80:1 on white) | Solen ink | verified |
| meta, chevrons, placeholders, timestamps, inactive tab | `#6B6B6B` (5.33:1 white, 4.85:1 on the tray) | `CLAUDE.md` FLOORS LAW 6; `#9CA3AF` is chart-only and never text | verified |
| hairline | `#E4E4E7` (1.27:1 on white; it is a boundary, not text) | one token, every divider | verified |
| tray / selected pill fill | `#F4F4F5` (1.10:1 on white) | `LOCKFILE` §17.2 | verified |
| small clickable TEXT only | `#276EF1` (4.58:1 on white, **4.17:1 on the tray, which fails AA**) | never a fill, never a button, never body text on the tray | verified (`CLAUDE.md` taste rule 4) |
| the rating star glyph | `#FFC32B` | never as text | verified |
| badge fill + badge icon | `s-success` / `s-warning` / `s-error` pale `.bg` + saturated icon, ink text | taste rules 4 and 6, and A2 above | verified |
| save | `#FF3366` | | verified |
| **banned by name in round 2** | `#E41C5C` (round 1's empty-state pink, hardcoded at `empty-states/_vb/AirbnbEmptyUnit.tsx:67`, an Airbnb token not a Solen one), `#222222` and `#6C6C6C` (Airbnb's own ink and grey, hardcoded at the same file `:56,59`), `#F4F1E9` (Airbnb's warm cream, see CONFLICT C5), and **any raw hex for our own ink, both `#0A0A0A` and `#1C1C1F`, typed into a fill** (write `bg-s-ink` / `text-s-ink`; the `globals.css:230-232` override resolves the fill to `#1C1C1F` and the text stays `#0A0A0A`) | he said "not this pink thing because that's not how we do it" | cited (`WHY_UNFINISHED.md` empty-states section); verified (his words, `DIRECTIONS_0905_R2.md:7`) |

> **Correction applied in this pass to the row above.** It used to ban `#1C1C1F` by name as "round 1's ink drift". That was backwards: `#1C1C1F` is the locked ink FILL (`LOCKFILE.md:41`, his 2026-08-15 pick), and `#0A0A0A` is the ink TEXT. Banning the fill hex would have sent every round-2 builder to the wrong black. What is actually banned is hardcoding either one instead of using the token, which is how press-motion A ended up visibly different from the other four round-1 screens.

**The photograph is a colour decision too.** Five of the six seeded photos measure mean HSV saturation
0.157 to 0.430; `photo-1560066984` measures **0.000**, it is greyscale, and it renders in the fold of
five of the ten picked directions. Round 2 does not use it. Coloured pixels of the fold: our best round-1
direction 3.1%, live `/en` 10.4%, against Airbnb home 21.7%, Airbnb listing 32.5%, Fresha venue 23.4%.
(cited, `WHY_UNFINISHED.md` reason 3.)

## A9. Press motion, locked to round-1 direction A

Direction A at `app/[locale]/dev/directions-0905/press-motion/_va/` is the press recipe for round 2.
Every value below was read from those files this run.

| gesture | value | file:line | tier |
|---|---|---|---|
| press down | `scale(0.97)` + `brightness(0.96)`, **100ms** `cubic-bezier(0.7,0,0.84,0)` (ease-thud) | `PressPillA.tsx:129-132` | verified |
| release | back to `scale(1)`, **200ms** `cubic-bezier(0.16,1,0.3,1)` (ease-glide) | `PressPillA.tsx:133` | verified |
| selecting a pill | the fill, border and text swap **instantly** (`transition-none`), with a **150ms** scale tick 1 to 1.06 to 1 on `cubic-bezier(0.4,0,0.2,1)` (ease-snap) played over it | `PressPillA.tsx:66-74, 86-97, 134` | verified |
| pressing a card | an overlay opacity change on the same 100ms / 200ms envelope, `pointer-events-none` so the card's own link and heart stay real | `PressMotionSceneA.tsx:140-146` | verified |
| sheet open / close | **320ms** ease-glide in, **220ms** ease-thud out, backdrop matches the surface | `PressSheetA.tsx:92-108` | verified |
| reduced motion | every one of the above is disabled under `prefers-reduced-motion` | `PressPillA.tsx:92-94`, `PressMotionSceneA.tsx:110` | verified |

B's spring is out, per his pick.

---

# Part B. THREE LOOK SYSTEMS

Each is a coherent way of putting Airbnb's finish on Fresha's placement. They differ in **which device
carries the grouping**, which is the one thing a critic can measure without judgement. A screen belongs
to exactly one.

The three were derived from the fold counts measured in `WHY_UNFINISHED.md`, which separate the
reference screens cleanly into three families:

| reference fold | shadows | borders | both | hairlines |
|---|---|---|---|---|
| Airbnb home | 12 | 7 | 1 | 6 |
| Fresha venue | 8 | 4 | 0 | 2 |
| Fresha search | 8 | 4 | 0 | 0 |
| Airbnb listing | **0** | 3 | 0 | 3 |
| Fresha home | 2 | 5 | 0 | 5 |

Shadow-led (Airbnb home, both Fresha content screens) is one family. Zero-shadow and ruled (Airbnb
listing, and Fresha's own appointment-detail and profile-hub stills) is a second. A tinted canvas doing
the separating is the third, and Airbnb reaches for it on exactly the two screens that have no
photograph (its confirmation and its wishlist empty state, both `#F4F1E9`).

---

## SYSTEM 1: LIFT

> **One sentence:** the lifted white card is the only grouping device on the screen, so nothing carries
> a border and nothing carries a hairline; a soft shadow and the gap between cards do all the work.

**Source screens.**
`scratchpad/r2/refs/airbnb/01-home.png` and `06-home-viewport.png` (Airbnb home: 12 shadowed elements,
7 bordered, card radius 20, shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.1) 0 8px 24px 0px`, no
border, home-rail photo 165x157 at ratio 1.053).
`scratchpad/r2/refs/fresha/02-search.png`, `02b-search-scrolled.png`, `03b-venue-services.png` (Fresha
search and venue: 8 shadowed, 4 bordered, **0 carrying both**, service card `inset 0 0 0 1px #E5E5E5`
with no drop shadow, radius 16, card photo 236x157 at ratio 1.5).
`scratchpad/r2/critique/data/ab-home-fold.png` and `fr-search-fold.png` for the counts.

**Deltas from the base.**

| base value | System 1 overrides it to | measured source |
|---|---|---|
| hairline dividers are allowed inside a grouped card | **at most one hairline in the fold**, and none between cards | Fresha search fold: 0 hairlines; Fresha venue: 2 (cited, `WHY_UNFINISHED.md`) |
| a group may be a bordered entity card | every group is a shadowed card with **no border**; the entity-card border is dropped for the duration | `LOCKFILE` §17.2 already permits this for a photo card; Airbnb home carries 1 both-border-and-shadow element across its whole fold |
| the tray | not used; the page is white end to end. FLOORS LAW 4 is satisfied by case (b), the flush photo edge, on every card that has a photo | `LOCKFILE` §17.2 case (b) |
| card radius | stays Solen's 16 (entity) / 24 (grouped). Airbnb's 20 sits between our two tokens and is not adopted | `airbnb--look-recipes.md` Port map |
| shadow value | stays `shadow-whisper`, not Airbnb's `0 8px 24px rgba(0,0,0,.1)` | `LOCKFILE` §3 |

**What it does on each picked screen, one line each.**

1. **Confirmation C:** the confirmed moment and the what-happens-next steps are two lifted cards, the salon row is a third with its photo flush to the card's top edge, and the connector line between the step discs is deleted (the card edge already groups them).
2. **Search results A:** every result is one lifted photo card, no border anywhere, no hairline anywhere; the filter row keeps its own pill borders because a control needs an edge, and that is the only border in the fold.
3. **Bookings list A:** the next appointment is one lifted card with the photo flush at its top and Get directions plus Manage inside its footer; past bookings are smaller lifted cards with a 48px square thumbnail and no buttons.
4. **Review and pay A:** the five identical bordered boxes collapse into one lifted summary card with no internal hairlines, and only the payment chooser, which is tappable as a unit, earns a second card.
5. **Profile (C + B + A):** the what's-next appointment is the only card on the screen and the seven destination rows sit bare on white beneath it, separated by gap alone.
6. **Empty states (B without the pink, plus C's real content):** the empty unit floats on white with no container, the ink CTA is the only filled object, and the real-content rail below it is a row of lifted photo cards.
7. **Salon service-row Book:** the row Book takes the main Book button's type and corner at the secondary fill (white, hairline, ink text), so the two read as one family at two weights.
8. **Home (three NEW structures):** all three are built from lifted photo cards on white with no section dividers, and the 18px section heading is the only thing separating one rail from the next.

**The one thing a critic measures to prove membership.** In the 390x844 fold: `count(elements with a
box-shadow) > count(elements with a border)` AND `count(elements carrying BOTH) = 0` AND
`count(hairline dividers) <= 1`.

---

## SYSTEM 2: RULE

> **One sentence:** there is no card anywhere on the screen; groups are separated by inset hairlines and
> gap size alone, and the hierarchy is carried entirely by a big anchor sentence over a populated
> middle type tier.

**Source screens.**
`scratchpad/r2/refs/airbnb/03-listing.png` and `crop-listing-top.png` (Airbnb listing: **0 shadowed
elements** in the fold, 3 bordered, 3 hairlines, anchor 26px at 1.86x body, sizes 12 x5 / 14 x13 /
16 x7 / **18 x3** / 26 x1, 44.4% photographic, 32.5% coloured).
`scratchpad/r2/critique/mobbin/fr-appointments.webp` and `fr-confirmation.webp` (Fresha's appointment
detail: a flat icon plus label plus sublabel plus chevron list, hairline-separated, **no card boxes**,
with the cancellation policy and booking reference rendered directly on the page).
`scratchpad/r2/critique/data/ab-listing-fold.png` for the counts.

**Deltas from the base.**

| base value | System 2 overrides it to | measured source |
|---|---|---|
| A7's card treatments | **no card at all**, except one identity block where the reference has one | Airbnb listing 0 shadows; Fresha profile hub keeps exactly one bordered identity card and no other (cited, `fresha--look-recipes.md` Profile hub) |
| the 18px tier is mandatory (A5) | it is mandatory **and carries at least three text runs**, because it is the only separator besides the hairline | Airbnb listing 18 x3, Airbnb home 18 x2, Fresha venue 19 x2 (cited, `WHY_UNFINISHED.md`) |
| hairlines are allowed inside a grouped card | hairlines are the primary device, `#E4E4E7`, **inset 24px on both sides**, spanning about 88% of the width | `LOCKFILE` §3 THE CONTAINER TEST, measured 2026-07-28 |
| shadow | **zero**, on anything, including the sticky bar (which separates by gradient fade) | Airbnb listing fold: 0 |
| the anchor | is a sentence carrying the fact, never a label with a number next to it | `LOCKFILE` §2 State anchor, measured off Airbnb's "You've made $0.00 this month" |

**What it does on each picked screen, one line each.**

1. **Confirmation C:** no card anywhere; a 28px sentence carrying the date is the anchor, the what-happens-next steps are bare rows under an 18px heading, and 24px-inset hairlines divide the sections.
2. **Search results A:** results are bare rows, photo flush left at a smaller share, name and meta and price stacked to its right, one inset hairline between results and no shadow at all.
3. **Bookings list A:** the next appointment is a bare block under an 18px "Next" heading with Get directions and Manage inline beneath it, and past bookings are a hairline-divided list with no buttons.
4. **Review and pay A:** the whole summary is bare label-and-value rows between inset hairlines, the total is the one 28px anchor, and the cancellation term renders as body text above the commit button.
5. **Profile (C + B + A):** exactly the Fresha profile-hub shape, bare rows with a leading line icon and a trailing chevron, hairline-divided, and one identity block at the top.
6. **Empty states:** one centred unit with a single inset hairline separating it from the real-content section that follows.
7. **Salon service-row Book:** the row Book takes the main Book button's full ink recipe, and the one-commit-button conflict prints above the section rather than being resolved silently.
8. **Home (three NEW structures):** all three are bare rails divided by inset hairlines, the section heading at 18px, and the anchor a sentence rather than a title.

**The one thing a critic measures to prove membership.** In the fold: `count(elements with a
box-shadow) = 0` AND every hairline is inset >= 24px on both sides AND the 18px tier carries >= 3 text
runs.

---

## SYSTEM 3: TRAY

> **One sentence:** the canvas does the separating, so white groups sit on a `#F4F4F5` band carrying
> neither a border nor a shadow, and the page alternates white and tray down the whole scroll.

**Source screens.**
`scratchpad/r2/critique/mobbin/ab-confirmpay.webp`, `ab-empty-trips.webp` and
`scratchpad/r2/refs/airbnb/mobbin/confirmation.webp` (Airbnb's confirmation and wishlist empty state:
the **only** two screens in the whole Airbnb capture that leave white, both on a tinted canvas
`#F4F1E9`, tier expect; home, search and the listing are pure white).
`scratchpad/r2/refs/fresha/03b-venue-services.png` (Fresha's service-card stack: white 16px cards with
`inset 0 0 0 1px #E5E5E5` and no drop shadow, which is the group SHAPE this system uses once the
canvas provides the boundary and the inset hairline comes off).

**Deltas from the base.**

| base value | System 3 overrides it to | measured source |
|---|---|---|
| the page is white | the page **alternates** `#FFFFFF` and `#F4F4F5` band by band, at least twice per screen | `LOCKFILE` §17.2: "The gray tray is RULE, not CONV ... alternate gray and white down a page" |
| a group carries a border or a shadow | a group sitting on the tray carries **neither**; the canvas is its boundary | `LOCKFILE` §17.2 edge-visibility case (a) |
| Airbnb's tint | `#F4F1E9` is **not** used; the tint is our own cool `#F4F4F5` | `CLAUDE.md` taste rule 3 bans warm cream by name. See CONFLICT C5. |
| the sticky bar | white above the tray, separated by gradient fade, never frost (frost is for controls over photography) | `LOCKFILE` §17.2; `TASTE_AUTHORITY` §3 |

**What it does on each picked screen, one line each.**

1. **Confirmation C:** the confirmed moment sits on white, the what-happens-next block on a tray band, the salon and the receipt back on white, and nothing carries an edge of its own.
2. **Search results A:** the filter band sits on the tray and the results on white, so the reader can see at a glance which band is chrome and which is content.
3. **Bookings list A:** upcoming on white and "Past" on a tray band, so the two card grammars are separated by the canvas instead of by a heading alone.
4. **Review and pay A:** the summary is one white group on a tray band, and the sticky pay bar is white above it, meeting the edge-visibility floor through the tray rather than through a border.
5. **Profile (C + B + A):** the identity block on white, the seven destination rows as one white group on the tray, and sign-out on the tray alone.
6. **Empty states:** the unit sits on the tray with the ink CTA as the only filled object, and the real-content rail returns to white below it.
7. **Salon service-row Book:** the services group sits on a tray band and the row Book is the neutral secondary on white inside it, matched in type and corner to the main Book button.
8. **Home (three NEW structures):** all three alternate white and tray band by band down the feed, which is what makes each section legible as a section without a divider.

**The one thing a critic measures to prove membership.** Down the full scroll: the page background
alternates between `#FFFFFF` and `#F4F4F5` at least twice, AND every group whose computed background is
white while its parent is `#F4F4F5` carries `border-width: 0` and `box-shadow: none`.

---

## Cross-system rules (all three, no exceptions)

- Every mockup renders through the product chrome, or prints the offset. `HideInBooking.tsx:60` strips the Header, `BottomNav` (125px per its own header comment) and the consent bar from every `/dev` path, which is why all ten round-1 folds measured 0 fixed or sticky blocks while live `/en` measured 2 (cited, `WHY_UNFINISHED.md` reason 5).
- No scaffolding in the fold. Round 1 opened every direction with a 44px "Direction A of 3" switcher (5.2% of the fold) and press-motion A added five grey strips naming its own components. Count of such strips across the five reference folds: 0.
- Four sizes, two weights, per screen, measured on the rendered DOM.
- Zero half-pixel font sizes.
- One primary commit button, ink, per screen.
- Nothing carries a border and a shadow at once.

---

# Part C. THE CONFLICTS THAT ARE HIS

Format: `CONFLICT [axis]: reference says X, lock says Y (date). Owner call.` plus what each of the three
references does, and the `TASTE_AUTHORITY.md` verdict in one word.

### C1. CONFLICT [button and chip radius]

Reference says a capsule. Lock says two different things at once: `CLAUDE.md:134` says `rounded-[16px]`,
"NOT a capsule", dated 2026-08-16 with his verbatim words; `tailwind.config.js:288`, `LOCKFILE.md:578-579`,
`SOURCE.md:446-447`, `solen-styleguide.html:34-36,148` and `TASTE_AUTHORITY.md:153` all still say 99px or
9999px. Live: 359 uses of `rounded-btn`, 299 of `rounded-pill`, 212 of `rounded-[16px]`. And
`TASTE_LOG.md:1266` records a 2026-09-02 rejection of "the 16px chip corner" with no entry, no verbatim
and no replacement value, and the sentence parses both ways. **Owner call.**
- **Fresha:** every control is a true capsule, primary and secondary book buttons and category pills alike (cited, `fresha--look-recipes.md`).
- **Treatwell:** buttons are radius 4, filter pills are 9999 (cited).
- **Airbnb:** Reserve is 999, filter pills 24, nav tabs 40, but its flat ink "Next"/"Got it" reads as a rounded rectangle, not a pill (cited).
- **Verdict: ASK.** Two triggers fire. `TASTE_AUTHORITY` step 1 finds a dated decision but the record contradicts itself, and step 4 is mechanical: this token is imported by hundreds of files.

### C2. CONFLICT [does colour encode booking status at all]

Reference splits. Lock says semantic hue keeps its meaning (`CLAUDE.md` taste rule 4) and the shipped
`BookingCard` colours the status. **Owner call.**
- **Airbnb:** does not colour-code status at all. Confirmed, Pending and Cancelled trip cards use the identical neutral white pill; only the WORD changes. Its confirmation screen has no green and no checkmark, only a bold headline (cited, `airbnb--look-recipes.md` Status treatment, tier expect from three stills compared).
- **Fresha:** solid violet pill for Confirmed, solid amber for Action required, each with an icon (cited, tier expect).
- **Treatwell:** not reachable, live or on Mobbin, and not invented (cited).
- **Verdict: ASK.** Airbnb is the look source and it says no colour; our own taste rule 4 says colour is the meaning. That is a direct collision on the screen he named.

### C3. CONFLICT [a dark text companion for success and error]

Reference is silent; this one comes from our own measurement. `s-warning` has carried `.text` `#B45309`
since V3-D424 (2026-06-02) precisely so small text on a pale fill is readable, and it measures 4.71:1.
`s-success` and `s-error` never got one, and their badges measure 2.96:1 and 4.13:1. `#15803D` measures
4.50:1 on the success pale fill, but `#15803D` was reverted by name on 2026-06-10 for a **different job**
(the focal disc, where he asked for normal green, not deep). **Owner call.**
- **Fresha / Treatwell / Airbnb:** none of the three separates a `.text` companion from a `.DEFAULT`; Treatwell's own coral secondary button measures 2.9:1 and fails AA on its own site (cited).
- **Verdict: ASK.** `TASTE_AUTHORITY` §4 item 6: minting a value in no locked set is never decided without him. The interim, which needs nothing from him, is A2's change 1: ink text at 17.76:1, which is already what taste rule 6 says.

### C4. CONFLICT [the weight ceiling]

Reference says 600 and 700 carry the emphasis. Lock says `app/globals.css:269` clamps every
`.font-semibold` and `.font-bold` to 500 on customer surfaces, his own pick, option C, 2026-08-15.
Measured: characters at weight >= 600 in the fold, eight of ten picked directions at **0.0%**, against
Airbnb home 9.4%, Fresha search 17.5%, Fresha venue 8.2%, Airbnb listing 5.5%. The one direction that
looks most like the reference (profile B) got there by bypassing the clamp inline. **Owner call.**
- **Airbnb:** 400 / 500 / 600 / 700, four weights on home (cited).
- **Fresha:** 400 / 500 / 600 / 700, four on the venue page (cited).
- **Treatwell:** 400 and 700 only, two weights (cited).
- **Verdict: ASK.** A dated decision of his, and `TASTE_AUTHORITY` §4 item 4 says breaking a lock needs an explicit named yes.

### C5. CONFLICT [a warm canvas on the confirmation screen]

Reference says Airbnb's one deliberate departure from white in the whole capture is the post-booking
confirmation and the matching wishlist empty state, both `#F4F1E9`. Lock says no warm cream, by name, in
taste rule 3, and 80/17 cool surfaces governs every customer screen with no named exception. **Owner call.**
- **Airbnb:** warm cream on exactly those two screens; home, search and the listing are pure white (cited, tier expect).
- **Fresha:** a full-bleed purple-to-blue gradient on its confirmation moment (cited, tier expect).
- **Treatwell:** not reachable (cited).
- **Verdict: ASK.** System 3 ships the cool `#F4F4F5` in the meantime, which needs nothing from him.

### C6. CONFLICT [four distinct sizes per screen]

Reference breaks it on four of five folds. Lock caps a customer screen at four sizes and two weights.
`TASTE_AUTHORITY.md:279-281` records this as **B37, open on purpose, "not yours to close"**, with the
four-size ceiling as the working default until he closes it. **Owner call, already logged as one.**
- **Airbnb:** home 6 sizes, listing 5 (cited).
- **Fresha:** venue 5, search 3 (cited).
- **Treatwell:** 6 across the site (cited).
- **Verdict: ASK**, and the base does not wait on it: A5 ships four sizes, which is legal under either outcome.
- The CTA label size (C7) rides on this decision: four sizes means CTA renders 14, five allowed means CTA can go back to 15.

### C7. CONFLICT [the CTA label size on a phone]

Reference is not the issue; our own three sources are. `CLAUDE.md:129` says CTA 15. `LOCKFILE` §2's
Scale table says mobile 14, desktop 15. `LOCKFILE` §2.5's role registry says 15 flat. Round 1 rendered
15px on every primary button. **Verdict: DECIDE.** 15px, matching two of the three sources and what
already ships; the `LOCKFILE` §2 row gets the same phone/desktop reconciliation the Core ramp got on
2026-09-04. `TASTE_AUTHORITY` step 6: every candidate is already legal and one adjacent step apart.

**UPDATE 2026-09-06:** round 2's kit renders every CTA at 14px on mobile, because 15 makes any
button-bearing screen render a fifth distinct font size (28/18/15/14/12) against the NEVER-AGAIN
floor-2 four-size ceiling. That is a second DECIDE colliding with this one, so the value is not
decidable and goes to him under C6, with 14 standing as the working default. **Verdict: was DECIDE, now ASK under C6.**

### C8. CONFLICT [the salon photo ratio against the density floor]

Reference says a shorter photo buys a denser fold: Fresha's search card photo is 350x197 (ratio 1.78)
and its fold holds one card plus three service rows plus a link plus the top of card 2. Ours is 358x286
(ratio 1.25) and the fold holds one card plus three service rows. Lock says 5/4, and he picked it by
name on 2026-08-14 off a measured three-stop toggle, with 6/5 graveyarded at `REMOVED.md:125`.
**Verdict: DECIDE, and the decision is to keep 5/4 and not re-ask.** `TASTE_AUTHORITY` step 1: a dated
decision of his answers it, and re-asking a settled axis is the failure that file exists to stop. The
density gain in round 2 comes from what sits below the photo, not from the photo.

### C9. CONFLICT [blue on the primary CTA]

Treatwell fills its one primary CTA with `#1859F1`. Lock says the one commit button is ink.
**Verdict: DECIDE.** Keep ink. `TASTE_AUTHORITY` §3: "A new button, CTA, chip, pill, badge or arrow:
never blue. There is no precedent in the record for a new kind of blue button."

### C10. CONFLICT [the greyscale seed photo]

No reference and no lock: `CLAUDE.md` FLOORS LAW 2 and `LOCKFILE` §17.1 both govern photographic AREA
and the missing-photo fallback, and neither says anything about what is in the photograph.
**Verdict: DECIDE.** Round 2 does not use `photo-1560066984` (mean HSV saturation 0.000). Swapping a
seed row is the expected move, not fabrication (`CLAUDE.md` taste rule 1, in capitals).

### C11. CONFLICT [the input radius token]

`tailwind.config.js:289` says `input: "16px"`. `LOCKFILE.md:580`, `SOURCE.md`'s radius table and
`CLAUDE.md:140` all say 12, and the LOCKFILE row records that he kept the shipped 12 over 16 on
2026-06-08. 37 live call sites. ~~**Verdict: DECIDE.** Fix the token to 12; the three documents already
agree with each other and with him, and this is a code-versus-doc defect, not a taste question.~~

**CORRECTED 2026-09-06, measured:** none of the 37 `rounded-input` call sites is a native `<input>`,
`<textarea>` or `<select>`, they are wrappers, avatars, photo thumbnails and modal shells. A native
input's radius is set by a separate, unconditional rule in `app/globals.css`: the selector starting at
line 434 (`input:not([type="checkbox"])...`, ten `:not()` clauses, plus textarea and select) sets
`border-radius: 12px` at line 441, with no reference to `rounded-input` at all. Tailwind 3.4 compiles
`@layer` to plain CSS with no real cascade layers, so that ten-clause selector out-specifies the single
`.rounded-input` utility class. A section mockup at `/en/dev/directions-0905-r2/input-radius` measured
both rows live at 358x56, radius 12px, border 1px solid `rgb(228,228,231)`, white, 16/400, zero console
errors: every real input already renders 12. Fixing the token to 12 would move all 37 non-input
elements to 12 and would change no input's rendered radius at all.

**Verdict: DECIDE, flipped.** The token value stays; the record is corrected (LOCKFILE.md:582 note,
WHAT_IS_MISSING G3) and the rename is parked in SUGGESTIONS.md.

---

## What this document does NOT decide

- Whether the round-2 mockups are good. That is his, on his phone, per the mockup-first law.
- Anything on `TASTE_AUTHORITY.md` §5's open list beyond flagging it (B37 above, M30 the calendar selected day, M41 three weights on the home first viewport).
- Skeleton and first-paint timing. **Not checked this run.**
- Motion beyond the press recipe in A9. `MOTION.md` is current and owns the rest.

<!-- exists-check: net-new vs every airbnb--*.md file plus AIRBNB_SYSTEM_VS_OURS.md and
     AIRBNB_TEARDOWN_2026-08-16.md, all read before writing this. None of them is a single
     CONSOLIDATED look recipe: each is scoped to one surface (home, reviews, profile, search chrome,
     category switch, fonts, icons, the token layer) or one comparison. This file's job, per the
     owner's 2026-09-05 instruction ("on the design part I want Airbnb style, but not completely"),
     is to pull the ~15-20 numbers that make a screen READ as Airbnb into one place with a port map
     and a conflicts list against Solen's own lock, so a mockup builder has one file to open instead
     of nine. Every number here is re-cited from the surface file that measured it, not re-measured. -->

# Airbnb look recipe (the numbers that make a screen read as Airbnb)

REF: airbnb / web-mobile + ios / consolidated-look / cites sibling files, no new measurement

## Scope note

This file captures the LOOK only, per the owner's instruction: color, type, radii, shadows,
spacing rhythm, imagery treatment, button and sheet recipes. It does NOT cover structure (screen
anatomy, information order, navigation) which is Fresha's job per a separate capture. Nothing here
recommends applying Airbnb wholesale; every row below either fits inside Solen's existing lock or
is logged as a named conflict for the owner to decide.

## Sources cited by this file

- `airbnb--listing-page.md` (this session, 2026-09-05)
- `airbnb--checkout-and-confirmation.md` (this session, 2026-09-05)
- `airbnb--search-results.md` (this session, 2026-09-05)
- `airbnb--home-mobile.md` (2026-08-12)
- `airbnb--reviews.md` (2026-08-15)
- `airbnb--fonts-vs-ours.md`, `airbnb--icons-vs-ours.md`, `AIRBNB_SYSTEM_VS_OURS.md` (token layer)

## The 18 numbers

| # | element | Airbnb value | tag | source |
|---|---|---|---|---|
| 1 | Display anchor (listing title, `<h1>`) | 26px / 500 | verified | listing-page |
| 2 | Section heading | 22px / 600, line-height 26px | verified | listing-page |
| 3 | Sub-heading | 14px / 500 | verified | listing-page |
| 4 | Body / secondary text | 14px / 400, secondary grey `rgb(108,108,108)` | verified | listing-page, home-mobile |
| 5 | Ink (primary text color) | `rgb(34,34,34)` | verified | home-mobile, listing-page, checkout, search-results (consistent across all four) |
| 6 | Background white | `rgb(255,255,255)`, pure white on every screen EXCEPT confirmation | verified | listing-page, checkout, search-results |
| 7 | Confirmation-only background | warm cream, the sole warm surface anywhere in this capture | assume (visual read off Mobbin still, not sampled) | checkout-and-confirmation |
| 8 | Divider / hairline color | `rgb(221,221,221)` | verified (cross-confirmed twice: listing-page's own `<hr>` and reviews.md's row divider, identical value) | listing-page, reviews |
| 9 | Search/entity card radius | 20px (search-results card), 20px (home-feed rail card) | verified | search-results, home-mobile |
| 10 | Search-result card shadow | none, flat | verified | search-results |
| 11 | Search-result card photo ratio | 1.331 (wider-than-tall) | verified | search-results |
| 12 | Home-feed rail card photo ratio | 1.053 (near-square) | verified | home-mobile |
| 13 | Primary listing CTA ("Reserve") | radius 999px true pill, h 48px, fill = rausch gradient `rgb(228,28,92)` to `rgb(234,89,140)`, text white 16/500 | verified (PIL-sampled off the rendered button; computed bg-color unresolvable) | listing-page |
| 14 | Multi-step flow CTA ("Next" / confirmation "Got it") | radius 12px rounded-rect (NOT a pill), fill solid ink `rgb(34,34,34)`, h 40px, text white 14/500 | verified (checkout), assume by visual match (confirmation) | checkout-and-confirmation |
| 15 | Review/reviewer avatar | 48 x 48px circle | verified | reviews |
| 16 | Host avatar (listing page) | 40 x 40px circle | verified | listing-page |
| 17 | Section-to-review-row rhythm | 35px content-to-divider, 24px divider-to-next-row (60px total) | verified | reviews |
| 18 | Type family | `"Airbnb Cereal VF", Circular, -apple-system, "system-ui", Roboto, "Helvetica Neue", sans-serif` | verified | listing-page, checkout |

## Port map (Airbnb value, our token or a proposed new value, inside our lock or not)

| # | Airbnb value | our token / value | inside lock? |
|---|---|---|---|
| 1 | 26/500 title | no locked display-anchor size named; FLOORS LAW 6 only requires >=28px SOMEWHERE on a customer screen | Airbnb's own title is actually just under our 28px floor. A ported anchor would need to round up to 28, not copy 26 literally, to stay compliant. |
| 2 | 22/600 section heading | our section-H2 is `clamp(18px,2vw,20px)` | Not inside lock as-is; would be a new, larger section-heading value. |
| 3 | 14/500 sub-heading | fits our existing 14px body + 500 weight tier | Inside lock, no new token needed. |
| 4 | 14/400 body, `rgb(108,108,108)` secondary | our `s-ink-2` is `#6B6B6B` (rgb(107,107,107)), same value to the pixel | Already effectively identical, ours slightly darker by 1 unit, a non-issue. |
| 5 | ink `rgb(34,34,34)` (`#222222`) | our `s-ink` is `#0A0A0A` | Not inside lock: ours is a harder black. Frozen literal (LOCKFILE), flagged in `airbnb--home-mobile.md` already as CONFLICT C. |
| 6 | pure white bg | matches our surface default | Inside lock. |
| 7 | warm cream (confirmation only) | taste rule 3 bans warm cream by name | Not inside lock, direct conflict, see below. |
| 8 | hairline `rgb(221,221,221)` | our `s-border` is `#E4E4E7` | Close, same neutral-grey family, no change needed. |
| 9 | 20px card radius | our locked entity-card radius is 16px | Not inside lock as a direct swap; +4px delta. |
| 10 | flat, no card shadow | our SalonCard lock is `shadow-whisper` | Not inside lock, direct conflict, see below. |
| 11-12 | card ratio varies 1.05 to 1.33 by surface | we do not lock a single universal card ratio either, but our own SalonCard commonly runs ~1.25 (per home-mobile's Solen-side measurement) | No hard conflict; confirms ratio-per-surface is a legitimate pattern, not a violation to fix. |
| 13 | Reserve = pill + brand gradient | our ONE commit button is `bg-s-ink`, ink only, never brand color, never a full capsule | Not inside lock, direct conflict, see below (the single biggest one). |
| 14 | Next/Got it = ink rounded-rect, radius 12 | close to our `bg-s-ink` CTA in spirit; radius differs (12 vs our locked 16) | Mostly compatible, small radius delta only. |
| 15-16 | avatar circles 40-48px | matches our own avatar-sizing pattern elsewhere (not independently re-measured here) | No new token needed. |
| 17 | 35+24px review rhythm | our spacing scale is 4pt-based; 35 and 24 both land off-grid except 24 (24 = 6 x 4pt, on-grid; 35 is not) | 24 is portable as-is; 35 would need rounding to 32 or 36 to stay on our 4pt scale. |
| 18 | Airbnb Cereal VF / Circular | our locked type family is Inter Tight (display) + Inter (body), Airbnb Cereal explicitly NOT ours | Not inside lock and not proposed to change; taste rule 8 locks our fonts. Font family itself is out of scope for a "look" port, noted for completeness only. |

## Conflicts (consolidated from all three surface files, deduped)

- **CONFLICT [ink hardness]: Airbnb's ink is `#222222`, ours is the frozen `#0A0A0A`.** Already
  logged in `airbnb--home-mobile.md` (CONFLICT C). A frozen LOCKFILE literal, owner call only.
- **CONFLICT [CTA color and shape, the biggest one]: Airbnb's single highest-stakes commit button
  (Reserve, on the listing) is a true 999px pill filled with the rausch brand gradient, not black.
  Solen's design contract locks the one commit button to `bg-s-ink` and locks button/chip radius
  to 16px specifically because a capsule "looks like it has a sharp corner" at width (owner
  2026-08-16). Both are dated, named locks.** Airbnb itself does NOT apply this pattern everywhere:
  its own multi-step "Next" button is plain ink black at a 12px rounded-rect, matching Solen's
  spirit far more closely than the Reserve button does. If the owner wants "Airbnb style, but not
  completely," the Next-button recipe is the compatible half and the Reserve-button recipe is the
  incompatible half; they cannot both be adopted without a change to two named locks.
- **CONFLICT [card elevation]: search-result and home-feed cards carry zero shadow on Airbnb; the
  Solen SalonCard lock is `shadow-whisper`.** Logged in `airbnb--search-results.md`. Removing our
  whisper shadow to match Airbnb's flatness would also need to satisfy our own Edge-visibility
  floor (a boundary from sunken bg, flush photo edge, hairline, or an elevation step), which a
  bare radius-only card does not automatically clear.
- **CONFLICT [confirmation background warmth]: the one warm surface anywhere in this whole capture
  is Airbnb's post-booking confirmation screen (cream), and taste rule 3 bans warm cream by name,
  with a dated owner rejection of a similar beige on record.** Logged in
  `airbnb--checkout-and-confirmation.md`. The narrowest possible port (if the owner wants the
  emotional lift) would be a single named exception for that one moment, not a general cream
  surface anywhere else.
- **CONFLICT [radius family]: Airbnb consistently runs about 4px larger than Solen's locked radii**
  (card 20 vs 16, and the same delta pattern shows up wherever a container radius was measured).
  Not independent per surface, one system-wide "Airbnb runs bigger" observation.
- **CONFLICT [type budget]: any single Airbnb screen in this capture (the listing page especially)
  exceeds Solen's gate-enforced 4-size/2-weight ceiling per screen.** A partial port (picking 4 of
  Airbnb's sizes, not all of them) is the only gate-compliant path.

## What could not be captured, and why

- **Checkout text-input recipe (the brief's explicit "input recipe" ask):** an anonymous, logged-out
  session never reaches a real payment text field; Airbnb defers all card/address entry past
  identity verification. Only the payment-METHOD radio circles were reachable and are documented in
  `airbnb--checkout-and-confirmation.md`. A text-input recipe genuinely does not exist to capture at
  this depth of access, not merely unmeasured.
- **Confirmation screen computed styles:** the confirmation screen requires an authenticated booking
  and was captured via Mobbin stills only (visual read, no `getComputedStyle`). Every number from
  that screen is tagged `assume`, not `verified`, in the checkout-and-confirmation file.
- **Reserve button's exact fill mechanism** (background-image vs. pseudo-element layer): resolved
  by pixel-sampling instead of computed style, since `background-color` reported transparent
  through three ancestor hops. The resulting two-point gradient sample is a reasonable
  approximation, not a verified CSS value.
- **Section-to-section vertical rhythm on the listing page** as a single clean constant: the
  y-deltas between headings include variable-height content between them (amenity grids, photo
  grids) and could not be isolated into one spacing token without also subtracting that content's
  own height, not attempted given the time budget.
- **Filter/sort control specific to the search-results list** (as distinct from the home category
  pills already covered elsewhere): did not appear in the first-viewport DOM query used and was not
  chased further given the time budget.

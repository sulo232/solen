<!-- exists-check: net-new vs every airbnb--*.md file plus AIRBNB_SYSTEM_VS_OURS.md and
     AIRBNB_TEARDOWN_2026-08-16.md, all read before writing this. None of them is a single
     CONSOLIDATED look recipe: each is scoped to one surface (home, reviews, profile, search chrome,
     category switch, fonts, icons, the token layer) or one comparison. This file's job, per the
     owner's 2026-09-05 instruction ("on the design part I want Airbnb style, but not completely"),
     is to pull the ~15-20 numbers that make a screen READ as Airbnb into one place with a port map
     and a conflicts list against Solen's own lock, so a mockup builder has one file to open instead
     of nine. Every number here is re-cited from the surface file that measured it, not re-measured.

     MERGED 2026-09-05: `airbnb--look-recipes.md` (plural), a same-day fresh live-DOM + Mobbin
     capture (Playwright 390x844 dpr3 de-CH for Home/Search/Listing, Mobbin stills for the four
     screens behind login), was folded into this file rather than left as a second consolidated
     doc. Its own body now points here. New measured values it added appear below tagged with their
     own capture date and tier; nothing from the original 18-row table was renumbered or deleted so
     existing citations into rows 1-18 and their matching Port-map rows still resolve. Two rows
     (13, 14) got a second, independently-measured number placed ALONGSIDE the original per the
     source file's own instruction: agreement between two independent sessions is not the same as a
     correction, so neither number was deleted. -->

# Airbnb look recipe (the numbers that make a screen read as Airbnb)

REF: airbnb / web-mobile + ios / consolidated-look / cites sibling files + one merged live capture (2026-09-05)

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
- **Merged in whole, 2026-09-05:** `airbnb--look-recipes.md` (plural) was a separate same-day live
  capture (Playwright, 390x844, dpr3, de-CH, home + search-results + one listing reached live
  logged out; confirmation/trips/wishlists/profile via Mobbin stills, tier `expect`). Its file now
  redirects here; every new number it contributed is folded into "The numbers" table below (rows
  19+) and the new sections (Pill / chip, Badge, Empty state, Status treatment, Colour provenance,
  Not reachable live this session).

## The numbers (18 original + 33 added 2026-09-05)

Rows 1-18 are the original consolidated set (unchanged, see Sources above). Rows 19+ are new
measured values folded in from `airbnb--look-recipes.md`'s 2026-09-05 live capture, each citing
that capture's own section name so the raw method (`getComputedStyle`/`getBoundingClientRect` for
`verified`, a Mobbin still for `expect`) can be traced.

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
| 19 | Top nav tab (home, unselected AND selected) | bg white, radius 40px, h 40px, text 14px/400 `rgb(34,34,34)`, padding `10px 14px`; no visible selected-state difference in fill/weight/color, only content below changes | verified, 2026-09-05 | look-recipes.md (Pill/chip) |
| 20 | Search pill (home) | bg white, radius 40px, border `1px solid rgb(221,221,221)`, h 56px, padding `10px 19px`, shadow `rgba(0,0,0,.1) 0 6px 20px`, text 14px/500 ink | verified, 2026-09-05 | look-recipes.md (Pill/chip) |
| 21 | Filter pill (search results, unselected) | bg white, radius 24px, border `1px solid rgb(221,221,221)`, h 34px, text 12px/400 ink | verified, 2026-09-05 | look-recipes.md (Pill/chip) |
| 22 | Map toggle pill (search results, "Karte") | bg solid ink `rgb(34,34,34)`, radius 24px, h 38px, w 93px, text white | verified, 2026-09-05 | look-recipes.md (Pill/chip) |
| 23 | "Guest favourite" badge (on-photo) | bg white-80% (`color(srgb 1 1 1 / 0.8)`), radius 14px, border white-50%, shadow (three-layer soft), text 14px/600 ink, box 95x26 | verified, 2026-09-05 | look-recipes.md (Badge) |
| 24 | "Superhost" badge (on-photo) | bg dark grey-60% (`rgba(96,96,96,0.6)`), radius 40px true pill, border white-16%, text 14px/500 white, box 90x28 | verified, 2026-09-05 | look-recipes.md (Badge) |
| 25 | Reserve button, precise box + a second independent gradient sample | box 342x48, padding `14px 24px`, text 16px/500 white; three-point PIL sample `rgb(228,29,86)` -> `rgb(227,28,95)` -> `rgb(221,16,99)`. This SITS ALONGSIDE row 13's two-point sample from the prior session (`rgb(228,28,92)` to `rgb(234,89,140)`) as a second independent measurement of the same gradient, not a correction: both agree on a magenta-to-rose rausch gradient, endpoints differ slightly by sample point and screen, and `background-color` resolves transparent in both sessions since the fill is a `background-image`. | verified (PIL-sampled), 2026-09-05 | look-recipes.md (Primary button) |
| 26 | "Got it" (wishlist empty-state sheet CTA) | flat ink fill, full-width, rounded rect reading roughly 24-28px radius from the still (not a true pill) | expect (Mobbin still), 2026-09-05 | look-recipes.md (Primary button) |
| 27 | Share / Save (listing, over hero photo) | 40x40 circle, icon-only, frosted/semi-transparent white over the photo (two photo-dependent pixel samples shift with what's behind them, confirming it reads as glass, not a flat warm fill) | verified (structure; fill nature inferred), 2026-09-05 | look-recipes.md (Secondary button) |
| 28 | Wishlist heart (search-result card, over photo) | 32x32 circle, icon fill `rgba(0,0,0,0.5)`, stroke white, no pill behind it | verified, 2026-09-05 | look-recipes.md (Secondary button) |
| 29 | Back arrow (listing, over hero photo) | same 40x40 frosted circle as row 27 | verified, 2026-09-05 | look-recipes.md (Secondary button) |
| 30 | Card name (home rail card) | 13px/500 ink | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 31 | Card meta, price line, and rating number (home rail card) | all three 12px/400, colour `rgb(108,108,108)` (grey, not ink, contrary to a first visual read at thumbnail size) | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 32 | Bottom-tab label | unselected 10px/400 grey `rgb(108,108,108)`; selected 10px/500 brand pink `rgb(218,18,73)` | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 33 | Distinct sizes/weights, Home + Listing combined | 7 sizes (10, 12, 13, 14, 16, 18, 26px) and 3 weights (400, 500, 600, no 700 in visible copy) across TWO screen types together, not one screen; flagged low-confidence against Solen's per-screen ceiling, see Conflicts | verified (count), flagged not claimed as a same-screen comparison, 2026-09-05 | look-recipes.md (Type ladder) |
| 34 | Page horizontal margin (home) | 24px | verified, 2026-09-05 | look-recipes.md (Spacing) |
| 35 | Horizontal gap between two rail cards | 12px | verified, 2026-09-05 | look-recipes.md (Spacing) |
| 36 | Vertical gap, last row of one section to next section's heading | 26px | verified, 2026-09-05 | look-recipes.md (Spacing) |
| 37 | Home-feed rail card, full recipe | box 165x157 (ratio 1.053, matches row 12), radius 20px (matches row 9), fallback bg `rgb(221,221,221)` while loading, shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.1) 0 8px 24px` (soft ambient, no border) | verified, 2026-09-05 | look-recipes.md (Card) |
| 38 | Search-result card, full recipe | box 342x406, radius 20px (matches row 9), no border, whole card is one link (305 such links found pre-rendered on the loaded page) | verified, 2026-09-05 | look-recipes.md (Card) |
| 39 | Second hairline value (bottom-tab-bar top border) | `rgb(235,235,235)` (`#EBEBEB`), distinct from row 8's `rgb(221,221,221)`: Airbnb runs two hairline values by context, not one token | verified (PIL-sampled), 2026-09-05 | look-recipes.md (Colour provenance) |
| 40 | Promotional blue (Get the App banner button only) | `rgb(0,115,229)` (`#0073E5`), a separate blue used nowhere else in the capture, not the brand pink and not spread across the UI | verified (PIL-sampled), 2026-09-05 | look-recipes.md (Colour provenance) |
| 41 | "NEW" tag (profile hub cards) | small dark pill, white text, on a photo/illustration tile | expect (Mobbin still), 2026-09-05 | look-recipes.md (Pill/chip) |
| 42 | "1 guest" / metadata rows (confirmation) | plain text, no pill | expect (Mobbin still), 2026-09-05 | look-recipes.md (Badge) |
| 43 | "Switch to hosting" (profile hub, floating over content) | flat ink black, full pill (very rounded ends), white text + icon, floats above the bottom tab bar | expect (Mobbin still), 2026-09-05 | look-recipes.md (Secondary button) |
| 44 | Section heading (home feed, e.g. "Beliebte Unterkünfte in Paris") | 18px/600, letter-spacing `-0.18px`; the wrapping `<h2>` itself resets to 14/400 for accessibility, the VISIBLE size lives on a nested `<span>`, confirmed by rendering, this is the number that matches the screenshot | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 45 | Amenity row (listing) | 16px/400 ink `rgb(34,34,34)` | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 46 | Host badge line ("X ist ein Superhost") (listing) | 14px/500 ink `rgb(34,34,34)` | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 47 | Rating/reviews line (listing) | 12px/400 ink `rgb(34,34,34)` | verified, 2026-09-05 | look-recipes.md (Type ladder) |
| 48 | Confirmation headline ("Your reservation is confirmed!") point size | reads roughly 22 to 24px bold, two-line, centred, black | expect (Mobbin still, not computed), 2026-09-05 | look-recipes.md (Type ladder) |
| 49 | Photo carousel dots (search-result card) | small white dots, one filled/enlarged for the current index, sits at the bottom edge of the photo | verified (visual, from screenshot), 2026-09-05 | look-recipes.md (Card) |
| 50 | Section-heading-to-heading span (home feed) | 293px total, includes a full 2-card photo row in between, not a pure gap ("Beliebte Unterkünfte" heading top `y=148` to "Tolle Hotels" heading top `y=465`) | verified, 2026-09-05 | look-recipes.md (Spacing) |
| 51 | Card name-to-meta-to-price block height (home rail card) | name box 32px tall (2-line capable), meta box 32px tall, sits directly under the photo with no extra top padding measured | verified, 2026-09-05 | look-recipes.md (Spacing) |
| 52 | Filter chip, SELECTED state (search results quick-filter row, a real toggle: aria-pressed false to true) | fill stays white `rgb(255,255,255)`, text stays `rgb(34,34,34)` 12px/400, radius stays 24px on a 34px pill, box-shadow none; the ONLY change is the border, `1px solid rgb(221,221,221)` to `1px solid rgb(34,34,34)`; no bold, no checkmark | verified, 2026-09-06 (getComputedStyle on airbnb.ch/s/Basel/homes at 390x844 dpr3, de-CH) | scratchpad r3/airbnb/CAPTURE.md Part A, chip-unselected.png and chip-selected.png |
| 53 | Trip-card timing pill on the photo ("In 2 weeks"), geometry by proportion | top-left of the photo; height about 8.4 percent of the photo width, top inset about 3.2 percent and left inset about 4.0 percent of the photo width, opaque white fill (about 99.5 percent lightness), colour does not encode urgency | expect, 2026-09-06 (pixel ratios off a 299px-wide Mobbin still, not a computed style; re-measure from a native capture before locking a Solen px value) | scratchpad r3/airbnb/CAPTURE.md Part B, mobbin-trips-list.png |

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
| 19-22 | Nav tab, search pill, filter pill, map toggle pill | our filter pill lock is `bg-s-bg-sunken` selected / white unselected, both with hairline; our button/chip radius is locked 16px, not 40/24/999 | Not inside lock as literal radii (Airbnb runs 24-40-999px capsule family across these four, ours is 16px fixed-corner); the FUNCTIONAL pattern (unselected = white + hairline) matches our own filter-pill lock already. |
| 23-24 | Guest-favourite / Superhost on-photo badges | Solen's own dated lock is plain ink text, no colour-coded pill, and taste rule 6 wants pastel-bg + saturated icon for inline status chips, not a photo-overlay pill | No hard conflict: neither badge encodes semantic meaning by colour (both are neutral white/grey), which is convergent with Solen's own no-colour-coded-status lock, just a different physical placement (over-photo vs inline). |
| 25 | Reserve button precise box 342x48 | see row 13's port row, unchanged: `bg-s-ink`, 16px radius, never a capsule or gradient | Same conflict as row 13, restated with the tighter box measurement, no new issue. |
| 26 | "Got it" (wishlist empty-state CTA), ink flat, ~24-28px radius | closest to our locked EmptyState CTA (filled ink) but our button radius is fixed at 16px | Fits in spirit (flat ink, full-width); radius family differs, same delta as row 14's "Next" button. |
| 27-29 | Frosted 40x40 icon circles (share/save, back) and the 32x32 wishlist heart | Solen's own `FROST_GLASS` recipe (`lib/frost-glass.ts`) is exactly this job: a calm icon control over a photo | Fits exactly, convergent evidence for a decision Solen already made independently. |
| 30-31 | Card name 13/500, meta/price/rating 12/400 grey | our locked name/price sizes are 14px name, 12px meta (design contract text-size row) | Close but not identical: Airbnb's card name runs 1px smaller than our locked 14px name size; no change proposed, noting the delta only. |
| 32 | Bottom-tab selected label in brand pink | Solen has no bottom tab bar today; our accent colour role is small clickable text/links only, never a whole nav label | Does not fit inside the lock as-is, see Conflicts. |
| 33 | 7 sizes / 3 weights across two screen types | our ceiling is <=4 sizes / <=2 weights PER SCREEN | Not a clean same-screen comparison, flagged not claimed, see Conflicts (restates row 18's flatter version of this same caveat with an exact count). |
| 34-36 | Page margin 24px, card gap 12px, section gap 26px | our spacing scale is 4pt-based: 24 (6x4) and 12 (3x4) are on-grid; 26 is NOT on-grid (nearest multiples are 24 or 28) | 24 and 12 port cleanly; 26 would need rounding to stay on our 4pt scale, same shape of issue as row 17's 35px. |
| 37-38 | Home-rail card 165x157/r20/soft-ambient-shadow; search-result card 342x406/r20/no-border | see row 9-10's existing conflicts (radius +4px, shadow present vs Airbnb's none); this row adds the exact box dimensions and the fallback-bg/shadow recipe those rows didn't carry | Same conflicts as rows 9-10, now with the full recipe attached. |
| 39 | Second hairline `#EBEBEB` (bottom-tab border only) | our hairline is one token, `#E4E4E7` | Confirms Airbnb runs two hairline values by context where we lock one; no change proposed, our one token already sits in the same neutral-grey family as both of theirs. |
| 40 | Promotional blue `#0073E5` (one banner button only) | not a token we hold or need; distinct from our own accent blue `#276EF1` | Out of scope, Airbnb itself scopes this to one promotional job and nowhere else, nothing to port. |

## Colour provenance (every non-grey colour on the 2026-09-05 live + Mobbin capture, and its one job)

Cited whole from `airbnb--look-recipes.md` (2026-09-05); this table did not exist in this file
before the merge.

| colour | hex (approx) | where used | tier |
|---|---|---|---|
| `rgb(218,18,73)` | `#DA1249` | brand pink/rausch: ONLY the selected bottom-tab icon+label, and (lower-confidence, by hue family) the identity-verified checkmark badge; never a button fill, body text, or card background | verified (nav tab, live DOM) |
| Reserve-button gradient | `#E41D56` -> `#DD1063` (roughly, PIL-sampled; see row 25) | the ONE paid-commit action, and only that action, in the whole capture | verified |
| `rgb(0,115,229)` | `#0073E5` | a separate promotional blue, "Get the app" banner button only, dismissed after this sample; not used anywhere in the booking flow itself | verified (PIL-sampled) |
| `rgb(34,34,34)` | `#222222` | the one ink used everywhere: all body text, all headings, the map-toggle pill fill, the flat "Next"/"Got it" buttons (matches row 5) | verified |
| `rgb(108,108,108)` | `#6C6C6C` | the one secondary grey: card meta, card price line, rating numbers, unselected bottom-tab labels (matches row 4's secondary-text colour) | verified |
| `rgb(221,221,221)` | `#DDDDDD` | hairline/border colour on the search pill and filter pills (matches row 8) | verified |
| `rgb(235,235,235)` | `#EBEBEB` | a separate, slightly lighter hairline used only on the bottom-tab-bar's top border (row 39, new: not present before the merge) | verified |
| `rgb(244,241,233)` | `#F4F1E9` | warm cream, used ONLY on the post-booking confirmation screen and the wishlist empty-state sheet; not used on home, search, or listing, all three of which are pure white. This is the same colour row 7 described without a hex ("assume, visual read"); tonight's PIL sample off a Mobbin still gives the actual value, but the tier stays `expect` (a still image, not a live computed style), so row 7 is enriched, not upgraded to `verified`. | expect (PIL-sampled from a Mobbin still) |
| `rgba(96,96,96,0.6)` | dark grey semi-transparent | Superhost badge fill (row 24) | verified |
| `color(srgb 1 1 1 / 0.8)` | white at 80% | Guest-favourite badge fill (row 23) | verified |

## Status treatment (2026-09-05, Mobbin, tier expect throughout)

New section, cited whole from `airbnb--look-recipes.md`. Confirmed, pending, and cancelled trip
cards all use the exact same neutral badge recipe (small white/near-white pill, plain black text,
no green, no red, no orange); only the WORD changes ("In 3 months" / "Pending" / "Cancelled"). The
confirmation screen itself communicates success entirely through a headline ("Your reservation is
confirmed!", black, bold, centred, no checkmark icon, no green) and through screen SEQUENCE, not
colour. This is convergent with Solen's own dated availability lock ("plain ink text, no green
pill, owner call, do not re-add"): both systems independently avoid colour-coded status.

## Empty state (2026-09-05, Mobbin, tier expect)

New section, cited whole from `airbnb--look-recipes.md`. The Wishlists empty-state coaching sheet:
warm cream `#F4F1E9` background (the same family as the confirmation screen, see Colour provenance
above), a single square example-photo tile with a small pink heart icon overlaid (showing WHERE to
tap, not an abstract icon), a bold centred two-line headline, a grey centred subline, one full-width
flat-ink "Got it" button (row 26). No illustration, no generic icon disc: the "icon" is a real
product screenshot. This validates Solen's own locked EmptyState anatomy (icon + PROMISE headline +
GESTURE subline + CTA) on every point except the warm background, which is the same cream conflict
already logged for the confirmation screen.

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
- **CONFLICT [selected-state colour, bottom tab], added 2026-09-05:** the reference's selected
  bottom-tab icon+label is brand pink `#DA1249` (row 32). Solen's lock says selected/active is a
  calm gray fill (`bg-s-bg-sunken` + `text-s-ink`), never a saturated brand colour on text or an
  icon, and the accent blue `#276EF1` is reserved for small clickable text only. Solen has no
  bottom-nav today, so this is a forward-looking conflict, not a live one: owner call, if a
  Solen bottom-nav is ever built, whether its active-tab treatment may use accent colour on the
  icon or must stay inside the existing gray-fill contract.
- **CONFLICT (low-confidence, flagged not claimed), added 2026-09-05 [type-ladder count spans two
  screens]:** row 33's "7 sizes, 3 weights" was counted across Home AND Listing combined, not one
  screen, so it is not a clean apples-to-apples reading against Solen's per-screen ceiling. Logged
  so a future capture re-measures each Airbnb screen type separately before citing "Airbnb breaks
  its own 4-size rule" as settled; this restates row 18's caveat with the exact count attached.

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

## Not reachable live this session (2026-09-05 capture, folded in from `airbnb--look-recipes.md`)

Distinct from the section above (that one lists analytic limits of the ORIGINAL capture; this one
lists pages the 2026-09-05 session specifically could not reach live, logged-out, at all):

- **The multi-step "Confirm and pay" checkout screen itself** (the step before the confirmation
  screen): requires selecting real dates/guests and proceeding through a logged-out checkout far
  enough to see the fee breakdown and the "Next" button in its checkout context (not the
  post-payment dialog). Row 14 above already carries a `verified` capture of this exact button from
  the prior 2026-09-05 session (cited there as "checkout," not "confirmation"); tonight's session
  did not duplicate that capture and instead confirms it could not independently re-reach it.
- **Reservation confirmation, Trips list, Wishlists empty state, Profile:** all four sit behind
  login. Captured via Mobbin stills only, tier `expect` throughout (rows 23, 26, the Status
  treatment section, and the Empty state section above).

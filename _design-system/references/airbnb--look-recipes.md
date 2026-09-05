<!-- exists-check: `airbnb--look-recipe.md` (singular) already exists and consolidates numbers by
     CITING five sibling capture files, no screenshots of its own. This file is the thing this
     task asked for by name: a fresh, self-contained live-DOM + Mobbin capture with its own
     screenshots, its own getComputedStyle/getBoundingClientRect reads taken this session
     (2026-09-05, phone viewport, German locale), and the specific section shape the brief
     specified (Identity / Philosophy / Measured / Port map / Conflicts). Where a number here
     lands close to a number in the singular file, that is two independent measurements agreeing,
     not a copy; where they differ (see Conflicts-adjacent notes inline), the difference is named.
     Read both if building against this: the singular file adds a `git`-cited number for the
     checkout flow and 8 reviewer-row numbers this file did not re-measure. -->

# Airbnb look recipes (live capture, 2026-09-05)

REF: airbnb / web-mobile (Playwright, 390x844, dpr3, de-CH) + iOS (Mobbin stills) / look-recipes / fresh capture

## Identity

- **Brand:** Airbnb.
- **Platform:** web in mobile viewport (390x844, deviceScaleFactor 3, Mobile Safari UA, locale
  de-CH) for Home, Search, and one Listing page, all reachable while logged out; iOS app stills
  via Mobbin for the four screens that sit behind a login (confirmation, trips, wishlists empty
  state, profile).
- **Pages captured:** `https://www.airbnb.ch/?locale=de` (home), `https://www.airbnb.ch/s/Basel--Schweiz/homes?locale=de`
  (search results for Basel), `https://www.airbnb.ch/rooms/938468907927350421?locale=de` (one
  listing, "Schönes Studio-Apartment City Heart"). Screenshots and computed-style JSON dumps saved
  to `/private/tmp/claude-501/.../scratchpad/r2/refs/airbnb/` this session (local scratch, not
  committed to the repo; the numbers below are transcribed from them).
- **Capture date:** 2026-09-05.
- **Method per value:** "verified" = read live via `getComputedStyle`/`getBoundingClientRect` in
  this session's own Playwright run, or PIL-pixel-sampled from this session's own screenshot.
  "expect" = read off a Mobbin still (a rendered screenshot, not a live DOM) for a page that needs
  a logged-in session. Every row below is tagged.

## Philosophy (what the numbers are doing)

Airbnb's mobile-web look is neutral by default and spends colour on exactly three jobs: the brand
pink (`rgb(218,18,73)`) marks WHERE YOU ARE (the active bottom-tab) and WHO YOU ARE (the verified
badge), never a button fill. Status badges (Superhost, Guest favourite, "In 3 months", Pending,
Cancelled) are all the same neutral pill regardless of what they mean, colour never encodes
success or failure on a card. The one high-saturation fill in the whole system is the Reserve
button's rausch gradient, reserved for the single paid-commit action; every other button, including
the post-payment "Next"/"Got it" step, is flat ink black. Cards carry photo, name, meta, price and
rating in one line each, ranked by weight (name 500, meta and price/rating 400) rather than by
size, sizes stay close (12 to 14px) and hierarchy is almost entirely a weight and colour job.

## Measured

### Pill / chip

| element | value | tier | source |
|---|---|---|---|
| Top nav tab (Alles / Unterkünfte / Erlebnisse), unselected AND selected | bg `rgb(255,255,255)`, radius `40px`, h `40px`, text `14px/400 rgb(34,34,34)`, border `1px solid rgb(255,255,255)` (one tab measured `rgba(255,255,255,0.5)`, likely a hover/timing artefact not a real state), padding `10px 14px` | verified | home, live DOM |
| No distinct selected-tab treatment was found: font-weight, colour and background are identical across all three top-nav tabs. Airbnb signals the active tab by which content is showing below it, not by pill colour. | | verified | home |
| Search pill | bg `rgb(255,255,255)`, radius `40px`, border `1px solid rgb(221,221,221)`, h `56px`, padding `10px 19px`, shadow `rgba(0,0,0,0.1) 0px 6px 20px 0px`, text `14px/500 rgb(34,34,34)` | verified | home |
| Filter pill (search results, "Haustiere erlaubt" etc.), all unselected in this session | bg `rgb(255,255,255)`, radius `24px`, border `1px solid rgb(221,221,221)`, h `34px`, text `12px/400 rgb(34,34,34)` | verified | search-basel |
| Map toggle pill ("Karte") | bg `rgb(34,34,34)` (solid ink), radius `24px`, h `38px`, w `93px`, text white (inherited, `14px`) | verified | search-basel |
| "NEW" tag on profile hub cards | small dark pill, white text, on a photo/illustration tile | expect (Mobbin still) | profile |

### Badge

| element | value | tier | source |
|---|---|---|---|
| "Gäste-Favorit" (Guest favourite), on-photo | bg `color(srgb 1 1 1 / 0.8)` (white at 80%), radius `14px`, border `1px solid color(srgb 1 1 1 / 0.5)`, shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.04) 0 2px 6px, rgba(0,0,0,.1) 0 4px 8px`, text `14px/600 rgb(34,34,34)`, box `95x26` | verified | home |
| "Superhost", on-photo | bg `rgba(96,96,96,0.6)` (dark, semi-transparent), radius `40px` (true pill), border `1px solid rgba(255,255,255,0.16)`, text `14px/500 rgb(255,255,255)`, box `90x28` | verified | search-basel |
| Identity-verified badge (profile avatar) | a small filled circle in brand pink, PIL-sampled cluster centre `rgb(200,45,97)` (~`#C82D61` at this thumbnail's compression), white checkmark glyph, overlapping the avatar's bottom-right edge | expect (Mobbin still, low-res webp; treat the exact hex as approximate, the live-verified pink from the bottom nav, `rgb(218,18,73)`, is the more reliable number for this hue) | profile |
| Trip status pill ("In 3 months" / "Pending" / "Cancelled"), on-photo | same neutral white pill for all three states: white/near-white fill, black text, no colour coding by meaning | expect (Mobbin stills, 3 screens compared) | trips |
| "1 guest" / metadata rows on confirmation | plain text, no pill | expect (Mobbin still) | confirmation |

### Primary button

| element | value | tier | source |
|---|---|---|---|
| Reserve (listing page, the one paid-commit action) | radius `999px` (true pill), h `48px`, w `342px` (full content width), padding `14px 24px`, text `16px/500` white, fill = a magenta-to-rose gradient. PIL-sampled left-to-right across the fill: `rgb(228,29,86)` -> `rgb(227,28,95)` -> `rgb(221,16,99)` (a left-to-right rausch gradient; computed `background-color` reads transparent because the fill is a `background-image` gradient, not a solid). | verified (computed styles for shape/text/radius; PIL pixel-sample for the fill since gradients do not resolve via `background-color`) | listing |
| "Next" / "Got it" (checkout step, confirmation dialog) | flat ink `rgb(34,34,34)` fill, radius looks like a rounded rectangle in the Mobbin still (not a true pill, noticeably squarer corners than Reserve), white text, full content width | expect (Mobbin still for the confirmation dialog's "Next"; the multi-step checkout's equivalent button was not reached live this session, logged under notReachable) | confirmation |
| "Got it" (wishlist empty-state sheet) | same flat ink treatment, full-width, rounded rect (radius reads roughly in the 24 to 28px family from the still, not a true pill) | expect (Mobbin still) | wishlists-empty |

### Secondary button

| element | value | tier | source |
|---|---|---|---|
| Share / Save (listing page, over the hero photo) | `40x40` circle, icon-only (no visible label), background reads as a warm translucent tan in the raw screenshot pixels (`rgb(204,185,167)` at one sample, `rgb(163,137,112)` at another) but that is the photo showing through a frosted/semi-transparent white circle, not an intrinsic warm fill (samples shift with what photo is behind them). This is Airbnb's own frosted-glass-over-photo control, the same job Solen's `FROST_GLASS` recipe already does. | verified (size + structure from computed styles; fill nature inferred from two photo-dependent pixel samples, not a flat colour read) | listing |
| Wishlist heart (search-result card, over photo) | `32x32` circle button, icon `svg path` fill `rgba(0,0,0,0.5)`, stroke `rgb(255,255,255)` (a semi-transparent dark heart outlined in white, sits directly on the photo with no separate pill behind it) | verified | search-basel |
| Back arrow (listing page, over hero photo) | same `40x40` frosted circle as Share/Save | verified | listing |
| "Switch to hosting" (profile hub, floating over content) | flat ink black, full pill (very rounded ends), white text + icon, floats above the bottom tab bar | expect (Mobbin still) | profile |

### Type ladder

| use | size / weight | colour | tier | source |
|---|---|---|---|---|
| Listing title (`<h1>`) | `26px / 500` | `rgb(34,34,34)` | verified | listing |
| Section heading (home feed, e.g. "Beliebte Unterkünfte in Paris") | `18px / 600`, letter-spacing `-0.18px` | `rgb(34,34,34)` | verified (the wrapping `<h2>` itself resets to 14/400 for accessibility; the VISIBLE size lives on a nested `<span>`, confirmed by rendering, this is the number that matches the screenshot) | home |
| Card name | `13px / 500` | `rgb(34,34,34)` | verified | home |
| Card meta (host type / dates) | `12px / 400` | `rgb(108,108,108)` | verified | home |
| Card price line ("Fr. 184 Gesamtpreis") | `12px / 400` | `rgb(108,108,108)` (grey, not ink, contrary to a first visual read of the screenshot at thumbnail size) | verified | home |
| Rating number next to a card (e.g. "4.91") | `12px / 400` | `rgb(108,108,108)` | verified | home |
| Search-pill label | `14px / 500` | `rgb(34,34,34)` | verified | home |
| Nav tab label | `14px / 400` | `rgb(34,34,34)` | verified | home |
| Bottom-tab label, unselected | `10px / 400` | `rgb(108,108,108)` | verified | home |
| Bottom-tab label, selected | `10px / 500` | `rgb(218,18,73)` (brand pink) | verified | home |
| Rating / reviews line (listing) | `12px / 400` | `rgb(34,34,34)` | verified | listing |
| Host badge line ("X ist ein Superhost") | `14px / 500` | `rgb(34,34,34)` | verified | listing |
| Amenity row | `16px / 400` | `rgb(34,34,34)` | verified | listing |
| Reserve button text | `16px / 500` | white | verified | listing |
| Confirmation headline ("Your reservation is confirmed!") | reads roughly 22 to 24px bold, two-line, centred | black | expect (Mobbin still, not computed) | confirmation |
| **Distinct sizes counted across Home + Listing** | 10, 12, 13, 14, 16, 18, 26px, that is 7 distinct sizes across TWO different screen types combined (not one screen). Any single screen (home alone, or the listing alone) uses fewer. | | verified | home + listing combined |
| **Distinct weights** | 400, 500, 600 (3 weights observed; no 700 found on any in-scope customer element, `Airbnb-Homepage` at `700` was an invisible `1x1` accessibility label, not visible copy) | | verified | home |

### Spacing

| measurement | value | tier | source |
|---|---|---|---|
| Page horizontal margin (left edge of content to first card) | `24px` | verified | home |
| Horizontal gap between two cards in a rail | `12px` | verified | home |
| Vertical gap, last content row of one section to the next section's heading | `26px` (measured: previous section's last price-line bottom at `y=438.75`, next heading top at `y=464.75`) | verified | home |
| Section-heading-to-heading span (includes a full 2-card photo row in between, not a pure gap) | `293px` total ("Beliebte Unterkünfte" heading top `y=148` to "Tolle Hotels" heading top `y=465`) | verified | home |
| Card name-to-meta-to-price block height | name box `32px` tall (2-line capable), meta box `32px` tall, sits directly under the photo with no extra top padding measured | verified | home |
| Section-to-review-row rhythm (listing reviews) | not re-measured this session, see the singular `airbnb--look-recipe.md` row 17 (`35px` content-to-divider, `24px` divider-to-next-row) | verified (cited, prior session) | airbnb--look-recipe.md |

### Card

| element | value | tier | source |
|---|---|---|---|
| Home-feed rail card, photo | `165x157px` at this viewport, ratio `1.053` (near-square) | verified | home |
| Home-feed rail card, container | radius `20px`, bg fallback `rgb(221,221,221)` (shown briefly while the photo loads), shadow `rgba(0,0,0,.02) 0 0 0 1px, rgba(0,0,0,.1) 0 8px 24px 0px` (a soft ambient shadow, no border) | verified | home |
| Search-result card | `342x406px`, radius `20px`, no separate border, photo carousel with position dots | verified | search-basel |
| Search-result card, link/click target | the whole card is one `<a href="/rooms/...">`, `305` such links found on the loaded page (Airbnb pre-fetches/renders far past the visible viewport) | verified | search-basel |
| Photo carousel dots (search-result card) | small white dots, one filled/enlarged for the current index, sits at the bottom edge of the photo | verified (visual, from screenshot) | search-basel |

### Colour provenance (every non-grey colour on the pages captured, and its one job)

| colour | hex (approx) | where used | tier |
|---|---|---|---|
| `rgb(218,18,73)` | `#DA1249` | brand pink/rausch. Used ONLY for: the selected bottom-tab icon+label, and (by family, see the badge section's lower-confidence sample) the identity-verified checkmark badge. Never a button fill, never body text, never a card background. | verified (nav tab, live DOM) |
| Reserve-button gradient | `#E41D56` -> `#DD1063` roughly (PIL-sampled, see Primary button table) | the ONE paid-commit action, and only that action, on the whole capture | verified |
| `rgb(0,115,229)` | `#0073E5` | a SEPARATE blue, used only on the "ZUR APP" (Get the app) promotional banner button. This is not the brand pink and not used anywhere else in the booking flow. Even Airbnb keeps this blue to one promotional job, not spread across the UI. | verified (PIL-sampled) | listing (banner, dismissed after this sample) |
| `rgb(34,34,34)` | `#222222` | the one ink used everywhere: all body text, all headings, the map-toggle pill fill, the flat "Next"/"Got it" buttons | verified |
| `rgb(108,108,108)` | `#6C6C6C` | the one secondary grey: card meta, card price line, rating numbers, unselected bottom-tab labels | verified |
| `rgb(221,221,221)` | `#DDDDDD` | hairline/border colour on the search pill and filter pills | verified |
| `rgb(235,235,235)` | `#EBEBEB` | a SEPARATE, slightly lighter hairline used only on the bottom-tab-bar's top border. Airbnb runs two different hairline values depending on context, not one token. | verified |
| `rgb(244,241,233)` | `#F4F1E9` | warm cream, used ONLY on the post-booking confirmation screen. Not used on home, search, or the listing page, all three of which are pure white. This is a deliberate single-surface exception, not a base tone. | expect (PIL-sampled from a Mobbin still) |
| `rgba(96,96,96,0.6)` | dark grey semi-transparent | Superhost badge fill (over-photo, needs to work on any photo) | verified |
| `color(srgb 1 1 1 / 0.8)` | white at 80% | Guest-favourite badge fill (over-photo) | verified |

### Status / confirmation treatment

Airbnb does not colour-code status. Confirmed, pending, and cancelled trip cards all use the exact
same neutral badge recipe (a small white/near-white pill, plain black text, no green, no red, no
orange), the only thing that changes is the WORD in the pill ("In 3 months" / "Pending" /
"Cancelled"). The confirmation screen itself communicates success entirely through a headline
("Your reservation is confirmed!", black, bold, centred, no checkmark icon, no green anywhere) and
through screen SEQUENCE (arriving at this screen after payment IS the confirmation), not through
colour. Tier: expect, all three Mobbin stills (confirmed / pending / cancelled trip cards) compared
side by side this session.

### Empty state

Wishlists empty state (reached as a first-use coaching sheet over the Wishlists tab, Mobbin still):
warm cream background (same `#F4F1E9` family as the confirmation screen, an on-brand pair, not
white), a single square example-photo tile with a small pink heart icon overlaid (showing the user
WHERE to tap, not an abstract icon), a bold centred two-line headline ("Save your favorites in one
place"), a grey centred subline ("Tap the heart icon as you browse..."), and one full-width flat
ink "Got it" button. No illustration, no generic Lucide-style icon disc: the "icon" IS a real
product screenshot. Tier: expect (Mobbin still).

## Port map

| Airbnb value | Solen equivalent | fits inside the lock? |
|---|---|---|
| Ink `#222222` | Solen ink `#0A0A0A` | Both are near-black inks for the same job (primary text, flat commit buttons). Not identical hex, no change proposed, Solen's is simply darker. |
| Brand pink `#DA1249` on the selected bottom-tab | no equivalent slot: Solen has no bottom tab bar today, and the accent color for a selected state is gray-fill (`bg-s-bg-sunken`), never a saturated colour on text | Does not fit inside the lock as-is. See Conflicts. |
| Secondary grey `#6C6C6C` | closest Solen token is `s-ink-2` (`#6B6B6B`), functionally identical value for the same non-load-bearing-text job | Fits, already the same number by coincidence. |
| Hairline `#DDDDDD` / `#EBEBEB` | Solen hairline `#E4E4E7` (one token) | Airbnb runs two hairline values, Solen locks one. Solen's is inside the same "cool light grey" family, no conflict, just not identical. |
| Reserve button: true pill (`999px`), h `48px`, rausch gradient fill | Solen radius for a button is locked at `16px` (a chosen corner, explicitly NOT a capsule per the 2026-08-16 owner call); Solen's one commit button is ink `#0A0A0A`, never a gradient | Conflicts on both radius shape and fill. See Conflicts. |
| "Next"/"Got it" flat ink button, rounded rect (not a full pill) | matches Solen's own commit-button contract almost exactly: flat ink, rounded rect, full-width | Fits inside the lock, this is the ALIGNED case, not the Reserve button. |
| Guest-favourite / Superhost badges: neutral pill (white-80% or grey-60%), never colour-coded | Solen's own availability rule already says "plain ink text, no green pill" | Fits, convergent finding, both systems avoid colour-coded status pills. |
| Status treatment (confirmed/pending/cancelled all one neutral pill) | Solen has no shipped equivalent status-pill pattern for bookings today | Fits the SPIRIT of Solen's no-fabrication and no-decorative-dot rules (nothing invented, nothing colour-coded without meaning); a Solen booking-status pill could copy this recipe directly with no lock conflict. |
| Warm cream `#F4F1E9` on confirmation + empty state | Solen's palette is 80/17 cool surfaces + ink, LOCKFILE explicitly bans warm cream ("no warm cream") | Direct conflict. See Conflicts. |
| Card radius `20px` (search + home rail) | Solen's individual entity-card radius is locked at `16px`; Solen's grouped list-card is `24px` | Airbnb's `20px` sits between Solen's two card-radius tokens. No proposed change, just noting it is neither of Solen's two numbers. |
| Card shadow: soft ambient (`0 8px 24px rgba(0,0,0,.1)`), no border | Solen's SalonCard recipe: photo + `shadow-whisper` + no border | Same FAMILY of treatment (photo card, shadow-only, no border), fits the lock's spirit even though the exact shadow value differs. |
| Type ladder: 7 distinct sizes across two screen types, 3 weights (400/500/600), no 700 in visible copy | Solen's ceiling is `<=4 distinct sizes / <=2 weights` PER SCREEN | Not directly comparable (Airbnb's 7 spans two screens, not one); worth re-measuring Airbnb per-screen before citing a real conflict here. Flagged, not claimed. |
| Frosted-glass icon buttons over photo (share/save/back) | Solen's own `FROST_GLASS` control-elevation recipe for a control over a photo | Fits exactly, this is convergent evidence for a decision Solen already made. |
| Fonts: `"Airbnb Cereal VF", Circular, -apple-system...` | Solen: Inter Tight (display) + Inter (body) | Different type families by design, no proposed change (Solen's font lock stands regardless of what Airbnb uses). |

## Conflicts

- CONFLICT [selected-state colour]: reference says the selected bottom-tab uses brand pink
  `#DA1249` for both the icon and the label text. Lock says selected/active is a calm gray fill
  (`bg-s-bg-sunken` + `text-s-ink`), never a saturated brand colour on text, and blue `#276EF1` is
  reserved for small clickable text only, never a whole nav icon. Owner call: whether a future
  Solen bottom-nav (if one is ever built) may use accent-colour icons for the active tab, or must
  stay within the existing gray-fill contract.

- CONFLICT [button shape and fill, primary commit]: reference says the Reserve button (Airbnb's
  one paid-commit action) is a true `999px` pill with a rausch-to-rose gradient fill. Lock says
  Solen's one commit button is a `16px` rounded rect (explicitly not a capsule, per the 2026-08-16
  owner call that measured why capsules look wrong at width) filled solid ink `#0A0A0A`, never a
  gradient. Owner call: this is a locked axis on both counts (radius family AND flat-vs-gradient
  fill); no change proposed here, logging the reference's contrary shape for the record only.

- CONFLICT [warm cream on the confirmation/empty-state pair]: reference says Airbnb's ONE deliberate
  warm surface across the whole capture is the post-booking confirmation screen and the matching
  wishlist empty-state sheet, both `#F4F1E9`. Lock says "no warm cream" by name, and 80/17
  surfaces+ink governs every customer screen with no named exception for confirmation or empty
  states. Owner call: whether a confirmation/empty-state screen ever earns a narrow, named
  exception the way Airbnb carves one out, or whether the cream stays banned everywhere including
  this one moment.

- CONFLICT (low-confidence, flagged not claimed) [type-ladder ceiling]: reference's 7 distinct
  sizes were counted across Home AND Listing combined, not one screen, so this is not a clean
  apples-to-apples reading against Solen's PER-SCREEN `<=4 sizes` ceiling. Recorded here so a
  future capture re-measures each Airbnb screen type separately before anyone cites "Airbnb breaks
  its own 4-size rule" as settled.

## Not reachable live this session

- The multi-step "Confirm and pay" checkout screen itself (the step before the confirmation
  screen) was not reached live: it requires selecting real dates/guests and proceeding through a
  logged-out checkout far enough to see the fee breakdown and the "Next" button in its checkout
  context (not the post-payment dialog). The singular `airbnb--look-recipe.md` (row 14) already
  has a verified capture of this from a prior session (2026-09-05, cited there as "checkout" not
  "confirmation"); this file does not duplicate that capture.
- Reservation confirmation, Trips list, Wishlists empty state, Profile: all behind login, captured
  via Mobbin stills per the brief, tier "expect" throughout, see the Measured section above.

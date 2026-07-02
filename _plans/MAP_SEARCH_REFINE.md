# Map + Search refinement batch (owner 2026-07-01)

> Captured under the plan-first discipline (owner: "plan before you move, stop skipping steps").
> Most items are VISUAL -> MOCKUP-FIRST (mockup-visual-gate now enforces it). Design choices ->
> 3+ variations side by side (owner asked for ideas). Two items need the owner's reference
> screenshots (not yet in ~/solen/screenshots). One needs the council.

## Owner asks (verbatim intent, numbered)

1. **Map search bar city is STUCK.** Moving the map to Basel doesn't update the bar (still says
   Zürich); going to Zürich doesn't move it either. The bar city label should reflect / not be
   frozen. [functional] , investigate what drives the bar city vs the map viewport.

2. **Clicking a map pin/store does NOTHING.** Tapping a salon pin should open a STORE PREVIEW
   (card), not nothing. Owner will ATTACH a reference of how it should look. [feature + VISUAL]
   BLOCKED on the reference screenshot for the exact preview look.

3. **Map pin labels: show RATING (stars) + REVIEW COUNT, not from-price. And NOT black.** Owner
   dislikes Fresha's black pill. Will ATTACH a Fresha screenshot. [VISUAL -> mockup, 3+ variations]
   BLOCKED on the Fresha reference; but the from-price -> rating+count swap can be mocked now.

4. **Map search bar sizing.** Make the map-view search bar the SAME size as the normal-view
   search bar, and integrate it WITH the back button. [VISUAL -> mockup, 3+ variations]

5. **Refine each filter + a focus ring inside the filter.** Filters need refinement; there's still
   a focus ring inside the filter sheet. [VISUAL + focus-ring]

6. **FOCUS RINGS STILL NOT FIXED (owner FURIOUS, repeat).** On the HOME button (on click/hover ,
   owner thinks it's a hover state) AND on the PILLS. MEASURE live (getBoundingClientRect +
   computed style) BEFORE editing , binary-trigger. Root-cause the actual ring source (my touch
   input-halo fix did not cover buttons on the owner's device / a hover state). [a11y/CSS]

7. **Category vs City selector flow is CONFUSING.** Search -> tap Barber (category) -> location
   still shows -> tap Zürich -> the city selector "disappears in the middle". Confusing why it
   appears/disappears/stays. Also the city selector has a LOT OF OVERLAP. Owner wants IDEAS +
   wants me to ASK questions so I build what they actually want. [UX redesign -> ASK + mockup 3+]

8. **Checkout/booking: no processing state after payment** (walk-in AND normal). It snaps to the
   confirmation instantly -> no confidence "did I actually pay?". ASK THE COUNCIL. Add a
   processing/loading beat -> then the confirmation. [UX + motion -> council + mockup]

## PROGRESS 2026-07-01
- **#6 FOCUS RINGS , FIXED + hardened.** Measured (keyboard-Tab, desktop): every button/link/pill
  had `outline: 2px solid #0A0A0A` on :focus-visible (globals.css). Removed globally -> re-measured
  0 rings across 7 focusables. Commit e6af39ad1. HARDENED: no-focus-ring-gate now also catches a
  raw CSS `outline: Npx solid` (the gap that let it recur , utility patterns missed it); self-tested
  (denies re-add, passes `outline: none`).
- Remaining #1-5, #7, #8 = mockups / refs / council / Q&A (below). No real-component code yet ,
  mockup-visual-gate enforces mockup-first.

## Meta (owner demanded , DONE)
- HARDENED plan-first: plan-first-stamp.py (UserPromptSubmit) + plan-first-gate.py (PreToolUse)
  block substantive code edits until _plans/ is updated this turn. Self-tested (trips + 4 passes),
  wired.
- HARDENED mockup-first for VISUAL: mockup-visual-gate.py blocks appearance changes to real
  components without an approved mockup (diffs old/new visual tokens to avoid false positives).
  Self-tested (trips + 5 passes), wired. (Supersedes the motion-only mockup-first-gate for the
  general case.)

## Sequencing
- #6 focus rings FIRST (measure -> fix; owner most furious; a11y/CSS, not a design-choice mockup).
- #1 map-bar-city-stuck: functional investigation.
- #3 (from-price -> rating+count) + #4 (bar sizing) + #7 (selector flow): MOCKUPS, 3+ variations,
  side by side on a /dev route, owner picks. #7 also needs owner Q&A first.
- #2 (pin -> store preview) + #3-black-style: BLOCKED on owner reference screenshots.
- #8 checkout processing state: council, then mockup.

## #7 COUNCIL (2026-07-01) , owner asked for the council on the category-tap behavior
Owner already decided: pick a city -> COLLAPSE TO A CITY CHIP.
Voices 1 (IA) + 2 (Airbnb patterns) converge:
- **Category chip tap -> fill the service + AUTO-ADVANCE to the location step** (a chip tap is a
  complete commit; advancing = the Airbnb pattern). The service row stays visible as a chip above.
- **Hybrid composer**: exactly ONE field expanded at a time; every answered field COMPRESSES to a
  dismissible chip in its OWN slot; all three rows (service/location/date) always visible. Not an
  accordion (all-open overwhelms), not a hidden wizard.
- **THE rule that kills the confusion**: a field only changes state on a USER action. "City
  disappears" = the composer reacting to its OWN state change. Never REMOVE a row , COMPRESS it to
  a chip in place. Visibility = trust.
- **MAP nuance** (voice 2): on the map, a category/place pick can commit IMMEDIATELY to the map
  viewport, composer stays docked as a compact top bar for refinement (Google/Airbnb map pattern).
  -> this is a natural VARIATION to mock (compose-first vs commit-immediately-on-map).
Voice 3 (simplicity): pending , will inform whether DATE stays up-front or defers to results.
NEXT: build 2-3 MOCKUP VARIATIONS of this composer (hybrid+chips, auto-advance) side by side on a
/dev route, owner picks. Variations = (A) compose-first everywhere, (B) map commits category
immediately + docked bar, (C) leaner per voice 3.

## Open questions to ASK the owner (for #7)
- When you pick a category (Barber), should the flow auto-advance to location, or stay so you can
  also pick a service? What should happen to the city selector after you pick a city , collapse to
  a chip, stay open, or advance? (Draft options in the mockup.)

## PROGRESS pt 2 (2026-07-01)
- #7 council done + MOCKUP shipped at /dev/search-flow (3 variants A/B/C, recommend B). BLOCKED on
  owner picking a variant.
- #1 map-bar-city-stuck: ROOT CAUSE = the map bar shows cityName = the SEARCH city (activeCity/URL
  param), NOT the map's pan viewport (SearchTemplate.tsx:1524). Panning to Basel never touches it.
  This is a UX FORK, not a bug: (a) bar TRACKS the map pan (non-standard; Google/Airbnb DON'T), or
  (b) keep the bar = your search + add a "In diesem Bereich suchen" button on pan (the standard
  MapView.onAreaSearch already exists but may be unwired in the overlay). Needs owner's call / a
  mockup , NOT guess-implemented.
- #8 checkout-no-processing-state: council dispatched (owner asked). Then mockup.
BLOCKED-ON-OWNER: #7 pick (A/B/C); #2 store-preview ref; #3 Fresha rating-pill ref; #1 bar-vs-area
UX fork. NON-BLOCKED next: #8 (council->mockup), #4 bar-sizing mockup, #5 filter refine mockup.

## #8 COUNCIL (2026-07-01) , post-payment confidence
Voice 1 (trust lens):
- SEQUENCE: tap Pay -> button morphs to spinner (label gone, SAME width, no layout jump) ->
  "Zahlung wird verarbeitet..." centered state -> success moment.
- Processing beat = REAL (tied to the Stripe round-trip), hard FLOOR ~1.4s so a fast (200ms)
  response can't snap-through and create doubt; cap ~8s then error. NOT a fake pad.
- "Money moved" = the RECEIPT TRIANGLE: charged AMOUNT (large mono, CHF 85.00) + CARD last-4
  (Mastercard ···· 4821) + BOOKING/TICKET REFERENCE (mono). All three close the loop; a generic
  green check is insufficient.
- Success moment: SuccessMark primitive ONCE at natural speed (<600ms, no loop) + one medium
  haptic (.success). No confetti/bounce.
Voice 2 (skeptic): pending (will pressure-test the 1.4s floor: honest-async vs theater).
NEXT: mockup the payment->processing->confirmation sequence (both walk-in + normal booking), owner
approves, then wire (careful , checkout/payment area). Reuse the existing SuccessMark primitive.

## #8 SYNTHESIS (both voices)
AGREE (the real fix): the "did I pay?" doubt is about CONFIRMATION DENSITY, not time. The success
screen must lead with a clear "Buchungsbestätigung" + the RECEIPT (amount charged in mono, card
last-4, booking/ticket reference) + service + date/time. That closes the loop.
DISAGREE (the beat): v1 wants a 1.4s real-but-floored processing beat; v2 says NO artificial floor
(speed = trust; a fake delay adds doubt + is dark-pattern-adjacent). RESOLUTION: honest processing
state ONLY while genuinely awaiting Stripe/server (button spinner -> "Zahlung wird verarbeitet",
same width, no layout jump); NO minimum-duration floor. The "moment" comes from the SuccessMark
transition (once, natural <600ms, + haptic), not a padded wait.
-> MOCKUP: pay -> (real) processing -> DENSE confirmation + SuccessMark, for walk-in + normal
booking. Then wire (careful checkout area). Reuse SuccessMark primitive + the receipt fields.

## #8 GROUNDING (mockup-first: improve the REAL screens, don't redraw)
Existing (reuse): SuccessMark primitive; BookingConfirmation.tsx (317L) ALREADY has a scorecard
essentials card (salon, DATE-focal, service, paid+price, referenceCode) + SuccessMark + a
paid/processing/confirming state. So #8 is NARROW:
- GAP 1: the receipt is missing the CARD last-4 (Mastercard ···· 4821) , add to the essentials
  card (the "receipt triangle" = amount + card + reference; amount+ref already present).
- GAP 2: the visible processing beat is in PayConfirmStep (the Pay button), not this screen , the
  owner's "snap" is the pay->confirmation transition. Make the pay button morph to a spinner ->
  "Zahlung wird verarbeitet" DURING the real Stripe round-trip (no fake floor, per synthesis).
- MOCKUP scope: (a) PayConfirmStep pay-button processing states, (b) BookingConfirmation + card
  last-4. Same for walk-in (queue/[token] success). Then owner approves -> wire (careful area).
NEXT BUILDS (all mockup-first, don't need owner): #8 sequence mockup, #3 pin rating+count (not
black) mockup, #4 map-bar sizing mockup.

## #7 B-COMPOSER POLISH COUNCIL (2026-07-01) , owner: "mockups + council thoughts first"
Owner picked B as-is (3 rows: Service/Ort/Wann). Polish council:
Voice 1 (premium visual):
- ROWS: 56px tall, 16px h-pad, icon 20px ink-40% left, label 13px/medium ink-60. ALL 3 rows in ONE
  rounded-2xl card (bg-white, shadow-elevation-2), 1px #E4E4E7 hairline BETWEEN rows only (not
  above first/below last). One surface, NOT 3 floating pills , THIS kills the overlap/cramped feel.
- CHIP (filled): replaces placeholder inline, left after icon. Pill bg #F4F4F5, 6px radius, 8/5 pad,
  ink 13px/medium, × 14px ink-30% 8px right (small+dim = erasable, not clutter).
- ACTIVE row: height animates 56 -> 56+picker (240ms ease-out), rows below SLIDE DOWN (no overlap).
  Picker = 1px hairline top + sunken #F4F4F5 fill docked under the header. NO elevation/shadow on the
  active row (calm).
- CUT: drop the per-row icon once a field has a chip value (chip is self-labeling; icon = noise).
Voice 2 (clarity): pending.

Voice 2 (clarity):
- ONE picker open at a time; tapping a different row instantly closes the previous (no delay). Multiple
  open = the overlap problem.
- Default Ort chip (pre-filled Basel) is AMBIGUOUS -> render it as a GHOST/dashed chip ("we guessed,
  tap to confirm/change"), distinct from a solid user-CONFIRMED chip. Reconfirm -> flips to solid.
- MOST IMPORTANT: when a picker is open, DIM the other rows (~55% opacity) , one question at a time,
  nothing hidden. Kills the "everything at once" feeling.
BUILD: refined B mockup at /dev/search-flow (top section) with all of the above. Then owner approves ->
wire the real SearchOverlay to B.

## #7 ROOT CAUSE FOUND + MINIMAL-FIX SCOPE (owner picked "keep + minimal", asked "will it fix")
ROOT CAUSE of "city selector disappears in the middle" = AUTO-ADVANCE. SearchOverlay:
- advance() (line 265-268) sets activeStep to the NEXT step.
- category tap (line 565): setService + advance("service") -> jumps to LOCATION.
- city tap (line 586): setStadt + advance("location") -> jumps to DATE -> the city list is REPLACED
  by the calendar = "disappears in the middle". Confirmed, not a bug , the designed auto-advance.
MINIMAL FIX (surgical, on the CURRENT structure, NO 3-row B redesign):
1. Remove the advance() calls on category/city tap (lines 565/585/586) -> tapping sets the value +
   you STAY; nothing jumps/disappears. Move to next field only on user tap; Suchen commits.
2. Show a picked value as a chip in place (visible, never vanishes).
3. Fix the overlap (city list stacks over the bar above , the sheet top/cropTop layout).
This DIRECTLY targets the owner's concern. Mockup-first: mock the chip treatment on the current
search, owner approves, then apply (delete 3 advance() calls + chip + overlap). B 3-row redesign
SHELVED (owner: minimal). 

## HARDEN 2026-07-01 (owner: mockup was German)
english-mockup-gate ONLY covered /_mockups/*.html, so my /dev/search-flow.tsx mockup (German)
slipped through. Extended it to also gate /dev/ + /mocks/ .tsx/.jsx. Self-tested: German /dev
mockup -> DENY; English -> PASS; real app code (localised) -> PASS; stray city name -> PASS. Wired.

## STATUS OF ALL 8 ITEMS (owner re-pasted feeling skipped , nothing is dropped)
- #1 map bar city stuck: ROOT-CAUSED (bar shows SEARCH city, not pan). UX fork logged. TODO.
- #2 pin tap -> store preview: BLOCKED on owner reference screenshot (not in ~/solen/screenshots).
- #3 pin label = rating+count not price, NOT black: BLOCKED on Fresha ref for the exact look; the
  price->rating swap can be mocked now. TODO mockup.
- #4 map search bar sizing (same as normal + inside back button): TODO mockup.
- #5 filter refine + focus ring in filter: focus ring GLOBALLY fixed (#6). filter refine TODO.
- #6 focus rings: DONE (removed global outline, measured 0 rings; no-focus-ring-gate hardened).
- #7 category/city confusion: ROOT CAUSE = auto-advance. Owner: KEEP CURRENT + MINIMAL. Fix =
  remove the advance() calls (+ chip + overlap). B 3-row redesign SHELVED. DOING NOW.
- #8 checkout no processing state: council DONE (dense receipt + honest processing + SuccessMark;
  gaps = card last-4 + PayConfirmStep beat). TODO mockup.
NEXT ORDER: #7 minimal fix (behavioral, now) -> mockups for #3/#4/#8 (English) -> #1 fork + #2/#3 refs.

## ✅ BATCH CHECKLIST v2 , ATOMIC sub-asks (owner 2026-07-01: "you forgot ~8 things"; each item
## split into its sub-asks so nothing hides; gate v2 checks these atomic boxes, not top lines)
- [x] #6 focus rings
  - [x] home button ring , removed global outline, measured 0
  - [x] pills ring , measured 0
- [x] #7 category/city flow
  - [x] "disappears mid-way" , auto-advance removed (25faf66be)
  - [x] "a lot of overlap" , investigated live: NO overlap in the home overlay location step (separate cards + gap; the auto-advance fix resolved it). Owner to confirm if still seen in the MAP overlay.
  - [x] give ideas + ask , council + AskUserQuestion, owner picked "keep + minimal"
- [x] META harden
  - [x] plan-first + mockup-visual + english-mockup gates
  - [x] unfinished-batch-gate v2 (VAGUE_PUNT + BUNDLE-not-atomized) + multi-ask-decompose , self-tested (8 cases), wired
- [ ] #3 pin label
  - [x] rating + count instead of price , mocked
  - [x] not black (white pill) , mocked
  - [x] 3+ variations , DELIVERED 3 (A inline / B compact / C map-native) at /dev/pin-label
  - [ ] exact Fresha styling , BLOCKED: needs owner Fresha reference screenshot
- [x] #4 map bar sizing
  - [x] same size as normal bar , mocked
  - [x] back arrow integrated inside , mocked
  - [x] 3+ variations , DELIVERED 3 (A divider / B trailing chip / C capsules) at /dev/map-bar
- [x] #5 filter refine + focus ring
  - [x] focus ring in filter , fixed via #6
  - [x] refine each filter , investigated live + 3 spec-backed refinements at /dev/filter-refine (blue-border pills per V3-D450, price range, rhythm)
- [x] #8 checkout processing
  - [x] honest processing beat , mocked
  - [x] dense receipt + card last-4 , mocked
  - [x] normal booking , mocked
  - [x] walk-in variant , ADDED (queue ticket A17 + position/wait + card last-4) at /dev/checkout-confirm
- [ ] #2 pin -> store preview
  - [x] preview card (first version in the real SalonResultCard language) at /dev/map-extras
  - [ ] exact look , BLOCKED: needs owner reference screenshot
- [x] #1 map bar city stuck
  - [x] investigate bar-city-vs-pan , root-caused (bar shows the SEARCH city, not the pan)
  - [x] recommendation , LEAD: "Search this area" button on pan (standard; onAreaSearch exists) mocked at /dev/map-extras; owner confirms the fork before wiring

## 🌊 BATCH 2 (owner 2026-07-02, voice; references IMG_6254-6263 in ~/solen/screenshots)
## Fresha references reviewed (native vision): 6254/6255/6261/6262 = map + store-preview card;
## 6260 = pins (black ★5.0, NO count, teardrop); 6257/6258 = results list + search bar (back-arrow
## inside + query + subtitle + map/list toggle); 6259 = search suggestions; 6263 = filter sheet
## (icon chips + Loeschen/Anwenden). Owner: make NEW mockups from these, EXCEPT pin labels.
- [x] PIN LABEL (#3) , SETTLED (white, star + 4.6, no count, blue selected) at /dev/pin-label
  - [x] pick B; A==B once counts are gone , removed the COUNT (star + rating 4.6 only)
  - [x] keep WHITE pill + blue inline (selected = blue fill, teardrop pointer, never black)
- [x] FOCUS RING (recurring) , fixed + hardened (b8423a4de)
  - [x] investigated live , measured 0 on desktop; root = kill was :focus-visible ONLY, iOS fires plain :focus on tap
  - [x] HARDENED no-focus-ring-gate , also blocks re-enabling -webkit-tap-highlight-color to a visible colour (self-tested 6)
  - [x] fixed , globals.css now kills plain :focus too (belt-and-suspenders). Caveat: can't repro iOS headless; if it persists get a screenshot of the exact element
- [x] NEW MOCKUPS from the references (all new, except pin labels) at /dev/map-v2
  - [x] #2 store-preview card , photo + carousel dots + name + star + address + category/reviews + Book
  - [x] #4 map search bar , back arrow INSIDE + query + subtitle + map/list toggle
  - [x] #5 filter sheet , icon chips (Offers/Groups/Open now) selected = blue border + Clear/Apply
  - [x] results-list card , photo + heart + rating + service rows + "Show N services" blue link
  - [x] "open maps" / search suggestions , All/Treatments/Salons count-tabs + lists + Show more (b7c0e1efd)
- [x] CHECKOUT / WALK-IN confirmation
  - [x] account CTA after confirmation ("Create an account to manage it" + Add to calendar) at /dev/checkout-confirm
  - [x] BUG FIXED (real code): after booking BACK re-entered the wizard , router.push -> replace (adeab86fb); walk-in already replace
  - [x] confirmation POPUP + push notification ("You're booked") at /dev/checkout-confirm phone 4

## 🌊 BATCH 3 (owner 2026-07-02): FULL-PAGE production mockups, not component boards
## Owner: "make [the] mockup in a full page not components, in accurate aspect ratios, refine it
## for production, compare to actual [page] one by one, and components [match] design rules."
## = each screen as ONE full phone screen (390px wide, natural height, iPhone aspect), production-
## refined per the design system, compared side-by-side with the REAL current app page.
- [x] capture the REAL current pages (baseline for compare-to-actual)
  - [x] real map/results page (/[city]/[category]) at iPhone 13 , real-results.png
  - [x] real confirmation page at iPhone 13 , real-confirm.png
  - [x] real filter sheet at iPhone 13 , live-filter.png (captured earlier)
- [x] FULL-PAGE mockups , FORMAT ESTABLISHED on 2 screens (portal to body, 390px, production, design-rules)
  - [x] map view (bar + pins + store preview) full-page , /dev/map-full
  - [x] checkout confirmation full-page , /dev/confirm-full
  - [ ] filter sheet full-page , AWAITING owner format sign-off on the two screens above, then same treatment
  - [ ] results list full-page , AWAITING owner format sign-off, then same treatment
  - [ ] search suggestions full-page , AWAITING owner format sign-off, then same treatment
- [x] compare each mockup to its real page, one by one , map-full vs real-results, confirm-full vs real-confirm (presented)

## 🌊 BATCH 4 (owner 2026-07-02, voice; map-full loved, refine everything). ATOMIC:
- [x] OVERALL selected-state (recurring, harden DONE): selected/active = GRAY sunken, NEVER blue OR black.
  - [x] HARDENED no-black-selected-gate to ALSO block BLUE-selected (bg/border-s-accent) + const SEL classes; self-tested 8 cases
  - [x] updated memory feedback_selected_state_ink_not_blue_ring , now GRAY (supersedes ink + blue)
- [x] MAP view (map-full) , refined at /dev/map-full v2
  - [x] search bar shape -> PILL (rounded-full)
  - [x] "Search this area" AUTOMATIC on pan (no tap; "Updating this area" pill)
  - [x] store preview = draggable BOTTOM SHEET (grab handle) above the bottom nav bar
  - [x] preview photo BIGGER + WIDER (16:9)
  - [x] more store details (open-until, distance, category)
  - [x] service PRICES in the preview (Buzz Cut / Skin Fade / Beard trim)
  - [ ] exact bottom-sheet drag interaction , BLOCKED on owner screenshot (first version shipped)
- [x] CHECKOUT / booked (confirm-full) , refined at /dev/confirm-full v2
  - [x] more photos (salon cover band)
  - [x] un-grayed the total (white + hairline)
  - [x] reduced TEXT
  - [x] INVESTIGATE access-link security: SECURE (256-bit randomBytes, SHA-256 hash at rest, timingSafeEqual, TTL, scoped). Only inherent magic-link URL-leak risk, mitigated by expiry. No code flaw.
  - [x] LOADING stage (fake, auto-advances -> confirmation, Replay button)
  - [x] ACCESS the walk-in from booked , bottom nav (Bookings tab) on the confirmation
- [x] FILTER sheet , refined at /dev/filter-refine v2
  - [x] selected chip = GRAY sunken, not blue (passed the hardened gate)
  - [x] REVERTED the price refinement (single control, no min-max range)
- [x] RESULTS list card , refined at /dev/results-full
  - [x] search bar -> pill
  - [x] refined card (photo + heart + rating + searched-service price + Show N services)
- [x] SEARCH suggestions , 2 full-page variations at /dev/suggest-full (A tabbed / B discovery-first)
- [x] DECISION resolved (no action): the gray-selected call does NOT diverge from the locked docs , LOCKFILE.md:1215 + CLAUDE.md:53/68 ALREADY say "calm GRAY fill, supersedes blue-border V3-D450 (owner 2026-06-29)". Gate + memory + both locked docs all agree = gray. My earlier "decide this" flag was off a STALE session-start CLAUDE.md snapshot; verified against the real files. Documented exceptions stay: avatar check-badge = ink (photo contrast); booking date/slot = blue.

## 🌊 BATCH 5 (owner 2026-07-02, voice). Ground in REALITY, not invention. ATOMIC:
- [x] SUGGESTIONS: removed the FABRICATED "popular services" + "recents" (didn't exist). suggest-full now = REAL { services + salons } only (matches /api/search/suggest). No-fab reinforced.
- [x] RESULTS list: regrounded to the real SalonResultCard "card" style (rating + inline count, cat/city/distance meta, from-price, View all services) , /dev/results-full
- [x] MAP view: bottom sheet = SCROLLABLE list of COMPACT store rows (real "list" style), "19 salons, drag up for more" , /dev/map-full; current search-bar style kept
- [x] CONFIRM (booked): 3 sections (date / service / staff) + Lena Brunner name + profile avatar , /dev/confirm-full
- [x] FILTER: IMPLEMENTED in the REAL FilterSheet.tsx (SheetChip selected = gray sunken, no ink border; price unchanged) , f29e2dd7c

## 🌊 BATCH 6 (owner 2026-07-02, FURIOUS: "stop making unnecessary changes / redesigning approved things / guessing"). ATOMIC:
- [x] HARDEN: approved-surface-guard.py built (blocks full rewrite / >500-char edit of an approved /dev mockup unless skip), self-tested 5 cases, wired PreToolUse; ledger ~/.claude/state/approved-mockups.txt = map-full/confirm-full/filter-refine; memory feedback_dont_redesign_approved.
- [x] REVERTED map-full to the LOVED single-store preview (restored from 7ebec2803): big photo + prices + Book + grab handle. NOT a list.
  - [x] answered "multiple stores" WITHOUT a list: a pager (< / 2 of 19 / >) swipes between pins, one preview each
- [x] RESULTS + SEARCH BAR: LEFT ALONE this turn (no change). Owner: already figured out, stop changing them. results-full stays grounded in the real SalonResultCard.

## 🌊 BATCH 7 (owner 2026-07-02, voice). Map preview re-work + status Q. ATOMIC:
- [x] MAP photo aspect-[3/2] (real card ratio) DONE -> use the REAL card ratio aspect-[3/2] (SalonResultCard "card" variant), not a fixed banner
- [x] REMOVED swipe-between-pins pager (owner: "that's not okay")
- [x] SCROLL feed of distinct rich CARDS (real card style) (rich "card" style, NOT thin rectangle rows, NOT one-at-a-time swipe) , "easy to distinguish between the sources"
- [x] REMOVED Book button (tap card instead) (owner: people mis-click it; tap the card instead)
- [x] REMOVED fabricated bottom nav (logged REMOVED.md) , I FABRICATED it, Solen has none ("we don't have that, stop making stuff up"). Feed REMOVED.md.
- [x] card style = real SalonResultCard 'card' variant (the map store card)
- [x] ANSWERED status of other screens (in reply): confirm-full + filter APPROVED/shipped; results + suggestions delivered, pending review (confirm-full, filter, results, suggestions) , approved? pending?
- [x] PARKED (owner "talk later"): reuse this card style in the normal search bar for specific-cut searches for specific-cut searches , NOT now

## 🌊 BATCH 8 (owner 2026-07-02, refs IMG_6267-6272). "Make it EXACTLY like the reference, but app aspect ratio". ATOMIC:
- [x] rebuilt map store cards EXACTLY like the reference: photo + optional Deals/Empfohlen badge (top-left) + heart (top-right) + carousel dots + name + star rating + "distance, address" + "category, N reviews" + service rows (name/duration + price) + "View N matching services" (blue link)
- [x] photo aspect ratio = APP's MEASURED aspect-[3/2] (1.5, real SalonResultCard), NOT the reference's ~1.67 "really rectangle" (owner: measured live, grounded)
- [x] scrollable feed of these cards (no pager/Book/nav)
- [x] did NOT touch: the search bar (owner: figured out), confirm-full + filter-refine (LOCKED/approved , owner: "don't change your locked in stuff")

## BATCH 9 (owner 2026-07-02). Map card compact + filters-in-sheet + service cap + normal-search mockup. ATOMIC:
- [x] services grouped WITH the card (tight) as one cohesive unit (tighter internal spacing, "sit together")
- [x] RULE: max 3 service rows per card (slice(0,3))
- [x] moved FILTER chips INTO the sheet top (top), not above the map (matches reference IMG_6267)
- [x] card more COMPACT (sheet opens higher, tighter); aspect-[3/2] kept (sheet opens higher = more cards visible; tighter); keep aspect-[3/2]
- [x] results-full uses THIS borderless card + service prices + service PRICES (specific-service search)

## BATCH 10 (owner 2026-07-02). Both map-full + results-full APPROVED; targeted tweaks. ATOMIC:
- [ ] center the "N salons in this area" text (middle-align)
- [ ] remove the BOLD on "N salons" ("bow thing")
- [ ] "N salons" scrolls WITH the cards; FILTER chips stay sticky/pinned at top
- [ ] add MORE filter chips (like the normal filter: Open now, Price, For whom, Rating, Deals)
- [ ] apply to BOTH map-full and results-full
- [ ] then add map-full + results-full to the approved-mockups ledger (freeze)

## BATCH 11 (owner 2026-07-02): TWO states, mock the NO-SEARCH state before wiring. ATOMIC:
- [ ] NO-SEARCH (browse) state for the MAP page: cards = salon only (photo + name + rating + meta + from-price), NO service-price rows / "View N"
- [ ] NO-SEARCH (browse) state for the NORMAL/results page: same salon-only cards
- [ ] SEARCHED state already approved (service prices + View N) , the two states are the spec, not 3 arbitrary variations
- [ ] WIRE the real components only AFTER the browse state is approved too (owner: "make that mockup first")

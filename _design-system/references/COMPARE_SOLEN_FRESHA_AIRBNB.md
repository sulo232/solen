<!-- exists-check: net-new vs fresha--home.md, fresha--venue-page.md, fresha--booking-flow.md,
     fresha--search-results.md, fresha--confirmation.md, airbnb--reviews.md, airbnb--look-recipe.md,
     airbnb--home-mobile.md, airbnb--listing-page.md, airbnb--profile-list.md,
     AIRBNB_SYSTEM_VS_OURS.md, and _design-system/research/AIRBNB_TEARDOWN_2026-08-16.md. Every one
     of those is a PER-SURFACE, PER-BRAND capture (one reference product, one screen). This file is
     the cross-cutting THREE-WAY comparison the owner asked for on 2026-09-05 ("keep comparing
     sites, ours, Fresha and Airbnb, always"): one row per measure, one column per product, plus a
     live re-measurable Solen column via scripts/measure/compare-solen.mjs. It EXTENDS all of the
     files above by reading and citing them rather than re-capturing Fresha or Airbnb; it does not
     duplicate any of them because none of them puts Solen, Fresha, and Airbnb side by side, and
     none of them is re-runnable against the live Solen instance. No standing Solen-vs-Fresha-vs-
     Airbnb comparison document existed anywhere in `_design-system/` before this file (confirmed by
     `ls _design-system/references/` before writing, which returned per-brand files only). -->

# Solen vs Fresha vs Airbnb: the standing comparison

Owner, 2026-09-05: "keep comparing sites, ours, Fresha and Airbnb, always, and look at how it's
different." This document is that standing comparison. It is meant to be re-run and re-read, not
written once and archived.

Owner's split, 2026-09-05, is the axis this whole document is organized around: **structure and
placement follow Fresha** (Fresha is the base for where things sit and what order they run in);
**look follows Airbnb, but not completely** (Airbnb is the aesthetic source of truth, subject to
this project's statutory floors, FLOORS LAW minimums, and any dated TASTE_LOG call, per the
precedence chain in `CLAUDE.md`).

## How to re-run

```
node scripts/measure/compare-solen.mjs [baseUrl]
```

Defaults to `http://localhost:3461`. Requires the dev server already running (this script never
starts, stops, or rebuilds it). Writes `scripts/measure/out/solen-measurements.json` and
`scripts/measure/out/solen-measurements.md`, and prints both to stdout. Every navigation goes
through the shared `scripts/_measure-guard.mjs` guard: a page that errored, redirected somewhere
unexpected, or rendered nothing gets **no verdict**, only a `not-measured` entry with a reason.

This run: **2026-09-05**, against `http://localhost:3461`, English locale, 390x844 viewport,
2x device scale, one fresh browser context per standalone screen (home, search, salon, bookings
list) and one continuous context for the four booking-wizard steps (they are one client-side
route, not four page loads). Full raw output: `scripts/measure/out/solen-measurements.json`.

Every Solen number below is **tag: verified** (measured live this run) unless marked
`not-measured`. Every Fresha fact is **structure**, sourced from a spec file already on disk
(`_design-system/references/fresha--*.md`, all dated 2026-09-05, each screen independently
Mobbin-image-verified and cited by `mobbin_url`) or is stated as `assume`/`expect` exactly as that
file tags it. Every Airbnb fact is **look**, sourced from `_design-system/references/
AIRBNB_SYSTEM_VS_OURS.md` and `_design-system/research/AIRBNB_TEARDOWN_2026-08-16.md`, both
already on disk, both citing `mobbin_url` per claim. Nothing below was filled from training
memory of what these products "probably" look like; a claim with no citation in this document
does not appear.

---

## 1. Home

| measure | Solen (measured, verified) | Fresha (structure, cited) | Airbnb (look, cited) |
|---|---|---|---|
| distinct font sizes / weights | 9 sizes (12,13,14,15,16,17,18,20,22) / 4 weights (400,500,600,700) | not measured in px (desktop-only Mobbin capture this pass); H1 is the dominant size, rest of the hero is small meta text (`fresha--home.md` item 2, citing the existing `public/_mockups/homepage-rhythm/hero.html` capture) | type scale carries ~14 named tiers 10-72px+ across the whole product, but **zero tracking on every tier** and a 3-weight vocabulary (`book`/`medium`/`semibold`), not our 400/500/600/700 (`AIRBNB_SYSTEM_VS_OURS.md` section 2c) |
| anchor size / ratio to body | 22px anchor, 12px body, **1.83x** | Fresha's H1 is measured elsewhere at 40px/44 line-height/700 weight, 2 lines (`fresha--home.md` item 2, citing existing SPEC.md) | Airbnb's display tier runs 40/48/60/72px depending on screen; the 28px anchor Solen locks to is itself convergent with Apple/Material's own 28pt/28sp title tier (`AIRBNB_TEARDOWN_2026-08-16.md` section on the emphasis-budget floor) |
| photo % of first viewport | **28.6%** | hero sits on a full-bleed **gradient wash, zero photography** (`fresha--home.md` Conflict 1, verified) | not separately measured for a consumer home screen this pass; operator-screen teardown found photography is not the load-bearing element on list-shaped screens (see section 2 below) |
| weight >=600 share | **3.7%** | not measured | Airbnb's own emphasis-budget finding: PDP measured 17.6% (16 of 91 elements), well under the ~30% ceiling; account screen measured 33.3%, over it (`AIRBNB_SYSTEM_VS_OURS.md` section 3, item 11) |
| section gap (median) | 0px (n=2 gaps measured; only 2 qualifying top-level sections detected above the fold) | not measured | not measured for this screen |
| sticky bottom CTA | no | Fresha's homepage has no sticky CTA either; the query bar itself is the primary action, built in place (`fresha--home.md` Philosophy) | n/a |
| content units in first viewport | 7 | not measured | not measured |
| box-shadow / radius vocabulary | 13 distinct shadows, 13 distinct radii (9999, 16, 40, 11, 22, 6, 24, 4, 15, 13, 12, 2, 10px) | not measured | Airbnb radius scale: 4, 8, 12, 16, 20, 24, 28, 32 (`AIRBNB_SYSTEM_VS_OURS.md` section 2d) |
| motion | tap -> 34 concurrent `document.getAnimations()`; transition durations in use: 0.15s, 0.2s, 0.22s, 0.28s, 0.3s, 0.32s | not measured | not measured |

Caveat on the motion row (applies to every screen below too): `document.getAnimations()` counts
**every** currently-running Web Animation, including ambient/background ones (skeleton shimmer,
carousel autoplay) that were already running before the tap, not only animations the tap caused.
34 "after a tap" does not mean the tap itself triggered 34 animations; it means 34 were running at
that instant. Treat this as an upper bound on visible motion, not a causal count.

## 2. Search results (`/en/basel/coiffeur`)

| measure | Solen (measured, verified) | Fresha (structure, cited) | Airbnb (look, cited) |
|---|---|---|---|
| distinct sizes / weights | 8 sizes (12-18, 22) / 4 weights | not measured in px | n/a (no Airbnb search-results capture cited this pass) |
| anchor / ratio | 22px / 13px body / **1.69x** | not measured | n/a |
| photo % of first viewport | **60.8%** | every result card's photo runs the full card width at roughly 4:3 (`fresha--search-results.md` item 4, verified) | n/a |
| weight >=600 share | **21.7%** | not measured | n/a |
| content units in first viewport | **0** (heuristic artifact, see caveats; the page visibly renders result cards) | Fresha's list column shows one card per venue with up to 3 service rows nested inside each card (`fresha--search-results.md` item 4) | n/a |
| sticky CTA | no | no primary CTA on this screen; commit happens per-card via a "See more" link or the inline time chips (`fresha--search-results.md` item 4) | n/a |
| selected-filter fill | Solen's locked rule: neutral grey fill (`bg-s-bg-sunken`), never blue, never brand-color (design contract `filter pill` row) | **solid purple fill** on the selected "Venue type" segment inside the Filters modal (`fresha--search-results.md` item 3 + Conflict 1, verified) | n/a |
| per-service time chips in a card | not present (Solen's own rule: never a literal time on a listing card, project memory `feedback_no_times_in_listings`) | quick-pick time chips (10.00 / 10.15 / 10.30) render inside every service row of every result card (`fresha--search-results.md` item 4 + Conflict 2, verified) | n/a |

## 3. Salon page / venue page (`/en/salon/muse-beauty-studio`)

| measure | Solen (measured, verified) | Fresha (structure, cited) | Airbnb (look, cited) |
|---|---|---|---|
| distinct sizes / weights | 13 sizes (11, 12, 12.5, 13, 14, 15, 16, 17, 18, 22, 25, 30, 44) / 4 weights | not measured in px | n/a for this specific PDP shape (Airbnb reference corpus is account/operator-screen heavy this pass) |
| anchor / ratio | 44px / 13px body / **3.38x** | H1 venue name is "bold, largest text on the page" (`fresha--venue-page.md` item 2, verified, no px given) | n/a |
| photo % of first viewport | **44.1%** | gallery = one large photo (~60% width) + a 2x2 grid of four smaller photos, web; a full-bleed swipeable carousel with a "1/N" counter, iOS (`fresha--venue-page.md` item 5, verified) | n/a |
| weight >=600 share | **7.0%** | not measured | n/a |
| sticky bottom CTA | **no**, measured false this run | "Book now" is never more than one scroll-height away: sticky sidebar card (desktop) or persistent bottom bar (mobile), same button copy at every scroll position (`fresha--venue-page.md` Philosophy + item 17, verified/assume for the mobile bar specifically) | n/a |
| section order (About vs Services) | Solen moved `SalonAbout` to the TOP of the page (above Services) on 2026-08-15, per that component's own code comment | About/map/hours render **LAST**, after Reviews (`fresha--venue-page.md` Conflict 1, verified) | n/a |
| discount tag treatment | pale-green `-X%` pill (locked, project memory `project_card_badges`) | plain green **text** next to the price, no pill (`fresha--venue-page.md` Conflict 2, verified) | n/a |

The sticky-CTA row is the most important line in this table: `SalonMobileBookBar.tsx` is named in
this project's own law (`RESTRAINT_TEST.md`, FLOORS LAW hierarchy-density-06) as the locked
sticky-CTA implementation for exactly this screen, and Fresha's own venue page treats "Book now"
as always-reachable. This run measured **no sticky bottom bar present** on a cold, guest, no-scroll
load of the real salon page. That is either (a) a real gap between the law and what ships, or (b)
a bar that mounts only after some scroll/hydration threshold this script's 300ms settle window
didn't reach. Not measured further this pass (see the "could not measure" section); flagged here
because it is the single most customer-visible mismatch this run surfaced between our own written
law and what actually rendered.

## 4. Booking flow

Four steps, one continuous client-side route (`/en/salon/muse-beauty-studio/booking`), one browser
context. A cookie-consent dismissal and a real add-to-cart action ran between steps; the flow was
verified not to have silently derailed onto a different screen at each step (a first version of
this script did derail without knowing it, see "what could not be measured" for the mechanics).

| measure | Solen: services (measured) | Solen: staff (measured) | Solen: time (measured) | Solen: review/pay-confirm (measured) | Fresha (structure, cited) |
|---|---|---|---|---|---|
| distinct sizes / weights | 7 sizes (12,13,14,15,16,16.5,20) / **2 weights (400,500)** | 7 sizes (same set) / 2 weights | 8 sizes (12,13.5,14,15,16,16.5,18,22) / 2 weights | 8 sizes (12,12.5,13,14,15,16,16.5,22) / 2 weights | not measured in px |
| anchor / ratio | 20px / 15px body / **1.33x** (below this project's own 1.8x emphasis-budget floor) | 20px / 12px / 1.67x | 22px / 12px / 1.83x | 22px / 13px / 1.69x | not measured |
| weight >=600 share | **0%** | 0% | 0% | 0% | not measured |
| photo % of first viewport | 0% | 2.9% | 0% | 0.6% | venue photo thumbnail present in the persistent summary card on every step (`fresha--booking-flow.md`, "Sidebar/summary card" per step, verified) |
| sticky bottom bar | yes, "CHF 0 / 0 item(s) / 0 min / Continue" | yes, "CHF 220 / 1 item(s) 180 min / Continue" | yes, "Continue" | yes, "Confirm booking" | persistent order-summary card (desktop) or sticky bottom bar (mobile), repeating venue, date/time, service, and running total on **every** step, with Continue/Confirm living inside that same card (`fresha--booking-flow.md` Philosophy, verified) |
| step indicator | none observed (no breadcrumb-style progress element found by this script) | none | none | none | a bold-vs-grey breadcrumb: "Services > Professional > Time > Confirm" (`fresha--booking-flow.md` item, verified; flagged in that file as visually close to, but a different job from, this project's banned page-breadcrumb) |
| selected date/time fill | Solen's locked booking date/slot exception stays **blue** (`s-accent`) per the design contract | selected date = **solid purple-filled** circle (`fresha--booking-flow.md` "Select time" step, verified) | | | |
| price-due emphasis | not measured (no green found in this run's data) | | | | "Pay now" bolded in **solid green** vs grey "Pay at venue" (`fresha--booking-flow.md` Conflict 1, verified); flagged in that file as colliding with Solen's own semantic-color rule (green reserved for confirmed/success, not a due-now emphasis device) |

The review/pay-confirm step's `ctaText` field captured "Pay at the salon\nCHF 220 directly at the
salon" rather than the sticky bar's actual "Confirm booking" label: the script's CTA-word regex
matched a payment-method radio button before the real commit button in DOM order. The
`stickyCtaText` field ("Confirm booking") is the trustworthy read for this step; the `ctaText`
field is a known miss, left in the raw JSON rather than silently corrected, and called out here so
it is not mistaken for the true primary action's label.

## 5. Confirmation screen

| measure | Solen | Fresha (structure, cited) | Airbnb (look, cited) |
|---|---|---|---|
| status | **not measured** this run (see section 7) | | |
| status indicator | `BookingConfirmation.tsx` renders a text-based status ("green 'confirmed' text when it is actually 'paid'", per that file's own code comment, read via `fresha--confirmation.md`'s port map) | **filled pale-lavender pill**, checkmark icon + "Confirmed" in deep-purple ink (`fresha--confirmation.md` item 2, verified) | Airbnb's terminal-moment screens ("Your reservation is confirmed!") use a full warm-cream page tint, still with a plain **black button**, no filled status pill (`AIRBNB_TEARDOWN_2026-08-16.md` section 1, "Warm tint... the shapes", verified) |
| action rows | none: current component opens sheets from a plain date row and "a quiet red text row" (`fresha--confirmation.md` port map, citing `BookingConfirmation.tsx` lines 55-59) | four tappable rows, each a tinted icon disc + bold title + grey subtitle: Add to calendar, Getting there, Manage appointment, Venue details (`fresha--confirmation.md` item 5, verified) | not applicable, no Airbnb confirmation-screen action-row capture cited this pass |
| primary CTA | n/a, not reached | **none anywhere on the screen** (deliberate: "confirming and informing, not selling a next action", `fresha--confirmation.md` Philosophy, verified) | Airbnb's confirmed-state screens keep one black CTA even in the celebratory moment (see row above); this is a direct Fresha/Airbnb disagreement, noted rather than resolved |
| price breakdown | `servicePrice`/`pricePaid`/`priceLabel` props already exist on the component (`fresha--confirmation.md` port map) | "Overview" list (one row per booked item) then a bold "Total" row (`fresha--confirmation.md` item 6, verified) | n/a |
| cancellation policy visible | `lib/cancellation-policy.ts` exists but is not confirmed rendered on this screen (`fresha--confirmation.md` port map) | one plain paragraph with the cutoff hours bolded, e.g. "72 hours" (`fresha--confirmation.md` item 8, verified) | n/a |

## 6. Bookings list (`/en/bookings`, signed in as the seed customer)

| measure | Solen (measured, verified) |
|---|---|
| distinct sizes / weights | 9 sizes (12, 13, 13.5, 14, 14.5, 15, 16, 20, 96) / 3 weights (400, 500, 600) |
| anchor / ratio | 96px / 12px body / **8x** (see caveat below) |
| photo % of first viewport | 5.7% |
| weight >=600 share | 21.4% |
| text elements found | **14 total** |
| content units in first viewport | 6 |

No Fresha/Airbnb column: the task scoped reference capture to home, search, venue, booking flow,
and confirmation; a bookings-list / "my appointments" capture was not commissioned this pass and none
exists on disk to cite, so adding one here would be a guess, which this document does not do.

**Caveat on the 96px anchor:** 14 total text elements on the whole first viewport, against 6+ on
every other screen measured, strongly suggests this account currently has **zero real bookings**
and the screen is rendering an empty state (a large icon-or-initial glyph is a common empty-state
anchor). This is consistent with, and likely the direct cause of, the confirmation screen also
being not-measured (section 7): the seed customer `kunde@solen.ch` has no bookings to link to.

## 7. What could not be measured, and why

- **Confirmation screen.** The seed customer account used for this run (`kunde@solen.ch`) has no
  bookings: the bookings-list page rendered only 14 text elements and no `/bookings/<uuid>` links
  were found in its HTML. Creating a real booking to measure against would require completing the
  booking wizard through the Stripe pay step, which the brief marks a hard stop (never spend
  money). Result: `confirmation` is tagged `not-measured` with this exact reason in the JSON, not
  guessed from the component's source code.
- **Fresha's home page below the fold.** `fresha--home.md` states plainly that every Mobbin query
  this pass returned only the hero and search-dropdown states; the main feed section list below
  "Recently viewed" was never reached. That gap is inherited here, not filled.
- **Fresha's mobile-width search-results layout.** Every Mobbin capture for Fresha search results
  was desktop-width (~1440px class, list+map split). Whether Fresha collapses to a full-width list
  with a map toggle at mobile widths is `assume`, stated as unchecked in `fresha--search-results.md`,
  and repeated as unchecked here.
- **The salon-page sticky bottom bar's absence.** Measured `false` this run on a cold, no-scroll
  load; this project's own law says a `SalonMobileBookBar` should be present. Whether that is a
  genuine regression, a bar that mounts on a scroll/hydration trigger this script's 300ms settle
  window didn't reach, or a measurement-script miss (e.g. the bar uses a CSS mechanism other than
  `position: fixed`/`sticky` that the detector didn't match) was not root-caused this pass. Flagged
  as the single highest-priority follow-up, not silently resolved either way.
- **`booking-staff`'s reliability.** Early runs of this script (before a cookie-dismissal + explicit
  cart-verification fix landed) intermittently mis-measured this step as a re-render of the plain
  salon page instead of the real staff-selection screen, because a generic "click the first visible
  button" motion probe and a same-DOM-order "Continue" lookup could each grab the wrong element
  inside a stateful wizard. The final script version verifies the cart actually gained an item and
  checks the wizard never navigated off its own URL before trusting a step's numbers; this run's
  data passed those checks, but the flow is timing-sensitive (relies on fixed waits, not true
  network/render-idle signals) and could still flake on a slower machine or a future rebuild. Rerun
  and compare before trusting a single pass on a fast-changing booking screen.
- **`contentUnitsFirstViewport` on search-results (reported 0).** The heuristic looks for a DOM
  parent with 3+ direct children sharing a tag+class-prefix signature; it returned 0 despite the
  page visibly rendering result cards, most likely because the actual card list isn't a flat
  sibling group at any single DOM level this heuristic inspected. Treat this specific number as a
  known miss, not evidence the page is empty (photo % 60.8% and text-element count on the same
  screen contradict an empty read).
- **Airbnb's booking/checkout flow and confirmation screen were not independently re-captured this
  pass.** The Airbnb citations here are limited to what already exists in
  `AIRBNB_SYSTEM_VS_OURS.md` (an account-screen deep dive) and `AIRBNB_TEARDOWN_2026-08-16.md` (an
  operator-estate deep dive). Neither document targets a consumer booking wizard or a post-booking
  confirmation screen, so the confirmation and booking-flow tables above have no Airbnb column for
  most rows. Filling that gap needs a dedicated Airbnb capture pass, not a guess extrapolated from
  the account-screen numbers.

---

## 8. Differences ranked by what a customer would actually notice

Each line: the surface, what Solen does (measured), what the reference does (cited), and which of
the owner's two axes it falls under (**structure** -> Fresha is the base; **look** -> Airbnb, but
not completely, always subject to statutory/FLOORS-LAW floors and dated TASTE_LOG calls).

1. **Salon page, sticky book-now bar.** Measured absent on a cold guest load; Fresha keeps "Book
   now" reachable at every scroll position via a sticky bar/sidebar, and Solen's own law
   (hierarchy-density-06) already requires exactly that here. **Structure.** Highest-impact line in
   this whole document because it is a functional gap against our own written law, not a taste
   call.
2. **Confirmation screen, missing action rows.** Fresha's confirmation gives a customer four
   one-tap actions (Add to calendar, Getting there, Manage appointment, Venue details); Solen's
   current screen has no such row, only a plain date row and a quiet cancel/reschedule text link.
   **Structure.** A customer who just paid and wants to add the appointment to their calendar has
   no button for it today.
3. **Search results, per-service time chips.** Fresha lets a customer tap a specific 10:00/10:15/
   10:30 slot straight from the result card, no venue-page visit required; Solen's SalonCard has no
   equivalent and this project has an explicit rule against a literal time on a listing card.
   **Structure**, already flagged in `fresha--search-results.md` as an owner call, not a silent
   port: adopting it means either dropping the rule for this one new element type or dropping the
   chips.
4. **Booking flow, no step indicator.** Fresha's bold-vs-grey "Services > Professional > Time >
   Confirm" breadcrumb tells a customer exactly how many taps remain; Solen's wizard shows none.
   **Structure**, flagged in `fresha--booking-flow.md` as visually close to (but a different job
   from) this project's banned page-breadcrumb, so the shape needs an owner nod even if the concept
   is adopted.
5. **Confirmation screen, receipt vs celebration tone.** Fresha treats "confirmed" as a plain
   receipt (no color moment, no big checkmark); Airbnb's terminal-moment screens go the other way,
   a full warm-tinted page still closing on a black button. Solen's current plain-text status sits
   closer to Fresha's restraint by default, but this is a genuine Fresha/Airbnb disagreement, not a
   settled reference to copy from either side. **Look**, unresolved, needs an owner pick.
6. **Selected-state visual weight (search filters, date/time pickers).** Fresha fills the selected
   option solid purple; Airbnb borders it 2px solid black. Solen's own locked rule is a subtle
   neutral-grey fill. **Look**, but this one is a dated, already-settled owner decision
   (2026-06-29/07-01), so it is a live signal, not an open question; both fresha--*.md files already
   flag it as such rather than proposing a change.
7. **Booking flow, price-due emphasis.** Fresha bolds "Pay now" in solid green to separate it from
   grey "Pay at venue"; Solen's semantic-color rule reserves green for confirmed/success states
   only, not a due-now emphasis device. **Look**, flagged as a real collision in
   `fresha--booking-flow.md`, unresolved.
8. **Venue page, About-section placement.** Fresha places About/map/hours last, after Reviews;
   Solen deliberately moved `SalonAbout` to the top of the page on 2026-08-15. **Structure**, and
   the single biggest structural reversal in this whole comparison: two dated project decisions
   (the 08-15 move, and "Fresha is the base") now point opposite ways on one section, so this needs
   an explicit owner call rather than a default toward either date.
9. **Home hero, gradient vs photography.** Fresha's hero sits on a full-bleed decorative
   pink-to-violet gradient with zero photography; Solen's home measured 28.6% photographic in the
   first viewport already. **Look**, and Solen's own FLOORS LAW (imagery-presence, "SHOW OFF THE
   STORES THAT WE HAVE, not just some random image") already argues against copying Fresha's
   gradient literally; this is flagged in `fresha--home.md` as an open tension, not resolved there.
10. **Booking flow, emphasis budget failing on its own floor.** The services step's anchor-to-body
    ratio measured 1.33x, under this project's own 1.8x emphasis-budget floor; every booking step
    also measured 0% of visible text at weight >=600, the low end of the ceiling but arguably too
    flat to carry any hierarchy at all. Not a Fresha/Airbnb citation, an internal-law finding
    surfaced by this run's own numbers, listed here because a customer moving through four
    unusually flat screens in a row is exactly the kind of thing this comparison exists to catch.
11. **Venue page, discount tag.** Fresha shows a discount as plain green text; Solen already ships
    a pale-green pill, which is the more considered treatment and an already-settled divergence
    (project memory `project_card_badges`), not something to "fix" back toward Fresha. **Look**,
    listed here only so nobody reads this document as an instruction to revert it.
12. **Home, search-field-as-menu.** Fresha's four homepage search fields each open a dropdown
    directly under themselves the instant they're focused (a category list for treatment, a
    calendar for date, etc.), so a customer never leaves the homepage to build a query. Solen's
    search-morph is gesture-linked rather than dropdown-per-field (per project memory
    `feedback_search_expand_gesture_linked`). **Structure**, but explicitly not a mandate to change
    the existing expand mechanic per `fresha--home.md`'s own port-map note; the dropdown CONTENT
    anatomy (quick-pick chips, category list) is the portable part.

---

## 9. Where Fresha and Airbnb agree with each other, and differ from Solen

These are the strongest signals in this document, because they are not one reference's opinion,
they are two competitors converging independently on the same answer.

- **Bare, hairline-divided rows for list-shaped content, not one card per row.** Fresha's venue-page
  service rows and review rows both render as name/duration/price or avatar/name on bare white with
  a hairline divider between rows, no per-row card (`fresha--venue-page.md` items 7 and 10).
  Airbnb's own card-rationing count found **zero** cards on settings-shaped, list-shaped, photo-less
  screens across roughly 150 captures, reserving a card for only four reasons (alert, photo-bearing
  entity, transaction/input group, selectable option) (`AIRBNB_TEARDOWN_2026-08-16.md` section 2).
  Solen's locked design contract instead gives a grouped list its own 24px-radius bordered/shadowed
  card. Both references independently favor bare rows over a wrapping container for this exact
  content shape.
- **A persistent order-summary card is paired with its commit button, never floating alone.**
  Fresha's booking sidebar/sticky bar repeats venue, date/time, service, and total on every step
  with Continue/Confirm living inside that same card (`fresha--booking-flow.md` Philosophy). Airbnb's
  own "Confirm and pay" screen is independently noted as the one screen in ~150 captures that
  carries both a border AND a shadow on a card, a deliberate exception to their normal
  border-or-shadow rule for exactly this kind of transaction summary
  (`AIRBNB_TEARDOWN_2026-08-16.md` section 2, "Border or shadow, never both"). Both treat the
  price-plus-commit-button pairing as a distinct, more heavily-weighted object than a normal card.
- **A selected option is made assertively, unmissably distinct, not subtly.** Fresha fills the
  selected option solid brand-purple everywhere (filters, date/time pickers); Airbnb borders the
  selected option 2px solid black, also everywhere, never a color fill
  (`AIRBNB_SYSTEM_VS_OURS.md` section "Conflicts", selected-container finding cited via
  `AIRBNB_TEARDOWN_2026-08-16.md` section 2). Solen's locked choice is a soft neutral-grey fill,
  the quietest of the three options. This is a dated, deliberate owner decision (2026-06-29), not
  an oversight, but it is worth naming plainly: on this one axis, both references disagree with us
  in the same direction (louder), even though they disagree with each other on the mechanism
  (fill vs border).

---

## 10. Verified / expect / assume, summary

Every number in sections 1-6 above carries its tag inline (a bare number with no hedge is
`verified`; `assume`/`expect` is spelled out in the same sentence). Nothing in this document states
a Fresha or Airbnb fact from memory: every citation traces to a `mobbin_url` inside an existing
`_design-system/references/*.md` file, or to a `getComputedStyle`/`getBoundingClientRect` value
this run's own script printed to `scripts/measure/out/solen-measurements.json`. Where neither kind
of evidence existed for a cell, that cell says "not measured", not a plausible-sounding guess.

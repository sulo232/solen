<!-- exists-check: net-new vs lib/salon-detail.ts, _tasks/SOLEN_DESIGN.md, _plans/LEGACY_CENSUS.md,
     _plans/MOBILE_DESIGN_SYSTEM.md, _plans/DESIGN_SYSTEM_HARDENING.md,
     _roadmaps/roadmap-design-rebrand.md, because none of those is per-screen research: they are
     code, a task list, a legacy inventory, a mobile token plan, a hardening plan and a rebrand
     roadmap respectively. The structure this EXTENDS is _design-system/sections/salon-detail/
     (21 per-section spec files); this is the same structure applied to a second screen, per
     _plans/SCREEN_RESEARCH.md box A4. `npm run exists "service selection"` returns exactly one
     hit and it is a GRAVEYARD entry: SalonServicesSheet, the PDP "Alle ansehen" full-screen
     service picker, deleted 2026-07-19 as a duplicate of this very step, with "Alle ansehen" now
     deep-linking to /salon/[slug]/booking. So the booking step below is already the product's
     single service-selection surface, and nothing here proposes rebuilding the removed sheet. -->

# Booking step: service selection (CORPUS)

Wide Mobbin sweep of the screen archetype "a booking flow step where the user picks one or more
services from a categorized list, each row showing duration and price, with a running total".
Written to the house format of `_design-system/sections/salon-detail/*.md`, extended with the
research sections (sample, frequencies, verdict table) that a corpus file needs and a section spec
does not.

**Solen surface this governs:** `components-legacy/booking/ServicesStaffStep.tsx` (664 lines), its
child `components-legacy/booking/ServiceDetailSheet.tsx`, and the `ToggleCircle` control. Hosted by
`BookingWizard.tsx`, step 1 of the flow locked in `project_booking_flow_canonical`.

---

## 1. Sample

**42 distinct screens across 16 apps, iOS and web, from 11 Mobbin queries** (10 screen searches,
1 flow search). Every screenshot listed below was opened and read; nothing here is described from
metadata or from memory of a brand.

Split of the 42:

| set | screens | apps |
|---|---|---|
| **A. The step itself** (a service-picking step inside a booking flow) | 28 | 8: Fresha (iOS + web), Square Go, Square Appointments booking site, Careem Salon&Spa, Walmart Auto Care (iOS + web), Shangri-La Circle, Selfridges, Superpower |
| **B. Adjacent, used for calibration** (add-on upsells, quantity/option pickers, running-total bars, the PDP services section this step is reached from) | 14 | 8 more: Airbnb, Trip.com, Viator, GetYourGuide, Booking.com, DoorDash, Bolt Food, Calendly |

Every frequency below names the set it was counted over. **All frequencies are over set A (8 apps)
unless stated otherwise.** Nothing here is a census: Mobbin returns at most 30 screens per call and
its corpus is curated, so "8 of 8" means eight of the eight apps I could reach, not eight of eight
in the world.

**What I did NOT do, stated plainly so nobody builds on a false premise:** I did not pixel-measure
any of these screenshots. Mobbin returns rendered images at its own scale, so every size statement
in section 5 is a relative observation ("the title is visibly about twice the row name"), not a
measured px value. Per NEVER-AGAIN floor 5, any mockup built from a screen cited here must run
`pixel-spec-auto` or a PIL sample against the source image first and carry a `measured:` note.

**Motion: I observed none.** Mobbin returns static frames. Section 6 is built from *state pairs*
(the same screen before and after a tap, captured as two separate screenshots) and every transition
in it is labelled INFERRED.

---

## 2. Dominant anatomy, top to bottom

The convergent shape, with the count of set-A apps that render each band:

```
[ dismissal + step position ]        back arrow (8/8) · X close (5/8) · step indicator (4/8)
[ page title ]                       "Select services" / "Select a service"   (7/8)
[ category navigation ]              horizontal pill row (3/4 of apps with categories)
[ section heading = active category ] the chip word, printed again as an H  (4/4 with categories)
[ SERVICE ROW, repeated ]            name > duration > (description) > price | [add]   (8/8)
[ hairline or card gap ]             hairline on mobile (4/6), card gap on web (3/4)
[ ...more rows, more sections... ]
[ persistent commitment surface ]    sticky bottom bar (5/6 mobile) OR right summary rail (2/4 web)
```

Band by band, with what I could actually see:

**1. Dismissal and step position.** A back arrow at top-left is universal (8/8). An X at top-right
appears in 5/8, always on a surface presented as a sheet or modal ([Fresha iOS, "Select services"
with back and X](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b);
[Fresha web, same pair](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a)).
An explicit step-position indicator appears in **4/8**, in four different forms:
a segmented bar plus "Step 2 of 4" ([Walmart](https://mobbin.com/screens/164ac7e0-a8a0-4674-a253-add5b98574a4)),
a green fill bar plus a forward-looking label "Next step: Popular add-ons"
([Careem](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29)),
a four-dot labelled stepper Service / Appointment / Your details / Confirmation
([Selfridges](https://mobbin.com/screens/c46a06cd-0d45-450b-9909-a37b5d18ad58)),
and a text breadcrumb "Services > Professional > Time > Confirm"
([Fresha web](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a)).
The other 4/8 (Fresha iOS, Square Go, Square web, Shangri-La) show no step position at all.

**2. Page title.** 7/8 carry a large, left-aligned, sentence-case title as the first content
element: "Select services" (Fresha both platforms), "Select one or more services"
([Square Go](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b)), "Select a service"
(Walmart, Selfridges), "Service details" (Careem), "Add more to your appointment?"
([Square web](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a)).
The exception is [Shangri-La Circle](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b),
which uses a small centred nav-bar title ("Chi, The Spa") and no page title.

**3. Category navigation appears only when the menu is long.** 4/8 have it, and those four are
exactly the four with long menus. Fresha's PDP states its own menu size out loud, "136 services
available" ([Fresha iOS PDP](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9)).
The four apps with no category row have 1 to 7 services total (Walmart 2, Selfridges 3, Square Go 5,
Square web 7, Superpower 1). Treatment among the four:
- **Black pill fill on active, white with no visible border on inactive, one horizontally scrolling
  row.** Fresha, both platforms
  ([iOS Nails tab](https://mobbin.com/screens/544f671e-9b6f-40c5-bbff-c0648e2a235e),
  [iOS scrolled to "Advanced Skin Therapy"](https://mobbin.com/screens/deb5055f-ec3e-4933-9714-e3111c3e3c84),
  [web Waxing tab](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c)). Fresha web adds
  left/right arrow affordances at the row's right end, so the overflow is discoverable without
  scrolling.
- **Pale-green fill plus green text on active, white plus hairline on inactive, WRAPPED to three
  rows instead of scrolling.** [Careem](https://mobbin.com/screens/18967ec3-fd3a-4605-9c56-d6081fba09c6).
  The visible cost: eight chips over three rows push the first service well down the viewport, and
  the first thing under them is a decorative category hero image, so on that frame no service row is
  above the fold at all.
- **Underlined text tabs, no fill.** [Shangri-La](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b).

**4. The active category is printed twice.** In 4/4 of the apps with categories, the chip word
reappears immediately below the row as a section heading ("Nails" under the Nails chip, "Facial"
under Facial: [Fresha iOS Facial](https://mobbin.com/screens/9c7cff44-6240-4b29-a7b0-ba7d7ed81fec),
[Fresha web Waxing](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c)). Read against
Solen's copy-economy rule 1 this is redundant, and it is redundant. It is also unanimous, which
suggests it is doing a job: it is the scroll anchor for a list that keeps going past the fold, so
the label survives when the sticky chip row is the only other thing on screen.

**5. The service row.** The one band every app has. Field order, over 8/8: **name first, top-left,
and the heaviest thing in the row.** After that they diverge, and the split is real:

| field arrangement | apps | example |
|---|---|---|
| name / duration / description / price, four stacked lines | 2 | [Fresha iOS](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b), [Fresha web](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c) |
| name, then price and duration in ONE inline meta run | 1 | [Square Go](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b): "Starting at $250.00 · 2 hours 30 minutes · More info" |
| name left with price right-aligned on the same baseline, duration below the name | 2 | [Walmart](https://mobbin.com/screens/164ac7e0-a8a0-4674-a253-add5b98574a4), [Selfridges](https://mobbin.com/screens/c46a06cd-0d45-450b-9909-a37b5d18ad58) |
| photo thumbnail left, then name / 2-line description / price | 1 | [Careem](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29) |
| name only until expanded, duration and price inside a bordered 2-column table | 1 | [Shangri-La](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b) |

Two findings inside that table matter more than the arrangement:

- **A duration string is on the row in 7/8.** The exception is Careem, which buries the minutes
  inside description prose ("...in only 40..."), the one row style in the sample where you cannot
  scan the durations down a column.
- **Zero of eight render duration with a clock icon.** Not one. It is always a bare string: "45
  mins", "1 hr - 1 hr, 45 min", "Est. duration: 1hr", "2 hours 30 minutes". Solen's PDP services
  spec (`sections/salon-detail/04-services.md`) specifies a 12px Clock icon on that row. Inside the
  booking step Solen already agrees with the corpus and ships a bare string
  (`ServicesStaffStep.tsx:454`).

**6. A per-row select control, right edge, 7/8.** Shangri-La is the only app with no per-row
control; it has a single page-level "Book Now". The glyph splits four ways and there is no majority:

| control | apps | note |
|---|---|---|
| **+ in a light-gray circle or rounded square** | 2 | Fresha iOS and web. Reads "add to a list", supports multi-select |
| **empty square checkbox** | 2 | [Square Go](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b), [Superpower](https://mobbin.com/screens/1514d7b9-1096-4a6a-afb4-9cc18f31e8df) |
| **empty radio circle** | 2 | [Walmart](https://mobbin.com/screens/658fbc2d-814d-40e5-a621-b091cb3bbe9e) (genuinely single-select), and Fresha's own upsell step [Add an extra service?](https://mobbin.com/screens/5f7ec437-188d-45ce-82b8-b8c8a6ed17dd), which is multi-select but draws radios, an inconsistency inside one app |
| **labelled button** | 2 | Careem's green "+ Add" pill, Selfridges' outline "SELECT" |

**7. Row separation is platform-split.** Mobile renderings favour a full-width hairline with no card
(4 of 6: Fresha iOS, Square Go, Careem, Selfridges' table). Web renderings favour one bordered
rounded card per row with a visible gap between them (3 of 4: Fresha web, Walmart web, and Walmart
iOS carries the card treatment down to mobile too). Nobody nests a card per row inside another card.

**8. A persistent commitment surface, 8/8, in two shapes.**
- **Mobile: a sticky bottom bar**, present in 5 of 6 mobile renderings. When it carries a total the
  layout is unanimous: **total on the left, primary button on the right, 4 of 4** (Careem "Total /
  AED 0.00" with a caret plus green Next;
  [Fresha PDP "136 services available" plus black "Book now"](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9);
  set B: [Airbnb "$45 /group" plus black Next](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a),
  [Trip.com "$1.10" plus blue Next](https://mobbin.com/screens/1663e8ba-144e-4918-8748-fcd12e8536f9)).
- **Web: a right-hand summary rail** instead of a bar, 2 of 4 web renderings
  ([Fresha](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a),
  [Square](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a)). It is a bordered card
  holding the venue identity, the selected line items, a Total row, and the primary button pinned to
  its bottom. It stays put while the list scrolls.

**9. A live running total on this step: only 4/8.** This is the surprise of the sweep.
Careem, Fresha web, Square web and Superpower show one; **Fresha's own iOS app does not.** In the
iOS "Select services" frames the list runs to the bottom edge with no bar at all
([Featured](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b),
[Nails](https://mobbin.com/screens/544f671e-9b6f-40c5-bbff-c0648e2a235e),
[the very bottom of the list, where "Try something else" sits and there is still no bar](https://mobbin.com/screens/dcfec111-f3e8-4aa5-b41c-32be210a120b)),
and Square Go's bar carries only "Cookie Preferences" and a disabled Continue, no money at all.
**Solen showing a live CHF total here is a minority position, and a defensible one.**

**10. A combined DURATION total next to the price total: 1 of 8.** Only
[Square web](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a) does it, as
"2 services / $100.00+ · 2 hr 30 min" in the collapsed summary header. Nobody else totals the
minutes. Solen does (`ServicesStaffStep.tsx:626`). This is the strongest differentiator the sweep
surfaced and it should be defended, not normalised away.

**11. The zero state is spelled out, not left blank, 2/2 of the web apps with a rail.** Fresha web
prints "No services selected" and, more interestingly, "Total **free**" rather than a currency zero
([empty rail](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a)). Square web prints
"No services added yet" ([empty rail](https://mobbin.com/screens/76db361f-35e6-4f07-842f-69e5dee9dd97)).
Careem instead renders a real "Total / AED 0.00", a currency zero
([Careem](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29)).

**12. Primary button disabled in the zero state: 5/8.** Fresha web (gray fill), Square Go (pale
blue), Square web (pale blue), Careem (pale green), Superpower (gray). Walmart leaves Continue solid
and enabled with nothing chosen
([nothing selected, Continue still solid blue](https://mobbin.com/screens/658fbc2d-814d-40e5-a621-b091cb3bbe9e)),
which is the weakest pattern in the sample: it promises a step that cannot succeed.

**13. A dedicated add-on step AFTER selection, 3/8**, and 3 more in set B. Fresha runs a full screen
titled ["Add an extra service?"](https://mobbin.com/screens/5f7ec437-188d-45ce-82b8-b8c8a6ed17dd)
with a "Save up to 10%" incentive in green and a full-width outline "No, thanks" as the only bottom
button. Careem runs ["Popular add-ons"](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551)
as a horizontal card carousel with photos, "Learn more", and struck-through prices. Square web runs
["Add more to your appointment?"](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a)
as the whole step. Set B confirms the convention outside beauty: DoorDash
([add-ons with "Optional • Select up to 6"](https://mobbin.com/screens/6d761cb4-cf23-4618-be57-3cec4eed9194)),
Bolt Food, [Booking.com "Need any extras?" with a Skip button](https://mobbin.com/screens/9db6b7f0-fbbb-4c6a-bcb3-4457afe35cea).

**14. A service with variants opens a separate sheet, 2/8.** Fresha iOS opens a bottom sheet titled
with the service name, a truncated description with a purple "Read more", then "Select an option"
marked required, and radio rows each carrying its own duration and price, plus one full-width
"Add to booking" button that stays disabled until an option is picked
([Jet Plasma, 3 options](https://mobbin.com/screens/965598a3-a61b-4afa-a858-d7296048e574),
[scrolled to 4 options](https://mobbin.com/screens/c7d9b413-de97-4014-9d7d-1c7bd222cf5d)).
Fresha web does the same job as a centred modal over a dimmed list, with an ink full-width
"Add to booking" ([Lips modal](https://mobbin.com/screens/3b99db90-1197-4257-9574-0acbd344c483)).

**15. Photography inside the service row: 1/8.** Only Careem, which puts a thumbnail on every row
plus a full-bleed category hero. The other seven are text-only. Note what that hero actually is on
the [Bestsellers frame](https://mobbin.com/screens/18967ec3-fd3a-4605-9c56-d6081fba09c6): a stock
image with the word "Bestsellers" set over it, carrying no information the chip above it did not
already carry.

---

## 3. Pattern table, with the Solen verdict

| # | pattern | frequency (set A, 8 apps) | evidence | verdict for Solen |
|---|---|---|---|---|
| 1 | Name first and heaviest in the row | 8/8 | [Fresha iOS](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b), [Square Go](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b), [Walmart](https://mobbin.com/screens/164ac7e0-a8a0-4674-a253-add5b98574a4) | **ADOPT, already shipped.** `ServicesStaffStep.tsx:443`, 15px/600. Matches the V3-D442 two-anchor card rule |
| 2 | Duration as a bare string, never a clock icon | 8/8 render a string, 0/8 use an icon | every set-A app | **ADOPT, already shipped in booking** (`:454`). But the PDP spec `04-services.md` still specifies a 12px Clock icon on the same data. Two Solen surfaces, one entity, two anatomies: that is FLOORS LAW 8. Reconcile toward the corpus and drop the icon |
| 3 | Persistent bottom bar, total left, primary right | 4/4 of the mobile apps that show a total | [Careem](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29), [Airbnb](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a), [Trip.com](https://mobbin.com/screens/1663e8ba-144e-4918-8748-fcd12e8536f9) | **ADOPT, already shipped** (`:597-643`). Also satisfies the sticky-CTA floor (hierarchy-density-06) |
| 4 | Live running total on the selection step | **4/8 only. Fresha iOS ships none** | [Fresha iOS list runs to the edge, no bar](https://mobbin.com/screens/dcfec111-f3e8-4aa5-b41c-32be210a120b) vs [Fresha web rail](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a) | **ADOPT and defend.** Solen is in the minority and should stay there. PBV total-price transparency is tier-2 statutory in the precedence chain, and the price-transparency psychology law backs it. Do not copy Fresha iOS here |
| 5 | Duration total alongside the price total | **1/8** | [Square web "2 services · $100.00+ · 2 hr 30 min"](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a) | **ADOPT and defend.** Solen already does it (`:626`). A salon booking's real cost is time as much as money. Near-unique in the sample: keep it |
| 6 | "from" / "starting at" price qualifier | 3/8 | [Fresha "from $40"](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b), [Square Go "Starting at $250.00"](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b), [Walmart "From $26.88"](https://mobbin.com/screens/164ac7e0-a8a0-4674-a253-add5b98574a4) | **REJECT, and it is not a taste call.** `ServicesStaffStep.tsx:477-483` already documents why: PBV Art. 10 Abs. 1 plus the SECO sector sheet of 01.04.2025 make a from-price unzulaessig for Coiffeurgewerbe and kosmetische Institute. The most-copied pattern in the corpus that Solen must not copy |
| 7 | Category chips when the menu is long | 4/4 of the long-menu apps, 0/4 of the short-menu apps | [Fresha](https://mobbin.com/screens/544f671e-9b6f-40c5-bbff-c0648e2a235e), [Careem](https://mobbin.com/screens/18967ec3-fd3a-4605-9c56-d6081fba09c6), [Shangri-La](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b) | **ADOPT with the sparse-salon caveat.** Solen renders the row unconditionally (`:516`). Every reference hides it below roughly 7 services. Gate it on more than one category so a two-service salon does not get a one-chip row, which reads as a broken filter |
| 8 | Chips FILTER the list (only the active category renders) | 4/4 of the apps with chips | Fresha iOS: tapping Nails replaces the list and the heading changes with it | **REJECT, deliberately.** Solen scroll-spies instead: every category renders and a tap scrolls (`:301-338`, owner change 2026-07-19). Named cost of Solen's choice: on an 80-service salon the user scrolls past everything, which is exactly the rich-data ceiling (hierarchy-density-03). Named benefit: no hidden inventory, and the scroll promise stays intact. Keep the owner's call, but the rich-data cap has to land on this screen |
| 9 | Chips wrap to multiple rows | 1/4 (Careem) | [three chip rows, no service above the fold](https://mobbin.com/screens/18967ec3-fd3a-4605-9c56-d6081fba09c6) | **REJECT.** Solen scrolls horizontally (`:518`), which is right. Wrapping trades a whole viewport of service rows for chips nobody is reading yet |
| 10 | Selected row = the affordance fills with the brand colour + a white check | 3/4 of the apps where I have a before/after pair | [Fresha web: purple border + purple filled check](https://mobbin.com/screens/4701c4e6-f563-48e4-9b5d-52f9b7f71f92); Square Go: solid blue checkbox; Careem: green left rule + "1x" prefix | **ADAPT, do not copy the colour.** Solen's locked contract says selected is a calm gray `#F4F4F5` fill, never a coloured or black fill. Solen already resolves this correctly: the ROW gets `bg-s-bg-sunken/60` (`:433`) and the ink fill lives only on the ToggleCircle glyph, which is a check badge and not a selection fill (the `selected-ok` carve-out in `ToggleCircle.tsx`). That split is the house answer to this pattern and should be written down as such |
| 11 | Primary button disabled until something is selected | 5/8 | [Fresha web gray Continue](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a), [Careem pale-green Next](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29); counter-case [Walmart stays enabled](https://mobbin.com/screens/658fbc2d-814d-40e5-a621-b091cb3bbe9e) | **ADOPT, already shipped** (`:632`, `disabled:opacity-50`) |
| 12 | Explicit empty-summary copy rather than a blank panel or a currency zero | 2/2 of the web rails | [Fresha "No services selected / Total free"](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a), [Square "No services added yet"](https://mobbin.com/screens/76db361f-35e6-4f07-842f-69e5dee9dd97) | **ADAPT.** Solen renders "CHF 0" plus "0 Artikel, 0 Minuten" in the zero state (`:600-628`). A hard zero is honest but it is also the least informative thing that bar will ever say. Fresha's "Total free" is the better idea: a word, not a number, until there is a number. Worth a mockup, it is a copy change not a structural one |
| 13 | Variant-bearing service opens its own sheet with radios and a disabled commit | 2/8 (both Fresha) | [Jet Plasma sheet](https://mobbin.com/screens/965598a3-a61b-4afa-a858-d7296048e574), [Fresha web modal](https://mobbin.com/screens/3b99db90-1197-4257-9574-0acbd344c483) | **ADOPT, already shipped** as `ServiceDetailSheet.tsx`, wired at `ServicesStaffStep.tsx:646-660`. Solen goes further and folds add-ons into the same sheet, which no reference does |
| 14 | A dedicated add-on / upsell step after selection | 3/8 in set A, 3 more in set B | [Fresha "Add an extra service?"](https://mobbin.com/screens/5f7ec437-188d-45ce-82b8-b8c8a6ed17dd), [Careem "Popular add-ons"](https://mobbin.com/screens/160656d3-ef01-4163-87bc-ca4c2abd7551), [Booking.com extras](https://mobbin.com/screens/9db6b7f0-fbbb-4c6a-bcb3-4457afe35cea) | **REJECT as a separate step, KEEP inline.** Solen already surfaces add-ons inside the service sheet. A whole extra screen between choosing and paying is a conversion tax the flow lock (services, Staff, Zeit, Bezahlen) deliberately does not have. Do not add a fifth step to chase this |
| 15 | Discount framing on the row ("Save up to 10%", struck-through price) | 3/8 | Fresha green "Save up to 10%", [Fresha web "US$70 Save 13%"](https://mobbin.com/screens/de7ad5b2-44d4-430d-9543-194a44da61bd), Careem "AED 69" over a struck "AED 80" | **ADAPT, tightly.** Solen has the pale-green minus-percent pill grammar already (`project_card_badges`). Legal on a real discount, banned on a fabricated one. Careem's struck-through price on every single row is the anti-pattern: when everything is discounted, nothing is |
| 16 | Photography inside the service row | 1/8 | [Careem](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29) | **REJECT.** The one app that does it is also the one whose category hero is a stock image with a word on it, which is the decoration FLOORS LAW 2 rejects by name. A booking form is an imagery-floor-exempt surface. Text rows are correct here |
| 17 | Description truncated to one line with an inline "more" link | 2/8 truncate inline, 1/8 reveals on select, 3/8 show none | Fresha both platforms truncate; [Square Go hides the description until the row is checked, then expands it](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b) | **ADAPT.** Solen hides the description behind a chevron the user must tap (`:459-475`), a third pattern nobody in the sample uses. Square Go's idea is better and cheaper: reveal on SELECT, since that is the moment the detail becomes relevant. Flag as a mockup candidate, not a silent change |
| 18 | Explicit step-position indicator | 4/8 | [Walmart "Step 2 of 4"](https://mobbin.com/screens/164ac7e0-a8a0-4674-a253-add5b98574a4), [Selfridges 4-dot](https://mobbin.com/screens/c46a06cd-0d45-450b-9909-a37b5d18ad58), [Fresha web breadcrumb](https://mobbin.com/screens/b9e60087-ff8a-4509-8bf9-98d21f089c7a) | **REJECT, settled.** `BookingWizard.tsx:42-44` states it verbatim: "NO progress UI anywhere, the back arrow is the navigation, the big title names the task". The corpus is genuinely split 4/4 here, so this is not Solen swimming upstream. Do not reopen |
| 19 | Large left-aligned page title as the first content element | 7/8 | Fresha, Square Go, Walmart, Selfridges, Careem, Square web | **REJECT for Solen, and this one deserves a second look.** `BookingWizard.tsx:204-208` puts the step title small (16.5px) and CENTRED in the header bar, an owner decision from mockup 26 on 2026-06-12 ("the 30px page title read unbalanced"). Cost, stated once and not re-argued: this screen then has no display anchor at all, and FLOORS LAW 6 requires one at 28px or more per customer screen unless a photograph is the focal. There is no photograph here. So the screen is currently non-compliant with its own floor by way of an owner decision that predates the floor. That is a collision to SURFACE per the precedence-chain tier-2 procedure, not to fix silently |

---

## 4. Grid

Observed, not measured. Any build must pixel-verify against the source frames.

- **Single column, full-bleed, 8/8 mobile.** No app splits the service list into two columns on
  phone, at any menu length.
- **Web splits into a two-column shell, 2/4:** a scrolling list on the left and a fixed summary rail
  on the right. The rail looks like roughly a third of the content width and is a bordered rounded
  card with generous internal padding; the list column's rows are their own smaller bordered cards.
  [Fresha web](https://mobbin.com/screens/4701c4e6-f563-48e4-9b5d-52f9b7f71f92) and
  [Square web](https://mobbin.com/screens/673c9848-8703-4db4-aa7a-cf7b2d45526a) agree on the shape;
  Square's rail is borderless with hairline separators, Fresha's is a full bordered card.
- **Rows do not nest.** Where a row is a card (Fresha web, Walmart), the cards sit in a plain stack
  with a gap and no outer container. Where rows are hairline-separated (Fresha iOS, Square Go,
  Careem), the group has no card either. **Nobody in the sample puts hairline rows inside a rounded
  card.** Solen does (`ServicesStaffStep.tsx:551`, one `rounded-[24px]` bordered card per category
  holding hairline-separated rows). That matches Solen's own locked radius row ("grouped LIST-card
  24, CATEGORY members in one card: salon services") so it is a house choice, not drift, but it is a
  house choice with no external support in this corpus. Worth knowing before anyone cites Fresha for
  it.
- **One detail to check on that same line:** it carries `border border-s-border` AND `shadow-whisper`
  together. The locked shadow row says a card carrying elevation drops its border, never both. I did
  not resolve whether `shadow-whisper` counts as elevation for that rule; flagging it as a question
  for the LOCKFILE owner rather than asserting a defect.
- **The sticky chip row overlays the list**, it does not push it: Fresha iOS keeps the row pinned at
  the top with the list scrolling under it, visible in the frame where the chips have scrolled to
  ["Advanced Skin Therapy"](https://mobbin.com/screens/deb5055f-ec3e-4933-9714-e3111c3e3c84) while a
  different category's rows are on screen. Solen does the same (`:517`, `sticky top-0` with
  `bg-white/90 backdrop-blur`).
- **Vertical rhythm between category sections is larger than between rows**, in all 4 apps with
  categories, satisfying FLOORS LAW 5's "between-group gap at least 2x the in-group gap". Solen's
  `space-y-8` between sections against `py-[18px]` rows clears it comfortably.

---

## 5. Type

Four tiers are legible across the sample, which fits Solen's 4-sizes-per-screen ceiling exactly:

1. **Page title.** Visibly the largest thing, roughly twice the row name in Fresha and Square Go.
   Left-aligned, sentence case, semibold to bold. Not one app in the sample sets it in all caps.
2. **Row name and price.** Same tier. In Fresha both are dark ink at a similar size and the NAME
   carries the weight while the price does not, so hierarchy inside the row runs on weight, not
   size. In Walmart and Selfridges the price sits right-aligned on the name's baseline at the same
   size, and there the name is bold while the price is regular. **In 0 of 8 is the price larger than
   the name.** Solen inverts the weight (name 600 at `:443`, price 700 at `:476`), a small
   contradiction of the V3-D442 rule that the name is the anchor. Cheap to fix if anyone agrees.
3. **Meta: duration, description, service count.** One step down and grey in 8/8. Never coloured,
   never bold.
4. **Chip labels.** The smallest text on the screen in all 4 chip-bearing apps.

Other type observations:
- **Sentence case everywhere.** Selfridges is the single all-caps exception ("SELECT",
  "THE HANDBAG CLINIC"), and it is also the oldest-looking screen in the sample.
- **Prices are written out in full with the currency code or symbol on every row**, 8/8. No app
  drops the unit and relies on a column header.
- **I cannot verify tabular figures from a screenshot** and will not claim any app uses them. Solen
  does use `tabular-nums` on the duration and the total (`:454`, `:600`), which is correct for a
  number that animates.
- **Duration strings become ranges when the service has variants**, in Fresha: "1 hr - 1 hr, 45 min",
  "45 min - 3 hr". That is honest about variant spread without printing a from-price, and it is the
  one legal way to express "it depends" that survives the PBV constraint in pattern 6. Worth copying
  deliberately.

---

## 6. Motion

**I observed no motion. Mobbin returns static frames.** Everything below is INFERRED from pairs of
screenshots showing the same surface before and after an interaction. Treat it as a list of state
deltas to design transitions for, not as evidence of how any app animates.

| state pair | delta | inferred transition |
|---|---|---|
| [Fresha web rest](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c) to [hover](https://mobbin.com/screens/6215e2b9-fff2-495d-a78d-247ff90d313d) | row background lightens to grey and the + button gains a ring | a colour-only hover, no lift, no shadow. Consistent with Solen's flat-hover rule |
| [Fresha web unselected](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c) to [selected](https://mobbin.com/screens/4701c4e6-f563-48e4-9b5d-52f9b7f71f92) | THREE things move at once: the card gains a border, the + becomes a filled check, the rail gains a line item and a Total, and Continue flips grey to solid black | one tap, three surfaces reconcile. This is the moment that needs choreography, and Solen already treats it as one: `ToggleCircle` plays a 90ms press-tier pop on the false-to-true edge only, and `CountUpNumber` runs the total |
| Square Go unselected to selected (flow [7ab7c8e8](https://mobbin.com/flows/7ab7c8e8-808e-475e-a543-1d2314dd47da), screens 2 to 3) | the checkbox fills solid, AND a previously hidden description expands into the row | a height change on select. See pattern 17 |
| [Careem collapsed total](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29) to [expanded summary](https://mobbin.com/screens/749054a9-b32a-4475-b298-ab31eecb8743) | the caret opens a bottom sheet over a dimmed page, listing line items with a trash button and a quantity stepper | the sticky total doubles as a sheet trigger. Solen's total is not tappable today |
| [Fresha web list](https://mobbin.com/screens/f1ee0172-75e5-4d38-a1ac-ffe0f463698c) to [option modal](https://mobbin.com/screens/3b99db90-1197-4257-9574-0acbd344c483) | centred modal over a dimmed list, the list stays in place behind | modal, not a push. Solen uses a bottom sheet on mobile, same intent |
| Fresha iOS upsell, final frame of flow [98f220ae](https://mobbin.com/flows/98f220ae-7b2b-40d3-b298-88c73f8d32a6) | the bottom button renders as three dots, a loading state, after the commit tap | the commit is async and says so. Solen has `isChecking` plus a `Spinner` on the same button (`:635`) |

**The one motion idea worth stealing:** Careem's caret. A running total that is also the door to the
line-item list means the user never has to trust the number blind. Solen's bar has the number and the
item count but no way to see WHICH services made it, and the floating "N selected" pill (`:573-594`)
scrolls to the top instead of showing the list. That is a real gap, and it is the same job the web
summary rail does for free.

---

## 7. Components

What this screen needs, and what Solen already owns. Per FLOORS LAW 9, a screen is composed from the
registry, not drawn.

| need | Solen component today | state |
|---|---|---|
| Step chrome (back, title, X) | `BookingWizard.tsx:204-208` | exists, owner-locked, no progress UI by decision |
| Category navigation | **hand-built inline at `ServicesStaffStep.tsx:519-533`** | **gap.** `TabPill` is a locked registry primitive (`primitives/TabPill.tsx`) with 9 real call-sites including `SalonServices.tsx`, and this screen does not use it. The reason is real: the owner explicitly chose a BLACK/ink selected pill here on 2026-07-19, overriding the gray-sunken contract, and the code carries a `selected-ok` marker for it. But FLOORS LAW 8 says the answer to that is a documented VARIANT of one component, never a second implementation. **Action: add an ink-active variant to TabPill and compose it here.** The same salon-service taxonomy renders through TabPill on the PDP and through a hand-rolled button in the booking flow |
| Service row | `renderServiceRow` inside `ServicesStaffStep.tsx:413-508` | inline, not extracted. The same entity is also rendered by `SalonServices.tsx` on the PDP with a different anatomy (Clock icon, "Buchen" pill instead of a ToggleCircle). Second FLOORS LAW 8 instance on this screen |
| Select control | `ToggleCircle.tsx` | exists, locked, 36px, motion-tiered correctly (90ms press pop, 150ms flip) |
| Variant / add-on picker | `ServiceDetailSheet.tsx` | exists, exceeds every reference (folds options AND add-ons into one sheet) |
| Running total bar | inline at `ServicesStaffStep.tsx:597-643` | exists. Not a registry component, and the identical bar shape is required on every commit screen per the sticky-CTA contract row. Candidate for extraction |
| Animated number | `CountUpNumber.tsx` | exists, owner-approved 2026-07-18, locale-aware suffix handling for fr-CH |
| Price rendering | `PriceFrom` | exists, and it is the component enforcing the PBV no-from-price rule. Do not route around it |
| Empty state | `EmptyServicesState` (`components-legacy/booking`) | exists, wired at `salon/[slug]/booking/page.tsx:237` |

---

## 8. The Solen gap, named

Six things this sweep says about Solen's service-selection step. Three are defects, three are
deliberate choices the corpus vindicates.

**Defects, in order of cost:**

1. **No display anchor.** The step title is 16.5px and centred in the header bar
   (`BookingWizard.tsx:206`). FLOORS LAW 6 requires one element at 28px or more on every customer
   screen unless a photograph is the focal, and there is no photograph on a booking form. 7 of 8
   reference apps lead with a large left-aligned title. The owner set the current title on
   2026-06-12, before the floor existed, on the grounds that a 30px page title "read unbalanced".
   This is a taste-decision-versus-floor collision and the precedence chain says surface it with both
   dates and propose a treatment that honours the taste intent, not restore the 30px title
   unilaterally.
2. **The same service renders through two different anatomies on two Solen screens.** The PDP row
   (`SalonServices.tsx`, spec `04-services.md`) has a Clock icon, a "Buchen" outline pill, and a
   different type ramp. The booking row (`ServicesStaffStep.tsx:413`) has a bare duration string, a
   ToggleCircle, and an expand chevron. FLOORS LAW 8 by the letter. The corpus settles the icon
   question at 0/8 in favour of the bare string. Note the estate already fixed the worse half of this
   in 2026-07-19 by deleting `SalonServicesSheet` (a third implementation) into REMOVED.md; the
   remaining divergence is the two survivors.
3. **The category pills are hand-drawn** rather than composed from the locked `TabPill`
   (FLOORS LAW 9). Fixable as a TabPill variant, since the ink-active state is a real owner decision
   and not drift.

**Deliberate choices the corpus supports, recorded so they are not "corrected" later:**

4. **Showing a live CHF total on this step is a minority pattern (4/8) and Solen should keep it.**
   Fresha's own iOS app shows none. Solen's version is stronger than any reference because it totals
   the MINUTES as well, which only 1 of 8 apps does.
5. **Refusing an "ab CHF X" price is not a design preference, it is Swiss law** (PBV Art. 10 Abs. 1
   plus the SECO sector sheet of 01.04.2025, already documented in-code at
   `ServicesStaffStep.tsx:477-483`). 3 of 8 references print one. Solen cannot, and the correct
   substitute is Fresha's other habit: a duration RANGE ("45 min - 3 hr") to signal variant spread.
6. **No progress UI is a genuine 4/4 split in the corpus**, not Solen swimming upstream. Settled by
   `BookingWizard.tsx:42-44`; do not reopen.

**Two changes worth mocking up (mockup-first law binds, nothing here gets applied directly):**

- Make the running total tappable so it opens the line-item list, the way Careem's caret does
  ([collapsed](https://mobbin.com/screens/6b740a44-3557-447d-af49-bd4140596f29) to
  [expanded](https://mobbin.com/screens/749054a9-b32a-4475-b298-ab31eecb8743)). Today the number is
  unverifiable from the bar, and the floating pill scrolls instead of showing.
- Reveal the service description on SELECT rather than behind a separate chevron tap
  ([Square Go](https://mobbin.com/screens/2d58dfb9-0a43-40f8-81a6-b782522cd92b)). Solen's current
  chevron is a third pattern that no app in the sample uses, and it costs a tap at the exact moment
  the user has already decided.

---

## Provenance

- 2026-07-29, `corpus:booking-service` agent, workstream `_plans/SCREEN_RESEARCH.md` box A4.
- Sample: 42 screens, 16 apps, 11 Mobbin queries (10 screen searches across iOS and web, 1 flow
  search). Set A (the step itself) is 28 screens across 8 apps; every frequency names its base.
- Solen-side claims are read from the current files on disk and cited by `file:line`, not recalled.
- Not measured: no pixel measurement was performed on any Mobbin frame. Not observed: no motion.

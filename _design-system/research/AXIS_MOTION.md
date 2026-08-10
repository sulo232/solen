<!--
exists-check: net-new vs `research/TASTE_MOTION.md`, `research/TASTE_CHECKOUT.md`,
`research/TASTE_HIERARCHY.md`, `research/TASTE_RANGE.md`, `research/TASTE_GROUPING.md`,
`research/TASTE_TYPOGRAPHY.md`, `research/TASTE_DASHBOARDS.md`, `research/TASTE_REFS_2026-07.md`,
`_design-system/MOTION.md`, `research/MOTION_MODERNIZATION_2026-07-10.md`.

I read `TASTE_MOTION.md` (605 lines) before writing this. It is a LITERATURE review: 25 findings
sourced to Miller 1968, Nielsen 1993, Card et al., Heer & Robertson, Tversky, WCAG 2.2.2/1.4.11,
and the Material/Carbon/Atlassian design systems, answering "what does the evidence support about
duration, easing and shadow". It contains no competitive corpus and cites no product screens.

This file answers a DIFFERENT question with a different instrument: what 44 real booking and
marketplace apps actually do, at which moments, read off 124 Mobbin screenshots. Method is
disjoint (published research vs product corpus), so this is not a second copy of that file.

Rather than duplicate, this file CLOSES or advances five open items in `TASTE_MOTION.md`'s own
recommendation table, and each is cross-referenced inline below:
  - its finding 4  ("audit the booking-flow chips, filter pills and content tabs" against the
    repeated-action tier)      -> V4 here, `.slot-cascade` finishes ~830ms after a date tap.
  - its finding 10 (use the blur to go FASTER; test the recipe at 250-300ms)
                               -> resolved for the recipe (owner picked 280ms, 2026-07-26); V4
                                  here finds the retired 420ms still live in `.celebrate-rise`.
  - its finding 11 (spend motion where the user waits on an external system: payment and booking
    confirmation, not entrances)  -> F3 and V1 here.
  - its finding 17 (enter/exit asymmetry, exits on `thud`)
                               -> became THE CURVE RULE; V2 here finds that pass changed curves
                                  but not durations, leaving `Sheet.tsx` entering at 600ms.
  - its finding 18 (interruptibility is a bigger lever than the duration number)
                               -> V3 here, the live `mode="wait"` in `BookingWizard.tsx:213`.

`MOTION.md` remains the law. This file proposes amendments to it and never restates it as new.
-->

# AXIS: MOTION

Wide Mobbin corpus sweep, 2026-07-29. What booking and marketplace apps actually do between
steps, on tap of a card, on selection, on load, and at the moment a booking completes. Then a
concrete verdict for Solen naming files and tokens.

Companion axis files: `AXIS_COMPONENTS.md`, `AXIS_GRID.md`, `AXIS_ALIGNMENT.md`, `AXIS_FONT.md`.

---

## 0. Sample size, stated plainly

**16 Mobbin searches. 124 screen images actually opened and read. 44 distinct apps. Both
platforms (12 iOS searches, 4 web searches; 4 of the 16 were multi-step flow searches, 12 were
screen searches).**

Apps in the sample: Careem, Square Go, Fresha, Airbnb, Resy, Uber, Uber Eats, Revolut, Calendly,
Tock, Zocdoc, CVS Health, Octopus Energy, adidas, KakaoTalk, GoDaddy, Zillow, Cloudflare,
SuperHi, Kiwi.com, lululemon, Etsy, Linear, Ladder, Tripadvisor, Marriott Bonvoy, Rappi, Zomato,
Swiggy, ANZ Plus, Fabric, Instacart, foodpanda, Faire Wholesale, Hatch Sleep, Believe, AllTrails,
Vrbo, Zesty, Viator, Grab, Booking.com, IHG Hotels & Rewards, TheFork.

This is a sample, not a census. Every count below names what it was counted over.

### The honest limit of this instrument, stated before any finding

**Mobbin returns static screenshots. A static image cannot show a duration or an easing curve.**
Any millisecond number or curve name below is one of three things, and each is labelled:

- **verified-in-repo**: I read it in Solen's own source. File and line given.
- **observed**: I saw the state in a screenshot. Endpoints, scrims, fills, geometry, presence or
  absence of an element between two frames of the same flow.
- **inferred**: I reasoned it from two static frames of the same flow, or from the shape of the
  UI. Said so, and to be treated as a hypothesis rather than a measurement.

The empirical duration evidence Solen already owns is better than anything this sweep can add:
`MOTION.md` THE SPEED LAW was built from live Playwright captures of computed `transitionDuration`
over roughly 3,000 elements per page on x.com and airbnb.com. **This document does not restate,
re-derive or contradict those numbers.** What this sweep adds is the layer the speed law does not
cover: *which moments get motion at all*, and *what that motion is doing*.

---

## 1. Findings

### F1. The confirmation of a commit is a MOMENT, not necessarily a PAGE. Revolut is the proof.
**Confidence: observed, 4 screens, 1 app.**

Four separate Revolut screens show one anatomy: the parent screen (Review transfer, Complete
order, a payment chat thread) stays mounted and is dimmed to near black, and a small rounded panel
with a drag grabber sits at the bottom carrying one icon and one or two lines of text.

- [Revolut, "You sent $10.10 to YAP / Arriving: Instantly"](https://mobbin.com/screens/2a4195e0-605e-4215-9091-7b885783635e), blue check
- [Revolut, "Your $1 transfer to Sam Lee is being processed"](https://mobbin.com/screens/99459ea6-5ce5-4ec8-93ad-9d482b753132), grey clock, not a check
- [Revolut, "Your order has been processed"](https://mobbin.com/screens/bc0ed19f-23ac-49e9-8f06-e4525e947582)
- [Revolut, "Marked as paid!"](https://mobbin.com/screens/a2d02e1d-cb39-456f-931a-b34cdc2e8f24)

The icon carries the state distinction: a check for done, a clock for pending. The panel is the
same panel in all four. Inferred, from the grabber and the heavy scrim: this is a sheet that rises
and auto-dismisses back to the parent, not a route change.

At the other end of the range, [Fresha's iOS appointment-confirmed screen](https://mobbin.com/flows/98f220ae-7b2b-40d3-b298-88c73f8d32a6)
is a full-bleed purple-to-blue gradient filling the whole viewport with a thin white check and a
serif headline, no chrome at all. And [Ladder](https://mobbin.com/screens/6d6e7bea-123b-458e-bf58-df53394f15a3)
fires actual confetti over a glossy sphere.

So the corpus does **not** converge on one confirmation treatment. It splits by **how often the
user will see it**. A money transfer happens constantly, so Revolut spends nothing. An appointment
is booked rarely, so Fresha spends the whole screen. That is the variable to reason from, not
"what does a confirmation look like".

### F2. Of 8 success screens across 8 apps, 6 make a circle-plus-check the focal, 2 add particles.
**Confidence: observed, 8 screens, 8 apps.**

[Rappi](https://mobbin.com/screens/655408b7-525f-4956-8480-0a029681aa66) is a green disc with a
white check and roughly 8 small coloured dots radiating outward, on an otherwise empty white screen
with no CTA at all (inferred: it auto-advances).
[Swiggy](https://mobbin.com/screens/02cd37b4-0939-454a-aee7-7d3a7f88fe93) is the same disc with a
caption and no CTA. [Zomato](https://mobbin.com/screens/2fddba38-dbab-4bac-a631-48a7cde8b427) puts
a white-ringed check on a green band above a live reservation page.
[ANZ Plus](https://mobbin.com/screens/af6ea053-b36a-401e-bbb4-a21346160512) and
[Tripadvisor](https://mobbin.com/screens/67bbce2c-1482-4d71-b0db-7ec3a31daa8f) use an outlined
circle. [Marriott Bonvoy](https://mobbin.com/screens/dcd11968-b4fc-447f-a5fd-c33167b7d2be) uses a
bare orange check glyph with no disc at all. Ladder and Rappi are the two with particles.

The relevant Solen fact: **the disc is the corpus majority, and Solen's owner killed it.**
`components-legacy/booking/BookingConfirmation.tsx:35-36` (verified-in-repo) reads "The big
SuccessMark disc is an owner-killed pattern and does not come back for any state." This document
does not reopen that. See V1 for what actually replaced it, which is not a disc and is already
shipping.

### F3. Nobody spins. 7 of 7 loading screens in the sample are content-shaped skeletons.
**Confidence: observed, 7 screens, 7 apps.**

[Instacart](https://mobbin.com/screens/f9209678-54f7-4b08-ad7d-e932c90df6ff),
[foodpanda](https://mobbin.com/screens/77e6b9fe-fcb3-42b1-b52a-e9049a874635),
[Faire](https://mobbin.com/screens/13efd6d3-3b71-4fc0-940e-f66428c60530),
[Hatch Sleep](https://mobbin.com/screens/37667ddd-fca9-435d-a2f6-0ce64ba52515),
[Careem](https://mobbin.com/screens/c940d5da-a82e-4dbf-a041-bfe9f6b5469c),
[Believe](https://mobbin.com/screens/d0076f56-92c3-4495-a9f8-dcde640341dc),
[AllTrails](https://mobbin.com/screens/a6a7bb97-d19a-410e-94cc-9473cbeeb39b). Zero spinners in the
seven. Every placeholder block matches the geometry of the content it stands in for.

Two details worth copying:

- **foodpanda and Faire show a visible lightness gradient inside the placeholder blocks.** That is
  a shimmer sweep frozen mid-frame, direct evidence the shimmer is a real moving highlight rather
  than a static grey.
- **Careem keeps the real filter chips ("4.5+ Rated", "30 mins") fully rendered and coloured above
  the skeleton rows.** The chrome does not skeletonise with the list. Only the genuinely unknown
  part goes grey.

The one legal spinner in the corpus is **inside a button**: the Fresha iOS "Add an extra service?"
step renders its black commit pill with three dots in place of the label
([Fresha flow](https://mobbin.com/flows/98f220ae-7b2b-40d3-b298-88c73f8d32a6)), the submit-pending
state. That matches Motion sheet 22's existing "spinners only INSIDE buttons" line, and it is the
concrete form of `TASTE_MOTION.md` finding 11 (spend motion where the user waits on an external
system) for the pay step.

### F4. Selection feedback is a fill or a border change on the element itself. It is never a flourish.
**Confidence: observed, 9 selection states, 9 apps.**

| app | selected looks like |
|---|---|
| [Careem](https://mobbin.com/screens/d40a71b7-49d8-4e5e-83ab-f56cad1334ce) | pale green fill + green border on the time pill |
| [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) | solid purple disc on the date, white numeral |
| [CVS Health](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90) | pale blue fill + blue border on the slot |
| [Octopus Energy](https://mobbin.com/screens/fd73de74-cc81-444c-bbed-0c52c57d5938) | magenta fill + the word "Selected" |
| [Airbnb iOS booking sheet](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a) | solid **black** date disc and **black** time pill |
| [Airbnb web filters](https://mobbin.com/screens/82ade726-f657-4840-bc40-2bea08cfcaa8) | 2px **ink** border on the tile, ink-filled checkbox |
| [Uber](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea) | 2px **ink** rounded border around the ride row, white fill |
| [Resy](https://mobbin.com/flows/87e21b63-0454-4143-a52a-ee12e5024af3) | fill inversion, white chip on the dark surface |
| [Calendly](https://mobbin.com/screens/efd6b01f-94da-4012-9655-3ba11f331cd5) | solid blue fill; unselected is white with a blue border |

Not one of the nine uses a bounce, a check animation or a particle as the primary selection signal.
The signal is colour. The motion is only the crossfade that gets it there.

**This finding says do LESS, and that is worth naming because the pull is always the other way.**
Solen's snap tier (150ms, in-place flip, `snap` curve) already matches the corpus and should not be
upgraded to a spring.

**The sharpest single fact for Solen in the whole sweep:** Airbnb, the owner's main reference, uses
**ink black** for the selected date and the selected time slot inside its own booking sheet, and
reserves Rausch for the Reserve button alone. The owner's "Airbnb but not the red" instinct is
literally what Airbnb itself does one layer inside the funnel.

Two secondary observations from the same set, useful to the DATE control specifically: Fresha marks
**unavailable** dates with a strikethrough rule through the numeral (not merely grey), and Calendly
runs a three-state day (solid blue selected, pale blue tint available, plain grey unavailable)
rather than a two-state one.

### F5. The commit bar is persistent, and its LABEL absorbs the current selection.
**Confidence: observed, 6 apps.**

- [CVS Health](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90): the button reads
  **"Book 9:10 AM"**, not "Book". The chosen slot is written into the CTA.
- [Airbnb web](https://mobbin.com/screens/5f99d74b-4947-427a-8ef9-d98d9a62f55e): **"Show 120
  results"**, then **"Show 52 results"** after a duration filter
  ([frame](https://mobbin.com/screens/00f5e265-68e6-4ea8-bc26-382287e8fa9a)), then **"Show 9
  homes"** and **"Show 8 homes"** as filters accumulate in the full modal. The result count is live
  in the button *before* you commit.
- [Careem](https://mobbin.com/flows/bd65af36-8e8c-4a36-8deb-306cd0dc7a4c): a fixed footer carrying
  "Total AED 109.00" with an up-chevron to expand the breakdown, beside the Next pill; the total
  moves to AED 118.00 at checkout when the service fee lands.
- [Uber](https://mobbin.com/screens/a580c48b-f52a-4a3c-87c7-7bb8aa4056cc): **"Choose Premier
  Hourly"** with the date and time on a second line inside the button.
- [Fresha web](https://mobbin.com/flows/0ae100c9-f9bb-4a81-8837-772fd8ac330c): a persistent right
  rail reading "No services selected / Total free" with a **greyed disabled** Continue, which fills
  with the line item and total as Continue turns solid black.
- [Airbnb iOS](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a): "$45 / group"
  beside the black Next pill.

So the number in the commit bar changes several times per session. That is exactly the Motion sheet
22 row "Money value changes → roll/odometer tick", and see V5 for why that row currently points at
the wrong implementation.

### F6. The commit bar ENTERS at the moment it has something true to say.
**Confidence: observed via two frames of one modal; the transition itself is inferred.**

The clearest evidence in the sweep, because it is two frames of the same component:

[Airbnb web spa scheduling](https://mobbin.com/flows/da3b6a13-e25f-48f6-a479-8e1601ad48b7). Frame
2, no time selected: the modal ends flush at the bottom of the slot grid and **no footer bar
exists**. Frame 3, 10:00 AM selected and filled black: **a footer bar is now present**, carrying
"$43 for 1 guest" and a black Next pill above a hairline. The footer is not disabled in frame 2.
It is absent.

[Square Go](https://mobbin.com/flows/7ab7c8e8-808e-475e-a543-1d2314dd47da) shows the same shape
driven by scroll instead of selection: the unscrolled salon sheet has no bottom CTA
([frame](https://mobbin.com/screens/b302dc27-ed66-4442-a59e-1e4dc73799b1)), and once scrolled into
Services a full-width purple Book pill has appeared at the bottom
([frame](https://mobbin.com/screens/8465e7b9-4cb8-49d9-9f56-6354cd04b25e)).

Inferred, not observed: the bar slides up, because it sits at the viewport edge and has nowhere
else to come from.

Airbnb's own PDP is the counter-example and it matters: on the
[listing detail](https://mobbin.com/flows/142ed034-95b8-45a1-afa5-9f86d83da640) the price and
Reserve bar is present at every scroll position from the first frame, never absent. The difference
is that a listing already has a price with no input required, while a spa slot does not exist until
you pick one. **The bar appears when it has something true to say.** That is Solen's own
no-fabrication rule wearing a motion costume.

### F7. The PDP header collapses on scroll and the title migrates into the nav bar.
**Confidence: observed, two frames of one salon in one app; corroborated structurally in 1 more.**

[Fresha iOS, photo state](https://mobbin.com/screens/daa7dd6f-8d5c-4ebe-b82c-a8838d417d80): hero
photo with a "1/10" counter, circular white back/share/heart floating on the image, salon name in
large ink below the photo, a category tab strip below that, and a sticky bottom bar reading "136
services available | Book now".

[Fresha iOS, same salon collapsed](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9):
the photo is gone, the salon name now sits **truncated inside the top bar** beside an inline back
arrow, share, and a now **filled red** heart, and the tab strip (Photos, Services, Team, Reviews,
Buy, About) has become the sticky element with a 2px ink underline on the active tab. The bottom
bar is unchanged between the two states.

Two things travel: the title moves up into the bar, and the header controls change from floating
circles over a photo to flat inline icons on white.
[Resy](https://mobbin.com/flows/84491685-d675-454f-9b2c-509c3905a4bd) does the same, going from an
X-over-photo to a centred title bar.

Inferred: this is scroll-position-driven, not duration-driven, since it must track the finger and
reverse mid-gesture. It is also the exact case `TASTE_MOTION.md` finding 6 authorises reveal-tier
motion for (things that travel and must be located afterwards).

### F8. The photo lightbox goes dark in every app in the sample, including light-themed ones. 6 of 6.
**Confidence: observed, 6 screens, 6 apps.**

[Vrbo](https://mobbin.com/screens/2629e939-c780-487a-9e25-20e112fd2dba) (5/7),
[Zesty](https://mobbin.com/screens/7a002100-2e2b-44d9-b5c1-b33e4aa27ac8) (2/20),
[Zillow](https://mobbin.com/screens/f2e21d79-f6ff-44e8-bad2-92942a57e0e1) (33 of 33),
[Viator](https://mobbin.com/screens/ecf797d4-5ed7-402e-a725-5bca19e21160) (8/8),
[Grab](https://mobbin.com/screens/33567942-a02c-49d9-9a61-3e627e1054dc) (1/8),
[Careem](https://mobbin.com/screens/303977eb-2a8c-4a2e-ab2e-d0d9e0ec562c) (5 / 12, dark green
rather than black, still dark).

Every one carries a photo counter and a close affordance. Zillow and Vrbo keep the commit action
alive inside the overlay ("Request a tour", "Return to property"), so opening a photo never strands
the user away from booking. See V6 for the Solen collision this creates.

### F9. Web checkouts signpost with a stepper. Mobile booking uses a thin bar plus a "next step" label.
**Confidence: observed, 5 web apps and 1 mobile app.**

Web: [Zillow](https://mobbin.com/screens/cb235a42-d620-4738-aed4-a398e9eec086) (8 nodes; done =
filled circle with a check, current = hollow ring, joined by a blue rule),
[Etsy](https://mobbin.com/screens/d82670cc-3bdf-46e2-bc31-3272265b44f0) (checks behind, solid black
dot for current, hollow grey ahead),
[lululemon](https://mobbin.com/screens/1b90a989-8460-400b-bbcc-1747d579961e) (numbered),
[Kiwi.com](https://mobbin.com/screens/12181c41-fe71-46e2-985a-328d8a9dccf5) (green checks),
[Cloudflare](https://mobbin.com/screens/a690806a-41bf-4c40-9904-f7f9eb441564) (2 nodes).
Fresha web uses a text breadcrumb instead: "Services > Professional > Time > Confirm", current step
in ink, the rest grey ([flow](https://mobbin.com/flows/0ae100c9-f9bb-4a81-8837-772fd8ac330c)).

Mobile: [Careem](https://mobbin.com/flows/bd65af36-8e8c-4a36-8deb-306cd0dc7a4c) uses a 3px green
rule under the step title that grows across steps, plus a literal text line **"Next step: Popular
add-ons"**. The bar and the label together answer both "how far am I" and "what is coming", which
no stepper in the web set does.

Inferred: the bar's width animates between steps. A width animation is what THE SPEED LAW rule 2
forbids for Solen ("never animate width, height or top"). A `scaleX` transform on a full-width
track produces the identical picture with no reflow.

### F10. Confirmation of a NON-commit action is an inline toast anchored above the sticky bar, carrying an action.
**Confidence: observed, 1 app, 1 clear frame.**

[Resy](https://mobbin.com/flows/dec6dd1f-4f37-464d-8dee-268efd1868f3): after adding a restaurant to
a list, a pill-shaped bar appears at the bottom of the content reading "♥ Changes saved" on the
left and "See Lists" on the right, sitting directly above the persistent party/date bar and
occupying the strip where the slot chips were. It does not cover the sticky bar, and it does not
appear at the top. Solen's shipped toast already matches this; its doc comment does not. See V7.

### F11. A held slot gets a real, ticking countdown.
**Confidence: observed, 1 screen.**

[Square Go](https://mobbin.com/flows/7ab7c8e8-808e-475e-a543-1d2314dd47da) renders **"Appointment
held for 39:56"** directly under the confirm-details headline. That is a live number, not a badge,
and it is the honest way to communicate a slot lock. Solen's Motion sheet 22 already carries the
vocabulary ("Live position/number updates → departure-board flip", `.animate-num-flip`). Noted as
available, not proposed: Solen does not hold slots today, and a countdown with no real hold behind
it would be fabricated data.

### F12. The step-to-step transition itself is invisible in this instrument.
**Confidence: NOT OBSERVABLE. I could not verify this.**

I could not determine from static screenshots what any app's step transition looks like: slide,
fade, push, or none. Every flow in the sample gives the endpoints and nothing between them. Anyone
who wants this answered should record the live site with the repo's Playwright video path, which is
how THE SPEED LAW was built and which is a measurement rather than an inference.

---

## 2. What the corpus says about Solen, checked against Solen's actual code

Everything in this section is **verified-in-repo**: I opened the file and read the line.

### V1. The booking confirmation lost its disc but KEPT its motion, and `MOTION.md` records neither.

`MOTION.md` line 89 states, ticked done: "SuccessMark on the success peaks , DONE:
booking-confirmed, walk-in-joined, gift-card-sent, package-bought all use SuccessMark".

That is stale. `grep -rn SuccessMark` across the repo returns exactly two non-dev call sites:
`app/[locale]/_components/tips/TipFlow.tsx:170` and `app/[locale]/onboarding/OnboardingFlow.tsx:138`.
Booking-confirmed, walk-in-joined, gift-card-sent and package-bought are **not** among them.
`components-legacy/booking/BookingConfirmation.tsx:35-36` explains why, and it is an owner call: the
receipt rebuild replaced the centred-celebration layout for every payment state, and "the big
SuccessMark disc is an owner-killed pattern and does not come back for any state."

**The celebration motion survived the disc.** `BookingConfirmation.tsx` carries `.celebrate-rise`
on four elements: the headline (435), the details card (444), the money card (515), the CTA (559).
The peak is still marked, without a graphic. That matches Revolut (F1) better than a disc would:
the moment is acknowledged, the ornament is not.

**The defect is the ORDER, not the presence.** Only two of the four carry a delay:
`animationDelay: "0.2s"` on the headline (line 438) and `"0.68s"` on the CTA (line 560). The cards
at 444 and 515 have no delay, so they start at 0ms. **The two cards land before the headline above
them.** The eye is pulled to the middle of the receipt, then back up to the title. Compare
`OnboardingFlow.tsx:139-140` (0.46s then 0.56s) and `TipFlow.tsx:172-176` (0.46s, 0.56s, 0.66s),
both of which stagger correctly top to bottom.

### V2. `Sheet.tsx` enters at 600ms. THE SPEED LAW caps a reveal at 300ms.

`app/[locale]/_components/primitives/Sheet.tsx:44`: `"transition-transform duration-[600ms] ease-glide"`.

`MOTION.md` THE SPEED LAW: the reveal tier is 250-300ms, and "Above 300ms is reserved for a
FULL-SCREEN transition only." A bottom sheet is a reveal that travels. 600ms is **double the ceiling
of the law in the same repo**, on the most-used travelling surface in the product (filters, sort,
service detail, staff profile, reschedule, cancel, tip). The exit at 200ms on `thud` (line 47) is
correct, fixed by the THE CURVE RULE pass. Only the entry was missed, because that pass changed
curves and not durations, which is `TASTE_MOTION.md` finding 17 landing half-way.

Corroboration that 600ms is an outlier and not a house style: `Modal.tsx:42` enters at 250ms, the
sheet backdrop at 300ms (`Sheet.tsx:182`), the toast at 200ms.

### V3. `BookingWizard.tsx:213` uses `AnimatePresence mode="wait"`, which `MOTION.md` bans by name.

`MOTION.md` hard rule 4 (motion-01, added 2026-07-27): "any `AnimatePresence` wrapping a step-swap,
tab-swap, or other frequently-retriggered transition must use `mode="popLayout"` (or
unmounted-immediately exits), never `mode="wait"`", with an exemption available via a
`motion-ok: <reason>` note.

`components-legacy/booking/BookingWizard.tsx:213` is `<AnimatePresence mode="wait" custom={1}>`
with no `motion-ok:` note. This is the exact surface the rule was written about. The rule's own text
says the gate flags **net-new** `mode="wait"`, which is why this pre-existing one survives: the gate
cannot see it. The effect is that every booking step waits for the previous step's exit to finish
before the next mounts, the literal opposite of the interruptibility rule
(`TASTE_MOTION.md` finding 18), on the flow where a hurried user taps fastest.

### V4. 420ms was retired from THE ENTER RECIPE and is still live in `.celebrate-rise`.

`app/globals.css:520`: `.celebrate-rise { animation: confirm-rise 0.42s cubic-bezier(0.16, 1, 0.3, 1) both; }`

On 2026-07-26 the owner retimed THE ENTER RECIPE from 420ms to 280ms from a side-by-side at
`/de/dev/motion` Demo 7, reasoning that the blur already bought perceptibility and the extra 140ms
was "pure latency on every booking step". The curve here is right (`glide`). The number is the one
the owner explicitly cut. It was never swept because it lives in CSS rather than in
`primitives/motion.ts`.

Same shape, `app/globals.css:1235-1240`: `.slot-cascade > * { animation: slot-in 0.4s ... }` with
delays running to 0.43s, so the last visible slot chip finishes roughly **830ms** after a date is
tapped. A slot grid appearing after a date selection is a reveal, and picking a date is a repeated
action, which is `TASTE_MOTION.md` finding 4's open audit item ("audit the booking-flow chips,
filter pills and content tabs") hitting a real target.

### V5. Two mechanisms exist for the running total. The live one is undocumented, the documented one is dead.

- `components-legacy/booking/CountUpNumber.tsx` is used three times in `ServicesStaffStep.tsx`
  (lines 608, 617, 626) for the running price and duration. It works, and it is the F5 pattern.
- `.animate-value-roll` and `.animate-count-bump`, both defined in `globals.css` and both named in
  the Motion sheet 22 table as THE pattern for "Money value changes" and "Count/badge changes",
  have **zero call sites anywhere in the repo**, dev pages included.

So the table in `MOTION.md` points at a utility nobody uses while the real implementation is a
component the table never mentions. Anyone following the documented rule builds the wrong one.

### V6. The white-only web gate and the photo lightbox will collide.

F8: 6 of 6 photo lightboxes in the sample use a dark backdrop, including in otherwise light apps.
Solen's NEVER-AGAIN floor 1 and `~/.claude/hooks/white-only-web-gate.py` refuse dark-mode CSS in any
web file.

These are not truly in conflict: a dark scrim behind a photo is a **surface treatment for one
overlay**, not a theme, and no `prefers-color-scheme` or `data-theme` is involved. But the gate
matches on patterns rather than intent, and the floor's wording ("no dark-mode CSS in any web
file") is broad enough that whoever builds the gallery either gets blocked or ships a white
lightbox that no app in the sample uses. **Surface it before building, do not resolve it silently**
(precedence chain tier 2 procedure). **I did not run the gate against a sample lightbox, so I do
not know for certain that it fires.** That is a thirty-second check for whoever picks this up.

### V7. `Toast.tsx` has a doc comment describing the opposite of what the component does.

`Toast.tsx:20-21` reads "**Top-of-viewport slide-down.** Brand register: notifications appear ABOVE
the content, slide in from y:-20, instead of 'bottom toast' which competes with content", and line
263 repeats "enter: y:-20 → 0". But line 237 is
`bottom-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))]` and line 324 says "V3-D462: slide up
from below (bottom-docked), spring-settle".

The **code is correct**: it matches both the locked Chime toast recipe and F10 (Resy anchors its
toast at the bottom, above the sticky bar). The **comment is stale**, describing a superseded
behaviour. Anyone reading the top of the file before editing gets the wrong model of the component.

---

## 3. Verdict for Solen, ranked by value over effort

The first six are small, precise edits with named lines. None is a redesign, and none changes what
the user sees except R7, which therefore goes through a mockup first per the mockup-first rule.

| # | change | file:line | why, from the corpus |
|---|---|---|---|
| **R1** | `duration-[600ms]` → `duration-300` on sheet entry | `app/[locale]/_components/primitives/Sheet.tsx:44` | V2. The repo's own SPEED LAW caps a reveal at 300ms, and sheets are the most-repeated travelling surface in the product. Leave the 200ms `thud` exit alone, it is already right. |
| **R2** | Add stagger delays to the two undelayed `.celebrate-rise` elements so the receipt lands top to bottom | `components-legacy/booking/BookingConfirmation.tsx:444` and `:515` | V1. Today the cards arrive before the headline. Suggested 0.32s and 0.44s, between the headline's 0.2s and the CTA's 0.68s. Does not touch the owner-killed disc. |
| **R3** | `mode="wait"` → `mode="popLayout"` on the booking step swap | `components-legacy/booking/BookingWizard.tsx:213` | V3. `MOTION.md` hard rule 4 bans it by name on exactly this surface; the gate only catches net-new instances, so this one needs a hand fix. |
| **R4** | Retime `.celebrate-rise` 0.42s → 0.28s, and `.slot-cascade` 0.4s → 0.28s with delays compressed to ~0.03s steps | `app/globals.css:520`, `:1235-1240` | V4. 420ms is the number the owner cut from THE ENTER RECIPE on 2026-07-26; the slot cascade currently finishes ~830ms after a date tap, on a repeated action. |
| **R5** | Retire `.animate-value-roll` and `.animate-count-bump` from the Motion sheet 22 table and name `CountUpNumber` as the live mechanism | `_design-system/MOTION.md` Motion sheet 22 table; `components-legacy/booking/CountUpNumber.tsx` | V5. A documented pattern with zero call sites plus an undocumented one with three is a trap for the next build. |
| **R6** | Correct the stale header comment to describe bottom-docked entry | `app/[locale]/_components/primitives/Toast.tsx:20-21`, `:263` | V7. Code right, comment opposite. Zero visual change. |
| **R7** | Make the booking commit bar appear only once it has a true value to state, entering on the reveal tier | `components-legacy/booking/ServicesStaffStep.tsx` (running summary), `app/[locale]/_components/salon/SalonMobileBookBar.tsx` | F6. Airbnb's spa modal has **no footer at all** until a slot is picked, and Solen's own no-fabrication rule says the same thing. **Visual change, so mockup first.** |
| **R8** | If the booking flow gains a step-progress affordance, drive it with `scaleX` on a full-width track, never an animated width | future, `BookingWizard.tsx` header area | F9 plus SPEED LAW rule 2. Careem's growing bar plus a literal "Next step: X" label is the strongest mobile signposting in the sample and beats every web stepper at answering "what is coming". |
| **R9** | Before building a PDP photo lightbox, surface the dark-scrim question with the owner rather than resolving it | `~/.claude/hooks/white-only-web-gate.py`, NEVER-AGAIN floor 1 | F8 plus V6. 6 of 6 apps go dark behind a photo, including light-theme ones. A scrim is not a theme, but the floor's wording is broad and this is the exact shape precedence-chain tier 2 exists for. |

### Two things the corpus says NOT to do

- **Do not add a spring, a bounce or a check animation to selection states.** F4: nine apps, nine
  colour-and-border changes, zero flourishes. Solen's 150ms snap tier already matches the corpus.
  Restraint here is not under-building, it is the measured norm.
- **Do not bring back a celebration disc on the booking confirmation.** The owner killed it
  (`BookingConfirmation.tsx:35-36`), and F1 shows the most restrained reference in the sample
  (Revolut) marking its commit moment with a check inside a small dismissable panel rather than a
  page-scale graphic. The staggered receipt entrance already fills that role. R2 only fixes its
  order.

---

## 4. What I did not check

Stated so no silence reads as a clearance.

- **I did not measure a single duration or curve from Mobbin.** Static screenshots cannot carry
  them. Every millisecond figure above is either read out of Solen's source or labelled inferred.
- **I did not observe any app's step-to-step transition** (F12). Slide versus fade versus none is
  unknown from this instrument.
- **I did not run `white-only-web-gate.py` against a sample dark-scrim lightbox** (V6), so I do not
  know whether it actually fires. R9 assumes it might.
- **I did not check the mobile repo** (`~/Documents/solen-mobile`). This is web only.
- **I did not verify that R1 through R4 typecheck or render.** This is a research pass; the layered
  loop owns the build.
- **I did not check whether `walk-in-joined`, `gift-card-sent` or `package-bought` still have any
  success treatment at all** after the SuccessMark removal. `MOTION.md` line 89 claims they use
  SuccessMark and the grep says they do not, so all three are unverified surfaces. That deserves
  its own look and is not covered here.

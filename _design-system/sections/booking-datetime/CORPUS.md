<!-- exists-check: net-new as a CORPUS doc, vs _rules/SOLEN_PATTERNS.md (a Fresha→Solen
     translation playbook scoped to the salon-detail PAGE, no date/time coverage beyond a
     one-word component list at line 93), _design-system/components/Step.md + business/Step.tsx
     (a marketing "how it works" step, unrelated), _roadmaps/roadmap-empty-states-discovery.md
     (empty states, not this screen), app/api/availability/time-slots/route.ts and
     supabase/migrations/045_booking_waitlist.sql (backend, not design research).
     `npm run exists datetime` returns 7 hits, all IMPLEMENTATION: DateTimePicker.tsx,
     DateTimeStep.tsx, DateTimePickerRange, the dev primitives page, the dashboard settings
     range use, walk-in-pay. None is external design research for this screen.
     This file EXTENDS the per-section spec set at _design-system/sections/salon-detail/
     (same house format, see its README.md) into a second route, and every recommendation
     inside it extends the existing DateTimePicker primitive rather than proposing a new one. -->

# Booking step: date + time , Mobbin corpus

**Reference:** Mobbin sweep, 15 searches (11 iOS screen, 3 web screen, 1 flow), run 2026-07-29
**Component (ours):** `app/[locale]/_components/primitives/DateTimePicker.tsx` (the one primitive, V3-D445) consumed by `components-legacy/booking/DateTimeStep.tsx:194`
**Layer:** 1 chrome (strip + slot grid) + Layer 2 accent on the selected pick (`selectedTone="accent"`)

---

## 0. Sample

**Core set: 72 screens across 39 apps** whose job is "pick a day and/or a time slot for an appointment or a service window." 39 iOS, 33 web. Every one of those 72 is a screenshot I opened and looked at; nothing here is described from metadata or from memory of a brand.

Drawn from a wider sweep of roughly 150 screens across about 59 apps. The ~78 screens outside the core set are surrounding flow steps (service pick, checkout, confirmation), generic "no bookings yet" empty states that turned out not to be the "this day has no slots" state, and ride/delivery time wheels. They are excluded from every count below. Where I cite one of them it is labelled adjacent evidence.

Apps in the core set: Fresha (iOS + web), Airbnb (iOS + web), Preply (iOS + web), Warby Parker, Careem, Alan, Angi, adidas, Best Buy, CVS Health, Zocdoc, Future Pro, Booking.com, Crate & Barrel, Rivian, Redfin, ClassPass, Instacart, Woolworths, Rappi, Plata Card, Selfridges, Square, Calendly, Hotjar, Apollo, Braintrust, Maze, Bonsai, Clockwise, Zoom, Walmart, Headspace, GoDaddy, HoneyBook, Amie, Care.com, Kajabi, Wrangle.

**Two honesty notes that bound everything below.**
1. Mobbin returns downscaled static screenshots. I did **not** measure pixels off them. Every dimensional statement about a competitor is ordinal (bigger than / more columns than), never a px value. The only px values in this file are read out of Solen's own source.
2. Static screenshots carry no motion. The motion section reports only what two captures of the *same* screen in different states let me infer, and says so explicitly.

---

## 1. Dominant anatomy

Top to bottom, the shape that recurs. Frequencies are over the 72-screen core set.

| # | Band | Frequency | Note |
|---|---|---|---|
| 1 | **Step title naming the choice**, left-aligned, the largest text on the screen ("Select time", "Date & time", "Select a day and time") | **53 of 72 (74%)** | The 19 without it put the venue or session name in the nav bar instead ([ClassPass](https://mobbin.com/screens/06566e4d-c4e4-409e-99a8-77280c73a38c), [Preply](https://mobbin.com/screens/b04dd400-a2c9-4afb-b004-dd4227a96624)) |
| 2 | **Who / where you are booking with**, pinned above the date control | **47 of 72 (65%)** | Fresha uses a small avatar+name chip with a chevron ([iOS](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf)); Warby Parker uses a location card with an "Edit" link ([iOS](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09)); desktop puts it in a right rail ([Fresha web](https://mobbin.com/screens/1af27022-7642-40fe-86b7-6c445c78dd69)) |
| 3 | **Month or week label** with prev/next affordance | Present on most, not counted separately | "September 2024" as a small bold label above the strip is the Fresha and Airbnb form |
| 4 | **Date control**: horizontal day strip **45 of 72 (63%)** vs month grid **27 of 72 (38%)** | see §2 | iOS 28 of 39 strip (72%), web 17 of 33 strip (52%) |
| 5 | **Slot region**: single-column list **35 of 72 (49%)**, 2-to-4-col wrapped chip grid **20 of 72 (28%)** | see §3 | 7 use one column per day, 5 a horizontal pill row, 2 a dropdown, 3 not classifiable |
| 6 | **Recovery affordance** when the day is thin or empty | minority, see §4 pattern 9 | Fresha "Join the waitlist", Plata "Select the closest slot", Resy "Notify" |
| 7 | **Commit** | iOS: **21 of 39 have no button at all**, 18 do and 13 of those anchor it to the bottom | Desktop overwhelmingly puts it in the right rail or under the form |

The single most repeated arrangement, and the one both apps the owner named converge on: **step title, then who-with, then a horizontal week strip, then times, with unavailable days greyed in place.**

---

## 2. The date control

**45 of 72 use a horizontal day strip.** The split by platform is the finding: **28 of 39 iOS screens (72%)** but only **17 of 33 web screens (52%)**. The month grid clusters almost entirely on desktop scheduling tools ([Calendly](https://mobbin.com/screens/38aa4cc6-7e69-4e2f-acbb-52a52ff62da8), [Hotjar](https://mobbin.com/screens/43ba84f5-aabb-4c52-9105-1b772747ae2c), [Apollo](https://mobbin.com/screens/f287b94c-0d99-4cfb-8f60-6468c8f20ea5), [Braintrust](https://mobbin.com/screens/1c22e358-c09d-4b64-8ef5-c4925dd53643), [Maze](https://mobbin.com/screens/9ae69786-cec8-402d-8b4b-661a833322ab), [Bonsai](https://mobbin.com/screens/cf7017df-f48d-4014-83d3-9537733997a2), [Wrangle](https://mobbin.com/screens/9a9ea15d-87cb-4a75-bb02-261a3c87ce15), [GoDaddy](https://mobbin.com/screens/efdc1005-cdcc-41a5-b862-567af7ede3a6), [HoneyBook](https://mobbin.com/screens/63e5a82e-8159-4368-b162-2a86d019f192), [Kajabi](https://mobbin.com/screens/3023c90f-db92-407d-b628-d49fb8fb569d)), where the user is picking a meeting weeks out. Consumer appointment apps use the strip.

**Selected-day shape**, over the 45 strip and day-column screens:

| Shape | Count | Examples |
|---|---|---|
| Filled circle around the date number | 19 | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) purple, [Airbnb](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a) black, [Alan](https://mobbin.com/screens/6ab8b275-a280-48a4-bc27-5359722b07da) purple, [Angi](https://mobbin.com/screens/0b12eaed-42c3-4d47-a3bb-e048b60ec40d) teal |
| Rounded rectangular card (weekday over number) | 11 | [Warby Parker](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09), [Instacart](https://mobbin.com/screens/a91586bf-246f-4be6-9bb2-7353d0264a9e), [Woolworths](https://mobbin.com/screens/081d6835-1358-4b9e-a9c7-d8abf6179023), [Rappi](https://mobbin.com/screens/bee0eb5c-e428-4d75-9cb8-aef0c47c2806), [Headspace](https://mobbin.com/screens/3d59765f-ae34-4aa7-b295-51fd9c6239d6) |
| Text tab with an underline | 8 | [ClassPass](https://mobbin.com/screens/06566e4d-c4e4-409e-99a8-77280c73a38c), [adidas](https://mobbin.com/screens/da1c0bb4-b40e-4620-8111-bc6a603caf98) |
| Day becomes a column header, slots stack beneath it | 7 | [Selfridges](https://mobbin.com/screens/b1a9f8c9-f625-42d4-9c23-a40ed0c69a91), [Walmart](https://mobbin.com/screens/549f940d-633c-4f7f-b554-d03819b57ae1), [Clockwise](https://mobbin.com/screens/e47e0634-3932-4b77-84ce-8e0ad27b79f7), [Zoom](https://mobbin.com/screens/c77a8c31-632c-4e30-8450-16dfc49b876e) |

**Unavailable days are never removed. 27 of the 27 screens where I could see the encoding leave the dead day in place**, greyed, struck through, or explicitly labelled. Strongest examples: [Fresha web](https://mobbin.com/screens/1af27022-7642-40fe-86b7-6c445c78dd69) strikes 20 and 24 through while keeping them in the strip; [Walmart](https://mobbin.com/screens/4bd49aef-edc5-4793-8123-d19faa44b006) writes the word "Full" under every full day chip; [Crate & Barrel](https://mobbin.com/screens/8479339b-b4e7-4b57-942d-a9013fdc80a5) ships a literal legend ("[ ] = Available, [-] = Not Available"); [Klook](https://mobbin.com/screens/d136df71-7cb1-4db2-a95f-b6d6eed1d00e) marks the whole tail of the month "Sold out".

**Escape hatch out of the visible week: only 15 of the 45 strip screens (33%) have one.** That is a minority by count, but it is exactly the minority that matters: it is Fresha (a calendar icon button top-right of the strip, opening a full month sheet, see the [date sheet](https://mobbin.com/screens/275c30c6-a60e-4906-a4c6-c2515c400e4e)), Airbnb (same top-right calendar icon, [iOS](https://mobbin.com/screens/59baec91-c776-4e10-8a44-1d0cf0f639aa) and [web](https://mobbin.com/screens/ab1cb67f-0ecd-46c7-862c-65e980e0c89f)), Selfridges (a "Choose your date" button that drops a [month popover](https://mobbin.com/screens/294d7e2a-9c2c-49ad-91a0-9064387546c0)), and Amie. Everyone else expects you to scroll the strip. A strip with no jump-out cannot reach next month at all.

---

## 3. The slot region

**35 of 72 (49%) render slots as a single-column, full-width list.** This is worth naming plainly because the archetype's own working title says "grid": the corpus majority is **not** a grid. Fresha is single-column on all five of its screens ([iOS](https://mobbin.com/screens/fb91848d-b343-447d-a948-eed9397f037d), [web](https://mobbin.com/screens/249a97e8-dc45-403c-bf83-1a92a40beb99)), as are Calendly, Hotjar, Bonsai, Braintrust, Maze, Amie, Kajabi, Headspace, Alan, Preply, ClassPass, adidas, Instacart, Woolworths and Rappi.

**20 of 72 (28%) use a wrapped chip grid.** Column counts I could read off the images:

| Columns | Count | Screens |
|---|---|---|
| 2 | 6 | [Warby Parker](https://mobbin.com/screens/69b6baa5-99c9-4bbd-99af-2eb6b1476390) (x3), [Careem sheet](https://mobbin.com/screens/92600989-c527-459b-bbd4-c88b622b1192), [Future Pro](https://mobbin.com/screens/179ffa7c-2014-4cb9-9675-6eac9eb108db), [GoDaddy](https://mobbin.com/screens/efdc1005-cdcc-41a5-b862-567af7ede3a6) |
| 3 | 6 | [Angi](https://mobbin.com/screens/0b12eaed-42c3-4d47-a3bb-e048b60ec40d), [Best Buy](https://mobbin.com/screens/4d9c67b6-7e10-4000-8aea-e2141414be36), [CVS](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90), [Booking.com](https://mobbin.com/screens/5c354f54-dd59-434c-b906-070c867c64d3), [Preply web](https://mobbin.com/screens/594bdecb-90a8-4e8d-9952-7d9cf4cd5fac), [HoneyBook](https://mobbin.com/screens/63e5a82e-8159-4368-b162-2a86d019f192) |
| 4 | 4 | [Zocdoc](https://mobbin.com/screens/c155b69a-613b-4a65-ba08-a409ee20471b), [Best Buy](https://mobbin.com/screens/f53ad3b2-1c8c-43c9-98a0-0a5de5f35333), [Square web](https://mobbin.com/screens/5c191789-20a8-4f82-8ee5-2f0be71714b4) |
| ~6 wrapped (desktop) | 2 | [Airbnb web spa](https://mobbin.com/screens/ab1cb67f-0ecd-46c7-862c-65e980e0c89f) |
| mixed / other | 2 | [Care.com](https://mobbin.com/screens/68c4df8c-8a4a-4e76-8e7b-589a7a243621), [Klook](https://mobbin.com/screens/d136df71-7cb1-4db2-a95f-b6d6eed1d00e) |

On mobile, **4 columns is the densest tier anyone used, and only three screens went there**: two Zocdoc, one Best Buy. Both are US volume-throughput apps (a doctor with 40 same-day openings, a Geek Squad bench). Neither is a taste reference for this product.

**Day-part grouping (Morning / Afternoon / Evening headers or a segmented control): 17 of 72 (24%).** Users: [Alan](https://mobbin.com/screens/6ab8b275-a280-48a4-bc27-5359722b07da), [Preply](https://mobbin.com/screens/1a9103b0-d862-4caf-948d-4d828f151ccb), [adidas](https://mobbin.com/screens/195c6ec5-7967-4f1a-a28c-847a3ff628b0) (with a count in the header, "MORNING (8)"), [Square web](https://mobbin.com/screens/5c191789-20a8-4f82-8ee5-2f0be71714b4) (which renders the header even when empty: "Morning / No availability"), [Selfridges](https://mobbin.com/screens/1980c408-f4f2-4b61-b9ac-698bcf7c2e00), [GoDaddy](https://mobbin.com/screens/efdc1005-cdcc-41a5-b862-567af7ede3a6), [Woolworths](https://mobbin.com/screens/081d6835-1358-4b9e-a9c7-d8abf6179023) (as a 3-pill segmented filter), [CVS](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90), [HoneyBook](https://mobbin.com/screens/63e5a82e-8159-4368-b162-2a86d019f192), and [Angi](https://mobbin.com/screens/4697fe75-4a42-46f7-8e49-fbb5bef4d732) which makes the day-part the *only* choice with an exact time behind a "Or choose a specific start time" link.

**Neither of the owner's two named references groups by day-part. 0 of 5 Fresha screens and 0 of 5 Airbnb screens do it.** They render a flat chronological list. Solen currently does group. That is a live divergence from both references, addressed in §9.

---

## 4. Pattern table

| # | Pattern | Frequency | Evidence | Verdict for Solen |
|---|---|---|---|---|
| 1 | Horizontal day strip as the primary date control on mobile | 28 of 39 iOS core screens (72%) | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf), [Airbnb](https://mobbin.com/screens/59baec91-c776-4e10-8a44-1d0cf0f639aa), [Warby Parker](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09), [ClassPass](https://mobbin.com/screens/06566e4d-c4e4-409e-99a8-77280c73a38c), [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8), [Angi](https://mobbin.com/screens/0b12eaed-42c3-4d47-a3bb-e048b60ec40d) | **Adopt.** Already shipped: `dateLayout="strip"` at `DateTimeStep.tsx:200`. No change. |
| 2 | Persistent jump-to-month control **beside the strip header**, not at the end of it | 15 of 45 strip screens (33%), but includes both named references | [Fresha](https://mobbin.com/screens/1af27022-7642-40fe-86b7-6c445c78dd69) and [Airbnb](https://mobbin.com/screens/ab1cb67f-0ecd-46c7-862c-65e980e0c89f) both park a calendar icon top-right, reachable without scrolling | **Adapt.** Solen has the sheet, but the trigger is the *last* card in a 14-day horizontal scroll (`DateTimePicker.tsx:330-345`), so it costs 14 swipes to find. Move it to the strip header. |
| 3 | Unavailable days stay in place, greyed or labelled, never removed from the strip | 27 of 27 where the encoding was visible | [Fresha web](https://mobbin.com/screens/249a97e8-dc45-403c-bf83-1a92a40beb99) strikethrough, [Walmart](https://mobbin.com/screens/4bd49aef-edc5-4793-8123-d19faa44b006) "Full" label, [Klook](https://mobbin.com/screens/d136df71-7cb1-4db2-a95f-b6d6eed1d00e) "Sold out" | **Adopt.** Already shipped via `isDateDisabled` + the `text-s-ink/30 cursor-not-allowed` branch. Consider Walmart's word-label over pure opacity: opacity alone is not a colour-independent signal. |
| 4 | Single-column full-width slot list rather than a dense chip grid | 35 of 72 (49%) list vs 20 of 72 (28%) grid; Fresha is 5 of 5 list | [Fresha iOS](https://mobbin.com/screens/fb91848d-b343-447d-a948-eed9397f037d), [Fresha web](https://mobbin.com/screens/166ff431-9ecd-4c10-8c71-05677027f941), [Calendly](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02), [Bonsai](https://mobbin.com/screens/3ac8a628-0d2d-4066-9931-7f666643670a) | **Adapt, do not copy wholesale.** Solen's 4-column grid is the densest tier observed and squeezes the touch target (§9). Drop to 3 columns, or go single-column like Fresha. A full-width row also leaves space for a per-slot surcharge later. |
| 5 | Provider / venue identity pinned above the date control | 47 of 72 (65%) | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) avatar chip, [Zocdoc](https://mobbin.com/screens/3d9c066a-b33c-4fbe-ab06-fe96a70c2b3a) doctor card, [Fresha web](https://mobbin.com/screens/1af27022-7642-40fe-86b7-6c445c78dd69) right rail with salon photo, rating and price | **Adopt.** Already shipped as the staff pill at `DateTimeStep.tsx:163-186`. It matches Fresha's chip almost exactly (avatar, name, chevron, opens the staff step). |
| 6 | Saturated fill on the selected day and the selected slot | 19 of 45 strip screens fill a circle; a saturated fill is the majority selected treatment across all classifiable screens | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) purple, [Booking.com](https://mobbin.com/screens/5c354f54-dd59-434c-b906-070c867c64d3) blue, [Angi](https://mobbin.com/screens/0b12eaed-42c3-4d47-a3bb-e048b60ec40d) teal, [Airbnb](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a) black | **Adopt.** This validates the LOCKFILE carve-out (selected is calm gray everywhere *except* the booking date/slot, which stays blue). The corpus says a booking slot is exactly the control that earns a saturated fill. Do not "fix" this to gray. |
| 7 | No commit button: the slot tap **is** the commit | 21 of 39 iOS core screens | [Fresha](https://mobbin.com/screens/fb91848d-b343-447d-a948-eed9397f037d), [Warby Parker](https://mobbin.com/screens/5ca0edf5-d512-4edc-bf5b-847c00ad5a59), [Zocdoc](https://mobbin.com/screens/c155b69a-613b-4a65-ba08-a409ee20471b), [ClassPass](https://mobbin.com/screens/06566e4d-c4e4-409e-99a8-77280c73a38c), [adidas](https://mobbin.com/screens/da1c0bb4-b40e-4620-8111-bc6a603caf98) | **Reject.** It is the plurality, and it is still wrong here: Solen's step carries a multi-service cart and a running total, and the sticky-CTA floor (hierarchy-density-06) requires a reachable commit. Keep the bottom bar. This is a deliberate divergence, not an oversight. |
| 8 | Bottom-anchored bar carrying the running total next to the CTA | 13 of 39 iOS core screens | [Careem](https://mobbin.com/screens/751ec4d3-9cd1-473a-8597-176dae223f7c) "Total AED 109.00 ^ / Next", [Angi](https://mobbin.com/screens/ce81e62f-b49e-45a1-a528-3d9e0d057de1) "PRICE DETAILS $124.08 v / Continue", [Airbnb](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a) "$45 / group / Next" | **Adopt.** Already shipped (`pb-28` root + the wizard's fixed bar). Careem and Angi both make the total *expandable* from the bar (a caret), which is a cheap way to satisfy the trust floor's price-breakdown requirement without a second screen. |
| 9 | A recovery affordance when the day is thin or empty, not a dead end | Minority, but it is the reference behaviour | [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) "Can't find a suitable time? Join the waitlist"; [Plata](https://mobbin.com/screens/eb4cdf05-ba33-42c8-a958-22fa652fc670) "The closest time slot available is on May 27, 9 a.m." + "Select the closest slot"; [Resy](https://mobbin.com/screens/9668166e-2287-4708-aebc-236edbba6e69) a "Notify" bell with a time-range picker; [Future Pro](https://mobbin.com/screens/179ffa7c-2014-4cb9-9675-6eac9eb108db) "NONE OF THESE TIMES WORK". Counter-example: [ClassPass](https://mobbin.com/screens/008fff9c-872f-4aa6-a0a3-0f6b931af46c) renders a bare "Nothing available" on an otherwise blank screen | **Adopt, and extend.** Solen's waitlist already does this (full card on an empty day, quiet link otherwise, `DateTimeStep.tsx:229-260`). The one thing missing is Plata's move: *name the next date that has availability*. Solen already computes `unavailableDates`, so this is derivable, not fabricated. |
| 10 | Capacity / scarcity per slot ("10 spots left", a seat count badge) | 12 of 72 (17%) | [Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108) "10 spots left", [Calendly](https://mobbin.com/screens/38aa4cc6-7e69-4e2f-acbb-52a52ff62da8) "100 spots left", [ClassPass](https://mobbin.com/screens/fedc38b2-31b9-4d52-93e0-d8d5ef83d3dc) numeric badge, [Headspace](https://mobbin.com/screens/3d59765f-ae34-4aa7-b295-51fd9c6239d6) "1 clinician available" | **Reject for now.** A salon slot is one chair, so "spots left" is meaningless, and inventing a number breaks taste rule 1. Calendly's own "100 spots left" on every single row is the failure mode: a scarcity signal that never varies is noise. Leave the prop seat, render nothing. |
| 11 | Price or discount printed inside the slot itself | 4 of 72 core (heavy in the adjacent restaurant set) | [Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108) "$25 / guest"; adjacent: [TheFork](https://mobbin.com/screens/49741f15-2093-487b-ac0c-1f6e74b0555d) "-40%" under each time, [Swiggy](https://mobbin.com/screens/c8782372-d19d-4db0-ad9b-88b96ade4aa2) "20% off", [Zomato](https://mobbin.com/screens/4bafaf23-c039-4d50-8ef7-aa04164780e5) "2 offers" | **Adapt, conditionally.** Only where a real per-slot delta exists (peak surcharge, off-peak discount). Solen already owns the tokens (surcharge orange `#EA580C`, taste rule 5; the pale-green `-X%` pill from SalonCard). Do not add the slot without the data. |
| 12 | Cancellation / reschedule term rendered **on the date-time step**, not deferred to checkout | 5 of 72 (7%) | [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8) info card "free cancellation up to 6 hours before"; [Angi](https://mobbin.com/screens/4697fe75-4a42-46f7-8e49-fbb5bef4d732) pale-green card "Free rescheduling up to 24 hours before"; [Klook](https://mobbin.com/screens/d136df71-7cb1-4db2-a95f-b6d6eed1d00e) chips above the picker. Adjacent, best treatment seen: [Square checkout](https://mobbin.com/screens/eeadd93e-20e3-45e2-8685-780e69ab8202) renders the policy as a *timeline* with a "Cancel before Dec 31" marker | **Adopt, on grounds other than frequency.** 7% is a weak popularity argument and I am not making one. The argument is that Solen's own trust floor (hierarchy-density-05) already requires the cancellation term in the DOM above the commit, and the time you pick is what determines it. Careem's compact info card is the shape to copy. |
| 13 | Day-part grouping of slots | 17 of 72 (24%), **0 of 5 Fresha, 0 of 5 Airbnb** | [Alan](https://mobbin.com/screens/6ab8b275-a280-48a4-bc27-5359722b07da), [adidas](https://mobbin.com/screens/da1c0bb4-b40e-4620-8111-bc6a603caf98), [Square web](https://mobbin.com/screens/5c191789-20a8-4f82-8ee5-2f0be71714b4), [Angi](https://mobbin.com/screens/4697fe75-4a42-46f7-8e49-fbb5bef4d732) | **Keep, and log it as a deliberate divergence.** It is a minority pattern and both named references reject it. It earns its place on a long salon day and costs a header plus a size step on a thin one. Gate the grouping on slot count instead of removing it. |
| 14 | Desktop: two-pane, picker left, live booking summary right, CTA in the summary | near-universal across the 33 web core screens | [Fresha web](https://mobbin.com/screens/1af27022-7642-40fe-86b7-6c445c78dd69), [Square](https://mobbin.com/screens/5c191789-20a8-4f82-8ee5-2f0be71714b4), [Selfridges](https://mobbin.com/screens/a82ab4b2-9573-414b-96da-16963482982e), [Calendly](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02) | **Adopt for the desktop breakpoint.** Fresha's rail is the closest fit: salon photo, rating, chosen date and duration, line items, total, then one CTA. Note Fresha's CTA is *black* ([selected state](https://mobbin.com/screens/249a97e8-dc45-403c-bf83-1a92a40beb99)), which matches Solen's ink-CTA lock exactly. |

---

## 5. Grid

Ordinal observations only. No pixel measurement was taken off the Mobbin images.

- **Date strip.** Day cells are wide enough to carry two or three stacked lines (weekday, number, and on [Redfin](https://mobbin.com/screens/982f1ab4-f062-4de9-acbb-59245229e747) and [Instacart](https://mobbin.com/screens/a91586bf-246f-4be6-9bb2-7353d0264a9e) a month abbreviation too). Roughly 4 to 6 days are visible on a mobile viewport in every strip I looked at, with the next day cropped at the right edge. That cropping is doing work: it is the scroll promise, and it matches Solen's density floor.
- **Circle-style strips fit more days than card-style strips.** Fresha shows 5 date circles plus a partial 6th; Warby Parker's cards show 3 plus a partial 4th. If you want a week visible without scrolling, the circle is the cheaper shape.
- **Slot chips are square-ish to wide, never tall.** Every chip I saw is a single line of text with symmetric horizontal padding, pill or 8-to-12 radius. Nobody stacks a second line inside a chip unless it carries a price or a capacity ([Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108), [Swiggy](https://mobbin.com/screens/c8782372-d19d-4db0-ad9b-88b96ade4aa2)), and those switch to a full-width card to make room.
- **Column count tracks label length, not screen width.** 12-hour locales with "10:15 AM" cap out at 2 or 3 columns ([Warby Parker](https://mobbin.com/screens/11be216a-ddfa-4cc4-80c5-8470fc835b09), [CVS](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90)); 24-hour or bare-hour labels go to 4 or more ([Airbnb web](https://mobbin.com/screens/ab1cb67f-0ecd-46c7-862c-65e980e0c89f)). Solen's de/fr/it locales are 24-hour, so a wider grid is *typographically* available. Whether it is *ergonomically* available is a separate question, and §9 says it currently is not.
- **The compare-days layout** (one column per day, slots stacked under each) exists and is the right answer when the user's real question is "which day has anything", not "which time on Thursday". [Walmart's immunization scheduler](https://mobbin.com/screens/549f940d-633c-4f7f-b554-d03819b57ae1) puts 7 day-columns of chips on one desktop screen; [Selfridges](https://mobbin.com/screens/b1a9f8c9-f625-42d4-9c23-a40ed0c69a91) does 5 columns x 3 day-parts as collapsible dropdowns. Not recommended for Solen mobile, noted because it is a real third option nobody remembers.

---

## 6. Type

Ordinal again. What I can state from the images is hierarchy order and a rough count of distinct steps, not sizes.

- **One clear anchor, and it is the step title.** In [Fresha](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf), [Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108) and [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8) the title ("Select time", "Select a time", "Date & time") is visibly the largest text on the screen by a wide margin, left-aligned, with everything else in a tight band below it. This is the shape Solen's floors ask for: one anchor, then restraint.
- **The date number is the second tier and it is the only place a big numeral appears.** Fresha, Airbnb, Alan, Preply, Angi and Booking.com all set the day number noticeably larger and bolder than its weekday label. The weekday is the whisper, the number is the target.
- **Slot times are body-weight, not bold.** In the single-column apps (Fresha, Calendly, Bonsai, Braintrust, Kajabi) the time inside the row reads regular or medium. Bolding every slot would put emphasis on 20 equal items, which is exactly the flatness failure Solen's EMPHASIS BUDGET names. Only the *selected* slot changes weight or colour.
- **Distinct sizes per screen look like 3 to 4** on the cleanest examples (Fresha iOS, Airbnb iOS, Careem), counting title / date number / slot label / small meta. That sits inside Solen's <= 4 ceiling.
- **Tabular numerals matter here and most apps appear to use them.** Times in a vertical stack line up on the colon in every screenshot where I could see a two-digit and a one-digit hour adjacent. Solen already sets `tabular-nums` on both the day number and the slot label.
- **Day-part headers, where they exist, are the smallest text on the screen** and usually in a muted ink, sometimes with a sun/moon glyph ([Preply](https://mobbin.com/screens/1a9103b0-d862-4caf-948d-4d828f151ccb), [CVS](https://mobbin.com/screens/6ffbe483-99bf-4f36-b97b-8b7c00a1ce90)) or a count ([adidas](https://mobbin.com/screens/da1c0bb4-b40e-4620-8111-bc6a603caf98), "MORNING (8)"). They read as a label, not a heading.

---

## 7. Motion

**Stated plainly: Mobbin returns static screenshots, so I observed no animation.** What follows is inference from pairs of captures of the same screen in different states, plus one captured transitional frame. Each is labelled.

- **Inferred, from a state pair.** [Airbnb without a slot selected](https://mobbin.com/screens/59baec91-c776-4e10-8a44-1d0cf0f639aa) has **no bottom bar at all**. [The same screen with 12:00 PM selected](https://mobbin.com/screens/e69ab53d-633c-4d51-bd6a-072daec7140a) has gained a bottom bar carrying "$45 / group" and "Next". The commit bar *arrives* on first selection rather than sitting there disabled. That is a real behavioural choice from the owner's main reference and it differs from Solen's always-present bar.
- **Inferred, from a state pair.** [Fresha web before selection](https://mobbin.com/screens/166ff431-9ecd-4c10-8c71-05677027f941) shows a grey disabled "Continue" and a rail listing only the service and price. [After picking 9:00 AM](https://mobbin.com/screens/249a97e8-dc45-403c-bf83-1a92a40beb99) the slot gains a purple 1px border, the rail gains a line reading "Sunday 18 August, 9:00-9:10 AM (10 min duration)", and Continue turns solid black. One tap writes into three places, and the slot does not navigate.
- **Inferred, from a state pair.** [Hotjar before](https://mobbin.com/screens/43ba84f5-aabb-4c52-9105-1b772747ae2c) shows a plain 20:15 row. [Hotjar after](https://mobbin.com/screens/3ba92586-773a-400a-a6d2-090d378cc961) shows that same row split in half into "20:15" plus a blue "Confirm". [Calendly](https://mobbin.com/screens/38aa4cc6-7e69-4e2f-acbb-52a52ff62da8) does the identical split. The row transforms in place, so the confirm affordance is born out of the thing you just tapped rather than appearing elsewhere. Desktop pattern in both cases.
- **Observed, a real captured frame.** [adidas](https://mobbin.com/screens/a2338dd5-b537-4e3f-b67d-666e1418d331) captures the slot list dimmed behind a full-screen "PREPARING YOUR BOOKING..." overlay. So at least one app in the set holds the user on the slot list while the write happens rather than navigating first and spinning on the next screen.
- **What I could not determine.** Whether the slot list animates in when the day changes, easing curves, durations, and whether the strip snaps or scrolls freely. None of that is recoverable from screenshots. Solen already answers it internally (`slot-cascade` on both slot containers, `ease-snap` / `ease-glide` press tiers, per MOTION.md and the Motion-22 lock). No corpus evidence contradicts that, and none supports it either.

---

## 8. Components

Mapping the corpus back onto what this repo already owns. FLOORS LAW 9 applies (compose, do not redraw): everything below extends an existing component, none of it proposes a new one.

| Corpus element | Solen component | State |
|---|---|---|
| Day strip + slot region | `primitives/DateTimePicker.tsx` (`dateLayout="strip"`, `selectedTone="accent"`) | Live. **The** date/time primitive per V3-D445. Do not fork. |
| Month sheet behind the strip | Same file, `Sheet` + `SolenCalendar` at `DateTimePicker.tsx:210-225` | Live. Trigger placement is the open issue (pattern 2). |
| Provider chip above the picker | Hand-built in `DateTimeStep.tsx:163-186` | Live, but hand-drawn. Candidate for extraction if a second surface needs it. |
| Slot loading state | `slot-cascade` skeleton grid at `DateTimePicker.tsx:519` | Live. Shape matches the final layout, which is the locked `<Skeleton>` contract. |
| Empty-day state | `emptySlotContent` prop, filled by `DateTimeStep.tsx:216-226` | Live. Currently a Lucide `Clock` at 36px plus one line, which is the "grey Lucide disc" shape the locked `EmptyState` anatomy explicitly rejects (promise headline + gesture subline + filled ink CTA + 3D category icon). Worth reconciling. |
| Waitlist recovery | Inline card / quiet link, `DateTimeStep.tsx:229-260` | Live, and a better answer than most of the corpus. |
| Running total + commit | Booking wizard fixed bar (`pb-28` reserve) | Live. |
| Cancellation term on this step | Nothing | **Missing.** Pattern 12. |
| Desktop two-pane rail | Nothing on this step | Not built. Pattern 14. |

---

## 9. Where Solen actually stands

Read from source on 2026-07-29 (`DateTimeStep.tsx`, `DateTimePicker.tsx`, `BookingWizard.tsx`), not from a rendered page. I did not run a browser measurement; where that matters I say so.

**Solen is already at or near the corpus consensus on the structural questions.** Strip layout, staff chip above the picker, disabled-in-place unavailable days, a month sheet escape hatch, a skeleton that matches the final shape, a waitlist recovery on an empty day, and a bottom commit bar. That is most of §4 already shipped. There is no structural rebuild here.

Four things are genuinely off, in descending order of severity:

1. **The slot button computes to about 43px tall, under the locked 44px touch-target floor.** From source: `px-3.5 py-2.5` + `text-[14px]` + a 1px border (`DateTimePicker.tsx:576-577`). With the inherited 1.5 line-height that is 10 + 21 + 10 + 2 = 43px. I computed this from the class list; I did **not** run `getBoundingClientRect` on a rendered page, and that measurement is the confirming step. Going to `py-3` clears it.

2. **Four columns is the densest arrangement in the whole corpus and only three screens used it, none of them a reference for this product.** `grid grid-cols-4` at `DateTimePicker.tsx:565` inside a `max-w-[360px]` container. Three columns would put Solen with Angi, CVS, Booking.com and Preply, buy back horizontal room for the 44px fix, and leave space for a surcharge label later.

3. **The step has no display anchor.** Reading the step's own source, the largest type I found is the 22px day number in the strip, against a 14px slot label and a 16.5px centred, truncating wizard `h1` (`BookingWizard.tsx:206`). FLOORS LAW 6 wants one anchor >= 28px on a customer screen with no photographic focal, and the EMPHASIS BUDGET wants that anchor at >= 1.8x body: 22/14 is 1.57x. The corpus agrees with the floor, not with the current build, since Fresha, Airbnb and Careem all put a large left-aligned step title above everything. I did not render the page, so I cannot rule out something larger arriving from a sibling component; a rendered size census is the confirming step.

4. **The step's distinct font sizes, counted from source, are 12, 12.5, 13, 13.5, 14, 15, 16.5 and 22.** Eight, against a ceiling of four. The 12 / 12.5 and 13 / 13.5 pairs are precisely the failure the EMPHASIS BUDGET names in clause (c): more sizes, no more hierarchy. Source-derived, not rendered.

And one thing that is a **choice, not a defect, and should be logged as such**: Solen groups slots by day-part, and neither Fresha (0 of 5) nor Airbnb (0 of 5) does. 17 of 72 screens across the corpus group. The grouping is defensible on a long salon day and indefensible on a thin one, where it spends a header and a size step on two slots. Gate it on slot count rather than removing it.

---

## Provenance

- Corpus assembled 2026-07-29 from 15 Mobbin searches (11 iOS screen, 3 web screen, 1 flow). Flows examined: [Fresha, making an appointment](https://mobbin.com/flows/98f220ae-7b2b-40d3-b298-88c73f8d32a6), [Square Go, booking an appointment](https://mobbin.com/flows/7ab7c8e8-808e-475e-a543-1d2314dd47da), [Careem, home service order](https://mobbin.com/flows/bd65af36-8e8c-4a36-8deb-306cd0dc7a4c).
- V3-D445 , one `DateTimePicker` primitive, no bespoke date UI. Every recommendation here extends it.
- LOCKFILE selected-state carve-out (booking date/slot stays blue) , corroborated by pattern 6, not contradicted.
- hierarchy-density-05 (trust floor) , the basis for pattern 12, which frequency alone would not justify.
- hierarchy-density-06 (sticky CTA) , the basis for rejecting pattern 7 despite it being the iOS plurality.
- FLOORS LAW 6 + EMPHASIS BUDGET (b)(c) , the basis for §9 items 3 and 4.

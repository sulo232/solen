<!-- exists-check: net-new vs the following, all read or grepped on 2026-07-30 before writing.
     `npm run exists "book again"` = 0 hits. `npm run exists "upcoming appointment"` = 0 hits.
     `npm run exists "rebook"` returns a GRAVEYARD hit plus a live backend, both load-bearing and
     both handled in section 4c: 🪦 components-legacy/barber/ExpressRebook.tsx (one-tap
     rebook-your-last-cut, removed 2026-07-11, zero importers, predates the pay-first walk-in flow)
     versus the LIVE /api/bookings/express-rebook + /confirm endpoints, bookings.is_express_rebook,
     bookings.rebooked_from_id, notification_preferences.rebooking_enabled and the
     /api/cron/rebooking-nudge cron. Nothing here proposes rebuilding the removed component.
     `npm run exists "recently viewed"` returns the live RecentlyViewed section, the
     /[locale]/recently-viewed route and useRecentlyViewed, all named in section 4a rather than
     duplicated, plus a 🪦 hit on components-legacy/ProfilePage.tsx which is not proposed here.
     The structure this EXTENDS is _design-system/research/AXIS_*.md (one lens per file) and it is a
     sibling of sections/home-feed/CORPUS.md, which is the anatomy sweep. CORPUS.md counts WHAT is
     common; this file argues WHY, for one lens only, and deliberately re-reads none of its numbers.
     Not duplicated: PSYCH_RETENTION.md (behavioural laws, no per-screen evidence), TASTE_EMPTY_STATES.md
     (12-app empty-state sweep, cited in section 3 rather than recounted). -->

# WHY: RETURN

The lens: what a home screen owes somebody who already knows what they want.

**Instrument:** Mobbin MCP, 14 searches (12 iOS, 2 web), run 2026-07-30. Every screen linked below
was returned by one of those searches and its image was examined before being described. No screen
here is described from metadata or from memory of the brand.

---

## 0. Sample, stated before any claim

- **183 screen results** returned across the 14 searches. I identified **4 exact repeats** across
  searches, so **179 distinct captures** were examined as images.
- Of those, the ones carrying a returning-user affordance that I could read top to bottom are the
  only ones cited. **Every frequency below names its own denominator inline and lists the members.**
  There is no global "N of 179" number in this document, because the searches were aimed at
  different questions and a pooled denominator would be meaningless.
- **Proportions are read off screenshot geometry, not measured.** Where I say a block occupies
  "roughly a third of the viewport" that is an eyeball on a 299 px-wide render, not a PIL
  measurement. I did not run the pixel scripts for this lens and I am not dressing estimates as
  measurements.
- **Mobbin returns still images.** Nothing about timing, transition, gesture or a time-conditional
  rule is observable. Section 5 lists what that cost me.
- **The beauty-booking sample is five products, not a category.** `CORPUS.md` already established
  that Booksy, Treatwell, StyleSeat, Vagaro, Squire and Mindbody are absent from Mobbin's corpus. I
  did not re-search them. Where this file says "appointment products" the observed members are
  **Fresha, Square Go, ClassPass, Zocdoc** and, at the retail edge, **Ulta**.

**Solen-side facts.** Every claim about Solen in section 4 came from reading
`app/[locale]/page.tsx`, `_components/homepage/RecentlyViewed.tsx`, `Hero.tsx`,
`_components/profile/ProfileTabs.tsx`, `app/[locale]/termine/page.tsx` and
`app/api/bookings/express-rebook/route.ts` on 2026-07-30, plus three `npm run exists` runs. Nothing
about Solen here is recalled.

---

## 1. The four positions apps actually take

Four, not three, and they are genuinely different bets about what "return" IS. One product often
runs two of them at once, which is itself a finding.

---

### Position A: pin the commitment on home

**The belief.** The returning user's most valuable next action is the one they already committed to.
Home's job is to close that loop before offering anything new, because a user who opens the app with
an outstanding obligation is usually opening it *about* that obligation.

**What it buys.** Zero navigation to the thing they would otherwise hunt for. A place to hang the
actions that only exist while a commitment is live: directions, phone, add-to-calendar, cancel. And
it makes the app feel like it knows them, which no browse row can do.

[Zocdoc](https://mobbin.com/screens/20a3461b-b970-489a-a6fe-09109272e261) is the fullest version I
found. Reading down: "Hi Alex", a "Search specialty" field, a specialty chip strip, then **"Up
next"**, a card carrying the date and time as the boldest text on the screen, the doctor's name, the
reason ("Dermatologist - Acne"), an embedded Apple Maps tile **with the doctor's face as the map
pin**, an underlined "View appointment details", and a three-icon action row (phone, calendar, map).
Below that, the first browse section, "Well Guide", is cut off at the fold.

Also holding this position: [DoorDash](https://mobbin.com/screens/aff3baf7-3bb3-4f49-bdac-0e2803a33c38),
where "Hello, Sam" is followed by a "Picking up your order" card with a four-node progress rail, and
the rest of the home screen is an **activity feed with timestamps** ("10 hours ago") ending in
"You're all caught up"; [Grill'd](https://mobbin.com/screens/d77e8dd1-33d8-49c6-87e2-164c6d7bf9a9),
which puts the order card **above its own greeting**;
[Hims](https://mobbin.com/screens/1fda61b6-f5ae-4921-b07e-9ca9aaddb864), whose entire home is
account state (an order rail, "My Subscriptions", "Refills on Sunday, Jan 5", a black "+ Add
Treatment");
[IHG](https://mobbin.com/screens/24a8541a-10dd-4678-a7a7-c51a033c08f5), which renders "Your stays"
as two minimal rows; and
[Starbucks](https://mobbin.com/screens/46c0f164-855b-4c19-a06c-7ce6ecec40e7), whose "Your Usuals"
row of three circular drink photos with a "+" baked into each photo is the entire returning-user
proposition.

**What it costs.**

1. **The largest single block of first-viewport space.** On the Zocdoc screen a returning user sees
   **no browse content at all** above the fold. That is the price, stated plainly.
2. **It is dead weight to a first-timer**, and the same screen for that user is a greeting, a search
   field, chips, and then a gap where a card they cannot have would go.
3. **It is dead weight to a returning user too, most of the time**, if the commitment is far away.
   More on this in section 3, because it is the whole Solen argument.
4. **It tends to create a second anatomy for one entity.** Fresha's home renders a salon as a
   thumbnail-left "Book again" row and, two centimetres below, the same salon as a photo-top
   "Favourites" card. `CORPUS.md` already flags this; it is FLOORS LAW 8's exact failure, shipped.
5. **It needs a live read on every home render.** No read, no card, and a fabricated one is banned.

**Which product it suits.** Products where the commitment is **imminent and actionable**. A delivery
arriving in 25 minutes. A dermatologist tomorrow, where the open question really is "where is it and
can I still get there". The three delivery apps that put a **browse row inside the tracker**
([talabat "Shop while you wait"](https://mobbin.com/screens/23aef2e5-05bc-4fe7-aa91-826a232146ea),
[Glovo "Need to fill the fridge?"](https://mobbin.com/screens/11d66eda-0aac-4f96-bdf0-8ef1d785ceb0),
[Swiggy's Instamart strip](https://mobbin.com/screens/1a5afb56-1a73-416e-a3c0-bc59a8af73ad)) show how
far this goes: when the wait is 25 minutes, the wait itself is a browsing surface.

**Which product it harms.** Anything where the commitment is weeks out and nothing about it needs
action. A haircut on the 14th of next month does not need a map on your home screen today, and
pinning it spends the best slot on the page for 34 of 35 days to answer a question nobody asked.

---

### Position B: give return its own destination, keep home for browse

**The belief.** Return is a **mode**, not a row, and a mode deserves an address. Home is the browse
instrument and stays identical for everybody.

**What it buys.** Unlimited room for the returning-user content, so it can be rich without taxing
anything. One home screen to design, measure and grade instead of two states. And a **count badge
does the reminding at almost no cost**: Zocdoc's tab bar shows a "1" on Appointments,
[Fresha labels its section "Upcoming 1"](https://mobbin.com/screens/419c463d-1dd9-48d5-bef0-9805363d2b56),
and [IHG puts the count in the tab itself, "2 upcoming stays"](https://mobbin.com/screens/e84d2315-5b01-4d81-a46c-36d2bb39256a).

The cleanest holder is **ClassPass**. Its home is
["For You"](https://mobbin.com/screens/7d9f25d6-03d7-4732-b0e7-6a40320c46a4), opening on "Browse by
credits" tiles (<4 / <6 / <10 credits) and then "New members love this place" and "Trending today!".
There is **no reservation on home at all**. The reservation lives in an
[Upcoming tab](https://mobbin.com/screens/55214e64-ab88-4f1e-bece-9e20ce82d276), where it gets a
map-topped card, the class name, the time with a timezone warning, and Invite / save / calendar
controls.

**Angi** takes it furthest: a whole tab-bar destination called **"Pros"**, auto-populated. Its
[explainer screen](https://mobbin.com/screens/a7a890d8-90d1-4bb5-bbfd-cab6c442e669) reads "We've got
all your favorite pros, right here. We know how valuable it is to find a pro you trust. So we've
made it easier than ever to work with them again", and the phone mockup inside it shows each pro with
"Last project: House Cleaning / Completed on Fri, Nov 8" and a **"Book again"** button.

Also here: [Square Go](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21), whose home
is a bare search pill plus the headline "Schedule your next appointment" plus a grid of 3D category
tiles and **zero personalization**, with everything personal in the calendar tab;
[Starbucks](https://mobbin.com/screens/5976f50f-63db-4d92-a190-99949d822167), whose Order tab
carries "Menu / Featured / **Previous** / **Favorites**" as content tabs; Airbnb's Trips and
Wishlists tabs; and on web, [HBO Max's "My Stuff"](https://mobbin.com/screens/659f3c66-8e62-4f96-9579-4b7d14fbfbac)
and [Clay's "All files / Recents / Favorites"](https://mobbin.com/screens/d4de1240-1399-4a2a-8599-bc6f4719c500).

**What it costs.**

1. **A tap, on the single highest-intent action in the product.**
2. **Discoverability, and Angi paid for it in cash.** Angi had to build a full-screen illustrated
   explainer to teach people that a "Pros" tab exists. That screen IS the measured cost of this
   position. Nobody builds an onboarding page for something users find on their own.
3. **The destination is a dead end when empty**, and this is the most countable finding in the
   document. Of **16 empty saved-list screens** I read
   ([Careem](https://mobbin.com/screens/743f2d8c-04e1-43d7-ac7c-791c435f0f76),
   [Taobao](https://mobbin.com/screens/cbd03e5d-38c8-4fcb-9b4a-47414f27c355),
   [Tabby](https://mobbin.com/screens/19bf7758-0f95-4bfa-ac8d-369c421a1371),
   [Speak](https://mobbin.com/screens/21676e78-2f7d-4f23-9501-0872127a11c5),
   [CHOPT](https://mobbin.com/screens/8e3a8585-b4f6-4c9a-b729-fd5907bda162),
   [Fitbit](https://mobbin.com/screens/509ce46e-2f04-4e14-a75c-208046916686),
   [PayPal](https://mobbin.com/screens/ccb51eaa-14d1-4e58-941c-0638e89fd0d9),
   [foodpanda](https://mobbin.com/screens/30767f1f-fed1-4ebb-9e9a-e5c99ebafbd4),
   [Vocabulary](https://mobbin.com/screens/dbc783bc-9dda-4594-8416-e890f2929624),
   [Etsy](https://mobbin.com/screens/03623070-2f90-4efc-a9b7-5400ec8ef253),
   [TIDE](https://mobbin.com/screens/949b5b23-2e94-40fc-8f08-3e8c6f1b4c08),
   [sweetgreen](https://mobbin.com/screens/2a629cb0-e1cb-4916-9e0d-a5fb68cb592c),
   [Swiggy](https://mobbin.com/screens/224c170b-a9a7-47f3-b897-f27d02377354),
   [Fresha](https://mobbin.com/screens/771c047b-87c1-4818-93a3-b56cfb8dc1b2),
   [eBay](https://mobbin.com/screens/d4450983-2ed9-44b0-bca0-121aa8228c35),
   [Grab](https://mobbin.com/screens/ee6e72e4-c256-448a-9c2c-035101b28b13)),
   **14 are a dead end**: an illustration, a headline, a subline, sometimes one button, and the rest
   of the screen blank. **Only 2 backfill with real actionable content.** Section 3b.

**Which product it suits.** Products where browse is the recurring job every single session, so the
personal content is a lookup rather than a prompt. ClassPass again: with a credit balance, the
weekly question is genuinely "what do I spend these on".

**Which product it harms.** Products where the personal action IS the dominant action. Putting a tap
in front of the thing 70% of sessions want is a tax, and Angi's explainer screen is the invoice.

---

### Position C: put return inside the search instrument

**The belief.** Return is not a separate desire, it is a **shortcut through the same funnel**, so it
belongs where intent is already declared: in and under the search field.

**What it buys.** Almost no home real estate.
[Uber's home](https://mobbin.com/screens/58e88acd-c7a4-40f4-98a5-f9a1911dcae5) puts two recent
destinations directly beneath "Where to?" as **plain text rows with a clock icon**, no photo, no
card, no shadow, and "Suggestions" tiles still make the fold. Read off the screenshot, the two rows
cost roughly an eighth of the viewport for two personal entries, against Zocdoc's roughly one third
for one.

It also **costs a first-timer literally nothing**, because an empty dropdown is invisible rather than
sad. [Confluence](https://mobbin.com/screens/011a7330-6662-4621-9729-cb0e1b65be41) puts "RECENTLY
VIEWED" **above** "SEARCH RESULTS" inside the field's own dropdown.
[KAYAK](https://mobbin.com/screens/0b39d111-e9bd-40e4-a99c-76231c4deb03) does the same with a
"Recent searches / Clear" panel, and separately keeps a home section, so it runs C and D together.
[ClassPass](https://mobbin.com/screens/2a759804-b034-48f9-9292-084d53ca4fb0) puts "Saved places / See
all" as a row of circular avatars on the **Search** screen, not on home.

The most sophisticated version is [Fiverr](https://mobbin.com/screens/642cf656-a82d-4563-94de-73c0e4409661).
Under "Welcome back, Jane D" sits "Pick up where you left off", and its content source is a **vertical
switcher**: "Keep exploring", "Saved services", and the user's literal last query,
`"software development"`, each selectable, feeding one carousel. Return is modelled as three
different memories of the same user, and the user picks which one they are today.

**What it costs.**

1. **It is invisible until tapped**, so it does no reminding and builds no habit. Nothing about a
   dropdown teaches a user that the app remembers them.
2. **It cannot carry a commitment.** A date, a time and a cancellation window do not belong in a
   search suggestion. This position handles *intent* memory well and *obligation* not at all.

**Which product it suits.** Products where the returning user's target is a **repeat destination**
rather than a repeat obligation. Uber is the purest case: you are going to that address again.

**Which product it harms.** Anything with a live commitment, which the dropdown structurally cannot
hold.

---

### Position D: one screen, section present or absent

**The belief.** Personalization is a **section-level** property, never a screen-level one. There is
one home; it grows a band when there is history and drops it when there is not.

**The proof, and it is a clean natural experiment.** Expedia's home,
[signed in with recents](https://mobbin.com/screens/3748378f-5b55-4355-b2f4-24dae74830ef), and
[the same page with no recents row](https://mobbin.com/screens/9bcef1ce-18dd-4032-b718-25e8157d3a68):
identical search box, identical "Go beyond your typical stay" browse grid directly below, one
section present in one and absent in the other. **The shorter page does not read as broken**, because
the browse content closes the gap.

Same at Starbucks. The [Gold member's home](https://mobbin.com/screens/0320a019-4821-47a5-9dd4-fef9c4e1748c)
shows "597★ GOLD STATUS" and a bonus-stars card; the
[new member's home](https://mobbin.com/screens/1de86909-1796-41b8-879d-4bfa004772f0) shows
"Star balance 0★, GREEN STATUS" and **no "Your Usuals" row at all**. One home, section omitted.

**A finding worth pulling out separately:** I saw a
[third Expedia capture with "Sign in" in the header AND a recent-searches row](https://mobbin.com/screens/6aabaf3c-e9e3-4dd2-b959-0fcebead17c0).
So the trigger is **history, not authentication**. You do not need accounts to have a
returning-user surface. Read as an inference across three captures, not as knowledge of Expedia's
implementation.

Also here: [Vrbo](https://mobbin.com/screens/a2150d39-9dd0-4282-aad3-a0a44e8953fe) ("Your recent
searches", then "Your recently viewed properties", then "Recommended for you" carrying the honest
attribution subline **"Because you viewed vacation homes in Bangkok"**);
[Coursera](https://mobbin.com/screens/0452c7a3-e39a-4906-90da-445683a45f64) ("Continue learning" with
a progress bar as the first section); [Uxcel](https://mobbin.com/screens/1cc395af-aa0b-4148-89b9-7872d82a88a9)
("Resume course"); [Google AI Studio](https://mobbin.com/screens/df127523-bce0-4192-bcc2-e9764cb4d9e0)
("Jump back in"); [GitBook](https://mobbin.com/screens/5926c0f1-beef-4822-a523-7ce65a9c188c) ("Recents").

**What it costs.**

1. **The sparse-but-present state, which is the worst of the three.** Vrbo's "Your recently viewed
   properties" holds **one** card and leaves an obvious hole to its right. HBO Max's "My List" holds
   **two** posters on a row sized for seven. A section that is present and nearly empty reads as a
   bug in a way that an absent section never does. Absence is invisible; sparseness is a defect.
2. **The personal content competes with browse on equal visual terms.** A row that looks like every
   other row does not announce that it is yours, which is exactly the reminding job position A does
   well and this one gives up.

---

## 2. The strongest disagreement I found

**ClassPass and Zocdoc. Same problem, opposite screens, both right.**

They are as close to identical as two products in this sweep get. Both sell an appointment at a
physical place with a named human. Both hold the same data: an upcoming reservation with a time and
an address. Both have a tab bar with room.

- **Zocdoc pins it.** [Home leads with "Up next"](https://mobbin.com/screens/20a3461b-b970-489a-a6fe-09109272e261),
  roughly a third of the first viewport, map tile, phone button, and it *also* runs a badged
  Appointments tab. It spends its best space twice on the same fact.
- **ClassPass refuses to.** [Home is "For You" and opens on "Browse by credits"](https://mobbin.com/screens/7d9f25d6-03d7-4732-b0e7-6a40320c46a4).
  The reservation is one tab away and nothing on home mentions it.

**Why Zocdoc is right for Zocdoc.** A dermatology appointment is scarce, anxious and infrequent.
Between booking and attending, the user's open question is *"is it still on, where is it, can I get
there"*, and they will open the app for no other reason. Zocdoc's home is a **reassurance
instrument**, which is why the card carries a map and a phone icon rather than a photo and a price.

**Why ClassPass is right for ClassPass.** A ClassPass member holds a monthly credit balance. Their
open question, every session, is *"what do I spend credits on this week"*. The booked class is a
solved problem. Home is a **credit-spending instrument**, which is why the literal first thing on it
is three tiles reading <4, <6 and <10 credits.

**The discriminator is not taste.** It is whether the user's open question on opening the app is
**"what next"** or **"is it still on"**. Both apps answered that question about their own user and
built the screen that answers it. Neither is a better designer than the other.

**A second, smaller disagreement, on the same card.** Whether the appointment card leads with a
**map** or a **photo**. I went in believing map-first was a convergence, because Fresha, Zocdoc and
ClassPass all do it. I ran a search specifically to try to break that claim, and it broke:

- **Map at the top:** [Square Go's booking detail](https://mobbin.com/screens/69b4e8aa-dad8-478e-942f-135446da3268)
  (map tile, then the stylist and salon, then the address, then "10 min to location" and a "2.8mi"
  pill), [Uber's confirmed reservation](https://mobbin.com/screens/59272718-bd1c-4b74-9f50-5930f2288423),
  plus Fresha, Zocdoc and ClassPass above. Five.
- **Map at the bottom, or reduced to an icon:** [TheFork](https://mobbin.com/screens/093934b6-b9f4-4297-9722-304a5deb1bd9),
  [Resy](https://mobbin.com/screens/9039df16-400c-4d56-9f7b-0f8bf0f014f8),
  [Grab](https://mobbin.com/screens/6184757f-a516-462d-bf13-7a43770d25a8),
  [Viator](https://mobbin.com/screens/40a72029-6ce7-42f7-8a77-053de848eb25),
  [World of Hyatt](https://mobbin.com/screens/da3decc9-dd5e-409d-8bec-e36ba950c17f),
  [Luma](https://mobbin.com/screens/867a69c9-44c8-4daf-bc71-289ab6bb87ac). Six. And three of those six
  lead with a **photo** instead (Viator, Hyatt, Luma).

**So my original claim was wrong and the real pattern is finer, and better.** The map wins on
**compact surfaces embedded in a feed or list**, where one visual slot must answer "can I get
there". The photo or the plain text wins on a **dedicated detail screen**, where there is room for
both and the map falls to the bottom. That is one entity with a documented density variant, decided
by surface rather than by preference, which is what FLOORS LAW 8 asks for and rarely gets.

The best single artefact in this argument is Square Go's **"10 min to location"** line. That is why a
map earns a top slot: not decoration, an answer.

---

## 3. What happens when there is nothing to pin

This is Solen's actual state today, so it gets its own section.

### 3a. The industry's most common answer is a screen Solen would reject

Of the 16 empty saved-list screens listed in position B, 14 are an illustration plus copy plus a
large blank. Two specifics, because they matter:

- [Airbnb's empty "Recently viewed"](https://mobbin.com/screens/f176bbde-29a6-4137-beca-fe27d50c7a8d)
  is a left-aligned headline, one line of body, a black "Start exploring" button, and then roughly
  two thirds of the screen empty.
- [Fresha's empty "Favourites"](https://mobbin.com/screens/771c047b-87c1-4818-93a3-b56cfb8dc1b2) is a
  centred gradient heart, "No favourites", "Your favourites list is empty. Let's fill it up!", an
  outline "Start searching" pill, and roughly two thirds of the screen empty.

Both trip Solen's NEVER-AGAIN floor 3 (trapped dead space below the primary action must stay under
30% of the viewport). Solen's own structural source of truth fails Solen's own floor here. **Do not
copy the empty state. Copy the omission.**

### 3b. The two apps that got it right, and what they did

- [Tabby](https://mobbin.com/screens/19bf7758-0f95-4bfa-ac8d-369c421a1371): "No favourites yet /
  Save your favourite stores and find them here later / Go shopping", and then **immediately "You may
  like"** with two real store rows (Amazon 4.6, noon 4.6), each with a heart. The empty state and its
  own cure on one screen.
- [Etsy](https://mobbin.com/screens/03623070-2f90-4efc-a9b7-5400ec8ef253): "No favorites yet / **Your
  recommendations get better as you favorite more things.**" plus a dark pill, "We think you'll like
  these". The subline explains the **system consequence** of the emptiness rather than just naming it.
  That is a distinct and more honest copy move than "let's fill it up".

Two of sixteen. It is a minority pattern and it is the right one.

### 3c. The best answer I found is not an empty state at all

[Depop's new-user home](https://mobbin.com/screens/e9f88afb-4fae-4358-b397-2761e15ed39a) is a full
two-column grid of real products, and above it: **"Hey Sam! / Tap into a few items to unlock better
picks."** One line of honest copy, no placeholder component, no illustration, real content
everywhere. It tells the truth about the state of the system and asks for the one input that fixes
it, and it costs one line of type.

### 3d. And "no upcoming" is not the same as "no history"

Of the 6 no-upcoming states I read, **4 fill the gap with past history carrying a rebook action**:

- [Square Go](https://mobbin.com/screens/f997131b-8c8f-470b-b4f6-a56386539138): "No upcoming
  appointments? No problem! Take a look at your past appointments and schedule something", then a past
  visit with a "SEP 1" date block and a full-width **"Rebook"** button.
- [Zocdoc](https://mobbin.com/screens/bc4199bc-ef66-48ee-a8d6-ea790f11d07c): a pale-green "Need care?"
  promise card with an illustration and a black CTA, then "Appointment history" rows each carrying an
  outline **"Book again"**.
- [TheFork](https://mobbin.com/screens/824e82d7-c9a6-4487-b2e0-5438b9c25970): "You have no upcoming
  bookings / Explore restaurants" **inside the Upcoming section's own tray**, so the section keeps its
  shape, then "Past and canceled" below.
- [Uber Activity](https://mobbin.com/screens/2c41d986-0dab-44d9-b14a-8921c2dcf1e6): "You have no
  upcoming trips / Reserve your ride", then Past rows with **"Rebook"** and "Reserve" pills.

The fifth, [Freenow](https://mobbin.com/screens/89e7326c-ea71-4c12-b4ee-489e4777b2ac), has an empty
history too and states both separately. The sixth,
[ClassPass](https://mobbin.com/screens/2c3a1b5f-0066-4cc8-916d-04c36cc0dd91), shows no history at all
and instead keeps the rest of the screen full of other real content ("Bring a buddy!", "ClassPass
benefits"), so the screen never looks empty even when its primary content is.

**And one app asks outright.** [Zocdoc's booking flow opens on a fork](https://mobbin.com/screens/673214b0-cade-48bc-90ba-aa18f1a3152b):
"Who do you want to book an appointment with?" with exactly two cards, **"Rebook with a previous
provider"** and **"Book with a new provider"**. Somebody decided the two users are different enough
to be worth a whole screen and a question. That is the returning-versus-new problem answered in the
flow rather than on the home page, and it is the cheapest place to answer it.

### 3e. The verb inventory, since it is free evidence

Literal strings observed: **"Book again"** (Fresha, Zocdoc, Angi), **"Rebook"** (Square Go, Uber),
**"Repeat"** ([Gojek](https://mobbin.com/screens/e00ae73a-8d67-4a74-934c-47e1652d004d)), **"Reorder"**
([Glovo](https://mobbin.com/screens/ec219155-ec65-490b-9ed7-bac3da4c99ce)), **"Peça de novo"**
([iFood](https://mobbin.com/screens/c8df79a8-2100-4db1-b3f1-eae3af780e30), where the reorder card is
pinned **above** history rather than sitting per-row), **"다시 예약"**
([KakaoTalk](https://mobbin.com/screens/b4d1a7ad-cf41-4108-93a3-5bc7e8683e31)), **"Reschedule"**
([Redfin](https://mobbin.com/screens/3e51ab5e-b6ef-4419-a793-fdfcdc47297b)), and **"Previous"** as a
tab label (Starbucks). Every one of them is one or two words and every one is a verb. Nobody wrote
"Buchen Sie erneut bei Ihrem letzten Salon".

---

## 4. What this implies for Solen, argued

### 4a. What already exists, read on disk today

- **`RecentlyViewed.tsx` is position D, executed with the minority-correct backfill.** It is a
  conditional section keyed on `localStorage` (`solen.recently-viewed`, capped at 5). With no
  history it **falls back to real top-rated salons** (`topSalonIds`, `getTopSalonIds()`), relabels
  its own title from "Zuletzt angesehen" to "Top auf Solen", repoints its link, and returns `null`
  only if the fallback fetch is also empty. That is the Tabby/Etsy pattern that 14 of 16 apps in my
  sample did not bother with, plus a section-level relabel that none of them did. It sits fifth in
  `FeedZone` in `page.tsx`. **I went looking for a defect in this design and could not find one,
  which means I might just be agreeing. Push back on me.**
- **The greeting is already shipped and already correct.** `Hero.tsx` renders `Hallo, {displayName}`
  above the h1 for authed users only, with a documented fallback chain and **no greeting at all for
  anonymous visitors** ("no fake Hallo", per the comment). That matches 15 named apps in this sweep
  (Fresha, Zocdoc, Starbucks, DoorDash, Grill'd, Fiverr, IHG, Hims, Depop, Clay, Google AI Studio,
  GitBook, Fabric, Microsoft Loop, KAYAK). Nothing here asks to change it.
- **`ForYouGreeting` is a graveyard hit with a narrow reason.** Removed 2026-06-04, and the reason in
  `page.tsx` is specific: *redundant with the hero's greeting, two name-greetings on one page*. It was
  not a rejection of greetings. Not re-proposed.
- **`npm run exists "upcoming appointment"` returns 0.** There is no upcoming-appointment component
  anywhere in the product, and `/termine` is a redirect to `/profile/bookings`. Solen currently holds
  **position B by default**, not by decision: return lives in `/profile/*` and home never mentions it.

### 4b. Where Solen sits, and it is neither of the two apps in section 2

Solen sells an appointment at a place, with a named person, on a **4 to 8 week cycle**. Run that
through the section 2 discriminator:

- **Not ClassPass.** There is no credit balance burning down, so "what do I spend this week" is not
  the recurring question. Browse is not a weekly need.
- **Not Zocdoc.** A haircut is not scarce or anxious. The reassurance job exists but it is **dormant
  for almost the entire interval**. Pinning a commitment that is 30 days away spends the top of the
  page every day to answer a question the user asks perhaps twice.

**The distinction that actually decides it, and it is the one thing in this document I would defend
hardest: Airbnb's returning user returns to a CATEGORY. Solen's returns to a PERSON.**

Airbnb's whole return architecture admits this. It resumes a **search**
([Airbnb: "Continue searching for experiences in Miami / May 30 - Jun 1  1 guest"](https://mobbin.com/screens/4f347fd4-5793-41df-a0d9-b29fe02131cc))
and offers **"Recently viewed homes"**, because the specific listing you looked at last year is
probably irrelevant now. It never says "book that place again", because almost nobody does.

Fresha and Angi admit the opposite. Fresha's first home section is **"Book again"** with a named
salon. Angi built a tab called **"Pros"** and wrote "how valuable it is to find a pro you trust".
Beauty return is relationship return.

**Therefore:** Solen's returning user is closest in shape to **Uber's** (position C) in *what* they
want, a specific known destination again, and closest to **Fresha's** (position A, thin form) in
*where* it should appear. Not to Airbnb, and not to Zocdoc.

### 4c. What we would give up, either way, and the one hard blocker

**If Solen pins a personal band on home** (bets 1 or 3 below), it gives up: first-viewport space that
currently holds browse rows, in a product whose own FLOORS LAW 2 demands roughly a third
photographic area and whose desktop hero already carries `md:min-h-[92dvh]` of zero photography
(recorded in `CORPUS.md` section 7). Adding a personal band above the fold makes that collision
worse, not better, and any proposal that does it must shorten the hero in the same change or it is
just moving the problem.

**If Solen stays with position B** (return lives in `/profile/*`), it gives up the highest-intent
action in the product to a tap plus a discovery problem, and Angi's explainer screen is the
evidence that the discovery problem is real and expensive.

**The hard blocker, named rather than routed around.** `npm run exists "rebook"` returns both a live
backend and a graveyard hit:

- **Live:** `/api/bookings/express-rebook` (finds the next available slot from a source booking, gated
  on the `barber_features` flag), `/api/bookings/express-rebook/confirm`, `bookings.is_express_rebook`,
  `bookings.rebooked_from_id`, `notification_preferences.rebooking_enabled`, and
  `/api/cron/rebooking-nudge`. The plumbing for one-tap rebooking is built and has **zero
  customer-side render site**.
- **🪦 Removed 2026-07-11:** `components-legacy/barber/ExpressRebook.tsx`, "one-tap
  rebook-your-last-cut", deleted for having zero importers and predating the pay-first walk-in flow.

Those are different things: the removal was a dead barber/walk-in widget, not a rejection of customer
rebooking. But per the exists protocol a graveyard hit needs an **explicit owner yes** before
anything in that neighbourhood is rebuilt, and I am not treating "the reason was narrow" as
permission. **Every bet below that touches rebooking is blocked on that yes.**

### 4d. Three smaller things worth stating

- **PBV is an advantage here, not a tax.** Art. 13 forces a price onto a browse card, where it costs
  space. On a **rebook** row the price is already known from the last visit, so the row can carry a
  real historical number with zero fabrication risk and zero PBV exposure. The returning-user row is
  the one card in the product where the price requirement is free.
  [KAYAK's recent-search cards](https://mobbin.com/screens/84ecc10a-5df5-46cb-81cb-0ffd7a8f9cb6) push
  this further, carrying a live price and a green "Price drop / Was $40" badge, which is the strongest
  argument I found for why a personal card deserves its space: **it is not a bookmark, it is a change
  monitor.** Solen cannot copy that without a wired price-change read, and under the no-fabrication
  rule it ships wired or not at all.
- **The profile search bar the owner questioned is a list filter, not a discovery search.**
  `ProfileTabs.tsx` filters the active tab's own items client-side (`searchedBookings`,
  `searchedSalons`). Evidence for keeping it: Clay, Figma, Airtable and Snowflake all put a filter
  over a recents list on web. Evidence against: every one of those lists is dozens of rows, and not
  one of the 16 saved-list screens in this sweep carried a filter, because a list of 3 to 8 items
  does not need one. **The honest rule is a threshold, not a yes or no:** a filter earns its place
  above some row count and below it belongs to another screen's job (FLOORS LAW 10). I do not know
  Solen's real distribution of saved-salon counts, so I cannot set the number.
- **One stale comment.** `RecentlyViewed.tsx`'s header docblock says the "Im Profil ansehen" link
  target `/profile/recently-viewed` "doesn't exist yet (Phase 3) - link is rendered but routes 404".
  Line 134 of the same file, and `npm run exists`, both show the live route is
  `app/[locale]/recently-viewed/page.tsx` and that the code points at it. The docblock is stale, the
  code is right. Surfaced, not silently edited.

---

## 5. What I could not determine

1. **Whether any app makes a pinned appointment block time-conditional.** This is the load-bearing
   gap, because bet 3 depends on it. Mobbin serves one state per capture, so a rule like "show the
   block only inside 72 hours" is invisible even if it exists. **Bet 3's window is an inference from
   the cost argument, not an observation.** The nearest real evidence is
   [Grill'd's "Dismiss" button](https://mobbin.com/screens/d77e8dd1-33d8-49c6-87e2-164c6d7bf9a9),
   which proves at least one app treats the pinned block as temporary, and the badge-carrying labels
   at Zocdoc, Fresha and IHG, which prove the reminder can live somewhere cheaper. Neither proves a
   time rule.
2. **Any motion, transition or entry behaviour.** Still images. Whether these blocks slide in,
   whether a dismissed card animates away, whether a rebook tap is optimistic: all unobserved and not
   guessed. Those come from `MOTION.md` or a `reference-lock` video capture.
3. **Space costs in pixels.** Every proportion here is read off a 299 px render. If a bet gets
   built, the numbers need PIL or `getBoundingClientRect`, not this file.
4. **Whether Solen's returning customer returns to the person or the salon.** I argued "person" from
   Fresha and Angi, which is evidence about *their* users, not ours. Solen's own `bookings` table,
   joined on `staff_member_id`, would settle it in one query. I did not run it, and the answer changes
   whether a rebook row shows a salon or a stylist.
5. **Solen's rebook rate and the distribution of days-until-appointment.** These decide bet 3's
   window and whether bet 1 is worth its space at all. Data questions, not design questions.
6. **The beauty-booking sample is still five products.** Any claim in this file about "what beauty
   apps do" rests on Fresha, Square Go, ClassPass, Zocdoc and Ulta. Booksy, Treatwell, StyleSeat,
   Vagaro and Mindbody remain unobservable through this instrument.

---

## 6. Design bets this lens makes available

Each is one claim about what the home screen is FOR, traceable to a screen I looked at.

---

### BET R1: "Home is the rebook rail"

**Claim.** For a product where the customer returns to a **person** on a 4 to 8 week cycle, home's
job is to make the last visit repeatable in one tap, and browse is what happens when the answer is
no.

**What it sacrifices.** The top of the feed, which today holds category tiles and Salon of the Month.
A first-timer's home gets strictly worse unless the rail backfills the way `RecentlyViewed` already
does. It hands the product a second card anatomy for a salon unless the rail is built as a documented
**variant of `SalonCard`** (FLOORS LAW 8 and 9), which Fresha itself gets wrong on one screen. And it
is **blocked on the owner's yes** for the express-rebook graveyard neighbourhood (section 4c).

**Evidence.** [Fresha puts "Book again" first, directly under the greeting, above Favourites](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691)
· [Angi builds a whole tab for it and writes the rationale on screen](https://mobbin.com/screens/a7a890d8-90d1-4bb5-bbfd-cab6c442e669)
· [Square Go's no-upcoming state IS a past visit plus a Rebook button](https://mobbin.com/screens/f997131b-8c8f-470b-b4f6-a56386539138)
· [Zocdoc asks the question outright as a two-card fork](https://mobbin.com/screens/673214b0-cade-48bc-90ba-aa18f1a3152b)
· [Starbucks makes the reorder row the entire returning-user proposition](https://mobbin.com/screens/46c0f164-855b-4c19-a06c-7ce6ecec40e7).

---

### BET R2: "Home never forks; sections do"

**Claim.** There is exactly one home screen. Every personal band is a section that appears with
history and disappears without it, so a first-timer sees a **shorter but complete** page, never a
different one, and no state needs its own design review.

**What it sacrifices.** The ceiling. This bet permanently forecloses a Hims-grade or Starbucks-grade
account-as-home, so the returning user's experience can never be dramatically better than the
newcomer's, only slightly. It also forbids the loudest version of R1. And it inherits position D's
real failure mode: the **sparse-but-present** section, which needs a hard minimum-count rule or it
ships as Vrbo's one-card hole.

**Evidence.** [Expedia with the recents row](https://mobbin.com/screens/3748378f-5b55-4355-b2f4-24dae74830ef)
versus [the same page without it](https://mobbin.com/screens/9bcef1ce-18dd-4032-b718-25e8157d3a68)
· [Starbucks Gold home](https://mobbin.com/screens/0320a019-4821-47a5-9dd4-fef9c4e1748c) versus
[the 0-star home with the Usuals row simply gone](https://mobbin.com/screens/1de86909-1796-41b8-879d-4bfa004772f0)
· [a third Expedia capture showing recents to a signed-out session, so history and not auth is the trigger](https://mobbin.com/screens/6aabaf3c-e9e3-4dd2-b959-0fcebead17c0)
· [Depop's one honest line above real content instead of a placeholder](https://mobbin.com/screens/e9f88afb-4fae-4358-b397-2761e15ed39a)
· and Solen's own `RecentlyViewed.tsx`, which already is this bet.

---

### BET R3: "The reminder is a badge; the block is earned"

**Claim.** An appointment weeks away should cost the home screen **nothing**. The standing reminder
is a count on a nav item, and a full block only appears close to the appointment, when "where is it
and can I get there" becomes a live question.

**What it sacrifices.** Zocdoc's entire bet: the user who opens the app for no reason but to check.
It also introduces a **time-conditional section**, a state that has to be specified, seeded and
graded at more than one point in time, which is a real cost to a system whose floors are all written
per-screen. And per section 5 item 1, **the window itself has no direct evidence behind it**; the
badge half does, the timing half does not.

**Evidence, split honestly.** The badge half is observed:
[Zocdoc's Appointments tab carries a "1"](https://mobbin.com/screens/20a3461b-b970-489a-a6fe-09109272e261)
· [Fresha labels the section "Upcoming 1"](https://mobbin.com/screens/419c463d-1dd9-48d5-bef0-9805363d2b56)
· [IHG puts the count in the tab label, "2 upcoming stays"](https://mobbin.com/screens/e84d2315-5b01-4d81-a46c-36d2bb39256a).
The "temporary block" half has exactly one supporting artefact,
[Grill'd's Dismiss button next to Follow Delivery](https://mobbin.com/screens/d77e8dd1-33d8-49c6-87e2-164c6d7bf9a9).
And the reason the block, when it does appear, should lead with a **map** rather than a photo is
Square Go's [**"10 min to location"** line](https://mobbin.com/screens/69b4e8aa-dad8-478e-942f-135446da3268),
scoped by section 2 to compact in-feed cards only.

---

## 7. Provenance

Sweep run 2026-07-30 via Mobbin MCP. 14 `search_screens` calls, 12 iOS and 2 web, naming Fresha,
Zocdoc, Starbucks, Airbnb, Uber and ClassPass explicitly and pulling the rest by description. 183
results, 4 identified repeats, 179 distinct captures examined as images. Every `mobbin.com/screens/...`
link in this file was returned by one of those searches this session and its image was looked at
before being described.

Solen-side verification, all on 2026-07-30: `app/[locale]/page.tsx`,
`_components/homepage/RecentlyViewed.tsx`, `_components/homepage/Hero.tsx`,
`_components/profile/ProfileTabs.tsx`, `app/[locale]/termine/page.tsx`,
`app/api/bookings/express-rebook/route.ts`, plus `npm run exists` on "book again" (0 hits),
"rebook" (graveyard + live backend), "upcoming appointment" (0 hits) and "recently viewed"
(live section, live route, one unrelated graveyard hit).

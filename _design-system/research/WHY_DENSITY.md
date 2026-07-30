<!-- exists-check: `npm run exists density` run 2026-07-30, 2 hits, both handled here.
     (1) GRAVEYARD: "borderless chrome-off model-b liftup-fs" (owner reverted 2026-07-18, the
     carded style won, do NOT codify borderless or strip card chrome). Nothing in this document
     proposes removing card chrome to buy density; where density is argued for, it is bought by
     card COUNT and field selection, never by taking the box off. Named again in section 4.
     (2) `app/[locale]/walk-in-pay/page.tsx:552` hierarchy-density-05, a trust-line fix, unrelated
     to feed density.
     Sibling convention: research/AXIS_GRID.md, AXIS_FONT.md, AXIS_MOTION.md, AXIS_ALIGNMENT.md,
     AXIS_COMPONENTS.md. This is the first WHY_* file, a different genre from AXIS_*: AXIS files
     measure what values apps use, WHY files argue what the values are FOR. It EXTENDS
     sections/home-feed/CORPUS.md (84 screens, 44 apps) rather than re-counting it, and CORRECTS
     one stale claim in it (section 5b). No new component, route, table or migration is proposed. -->

# WHY: DENSITY

**Date:** 2026-07-30
**Instrument:** Mobbin MCP, 11 screen searches this session (7 iOS, 4 web), every screen read as an
image before it is described here.
**Reads, not re-counted:** `_design-system/sections/home-feed/CORPUS.md`,
`_design-system/research/AXIS_GRID.md`, `_design-system/research/AXIS_FONT.md`.

---

## 0. Sample and precision, before any claim

- **11 searches this session**, returning roughly 130 screens across **45 apps**. Apps named at
  least once below: Airbnb, Fresha, Booking.com, OpenTable, Resy, Tock, Zocdoc, Plazo, ClassPass,
  Etsy, Instacart, Blinkit, Walmart, Swiggy, Rappi, Snoonu, Wolt, talabat, Bolt Food, Gojek, Skip,
  Meituan, Square Go, Hers, Hims, Superpower, Alan, CVS Health, Preply, Time2book, Pinterest,
  Cosmos, Savee, Behance, VSCO, Depop, UNIQLO, WEAR, Zesty, Character AI, adidas, Warby Parker.
- **Every "cards per viewport" figure is an approximation read off screenshot proportions**, not a
  pixel measurement. Mobbin serves iOS at 299 px wide and web at 768 px wide (established in
  AXIS_GRID section 0), which is enough to tell 2 cards from 7 and not enough to claim 1.7 versus
  1.9. Where I give a fraction, read it as "about".
- **Field counts per card ARE observed**, because I counted discrete text and control elements in
  the image.
- **No Swiss or German-market beauty marketplace is in this sample.** CORPUS.md established that
  Booksy, Treatwell, StyleSeat, Vagaro, Squire and Mindbody return nothing from Mobbin. I did not
  re-run those searches this session, so I am relying on that prior finding rather than
  re-verifying it. Planity and Shortcuts were never searched. **The only beauty-booking products I
  have observed anywhere are Fresha and Square Go.**
- **Mobbin returns stills.** Nothing here claims anything about scroll behaviour, timing or gesture.

---

## 1. The question this lens answers

**How many things should the first screen show, and what actually decides the number?**

The short answer this sweep produced, and it is not the answer I expected: **density is not a
property of a product, it is a property of the decision a single screen is asking for.** The same
company ships a sparse screen and a dense screen days apart, on purpose, and both are right.

---

## 2. The positions apps actually take

Four distinct theories, not four points on a slider. Positions 3 and 4 are both "sparse" and they
disagree with each other more than either disagrees with position 1.

### Position 1: The catalogue index

> "You already know what you want. My only job is to give you the word for it, fast."

**Belief.** The catalogue is far too large to browse and the user's intent is already formed. The
first screen is a table of contents, and the unit of density is *nameable categories*, not products.

**What it buys.** Any item in a very large catalogue is two taps away. It scales without limit: 12
tiles cover 12,000 SKUs as easily as 120. Because positions are stable, repeat users navigate by
muscle memory and stop reading the labels at all.

**What it costs.** It persuades nobody. There is no desire, no browsing pleasure, no sense of what
is good. It is also *rigid*: once users navigate by position, re-ordering the grid is a breaking
change, so the screen resists product change. And it needs volume to be honest.

**Which product it suits.** Huge, well-named, repeat-purchase catalogues.
[Blinkit](https://mobbin.com/screens/8789caed-0986-44cf-948c-86d12cc257de) puts a 4-across grid of
12 named grocery categories plus a cropped 13th row in one phone viewport.
[Walmart](https://mobbin.com/screens/9345d691-41bb-4c0c-be7a-b5b69fdfb4de) does 12 in a 3-across
grid with hairline dividers. [Rappi](https://mobbin.com/screens/400c8fa9-63d8-4e47-be55-6c2861c9f338)
and [Snoonu](https://mobbin.com/screens/f302b63a-fbcc-40da-8270-475215c4b071) run 8 to 10 icon
tiles above a promo band. [Meituan](https://mobbin.com/screens/e50e0d66-a329-4176-87a1-c566a1b2acaa)
is the far end: a search bar, a consult card, a 5x2 department grid with red urgency badges, two
more modules and a tab bar, all in one viewport, well past 30 tappable targets.

**Which product it harms.** Anything where the user does not yet know what they want, and anything
with too few items to fill the grid. [Time2book](https://mobbin.com/screens/d0da45c2-f9d2-4085-8585-d9e538b9c520)
is the failure: a booking page with a cover photo, a name, three tabs and **two** service rows, then
roughly 40% of the viewport empty. Same grammar, no inventory, and it reads as a stub rather than a
product. That is Solen's NEVER-AGAIN floor 3 (dead space below the last action) happening in a
shipped competitor.

**Two members of this position disagree about the tile itself, which is worth naming.** Beauty
booking's only two observable products split:
[Fresha iOS](https://mobbin.com/screens/c3fbecd3-61f9-4a93-bab4-fae45b8998a8) fits **14** categories
in one viewport by making each a wide row with the label left and a small real photograph right, so
the photo is a subordinate identifier. [Square Go](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21)
fits about 9 by using 3D illustrated icons on grey tiles at a much bigger tap size. Fresha's claim
is "the photo tells you what the category is, so it can be small". Square Go's is "the icon already
tells you, so spend the space on the target". Both defensible; Fresha's buys 55% more categories,
Square Go's buys a friendlier first tap.

### Position 2: The comparison table

> "The kind of thing is settled. Only the instance is open, and one field decides it."

**Belief.** The user has finished deciding *what* and is now resolving *which*. Resolution happens
by scanning a single comparable field down a column. Every pixel that is not that field is friction.

**What it buys.** Fast, confident resolution, and confidence rises with the number of rows visible
at once, because a choice made from 8 visible options feels checked and a choice made from 2 feels
guessed.

**What it costs.** It deletes or shrinks the photograph, so it cannot create desire, only satisfy it.
And it **commoditises the supply side**: when eight providers render as eight rows differing only in
a number, the user optimises the number, which is exactly what a provider does not want.

**Which product it suits.** Substitutable inventory where one field genuinely decides.
[Booking.com's results page](https://mobbin.com/screens/28e4b5b5-ca32-4d79-a91f-70563cbb4442) is the
densest thing in this sweep: a left rail of sort, a 5-step guest-rating segment, neighbourhoods with
counts, budget and brands, beside rows carrying a thumbnail with its own photo carousel, a heart,
**three** stacked badges, name, neighbourhood, "Show on map", an amenity checklist, a numeric score
box with review count, star rating, room type, a taxes-included line, a struck original price, the
current price, "per person", a total, and a commit button. That is 14 to 16 discrete elements per
row at about 2.2 rows per viewport.
[OpenTable's results](https://mobbin.com/screens/c77928db-a9c5-4108-b649-a1c4a329ad5d) run 4 rows
per viewport where each row carries **five red time pills** and "Booked 22 times today", beside a
rail of about 25 filter checkboxes.
[ClassPass](https://mobbin.com/screens/222757f4-74d8-435b-a780-6149bb5fac62) is the purest case and
the most instructive: **7 classes per viewport with zero photography**, each row being time,
duration, class name, instructor and a spots-left number.
[Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f) fits **10 doctors** with a
32pt portrait, a name, a specialty and one live line: "Disponible mañana a las 2:00 p.m."
[adidas](https://mobbin.com/screens/da1c0bb4-b40e-4620-8111-bc6a603caf98) strips it to bare text:
8 time ranges under a counted header, "MORNING (8)", "AFTERNOON (20)".
[Etsy's results](https://mobbin.com/screens/3344b44e-b8a7-4f22-8ac1-85b7cd89ead0) do it for goods:
4 across, 2 rows plus a cropped third, each tile carrying photo, truncated title, rating with count,
shop, price, struck original with a percent, and a shipping chip.

**Which product it harms.** Anything chosen on feel, and any seller whose margin depends on not
being comparable. Also anything where the deciding field does not exist yet: a comparison table with
nothing to compare is [OpenTable's "Available for late dinner now"](https://mobbin.com/screens/ff307b73-39a0-4899-bcf2-08521035820f),
where **one** restaurant sits in a 5-column grid with four empty columns beside it, on the home page
of a company that otherwise gets this right.

**The mechanism, stated once because it recurs everywhere below.** In every member of this position,
the *photograph shrinks or vanishes in exact proportion to how many bookable times the row carries*.
OpenTable's photo is a 56px thumbnail and it carries 5 slots. Tock's is a small top-right thumbnail
and it carries two labelled slot groups. ClassPass and Plazo and adidas carry the time and drop the
photo entirely. ClassPass then brings the photo back exactly once, full-width with "1/4" pagination,
on the [class PDP](https://mobbin.com/screens/6f1ab7f6-bd06-475b-9d5f-303d59095692), at the moment
of commitment. That is a theory of what a photo is FOR: it answers "what will this room feel like",
and that question only becomes live once the time is settled.

### Position 3: The single-object showcase

> "You cannot be told what this is. You have to see it. And you have to want it before you compare it."

**Belief.** The product is differentiated and not describable in fields. One unit per viewport, the
photo is most of the unit, the text is two lines.

**What it buys.** Desire, brand, and permission to charge more. It is the only position that can
make an expensive infrequent purchase feel considered rather than transacted.

**What it costs.** One viewport of scrolling per item, so a large catalogue becomes practically
unreachable by browsing and search has to carry everything. It also *hides the deciding field*,
which does not remove the decision, it moves it one screen deeper. Every tap becomes a page load.

**Which product it suits.** Photogenic, differentiated, high-consideration, infrequent.
[Airbnb iOS home](https://mobbin.com/screens/41e035de-eb59-433c-a13a-b2367812536f) shows about 1.9
listing cards with a two-line body.
[Resy's Discover feed](https://mobbin.com/screens/44be310d-75e0-481c-9e65-1ff4d8868b8a) runs about
1.2 units per viewport: a full-width photograph, a red eyebrow, a two-line headline and a paragraph
of copy. [Resy's editorial article](https://mobbin.com/screens/118d4b82-01e6-4400-9f79-ca6997549664)
takes the whole viewport for one restaurant.
[Trip.com and Klook](https://mobbin.com/screens/49ac4d43-90b7-4dc0-a9fc-5ff5bb6141bc) put a photo
band behind the search field because the destination literally is the product.

**Which product it harms.** High-frequency commodity purchases, and any product under a
price-display obligation, because a two-line body has no room for a price plus the thing the price
is for.

**Resy is the honest test of this position, because Resy itself does not hold it consistently.** Its
[editorial index](https://mobbin.com/screens/2fda3e51-e256-4821-be49-f302e344c558) drops the same
content to **7 rows per viewport** with the photo demoted to a small right-hand square, and its
[Fine Dining collection](https://mobbin.com/screens/41a50ca2-4549-4016-bfac-a5eeed5ef523) opens with
one hero photo then lists 5 restaurants as thumb-left rows with star, count, cuisine, price tier and
neighbourhood. One hero to set the mood, then a table to make the choice. That is not
inconsistency, it is sequencing.

### Position 4: The intent router

> "Anything I show you before I know where and when you are is noise."

**Belief.** For location-and-time-bound inventory, no pre-filter list can be relevant, so the
honest first screen shows **no inventory at all** and asks the one question that makes inventory
meaningful.

**What it buys.** One unambiguous action, zero wrong-city inventory, a clean funnel, and it scales
to any catalogue size without design change. It also cannot go stale or look thin.

**What it costs.** It teaches the visitor nothing about supply. A first-time user cannot tell
whether you have 12 salons or 1,200, and for a marketplace that has not yet earned trust that is
the single most important thing the home page could say. It forfeits browse-driven discovery
entirely, and it reads as a landing page rather than a product.

**Which product it suits.** Location-and-date-bound inventory, plus enough brand awareness that the
visitor already knows what the catalogue contains.
[Booking.com's home](https://mobbin.com/screens/e198244e-83c1-4834-84f4-f7a30cae031f) is the
headline case and it genuinely surprised me: the most notoriously dense travel product in the world
opens with a photo hero, a headline, a CTA, a 4-field search bar straddling the hero edge, then two
promo banners and two recent-search tiles. **Zero properties in the first viewport.**
[Fresha's web home](https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7) is the same
shape without the photograph: a serif headline, a 4-segment search bar, a live counter, a "Get the
app" pill, and "Recently viewed" cropping at the very bottom edge. **Zero salons.**
[Swiggy](https://mobbin.com/screens/27a9c867-8a07-4655-aa4c-0ca943ee329c) is the purest and most
extreme: three mode tiles, "Order Food / Shop Groceries / Dine Outdoors", on a grey field, with
roughly 40% of the viewport deliberately empty, shipped by one of the densest apps in India.

**Which product it harms.** Pre-launch marketplaces with no brand, where "does this thing have
supply near me" is the actual open question. And repeat users, for whom the question is already
answered and the screen is a toll booth.

**One honest detail that saves this position from being a purely aesthetic choice.** Fresha's hero
carries a live number. Five separate captures of the same screen read 217,913 / 320,602 / 320,692 /
320,797 / 320,898 appointments booked today
([1](https://mobbin.com/screens/74253218-0063-4799-afef-c0410b371804),
[2](https://mobbin.com/screens/dee32578-d821-4f80-886e-7f379aac30b3),
[3](https://mobbin.com/screens/bbed93f8-7e33-4c5f-9878-54978f24d4cf)). It is demonstrably wired, not
a decorative string. That counter is the one thing on an empty hero that does the job position 4
otherwise cannot: it proves supply exists without listing any of it.

---

## 3. The strongest disagreements, with no winner picked

### 3a. Fresha web versus OpenTable web: two appointment marketplaces, opposite home pages

Both sell a time slot at a venue. Both are web. Both are credible at scale.

[**Fresha**](https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7) gives its entire first
viewport to a headline, a search bar and a counter. Zero venues.

[**OpenTable**](https://mobbin.com/screens/e1886298-cf19-4bc3-9924-620b7621853c) gives about one
sixth of the viewport to a short dark hero with a 4-field form, then immediately shows **5
restaurants plus a cropped 6th**, each with photo, name, star rating with review count, cuisine and
price tier and neighbourhood, "Booked 170 times today", and a bookable **time pill**.

**Why Fresha is right for Fresha.** Fresha's catalogue is global and hyper-local at once. A salon
6 km away is useless, and the app has no location until you type one, so any list it renders
pre-search is close to random. Fresha also monetises the salon's software subscription, not the
booking, so making salons look substitutable is against its interest. It replaces the missing
inventory with the wired counter, so the screen still proves the marketplace is alive.

**Why OpenTable is right for OpenTable.** OpenTable already has your city and, crucially, your
*recency*: the first band is "Recently viewed". Restaurant intent is impulsive and evening-shaped, so
the highest-value thing it can show a returning user is a place they already considered with a time
they could take right now. And a restaurant reservation is free, so the cost of an irrelevant card
is one wasted glance rather than a wasted franc.

**The variable that separates them is not taste, it is what the product knows about you when the
page loads.** OpenTable can be dense because it has history and location. Fresha cannot, so it asks.

### 3b. Zocdoc versus Plazo: same product, roughly 4x the density, opposite mechanism

Both book a doctor.

[**Zocdoc**](https://mobbin.com/screens/3b03d53a-6614-4054-a34a-0d8ba4213c8e) gives one doctor about
0.6 of a viewport: a coloured banner, a large circular portrait, name, specialty, distance,
"★ 4.82 · 68 reviews", and a yellow "See availability" button. Roughly 1.5 doctors visible.

[**Plazo**](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f) fits **10** doctors: a
small portrait, name, specialty, a status dot, and one line, "Disponible mañana a las 2:00 p.m." or
"Horario no disponible".

**Why Zocdoc is right.** You will see this dermatologist for years. The decision is resolved by soft
signals that do not compare numerically: does this person look like someone I can undress in front
of, are they close, do 68 people vouch for them. Density would destroy the only fields that matter,
because a face at 32pt stops being a face.

**Why Plazo is right.** Its user has a symptom and wants the earliest competent slot. There is
exactly one deciding field, and it is a time. Ten rows of times resolves that decision better than
one portrait ever could, and rendering the unavailable doctors greyed **in place** rather than
filtering them out tells you the market is thin without lying about it.

**Named mechanism, and it generalises.** *Density is set by whether the decision is resolved by ONE
comparable field or by an accumulation of non-comparable signals.* One field, go dense. Accumulated
feel, go sparse. That single sentence predicts every screen in section 2 correctly, which is why I
trust it more than any frequency count.

### 3c. Airbnb versus Airbnb, which is stronger evidence than any pair of companies

This is one app, not two, so it does not qualify as the headline disagreement. It is nonetheless the
best evidence in the document, because every confound is removed: same company, same design system,
same tab bar, same release.

- **Homes tab:** about 1.9 large listing cards, two-line body, no category strip.
- **Services tab** ([iOS](https://mobbin.com/screens/49f0730c-6356-476a-b481-b679952db447)): a
  category strip of square photo tiles with **supply counts printed on them**, "Photography 132
  available", "Chefs 12 available", "Massage 1 available", then a "Photography" section with about
  2.2 provider cards carrying a Popular badge, a heart, a name, "From $45 / guest" and "★5.0", then
  a third section header cropping in.
- **Services on web** ([here](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2)): **10
  category tiles plus 6 service cards in one viewport**, each card with photo, title, "From $45 /
  guest", a modality line, "★4.93 · 1,380 reviews", a Popular badge and a heart.

Airbnb roughly **tripled its own density** when it started selling appointments instead of places.
The company that invented the sparse photographic marketplace home decided that a repeatable,
price-comparable service does not get the same treatment as a stay. Note also "Massage 1 available":
it renders a category with a single item rather than hiding it, printing the thin number instead of
faking a full one.

---

## 4. What this implies for Solen

### 4a. First, a correction to the premise I was handed

The brief states that Solen's home shows zero salons in the first desktop viewport, and CORPUS.md
section 7 supports it by citing `md:min-h-[92dvh]` on the hero. **Read on disk today, that class is
not in `Hero.tsx`.** V3-D348 removed it explicitly; the in-file comment reads "drop
md:min-h-[92dvh], pt-32 to pt-12. Hero now hugs the top like Fresha", and the sub-to-search gap went
from `mt-16` to `mt-6 md:mt-8` with the comment "this 64px gap was the single biggest reason the
search sat below the fold".

Computed from `Hero.tsx:154` and its children at a 1440-wide viewport: `md:pt-14` 56 + H1 at 44px
and leading 1.08 about 47.5 + `mb-3` 12 + sub at 20px and leading 1.35 about 27 + `md:mt-8` 32 +
SearchBar `md:!h-[60px]` 60 + `md:pb-16` 64, which is **about 300px of hero**, not 92% of the
viewport. Add the header and `FeedZone`'s `md:mt-8` and the first `SalonCard` row starts around
y = 470 and ends around y = 810, inside a 900px viewport.

**I computed this from the code. I did not render it.** No dev server was running and I did not start
one, so treat the 470 and 810 as arithmetic, not measurement. What is certain is that the 92dvh
claim is stale and CORPUS.md section 7 needs the correction.

### 4b. The density defect that IS real, and it is a different one

Two things are true of the shipped card and both are checkable.

**One: the scroll promise is arithmetically impossible above `sm`.** `SalonCard.tsx:404-408` sets
`md:w-[calc((100%-36px)/4)]`, `lg:.../5`, `xl:.../6`, and the rail in `SectionHeader.tsx:409` is
`gap-3` (12px). Four cards plus three 12px gaps is exactly `100% - 36px`. The container divides into
**exactly** 4, 5 or 6 cards with nothing left over, so there is no cropped next card on desktop at
any breakpoint. Mobile keeps it, at `(100vw-44px)/1.5`. Every mobile carousel in CORPUS.md and
AXIS_GRID crops; Solen crops on mobile and cannot crop on desktop.

**Two: at `md` and `lg` the count is 4 and 5, below Solen's own floor.** FLOORS LAW 3 requires ">= 4
content units mobile / >= 6 desktop plus a visibly cropped next item". Solen meets 6 only at `xl`.

**Three, and this is the one that matters for this lens: the card carries no time.** Rows are name
plus rating (count dropped by C11), category, then address plus price. Five fields, three rows, no
availability, no next slot. **Every appointment product in this sweep that puts a provider on a
browse surface either carries a next-available signal or drops the price too.** Fresha iOS,
OpenTable, Tock, Plazo, Alan, Superpower and ClassPass carry the time. Fresha web home and Square Go
carry neither price nor time and are pure discovery. **Solen occupies a third position that I did
not observe in a single app: price without time.**

### 4c. Where Solen sits, argued

The brief's frame is right and it rules things out. Solen sells an appointment at a place, so:

- **Position 2 pure is unavailable.** The comparison table earns its density by deleting the
  photograph, and FLOORS LAW 2 plus the imagery row of the design contract require roughly one third
  photographic area on browse viewports. More importantly, Solen has to *recruit* Swiss salons.
  Position 2's real cost is that it renders providers as substitutable rows, and a supply side you
  are still signing does not want to be a row in a price table.
- **Position 3 pure is unavailable.** The showcase hides the deciding field, and Swiss PBV Art. 13
  puts a price on the card by law. A statutory floor is tier 2 in the precedence chain and cannot be
  traded for a two-line body.
- **Position 4 is what ships today and it has one specific, dated weakness.** Fresha can afford an
  empty hero because it has a wired counter proving 320,000 bookings happened today. **Solen is
  pre-launch with seed data.** It has neither the brand awareness that makes an empty hero legible
  nor a real number it could honestly print in place of inventory. Position 4 borrowed from Fresha
  without the one element that makes Fresha's version work.
- **Position 1 is already half-built and half-hidden.** `MobileCategoriesRow.tsx:76` is `md:hidden`,
  so the desktop home has no category index at all and routes category browsing through a header
  dropdown. Fresha iOS fits 14 categories in a viewport; Solen shows 6, on phones only.

**The composite that actually exists in the wild is Fresha's own iOS search card**
([here](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)): a full-width photo with
dot pagination, "ML Hair Studio", "4.9 ★★★★★ (751)", the street, then **two service rows each with
duration, "from $100", and three tappable time pills plus an overflow**. Photo, price and time on one
card. It costs about one card per viewport, and it is shipped by Solen's declared structural source
of truth, on the platform where Fresha invested most. [Tock](https://mobbin.com/screens/b966930a-b776-4e15-a334-3e4b5a163462)
shows the cheaper variant of the same idea: demote the photo to a small top-right thumbnail and two
venues fit instead of one.

### 4d. What Solen gives up, either way

**If Solen goes denser (more cards, a desktop category index, a time on the card):**
- The photograph's share of the viewport drops, which collides with FLOORS LAW 2's one-third and with
  the design contract's "photo is the largest element of every SalonCard".
- Salons start to read as comparable rows, which is a supply-side cost, not a design cost.
- **A time on the card re-opens an owner-approved deletion.** `TASTE_LOG.md:200` records
  CARD_REDESIGN_2026-07-13 C2: "availability badge + next-slot text (calendar icon, 'Heute 14:30')
  fully deleted", and the design contract's availability row reads "plain ink text, NO green pill
  (owner call, do not re-add)". This is a re-open request carrying new evidence, not a fresh idea,
  and it is the owner's call alone.
- A time also cannot be shown without a real availability read. The card would otherwise fabricate,
  which taste rule 1 forbids outright, and the estate has already been burned once by exactly this:
  REMOVED.md line 71 records a staff availability strip deleted because an auth gate turned it into a
  fabricated "closed all week".
- **Density must be bought with card count and field selection, never by removing card chrome.**
  `npm run exists density` returns the 2026-07-18 graveyard line: borderless "chrome off, density
  stays" was reverted, the carded style won.

**If Solen stays sparse (hero-first, search-led):**
- It gives up the only cheap way to answer the question a first-time Swiss visitor actually has,
  which is whether there is anything near them worth booking. Position 4 answers that with a wired
  counter and Solen has no such number to print honestly today.
- It forfeits browse-driven discovery on desktop entirely, because the desktop category index is
  `md:hidden` and the first card row carries no cropped next item, so nothing on the screen suggests
  there is more.
- It keeps the calm, which is a real asset and the thing every dense competitor in section 2 has
  spent.

**My reading, stated as a reading.** The evidence points denser than today, and the specific number
it points at is not a big one: close the 4-and-5 gap to the 6 the floor already asks for, restore the
crop, and unhide a category index on desktop. That is position 1 plus a little of position 2, and it
requires no change to the photo's dominance and no re-opening of any owned decision. The time on the
card is the genuinely contested move and it should go to the owner as a question, not into a build.

---

## 5. What I could not determine

1. **Whether any of this converts.** Mobbin is screenshots. I observed zero engagement, retention or
   conversion data, so every "buys" and "costs" above is a mechanism argument, not a measured
   outcome. Nothing here should be cited as evidence that density moves a number.
2. **Whether Solen's first desktop viewport really contains the card row.** Computed from source, not
   rendered. This needs one screenshot at 1440x900 to settle, and until it is taken, section 4a is
   arithmetic.
3. **The Swiss and German-market competitors are entirely absent.** Booksy, Treatwell, Planity,
   Shortcuts, StyleSeat, Vagaro. My sample's only beauty-booking members are Fresha and Square Go,
   which is two apps, not a category. Any claim about what beauty booking "does" in this document is
   really a claim about Fresha.
4. **Whether Fresha's one-card-per-viewport iOS result density outperforms its four-across web
   density.** Both ship. Stills cannot tell me which one Fresha believes in.
5. **Whether a German next-slot label fits.** Row 3 is 12px and already carries a truncated address
   plus "ab CHF n". Adding "Morgen ab 09:00" against the longest of four locale strings is a
   measurement I did not take, and copy-i18n-09 says French and German commonly run 15 to 35% longer.
6. **Where the density switch sits numerically.** I can name the variable (one comparable field
   versus accumulated feel) and I cannot give a threshold. Nobody in this sample published one, and
   inventing a number here would repeat the EMPHASIS BUDGET's own admitted mistake of minting a house
   figure and later having to disown it.

---

## 6. Design bets this lens makes available

A bet is a one-sentence claim about what the home screen is FOR, big enough to build a whole screen
around. All three trace to screens observed above.

### Bet A: "The city has supply"

**Claim.** The home screen's job is to prove, in the first viewport, that there are enough real
salons near you to make this worth using.

**What it sacrifices.** The hero's brand moment and its vertical calm. The search-first funnel loses
its unambiguous single action. Editorial and inspirational content get pushed down.

**Evidence.** [OpenTable web home](https://mobbin.com/screens/e1886298-cf19-4bc3-9924-620b7621853c)
puts 5 venues plus a cropped 6th above the fold behind a one-sixth-height hero.
[Airbnb Services web](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2) puts 10
category tiles plus 6 provider cards in one viewport. [Airbnb Services iOS](https://mobbin.com/screens/49f0730c-6356-476a-b481-b679952db447)
literally prints the supply count on each category tile, "132 available", "12 available", "1
available". [Etsy's shop rail](https://mobbin.com/screens/5e7bcae2-84e7-4aa4-8d05-a9a34524a2bf)
carries a per-category count down the left edge.

**Why it fits Solen specifically.** Solen is pre-launch, unknown, and Swiss-city-shaped. The
counter that lets Fresha get away with an empty hero does not exist here, and supply visible as
cards is the substitute that needs no number invented.

### Bet B: "The next free slot"

**Claim.** The home screen's job is to show what you can actually book today, so every card carries
a real next-available time and the card count drops to accommodate it.

**What it sacrifices.** Card count, roughly halved. Photo share per card, if the photo shrinks to
make room. And it re-opens `TASTE_LOG.md:200` C2, an owner-approved deletion dated 2026-07-13, which
makes this a question for the owner rather than a buildable bet. It is also gated on a real
availability read: no data, no bet.

**Evidence.** [Fresha iOS search card](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)
carries two services with prices and three time pills each.
[OpenTable home](https://mobbin.com/screens/e1886298-cf19-4bc3-9924-620b7621853c) and
[results](https://mobbin.com/screens/c77928db-a9c5-4108-b649-a1c4a329ad5d) put red time pills on
every row. [Tock](https://mobbin.com/screens/b966930a-b776-4e15-a334-3e4b5a163462) groups slots by
room. [Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f) and
[Alan](https://mobbin.com/screens/6328c1ef-39ee-4f79-af8e-e35abcf47e49) render the *unavailable*
provider in place, greyed, rather than hiding it.
[Superpower](https://mobbin.com/screens/ab77dce0-bd88-44b5-92aa-f9d23cd43297) does it with no photos
at all.

**The honest note the closing clause requires.** The 2026-07-13 decision to delete next-slot text was
made on card-composition grounds. This sweep is later evidence and it falls against that decision:
seven independent appointment products put the time on the browse card, and no product I observed
shows a price without a time. That is one line of new information for a settled call, not an argument
to reopen it unilaterally.

### Bet C: "Looking is free, booking is not"

**Claim.** The home screen carries two densities on purpose, and the dividing line is whether the tap
costs money: free-to-look content goes photo-dense with almost no text, and bookable content stays at
the comparison density.

**What it sacrifices.** One screen, two grammars, which runs straight at FLOORS LAW 8 ("the same
thing looks the same everywhere") unless both are documented variants of one component rather than
two implementations. It also risks the visitor reading the inspiration band as the product.

**Evidence.** [Pinterest](https://mobbin.com/screens/14800a84-8bc1-476f-960a-b7353780defb) fits about
6.5 tiles with **no titles at all**, and [Cosmos](https://mobbin.com/screens/161b484a-50b1-4574-900a-5167c51080a2)
and [Savee](https://mobbin.com/screens/b54c849c-0350-47b5-a3d7-423073d0b092) go further with zero
gutter and zero text. The moment the tap costs money the fields come back:
[Depop](https://mobbin.com/screens/e9f88afb-4fae-4358-b397-2761e15ed39a) adds brand, size and price
and drops to 4 tiles; [UNIQLO StyleHint](https://mobbin.com/screens/7438ed25-e96b-449f-9179-b34151919198)
adds a size and a filter row. And [Etsy's "Discover unique hand-picked items"](https://mobbin.com/screens/7b8ee5ae-6aff-463d-8667-06d008b60442)
shows the trick that makes this affordable: it deletes every field except a price pill, and moves the
missing context into the section's tab strip, "Under $20 / Modern farmhouse / Eclectic decor". **You
may buy density by deleting fields only if the section header takes over what you deleted.**

**Why it fits Solen specifically.** Solen already runs `/inspo` as a separate surface. This bet says
the density split between Inspo and the salon feed is principled rather than accidental, and it
supplies the rule for when a look-tile is allowed to carry no text.

---

## 7. Stale claims surfaced, not silently fixed

Per rule 18, two things contradict what I read on disk today.

**7a. `sections/home-feed/CORPUS.md` section 7 cites `md:min-h-[92dvh]` on `Hero.tsx` and concludes
Solen's desktop home opens with 92% of the viewport carrying zero photographic pixels.** That class
is not in the file today; V3-D348 removed it by name. The collision CORPUS.md describes is real in
kind and much smaller in degree. Section 7 of that file needs re-measuring rather than deleting.

**7b. `SalonCard.tsx:251-253` says the deleted `AvailabilityPill` and `NextSlotText` are recorded
"see `_design-system/REMOVED.md` for the graveyard line".** Grepped, `REMOVED.md` has no such line.
The actual record lives at `_design-system/TASTE_LOG.md:200`. A bookkeeping gap in the graveyard, not
a design problem, but it means `npm run exists "next slot"` will not warn the next person who
proposes bet B.

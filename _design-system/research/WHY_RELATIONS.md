<!-- exists-check: `npm run exists relations` = 0 matches. `npm run exists coupling` = 0.
     `npm run exists tradeoff` = 0. `npm run exists constraint` = 0. `npm run exists dependency`
     returns 2 GRAVEYARD hits, both dead code (components-legacy/ProfilePage.tsx, root
     eslint.config.js) and neither related; nothing here re-proposes either. A repo-wide grep for
     the vocabulary of relations ("forced pair", "incompatible pair", "only together",
     "mutually exclusive", "cannot both") across _design-system/ returns five files and not one of
     them is a dependency graph: TASTE_TYPOGRAPHY.md line 21 is bold-versus-italic on a single
     element, TASTE_DASHBOARDS.md line 11 is a table-versus-chart threshold, TASTE_MOTION.md line
     492 is two references disagreeing on duration, GEOMETRY_PRINCIPLES line 231 is a Gestalt
     enumeration, Switch.md is component semantics. So no document in this estate writes down which
     design choices depend on which others. That is the hole this file fills.
     This file EXTENDS and does not restate: research/WHY_ENTRY.md, research/WHY_CURRENCY.md,
     research/WHY_RETURN.md, research/WHY_DENSITY.md (all four read in full first),
     sections/home-feed/CORPUS.md, research/AXIS_GRID.md, research/AXIS_FONT.md. Those four lenses
     each argue ONE axis in isolation. This one argues only the edges BETWEEN them. It reproduces no
     frequency from CORPUS.md and re-argues none of the four positions inside any lens.
     It CORRECTS two stale numbers carried by three of those documents (section 6).
     No new component, route, table, migration or mockup is proposed. -->

# WHY: RELATIONS

**The question this lens answers:** which of these choices depend on which others, so that nobody
picks two things that cannot coexist and then wonders why the screen feels wrong.

Date: 2026-07-30
Instrument: Mobbin MCP, 10 distinct `search_screens` calls this session (7 iOS, 3 web). Every screen
linked below was returned by one of those searches and its image was examined before being
described. Where a claim leans on a screen from an earlier sweep, the sibling lens is cited as the
observer instead of the observation being re-claimed here.

---

## 0. Sample and method, stated before any claim

**Ten searches returned 91 screen results this session.** After repeats, roughly 86 distinct
captures, from about 60 apps. Apps named at least once below: Resy, Tock, TheFork, Grab, Fresha,
Google Maps, Nike, Care.com, Etsy, Faire, Selfridges, Unity, Behance, Dribbble, Mercor, GitHub,
Relevance AI, Marriott Bonvoy, Vrbo, Expedia, Trip.com, Rappi, World of Hyatt, Shangri-La Circle,
GetYourGuide, Air NZ, Matter, Afterpay, The Infatuation, The New Yorker, Pocket, Medium, Hypelist,
Swarm, Apple News, BlaBlaCar, Careem, Viator, Singapore Airlines, Peerspace, KakaoTalk, StubHub,
komoot, Mindvalley, Mixpanel, Whop, Kraken, Zillow, Asana, Framer, WRITER, Babbel, Employment Hero,
Wolt, Whatnot, Zocdoc, Wysa, How We Feel, Orb Social, Alma, Airbnb, Preply, Time2book, Figma, Alan,
Square Go, Turo, WeChat, Peloton, ClassPass.

**Six honesty notes, because this document's genre is riskier than the others.**

1. **A relation is a mechanism claim, and a mechanism claim is not an experiment.** For every pair
   below I state the physical or informational reason one choice constrains the other, and I show
   apps paying the constraint in different currencies. What I cannot show is that any company
   reasoned this way, or that the relation moves a number. **I observed no engagement, retention or
   conversion data anywhere.** A mechanism argument is stronger than a frequency count and weaker
   than a test, and it should be read at exactly that strength.
2. **The strongest evidence in this file is a FAILED search.** Section 3, pair I4, rests on the fact
   that I went looking for one specific card configuration across ten searches and could not find
   it. A negative finding from a bounded search is real evidence and I mark it as bounded.
3. **No pixel measurements this session.** Every "roughly N cards per viewport" is read off a 299 px
   iOS render or a 768 px web render, which is enough to distinguish 1 card from 4 and not enough to
   distinguish 1.7 from 1.9. AXIS_GRID.md owns the measured geometry and I did not repeat it.
4. **Motion: nothing.** Stills. No transition, easing, gesture or press state is claimed anywhere
   below.
5. **I did not render Solen.** Every Solen-side number in section 5 was read from a file on disk
   today with the line cited. Where a claim depends on where something lands in a rendered viewport,
   I say so and mark it unmeasured.
6. **The beauty-booking sample is still two products** (Fresha, Square Go) plus three adjacent
   verticals (Careem's Salon&Spa, Ulta, Airtasker's beauty row), established in CORPUS.md. I did not
   re-search Booksy, Treatwell, StyleSeat, Vagaro, Planity or Shortcuts this session and rely on the
   prior finding that Mobbin does not carry them. Any sentence below of the form "beauty apps do X"
   is really a sentence about Fresha.

**What "relation" means here, precisely.** Three kinds, and they are not degrees of the same thing:

- **FORCED:** choosing X makes Y near-mandatory, because X consumes a resource Y needs and there is
  no third place to take it from. You still choose HOW to pay. You do not choose whether.
- **INCOMPATIBLE:** X and Y want the same scarce resource and there is not enough for both. One
  wins, or both are degraded into something neither wanted.
- **ONLY-TOGETHER:** X is not wrong without Y, it is *inert* without Y. It occupies space and
  returns nothing.

---

## 1. FORCED PAIRS

### F1. Put bookable times on the card and the photo shrinks or the card count halves. You pick which. You do not get to skip.

**The mechanism.** A card is a fixed-width column. A slot is a tap target, so it cannot be smaller
than about 44 pt tall and it cannot be abbreviated below a legible time string. A row of slots
therefore adds a fixed block of vertical space that no other element on the card can absorb, because
the text rows are already at their floor. The only elastic element on a provider card is the
photograph. So the height comes out of the photo, or the card gets taller and fewer fit. There is no
third source.

**Four products paying the same bill in four different currencies, on the same data.**

- [Tock](https://mobbin.com/screens/36a67cad-df4d-4a52-9e72-1e8b92f02c2a) pays with the photo. It
  demotes the venue image to a small top-right thumbnail, maybe a sixth of the card, and spends the
  reclaimed width on two labelled slot GROUPS ("Dining Room Reservation", "Patio Reservation") with
  four pills each. Two venues fit per viewport. Same choice in
  [a second](https://mobbin.com/screens/5fc4c582-9804-4f2d-a033-fbe55213bd4b) and
  [a third capture](https://mobbin.com/screens/d3b992b9-21dd-43b1-b150-069d768a34e9).
- [Resy](https://mobbin.com/screens/e4f524c1-e8e3-4e25-bb4c-b736d43c28a1) pays with the count. It
  keeps the full-width photograph, so the slot pills run off the right edge of the screen and about
  two cards fit.
- [TheFork](https://mobbin.com/screens/b448f1f5-8a43-4b81-8d00-60a95cf8c0a9) pays with both, and
  overpays. Full-width photo, name, address, cuisine, average price, an "Up to -30%" chip, a "Yums
  x3" chip, then five times each carrying its own "-30%" chip underneath. Roughly 1.2 cards.
- [Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5) pays the maximum.
  Sponsored label, a "#1 PCP Practice in Mountain View, CA" banner, a large circular face, name,
  role, "4.76 · 272 reviews", a "Patient Choice" award chip, distance and street, an in-network line,
  a prose recommendation line, then three yellow day tiles that carry a COUNT of appointments each
  ("Wed Jun 3 / 5 appts", "Thu Jun 4 / 10 appts", "Fri Jun 5 / 9 appts") plus "More". Exactly one row
  per viewport.
- And the far end, which proves the mechanism by removing the photo entirely:
  [ClassPass's schedule](https://mobbin.com/screens/f22d5e3d-c68f-49b9-8b1d-bf6261181fad) drops
  imagery altogether and gets four rows carrying time, duration, class, studio, instructor, rating
  and a spots-left number.

**Which product each choice suits.** Tock's answer suits a product whose user has already chosen the
venue and is negotiating with their calendar, because a thumbnail is enough to confirm identity.
Resy's answer suits a product where the venue is still being decided on feel, because a shrunken
photograph would stop doing the deciding. Zocdoc's answer suits a product where the visit is scarce
and infrequent enough that one row per screen is not a scrolling problem.

**Where Solen sits.** `SalonCard.tsx:426` is `aspect-[5/4]`, and the LOCKED design contract's imagery
row says the photo is the largest element of every SalonCard. So Tock's payment method is closed to
Solen by a lock, which means adding a time forces Resy's payment method: fewer cards. Solen is
already at 4 cards at `md` and 5 at `lg` (`SalonCard.tsx:406-407`) against its own floor of 6
desktop. **F1 is the reason bet B ("the next free slot", WHY_DENSITY section 6) and the density floor
cannot both be satisfied without the owner giving up one of them.** Nothing in either document said
that, because each looked at one axis.

### F2. A large photograph forces fewer columns, which forces title truncation, which quietly removes the name as a comparable field.

**The mechanism.** Photo area grows with the square of column width; text does not shrink to
compensate, it clips. So every column you remove to make the photo bigger takes horizontal room away
from the one field the user scans to tell two providers apart.

**Observed, web, where column count is a free variable.**

- [Etsy](https://mobbin.com/screens/aab860ec-aea7-4c96-84a4-b598723a1620) at four across truncates
  every single title mid-phrase ("Custom Gymnast Gift, Gymnastics Zipper …", "The STRENGHT Tarot Card
  Purse Charm l…"), and it carries six further fields per tile (rating with count, shop, price,
  struck original with a percent, shipping chip, "Add to cart", "More like this").
- [Faire](https://mobbin.com/screens/1c42b65b-fd0c-458a-9422-999d830d8984) holds **five** across, and
  it can only do so because the body is two short lines: a name and "4.8 ★ $100 min".
- [Selfridges](https://mobbin.com/screens/e3a4f401-f102-4fa4-aa2a-272e0de2cbf7) holds four with four
  very short lines (brand, name, price, "NEW SEASON").
- [Fresha's web rails](https://mobbin.com/screens/962315e5-a36e-4a70-ba2d-f2e1d7871be2) hold four with
  a name, a rating, a district and a category chip, and no price.

The relation is not "four is right". It is that **columns and fields-per-card are one decision, taken
twice.** CORPUS.md observed the same thing from the other end (Airbnb fits seven across only because
its card body is two short lines) and read it as a note about Airbnb. It is a general constraint.

**Where Solen sits.** `CardName` is `truncate` at `SalonCard.tsx:505`, so truncation is already the
chosen failure mode rather than wrapping. That is a defensible choice, and it has a consequence
nobody has written down: **closing the density gap from 4 to 6 columns at `md` makes every long Swiss
salon name truncate harder.** FLOORS LAW 1(f), the worst-case-content item, is the gate that would
catch it, and it has to be run at the new column count before the count changes, not after.

### F3. Put a face in the photo slot and density must drop, because a face below thumbnail size stops being a face.

**The mechanism.** A photograph of a room is read as information and survives being small. A
photograph of a person is read as a person, and that reading needs resolution. Shrink it far enough
and it silently changes function from "who is this" to "which row is this", at which point you are
paying for portrait photography and getting an identifier.

**Observed.** [Care.com's web results](https://mobbin.com/screens/e6f07e6d-922e-42a9-becc-d5569c57af51)
keep the face large and then surround it with things only a face-first card needs: "Premium" and
"Background Checked" badges, a first-person quote with a "more" link, a heart and a green "Contact"
button. About two rows per viewport.
[Preply's web results](https://mobbin.com/screens/b064c399-2564-4693-a24e-4ffecee967a2) go further:
face, name, a "Professional" badge, language lines, a three-cell stats strip ("4.9 ★ / 23 reviews",
"27 students", "863 lessons"), a translated prose introduction, a "Learn more", then a right column
carrying "$20 / 50-min lesson", a pink "Book trial lesson" and a "Send message", plus a video preview
panel beside it. Roughly two cards.
WHY_DENSITY section 3b already established the sharp end of this (Zocdoc gives one doctor 0.6 of a
viewport with a large portrait; Plazo fits ten with a small one and the deciding field becomes a time
line), and I am citing that rather than re-claiming it.

**Where Solen sits.** This is why bet B (WHY_CURRENCY, "the person, not the premises") is a much
larger change than a photo-source swap. It forces a density drop, which collides with the density
floor, which collides with the desktop column count. Bet B is a three-floor change wearing the
costume of a one-field change.

### F4. An editorial title forces a byline, a count or a date onto the section, and prose forces the photograph down to a left-hand thumbnail.

**The mechanism, two halves.** First, an editorial title is a claim that a judgment was made. A
judgment with no owner and no timestamp is unfalsifiable, so the reader has no reason to weight it
above an algorithmic row, and the title has spent a type slot to buy nothing. Second, prose is a
horizontal medium. A photograph above a paragraph wastes the width the paragraph needs, so every
editorial layout in the sample rotates the image to a small square on the left.

**Both halves, observed together, in nine products.**

- [Medium](https://mobbin.com/screens/c9e5dfe1-08fe-407f-986b-f99b421ec2d8): "The power of a morning
  routine / **List curated by Medium Staff**". The attribution is in the header, not a footnote.
- [Swarm](https://mobbin.com/screens/5901878d-8328-4b40-819f-befb3d7a3c41): "sit, sip, stroll /
  Perfect for a slow afternoon and spontaneous chats. / [avatar] **Sam Lee • Updated August 2025**"
  then "**3 places**". Author, freshness stamp, and item count, all three.
- [Hypelist](https://mobbin.com/screens/d4ea7401-f7b7-4080-81ed-5d3f2cc013b0): every collection card
  carries the curator's avatar and name overlaid on the photograph, plus "**19 items**", "**42
  items**", plus a save count.
- [The Infatuation](https://mobbin.com/screens/0a882b29-83b5-449d-88b0-224e6e26cb55): a small square
  photo on the left, a title, **a written line under it** ("We checked out these new restaurants and
  loved them."), and a date ("APRIL 4, 2025"). Also "SORTED BY MOST RECENT" as a header, which is the
  editorial equivalent of showing your working.
- [Resy](https://mobbin.com/screens/0d0f0111-1881-49e4-bd3b-d4892aa04c67): "Eight Things to Do This
  Month", numbered, and entry 2 names two specific restaurants, a specific band and a specific date
  inside the prose. That paragraph cannot be generated.
- [The New Yorker](https://mobbin.com/screens/ce6da3ff-a814-443e-94e0-2091eb21160b): a department
  eyebrow, a title, an italic dek, "By Eyal Press". Byline mandatory.
- [Afterpay](https://mobbin.com/screens/f5ca8b7b-f65a-4a1d-8270-2b313185fe26), which is the
  beauty-adjacent instance: screen title "From Our Editors", then photo-left rows written in the
  first person plural ("We're obsessed with these Korean beauty brands", "10 clean scents that smell
  like you, but better"), each with an underlined "Read more".
- [Matter](https://mobbin.com/screens/c19a7aa5-f0cf-4cd1-b843-a1489faa86dd) goes furthest: one
  section title is literally a person's name, "James Clear".
- [Pocket](https://mobbin.com/screens/7b92a972-d4cb-499e-815d-d772b47a41c8) and
  [Apple News](https://mobbin.com/screens/8c36d7b2-c9df-4841-a027-96c19c0791e1) attribute every
  single item to a verified source rather than to themselves.

**The cheap half and the expensive half, which is the operationally useful part.** The count and the
date are derivable from data at zero content cost. The prose and the byline are a content-operations
commitment. So the relation does not force Solen into publishing; it forces a choice between the
derivable tier and dropping the editorial claim.

**Where Solen sits.** `SectionHeader.tsx:66` ships an uppercase tracked eyebrow (`SectionMeta`) and
no count, no date and no curator. CORPUS.md already rejects that eyebrow on frequency grounds (zero
of twenty-five read headers use one). F4 says what the vacancy should be filled with **if** the
section is claiming judgment, and names the two sections that are:
`SalonOfMonth.tsx` (a superlative, which implies a selection process) and `Entdecken.tsx`.

### F5. A category tile carrying a real supply count converts the index from navigation into proof of supply, and commits you to printing the thin numbers.

**The mechanism.** A count is only evidence if it is printed when it is small. An index that shows
counts only where they flatter is not an index, it is a billboard, and users detect that quickly
because the categories with no number are exactly the ones they wanted.

**Every app I found doing this prints the thin case.** [Wolt](https://mobbin.com/screens/74dfcd07-faf1-401c-8bad-5a523b25cef2)
"Burger / 142 places", "Salad / 125 places". [Whatnot](https://mobbin.com/screens/841a33b9-2388-4c53-8c36-c3c48829093f)
prints "12 Options", "23 Options" and also "**6 Options**" and "**7 Options**".
[Airbnb Services](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2) prints "16
available / 5 available / 6 available" and then renders **seven** tiles reading "Coming soon" rather
than hiding the categories it has not launched.
[Orb Social](https://mobbin.com/screens/9893a62e-4374-42ba-849b-166267debd25) shows "5 MEMBERS" on a
tile immediately beside one reading "121 MEMBERS".
[Unity's category rail](https://mobbin.com/screens/5b890789-7046-4cd6-8c88-7023df1cce94) runs "3D
(93) / 2D (28) / Tools (20) / Audio (19) / **Templates (1)**".
[Alma](https://mobbin.com/screens/616be700-dfdd-4948-bc3a-5846b190026b) prints a literal "0".
[Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5) gives the count its own row
between the query and the list: a green check, "265 In-network providers", and a "Filters" button.
And [Preply](https://mobbin.com/screens/b064c399-2564-4693-a24e-4ffecee967a2) shows the cheapest
version of all, putting it in the H1: "**100+ Japanese tutors** to help you succeed at work".

**Where Solen sits.** `MobileCategoriesRow.tsx` is six tiles, `md:hidden` (line 76), `grid-cols-3`
(line 82), already pick-ordered by customer prefs, and it carries no counts. Adding real counts is
the cheapest supply proof available to a pre-launch marketplace and it needs no content operations
and no invented number. The forced consequence is that it publishes how thin each Swiss category
currently is. **That is a business decision about disclosure, not a design decision, and it is the
owner's.**

### F6. A control that displays state forces an edit path, and it forces a SECOND control beside it.

**The mechanism.** Once the entry control shows the current query, it becomes the only legible place
to change it, so it needs an in-place edit path or the state is a dead end. And the fields that make
a result EXIST (what, where, when) are a different set from the fields that SHRINK a result set
(price, sort, venue type). One control cannot be both without becoming a form. So a state-displaying
entry control always acquires a filter sibling.

**Observed, seven products, both platforms.**
[Fresha iOS search](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a) is the complete
case in one screen: a summary pill reading "Hair & styling · Tomorrow · Current l…", then a chip row
of "Sort by / Max price / Venue type", then "21 venues nearby", then the cards. Three separate
instruments: the query, the refiners, and the result count.
[Airbnb Services web](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2): a summary pill
("Services in Bali | Anytime | Spa treatments") and a distinct "Filters" button beside it.
[Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5): summary pill, count,
Filters.
[Care.com web](https://mobbin.com/screens/e6f07e6d-922e-42a9-becc-d5569c57af51) is the sharpest,
because it shows the same question asked twice at two commitment levels: a five-segment bar in the
header (care type, where, dates, times) **and** a left rail carrying a "Pay rate $18-$50 / hour"
slider. The bar decides what exists; the rail decides what survives.
[Dribbble](https://mobbin.com/screens/80662ab5-1b1b-4927-a12c-ea8140f35bcf) adds the third piece,
applied-filter chips with individual clear controls plus a "Clear Filters" escape.
[Preply](https://mobbin.com/screens/b064c399-2564-4693-a24e-4ffecee967a2) runs four dropdown fields
with x-clear, a second chip row, a sort, and a separate "Search by name or keyword".
And [Fresha's PDP](https://mobbin.com/screens/71f05473-cf92-40bc-a6eb-e9ab35d459ee) keeps the
four-segment bar as persistent header chrome even on a detail page, so the state receipt never
disappears.

**Where Solen sits.** WHY_ENTRY concludes that if Solen's mobile control collapses it should collapse
to the summary form (2b) rather than the invitation form (2a). F6 is the bill for that: 2b drags in an
edit path and a refiner sibling. Solen already owns the edit path
(`SearchOverlay.tsx`, imported at `SearchBar.tsx:30`, with segment tabs), so the missing piece is
that the refiner row exists on search and not on home. That is not an argument to add one to home; it
is the reason 2b is not the free option it looks like.

---

## 2. INCOMPATIBLE PAIRS

### I1. A pinned personal block and a photograph-dominant first screen cannot both own the top. But the resolution the corpus actually uses is not "pick one".

**The contested resource.** The first viewport is a fixed budget, roughly 844 pt on the measurement
device minus the status bar, the header and the tab bar. Every band above the inventory row spends
from it, and the budget does not care which band is more important.

**What products actually do, and this is the finding.** They do not drop the personal block. They
**strip its photograph.**

- [Marriott Bonvoy](https://mobbin.com/screens/87550d69-834b-45ea-8c84-5b172b304433): a search pill,
  then "CONTINUE YOUR BOOKING / Moxy Taichung / Jun 25-26 · NT$2,499.42 TWD" as a **text-only row
  with a chevron and no image at all**, then "RECENTLY VIEWED" as a **small left thumbnail** card, and
  the first full photographic card ("EDITION Hotels") is still cropped at the fold.
- [Vrbo](https://mobbin.com/screens/a2150d39-9dd0-4282-aad3-a0a44e8953fe): "Your recent searches" as
  text cards, "Your recently viewed properties" as one small card, then the photographic band.
- [Fresha iOS](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691): "Book again" is a
  thumbnail-left row and "Favourites", two centimetres below, is a photo-top card. One entity, two
  shapes, and **the demoted one is the personal one.**
- The control case, which completes the argument:
  [World of Hyatt](https://mobbin.com/screens/e9a169af-e2bf-4220-9ee8-e8747b8537a0) has no personal
  block, and its "Recommended for You" photographic cards land immediately in the first viewport.

**Why this reframes Solen's collision rather than confirming it.** FLOORS LAW 2 is an AREA rule:
roughly one third photographic. A text or thumbnail personal row costs that area almost nothing,
because it was never going to be a photograph. **So the incompatibility is between a personal block
and a photo-DOMINANT block, not between a personal block and the imagery floor.** WHY_RETURN section
4c states that any proposal pinning a personal band must shorten the hero in the same change or it is
just moving the problem. That is right about the hero and one notch too pessimistic about the band:
the corpus shows a fourth option, which is a personal band that gives up its own photograph.

The cost of that option, stated so it is not smuggled: it is exactly the second-anatomy-for-one-entity
failure that FLOORS LAW 8 forbids, and Fresha ships it. Section 2's pair I4 is where that gets
resolved.

### I2. A category grid above the fold and real inventory in the first viewport cannot both fit on a phone.

**The contested resource.** The same budget, and a grid is expensive: two rows of tiles plus a section
header is roughly a third of a phone viewport.

**Observed, four products, all resolving it against inventory.**
[Expedia iOS](https://mobbin.com/screens/eff48642-a5a0-4fe0-a5d3-c1bf99089968): "Hi, Alex", six
illustrated tiles in two rows, a One Key benefits card, and "Go beyond your typical stay" cropping at
the bottom edge. [Trip.com](https://mobbin.com/screens/596abac7-c270-4fbd-94a7-5b2fcc42e3c0): eight
tiles plus "+4 more", then the search field, then a chip row, then an editorial card, then promos
cropping. Zero inventory.
[Rappi](https://mobbin.com/screens/3314985d-eb8b-4390-b52b-c0696196602b): a full promo banner, search,
six tiles, then a photographic band cropping.
[Shangri-La Circle](https://mobbin.com/screens/3148b2b6-915c-43e7-89a2-cf801a3a07e0): search, five
circular category icons, a promo banner, three promo tiles, content tabs, and the first card at the
fold.

**And one product resolving it the other way, which is the more interesting datum.** Fresha iOS has a
[fourteen-tile category grid](https://mobbin.com/screens/c3fbecd3-61f9-4a93-bab4-fae45b8998a8), the
largest in the corpus, and it is the **fourth** section on the screen, after the greeting, Book again,
Favourites and Trending. The grid is not deleted. It is demoted below the fold. **The choice is not
grid-or-inventory, it is which one is first**, and the app with the biggest grid puts it fourth.

**Where Solen sits.** `page.tsx:200` renders `MobileCategoriesRow` as the FIRST child of `FeedZone`,
directly under a 250 px search card and the h1. So on mobile Solen currently resolves I2 against
inventory, in the Expedia direction, with a smaller grid than Fresha's and an earlier position than
Fresha's. **I have not rendered this and am not claiming a pixel.** The ordering is a fact from source;
where the fold lands is not.

### I3. The bottom edge holds exactly one persistent thing.

**The contested resource.** The thumb band. Two stacked bars plus the safe-area inset take roughly a
sixth of a phone screen and read as chrome, not content.

**Observed, ten screens, three resolutions.** Five drop the tab bar to hold a commit CTA:
[BlaBlaCar](https://mobbin.com/screens/df5422dd-4b57-4285-8af7-edc1ae841542) ("Book"),
[Careem](https://mobbin.com/screens/b4d62ad7-a0fb-4f9d-8d6f-5f8571ab3f4b) ("Book car (AED 2,109)",
the price inside the button),
[Viator](https://mobbin.com/screens/8279137c-58e2-4d0e-9683-b54f3a5d5493), in two separate captures of
the same sticky bar ("From $25.65 / Lowest Price Guarantee" on the left, a green "Check availability"
on the right; I am linking only the capture whose id I could re-verify),
[KakaoTalk](https://mobbin.com/screens/3b2a949d-f9ff-485e-8bed-3c126ee2409b) (the total inside a
yellow full-width button, with a cancellation and refund table rendered directly above it).
Three keep the tab bar and move the action INTO the card:
[Peerspace](https://mobbin.com/screens/2a1a4de1-a142-4fa0-9feb-4a139e565cb6) ("Invite Guests" plus
"Booking Details" inside the booking card),
[StubHub](https://mobbin.com/screens/78d3131d-1ae2-4b42-af17-e65fcbceaff1) ("Get tickets" inside the
order card),
[Singapore Airlines](https://mobbin.com/screens/cdce3bb6-cb16-4b76-9d77-263212700fc6) ("MANAGE
BOOKING" inside the trip card).
One keeps both, and only by making the bottom row a three-slot utility row with a non-commit verb:
[komoot](https://mobbin.com/screens/0add0d47-0d6e-461f-a276-682f40558201) ("Save" plus two icon
buttons above the tab bar).

**Where Solen sits, and why this makes one entry bet expensive.** WHY_ENTRY's position 4 is search
demoted to the bottom bar, held by Uber Eats. Uber Eats can afford it because its home screen has no
commit action. Solen has `app/[locale]/_components/salon/SalonMobileBookBar.tsx` on the PDP. If search
moves to the bottom on home, the bottom edge means "search" on one surface and "commit" on the next,
which is FLOORS LAW 8 applied to chrome rather than to cards. That is a cost WHY_ENTRY did not price
because the PDP was outside its lens.

**One useful side finding, since it bears on Solen's trust floor.** Three of the five sticky bars
carry money: Viator puts the from-price left of the CTA, Careem puts the running total left of "Next"
([also on its booking step](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5), "Total
AED 109.00" beside a green "Next"), and KakaoTalk puts the total inside the button. Solen's
hierarchy-density-05 trust floor requires the price broken down and the cancellation term rendered
above the commit button. KakaoTalk and Viator satisfy it; [Alan puts the price and the cancellation
term BELOW its CTA](https://mobbin.com/screens/ed903d4c-3065-4f73-a2f4-f7c6852d3736) ("From €70 per
session / Free cancellation up to 48 hours in advance"). So the corpus splits and Solen's floor is
stricter than one credible product. That is worth knowing before anyone cites "everyone does it" in
either direction.

### I4. Three currencies do not fit on one rail card. And this is the pair with the strongest evidence in the file, because the evidence is a search that failed.

**The contested resource.** Card area, and more importantly reader attention: a card can make one
element loudest, and a second loud element does not add a signal, it removes one.

**What I looked for and did not find.** I searched iOS specifically for a provider card carrying a
photograph, a from-price and bookable times as three peer elements. Ten screens came back and **not
one of them does it.**

- [Zocdoc's PDP](https://mobbin.com/screens/3d9c066a-b33c-4fbe-ab06-fe96a70c2b3a): face, name,
  specialty, rating, locations, insurance, then eight yellow time pills. **No price anywhere.**
- [Alan](https://mobbin.com/screens/ed903d4c-3065-4f73-a2f4-f7c6852d3736): face, name, role,
  "Available on Thursday" as a day WORD rather than a slot, prose, a full-width CTA, and the price
  demoted underneath it. Price and a day, never price and slots.
- [Square Go's PDP](https://mobbin.com/screens/b302dc27-ed66-4442-a59e-1e4dc73799b1) splits them
  across LEVELS rather than fusing them: the time lives as a sublabel inside the Book button
  ("Saturday 1:00am"), the price lives on the service row ("Starting at $150 · 2hr"). Note also that
  its photo slot here is an empty grey placeholder with an icon, which is the missing-photo fallback
  shipped rather than omitted.
- [Peloton](https://mobbin.com/screens/759a46a3-464b-4f6e-b158-44c7c25de943) and
  [WeChat](https://mobbin.com/screens/5230439b-c66c-4ebd-8b14-ebb31d8bf2d7) carry a photo and a
  date-time and no price at all; WeChat carries opening HOURS, which is a different promise entirely.
- [Turo](https://mobbin.com/screens/3db4922c-70a5-4b24-8a8f-a510a28a7906) resolves it by nesting: the
  person is the container, and the priced object ("$44/day") is a card inside them.

**The one product that does carry all three, and what it costs.** Fresha's search card, visible in
[the iOS capture I read this session](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a):
a full-width photo with dot pagination, "Hair Studio Sho", "5.0 ★★★★★ (235)", the district, then a
service MENU where each row is a name, a duration, a right-aligned price and a row of outlined time
pills ("Women's Haircut / 1 hr, 30 min / $140" with 10:00 AM, 10:30 AM, 2:00 PM; then "Hair Color |
Double Process or Balayage / 3 hr, 30 min - 5 hr / $300"). It fits three currencies by **ceasing to be
a card and becoming a table**, at one unit per viewport.

**Why this is decisive for Solen.** WHY_DENSITY found that Solen occupies a configuration it observed
in no app, price without time. I4 adds the other half: **the configuration Solen would move to
(photo + price + time on a rail card) is also unobserved, and I4 is the reason.** Three currencies at
rail density is not a thing anyone ships. So the real menu is narrower than either lens implied:
drop the price on the rail (legally fraught, per WHY_CURRENCY 5b), drop the time (status quo), split
across levels like Square Go, or accept one unit per viewport like Fresha's search card, which is a
search-page density and not a home-rail density.

### I5. One entity cannot serve four jobs through one component, and "documented variant" stops being true somewhere before four.

**The contested resource.** Not space. The stretch a single component can absorb by prop.

**ClassPass renders the same studio four different ways.**
[Favourites](https://mobbin.com/screens/9ba1ece7-0eef-472a-98e0-c5d1f8504b46) and
[scrolled](https://mobbin.com/screens/3a0ed701-af07-4b92-ad44-ac4d96cd903f): a full-bleed photographic
banner with the studio name set in white **on** the photo, heart top-right, about 3.5 per viewport.
[Search, "Saved places"](https://mobbin.com/screens/2a759804-b034-48f9-9292-084d53ca4fb0): the same
studios as **circular avatars** with truncated names beneath, in a horizontal strip.
[The favourites schedule](https://mobbin.com/screens/f22d5e3d-c68f-49b9-8b1d-bf6261181fad): the same
studios as **plain text rows with no imagery**, time left, spots count right. And photo-top cards on
home (CORPUS.md).

Each one is right for its job: browse by feel, pick a known place, pick a time, discover. But the
photograph moves from full-bleed to a circle to absent, and the name moves from on-photo to
under-photo to mid-row. **No single component produces that range by prop.** FLOORS LAW 8 permits "a
documented VARIANT of one component" and forbids "a second implementation". ClassPass shows that the
permitted word can absorb two densities and cannot absorb four, and that the pressure to sprawl comes
from having four genuinely different jobs, not from carelessness.

**Where Solen sits.** This is the constraint that binds bet R1 (home is the rebook rail). A rebook row
has a different job from a browse card, and I1 shows the market's answer is to strip its photograph,
which is precisely the anatomy `SalonCard` cannot produce by prop today. So R1's real first question
is not "should home rebook" but "how many anatomies is `SalonCard` allowed to have", and the answer
has to be set before the row is designed, not discovered afterwards.

### I6. A fixed-width personal rail and a two-item history cannot both look intentional.

**The contested resource.** The rail's own width, which was sized for a full row.

**Observed this session, three products, one shape.**
[Fresha web](https://mobbin.com/screens/cf32643c-18e8-49a9-b7b6-115ca95dee9e) renders "Favourites"
holding exactly **one** card in a row sized for four, with three empty columns beside it, and
"Recently viewed" directly below holding two. On the same screen. And the same salon, Lyna's Beauty
Salon, appears in both rows.
[Preply iOS](https://mobbin.com/screens/c403da75-8291-4cac-8581-f3fc6670d628) renders "Favorite
tutors" as one card followed by an entirely grey screen.
[Vrbo](https://mobbin.com/screens/a2150d39-9dd0-4282-aad3-a0a44e8953fe) leaves a visible hole to the
right of its single recently-viewed card.

WHY_RETURN named this failure (absence is invisible, sparseness reads as a bug) and left it open. **The
corpus contains one fix and I found it this session:**
[ClassPass's "Saved places" strip ends in a dashed-outline circular "+"](https://mobbin.com/screens/2a759804-b034-48f9-9292-084d53ca4fb0),
so a three-item strip is never short, and
[the same strip at five items](https://mobbin.com/screens/92675c89-57ad-40d4-8f3f-959a6c2ca828) shows
it scales. It fills the hole with an affordance instead of with content, which costs nothing and
fabricates nothing.

**Where Solen sits.** `RecentlyViewed.tsx:110` gates on `hasHistory = entries !== null &&
entries.length > 0`, so **one** stored entry renders the rail. The backfill handles zero. Nothing
handles one or two. That is the open leg, verified rather than assumed.

---

## 3. ONLY-TOGETHER PAIRS

### T1. An inventory-free first viewport is inert without a number that carries its own provenance.

**Why it is inert, not merely empty.** A hero-only first viewport makes a claim ("this is a
marketplace for X") and gives the visitor no way to check it. A number can substitute for the missing
inventory, but only a checkable one, because an unverifiable number is read as copy and copy is
exactly what the visitor discounts.

**Four provenance devices, all observed.**

1. **Unrounded precision.** [Whop](https://mobbin.com/screens/ab2e4f9d-a021-4913-8c1d-310dcbe5845a)
   prints "$2,857,094,832 MADE BY PEOPLE" and "40,727,044 USERS ON WHOP". Nobody writes those digits
   by hand. Fresha's counter works the same way and I can now put a sixth value on the record: **I
   read 456,602 appointments booked today** in
   [this capture](https://mobbin.com/screens/923e5154-c265-436e-8d2f-2a1c56699a06), against the
   217,913 / 320,602 / 320,692 / 320,797 / 320,898 recorded across the two prior sweeps.
2. **A freshness stamp.** [Zillow](https://mobbin.com/screens/6a133906-a7e9-4623-ad43-520a04a4da69)
   makes "$368,198" the display anchor and attaches a direction ("↑0.6% 1-yr"), a prose explanation,
   and "**(Updated on 4/30/2026)**".
3. **A named source or footnote.** [Unity](https://mobbin.com/screens/b1184c9b-fa62-497a-b4ad-9eb63ef524e1)
   puts superscript footnote markers on "3.6B downloads per month" and "82 of the top 100 games".
   [Kraken](https://mobbin.com/screens/5c032e77-cca1-456e-8180-41c589e2849d) asterisks its claim to
   "Ranked best crypto platform of 2025 by Forbes Advisor".
4. **A stated window and denominator.**
   [Employment Hero](https://mobbin.com/screens/993f2ab4-bcaa-4e38-b688-ddfb0f1ec36b): "Customers
   rate us 4.5 ★ / **Based on 199 Service Ratings over the past year**", with the count linked.

**And the control case, which is the useful one.**
[Babbel](https://mobbin.com/screens/1cca17be-744e-4a3e-8d05-9f466f0184bb) prints "65% of our users
are beginners!" with no precision, no source, no window and no denominator. It reads as marketing,
and it is the exact shape Solen's own stat-source rule bans.

**An honest negative finding about this pair.** I searched the web corpus specifically for a live
counter on a marketplace product home and got ten SaaS and marketing landing pages and **zero
marketplace product surfaces**. So across five sweeps, Fresha remains n=1 in its own category, and
the rest of the evidence for this pattern comes from a different genre with a different honesty
standard. That should temper how confidently the counter is cited as a precedent.

**Where Solen sits.** Pre-launch, seed data, no provenance-carrying number exists. So the
inventory-free first viewport is not available to Solen **as a matter of a missing precondition, not
as a matter of taste.** WHY_DENSITY reached the same conclusion ("Position 4 borrowed from Fresha
without the one element that makes Fresha's version work"); T1 adds what the substitutes are, and
both are affordable: F5's per-category real counts, or Preply's move of putting the count in the
headline.

### T2. A segmented bar is inert unless every segment is a real, wired constraint on the result set.

**Why.** A segment is a promise that the field changes the answer. A field that does not filter costs
a tap and teaches a false model of what the product indexes, which is worse than costing a tap.

**Observed.** Fresha's four segments each map to something wired: the treatment field's dropdown **is**
the category list, [captured with it open](https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7)
(Hair & styling, Nails, Eyebrows & eyelashes, Massage, Barbering, Hair removal), and the field it does
NOT have, price, appears instead as a "Max price" refiner on the search surface
([shot](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a)).
[Care.com's home](https://mobbin.com/screens/b999fac3-b13f-4909-a4c5-e96e0b4486ff) ships three header
fields that all narrow (care type, "near 94025", "within 10 miles") and keeps money in the rail.
[Preply](https://mobbin.com/screens/b064c399-2564-4693-a24e-4ffecee967a2) is the most literal case: its
availability field reads "6-9, 9-12 · Sun, Mon, Tue", a multi-select over real slots.

**Where Solen sits.** This is Solen's own silent-no-op law arriving from the design side. The CLAUDE.md
silent-no-op block already demands that a filter DISCRIMINATE rather than merely render. T2 says the
entry control's ARITY is a claim about the backend, so "how many segments" cannot be decided
separately from "which of them actually filters". Solen ships three (`SearchBar.tsx`, three
`CollapsedRow` calls: Service, Stadt, Zeit), and project memory records that date hard-filters
availability, so all three are honest today. **The relation's real force is prospective: a fourth
segment would need the discriminate proof before the design, not after.** WHY_ENTRY looked for an
argument for a fourth field and found none; T2 is the reason that absence is a good thing rather than
a gap.

### T3. An editorial section title is inert without curation, and the affordable version of curation is to state the selection MECHANISM rather than claim a curator.

F4 gives the mechanism and the evidence. What belongs here is the tier structure, because it is what
makes this actionable pre-launch.

- **Expensive tier: authorship.** A named curator plus prose. Medium's "curated by Medium Staff",
  Swarm's "Sam Lee", Hypelist's curator avatars, Resy's paragraph naming a band and a date.
- **Cheap tier: attribution of the mechanism.** State how the row was selected, which is derivable.
  Vrbo's "Because you viewed vacation homes in Bangkok" and DoorDash's "Based on orders placed in the
  past week" (both recorded in the sibling lenses) are this tier, as is Etsy's "Your recommendations
  get better as you favorite more things".
- **Free tier: a count or a date.** Hypelist's "19 items", Swarm's "3 places" and "Updated August
  2025", The Infatuation's "APRIL 4, 2025".

**Where Solen sits.** `SalonOfMonth.tsx` is a superlative and therefore makes the strongest editorial
claim on the home screen, with no stated basis. It is the one section where the cheap tier would do
real work, because "Salon of the Month" invites exactly the question "chosen by whom, on what".

### T4. A personal rail needs three things together: a live read, a backfill, and a minimum count. Drop any one and it produces a named, observed failure.

- **No live read:** nothing renders, and fabricating is banned outright by taste rule 1. This leg is
  not optional and not negotiable.
- **No backfill:** the dead-end empty state. WHY_RETURN counted it: fourteen of sixteen empty
  saved-list screens are an illustration plus copy plus a blank, and two backfill.
- **No minimum count:** I6's sparse rail. Fresha web's one-card Favourites, Preply's one-card
  favourites screen, Vrbo's hole.

**Where Solen sits.** `RecentlyViewed.tsx` has the live read (localStorage, capped at 5 at line 73) and
the backfill (`topSalonIds`, relabels to "Top auf Solen", returns null only if the fallback is also
empty). It does not have the minimum count: line 110 renders the rail at one entry. WHY_RETURN went
looking for a defect in this component and said it could not find one and might just be agreeing. **The
defect is the third leg, and it is visible only from the relations view**, because the count rule
belongs to a different lens (density) than the component (return).

### T5. A minimal or wordless entry control is inert unless the location it silently resolved is asserted somewhere checkable.

**Why.** If the screen never asks where you are, you cannot know it knows, so "Nearby" is an
unverifiable claim and the user has to take the ranking on faith.

**Observed.** Square Go's wordless field is paired with a section title reading "Recommended in
**94025**", so the resolved location is proven in content rather than requested in a field
(WHY_ENTRY, position 3). [Zocdoc](https://mobbin.com/screens/febf2279-5b8c-4bed-a7e8-0b286bfb13e5) does
the same job for the result set with "265 In-network providers" on its own row.
[Fresha iOS](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a) does both at once: the
summary pill ends in "Current l…" and the list is headed "21 venues nearby".

**Where Solen sits.** `Nearby.tsx` already receives a `nearbyCount` prop (`page.tsx:204`), and a
`CityTopBar` exists, so the assertion slot is already built. The relation says that if the mobile entry
control ever shrinks (WHY_ENTRY choice 1), this assertion stops being a nicety and becomes the thing
that makes the shrink honest.

---

## 4. THE ONE CHOICE THAT DECIDES THE MOST

**My answer: what the card's largest element is a picture of, and which single fact is its
second-loudest. The currency.**

**The argument is edge count across layers, not importance.** Fix the currency and the following stop
being open questions:

1. **The photo's subject** fixes who has to supply the photography: the salon's venue shots, staff
   portraits, or continuous result photography. That is a content-operations commitment (F3, and
   WHY_CURRENCY's position 3 cost).
2. **The photo's size** fixes cards per viewport, which fixes cards per row on desktop, which fixes
   whether the name truncates (F2), which fixes whether the name is still a comparable field.
3. **Whether a bookable time is the currency** fixes whether the photo shrinks or the count halves
   (F1), fixes whether a real availability read is a prerequisite, and fixes whether the rail is a
   commit surface or a read surface.
4. **Whether three currencies are attempted** is already answered by I4: they do not fit at rail
   density, so the currency decision is also the decision about what the rail is FOR.
5. **The entity** (venue or practitioner) fixes the data model, what a rebook row names, and what the
   URL is about.
6. **Comparability** fixes whether the surface can decide or only browse, which fixes how much work
   the entry control has to do, which fixes its arity (T2) and therefore its geometry.
7. **What the card cannot show** fixes what must be proven elsewhere: if the card cannot demonstrate
   supply, the category index or the headline has to (F5, T1).
8. **How many anatomies one component must produce** follows from how many jobs the currency leaves
   unserved (I5), which is what makes or breaks FLOORS LAW 8.

**Why the runner-up loses, stated fairly, because it is a genuinely close call.** The rival is *must
the first viewport contain real inventory*. It decides the entry control's geometry, the hero's
height, whether a personal band can pin above the fold (I1), whether the category grid can be first
(I2), and the density number. That is five edges, which is respectable. It loses because **all five
are layout edges, and layout is the cheapest thing in this estate to change.** Hero.tsx proves it: the
file carries roughly 120 lines of comments over about 40 lines of JSX, documenting six separate
revisions of the same vertical rhythm, each one reversible in an afternoon. The currency decision
commits photography, a data model, a backend availability read, where a statutory price can sit
quietly, and the component graph. Those are not afternoons.

**The sharpest single edge, and why one settled decision was bigger than it looked.** The most
consequential sub-decision inside the currency is whether a bookable time appears on the card.
CARD_REDESIGN_2026-07-13 C2 deleted the next-slot row on card-composition grounds, via an
owner-approved mockup, and by the precedence chain that call stands. What F1 and I4 add is that the
same decision also settled the photo-versus-count question and bounded the desktop column count,
because a card with a time cannot hold six-across with a 5:4 photo. It was a currency decision wearing
the clothes of a composition decision. That is not an argument to reverse it. It is an argument that
if it is ever revisited, the revisit is three floors wide, not one row wide.

**The condition that would flip my answer, named so this is falsifiable.** WHY_CURRENCY section 5c
raises the possibility that Solen's venue photographs do not discriminate between venues, and marks it
the strongest unverified claim in that document. **If that is true, the photograph is not carrying the
decision, most of the currency question collapses, and the first-viewport question becomes the most
load-bearing choice by default.** So the single measurement that decides which question is the most
load-bearing is the between-venue photo variance measurement on the real seeded set, and nobody has
run it. That measurement is worth more than any further sweep.

---

## 5. RELATION TO SOLEN SURFACE MAP

Every path verified on disk 2026-07-30. Line numbers cited where a specific value is claimed.

| Relation | Solen surface it constrains | File paths | Current state, read not recalled |
|---|---|---|---|
| **F1** time on card forces photo or count | home rails, search results, PDP service rows | `app/[locale]/_components/homepage/SalonCard.tsx` (`aspect-[5/4]` :426, widths :404-408), `app/[locale]/_components/homepage/SectionHeader.tsx` (rail `gap-3` :409) | 4 cards at `md`, 5 at `lg`, 6 at `xl`; `nextSlotLabel` still in props (:302, :348), unrendered. A time cannot come from the photo (imagery lock), so it comes from count, which is already below the 6-desktop floor at `md` and `lg`. |
| **F2** photo size forces columns forces truncation | home rails, search grid | `SalonCard.tsx` (`CardName` `truncate` :505, widths :404-408) | Truncation is the chosen overflow mode. Raising `md` from 4 to 6 to meet the density floor makes long Swiss names truncate harder; FLOORS LAW 1(f) must be run at the new count first. |
| **F3** a face forces lower density | any staff-forward surface, `FeaturedStylists` | `app/[locale]/_components/homepage/FeaturedStylists.tsx`, `SalonCard.tsx` | Bet B is a three-floor change (density, columns, imagery), not a photo-source swap. |
| **F4 / T3** editorial title forces byline, count or date | the two sections making a judgment claim | `app/[locale]/_components/homepage/SalonOfMonth.tsx`, `Entdecken.tsx`, `SectionHeader.tsx` (uppercase eyebrow :66) | Eyebrow present and already rejected on frequency by CORPUS.md. No count, date or stated basis on any section. `SalonOfMonth` makes the strongest claim with the least support. |
| **F5** supply counts force printing thin numbers | mobile category grid, desktop category gap | `app/[locale]/_components/homepage/MobileCategoriesRow.tsx` (`md:hidden` :76, `grid-cols-3` :82) | Six tiles, pick-ordered by prefs, no counts, mobile only. Counts are the cheapest honest supply proof and they publish category thinness. Owner call. |
| **F6** state display forces an edit path and a refiner sibling | home entry control, search header | `app/[locale]/_components/homepage/SearchBar.tsx` (:30 imports overlay, :285 desktop pill, :305 mobile stack), `app/[locale]/_components/search/SearchOverlay.tsx` | Edit path exists (segment tabs). Refiner row exists on search, not on home. So collapsing mobile to the summary form is not free. |
| **I1** personal block vs photo-dominant top | home feed order, mobile first viewport | `app/[locale]/page.tsx` (:189 Hero, :196 FeedZone, :200-213 order), `RecentlyViewed.tsx` | Corpus offers a fourth option both lenses missed: a personal band that gives up its own photograph. Costs a second anatomy, which lands on I5. |
| **I2** category grid vs inventory in the first viewport | mobile home order | `page.tsx:200` (`MobileCategoriesRow` first in `FeedZone`), `Hero.tsx` | Grid is first, directly under a 250 px search card. Fresha puts its larger grid fourth. Ordering is a source fact; the fold position is unmeasured. |
| **I3** one persistent thing on the bottom edge | PDP sticky bar vs any bottom-bar search | `app/[locale]/_components/salon/SalonMobileBookBar.tsx`, `app/[locale]/walk-in-pay/page.tsx` | Moving search to the bottom on home would make the bottom edge mean two different things across two surfaces. Also: three of five observed sticky bars carry money, which supports the hierarchy-density-05 trust floor. |
| **I4** three currencies do not fit one rail card | home rails, search card | `SalonCard.tsx` (row 3 `justify-between` :527, `PriceFrom` :539) | Price without time is unobserved (WHY_DENSITY). Photo plus price plus time at rail density is also unobserved. The real menu is four options, all costly. |
| **I5** one entity, four jobs, one component | every salon surface | `SalonCard.tsx`, `RecentlyViewed.tsx`, `ForYouSalonRows.tsx`, `Nearby.tsx`, `app/[locale]/_components/profile/ProfileTabs.tsx` | FLOORS LAW 8 permits a documented variant. ClassPass shows the word absorbs two densities and not four. Bet R1's first question is how many anatomies `SalonCard` may have. |
| **I6 / T4** sparse rail needs a minimum count | every conditional personal rail | `RecentlyViewed.tsx` (`hasHistory` :110, cap 5 :73, fallback :114) | Live read yes, backfill yes, minimum count **no**: one entry renders the rail. ClassPass's dashed add-slot is the observed fix and fabricates nothing. |
| **T1** empty first viewport needs a provenance-carrying number | desktop hero | `Hero.tsx` (h1 + sub + SearchBar only; `md:pt-14 md:pb-16`) | No number of any kind. Pre-launch seed data means none can be printed honestly. Substitutes: per-category counts (F5) or the count in the H1 (Preply). |
| **T2** every segment must actually filter | entry control arity | `SearchBar.tsx` (three `CollapsedRow`: Service, Stadt, Zeit), `app/api/salons/route.ts` | Three segments, all reported to discriminate. Binds prospectively: a fourth needs the proof first. |
| **T5** silent location must be asserted in content | nearby section, city bar | `Nearby.tsx` (`nearbyCount` threaded at `page.tsx:204`), `CityTopBar` | Assertion slot exists. Becomes load-bearing if the mobile control shrinks. |

---

## 6. Two stale numbers, surfaced not silently fixed, and the reason they are both stale

Per rule 18, and this matters because three of the four lenses inherited at least one of them.

**6a. `md:min-h-[92dvh]` is not in `Hero.tsx`. It is only in the comments, and one of those comments
records its removal.** Grepped today: the string appears at `Hero.tsx:114`, `:127`, `:134` and `:137`,
all inside comment blocks, and line 137 reads "Fix: drop md:min-h-[92dvh], pt-32 to pt-12. Hero now
hugs the top like Fresha" (V3-D228). The live className on the hero container is
`mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 pt-10 pb-2 md:px-8 md:pt-14
md:pb-16`. No `min-h` at any breakpoint.
**Documents asserting it as live:** `sections/home-feed/CORPUS.md` section 7 (and its whole
"92% of the viewport holding zero photographic pixels" argument), `research/WHY_ENTRY.md` section 4a
("desktop keeps `md:min-h-[92dvh]`"), `research/WHY_RETURN.md` section 4c ("whose desktop hero already
carries `md:min-h-[92dvh]`").
**`research/WHY_DENSITY.md` sections 4a and 7a caught it independently and is correct.** I am
confirming that finding by grep rather than repeating its arithmetic.

**6b. `HEIGHT.mobile.collapsed` is 250, not 280.** `SearchBar.tsx:100` reads
`mobile: { collapsed: 250, expanded: 600 }`, and it is consumed as an explicit style at line 265
(`height: isExpanded ? sizes.expanded : sizes.collapsed`). The value 280 appears twice in the comment
history above it (V2-D70 at line 74, V3-D144 at line 93), which is where it was picked up.
**`research/WHY_ENTRY.md` sections 4a, 4b and 4d build their headline claim on 280.** The direction of
that argument survives intact: 250 px against 55 pt (Airbnb), 51 pt (Square Go), 41 pt (Uber Eats) and
0 pt (Fresha iOS) is still roughly four and a half times the nearest comparable, and still a geometry
no phone home screen in that corpus holds. The number does not survive. Anywhere WHY_ENTRY says "280"
and "5x", read 250 and roughly 4.5x.

**6c. The shared root cause, because it is the same failure twice and it will happen again.** Both
wrong values were read out of comment blocks in files that carry their entire tuning history inline.
`Hero.tsx` is roughly 120 lines of comment to about 40 lines of JSX; `SearchBar.tsx` carries eight
dated revisions of one constant directly above the constant. Two of four lenses, working on the same
day from the same instruction to verify on disk, cited a dead value from those two files. **The
comments are not the problem individually, they are load-bearing history. The hazard is that the live
value and six retired values sit in the same visual block, and grep returns all seven.** The cheap
mitigation for any future sweep is to read the const or the className, not the block above it, and to
grep for the value in JSX rather than in the file.

---

## 7. What I could not determine

1. **Whether any relation here is causal.** I state a mechanism and show apps paying it in different
   currencies. I did not observe a single experiment, and no company in this file said any of this.
   Every "forces" below section 1 is a claim about a resource budget, not a claim about a decision
   anyone made.
2. **Motion and gesture, entirely.** Stills only. Nothing about how a summary pill expands, how a
   sticky bar enters, or whether ClassPass's dashed add-slot animates.
3. **Any Solen rendered geometry.** I read source. I did not start a dev server or take a screenshot.
   The I1 and I2 claims about what falls above Solen's fold are unmeasured; only the render ORDER and
   the constants are verified. One screenshot at 390x844 and one at 1440x900 would settle them, and
   that is the first step before acting on either.
4. **Whether ClassPass's four anatomies cost it anything.** I can see the sprawl. I cannot see whether
   users are confused by it, and I5 should not be read as evidence that they are.
5. **Whether the dashed add-slot fix generalises.** I observed it on a circular avatar strip. Whether
   it works on a full card rail, where the empty slot is much larger, is untested.
6. **Solen's between-venue photo variance.** Unmeasured, and per section 4 it is the measurement that
   decides which question is the most load-bearing. It is the single highest-value open item in all
   five WHY files.
7. **Whether any new card field survives four locales.** copy-i18n-09 says French and German commonly
   run 15 to 35% longer. Row 3 of `SalonCard` is already 12 px carrying a truncated address plus
   "ab CHF n". No measurement taken.
8. **The beauty-booking sample is still two products.** Booksy, Treatwell, StyleSeat, Vagaro, Planity
   and Shortcuts remain unobservable through Mobbin; I relied on CORPUS.md's prior finding rather than
   re-searching. Every relation above was derived from adjacent markets and would be worth re-testing
   against a live capture of Booksy or Planity via `reference-lock`.

---

## 8. Provenance

Sweep run 2026-07-30 via Mobbin MCP. Ten `search_screens` calls, seven `ios` and three `web`, in this
order: restaurant reservation rows with time pills and a thumbnail (ios); marketplace results with a
left filter sidebar and a multi-field header form (web); home screen with a pinned upcoming booking
above photo cards (ios); editorial curated collection with a written headline and author description
(ios); booking detail with a sticky bottom book button above a tab bar (ios); landing hero with a live
statistic counter (web); category tiles printing per-category availability (ios); beauty and hair salon
booking home with category tiles and salon cards (web); provider card with photo, from-price and times
together (ios); ClassPass home with saved studios and class cards (ios). 91 results, roughly 86
distinct captures, every linked screen examined as an image before being described.

Solen-side verification, all read on disk 2026-07-30 with line numbers cited inline:
`app/[locale]/page.tsx`, `app/[locale]/_components/homepage/Hero.tsx`, `SearchBar.tsx`,
`SalonCard.tsx`, `SectionHeader.tsx`, `MobileCategoriesRow.tsx`, `RecentlyViewed.tsx`, plus
`ls` of `app/[locale]/_components/homepage/` to confirm every component named in section 5 exists, plus
`find` for the sticky book bar (`app/[locale]/_components/salon/SalonMobileBookBar.tsx`). **No claim
about Solen in this document is from memory or from another document.** The two stale values in section
6 were caught by reading the live constant and the live className rather than the comment blocks above
them.

Prior in-repo research read in full before writing and deferred to rather than restated:
`research/WHY_ENTRY.md`, `research/WHY_CURRENCY.md`, `research/WHY_RETURN.md`,
`research/WHY_DENSITY.md`, `sections/home-feed/CORPUS.md`. Exists-checks run:
`npm run exists relations` (0), `coupling` (0), `tradeoff` (0), `constraint` (0), `dependency` (2
graveyard hits, both unrelated dead code), plus a repo-wide grep for relation vocabulary across
`_design-system/` which returned five files, none of which is a dependency graph.

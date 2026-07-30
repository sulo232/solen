<!-- exists-check: net-new vs _design-system/sections/home-feed/CORPUS.md,
     _design-system/sections/search-results/CORPUS.md and
     _design-system/sections/salon-detail/CORPUS.md, all three read before writing. Those are
     FREQUENCY documents: they count how many apps do a thing and issue an adopt/reject verdict
     per row. This file counts nothing. It asks what each card is SELLING, argues backwards from
     what each app makes largest to what it believes the user decides on, and deliberately leaves
     two credible apps in disagreement instead of picking a winner. It CORRECTS one row in
     home-feed/CORPUS.md (section 6 here). Sibling convention: research/AXIS_GRID.md,
     research/AXIS_FONT.md, both read in full first; neither addresses what the card sells.
     `npm run exists price` run 2026-07-30: PriceFrom and PriceRangeBadge already exist and are
     the components this file argues for keeping, not replacing. No graveyard hit is re-proposed. -->

# WHY: CURRENCY

**The question this lens answers:** when a card represents a bookable salon, which single fact is
the card actually selling, and what does an app have to believe about its user to make that fact
the largest thing on screen?

Date: 2026-07-30
Instrument: Mobbin MCP, 12 distinct searches (9 iOS, 3 web).

---

## 0. Sample, stated before any claim

**12 searches returned 145 screen results.** After removing repeats across searches that is roughly
**138 distinct captures** from **about 70 apps**. Every screen I describe below, I looked at the
image. Nothing here is written from memory of a brand.

**The beauty-specific sample is small and I am not going to dress it up.** Booksy, Treatwell,
StyleSeat, Vagaro, Squire and Mindbody are still not in Mobbin's corpus. I ran a search naming
Booksy directly and it returned [Fresha](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)
and [Square Go](https://mobbin.com/screens/4f9be7f8-db2b-42f4-afdd-900d15e25c8c) instead. So the
pure beauty-booking products I could observe are **Fresha, Square Go, Careem's Salon&Spa vertical,
Ulta Beauty's salon surface, and Airtasker's Hair-and-beauty row**. Five. That is a sample, not a
category, and where I say "beauty apps" those are the members.

**What compensates for that:** the adjacent markets are the useful evidence anyway. A haircut is
structurally closer to hiring a tutor, a caregiver, a physiotherapist or a coach than it is to
booking a hotel room, and Mobbin has all four in depth. The comparison that produced the best
argument in this document is Care.com against Airtasker, neither of which is a beauty app.

**Precision, honestly.** Mobbin serves iOS captures at roughly 299 px wide and web at roughly
768 px. **No absolute pixel size in this document came from a Mobbin image.** Every size claim is
either relative ("larger than the name on the same card") or explicitly an estimate. I did not run
PIL on this sweep; AXIS_GRID.md did that for geometry and this file does not repeat it.

**Motion: nothing.** Still images. I observed zero transitions and make no claim about any.

---

## 1. The four positions, and what each has to believe

I sorted the corpus by asking one question per card: *if you squint until only the biggest thing
survives, what is left?* Four answers came back. They are not styles. They are four different
theories of what the user is deciding.

---

### Position 1: THE ROOM. The card sells a place you will sit in.

**The belief.** You are going to spend forty-five minutes inside this business, in a chair, with a
stranger's hands on you. The thing you are actually screening for is whether it looks like a place
you belong. Price and time are logistics you resolve after that.

**What it looks like.** The venue photo is the largest element and sits at the top. The title is the
BUSINESS name. Price is a small right-aligned figure attached to a named service. Time, if present,
is the only saturated element on the card.

[Fresha web search results](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937) is the
complete statement of this position and it is worth reading closely, because it is more complicated
than "a salon card". One result is: a photo of a salon interior, then "Bella Beauty Salon" bold,
then "No reviews yet", then the district in grey, then a hairline, and then a **service menu**:
"Blowout / 30 mins" on the left with "from US$48" right-aligned, and under it a row of blue-outline
time chips reading 10.00, 10.15, 10.30 and an overflow dot-menu. Then "Retouch One Step Color /
45 mins" with "from US$85". Then "Keratin Treatment / 1 hr, 30 mins" with "US$300". Then "See more".
The [iOS twin](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285) is the same card with
purple chips: "Women haircut / 45 min - 1 hr / from $100", "Root Touchup / from $110".

So Fresha's search card carries **four currencies at once and ranks them by position**: the room gets
the area, the business gets the title, the price gets a right-aligned column, and the hour gets the
only colour.

Also in this position: [Square Go's home feed](https://mobbin.com/screens/4f9be7f8-db2b-42f4-afdd-900d15e25c8c),
where the card is a photo of a spa interior with a small "Google" attribution chip in the corner and
the subline is a comma-list of services ("Brazilian, Organic Facial by Botnia, Bikini + Rear"). The
attribution chip is a quiet admission worth naming: they do not have their own photography, so they
source it from Google Places and label it rather than omit the photo.
[Time2book](https://mobbin.com/screens/d0da45c2-f9d2-4085-8585-d9e538b9c520) is the minimal version:
a cover photo, a studio name, then rows of "1:1 Personal Stretch Therapy / 45 min / Treatment Room"
with "$65.00" and a grey "Book" pill right-aligned.

**What it buys.** A photograph is the fastest possible input. It answers a question the user cannot
articulate and would not answer honestly in a filter. It also satisfies an imagery floor for free,
because the content IS the image.

**What it costs.** The photo is the largest element, so it is spending the most card space of
anything, and it only earns that space if it **discriminates**. Where every venue in a category
photographs the same, the biggest element on the card is carrying no information. Second cost: a
room photo says nothing about who will be holding the scissors, and in this trade that is the thing
that goes wrong.

**Suits.** Products where the venue is genuinely differentiated and the visit is part of the
purchase: spas, restaurants, hotels, studios.

**Harms.** Products where the practitioner travels to you (there is no room), and products where the
venues are visually interchangeable, because then the card has made its biggest promise with its
least informative element.

---

### Position 2: THE PERSON. The card sells a human you are hiring.

**The belief.** The outcome is inseparable from who performs it, and you cannot evaluate a
stranger's skill from a listing, so what you actually do is a risk assessment on a face. Give the
user the face at the largest size the layout allows and let them do the thing they were going to do
anyway.

**What it looks like.** The face occupies the photo slot, at the same geometry a room would have
occupied. The title is the person's name. Price drops to grey meta.

[Care.com web](https://mobbin.com/screens/f5a2f425-cc06-4022-ac37-1587cb49d91f) is the cleanest case:
a six-across carousel headed "Browse background checked tutors near Menlo Park, CA", and each card is
a **portrait photograph of the person** with a heart control top-right on the face, then "Bria G."
bold, then the postcode in grey, then "From $45 / hr · 8 yrs of exp", then a green-check line "Hired
by 2 neighbors". Note the name form: first name plus last initial. Identity is partial on purpose.

[Skillshare's 1-on-1 grid](https://mobbin.com/screens/bd8cd129-36f7-4a2e-8488-0485e6e73c92) does the
same with environmental portraits rather than headshots, and prices as a **band**: "$10 - $20",
"$20 - $85", "$25 - $75", "$80 - $100". Two of the tiles in that grid are not faces at all but brand
marks ("Goodtype", a green drawing), which tells you the photo slot is polymorphic: it holds whatever
the seller's identity is.

The medical and coaching corner is the same position with different furniture.
[Zocdoc](https://mobbin.com/screens/45223838-dec4-4f39-99e9-d77f8a403c40) gives every result a
circular headshot on the left, the doctor's name as the largest text, the specialty in grey, then
rating, distance and an insurance line. [Plazo](https://mobbin.com/screens/5ab1ce07-b8cf-4a4f-9761-817a2799ec0f)
puts a live red or green availability pip **on the avatar itself**, so the face carries the
scheduling state. [Future Pro's coach grid](https://mobbin.com/screens/73eae9f9-18d3-47d6-be50-50c03c1d5142)
is nothing but large circular faces and first names.

Two variants inside this position are worth separating, because they disagree about what a face is
FOR.

- **The face as credential.** [Future Pro's coach list](https://mobbin.com/screens/58342a98-3b02-4ec7-bb54-f8a95797b2f0)
  pairs each headshot with a credential sentence: "Previously: Master Trainer at an elite coaching
  gym, completing over 15,000 in-person training sessions." No price. No rating. Prose is the proof.
  [Savee](https://mobbin.com/screens/f34fd202-5b8f-4804-89cb-edc460340685) does it by affiliation:
  "Derrick C. Lee ✓ / Creative Director · Nike Basketball".
- **The face as temperament match.** [Bloom's "Choose your guide"](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a)
  shows two large portrait cards and labels them "Shernita / Direct & Empowering" and "Mike /
  Empathetic & Caring". Not credentials, not price: how they will make you feel. For a service where
  the customer sits in a chair being talked to for an hour, this is a more honest currency than years
  of experience, and it is the only instance of it I found.

**And there is a beauty-specific counter-signal in this position that I have to report, because it
cuts against it.** [Careem's Salon&Spa staff step](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5)
asks "Which professional do you prefer?" and offers three tiles: **"Auto assign / We'll assign the
best professional"** with an icon, then "★4.8 Jennifer" with a photo, then "★5.0 Seerat". The
auto-assign tile is **leftmost and pre-selected**. A beauty product that built a person-picker chose
"I do not care who" as the default. Separately,
[Fresha's own Team tab](https://mobbin.com/screens/e88ff6f4-d9e3-437e-a531-eb1eac0f7f83) ships three
staff as **initial monograms** (A, TK, EL) with no photographs at all, and the load-bearing text is
the ROLE ("Nail Tech", "Junior lash artist", "Esthetician"), not the face. Two of the five beauty
products I could observe are telling me the face is optional and the role is not.

**What it buys.** The one input a listing cannot fake and the user genuinely wants. It also makes the
product feel like a marketplace of people rather than a directory of shops, which changes the
emotional register of the whole app.

**What it costs.** Photography you do not control and may not have. Fresha's monograms are the
evidence: if faces are the anatomy and the faces are missing, the card degrades to a coloured circle
with a letter in it, which is a worse card than a room photo. It also invites appearance-based
sorting, which in a beauty market is a real fairness and legal exposure, not a hypothetical.

**Suits.** Solo practitioners, mobile practitioners, and any market where the practitioner is the
brand.

**Harms.** Multi-chair salons with staff turnover, because the card promises a person the business
cannot guarantee will be there.

---

### Position 3: THE WORK. The card sells an outcome, and the person is a credit line.

**The belief.** You cannot evaluate a stranger, but you CAN evaluate their output. A photograph of a
finished result is a checkable claim; a photograph of a face is not. So show the result and put the
name underneath in small type.

**What it looks like.** The photo is the finished work or the act of doing it. The title is the
SERVICE. The person is the last and smallest line.

[Airtasker's Hair-and-beauty row on iOS](https://mobbin.com/screens/ae12a89f-109e-4786-894b-5cec0a8a0c80)
is the beauty instance: the photos are a made-up model and an extreme close-up of a finished
eyebrow, and the text stack is "Noelia M. ★4.6 (67)" then "Makeup artist for events" then "From
$120". [The web version](https://mobbin.com/screens/a337b9cd-7f48-4658-b41b-020c33ede9db) inverts
the emphasis further: photo of the work, then a sentence-form service title, then "From $200", then
"Anthony J. ★5.0 (583)" as the smallest line on the card.

[Behance's Hire Creatives](https://mobbin.com/screens/22cd803c-e6ba-4570-ab71-3d027c94e170) makes the
structure literal: a strip of four work thumbnails IS the card, and the person's avatar is a small
circular badge overlapping its bottom edge. [Dribbble](https://mobbin.com/screens/848d4265-d957-4bdc-b48b-6bbe6af9896b)
fuses the two currencies into one line: "$150 | 5 days".
[Redfin Premier](https://mobbin.com/screens/d977993c-03cf-4546-9d9d-bf9b84d4999d) is the most
interesting hybrid in the corpus: the card photo is a **house the agent sold**, badged "SOLD
03/13/2024" with "$3,525,000" on it, and the agent's headshot is a circular badge overlapping the
photo's corner. The price shown is the WORK's price, not the fee. Proof of work as currency.

[Airbnb's new Services product](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2) is
this position taken to its most abstract, and it is the single most relevant screen in the sweep, so
here is what is actually on it. Category tiles across the top read "Photography 16 available /
Training 5 available / Spa treatments 6 available / Chefs Coming soon / Massage Coming soon / Makeup
Coming soon / Hair Coming soon / Nails Coming soon". Then a "Spa treatments" grid where every card's
photo is a **still life of a tool or material**: a gua sha stone on cloth, a dry body brush, a candle
beside a loofah. Not a face. Not a room. And the titles are
**"Meditate with a shaman by Luh", "Holy purification tour by Made", "Transformative Healing by
Luh", "Balinese Soul Purification by Putu", "Chakra balancing and sound healing by Ayu"**. The
practitioner's first name is grammatically inside the product title. Then grey meta:
"Hydrotherapy", "From $73 / guest", "★4.93 · 1,380 reviews".
[The iOS version](https://mobbin.com/screens/49f0730c-6356-476a-b481-b679952db447) is the same, with
category tiles that are photographs of the ACT being performed: a camera in hands, hands plating
food, hands on a back.

So Airbnb, the company whose entire design language was built on selling a place, changed the subject
of the photograph the moment it started selling a service. It did not switch to faces. It switched to
the act, and it did the trust work with a first name in the title.

**What it buys.** The only currency that is actually about quality. It is also the only one that
scales emotionally: a wall of good haircuts is aspirational in a way that a wall of shopfronts is
not.

**What it costs.** Result photography, per salon, continuously. That is a content-operations
commitment, not a design decision, and it is the reason most booking products do not do this. Second
cost, and it is structural: **result photos are not comparable.** Two beautiful photographs tell you
nothing about which is cheaper, nearer or sooner, so a work-first feed is a browsing surface and
cannot also be a deciding surface.

**Suits.** Discovery and inspiration surfaces, visually differentiated work, and markets where the
customer arrives without a specific intent.

**Harms.** Any surface where the user already knows what they want and is comparing. It also harms
honesty: the photo is a best case selected by the seller, and unlike a price or a slot there is no
way to constrain it.

---

### Position 4: THE SLOT. The card sells an hour.

**The belief.** The user already decided roughly where and roughly who. What they are actually
fighting is their own calendar. The scarce good is not the service, it is 14:30 on Thursday, and
whoever surfaces that first wins the booking.

**What it looks like.** The time or date is the only saturated, filled, coloured element on the card,
and it is the actual tap target. Price is frequently absent entirely. The photo shrinks to make room.

The restaurant corner is the purest form. [Resy](https://mobbin.com/screens/e4f524c1-e8e3-4e25-bb4c-b736d43c28a1)
gives each restaurant a photo, a name, "★ 4.8 (10670) · American · $$$", a neighbourhood, and then a
row of **blue filled pills**: "1:30 PM / BAR TABLE", "1:30 PM / DINING ROOM", "1:45 PM / BAR TABLE".
The price is a band of dollar signs; the hour is the only colour.
[Tock](https://mobbin.com/screens/d3b992b9-21dd-43b1-b150-069d768a34e9) goes further and **demotes
the photo to a small thumbnail beside the name** so the card body can hold slot groups under labelled
sub-headers ("Dining Room Reservation", "Patio Reservation"). The photo is maybe a sixth of the card.
[Grab](https://mobbin.com/screens/3497c508-9ca9-40c9-9726-75911124a80f) does it with three plain
outline pills. [Best Buy](https://mobbin.com/screens/f53ad3b2-1c8c-43c9-98a0-0a5de5f35333) is the
degenerate case: the service is free, so a store card plus a grid of time pills is the entire screen.

Two apps fuse the hour with money, which is yield management surfacing as UI.
[TheFork](https://mobbin.com/screens/b448f1f5-8a43-4b81-8d00-60a95cf8c0a9) renders a row of times
each with a green "-30%" chip **underneath the individual time**, so the user reads the discount as a
property of the hour. [Zomato](https://mobbin.com/screens/9a0739cc-88a6-45a7-bbfd-019feebf3538) puts
"2 offers" in blue under every slot in a time grid.

**And two apps render a DATE rather than a time, which matters for Solen specifically.**
[Zocdoc's result rows](https://mobbin.com/screens/45223838-dec4-4f39-99e9-d77f8a403c40) end in a
**full-width yellow button reading "Next available: Mon, Jun 8"**, which is by a distance the
loudest thing on the row, with a day strip under it. And
[Square Go's search rows](https://mobbin.com/screens/fcc59b0f-0d05-4314-9779-eea0fa5de017) carry no
venue photo at all: business name, a prose list of services ("Men's haircut, Haircut, Child hc, and
Bang Trim"), then "★ 5.0 · **Wed, August 30** · 8,468 mi". A date, not a clock time. Square Go also
puts the slot **inside the primary button** on its detail screen: the button reads
["Book" with "Saturday 1:00am" as its sublabel](https://mobbin.com/screens/b302dc27-ed66-4442-a59e-1e4dc73799b1).

**What it buys.** It collapses the funnel. A card that shows an hour is a card you can commit from,
and it converts a browse surface into a booking surface without adding a screen.

**What it costs.** Three things, and they are all real. First, **space**: slots are text, and a row of
chips takes the vertical room a photo would have used. Tock's shrunken thumbnail is that trade made
visible. Second, **an honesty liability**: a slot on a browse card is a promise about live inventory,
and if it is stale the user finds out at the worst possible moment. Third, **it forecloses browsing**:
a screen that asks "which hour" has already assumed you know what you want.

**Suits.** High-frequency, low-deliberation, repeat bookings. The haircut you get every six weeks.

**Harms.** First-time and high-deliberation purchases, where the user does not yet have a
when-question, and any product without reliable real-time availability.

---

## 2. A fifth position, named because it is the foil, not because Solen can take it

**THE PRICE. The card sells a number.**

I did not put this in the four because in every instance I observed, an app makes price the largest
element only when its sellers are **substitutable**, and no local salon market is.

The evidence is unusually clean. [Preply's web results](https://mobbin.com/screens/2bc08d44-af44-4514-84e8-23a31de91eeb)
put "$18" in the right column at a size **larger than the tutor's name**, with "50-min lesson" small
and grey beneath it. The second filter in the bar is "Price per lesson $3-$25". The iOS list says
"3368 tutors" and its sort control reads **"Price: lowest first"**
([shot](https://mobbin.com/screens/648e6aa6-4b0f-4032-b34d-53bb179d19c2)). Three thousand
interchangeable sellers of a commodity hour, sorted by price by default. Price is the anchor because
it is the only axis that discriminates.

Hotels are the same logic with more pressure applied.
[Expedia](https://mobbin.com/screens/9aa106ab-3e44-43d3-b88e-8ad195f39025) stacks a green "We have 5
left at 17% off" badge, a struck-through "$2,073", then "$1,731" as the largest text on the card, then
"includes taxes & fees", then "$302 per night".
[World of Hyatt](https://mobbin.com/screens/260110c8-9645-4c08-bf51-5ac501a0ccb7) turns the price
into a **filled blue block overlapping the photo** containing "USD Avg/Night / $81 / View Rates": the
price is literally the button. [Navan](https://mobbin.com/screens/2c73fe8b-306a-408f-a218-84b364d45f63)
puts "$258 / night" in a white chip on the photo with "$785 total" beneath it.
[IHG](https://mobbin.com/screens/c94e641a-3425-4797-8369-a189a2eb23b1) uses the compound numeral,
"**327** USD / night", big number, small unit.
[Booking.com](https://mobbin.com/screens/9b1d91aa-f767-4b99-906f-71f87d18e309) adds a "Mobile-only
price" chip and a strikethrough.

**This is the position Solen must not drift into, and naming it is the useful part of the answer to
"is PBV a burden".** See section 5.

---

## 3. How the apps that DO show a price keep it from shouting

This is the operationally useful part of the lens, because Solen has no choice about presence and
total choice about volume. Eight techniques, all observed:

1. **Right-align it into a column and attach it to a named service**, so it reads as a table cell
   rather than an offer. [Fresha web](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937)
   ("Blowout / 30 mins ... from US$48"). The extreme version is
   [Shangri-La's spa](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b), which renders
   a **literal two-column table with the headers "Duration" and "Price"** and the cell "60 mins |
   SGD 175.00 / USD 130.90". A luxury spa deciding that price is data.
2. **Put it last in the row.** [Fresha's iOS service list](https://mobbin.com/screens/d656849a-d41c-4e50-89c2-99bba047459b)
   orders it name, duration range, description, and only then "from $40" in small grey.
3. **Give it peers.** [Preply's tutor detail](https://mobbin.com/screens/4a109ad7-abd0-41bf-b4fd-90ef060894e9)
   puts "$3 per lesson" in a **five-cell strip** alongside "verified", "★5 rating", "33 reviews",
   "689 lessons". [Upwork](https://mobbin.com/screens/fba8096e-be96-42fa-8212-a0b937d0f85b) does
   "★ 5.0 / $75.00/hr / 14 jobs". [Alan's confirmation screen](https://mobbin.com/screens/3d274f6c-c139-474a-95b9-731cb38afe2b)
   is the best instance: three icon rows of identical size and weight, an avatar row for "Margaux
   Degen / Psychologist", a calendar row for "Thursday 23 April 2026 / from 20:00 to 20:45", and a
   **banknote row for "€70"**. A number in a row of numbers stops being an offer and becomes a
   specification.
4. **Shrink the unit, not the number.** IHG's "**327** USD / night". AXIS_FONT.md section 7 records
   the same compound-numeral trick on Revolut's balance; that screen is from the earlier sweep, not
   this one, so I am citing their observation rather than claiming it.
5. **Demote it below the CTA.** [Alan's practitioner profile](https://mobbin.com/screens/ed903d4c-3065-4f73-a2f4-f7c6852d3736)
   puts a full-width "See availabilities" button and then, **underneath it**, small and grey: "From
   €70 per session / Free cancellation up to 48 hours in advance."
6. **Make it a band, not a point.** [Skillshare](https://mobbin.com/screens/bd8cd129-36f7-4a2e-8488-0485e6e73c92)
   "$20 - $85". [Resy](https://mobbin.com/screens/e4f524c1-e8e3-4e25-bb4c-b736d43c28a1) "$$$".
   [Wolt](https://mobbin.com/screens/694d5718-f20f-409f-8918-e50bf74d2373) "$$". A band refuses to
   imply a precision the data does not have.
7. **Prefix it.** "from", "From", "Starting at". Universal: Fresha, Square Go, Airbnb Services,
   Care.com, Airtasker, Peerspace.
8. **Give the loud treatment to something else.** This is the highest-leverage one and it is the
   least obvious. On the Fresha search card the price is not small, it is **quiet by comparison**,
   because the time chips are the only coloured elements on the card. Loudness is relative. The
   cheapest way to stop a price shouting is to hand one other element the colour.

And the inverse, for completeness: price shouts when you overlay it on the photo as a chip (Navan,
Hyatt, [Peerspace](https://mobbin.com/screens/1d5d39bc-e5df-46f2-9e9c-4d6a53455ee1)'s black
"from $150/hr" pill), when you strike through a higher number next to it (Expedia, Booking.com,
[Careem](https://mobbin.com/screens/8ba668a5-194f-4bbf-9168-b6f861f12fa9)'s "AED 109 ~~AED 180~~"),
when you set it larger than the name (Preply, Expedia), or when you colour it (Tripadvisor's red).

---

## 4. The strongest disagreement I found, and why both sides are right

### 4a. The headline case: Airbnb and Fresha sell the same treatment and agree on nothing

Same product category. Same instrument. Same week. Exact inverses.

| | [Fresha](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937) | [Airbnb Services](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2) |
|---|---|---|
| Photo subject | the salon interior | a gua sha stone, a body brush, a candle |
| Title | the business ("Bella Beauty Salon") | the service plus a first name ("Balinese Soul Purification **by Putu**") |
| Practitioner | absent from the card | inside the title, as a first name, with no face |
| Price | right-aligned per named service, "from US$48" | grey meta line, "From $73 / guest" |
| Time | blue chips, the only colour on the card | absent entirely |
| Rating | stars plus count | "★4.93 · 1,380 reviews" |

**Fresha is right for Fresha.** Its user is booking maintenance near home: the same blowout, roughly
monthly, at a place they will return to. For that user the binding constraint genuinely is the
calendar, the venue genuinely is somewhere they will sit repeatedly, and the business name is stable
in a way an individual employee is not. Putting the hour in colour and the room in the photo is a
correct reading of a recurring local purchase.

**Airbnb is right for Airbnb.** Its user is a traveller in Bali buying a thing they will do once.
There is no "my place" to return to, so a photo of a stranger's treatment room reassures nobody. The
practitioner's first name is the entire brand, and a still life of a gua sha stone sells the only
thing actually on offer, which is a sensation. Showing time chips would be absurd: the user's
question is not "which hour" but "what is this".

**Neither is a better card. They are different questions rendered accurately.** The lesson is not to
choose between them but to notice that **the currency follows the user's job, not the product
category.** Fresha proves this against itself: on its
[home feed](https://mobbin.com/screens/962315e5-a36e-4a70-ba2d-f2e1d7871be2) the same salon renders
with a category chip and **no price and no time**, and on its search page the same salon renders with
prices and time chips. One entity, two currencies, chosen by what the user is doing on that surface.
That is a documented variant of one component, which is exactly what FLOORS LAW 8 asks for, and it is
worth noting that the structural source of truth already does the thing our own law requires.

### 4b. The case that matters more for us: Care.com and Airtasker invert each other

Both are marketplaces for hiring a local human for an hour. Both show a rating and a from-price.
They put opposite things in the photo slot.

- [Care.com](https://mobbin.com/screens/f5a2f425-cc06-4022-ac37-1587cb49d91f): the photo is the
  **person's face**. Name is the title. "From $45 / hr" is grey meta.
- [Airtasker](https://mobbin.com/screens/a337b9cd-7f48-4658-b41b-020c33ede9db): the photo is the
  **work**. The service is the title. The person is the smallest line on the card.

**Care.com is right** because the risk being managed is physical and domestic. This person will be
alone in your home with your child. No photograph of a tidy playroom reduces that risk; a face,
plus "background checked" and "Hired by 2 neighbors", is the actual instrument. Price is nearly
irrelevant to that decision, which is why it is grey.

**Airtasker is right** because it is selling outcomes on interchangeable labour. Whether a stranger
mounts your TV well is fully visible in a photo of a mounted TV, and their face tells you nothing.
Making the person prominent would be worse than useless: it would invite the user to choose on a
signal that does not predict the outcome.

**A haircut is genuinely both, and this is the crux of the lens.** The face is a real risk instrument
(they will touch you, and a bad result is visible on your body for six weeks), and the work is a real
quality instrument (a photo of their fade tells you more about their fade than their face does). I
looked for an app that resolves this and did not find one. The closest is Airtasker's beauty row,
which shows the **work** in the photo and puts the **person's name first in the text**
([shot](https://mobbin.com/screens/ae12a89f-109e-4786-894b-5cec0a8a0c80): a finished eyebrow, then
"Noelia M. ★4.6 (67)", then "Makeup artist for events", then "From $120"). That is one card carrying
both instruments with the photo doing quality and the title doing trust. It is the only structure I
found that refuses the choice, and it is worth stealing on that basis alone.

---

## 5. What this implies for Solen, argued

### 5a. Ground truth first, read from the code on 2026-07-30

`app/[locale]/_components/homepage/SalonCard.tsx` renders, in order: a photo at `aspect-[5/4]`
`rounded-[22px]` with `shadow-elevation-2`; then a three-row stack at `mt-2` with a `2px` row gap.
Row 1 is `CardName` at 14px (the primitive bakes `font-medium` and `text-s-ink`) with `RatingStars`
at 13px tabular and **no review count**. Row 2 is the category label at 12px, weight 400,
`text-s-ink-2`. Row 3 is `justify-between`: the address on the left and `<PriceFrom>` on the right,
**both at 12px, both weight 400, both `text-s-ink-2`**. `nextSlotLabel` still exists in the props
interface and the comment states it was removed from the render by CARD_REDESIGN_2026-07-13 C2.

So Solen's price is already at the quietest setting the type system allows: smallest size, greyest
token, lightest weight, last row, right-aligned, sharing a line with the address. And per the props
comment, the word "from" is gated behind a named service because Art. 13 PBV requires a minimum price
to describe the concrete offer it buys.

### 5b. PBV is an advantage, and the corpus is what makes that arguable rather than consoling

The reflex is to treat a forced price as a design tax. The corpus says the opposite, in two steps.

**Step one: every serious booking product ends up showing price anyway.** Fresha is the proof, and it
is proof against the version of this claim recorded in
`_design-system/sections/home-feed/CORPUS.md`, which says "0 of the 5 appointment-booking feeds show
any price". That is true of the HOME FEED and I am not disputing it. But Fresha puts
**"from US$48" per named service on its search card on both platforms**
([web](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937),
[iOS](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)) and ships **"Maximum price"
as a first-class filter** ([shot](https://mobbin.com/screens/e52a6b79-9862-46a5-b10b-338d0d30af67)).
So the honest statement is narrower and more useful than the row currently reads: *appointment
products defer price on the browse surface and commit to it on the comparison surface.* Section 6
records the correction.

**Step two: what PBV forced us to build is the expensive part.** A per-service minimum price with the
service name attached is a data-model commitment, not a CSS one, and Fresha's search card is exactly
that commitment rendered. We were made to build it in year one. The thing we would otherwise have
shipped, an unqualified "ab CHF 45", is precisely what the SECO guidance forbids and what
`SalonCard.tsx:294-298` already refuses.

**What we give up by taking this view:** the option of a genuinely clean discovery card. Fresha's home
card is calmer than ours because it carries a category chip where ours carries a price, and calm is
not nothing. If the owner ever wants the home rails to read as pure inspiration, the price is the
element in the way, and the answer would have to be a legal one (is a rail a Preisbekanntgabe
context) rather than a taste one. I am not qualified to answer that and it is not a design call.

### 5c. The room is our weakest position and I cannot fully prove it

Solen currently takes Position 1. The photo is the largest element and its subject is the venue.

The argument against, from the corpus: a photo earns the largest slot by **discriminating**. Airbnb's
rooms discriminate enormously (a treehouse is not a loft). Restaurant interiors discriminate. My
concern is that a Basel Coiffeur interior and the Coiffeur two streets away photograph nearly
identically, in which case we have spent the biggest element on the card on something that does not
move the decision. Square Go's "Google" attribution chip is a hint that this problem is real in this
category: they are pulling venue photos from Google Places rather than commissioning them, which is
what you do when the photo is a slot to fill rather than the product.

**I cannot verify this.** It requires looking at Solen's actual seeded photo set and measuring
between-venue variance, which is a Solen-side measurement I did not run in this sweep. It is the
single strongest unverified claim in this document and it should be tested before anyone acts on it.

### 5d. The slot is the position the corpus most supports for us, and there is a live divergence to report

For a recurring local appointment, Position 4 is what the evidence favours: Fresha gives the hour the
only colour, Resy fills the slot pills, Tock shrinks the photo for them, Zocdoc makes "Next available:
Mon, Jun 8" the loudest thing on the row, and Square Go puts "Wed, August 30" in the row and the slot
inside the Book button.

**Two things must be said precisely here, and the order matters.**

First, the owner's rule of 2026-06-22 (`feedback_no_times_in_listings`) bans a clock time on a browse
card, for the right reason: *"a precise time on a browse card implies live per-salon availability the
product can't honestly promise."* It does not ban a DATE. It specifies "Heute / Morgen / TT.MM" with a
calendar icon, ink not green, on one row as **price LEFT, date RIGHT**. And the corpus independently
converges on his distinction: Zocdoc and Square Go, the two closest analogues, both render a **date**,
not a clock time. He arrived at the same answer as the market on his own. (One detail differs: he
banned weekday words, and both of them use one, "Mon, Jun 8" and "Wed, August 30".)

Second, **that rule is not what currently ships, and the reason is legitimate.** Row 3 is address
left, price right, and there is no date, because CARD_REDESIGN_2026-07-13 C2 removed the next-slot row
via an owner-approved mockup. 2026-07-13 is later than 2026-06-22, so by the precedence chain the
current card is correct and the memory file is the stale artefact. I am **not** proposing to reverse a
settled call.

What the corpus adds is only this: the slot is the currency this lens most supports for our product,
the removal was decided before this evidence existed, and the prop is still in the interface, so
re-opening it costs almost nothing. That is an owner ask with a mockup, not an edit. Naming it is the
deliverable.

### 5e. What Solen's combination actually implies

We sell an appointment at a place, staffed by people, under a law that puts a price on the card.
Reading the four positions against that:

- **We cannot be Position 5 (price).** Our sellers are not substitutable and our users are not
  price-sorting twenty interchangeable salons. Any drift toward a loud price imports Preply's model
  into a market that does not work that way.
- **We should not abandon Position 1 (room), but we should stop assuming the photo is doing work.**
  Test the discrimination before defending the size.
- **Position 2 (person) is available to us in a way it is not available to Fresha**, because Square
  Go's search rows are mostly people's names ("Guido Avallone HAIR", "Shayla Rae Hair", "Monica
  Andrea at Salon Cozzolino") and Fresha's own "Venues nearby" row includes
  [a person, Pam Zink, with her face in the photo slot](https://mobbin.com/screens/c3bc9536-c28c-4cf5-bb25-bca324c344c8)
  inside the same card component as salon interiors. In this market the solo practitioner IS a venue.
  The cost is that a person-forward card needs staff photography, and Fresha's monogram team tab shows
  what happens when it is missing.
- **Position 3 (work) is already half-built as Inspo**, which means the question is not whether to
  adopt it but whether Inspo is a separate surface or the front door. That is a product decision, not
  a card decision, and it is bet C below.
- **Position 4 (slot) is the one with the clearest corpus support and the clearest owner history.**

**The honest summary of the trade:** every position we add takes space from the others on a 390 pt
card. Fresha fits four currencies only by making the card tall and giving it a service menu, which is
a search-page card, not a rail card. We cannot have all four in a rail. Choosing is the work, and
that is what the bets are for.

---

## 6. One correction to an existing document, surfaced not overwritten

`_design-system/sections/home-feed/CORPUS.md`, the "Price on the home card" row, states:
**"0 of the 5 appointment-booking feeds show any price"**, with Fresha iOS and Fresha web cited as
no-price cases.

That is correct **for the home feed** and both cited screens do lack a price. But read as a general
claim about appointment products it is misleading, because Fresha ships a per-service from-price on
its search results card on both platforms
([web](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937),
[iOS](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)) plus a maximum-price filter.
The accurate version is: **appointment products defer price on browse and commit to it on
comparison.** The row's verdict for Solen (keep the price, do not make it loud) is unaffected and
still right. Per rule 18 this is reported here rather than silently edited into a document owned by
another sweep.

---

## 7. What I could not determine

1. **Whether a stylist's face on a card increases bookings.** Mobbin is a screenshot library, not an
   experiment log. I observed layouts and inferred beliefs. Every "belief" in section 1 is my
   reconstruction from what an app made largest, not a statement any of these companies made.
2. **Whether Careem's auto-assign default is a considered belief or an operational convenience.**
   Careem is a ride-hailing company doing at-home beauty, and auto-assign may exist because dispatch
   is easier than choice, not because they think users do not care who. I cannot read intent off a
   screenshot and I have leaned on this screen fairly heavily.
3. **Whether Solen's venue photos discriminate between venues.** Section 5c. Needs a look at the real
   seeded photo set.
4. **Anything about Booksy, Treatwell, StyleSeat, Vagaro, Squire or Mindbody.** Searched by name
   again on 2026-07-30, still absent from Mobbin. Any future claim about them needs `reference-lock`
   with a live capture.
5. **Absolute type sizes anywhere in the corpus.** Mobbin's captures are downscaled. Every size claim
   here is relative.
6. **Whether Airbnb's Services cards perform.** Half the categories on that screen read "Coming
   soon", so I am looking at a product mid-launch, and its choices may be provisional rather than
   validated.
7. **Motion, entirely.** No transitions, no press states, no gesture.
8. **Whether a beauty product anywhere leads with result photography.** I searched for it directly and
   the results were creative-portfolio apps (VSCO, Behance, Savee,
   [Pinterest](https://mobbin.com/screens/c8a4ff88-2af4-45d4-8799-f043f608aaca)), not beauty booking.
   The nearest beauty instance is Airtasker's row. So bet C below rests on a structural analogy, not
   on a beauty precedent, and that weakens it honestly.

---

## 8. Design bets this lens makes available

A bet is a one-sentence claim about what the home screen is FOR that a whole screen could be built
around. All three are traceable to screens I looked at in this sweep.

### Bet A: "THE NEXT FREE DAY"

**The claim.** The home screen exists to turn "I need a haircut this week" into a held appointment, so
the loudest element on every card is the soonest bookable **date**, and the card is a commit target
rather than a read target.

**What it sacrifices.** Photographic area, because a date row takes vertical space a photo would use
(Tock shrinks its photo to a thumbnail to buy exactly this). Browsing pleasure, because a screen that
asks "when" has assumed you know "what". And it takes on an honesty liability that the owner already
identified in 2026-06-22: a date on a browse card is a promise about live inventory.

**Evidence.** [Zocdoc's "Next available: Mon, Jun 8"](https://mobbin.com/screens/45223838-dec4-4f39-99e9-d77f8a403c40)
as a full-width yellow button, the loudest element on the row ·
[Square Go's "★ 5.0 · Wed, August 30 · 8,468 mi"](https://mobbin.com/screens/fcc59b0f-0d05-4314-9779-eea0fa5de017)
row with no venue photo at all · [Square Go's Book button with "Saturday 1:00am" as its sublabel](https://mobbin.com/screens/b302dc27-ed66-4442-a59e-1e4dc73799b1)
· [Fresha web](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937) and
[Fresha iOS](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285) giving time chips the
only colour on the card · [Resy's filled blue slot pills](https://mobbin.com/screens/e4f524c1-e8e3-4e25-bb4c-b736d43c28a1)
· [Tock demoting the photo to make room for slot groups](https://mobbin.com/screens/d3b992b9-21dd-43b1-b150-069d768a34e9).

**Status note.** This is the bet with existing owner history on both sides: specified 2026-06-22,
removed 2026-07-13. It needs an owner ask, not a build.

### Bet B: "THE PERSON, NOT THE PREMISES"

**The claim.** The home screen surfaces practitioners rather than venues: the photo slot holds the
stylist, the title is their name, and the salon becomes the qualifier after it.

**What it sacrifices.** It fights a venue-shaped data model and a venue-shaped supply pitch. It needs
per-staff photography we may not have, and the failure mode is visible in the corpus. It also
collides head-on with the only two beauty data points I have on staff choice: Careem makes
auto-assign the pre-selected default, and Fresha's team tab ships monograms instead of faces. And in a
beauty market, a face-forward grid invites appearance-based selection, which is a fairness exposure
and not merely a taste question.

**Evidence.** [Square Go's PDP title is literally "Monica Andrea at Salon Cozzolino"](https://mobbin.com/screens/e1e68966-8785-4703-9d99-958da86de00f),
the person's name first and the salon as a prepositional phrase ·
[Fresha's own "Venues nearby" row carries "Pam Zink", a person, with her face in the photo slot beside salon interiors](https://mobbin.com/screens/c3bc9536-c28c-4cf5-bb25-bca324c344c8)
· [Airbnb Services titles every listing "<service> by <first name>"](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2)
· [Care.com puts the face in the photo slot at full card geometry](https://mobbin.com/screens/f5a2f425-cc06-4022-ac37-1587cb49d91f)
· [Skillshare does the same and accepts a brand mark where there is no face](https://mobbin.com/screens/bd8cd129-36f7-4a2e-8488-0485e6e73c92)
· [Bloom labels its practitioners by temperament, "Direct & Empowering" / "Empathetic & Caring"](https://mobbin.com/screens/f7e8ee82-734b-4bcc-93ab-f9ab193a2d6a)
· counter-evidence, stated in the bet: [Careem's auto-assign default](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5)
and [Fresha's monogram team](https://mobbin.com/screens/e88ff6f4-d9e3-437e-a531-eb1eac0f7f83).

### Bet C: "THE RESULT IS THE LISTING"

**The claim.** The home screen leads with photographs of finished work, and the salon is the credit
line under the image rather than the subject of it.

**What it sacrifices.** It is a content-operations commitment before it is a design one: real result
photography, per salon, continuously, or it degrades instantly. It makes cards **non-comparable**,
because two beautiful photos cannot tell you which is nearer, cheaper or sooner, so this bet turns
the home screen into a browsing surface and forces the deciding job onto search. And the photo is a
seller-selected best case with no way to constrain it, unlike a price or a slot.

**Evidence.** [Airtasker's beauty row: the photo is a finished eyebrow and a made-up face, the person's name leads the text, the service follows, the price is last](https://mobbin.com/screens/ae12a89f-109e-4786-894b-5cec0a8a0c80)
· [Airtasker web puts the work in the photo and the person on the smallest line](https://mobbin.com/screens/a337b9cd-7f48-4658-b41b-020c33ede9db)
· [Behance makes a strip of four work thumbnails the card and the avatar a badge on it](https://mobbin.com/screens/22cd803c-e6ba-4570-ab71-3d027c94e170)
· [Redfin makes the photo a house the agent sold, with the sale price on it](https://mobbin.com/screens/d977993c-03cf-4546-9d9d-bf9b84d4999d)
· [Airbnb Services photographs the tool and the act, never the venue](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2)
· [Dribbble fuses price and turnaround into "$150 | 5 days"](https://mobbin.com/screens/848d4265-d957-4bdc-b48b-6bbe6af9896b).

**Honesty caveat, repeated from section 7 item 8:** I found no beauty-booking product that actually
does this. The bet rests on a structural analogy across four adjacent markets, and it is the weakest
evidenced of the three. It also maps onto Solen's existing Inspo surface, so the real question it
raises is whether Inspo is a tab or the front door.

---

## 9. Provenance

Twelve `mcp__mobbin__search_screens` calls on 2026-07-30, nine on the `ios` corpus and three on
`web`: stylist profile cards with per-service price; Care.com-style caregiver rows; restaurant
reservation rows with slot buttons; Fresha salon search results (web); barbershop staff pickers;
fitness class schedules with instructor; spa treatment menus with duration and price; tutor
marketplace grids (web); hotel results with prominent nightly price; Booksy-named beauty home feeds;
hair and makeup portfolio galleries; beauty and wellness booking websites (web). Every
`mobbin.com/screens/...` link above was returned by one of those searches and its image was examined
before being described.

Solen-side claims were read from disk on 2026-07-30:
`app/[locale]/_components/homepage/SalonCard.tsx` (props block and full render), plus
`grep` for PBV and Art. 13 across `app/`, `components/`, `lib/`, `_rules/` and `_design-system/`, plus
`npm run exists price`, plus `_design-system/REMOVED.md` and the
`feedback_no_times_in_listings` memory file. **No claim about Solen in this document is from memory.**

Prior in-repo research read in full before writing and deferred to rather than restated:
`_design-system/sections/home-feed/CORPUS.md` (frequency and verdicts for the home screen; corrected
in section 6), `_design-system/sections/search-results/CORPUS.md` and
`_design-system/sections/salon-detail/CORPUS.md` (both already cover the from-price prefix pattern and
the PBV total-price floor), `_design-system/research/AXIS_GRID.md` (geometry, measured with PIL) and
`_design-system/research/AXIS_FONT.md` (type, and its section 4 finding that only
price-comparison products set the price heavier than the name, which this lens independently
reproduces and explains).

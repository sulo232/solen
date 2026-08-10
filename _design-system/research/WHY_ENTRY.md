<!-- exists-check: `npm run exists "search entry"` returns 0 matches. `npm run exists "search bar"`
     returns 14: the two components (`app/[locale]/_components/homepage/SearchBar.tsx`,
     `components-legacy/discovery/SearchBar.tsx`), nine dev-page inline sections, and TWO GRAVEYARD
     hits that bind this document and are honoured in section 5: (a) the inspo search focused-state
     (focus ring + back/cancel arrow), removed 2026-06-23, so nothing here proposes a focus ring or
     a back button on a search input; (b) ink/black as a selected state, removed 2026-06-29, naming
     `SearchBar.tsx:695` as an offender. Three further graveyard entries constrain section 5 and are
     named there: the homepage hero image (owner's THIRD rejection 2026-07-25), the full-bleed
     direction (denied 2026-07-16), and the search-morph scroll-expand on the Location and Date
     steps (removed 2026-06-30, which LOCKS the accordion order to Suche > Standort > Datum).
     Sibling convention: research/AXIS_GRID.md, research/AXIS_FONT.md, sections/home-feed/CORPUS.md.
     This file does NOT restate CORPUS.md. CORPUS.md counted how many home feeds carry a top-zone
     search control (29 of 34). This file asks the question that count cannot answer: what each
     shape of control BELIEVES, what it costs, and which product it harms. Zero frequencies are
     reproduced from it. -->

# WHY: ENTRY

**The question this lens answers:** when a person arrives at the home screen, does the product ask
them to state what they want, or show them what there is, and what does each choice believe about
who just arrived?

Date: 2026-07-30
Instrument: Mobbin MCP, 12 distinct searches (10 `search_screens`, 2 `search_flows`; 9 iOS, 3 web).
Every screen linked below was returned by one of those searches and its image was examined before
being described. Four captures were downloaded and pixel-measured; those numbers are marked
`measured`.

---

## 0. Sample, stated before any claim

**Roughly 119 captures were returned and looked at, with at least 6 exact repeats across searches,
so about 113 distinct images.** Of those, the ones that are actually an ENTRY surface (a home
screen's first viewport, or the state a search control opens into) come from **24 apps**:

- **iOS home screens (19):** Airbnb, Fresha, Zocdoc, Square Go, Uber Eats, Bolt, Mindvalley,
  Afterpay, Matter, Amazon Shopping, HYPE, Vestiaire Collective, The Infatuation, NYTimes,
  Paramount+, Netflix, Atoms, Headway, Meituan Takeaway.
- **Web home screens (5):** Airbnb, Fresha, DoorDash, Airtasker, Hers.
- **Search-expanded states (5 apps):** Airbnb iOS accordion, Zocdoc iOS stepped wizard, Square Go
  iOS two-field sheet, Fresha web field dropdown, Fresha iOS search tab.
- **Recent-search screens (12 apps):** Google, Shop, Apple Books, Best Buy, Brave, Vestiaire,
  Equinox+, Coupang, Grab, Taco Bell, Tabby, eBay. Mostly commerce and browsers, which is itself a
  finding (section 2, position 2).

**Three honesty notes.**

1. **The booking-app sample is five, not a category.** Fresha, Square Go, Zocdoc, Bolt and Airtasker
   are the only appointment- or job-booking products whose entry screen I could read here. Booksy,
   Treatwell, StyleSeat, Vagaro and Mindbody remain absent from Mobbin's corpus (established in
   `sections/home-feed/CORPUS.md`, re-confirmed by the fact that not one of my 12 searches surfaced
   them). Any claim about their entry needs a live capture, not this file.
2. **I deliberately did not count.** The previous pass produced "29 of 34 put search in the top
   zone", which is true and useless: it lets Netflix and Fresha cast equal votes on a question
   neither is answering the same way. Where a number appears below it BOUNDS a claim ("only one app
   here does X"), it never carries one.
3. **Four heights are measured, the rest is read off the image.** Mobbin serves iOS captures at 299
   px for a ~390 pt device, so scale is 1.304 pt per px and +/- 1 px is +/- 1.3 pt (method
   established in `research/AXIS_GRID.md` section 0). I round to the nearest pt and never claim a
   1 pt distinction.

---

## 1. The four positions, and what each one believes

The axis is not really "search versus browse". It is **how much of the query the screen forces you
to declare before it will show you anything**, and **who pays for that**. Four positions sit on it.

---

### Position 1: The segmented bar. "Your query is a tuple, and we would rather you complete it than retract it."

**The belief.** A booking query is not one string, it is several fields at once, and a result set
built from a partial query is a promise the product will have to break. So the entry control names
every dimension up front, and each field is a bounded picker rather than a free-text box, which
makes the query **valid by construction**: there is no typo that returns zero.

**Who holds it.**

- [Airbnb web, empty](https://mobbin.com/screens/a92f14ea-1a94-4a63-99f3-8b5fbd42d106): Where /
  Check in / Check out / Who, hairline dividers, one round magnifier button.
- [Airbnb web, filled](https://mobbin.com/screens/3a53c974-f926-4279-8696-191d8a753cf9): and this
  is the detail worth stealing. Once dates exist, the two date segments **collapse into one**
  reading "When: Weekend in June", the guest segment grows a clear-`x`, and the round icon button
  grows into a labelled "Search" pill. **The bar's arity is a function of its state, not a fixed
  layout.**
- [Airbnb Experiences web](https://mobbin.com/screens/2e5807cb-f0a8-473e-9922-1e662f86a891): three
  segments, Where / Date / Who. An experience happens on a day; a stay spans a range. **The number
  of fields is dictated by the product's time shape, not by a house style.** This is the single most
  transferable observation in the lens for Solen, and section 5 spends it.
- [Fresha web](https://mobbin.com/screens/7832695b-2761-4f79-aa14-5cefe5a5e7ff): treatment /
  location / date / **time-of-day**, plus a black Search pill. Fresha's fourth field is not an end
  date, it is "Any time", because an appointment is a point with a preferred window.
- [Fresha web, treatment field open](https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7):
  the field's dropdown is the category list (Hair & styling, Nails, Eyebrows & eyelashes, Massage,
  Barbering, Hair removal).
- [Fresha results, same bar shrunk into the header](https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8):
  "Hair & styling | Menlo Park, CA, USA | Tomorrow | Morning". The entry control becomes the **state
  display** for the rest of the session.

**What it buys.** Four things, and they are not the same thing.

1. **It teaches the query language.** Before you type a character, you have learned that this
   product indexes by treatment, place, date and time of day. A single field teaches you nothing
   and lets you type something it cannot answer.
2. **It front-loads the constraints that actually decide availability.** For a salon, date and time
   are not filters applied to a result set, they are what makes a result exist. Asking last means
   showing a list you then have to shrink.
3. **It becomes a receipt.** Fresha carries the filled bar into the results header, so the user can
   read and edit their own state without a mental model of "which filter did I set". A collapsed
   pill cannot do that without becoming position 2b.
4. **Every field is a picker, so the query cannot be malformed.**

**What it costs.**

1. **The entire top zone, and on Fresha web the entire first viewport.** Fresha's hero is a
   full-height gradient with a serif headline, the bar, a counter and a "Get the app" button, and
   the first salon photograph is **below the fold** in every capture
   ([one](https://mobbin.com/screens/498008f7-fde7-4581-b70c-c8b5ab1d6904),
   [two](https://mobbin.com/screens/74253218-0063-4799-afef-c0410b371804),
   [three](https://mobbin.com/screens/1be28b10-3d36-4b55-b612-70150c8258a0)) with only the crown of
   the next section's heading peeking ("Recently viewed", "Favourites", "Upcoming appointments",
   "Recommended", each a different capture).
2. **Perceived effort.** Four empty fields read as four decisions. For a returning customer, three
   of those answers have not changed since last time, so the bar re-asks questions it could have
   answered itself.
3. **It cannot survive onto a phone unchanged.** Four fields side by side need horizontal room that
   does not exist at 390 pt. Airbnb ships position 2 on iOS for exactly this reason, and that is not
   a compromise, it is the same concept re-geometried.
4. **It hides the taxonomy.** Fresha's categories live inside the treatment dropdown, so a browser
   who does not know the word "Barbering" has to open a field to discover that barbering exists.
   Position 3 exists to fix precisely this.

**Suits:** a product where the query has irreducible dimensions, where a wrong tuple wastes a real
search, and where the visitor may be new enough to need the vocabulary taught.

**Harms:** a short-catalog, high-repeat product. If the same tuple is submitted every six weeks, the
bar is a form the user fills out to tell the product something it already knows.

---

### Position 2: The collapsed pill. "One question at a time, because the phone only has room for one."

Two sub-species, and the difference between them matters more than the shape they share.

**2a. The PROMPT pill. Placeholder text, no state.**
[Airbnb iOS](https://mobbin.com/screens/2df6111d-0888-47ab-8d35-6a2f20d66eb2): a white pill reading
"Start your search", **measured 55 pt tall**, sitting above the Homes / Experiences / Services tab
row, with two full cards plus a cropped third already in the first viewport. Same pill on the
[Experiences](https://mobbin.com/screens/49f0730c-6356-476a-b481-b679952db447) and
[Services](https://mobbin.com/screens/b65a08a7-ad43-46ff-af89-3659df3eaecc) tabs, and
[scrolled](https://mobbin.com/screens/179b0617-5e5e-479b-9cff-de092b6f804b).

**2b. The SUMMARY pill. The current tuple, dot-separated.**
[Fresha iOS search tab](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a): "Hair &
styling · Tomorrow · Current l..." in one pill over a map, with a map-toggle button on the right.
[Airbnb iOS results](https://mobbin.com/screens/1f92134a-2b99-4027-ab7f-8f6ff087bdc6): a two-line
pill, "Homes in New York City / Weekend in Sep · 1 guest", back arrow left, filter icon right. Same
on [Experiences results](https://mobbin.com/screens/2ff08d77-1ce0-4933-b12d-62985172d1a7).

**What is behind the door.** The [Airbnb iOS search
flow](https://mobbin.com/flows/0fb29365-f327-46b6-9a6d-2dfbb5589716) shows the pill expanding into a
**stacked accordion**: the answered step collapses to a one-line row with its value right-aligned
("Where: New York City, NY"), the active step is an expanded white card, and the unanswered steps
wait below. "When?" carries three sub-modes (Dates / Months / Flexible, the Months mode being a
physical dial), plus Exact dates / +-1 day / +-2 days chips. "Who?" is a stepper block. Reset sits
bottom-left, Next or Search bottom-right. **The segmented bar and the accordion are the same four
fields under different space budgets: side by side where width is free, stacked where it is not.**

**What it buys.** One row instead of a hero, so real content is in the first viewport. And genuine
progressive disclosure: one question on screen at a time means each question gets room for a real
picker (a dial, a calendar with flexibility chips) instead of a cramped dropdown.

**What it costs.** A tap before you learn the query language, since "Start your search" says nothing
about what is indexed. And, in the 2a form, it tells a returning user nothing about their own state.

**The rule both apps actually follow, and it is the useful finding here:** the entry control shows
**the query when a query exists, and an invitation when it does not**. Airbnb is 2a on home and 2b
on results. Fresha iOS is 2b from the first tap because it enters via a map that already has a
default query. Neither ever shows an invitation over live state, and neither shows state that is
empty.

**Suits:** mobile, and any query with more than two dimensions.
**Harms:** a one-dimensional query. A pill concealing a single text field charges a tap for nothing.

---

### Position 3: The intent grid. "There is no query. There is a menu."

**The belief.** The catalog is bounded and nameable, so a text field is the wrong instrument: it asks
the user to guess vocabulary the product already owns. Show the vocabulary instead.

**Who holds it.**

- [Square Go iOS](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21). Look at the
  order: a **wordless** grey search field first (a magnifier glyph, no placeholder text at all,
  **measured 51 pt**), then the display headline "Schedule your next appointment", then a grid of
  category tiles with 3D icons (Haircut, Hairstyle / Eyes, Nails, Hair removal / Facial, Massage,
  Tattoo, and more cropped below). The field is present, small, and says nothing. The grid is the
  entry.
- [Square Go, scrolled](https://mobbin.com/screens/95fc024c-6fbe-4f4c-a28c-13ae851053b3) and
  [again](https://mobbin.com/screens/59f76480-9080-48c2-8f00-8942909a0dfa): the field goes sticky,
  the grid becomes a circular-icon strip, and the feed heading reads **"Recommended in 94025"**.
  Location was never asked for. It was resolved silently and then **proven in the section title**.
  That is a real technique: instead of a location field, a location claim the user can check.
- [Square Go expanded](https://mobbin.com/screens/ecce6d28-2b91-4378-aa15-75bb923e4e6f): tapping the
  wordless field reveals "Service or place" plus a separate "Nearby" dropdown plus the categories as
  text pills. So the two fields do exist, disclosed only on demand.
- [Hers web](https://mobbin.com/screens/e788da3e-eebd-4810-baa5-72d2705f43b7): **no search field in
  the first viewport at all.** Eight goal tiles ("Lose weight", "Grow fuller hair", "Ease
  perimenopause", "Relieve menopause", "Reduce anxiety", "Get glowing skin", "Control your cycle"),
  and the eighth is "Browse all treatments" carrying the magnifier. Search is demoted to a member of
  the grid it replaced.
- [Fresha iOS](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489): a two-column
  photo-tile Categories block, and the [full grid](https://mobbin.com/screens/c3fbecd3-61f9-4a93-bab4-fae45b8998a8)
  runs fourteen tiles (Hair & styling, Nails, Eyebrows & eyelashes, Massage, Barbering, Hair removal,
  Facials & skincare, Injectables & fillers, Body, Tattoo & piercing, Makeup, Medical & dental,
  Counselling & holistic, Fitness). **No search control on the home screen.**

**What it buys.** Zero typing and zero vocabulary risk. It doubles as merchandising, because a tile
with a photograph of nails sells the category while it navigates. And it answers the first-timer's
actual first question, which is not "where is the search box" but "what can I even book here".

**What it costs.** Vertical space, and a lot of it: fourteen photo tiles is most of a viewport. A
hard ceiling on expressiveness, since nothing in a grid can say "Tuesday evening near the station".
And it silently declares a taxonomy: whatever is not a tile does not exist for a browsing user, so
the grid becomes a political document about which categories matter.

**Suits:** a bounded, visual, nameable catalog with a repeat audience. Beauty is precisely that
shape, which is why the two purest examples in the sample (Square Go, Hers) are both in it.

**Harms:** a long-tail catalog, and any query whose binding constraint is time. A grid cannot
express "now", which is why Square Go still keeps the field, wordless, above the grid.

---

### Position 4: Search demoted to a utility. "A returning user does not type."

**The belief.** The query is picked, not written. Typing is the fallback, and fallbacks belong where
the thumb rests, not where the eye lands first.

**Who holds it.**

- [Uber Eats iOS](https://mobbin.com/screens/520ada74-77d2-45ce-b42a-cbfaf4566bd9). The whole top
  zone goes to things that CHANGE: a location/mode dropdown ("Home", or
  [the literal address](https://mobbin.com/screens/214e62d3-c6fe-48ce-864c-c21b7af7f2b6)), a
  vertical-switch chip row (All / Rides / Grocery / Convenience / Alcohol), an emoji category strip
  (Dine Out / Explore / Pizza / Sushi / Chinese), and a filter chip row (Uber One / Pickup / Offers /
  Under 30). Free-text search is a pill **inside the bottom tab bar**, labelled only "Search",
  **measured 41 pt**, flanked by home, map, cart and account. It stays there on
  [filtered](https://mobbin.com/screens/183b7c12-0a18-47b3-b61c-045bbefe0cfd),
  [favourites](https://mobbin.com/screens/21ca4978-fb16-48fb-8549-441a7a83eb78) and
  [explore](https://mobbin.com/screens/7919f301-58d7-4c01-ae70-4be567769b50) screens, so it is
  chrome, not content.
- [The Infatuation iOS](https://mobbin.com/screens/14d3a696-6be0-4419-a510-bed6b852baa5): a floating
  "What are you looking for?" pill at the bottom over an editorial feed. Same idea, different
  product.
- [Airtasker web](https://mobbin.com/screens/756a4205-72b6-4e12-ac24-c7f31f921cfe): the display
  headline "Book a Tasker directly" and a location dropdown are the left-hand anchor; the search
  field is pushed to the right, grey and visually secondary ("Search 20,000+ services"). Search
  present, deliberately quiet.
- [DoorDash web](https://mobbin.com/screens/aa990a6c-2036-42ac-84e5-3bf5ca3c6030): a small "Search
  DoorDash" field in the top chrome, with the actual navigation carried by a left rail of
  categories (Grocery, Retail, Convenience, Alcohol, Catering, Beauty, Pets, Health, Browse All).

**What it buys.** The whole top zone for content and for the two variables that genuinely move
(where you are, which vertical you are in). Plus reachability: search is one thumb-flick away
permanently, instead of a scroll-to-top.

**What it costs.** Discoverability for the minority who arrived with a name in their head, and a
break with the platform convention that search lives at the top. Most of all it **removes the exit**,
which means the first viewport now has to be good enough to browse. This position is only honest if
the feed is genuinely worth reading.

**Suits:** high-frequency, location-bound, decide-by-picture products.
**Harms:** low-frequency products where every visit is a fresh specific need, and any product whose
value proposition IS a large searchable index.

---

### The measured spine of positions 1 to 4

Four control heights, all from downloaded captures at 299 px render, converted at 1.304 pt/px.
`measured`.

| Control | App | Height | Rows |
|---|---|---|---|
| Prompt pill | [Airbnb iOS](https://mobbin.com/screens/2df6111d-0888-47ab-8d35-6a2f20d66eb2) | **55 pt** | 1 |
| Wordless field | [Square Go iOS](https://mobbin.com/screens/89ee891e-17ea-4c5a-b173-eccd95149a21) | **51 pt** | 1 |
| Bottom-bar pill | [Uber Eats iOS](https://mobbin.com/screens/520ada74-77d2-45ce-b42a-cbfaf4566bd9) | **41 pt** | 1 (in the bottom chrome) |
| No control | [Fresha iOS](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489) | **0 pt** | 0 |

**Every mobile entry control in this sample is one row or absent.** Not one phone home screen in the
24 shows more than a single row of search chrome. That number is load-bearing in section 5.

---

## 2. Two secondary findings the four positions do not cover

**The state slot beneath the field.** Zocdoc holds the field constant and changes what sits under it,
across three captures of the same screen: logged out is ["Welcome" plus a green "Log in for the best
experience" card](https://mobbin.com/screens/645fe90a-411f-4c7a-90bc-aef8e94ac0a0); logged in with
nothing booked is ["Hi Alex" plus a blue "Search with your
insurance"](https://mobbin.com/screens/e1966110-421c-4c5e-8890-e659c128635e); logged in with an
appointment is ["Hi Alex" plus "Up next", with the date and time bold, the doctor's face as the map
pin, and a three-icon action row](https://mobbin.com/screens/20a3461b-b970-489a-a6fe-09109272e261).
**The entry control did not change for the returning user. The slot under it did.** That is a
cheaper answer to "returning versus first-timer" than redesigning the search.

**Airbnb makes the same move without touching the bar.** [Continue searching for experiences in
Miami, May 30 to Jun 1, 1 guest](https://mobbin.com/screens/4f347fd4-5793-41df-a0d9-b29fe02131cc) is
a dismissible card with a thumbnail, sitting under a pill that still reads "Start your search". The
abandoned query is preserved **as content**, not as pre-filled fields. That serves both audiences on
one screen: the first-timer sees a clean invitation, the returner sees their own thread picked back
up, and neither is confused by the other's affordance.

**Recent searches are a commerce pattern that booking has barely adopted.** Twelve apps returned a
recent-search screen and they are overwhelmingly retail and browsers (Google, eBay, Best Buy,
Coupang, Apple Books, Taco Bell, Brave, Shop, Tabby). The two closest to booking are the
instructive ones. [Equinox+](https://mobbin.com/screens/bb8adccd-75a8-4918-bd02-88afe5e38098) stores
bare terms ("Cycling", "Yoga"). [Vestiaire
Collective](https://mobbin.com/screens/a77480d1-b9f1-48ca-a29b-e6c6e4818e65) stores the query **with
its filter context attached** ("Earrings / My sizes", "Gucci / My sizes") and puts a bookmark icon
on each so a recent can be promoted to a standing search. [Grab](https://mobbin.com/screens/50643920-24fc-47b9-afce-d16be4a15e56)
stores places with distances and tags one "Recommended". Solen has a live opinion on this that cuts
against Vestiaire, and section 5 puts both sides up.

**The rebook affordance is a row action, not a home slot, everywhere except Fresha.**
[Bolt](https://mobbin.com/screens/4a0763f3-3832-4adf-9afd-8482c6685025) puts a circular-arrow
"Rebook" button on every row of ride history. [Airtasker](https://mobbin.com/screens/f7532d7c-d1f0-4896-a304-1286e99078a4)
puts "Rebook this Tasker" at the top of the past task, then offers ["Use details from last task with
Usama"](https://mobbin.com/screens/fbacec45-d7fc-450f-b701-8d12e85fe000) as a one-tap prefill, which
is the most complete returning-user affordance in the whole sweep: it copies the previous request
into the new one rather than making you retype it. Meituan puts "order again" on the past order
card. **Fresha is the only one that promotes it to the home screen**, as the block immediately under
the greeting ([Book again](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691)), and it
also keeps it as a row action in the [Appointments
tab](https://mobbin.com/screens/419c463d-1dd9-48d5-bef0-9805363d2b56) whose [empty
state](https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3) routes to "Search salons".
So Fresha ships both placements, and the home one is a bet on frequency.

---

## 3. The strongest disagreement I found, with no winner picked

**It is inside one company, which is why it is the strongest.** A cross-brand disagreement leaves
product as a confound. This one holds the product, the catalog and the week constant and isolates
platform.

**Side A. [Fresha web](https://mobbin.com/screens/7832695b-2761-4f79-aa14-5cefe5a5e7ff) is as
search-first as a page can be.** Full-viewport gradient, a serif display headline ("Book local
beauty and wellness services"), the four-segment bar, a live counter, a "Get the app" button, and
zero salon photography above the fold.

**Side B. [Fresha iOS](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691) has no
search control on its home screen at all.** "Hey, John" in a serif, then **Book again**, then
**Favourites**, then [Trending, then a fourteen-tile Categories
grid](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489), then
[Recommended, then New to Fresha](https://mobbin.com/screens/4c936571-dda9-484c-8b58-07df650f3a73).
Search is a magnifier in the tab bar, and tapping it opens
[a map](https://mobbin.com/screens/efc00125-5818-48ae-905d-e64dbe66177a).

**Why both are right, and the reasoning is about POPULATION, not platform.** The two surfaces meet
different people. A beauty marketplace's web traffic arrives substantially through search engines
and salon-shared links, from someone who may never have heard of the brand; that visitor has to be
told what the product is and what it indexes, and a search bar says both in one object. The app is
on the phone of someone who already installed it, and whose next action is overwhelmingly "the same
place again" or "somewhere I already saved", which is exactly what the first two blocks after the
greeting are. **Search-first answers "who are you and what do you do". Browse-first answers "welcome
back".** They are not competing designs; they are answers to different questions, and Fresha ships
both because it receives both questions on different doors.

**The honest limit on that reading.** The population difference is **inferred**. I did not observe
traffic sources and Mobbin cannot show them. If Fresha's web traffic is mostly returning users, my
explanation is wrong and the web hero is simply a legacy landing page. I could not discriminate
between those from screenshots.

**A second disagreement, same axis, different variable: how much to reveal.**

[Zocdoc](https://mobbin.com/screens/3b03d53a-6614-4054-a34a-0d8ba4213c8e) shows **one** field,
"Search specialty", then walks you through three separate full screens: [a specialty
list](https://mobbin.com/screens/a4d9b344-0d26-491e-adb5-e83e786f00b0), [a visit-reason
list](https://mobbin.com/screens/0715945a-097e-43ff-aba0-c3e9a4d22309), [a location
picker](https://mobbin.com/screens/291b99bf-1684-40cd-8b70-5ccbce350613), plus [a typeahead that
highlights the matched substring](https://mobbin.com/screens/10112415-e574-4197-9581-400aebeb105c)
and [an intent question with five plain-language options](https://mobbin.com/screens/6afaaadf-e229-4e9e-aeac-23b8833d38a6).
Airbnb shows **four** fields and one accordion. **The total number of decisions is roughly the
same. Zocdoc distributes it across screens and Airbnb concentrates it into one object.** Zocdoc's
version has lower perceived effort and hidden depth. Airbnb's has higher perceived effort and a
visible end.

Which is right depends on one thing: **can your user abandon?** Someone looking for a dermatologist
will finish a three-screen wizard because the need is not optional. Someone comparing salons on a
Tuesday evening will not, and for them a visible end matters more than a gentle start. Neither app
is wrong. Both are matched to their own abandonment risk, and I am not going to collapse that into a
recommendation because the two products genuinely differ.

**A third, smaller one, worth naming so nobody "fixes" it later.** Airbnb puts the pill **above**
the vertical tabs on [iOS](https://mobbin.com/screens/2df6111d-0888-47ab-8d35-6a2f20d66eb2) and the
tabs **above** the bar on [web](https://mobbin.com/screens/a92f14ea-1a94-4a63-99f3-8b5fbd42d106).
Same company, same week, inverted order. Neither is a mistake: on web the header is fixed global
chrome that must hold the wordmark and the account, so the tabs live in it and the bar hangs
beneath; on iOS the pill is simply the first thing the thumb reaches.

---

## 4. What this implies for Solen, argued

Everything about Solen below was read on disk on 2026-07-30. No claim here is from memory.

### 4a. Where Solen actually sits today

- **`app/[locale]/_components/homepage/SearchBar.tsx` is position 1 with a desktop geometry and a
  mobile geometry that has no counterpart in this corpus.** It ships **three** collapsed segments,
  `Service` / `Stadt` / `Zeit` (lines 311 to 333), plus an ink commit button. On desktop it becomes a
  60 px horizontal pill capped at 820 px and centred (`md:max-w-[820px] md:mx-auto md:!h-[60px]
  md:!rounded-full`, line 285), which is exactly the Airbnb-and-Fresha web geometry. On mobile the
  same segments stack vertically (`flex flex-col p-4 gap-[10px]`, line 305) and `HEIGHT.mobile` is
  **280** (line 99, with the whole tuning history in the comments from 246 to 320 to 264 to 280).
- **Tapping any segment opens `SearchOverlay` (line 30) with segment TABS**, which is structurally
  Airbnb's iOS accordion. Solen already has both halves of position 2's mechanism.
- **`Hero.tsx` is h1 plus SearchBar, nothing else.** No `Image`, no `src`. Mobile `min-h` was removed
  (V3-D127); desktop keeps `md:min-h-[92dvh]`.
- **`page.tsx` renders** Hero, then `MobileCategoriesRow`, `SalonOfMonth`, `ForYouSalonRows`,
  `RecentlyViewed`, `Nearby`, `WalkInBand`, `Entdecken`, `Reviews`, `BusinessTeaser`.
- **`MobileCategoriesRow.tsx` is `md:hidden`** (line 76), a 3x2 grid of six tiles, and it is already
  **pick-ordered** by customer prefs (lines 62 to 68): chosen categories lead. So Solen owns a
  personalised position-3 grid on mobile and shows nothing equivalent on desktop.
- **Recent searches already ship**, in `SearchOverlay.tsx` (`useRecentSearches`, line 177, rendered
  at line 718), with a dated owner decision recorded in the code at lines 379 and 396: *recents store
  ONLY search and location, never the date*, because a stale date re-applied from a recent would
  silently tap the user back in time.

### 4b. The one number that matters

**Solen's mobile entry control is 280 px. Every mobile control in this sample is one row: 55 pt
(Airbnb), 51 pt (Square Go), 41 pt (Uber Eats), or absent (Fresha iOS).** That is roughly **5x** the
nearest comparable, for the same job, on the screen where space is scarcest. Nothing in this corpus
shows three stacked segments on a phone home screen. Not one of the 19 iOS homes.

This is not an argument that 280 is wrong. It is an argument that **280 is a position nobody else
holds, and it should be held deliberately or not at all.** The case FOR keeping it: Solen's three
fields are all load-bearing for availability, the stacked form makes all three legible at once, and
it teaches the query language to a first-timer in a market where nobody knows the brand yet. The
case AGAINST: at 280 px plus the h1 above it plus the header, the first `SalonCard` photo cannot be
in the first viewport at 390x844, which collides head-on with FLOORS LAW 2, and the corpus is
unanimous that a phone gives search one row.

### 4c. Why Solen is neither Airbnb nor Fresha, and what that implies

Four facts about Solen's shape, and what each one forces.

1. **We sell an appointment at a place.** So the photograph does more work than Fresha admits and
   less than Airbnb needs. Airbnb's photo IS the product; Fresha's photo only reassures. Solen's
   photo is doing a third job: it is how you tell a Swiss salon apart from the four other salons on
   the same street, and salon interiors are genuinely differentiating in a way restaurant exteriors
   are not. **Implication: the entry control must not own the first viewport alone, because a
   viewport with no salon in it has said nothing about the only thing that distinguishes us.**
2. **Swiss PBV Art. 13 forces a total price onto the card.** That is a tier-2 statutory floor in the
   precedence chain, above any pattern here. **Implication for ENTRY specifically:** because the
   price is already on the card, a price field in the search bar buys less than it does for Airbnb,
   whose price only exists once dates exist. Solen's price is a browse-time fact, not a
   query-time one. Nothing in this lens argues for a fourth segment.
3. **An appointment is a POINT in time, not a range.** This is the Airbnb Experiences finding
   (three segments, not four) and the Fresha finding (date plus time-of-day, not check-in plus
   check-out). Solen's `Zeit` segment is already the right shape. **I looked for an argument that
   Solen needs a fourth field and could not find one.** Which means I might just be agreeing with
   what already ships, so push back on me if you think a separate date-versus-time split is needed.
4. **Beauty is a six-week cycle, and Solen is pre-launch with no returning users yet.** This is the
   uncomfortable one. Fresha's app can put "Book again" first because it HAS a history to put
   there. Solen does not, and under the no-fabrication rule cannot invent one. **Implication: the
   returning-user design is real work that pays nothing today, and the first-timer design is the
   one that has to carry launch.** That argues, on evidence, for search-first NOW and a
   state-dependent slot LATER, which is the opposite of what Fresha's app does and the same as what
   Fresha's web does. It is worth being explicit that we are matched to Fresha's web population
   because we are all-new-visitors by definition, not because a hero is prettier.

### 4d. The two things I would put in front of you, both sides stated

**Choice 1: what the mobile entry control is.**

- **Keep the 280 px stacked card.** Gives up: the first salon photo in the first viewport, and
  alignment with every mobile reference in the corpus. Buys: all three constraints visible at once
  to a market that has never heard of us.
- **Collapse it to one row on mobile, keep the 60 px pill on desktop.** Solen already owns the
  expansion mechanism (`SearchOverlay` with segment tabs), so this is a geometry change, not a new
  system. Gives up: the teaching function of three visible fields, and the reassurance that dates
  are askable. Buys: roughly 220 px of the first viewport, which is what it costs to get a real
  `SalonCard` photo above the fold, plus the corpus-unanimous mobile shape. **If it collapses, it
  should collapse to 2b, not 2a**: "Service · Stadt · Zeit" as a summary once anything is set, and
  a single invitation only when nothing is. That is the one rule every app here agrees on.
- **A third option the corpus offers and I am not recommending, only naming:** Square Go's wordless
  field plus the intent grid promoted above the fold. Solen already HAS the grid
  (`MobileCategoriesRow`, six tiles, pick-ordered). Gives up: the ability to express a time
  constraint from the home screen, which for a booking product is a lot. Buys: the least chrome of
  any option.

This is a taste and hierarchy call on a locked surface, so it needs a mockup, not an edit. And per
the graveyard it must NOT be resolved by adding a hero image (owner's third rejection, 2026-07-25)
or a full-bleed treatment (denied 2026-07-16). The corpus independently agrees: not one of the 24
entry screens meets its imagery need with a decorative hero.

**Choice 2: does a recent search carry its date?**

Solen's code says no, with a stated reason (a stale date taps the user back). Vestiaire says yes,
carrying the filters with the term and letting you bookmark the pair. **Both are defensible and they
optimise different things.** Solen's rule protects correctness: a re-applied stale date could show
an empty result set for a salon that is in fact available. Vestiaire's rule protects effort: the
whole value of a recent is that it restores a state, and a partial restore means the user finishes
the job by hand every time. **The resolution the evidence supports is neither: carry the date but
RELATIVISE it.** A recent that stored "Samstag" restores "the next Saturday", not the specific date
that has passed. That satisfies the owner's stated concern (nothing taps backwards) without dropping
two thirds of the tuple. I am surfacing this rather than deciding it, because the code carries a
dated owner decision and a research file does not outrank one.

---

## 5. What I could not determine

1. **Motion and gesture, entirely.** Mobbin returns stills. I did not observe how Airbnb's pill
   expands into the accordion, whether Fresha web's bar collapses on scroll, whether Square Go's
   field animates when it goes sticky, or what Solen's `SearchOverlay` transition actually looks
   like in a browser. The [Airbnb flow](https://mobbin.com/flows/0fb29365-f327-46b6-9a6d-2dfbb5589716)
   gives me the accordion's STATES, not its transitions. Anything about timing has to come from
   `_design-system/MOTION.md` or a `reference-lock` capture with real video.
2. **Whether Fresha web's hero converts.** My population argument in section 3 is inferred from what
   the two surfaces contain, not from traffic or conversion data. It is the most load-bearing
   inference in this document and it is the weakest link in it.
3. **Whether any of these apps A/B tested the choice.** Every "belief" I attribute is reconstructed
   from the artefact. I cannot distinguish a deliberate bet from an accident that shipped, which is
   why section 1 says "the belief" rather than "they decided".
4. **The pure beauty-booking comparison set.** Two apps (Fresha, Square Go) is not a category.
   Booksy and Treatwell would change this document if they were observable and they are not.
5. **Web collapsed-on-scroll behaviour.** [One Airbnb Experiences
   capture](https://mobbin.com/screens/2cd72171-541d-4084-859c-86ab55476319) shows a compact
   "Anywhere / Anytime / Add guests" pill in the header instead of the four-segment bar, which
   strongly suggests a scroll-collapse. **I saw the end state, not the trigger.** I did not verify
   that scroll is what causes it, so I am not claiming it.
6. **Solen's rendered first-viewport composition.** I read 280 px out of `SearchBar.tsx` and the
   render order out of `page.tsx`. I did NOT render the page at 390x844 and measure where the first
   `SalonCard` photo actually lands. The 4b argument is arithmetic on source values; the measured
   version needs a browser and is the first thing to do before acting on it.

---

## 6. Design bets this lens makes available

A bet is a one-sentence claim about what the home screen is FOR, big enough that a whole screen
could be built around it. Each is traceable to something I saw.

### Bet E1: "The home screen's job is to make the query legal before you spend a tap."

**The claim.** Solen's home exists to collect three constraints (what, where, when) in bounded
pickers so that the first result set is bookable, and everything else on the screen is secondary to
that. The screen is a form with a feed under it.

**What it sacrifices.** The first salon photograph in the first viewport, on mobile, permanently.
Every returning user re-declaring what they declared six weeks ago. And it makes the home screen a
poor browsing surface by design, so all merchandising has to happen after a search.

**Evidence.** [Fresha web](https://mobbin.com/screens/7832695b-2761-4f79-aa14-5cefe5a5e7ff), whose
entire first viewport is this bet with nothing else in it, and which is the structural source of
truth for this product. [Airbnb web](https://mobbin.com/screens/a92f14ea-1a94-4a63-99f3-8b5fbd42d106)
holds the same bet while refusing to spend the viewport on it. This is the bet Solen currently ships
on both platforms.

### Bet E2: "The home screen's job is to show what we have, and search is the exit for people we failed."

**The claim.** The home screen is a shop window: real salons, real photos, the categories we
actually cover, ordered by what this person is likely to want. The search control shrinks to one
quiet row (or moves to the thumb) because the screen's success condition is that most people never
use it.

**What it sacrifices.** The time constraint, which is the one thing a browse surface cannot express
and the one thing that decides whether a booking is possible. A user who needs Saturday morning has
to search anyway, and now the search is small and far away. It also loads the entire burden onto feed
quality and ranking, which is real backend work, not a layout change.

**Evidence.** [Fresha iOS](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691), which
holds this bet so completely it removes the search control from home. [Uber Eats
iOS](https://mobbin.com/screens/520ada74-77d2-45ce-b42a-cbfaf4566bd9), which keeps the control but
puts it in the bottom bar and gives the top zone to categories and filters.
[Hers](https://mobbin.com/screens/e788da3e-eebd-4810-baa5-72d2705f43b7), which demotes search to the
eighth tile of its own grid.

### Bet E3: "The entry control stays constant. The slot beneath it is what knows who you are."

**The claim.** Stop trying to design one control that serves both a first-timer in Basel and a
customer on her fourth cut with the same stylist. Keep the search control fixed, and make the block
directly under it state-dependent: nothing booked yet gets an orientation card, something booked
gets the appointment, a past visit gets "Book again", an abandoned search gets "Continue searching".
The screen personalises by SWAPPING A SLOT, not by reshaping its chrome.

**What it sacrifices.** It is the least visually distinctive of the three; the home screen looks the
same to everyone above the fold, so none of the design effort is visible in a screenshot. It also
needs a real `bookings` read and a real history before it does anything at all, which means it pays
nothing at launch and cannot be faked under the no-fabrication rule. And it multiplies the number of
states the home screen has to be designed and tested in, from one to at least four.

**Evidence.** This is the best-supported bet in the lens and the only one held by three independent
products. [Zocdoc, three captures of one screen with three different cards under an unchanged search
field](https://mobbin.com/screens/20a3461b-b970-489a-a6fe-09109272e261) plus
[logged-out](https://mobbin.com/screens/645fe90a-411f-4c7a-90bc-aef8e94ac0a0) and
[no-appointment](https://mobbin.com/screens/e1966110-421c-4c5e-8890-e659c128635e).
[Airbnb's "Continue searching" card](https://mobbin.com/screens/4f347fd4-5793-41df-a0d9-b29fe02131cc)
under an unchanged "Start your search" pill. [Fresha's "Book again" as the first block after the
greeting](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691). And
[Airtasker's "Use details from last task"](https://mobbin.com/screens/fbacec45-d7fc-450f-b701-8d12e85fe000)
as the strongest single returning-user affordance in the sweep.

**Note on E3 versus the graveyard:** this is NOT the removed last-minute homepage strip (2026-06-11,
a promotional band) and NOT the removed `FeaturedSalonCarousel` (2026-06-30, fabricated demo data).
It is a personal-state slot, it renders only from a real `bookings` or history read, and it renders
nothing when there is nothing. `RecentlyViewed` is the nearest existing thing and it is browse
history, not a commitment.

---

## 7. Provenance

- Sweep run 2026-07-30 via Mobbin MCP: 10 `search_screens` calls (7 iOS, 3 web) and 2 `search_flows`
  calls (both iOS). Queries named Airbnb, Fresha, Zocdoc, Square Go and Uber Eats explicitly.
- Four captures downloaded from the `image_url` short links and measured with Python PIL at 299 px
  render, converted at 1.304 pt/px per the method in `research/AXIS_GRID.md` section 0. The four pt
  figures in section 1 are the only measured numbers taken from images in this file; everything else
  read off an image is described as read, not measured.
- Every Solen claim verified by reading `app/[locale]/_components/homepage/SearchBar.tsx`,
  `Hero.tsx`, `MobileCategoriesRow.tsx`, `page.tsx` and
  `app/[locale]/_components/search/SearchOverlay.tsx` on 2026-07-30, with line numbers cited inline.
- `npm run exists "search entry"` (0 hits) and `npm run exists "search bar"` (14 hits, 2 graveyard)
  run 2026-07-30; `_design-system/REMOVED.md` read directly for the hero-image, full-bleed and
  search-morph entries.
- Booksy, Treatwell, StyleSeat, Vagaro, Squire and Mindbody: still absent from Mobbin. Not one of
  the 12 searches returned them.

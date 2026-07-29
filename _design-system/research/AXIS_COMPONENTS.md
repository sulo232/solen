# AXIS: COMPONENTS

<!-- exists-check: `npm run exists components` = 339 matches (319 live components, 20 graveyard), all of
     which are Solen's own inventory, not a research doc. Net-new vs the existing research/ set, which I read
     before writing: TASTE_CHECKOUT.md is literature-sourced (Baymard/NN-g) findings about ONE screen's form
     and cost-disclosure behaviour, with no component enumeration and no Mobbin corpus. TASTE_HIERARCHY /
     TASTE_TYPOGRAPHY / TASTE_GROUPING / TASTE_RANGE are per-topic visual-property files (scan patterns, level
     count, containment, emphasis spend). TASTE_REFS_2026-07.md is the owner's 30 X references. MOTION_* and
     VIDEO_UXPEAK are motion/psychology. _rules/SOLEN_PATTERNS.md is a Fresha translation playbook whose
     component library was tombstoned 2026-07-07 and redirected to COMPONENT_REGISTRY.md. No file in this
     estate enumerates the reusable COMPONENT INVENTORY a booking product needs, or grades each component's
     empty / loading / long-content / error variants against observed competitor screens. Graveyard hits
     checked: nothing in REMOVED.md covers a component-inventory research doc. This file EXTENDS
     COMPONENT_REGISTRY.md (which governs what we own) by supplying the outside evidence for what is missing
     from it; every gap below names the registry row or the file path it lands on. -->

**The reusable component inventory a booking product needs, and how the best examples handle
empty / loading / long-content / error for each one.**

Researched 2026-07-29. Instrument: Mobbin (`search_screens`, deep mode, ios + web).
Ground truth for the Solen half: the working tree at
`/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559`, read directly.

---

## 0. Method and sample size

I ran **17 distinct Mobbin searches** (13 at limit 8, 4 at limit 7), split across both platforms,
deliberately varying wording and naming specific apps so the corpus would not collapse into one
brand's house style.

* **132 screens returned. 77 distinct apps.**
* Platform split: 13 searches on `ios`, 4 on `web`.
* I opened and read every returned image. Every claim below about a screen's anatomy is something
  I could see in the screenshot. Where I am reasoning past the pixels I write **(inferred)**.

Honest caveats about this sample:

* It is **not a census**. It is what Mobbin's index surfaced for 17 queries. A pattern being absent
  here means "absent from these 132 screens", never "nobody does this".
* Three searches returned a single app repeated (Airbnb checkout 8 of 8, Calendly 8 of 8, Uber Eats
  8 of 8). Those give depth on one product's system, not breadth. I flag which findings rest on a
  single-app sample.
* The Fresha web search returned five Fresha screens of which two are near-identical frames of the
  same page state. I count them once when stating a pattern.
* Mobbin frames are static. I never saw a transition, so **every motion claim in this doc is absent,
  not asserted**. Motion belongs to a different axis.

Apps in the corpus: Fresha, Airbnb, Calendly, Uber Eats, Square Go, Zocdoc, Booking.com, Careem,
Superpower, Tock, CVS Health, Instacart, Crate & Barrel, KakaoTalk, Otter AI, Redfin, Nextdoor,
Grab, Finimize, Spotify Kids, Gojek, NAVER, Instagram, Quizlet, DICE, IKEA, MyDyson, Swiggy,
Klarna, Plenty of Fish, Prime Video, Bolt Food, Opera, PayPal, DoorDash, Etsy, Ulta Beauty, UNIQLO,
Shop, Target, Woolworths, Lugg, Angi, Best Buy, Warby Parker, Turo, Plazo, Bloom, Formula 1,
inDrive, Tesla Robotaxi, Alan, eBay, Sumeria, Wolt Delivery, Acorns, Obsidian, komoot, ElevenLabs,
Fabric, Notion, Depop, Mindtrip, TravelPerk, Navan, Peerspace, Google Photos, Medium, Todoist,
Google Drive, CHOPT, Kitchen Stories, Keeta, Grill'd, Skip, TheFork, foodpanda.

---

## 1. The inventory

Twenty-six components. The tiering is mine: **Tier 1** appears on a booking screen no matter what
the product sells, **Tier 2** is booking-marketplace specific, **Tier 3** is the state layer that
every Tier 1 and 2 component needs and that is where products actually fail.

| # | Component | Tier | Seen in (examples) | Solen today |
|---|---|---|---|---|
| 1 | Entity card (salon / listing) | 1 | Fresha web, Airbnb web, DoorDash | `components-legacy/SalonCard.tsx` + hand-drawn copies (FLOORS LAW 9 finding) |
| 2 | Line-item row (service / menu item) | 2 | Fresha, Keeta, Grill'd, TheFork | **no shared component**, 10 files render it |
| 3 | Slot grid / time chips | 2 | Booking.com, Square Go, CVS, Calendly, Fresha web | `primitives/DateTimePicker.tsx` (real, shared) |
| 4 | Date strip / calendar | 2 | Careem, Booking.com, Superpower, Tock, Calendly | same primitive, `dateLayout` vs calendar |
| 5 | Sticky commit bar | 1 | Fresha, Careem, Uber Eats, Airbnb, TravelPerk | **no shared component**, 9 hand-rolled |
| 6 | Price breakdown block | 1 | Airbnb, Uber Eats, TravelPerk, Navan | **no shared component**, duplicated verbatim |
| 7 | Segmented control / content tabs | 1 | Fresha, Zocdoc, Keeta, TheFork, Mindtrip | `primitives/TabPill.tsx` + `salon/SalonStickyTabNav.tsx` |
| 8 | Filter chip row | 1 | Fresha, DoorDash, NAVER, Skip | `TabPill` + `ui/ScrollableFilterRow.tsx` |
| 9 | Filter sheet / modal | 1 | Fresha web, NAVER, komoot | `_components/search/FilterSheet.tsx` |
| 10 | Bottom sheet | 1 | Notion, Depop, komoot, Fabric, Obsidian | `primitives/Sheet.tsx` |
| 11 | Modal dialog | 1 | Fresha web, Opera | `primitives/Modal.tsx` (2 real call-sites) |
| 12 | Rating summary + distribution | 2 | Etsy, UNIQLO, Shop, CVS, Target, Woolworths | inside `SalonReviews.tsx`, not extracted |
| 13 | Review row | 2 | Etsy, Shop, Target, foodpanda | inside `SalonReviews.tsx` |
| 14 | Person / staff picker tile | 2 | Fresha, Careem, Zocdoc, Bloom | `salon/SalonTeam.tsx` + `booking/StaffStep.tsx` |
| 15 | Avatar (photo / initials / badge) | 1 | Fresha, Zocdoc, Plazo, Calendly | `primitives/Avatar.tsx` (5 call-sites) |
| 16 | Stepper / quantity control | 1 | Airbnb, Uber Eats, Keeta, Instacart | `booking/ToggleCircle.tsx` (add-toggle, not a stepper) |
| 17 | Summary card (what you are buying) | 2 | Airbnb, TravelPerk, Navan, Turo, Peerspace | `booking/BookingCard.tsx` |
| 18 | Policy / cancellation block | 2 | Airbnb, Careem, Navan, Turo, TravelPerk | inline strings in `PayConfirmStep.tsx` |
| 19 | Trust / disclosure card | 2 | Peerspace, Keeta, TravelPerk, Zocdoc | none |
| 20 | Badge / tag chip | 1 | Fresha, Airbnb, Zocdoc, Grill'd, Keeta | `ui/SalonBadge.tsx`, `discovery/PriceRangeBadge.tsx` |
| 21 | Inline banner / callout | 1 | Careem, Uber Eats, Swiggy, Keeta | none shared |
| 22 | Toast / snackbar | 3 | Google Photos, CVS, CHOPT, Medium, Todoist | `primitives/Toast.tsx` (locked) |
| 23 | Skeleton | 3 | Gojek, NAVER, Instagram, Quizlet, IKEA | `primitives/Skeleton.tsx` + `SkeletonCard.tsx` |
| 24 | Empty state | 3 | Fresha, Redfin, Grab, Nextdoor, Square Go | `ui/EmptyState.tsx` + `profile/EmptyStateDiscovery.tsx` |
| 25 | Error state | 3 | Swiggy, Klarna, PayPal, Bolt Food, Prime Video | `ui/ErrorState.tsx`, `ui/ErrorFallback.tsx`, `primitives/SectionErrorBoundary.tsx` |
| 26 | Form field + validation | 1 | Tesla, CVS, eBay, Grab, Wolt, Acorns | `primitives/TextInput.tsx`, `FieldLabel`, `FieldHelper` |

**Count over this inventory:** of the 26, Solen has a genuinely shared implementation for 17, has the
capability spread across several unshared copies for 6 (rows 1, 2, 5, 6, 12, 13), and has nothing at
all for 3 (rows 18, 19, 21).

---

## 2. Component by component: what I saw, and the four variants

For each component I report the **populated** anatomy first, then the four variants the brief asks
for. Where the corpus did not show me a variant I say so rather than filling it in.

---

### 2.1 Line-item row (service row)

The most-repeated component in a booking product, and the one Solen has least consolidated.

**Populated anatomy, from
[Fresha's PDP services list](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9):**
name (semibold, one line), duration meta in gray ("1 hr - 1 hr, 45 min"), price on its own line
prefixed "from", and a right-aligned outline pill "Book". Rows separated by a hairline, no card,
no shadow.

The identical row appears in three visually distinct **variants driven by context, not by data**:

| Context | Right-hand affordance | Extra line |
|---|---|---|
| PDP browse ([Fresha](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9)) | outline "Book" pill | none |
| Selection sheet ([Fresha](https://mobbin.com/screens/507e9cfb-c682-478a-ae2f-9f59cbea37b2)) | gray circular "+" | truncated description |
| Selected / in cart ([Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f)) | stepper pill (minus, 1, plus) | "Ordered: 1" |

That is one component with three affordance slots, not three components. Keeta proves it on one
screen: the top row shows a full stepper because its quantity is 1, and every row below it shows a
bare "+".

**Long content.** Two solved approaches, both worth copying:

* Fresha clamps the description to **one line** with a character ellipsis
  ([selection sheet](https://mobbin.com/screens/507e9cfb-c682-478a-ae2f-9f59cbea37b2): "Included nail
  cutting, shaping, cuticle cleani…"). The name itself wraps to two lines and is never truncated.
* Keeta lets the description run to **three lines** and keeps the photo and price fixed
  ([Keeta menu](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f)).

Neither truncates the price or the duration. The rule: **meta and price are nowrap, prose clamps.**

**Rich-data / long-list handling.** Every long menu in the corpus groups and pins:

* [TheFork](https://mobbin.com/screens/5a6057a9-5f85-4f94-a995-6be47e70fbcc) puts the **count in the
  tab label**: "Salades (8)", "Entree (11)". Cheap, honest, and it tells you the size of a section
  before you scroll into it.
* [Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f) and
  [Skip](https://mobbin.com/screens/6fdf5ec8-7734-4e32-b87e-95a0c2ca82b1) both add a **jump-to-
  category icon button** at the leading edge of the sticky tab strip, so a 20-category menu does not
  require horizontal scrubbing.
* Fresha's PDP sticky bar states the total inventory as plain text: "136 services available"
  ([screen](https://mobbin.com/screens/eddf7b74-cc51-4701-8d9e-282f68eb6697)). It is the honest
  version of a density signal: a real count, not a badge.

**Empty.** Not observed as a dedicated variant. What I did see is the **inline sub-empty**, one gray
line under a section header, in
[Uber Eats group order](https://mobbin.com/screens/0d9e20bc-cae2-40ea-8a66-1b5fe1d9593c): "Others in
the group / No one has joined yet". No illustration, no centring, no CTA. This is the correct shape
for a below-floor section inside an otherwise full screen.

**Loading.** [Uber Eats](https://mobbin.com/screens/920a7887-dc04-47a1-9510-00a5659a521f) does the
sharpest thing in the whole corpus: the row stays fully rendered and **only the price is replaced by
a skeleton bar** while the cart recalculates, with the checkout button greyed out at the same moment.
Partial skeleton inside a live row, not a whole-list swap.

**Error.** Not observed at row level.

---

### 2.2 Slot grid and date strip

Nine apps in the corpus render availability, and they split into four genuinely different shapes.
This is the component with the most design variance in the whole inventory.

| Shape | Example | Reads well when |
|---|---|---|
| Chip grid, 3 across | [Booking.com](https://mobbin.com/screens/5c354f54-dd59-434c-b906-070c867c64d3) | slots are uniform, count is large |
| Chip row, horizontal scroll | [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8), [Fresha web](https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8) | slots are secondary to something else on the row |
| Full-width option card | [Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108), [Calendly](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02) | each slot carries extra facts (price, capacity) |
| Radio list | [Instacart](https://mobbin.com/screens/a91586bf-246f-4be6-9bb2-7353d0264a9e) | slots are wide windows, not appointments |

**The important structural finding: the best examples put real data inside the slot.**

* Airbnb's slot card carries the time range, "$25 / guest", "Private pricing available", and a
  right-aligned "**10 spots left**" ([screen](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108)).
* Calendly's slot buttons each carry "**100 spots left**" as a second line
  ([screen](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02)).
* Superpower's **date cells** carry a slot count each: "16 / 10 slots", "17 / 86 slots",
  "18 / 103 slots" ([screen](https://mobbin.com/screens/32eb0666-b55a-4f08-9d59-45cef32dd5f1)). That
  is a date strip that answers "which day is worth tapping" before you tap.
* Zocdoc goes furthest: its availability strip renders **three days at once, each with its own
  state**, gray "Today - Tomorrow / No appts", yellow "Tue May 26 / **3 appts**", gray "Wed May 27 /
  No appts" ([screen](https://mobbin.com/screens/53728922-3e77-4e0e-aef2-3c267714d5ec)). The empty
  variant is not a separate screen, it is a cell state.

**Empty variant, the best example in the corpus.**
[Square Go](https://mobbin.com/screens/8b69dfc2-0028-4364-afc5-ed5820644be3) groups slots by
Morning / Afternoon / Evening, and for the two groups with nothing left it renders a **single
disabled ghost chip reading "All booked"** in the position where chips would be. Morning and
Afternoon are empty, Evening has two live chips. The group headers stay. This is far better than a
whole-page empty state, because it tells you *when* to look instead of *that* you failed.

**Loading.** Not observed. No app in this corpus showed me a slot grid mid-fetch. **(Not verified.)**

**Long content.** Three mechanisms:

* [Booking.com](https://mobbin.com/screens/5c354f54-dd59-434c-b906-070c867c64d3) caps the grid at
  nine chips and adds a "Show more" disclosure with a chevron.
* [Careem](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8) shows three chips in a
  scrolling row plus a "See all" link beside the section heading.
* [Fresha web](https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8) caps at three chips
  and uses an **overflow "three-dot" chip** as the fourth item. Smallest footprint of the three.

**Error.** Not observed at component level.

**Selection confirmation, and this is the pattern I would steal.**
[Calendly](https://mobbin.com/screens/6209330e-b33d-403d-8794-65e775246395) does not move the user to
a bar or a next screen when a time is picked. The chosen slot button **splits in place**: the left
half becomes a dark filled block still showing "10:00am", the right half becomes a blue "Next".
Confirm-in-context, zero travel, and the choice stays visible at the moment of confirming.

---

### 2.3 Sticky commit bar

Present across most transactional screens in the corpus. Three anatomies:

1. **Value plus action, full-width bar.** Fresha: "136 services available" left, black "Book now"
   pill right ([screen](https://mobbin.com/screens/eddf7b74-cc51-4701-8d9e-282f68eb6697)). Careem:
   "Total / AED 109.00" with an **expand chevron** left, green "Next" right
   ([screen](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8)). Airbnb: "$25 for 1
   guest" left, ink "Next" right ([screen](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108)).
2. **Floating pill, not a bar.** Uber Eats: a centred black pill "Add all to cart • $13.79" hovering
   above the tab bar ([screen](https://mobbin.com/screens/fdf7278b-f5de-45b9-9763-de29563cd644)).
   Grill'd does the same in red ([screen](https://mobbin.com/screens/e0b166c7-a999-4a15-b831-4dccb38f32e5)).
3. **Action only, full-width.** Uber Eats checkout, black "Place order"
   ([screen](https://mobbin.com/screens/e9d30576-6c0d-4213-b4b1-689a38c6760e)).

Careem's expand chevron on the total is the detail worth naming: the running total is **tappable to
reveal the breakdown** without leaving the step. That satisfies a price-transparency requirement
without spending a screen.

**Disabled variant.** [Uber Eats](https://mobbin.com/screens/920a7887-dc04-47a1-9510-00a5659a521f)
greys the button and keeps the bar. [Booking.com](https://mobbin.com/screens/5c354f54-dd59-434c-b906-070c867c64d3)
greys "Confirm change" until a time is picked. **6 of the 8 form screens I examined also disable the
submit while a validation error stands** (Tesla, Alan, eBay, Wolt, Grab, Formula 1); CVS and Acorns
leave it enabled. So the disabled-CTA convention is dominant but not universal in this sample.

**Loading variant.** [Fresha web's filter modal](https://mobbin.com/screens/6738b486-29e9-4ad3-b377-f006d1a435f3)
shows the exact treatment: the black "Apply" button keeps its size and its label is replaced by a
**three-dot pulse**. Button geometry never changes, so nothing reflows.

**Stacking, and this is the part most implementations get wrong.** Fresha, Keeta, Skip and CHOPT all
stack a **second strip directly above the bar**: Fresha a dark "Added to favourites" toast
([screen](https://mobbin.com/screens/eddf7b74-cc51-4701-8d9e-282f68eb6697)), Keeta a pale-yellow
"Free delivery applied" strip, CHOPT a yellow undo toast
([screen](https://mobbin.com/screens/fa70101b-9b13-4e56-8f78-f8566b246f46)), Skip a blue promo toast
([screen](https://mobbin.com/screens/6fdf5ec8-7734-4e32-b87e-95a0c2ca82b1)). The bar is a **stack
slot**, not a single element. An implementation that does not accept a banner or toast child above
the action row will eventually collide with one.

---

### 2.4 Price breakdown block

Eight Airbnb screens plus Uber Eats, TravelPerk, Navan, Turo and Peerspace. Single-app depth on
Airbnb, so treat the Airbnb-specific details as one product's opinion.

**The row is universally label left, value right, baseline-aligned, with a rule above the total.**
[Airbnb](https://mobbin.com/screens/992ccadf-13af-4938-a38d-61257ef03143): "$183.73 x 1 night ...
$183.73", "Taxes ... $17.81", divider, "**Total USD** ... $201.54", then an underlined text link
"Price breakdown" for the deeper view.

Four variants of the row that a booking product actually needs:

| Variant | Example | Treatment |
|---|---|---|
| Plain | Airbnb | label / value |
| Explained | [Uber Eats](https://mobbin.com/screens/e9d30576-6c0d-4213-b4b1-689a38c6760e) | info icon after the label |
| Discounted | [Uber Eats](https://mobbin.com/screens/e9d30576-6c0d-4213-b4b1-689a38c6760e) | original struck through, new value in a warm colour |
| Two-line both sides | [Airbnb refund](https://mobbin.com/screens/cafad2e7-0065-483c-9f51-5b55ecd4fbb1) | "Accommodation / Full refund" left, "$161.00 / of $161.00 paid" right |

**Sub-total grouping.** [TravelPerk](https://mobbin.com/screens/a8ec9d62-206b-4a9f-b8d2-1d37369febe0)
puts the Total in a bordered card and then shows "Pay in advance $362.22" / "Pay on arrival $0.00" as
tinted sub-rows underneath. [Navan](https://mobbin.com/screens/6878cdf7-031d-4423-9fa9-e01c51ab031e)
makes the whole summary **collapsible per group** ("Business nights" / "Personal nights"), each with
its own total and tag chip.

**Long content.** Every app in this set caps the inline breakdown at 2 to 4 rows and pushes the rest
behind a link ("Price breakdown", "Details", "see the summary of charges"). Nobody renders a 20-row
inline ledger.

**Loading.** Only the Uber Eats price-skeleton described in 2.1. **Empty and error not observed.**

---

### 2.5 Empty state

Eight apps, and they fall on a quality spectrum I can measure by one thing: **how far the CTA sits
from the message**.

**The good end.**

* [Fresha](https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3): the whole cluster sits
  inside a **bordered rounded card**, top-anchored under the "Appointments" H1. Anatomy: a small
  **colour-rendered 3D calendar glyph** (purple-violet gradient, not a flat line icon), title "No
  appointments", two-line gray subline "Your upcoming and past appointments will appear when you
  book", and a **white outline pill "Search salons"**. The card holds the space so the page does not
  look broken; the empty state itself stays compact.
* [Redfin](https://mobbin.com/screens/e73a3ea0-fdf2-49b4-a4b0-e8b8021b9cec): **left-aligned**, small
  red-outline calendar icon, then a genuinely large two-line headline "No appointments scheduled",
  a body sentence, and a full-width red button. The headline is the biggest text on the screen, so
  the empty state still carries a display anchor.
* [Grab](https://mobbin.com/screens/1ecb8058-f083-42c9-980a-ae3eb46e3eab) and
  [Nextdoor](https://mobbin.com/screens/a180b84e-5edd-463e-8113-fc4438c0d30c): illustration, title,
  subline, button, all in one tight vertical run.

**The bad end, and it is the exact failure Solen's NEVER-AGAIN floor 3 describes.**
[KakaoTalk](https://mobbin.com/screens/d19fb073-d46e-43f9-8239-d45f3cd2d64a) centres the message in
the viewport and pins two gray buttons at the very bottom of the screen. The gap between the message
and the action is roughly half the viewport, and the two read as unrelated things.
[Crate & Barrel](https://mobbin.com/screens/21e0a76b-cf3b-47ef-a802-f3ac088579fa) is the same shape:
a top-anchored sentence, a button, and a large empty region below it.

**The icon-treatment finding, which matters for Solen specifically.** Of the 8 empty states I
examined, **5 use a coloured or illustrated focal** (Fresha 3D violet calendar, Otter.AI scene
illustration, Nextdoor hand-drawn line art with a highlighter accent, Grab flat character, CVS 3D
bell with a green check badge), **1 uses a semantic-coloured line icon** (Redfin, red outline), and
**2 use no icon at all** (Square Go, Crate & Barrel). **Zero of the 8 used a grey line icon on a grey
disc.** Section 4.2 explains why that number matters here.

**Loading and error variants of an empty state are a category error** and nobody in the corpus tried
them. Empty is a terminal state.

---

### 2.6 Skeleton

Eight apps. The rules are unusually consistent, which makes this the easiest component to get right.

1. **Reproduce the final layout's geometry, not a generic list.**
   [Gojek](https://mobbin.com/screens/904e381c-9ce0-42d0-9df0-02b1cb20000d) draws a large rounded
   hero block, two bars, then circle-avatar-plus-three-lines rows, which is exactly the page that
   loads. [NAVER](https://mobbin.com/screens/7524fe67-cbfa-4ab6-ad63-178ca44c2f3b) draws square
   thumbnails at the real thumbnail size.
2. **Vary the bar widths.** Every good example uses long / long / short runs so the block reads as
   text (NAVER, Gojek, [Instagram](https://mobbin.com/screens/08f3f7be-088d-4977-8867-50c10465950c),
   [IKEA](https://mobbin.com/screens/62446e28-0da8-4b0b-8bed-72a07ceaf7d7)). Uniform bars read as a
   broken table.
3. **Keep the real chrome.** Instagram keeps its nav bar and the real title "Discover people".
   [Quizlet](https://mobbin.com/screens/2e62d572-9596-42dc-9c15-121a0b8d489f) keeps the real folder
   icon and the real title "Study" and skeletons only the list.
   [DICE](https://mobbin.com/screens/989c2ec3-aba7-4865-a1df-7c9502adc70a) keeps its hairline
   dividers and section-header positions.
4. **Partial hydration is allowed and looks confident.**
   [Finimize](https://mobbin.com/screens/a0ac7917-f698-42e8-85ce-8d6cf3949eb9) renders the real
   thumbnails, which have loaded, next to skeleton text bars, under a real headline "Building your
   feed…". Real data appears the instant it exists.
5. **Zero spinners in 8 of 8.** Not one app in this sample used an indeterminate spinner for content
   loading. Spinners appeared only inside a button
   ([Angi](https://mobbin.com/screens/79459363-9904-465d-9499-c4cd10d104a3)) and as the dot-pulse in
   [Fresha's Apply button](https://mobbin.com/screens/6738b486-29e9-4ad3-b377-f006d1a435f3).

---

### 2.7 Error state

Eight apps. Two families, and picking the wrong family is the common mistake.

**Family A, inline and shell-preserving.** The page chrome survives and only the content region is
replaced. [Swiggy](https://mobbin.com/screens/25f4cc9d-9a98-4efb-87b3-58bd6fd98552) is the clearest:
the address bar, the category tabs and the search field all stay live, and only the feed becomes an
illustration plus a headline plus a "RETRY" button.
[Prime Video](https://mobbin.com/screens/7f93f562-2680-4876-9cc2-c11898ae4092) and
[Bolt Food](https://mobbin.com/screens/68295fea-b87b-4e4a-bb5a-d61d18a645de) also keep their tab
bars. **4 of the 8 preserved the shell.**

**Family B, full takeover.** [Klarna](https://mobbin.com/screens/815b6614-e411-4287-b57c-2f271e731098)
and [PayPal](https://mobbin.com/screens/305815a1-eb96-4544-bde7-c1342b7e15ce) blank the screen and
bottom-anchor a single dark pill. PayPal adds a second tier: a blue text link "Not Now" under the
"Try Again" button, the graceful exit an inline panel does not need.

**The transient third case.** [Opera](https://mobbin.com/screens/b07170dc-4a91-4142-a702-287cfb686f0a)
puts the error in a **modal alert** with Retry and Cancel, because the failure belonged to a
user-initiated action rather than a page load. Worth naming as a separate component (`ErrorDialog`)
rather than reusing the panel.

**Semantic colour survives.** PayPal keeps a red outline warning triangle, Swiggy tints the
illustration, Bolt Food renders a green 3D spilled cup. Nobody monochromed the error signal to ink.

**Copy pattern.** Every one of the 8 names the cause and the next move in two short sentences. Prime
Video goes furthest and names the escalation path ("please contact Amazon Customer Service"). No app
in the sample showed a raw error code to a customer.

---

### 2.8 Form field and validation

Eight apps. The treatment is near-universal and worth writing down as a single spec.

* **Red border on the field itself** in 8 of 8.
* **An icon plus red text adjacent to the field** in 7 of 8: a red circle-minus
  ([CVS](https://mobbin.com/screens/c3de4ab5-90d4-4218-8f86-d676228cf4cb)), a red X-circle
  ([Wolt](https://mobbin.com/screens/6cf1d44c-7839-4bff-8363-a72110639cde)), a red exclamation circle
  ([eBay](https://mobbin.com/screens/10ab7db4-3381-490b-90ab-dde99e30c2dc)). Only
  [Acorns](https://mobbin.com/screens/bab72cc0-919d-4a86-bec0-c59f5e82f507) uses bare red text
  ("Invalid").
* **Nobody used a toast for a field-level error.** The message is always in the layout, next to the
  input, and it survives scrolling.
* **One space-saving variant worth knowing:**
  [Tesla](https://mobbin.com/screens/9e3452d9-6a79-40a2-9313-67f24cbbcf61) puts the error text
  *inside* the field, in the floating-label slot, in red ("Address Line 1 is required"), with the
  placeholder still visible below it. Six errored fields cost zero extra vertical space.
* **The best recovery affordance in the corpus:**
  [eBay](https://mobbin.com/screens/10ab7db4-3381-490b-90ab-dde99e30c2dc) follows "Looks like this
  username is taken" with a list of tappable **available alternatives**. The error does the work
  instead of describing it.

---

### 2.9 Rating summary and review row

Eight apps. The summary block is remarkably stable and the extras are where products differ.

**Stable core:** a large numeral, a star row, a count, and five distribution rows of
label / track / value.

**The one real disagreement is what goes on the right of the bar.** 4 of the 8 show **counts**
(Instacart, UNIQLO, Ulta, Woolworths), 3 show **percentages** (Etsy, Target, Woolworths' sibling
pattern), 1 shows both. Counts are the honest choice for a marketplace where a salon may have four
reviews; a percentage over n=4 is misleading.

**Two extras worth stealing:**

* **The distribution doubles as a filter.**
  [Ulta](https://mobbin.com/screens/f62d201b-d050-4c7f-af37-0b65d1a3c0e3) puts a radio circle at the
  start of each distribution row, so tapping "4 star" filters the list. One component, two jobs, no
  extra chrome.
* **Sub-attribute scores as rings.** [CVS](https://mobbin.com/screens/4eb68e35-002a-467e-ba7d-028056ee2e77)
  and [Target](https://mobbin.com/screens/a325e04d-0a18-46e4-888d-ee77627fc9bc) render "4.9 / taste",
  "4.7 / quality", "4.5 / value" as circular gauges. For a salon this maps directly onto punctuality,
  cleanliness and result.

**Long content, solved identically everywhere:** clamp the review body and offer an inline "Read
more" ([Woolworths](https://mobbin.com/screens/51c7de6d-0eae-413b-a32d-7e3e647c2d68), which also
fades the clamped last line), plus a full-width "Show 193 Reviews" at the bottom of the preview list.
Nobody renders the full set inline.

**The i18n variant Solen will need, and only one app in 132 screens showed it to me.**
[Etsy](https://mobbin.com/screens/7afe0804-30cb-4ea0-bc05-78a9b2976105) renders a German review in
the middle of an English list and puts a blue "**Translate**" link beside the stars. In a
de/en/fr/it marketplace this is not a nice-to-have, it is the default case.

**Empty variant, and Fresha handles it correctly.** On
[Fresha web](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937), a salon with no
reviews renders the plain gray text "**No reviews yet**" in the exact slot where "5.0, five stars,
(2)" would be. No zero stars, no "0.0", no empty star row. Angi does the same with "No ratings or
reviews yet" ([screen](https://mobbin.com/screens/79459363-9904-465d-9499-c4cd10d104a3)). Rendering
five grey stars for a new salon would be a fabricated signal.

---

### 2.10 Person / staff picker

**The finding worth the whole search:**
[Fresha's "Select professional"](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122)
makes "**Any team member**" a **first-class tile in the same grid**, with a people icon occupying the
avatar slot and "Maximum availability" as its subtitle. It is not a checkbox above the list and not a
row set apart. [Careem](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5) does the
same in a horizontal rail, with "Auto assign / We'll assign the best professional" as the first card
and **selected by default**.

Tile anatomy: avatar (photo, or initials on a colour disc), name semibold, role in gray, and an
optional rating line. Fresha shows the rating on only one of four tiles, which means the rating slot
is **conditional on data existing**, not a slot that renders "0.0" when empty.

**The loading and zero-data variants on one screen.**
[Angi](https://mobbin.com/screens/79459363-9904-465d-9499-c4cd10d104a3) shows three pro cards
simultaneously in three states: card 1 populated with a live CTA, card 2 with its **CTA area replaced
by a grey block containing a spinner** while a quote is fetched, card 3 with "No ratings or reviews
yet" for a brand-new pro. That is a component whose state machine was actually designed.

---

### 2.11 Segmented control, tabs, and chips

The corpus draws a hard line that matches Solen's existing lock, so this is a confirmation rather
than a finding.

* **Content navigation uses an underline.** Fresha PDP: Photos / Services / Team / Reviews / Buy /
  About with a 2px underline under the active one
  ([screen](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9)). Same in
  [Zocdoc](https://mobbin.com/screens/53728922-3e77-4e0e-aef2-3c267714d5ec),
  [Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f),
  [TheFork](https://mobbin.com/screens/5a6057a9-5f85-4f94-a995-6be47e70fbcc),
  [Mindtrip](https://mobbin.com/screens/778ac786-56a7-4c27-8d02-6a14729f9c9d) and
  [Turo web](https://mobbin.com/screens/9c5051f8-d40c-4783-b1e5-c7be00206e3e).
* **Option selection uses a pill.** Fresha's category chips inside the services section are pills
  with a **black fill** when active. Fresha web's venue-type chips use a **purple fill**
  ([screen](https://mobbin.com/screens/c811632d-fe85-454a-883d-29c1c301fcac)).

Note the divergence honestly: **Fresha's selected chip is a saturated fill (black on iOS, brand
purple on web). Solen's lock is the calm gray `#F4F4F5` fill.** Solen is the minority position in
this corpus, and the owner locked it on 2026-06-29. I am recording the divergence, not reopening it.

* **The scroll promise is real and universal.** Every horizontal chip row in the corpus crops the
  last chip at the viewport edge.
  [Fresha](https://mobbin.com/screens/b82c55c4-339f-41d0-9493-4a6b097da8e8) even crops the *first*
  chip ("…akeup"), proving the row is mid-scroll.

---

### 2.12 Bottom sheet

Seven apps. Anatomy converges on: grab handle, title row, content, optional footer action pair.

* **A sheet can be navigable.** [Notion](https://mobbin.com/screens/6c740ed6-969e-427c-828d-00b779664287)
  and [Depop](https://mobbin.com/screens/09f20747-d7a5-4a37-9a04-a4b571862271) put a **back chevron**
  in the sheet header, so the sheet has internal history.
* **Sheets stack.** [Obsidian](https://mobbin.com/screens/30a7bdf0-46b3-42c8-aac8-d3999b1bc229)
  renders a picker sheet on top of a settings sheet, each with its own handle.
* **Notion's content shape matches Solen's grouped-card lock exactly:** a white rounded group card
  holding the option rows, sitting on a gray sheet background, with a check on the selected row.
* **Footer action pair** appears when the sheet is a filter:
  [NAVER](https://mobbin.com/screens/6eb73bba-6553-4609-a520-f6dbcc77c3a4) uses a neutral Cancel plus
  a filled Apply; [Fresha web's modal](https://mobbin.com/screens/c811632d-fe85-454a-883d-29c1c301fcac)
  uses a ghost "Clear all" plus a black "Apply".
* **Empty variant, as a warning.** [ElevenLabs](https://mobbin.com/screens/9f97fe83-b557-440c-9521-90c15ddb72a0)
  shows three short rows in a full-height sheet, leaving roughly two thirds of it blank. Sheets
  should size to content.

---

### 2.13 Confirmation screen

Eight apps, and there is a clean three-tier action ladder that keeps recurring.

[Warby Parker](https://mobbin.com/screens/49e69531-025b-4dee-b457-397896728321) is the cleanest
example: **filled primary** ("Start digital intake form", the genuinely next thing), **outlined
secondary** ("Add appointment to calendar"), **text link tertiary** ("Book another appointment").
[Square Go](https://mobbin.com/screens/0c8bc4e6-cf74-45a7-997d-329392adbcdc) uses filled plus two
text links. [Best Buy](https://mobbin.com/screens/319cba49-e7c9-477e-b2f7-45457e84a50e) uses a
**3-up icon action row** (Add to Calendar / Reschedule / Cancel) instead, which reads more like a
toolbar.

**The headline should state the outcome, not the status.** Warby Parker: "See you Wednesday at 9:45
a.m. at Burlingame Ave.!". Lugg: "You're all set! / We'll see you / Tomorrow, May 14, 1 pm - 2 pm"
([screen](https://mobbin.com/screens/d2465ca8-a428-4152-bfa5-fe037efab0b6)). Compare
[IKEA](https://mobbin.com/screens/30632d40-03ca-4fda-a6bf-687b68a5f7c7): "Your booking is confirmed",
which is a status, with the actual facts arriving nine lines later in a detail list.

**Success mark treatment:** 5 of 8 use a filled coloured disc with a white check (Lugg green, Angi
green, Warby teal, Square Go, CVS as a badge on a 3D bell); IKEA uses a bare green checkmark glyph
with no disc; Zocdoc and Turo use none.

**Detail block:** an icon-plus-text row list is the dominant shape (Angi, IKEA, Square Go), with pin,
calendar, clock and person icons. Best Buy uses "label: value" pairs instead, which reads more like a
receipt.

**Post-confirmation upsell exists and is normal.**
[Zocdoc](https://mobbin.com/screens/c0e52667-413d-4cd0-a587-85075e0335ad) renders "Check another exam
off your list:" with two cards, each an illustrated icon plus a "Book now" button.

**The anti-pattern.** [Turo](https://mobbin.com/screens/9ee57a93-d1fc-4c75-a833-e028f255f89a) stacks
three brand-coloured calendar buttons (Google blue, Outlook blue, Apple red) and then prints a raw,
wrapping URL as the "save this link" affordance.

---

### 2.14 Toast

Seven apps. The component is small and the rules are tight.

* **One sentence naming the exact object.** Google Drive quotes the filename: "IMG_9853.JPG moved to
  Work" ([screen](https://mobbin.com/screens/db60a3e2-1e3a-414c-926e-2776b2f5dfcd)). CHOPT names the
  item: "Miss Vickie's Chips - Salt & Vinegar added to cart"
  ([screen](https://mobbin.com/screens/fa70101b-9b13-4e56-8f78-f8566b246f46)).
* **One text action, usually Undo,** in 6 of 7. CVS adds an **outlined pill Undo plus an X dismiss**
  ([screen](https://mobbin.com/screens/f8dca081-488d-4e7c-b79f-9f9281222c3a)), the most complete
  variant I saw.
* **It docks beside existing chrome, never on top of it.** Google Photos sits directly above the
  action bar, CHOPT directly above the cart bar, Fresha directly above the Book bar.
* **Position is not settled.** 4 bottom (Google Photos, Google Drive, CVS, CHOPT), 3 top (Medium,
  Todoist, Kitchen Stories). No convergence in this sample.
* **Container colour is not settled either.** 4 dark neutral, 1 green (Kitchen Stories, success),
  1 brand yellow (CHOPT), 1 white pill (Todoist). Solen's locked white-pill recipe sits inside the
  observed range.

---

### 2.15 Policy block, trust card, and inline banner

Three components Solen has no shared implementation of, and all three carry legal or trust weight.

**Policy block.** The best example is
[Navan](https://mobbin.com/screens/2fceec81-80fd-4976-820c-6a7166971db5): the cancellation policy is
a **vertical timeline**, two nodes joined by a line, each node carrying a bold rule ("Change or
cancel for free until Oct 13, 2024, 4:00 PM"), a timeframe ("Until the evening of check-in day"), and
the consequence ("Change or cancel your booking without penalty"). It turns a paragraph into a
scannable structure. Simpler variants: Airbnb's one-line "Free cancellation / Cancel before Sep 4,
12:00 PM (EDT) for full refund" plus an underlined "Full policy"
([screen](https://mobbin.com/screens/992ccadf-13af-4938-a38d-61257ef03143)), and Careem's info
callout with an info icon and a right-aligned "Details" link
([screen](https://mobbin.com/screens/a030486a-580e-4b86-b331-2b7cdddf94c8)).

**Trust card.** [Peerspace](https://mobbin.com/screens/e248dc48-cf8e-4ad9-8f2c-1d730f639d12) renders
a bordered card with a check icon, "Protect your payments", a paragraph explaining that paying off
platform loses fraud and cancellation protection, and "Learn More".
[Keeta](https://mobbin.com/screens/5d88c716-6cb8-445d-8551-d457eb8173e2) uses a compact **3-cell
trust row** instead ("36 min / On-time Promise", "Free / delivery", "Keeta / Delivered by").

**Inline banner.** Distinct from a toast because it is persistent and participates in layout.
[Uber Eats](https://mobbin.com/screens/fdf7278b-f5de-45b9-9763-de29563cd644) uses a gray one with an
info icon and a dismiss X inside the list, Careem a pale blue-gray one inside the flow, Keeta a
pale-yellow strip above the cart bar.

**Urgency variant, and I flag it as a pattern Solen should probably not copy.**
[Navan](https://mobbin.com/screens/2fceec81-80fd-4976-820c-6a7166971db5) shows "Time left to book
27 min : 54 sec" in a tinted box. It is a real component in the corpus. It is also exactly the kind
of manufactured scarcity Solen's ethics lines rule out unless the timer reflects a genuine inventory
hold.

---

### 2.16 Entity card (salon card)

Included because the corpus contains the compound version Solen's search-to-PDP relationship needs.

**[Fresha web's venue card](https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8) is a
salon card with a services list and a slot row inside it:** photo with dot pagination, name, rating
plus star row plus count, location line, then per-service rows (name, duration, price), then a row of
three time chips plus an overflow chip, then "See more". A user can book from the search results
without opening the PDP. That is the highest-information card in the whole corpus.

**Unavailable variant.** [DoorDash](https://mobbin.com/screens/aa990a6c-2036-42ac-84e5-3bf5ca3c6030)
keeps closed stores in the grid, dims the logo, and adds a coloured next-availability line "Opens Fri
at 10:00 AM" plus a gray "Closed". The card is never removed and never rendered as a grey box.

**Airbnb's card has no border and no shadow at all**
([screen](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2)): a flush photo, then
text. It relies entirely on the photo edge for separation, which is option (b) of Solen's
edge-visibility floor.

---

## 3. Cross-cutting laws the corpus supports

1. **The four variants are slots on one component, not four components.** Fresha's service row is one
   row with a swappable right affordance. Zocdoc's availability cell is one cell with an "n appts" or
   "No appts" state. Square Go's slot group is one group with an "All booked" ghost chip. Products
   that designed the states got a state machine; products that did not got a blank screen.
2. **Empty is almost always local, not global.** The strongest empty handling in the corpus is a
   sub-state inside a populated screen (Square Go's "All booked", Uber Eats' "No one has joined yet",
   Fresha web's "No reviews yet", Zocdoc's "No appts", Angi's "No ratings or reviews yet"). The
   full-page empty state is the fallback for when a whole surface is empty, not the default.
3. **A missing value renders as an honest word, never as a zero.** "No reviews yet" beats "0.0".
   Observed in Fresha web and Angi. Nobody rendered five grey stars.
4. **Loading preserves geometry.** Skeletons match the final layout, buttons keep their size and swap
   their label for a dot-pulse, and a single stale field gets a bar while the rest of the row stays
   live. Nothing reflows.
5. **Spinners are for buttons, skeletons are for content.** 8 of 8 loading screens used skeletons.
   The only spinners I saw were inside a button (Angi) or replacing a button's label (Fresha web).
6. **Errors keep the shell when the shell still works.** 4 of 8 error screens preserved their nav and
   filters. A network failure in one section is not a reason to blank the page.
7. **Long content clamps and links, it never truncates a number.** Prose clamps with an inline "Read
   more", "See all" or "Show more"; price, duration, rating and count are always nowrap.
8. **The commit bar is a stack, not a row.** Four separate apps put a banner or a toast between the
   content and the action row.

---

## 4. Verdict for Solen

I read the working tree before writing this section. Every file path and line number below is
something I opened or grepped, not something I inferred from the registry.

### 4.1 What Solen already has, and should stop worrying about

* **`app/[locale]/_components/primitives/DateTimePicker.tsx`** (820 lines) is the one booking
  component this estate genuinely consolidated. It owns both the calendar and the `dateLayout` strip,
  it exports `DateTimePickerRange` for the dashboard, it already carries `noSlots` and `noSlotsHint`
  labels plus an `emptySlotContent` escape hatch (lines 73-74, 86-87, 126-127, 536-538), and a grep
  for slot rendering (`slots.map|timeSlots.map|availableSlots`) returns **only this file and
  `homepage/BentoBusiness.tsx`**. Four real call-sites: `dashboard/settings/page.tsx`,
  `homepage/SearchBar.tsx`, `booking/RescheduleSheet.tsx`, `booking/DateTimeStep.tsx`. This is the
  model the rest of the inventory should be held to.
* **`primitives/TabPill.tsx`** has 8 non-dev call-sites and the underline-versus-pill split already
  matches what the corpus does.
* **`primitives/Toast.tsx`**, **`Skeleton.tsx`**, **`SkeletonCard.tsx`**, **`Avatar.tsx`**,
  **`Sheet.tsx`** and **`SectionErrorBoundary.tsx`** all exist and are real.

### 4.2 The contradiction I have to surface before the recommendations

**`components-legacy/ui/EmptyState.tsx` lines 70-76 render exactly the thing the project's own
`states` lock forbids by name.**

```tsx
<div className="relative mb-5 flex items-center justify-center w-16 h-16">
  <div className="absolute -inset-5 rounded-full blur-xl bg-s-bg-sunken" />
  <div className="relative flex items-center justify-center w-16 h-16 rounded-[20px] bg-s-bg-sunken">
    <Icon size={32} className="text-s-ink-2" strokeWidth={1.5} />
  </div>
</div>
```

The locked `states` row in `CLAUDE.md` says the empty state carries "a 3D category icon
(`/icons/categories/`) or ghost-preview, **NEVER a grey Lucide disc**". This is a 64px
`bg-s-bg-sunken` tile holding a grey `text-s-ink-2` Lucide icon, with a blurred grey halo behind it.
NEVER-AGAIN floor 4 ("no muted focal") independently bans the same thing. The registry lists this
component as locked.

The corpus agrees with the floors, not with the code: of the 8 empty states I examined, **5 use a
coloured or illustrated focal, 1 uses a semantic-coloured line icon, 2 use no icon at all, and 0 use
a grey icon on a grey disc.** [Fresha](https://mobbin.com/screens/cd4349f4-318d-405d-97b9-15c413db3dd3)
uses a violet-gradient 3D calendar; [Redfin](https://mobbin.com/screens/e73a3ea0-fdf2-49b4-a4b0-e8b8021b9cec)
uses a red-outline icon plus a headline large enough to serve as the screen's display anchor.

Secondary problem in the same file: line 78 renders the optional eyebrow as
`uppercase tracking-[.22em] text-s-ink/30`. Ink at 30 percent opacity is far below the AA text floor,
and tracked-uppercase eyebrows are on the owner-rejected list.

**Fix, concretely:** replace lines 70-76 with either a `/icons/categories/` 3D asset (the `illustration`
prop at lines 60-69 already builds half of this slot) or a clean ink glyph, and delete the
`bg-s-bg-sunken` tile plus the blur halo. Change line 78's colour token to `text-s-ink-2`, or delete
the eyebrow prop.

### 4.3 The three missing components, ranked by how much drift they are causing

**G1. `StickyActionBar` does not exist. Nine files hand-roll it.**

Verified by grep for `fixed bottom-0|sticky bottom-0`, plus the one that uses `fixed inset-x-0
bottom-0` and therefore escapes that grep:

```
app/[locale]/partner/page.tsx
app/[locale]/onboarding/salon/page.tsx
components-legacy/booking/DateTimeStep.tsx
components-legacy/booking/StaffStep.tsx
components-legacy/booking/PayConfirmStep.tsx
components-legacy/booking/ServicesStaffStep.tsx
components-legacy/refund/UpchargeApproveView.tsx
components-legacy/refund/RefundCaseView.tsx
app/[locale]/_components/salon/SalonMobileBookBar.tsx:75
```

Four of those nine are consecutive steps of the same booking wizard. This is precisely FLOORS LAW 8
("the same thing looks the same everywhere") and FLOORS LAW 9 ("screens are composed, not drawn"),
and the `sticky CTA` row of the design contract already names two of these implementations as if they
were canonical.

The component the corpus describes has four slots, two of which `SalonMobileBookBar.tsx:75` already
implements correctly:

* a **stack slot above the action row** for a banner or toast (Fresha, Keeta, CHOPT, Skip all use it)
* a **value slot** on the left, optionally expandable (Careem's tappable "Total / AED 109.00")
* an **action slot** with `disabled` and `loading` states (Booking.com's grey Confirm, Fresha web's
  dot-pulse Apply)
* the gradient fade and safe-area inset, already correct in `SalonMobileBookBar.tsx:75`

Build it at `app/[locale]/_components/primitives/StickyActionBar.tsx`, port `SalonMobileBookBar.tsx`
onto it first because it is closest to correct, then the four wizard steps.

**G2. `PriceBreakdown` does not exist, and the row is already duplicated verbatim.**

`components-legacy/booking/PayConfirmStep.tsx:461`, `:467`, `:478`, `:484`, `:490` and
`app/[locale]/walk-in-pay/page.tsx:539`, `:543`, `:548` carry **the same literal Tailwind strings**:

```
flex items-baseline justify-between gap-3 text-[14px]                              // line item
flex items-baseline justify-between gap-3 text-[13px]                              // fee / surcharge
mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-2.5   // total
```

That is a copy, not a shared component, and it sits on the two screens the trust floor
(hierarchy-density-05) governs. The component is the natural enforcement point for that floor: if
`<PriceBreakdown>` requires a total and renders the surcharge and VAT rows from data, a paid screen
physically cannot ship without the breakdown. Today the floor is enforced by a human remembering, and
`walk-in-pay/page.tsx` is the exact file that already shipped once with a defined-but-never-rendered
cancellation policy.

Build it at `primitives/PriceBreakdown.tsx` with a `<PriceRow>` child supporting the four variants the
corpus shows: plain, `info` (an info affordance, as in
[Uber Eats](https://mobbin.com/screens/e9d30576-6c0d-4213-b4b1-689a38c6760e)), `struck` (original
price line-through plus new value, same screen), and `subLabel` on both sides
([Airbnb refund](https://mobbin.com/screens/cafad2e7-0065-483c-9f51-5b55ecd4fbb1)). Solen already has
the struck-price recipe inside `salon/SalonBundles.tsx`; lift it rather than reinvent it.

**G3. `ServiceRow` does not exist. Ten files render a service line.**

Grep for `duration_minutes|dauer|Min\.` across the PDP and booking directories returns:

```
_components/salon/SalonServices.tsx      _components/salon/SalonBundles.tsx
booking/RescheduleSheet.tsx              booking/BookingWizard.tsx
booking/ServiceDetailSheet.tsx           booking/DateTimeStep.tsx
booking/PayConfirmStep.tsx               booking/BookingCard.tsx
booking/ServicesStaffStep.tsx            booking/BookingConfirmation.tsx
```

The corpus says these are one component with a swappable right affordance
([Fresha PDP](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9) outline pill,
[Fresha sheet](https://mobbin.com/screens/507e9cfb-c682-478a-ae2f-9f59cbea37b2) circular plus,
[Keeta](https://mobbin.com/screens/a4f18a2e-0387-490d-86c0-cc794426d39f) stepper once quantity is
above zero). A single `<ServiceRow name duration price affordance={...}>` collapses all ten.

### 4.4 Six smaller, cheap wins the corpus hands over

1. **Slots should carry their own facts.** Solen's `DateTimePicker` `TimeSlot` type (line 44) is the
   right place for an optional capacity or price field, so a slot can render "noch 2 Plätze" the way
   [Airbnb](https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108) and
   [Calendly](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02) do. Only if the number
   is real; no-fabrication still binds.
2. **Group empty slots instead of emptying the picker.** Square Go's per-group "All booked" ghost chip
   ([screen](https://mobbin.com/screens/8b69dfc2-0028-4364-afc5-ed5820644be3)) is a better `noSlots`
   treatment than one message, because it says *when* to look rather than *that* you failed.
   `emptySlotContent` (line 126) already accepts a node, so this needs no API change.
3. **Put the count in the tab label.** `SalonServices.tsx` uses `TabPill` for its category chips, and
   [TheFork](https://mobbin.com/screens/5a6057a9-5f85-4f94-a995-6be47e70fbcc)'s "Salades (8)" is a
   real number from real data. It directly serves the richness ceiling (hierarchy-density-03) by
   telling a user that a category holds 40 services before they scroll into it.
4. **The staff picker needs "Any team member" as a tile, not a row.** `salon/SalonTeam.tsx` is a
   horizontal avatar carousel and `booking/StaffStep.tsx` is the picker. Fresha
   ([screen](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122)) and Careem
   ([screen](https://mobbin.com/screens/e598c417-d736-42de-b60e-a14818c75da5)) both make the
   no-preference option a first-class member of the same grid, with an icon where the avatar goes.
   `primitives/Avatar.tsx` already has an initials fallback, so this is a composition, not a new
   component.
5. **Reviews need a Translate affordance.** de/en/fr/it means a German review will land in a French
   user's list on day one. [Etsy](https://mobbin.com/screens/7afe0804-30cb-4ea0-bc05-78a9b2976105) is
   the only app in 132 screens that showed me this, as a blue text link beside the stars. The sites
   are `salon/SalonReviews.tsx` and `reviews/_components/MarketplaceReviewsList.tsx`.
6. **Extract `RatingSummary` out of `SalonReviews.tsx`.** The big numeral plus stars plus count plus
   five distribution rows is stable across 8 of 8 apps, and Solen renders it on at least three
   surfaces (PDP, `/reviews`, dashboard review moderation). Use **counts, not percentages**: a
   percentage over four reviews is misleading, and 4 of the 8 apps chose counts (their reason is
   inferred from the choice, not stated by them).

### 4.5 Two things I deliberately do not recommend

* **Do not copy Fresha's saturated selected chip.** Fresha uses black on iOS and brand purple on web;
  Solen's lock is the calm gray `#F4F4F5` fill, set by the owner on 2026-06-29. Solen is the minority
  position here. I am recording that, not reopening it.
* **Do not copy Navan's booking countdown**
  ([screen](https://mobbin.com/screens/2fceec81-80fd-4976-820c-6a7166971db5)). It is a real component
  in the corpus and it is manufactured scarcity unless a real inventory hold backs it. Solen's ethics
  lines already rule this out.

---

## 5. What I could not verify

* **No motion data.** Mobbin frames are static. Every claim here is about anatomy and state, never
  about transition, duration or easing.
* **No slot-grid loading state anywhere in the corpus.** Nine apps render availability and not one of
  the returned frames caught the fetch. Solen will have to design this without a reference.
* **No error variant for the price breakdown, the slot grid, or the service row.** Only page-level
  and section-level error states appeared.
* **Airbnb, Calendly and Uber Eats findings rest on single-app samples** (8 screens each from one
  product). Their internal consistency is high; their generality is unproven by this corpus.
* **I did not measure any pixel value.** Every size word in this document ("small", "large", "big
  numeral") is a relative reading of a screenshot, not a measurement. Where an exact number matters
  for a build it needs `pixel-spec-auto` or a live `getBoundingClientRect`, not this file.
* **I did not verify Solen's rendered output.** The Solen half of section 4 comes from reading source
  files and grep output. Claims about what those files *render* would need the dev server and a
  screenshot, which is outside this axis.

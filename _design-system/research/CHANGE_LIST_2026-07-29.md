# CHANGE LIST, 2026-07-29

The answer to: "what we should change, component wise, how we should add motion or design, what we
should do with the grid, how we should align, what font we should use."

**Exists-check:** `_design-system/research/` already holds `AXIS_GRID.md`, `AXIS_ALIGNMENT.md`,
`AXIS_FONT.md`, `AXIS_TYPE.md`, `AXIS_COLOR.md` and the per-screen `CORPUS.md` files under
`_design-system/sections/`. This file does not repeat them. It is the decision layer on top: what
changes, in what order, in which file. Nothing here proposes rebuilding anything in
`_design-system/REMOVED.md`.

---

## Provenance, so you know which claims carry which weight

Three kinds of statement live in this file and they are not equally strong.

- **Repo facts.** Grepped and read on 2026-07-29 in
  `/Users/sulo/Documents/solen/.claude/worktrees/quirky-ellis-ef5559`, branch
  `claude/principles-security-audit-0ae738`. Every file:line here was opened. These are checkable in
  thirty seconds and you can hold me to all of them.
- **Corpus observations.** Made by the research agents against Mobbin screenshots, not by me. Sample
  sizes are carried through verbatim: 110 PDP screens across 38 apps, 84 home-feed screens across 44
  apps, 63 search-result screens across 30 brands, plus the five axis sweeps (30 screens pixel
  measured for grid, 51 rows pixel measured for alignment). Mobbin serves downscaled images, so no
  absolute pixel value is ever claimed about a competitor.
- **My recommendation.** Named as such, with the cost of taking it named too.

**Not a census.** Mobbin's corpus is curated. Booksy, Treatwell, Vagaro, StyleSeat, Squire, Mindbody
and SimplyBook.me returned zero on-archetype screens across every named search in every sweep. This
research says nothing about them. The only beauty-booking products actually observed are Fresha and
Square Go.

---

# PART 1: THE TEN CHANGES

Ranked by how fast you would notice, opening the product yourself, not by engineering size.

---

## 1. List rows: make the icon, the text and the arrow sit on one line

**Plain:** In our menus and settings lists, the little icon on the left, the label, and the arrow on
the right do not all sit at the same height. On some rows they do, on others they are off by four or
five pixels, and the rows that are off are the ones with a second line of text under the title.
Airbnb's are all on one line, always.

**Files.**
- `app/[locale]/_components/layout/MobileMenu.tsx:255` (Dashboard row, two lines of text,
  `flex items-center justify-between`)
- `app/[locale]/_components/layout/MobileMenu.tsx:428` (MenuRow, one line,
  `flex w-full items-center justify-between gap-3 px-4 py-3.5`)
- `app/[locale]/profile/settings/page.tsx:138` (Row, `flex items-center gap-[14px]`, has a `sub`
  branch at line 144 that no caller uses)
- `app/[locale]/dashboard/settings/page.tsx:1408`
- `app/[locale]/help/page.tsx:163` (no leading icon)

**Corpus evidence.** Airbnb iOS Account settings, all 9 rows measured: worst case spread between the
icon centre, the label cap-height centre and the chevron centre is 1.0 preview pixel, which converts
to about 1.3 points. Mean spread 0.39 pixels. Screen:
[mobbin.com/screens/936fbfe8](https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64). The
alignment reference is the text line box, not the ink of the glyphs: measured on the same 9 rows,
mean error against the icon centre is 0.72 px using the ink bounding box and 0.28 px using the cap
band, and every row containing a descender (Login & security, Privacy, Payments, Accessibility)
sits 1.0 px low on the ink measure while every row without one sits high. That sign pattern has no
overlap.

Full detail and the settled verdict is in PART 3. This is the item you raised and it is first
because you were right.

**Mockup first:** yes. It moves pixels on every list in the product.

---

## 2. One salon has to look like one salon

**Plain:** The same salon renders as four different objects depending on which screen you are on.
Home gives you a photo card. Your saved list gives you a three photo collage at a different shape
with a different name size and no price. Search gives you a third thing. Twelve more files draw
their own version from scratch.

**Files.** Three real card components ship at once:
- `app/[locale]/_components/homepage/SalonCard.tsx` (550 lines, 6 external importers,
  `aspect-[5/4] rounded-[22px]`, name 14px via `CardName`, price via `PriceFrom`, line 426)
- `app/[locale]/_components/search/SalonResultCard.tsx` (2 external importers, 4 more files import
  only its label constants)
- `components-legacy/SalonCard.tsx` (7 external importers)

Twelve more files hand build a salon tile (clickable, salon photo, salon name, link to
`/{locale}/salon/{slug}`, importing none of the three). The measured ratio is **12 hand built
against 15 composed**. The worst pair, one tap apart:

| | Home | Saved list |
|---|---|---|
| file | `homepage/SalonCard.tsx:426` | `profile/ProfileTabs.tsx:245` |
| photo | one, `aspect-[5/4]` | three tile collage, `aspect-[195/131]` |
| radius | `rounded-[22px]` | `rounded-card` (16px) |
| name | 14px, `CardName` | 16px, `font-medium`, hand written |
| price | `PriceFrom` | none |

**Corpus evidence.** Card photo above the text, photo the largest element: 16 of 19 home-feed screens
whose cards are a bookable place or person. Fresha
([33f7d0bd](https://mobbin.com/screens/33f7d0bd-2edc-4768-a4a4-7de2b9b90489)), Airbnb
([41e035de](https://mobbin.com/screens/41e035de-eb59-433c-a13a-b2367812536f)), TheFork, DoorDash.
Three apps out of 34 do run two anatomies for the same entity on one screen (Fresha's Book-again row
next to its Favourites card,
[781cf27c](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691); ClassPass; Resy), so it
is survivable. Our own FLOORS LAW 8 is stricter on purpose, and it is stricter for a reason we can
see in our own repo: their two anatomies are two variants of one component, ours are twelve
independent files that will drift apart forever.

**The change.** `SalonCard` gets named variants (`full`, `collage`, `row`, `thumb`). Every one of the
twelve hand built tiles composes a variant. `components-legacy/SalonCard.tsx` and
`SalonResultCard.tsx` become variants of the same component or get deleted after their callers move.
This is a `/refine` job with a reviewer, not a hand edit.

**Mockup first:** yes, one mockup showing all four variants side by side so you approve the family,
not four separate approvals.

---

## 3. Buttons: there is no Button component, and it shows

**Plain:** Every button in the product is drawn by hand where it sits. The primary black button is
written 443 times and its corner rounding is spelled twenty different ways. Three of those spellings
produce the identical pill shape.

**Files.** `find app components components-legacy -iname "Button*.tsx"` returns **nothing**. There
is no `Button`, no `PrimaryButton`, no `CTA` component anywhere. `SeeAllButton.tsx` and
`BackButton.tsx` are navigation affordances, not a button primitive.

Measured: 249 files contain a `<button` element. 443 className strings contain `bg-s-ink`, the locked
primary fill. Their radius spellings:

```
rounded-full  142     rounded-btn   110     rounded-pill   66
rounded-[12px] 16     rounded-[16px]  8     rounded-[10px]  6
rounded-md      5     rounded-xl      3     rounded-sm      3
rounded-[6px]   3     ... 10 more at 1 to 2 each
```

`rounded-full`, `rounded-btn` and `rounded-pill` are three names for the same 9999px pill, 318
callsites between them. Two are our tokens, one is stock Tailwind.

**Corpus evidence.** Not a corpus finding. This is a repo finding and it needs no external
justification: one visual result, three token names, twenty spellings.

**The change.** Build `components/ui/Button.tsx` with exactly the variants the contract already
locks: `primary` (ink fill, pill, h-11 minimum, 15px never below 13), `secondary` (neutral outline),
`ghost`, `icon` (h-11 w-11). Then sweep the 443 sites. Delete `rounded-btn` and `rounded-pill` from
`tailwind.config.js` once nothing references them.

**Cost of doing this, named.** A 443-site sweep will change the rendered radius on the 46 sites
currently spelling a non-pill value (`rounded-[12px]` and friends). Some of those are deliberate,
for example a square-ish action inside a card. The sweep has to read each one, which is why it is a
reviewer-graded loop and not a regex.

**Mockup first:** yes, one page showing all four variants at all states.

---

## 4. Search results carry no bookable time, and the data is already there

**Plain:** Our search result card tells you "heute 15:30" as a sentence. Fresha's gives you three
tappable time chips. Ours is a fact, theirs is a booking. We already fetch the slots and then throw
them away.

**Files.**
- `app/[locale]/_components/search/SalonResultCard.tsx:74` declares `slots?: string[] | null`
- `app/[locale]/_components/search/SalonResultCard.tsx:183` defines `formatSlotTime()`
- Grep for a callsite passing `slots` to this component returns **zero**. The only `slots={` in the
  repo are `DateTimePicker.tsx:174`, `RescheduleSheet.tsx:210` and `DateTimeStep.tsx:202`, all
  unrelated.
- `app/[locale]/_components/search/SearchTemplate.tsx:887` sets `sp.set("with_slots", "1")`, so the
  API is asked for the data
- `app/api/salons/route.ts:85` reads it, `:517` and `:571` attach the per-salon services
- `app/[locale]/_components/search/SearchTemplate.tsx:1702` passes `nextSlot={nextSlotLabel(...)}`,
  a formatted string

So: fetched, transported, and dropped one line before render.

**Corpus evidence.** Tappable time slots on the result row appear in 4 of the 5 observed apps that
book a time. Fresha iOS
([f397bc85](https://mobbin.com/screens/f397bc85-dda6-42d5-8704-f7383b037285)) and Fresha web
([612f2a56](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937)) both render three
outlined chips per service plus an overflow control. Resy
([e4f524c1](https://mobbin.com/screens/e4f524c1-e8e3-4e25-bb4c-b736d43c28a1)) renders filled slot
buttons each captioned with the room, and a bell "Notify" when there are none. TheFork
([b448f1f5](https://mobbin.com/screens/b448f1f5-8a43-4b81-8d00-60a95cf8c0a9)) tags each chip with its
discount. Zocdoc
([53728922](https://mobbin.com/screens/53728922-3e77-4e0e-aef2-3c267714d5ec)) uses date tiles, filled
when slots exist and greyed "No appts" when not. The fifth, CVS Health, substitutes a "View next
available" link.

This is the single largest competitive gap found across all ten screen archetypes, and Fresha, our
locked structural reference, does it on both platforms.

**Cost, named.** Slot chips on a result card make the card taller, which pushes fewer results into
the first viewport and collides with the density floor's "4 content units mobile". Fresha solves it
by showing chips for one service, not all. Match that.

**Mockup first:** yes.

---

## 5. The PDP book bar is an empty button

**Plain:** The sticky bar at the bottom of a salon page is one black pill and nothing else. Every
comparable app puts a fact next to the button.

**File.** `app/[locale]/_components/salon/SalonMobileBookBar.tsx:78`, a single
`w-full ... rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white` link. Nothing else in
the bar.

**Corpus evidence.** 15 of the 21 mobile apps with a visible bottom edge carry a persistent commit
bar, and 9 of those 15 put information beside the button, not only the button:
- Airbnb: underlined price, "For 2 nights Sep 5 to 7", green check "Free cancellation"
  ([8a6b4476](https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3))
- Viator: "From $25.65" plus underlined "Lowest Price Guarantee"
  ([64198080](https://mobbin.com/screens/64198080-a871-4db1-81b0-a6f674a1ece8))
- Fresha: "136 services available"
  ([f2b83609](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9))
- Square Go: "Availability Saturday at 1:00am"
  ([535049c6](https://mobbin.com/screens/535049c6-d9c5-4ad4-ae95-c2d249cb16ee))
- Peerspace: "$35/hr" plus stars plus "67"
  ([ca59de9e](https://mobbin.com/screens/ca59de9e-3cf4-4f93-988b-cf9c0118b1b0))

**The change.** Put a live count we already hold next to the button: service count, or rating plus
review count. **Do not copy Airbnb's price line.** On the PDP no service is selected yet, so any
price would be invented, and under the Price Indication Ordinance an invented price is worse than no
price.

**Mockup first:** yes.

---

## 6. Empty states read as unfinished, and most seed salons hit them

**Plain:** When a salon has no services or no reviews, we print one grey sentence. Our own locked
rule says that slot takes a real empty state with a headline, a subline, a button and an icon.
Pre-launch, this is the state most of our catalogue actually renders.

**Files.**
- `app/[locale]/_components/salon/SalonServices.tsx:72-80`, renders
  `<p className="font-body mt-4 text-[14px] text-s-ink-2">Dieser Salon hat noch keine Services
  hinterlegt.</p>`
- `app/[locale]/_components/salon/SalonReviews.tsx:158-168`, two branches, both a bare
  `<p className="font-body mt-5 text-[14px] text-s-ink-2">`
- `components-legacy/ui/EmptyState.tsx` exists and 26 files already import it. The PDP does not.
- `app/[locale]/_components/search/SearchTemplate.tsx:2201` hand rolls its own empty state under a
  comment that reads, in the code, "EmptyState, per LoadingStates.md Pattern 2". The same file hand rolls a
  skeleton at `:252` and an error state at `:2362`, both with the same kind of comment, while
  `app/[locale]/_components/primitives/SkeletonCard.tsx` and `components-legacy/ui/ErrorState.tsx`
  both exist.

Writing "per LoadingStates.md Pattern 2" above a hand-rolled copy is the drift mechanism in its
purest form. The author read the doc and still did not import the component.

**Corpus evidence.** 8 apps render a structured thin state rather than hiding the module or faking a
number. Fresha does two things we do not: it shows "No reviews yet" **and disables the Book button**
when there is no bookable inventory
([b239767c](https://mobbin.com/screens/b239767c-f3eb-4602-852d-03715690388c)), and it gives an
offline venue an iconed block with a real explanation
([8c8faa36](https://mobbin.com/screens/8c8faa36-57f6-4860-bf1a-58df3d7eb05f)). Fresha's team card
omits the rating for an unrated stylist while her colleague shows 5.0
([d6c9c76b](https://mobbin.com/screens/d6c9c76b-4812-4b60-8758-57390ae4d122)). Airbnb, Time2book,
Zillow and Nextdoor all do a version of the same.

**Mockup first:** yes.

---

## 7. Desktop home opens with no salons on screen

**Plain:** On a laptop, the first thing you see is a headline and a search bar filling almost the
whole screen. No salon, no photo, no category. You have to scroll before the product appears.

**Files.**
- `app/[locale]/_components/homepage/Hero.tsx:114`, `md:min-h-[92dvh]`, and the file contains no
  `<Image>`
- `app/[locale]/_components/homepage/MobileCategoriesRow.tsx:76`, `md:hidden`, so the category
  shortcut strip does not exist on desktop at all

**Corpus evidence, both sides, because this is a live collision and not a defect.** Of 11 web home
feeds observed, **1** opens with a zero-photo near-full-viewport hero: Fresha
([0b68f8e9](https://mobbin.com/screens/0b68f8e9-3c79-4302-83c6-990eefc611d7)). The other ten (Airbnb,
DoorDash, Uber Eats, Etsy, Faire, Klook, Eventbrite, Airtasker, Givingli, Instacart) put real
content in the first viewport. Fresha is our declared structure axis, so ours is a defensible
minority position, not drift. It still collides with our own imagery floor, which is a dated
owner-approved rule.

Separately, 8 of 11 web feeds carry a category shortcut strip on desktop (DoorDash
[e0ddd0d5](https://mobbin.com/screens/e0ddd0d5-254b-499d-a15e-649bb1d52bde), Uber Eats
[8d7b3c5e](https://mobbin.com/screens/8d7b3c5e-0630-406f-9f61-27a9ac5de7a5), Eventbrite, Klook,
Faire). Only Fresha (categories inside the search dropdown) and Instacart (left sidebar) do it our
way.

**The change both sides license:** shorten the hero until the first salon row crops into view. **Do
not add a hero image.** You rejected a baked-in hero photograph three times, most recently
2026-07-25, and the corpus is literally on your side: **0 of 34** home screens sampled carry a
decorative hero photograph. Give the desktop strip a variant of `MobileCategoriesRow`, never a
second component.

**Mockup first:** yes, and this one needs your decision before build. It is the only item in this
file where two owner-dated rules point opposite ways.

---

## 8. Type: the heading font is on things that are not headings

**Plain:** Our display font plus its letter tightening is applied to every heading tag at any size,
including 12 and 14 pixel labels where the effect is invisible and two tightening operations stack.
And 80 percent of our text sits inside a two pixel band, so the screens read flat even though the
size count is legal.

**Files.**
- `app/globals.css:128-133`, the `h1,h2,h3,h4,h5,h6` rule: Inter Tight plus
  `letter-spacing: -0.025em`, with no size condition. 49 heading tags in the repo carry
  `text-xs`/`text-sm`/`text-base`. Separately 52 sites combine `font-heading` or `font-display` with
  `text-xs`/`text-sm`.
- `tailwind.config.js` extends **no** `fontSize` scale at all, so all 9 sizes are Tailwind defaults
  and a tenth is one keystroke away.
- Size usage across `app/` and `components/`, 1023 occurrences: `text-sm` 474 (46.3%), `text-xs` 342
  (33.4%), `text-base` 68 (6.6%), everything else under 50 each. **79.8% inside a 2px band.**
- Weight usage, 2219 occurrences: 68.1% are weight 600 or heavier.
- `app/layout.tsx:18` claims "24 live font-extrabold/font-black callsites found 2026-07-26". Grepped
  today: 4 occurrences, all inside comments, zero live. The comment is stale.

**Corpus evidence.** Fresha's web PDP runs 5 size tiers across roughly a 3.5x range from breadcrumb
to H1 ([3b350009](https://mobbin.com/screens/3b350009-ac82-47e6-b704-056f8888444d)). Our ceiling of
4 sizes is defensible and matches the corpus norm of 4 to 5 tiers. The difference is spread, not
count. On weight: Fresha iOS services renders only the service name at a non-regular weight, with
duration and "from $40" both regular
([f2b83609](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9)). Uber renders the ride
name and its price at the same weight
([1634d7c8](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea)). Stripe carries
hierarchy in size alone and leaves weight unused in the row
([80054ec0](https://mobbin.com/screens/80054ec0-bb9d-4438-9a66-4f7bcd8f103f)).

Full answer in PART 2, FONT.

**Mockup first:** yes.

---

## 9. Grid: the search heading and the search results do not share a left edge

**Plain:** On the search page the "N Salons" line starts 16 pixels from the edge and the grid of
results below it starts 12 pixels from the edge. Four pixels of misalignment on the busiest page in
the product. Separately we ship 62 different container widths against a contract that locks 2.

**Files.**
- `app/[locale]/_components/search/SearchTemplate.tsx:1452`, the count and sort row:
  `mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-4 pt-5 md:px-6`
- `app/[locale]/_components/search/SearchTemplate.tsx:1541`, the results grid:
  `mx-auto w-full max-w-[1280px] px-3 pb-12 pt-4 md:px-6`
- Mobile only. Both become `px-6` at `md`.
- `app/[locale]/_components/salon/SalonVenuesNearby.tsx:197`:
  `widthClassName="w-[calc((100vw-44px)/1.25)] md:w-[300px]"`, overriding the default at
  `homepage/SalonCard.tsx:404` which is `(100vw-44px)/1.5` plus a fractional ladder. At 390pt that
  is 277pt on the PDP against 231pt on home, a 1.20x step.
- Container sprawl: 62 distinct `max-w-*` tokens, 49 of them arbitrary pixel values. Top of the
  histogram: `max-w-md` 53, `max-w-[1280px]` 42, `max-w-sm` 40, `max-w-2xl` 32, `max-w-[460px]` 28.
  The two locked values both ship. Sixty others ship beside them.
- No container primitive exists. `components/ui/` holds `card.tsx`, `breadcrumb.tsx` and four
  decorative components.

**Corpus evidence.** Measured across 9 iOS apps: the gutter is a constant and the card is the
variable. Card widths span 2.6x (77 to 199px at render scale) while gutters span 1.6x (7 to 11px), 7
of 9 landing between 8 and 10. Converted, every app's gutter is 10 to 14pt, clustered on 11. Page
margins, converted to points: Airtasker 16, GetYourGuide 16, Fresha 20, Airbnb 24, Warby Parker 25,
Square Go 33. **Our 12px mobile margin on the search grid is below all six.**

On distinct card widths per screen: median 2, ceiling 3, and the separation matters more than the
count. The one sub-1.1x case in the sample (OpenTable, 134 against 128) is also the only one that
reads as two components built separately rather than as a decision. Our 1.20x home-to-PDP step is in
that band. Our 1.30x home-to-search step is not, and reads as intentional.

Full answer in PART 2, GRID.

**Mockup first:** the container primitive is invisible and needs none. The `px-3` to `px-4` change
and the PDP card width change are visual and need one.

---

## 10. Motion: remove one thing, add nothing yet

**Plain:** The desktop sidebar on a salon page collapses as you scroll, leaving a naked button. No
app in the corpus does this, and it hides the only remaining copy of the salon's name once you are
deep in the service list.

**File.** `_design-system/sections/salon-detail/18-sidebar.md` specifies the collapse via `max-height`
plus `opacity` at 300ms. The spec's stated premise is that "the title block has the same info inches
above", which is true at the top of the page and false 2000 pixels down.

**Corpus evidence.** Zero desktop rails found that collapse on scroll. Fresha's and Airbnb's are
static and always expanded. Tripadvisor pins its Reserve button into the collapsed top nav instead
([5df39934](https://mobbin.com/screens/5df39934-c915-43d7-97f3-24b5118768af)).

**On adding motion generally: I cannot answer that from this research and will not invent it.**
Mobbin returns still images. Across all ten screen sweeps, zero transitions, durations, easing curves
or gestures were observed. What the static corpus licenses is only what leaves a visible artefact in
a screenshot, and that is a short list, covered in PART 2, MOTION. Anything about parallax, spring
versus tween, stagger timing or press tiers needs a recorded capture through `reference-lock`, not
Mobbin.

**Mockup first:** removing the collapse is visual. Yes.

---

# PART 2: THE FIVE AXES

Direct answers, not surveys.

---

## COMPONENTS

**Your question: what should we change component wise?**

**Answer: build three primitives that do not exist, then stop hand-drawing screens.**

We have 93 registry rows against 327 component-shaped files (386 exported components). That is 28.4%
coverage by file, 24.1% by export. The gap is not evenly spread. It is concentrated in the three
things repeated most often across the product and owned by nobody:

| Missing primitive | Repeated how many times | Where the drift shows |
|---|---|---|
| `Button` | 249 files contain `<button`; 443 className strings carry `bg-s-ink` | 20 radius spellings, 3 names for one pill |
| `SettingsRow` | 27 non-dev files render a ChevronRight inside a flex row | 5 label offsets, 2 chevron sizes, 4 vertical paddings |
| `PageContainer` / `CardGrid` | `max-w-[1280px]` appears 42 times across 20 files | 62 container widths, 8 gap values on `grid-cols-2` |

`npm run exists SettingsRow` returns 0 with no graveyard hit, so all three are genuinely net new, not
duplicates. Each needs `_design-system/components/<Name>.md` plus a registry row in the same turn.

**Then the composition rule, which is the actual point.** Our worst files are worst in exactly one
way: they draw instead of compose.

- `app/[locale]/_components/search/SearchTemplate.tsx` is **2412 lines** and imports **3** UI
  components (`SalonResultCard:84`, `MapSalonDetail:85`, `CategoryBrowseRails:86`). Everything else,
  the filter pills, the sort segment, the map overlay, the search morph, the sheets, the skeleton,
  the empty state and the error state, is hand written, including three cases where the component it
  is copying already exists.
- `app/[locale]/_components/profile/ProfileTabs.tsx` is **463 lines** and imports **2** (`Avatar:37`,
  `toast:38`). Its search field at `:215` carries four `!important` overrides to cancel the global
  input rule in `globals.css:336-353`, wrapped in a hand built bordered row, while `TextInput.tsx`
  sits unused in primitives.
- `app/[locale]/walk-in-pay/page.tsx` is **627 lines** on a route that takes money and imports 3 non
  icon things (`Spinner`, `WalkInPaymentForm`, `toast`). It hand builds the salon row with a raw
  `<img>` at `:425` and the barber avatar with a raw `<img>` at `:469` while the `Avatar` primitive
  is used by three of the five booking steps.

The contrast is instructive: `app/[locale]/page.tsx` composes 11 components and owns exactly one
`<div>` of its own JSX, and `SalonDetailV3.tsx` imports 21 section components and orchestrates. Those
two are the model. The others are the work.

**Registry hygiene, one item.** `_design-system/COMPONENT_REGISTRY.md:137` advertises
`SalonServicesSheet` at `salon/SalonServicesSheet.tsx` with a full prop API and no caveat. The file
does not exist. `_design-system/REMOVED.md:86` records it as deliberately retired in favour of deep
linking to `/salon/[slug]/booking`, and the registry's own line 238 references that retirement. Line
137 is stale. Delete it. Two other rows (`LoadingStates`, `ProgressStepper`) do not resolve to code
either and both say so in the row itself, which is fine.

**Cost of building three primitives, named.** Every primitive is a migration, and a half-finished
migration is worse than none: two systems live at once and the next person picks whichever they hit
first. That is exactly how we got three salon cards. So each one ships with its sweep in the same
workstream, not as a component landed hopefully.

---

## MOTION

**Your question: how should we add motion?**

**Answer: this research cannot tell you, and the honest move is to remove one thing and add nothing
until we capture real video.**

I will not dress up a guess as a finding. Across 110 PDP screens, 84 home screens, 63 search screens
and five axis sweeps, the number of animations observed is **zero**. Mobbin serves still images.

What the still corpus does license, because the artefact is visible in a capture:

1. **Skeletons mirror the final layout, chrome never flashes.** Uber's loading state
   ([6ab4af73](https://mobbin.com/screens/6ab4af73-4d1f-4a2b-b616-9a0a9e4766e6)) keeps the real
   "Where to" pill fully rendered and replaces only the content below it with a label bar plus a
   large block, repeated three times at the exact positions the real sections occupy. This
   corroborates our locked `<Skeleton>` rule and is an argument against
   `SearchTemplate.tsx:252`'s hand-rolled copy.
2. **The collapsed header swaps content, it does not just appear.** Fresha's overlay circular
   back/share/heart on the photo
   ([daa7dd6f](https://mobbin.com/screens/daa7dd6f-8d5c-4ebe-b82c-a8838d417d80)) become a solid white
   bar with truncated venue name, share glyph and a filled red heart
   ([f2b83609](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9)). Same swap evidenced
   in Resy and Uber Eats.
3. **Save toggles fill, it does not just outline.** Fresha white-outline heart to solid red. Airbnb
   web "Save" to "Saved" plus a toast card
   ([cd605803](https://mobbin.com/screens/cd605803-b697-4c92-872c-c8dba1e5ca73)).
4. **Selection changes the border, not the fill.** Fresha's select-services card goes hairline plus
   plus-icon to accent border plus filled check
   ([6215e2b9](https://mobbin.com/screens/6215e2b9-fff2-495d-a78d-247ff90d313d)). Worth noting
   against our own locked grey-fill selected state: Fresha, our structural reference, also refuses a
   heavy fill, it just signals on the border instead of the surface.
5. **Carousel arrows are disabled-aware.** Fresha web shows a right arrow and no left arrow at scroll
   position 0; Airbnb web greys the left and keeps the right active. Our `SectionTitle` already
   tracks `canScrollLeft`/`canScrollRight` off a passive scroll listener. Nothing to do.

**Not evidenced, and I refuse to guess:** hero parallax, easing curves, durations, spring versus
tween, staggered list entry, scroll snapping, card press feedback, hover elevation, heart-tap
animation, category-tile press tier.

**So the motion work order is:** remove the desktop sidebar collapse (item 10), and if you want new
motion, name the app and the surface and we run `reference-lock` with a real recorded capture. Our own
`_design-system/MOTION.md` and the Motion-22 vocabulary are the source until then. Adding motion off
this research would be inventing it.

---

## GRID

**Your question: what should we do with the grid?**

**Answer: lock the gutter, let the card float, and build the container primitive we never built.**

The single most useful measured finding across 9 iOS apps: **the gutter is the constant and the card
is the variable.** Card widths vary 2.6x across apps; gutters vary 1.6x and cluster on 11pt. Square
Go proves the arithmetic inside one screen: content width 249px, gutter about 8.5px, a 2-up solves to
(249 - 8.5) / 2 = 120.25 against 120.5 measured, a 3-up solves to (249 - 17) / 3 = 77.3 against 77
measured.

That means **card-to-gutter ratio is a derived number, never a spec value.** Write the gutter down
and let the column count produce the card.

Concrete changes:

1. **Build `components/ui/PageContainer.tsx`** exposing only the two locked widths (page 1280, PDP
   1180) with one padding recipe baked in. Replace the 42 inline `max-w-[1280px]` sites across 20
   files. Root cause of the 62-container sprawl is that nothing owns the page.
2. **Build `components/ui/CardGrid.tsx`** owning one column ladder and one gutter pair. Today the six
   `SalonCard` render sites use ladders 1/3/4/5/6, 2/3/4, 1/2, 1/2/3, 1/2/3 and a fixed 300px rail,
   with gutters 12, 12-20, 16, 20 and 24. Repo-wide `grid-cols-2` ships with 8 different gap values
   (`gap-3` x16, `gap-4` x14, `gap-2.5` x8, `gap-2` x6, `gap-12` x4, `gap-8` x3, `gap-3.5` x3,
   `gap-6` x1), a 12x spread. **No app in the corpus varied its gutter by more than 1.6x.** Collapse
   to `gap-3` (12px) mobile and `gap-5` (20px) at md+.
3. **`SearchTemplate.tsx:1541`, change `px-3` to `px-4`.** Two effects: the results grid finally
   shares a left edge with its own heading at `:1452`, and our 12px mobile margin rises to 16px,
   which is the tightest value in the six-app measured sample rather than below all of it.
4. **`SalonVenuesNearby.tsx:197`, drop the `widthClassName` override** and take the `SalonCard`
   default. That kills the 1.20x home-to-PDP width step, the one ratio in our estate inside the band
   that reads as a bug. Search stays at 1.30x because that reads as a decision.
5. **Add a grid-shape floor to `LOCKFILE.md`,** because FLOORS LAW 8 binds anatomy and says nothing
   about geometry. Three clauses: an entity on more than one screen uses the same width or one at
   least 1.3x apart; the gutter is one token per breakpoint product-wide; a fixed-column grid whose
   content falls below one full row renders a ghost cell at column width rather than collapsing.
   That last one is Square Go's measured answer
   ([8b69dfc2](https://mobbin.com/screens/8b69dfc2)) to a real failure: Warby Parker's sparse slot
   picker
   ([69b6baa5](https://mobbin.com/screens/69b6baa5)) leaves an orphan cell and 37% dead space below
   the last interactive element with no sticky action, over our own 30% floor. Square Go instead
   renders a 111px ghost pill reading "All booked" at exactly the live pill width, so the grid keeps
   its shape.

**One thing I am surfacing rather than deciding.** `max-w-[1280px]` is 88.9% of a 1440 viewport,
66.7% of 1920 and 50% of 2560, while 6 of 8 measured web products run browse fluid (Fresha at 92%,
Uber Eats 85.5% plus a nav rail, OpenTable 84.5%). Only the two single-task booking widgets bound
content in a centred card (Cal.com 68.8%, Calendly 70.8%). Our centred browse page is the minority
position. The contract locks 1280 by name and a research file cannot overturn a locked literal, so
this is yours. The narrower version needing no call: search-with-map is a split view, every split
view measured abandons its container, so `SearchTemplate.tsx:1541` could go fluid only when
`mapOpen` is true.

**Two things I found no problem with, stated so you know they were checked and not skipped.** The map
split at `minmax(380px,46%)` (`SearchTemplate.tsx:1542`) sits inside the measured Airbnb-37% to
Fresha-67% range, no change needed. And the default `SalonCard` responsive formula
(`SalonCard.tsx:403-409`: fixed 12px gutter, fluid card, divisor per breakpoint, peek crop) is
exactly what the corpus converges on. We arrived at it independently and I could not find a reason to
touch it, which means on that one I might just be agreeing. Push back on me there.

---

## ALIGNMENT

Short answer here, full settlement in PART 3.

**Your question: how should we align?**

**Answer: satellites align to the title's line box, and you make that structural instead of nudging
margins.**

Three rules, all measured:

1. **Icons, values and chevrons centre on the title line, not on the text block.** Airbnb does this
   on 20 rows across 4 screens and 2 platforms with 0 exceptions.
2. **Money is right aligned, times and dates are left aligned.** Money right alignment is unanimous:
   across 18 money lines in 3 apps the right ink edge is constant to within 1 preview pixel while the
   left edge varies by up to 41 pixels. Times, dates and identifiers are left aligned (Fresha's
   opening-hours table [b47dfaac](https://mobbin.com/screens/b47dfaac-d730-408e-9ade-688c39aa4858),
   Stripe's created-timestamp column
   [9cc54c45](https://mobbin.com/screens/9cc54c45-682a-42a9-9742-5ccb2e54f625)). The principle:
   right alignment exists so magnitudes can be compared by eye. A time has no magnitude anyone
   compares that way and every string is the same length, so right aligning buys nothing and costs a
   ragged left edge. **This is the rule easiest to get wrong, because "it is a number, right
   align it" is the intuitive and incorrect move.** Nothing in `_rules/` currently says it.
3. **The label column is one number product-wide.** Airbnb's is `x = 49 or 50` on all 9 settings rows
   despite icon ink widths ranging 14 to 18px, because a fixed box is centred and the glyph floats
   inside it.

Our money code is already correct and stricter than what could be confirmed in the references:
`walk-in-pay/page.tsx:539-550` uses `flex items-baseline justify-between gap-3` with `shrink-0
tabular-nums` on each amount; `primitives/PriceFrom.tsx:29` carries `inline-flex items-baseline gap-1
tabular-nums`; 41 uses of `tabular-nums` under `app/[locale]/_components`. The gap is that none of it
is written down, so a new price surface has nothing to comply with. Write it into `LOCKFILE.md`.

One scoping note the corpus forced: **Fresha's service list has no price column at all.** Name,
duration, description and "from $40" are all left aligned in one stacked column, and the right slot
holds only the action
([b82c55c4](https://mobbin.com/screens/b82c55c4-339f-41d0-9493-4a6b097da8e8)). Since Fresha is our
locked structural reference, the right-aligned money column belongs on checkout and receipt screens,
not on the service picker.

---

## FONT

**Your question: what font should we use?**

**Recommendation, stated first: keep Inter for body. Keep Inter Tight, but restrict it to 24px and
above. Make the letter tightening size-conditional. Do not change typeface.**

**Why, from first principles rather than from anyone's brand.** I measured both faces locally in
headless Chromium at 100px with all 8 faces confirmed loaded via `document.fonts.check()`:

| | Inter | Inter Tight | delta |
|---|---|---|---|
| x-height | 54.59 | 54.59 | 0 |
| cap-height | 72.75 | 72.75 | 0 |
| ascent / descent | 97 / 24 | 97 / 24 | 0 |
| "n" advance, w400 | 59.08 | 53.91 | -8.7% |
| "n" advance, w700 | 62.25 | 59.12 | -5.0% |
| "Coiffeur Salon Bellevue Basel" at 16px, w400 | 221.84 | 199.00 | -10.3% |
| 28px w700 headline | 400.44 | 374.47 | -6.5%, 26px recovered on a 402px device |

**So Inter Tight is not a display face paired with a text face. It is the same typeface at a narrower
width.** `tailwind.config.js:227-229` says the pairing "matches Uber Move + Uber Move Text". A
display/text pair differs by optical sizing. This pair differs by advance width only. Correct that
comment.

That measurement is the whole argument. A 5 to 10 percent width saving is worth nothing at 12 to
16px, under 2 pixels on a whole card title, and worth real space at 28px and up. We ship four
locales and German and French commonly run 15 to 35 percent longer than English
(`_rules/I18N_ROUTING.md` Rule 35, cited not measured by me). A long German salon name at 28px is
exactly the string that overflows, and that is exactly where the narrower face earns its keep.

**The failure mode of my own recommendation, named rather than hidden.** Restricting Inter Tight to
24px and above leaves it on roughly 75 elements sitewide (`text-2xl` 44 + `text-3xl` 9 + `text-4xl`
11 + `text-5xl` 11) against 816 elements at 12 to 14px. At that frequency nobody registers it as a
voice. That is a genuine argument for the opposite call: one family everywhere, and spend the
personality budget on photography and layout instead. The i18n width win at the anchor tips it for
me, but the case is close and you should know it is close before you agree.

**On a serif, since it comes up.** Positioning mismatch, not a taste call. 3 of 37 apps sampled used
a serif anywhere in the UI, and all three sit in luxury, wellness-editorial or premium-grocery
positioning: Wispr Flow
([e9aa8816](https://mobbin.com/screens/e9aa8816-808d-44be-afee-c432d7ab9b91)), Shangri-La Circle
([606b7acb](https://mobbin.com/screens/606b7acb-a4ba-4ac1-a1b8-96638a9b4bcd)), Thrive Market. The
other 34, including every booking and marketplace product sampled, are sans-only in product UI.
Fresha is the one brand in the corpus using a serif display face, on both its web headline and its
iOS "Hey, John". **This is one axis where our structural source of truth does something we
deliberately do not copy.** Recorded here so nobody later "fixes" the sans by citing Fresha.

**Concrete edits.**

| # | file | change |
|---|---|---|
| F1 | `app/globals.css:128-133` | Split the `h1..h6` rule. Inter Tight plus tracking stays on `h1`, `h2` and anything 24px and up. `h4`, `h5`, `h6` get `font-family: var(--font-inter)` and `letter-spacing: normal`. Lands on 49 headings. |
| F2 | `app/globals.css:132` | Make `-0.025em` conditional on display sizes. At 28px it is -0.7px, correct. At 14px it is -0.35px on a face already 8.7% narrower per glyph, two tightenings stacked. |
| F3 | `tailwind.config.js` `theme.extend` | Add an explicit `fontSize` map with named roles (display / title / body / meta / caption). There is no `fontSize` extension today, so all 9 steps are Tailwind defaults and a tenth is one keystroke away. |
| F4 | `tailwind.config.js:227-229` | Correct the Uber Move comment per the measurement above. |
| F5 | `app/layout.tsx:18` | The "24 live font-extrabold/font-black callsites" claim is stale. 4 occurrences remain, all inside comments, zero live. The 400-700 weight-array trim did its job. |
| F6 | `_design-system/LOCKFILE.md` EMPHASIS BUDGET (b) | The 1.8x ratio was derived as 28/16, but our effective body is 14px (`text-sm` 474 against `text-base` 68). Over 14px body a 28px anchor is 2.0x, so the floor passes trivially while the screen still reads flat. Reconcile the stated body size or restate the ratio. |
| F7 | `_design-system/LOCKFILE.md` EMPHASIS BUDGET (a) | Add the authoring-side number as a **second, separately defined** check beside the existing rendered-30% house number: 68.1% of explicitly written weight classes are 600 or heavier (1512 of 2219). This is a different measurement from the rendered "17.6% of visible text on the PDP" figure and must not be conflated with it. |

**One deliberate deviation to keep.** `tailwind.config.js` points the `mono` key at Inter Tight, not
a monospace, so a stray `font-mono` resolves in-family instead of falling to a browser default.
JetBrains Mono was retired in V3-D470. That is enforcement by omission and it works. Same technique
as not loading weights 800 and 900 in `app/layout.tsx:22-23`, so a stray `font-extrabold` degrades to
700 instead of rendering black.

**Both fonts are self-hosted** via `next/font/google` with no runtime `fonts.gstatic.com` fetch,
variables applied on `<html>` at `app/layout.tsx:58`. No Geist anywhere in the config. The font
loading setup is the one axis in this whole audit with no measured drift.

---

# PART 3: THE ALIGNMENT ANSWER

You said our list rows do not sit at the same heights the way Airbnb's do. I told you that was wrong.
**You were right and I was wrong.** Here is what settles it and what specifically is broken.

### What Airbnb actually does, measured

9 rows of Airbnb's iOS Account settings
([936fbfe8](https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64)), the icon centre, the
label cap-height centre and the trailing chevron centre, in preview pixels:

```
163.5 / 162.5 / 163.0      290.5 / 290.5 / 291.0      418.5 / 418.0 / 418.5
205.5 / 205.5 / 205.5      333.5 / 333.0 / 333.5      461.5 / 461.0 / 461.0
248.0 / 248.0 / 248.0      376.0 / 376.0 / 376.0      503.5 / 503.5 / 504.0
```

Worst-case spread across all 9 rows: 1.0 pixel, which converts to about 1.3 points. Mean spread 0.39
pixels. **You were describing a real, measurable property, not an impression.**

And the label column starts at `x = 49 or 50` on every single row, despite icon ink widths ranging 14
to 18px, because a fixed box is centred and the glyph floats inside it.

### Why ours drift, the actual mechanism

There are two legitimate schools for where satellites sit on a multi-line row, and the corpus is
genuinely split, so neither is wrong:

- **School A, pin to the first line.** Airbnb, 20 rows across 4 screens and 2 platforms, 0
  exceptions. Its listing editor
  ([59c20415](https://mobbin.com/screens/59c20415-20f5-4199-b025-ea8798c268c9)) puts the chevron
  within 0.5px of line 1 and 4.5 to 5.5px away from the block midpoint.
- **School B, centre on the whole text block.** Uber
  ([9228af44](https://mobbin.com/screens/9228af44-f568-4f96-a70c-23023f075e7a), including a 3-line
  row), OpenTable, Linear
  ([d4e47b31](https://mobbin.com/screens/d4e47b31-9152-40c7-a400-c6725e8de647), trailing control
  within 1px of block mid and 3.5 to 5px off line 1). 12 rows.

**The defect is not picking one. The defect is mixing them inside one list, and `items-center`
produces the mix automatically.** On a single-line row `items-center` centres on the line. On a
two-line row the same `items-center` centres on the block. So a menu holding both kinds of rows has
its icons and chevrons landing 4 to 5 pixels apart between neighbouring rows, and nothing in review
flags it because both rows use identical code.

**That is exactly what ships in `MobileMenu.tsx`:**

```
:255  Dashboard row    flex items-center justify-between      TWO lines  -> school B
      (h-9 icon disc, "Dashboard" 15px/700 + "Salon verwalten" 12px/500, ChevronRight 18)

:428  MenuRow          flex w-full items-center justify-between gap-3 px-4 py-3.5
      ONE line -> school A
```

Both in the same menu, one directly above the others.

### The five label columns

Airbnb ships one number. We ship five, and this is arithmetic from the classes, not an estimate:

| file:line | padding | icon | gap | label starts at |
|---|---|---|---|---|
| `help/page.tsx:163` | `px-4` = 16 | none | none | **16** |
| `MobileMenu.tsx:428` via `:317`, `:325` | 16 | `size={20}` | `gap-3` = 12 | **48** |
| `MobileMenu.tsx:428` via `:285`, `:291`, `:297`, `:303` | 16 | `size={22}` | 12 | **50** |
| `profile/settings/page.tsx:138` | 16 | `size={22}` | `gap-[14px]` = 14 | **52** |
| `MobileMenu.tsx:255` | `p-4` = 16 | `h-9` box = 36 | 12 | **64** |

Note rows 2 and 3: that is a 2px difference **inside one component**, caused only by different
callers passing different icon sizes, because the icon has no fixed box. Chevrons are 18px in
`MobileMenu` and 16px in both `settings` and `help`. Vertical padding is `py-3.5`, `p-4`,
`py-[13px]` and `py-3` across four files. Four values for the same row.

### The fix, and the important part is that it is structural

**Adopt school A** (Airbnb is your named reference and the complaint is literally that our rows do
not match it). Then build one primitive: `npm run exists SettingsRow` returns 0 and
`COMPONENT_REGISTRY.md` has no Row, ListRow or NavRow entry, so this is net new.

Geometry it owns: leading icon box 24 wide by the title's line-height tall, Lucide glyph 20,
`gap-3`, label column left edge 16 + 24 + 12 = **52 on every surface**, trailing chevron Lucide 16 in
a 16-wide box, `px-4 py-3`, divider margin to margin.

**The implementation is the point, not the numbers.** Set the row to `items-start` and wrap each
satellite in a box whose height equals the title's line-height:

```jsx
<span className="grid h-[LINE] w-6 shrink-0 place-items-center">
```

Then icon, value and chevron are centred on the title **by construction**, for one line, two lines,
or a wrapping title, and no margin needs re-tuning when German or French copy runs 15 to 35 percent
longer.

`items-center` plus a hand-tuned margin fails for a specific measured reason: the alignment reference
is the line box, not the glyph ink. On Airbnb's 9 rows, mean error against the icon centre is 0.28px
using the cap band and 0.72px using the ink bbox, and every row with a descender sits low on the ink
measure while every row without sits high. So a nudge tuned on "Termine" looks wrong on "Zahlungen",
because the second has a descender and the first does not. Structure survives copy changes. Nudges do
not, and we ship four locales.

**Migration order:**
1. `app/[locale]/_components/layout/MobileMenu.tsx:255` and `:428`, the one confirmed shipped
   mixed-school list.
2. `app/[locale]/profile/settings/page.tsx:138`, closing the dead branch before it fires. The `sub`
   prop is declared at `:138` and rendered at `:144`, and grep for `sub=` in that file returns
   nothing. All 11 call sites pass only `icon`, `label` and one `value`. So that list is single-line
   today and does **not** currently misalign. It is a latent trap, not a shipped bug: the first
   caller to pass `sub` silently switches that one row to block-centring while its neighbours stay on
   line-centring, with no review signal.
3. `app/[locale]/dashboard/settings/page.tsx:1408`.
4. `app/[locale]/help/page.tsx:163`, which has no leading icon and is therefore a documented
   **variant** of the one component, never a second implementation.

**The cost of my own recommendation, named.** On a row whose second line is a wrapping paragraph of
three or more lines, pinning the leading icon to line 1 strands it at the top of a tall block, and
Uber's three-line row is genuinely where block-centring looks better. The Airbnb sample contains no
three-line row with a leading icon, so I cannot claim Airbnb solves that case. Scope the rule to rows
whose subtitle is a single value or status line, which is all of ours today, and treat a three-plus
line row as a new decision when one appears.

**One measurement I owe you.** The `h-[LINE]` value is not locked anywhere. `text-[15px]` in
`profile/settings` sets no line-height and the only line-height rule I found is a scoped
`line-height: 1.5 !important` at `app/globals.css:905`. Read it off the rendered page with
`getBoundingClientRect()` before writing the number into the component. **I did not render any page
for this file. Every Solen claim above is read from source.** The closing check is: open
`/de/profile/settings` and the mobile menu at 390x844, run `getBoundingClientRect()` on each row's
icon, label and chevron, and confirm the three centres agree within 1px on every row including the
two-line Dashboard entry.

---

# PART 4: WHAT NOT TO COPY

Nine things the corpus does that we deliberately will not, each with the reason.

### 1. Airbnb's red CTA, and every brand-coloured commit button

Airbnb's Reserve is Rausch red. Fresha's search commit is a black pill. Our commit button is locked
to ink `#0A0A0A` and stays there. **The honest note, since it was corrected on 2026-07-28 and should
not silently revert:** Apple's HIG, Material, Carbon and Atlassian all put the primary colour on
prominent buttons, so the ink-CTA rule is a defensible minority position aligned to Fresha, not the
majority pattern it was once written as. Fresha's black search pill is the one place the corpus and
our lock agree with no adaptation needed.

### 2. A dark or brand-coloured fill on a selected chip

6 of 7 chip implementations in the PDP sweep use a saturated or black fill (Fresha's "Featured" is
literally a black pill, Uber Eats, foodpanda, Shangri-La gold, Careem pale green). In the search
sweep, 6 of the 11 apps whose selected chip state was visible used a dark fill and 5 used a brand
colour. **Zero used a neutral grey fill.** We stay on `bg-s-bg-sunken` plus ink plus semibold, and the
`no-black-selected` gate stands.

**The cost, named rather than buried:** grey-on-white is the lowest-contrast selected state in this
corpus, so on a scrolling chip row our selected chip is the hardest in the field to spot. The
semibold weight step is doing most of the work and must not be dropped. DoorDash
([e0ddd0d5](https://mobbin.com/screens/e0ddd0d5-254b-499d-a15e-649bb1d52bde)) does the same job with a
light grey fill, so we are not alone, and Fresha also refuses a fill (it signals on the border
instead).

**Correct one stale spec while you are here.** `_design-system/sections/salon-detail/04-services.md`
specifies "Chip active: `border-s-ink bg-s-ink text-white`", a black fill, against the design
contract's grey-fill lock dated 2026-06-29. The spec is stale, not the lock. Check whether the
rendered `TabPill` still emits black fill or only the doc is stale, before touching code.

### 3. A hero photograph baked into the homepage

You rejected this three times, most recently 2026-07-25: "no other company has just image hard coded
baked into a random area." **That is literally true across a 34-screen sample** including Airbnb,
Fresha, DoorDash, Uber Eats, Etsy, Faire, Klook and Eventbrite: 0 of 34 carry a decorative hero
photograph. The imagery floor is met by surfacing more real salon content higher up, never by adding
an image. `~/.claude/hooks/no-decorative-image-gate.py` blocks a hardcoded `src` and data-driven
`src` passes.

### 4. A rating distribution histogram on the PDP

All 7 apps in the corpus that ship one (Etsy, Faire, UNIQLO, App Store, foodpanda, Tabby, Binance)
are commerce or content products. **Zero of the five booking products have one.** A salon with 4
reviews under a five-bar histogram reads as a wireframe of a bigger product. Recorded here so nobody
later "adds" it as a gap.

### 5. A photo on the service row

Duration appears on 8 of 8 booking implementations, a per-row action on 7 of 8, price on 7 of 8, and
a **thumbnail on 2 of 8**. Both thumbnail cases are food marketplaces, where a burger photo sells.
A Damenschnitt photo does not. Our `SalonServices` already matches. Keep it.

### 6. Photo gallery categories

7 apps organise the gallery by category with counts (Zomato "All (138) / Food (102) / Ambience (32)",
Tripadvisor, Marriott, Shangri-La, IHG, Airbnb Photo tour, CRED). A salon gallery is 5 to 20 photos,
and our own richness ceiling only asks for grouping above roughly 40. Splitting 8 photos into 3
buckets of 2 is chrome for its own sake. Revisit at scale, not now.

### 7. A wrapped cloud of removable filter chips

6 of 30 search brands render applied filters as individually removable chips. Useful. But Bolt Food
([59e6ed6e](https://mobbin.com/screens/59e6ed6e-858d-4e3f-ad34-8063fe202325)) shows the failure: ten
wrapped chips ate the top third of the screen and pushed the first result below the fold, which
collides with our density floor. The version that survives both: keep the chip row single-line and
non-wrapping, and give an active chip an inline X in place of its caret.

### 8. Fresha's serif display face

Covered in FONT. One brand in 37 uses a serif in product UI here. We are on Inter Tight on purpose.
Do not "fix" the sans by citing Fresha.

### 9. Two card anatomies for the same entity, even though three shipped apps do it

Fresha's Book-again row sits directly above its Favourites card and both are a salon
([781cf27c](https://mobbin.com/screens/781cf27c-6d77-465b-8302-f106505dc691)). ClassPass and Resy do
the same. It is survivable, and our FLOORS LAW 8 is stricter on purpose. If a dense Book-again strip
is ever wanted, it is a **named variant** of `SalonCard`, not a second card. The difference between
their situation and ours is that theirs is two variants of one component and ours is twelve
independent files.

### One thing we cannot copy for a legal reason, not a taste reason

**Price on the card.** 0 of the 5 appointment-booking feeds observed print any price on a home card
(Fresha iOS, Fresha web, Zocdoc, Square Go, Care.com). We print "ab CHF {price}". That is not drift.
It is Art. 13 of the Price Indication Ordinance, a tier-2 statutory floor that outranks a tier-9
majority pattern, and the apps that omit price are mostly US-market and not under PBV. The corpus's
only usable note is that every app that does show a price renders it at body weight inside the meta
line, never as a second anchor. Keep it quiet, keep it there.

---

# PART 5: LIMITS, WHAT THIS RESEARCH COULD NOT TELL YOU

Stated plainly, because a change list that hides its blind spots is worse than a shorter one.

1. **Motion is unanswered.** Mobbin returns static images. Zero animations, durations, easing curves
   or gestures were observed across every sweep. Anything about parallax, spring versus tween,
   stagger, press tiers or hover elevation needs a recorded capture through `reference-lock`. This
   file adds no motion for that reason.

2. **No competitor pixel value is real.** Mobbin serves signed downscaled previews (iOS 299px wide,
   web 768px) and resize parameters break the signature. Every iOS point conversion runs through a
   derived scale factor of about 1.304 points per pixel, so plus or minus 1 pixel is plus or minus
   1.3 points. Every web number is a percentage of an unrecoverable viewport. The Airbnb absolutes
   in PART 3 (24pt margin, 24pt icon box, 16pt gap, 64pt label offset, 56pt row pitch) are
   **reconstructed by me from a shipped artefact, not published by Airbnb.** They land on the 4pt
   grid, which corroborates the reconstruction, and they stay a reconstruction.

3. **The direct competitors are absent.** Booksy, Treatwell, Vagaro, StyleSeat, Squire, Mindbody,
   SimplyBook.me, OpenTable and Calendly returned zero on-archetype screens despite being searched by
   name in multiple sweeps. Mobbin's corpus is curated, not complete. **The only pure beauty-booking
   products observed anywhere in this research are Fresha and Square Go.** Wherever this file says
   "booking apps", the denominator is five (Fresha, Square Go, Zocdoc, ClassPass, Care.com), not a
   category.

4. **Nothing was rendered.** Every Solen claim in this file is static source measurement: grep, file
   reads, and one local font measurement in headless Chromium. Anything depending on runtime layout
   is out of scope and cannot be inferred from these greps. Specifically **not** verified: the actual
   first-viewport photo fraction, the rendered distinct-font-size count per screen, the rendered
   weight-600 percentage, and whether each of the 11 `h-9` ink-CTA callsites is on a real control
   (below the 44px touch-target floor if so).

5. **Two numbers in circulating docs did not reproduce.** The "312 components" denominator could not
   be reproduced; my filter yields 327 component-shaped files and 386 exported symbols, and I state
   both rather than pick the one that matches. And the prior audit's "nine files hand-build their own
   salon card, seven use the real SalonCard" matches the **legacy** importer count exactly, which
   suggests it measured `components-legacy/SalonCard.tsx` only and missed the other two
   implementations. Measured today: 12 hand built, 15 composed, across three real card components.

6. **The 30% weight ceiling in the EMPHASIS BUDGET is a house number.** It has no external citation.
   The qualitative principle is sourced (NN/g). The threshold was chosen because the PDP measured at
   86% and any number materially below that stops the bleeding. Keep the gate, it does real work.
   Never cite the 30% as evidence.

7. **The 1.3x card-width separation threshold is also a house number**, inferred from 7 screens. The
   widths behind it are measured; the threshold is ours.

---

# PART 6: THREE THINGS IN THE INPUT RESEARCH THAT THE REPO CONTRADICTS

Surfaced rather than quietly built on, because acting on a false premise is more expensive than
correcting one.

### 1. The PDP sticky header is NOT missing the salon name

The salon-detail corpus file records "sticky in-page tab nav (`SalonStickyTabNav`, **missing the
entity name**)" and treats the 4-of-4 corpus pattern as an open gap.

`app/[locale]/_components/salon/SalonStickyTabNav.tsx:180-207` renders a full scroll header: back
button, `{salon.name}` at line 197 (`font-display text-[14px] font-medium tracking-[-0.01em]`,
truncated), share button, and `HeartButton`. It carries a `mockup-ok` comment recording a
2026-07-25 owner-approved demotion from 16/600 to 14/500.

**What is actually true:** the row is `md:hidden`, so mobile carries the name and desktop renders
tabs only. The desktop side is the real gap, and Tripadvisor
([5df39934](https://mobbin.com/screens/5df39934-c915-43d7-97f3-24b5118768af)) is the reference for
it, pinning name plus tabs plus a Reserve button. Mobile needs no work.

### 2. The uppercase tracked eyebrow has zero callsites

The home-feed corpus file says `SectionHeader.tsx:66` "ships `text-[13px] font-semibold uppercase
tracking-[0.08em]` **on every content row**" and rates it a defect.

The eyebrow lives inside `SectionMeta`, which is rendered only by `SectionHeader`
(`app/[locale]/_components/homepage/SectionHeader.tsx:39`). Grepping for `<SectionHeader` across
`app/`, `components/` and `components-legacy/` returns **two hits, both in
`salon/SalonServices.tsx` (`:75`, `:95`), and both are a different, children-based local component,
not this one.** Every homepage section calls `<SectionTitle>` directly:
`SalonOfMonth.tsx:38`, `ForYouSalonRows.tsx:60`, `Entdecken.tsx:165`, `RecentlyViewed.tsx:151`,
`Nearby.tsx:105`, plus the two commented-out sections.

**What is actually true:** the homepage `SectionHeader` export is dead code. The eyebrow renders on
zero content rows today. The 0-of-25 corpus finding still argues for deleting the dead export, but it
is a cleanup item, not a visible defect, and it does not belong in the top ten.

### 3. The walk-in cancellation policy is already rendered

`hierarchy-density-05` recorded `walk-in-pay/page.tsx` defining `cancelPolicy` in all four locale
objects with zero JSX render sites.

Fixed. `app/[locale]/walk-in-pay/page.tsx:553` renders
`<div className="mt-2 text-[12px] font-medium text-s-ink-2">{l.cancelPolicy}</div>` above the commit
button, with a comment at `:552` recording the fix. The trust floor passes on that screen.

The related PDP item is still open and is a different thing: **none of the 20 PDP sections carries a
cancellation term.** The trust floor binds paid commit screens and the PDP CTA only navigates, so
the floor does not strictly bind there. 5 corpus apps still put the term on the detail page (Airbnb
[9a3b9090](https://mobbin.com/screens/9a3b9090-fe21-405e-8453-52584cd37e62), Peerspace, Zomato,
Airbnb Services, Viator) because the cancellation term is a **selection criterion**, not a checkout
disclosure. Worth adding. Not a floor violation.

---

# ORDER OF WORK

Nothing here is a hand edit. Every item routes through the layered loop with a separate reviewer.

**Wave 1, invisible plumbing, no mockup needed, unblocks everything else.**
`PageContainer`, `CardGrid`, `Button`, `SettingsRow`. Four primitives, four registry entries, four
component docs. Delete the stale `SalonServicesSheet` registry row at
`COMPONENT_REGISTRY.md:137`.

**Wave 2, one mockup covering the row family and the card family.**
The `SettingsRow` migration (4 files) and the `SalonCard` variant family (12 hand-built tiles plus
the two other card components). These are the two FLOORS LAW 8 violations and the two you can see in
one tap.

**Wave 3, one mockup per surface.**
Search slot chips. PDP book-bar content. PDP and search empty states via the real `EmptyState`.
Remove the desktop sidebar collapse.

**Wave 4, type and grid, one mockup.**
F1 through F7. The `px-3` to `px-4` fix. The `SalonVenuesNearby` width fix. The gutter collapse to
one token pair.

**Needs your decision before anything is built:** the desktop hero height (item 7). Two
owner-dated rules point opposite ways and a research file cannot arbitrate that.

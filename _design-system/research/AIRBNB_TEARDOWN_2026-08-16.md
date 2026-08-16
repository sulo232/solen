<!-- exists-check: `npm run exists "airbnb"` run this turn, 2026-08-16. Hits: 4 dev routes
     (/dev/airbnb-01-home, -02-search, -03-salon, -findings), 4 page-inline "Airbnb-style search"
     comments, and 2 graveyard rows (the 2026-08-10 bottom-nav reversal and the 2026-08-14 salon-card
     6/5 rejection), neither of which this file re-proposes. `_design-system/references/` already
     holds AIRBNB_SYSTEM_VS_OURS.md plus 7 airbnb--*.md capture files, and
     `_design-system/research/` holds TASTE_DASHBOARDS.md, TASTE_HIERARCHY.md, TASTE_GROUPING.md,
     TASTE_CHECKOUT.md, CHEAP_PHOTO.md, PRINCIPLES_50.md.
     NET-NEW versus all of them, for three reasons, and it does not re-measure what they cover:
     (a) the prior Airbnb files cover the CUSTOMER account/profile/home/search surfaces; this is the
         first pass over the OPERATOR estate (host Earnings, Insights, Calendar, Listings, Taxes,
         Payouts, Reservations), which is the surface class that produced the six rejections;
     (b) it is the first Airbnb capture that carries PIL-measured chromatic-share percentages per
         screen, which is what the 2026-08-16 colour question needs and no prior file has;
     (c) it is the first document that puts an Airbnb measurement next to OUR OWN LAW at file:line
         and names which of our rules is wrong, missing, or ignored.
     TASTE_DASHBOARDS.md is the closest research match and is NOT superseded: it owns chart-type and
     data-density theory with external citations. This file owns the reference measurement.
     It EXTENDS AIRBNB_SYSTEM_VS_OURS.md (which owns the live token layer and the seven account-screen
     conflicts) rather than replacing it. -->

# Airbnb teardown, 2026-08-16

**Why this exists.** A merchant terminal was rejected six times in one session. An adversarial panel
then found that two of the rejections were not sloppiness at all: our own design law demanded the
things he rejected. FLOORS LAW 4 (`CLAUDE.md:99`, mirrored at `_design-system/LOCKFILE.md:1980`)
mandates a grey tray for grouped content on white with no photo, which is the grey canvas he
rejected. FLOORS LAW 1d (`CLAUDE.md:96`) mandates a semantic-colour moment, and on a screen with no
photography the only pale token still defined is `s-warning.bg` `#FDF6E7`, which became the beige bar
he rejected and which taste rule 3 (`CLAUDE.md:35`) bans by name.

He then said, verbatim: *"if the current design disseminated file is making you create this fucking
bullshit, so you have to actually renew it and overhaul the whole file then because the principles
too, like, I need to actually find a cause and fix those stuff and research what they're actually
doing, what we do differently, and where we are missing everything."* And: *"I actually go research
deep into it on how Airbnb would do this."*

**Scope he set, binding on this document.** Output is research, go deep. Airbnb is source of truth on
everything including colour, so the colour question is in scope and is answered here rather than
dodged. All screens, customer and operator.

**What this document is not.** It is not law. Nothing here changes a rule by itself. The decisions
this research points at live in `_design-system/PRINCIPLES.md` (the deciding layer) and in the dated
owner rounds in `_design-system/TASTE_LOG.md`. Where Airbnb collides with a dated decision of his,
the collision is written out with both dates and left for him.

**Evidence quality, stated once so it is not oversold.** Four independent capture passes over
Mobbin, roughly 150 distinct screens. The fourth pass ran PIL pixel counts and hex samples; the first
three read measurements off the rendered images by eye. Every number below is labelled MEASURED (PIL
sampled) or ESTIMATED (read off the image). Where the two disagree, MEASURED wins. Every Airbnb claim
carries its mobbin URL. Every claim about our own law carries a file:line.

---

## 1. Surfaces (what the page sits on)

### The finding in one line
Airbnb's page background is white, edge to edge, on every screen in every pass, including the
photo-less operator screens that are the closest analogue to our merchant terminal.

### Measured
- iOS host Earnings, mid-page sample: `#FFFFFF` at 97% of a flat region.
  https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc
- Web Confirm and pay, page background: `#FFFFFF` at 94% (the remainder is antialiasing).
  https://mobbin.com/screens/3ca7c32d-ae98-4d86-b410-78524da5648a
- Whole-screen neutral histogram, iOS host Insights: 92.4% of all pixels fall in the 248 to 255
  bucket. https://mobbin.com/screens/ec1e902b-2557-4657-913c-9d29c531a542
- Web host Today, above the fold: `#FFFFFF` at 99%.
  https://mobbin.com/screens/104dfb4f-20dc-43e3-9733-147c359b3d03

Four independent passes found **zero grey page canvases anywhere in the operator estate.**

### The decisive screens for our question
- iOS host Earnings: white top to bottom, no photograph, no card, no grey canvas.
  https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f
- Web Taxes: three year groups on pure white, split by full-width hairlines, zero containers, zero
  colour. https://mobbin.com/screens/8d23bf7e-ccad-4e6d-a8f5-fc2e3e81e9d6
- Web Reservations: entirely white, and it carries no filled button at all.
  https://mobbin.com/screens/cfdef9ed-1b48-4951-ab9a-e0b5cd99ec47
- Web Login and security: two columns, both white, split by one vertical hairline, never by a grey
  sidebar. https://mobbin.com/screens/c50369e0-6c52-45c6-b69f-695382b258aa

These are grouped, list-shaped, photo-less operator screens. They are exactly the case FLOORS LAW 4
says requires a sunken tray, and Airbnb ships them on white.

### What grey is actually for, the complete job list
Grey has a fixed set of jobs and "paint the page" is not on it.

1. **Control fill.** MEASURED `#F2F2F2` at 29% on the "View earnings summary" pill
   (https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f), `#F2F2F2` at 45% on the
   "Preview" pill (https://mobbin.com/screens/8695e4bb-1a1f-42bb-bbf9-aa2964fe2fc3), `#F0F0F0` on
   the web "View listing" button (https://mobbin.com/screens/81cb5333-40c3-431b-a728-d2266e728b35),
   `#F5F5F5` on the unselected "Today" segment
   (https://mobbin.com/screens/3a9a1f0c-c768-45b8-b3e0-f4d0d02698ad).
2. **Disabled or past state.** MEASURED: past calendar cells `#EBEBEB` at 83%, bookable future cells
   `#FFFFFF` at 88%, on the same grid. Grey literally means you cannot act on this.
   https://mobbin.com/screens/bad53c24-e30f-4fba-9bc0-dab3e3bb789b
3. **A separator strip.** A full-bleed band roughly 8 to 12px tall between two content blocks, in
   place of a divider line. https://mobbin.com/screens/cafad2e7-0065-483c-9f51-5b55ecd4fbb1 and
   https://mobbin.com/screens/8153b618-9c51-4c1e-8b1b-32b692a02e9b
4. **A filled fact card**, borderless and shadowless, holding the two or three things that matter
   most. The trip detail screen has exactly one, split by a vertical hairline into "Check-in / Fri,
   Sep 5 / 7:00 PM" and "Checkout / Sat, Sep 6 / 1:00 PM", and every other row on that page is bare
   on white. https://mobbin.com/screens/bb3a9535-0ef0-4dc6-b2de-bbf5113ebc15
5. **A section band with WHITE cards floating on it.** The page starts white, steps into a grey band
   carrying "Your Superhost stats", and the content inside that band steps back up to white cards.
   https://mobbin.com/screens/e9472f5a-7d71-4ba3-89b6-cc0135cc6658
6. **The active row of a web sidebar.** A light grey rounded fill with the label bolded. This is the
   one place their selected state is grey rather than black.
   https://mobbin.com/screens/f07348ea-dca8-4ca9-93a3-a738bc718223
7. **A photo-slot fallback**, a light grey placeholder block where an image is missing.
   https://mobbin.com/flows/5b91784c-84a8-41e5-9f29-138275095d5f

One inversion worth knowing: the web host Calendar puts the dense DATA GRID on grey with white day
cells, and puts the settings panel beside it on white. Grey is reserved for a tabular field of cells,
and the moment the content becomes a list of labelled controls it returns to white.
https://mobbin.com/screens/900c1cc8-9df3-4f11-acfd-19b018af1af1

### Warm tint exists, and its SHAPE is the whole point
Three shapes only, and none of them is a strip on a working screen.

- **The entire page of a terminal-moment screen.** "Your stay is pending"
  (https://mobbin.com/screens/bd405b4d-509e-4fde-b8dd-fe3cbbd97dd0) and "Your reservation is
  confirmed!" (https://mobbin.com/screens/5072ddf8-8a38-4737-813e-e1ccb6ad452f). Both still carry a
  BLACK button.
- **The ground of a modal sheet.** MEASURED `#F4F1E9` at 97% of a flat sample on the Wishlists
  onboarding sheet, which also carries a black button.
  https://mobbin.com/screens/7c140f48-a9ae-4420-8686-9018dc681449
- **A full hero band** behind a ratings block, with the review list below it on white.
  https://mobbin.com/screens/46121124-5628-4434-8c25-60e5f7872d0c

**There is no instance anywhere in roughly 150 screens of warm cream used as a status strip.** So
Airbnb is not evidence for the beige bar that was rejected. It is evidence against it.

### Where this collides with us
`_design-system/LOCKFILE.md:1980` states the tray mandate with **no screen-class qualifier**, while
its neighbours `:1951` (§17.1), `:1982` (§17.3), `:1985` (§17.4) and `:1993` (§17.5) all say
"customer". The 2026-08-16 scope fix that names operator screens as exempt was written into
`CLAUDE.md:66-92` only, and the precedence chain at `CLAUDE.md:345-353` puts LOCKFILE at tier 4 and
CLAUDE.md's pinned blocks at tier 5. **The corrected copy currently loses the tie.** An agent that
resolves the conflict by the documented chain re-applies the grey canvas and is following the law
while doing it. This is the single highest-value repair in the whole document and it is ranked first
in section 10.

---

## 2. Containers (when a group gets a box)

### The finding in one line
Bare rows on white are the default. A card is rationed to four reasons, and a card carries a border
or a shadow, never both.

### Card counts, counted off the images
- **Zero cards:** iOS Account settings, eight rows
  (https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64); iOS Personal info, seven rows
  (https://mobbin.com/screens/45f2625c-6e4e-4385-8e7a-faa4381f0db7); iOS Legal, four rows
  (https://mobbin.com/screens/16e8539a-a59c-4cc1-837d-de4165c5cfd9); iOS Menu hub, twelve rows
  (https://mobbin.com/screens/ec965d5f-a216-49db-b44b-7ee988a9d7d7); iOS Insights, where the three
  stats sit as bare columns between two hairlines
  (https://mobbin.com/screens/ec1e902b-2557-4657-913c-9d29c531a542); web Reservations
  (https://mobbin.com/screens/cfdef9ed-1b48-4951-ab9a-e0b5cd99ec47); web Taxes
  (https://mobbin.com/screens/8d23bf7e-ccad-4e6d-a8f5-fc2e3e81e9d6); web Privacy toggles
  (https://mobbin.com/screens/49df298a-b4e9-43b4-a3e7-def86bfa1dbf).
- **One card:** iOS Earnings the moment a payout is missing, and the card IS the alert
  (https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc); iOS trip detail, the grey
  check-in/checkout fact card (https://mobbin.com/screens/bb3a9535-0ef0-4dc6-b2de-bbf5113ebc15); iOS
  Privacy, one bordered card around "Request my personal data" in a screen otherwise made of toggle
  rows (https://mobbin.com/screens/9015994d-6871-46c5-abda-67b7121d49f0).
- **Two to four cards:** web Trips, two alerts plus one reservation
  (https://mobbin.com/screens/d3a8ceec-6af8-4f17-8e78-a9526936ac10); web Confirm and pay, three
  numbered step cards plus one summary card
  (https://mobbin.com/screens/5dae47fd-6764-4452-b208-324c253af5a8).
- **Five to eight cards, and only on EDITORS:** the web listing editor's left rail, where each card
  is one editable field group (Title, Property type, Pricing, Availability, Number of guests).
  https://mobbin.com/screens/ad1e99c0-ebb6-4005-8338-d2b3e971438a

### The four reasons a card appears
1. An alert or a notice.
2. A discrete entity carrying a photograph.
3. A group of inputs forming one transaction object or one editable field.
4. A selectable option.

Settings rows, price breakdowns, stat grids and menu rows get no card at all.

### Border or shadow, never both
- Alert and notice cards: 1px hairline, white fill, no shadow, radius reads about 12.
  https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc and
  https://mobbin.com/screens/c82c0b89-3d5c-4749-86f5-8177d85702f0
- Entity cards carrying a photo: shadow, no border.
  https://mobbin.com/screens/a12e7c67-bf56-4ba3-af0f-102bfb2797e0
- Photos in a feed: neither, just a radius, with the text bare underneath on white.
  https://mobbin.com/screens/a92f14ea-1a94-4a63-99f3-8b5fbd42d106
- The one exception found in roughly 150 screens is the web booking widget, which carries both.
  https://mobbin.com/screens/7cbdb1f6-a5dd-4afa-a957-a30442256f6e
- A card that floats over the grey header band DROPS its border and takes a shadow instead. The
  choice follows the background, not the card.
  https://mobbin.com/screens/d6c816b7-1b6e-4165-ba7f-f1ba5033ce32

### Selected container is a 2px BLACK border, never a colour
Selected time slot (https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108), selected
service card (https://mobbin.com/screens/66cbd07c-5844-4ba7-9755-9d88d5031aa7), focused editor card
(https://mobbin.com/screens/05e08aba-5239-4382-9ced-4954a8d4ae44), selected payout method
(https://mobbin.com/screens/8680b8d5-003a-411b-8794-46d25f3bd37d). On the host pricing step, border
WEIGHT alone ranks two adjacent cards: the price-breakdown card takes 2px black, the "You earn $97"
card below it keeps a hairline. https://mobbin.com/screens/79940bbb-c8ce-42c5-bd46-4ca3c77955b5

### The divider ladder, which is a rule we do not have at all
A divider is EARNED BY ROW COMPLEXITY, and the ladder is consistent across every capture.

- **No divider** when the rows are single-line nav items. Eight rows, zero rules, spacing alone.
  https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64
- **One inset divider**, at a section boundary only. Payments and payouts has exactly one hairline,
  between the Traveling group and the Hosting group.
  https://mobbin.com/screens/e62d97ca-2500-452c-8f53-e7210d9cf7e8
- **A divider between every row**, once each row carries a label plus a value plus a right-side
  action. https://mobbin.com/screens/45f2625c-6e4e-4385-8e7a-faa4381f0db7 and
  https://mobbin.com/screens/5fbce9d9-8dc5-4a99-a675-c05fb1839971

We legislate the divider's colour (`CLAUDE.md:138`, `#E4E4E7`, "one token, every divider") and its
inset (`_design-system/LOCKFILE.md:585`, measured 24px both sides). We never legislate its TRIGGER,
so every list re-decides.

### Where this collides with us
Two dated owner decisions point opposite ways and neither names the other.
- THE CONTAINER TEST, `_design-system/LOCKFILE.md:561-584`, owner 2026-07-28: *"A container is
  earned only when it does something whitespace cannot"*, three cases, plus a named no-container
  list that includes *"a settings or preferences list, a single-column form section, a menu of
  destinations, an account hub"*.
- The grouped list-card lock, `_design-system/LOCKFILE.md:633-647`, owner 2026-06-11: *"any LIST of
  same-kind rows (services, per-staff Leistungen, selectable booking services) renders as ONE grouped
  card per group"*, naming SalonServices as the applied reference.

The shipped code follows the older one. Airbnb agrees with the newer one.

---

## 3. Type

### The anchor is a SENTENCE that carries the live number, and it is bigger than the page title
ESTIMATED ratios, read off the images, so treat them as a band and not as a spec:

| Screen | Anchor | Anchor to body |
|---|---|---|
| "Set a weekend price" | the live figure `$61` | about 3.5x |
| Reviews hero | `4.96` | about 3.1x |
| Host Earnings | "You've made $0.00 this month" | about 2.2 to 2.9x across passes |
| Account hub titles | "Account settings" | about 1.9x |
| iOS PDP | listing title | about 1.7x, and the PHOTO is the focal there, not the type |

Sources in order: https://mobbin.com/screens/79940bbb-c8ce-42c5-bd46-4ca3c77955b5 ·
https://mobbin.com/screens/46121124-5628-4434-8c25-60e5f7872d0c ·
https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f ·
https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64 ·
https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3

On money screens the live figure is physically the biggest object on the page. The page title is
**not** the anchor. On Earnings, "Earnings" is a small label at the top and "You've made $0.00 this
month" below it is three to four times its size.
https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc

### Label versus sentence, and the split is a rule
- **LABEL** on a wayfinding title. One noun, no verb: "Earnings", "Insights", "Calendar", "Trips",
  "Menu", "Account settings", "Personal info", "Reservations", "Your listings", "Taxes", "Bedroom".
- **SENTENCE** one level below, taking the biggest type, stating the state: "You've made $0.00 this
  month" (https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc), "You don't have any
  upcoming reservations" (https://mobbin.com/screens/8249f9ca-1fdc-4f97-870f-974d6811a36c), "You
  have 1 reservation" over "Sandra's group of 3 checks in"
  (https://mobbin.com/screens/a712767b-113c-4ead-875d-40a5fa2f9830), "Verify your identity to finish
  booking" (https://mobbin.com/screens/a3173518-39a8-49d3-9968-77d6377cdd41), "Your listing is ready
  to publish" (https://mobbin.com/screens/05e08aba-5239-4382-9ced-4954a8d4ae44).

The label names the route. The sentence carries the meaning and takes two to three times the size.
**This one pattern is most of why their photo-less screens read finished and ours read like
wireframes: the biggest type on the page IS the data, so no photo, no stat tile and no tint is needed
to give the screen a subject.**

### A typographic move worth naming
On the earnings sentence, `$0.00` is set GREY while "You've made" and "this month" stay black, so a
zero recedes inside its own headline and no separate empty state is needed.
https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f
We cannot copy this exactly. FLOORS LAW 6 (`CLAUDE.md:101`) bans tertiary grey as text on WCAG
grounds, measured at 2.54:1 on white, and this number is load-bearing data.

### Bold does exactly two jobs
The screen title or section heading, and a row's identifying label. Values, meta, helper text,
timestamps, axis labels and prices in body position are all regular weight.

ESTIMATED shares of visible text at weight 600 or above: Menu hub about 5%, Account settings about
10%, Earnings 10 to 25% across passes, the densest case (web settings, a semibold label plus a grey
value per row) about 25 to 30%. Their PDP was measured at 3.1% (7 of 388 elements) and carries its
emphasis at weight 500, a number already recorded in our own EMPHASIS BUDGET block at
`CLAUDE.md:107`. Nothing in any pass came close to a majority-bold screen.

### Uppercase exists in exactly one place
Small grey caps on GROUP labels only: "HOSTING" and "ACCOUNT" on the menu hub
(https://mobbin.com/screens/ec965d5f-a216-49db-b44b-7ee988a9d7d7), "CHECK-IN" and "CHECKOUT" inside
the booking widget (https://mobbin.com/screens/7cbdb1f6-a5dd-4afa-a957-a30442256f6e). We ban
uppercase outright via `copy-lint-gate.py`, so this is a place we are stricter than the reference and
we should stay stricter, because the ban is a dated owner call.

### Content tabs are an underline, never a pill
Active is black text plus a 2px black underline, inactive is grey text, with a full-width hairline
under the row. https://mobbin.com/screens/cfdef9ed-1b48-4951-ab9a-e0b5cd99ec47 ·
https://mobbin.com/screens/7f38fbb0-3a49-4687-af85-8167ad924e06 ·
https://mobbin.com/screens/8d23bf7e-ccad-4e6d-a8f5-fc2e3e81e9d6
This one we already match: `CLAUDE.md:125` locks content tabs to title plus a 2px ink underline,
owner 2026-07-21.

### Where this collides with us
There is **no legal 28px-or-larger role on our ramp**. The core ramp at
`_design-system/LOCKFILE.md:361-376` tops out at Page H2 = 22px, and 15px is reserved for CTA roles.
Meanwhile FLOORS LAW 6 (`CLAUDE.md:101`) requires a display anchor of at least 28px on every customer
screen. So the anchor can only be produced by an off-ramp size, which taste rule 9 (`CLAUDE.md:41`)
and the drift-checker both punish. The approved terminal state proves it: its four sizes are
`{13, 15, 18, 28}` and the 28 is off-ramp (`_design-system/TASTE_LOG.md:910-915`).

That is why photo-less screens come out flat. The builder has no sanctioned way to make one thing
big, so it reaches for a tint or a tray to create interest instead. This is the positive half of what
produced the six rejections.

---

## 4. Colour

This is the longest section because it is the axis he made source of truth.

### The headline number
**Outside photography and outside one button, Airbnb's UI carries between 0.0% and about 0.5%
colour.** A pixel counts as chromatic when the max minus min channel spread is at least 20 and its
saturation is at least 0.12. MEASURED, PIL:

| Screen | Chromatic share | Where it is |
|---|---|---|
| iOS host Insights (https://mobbin.com/screens/ec1e902b-2557-4657-913c-9d29c531a542) | **0.00%** | nothing, star included |
| iOS host Earnings scrolled (https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f) | **0.00%** | nothing |
| Web host Calendar, full month grid (https://mobbin.com/screens/bad53c24-e30f-4fba-9bc0-dab3e3bb789b) | **0.07%** | a logo, one badge, a 6x6px green check |
| iOS host Earnings, first viewport (https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc) | **0.48%** | 100% of it inside one 32px alert disc |
| Web Trips (https://mobbin.com/screens/81cb5333-40c3-431b-a728-d2266e728b35) | **2.44%** | the listing photo holds 85% |
| Web Confirm and pay (https://mobbin.com/screens/3ca7c32d-ae98-4d86-b410-78524da5648a) | **2.39%** | the button is 2.08% of the screen and holds **79%** of all colour |
| iOS PDP, white sheet only (https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3) | **4.34%** | Reserve holds **80%** |
| iOS PDP, whole screen with the hero | 14.79% | the photo is 41.3% of area and holds **83%** |
| Web host Today (https://mobbin.com/screens/104dfb4f-20dc-43e3-9733-147c359b3d03) | 5.10% | 95% of it is the photographic band |

Nothing measured crosses about 5%. On an operator screen with no photo and no commit button the
honest figure is under half a percent, and on two of the five such screens it is exactly zero.

### Where the colour goes, complete
1. **The Bélo logo.** MEASURED most-saturated `#C00A41`.
   https://mobbin.com/screens/bad53c24-e30f-4fba-9bc0-dab3e3bb789b
2. **The ACTIVE bottom-tab icon and its label, and only the active one.** MEASURED `#C21848`.
   Inactive tabs are grey outline. https://mobbin.com/screens/3a9a1f0c-c768-45b8-b3e0-f4d0d02698ad
3. **Unread dots.** MEASURED `#E82056` on iOS, `#DD0A4A` on the web badge.
   https://mobbin.com/screens/01f52e72-2105-4946-8936-93d60b15ba7f
4. **A 20 to 32px filled status disc with a white glyph, inside an otherwise all-white hairline
   card.** MEASURED `#C13512` for blocking on iOS Earnings, region x31-62 y147-179
   (https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc). Blue for informational
   (https://mobbin.com/screens/79f36e2f-ac49-4169-b473-abb7b0dd13bd). The SAME missing-payout problem
   gets red on iOS and blue on web, so the hue is a severity ladder, not a topic
   (https://mobbin.com/screens/c82c0b89-3d5c-4749-86f5-8177d85702f0). Web Trips shows red and amber
   side by side on one screen, each 0.28% of screen area
   (https://mobbin.com/screens/81cb5333-40c3-431b-a728-d2266e728b35).
5. **A 6px status dot inside a WHITE pill with BLACK text.** "Action required" amber and "In
   progress" green sit side by side on one screen and differ by six pixels of hue.
   https://mobbin.com/screens/d8494673-d50a-497f-b350-c4646a14db7c
6. **Gold Guest-favorite laurels.** MEASURED `#FDE669` and `#E1BC44` on iOS
   (https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3). The identical badge renders
   BLACK on web (https://mobbin.com/screens/54761527-353f-47f1-bcf7-c59d267b0e15), so even the award
   hue is not load-bearing.
7. **The single irreversible commit button.** MEASURED gradient `#C6165D` to `#D70665` on iOS
   Reserve, `#E61E4F` to `#DA0A63` on web Confirm and pay.
8. **Third-party marks** (Visa, Mastercard, PayPal) and **3D illustrations**, which are art, not
   chrome.

### What is NOT coloured, which is the load-bearing half
- **PRICES ARE BLACK.** MEASURED glyph core `#020202` on `$356`, marked tappable by an UNDERLINE, not
  by a hue (https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3). A full month of nightly
  rates is black (https://mobbin.com/screens/0b18b761-107c-4e36-b112-df4bfc73b402). `$0.00` is GREY,
  not red.
- **LINKS ARE BLACK AND UNDERLINED.** Every one, across four passes: Learn more, Show more, Show
  original, Full policy, Price breakdown, Update, Edit, Add, Start, Deactivate, See all reservations,
  Learn how payouts work, Remove, Reset, Clear dates, Report this listing. **Not one blue link in
  roughly 150 screens.** The only blue text found anywhere is the small legal line under a checkout
  CTA, and that sample was flagged low confidence.
  https://mobbin.com/screens/45f2625c-6e4e-4385-8e7a-faa4381f0db7 ·
  https://mobbin.com/screens/324218c7-44d9-4e3e-813e-cf46e1ff82d4
- **STARS ARE BLACK.** MEASURED: a PIL scan of the five-star row on the PDP returns maximum
  saturation **0.00**. https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3
- **TOGGLES AND CHECKBOXES ARE BLACK when on**, not green and not blue.
  https://mobbin.com/screens/49df298a-b4e9-43b4-a3e7-def86bfa1dbf
- **EVERY SELECTED STATE IS BLACK.** Black-filled month chip, black-filled time slot, black circle
  date, black-filled calendar cell, black-filled filter pill, 2px black card border, 2px black tab
  underline, black slider track and thumb, black rating-distribution bar. Their grey selected fill
  exists and is reserved for one job, the web sidebar's active nav row.
- **DESTRUCTIVE IS NOT RED.** "Deactivate your account" is black underlined text
  (https://mobbin.com/screens/324218c7-44d9-4e3e-813e-cf46e1ff82d4). "Cancel Reservation",
  "Unsubscribe" and "Log out" are all black filled buttons.
- **UNAVAILABLE IS NOT RED.** Grey strikethrough, for missing amenities and for blocked dates.
- **DISCOUNTS ARE NOT A COLOURED BADGE.** Old price grey struck through, new price black underlined,
  no pill and no green. https://mobbin.com/screens/4b9d614f-7f68-47bb-83e6-7fd35efca097
- **SAFETY WARNINGS ARE BLACK TEXT** with an outline icon, not red.
  https://mobbin.com/screens/2f6ce85f-86b6-4a96-b19f-cd717544adf7

### The primary button is not one answer, it is two
Black is the DEFAULT. The brand hue appears only on the single irreversible commit.

BLACK, MEASURED `#222222`: Next, Continue, Got it, Done, Confirm, Save, Log out, Add to cart,
Cancel Reservation, Set up payouts, Add payout method, Add tax info, Manage payments, Add payment
method, Add gift card, Show 1,000+ places, Switch to hosting, Create referral link.
https://mobbin.com/screens/8695e4bb-1a1f-42bb-bbf9-aa2964fe2fc3

RAUSCH: Reserve, Confirm and pay, Request to book, Complete Booking, Show dates, Get Early Access,
Get started on the referral programme.

**The proof it is deliberate:** one flow contains a black "Next" and a Rausch "Request to book" three
screens later, split exactly at the point of no return.
https://mobbin.com/flows/5b91784c-84a8-41e5-9f29-138275095d5f
On web checkout the same page does it: steps 1 and 2 advance with a black "Next", only step 3 commits
with Rausch. https://mobbin.com/screens/5dae47fd-6764-4452-b208-324c253af5a8 versus
https://mobbin.com/screens/3ca7c32d-ae98-4d86-b410-78524da5648a

**Across every operator screen in four capture passes there are ZERO coloured buttons.**

### The one-line summary of the colour axis
Our budget and theirs are about the same size. We SCATTER ours across links, review counts, stars,
steppers, dates, discount pills and chips. They CONCENTRATE all of it into one object. Same budget,
opposite distribution. Adopting Airbnb on colour means LESS colour on almost everything and more
discipline on one thing, not a colourful product.

---

## 5. Actions

### Position, three patterns that never mix
1. **iOS: a pinned white bottom bar** with a top hairline. A running summary or a dismissive
   underlined link on the LEFT, the pill on the RIGHT. "$25 for 1 guest" then Next
   (https://mobbin.com/screens/e4fff56f-b88d-4e5f-9d84-4b423ec7e108); "Reset" then Next
   (https://mobbin.com/screens/11dd34c9-777f-4370-ba40-75759998ca19); price and "Free cancellation"
   then Reserve (https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3).
2. **Web operator pages: NO pinned bar at all.** The button sits inline, left aligned, auto width,
   directly under its own section heading: "Manage payments" under Your payments, "Add payment
   method" under Payment methods, "Add gift card" under Airbnb gift credit.
   https://mobbin.com/screens/e79a5fae-83c1-4605-8bfb-e976e3bfdd08 Row-level actions are underlined
   black text right-aligned on the row.
3. **Web index pages: utilities top-right as white hairline pills**, and no filled button anywhere on
   the page. Filter, Export, Print.
   https://mobbin.com/screens/cfdef9ed-1b48-4951-ab9a-e0b5cd99ec47

### The four-rung ladder
1. **Black fill**, one per screen, for the primary.
2. **White fill with a hairline border**, for a secondary that still reads as a button. "Set up
   payouts", "Refresh", "Filter", "Export", "Print", "Manage photos", "Details".
3. **A GREY-FILLED PILL**, for a low-stakes read-only jump. "View earnings summary", "Show all 55
   amenities", "Show all 199 reviews", "Get started", "Done" top-right in account settings. We have
   no equivalent tier.
4. **A bare black underlined text link**, for the lowest tier and for every Back affordance.

Disabled is a grey pill with grey text.

### The rule worth stealing outright: an ALERT NEVER GETS THE PRIMARY BUTTON
On the Earnings payout alert, the actions inside the card are an underlined link and a white hairline
button. The alert claims attention with its 32px disc and hands visual weight back to the screen, so
a black-free alert card sits directly above a huge black headline and the headline still wins the
page. https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc

This is what lets a photo-less operator screen carry an urgent problem without the whole screen
becoming an alarm, which is the shape our terminal kept failing at.

### Trust copy sits in the DOM under the commit, every time
"You won't be charged yet" under Reserve
(https://mobbin.com/screens/7cbdb1f6-a5dd-4afa-a957-a30442256f6e), "Free cancellation" beside the
price in the PDP bar, the full terms line plus an itemised base, service fee, taxes and total above
"Request to book" (https://mobbin.com/screens/992ccadf-13af-4938-a38d-61257ef03143). Our trust floor
at `CLAUDE.md:117` already demands this. Airbnb confirms it.

### Empty and zero states are far thinner than ours
- **The best move is to have no empty state at all.** Earnings with no data renders the POPULATED
  layout with zeros: the chart, the axis and the month strip are all present, and `$0.00` is simply
  greyed inside the black headline.
  https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f
- Web Reservations empty is one centred sentence plus an underlined black link. No icon, no card, no
  filled CTA. https://mobbin.com/screens/cfdef9ed-1b48-4951-ab9a-e0b5cd99ec47
- Host Calendar empty is a title, one sentence and a LEFT-ALIGNED white outline "Refresh" button, not
  a centred cluster. https://mobbin.com/screens/a543558e-7f77-455b-9a4c-47509519582f
- Their iOS empty states do the full job properly, with a 3D illustration and a centred cluster.
  https://mobbin.com/screens/8249f9ca-1fdc-4f97-870f-974d6811a36c

Take the iOS treatment, not the web one. The web Reservations empty state leaves well over 30% dead
space below its action, which trips our own NEVER-AGAIN floor 3 (`CLAUDE.md:54`).

---

## 6. Rhythm and spacing

### Row pitch is set by row content, not by a global scale
- Sparse nav rows sit roughly 42px apart with no divider.
  https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64
- Stacked alert cards sit roughly 8px apart.
  https://mobbin.com/screens/d3a8ceec-6af8-4f17-8e78-a9526936ac10
- Listing-editor field cards sit roughly 8px apart in a single column.
  https://mobbin.com/screens/ad1e99c0-ebb6-4005-8338-d2b3e971438a
- Two-column web pages are split by a single vertical hairline with both columns white, never by a
  grey sidebar. https://mobbin.com/screens/c50369e0-6c52-45c6-b69f-695382b258aa

### Where this collides with us
Our DS-5 ladder at `_design-system/LOCKFILE.md:612-631` has three tiers sitewide: Section 32, Card
12, Group 16, with any `mt-5/mt-6/mt-7` named as a drift signal. **There is no tier for the single
most common vertical decision on any screen, the gap between a section heading and its own content.**
So it is hand-picked every time, and the hand-picked values are frequently the literals DS-5 calls
drift. Without a defined in-group gap, FLOORS LAW 5's own grouping proof (`CLAUDE.md:100`, "between
group gap >= 2x in-group gap") cannot be measured at all.

The one thing the terminal round got right on this axis, and it should become the rule: section gaps
measured exactly `[32, 32, 32, 32]` (`_design-system/TASTE_LOG.md:910-915`).

---

## 7. Writing voice

### Second-person sentences that state the state, in the biggest type on the screen
"You've made $0.00 this month", "You don't have any upcoming reservations", "Your reservation is
pending", "Your listing is ready to publish", "Verify your identity to finish booking", "Welcome,
Nabila!" over "Guests can reserve your place 24 hours after you publish"
(https://mobbin.com/screens/fc6b314f-c9b0-4ce8-bdc2-a68c51017c08).

Section headings are sentences too: "Where you'll sleep", "What this place offers", "How you'll get
paid". Destination names stay one-word labels.

### Where this collides with us, and one of these is a live defect
- **Register.** COPY_LAW.md §1 (owner 2026-07-29) settled formal register: `Sie` in German, `vous`,
  `Lei`. Airbnb's voice is second-person and warm, which is compatible with formal `Sie`, so there is
  no real conflict on the axis he cares about. But `_design-system/LOCKFILE.md:1859` still reads
  *"Du-form everywhere (existing rule)"* with a du-form locked example string. That is the section a
  builder opens when writing an empty state or a 404, and it hands out the register that was
  superseded by name three weeks earlier, so new copy silently reverses a 491-string sweep one string
  at a time. This is a stale-law defect, not an Airbnb question.
- **Length.** Nothing in our law says the anchor should be a sentence stating the state, and nothing
  warns that a 40px English sentence is not a 40px German one. "You've made" is eleven characters.
  "Sie haben heute eingenommen" is not. Our own i18n numbers put German and French 15 to 35% longer
  than English (`_rules/I18N_ROUTING.md` Rule 35, cited at `CLAUDE.md:130`), so a three-line English
  hero becomes a five-line German one. The sentence anchor must be tested at its longest locale
  before its size is locked.

---

## 8. The three-column table: what they do, what we do, the gap

Gap kinds: **rule we lack**, **rule we have that is wrong**, **rule we have and ignore**.

| Dimension | Airbnb does | We say | The gap |
|---|---|---|---|
| **Page ground** | White edge to edge on every screen including photo-less operator ones. MEASURED 92.4% of pixels in the 248-255 bucket on host Insights (https://mobbin.com/screens/ec1e902b-2557-4657-913c-9d29c531a542). Zero grey canvases in four passes. | `_design-system/LOCKFILE.md:1980`: *"The gray tray is RULE, not CONV: grouped/list/panel content on white with no photo anchor requires the sunken tray."* Every other §17 clause says "customer"; this one says nothing. | **Rule we have that is wrong, and the fix landed in the wrong file.** The 2026-08-16 scope fix went into `CLAUDE.md:66-92` (tier 5); §17.2 is tier 4, so the corrected copy loses the tie. |
| **What grey is FOR** | Seven fixed jobs, and page canvas is not one. Control fill `#F2F2F2`, disabled `#EBEBEB`, an 8-12px separator strip, a two-up fact card, a section band with white cards on it, the web sidebar active row, a photo fallback. | We define the token and its uses piecemeal (`CLAUDE.md:125` selected fill, `LOCKFILE:1980` tray, §3.5 input rest, contract shadow row tile ground). Nowhere does any file say what grey MEANS. | **Rule we lack.** With no job list, grey defaults to whatever a rule demands, and the biggest available job is "paint the page". |
| **Containers** | Bare rows default; cards rationed to four reasons. Card counts 0 to 1 on hubs, 5 to 8 only on editors. Border or shadow, never both, with one exception in ~150 screens. | Two dated decisions in opposition: THE CONTAINER TEST `LOCKFILE:561-584` (2026-07-28) versus the grouped list-card lock `LOCKFILE:633-647` (2026-06-11). | **Rule we have and ignore.** No arbitration line, and the shipped code follows the older one. |
| **Dividers** | Earned by row complexity. None on single-line nav rows, one at a section boundary, one per row once rows carry label plus value plus action. | `CLAUDE.md:138` legislates the divider's COLOUR; `LOCKFILE:585` its inset. Nothing says WHEN one appears. | **Rule we lack.** Airbnb's answer is two lines and could be adopted as is. |
| **The anchor** | A SENTENCE carrying the live number, 2.2x to 3.5x body, bigger than the page title. | FLOORS LAW 6 (`CLAUDE.md:101`) requires >=28px; the largest non-hero role on the ramp is Page H2 at 22px (`LOCKFILE:361-376`); the ceiling is 4 sizes. | **Rule we lack.** No legal 28px role exists, so the anchor requires an off-ramp size the drift-checker then flags. This is why photo-less screens come out flat. |
| **Title shape** | Label for wayfinding, sentence for the anchor, often both on one screen. | COPY_LAW governs register, the copy-economy block governs length. Neither says what SHAPE a title takes. | **Rule we lack.** Their screens read finished because the biggest type IS the data. |
| **Weight** | Bold does two jobs only. Shares 5% to 30%. Their PDP measured 3.1% and carries emphasis at 500. | EMPHASIS BUDGET caps weight-600 at ~30% (`CLAUDE.md:113`); §17.4 mandates TWO 600 anchors per card (`LOCKFILE:1985`); floor 2 caps a screen at 2 weights (`CLAUDE.md:53`) while the weight scale puts body 400, CTA 500, headings 600. | **Rule we have that is wrong.** A five-element card with two mandated 600s is ~40%, and a browse grid is nothing but cards, so the 30% ceiling fails arithmetically. And any screen with a heading, text and a button is at three weights before anyone decides anything. |
| **Colour** | 0.0% to 0.5% on operator screens. On the one screen that has a commit button, that button holds 79 to 80% of all colour. Stars, prices, links, toggles and every selected state are black. | Taste rule 3, `CLAUDE.md:35`, LOCKED 2026-06-10: 80/17, blue sparse on small clickable bits, the one commit CTA stays ink. | **Rule we have and ignore, plus the opposite distribution.** Same budget, scattered instead of concentrated. Full trade in section 9. |
| **Primary button** | Two fills split by irreversibility. Black is the default (MEASURED `#222222`). Rausch only on the irreversible commit. ZERO coloured buttons on any operator screen. | `LOCKFILE:16` (§0.2): primary CTAs stay `bg-s-ink`, blue NEVER fills a primary. Against it `LOCKFILE:1541` (§12.2) locks a BLUE dashboard CTA, and V3-D426 makes outcome screens inherit a semantic CTA. | **Rule we have that is wrong**, in that we ship three answers for one control. On the terminal, Airbnb and §0.2 AGREE: black. The blue dashboard CTA was rejected in TASTE_LOG Round D1 on 2026-07-15 and has been open a month. |
| **Secondary and tertiary** | Four rungs: black fill, white hairline, grey pill, bare underlined link. Plus: an alert never gets the primary button. | `CLAUDE.md:127`: secondary buttons neutral outline. CONTROL_ELEVATION gives the tree. No grey-pill tier, and no rule about what an alert's own action may look like. | **Rule we lack.** The alert-demotion rule is what lets a photo-less operator screen carry urgency without becoming an alarm. |
| **Action position** | Three patterns that never mix: iOS pinned bar, web operator inline under its heading with no bar at all, web index utilities top-right with no filled button. | Floor 3b and the sticky-CTA contract row (`CLAUDE.md:55`, `:147`) put every single-commit screen in a sticky bottom bar. | **Rule we lack, in two directions.** No operator equivalent, and no destructive carve-out, so account deletion and cancel-booking get put under the thumb, which `LOCKFILE` §14.9 requires the opposite posture for. |
| **Semantic colour anatomy** | Small and SOLID. Either a 20-32px filled disc inside a white hairline card, or a 6px dot inside a WHITE pill with BLACK text. 0.2 to 0.5% of the screen. Never a tint, never a band. | FLOORS LAW 1d (`CLAUDE.md:96`) says "at least one semantic-color moment" with no size, no shape and no carrier named. | **Rule we lack, and it is the direct cause of round 6.** A requirement with no anatomy is satisfied by the biggest cheapest surface in reach. |
| **Warm tint** | Whole page of a terminal-moment screen, or a modal sheet ground (MEASURED `#F4F1E9` at 97%), or a full hero band. All three still carry a BLACK button. Never a strip on a working screen. | Taste rule 3 bans warm cream by name. FLOORS LAW 4 requires warm pixels or the screen is a "dead-grey FAIL". `LOCKFILE` §1 RETIRED records `s-cream`, `s-butter` and the whole warm family as DELETED from `tailwind.config.js` on 2026-07-27. | **Rule we have that is wrong.** A mandate whose entire vocabulary was pruned three weeks before the mandate was last touched. The only warm token left is `s-warning.bg` `#FDF6E7`, which is exactly what a builder reached for. |
| **Imagery** | Nearly all Airbnb colour IS photography, and it is content. iOS PDP hero is 41.3% of the screen and holds 83% of colour. Operator screens carry no photograph and make no attempt to compensate. | FLOORS LAW 2 (`CLAUDE.md:97`): >= 1/3 photographic on customer viewports, met by more real salon content, never by a baked-in src (wired gate). | **Rule we have that is wrong outside browse.** On an account hub or a confirmation, route one is banned by a gate and route two is banned by FLOORS LAW 10, so the floor can only be met by breaking another rule. Restate it by JOB. |
| **Empty states** | The best move is no empty state: render the populated layout with zeros. Web empties are one sentence plus a link. | The states row (`CLAUDE.md:139`) has exactly ONE empty shape and it is a full-screen takeover with an illustration and a filled CTA. | **Rule we lack: the zero-state option**, and a section-level variant of floor 3. |
| **Rhythm** | Pitch set by row content. Nav rows ~42px, cards ~8px apart. | DS-5, three tiers (`LOCKFILE:612-631`). | **Rule we lack inside a rule we ignore.** No heading-to-content tier exists, and the live PDP renders section gaps at 40/48px, neither of which is in the table. |
| **Voice** | Second-person sentences stating the state, in the biggest type. | COPY_LAW §1 formal register (2026-07-29). But `LOCKFILE:1859` still mandates Du-form. | **Rule we have and ignore**, plus a rule we lack (nothing says the anchor is a sentence, and nothing warns about locale length). |
| **Selected state** | Black on every control type, without exception in ~150 screens. Grey is reserved for the web sidebar nav row. | `CLAUDE.md:125`, owner 2026-06-29, wired gate `no-black-selected`: selected = calm GREY, "NEVER black/ink fill", with four named exceptions including "booking date/slot stays blue". | The grey rule is HIS with a gate behind it, so it is a **collision, not a gap**. The BLUE date/slot exception is the gap and it is wrong on our own terms: it is the one place a booking screen carries two colour claims at once. |
| **Customer versus operator** | One visual language on both sides. The operator screens are the MOST achromatic and the MOST cardless in the estate. The only two things the guest side has extra are photography and one Rausch button. | Surface class is INFERRED FROM A FILE PATH: §12.4 scopes the operator skin to `app/[locale]/dashboard/**`. §17.2 and §17.5 name no audience at all. | **Rule we lack, and it is the root of the whole session.** The terminal prototype lived at `app/[locale]/dev/terminal/`, never picked up the operator carve-out, and was graded as a customer screen. |

---

## 9. The colour trade, honestly, with both dates

### The two positions
**Ours, LOCKED 2026-06-10, `CLAUDE.md:35`:** *"~80% neutral surfaces (white + COOL sunken #F4F4F5,
no warm cream), ~17% ink. Blue `s-accent #276EF1` goes ONLY on small clickable accents: text links,
small buttons / chips, small tappable metadata (review counts '(54)'). NOT on big CTAs. The one
primary/commit CTA stays ink (`bg-s-ink`)."*

That same rule already carries its own correction, dated 2026-07-28, in his file, verbatim: *"Apple
and Airbnb do NOT support this rule ... Airbnb's Reserve CTA is Rausch red. Only Fresha matches us
... This is a defensible MINORITY position aligned to the one competitor we locked structurally."*

**His, 2026-08-12, `CLAUDE.md:158`:** *"airbnb te is source of truth"*, on both axes, replacing
Fresha-for-structure and Uber-for-aesthetic. Plus his 2026-08-16 scoping answer putting colour
explicitly in scope.

### The first thing to say plainly: the premise that these collide head-on is FALSE as stated
Adopting Airbnb on colour does **not** mean more colour. On every axis except the final guest commit
button, Airbnb is MORE achromatic than we are today. The 2026-06-10 pivot bought restraint. Airbnb
has more restraint, not less. So the cost is not "we lose our black-and-white identity". The cost is
three specific things, listed below.

### What changes if we adopt it
1. **Text links go black and underlined.** Kills `#276EF1` on "Mehr lesen", the "(54)" review count
   on every SalonCard, "Buchung verwalten", checkout "Ändern" jumps, "Passwort vergessen",
   SalonLocation's "In Maps öffnen", the /team "View profile" link. Largest surface-area change, and
   it touches every customer screen. **Independent argument in its favour that has nothing to do with
   Airbnb:** accessibility-05 measured `#276EF1` at 4.17:1 on `s-bg-sunken`, which FAILS WCAG AA for
   body text, and our own Edge-Visibility floor promotes that tray as a default list surface. WCAG AA
   is tier 2 statutory (`CLAUDE.md:346`) and outranks a taste axis. Black plus underline passes on
   every surface we own.
2. **Booking date and time-slot selection goes black.** Kills the named blue exception at
   `CLAUDE.md:125`. Touches the shared `DateTimePicker`, the booking Zeit step and the search
   calendar. Clearest first-principles case of the lot: it is the one place our booking flow competes
   with its own Buchen button.
3. **The §13.2 stepper discs go black**, currently blue by owner-approved recipe. Touches
   BookingWizard and the walk-in tracker.
4. **The dashboard primary CTA resolves to black** across all 49 dashboard pages. `LOCKFILE:1541`
   currently locks it blue; TASTE_LOG Round D1 (2026-07-15) approved ink and the conflict has been
   open a month. Airbnb settles it on the evidence: zero coloured buttons on any host screen in four
   passes. The supersede still needs his name on it.
5. **The discount badge loses its pill.** Old price grey struck, new price black.
6. **The star goes black.** Most expensive single item, collides directly with taste rule 4. Flagged,
   not recommended. See the cost list below.
7. **Status pips come back, inside a neutral pill.** This is the one axis that moves the OTHER way.
   Taste rule 2 (`CLAUDE.md:34`) and `LOCKFILE:26` (§0.11) ban coloured status dots by name after a
   repeated owner flag, and Airbnb's shipped pattern is exactly a 6px dot inside a WHITE pill with
   BLACK text. Adopting Airbnb here means overriding a rule we wrote.
8. **The alert anatomy arrives:** a white card, one hairline, one 20-32px solid coloured disc, black
   title, grey body, and its actions demoted to an underlined link plus a white hairline button. This
   is the piece that most directly fixes the merchant terminal, because it gives a photo-less screen
   a semantic-colour moment at about 0.2% of the screen instead of a full-bleed tint.
9. **What does NOT change: our ink commit CTA.** On every operator button and every non-final guest
   button, Airbnb and `LOCKFILE:16` agree. The only genuinely open element is the ONE guest payment
   commit.

### What it costs
**One: the yellow star and the green discount pill.** These are the two places our colour is doing
marketplace work Airbnb does not have to do. Airbnb lists unique inventory, so no two listings are
substitutes and it never needs a price-comparison signal on a card. We list interchangeable salons in
the same three streets, where price and rating ARE the comparison. A yellow star and a green minus-X%
pill are preattentive in a scanning grid in a way a black star and a strikethrough are not. That is a
real first-principles cost and "Airbnb does it differently" does not answer it. **Recommend keeping
both as named Solen exceptions, on the record.**

**Two: blue as the learned hyperlink convention.** Our §1.5 rule is coherent: blue means this string
is a link. Replacing it with an underline is not a downgrade. The underline is the older and stronger
convention, it survives greyscale and colour blindness, and our own contrast measurement says blue
actively fails AA on the sunken tray. The cost here is migration, not quality: it is a sweep across
every customer screen, and until it completes the product carries two link languages at once, which
is worse than either.

**Three: the Rausch risk, and this is the one hard blocker, and it is statutory.** The gradient was
MEASURED off compressed Mobbin renders at `#C6165D` to `#D70665` (iOS) and `#E61E4F` to `#DA0A63`
(web). Those are teardown samples, not a sample from the live airbnb.com button, and a hex read off a
compressed render is not a contrast measurement. The light end plausibly lands in the 3 to 4:1 band
against white text, which clears WCAG's 3:1 large-text floor for a bold button label and sits under
the 4.5:1 normal-text floor, taking its margin from the dark end of the gradient rather than from the
fill as a whole. Our ink CTA measures roughly 19 to 21:1. WCAG AA is tier 2 statutory and cannot be
outranked by a taste source. **So: no Rausch-equivalent Solen commit colour ships until the hex is
sampled off the live button and the ratio is computed at our actual CTA label size. If it lands under
4.5:1 the answer is a darker Solen-specific commit colour, not Airbnb's.**

### What it costs to NOT decide, which is the real current cost
Right now every CTA colour and every blue decision gets made twice, differently, because §0.2 says
ink, §12.2 says blue, V3-D426 says outcome-coloured, and the source-of-truth line says Airbnb. That
is not a stable position, and it is a large part of why one merchant screen took six rounds.

---

## 10. What we are missing, ranked

### 1. Surface class must be a DECLARED property, and the repair must land in LOCKFILE, not CLAUDE.md
This alone prevents rounds 5 and 6, the two rejections the law demonstrably caused. Today class is
inferred from a directory (`_design-system/LOCKFILE.md` §12.4 scopes the operator skin to
`app/[locale]/dashboard/**`), which is why a terminal prototype at `app/[locale]/dev/terminal/` was
graded as a customer screen. Every screen-level file declares one line: customer, operator,
internal-tool, or prototype. Then §17.2's tray sentence becomes *"on a CUSTOMER screen, grouped
content on white with no photo anchor requires the sunken tray; on an OPERATOR screen the tray is
forbidden by default"*, and §17.5's unqualified "or mockup" becomes "or customer mockup".

**Critical detail: the 2026-08-16 fix went into `CLAUDE.md:66-92`, which is tier 5, while §17.2 is
tier 4, so the corrected copy currently LOSES the tie.** The repair has to move up a tier to hold.

### 2. The semantic-colour requirement needs an ANATOMY, and the container test must be senior to the tray rule
FLOORS LAW 1d names no size, no shape and no carrier. That is exactly how `#FDF6E7` became a
full-bleed bar. Airbnb's measured answer is one shape at one scale: a 20 to 32px solid disc inside a
white hairline card, or a 6px dot inside a white pill with black text, totalling 0.2 to 0.5% of the
screen, and never a tint or a band on a working surface
(https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc).

In the same edit, state the arbitration the estate has never had: the 2026-07-28 CONTAINER TEST is
senior, so a container is earned by its three cases first, and only THEN does the tray rule apply.
Today the two form a closed loop: a settings list needs a tray, a tray is non-white, a non-white
surface earns a card, and the container test's own named list says that screen gets no card.

### 3. A photo-less screen needs a legal way to look finished, and an unsatisfiable floor must be NOT APPLICABLE rather than manufactured
**Positive half.** Add a named 28 to 40px anchor role to the §2.5 ramp, and specify that on a data
screen the anchor is a SENTENCE carrying the live number, "Sie haben heute 7 Termine" at about 2.2x
body, tested at its longest locale. That is precisely how Airbnb makes a white, cardless, colourless
Earnings screen read finished (https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f).

**Negative half.** One standing sentence: *a floor that a screen's content cannot honestly satisfy is
not satisfied by manufacturing content; it is not applicable, and the mockup's `floors:` note says
so.* Plus the requirement that every positive floor names at least one legal route on the screen
classes it binds. Without it, FLOORS LAW 1a (photo), 1c (number) and 1d (colour) have no exemption
list while floor 2 does, so a photo-less colour-less operator screen is ordered to invent all three.

### 4. The divider ladder
We legislate the divider's colour and its inset and never its trigger. Airbnb's three-rung ladder
(none on single-line nav rows, one at a section boundary, one per row once rows carry label plus
value plus action) is two lines and could be adopted as is.

### 5. The alert-demotion rule
An alert never gets the primary button. Its actions are a white hairline button and an underlined
link. This is the piece that lets an operator screen carry urgency without becoming an alarm.

### 6. The heading-to-content gap tier
DS-5 has three tiers and none of them covers the most common vertical decision on any screen. Until
it exists, FLOORS LAW 5's own grouping proof cannot be measured.

### 7. The zero-state option
Keep the populated layout, put the zero in the headline. Our law has exactly one empty shape and it
is a full-screen takeover, so a merchant terminal on a quiet Tuesday is required to replace its own
working layout with an illustration and a CTA.

### 8. The grey-pill tertiary tier
A low-stakes read-only jump has no home in our four-rung ladder, so it gets built as a secondary
outline button and reads heavier than it is.

---

## 11. Explicitly do not copy

1. **Rausch as "the primary button colour".** It is not one. On the operator side there is no Rausch
   button at all, and even guest-side non-payment actions are black. Adopting it globally would put
   pink on merchant-terminal buttons where the named source of truth uses black. And it is a colour
   BUDGET, not a colour choice: the button is loud because everything around it is silent. Take the
   pink without the silence and you get a pink button competing with coloured prices, coloured links
   and a yellow star, which is louder AND flatter than what we have now.
2. **The photographic band on web host Today**
   (https://mobbin.com/screens/fc6b314f-c9b0-4ce8-bdc2-a68c51017c08). It is a hardcoded decorative
   image with no data behind it, used purely to warm up an operator page. Banned by name after three
   owner rejections and by the wired `no-decorative-image-gate`. Take the white-and-hairline Earnings
   answer instead.
3. **The greyed `$0.00`.** Elegant, and we cannot have it: FLOORS LAW 6 bans tertiary grey as text on
   WCAG grounds and the number is load-bearing data.
4. **The whitespace-only row list** (no divider, no container). It works for Airbnb because those
   rows have a strong left-edge anchor and low density. A salon reservation row is time, client,
   service, staff, duration, price and status on one line with no image to anchor it. Airbnb agrees
   with this: the moment its own rows get dense it switches to hairlines
   (https://mobbin.com/screens/5fbce9d9-8dc5-4a99-a675-c05fb1839971).
5. **The web empty state.** Well over 30% dead space below the action, which trips our own floor 3.
   Their iOS empty states do it properly.
6. **The all-red alert card.** Airbnb itself appears to be leaving it: the identical message renders
   as a white card with a coloured disc and black text in other captures of the same surface.

---

## 12. Sources

Roughly 150 distinct Mobbin screens across four independent capture passes. Every claim above carries
its own URL inline. The highest-value screens, the ones that answer our specific question, are:

- iOS host Earnings, the direct merchant-terminal analogue:
  https://mobbin.com/screens/38a4bdf6-3733-4ec9-8276-819f864bc5dc and
  https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f
- iOS host Insights, zero chromatic pixels:
  https://mobbin.com/screens/ec1e902b-2557-4657-913c-9d29c531a542
- Web Taxes, grouped photo-less content on pure white:
  https://mobbin.com/screens/8d23bf7e-ccad-4e6d-a8f5-fc2e3e81e9d6
- iOS Account settings, zero cards and zero dividers:
  https://mobbin.com/screens/936fbfe8-4c12-4c69-95f0-6c56b7dede64
- Web Confirm and pay, the colour concentration proof:
  https://mobbin.com/screens/3ca7c32d-ae98-4d86-b410-78524da5648a
- The flow containing both button fills:
  https://mobbin.com/flows/5b91784c-84a8-41e5-9f29-138275095d5f
- Host Listings, the white-pill status pattern:
  https://mobbin.com/screens/d8494673-d50a-497f-b350-c4646a14db7c
- The warm cream sheet, measured `#F4F1E9`:
  https://mobbin.com/screens/7c140f48-a9ae-4420-8686-9018dc681449

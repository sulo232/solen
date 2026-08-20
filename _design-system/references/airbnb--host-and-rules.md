<!-- exists-check: `npm run exists airbnb` run this turn (20 hits, 4 of them graveyard rows, all
     read). All eleven existing Airbnb documents were read before a word of this was written:
     AIRBNB_SYSTEM_VS_OURS.md, airbnb--animated-icons.md, airbnb--category-switch.md,
     airbnb--fonts-vs-ours.md, airbnb--home-mobile.md, airbnb--home-search-chrome.md,
     airbnb--icons-vs-ours.md, airbnb--profile-1to1-diff.md, airbnb--profile-list.md,
     _design-system/AIRBNB_PROFILE_PRINCIPLES.md and
     _design-system/research/AIRBNB_TEARDOWN_2026-08-16.md.
     Those already own: their token layer, their fonts, their icons, their profile and account
     anatomy, their category switcher, their search chrome, their home body, and the teardown's
     eight-axis walk. This file does not re-take any of their numbers; where it needs one it cites
     theirs.
     WHAT IS NET NEW HERE, and it is why the file exists rather than an edit to one of them:
       1. colour DISTRIBUTION, meaning where all of the colour on a screen goes, not how much;
       2. colour as a RANK rather than a LABEL, which is a rule none of the eleven states;
       3. the TRIGGER for a box and for a divider (we legislate a hairline's hex and its inset and
          never when one appears);
       4. the missing "not applicable" clause in our own display-anchor floor;
       5. the host operator screens, which only the teardown touches and only on two axes.
     It also CORRECTS three things this estate had written down wrong. They are in section 2.
     REMOVED.md checked for every finding below. Nothing here re-opens a graveyard row; the two
     that come close (black selected state, the 6/5 card) are surfaced as conflicts, not applied. -->

# Airbnb, host screens and the nine rules

REF: airbnb / ios-host-via-mobbin plus web-mobile / host and cross surface / static

## Identity

- **Brand / platform / surface:** Airbnb. Two halves, and they were captured differently, so they
  carry different confidence.
- **Web half:** `https://www.airbnb.ch/`, live, first viewport, real browser at 390 wide, swept the
  morning of 2026-08-20. The raw sweep is `public/_pixel-refs/airbnb/2026-08-20/computed.json` with
  four screenshots beside it. That folder is gitignored (`.gitignore:83`), so the two mobile stills
  were copied to `public/_mockups/_assets/refs/airbnb/2026-08-20/`, which is tracked and served, and
  that copy is what the visual page renders.
- **Host half:** Mobbin iOS stills. `airbnb.com/hosting` and `airbnb.com/multicalendar` both
  redirect to a login we do not have, so the operator screens could not be measured live.
- **TIMING IS NOT MEASURED, anywhere in this file.** Mobbin gives ordered stills and no video, so
  nothing about the host screens' motion, durations or easing is known. Any number for it would be
  invented, so there is none.
- **Why this file:** owner 2026-08-12, "airbnb te is source of truth". The eleven earlier documents
  answer what Airbnb's parts look like. This one answers what their rules are.

## Philosophy

They do not ration colour evenly, they concentrate it. One object on a screen is worth committing
to and it takes nearly all the colour, or the screen runs at zero and nothing is lost. A hue then
says how much something matters, never what it is about, so the same problem is red in one place
and blue in another and neither is wrong. Everything you cannot act on is rendered quieter than
everything you can, which is why their empty calendar cell is brighter than their past one. The
biggest type is never the screen's own name, it is a fact the screen just learned. And a box, a
divider and a heavy weight are all earned by how complicated the content is, never by how the group
feels.

## 1. Measured, the four claims in the brief, checked

| claim | verdict | tag |
|---|---|---|
| brand pink appears once on mobile home | **understated** | verified |
| ink is rgb(34,34,34), grey is rgb(108,108,108) | **confirmed** | verified |
| four weights, 700 second most common | **refuted** | verified |
| exactly one 2px black border, the selected state | **holds on mobile** | verified |

**Claim 1, understated.** Their mobile home first viewport carries three chromatic objects, not
one: brand as text once, `rgb(218,18,73)`; brand as a background once, `rgb(255,56,92)`; and one
blue button background, `rgb(0,115,229)`. The sweep counts text colour and background colour in two
separate lists and the claim was read off one of them. The honest rule is that the chromatic objects
on one of their screens are counted on one hand. (verified, live this session at 390)

**Claim 2, confirmed.** `rgb(34,34,34)` 99 times on home and 74 on search; `rgb(108,108,108)` 162
times on home. It matches the token already recorded at `AIRBNB_SYSTEM_VS_OURS.md:171`, so two
independent captures agree. The gap to our `#0A0A0A` is visible, not academic: colour distance
10.49, roughly ten times the threshold at which a human sees any difference at all. (verified)

**Claim 3, refuted, and this is the one that would have cost us most.** Of the 14 nodes computing
weight 700 in the first viewport, 12 are a comma or a middle dot at 12px in a grey measuring
1.80 to 1, one is a screen reader H1 rendered 1px by 1px and clipped away, and one is a cookie
banner. There are 112 of those punctuation spans page wide. Visible content runs 400, 500 and 600.
So the reference stretches our two-weight cap by one, not by two. (verified, live re-run this
session)

**Claim 4, holds, with a caveat.** One 2px black border on their mobile search, and it is the
selected state. Search mobile also carries a 2px `rgb(26,115,232)` border, and search desktop
carries that blue one with no black at all. `rgb(26,115,232)` is the Chrome default focus ring, so
it is probably not a design decision. (expect. I did not reopen the page to see which element
carried it.)

## 2. Three corrections to our own files

**2a. `airbnb--fonts-vs-ours.md:112` says Airbnb never uses weight 700 anywhere, and lines 136 to
141 say Chrome collapses 600, 700 and 800 into one rendered face.** A canvas re-run inside the live
page returned six distinct ink pixel counts across weights 300 to 800 and six distinct widths, so
the font does interpolate. The known-answer control in the same script: Arial on that page **did**
collapse to two shapes, which is exactly the pattern that file described. What it measured was a
fallback font, not Cereal. (verified)

**2b. The one-pink claim, corrected above in claim 1.** Three chromatic objects, not one.

**2c. `_design-system/references/airbnb--home-mobile.md` closes with "their weight-600 share is not
measured".** It is measured now: 5 of 43 visible content nodes, 14.0%, once hidden nodes and
punctuation spans are excluded. (verified, this session)

## 3. The nine rules

**Rule 1. Colour is concentrated into one object, or the screen has none at all.**
It is not rationed evenly by size. Either one thing is worth committing to and that one thing holds
roughly four fifths of every coloured pixel, or the screen runs at zero.
*Evidence (verified, pixel measured, in `AIRBNB_TEARDOWN_2026-08-16.md` section 4):* web Confirm and
pay is 2.08% of screen area and holds 79% of all colour; the iOS Reserve button holds 80%; host
Insights and host Earnings both measure 0.00% chromatic; the whole host calendar month grid measures
0.07%.

**Rule 2. A hue ranks how much something matters. It never says what something is about.**
No colour is ever assigned to a category, a service type or a status name.
*Evidence (verified):* the same missing-payout problem renders with a red disc on iOS and a blue
disc on web. The identical Guest favorite badge is gold on iOS and black on web. Destructive is not
red either: "Deactivate your account" is black underlined text and "Cancel Reservation" is a black
filled button.

**Rule 3. A status hue lives in a small mark, and the words next to it stay ink.**
Colour never carries text on top of itself. The flip side: a mark that carries no information, a
hairline or a gridline, is free to be as faint as it likes.
*Evidence (verified):* their status pattern is a 6px coloured dot inside a white pill with black
text. Their divider greys measure 1.36 to 1 and 1.19 to 1 and carry nothing. Their palest text grey,
1.80 to 1, appears 110 times on the home page and every single instance is a comma or a dot. They
never set a fact in it.

**Rule 4. Whatever you cannot act on is rendered quieter than whatever you can.**
Empty, past, blocked, unavailable and not yet actionable are all quiet. Nothing meaning "nothing
here" is ever the loudest object on a screen.
*Evidence (verified, pixel measured):* on the host calendar, past cells measure `#EBEBEB` at 83%
brightness while bookable future cells measure `#FFFFFF` at 88%. Grey literally means you cannot act
on this. Blocked dates and missing amenities are grey strikethrough.

**Rule 5. The biggest thing on a screen is a fact the screen just learned, never the screen's own
name, and a zero is shown honestly.**
A title is a small label saying where you are. The anchor is the number or the photograph that
answers why you came. A screen with no data renders the populated layout with zeros rather than
swapping in an empty state.
*Evidence (verified, in the teardown section 3):* on host Earnings the word "Earnings" is a small
label and "You've made $0.00 this month" underneath runs 2.2 to 2.9 times body size.

**Rule 6. Weight does exactly two jobs, a heading and a row's identifying label.**
Values, meta, timestamps and prices in body position are all regular. Heavy weight lands on about
one seventh of the text on a screen.
*Evidence (verified, live this session):* weight 600 or above is 5 of 43 visible content nodes,
14.0%, once hidden nodes and punctuation are excluded. That sits between their PDP at 3.1% and our
own PDP at 17.6%, both already recorded in the LOCKFILE emphasis budget.

**Rule 7. A box and a divider are the same decision at two scales, and both are earned by how
complicated a row is, not by how the group feels.**
Single-line rows get whitespace plus one hairline where the group ends. Rows carrying a label, a
value and an action get a hairline each. Nothing ever gets a box **and** a hairline between every
row.
*Evidence (verified, pixel measured, in `airbnb--profile-list.md`):* two recipes on the same device
within one minute. Icon plus label plus chevron runs 56.0pt pitch with zero variance over 19 rows,
zero dividers inside a group, exactly one hairline at the group end. Label plus subline plus a
right-side action gets a hairline after every row. Same margin, same greys, opposite answer, and row
complexity is the only variable that changed.

**Rule 8. Buttons come off one ladder chosen by stakes, and colour is reserved for the single
irreversible commit.**
Black filled for the one thing this screen is for, white with a hairline for a real secondary, a
grey filled pill for a low-stakes read-only jump, bare underlined black text below that. An alert
never gets the primary button.
*Evidence (verified, in the teardown section 5):* black on Next, Continue, Save, Log out and Cancel
Reservation. Brand fill only on Reserve, Confirm and pay, Request to book. One flow carries a black
"Next" and a brand "Request to book" three screens later, split exactly at the point of no return.
Zero coloured buttons on any operator screen across four capture passes.

**Rule 9. Something on screen changes within one frame of a tap, and that something is never the
data.**
Confirming the tap and delivering the content are two separate systems, and the slow one is not
allowed to gate the fast one.
*Evidence (verified, live instrumentation, in `airbnb--category-switch.md`):* the URL updates
synchronously inside the click handler before any network request fires, a skeleton mounts within 40
to 60ms in every trial cold or warm, and the header and tab row never repaint. The real content swap
runs 100ms warm to 949ms cold and is decoupled from all of it. Their smoothness is not an animation,
it is the absence of a dead zone.

## 4. What the host stills show, described not measured

- **A "Select a time" sheet**, which is their version of the exact screen we are fixing: a day's
  worth of time slots as a vertical list. Each slot is a white card with a hairline, the selected one
  takes a 2px black border, and there is no colour anywhere. Each row carries three facts: the time
  range, the price, and "10 spots left". Availability is a NUMBER, never a colour, and never the word
  free repeated down the page. (verified from stills; no pixel measurement, Mobbin renders at its own
  scale)
- **The host bottom bar** reads Today, Calendar, Listings, Messages, Menu. Today is first, not the
  calendar. (verified from stills)
- **The empty Today tab** shows an illustrated object, a Today and Upcoming segmented pill, and a
  pinned action card at the bottom reading "Confirm a few key details, Required to publish".
  (verified from stills)
- **Earnings** leads with a sentence carrying the live number, "You have made $0.00 this month", the
  number grey inside black words, at display size, showing zero honestly. (verified from stills)
- **Listings** marks the one thing needing attention with an "Action required" pill and a red dot,
  and leaves everything else quiet. (verified from stills)

## 5. What we do instead, one line each, measured on our own running product this week

1. **Colour spread thin, then spent on nothing.** `app/[locale]/dashboard/calendar/page.tsx:749`
   fills every free slot's whole row with green, so on a quiet day the loudest colour on the shop
   owner's phone is the absence of work. (verified)
2. **Our hue names a topic.** `page.tsx:653` picks a booked slot's fill from a lookup keyed on the
   service category, so the colour says "spa" instead of "this matters". (verified)
3. **We put status text on its own tint.** `#16A34A` on `#E8F5E9` measures 2.93 to 1. AA needs
   4.5 to 1 at that size. The loudest thing on the screen is also the least legible thing on it.
   (verified)
4. **We inverted rule 4.** Eighteen saturated green rows for free half hours, and a real booking
   recedes into pale blue `#EAEFFE` (`page.tsx:749` and `:750`). (verified)
5. **No anchor at all.** Across all 1192 lines of that file the only rendered figure is a slot count
   at 12px at 40% ink, on desktop only. The biggest type on the phone calendar is a 17px date
   header. (verified)
6. **Everything is bold.** That block declares `font-semibold` 12 times and `font-medium` zero
   times, so heavy weight is effectively 100% of the styled text against their 14%. (verified)
7. **A box inside a box.** `page.tsx:740` wraps a homogeneous slot list in a 16px bordered card and
   then puts every row in its own 12px coloured block, and neither carries a selected state.
   (verified)
8. **Three answers for one control.** LOCKFILE 0.2 says primary CTAs stay ink, 12.2 locks a blue
   dashboard CTA, and V3-D426 gives outcome screens a semantic CTA. There is no low-stakes grey pill
   tier at all. (verified)
9. **A 360 to 400ms dead zone** after a header category pill is clicked, measured over two clean
   trials. Half of that has since closed, all three category routes now carry a `loading.tsx`, and
   the other half is open: `useLinkStatus` has zero call sites anywhere in the app (grep over `app`,
   `components`, `lib` returns 0), and we are on Next 15.3.8, which ships it. (verified this
   session)

## 6. Port map, their value to ours

| axis | theirs | ours | port |
|---|---|---|---|
| ink | `rgb(34,34,34)` (verified) | `#0A0A0A` (verified) | frozen literal, distance 10.49, his call, see CONFLICT 7 in `AIRBNB_SYSTEM_VS_OURS.md` |
| secondary grey | `#6C6C6C` (verified) | `#6B6B6B` (verified) | distance 0.40, invisible, NO CHANGE |
| hairline | `#DDDDDD`, 1.36 to 1 (verified) | `#E4E4E7`, 1.27 to 1 (verified) | near enough, no new hex, already settled in `airbnb--home-search-chrome.md` |
| free / actionable cell | `#FFFFFF` (verified) | `#E8F5E9` green (verified) | port rule 4, white or sunken, drop the green |
| unactionable cell | `#EBEBEB` (verified) | same green as free (verified) | port rule 4, quiet is the signal |
| status mark | 6px coloured dot in a white pill, black text (verified) | coloured text on its own tint (verified) | port rule 3, keeps the semantic hue and fixes the contrast in one move |
| brand-fill text pair | `#FF385C` fill 3.52 to 1, `#DA1249` text 5.04 to 1 (verified) | one `#276EF1` for both jobs, 4.17 to 1 on sunken (verified) | we already own the fix, `s-accent.deep` `#1E54B7`, 6.98 to 1 on white and 6.35 to 1 on sunken, already in `tailwind.config.js:221` |
| weight >= 600 share | 14.0% visible content (verified) | 100% of the agenda block (verified) | port rule 6, two jobs only |
| box or divider trigger | row complexity (verified) | undefined, every list re-decides (verified) | port rule 7, this is the biggest structural gap |
| anchor | a sentence with the live number, 2.2 to 2.9x body (verified) | a 12px count, desktop only (verified) | port rule 5 |
| tap feedback | skeleton within 40 to 60ms (verified) | 360 to 400ms dead zone, half closed (verified) | wire `useLinkStatus`, no new dependency |

## 7. Conflicts. Owner call, every one of them.

**CONFLICT [display anchor]: reference says no display type at all, lock says at least 28px on every
customer screen.** FLOORS LAW 6 (2026-07-21) requires an anchor of at least 28px, and the emphasis
budget requires it to be at least 1.8 times body. Airbnb's mobile home has a largest **visible**
element of 18px over a 12px body, a ratio of 1.5, across five sizes. The single 28px node in this
morning's sweep is a screen reader H1 measured at 1px by 1px and clipped, so it never paints. Their
home fails all three of our floors. The floors outrank a taste source, so nothing changes without
him. The separate question worth deciding: our floor has no "not applicable" clause, so on a screen
with no fact to lead on, a builder is forced to manufacture an anchor. Owner call.

**CONFLICT [card depth]: reference says ring and shadow together, lock says a card carrying
elevation drops its border, never both.** Our surface table (2026-07-21) is explicit. Their listing
tile carries a 1px ring **and** a real drop shadow at the same time, on 18 elements in one viewport,
and the ring resolves to 1.04 to 1 so it reads as edge definition rather than a border. Second part,
also a frozen literal: at the identical 10% alpha their shadow reaches about 20px below the box and
our `shadow-whisper` reaches about 10px, because of a -14px spread. Dropping that spread is a one
value change. Owner call.

**CONFLICT [selected state]: reference says a 2px black border on white, lock says blue on booking
dates and slots, and the graveyard says black surrounds are dead.** The blue is locked by name as
one of exactly four exceptions (`LOCKFILE.md:737` and `:1599`), and `REMOVED.md` records on
2026-06-23 that the booking calendar, slots and tabs were deliberately left on blue pending an
explicit go-ahead. Separately, on 2026-07-02 he killed a black surround on a selected state in the
same breath as the blue one, verbatim "I don't want the black surrounding OR blue surrounding thing,
just sync it out grayed", and `no-black-selected-gate.py` enforces exactly that. So Airbnb's answer
is dead here twice over and the reference does not resurrect it. Two facts before he decides: the
dashboard agenda has no selected state at all today, so this only bites the customer booking picker,
and the Airbnb screen it comes from may be guest facing rather than host facing, since our own
teardown records its bottom bar as a price per guest. Owner call.

**CONFLICT [separator dot]: reference ships 110 of them on one page, lock bans the dot by name.**
Taste rule 2 says that where two bits already differ by colour or weight, that contrast is the
separator. Airbnb's dots are legal there only because of their value, 1.80 to 1, which makes them
disappear. This is a dated house rule against the source of truth. Owner call.

**CONFLICT [weight cap]: reference runs three visible weights, lock caps a screen at two.**
NEVER AGAIN floor 2 caps a screen at two weights, while our own roles table puts body at 400, CTA at
500 and headings at 600, so any screen with a heading, some text and a button is at three before
anyone decides anything. Airbnb's visible content also runs three. The reference licenses raising
the cap to exactly three and naming the two jobs weight is allowed to do, not going to four.
Owner call.

**CONFLICT [link colour]: reference has no blue link anywhere, lock says text links are blue
`#276EF1`.** Taste rule 3, dated 2026-06-10. Airbnb has not one blue link across roughly 150
screens; sixteen link strings are all black and underlined. The block itself already records that
the Apple and Airbnb citations behind that lock were corrected as wrong on 2026-07-28, leaving
Fresha as the only support, and Fresha is no longer our source of truth. A narrow version, operator
screens only, touches about four class strings and leaves customer surfaces alone. A shop owner
would barely notice this one, which is why it ranks last. Owner call.

## 8. Explicitly do not copy

This extends section 11 of `AIRBNB_TEARDOWN_2026-08-16.md`, it does not repeat it. Its six entries
still stand.

1. **Their 700 weight.** It is 112 commas and a clipped heading, not an emphasis decision. Reading
   the raw sweep as licence to go to four weights would be building on punctuation.
2. **Their fixed row pitch.** 56.0pt with zero variance over 19 rows holds because none of those
   rows carries anything but a label. Ours do: the account hub sublines carry the next appointment,
   the saved card, active vouchers, saved stores and stamps, and he kept exactly those five by name
   on 2026-08-05. A fixed pitch on a variable-height row either clips that data or deletes it to buy
   rhythm. Their group step is 1.59 times, which is also below our own 2x minimum, so on this axis
   the reference is the looser example.
3. **The grey `$0.00`.** They set the number itself in grey inside black words. Here the number is
   the fact, and faint grey on load-bearing text is banned on contrast grounds. Our version keeps the
   number ink and greys only the words around it.
4. **Their single 20px radius.** It would erase the 16 for an individual card versus 24 for a
   grouped card split he made by name on 2026-07-19, "stylists are individual not groups", and it
   buys 4px.
5. **Their secondary grey.** `#6C6C6C` against our `#6B6B6B` is a colour distance of 0.40, below the
   point where a human can see any difference. One value per channel apart. No change.
6. **"10 spots left" as a third fact on a slot row.** That is capacity on a group experience and a
   chair seats one person. Our honest third fact is how many stylists are open at that time, which is
   a count of rows we already hold.
7. **Their brand fill, unchecked.** Their bright `#FF385C` measures 3.52 to 1, which passes the
   graphical floor and fails as text, and they keep a separate darker `#DA1249` at 5.04 to 1 for
   text. We ship one blue for both jobs and `#276EF1` drops to 4.17 to 1 on our sunken tray, which is
   the surface our own law promotes as the default for lists. We do not need a new hex,
   `s-accent.deep` `#1E54B7` is already in the config.

## 9. Not measured, stated rather than guessed

- **Every timing on the host screens.** Mobbin gives ordered stills and no video. Nothing about
  their motion, durations or easing on Today, Calendar, Listings or Earnings is known.
- **White text on their brand fill.** No brand-filled button appeared in the `.ch` home first
  viewport, so that contrast ratio is still not measured.
- **Which element carries the 2px `rgb(26,115,232)` border on search.** Read as the Chrome default
  focus ring, tier expect. I did not reopen the page to confirm.
- **The host slot row's pixel geometry.** Mobbin renders stills at its own scale, so the "Select a
  time" sheet is described, never measured.

## 10. Where this lands

- Visual page for the owner: `/de/dev/airbnb-rules` (`app/[locale]/dev/airbnb-rules/page.tsx`).
- The change list built as a mockup: `/de/dev/calendar-agenda`, third block.
- Screenshots referenced by the visual page:
  `public/_mockups/_assets/refs/airbnb/2026-08-20/home-mobile.png` and `search-mobile.png`, copied
  from the gitignored `public/_pixel-refs/airbnb/2026-08-20/` so they survive a clone.

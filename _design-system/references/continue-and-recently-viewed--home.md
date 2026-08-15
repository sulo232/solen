<!-- exists-check: net-new vs airbnb--home-mobile.md, airbnb--category-switch.md,
     airbnb--profile-list.md, airbnb--profile-1to1-diff.md, airbnb--fonts-vs-ours.md,
     airbnb--icons-vs-ours.md, airbnb--animated-icons.md and AIRBNB_SYSTEM_VS_OURS.md, all of which
     were read before writing this. airbnb--home-mobile.md is the closest match and it measures the
     Airbnb home BODY: card geometry, rail density, type range, one brand, live DOM, 2026-08-12.
     This file is a different axis: it is CROSS-APP, five products, and it is scoped to two specific
     sections (the resume-a-search card and the recently-viewed row) rather than to a page. It
     exists because the owner asked for directions from other websites and apps, which no
     single-brand file can answer.
     It REUSES rather than re-derives: airbnb--home-mobile.md already measured Airbnb's card photo at
     ratio 1.053 against our 1.25, and today's independent PIL pass on his own screenshots returned
     1.054 from two separate thumbnails. Same number, different method, three days apart, so the
     1.05 figure below is corroborated and not a fresh guess. -->

# Continue-search and recently-viewed, on the home screen

Captured 2026-08-15. Five apps, all captured this session, none written from memory. Airbnb comes
from the owner's own two phone screenshots and was measured with PIL; the other four come from
Mobbin screen captures that were opened and read, not summarised from metadata.

Trigger: owner 2026-08-15, "I told you about a new mockups in direction based on other websites and
apps." Airbnb alone is one answer to a question that has several.

---

## Capture sources

| app | surface | source |
|---|---|---|
| Airbnb | Explore home | the owner's screenshots, `~/.claude/state/owner-images/68d78dad-21dd-46/{1,2}.img`, 920x2000 |
| Marriott Bonvoy | Book tab home | https://mobbin.com/screens/87550d69-834b-45ea-8c84-5b172b304433 |
| Best Buy | Home | https://mobbin.com/screens/ec2090d6-c6e5-4d53-8038-bc4198bcfe7b |
| Vrbo | Home | https://mobbin.com/screens/a2150d39-9dd0-4282-aad3-a0a44e8953fe |
| Booking.com | Search home | https://mobbin.com/screens/ce79d204-67e5-45cd-9bc5-c675e13af102 |

Also captured for the recently-viewed row specifically, and read but not adopted:
Amazon (`cf979e34`, dismissible category tiles with an X and a "1 viewed" count),
Shop (`cf25db63`, a dark "Jump back in" panel of brand tiles),
IKEA (`33775997`, a row of small circular thumbnails plus "Clear all"),
Etsy (`2e09c30a`, recently-viewed as a label burnt onto a photo carousel),
Grailed (`9b16b44d`, a vertical list with strikethrough prices),
CVS (`faca7ea4`) and UNIQLO (`beea120f`), both plain 2-up grids.

---

## Measured, Airbnb only

Airbnb is the only one with real numbers here, because it is the only one where the owner supplied
a full-resolution screenshot. Scale is anchored on the iOS home indicator, which is 139pt wide and
measures 330px in the capture, so 2.3741 px/pt on a 387.5pt phone.

| element | measured | ours | delta |
|---|---|---|---|
| continue card | 301.2 x 104.9 pt, ratio 2.87:1 | 321 x 104 px at 407 | width +1.5%, height -5.6% |
| card photo | 66.6 x 76.2 pt, ratio 0.87:1, **portrait** | 92 x 74 px, 1.24:1 landscape | +32% wide, flipped |
| card photo insets | top 19pt, bottom 9.7pt, right 17.3pt | | |
| recently-viewed thumb | 106.1 x 100.7 pt, ratio 1.05:1 | 150 px wide | +35% |
| thumb gap / pitch | 11.4pt / 117.5pt | | |
| row left gutter | 23.6pt | 16 px | -36% |
| see-all arrow | 27.0pt diameter | 44 px | **+55%** |
| category pill icon | 13.9pt | 24 px | +65% |
| category pill height | ~51pt | 40 px | -25%, ours is smaller |
| search pill | 347.5 x 54.8 pt, gutter 19.8pt | | |

Ours is normalised by x0.952 before comparison, because our viewport measured 407px against their
387.5pt screen.

Two independent thumbnails were measured for the row (the dark portrait and the house) and both
returned 106pt wide, so the number is not a single-sample artefact. The 1.05 ratio also matches
airbnb--home-mobile.md's independent live-DOM measurement of 1.053 from 2026-08-12.

**Method note worth keeping.** The page background is not white. It is grey around #F0F0F0 in the
card rows and near-white elsewhere, which merged every thumbnail into one run and broke three
detection passes before the method changed to "content = saturated OR dark", not "darker than
white". Any future measurement of an Airbnb capture should start there.

---

## The five anatomies, and what each one actually decides

### Airbnb, one big card plus a separate row
"Continue searching for homes in Kranj" sits in a white 301x105 card that carries a two-line
headline, a meta line, and a portrait photo pinned to the right. A second card peeks. Below it,
"Recently viewed" is its own titled section with a 27pt circular arrow and near-square thumbnails.
**Decides:** the resume is the loudest thing on the screen after search.

### Marriott Bonvoy, a line and then a row
"CONTINUE YOUR BOOKING" is a small tracked eyebrow. Under it the resume is a single LINE: hotel
name, a meta line with dates and price, and a chevron at the right edge. No card, no photo, no
shadow. Then "RECENTLY VIEWED" is a second eyebrow over a row of wide cards whose photo is a square
block on the LEFT with the name on white beside it.
**Decides:** resuming is a link, not a poster. It costs about a third of Airbnb's vertical space.

### Best Buy, one section, a pill switches what the row means
"Continue shopping for" with the subtitle "Items you've saved or viewed", then a black filled pill
reading "Recently viewed" that toggles the row's contents. Cards peek on both sides, and the row
ends with a terminal card reading "See more recently viewed" with a clock icon instead of a header
arrow.
**Decides:** saved and viewed are the same shelf with a switch, not two sections. This is the only
capture that solves the "two rows saying almost the same thing" problem structurally.

### Vrbo, recent SEARCHES as sunken chips, then viewed items
"Your recent searches" renders as grey sunken cards with a house icon, the search text, dates and
traveller count. No photography at all. Then "Your recently viewed properties" is a separate row of
small photo cards with a heart. The search and the thing are visually different objects.
**Decides:** a search is not a place, so it should not wear a place's clothes.

### Booking.com, a carousel of routes, peeking both sides
"Continue your search" is a horizontal carousel of small white cards, each carrying an origin and
destination pair with an arrow between them, a date line, and a tiny thumbnail. Cards are cut off
on both edges so the scroll is obvious. Saved properties are a separate block below with a red
heart and a real availability status.
**Decides:** several searches in flight at once is the normal case, not the exception.

---

## What binds when any of these is ported

- **The 27pt arrow is not portable as a tap target.** Our design contract locks icon buttons at
  `h-11 w-11` and WCAG 2.5.5 wants 44px. The port is a 28px visible circle inside a 44px target.
  Statutory tier beats a taste source, per the precedence chain.
- **Marriott's eyebrow is tracked uppercase**, which is on the mockup banned list in the copy-economy
  block. A port uses normal-case 13px semibold.
- **Best Buy's toggle pill is a filled black selected state**, which collides with the locked calm
  gray selected state. A port uses `bg-s-bg-sunken` + ink + semibold.
- **Airbnb's card photo is portrait 0.87:1**, and our SalonCard is 5:4 landscape. The owner asked
  for our ratio once and for the reference's size once, so this is the one axis where the two
  instructions genuinely disagree and he has to pick.

# Uber renewal: page by page, one shared look (owner, 2026-10-04 and 2026-10-05)

## How we work (owner, 2026-10-05, applies for the whole session)

His words: "work page by page and also like so theres consistency like if i switch one like backbutton or how pills are shaped etc it automatically applies to everywhere else and then u warn me if im abt to make contradictions".

1. **Page by page.** One page per round. I show it at phone width next to the matching Uber screen. He says what to change, and I change only that page or that shared element, then show it again.
2. **Shared elements change everywhere at once.** A shared element is anything that appears on more than one page: back button, close button, pills and chips, buttons, cards, tags, search bar, bottom bar, headings and so on.
   - Every shared look lives in exactly one file: `public/_research/site-mockup/uber/tokens.js`. Every mockup page reads it: all `u-*` customer pages and `dashboard-uber/`.
   - If he changes a shared element on one page, I change it in `tokens.js` (or in the one rule in `uber/system3.js` that draws it). It then changes on every page.
   - I never fix a shared element on one page only. If something needs to differ on one page, I call it out and record it as a named exception in the ledger below.
3. **Contradiction warning before any change.** Before applying a pick, I check it against the ledger below and against the Uber spec principles (`_design-system/references/uber--app-2026.md`).
   - If it clashes, I say so in one line before changing anything: what he asked, what it clashes with (row and date), and the two ways to resolve it. He picks.
   - Example: "round buttons" vs the 8px main-button row; "shadow on cards" vs "shadow only on things that float".
   - Then I update the row, and the old value goes into its "was" column. Nothing is silently overwritten.
4. **Every change is verified on more than one page.** I check the page we are on plus at least one other page that uses the same element. Then I commit and send images and a link.
5. Floors never move: WCAG AA contrast, 44px touch targets, keyboard-only ink focus.
6. Mockups only. Product code changes only after he approves the pages.

Proof the wiring works (2026-10-05, `scratchpad/sys/tokentest.mjs`): changing two values in `tokens.js` (`buttonRadius` 8px to 9999px, `backOnPhoto` white to flat grey) changed:
- the main button on the salon page, the date-and-time page and the dashboard home;
- the photo back button on the salon page.

Restoring the file restored all of them.

## Order of pages

home, search, salon, booking services, booking date and time, profile, loyalty, dashboard home, calendar, dashboard services, clients, settings. He can jump to any page.

Review pages:
- `/uber/three.html` shows each page three ways: Uber, the earlier redesign, and the redesign in the Uber look.
- `/uber/vs.html` shows Uber next to the redesigned page.

## Decision ledger (one row per shared element; the key is its name in tokens.js)

| Element | Key | Now | Source and date | Was | Open? |
|---|---|---|---|---|---|
| Main button shape | buttonRadius | 8px corners, 56 tall full width, 40 small | Uber measured (2026-10-04) | capsule (owner 2026-09-23, superseded by the renewal) | **ASK**: keep 8px or go back to round |
| Main button label | buttonLabelBig / buttonLabel | 17 / 15, weight 500 | Uber measured | 15 (2026-09-23) | |
| Secondary button | chipRadius, fill | grey #F6F6F6 capsule | Uber measured | | |
| Chips and pills | chipRadius, chipHeight | grey capsule, 40 tall, selected black | Uber measured; selected black owner 2026-09-23 and 2026-10-04 | 44 tall | |
| Day tiles, time slots | dayRadius | day 12, slot capsule, selected black | Uber measured | | |
| Back button on white | circle | grey #F6F6F6 circle, 40 | Uber measured | 44 | |
| Back, share, save on a photo | backOnPhoto | white circle with a small shadow | Uber item sheet | glass | |
| Heart on listing card photos | heartOnCard | today's look (unchanged) | owner pair 2: "keep today", then "flat" | | **ASK**: today or flat |
| Close button | close | grey circle, 38 | owner (flat grey 38, 2026-10-04) | | |
| Search bar | shadowFloat, edge | white pill, thin edge, soft shadow | Uber measured | | |
| Inputs | fill | grey capsule, no outline | Uber measured | | |
| Content boxes | boxRadius, line | white, 1px #ECECEC line, 16 corners, no shadow | Uber measured | 20 + soft shadow (2026-09-23) | |
| Box inside a box | innerRadius | grey fill, 12 corners | Uber measured | | |
| Photos | photoRadius | 16 corners | Uber measured | 20 | |
| Bottom bar | bottomBar | floating white pill with shadow, current tab grey | Uber measured | | bottom-bar options still unpicked |
| Sticky bottom bar | shadowBarUp | white, shadow above, no line | Uber measured | fade above (removed 2026-10-04) | |
| Tags | tag, tagRadius | grey #F3F3F3, 4 corners | Uber measured | | |
| Discount | promo | solid red #D13B20 | Uber measured | pale green pill | |
| Proof / good news | proofBg, proofText | green tint, dark green text | Uber measured | | |
| Membership (loyalty) | cream, amber | cream card, amber accents | Uber One measured | | |
| Notification count | notify | red | Uber | blue | |
| Links | ink | black, underlined | Uber (blue only for live location) | blue | |
| Headings | titleSize, sectionSize, subSize, rowSize | 26 / 21 / 18 / 16, bold | Uber word widths | 30 / 22 / 18 / 16 | |
| Second-line text | text2, text3 | #525252 / #6B6B6B | Uber measured | | |
| Section breaks | band | 4px grey band | Uber measured | | |

## Named exceptions (a shared element that differs on purpose on one page)

None yet.

## Current state

- Every `u-*` page is the earlier redesign plus `uber/tokens.js` and `uber/system3.js`, loaded live. Any token change shows on reload; nothing has to be re-frozen.
- The dashboard reads the same tokens as CSS variables.
- Next: start the page-by-page rounds with home, unless he names another page.

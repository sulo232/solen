# AXIS: FONT

<!-- exists-check: net-new vs _design-system/research/TASTE_TYPOGRAPHY.md (read in full first),
     FLATNESS_DIAGNOSIS_2026-07-25.md, docs/audit/fresha-airbnb-solen-audit-part1.md.
     TASTE_TYPOGRAPHY.md is an EXTERNAL-SOURCE findings file (NN/g, practicaltypography.com) about
     heading levels, size deltas and emphasis stacking. It contains no competitive corpus, no
     typeface assessment, and no measurement of Solen's own fonts. This file adds exactly those
     three, and defers to TASTE_TYPOGRAPHY.md on everything it already covers rather than
     restating it. `npm run exists font` run 2026-07-29: graveyard hits are Geist and Anton,
     neither of which is proposed here. -->

Typography research for Solen. What booking and marketplace products actually do with type,
measured where measurement was possible, and a verdict on whether Inter Tight + Inter is the
right pairing.

Date: 2026-07-29
Scope: typefaces, size ladder per screen, weight count, anchor-to-body ratio, share of text at
weight >= 600.

---

## 0. Sample size, stated plainly

**Mobbin corpus.** 16 distinct searches returned **116 screen results**, of which at least 3 were
repeats across searches, so roughly **113 distinct screens** spanning **37 distinct apps**, across
both the `ios` and `web` corpora.

The 37 apps: Fresha, Airbnb, Square Go, Careem, Google Maps, Walmart, Shangri-La Circle, Alan,
Future Pro, Preply, DoorDash, Care.com, Tripadvisor, Peerspace, Stripe, Revolut, Resy, Uber, Angi,
Zocdoc, Calendly, Gymshark, KakaoTalk, Open, adidas, Luma, Runna, Linear, Wispr Flow, Instacart,
Etsy, Target, Woolworths, Amazon Shopping, UNIQLO, CVS Health, Thrive Market.

**Local measurement corpus.** Inter and Inter Tight measured in headless Chromium via Playwright,
loaded from Google Fonts, with `document.fonts.check()` returning `true` for all 8 faces
(2 families x weights 400/500/600/700) before any measurement was taken. Plus a grep inventory of
`app/` and `components/` in this worktree.

### What this sample CANNOT tell you, said before the findings so nothing here is oversold

1. **I cannot read exact pixel sizes off Mobbin.** The tool returns downscaled webp (iOS captures
   arrive around 299px wide, web around 768px). Every size claim below is either a **ratio to the
   body text on the same screen**, or an estimate explicitly labelled as one. No absolute px figure
   from a Mobbin screenshot is a measurement.
2. **I cannot identify a typeface family from these images.** I can see structural class (grotesque
   sans versus serif, high stroke contrast versus low) and nothing finer. Where a brand's font is
   publicly known I have not repeated it as if I verified it.
3. **I cannot detect a two-family display/text pairing at this resolution.** Uber Move Display
   versus Uber Move Text, Airbnb Cereal at two optical sizes: invisible in a 299px webp. **This
   sample therefore cannot answer "does anyone else pair two families".** The pairing verdict in
   section 6 rests on the local measurement of Inter versus Inter Tight, not on the screenshots.

Confidence tags used below: **observed** (I can see it in the image), **measured** (I ran a tool and
have the number), **inferred** (reasoning on top of one of those).

---

## 1. Serif versus sans: sans wins overwhelmingly, and the exceptions have a pattern

**Observed.** Of the 37 apps in the sample, **3 showed a serif anywhere in the UI**:

- [Wispr Flow onboarding](https://mobbin.com/screens/e9aa8816-808d-44be-afee-c432d7ab9b91): a
  high-contrast serif display ("Wrap up the setup"), visibly modulated thick/thin strokes and
  bracketed serifs, over a sans subline. Roughly 2.2x the subline.
- [Shangri-La Circle spa](https://mobbin.com/screens/606b7acb-a4ba-4ac1-a1b8-96638a9b4bcd): serif
  headings ("Chi, The Spa", "Luxurious spa treatments") over sans body, gold CTA.
  Same app's [treatment list](https://mobbin.com/screens/08a2bb0b-62ff-4136-8ea1-aee00e22f71b)
  carries serif accordion labels in gold.
- [Thrive Market reviews](https://mobbin.com/screens/dd0c02e8-06af-4687-8f16-cc2f40674d43): serif
  for the rating number "4.3/5" and for "Share your experience with this product".

**Inferred.** All three sit in luxury, wellness-editorial, or premium-grocery positioning. The other
34 apps, including every booking and marketplace product in the sample, are sans-only in the product
UI. A serif display on a Swiss mid-market booking marketplace would read as a different price
bracket than the product occupies.

**Verdict input:** do not propose a serif display for Solen. This is not taste, it is a positioning
mismatch with a 3-of-37 base rate concentrated in one segment.

---

## 2. Size ladder per screen: 4 to 5 steps is the norm, not 3

Counted by distinguishable tier on the rendered screen, **observed**, not measured in px.

| Screen | Distinguishable size tiers | Notes |
|---|---|---|
| [Fresha iOS "Select time"](https://mobbin.com/screens/9ed7eb7a-41ca-4528-a891-9ffb44f60dcf) | 5 | display title, date numeral, month header, slot text, day letter |
| [Fresha web PDP](https://mobbin.com/screens/3b350009-ac82-47e6-b704-056f8888444d) | 5 | H1, H2, H3, body, meta/breadcrumb |
| [Fresha iOS services list](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9) | 4 | section H, service name, duration/price, bottom-bar meta |
| [Airbnb iOS PDP hero](https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3) | 5 | title, stat numerals, body, sub-labels, chip |
| [Stripe Transactions](https://mobbin.com/screens/80054ec0-bb9d-4438-9a66-4f7bcd8f103f) | 4 | page title, tile numeral, tab/cell text, column header |
| [Calendly booking page](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02) | 4 | event title, panel header, body/slot, helper |
| [Uber "Choose a ride"](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea) | 4 | sheet header, ride name/price, meta line, badge |
| [Linear issues list](https://mobbin.com/screens/10d46768-7ef5-4140-9f5f-22a97a207759) | 2 to 3 | issue title and label are nearly the only two tiers |

**Finding.** Solen's "max ~4 distinct font sizes per screen" ceiling is consistent with this corpus
at the tight end. Nothing here argues for loosening it. Linear is the one app well under it, and
Linear is a productivity tool with no consumer hierarchy job.

**Finding, more useful.** The corpus does NOT show a small number of sizes producing hierarchy on
its own. It shows a small number of sizes **with a wide spread**. Fresha's web PDP runs 5 tiers
across roughly a 3.5x range (breadcrumb to H1). Solen's own inventory runs 9 tiers across a range
where 79.8% of usage sits in a 2px band (section 5). Same ceiling, opposite outcome.

---

## 3. Anchor-to-body ratio: surface-dependent, not app-dependent

This is the finding that most directly contradicts a Solen floor, so it gets stated carefully.

**Observed, expressed as ratios on the same screen:**

- [Fresha web PDP](https://mobbin.com/screens/3b350009-ac82-47e6-b704-056f8888444d): the salon name
  H1 is roughly **3x** the body paragraph. A real display anchor.
- [Fresha web search results](https://mobbin.com/screens/12a7bd21-e941-4249-a033-b61398e9b7f8) and
  [the second variant](https://mobbin.com/screens/612f2a56-4a8c-4d16-bc51-08cca7209937): **no display
  anchor at all.** The largest text on the page is the wordmark. Every salon name, price, service
  and slot chip sits within roughly one step of each other. Same company, same week, adjacent screen.
- [Fresha iOS map/search](https://mobbin.com/screens/22351a48-a849-4cdb-bdc1-f41d1c85c757): same
  shape. Salon name is the biggest text and it is a card title, not an anchor.
- [Airbnb iOS PDP](https://mobbin.com/screens/8a6b4476-52d7-4c85-965b-2a870b388eb3): title roughly
  **1.5x** body. But
  [the review-summary screen](https://mobbin.com/screens/fc136f40-7a43-4d89-9195-70d01010471f)
  renders "4.96" at roughly **2.7x** body. The anchor moved to the number.
- [Airbnb web services](https://mobbin.com/screens/2258df34-4be9-42f5-a410-f2e426d66ee2): card
  titles roughly 1.2x the meta line. No anchor.
- [Uber "How much time do you need?"](https://mobbin.com/screens/0f66ccf1-a46b-4ed4-b2d1-fe8b2faa36dd):
  question and stepper value both roughly **1.8x** body.
- [Revolut home](https://mobbin.com/screens/5be4e584-20cf-45a5-aade-d505997121b7): balance roughly
  **2.5 to 3x** body, and it uses a compound numeral, "$13" large with ".25" set smaller.
- [Calendly](https://mobbin.com/screens/bf6fd5e5-a5b8-47e0-9b35-bd052b57fa02): event title roughly
  **1.5x** the slot text. Under Solen's floor.

**Finding, and it is a collision to surface rather than a rule to change.** Solen's FLOORS LAW 6
requires "one display anchor >= 28px per customer screen" and the EMPHASIS BUDGET (b) requires
">= 1.8x body". In this sample, hero, PDP, confirmation and single-decision screens meet that
comfortably. **List, search and map screens routinely do not, including at Fresha, the one
competitor Solen locked structurally.** Solen's floor is stricter than any app I looked at, applied
uniformly.

I am not recommending the floor be dropped. The floor exists because Solen's screens measured flat.
But "every customer screen" is doing work the corpus does not support, and a search-results page
forced to grow a 28px anchor gets one by inventing a heading that has no job (which collides with
FLOORS LAW 10, every element must belong to the screen's job). **This needs an owner call, not a
silent resolution.**

---

## 4. Weight: the dominant pattern is one bold moment per block, everything else 400

This is the strongest and most consistent finding in the sample.

**Observed instances of restraint:**

- [Airbnb "About this place"](https://mobbin.com/screens/b284e5ef-afbb-447b-8e42-8737fb9acaa3) and
  [House rules / Safety](https://mobbin.com/screens/9a3b9090-fe21-405e-8453-52584cd37e62): the
  section headings are the only heavy text on screen. Every body line, every rule, every date is
  regular weight.
- [Uber "Choose a ride"](https://mobbin.com/screens/1634d7c8-5d3f-4223-8f11-df000b37f3ea): the ride
  name and the price render at the **same weight**. The price is not bolder than the name. The
  pickup time and ETA below are lighter and grey.
- [Fresha iOS services](https://mobbin.com/screens/f2b83609-779f-4fc9-a249-ba3feeaa66a9): in a
  service row, only the service name is non-regular. Duration and "from $40" are both regular.
- [Stripe Transactions](https://mobbin.com/screens/80054ec0-bb9d-4438-9a66-4f7bcd8f103f): the tab
  counts (6, 1, 0, 0, 3, 0) are rendered **larger but not heavier** than their labels. Size carries
  the hierarchy; weight is not used at all in that row.
- [Fresha web "Opening times"](https://mobbin.com/screens/b47dfaac-d730-408e-9ade-688c39aa4858):
  today's row (Tuesday) is bold, the other six days are regular. Weight used as a **data marker**,
  not as decoration.
- [Angi reserve screen](https://mobbin.com/screens/092ee23b-0080-4a52-a19f-2fb2bb064539): inline
  weight change inside one sentence, "Pay nothing for this job today." heavy, "You won't be charged
  until after the job is done." regular, same line. Emphasis on the clause that carries the promise.
- [UNIQLO reviews](https://mobbin.com/screens/d6fad77b-d346-4b67-a5cb-01ce55e85953): the product
  title is the largest text and is **regular weight**. Only "Ratings" is heavy.

**Observed counter-examples, and they share a trait:**

- [Tripadvisor hotel list](https://mobbin.com/screens/75c7ecf3-0749-41cc-b8f2-0e56fb4ebba0): price
  bold, larger, and red.
- [Care.com](https://mobbin.com/screens/594fbda3-a2c5-4401-a267-7c19f3635acc) and
  [Preply web](https://mobbin.com/screens/2bc08d44-af44-4514-84e8-23a31de91eeb): hourly rate bold and
  larger than the name.

**Inferred.** Both counter-examples are price-comparison-first products where the number IS the
decision. Booking a salon is not that. Fresha, Airbnb, Uber and Square Go all keep the price at or
below the name in emphasis.

**Direct bearing on Solen's taste rule 5** ("a card may carry two ink elements, name + price, only if
the NAME is larger"). The corpus supports the ordering and goes further: at Uber the price is not
even a separate weight, and at Fresha it is regular. Solen's LOCKFILE calls for "price 600, tabular".
That is one step heavier than the closest comparable in this sample.

---

## 5. Solen's own numbers, measured locally

### 5a. Inter versus Inter Tight, measured in headless Chromium

All 8 faces confirmed loaded (`document.fonts.check()` true) before measuring. Metrics taken at
100px; string widths at 16px.

| Metric | Inter | Inter Tight | Delta |
|---|---|---|---|
| x-height (at 100px) | 54.59 | 54.59 | **identical** |
| cap-height (at 100px) | 72.75 | 72.75 | **identical** |
| ascent / descent | 97 / 24 | 97 / 24 | **identical** |
| 'n' advance, w400 | 59.08 | 53.91 | -8.7% |
| 'n' advance, w700 | 62.25 | 59.12 | -5.0% |
| 'o' advance, w400 | 59.96 | 54.98 | -8.3% |

Real strings at 16px, width in px:

| String | Inter 400 | Tight 400 | Delta | Inter 700 | Tight 700 | Delta |
|---|---|---|---|---|---|---|
| "Coiffeur Salon Bellevue Basel" | 221.84 | 199.00 | **-10.3%** | 228.83 | 213.98 | **-6.5%** |
| "Termin jetzt buchen" | 150.17 | 135.59 | -9.7% | 155.75 | 146.41 | -6.0% |
| "Reserver maintenant" | 155.83 | 142.09 | -8.8% | 162.75 | 153.64 | -5.6% |
| "CHF 129.00" | 87.70 | 79.56 | -9.3% | 90.33 | 85.88 | -4.9% |
| a-z lowercase | 222.66 | 201.83 | -9.4% | 233.91 | 220.23 | -5.9% |

At the size that matters, a 28px weight-700 headline: Inter 400.44px wide, Inter Tight 374.47px.
**-6.5%, which is 26px of width recovered on a 402px-wide device.**

**Finding (measured).** Inter Tight is not a display face paired with a text face. It is **the same
typeface at a narrower width**. Identical skeleton, identical x-height, identical cap-height,
identical vertical metrics. The entire difference is horizontal advance, 5% to 10% depending on
weight and string.

**Consequence.** The `tailwind.config.js` comment at lines 227 to 229 says the pairing "mirrors
Uber's one-family display+text structure (Inter Tight + Inter matches Uber Move + Uber Move Text)".
The intent is right. The analogy is not: a display/text pair differs by optical sizing (spacing,
aperture, stroke contrast tuned per size), and Inter Tight differs from Inter by width only. **At
12px to 16px, where 80% of Solen's type lives, the difference is under 2px on a full card title and
nobody perceives it as a second face.** It buys real space only at 24px and up.

### 5b. Codebase inventory, `app/` + `components/`

**Caveat, load-bearing:** these are **source-code class occurrences**, not rendered DOM nodes, and
they exclude all the default-weight text that carries no weight class at all. This is **not** the
same metric as the "17.6% of visible text at weight >= 600" render measurement already recorded in
`CLAUDE.md` for the PDP (2026-07-28). It measures **authoring habit**, which is the thing that drifts.

Weight classes, 2219 occurrences:

| Class | Count | Share |
|---|---|---|
| `font-semibold` (600) | 1135 | 51.1% |
| `font-medium` (500) | 595 | 26.8% |
| `font-bold` (700) | 372 | 16.8% |
| `font-normal` (400) | 115 | 5.2% |
| `font-extrabold` / `font-black` | 5 | 0.2% |

**1512 of 2219, or 68.1%, of every weight a Solen developer explicitly writes is >= 600.** When
someone reaches for a weight class in this codebase, they reach for semibold half the time. That is
the engine behind the flatness diagnosis, and it is upstream of the rendered percentage.

Size classes, 1023 occurrences:

| Class | px | Count | Share |
|---|---|---|---|
| `text-sm` | 14 | 474 | 46.3% |
| `text-xs` | 12 | 342 | 33.4% |
| `text-base` | 16 | 68 | 6.6% |
| `text-lg` | 18 | 46 | 4.5% |
| `text-2xl` | 24 | 44 | 4.3% |
| `text-xl` | 20 | 18 | 1.8% |
| `text-5xl` | 48 | 11 | 1.1% |
| `text-4xl` | 36 | 11 | 1.1% |
| `text-3xl` | 30 | 9 | 0.9% |

**9 distinct steps exist system-wide, and 79.8% of usage sits inside a 2px band (12 to 14).** This is
the exact failure EMPHASIS BUDGET (c) names: "size variety is not range". It also means **Solen's
effective body size is 14px, not 16px**: `text-base` is used 68 times against `text-sm`'s 474.

Family classes: `font-body` 835, `font-heading` 443, `font-display` 269, `font-mono` 17,
`font-mono-code` 15.

Headings: **445** `h1`-`h6` tags exist; **49** of them carry `text-xs`/`text-sm`/`text-base`
(<= 16px). Separately, **52** sites combine `font-heading` or `font-display` with `text-xs`/`text-sm`.
Examples: `app/[locale]/partner/page.tsx:118,150,427`, `app/[locale]/dashboard/loyalty/page.tsx:95`,
`app/[locale]/dashboard/badge-manager/page.tsx:381,445`.

`app/globals.css` lines 128 to 133 applies Inter Tight **and** `letter-spacing: -0.025em` to
`h1, h2, h3, h4, h5, h6` with **no size condition**. So a 14px `h3` gets a face that is already 8.7%
narrower per glyph, then has a further 0.35px removed from every gap. Two tightening operations
stacked on text that is too small to benefit from either.

`tailwind.config.js` extends **no `fontSize` scale at all** (grep count: 0). All 9 steps are Tailwind
defaults, and nothing structurally prevents a 10th.

### 5c. A stale fact in the code, surfaced rather than smoothed over

`app/layout.tsx` line 18 states "24 live font-extrabold/font-black callsites found 2026-07-26".
I grepped `app/`, `components/` and `components-legacy/` today: **4 occurrences total, and every one
of them is inside a comment.** Zero live `className` usages remain. The weight-array trim did its
job. The comment now overstates a risk that no longer exists and should be corrected or date-stamped
so the next reader does not re-fight a settled fight.

---

## 6. Verdict for Solen

### The recommendation, stated first

**Keep Inter for body. Keep Inter Tight, but restrict it to >= 24px, and make the negative tracking
size-conditional.** Then spend the real effort on the weight distribution, which is the larger
problem and is free to fix.

### Why, from first principles

The measured 5% to 10% width saving is worth nothing at 12px to 16px (under 2px on an entire card
title) and worth real space at 28px and up (26px recovered on a 402px device). Solen ships four
locales, and German and French commonly run 15% to 35% longer than English
(`_rules/I18N_ROUTING.md` Rule 35, cited, not measured by me). A narrower face therefore earns its
keep **exactly at the anchor and nowhere else**: a long German salon name at 28px is precisely the
string that overflows.

Applying it below 24px costs a second family resolution on text where the difference is
imperceptible, plus the compounded tracking described in 5b. That lands on 49 headings and 52
`font-heading`/`font-display` sites.

### The failure mode of my own recommendation, named

Restricting Inter Tight to >= 24px means it appears on roughly 75 elements sitewide
(`text-2xl` 44 + `text-3xl` 9 + `text-4xl` 11 + `text-5xl` 11), against 816 elements at 12 to 14px.
**At that frequency a user never sees enough of the display face to register it as a voice.** That is
a real argument for the opposite call: drop to one family entirely, accept the width cost at the
anchor, and spend the personality budget on photography and layout instead. I think the i18n width
win at the anchor tips it, but the case is close and the owner should know it is close rather than
be handed a clean recommendation.

### Named alternatives, with reasons

1. **One family: variable Inter alone.** Inter's variable release carries optical-size and width
   axes, so the anchor could get the narrow cut from a single file. Kills the two-family bookkeeping
   and the "is this a pairing" confusion permanently. Cost: a real change to `app/layout.tsx`, and
   **I did not measure the transferred-bytes difference between the current two-static-family setup
   and a variable one**, so I cannot claim it is lighter.
2. **Keep Inter for body, swap Inter Tight for a face with actual display character.**
   - **Instrument Sans** (SIL OFL, on Google Fonts). A grotesque with more idiosyncratic terminals
     than Inter, reading as designed at 28 to 48px while staying neutral at 16px. The reason it fits:
     Solen is 80% neutral surfaces and ink, so the one anchor per screen is the only place
     personality can live, and a face with zero personality at the anchor is a structural reason the
     screens read beta.
   - **Bricolage Grotesque.** Naming it explicitly because Solen already shipped it and replaced it
     (V3-D75 superseded by V3-D190). Treat it as a settled call; do not re-propose without an owner
     yes.
   - **Söhne, GT America, Aeonik** (commercial licences). Naming them because this is the class of
     face Stripe, Linear and Revolut sit in, and it is the honest answer to "why do those look
     designed and ours does not". Cost: paid webfont licensing plus self-hosting, a business
     decision rather than a CSS one.
   - **Geist and Anton are graveyard entries** (`npm run exists font`, 2026-07-29). Not proposed.
3. **Serif display: rejected.** 3 of 37 apps, all luxury or editorial positioning. Section 1.
4. **Change nothing about the family and fix the weight distribution.** Highest leverage, zero risk,
   free. See F7 and F8 below.

### Concrete changes, by file

| # | File | Change | Evidence |
|---|---|---|---|
| F1 | `app/globals.css` lines 128-133 | Split the `h1,h2,h3,h4,h5,h6` rule. Keep Inter Tight + tracking on `h1,h2` (and anything rendering >= 24px); set `h4,h5,h6` to `font-family: var(--font-inter)` and `letter-spacing: normal`. | 49 headings render <= 16px; the face is 8.7% narrower per glyph before tracking is applied on top. 5b. |
| F2 | `app/globals.css` line 132 | Make `-0.025em` conditional on display sizes. At 28px it is -0.7px (right). At 14px it is -0.35px on a face already tightened (wrong). | 5a + 5b. |
| F3 | `tailwind.config.js` `theme.extend` | Add an explicit `fontSize` map with named roles (display / title / body / meta / caption). Today there is **no** `fontSize` extension, so all 9 steps are Tailwind defaults and a 10th is one keystroke away. | grep count 0; 9 steps live; 79.8% inside a 2px band. 5b. |
| F4 | `tailwind.config.js` lines 227-229 | Correct the comment. Inter Tight and Inter share x-height, cap-height and vertical metrics and differ **only** in advance width. It is a width variant, not a display/text pair, and the Uber Move analogy misdescribes it. | 5a, measured. |
| F5 | `app/layout.tsx` line 18 | The "24 live font-extrabold/font-black callsites" claim is stale. 4 occurrences remain, all inside comments, zero live. | 5c. |
| F6 | `_design-system/LOCKFILE.md` EMPHASIS BUDGET (b) | The 1.8x ratio was derived as 28/16, but Solen's effective body is **14px** (`text-sm` 474 vs `text-base` 68). Over a 14px body a 28px anchor is 2.0x, so the floor passes trivially while the screen can still read flat. Reconcile the stated body size or restate the ratio. | 5b. |
| F7 | `_design-system/LOCKFILE.md` EMPHASIS BUDGET (a) | The 30% ceiling on weight >= 600 is already documented as a house number. Add the authoring-side number as a second, separately-defined check: **68.1% of explicitly-written weight classes are >= 600**. The rendered percentage is the symptom; the authored percentage is the cause. | 5b, with its caveat. |
| F8 | Design-verifier checklist | Add the corpus default as a positive rule, not just a ceiling: **in a list row, exactly one element carries weight >= 600 (the name). Duration, price, meta and slot time default to 400.** | Section 4: Fresha, Uber, Airbnb, Square Go all do this; only price-comparison products deviate. |

### One collision to put in front of the owner, not resolve here

FLOORS LAW 6 requires a >= 28px display anchor on **every** customer screen. In this corpus, Fresha's
own web search results page, Fresha's iOS map/search, and Airbnb's web services grid carry **no**
display anchor. Those are list surfaces where the content units are the hierarchy. Solen's floor as
written is stricter than any of the 37 apps sampled, and forcing an anchor onto a search page tends
to produce a heading that serves no job, which collides with FLOORS LAW 10. Recommend the floor be
scoped to hero, PDP, confirmation and single-decision screens, with list/search/map surfaces
answering a different requirement (density and card hierarchy) instead. **This is an owner call.**

---

## 7. Smaller observed patterns worth stealing

- **Weight as a data marker.** [Fresha web opening
  times](https://mobbin.com/screens/b47dfaac-d730-408e-9ade-688c39aa4858) bolds today's row and
  leaves the other six regular. No color, no badge, no dot. Directly applicable to Solen's opening
  hours block and cheaper than the pale-green chip.
- **Compound numeral for a price anchor.** [Revolut](https://mobbin.com/screens/5be4e584-20cf-45a5-aade-d505997121b7)
  sets "$13" large and ".25" small in the same lockup. Gives a genuine display anchor to a number
  without the decimals shouting. Candidate for the Solen booking summary total.
- **Inline weight inside a sentence.** [Angi](https://mobbin.com/screens/092ee23b-0080-4a52-a19f-2fb2bb064539)
  bolds only the promise clause of a two-clause sentence. Useful for the trust floor's cancellation
  line, where Solen has to render a term above the commit button.
- **Tabular numerals are universal in the rating-breakdown pattern.** Observed in all 8 review screens
  sampled (Instacart, Etsy, Target, Woolworths, Amazon, UNIQLO, CVS Health, Thrive Market), and in
  Fresha web's right-aligned price column. Solen already has `.data-text` and `tabular-nums`; the gap
  is coverage, not capability.
- **ALL-CAPS is alive but strictly short.** Observed at adidas, UNIQLO, Resy ("LUNCH" eyebrow), Open
  ("MOVE"), Gymshark. Every instance was one or two words. None was a sentence. Consistent with the
  existing `TASTE_TYPOGRAPHY.md` finding 8.
- **The rating value as the display anchor.** 3 of the 8 review screens (Woolworths, CVS Health,
  Thrive Market) make the aggregate rating the biggest text on the screen, roughly 2 to 2.5x body.
  Airbnb does the same on its review-summary screen. A legitimate way for a Solen reviews section to
  satisfy the anchor floor with a real number rather than an invented heading.

---

## 8. Sources

Every screen cited above is linked inline to its Mobbin URL. Local measurements were produced with
Playwright + headless Chromium against Google Fonts, with font-load confirmed before measuring, and
with `grep` over `app/`, `components/` and `components-legacy/` in this worktree on 2026-07-29.
Prior in-repo typography research: `_design-system/research/TASTE_TYPOGRAPHY.md` (external-source
findings on heading levels, size deltas, emphasis stacking) and
`_design-system/research/FLATNESS_DIAGNOSIS_2026-07-25.md`. This file does not restate their
findings; it adds the competitive corpus and the local measurement those two lack.

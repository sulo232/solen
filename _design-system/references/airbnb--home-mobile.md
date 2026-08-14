<!-- exists-check: net-new vs airbnb--profile-list.md, airbnb--profile-1to1-diff.md,
     airbnb--category-switch.md, airbnb--home-search-chrome.md, airbnb--fonts-vs-ours.md,
     airbnb--icons-vs-ours.md, airbnb--animated-icons.md, AIRBNB_SYSTEM_VS_OURS.md and
     chrome-per-solen-page.md, all of which were read before writing this. Those cover the PROFILE
     and ACCOUNT surfaces, the category switcher, the search CHROME, fonts, icons and the token
     layer. None of them measures the HOME page's body: its card geometry, its rail density, or its
     type range. That is what this file adds, and it re-uses their numbers rather than re-taking
     them wherever they already exist. -->

# Airbnb, mobile web home

REF: airbnb / web-mobile / home / static

## Identity

- **Brand / platform / surface:** Airbnb, web in mobile view, the home page.
- **Source:** `https://www.airbnb.ch/`, loaded at 390x844 at DPR 3 with an iPhone user agent and
  `de-CH`, cookie banner dismissed, captured 2026-08-12.
- **Method:** repo Playwright. Live DOM measured with `getBoundingClientRect` and
  `getComputedStyle`; stills at `public/_pixel-refs/airbnb/home-mobile/`. Nothing here is recalled.
- **Why this file:** owner 2026-08-12, "airbnb te is source of truth". Screen 1 of a 94-screen loop.

## Philosophy

Their home sells CHOICE, not a brand moment. There is no hero, no headline, no display type at all:
the largest thing on the screen is an 18px section title and everything else is smaller. What gets
the room is photographs and how many of them fit. The first screen is a search field, a row of
category pills, then rails of near-square cards sized so a second and a third are always visibly
waiting. The pitch is "there is a lot here and it is one tap away", carried by density and cropping
rather than by scale.

## Measured, both sides at 390x844 on 2026-08-12

| | Airbnb | Solen home | tag |
|---|---|---|---|
| largest text, first viewport | 18px / 600 | 18px / 600 | verified both |
| distinct size+weight pairs, first viewport | 10 | 5 | verified both |
| distinct sizes, first viewport | 18, 14, 13, 12, 11, 10 | 18, 14, 12 | verified both |
| card photo | 165 x 157, ratio **1.053** | 231 x 185, ratio **1.25** | verified both |
| cards visible across 390 | about **2.2** | about **1.6** | verified both |
| dominant radius | **20px** (100 elements) | **22px** (20 elements) | verified both |
| ink | **rgb(34,34,34)** | **rgb(10,10,10)** | verified both |
| secondary text | rgb(108,108,108) | rgb(107,107,107) | verified both |
| search field | full-width pill, radius 40, hairline plus a soft shadow | 358 x 64, radius 40, `0 6px 20px rgba(0,0,0,.1)` | verified both |
| weight >= 600 share, first viewport | not measured | **37%** | ours verified, theirs not measured |
| photographic area, first viewport | not measured | **87%** | ours verified, theirs not measured |
| type family | Airbnb Cereal VF | Inter / Inter Tight | verified both |

Card rail behaviour, verified: their cards sit at left 24, 201, 378, 555, so a 165 card on a 12
gutter with the third cropped by the viewport edge on purpose. Ours sit at 16, 259, 501, so a 231
card on a 12 gutter with the second cropped.

## Port map

- **Card ratio 1.053 against our 1.25.** Theirs is near square, which is what lets 2.2 fit where we
  fit 1.6. The single biggest structural difference on the screen.
- **Radius 20 against our 22.** Two pixels; not worth a change alone, worth noting on a rebuild.
- **Ink rgb(34,34,34) against our rgb(10,10,10).** Ours is harder. An aesthetic-axis candidate now
  that Airbnb is the source of truth, and a frozen literal, so his call.
- **Their type range**, ten size+weight pairs against our five in one viewport.

## Conflicts

- **CONFLICT A, type budget.** Their home carries 6 distinct sizes and at least 4 weights in one
  viewport. Our LOCKFILE caps a screen at 4 sizes and 2 weights and a PreToolUse gate enforces it.
  Copying their range breaks a gate, not only a preference. Owner call.
- **CONFLICT B, the display anchor.** FLOORS LAW 6 wants one element at >= 28px unless a photograph
  is the focal. Airbnb's home has nothing above 18px. Both screens pass via the photo exemption, so
  neither violates anything, but "be more like Airbnb" and "add a display anchor" pull opposite
  ways. Owner call if he ever wants an anchor here.
- **CONFLICT C, ink.** `#0A0A0A` is a LOCKFILE frozen literal with reach far beyond this screen.
- **CONFLICT D, precedent.** On 2026-07-31 he killed a pill border copied from Airbnb by name
  (graveyard, CONFLICT 7 of `AIRBNB_SYSTEM_VS_OURS.md`). Airbnb as source of truth does not
  resurrect that specific decision.

## Not measured, stated rather than guessed

Their weight-600 share and their photographic area: the first sweep was truncated before those two
came back and the second did not repeat them. Any claim that Airbnb is less bold than us is
unsupported until that is re-run.

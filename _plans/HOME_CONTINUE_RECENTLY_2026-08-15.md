# Home: continue-search card + recently-viewed (2026-08-15)

Owner message, verbatim:

> There is a big size difference between the screenshot Airbnb reference and ours. So fix that.
> And, also, I told you about a new mocks... mock ups in direction based on other websites and apps.
> And I recently viewed, we didn't do anything for that. So harden the case so you actually listen to
> me. And the read back that you first do the read back before you actually start doing anything. Okay?

## Atomic boxes

- [x] **A1. Measure the Airbnb reference** at scale, both screenshots, PIL, not eyeballed.
- [x] **A2. Measure our live page** with getBoundingClientRect at the same normalised width.
- [x] **A3. Produce the size-difference table** naming every element that is off and by how much.
- [x] **A4. Fix the size difference: see-all arrow.** verified: commit 1538981d5, index.html seeAll() arrowVisible 28 inside arrowTap 44; live getBoundingClientRect returned circle 28 / tap 44 on airbnb, airbnbTall, marriott, vrbo. DONE in the mockup. Measured live: 28px circle inside a 44px tap target, on 4 of 5 directions (Best Buy has none by design, its terminal card is the see-all, matching the capture). Ours 41.9pt normalised vs 27.0pt measured. +55%.
- [x] **A5. Fix the size difference: continue-card photo width.** verified: commit 1538981d5, variants/airbnb.js:26-27 PHOTO_W 87 PHOTO_H 70; live firstPhoto measured 87x70. DONE. Measured live: 87px in the 5:4 variant, 70px in the portrait variant, against the old 92px. Ours 87.6pt vs 66.6pt. +32%.
- [x] **A6. Photo orientation.** verified: commit 1538981d5, variants/airbnb.js:26-27 vs variants/airbnb-tall.js:31-32; the diff is 10 code lines, all of them those two constants plus key/label/caption; live 87x70 (1.24) vs 70x80 (0.88), both blocks 410px tall. He picked "show me both", so it is BOTH, as a true minimal pair: airbnb.js and airbnb-tall.js differ in exactly two constants plus their key, label and caption. Measured live: both blocks are 410px tall, photos 87x70 (1.24) and 70x80 (0.88). Ours 1.24:1 landscape, the
      reference is 0.87:1 PORTRAIT. This is a shape change, not a size change, so it is its own box.
- [x] **A7. Category pill icon.** verified: commit 1538981d5, index.html REF.pillIcon 15 plus fixPillIcons(); live [data-sweep-done=pill-icon] measured 15px on all five directions. DONE. Measured live: 15px on every direction, against 24px before. Ours 22.9pt on the real page (18.1pt in the
      mockup) vs 13.9pt measured.
- [x] **A8. Row gutter.** verified: commit 1538981d5, index.html REF.gutter 24, used by rail() and sectionHead(). DONE, 24px via MK.rail, against 16px before. Ours 15.2pt vs 23.6pt measured.
- [x] **A9. Touch-target collision SURFACED, not silently resolved.** verified: commit 1538981d5, index.html TOUCH-TARGET COLLISION header block; live smallestTapTarget measured exactly 44 on all five. 28px of visible circle inside a 44px target. Measured live: the smallest tap target in every direction is exactly 44px. A 27pt circle is below the 44pt touch floor in our
      own design contract and in WCAG 2.5.5. Tier 2 outranks a taste source, so the visible circle
      shrinks and the tap target stays 44. Do not silently ship a 27pt tap target.
- [x] **B1. Recently-viewed: NOT built, because it already exists and is already mounted.** verified: app/[locale]/page.tsx:289 mounts RecentlyViewed; RecentlyViewed.tsx:133 is the fallback title line; commit 721b25f77. RecentlyViewed.tsx is at page.tsx:289 and was rendering its cold-start "Top auf Solen" fallback, which is why it read as absent. Seeding storage makes the real component render its real state. Nothing was duplicated. Nothing on our homepage renders it today. Measured this turn:
      `recentlyViewedOnPage: NO`, and the 11 h2 sections contain no such row.
  - [x] B1a. Measured anatomy from the reference: verified: ~/.claude/ss-measured.flag carries the PIL numbers, and _design-system/references/continue-and-recently-viewed--home.md records them. thumb 106.1 x 100.7pt, ratio 1.05:1, gap 11.4pt,
        pitch 117.5pt, left gutter 23.6pt, heart badge ~14pt, header arrow 27pt.
  - [x] B1b. The mockup seeds by HARVESTING slugs and photos off the live cards verified: commit 721b25f77, index.html harvestEntries(); live check returned real slugs cuts-and-culture, haarsalon-margot, atelier-haarwerk, nail-studio-bliss., so the row shows the same data the feed shows. Wire it to a real source (a viewed-salon history), never fabricated rows.
  - [x] B1c. Cold start is ANSWERED and it was already handled: RecentlyViewed falls back to a curated top list, and returns null only when that is also empty. RecentlyViewedTiles correctly renders nothing. Answer the cold-start hole the reviewer raised: a brand-new visitor has no history, so
        the row must have a defined absent state rather than rendering empty.
- [x] **C1. Five directions, four apps, all captured this turn.** Captured, never recalled.
  - [x] C1a. Mobbin captures, 13 screens opened and read. Capture the real screens (Mobbin), do not build a named reference from memory.
  - [x] C1b. Five directions, not three. At least 3 distinct directions, each named to the app it came from.
  - [x] C1c. Every direction covers both surfaces. Best Buy deliberately merges them into one, which is its whole point. Each direction covers BOTH surfaces: the continue card and the recently-viewed row.
- [x] **D1. DONE. readback-gate.py EXTENDED with a PreToolUse arm.** 18/18 unit, 6/6 live payload, gate-eval PASS on relevant, enough and safe. He asked for the readback to come FIRST, before any tool
      call, and for the case to be enforced rather than remembered.
- [x] **D2. PAID by FIXING EXISTING, twice, and adding no new gate file.** (a) readback-gate got a second arm rather than a twin. (b) mockup-preflight-manifest.py had a real false-positive: it joined every command into one string and searched without re-MULTILINE, so its `^npm run exists` branch could only match if the command was the first line of the whole window. It denied a Write the gate it mirrors would have allowed. (build-one-retire-one / fix-existing / delete-only / neither-with-a-reason).

## Measured, this turn

Scale anchor: the iOS home indicator is 139pt wide and measures 330px in the reference, so
2.3741 px/pt, and the screenshot is a 387.5pt phone (390pt class). Ours is normalised by x0.952.

| element | Airbnb, measured | ours, raw | ours, normalised | delta |
|---|---|---|---|---|
| continue card | 301.2 x 104.9pt, 2.87:1 | 321 x 104 | 305.6 x 99.0 | width +1.5%, height -5.6% |
| card photo | 66.6 x 76.2pt, **0.87:1 portrait** | 92 x 74, 1.24:1 | 87.6 x 70.4 | **+32% wide, orientation flipped** |
| see-all arrow | **27.0pt** | 44 | 41.9 | **+55%** |
| category pill icon | 13.9pt | 24 real / 19 mockup | 22.9 / 18.1 | **+65% / +30%** |
| category pill height | ~51pt | 40 | 38.1 | -25%, ours is smaller |
| recently-viewed thumb | 106.1 x 100.7pt, 1.05:1 | absent | absent | **missing** |
| row left gutter | 23.6pt | 16 | 15.2 | -36% |
| search pill | 347.5 x 54.8pt, gutter 19.8pt | | | |

Method note: the page background is not white. It is grey #F0F0F0 in the card rows and near-white
elsewhere, which broke the first three detection passes and merged every thumbnail into one run.
Content is detected by saturation plus luminance, not by "darker than white".


## What the measured fix actually produced, live

| direction | block height | photo | arrow circle / tap | smallest tap |
|---|---|---|---|---|
| Airbnb 5:4 | 410px | 87 x 70, 1.24:1 | 28 / 44 | 44 |
| Airbnb tall | 410px | 70 x 80, 0.88:1 | 28 / 44 | 44 |
| Marriott | 247px | 84 x 94 | 28 / 44 | 44 |
| Best Buy | 326px | 112 x 106, 1.06:1 | terminal card by design | 44 |
| Vrbo | 370px | 112 x 106, 1.06:1 | 28 / 44 | 44 |

Marriott costs 247px against Airbnb's 410, which is 60% and NOT the "roughly a third" its brief
predicted. Saying so rather than repeating the brief: it is still by far the cheapest direction,
just not as cheap as claimed before it was built.

Nested interactive elements across all five: 0. The verify pass caught a button inside an anchor in
one direction; sweeping for siblings rather than fixing that one instance is what found the real
problem, which was not the nesting at all.

## Found on the way, and both are live-page facts, not mockup facts

1. **The homepage renders "Zuletzt angesehen" TWICE for anyone with history.** RecentlyViewedTiles
   (3 square 86x86 tiles) at page.tsx:288 and RecentlyViewed (4 cards at 242x194, ratio 1.25) at
   page.tsx:289, same heading, same salons, two card shapes. Invisible on a fresh browser because
   the second one wears its "Top auf Solen" fallback title until history exists, which is why it
   was never caught. Spawned as its own task; needs his call on retitle vs delete.
2. **NOT a defect, checked and cleared:** the em-dash in those cards is a sanctioned no-rating
   placeholder, annotated `em-dash-ok` at SalonCard.tsx:528. And the grey tiles in the first
   screenshot were lazy-loading, not a missing-photo fallback: they paint on scroll. Both were
   nearly reported as bugs and both would have been wrong.


## CORRECTION round, owner 2026-08-15 (second message)

> jst Make it just Airbnb. Okay? And, also, to recently viewed, why is their English and German?
> What the fuck is this? And what the fuck is it fucking square? I told you so many fucking times,
> bro. And, also, I told you about one multiple directions markup for that specific part of last
> scene. What part are you not fucking on undrstand

- [x] **E1. Airbnb only.** Marriott, Best Buy and Vrbo unloaded. verified: commit 721b25f77, index.html loads only variants/row-{a,b,c}.js; their files remain in git at 1538981d5.
- [x] **E2. The English and German mix, root cause found and fixed.** Both titles were hardcoded German literals, so /en, /fr and /it rendered German. verified: RecentlyViewedTiles.tsx:108 and RecentlyViewed.tsx:133 now call ui.recentlyViewed.title; live /en returned zero German headings in those two rows.
- [x] **E3. Not square.** verified: row-a.js 112x90 (1.244), row-b.js 240x192 (1.250), row-c.js 96x77 (1.247); live measured 1.24 / 1.25 / 1.25. The square he saw is RecentlyViewedTiles.tsx:118 `aspect-square`, 86x86.
- [x] **E4. The directions are on the RECENTLY-VIEWED ROW, which is what he asked for.** I had built them on the continue card for a whole turn. verified: commit 721b25f77, the card is shared via MK.continueRail so only the row changes between A, B and C; live visibleRecentlyViewedHeadings = 1 per direction with 2 live sections hidden.

### Still open, tracked rather than narrated

- [x] **E5. He picked A** ("You know what? Just make it a"). B and C unloaded; only variants/row-a.js loads. verified: commit pending, index.html loads one script tag and the switcher shows a single button.
- [ ] **E6. The duplicate "Zuletzt angesehen" section needs his call.** Two rows render for anyone with history (page.tsx:288 and :289). Spawned as task_ed7c6e36. Retitle one, or delete one plus a REMOVED.md line.
- [x] **E7. Done this turn, he asked for it directly.** 8 of the 10 were live and are fixed; 2 were a false positive in my own scan. verified live on /en: zero of the target German strings remain visible.
- [x] **E8. Moot: there are no longer three directions.** He picked A, so B and C are unloaded. I measured A myself (ratios, tap targets, heading count, no nested interactives) and fixed the one contract breach I found: the card carried a border AND a shadow, which the locked surface table forbids. It is hairline only now. Superseded item, previously: Rendered and measured them myself this turn (ratios, tap targets, heading counts, no nesting), but the verifier agent has not graded them against LOCKFILE. Worth doing once he picks one, not on three throwaways.


## CORRECTION round 2, owner 2026-08-15 (third message)

> You know what? Just make it a. But, also, on this, like, skin fade, but, you know, like, what you
> search for, you can't really identify what your last surgery person. Add that for... like, look at
> the screenshot I fucking gave you. And, also, what is this gray, like, divided shit that's
> happening? I don't fucking like this. I feel like it's too fucking small too.

- [x] **F1. A only.** B and C no longer load. verified: index.html has one script tag, variants/row-a.js; the switcher is a single button.
- [x] **F2. You could not tell what the last search was, and the screenshot says why.** Measured on ref2: the reference headline is a SENTENCE over two lines ("Continue searching for hair stylists in Zurich"), line 1 is 165.1pt wide, line 2 is 145.7pt, baseline to baseline is 19.4pt, which puts it near 17pt. Ours rendered the bare service name on one line at 15px, so nothing on the card said it was a resumed search. verified live: the headline now reads "Continue searching for skin fades in Basel" at 17px/22px across exactly 2 lines, 44px tall, with the service and place carrying ink 600 and the lead-in staying grey 400.
- [x] **F3. The grey divider is gone.** It was a port of Airbnb's grey page background, which on our white page reads as a divider rather than a surface. verified live: the band computes to rgba(0,0,0,0). Removing it left a white card on white, which FLOORS LAW 4 forbids on a shadow alone, so the card took the hairline instead: measured 1px rgb(228,228,231).
- [x] **F4. Bigger.** Card height 105 to 118, headline 15px to 17px. verified live: card measured 306 x 118, headline 17px/22px.

### Still open

- [ ] **F5. He has not said whether the bigger card and the hairline are right.** That is the next thing to react to, and it is a taste call, not a measurement.


## German label sweep, owner asked for it directly (2026-08-15, he pasted the task back)

Fixed, all verified live on /en with zero of the target strings remaining:

| file | string | key used |
|---|---|---|
| CategoryPromos.tsx:70 | Stöber nach Kategorie. | home.categories.browseTitle (new) |
| Entdecken.tsx:166 | Finden Sie Ihre Inspiration. | home.discover.inspirationTitle (new) |
| Entdecken.tsx:393 | Alle Looks entdecken | home.discover.browseAllLooks (new) |
| Entdecken.tsx:419 | Alle entdecken | home.discover.browseAll (already existed) |
| Entdecken.tsx:170 | Alle entdecken -> | home.discover.browseAll (already existed) |
| PopularLooks.tsx:48 | Beliebte Looks | home.trending.popularLooks (new) |
| PopularLooks.tsx:52 | Alle entdecken -> | home.discover.browseAll (already existed) |
| FeaturedStylists.tsx:201 | Profis in Ihrer Nähe | home.featured.nearbyPros (new) |
| ForYouAffinityRow.tsx:77 | Für dich empfohlen | home.featured.forYou (new) |
| BentoBusiness.tsx:711 | Sofortige Bestätigung | home.partner.instantConfirm (new) |
| BusinessTeaser.tsx:32 | Solen für Salons | home.partner.forSalons (new) |

**Two of the ten were a FALSE POSITIVE in my own scan, and saying so matters more than the count.**
Hero.tsx:287 and :294 sit inside `_DeprecatedSearchBar`, a function declared once and imported by
nobody. Those labels render on no page in any locale. I wired them, typecheck said `t` was not in
scope, and that is what exposed it. Reverted, and the two keys I had added were removed again
rather than left as cruft with no consumer. The dead function itself is not deleted: that needs the
graveyard protocol and his yes.

**Three strings my scan missed**, because it only matched title/label/aria-label props and these are
JSX text children. Measured for visibility rather than assumed:
  - `Entdecken.tsx:419` "Alle entdecken", VISIBLE at 71x35. Fixed.
  - `MobileCategoriesRow.tsx:87` "Für Sie", section carries `hidden`, measured 0x0. Left alone.
  - `BusinessTeaser.tsx:67` and `WhySolen.tsx:119` "Solen für / Ihr Geschäft.", measured 0x0 at this
    viewport, and both are a marketing headline split across a `<br>`, which needs a copy decision
    about how it wraps in four locales rather than a mechanical key swap.

- [ ] **G1. "Solen für / Ihr Geschäft." still hardcoded in two files.** Not a mechanical fix: the
      headline breaks across a `<br>` and French and Italian will not break in the same place, so it
      needs a copy call, not a key swap.

# Reviews section: measured diagnosis before any fix (2026-08-15)

Owner: *"let's fix up the design and the review section because it's, like, so out of place, and it
looks so weird."* No cause named, so this is a measured walk, not a guess.

Surface: `/de/salon/cuts-and-culture` at 390x844, RENDERED, with real seed data. Section y=2048,
height 899.

## The screen's job, in one line

Decide whether strangers liked this barber enough to book him.

## Description pass, facts only

Section heading 18/500. Star row 26px, 5 stars, 138px wide. Average "4.8" 20/500. Count "16
Bewertungen" 14/400 in accent blue. Three tier pills at 44px. Three reviews at y=2237, 2562, 2736.
Each: a 56px initial disc carrying 22px initials, name 16/500, date 14/400, a 13px star row, body
15/400. One review carries a reply block, 342x139, background #F4F4F5, 12px radius, indented 16px.
See-all pill at y=2902.

## Findings, ranked, each with its number

**F1, severity 4. EIGHT distinct type sizes in one section**, against a locked ceiling of four per
screen: 18, 20, 22, 16, 15, 14, 13, 12. This is the dominant fault and it is what "looks weird"
actually is: nothing reads as a tier because almost every element has its own size. Worse, two
pairs sit 1-2px apart (18 vs 20, 14 vs 13), and the typography floor calls a 1-2px delta a
rendering glitch rather than a hierarchy.

**F2, severity 3. The initial disc outweighs everything it labels.** The avatar is 56px carrying
22px initials. The reviewer's NAME is 16px. So the heaviest mass in every row is a decorative
two-letter disc, larger than the section heading (18px) and 1.4x the name it belongs to. Squint
test: the three grey circles survive, the names do not, and the names are the content.

**F3, severity 3. The reply block is the only box left in the section.** Its card and its row
hairlines were removed today at his instruction, so the section is now unboxed prose, and the
owner-reply tray is the single remaining rectangle: 342x139, filled #F4F4F5, 12px radius. The
grouping decision tree bans a card nested inside a list row, and with everything else unboxed it
reads as a foreign object rather than a nested reply.

**F4, severity 1. The average is bigger than the section heading.** "4.8" at 20px against
"Bewertungen" at 18px. His own Fresha reference measures the opposite way: heading 32px, average
27px in a 920px capture, so the heading leads.

## Checked and NOT a finding, so it does not get "fixed"

- **The big star row is not redundant decoration to remove.** It repeats the average, yes, but it
  is the anatomy he asked for this morning ("the stars to be more big") and it is exactly what his
  Fresha capture does: a big star row on its own line, the number under it. Removing it would undo
  a dated instruction. Kept.
- **Heading spacing passes.** 40px above, 16px below; the floor wants above > below.
- **Rows as plain whitespace-separated peers passes.** Same schema, so the grouping tree says list
  rows, never per-row cards. That is what ships.

## The smallest fix per finding

- F1: collapse to four sizes. 18 heading / 16 name and average / 15 body / 13 meta. That means
  initials 22 to 16, date 14 to 13, reply date 12 to 13, average 20 to 16.
- F2: avatar 56 to 44, initials to 16, so the name becomes the heaviest thing in its own row.
- F3: strip the reply block's fill, border and radius. What survives as the cue: the 16px indent
  and the "Antwort von" label, which is a full weight-and-label step (FLOORS LAW 5, a deletion
  must name what it keeps).
- F4: falls out of F1 for free once the average drops to 16.


## Applied, and measured after (390x844, same page, same data)

| finding | before | after |
|---|---|---|
| F1 distinct type sizes in the section | **8** (18/20/22/16/15/14/13/12) | **4** (18/16/15/13) |
| F2 avatar disc / initials / name | 56px disc, 22px initials, 16px name | 44px disc, 16px initials, 16px name |
| F3 boxed elements among the review content | 1 (the reply tray, 342x139, filled, 12px radius) | **0**, the reply keeps a 2px left rule + its label |
| F4 average vs section heading | 20px average over an 18px heading | 16px average under an 18px heading |

The one 14px left on screen belongs to the SHARED see-all pill, which is a control used elsewhere on
this page too, so it is a screen-level size rather than a reviews decision and was not dragged
around for this section's sake.

## The packages section, same message

- [x] WHAT IT IS · verified: `messages/de.json` salonDetail.bundlesTitle = "Pakete", `messages/en.json` = "Bundles"; the un-kill is line 52 of _design-system/REMOVED.md ("UN-KILLED 2026-07-03 ... owner explicitly picked scope A and B"), the June kill is lines 10 and 29 of the same file; component is app/[locale]/_components/salon/SalonBundles.tsx · commit f052c6e7d · heading key `salonDetail.bundlesTitle` reads **"Pakete"** in German and
      "Bundles" in English. It is NOT the killed Pakete feature (session packs, buy-5-redeem-later,
      killed 2026-06-11, code deleted 2026-06-13, graveyard says never rebuild). It is service
      BUNDLES, 2+ services grouped at a discount, which HE un-killed himself on 2026-07-03 by
      picking scope "A and B" on the /dev/bundles-products decision mockup. The German label reusing
      the dead feature's name is the whole reason it reads as a ghost.
- [x] WHY IT APPEARED THEN VANISHED · verified: the `if (bundles === null)` branch in SalonBundles.tsx now returns null instead of a heading plus shimmer; live sampling on cuts-and-culture 27 times over 4s found the heading present in 0 of 27 samples, and muse-beauty-studio still renders Verwöhn-Paket / Brautstyling / Balayage · commit f052c6e7d · it painted its heading plus a 160px
      shimmer the moment it mounted, then returned null when the fetch came back empty. Live
      database: **1 of 28 salons** has an active bundle, so on 27 the guaranteed experience was a
      heading that deleted itself. Fixed: nothing renders until there is something to render.
      · verified: sampled the page 27 times across 4 seconds on cuts-and-culture, "Pakete" never
      appears; muse-beauty-studio, the one salon that has one, still renders it with its real
      contents (Verwöhn-Paket, Brautstyling, Balayage).
- [ ] PARKED 2026-08-15 · Keep bundles at all? Only ONE bundle exists across 28 salons six weeks
      after you un-killed the feature, and nothing has been built on it since. Keep and seed it so
      it earns its section, keep it dormant, or kill it again? · from: his 2026-08-15 "elaborate what
      is that, and if we should keep that"
- [ ] PARKED 2026-08-15 · If bundles stay: rename the German heading off "Pakete", since it reuses
      the name of the feature that was killed and is what made this read as a ghost. Your words for
      the new label. · from: the same message

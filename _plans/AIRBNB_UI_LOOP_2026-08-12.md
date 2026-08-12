# Airbnb comparison loop across every customer screen (2026-08-12)

Owner: "ok on ui compare to air nb yk as a loop and find me tons of improvements we can make on othr
screens yk all everywhere except dashboard and then make me tons of mockup ask me all questions and
principles u need to edcecute this loop"

## Readback

1. Compare our UI to Airbnb, run as a LOOP rather than one pass.
2. Find lots of improvements on the OTHER screens, everywhere, dashboard excluded.
3. Then make lots of mockups.
4. First, ask him every question and every principle I need in order to run it.

## What I measured before asking anything, so the questions are few and sharp

- **94 customer screens** in scope. `find app/[locale] -name page.tsx`, minus `/dev/` and minus
  dashboard. The big clusters: profile 19, salon 6, inspo 6, auth 4, bookings 3, and a long tail of
  one-page legal/marketing routes.
- **Airbnb work already on disk, so this does not start from zero and must not duplicate it:**
  `_design-system/references/AIRBNB_SYSTEM_VS_OURS.md` (their live token layer next to our account
  screen, plus SEVEN named conflicts with our own locks), `airbnb--profile-list.md`,
  `airbnb--profile-1to1-diff.md`, `airbnb--category-switch.md`, `airbnb--home-search-chrome.md`,
  `airbnb--animated-icons.md`, `airbnb--fonts-vs-ours.md`, `airbnb--icons-vs-ours.md`,
  `AIRBNB_PROFILE_PRINCIPLES.md`.
- **The method is already settled by him**, so it is not a question: *"dont only research the
  refference like go acc into the airbnb website and in mobile view acc analyze"*. Live site in
  mobile view is primary, stills are secondary, and `Skill(reference-lock)` is the binary trigger
  for any named brand reference.
- **The mockup format is already settled too**, `_plans/MOCKUP_QUEUE.md` v2: both panes are live
  iframes of the SAME real route, the After pane is the change INJECTED and then measured, with a
  diagnosis manifest of measured / violates / target. 44 built that way, 10 still open in that
  older queue.

## The one thing I will not decide for him

**CLAUDE.md line 130 calls this THE most important rule:** *"DUAL-AXIS: STRUCTURE = Fresha
source-of-truth. AESTHETIC = Uber via LOCKFILE. Both axes apply to every change."* Airbnb is
neither. And the graveyard records that the last thing copied from Airbnb by name, a pill border,
was killed by him on 2026-07-31, which `AIRBNB_SYSTEM_VS_OURS.md` logs as CONFLICT 7.

So "compare to Airbnb" collides with a locked rule, and per the precedence chain a live ask
outranks it, but silently overriding a lock is exactly what the chain forbids. Surfaced as
question 1 rather than resolved behind his back.

## Boxes

- [x] Q0. Scope measured and the existing Airbnb work found rather than duplicated (rule 12).
- [x] Q1. Commit 73e545bef, `CLAUDE.md` + `_design-system/TASTE_LOG.md` , ANSWERED: "airbnb te is source of truth", and "no apply mockups i told u". Airbnb
      replaces Fresha-for-structure AND Uber-for-aesthetic. Landed in `CLAUDE.md` with the old rule
      quoted inside the new one, and in `_design-system/TASTE_LOG.md` dated. What did not move,
      because he did not move it: the statutory tier, the FLOORS LAW minimums, no dark mode, no
      fabricated data, and his own dated decisions. Collisions get surfaced, not applied.
- [x] Q2. Commit 73e545bef , ANSWERED: "all". Every one of the 94, dashboard excluded.
- [x] Q3. Commit 73e545bef , ANSWERED: screens with no Airbnb counterpart are graded against our own floors.
- [x] Q4. Commit 73e545bef , ANSWERED: "one screen at a time", plus a fifth ask he added unprompted, below.
- [x] Q5. Commit 73e545bef , ADDED BY HIM in the same answer: "i wanna improve design taste and principle etc that has
      to do w design n ui". The principles and taste documents are in scope for improvement too,
      not only the screens. That is a second output per screen: what the screen taught us that
      belongs in the law.
- [ ] Q6. HIS, not mine, and it needs drawing rather than code: two of the four 2D category icons do
      not exist as files (no barbershop, no spa; nails is `nails-test.svg`). Code cannot draw them.
- [ ] L1. THE LOOP, one screen at a time: capture Airbnb live in mobile view, measure both sides at
      the same width, diagnose, mock in the v2 format, hand it over, take his answer, and write
      what it taught back into the principles. Screen 1 is the home page.

## THE PLAN, written first because he asked for it first (owner: "compare elemnts too yk w airbnb n ours. n use sub agents council thorough too n make plam fiest")

### Three asks in that message

1. Compare ELEMENTS, one by one, theirs against ours, not just whole screens.
2. Use sub-agents, as a council, and be thorough.
3. Write the plan before running it.

### What an ELEMENT comparison means here, concretely

Not "their home vs our home" but a row per shared UI part, each with both numbers taken the same
day at the same width. The element list comes from what both products actually have:

| element | ours | theirs |
|---|---|---|
| search field | the home pill and the panel field | their pill and their expanded panel |
| category row | our category pills | their emoji category pills |
| primary card | `SalonCard` | their listing card |
| card photo | ratio, radius, crop | same |
| rail / carousel | how many fit, gutter, crop of the next | same |
| section heading | size, weight, the see-all control | same |
| rating | star, value, count | same |
| price | placement, weight, what it includes | same |
| favourite / heart | shape, position, state | same |
| bottom navigation | count, icons, labels, active treatment | same |
| filters / sort | entry point, sheet, selected state | same |
| map entry | how you get to a map | same |
| empty and loading states | skeleton shape, empty anatomy | same |
| type scale | sizes and weights per viewport | same |
| ink and greys | exact values | same |
| radius family | dominant radii and where they change | same |
| elevation | shadow recipes per surface | same |
| motion | open, press, transition timings | same |

### The council, and why sub-agents fit HERE

Read-only research and audit, which is the one category where parallel agents are allowed in this
project (frontend BUILDING stays single-threaded, memory `feedback_no_parallel_agents_frontend`).
Each agent gets ONE lens over the SAME two captures, so they cannot drift into each other's work:

1. **Structure** , anatomy and order: what elements exist, in what sequence, what is missing on
   either side.
2. **Geometry** , sizes, ratios, gutters, radii, how many fit per screen.
3. **Type** , the scale, weights, colour of text, and how our budget rules collide with theirs.
4. **Colour and elevation** , ink, greys, semantic colour, shadow recipes.
5. **Density and content** , how much real content is on screen, photographic share, what fills a
   rail.
6. **Adversarial reviewer** , tries to REFUTE every finding the other five produce: is the number
   real, is it measured on both sides, does it contradict a lock or a dated decision of his.

Every finding must carry: the element, their measured value, our measured value, the file or URL
it came from, and the one-line cost of changing it. A finding without both numbers is dropped by
the reviewer, not softened.

### Order of work

1. Capture the screen live at 390 (done for the home page).
2. Capture ours at 390 (done for the home page).
3. Council over both, one lens each, adversarial pass last.
4. Findings become mockups, one screen at a time, in the v2 format.
5. His answer on each becomes a dated line in the taste log, and anything general becomes a line in
   the principles, which is the fifth thing he asked for.

### Boxes for this phase

- [x] P1. Commit 00545d135, `_design-system/references/airbnb--home-mobile.md` , screen 1 captured on BOTH sides at 390x844 and written up:
      `_design-system/references/airbnb--home-mobile.md`, with four named conflicts against our own
      locks. verified: card ratio 1.053 against ours 1.25, 2.2 cards visible against our 1.6,
      radius 20 against 22, ink rgb(34,34,34) against rgb(10,10,10).
- [x] P2. Commit 3d91799b8 , DONE, workflow `wf_065e72b2-46b`, 71 agents, 66 findings in, **11 out**, 55 killed by the adversarial pass. Was: five lenses (structure, geometry, type, colour, density) over the same two captures, then an adversarial pass whose only job is to kill any finding that lacks both numbers. Not a promise, it is executing; P3 consumes its output.
- [x] P3a. FIRST MOCKUP BUILT, `app/[locale]/dev/airbnb-01-home/` , the home rail, one element:
      card width and photo ratio. Two live iframes of the real `/de`, the right one with Airbnb's
      measured geometry injected into its own document. verified on the rendered page: left pane
      ratio 1.25, card 231px, 1.6 cards across; right pane ratio 1.053, card 165px, 2.2 across,
      which are Airbnb's own measured numbers.
      FOUND WHILE DOING THE EXISTS-CHECK, and it is the better half of this finding:
      `docs/superpowers/specs/2026-03-30-airbnb-image-aspect-ratio.md` already prescribes
      `aspect-[20/19]` = 1.0526 for this exact card on mobile. Airbnb measures 1.053. The card
      ships at 1.25. The number was agreed in March and the code never followed it, so this is not
      a new idea, it is an unimplemented spec.
- [x] P3. Commit 3d91799b8, `app/[locale]/dev/airbnb-01-home/HomeRail.tsx` , mockups built from the surviving findings and the findings themselves written into the same page in plain words, `app/[locale]/dev/airbnb-01-home/`. verified on the rendered page: pane 1 shows 1 full card plus 57% of a second; pane 2 (their geometry) shows 2 full cards plus 12% of a third; pane 3 (plus the rail bleed) shows 2 full plus 15% with the row running 0 to 390 instead of 4 to 386. One honest flaw stated on the page itself: pane 3's first card sits at 12px instead of 16 because the injected padding fights the real one.
- [x] P4. Commit 3d91799b8, `app/[locale]/dev/airbnb-01-home/HomeRail.tsx` , the two PRINCIPLE corrections the council found, which is the fifth thing he asked for, are written up on the same page for his decision rather than applied to the law behind his back: our 2-weight cap is broken by our own shipped screens and by Airbnb alike (all three use 400/500/600), and our 1.8x anchor rule is unreachable while copying a reference whose own home is 1.5x.
- [ ] P5. WAS: the REST of the mockups, and it is the next screen rather than this one: the mockups are built from the findings that survive the adversarial pass, so there is nothing to build until it returns.

## The principles I will run it under, so he can veto any of them now instead of after

1. **Capture, never recall.** Every Airbnb claim comes from the live site in mobile view or a
   capture on disk, with the number and where it came from. No "Airbnb does X" from memory.
2. **Measure both sides.** Every finding is a pair: their number and ours, taken the same day at
   the same width, or it does not go in the list.
3. **Their structure is a candidate, our floors are law.** WCAG, the no-dark-mode rule, the
   no-fabrication rule and the trust floor cannot be traded for a resemblance.
4. **Mockup before code, always**, in the v2 format that already exists.
5. **One entity, one component.** An improvement that would give a salon a second card
   implementation is rejected however good it looks (FLOORS LAW 8 and 9).
6. **Every proposal carries its cost** in his language, next to its upside.
7. **Nothing is applied without his pick.**

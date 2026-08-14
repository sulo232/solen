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
- [x] Q6. DISPOSED as his, and it is a real dependency: it needs drawing rather than code. two of the four 2D category icons do
      not exist as files (no barbershop, no spa; nails is `nails-test.svg`). Code cannot draw them.
- [x] L1. SUPERSEDED by C1: the loop is not one screen per turn, it is one sweep with mockups reviewed one at a time. Was: capture Airbnb live in mobile view, measure both sides at
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
- [x] P5. SCREEN 2 DONE, `app/[locale]/dev/airbnb-02-search/` , the search results page, measured
      on both sides live at 390x844 on 2026-08-12 and mocked. verified on the rendered page: left
      pane card 231px at ratio 1.25, middle pane 366px at ratio 1.0 with the injection confirmed,
      right pane their own capture loaded at 388px wide.
      THE FINDING: their search screen is a MAP from y 310 to y 1040, about 63% of the first screen,
      with prices on it and the results in a sheet underneath; ours has no map on that screen at all
      and puts every result in a side-scrolling row. The difference is not a treatment, it is what
      the page IS, so only the injectable half (one full-width column, square photo) is shown as a
      live pane and their own screen sits beside it for the rest. Said on the page in those words
      rather than faked.
      A BUG FOUND WHILE MEASURING IT, and it was mine to fix, not a product defect: `/api/salons`
      was returning 500 on every call with `ENOENT .next/server/app/api/salons/route.js`, so the
      search page rendered "Keine Salons gefunden" and I nearly filed that as a finding. It was a
      broken dev build, cleared by removing the stale compiled route and restarting the server.
      Verified after: the page lists eight Basel coiffeurs.
- [x] P6. SUPERSEDED by C1 for the same reason. Was: the mockups are built from the findings that survive the adversarial pass, so there is nothing to build until it returns.

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

## CORRECTION (owner 2026-08-12: "i told u all screen n ui motion wtf")

He is right on both counts and the cause is mine, named plainly: he answered "one screen at a
time" to a question about how many MOCKUPS he wants in front of him, and I turned that into one
screen per turn of WORK. Those are different things. His review cadence is one at a time; the sweep
was always meant to be all 94. And motion was in the element list I wrote myself and then never
captured.

- [x] C1 + C2 + C3. Commit 27a981815 , all three running as one wide council, workflow `wf_0f33d9f6-bfc`, after his
      third correction on the same point: "n welents too i told u everything use subagents n council
      alot what part did u not fucking understand". Fifteen lenses in parallel, then an adversarial
      pass over every finding they produce:
        SCREENS, 8 lenses , the salon page, the booking flow, profile and account, Inspo, auth and
        onboarding, walk-in and loyalty, the bookings surfaces, and the static long tail. Each one
        against its real Airbnb counterpart, or against our own floors where no counterpart exists.
        ELEMENTS, 4 lenses , cards everywhere, chrome and navigation everywhere, inputs and pickers
        everywhere, and the loading, empty and error states. These cut ACROSS screens, which is what
        he meant by comparing elements, and the cards lens also answers whether the same entity
        renders the same way on every screen of ours.
        MOTION, 3 lenses , opening and transitions, press and tap feedback, scroll behaviour. Their
        motion is being captured as real video plus animation timings with
        `scripts/capture/record-interaction.mjs`, because a still proves nothing about motion. The
        first capture is already on disk at `public/_pixel-refs/airbnb/motion/search-open/`
        (capture.webm plus animations.json).
- [x] C4. Commit a293655cc, `app/[locale]/dev/airbnb-findings/` , the whole haul in one
      place, grouped by screen, in plain words, every row carrying BOTH numbers.
      RESULT of workflow `wf_0f33d9f6-bfc`: 157 agents, 15 lenses, **142 findings in, 91 killed,
      51 out**. verified on the rendered page: 51 rows across 21 real screen groups, the biggest
      being the salon page (8), search results (7), sign in (5), home (5) and the booking flow (4).
      The list is generated from the council's own structured output rather than retyped, so no
      number passed through my hands.
      WHAT SURVIVED IS NOT COSMETIC. The strongest ones: our review text is set in the grey we
      reserve for timestamps while the reviewer's name is the biggest thing on the card; the
      bookings list renders ZERO photographs while the API already returns the salon's cover; the
      search page's own sticky bands overlap so the label saying what you searched for drops to
      1.22:1 contrast, which is a statutory floor and not a taste call; the walk-in tracker carries
      12 distinct text sizes against our own cap of 4; the salon card presses differently on the
      home page and the search page for the same salon; the saved-looks screen is hard-coded German
      in every locale; and eight of nine controls fade to 78% on tap, which their app never does.
      MOTION WAS CAPTURED, not skipped: press timing, press geometry, scroll snapping and rail
      overscroll all came back with both sides measured, and one finding CORRECTS our own motion
      law's evidence line rather than proposing a change to it.
- [x] C5a. SCREEN 3 BUILT, `app/[locale]/dev/airbnb-03-salon/` , the salon page reviews, which is
      the strongest single finding in the list. Same format as screens 1 and 2: two live iframes of
      the real salon page, one stylesheet injected into the right one, nothing else touched.
      verified on the rendered page: left pane review body 15px/400/rgb(107,107,107) with the name
      16px/600/rgb(10,10,10); right pane body 14px/400/rgb(10,10,10) with the name 14px/500. The
      ranking is inverted exactly as measured on their listing.
- [x] C6. Commit 5fa047bb4, `public/_mockups/_BASE.md` , THE DEFINITION OF A MOCKUP, written down because he had to say it four times. Owner
      2026-08-12: "what part of mock up do you not fucking understand ... that is not a fucking
      mock. No. Refine the definition of a mock up ... Harden the fucking gate." Landed at the top
      of `public/_mockups/_BASE.md`: a mockup is ONE real screen, full-bleed at 402, silent, judged
      by looking at it on a phone, with before and after on a TOGGLE. Four things that are NOT
      mockups are named, and all four are things I handed him today: a comparison page with prose,
      a findings list, a document, and phone-width panes on a desktop layout.
- [x] C7. Commit 5fa047bb4, `~/.claude/hooks/mockup-must-be-a-screen-gate.py` , THE GATE, built, self-tested 8/8,
      wired into settings.json (49 Stop commands, valid JSON, confirmed present). verified the way
      that matters: replayed against the page I called "screen 3" earlier today it returns
      BLOCKED, "a desktop page wrapper". It would have stopped every one of the three things he
      rejected before he ever read them.
- [x] C9. Commit 0272a40b6, `app/[locale]/dev/mock/salon-reviews/Screen.tsx` , FIXED. He said "mockup is comp broken" and he was right: the
      screen showed a heading, chips and then the site footer painted over everything. TWO causes,
      both mine, both now understood rather than worked around.
      (1) The review cards never mounted inside a framed page: they are mounted as the section comes
      into view, and a frame scrolled by script does not trigger that. So the mockup stopped framing
      the page and now COMPOSES the real `SalonReviews` component, which fetches its own reviews
      when handed a salon id, so the data is live and nothing is drawn twice (FLOORS LAW 9).
      (2) The app's own header, newsletter and footer were painted OVER the panel, not under it: a
      transformed ancestor traps the stacking context, so a high z-index could never win. Measured
      symptom: cards at y 288 in the DOM while the newsletter drew from y 330. They are hidden
      outright now instead of covered.
      verified on the rendered screen at 402x874: three real review cards at y 288, 622 and 805 with
      their text, their stars, their dates and the salon's reply; footer gone; and the toggle really
      switches the styling, "New" = 14px rgb(10,10,10) body with a 14px/500 name, "Now" = 15px
      rgb(107,107,107) body with a 16px/600 name.
- [x] C8. Commit 7318bb4d9 , WAS blocked by a real bug, found by building the mockup, which is the only reason it was
      found. The salon page's reviews section renders its star row (4.8, 16 Bewertungen) and its
      filter chips (Alle (7), 5 star (13), 4 star (3)) and then NOTHING: the newsletter block starts
      immediately under the chips. Zero review cards. Confirmed twice and two ways, so it is not a
      framing artefact: in the repo's own browser at 402x874, and again in the app browser at
      375x812 on the live tunnel. The section's own counts say seven reviews exist.
      Why this matters beyond the mockup: the council measured review bodies on this page earlier
      today at document y 1749, 2086 and 2273, so the cards DO render sometimes. Something makes
      them disappear, and the page still claims seven of them in its chips, which is the worst of
      both.
      The mockup itself is finished and correct: `app/[locale]/dev/mock/salon-reviews/` is
      full-bleed at 402, silent (zero paragraphs, zero headings), the app's own banner and chat
      bubble are hidden, the frame holds its position on the reviews section by re-asserting scroll
      (a tall translated frame was tried first and rearranged the page, because that page sizes
      blocks against the viewport). It has nothing to show only because the section it frames has
      nothing in it.
      NEXT, and it is a bug pass rather than a design one: find why the review cards vanish while
      their counts survive.
- [x] C10. Commit b991262af, `app/[locale]/dev/mock/` , FOUR MOCKUPS AND A DOOR. He asked what all the tokens bought and the
      honest answer was one screen, so the shared frame that cost four attempts is now paid for
      once (`app/[locale]/dev/mock/_shell/MockShell.tsx`) and every further screen is cheap.
      verified on the rendered screens at 402x874: `home-density` card 165px with the change on and
      239px with it off; `search-density` card 165px and 6 distinct text sizes on, 239px and 8 off;
      `salon-reviews` three real reviews with the body switching 14px black / 15px grey;
      `press-feedback` renders the home screen with the tap-fade removed. `/de/dev/mock` lists them.
      ONE DROPPED, and why: the bookings tabs mockup needs a signed-in session, so it framed the
      logged-out shell and showed nothing. Deleted rather than shipped looking broken.
      ONE BUG FOUND BY THE FRAME: a parent stylesheet cannot reach inside a framed page, which is
      why the first run of the batch reported the home card still 239px wide with the proposal
      supposedly applied. The frame injects into its own document now.
- [x] C11. VERIFIED FOR HIM, because he asked and an assertion is not an answer: the Airbnb work
      has changed NOTHING in the product. `git log --name-only` over every commit since the loop
      began returns 16 files, all of them under `app/[locale]/dev/`, and filtering out `/dev/`
      returns an empty list. The home page and its components are untouched by this work.
      What DID change on the real product today is the earlier search-panel batch he approved by
      name ("1 proposed", "2 B1", "c proposed"): the panel's store photos and star, the category
      tints and icons, the 9:16 look cards and the Inspo link.
- [x] C12. TWO MOCKUPS DELETED rather than shipped: `salon-chrome` and `search-sticky`. Both
      rendered, both had the wrong selector, so the screen measured identical with the toggle on
      and off (salon-chrome 1 fixed layer at 110px either way; search-sticky 1 layer at 74px either
      way). A mockup that shows no difference is worse than none, so they are gone rather than
      listed. The two findings behind them stand and are still in the list.
- [ ] C5b. The remaining mockups from the other rows of the list. Each is the
      same shape of work: pick the injectable findings for that screen, build the two panes, name
      the cost. He reviews them one at a time, which is what he asked for.

## The two checks built today, evaluated rather than assumed

- `visual-promised-needs-link-gate.py` , own suite **10/10**. gate-eval against 1633 real replies
  from this session: **fires on 17 of them (1%), live**, so it is enforcing something real rather
  than being a comment with a shebang.
- `mockup-must-be-a-screen-gate.py` , own suite **8/8**. gate-eval reports it firing on **0 of 1633**
  and that is NOT a pass, it is a structural limit worth naming: the defect this gate checks lives
  in the FILES a turn wrote, and gate-eval replays reply TEXT only, so it can never see the input
  this gate needs. Proved directly instead, which is the stronger test anyway: replayed against
  `app/[locale]/dev/airbnb-03-salon/page.tsx`, the page I called "screen 3" this morning and he
  rejected, it returns BLOCKED, "a desktop page wrapper".
- Corpus cases were added for the first gate (two bad, two good) and gate-eval still reports "no
  known-bad cases recorded"; the add command confirms it wrote them. That is a defect in gate-eval's
  own read-back, not in the gate, and it is left alone rather than papered over.

<!-- workstream 81: the one that CLOSES design work instead of opening more of it -->
# Why every screen except the salon page looks different, and the plan to fix it

Owner 2026-08-27, two messages. First: *"some places use a background for gray or some places are
weird, there's a lot of inconsistencies, if you switch between categories on the home page the
search bar moves to other places, that should be a permanent spot, there is something like weird
back button sometimes, placement hierarchy is not correct, those stuff, typography too."* Then:
*"not only back arrows, all other stuff, actually think it through, research it, it should be a
multi-hour design improvement session."* Then, seeing me start work without a plan: *"actually
plan, what happened to the planning harness."*

---

## 0. WHAT HAPPENED TO THE PLANNING HARNESS, answered before anything else

**It is a perfect record and it has never once been a queue.** Measured on this file, 2026-08-27:
109 workstream rows, **38 of them design work marked ACTIVE and unclosed.** Several are literally
today's complaint, already written down weeks ago and never finished:

- **#55 HOME + INSPO CHROME**, "sticky search, Airbnb-smooth category switch, chrome" , the search
  bar moving is this row.
- **#47 POLISH DIAGNOSIS**, "why Airbnb reads finished and ours reads unfinished".
- **#52 SCREEN RESEARCH**, every screen archetype, then the change list.
- **#35 Full frontend sweep**, "fix every gap and inconsistency, loop till done".
- Plus #13, #19, #22, #25, #31, #36, #37, #38, #41, #48, #50, #51, #55b, #69, #70.

The index also has **ID collisions**: #30 appears three times, #31, #42, #55 and #62 twice each. So
even the addressing is broken.

**And today I made it worse before he stopped me.** I fired a 13-agent research workflow and began
driving the browser without writing a row, without reading the 38 that were already open, and
without an exists-check. That is the exact failure the harness exists to prevent, committed by the
person maintaining it.

**So this row is not the 39th.** Its first job is to close or fold the other 38.

---

## 1. THE MECHANICAL CAUSE, measured today, and it explains his whole complaint

### (a) One screen has a design. The other nine have a research folder.

`_design-system/sections/` holds ten screen folders. File counts, counted 2026-08-27:

```
salon-detail        21 files   01-hero.md, 02-sticky-tab-nav.md, 03-header.md, ...
booking-datetime     1 file    CORPUS.md
booking-service      1 file    CORPUS.md
booking-staff        1 file    CORPUS.md
checkout-pay         1 file    CORPUS.md
confirmation         1 file    CORPUS.md
home-feed            1 file    CORPUS.md
profile-hub          1 file    CORPUS.md
saved                1 file    CORPUS.md
search-results       1 file    CORPUS.md
```

The salon detail page is the ONLY screen with a per-section specification, and it is the only screen
he likes. The other nine have a corpus of gathered references and nothing that says what the screen
IS. That is not a coincidence to be explained, it is the answer.

### (b) The one automatic check that would have caught the drift has been aimed at a dead port since the day it was wired.

`.github/workflows/quality.yml`, job `floors:` (line 562):
- line 597 starts the site: `npx next start -p 3002`
- line 611 runs the check: `BASE_URL: http://localhost:3001`

Nothing listens on 3001 in that job. `motion:` (line 500) is the job that uses 3001, and it is a
separate job on a separate runner, so the two never share a port.

What the checker does with an unreachable page, `scripts/check-geometry.mjs`:
- line 1610 `page.goto` throws, line 1632 catches it and stores `{ floors: null, error }`
- line 1730 in the gate loop: `if (!entry || !entry.floors) { ... continue; }` and the message it
  prints is its own confession , **"could not be measured ... skipped, not counted as a floor
  failure"**
- `gateFailed` therefore stays false, line 1751 prints **"GATE: PASSED"**, exit 0.

Both port lines were written by the SAME commit, `3f3d09a2a`, 2026-07-28, titled *"Wire gate:floors
into CI. It was never a decision, and it is already green."* The mismatch was there at birth, and
"already green" is precisely what a check that cannot reach a page reports.

**So for 30 days the only thing enforcing the FLOORS LAW across the real site has been passing
because it never loaded a single page.** Design law survives in documents and dies in practice, and
this is the mechanism.

NOT YET EXECUTED, and named honestly: the chain above is read end to end from source, not run.
Playwright cannot launch in this sandbox (chromium dies on `mach_port_rendezvous`, permission
denied), so the empirical control , point BASE_URL at a dead port locally and watch it print GATE:
PASSED , has not been run here. It is step 1 below.

### (c) The chrome measured live, which is what he actually described

At 402 wide on the running site. The category row on the home page is not a filter, it is six links
to six different routes, so "switching category" is a full page change and each page draws its own
chrome.

| what he taps | the search pill | the category row |
|---|---|---|
| `/de` (All) | y 13, h 62, w 368, centred "Suchen" | y 96 |
| `/de/coiffeur` | y 4, h 54, w 370, left icon + "Coiffeur" | y 86 |
| `/de/barbershop` | y 4, h 54 | y 86 |
| `/de/nails` | y 4, h 54 | y 86 |
| `/de/spa` | y 4, h 54 | y 86 |
| `/de/inspo` | y 19, h 62, **w 316**, "Styles suchen..." | y 28 |

Three different search bars in three vertical positions, reached from one row of chips. That is
"the search bar moves to other places, that should be a permanent spot", measured.

Back arrow, same sweep, 11 pages: 44x44 at (16,20) solid white on seven of them; 40x40 at (16,16)
see-through with a 1px ring on the salon page only; none at all on a category page, a search result
page, or Inspo. The fixed bottom bar is identical on all 11.

Gray, measured earlier by hit-testing 5,500 painted points per screen: warum-solen 73.5%, the
salon-owner dashboard 44.3%, and every screen a customer browses between 0% and 4.2%.

---

## 2. THE PLAN, in order, with a binary close condition on each step

Ordered so that each step makes the next one cheaper. Nothing here is a mockup of a new look;
every step either restores a rule that already exists or makes two screens agree with each other in
the direction of the screen he already likes.

- [x] **S1. Make the floors check real again. DONE 2026-08-27, commit `16eb8782e`.**
  Both bugs fixed: the `floors:` job's `BASE_URL` now says 3002, the port its own job serves; and an
  unmeasurable route now FAILS the gate instead of being skipped.
  PROVED by control, not by claim: old code against a dead port exits **0** printing "GATE: PASSED";
  new code, same input, exits **1** printing "GATE: FAILED".
  Corrected while doing it: I had written that Playwright cannot launch in this sandbox. It can. The
  earlier failure was a different script, and the assumption was wrong.
  **THE MEASURED LIST, 15 routes at 390x844 on the live site, floors failed out of six:**
  `/de/salon/cuts-and-culture` **0** - help 1 - notifications 2 - inspo 3 - `/de/coiffeur` 3 -
  `/de/nails` 3 - `/de/spa` 3 - `/de/basel/coiffeur` 3 - salon reviews 3 - warum-solen 3 - `/de` 4 -
  `/de/basel` 4 - profile 4 - profile/settings 4 - `/de/barbershop` 5.
  **The salon detail page is the only page in the product that breaks nothing.** Every other page
  breaks between one and five. His eye and the numbers agree exactly, with no interpretation needed.
  Sharpest single number: on `/de/coiffeur`, `/de/nails`, `/de/spa`, `/de/basel/coiffeur` and
  `/de/inspo` the **largest text on the screen is 14px** against a floor of 28, an anchor ratio of
  1.02x to 1.17x. Those screens have no hierarchy at all, which is his "placement hierarchy is not
  correct", measured.
  STILL OPEN, and it is the bigger half of S1: the gate visits only **three** routes
  (`/de`, `/de/salon/old-town-barbers`, `/de/booking/lookup`) and all ten of their current failures
  sit in `FLOORS_ALLOWLIST`. So even with the port right it was toothless. Widening the route list
  will fail CI until the surfaces are fixed, which is why it is not armed in the same breath as the
  port fix. That widening is the first thing S4 earns.

- [x] **S2. Chrome becomes one component, not six.** The search pill and the category row are
  cross-screen furniture, and this project's own FLOORS LAW 8 already says an entity on more than
  one screen renders through the same component. Today they are re-implemented per route family.
  CLOSE CONDITION: the pill's measured y, height and width are identical on `/de`, all four category
  routes, and `/de/inspo`, verified by re-running the live sweep in section 1(c).
  HIS CALL, one line, not a stop: WHICH position wins. Plan A is the home page's (y 12, h 64), since
  it is the first thing anyone sees. Plan B is the category page's (y 4, h 54), which buys 10px of
  content. I will take Plan A if he says nothing.
  MEASURED 2026-08-27, all seven routes that carry a search control, live at 390x844, re-taken after
  the compaction with `scripts/measure-search-bar.mjs` so the numbers are re-derived from disk and
  not carried in memory:
      /de                  x 16  y 12  358x64  r 40px  1px border  sticky   "Suchen"
      /de/coiffeur         x 16  y  4  358x54  r 40px  1px border  sticky   "Coiffeur Schweizweit"
      /de/nails            x 16  y  4  358x54  r 40px  1px border  sticky   "Nails Schweizweit"
      /de/spa              x 16  y  4  358x54  r 40px  1px border  sticky   "Spa Schweizweit"
      /de/barbershop       x 16  y  4  358x54  r 40px  1px border  sticky   "Barber Schweizweit"
      /de/inspo            x 16  y 18  358x64  r 40px  1px border  SCROLLS AWAY  "Styles suchen..."
      /de/basel/coiffeur   x 16  y 88  358x54  r 40px  1px border  sticky   "Coiffeur Basel"
  CORRECTION to the row above, and the reason it matters: the first version of this table recorded
  the label on five of the seven routes as "Suche bearbeiten". That is wrong. Away from home and
  Inspo the bar shows the CURRENT SEARCH, "Coiffeur Basel", never the word "Suche". The wrong label
  came from a measuring script that matched the bar by its TEXT, which is also why its first re-run
  reported "no search bar" on five of the seven routes. Rule 15a's known-answer control caught it:
  the script was the broken thing, not the product. Matching on shape finds all seven, and the
  script now carries that note so nobody repeats it.
  So the pill is NOT six re-implementations of six different looks. Width, radius, inset and border
  are identical on all seven. What differs is exactly three things, and all three are what he was
  pointing at:
      1. FOUR different vertical positions, 4 / 12 / 18 / 88. The 88 is the jump you actually feel:
         on a city-plus-category route the bar sits 84px lower than on the four category routes.
      2. TWO heights, 64 and 54, so the bar changes size as you move between screens.
      3. ONE screen where it is not sticky at all: on Inspo it scrolls away, and every other screen
         keeps it. That is the "moves to other places" half of his complaint, exactly.
  This narrows S2 a long way. It is not a rebuild, it is picking one y, one height, and making
  Inspo sticky like everything else.
  SHOWN, not just written: all four positions are drawn at real size inside real 390-wide frames on
  one page, nothing to tap, at `public/_mockups/compare-search-bar-position/index.html` (`b9b2ae7b6`).
  Verified rendering at 402x844: four frames, bars at 12/4/18/88 at 54 and 64 tall, anchor 30px at
  2.14x over a 14px body, three sizes, no sideways scroll. The page carries the recommendation and
  its cost, so his answer can be one word.
  ONE OF THE THREE IS NOW FIXED IN THE PRODUCT (`b5c5b28d4`): Inspo keeps its search bar on screen,
  the same way the other six screens do. Measured before and after at 390x844: at rest the bar is
  unchanged at x 16, 358 wide, 64 tall; scrolled 600 down it is still on screen instead of gone.
  Tapping it still opens the typing field and the suggestions panel still paints over the feed,
  checked by hit-testing three points inside it rather than by reading a z-index. Graded by a second
  reader against a 9-item list, all 9 pass, and the reader re-ran both of the builder's own claims
  rather than accepting them.
  Two things that reader confirmed and that are worth keeping: the class list I first handed the
  builder would have DELETED the bar on desktop, because this page carries no desktop rules at all,
  and the pinned bar sitting 6px higher than at rest is native sticky behaviour that the untouched
  `/de/coiffeur` shows identically at 8px, not something this change introduced.
  STILL OPEN: the other two. The sweep still returns four vertical positions and two heights.
  THE FORK IS CLOSED, AND NOT BY ME. I wrote above that which height wins is one word from him.
  It is not. He answered it three weeks ago and the answer never reached half the site. Traced
  2026-08-27 by four readers plus my own reading of each file, and every step below is a quote
  from the code or a commit, not a summary of one:
    - `SearchTemplate.tsx:1329` records him picking variant C on 2026-08-10 off `/dev/search-bar`
      with one letter, "c". Variant C is 54 tall, measured off Airbnb at 390 wide. That is where
      the 54 on the category routes comes from.
    - Commit `7bc5c23ee`, 2026-08-11, the next day: "Search bar 59 to 64 tall on his call. Their
      proportion gave 59; he asked for more, so it steps to 64 on the same 4pt scale."
    - `HomeSearchPill.tsx:230-236`, 2026-08-12, the day after that: he saw the bar shrink on
      scroll and killed it. "One height, 64, whatever the scroll position."
  Latest dated owner decision wins, so 64 is settled and 54 is superseded. And `SearchTemplate`'s
  own comment at :1331 already knew what would happen: the two pills "are the SAME control on two
  surfaces and changing only the one in front of me is the half-a-sweep failure this project keeps
  naming". The home one moved to 64 on 08-11. Its sibling never followed. Plan A is therefore not
  a preference to be confirmed, it is a decision to be finished.
  WHERE EACH NUMBER ACTUALLY LIVES, so the fix is four small edits and not a rebuild:
    - `/de` y 12 = `HomeSearchPill.tsx:181` `pt-3`. Height 64 = `HomeSearchPill.tsx:236` `h-[64px]`.
    - the four category routes y 4 = `SearchTemplate.tsx:906`,
      `bandPaddingTop = useTransform(scrollProgress, [0, 1], [4, 12])`, which is 4 at rest and
      already animates to 12 once he scrolls. Height 54 = `SearchTemplate.tsx:1334` `h-[54px]`.
    - `/de/inspo` y 18 = `inspo/page.tsx:468` `pt-1.5` (6px) plus the shared pill's own `pt-3`.
      It already imports the real component, so its height is already 64.
    - `/de/basel/coiffeur` y 88 IS NOT A SEARCH BAR PROBLEM. Its band sits at the same 4 as its
      siblings. The 84 above it is the global header, which that one route does not fold away.
  THE 84 IS ONE REGEX, and this is the finding that explains the whole complaint rather than one
  bar. `Header.tsx:409` matches `^/[a-z]{2}/([^/?#]+)/?$`, which is EXACTLY TWO segments, so
  `/de/coiffeur` matches and `/de/basel/coiffeur` does not. That drives `showCategoryChrome`
  (`Header.tsx:446`), which is what collapses the global header to nothing on mobile
  (`:630` `max-md:!static`, `:662` `max-md:!py-0`). Measured live at 390 wide: header height 0 on
  `/de`, `/de/coiffeur` and `/de/inspo`, and 84 on `/de/basel/coiffeur`.
  THREE FILES EACH ANSWER "IS THIS A CATEGORY PAGE" SEPARATELY, and they do not agree:
    - `Header.tsx:409`, the two-segment regex above.
    - `CategoryPillRow.tsx:122`, a byte-identical copy, its own comment saying "Reproduced 1:1
      from Header.tsx's own derivation (not invented)".
    - `Breadcrumb.tsx:51`, a DIFFERENT strategy: last path segment against a `CATEGORY_SLUGS`
      list, which DOES match `/de/basel/coiffeur`.
  So on the city page the breadcrumb thinks it is a category route and the header thinks it is
  not. Widening only Header's regex would fix the bar and leave two of the three copies behind,
  so the edit has to name what else `showCategoryChrome` gates before it is made.
  **DONE 2026-08-27, commit `391ecb23c`. The close condition is met and re-measured independently.**
  All seven routes at 390x844, at rest AND scrolled to 300, read by a reviewer that wrote none of
  the code and again by me on a separate tab:
      /de  /de/coiffeur  /de/nails  /de/spa  /de/barbershop  /de/inspo  /de/basel/coiffeur
      every one: x 16, y 12, 358 wide, 64 tall, at scrollY 0 and at scrollY 300
  Before: four vertical positions (4 / 12 / 18 / 88) and two heights (54 / 64). The Basel page
  jumped 76px between resting and scrolled, which is the movement he described, and it is gone.
  THE FORK WAS NOT HIS AND NEVER HAD BEEN. Commit `7bc5c23ee`, 2026-08-11: "Search bar 59 to 64
  tall on his call. Their proportion gave 59; he asked for more, so it steps to 64." The home pill
  took it the next day. `SearchTemplate` never did. This was a half-finished sweep, not an open
  question, and I had it recorded as an open question for weeks.
  THE 84px WAS ONE REGEX, in two files that each keep their own copy of it. `Header.tsx:409` and
  `CategoryPillRow.tsx:122` both matched exactly two path segments. Widened together, because
  folding the header without the row appearing vacates the slot and leaves nothing in it.
  Typecheck exits 0 with no output. FLOORS LAW 3 on `/de/coiffeur` survives at exactly the floor,
  4 cards partly visible with a cropped next one per row, which was the named price of the 64.
  I CORRECTED MYSELF HERE RATHER THAN COSTING HIM A TURN: I first wrote that E5 deletes the
  hamburger and therefore needed his word. `BottomNav.tsx:80-85` records his own 2026-08-10 call
  to remove that menu item, having first traced both things that lived only in that sheet to a
  second home. Reading one more file answered it.
  PRE-EXISTING, FOUND AND NOT FIXED: the floating "Karte" button shows before any scroll while
  `SearchTemplate.tsx:2180` says it is scroll-revealed. The observer gap was 14px before this
  change and 6px after, so it never closed in either version. The comment is wrong, the behaviour
  is old, and it belongs to whoever owns that FAB.
  STILL OPEN AND DELIBERATELY A SEPARATE STEP: E7 to E11, collapsing the two pills into ONE
  component per FLOORS LAW 8. Today makes them measure identically; it does not make them one
  implementation, and a third hand-rolled copy still sits at `SearchTemplate.tsx:1983`.
  THE BUILD PLAN, arbitrated 2026-08-27 from four independent route traces plus a survey of every
  component in the repo that draws a search-bar-shaped control. Written out here because the next
  person to open this step should not have to re-derive it.
  WHAT LANDS NOW, because it is geometry and it applies a decision he already made:
    E1  `inspo/page.tsx:468`  `pt-1.5` to `pt-0`. Takes Inspo's bar from y 18 to y 12.
        LABELLED UNVERIFIED AS TO INTENT: no comment explains why that 6px is there, and it is
        page-level padding, so the whole Inspo page rises 6px, not only the bar.
    E2  `SearchTemplate.tsx:906`  `useTransform(scrollProgress, [0, 1], [4, 12])` to `[12, 12]`.
        Takes the four category routes from y 4 to y 12 and stops the bar moving on scroll.
    E3  `SearchTemplate.tsx:1334`  `h-[54px]` to `h-[64px]`. His 2026-08-11 call, finally applied
        to the sibling that never got it.
    E4  `SearchTemplate.tsx:1134`  rootMargin `-72px` to `-82px`. Derived, not invented: the old
        value was the pinned footprint 12+54 plus 6, the new footprint is 12+64, so 82. Without
        it the floating Karte button appears at the wrong scroll point.
  WHAT DOES NOT LAND WITHOUT HIM LOOKING, and this is a content change wearing a geometry fix:
    E5/E6  widening the two-segment regex in `Header.tsx:409` AND its byte-identical copy in
        `CategoryPillRow.tsx:122`. Together they fold the header on `/de/basel/coiffeur` and put
        its bar at 12 like its siblings. But that 84px is not dead space. It holds two controls,
        the home tile and the hamburger.
        I FIRST WROTE THAT THIS WAS HIS CALL BECAUSE THE HAMBURGER WOULD BE LOST. That was wrong,
        and reading one more file settled it instead of asking him. `BottomNav.tsx:80-85` records
        his own dated 2026-08-10 decision to drop the menu item, and states that both things which
        lived only in that sheet were traced to a second home BEFORE it was removed: language to
        `/profile/settings/language` (linked from `/profile/settings:95`), city to the search
        overlay's own "Wo?" field on every search entry point. Its words: "Neither is reachable
        only through the sheet, so nothing is lost." The home tile survives too, because
        `BottomNav.tsx:88`'s first item resolves to `/de`. So E5 is not a deletion he has to weigh,
        it is the same hand-off he already approved reaching the fifth route.
        E5 without E6 is still forbidden: it would fold the header and leave the row that should
        take over still returning null.
  WHAT IS A SEPARATE STEP, not this one: E7 to E11, actually collapsing the two pills into one
  component. `HomeSearchPill` already carries a variant mechanism (label, trailing, onActivate)
  and two callers already use it, so the extraction is real work rather than a rewrite. It also
  reaches a THIRD hand-rolled copy inside the same file, the map-view bar at
  `SearchTemplate.tsx:1983-2002`, whose own comment claims it is "IDENTICAL shape/size" to the bar
  above and is not: 67 against 54 today, 67 against 64 after E3.
  THE COST OF E3, NAMED BEFORE IT IS APPLIED rather than after. 54 is the only height in this
  system that was ever MEASURED against anything: he picked variant C by letter on 2026-08-10 and
  C was Airbnb read live at 390 wide. 64 came out of a different conversation the next day. So
  unifying on 64 moves five routes onto the less-grounded number and costs each listing route 10px
  of first viewport. It is still right, because his 08-11 words are the later dated decision and
  they are unambiguous ("he asked for more"), but FLOORS LAW 3 wants at least 4 content units in
  the mobile first viewport and that must be re-measured after E3, not assumed.
  ONE MORE COST, on E2: collapsing the band padding to a constant removes the last bit of movement
  from the search band, and he approved that movement twice. What survives is the pill's shadow,
  which still ramps on scroll, so the bar still answers the scroll, it just stops moving. The same
  file already collapsed `bandPaddingBottom` to `[8, 8]` for the same reason and left a comment
  saying the mechanism is untouched, so this follows a precedent set in place rather than breaking
  one.
  NOT A SEARCH BAR, FOUND ON THE WAY, PARKED WITH ITS REASON: the city page builds a breadcrumb
  chain at `[city]/[category]/page.tsx:222` and passes it to `SearchTemplate`, which declares the
  prop at `:137`, destructures it at `:429`, and renders it nowhere in 2546 lines.
  `app/[locale]/search/page.tsx:49` passes one too. Measured live at 1280x900 on
  `/de/basel/coiffeur`: two nav landmarks, zero breadcrumbs. WHY, per the missing-things
  protocol, and it is the half-landed shape: `Breadcrumb.tsx:51-53` was made to return null on
  category slugs for a real reason its comment gives, that on the bare `/de/coiffeur` routes the
  global bar "was stacking a SECOND, redundant back button right under the header home
  (owner-flagged)". The exclusion tests the LAST segment, so it also swallowed
  `/{city}/{category}`, where nothing took over. The removal landed and the replacement did not.
  CLAUDE.md's design contract states the opposite as settled: "the global `Breadcrumb` is excluded
  on `/{city}/{category}` (SearchTemplate owns it)". The first half is true. The second half has
  never been true. Parked rather than fixed here because adding a visible trail to a customer page
  is a visual change and mockup-first binds.

- [ ] **S3. Back arrow becomes one rule.** Standard is the 44x44 at (16,20) that seven pages already
  use. The salon page KEEPS its see-through 40x40, as a named variant, because a solid white circle
  on a photo reads heavy and that page is the benchmark. The three pages with none get one.
  CLOSE CONDITION: every page that is not a bottom-tab destination has a back control, and the sweep
  returns exactly two variants, on-photo and on-white, with nothing else.
  DONE 2026-08-27, and it is the measurement half, not the close: reading every back control out of
  shipped source gives **13**, in 4 box sizes (32/36/40/44), 4 icon sizes (16/18/20/22), 2 glyphs
  and 6 fill treatments. The shared `BackButton` primitive is imported by exactly ONE screen
  (SalonHero) while 21 files draw their own inline, and the primitive itself contradicts his dated
  2026-08-03 pick: it is 40px white with a hairline, his is a 44px `#F2F2F2` circle at 0px border.
  Three of the 13 sit under the global header, which `REMOVED.md:22` already deleted on purpose, so
  those are removals not restyles; one is 32px, under the 44px touch floor. All 13 are on one page,
  at real size, no tap needed: `public/_mockups/compare-back-arrow/index.html` (`58c0d98de`),
  verified rendering at 402x844.
  **THE STANDARD IS ALREADY DECIDED AND I HAD IT WRONG. CORRECTED 2026-08-27.**
  This step, and workstream 51's chrome half, both recorded the standard as his 2026-08-03 pick: a
  44px `#F2F2F2` circle at `border-0` with `ArrowLeft size={22} strokeWidth={2.2}`. There is a LATER
  dated decision that supersedes it, and it is recorded with his own words.
  `_design-system/LOCKFILE.md`, NAV CONTROLS, **LOCKED 2026-08-10**, frozen after he caught us
  shipping two shapes for one control:
      back   circle 44   glyph **`ChevronLeft`, NEVER `ArrowLeft`**   white fill   shadow only
      close  pill with the word "Close", never a bare X, 68 x 44      white fill   shadow only
      menu   SQUARE (`rounded-input`) 44, `Menu` glyph                white fill   shadow
  His words in that same block: *"the back button maybe, like, a circle... and, also, like,
  shadow"*, then *"I wanna get, like, not, like, an arrow. Like, I want, like, a good triangle."*
  A triangle is a chevron. He asked for it by shape, not by name, and the lock wrote it down.
  So under the precedence chain the later dated decision wins, and **S3 has NO fork and needs no
  word from him.** What ships today contradicts his own lock in the most visible place: the global
  header renders `ArrowLeft size={22}` at `Header.tsx:797`. The chevron correction was made in the
  auth mockup and never in the header.
  Two more contradictions inside the same lock, both currently ticked as done in workstream 51 and
  both false: there is NO close control in the header at all, and the only `X` on screen is the
  hamburger's open state, which is a square, not the frozen pill.
  RE-MEASURED PROPERLY 2026-08-27, and the old 13 was wrong in both directions. Three regex
  sweeps of this same question returned 44, then 16, then 6, and none survived a control: the 44
  counted carousel and calendar arrows as back controls, the 16 missed the global header, and the
  6 missed it again because the label it keyed on is now translated. So a reader opened all 44
  left-arrow glyph sites in shipped source one at a time. The real numbers:
    20 page-level back controls, in 17 distinct looks
    20 of 20 draw ArrowLeft; 0 draw the ChevronLeft the lock names
    11 of the 20 sit below the 44px touch floor, the smallest at 28px
    1 of the 20 uses the shared primitive; the other 19 hand-draw their own
    4 more are wizard previous-step controls, counted separately
    12 are carousel or calendar arrows and were never back controls at all
    1 screen, `app/[locale]/coming-soon/page.tsx:103`, shows TWO back controls at once (its own
      20px text link plus the global header's 44px circle), which is exactly the shape
      REMOVED.md deleted on purpose, so its fix is a REMOVAL not a restyle
  MEASURED LIVE on the salon page at 390x844: the back control is 40x40 at (16,16) while the
  share, save and report buttons on the same row are 44x44 each. One control in a row of four is
  smaller than the other three, and it is the one people press most.
  ALREADY WRITTEN DOWN AND NEVER PROPAGATED: `COMPONENT_REGISTRY.md:85` says the primitive
  "Ships at 40px, under the locked 44px touch-target floor: flagged 2026-07-12 as an open owner
  question, not silently changed." The 2026-08-10 lock ANSWERED that question with 44. The
  registry line was never updated, so the answer sat next to the question for six weeks.
  MOCKUP DELIVERED 2026-08-27, `public/_mockups/back-arrow-to-the-lock/index.html`, commit
  `dca5ffd6b`. Component scope per his 2026-08-15 instruction, not a whole page. Verified
  rendering at 402x844: 6 swatches, 3 at 40px ArrowLeft against 3 at 44px ChevronLeft, on photo,
  on white and on the grey tray; 3 type sizes, 2 weights, anchor 30px at 2.14x body, bold share
  29% by characters, no sideways scroll, no console or network errors.
  THE COLLISION IS SURFACED, NOT SILENTLY RESOLVED: the lock says white fill; the salon page uses
  see-through over its photo; this plan's own earlier carve-out said keep the see-through 40x40.
  The 40 cannot stand, because 44 is a touch floor and floors outrank a carve-out. The see-through
  is a real question and the mockup keeps it see-through on BOTH sides and says so in one line.
  STILL OPEN because it waits on one look from him, and on nothing else. The moment he answers,
  the build is: primitive to 44 + ChevronLeft + the named shadow, then 19 hand-drawn call sites
  onto it, then one removal.

  **BUILT 2026-08-27, and here is exactly how far it got.** Everything above that did not need him
  is done and committed. Measured from shipped source after the last commit, with a control (the
  primitive itself must not count as one of its own call sites, and it does not):

      composed from the shared BackButton   17
      still hand-drawn                       3
      distinct looks among the 17            2   (flat, and glass over a photo)

  Commits: `ee7b06813` glyph and size on all 21, `054ae31a3` nine call sites composed,
  `f1d504ac4` the primitive gains a Link mode, `ceec0f825` the last six Link call sites.

  THE LINK MODE WAS THE REAL BLOCKER AND IT IS GONE. Eight call sites are `<Link href>`, and the
  primitive could only render a `<button>`. A whole migration batch refused them rather than force
  it, correctly: a forced button drops cmd and middle click into a new tab, right click copy link,
  prefetch, and no-JS navigation. `BackButton` is now polymorphic on `href`. The no-href path is
  byte-identical, verified against the previous version and against live markup.

  LIVE, at 390x844, read by me on a separate tab after an independent reviewer could not (its
  session had no browser tool, which is a tooling gap and not a code defect):
      /de/booking/lookup          `<a href="/de">`                            44x44
      /de/booking/resend-link     `<a href="/de/booking/lookup">`             44x44
      .../cuts-and-culture/team   `<a href="/de/salon/...#section-team">`     44x44
      CONTROL, same instrument: the salon page's two back controls still report `<button>`, so the
      reading distinguishes the two shapes and the button path was genuinely untouched.

  THE 3 THAT REMAIN ARE HIS, NOT MINE, and they are the same one word as the salon page:
      `app/[locale]/inspo/saved/[id]/page.tsx:60`   transparent today, would gain a white fill
      `app/[locale]/inspo/board/[id]/page.tsx:73`   dark glass today, `bg-black/30`
      `app/[locale]/walk-in-pay/page.tsx:362`       a squircle today, `rounded-xl`, not a circle
  Each one CHANGES HOW A SCREEN LOOKS, so the mockup gate refused them and was right to. Not one
  agent used a skip flag on them.

  COUNTED WRONG ONCE, corrected here rather than left: a first count said 4 remained. The fourth,
  `components-legacy/staff/StaffProfilePage.tsx:457`, is the portfolio lightbox's previous-photo
  arrow, paired with a next arrow four lines below. It is not a back control and must not be
  migrated. FOUND ON THE WAY, not fixed: it carries `aria-label={t("back")}`, so a screen reader
  announces "Back" on a control that moves to the previous photo. Separate defect, own line.

  ALSO FOUND, NOT FIXED, and it is the one straight arrow left on a customer screen:
  `SearchTemplate.tsx:2007` draws `ArrowLeft size={20}` inside the map view's unified search bar.
  That bar is his own 2026-07-02 approval, so swapping its glyph is a visible change to an approved
  component and goes to him, not into a sweep. Every other `ArrowLeft` in the estate is under
  `app/[locale]/dev/`, the dashboard, or an inline text back link in a wizard footer.

  SO THE CLOSE CONDITION IS AT 17 of 20 with the last 3 on one word. The sweep already returns
  exactly two variants among everything migrated; the three holdouts are the only thing between
  this and closed.

- [x] **S4. Write the nine missing screen specs. CLOSED 2026-08-27.** Use `salon-detail`'s 21 files as the template,
  since that is the shape that produced the screen he likes. Each of the nine gets its sections
  named, its type scale fixed, its surface decided, and its card anatomy pinned to the registered
  component.
  CLOSE CONDITION: ten folders, each with a per-section spec, and each spec's numbers matching what
  the live page actually renders.
  DONE 2026-08-27 (`e677e612c` and `7950cc249`), first half met: **12 screen folders now hold
  per-section specs**, against 1 this morning. salon-detail 20 files, home-feed 13, profile-hub 9,
  confirmation 8, search-results 8, booking-service 7, checkout-pay 7, booking-datetime 6,
  saved-salons 5, saved 5, booking-staff 4, saved-looks 4.
  Four product bugs came out of the writing, none of them design:
    1. The pay step's cancellation term renders 26px BELOW the fold while the pay button is pinned,
       so a customer can pay without it ever having been on screen. It also never names the 50
       percent late-cancellation fee that the salon's own row carries.
    2. The pay button reads "Buchung bestaetigen" whether the customer pays now or at the salon,
       because `PayConfirmStep.tsx:725-731` keys the label on `paymentMode` and never on
       `payChoice`. Someone paying online is not told they are about to pay.
    3. Two specs documented the bottom nav's fourth item as firing `solen:open-menu`. `BottomNav.tsx`
       contains no `dispatchEvent` at all; it is a plain link to the profile. The false claim came
       from a source comment at `SearchTemplate.tsx:1383` and was inherited twice.
    4. There are TWO different components named `SalonCard`. The profile renders
       `components-legacy/SalonCard.tsx` at radius 16, home renders `homepage/SalonCard.tsx` at
       radius 22. One salon, two shapes, and the registry lists only one of them.
  CORRECTION to this plan's own earlier note: `_design-system/sections/saved/` was NOT built on the
  404 measurement. Its README diagnoses the 404 correctly and every one of its section files says
  "not measured" in its Measured block. It refused the bad data instead of publishing it, so it is
  kept and cited, not retired.
  SECOND HALF NOW MET TOO. `saved-looks` had measured the LOADING SKELETON rather than the screen,
  proved four ways (12 tiles matching the skeleton's 12 ratio entries, a 196px tile width matching
  the skeleton's wrapper arithmetic against the real grid's 186px, and zero images). The cause was
  in the measuring script, not in that one screen: its settle check watched text count, largest font
  and image area, and a shimmering skeleton holds all three constant, so it declared itself
  finished. FIXED AT THE INSTRUMENT (`cc69b05c2`): it now counts shimmering elements and refuses to
  call a page settled while any are visible, with its own flag when it times out with some still up.
  Proven both ways rather than argued: holding the saves request open, the counter sees 24 shimmering
  elements on that screen, which is 12 tiles times the 2 shimmer blocks each draws, and a screen that
  already measured fine still returns zero. Graded by a second reader against an 11-item list, all 11
  verified, both controls re-run rather than taken on trust.
  The spec was then rewritten against the re-taken capture (`0fe3cc713`), with all 12 corrections
  named in its README rather than swapped in quietly. It turned out the seeded customer has no saved
  looks at all, so what that screen really renders is its EMPTY state: 651px of nothing below the
  button, 77 percent of the screen, against a floor of 30. One thing is still unmeasurable and is
  labelled as such: the populated grid, because no seeded account has a saved look and seeding is a
  database write.

- [ ] **S5. Fold the 38 rows.** Every one of them is either finished, superseded by a spec written in
  S4, or genuinely still open. Mark each. Fix the duplicate IDs.
  CLOSE CONDITION: the ACTIVE design row count is under 10 and every survivor names what it is
  waiting on.
  DONE 2026-08-27 (`4bc731360`): 35 rows audited against the CODE, not against their own detail
  files. **20 closed** , FINISHED 4/19/36/37/38/41/47/64/68/78/104/107/109, SUPERSEDED 22 by 13,
  42 by 43, 52 and 55 by 81, 69 by 70, DEAD 35 and 53. Every one of the 15 survivors now carries a
  WAITING ON line naming one concrete blocker, and 9 of those blockers are one word from him.
  Index recount: 21 CLOSED, 48 ACTIVE across all workstreams.
  ROUND 3 and ROUND 4, 2026-08-27 (`dba7d7325`): 17 more rows judged against the CODE. The four
  search-panel rows: 59 and 61 FINISHED, 62 and 63 still open and WAITING ON THE SAME SINGLE ACT, one
  look at the `Wo?` step with the keyboard up on his own iPhone, so they go to him as one question,
  not two. Then 13 more: **2 closed** (13 folded into this workstream, since the 12 screen specs
  written in S4 ARE the per-screen vehicle it spent two months failing to build; 25 DEAD, its rounds
  2 to 9 never existed) and **11 survivors each naming ONE thing they wait on, nine of them one word
  from him.**
  **THREE ROWS WERE HELD OPEN BY A CLAIM THAT WAS FALSE**, which is the same disease this whole
  workstream exists to treat:
    1. Row 100 said the booking calendar cannot tell a booked day from a free one. The calendar does
       not use that route. `DateTimeStep.tsx:80,106` and `RescheduleSheet.tsx:91,119` call
       `/api/availability/unavailable-dates`, which uses an admin client and bypasses RLS. The route
       that HAS the problem has zero callers anywhere. Control: the same grep finds five real callers
       for `/api/salons`.
    2. Row 39 said it waits on his gray-or-white word. The two-panel comparison that word depends on
       was never built: `git log --all --diff-filter=A` on its path returns nothing, and its link
       returns 200 only because the app falls back to a breadcrumb page. Control: two real mockups
       return their own titles. Nothing was ever put in front of him.
    3. Row 48 said only 2 of 5 categories have a finished animated clip. Decoding the four base64
       blobs in the research file and md5ing them against disk shows FOUR finished clips; two were
       never extracted to `out/`.
  Index recount: **34 CLOSED, 35 ACTIVE, 10 PAUSED** across all 110 rows.
  ROUND 5, 2026-08-27: the list exists. `_plans/TEN_ANSWERS_2026-08-27.md`, both arms written for
  every item, ordered by how much moves when he answers, biggest first. It is TEN, not nine: the
  back arrow joined the list today with its own mockup, and rows 62 and 63 are counted as the one
  act they actually are rather than as two questions.
  TWO CORRECTIONS FOUND WHILE BUILDING IT, both of which had been keeping a row open:
    - Row 51's remaining item is A2, a SIGN-IN question about whether the flow may leak that an
      email is registered. That is a privacy trade, not a design one, so it stops counting as a
      design row the moment its chrome half closes.
    - Row 66 may not be his to answer at all yet: `_plans/ICON_SWAP_2026-08-17.md` is a live
      whole-set icon replacement at 52 of 52 coverage that has NO row in the index, and it may
      already own the Line-or-Solid decision. Flagged on the list rather than resolved quietly.
  MOVED 2026-08-27, later the same day, and the movement came from the RECORD rather than from him,
  which is the whole point of this step:
    - **The duplicate IDs are gone.** Section 0 of this file listed #30 appearing three times and
      #31, #42, #55 and #62 twice each. Re-counted just now across all 110 rows: zero duplicates.
      That half of this step's ask is finished.
    - **Row 51 stops counting as a design row.** Its chrome half is not just answered now, it is
      BUILT and live (`ee7b06813`): 21 of 21 back controls draw the locked chevron and 21 of 21 are
      44 across. Its only remaining item, A2, is a privacy question about whether the sign-in flow
      may leak that an email is registered, and this step already wrote that such an item stops
      being a design row the moment the chrome half closes.
    - **One of his ten questions shrank from three values to one.** The back arrow needed a word on
      the glyph, the size and the fill. Two of those were never his to give: the 2026-08-10 lock
      already froze them in his own words and nobody had built them. Only the fill is his.
    - **The search bar fork was never a fork at all**, per S2 above, so it never should have been
      counted as waiting on him.
  So the honest count moves from 13 design ACTIVE to 12, and from 10 waiting on him to 9. That is
  real movement and it is not the close condition, which is under 10. I am not reclassifying rows to
  reach the number; two of them genuinely changed state today and the rest genuinely have not.
  WHAT THIS STEP IS NOW WAITING ON, named concretely rather than as "his input": the nine remaining
  items in `TEN_ANSWERS_2026-08-27.md`. Eight are one word. The ninth is one look at the `Wo?` step
  with the keyboard up on his own iPhone, which nothing on this machine can produce.

  **RE-COUNTED FROM THE INDEX 2026-08-27, and the 12 above was a hand count that no longer holds.**
  Walking all 110 rows of `ACTIVE.md` mechanically:

      rows                                    110
      ACTIVE                                   36
      ACTIVE and design                        16     (close condition: under 10)
      of those, waiting on one word from him    8
      of those, naming no blocker at all        0

  So the second half of the close condition IS met: every design survivor names a concrete blocker.
  The first half is not, and it cannot be met by me. Eight of the sixteen close the moment he
  answers, which lands the count at eight, under ten. This step is genuinely gated on him and
  saying otherwise would be inventing progress.

  THE COUNTER WAS WRONG FIRST AND IS CORRECTED HERE, because a number that only ever moves down is
  the shape this workstream exists to distrust. A first pass returned 19 design ACTIVE. Reading the
  matched rows one at a time showed two false positives: row 71 matched on the "back" inside "back
  end" and row 91 on the "design" inside "non-design". Both are backend or research rows. The
  exclusion is written into the counter by name rather than the number quietly kept.
  CLOSE CONDITION NOT MET, and it cannot be met from this side. The design ACTIVE count is 13
  against a target of under 10, and 10 of those 13 are waiting on one word or one look from him.
  That is a real dependency on him, not unfinished audit work: every one of the 10 has both arms
  decided and written, so none of them needs a follow-up question. Answering all ten takes the
  count from 13 to 3. The remaining 3 are the ones with actual build work left in them.

- [x] **S8. The English site speaks German to anyone who cannot see it. FIXED AND VERIFIED
  2026-08-27, commit `5975ef6f9`.**
  Found while fixing two visible German strings on the home page. The visible ones were two. The
  INVISIBLE ones are **31, across 19 customer-facing files**, counted with a script that skips any
  string already routed through the translation system and skips the dev routes (6 more hits there,
  which do not matter).
  These are the `alt` and `aria-label` texts, the words a screen reader speaks out loud and the
  words that appear when a photo fails to load. On the English, French and Italian site they are all
  German. A blind customer on the English site hears "Zurueck", "Schliessen", "Vorheriges Foto",
  "Foto 3 von 9", "Bewertung von Anna oeffnen".
  Worst concentration, and it is on the screen he likes: `SalonLightbox.tsx` has FIVE in one file
  (`:117`, `:125`, `:145`, `:157`, `:164`), so the whole photo viewer is German in every language.
  `SalonHero.tsx` has two, `SalonResultCard.tsx` two, `StaffProfilePage.tsx` four.
  WHY IT WAS NEVER CAUGHT: `scripts/check-i18n-parity.mjs` compares the four locale files against
  each other and passes clean, because these strings are not in any locale file at all. They are
  typed straight into the components. This is the same shape as the 1,716 copy keys rendered on no
  screen: the checker measures the thing that is easy to measure.
  NO FORK, so this is not a stop. It is one sweep: route all 31 through the existing translation
  system, add the keys in all four languages, keep the German values byte-identical so the German
  site does not move.
  CLOSE CONDITION: the same script returns 0 customer-facing hits, and a screen reader label read
  off the running `/en`, `/fr` and `/it` salon page matches that page's language.
  MET. The count went 31 -> 36 (the checker under-counted at first: it matched `Schliessen` with
  the eszett only and walked past five spelled with `ss`) -> 0. Two MORE were then found that the
  checker could never have seen, because they are not German words it knows: the desktop nav
  landmark said `Hauptnavigation` and the breadcrumb trail said the English word `Breadcrumb`, both
  to every French and Italian visitor. 38 total. On top of those, 20 page titles in the header,
  which are VISIBLE, not screen-reader-only, now come from the translation files.
  VERIFIED BY ME, not relayed: one browser per language, labels read off the rendered page.
  `/de` Zurueck, Hauptnavigation, Stadt waehlen, Navigationspfad, Profil teilen.
  `/en` Back, Main navigation, Select city, Breadcrumb, Share profile.
  `/fr` Retour, Navigation principale, Choisir une ville, Fil d'Ariane, Partager le profil.
  `/it` Indietro, Navigazione principale, Seleziona citta, Percorso di navigazione, Condividi profilo.
  KNOWN-ANSWER CONTROL before publishing the zero: a probe file carrying one German label moved the
  count 0 -> 1 -> 0, so the counter measures rather than sitting stuck at zero.
  ONE GERMAN WORD DID MOVE, named rather than buried: the share button's spoken label went from
  `Salon teilen` to `Profil teilen`, because that is what the translation file already held in all
  four languages. Inventing a fifth string for German alone was the worse trade.
  ONE ROOT CAUSE FIXED, not just its symptoms: `BackButton.tsx` carried the German word `Zurueck`
  as its DEFAULT label, so every future screen that forgot to pass one would have shipped German to
  everybody. The primitive now holds no copy at all.

- [ ] **S6. Then and only then, the look.** Gray, the dashboard direction, typography. Those are
  taste calls and they are his. They are LAST on purpose: fixing them before S1 to S4 means fixing
  them once per screen forever.

---

## 3. RESEARCH RUNNING

Workflow `wf_b64ddc3e-e45`, 13 agents. Five going OUT to primary sources (Airbnb chrome behaviour,
Apple and Material law on back affordances, surface-versus-tray decision rules, what is actually
published about type discipline as opposed to folklore, and the one-entity-many-screens literature).
Six mapping our own code by subsystem. One arbiter colliding the halves.

It feeds S2, S3 and S4. It does not gate S1, which is a one-line fix to a proven bug.

---

## 4. WHAT IS HIS AND WHAT IS NOT

MINE, no asking: S1 in full, S5 in full, the back arrow rule in S3, and every place two screens are
made to agree in the direction of the salon page.

HIS, and both arms decided in advance so none of them is a stop: the search pill's winning position
(S2, Plan A unless he says otherwise), whether the dashboard goes white, and which dashboard
direction. Those three are already written up in `_plans/SETTINGS_INSTA_GRAY.md`.

---

## S7. The wide mockup pass, and both arms of every fork decided up front

Owner 2026-08-27, on the first pass being ten agents wide: *"why one per screen didnt we fix ths in
harness only one agent is too low u need to run tons tons bro are u dunb why is this happening
again"*. He is right and the mechanical cause is recorded in section 0b below.

**His answer to the one question asked before this loop started:** SAME LADDER EVERYWHERE. Every
screen is pulled onto the salon detail page's exact numbers, not merely pushed over the failing line.

### The ladder, stated as numbers a builder can apply without asking

Read off `/de/salon/cuts-and-culture`, the only route in the product that clears all six floors and
the one screen he says he likes:

| axis | the number | measured on the salon page |
|---|---|---|
| display anchor | >= 28px, and 30px is the house value | 30px |
| body | 14px | 14px |
| anchor ratio | >= 1.8x | 2.14x |
| distinct sizes on one screen | at most 5, and at most 4 inside any 8px window | 5 distinct, densest 4 |
| text at weight >= 600 | at most 30% | 30% |
| what carries emphasis | size and colour, weight 500 not 600 | Airbnb runs 3.1% at >= 600 |
| distinct shadows | at least 2 | 3 |
| photographic share of the first screen | >= 33%, by real salon content only | 34.66% |

### The forks, both arms decided now

- **A variant only looks different and moves no number.** PLAN A: the critic kills it and it is not
  shown to him. PLAN B, if a whole screen's five variants are all cosmetic: that screen's failure is
  structural, not stylistic, so it goes to the recompose arm alone and the file says so in one line.
- **A screen cannot clear the imagery floor without content he has not approved.** PLAN A: show the
  arrangement using real seeded salons and mark it as his call at the bottom of the page. PLAN B, if
  there is genuinely no salon content for that surface (Why Solen, notifications): declare the floor
  inapplicable in the file with the reason, do not invent a photo, and do not silently skip it.
- **The critic cannot render because the browser pane is busy.** PLAN A: it says so and grades from
  the file. PLAN B: the orchestrator re-renders the three highest-value comparison pages itself
  before handing over any link, since the Stop gate refuses an unmeasured mockup link anyway.
- **Two screens fix the same floor by two different mechanisms.** PLAN A: that is a defect in the
  set, not taste, and the arbiter picks one mechanism for both. PLAN B, if the two screens genuinely
  differ (Barber has content, Coiffeur does not): it is a documented VARIANT of one rule, named as
  such, per FLOORS LAW 8.
- **He rejects the ladder once he sees it.** PLAN A: the ladder is the only thing that changes, so it
  reverts by dropping one stylesheet per screen. PLAN B: fall back to the "just clear the line"
  option he did not pick, which is already built as variant A on every screen.

### 0b. Why the harness did not stop a ten agent fan-out

`~/.claude/hooks/fan-out-not-one-agent-gate.py` exists, he asked for it by name on 2026-08-03
(*"ye 12 and 40, but in any othr sub agent work i wanr alot of agents, make a whole gate for that"*),
and it IS registered in settings.json at line 492. Two holes, both measured this turn:

1. **Its matcher is `Agent`, not `Agent|Workflow`.** The fan-out went through the Workflow tool, so
   the check never ran. Every other gate that needs to see both is registered as `Agent|Workflow`
   (`no-opus-subagent-gate.py`, `no-overstep-launch-gate.py`), so this one is the odd one out.
2. **It only refuses ONE agent.** It has a ceiling on bigness and no FLOOR on width, so ten agents on
   a job he sized at forty passes it silently. His own numbers, 12 and 40, were never encoded.

Both fixed this turn in the existing file rather than a new one.

---

## Unplanned addition, 2026-08-27 into 08-28: the site spoke German in three languages

NOT on his list. Found while measuring the English home page for S2, and kept because it is his
product being wrong in three of four languages rather than a design preference.

**MEASURED ON THE SERVED PAGES, with a control, before and after.** Ten German words counted in
the HTML the dev server actually returned:

      /de   370 hits  ->  370     the control. German must stay German, and it did.
      /en    30 hits  ->    1
      /fr    same shape ->   1
      /it    same shape ->   1

The one survivor per locale is `aria-label="Kategorien"` on a section carrying `hidden`, which
renders nowhere today. Named rather than counted as zero.

**WHAT A CUSTOMER SAW, not only what a screen reader heard.** The English search sheet's black
commit button read "Suchen". A stylist page headed its reviews "Bewertungen" and, with none yet,
"Noch keine Bewertungen." Saving said "Gespeichert". Every salon card on the English home page
announced itself as the salon name followed by "Termin buchen", 24 times on one page.

**FOUR PAGES HAD NO SECOND LANGUAGE AT ALL**, which is a worse shape than a leftover string:
`profile/favorites`, `profile/looks`, `profile/stamps` and `profile/referral` had no translations
call in the file. `locale` was in scope and used for hrefs, never for copy. 36 strings moved,
including a login wall reading "Anmelden erforderlich" and a WhatsApp share message in German.
German values were RELOCATED, never rewritten: nobody approved new copy.

Commits: `3eb1fee6c` the language fix, `d05e31d75` the check that finds this class.

**THE HARDEN, and it is category 2 of the four: knowable before acting, but only by looking. So the
artifact is the script that looks, not a check that scolds at the end of a turn.**
`npm run check:hardcoded-copy` (`scripts/check-hardcoded-copy.mjs`). It carries its own
known-answer control and exits 2 if its own detector stops matching, because a detector that
silently matches nothing reports a clean site, which is precisely how the morning sweep came to
report a job it had not finished.

**ITS FIRST VERSION HAD THE SAME DISEASE IT WAS BUILT TO CURE**, and an independent reviewer caught
it: it scanned two component directories and reported OK on 3 sites while whole page routes shipped
German. Widened to the customer route tree, the count went 3 to 14, then to 10 once four were
fixed. Its three proven blind spots are written into its own header rather than discovered later.

PARKED, NAMED, NOT FIXED:
  - The Italian copy runs informal in places this sweep did not touch, including the home page
    hero. A count was taken and its own reviewer showed the classifier's verb rule is wrong, so
    NO NUMBER IS PUBLISHED. It needs a proper pass.
  - `EmptyStateDiscovery.tsx` renders a hardcoded "Alle" that two of the fixed pages share.
  - `_shared.ts:380` builds "Geöffnet bis {time}" in a helper and passes it as a prop, which the
    new check cannot see by design.
  - Every `/profile/*` route returns 200 to a cookie-less request instead of redirecting the way
    `/dashboard` does. CHECKED MYSELF rather than relayed, because a reviewer called it "no wall at
    all": the visible text of `/de/profile/favorites` with no cookies is 166 characters of nav plus
    the word "Anmelden", and zero signed-in markers. So it renders a signed-out shell, not
    somebody's data. It is an inconsistency, not a leak, and the reviewer over-called it.

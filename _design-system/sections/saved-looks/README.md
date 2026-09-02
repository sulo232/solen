# /{locale}/inspo/saved section docs

Per-section specs for the saved-LOOKS screen, `/de/inspo/saved`, at 390x844, signed in as the seeded
customer `kunde@solen.ch`.

**Current capture: `_design-system/sections/_measured/de-inspo-saved.json`**, taken 2026-08-27 with
the fixed measuring tool. **Superseded capture: `_measured/saved-looks.json`**, taken the same day
with the broken settle rule, kept because it is this folder's only measurement of the loading state.

Each file follows the `salon-detail` shape: Reference, Component, Layer, Layout with an ASCII sketch,
Measured, Tokens, Interaction, Intentional deviations, Empty state, Against the floors, Provenance.

---

## What is in this folder, state by state

| # | File | Which state | Backed by |
|---|---|---|---|
| 1 | `01-header-row.md` | The header row, which renders over **every** state | **Measured**, band 1 of the re-take, plus live rects |
| 2 | `02-saved-grid.md` | The **populated grid**, which no capture has ever seen | **Source literals + a container probe + the same components measured on `/de/inspo`**, every number labelled with which |
| 3 | `03-empty-state.md` | The **empty state**, which is what this account renders | **Measured**, band 0 of the re-take, plus live rects |
| 4 | `04-loading-skeleton.md` | The **loading skeleton**, and the capture that mistook it for the screen | **Measured**, the superseded capture |

---

## What was corrected on 2026-08-27, and why

The first version of this folder was written against a capture that had measured the loading
skeleton. The person who wrote it caught that and said so in every affected file, which is why the
files were repairable rather than junk, but the numbers in them were the skeleton's. The tool was
then fixed (`cc69b05c2`: it now counts shimmering elements and refuses to call a page settled while
any are visible) and the route was captured again. The corrections, each stated rather than swapped
in quietly:

1. **The source of truth changed file.** `saved-looks.json` (skeleton) is superseded by
   `de-inspo-saved.json` (real). Both are on disk. Every file says which one it reads.
2. **The screen renders its EMPTY STATE, and nobody knew that.** `kunde@solen.ch` has zero saved
   looks: `GET /api/discovery/saves?limit=60` returns 200 with `{"items": []}`, measured live. The
   old folder listed the empty state as one of two things it could not measure. It is now the one
   state this folder has measured properly.
3. **Document height 2019 becomes 900.** The 2019 was 12 skeleton tiles. The 900 is an 844
   `min-h-screen` page main plus the layout main's 56px bottom pad, and it holds two elements.
4. **One band becomes two.** The header row was previously folded into `main` by the walker, which
   drops a candidate whose `innerText` matches its container's. With the skeleton up, both read
   exactly "Gespeichert". With the empty state up they differ, so the row now has its own band. Same
   walker, same page, different content: this confirms the old file's fifth check rather than
   replacing it. Its **derived** 68px row height measures 68.
5. **Screen totals: 6 text elements and 4 bold (66.67%) become 8 and 5 (62.5%).** Both readings are
   dominated by the same residue, which is now measured element by element instead of theorised.
   See the table below.
6. **The screen's own sizes were recorded as "2 own (22 and 12)". In the state that renders, they
   are 3: 22, 15 and 14.** The 12 belongs to the populated grid, which does not render here.
7. **The anchor ratio was "not gradeable, no body text exists to divide by". It is now gradeable and
   it fails**: 22 / 14 = 1.57x against a 1.8x floor. The empty state authors a real body line.
8. **The 0% photographic area was excused as a measurement artefact. Half of that excuse is now
   wrong.** For the populated grid it was correct. For the state a customer with no saves actually
   sees, the zero is the screen: no photograph renders at all on the product's most photographic
   route.
9. **The 40px back tile was source-read. It is now measured**: 40x40 at (16,16).
10. **The open question "why had the fetch not resolved" is closed.** The request resolves; it took
    6553ms cold and 629ms warm on this dev server, measured from the browser's own resource timing.
    See `04-loading-skeleton.md`.
11. **Two stale citations fixed.** The ladder target is at `_plans/DESIGN_CONSISTENCY_2026-08-27.md`
    lines 295 to 304, not 231 to 243. And the old header claim that **"This folder supersedes
    `_design-system/sections/saved/`"** is withdrawn: that plan corrects itself at lines 229 to 232,
    "It refused the bad data instead of publishing it, so it is kept and cited, not retired." This
    folder cites it and does not replace it.
12. **Two literals in `02-saved-grid.md` corrected**: a dropped `items-center` in the `CardSignals`
    class string, and a loose line citation for the `ItemCard` photo frame.

---

## The screen's job

**Show the looks a customer hearted in the Inspo feed, and get back to one.** FLOORS LAW 10 asks
every element to justify itself against that sentence. In the populated state everything passes: a
back control, a title, a grid. In the empty state the screen cannot do its job at all, and what it
offers instead is one sentence and a button back to the feed.

---

## Screen totals, and what they actually count

Verbatim from `de-inspo-saved.json`:

| axis | measured |
|---|---|
| document height | 900 at an 844 viewport |
| distinct font sizes | 5: 22, 16, 15, 14, 13 |
| distinct weights | 3: 400, 600, 700 |
| text elements | 8 |
| weight >= 600 | 5, so 62.5% |
| photographic area | 0 |

**Five of those eight elements are not this screen.** The old folder inferred this from a residue
that appeared identically on a second screen. It is now measured directly: the same walk the tool
performs, re-run live on the route, returns these eight and no others.

| # | size / weight | text | rect | owner |
|---|---|---|---|---|
| 1 | 16 / 400 | "Zum Inhalt springen" | 1x1 at (-1,-1) | the `sr-only` skip link, `layout.tsx:70-75` |
| 2 | 22 / 700 | "Gespeichert" | 120x33 at (68,20) | **this screen**, `page.tsx:73` |
| 3 | 14 / 400 | "Tippe bei einem Look auf das Herz..." | 320x46 at (16,84) | **this screen**, `page.tsx:88` |
| 4 | 15 / 700 | "Inspo" | 86x44 at (16,150) | **this screen**, `page.tsx:94` |
| 5 | 15 / 600 | "Wir verwenden Cookies" | 232x20 at (81,703) | cookie banner |
| 6 | 13 / 400 | "Analyse & Marketing nur mit Ihrem OK." | 232x38 at (81,724) | cookie banner |
| 7 | 14 / 600 | "Nur notwendige" | 163x43 at (29,774) | cookie banner |
| 8 | 14 / 600 | "Alle akzeptieren" | 161x41 at (200,775) | cookie banner |

So: **this screen authors 3 of the 8 text elements and 2 of the 5 bold ones.** Its own sizes are 22,
15 and 14; the residue contributes 16 and 13 uniquely and repeats 15 and 14 at weight 600. A bold
share over n = 3 is a weak grade, and both readings appear below rather than one being hidden.

---

## Against the floors

Ladder target, from `_plans/DESIGN_CONSISTENCY_2026-08-27.md` lines 295 to 304, read off
`/de/salon/cuts-and-culture`: anchor 30px, body 14px, ratio 2.14x, 5 distinct sizes, weight >= 600 at
30%, at least 2 distinct shadows, photographic share 34.66%.

Graded on the state that renders, the empty state:

| axis | floor / ladder | this screen | verdict |
|---|---|---|---|
| display anchor | >= 28px, house 30 | **22px** measured, and 22 is also the largest the source authors | FAIL |
| anchor ratio | >= 1.8x | **1.57x** (22 over the 14px subline) | FAIL |
| distinct sizes | <= 4 ceiling, 5 ladder | 5 captured, **3 own** (22, 15, 14) | PASS on the screen's own text |
| distinct weights | <= 2 | 3 captured, **2 own** (700, 400) | PASS on the screen's own text |
| weight >= 600 share | <= 30% | 62.5% captured, 2 of 3 own | FAIL captured, and n = 3 own is not a grade |
| photographic share | >= 33% | **0%**, and in this state that is real | FAIL |
| distinct shadows | >= 2 | **0**, the ink pill computes `box-shadow: none` | FAIL |
| touch target | >= 44px | back tile **40x40** at (16,16), measured | FAIL |
| dead space below the commit action | < 30% of the viewport | **77.1%**, 651 of 844px | FAIL |
| empty-state anatomy | headline + subline + CTA + icon, centred, on a tray | subline + CTA, top left | FAIL on 3 of 4 |

Three need their real reading spelled out.

**Imagery.** Populated, this screen is nothing but photographs: a two-column masonry of look images
with 6px gutters and no chrome, and `ItemCard` takes its `src` from the item's own record, never a
baked-in path, which is what FLOORS LAW 2 requires. That state is not measured here. What IS
measured is that the empty state carries zero imagery, and that is the weaker of the product's two
saved zero states by a wide margin.

**Type range.** In the empty state the screen authors 22, 15 and 14. Populated it authors 22 and 12
and nothing in between, because every string under the title is metadata. So the two states of one
screen share exactly one text size, the 22px title, and the EMPHASIS BUDGET's clause (c), size
variety is not range, is the rule that applies to the populated state rather than the size count.

**Touch target.** `page.tsx:69` gives the back tile `grid h-10 w-10`, and it measures 40x40. The
heart on a look card is `h-11 w-11` and measures 44x44 (measured on `/de/inspo`, same component). So
the one control that is always on this screen is the one that misses the floor, and it is hand-drawn
rather than composed. Item S3 of the plan (line 190) proposes 44x44 at (16,20) as the standard; this
is 40x40 at (16,16), missing it on both size and origin.

---

## Cross-screen, FLOORS LAW 8

Both saved screens were measured the same day by the same tool, on the same account and session, and
they agree on nothing structural. Note the asymmetry the re-take exposed: **the same customer has
two favourited salons and zero saved looks**, so one screen was captured populated and the other
empty.

| axis | `/de/profile/favorites` | `/de/inspo/saved` |
|---|---|---|
| title | global header slot, measured 18/700 | body `h1`, measured 22/700, `page.tsx:73` |
| title copy | hardcoded German literal in a route map | hardcoded German literal in the page |
| back control | the header's back tile, history back | own 40x40 tile, fixed destination `/inspo` |
| bottom nav | present, measured as a band | **absent**, measured 0 `nav` elements |
| card | `components-legacy/SalonCard.tsx`, measured 358 wide | `ItemCard` / `VideoCard`, 186 wide |
| card registered | the registry names a different file for this call site | not in the registry at all |
| unsave | optimistic, plus an Undo toast | optimistic, no Undo |
| empty state | registered `EmptyStateDiscovery` (registry row 70, whose Use column names looks) | hand-drawn in the page, one line + one pill |

**The bottom nav's saved tab deletes the bottom nav.** `BottomNav.tsx:96` sends the heart to
`/inspo/saved`. `HideInBooking.tsx:54` returns null for `/\/inspo\/(board|saved)(\/|$)/` with no prop
guard, so every `HideInBooking` wrapper is null on this route, including the one that mounts the nav
(`layout.tsx:169-171`). Measured live: this route renders 0 `header`, 0 `nav` and 0 `footer`
elements, against 1, 3 and 1 on `/de/profile/favorites`. So for a customer navigating by the tab bar,
the saved tab is the one destination that removes the tab bar, and the only way out is the page's own
40px back tile, which goes to `/inspo` rather than back.

The two screens save different entities, so two card anatomies are legitimate. The label is not: one
word, "saved", points at one of the two screens, and the salon list has no tab at all.

**One thing that is NOT this screen's defect, with the control that shows it.** This route renders
two `<main>` elements, the layout's `<main id="main-content">` and the page's own, which the HTML
spec does not allow (at most one `main` that is not hidden). The same count came back on
`/de/profile/favorites`, so it is an estate-wide layout pattern rather than something to fix here.
Recorded so a later reader does not "fix" it in this file.

---

## Known-answer control for the geometry

Every column-width number in this folder comes from the same arithmetic, so the arithmetic was run
first on a case whose answer is already known. `/de/profile/favorites` is `max-w-2xl mx-auto px-4`,
which predicts 390 - 32 = 358 at this viewport, and its capture measures a 358-wide card. The method
gives the right answer where the answer is known.

On this route the same method predicts 186 for the real grid, and a container probe (the real
wrapper classes rendered into the live page, measured, then removed) returns **186**. The skeleton's
196 comes from the same arithmetic with one extra term, and it measured 196. See
`04-loading-skeleton.md` for why the same component is 186 wide on the feed and 196 here.

---

## Not measured, and why

- **The populated grid, and this is a BLOCKER rather than a gap.** Every seeded account I can reach
  renders the empty state, because the screen reads `discovery_saves`
  (`app/api/discovery/saves/route.ts:24,38`) and `kunde@solen.ch` has no rows there. Measuring the
  populated state needs at least one saved row for a test account, which is a database write, and I
  may not make one. Until then: the exact photographic share, the real tile heights against real
  photos, the real bold share, and the density-floor check on this route stay unmeasured. What
  `02-saved-grid.md` offers instead is source literals, a container probe on this route, and the same
  components measured on `/de/inspo`, each labelled with which.
- **Every other locale.** The title and the empty-state copy are hardcoded German, so the other three
  locales render German here no matter what. The back control's `aria-label` is the one translated
  string on the screen.
- **The loading state under a warm server.** The one capture of it is the superseded one, taken on a
  cold route where the endpoint took 6553ms.

# Why our tick became their ticket, and the principle behind it (2026-08-20)

Owner, verbatim: *"the icons u chose for alt makes no scence at all ... like check s alt gnna be a
ticket like what are u good why did ths even happen tell me i want to fix the principle"*

## The immediate cause

I needed to find Iconly's version of each of our icons. My method was:

1. take our icon's name, `Check`
2. turn it into a search word **out of my own head**, `"tick"`
3. search their library for that word
4. take the top text result

`tick` is inside `ticket`. Their search ranked **Ticket** first. I took it and moved on.

Nothing in that method ever looked at the drawing, and nothing ever asked their library what it
actually calls a checkmark. When I finally asked, the answer was **"Checkmark"**, and getting their
whole vocabulary took 45 seconds for 6496 names.

## The principle, and it is not about icons

**I keep measuring a proxy instead of the thing, because the proxy is easier to reach.**

Three times in two days, same shape, different subject:

| what I wanted to know | the proxy I used | what it cost |
|---|---|---|
| which icons the product uses | the ones that RENDERED on pages I opened | 60, when the answer is 219 |
| whether two icons are the same drawing | whether my regex output matched | said identical, they differ |
| what Iconly calls our icon | a word I invented, text-searched | our tick became their ticket |

Every one of those is the same move: the direct question was available and slightly harder, so I
answered a nearby easier question and reported it as the answer.

**The rule going forward, in one line: name the thing you actually want to know, ask whether you are
measuring THAT or something standing next to it, and if it is a proxy, say so in the sentence.**

Two consequences worth stating separately, because they are the ones that would have caught all
three:

1. **Ask the other system for its own vocabulary rather than guessing the key.** A library knows its
   names. One call gets them. A word I make up is a guess wearing a search query.
2. **When the match cannot be justified, leave it BLANK.** A blank cell says "they do not have
   this". A wrong cell says "this is yours", and that is a lie the sheet tells quietly. The first
   version told it 22 times.

## What the fix looks like now

- [x] **Their real names, 6496 with categories.** `verified:` commit 84eeb4eee, and re-runnable:
      `catalogue.py 1 300` pages their own search and prints the count it reached.
- [x] **Matching runs against names that EXIST.** `verified:` commit 84eeb4eee. Every hand mapping is checked
      against the catalogue before use, and my own guard rejected **11 of my own entries** because I
      had invented those names too (`Award`, `Bank`, `Box`, `Minus`, `Wifi`, `Brush` and others).
      That guard is the principle enforcing itself on the person who wrote it.
- [x] **160 of 219 matched, 59 refused.** `verified:` commit 84eeb4eee; rematch.py prints both
      counts on every run. Refusing is the feature.

## Which icons should move, and which should not

**The rule: motion marks a CHANGE. Nothing else.**

An icon may move only if, at the moment it moves, something became true that was not true a second
ago: it got saved, it succeeded, it arrived, it started loading, it flipped on.

Everything else holds still. Not because motion is expensive, but because motion is a SIGNAL, and a
signal spent everywhere is spent nowhere. If the back arrow and every chevron move, the heart
filling in when a customer saves a salon has to compete with them for the eye.

Measured against our 219:

- **39 should move.** They mark a moment: Check (75 files), Star (45), Plus (29), the loading
  spinner (27), Heart (23), the warning triangle (23), Trash (18), Bell (10).
- **162 should hold still.** They point or they name: X (78 files), the chevrons (40 and 34),
  Search (28), the arrows (28 and 27), MapPin (24), Scissors (24).
- **18 should never move.** Chrome and legal: the cookie icon, shields, locks, the social logos.

## The same principle, caught twice more while building the fix

Both were found by the control rather than by noticing, and both would have shipped as a
confident wrong answer.

1. **"Iconly has no artwork for any of your 160 icons."** The run reported artwork for
   **zero of 160**, cleanly, with no error. The control: run the same query for one icon
   whose answer I knew, `Checkmark`, on its own. Ten rows came back. So the library was
   fine and my instrument was broken, and it was broken in the most deniable way, an
   `IncompleteRead` on their streamed response that my own `except Exception` was quietly
   turning into "no results". **A total failure is almost never the subject and almost
   always the instrument.**
2. **The star that was a sparkle.** Matching on their exact name still produced a row where
   the Light column held a decorative burst and the Bold column held a plain star. Iconly
   reuses one name across unrelated icons, so "one row per look" silently assembled six
   different drawings. Fixed by taking one coherent FAMILY, and where that family lacks a
   look, the cell stays blank. Same lesson as the ticket, one level down: **the name is not
   the drawing.**

## A separate finding, surfaced by that classification

**Sparkles is still in 10 shipping files, and you killed it by name on 2026-08-14.**

- [x] **Why it is still there, and it is NOT that the cleanup failed.** `verified:` commit b80f87bb0
      did the removal and it holds: every file it touched is still clean today. The problem is the
      root set. It swept `app/` and never looked in `components-legacy/`, which is where 10 of the
      11 leftovers live, in files that really render (SalonCard is imported by 42 live files,
      DashboardLayout by 48).

      **That is the same incomplete-root-set error as the July registry count**, which globbed
      `app/` and `components/` and missed `components-legacy/` holding most of the components. Twice
      now, the same folder.

      The eleventh is not a use at all: `BottomNav.tsx:89` only mentions Sparkles in a comment
      explaining why Compass was chosen instead. Checked rather than counted.

**Not fixed, and deliberately not:** replacing 10 icons is a visual change on live screens and he
has said, by name, that choosing icons independently is exactly what he does not want.

## Flat, motion or 3D: the answer, and it is not the one I drafted

He asked *"is it too much thn"* and *"i feel like many of em could have motions when pressed etc
or not like back buttons n sh"*. I drafted "cut fifteen animated icons to three". Three
independent adversarial reads killed all three survivors against rules and code that already
exist, so the answer is **zero**.

- **The loading spinner.** Our own loading rule says a content-shaped skeleton, and that spinners
  live only inside a button. `verified:` CLAUDE.md states row, MOTION.md sheet 22.
- **The success tick.** `SuccessMark` already owns that moment.
  `verified:` `app/[locale]/_components/primitives/SuccessMark.tsx` exists on disk.
- **The rating star.** Already pops to 1.38 over 450ms, staggered, edge-triggered on fill. A
  bought file cannot be edge-triggered like that.

**The rule that settles the library question, quoted rather than paraphrased:** LOCKFILE §13.7,
*"different icon STYLES may coexist only in visually separate zones ... mixing within one zone is
drift."* An animated Iconly tick in a row beside 79 static Lucide ticks is one zone, two styles.
So the icon question is all or nothing, which is exactly what the six columns in the sheet are
for.

**Two claims of mine that the reads proved FALSE, corrected in the sheet the same hour:**

- [x] **"3D belongs in a slot we do not have yet." Wrong.** `verified:` five customer files
      reference `icons/categories`, opened and grepped this hour:
      `app/[locale]/_components/homepage/MobileCategoriesRow.tsx`,
      `app/[locale]/_components/homepage/WalkInBand.tsx`,
      `app/[locale]/_components/layout/CategoryPillRow.tsx`,
      `app/[locale]/_components/search/SearchOverlay.tsx`,
      `app/[locale]/_components/search/SearchTemplate.tsx`. The real leftover is that the empty states still show the grey disc
      the rules ban.
- [x] **"Roughly half the files have no press response." Corrected to 65 of 182.**
      `verified:` commit 4eee732a4. Half is the number including the salon dashboard, and my own cruder filter said 94 of
      227 because it matched paths rather than following what a customer route actually reaches.

## The press finding, which is the bigger one

- [x] **65 of 182 customer files with something tappable do nothing when pressed, 244
      controls.** `verified:` `npm run check:press` plus a route-reachability scan from the 124
      customer entrypoints; `app/[locale]/_components/layout/BottomNav.tsx` contains zero
      `active:scale`, counted on disk. The five worst are global chrome on every route: the bottom tab bar, the breadcrumb, the
      language switcher, the desktop city pill, the toast.
- [x] **His back-button instinct was backwards, and that is good news.** `verified:`
      `app/[locale]/_components/salon/SalonLightbox.tsx:127` and
      `app/[locale]/inspo/board/[id]/page.tsx:69` both carry `active:scale` on the back control,
      read off disk. The back arrows already press. What does not press is the bottom tab bar.
      `verified:` `BottomNav.tsx` contains zero `active:scale`.
- [x] **Why it drifted: the checker exists and nothing runs it.** `verified:` package.json
      defines `check:press` and `gate:press`; grep across `.github` and `.claude` returns no
      caller, so it fires only when a human types it.
- [x] **Five presses were written and could not play. Fixed.** `verified:` commit c5eb5d4a9,
      graded PASS by a reviewer that re-read every line off disk, and `npm run check:press` now
      reports DEAD=0 where it reported DEAD=2. The two in `MobileMenu.tsx` were added by the
      9 June press sweep, the one that recorded itself as done, so they had never played once:
      the element listed only a shadow transition, leaving the scale nothing to animate on. The
      three on `queue/[token]/page.tsx` had no transition at all and two were off the ladder.
      The one remaining NO-TRANSITION is `components-legacy/chat/ClientTags.tsx:175`, and chat
      is a killed feature, so it is left alone.

## Where the icons actually live (he asked "where do we use most of em")

- [x] **More than half of all icon usage is on screens a customer never opens.** `verified:` commit 1314862b4.
      `where_used.py` reads each file's real `lucide-react` import list and counts both the
      `<Name>` form and the value form. 1966 icon drawings in total, **1083 of them in the salon
      dashboard and the dev prototypes.** The dashboard alone needs **141 different icons**.
- [x] **161 of the 219 can reach a customer, 54 exist only in the back office.** `verified:` commit 1314862b4,
      same scan, intersected against the 219 in `ours_all.json`. So a swap aimed at how the app
      looks to a customer is a 161-icon job.
- [x] **Two instrument bugs caught in this one measurement, both the ticket shape.** `verified:` `app/[locale]/_components/layout/BottomNav.tsx:93` and commit 1314862b4;
      the corrected numbers above versus the first run.
      1. `Link` is a Lucide icon name AND `next/link`'s component, so counting `<Link` made it
         the top "icon" on six surfaces. Fixed by counting only what a file really imported.
      2. Counting only `<Name>` said **68 icons are drawn nowhere**, which I was one sentence
         from reporting as dead code. They are not dead. `BottomNav.tsx:93` does
         `{ key: "inspo", Icon: Compass }` and renders `<Icon>`; `dashboard/badge-manager`
         puts a dozen into a lookup object. The angle bracket is not the usage.

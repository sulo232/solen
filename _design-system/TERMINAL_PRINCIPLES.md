<!-- exists-check: `npm run exists terminal` run this turn, 2026-08-17 (16 hits: 3 routes, 1 API, 4
     components, 7 symbols, plus one graveyard line covering terminal directions A and C, which are
     REMOVED and must not be re-proposed). Plus a glob for *PRINCIPLE* across _design-system/ and a
     grep for "operator screen" across the same tree. Everything close to this was read end to end
     before a word was written:
       - components/MerchantTerminal.md (2026-08-17) is the COMPONENT layer: what this one screen
         IS, its anatomy table, its four views. This file does not repeat that table, it cites it.
         That doc answers "what did we build". This one answers "how do I decide when I build the
         next one".
       - PRINCIPLES.md (2026-08-16) is the general deciding pass across all four screen classes.
         This file is its operator-specific sibling and follows its structure and voice on purpose.
         Where they overlap, PRINCIPLES.md is the parent and is cited, never restated.
       - components/DashboardUI.md is the OTHER operator surface and is the comparison in section 9.
       - TASTE_LOG.md 2026-07-15 (Round D1) is the dated operator law. TASTE_LOG.md 2026-08-16 is
         THE SCREEN PRINCIPLE. Both are quoted, neither is rewritten.
       - LOCKFILE.md owns frozen literals, RATIONALE.md the evidence, PROCESS.md how work is scoped.
         None of them contains a counter-screen deciding procedure.
     NET-NEW: nothing in the tree tells a builder how to decide hierarchy, spacing, type, colour,
     containers, density, the fold or actions on a counter screen. MerchantTerminal.md records the
     answers for ONE screen without generalising them; PRINCIPLES.md generalises across all screens
     without going deep on this class. Eleven rejected rounds are logged in
     _plans/MERCHANT_TERMINAL_2026-08-15.md and their lessons have never been lifted into rules a
     second screen could be built from. That is this file. Registered in CANON in
     scripts/hooks/canon-archive-gate.py in the same turn, per that gate's own instruction, with the
     concern it owns and an honest note that it is a per-class deepening of PRINCIPLES.md.
     This file states NO new frozen literal. Every number is either quoted from LOCKFILE, a dated
     TASTE_LOG round or a numbered rejection round, with the pointer, or it was MEASURED on the
     running screen this turn and is labelled `measured:`. -->

# TERMINAL PRINCIPLES

**How to decide before you write markup for a counter screen. The operator sibling of
[PRINCIPLES.md](PRINCIPLES.md).**

A counter screen is one screen a shop leaves open all day on a device nobody is holding. It is not a
page someone navigates to, it is a board someone glances at from a metre away with a customer
standing in front of them. Every rule below exists because a version of this screen was rejected for
breaking it. Eleven rounds are logged in
[`_plans/MERCHANT_TERMINAL_2026-08-15.md`](../_plans/MERCHANT_TERMINAL_2026-08-15.md), and each
principle here names the round or the measurement that earned it.

**What this file is not.** It is not the anatomy of the merchant terminal. That lives in
[`components/MerchantTerminal.md`](components/MerchantTerminal.md) and is not repeated here. Read
that one to learn what the screen has. Read this one to decide what the next one gets.

**Measurement note.** Everything labelled `measured:` was taken on 2026-08-17 off the running screen
at `http://localhost:3000/terminal`, viewport 390x844, using `getBoundingClientRect` and
`getComputedStyle` over the live DOM, cycling all four views. Behavioural claims were taken by
CLICKING the running screen, not by reading the source. Where a number could not be taken, it says
so.

---

## 1. Whose law governs, and which customer laws do NOT apply

**Write the class in the file header before anything else. The absence of that one line produced six
rejections in a single session** (TASTE_LOG 2026-08-16, "THE SCREEN PRINCIPLE").

A counter screen is an **operator** screen. Its governing law, in order:

1. The owner's latest dated word.
2. The statutory floors: WCAG 2.2 AA, nFADP and GDPR, the Swiss total-price rule. Not outrankable by
   taste, `CLAUDE.md:346`.
3. Hooks and gates.
4. `LOCKFILE.md` frozen literals.
5. **The merchant round, [TASTE_LOG.md](TASTE_LOG.md) 2026-07-15 (Round D1).** This is the operator
   law, and it is dated owner decisions, not advice.
6. The five lines of THE SCREEN PRINCIPLE, TASTE_LOG 2026-08-16.

### The customer FLOORS LAW does not govern here, and this is the damage it did when it was applied anyway

| Customer floor | What it demands | What it produced on a counter screen |
|---|---|---|
| FLOORS LAW 2, imagery | roughly one third of the first viewport is photographic | Nothing legal. This screen's content is a queue. Every attempt to satisfy it was decoration, decoration was rejected three times, and `no-decorative-image-gate.py` now blocks it. |
| FLOORS LAW 4, edge visibility and warmth | grouped content on white with no photo anchor REQUIRES the sunken tray `#F4F4F5` | The grey canvas. Owner: *"i dont like ths gray backrgrounf"*. |
| FLOORS LAW 1d, a semantic-colour moment | every screen carries at least one | With no photography the only pale token left is `s-warning.bg` `#FDF6E7`, which became a full-bleed beige bar. Owner: *"You made up a random fucking collar that's beige."* Taste rule 3 bans that colour by name, so the floor and the taste rule were in direct contradiction and nothing said which one won. |
| FLOORS LAW 6, display anchor | one anchor of at least 28px | Right answer, wrong reason. Keep the anchor (section 2), but keep it because a board glanced at from a metre needs a readable state, not because a customer floor said so. |

**So, explicitly, on a counter screen:**

- **No imagery floor.** The life source is LIVE DATA. A screen with real numbers moving on it is
  finished. A screen with a stock photo on it is decorated.
- **No semantic-colour requirement.** A shift where nothing is wrong carries no colour at all.
  `measured:` the Log and Shop views render **0.00%** chromatic area. That is the correct state, not
  a gap to fill.
- **No sunken tray, no `#F4F4F5` anywhere.** `measured:` the page canvas is `rgb(255,255,255)`. The
  only non-white surface on the screen is the top band at `#0A0A0A`.
- **No warm anything.** Taste rule 3 bans warm cream by name, and `LOCKFILE.md` §1 RETIRED records
  that the warm token family was deleted from the config on 2026-07-27, so the warmth half of floor
  4 has no vocabulary left to satisfy it even if it applied.

### The trap you will fall into, named rather than smoothed

`LOCKFILE.md:1980` still states the grey-tray mandate with no audience qualifier, and the precedence
chain puts LOCKFILE above the `CLAUDE.md` scope block that fixed this on 2026-08-16. **On a literal
reading, the corrected copy currently loses the tie.** PRINCIPLES.md §1 already flags it as live.
Until it is repaired in LOCKFILE: an operator screen is white, and the LOCKFILE line is the stale
one. Do not let a verifier win this argument with a line number.

---

## 2. Hierarchy

**One anchor per view. It is a sentence, and it carries the live number.**

`measured:` each of the four views renders **exactly one** element at 30px and **exactly one** at
18px:

| view | the 30px anchor | its sub-line |
|---|---|---|
| Board | "The wait is 45 minutes" | "If you walk in now. 6 people ahead of you." |
| Chairs | "2 of 3 chairs are free" | "3 people working today" |
| Log | "Everything that happened" | "2 things so far" |
| Shop | "The Fade Factory" | "This screen, signed in and left open" |

The 18px is the salon name in the black band. It is chrome, identical in every view, and never
competes for the anchor role. It is the only 18px on the screen.

**The rules:**

1. **The anchor is a SENTENCE with the number inside it, not a label with a number below it.** "The
   wait is 45 minutes", never "Wartezeit" with a small 45 underneath. This is PRINCIPLES.md §6, and
   on a data screen it is the single biggest reason a photograph-free screen reads finished instead
   of like a wireframe.
2. **Derive the anchor from the question the counter is about to be asked out loud.** A customer
   walks in and says "how long?". The Board answers before anyone opens their mouth. Do not derive it
   from whichever number was easiest to compute.
3. **One anchor. Never two.** Round D1's root-cause note (TASTE_LOG 2026-07-15) found that
   "cluttered" was never element count, it was EQUAL VISUAL WEIGHT: every block wearing the same
   costume with no dominant object. Two anchors is that same failure in a bigger font.
4. **What may compete: nothing.** `measured:` the second-loudest thing on the screen is a 15px name
   at weight 500, and the anchor-to-workhorse step is 30 to 13, a factor of 2.31.
5. **Inside a row, the person's NAME leads.** `measured:` a waiting row runs name (15/500 ink), then
   service and ticket (13/400 grey), with the wait label right-aligned above. The name leads because
   the name is what the counter says out loud.
6. **A repeated control never carries a name the row already gives.** Round 10, owner: *"why is
   there two start w mia"*. The stylist's name was printed on the Start button, so the same name sat
   on all six rows while the menu one row below named a different stylist. WHO is now the assigned
   stylist's face beside a plain "Start". **A repeated control gets a repeated label. Identity is
   carried by the element that differs, which is the face.**
7. **A state is reported in exactly ONE place.** Round 8 caught a green "Free" word under an orange
   ring: one person reporting two states at once. This is Round D1's "a person or event appears in
   EXACTLY ONE place" applied inside a single component. `measured:` the stylist sub-line is
   `rgb(107,107,107)` grey in every state, and the ring is the only indicator.

---

## 3. Spacing

**Two ladders, for two different jobs. Confusing them is what made the "binary 16/32 only" claim
untrue the moment anyone measured it.**

| ladder | values | what it is for |
|---|---|---|
| **LAYOUT** | **32 between sections, 16 inside a section** | The gap between two things that could have lived on separate screens. |
| **INSIDE A BLOCK** | 12, 8, 4, 2 | A title to its sub-line, an icon to the text beside it, a name to its meta. Never a section gap. |

`measured:` on the Board, four section boundaries at exactly **32** (one `pt-8`, three `mt-8`), and
nothing at 24 or 28 anywhere on the screen. In-block values in use: 12 (peer cards, the "Today"
sub-line), 8 (icon to control), 4 (title to sub-line), 2 (name to meta). Row vertical padding 16.

**Round D1 fixed "binary 16/32 gaps only" and it cannot be literally true**, because a title and its
own sub-line are not two sections. Round 9 applied the binary rule by sweeping every 24 up to 32,
which was correct, and MerchantTerminal.md then recorded "nothing between 16 and 32 anywhere", which
`measured:` is false in two places. Both are defensible, and neither is a gap:

- `pt-5`, **20px**, the sheet's top inset under the drag handle. That is the distance from a grab
  handle to the first content, not a gap between two sections.
- `px-5`, **20px**, the horizontal page gutter, in 15 places. A different axis entirely.

**The rule, stated so it survives being measured:** the LAYOUT ladder is 32 and 16 and admits no
third value. Horizontal gutters and a sheet's own top inset are not on the layout ladder and are 20.
Any other vertical value between two named sections is drift.

**Why 32 against 16 and not a prettier pair:** FLOORS LAW 5 (`CLAUDE.md:100`) says a deletion is
legal only if the surviving cue passes "between-group gap at least 2x the in-group gap". 32 against
16 is exactly 2x, so the test can actually be run. With any other pair it cannot.

**The bottom inset is not spacing, it is a floor.** `measured:` the scroll container carries
`padding-bottom: 112px`, which is the 88px floating bar plus the safe-area inset plus 24. Round 10,
owner P0: the last row was unreachable under the bar. **Any screen with a floating bar owes its
scroll container the bar height plus the safe area plus one gap-ladder step, and any menu opening
near the bottom stops above the bar, not at the window edge.**

---

## 4. Type

`measured:` identical across all four views. **4 sizes: 13, 15, 18, 30. 3 weights: 400, 500, 600.**
Two families: Inter for body (43 of 45 text nodes on the Board), Inter Tight for the two display
roles. Never Geist.

| size | weight | what it is FOR | count on the Board |
|---|---|---|---|
| **30** | 600 | The anchor. The state of the shop as a sentence. One per view. | 1 |
| **18** | 600 | The salon name in the band. Fixed chrome, identical in every view. | 1 |
| **15** | 500 or 600 | A person's name, and the label on a control (Start, Accept). The things a hand acts on or a mouth says. | 14 |
| **13** | 400, 500 or 600 | Everything else: service, ticket, wait, section headers, sub-lines, tab labels. The workhorse. | 29 |

**The rules:**

1. **13 is the workhorse, not 15.** `measured:` 29 of 45 text nodes. Set the default at 13 and
   promote to 15 only for a name or an action label. A board read from a metre away needs a small
   uniform field so the two promoted sizes can do any work at all.
2. **The anchor is at least 1.8x the workhorse.** `measured:` 30 against 13 is 2.31x.
   `CLAUDE.md:114` sets the 1.8 floor. Do not shrink the anchor to close the gap.
3. **A size used once is a level only if it is a ROLE.** PRINCIPLES.md §6 says a size used once is a
   mistake with a number on it. The two exceptions here are genuine roles: the anchor is by
   definition once per view, and the band's 18px is fixed chrome present in all four views. **A
   fifth size appearing once, and not one of those two roles, gets deleted.**
4. **Numbers a person compares down a column are `tabular-nums`.** `measured:` the log timestamps
   carry it. A wait that ticks every minute must not make the row twitch.
5. **No em-dash, en-dash or middot in any string.** The current screen breaks this and it is a hard
   rule, not a preference. See section 11 item 1.

**Live breach, stated because a principles doc that hides one is worthless.** The type budget is at
most 4 sizes AND at most 2 weights (`CLAUDE.md:53`, `LOCKFILE.md:378`). `measured:` this screen
renders **three** weights in every view. It is inside the size ceiling and over the weight ceiling.
Section 11 item 2 has the detail.

---

## 5. Colour

**One file decides. Nothing else on the screen may pick a colour.**

That file is [`app/[locale]/dev/terminal/status.ts`](../app/[locale]/dev/terminal/status.ts), and its
tone table is deliberately not reproduced here. Read it there and extend it there. A second tone
table in a second file is exactly how a system becomes a palette. Owner, 2026-08-17: *"make acc
system fir indication instead of rndm sg"*.

### The three rules

1. **A tone is DERIVED from a column that exists.** Every tone in `status.ts` is computed from
   `joined_at`, `started_at` or `services.duration_minutes`. There is no "looks busy" tone, because
   nothing in the database says that. **Want a new tone? Name the column first. No column, no tone.**
2. **A tone appears in exactly ONE place per thing.** Round 8: a green "Free" word under an orange
   ring was one stylist reporting two states at once. The ring speaks; the word stays grey.
3. **A colour answers one question: does this need me, and how soon.** Not "what kind of thing is
   this", not "which category", not "how new". An AGE is not a state (PRINCIPLES.md §3): a colour
   that expires on a timer with nobody deciding anything is decorating, not signalling.

### Colour what already exists instead of adding something to carry it

Four rounds went into matching a status badge to the owner's reference before the answer turned out
to be deleting the badge. His reference was an onboarding screen introducing ONE person, where a
badge is the only thing that could carry a state. **A board reports on everybody at once, and the
circle around each face is already there, already repeated, already identical for everyone.** So
colour the circle.

Generalised: **before adding an element to carry a state, list the elements already repeated on
every instance and ask whether one of them can carry it.** A ring, a border, a rule, a number's own
colour, a row's inset. Adding a new object is the last resort, not the first idea.

**And one thing banned outright:** no coloured left or right edge bars on anything, ever. Owner,
Round D1: *"i hate that... this left side green thingy. never do this ever"*.

### The budget, measured

| view | chromatic share of the 390x844 viewport |
|---|---|
| Board (six rows overdue, stale seed) | **1.79%** |
| Chairs (two chairs free) | **0.19%** |
| Log | **0.00%** |
| Shop | **0.00%** |

`measured:` only three chromatic values render anywhere on the screen: `#16A34A` green, `#C2410C`
orange, `#DC2626` red. **No blue at all, in any view.** The reference calibration in PRINCIPLES.md §3
puts Airbnb's operator screens between 0.0% and 0.5%, with two of five at exactly zero. Chairs, Log
and Shop sit inside that band. The Board sits at 1.79% only because six queue rows are simultaneously
overdue, which is the screen doing its job.

**So the budget is not a fixed percentage, it is a shape: colour is proportional to how much is
wrong.** A quiet shift is a black and white screen. If your screen carries colour when nothing needs
a person, that colour is decoration.

### The statutory line, and it is not negotiable

`measured:` green appears ONLY as an SVG ring stroke (3px on the 78px board chip, 2px on the 54px
list chip) and as **zero** text nodes in any view. That is correct, and it is law rather than taste:

| token | hex | contrast on white | legal as |
|---|---|---|---|
| `s-success` | `#16A34A` | 3.30:1 | a graphical indicator (3:1 floor). **Never text.** |
| `s-urgency` | `#C2410C` | 4.9:1 | text, at any size |
| `s-error` | `#DC2626` | 4.83:1 | text, at any size |
| `s-warning` | `#F1AE27` | 1.94:1 | **nothing that carries meaning alone.** This is why the middle wait tone is burnt orange and not the system's warning amber. |

Ratios are from `CLAUDE.md:37`, where they were computed twice independently. WCAG AA is tier 2
statutory and cannot be outranked by a taste preference. **The rule for any new tone: if it will be
text, it clears 4.5:1 on white before it ships; if it will be a stroke or a disc, it clears 3:1.
Compute it. Do not assume a token is safe because it is in the config.**

### One ink commit per screen

`measured:` the only ink-filled control on the Board is Accept, inside the decision card. Every
repeating row commit (Start, Done) uses the row rung: white, hairline, `shadow-whisper`. This follows
`LOCKFILE.md:16` and the `CONTROL_ELEVATION.md` amendment of 2026-07-24. **A commit that repeats down
a peer list is never the page's ink fill, because then the page has six primary actions and therefore
none.**

---

## 6. Containers

**Round D1: ONE carded hero per screen, everything else BARE TEXT on the canvas.** Owner: *"we need
breathing space not just everywhere cards or boxes or pill"*.

A container is earned only when it does something whitespace cannot. THE CONTAINER TEST,
`LOCKFILE.md:561-584`, has three cases: it sits on a non-white surface; it is one of several peer
items competing in one scroll and the reader must see where one ends; the whole box is tappable as
one unit. On a white counter screen the first case never applies, so a box here is almost always
case 2.

`measured:` content containers per view, **excluding chrome**: Board 2 (one per pending request),
Chairs 0, Log 0, Shop 0. Every list on the screen is bare rows: a hairline above, `px-5 py-4`, no
card, no box, no pill costume.

### The chrome carve-out, and why the rule needed one

`measured:` the floating bottom bar is 358x60 at radius 9999 with a shadow, so it meets the box test
literally, and a verifier applying the rule literally counted it as a container on every view. It is
navigation that never scrolls and never competes with content. **The count is of CONTENT containers.
Persistent chrome (a top band, a fixed nav bar, a sheet's own rounded top) is excluded, and any doc
stating a container count says so, or the next verifier is right and the doc is wrong.**

### The half the rule was missing: the count is a function of the DATA

MerchantTerminal.md records "Board 1", and that is true of one moment. `measured:` this turn, at two
pending requests the Board carried 2 boxes; after four arrived it carried **4 boxes, 488px of boxed
vertical, which is 57.8% of one viewport**, against the 35% ceiling recorded in TASTE_LOG 2026-08-16.
Nothing in the screen caps it.

**So the rule is per KIND with an instance cap, never per screen:**

- **Exactly ONE kind of thing on the screen may be boxed**, and it is the thing that will not resolve
  itself if nobody acts.
- **That kind carries a visible instance cap.** Show the first two or three, then a counted row
  ("+4 more"), so the boxed share cannot grow past the ceiling as work arrives. This is Round D1's
  "count + See all + about 2 preview rows, never the full day", applied to boxes instead of to a
  list.
- **State the count as a range with its worst case**, never as a constant: "1 kind, 1 to 3 instances,
  boxed share at worst 39%".
- Any additional box passes a named case of the container test and says which, in a `boxed-ok:` note
  on the line. `entity-card-gate.py` already reads that marker.

**Never a container AND a hairline between its rows.** Inside a box, rows may be hairline divided.
Outside one, they may not. Two devices claiming one boundary is the box-soup failure.

---

## 7. Density and the fold

**The job is glanceable, so what sits above the fold IS the design and everything below it is
overflow.**

The job sentence, from MerchantTerminal.md §1: the person at the counter sees who is in a chair, who
is waiting, and what needs a decision, and acts in one tap.

**The fold is not the bottom of the viewport. It is the top of the floating bar.** `measured:` the
viewport is 844 and the bar's top edge is at **768**, so the usable fold is 768 and the last 76px is
behind a bar.

### The priority order, and it is fixed

1. **Who is in a chair.** The stylist row. It is the shop's capacity and the first thing anyone
   looks at. `measured:` 104 to 253.
2. **The state of the shop as a sentence.** The anchor. `measured:` 253 to 342.
3. **What needs a decision.** The boxed kind. `measured:` starts at 374.
4. **Who is waiting.** The queue.
5. **Everything else.** Today, history, settings.

### What wins when they compete, and the current screen gets this wrong

Round 10 recorded "2 queue rows fully above the fold" with one pending request. `measured:` at two
pending requests, **zero** queue rows sit fully above the bar; at four, the queue begins below the
fold entirely. The decision cards are evicting the queue because they are unbounded (section 6).

**The rule: the section whose length is a function of the DATA yields to the section whose length is
a CONSTANT.** Capacity (a fixed number of stylists) and the anchor (one sentence) always hold their
place. A list that grows with arrivals gets a visible cap so it cannot push a lower-priority section
off a screen that must still be usable. When two sections compete for the fold, cap the variable one,
never the fixed one.

### Density minimums do not apply here, and one of them inverts

The customer density floor (PDP gallery at least 5, reviews at least 3, services at least 6) is a
customer floor and does not bind an operator screen. **The counter equivalent is the opposite: show
the fewest rows that let someone act, and cap the rest.** A wall of thirty waiting rows is exactly as
much a wireframe signal as an empty screen, by the opposite mechanism.

**But an empty state never becomes an illustration.** Render the populated layout with zeros.
`measured:` the Shop view renders "Finished today 0" and "CHF 0.00" instead of hiding the section,
and the Log renders "2 things so far". That is the zero state, PRINCIPLES.md §8 item 8. One carve-out:
a section with no rows says one honest line ("Nothing else booked today.") rather than disappearing,
because a section that self-hides teaches the counter that the screen is unreliable.

---

## 8. Actions

**One tap for the common case. Exceptions one level deeper. Everything reversible. A disabled control
says why.**

All four claims below were verified by clicking the running screen on 2026-08-17, not by reading
source.

### One tap for the common case

`measured:` clicking Start on a waiting row assigned a chair immediately, with no confirm dialog and
no intermediate sheet, and the stylist's sub-line changed from "Free" to "Ravi, 30m" while the ring
went green to ink. **A counter screen has a customer standing at it. A confirmation step on the most
common action is a queue forming.**

### The exceptions live one level deeper, in TWO menus, not one

Round 10, owner: *"inside the three dotts are not good at all"*. One menu was doing two unrelated
jobs and neither was obvious.

- **The FACE opens the chair picker.** Every stylist is listed, and the busy ones are **greyed, not
  hidden**. A list that silently drops a name reads as a bug the first time somebody looks for it.
- **The DOTS hold only the endings that are not a haircut**: did not turn up, remove from queue.

**The rule: one menu, one category of consequence.** If you cannot name what a menu is FOR in three
words, it is two menus.

### Every action is reversible for as long as somebody is still looking

`measured:` every action raised an undo bar ("Elias started", plus Undo), and the source clears it
after 8 seconds. **An undo that lives forever is a second source of truth.** Eight seconds is the
window in which the person who tapped is still watching the screen.

The heavier rule this sits inside: nothing is a dead end, and the way back gets heavier the further
money has moved. A tap that has not touched a payment is undone by one tap. Anything past a payment
is a documented flow, never a silent reversal.

### A disabled control states the condition and names where it clears

`measured:` after filling all three chairs, the five remaining Start buttons went to
`opacity: 0.5; cursor: not-allowed`, and the screen rendered a line: **"Every chair is full. Finish
someone in Chairs to free one."** The reason names the view that resolves it.

**Three parts, all required:** state the condition, name where it is cleared, and render the reason
in the DOM rather than in a tooltip or a labels object. This is the same defect class as
`walk-in-pay/page.tsx`, which defined a cancellation policy in all four locales with zero JSX render
sites.

### Every control does something

Round D1 banned a second nav-shaped bar outright: *"what does this bottom navigation do? now we have
two navigation... just clutter"*. The bar survives here only because each of its four controls opens
a genuinely different view rather than moving a highlight. `measured:` the four views render
different anchors, different content and different container counts. The two controls in the top band
pass the same test (Replay, sound on and off).

**A control that is only a costume is a dead affordance, and `LOCKFILE.md` §0.5 already bans it.**

### Touch targets

`measured:` 28 interactive controls, minimum height 44 on every one. Icon buttons 44x44, Start 69x44,
tab controls 56x44. **Six controls are 32px wide** (the row overflow dots). That clears WCAG 2.5.8
(24px) but misses the house floor of 44. On a screen operated by someone holding scissors, take the
house floor: **44 in both dimensions, and if the icon is smaller than that, the hit area is not.**

---

## 9. What this is not: the terminal against the dashboard console

Same product, same company, opposite answers. Neither is a mistake. They are different objects
because they are used differently, and copying a decision across the line makes both worse.

| | **Counter terminal** | **Dashboard console** |
|---|---|---|
| what it is | ONE screen with four views | `measured:` **49** `page.tsx` routes under `app/[locale]/dashboard/` |
| how it is reached | never. It is already open | navigated to, deliberately, one route at a time |
| posture | standing, arm's length, glancing, customer waiting | sitting, close to the screen, reading, alone |
| session length | all day | minutes |
| page canvas | white. `measured:` `rgb(255,255,255)`, no `#F4F4F5` anywhere | `bg-s-bg-sunken` grey (DashboardUI.md) |
| unit of content | a bare row on the canvas | a `DashPanel`: white `rounded-2xl` plus hairline |
| containers per view | `measured:` Board 2, Chairs 0, Log 0, Shop 0 | many. Panels are the layout |
| blue | none. `measured:` zero blue in any view | the primary. `DashButton` primary is `bg-s-accent-bright` `#276EF1`, and blue marks active nav |
| status colour | a ring stroke derived from a real column (`status.ts`, four tones) | `DashStatusPill`: pale background, **saturated semantic text**, plus a dot |
| primary action | one ink fill per screen; repeating row commits use the white rung | blue primary buttons, per panel |
| type | `measured:` 4 sizes, 3 weights, one 30px anchor per view | a panel-title scale; hierarchy is carried by the panel, not by size |
| navigation | 4 controls in a floating bar, each opening a real view | a slim labelled sidebar. Round D1: *"i love this a lot, it looks clean"* |
| second nav | forbidden | forbidden. Round D1, same line, binds both |

### Why each difference exists

- **White versus grey canvas.** A grey canvas separates panels from a page. The terminal has no
  panels, so grey buys nothing and costs the one thing a glanced-at board needs, which is maximum
  contrast behind black text. The owner rejected it by name.
- **Bare rows versus panels.** The console is a filing cabinet: many kinds of thing, and a panel says
  where one kind stops. The terminal shows one kind of thing (people, in three states), so a box
  would be around everything, which means it is around nothing.
- **No blue versus blue primary.** Blue on the console marks "you are here" across 49 routes. There
  is nowhere else to be on the terminal, so blue would have no job, and a colour with no job competes
  with the ones that have one. It also lets the terminal reserve ALL of its colour for "does this
  need me" (section 5).
- **A ring versus a pill.** The console's rows are dense text with no repeated graphic to colour, so
  a pill is the cheapest carrier. The terminal already draws a circle around every face, so it
  colours what is there.
- **A floating bar versus a sidebar.** A sidebar costs horizontal space a 390px device at a counter
  does not have, and its destinations are read rather than glanced at.

### What crosses the line and what does not

- **No `Dash*` primitive belongs on the terminal.** They carry the console's skin: sunken canvas,
  blue primary, saturated pill text.
- **`StaffChip` does not belong on the console.** Its ring encodes a queue state no console route
  computes.
- **What DOES cross is the rules, not the components.** Round D1 is the shared operator law: one
  carded hero, bare text otherwise, one pill spec per context, no coloured edge bars, a person
  appears in exactly one place, binary 16 and 32. Both screens owe all of it.
- **The unresolved one, and it is not resolved here.** `LOCKFILE.md:16` says ink primary,
  `LOCKFILE.md:1541` says blue for the dashboard, V3-D426 says outcome-coloured on status screens,
  and Round D1 approved ink. Four answers for one control, open for a month. The terminal ships ink
  and does not need the console's answer to do so. PRINCIPLES.md §9.2 tracks it.

---

## 10. The build order

**Follow this before writing any markup. Steps 2 to 5 produce written lines in the file header. They
are not thinking you do silently.**

The measured cause of eleven rejections (Round 11) is that between the complaint and the first edit,
nothing set a target, so the last sentence spoken became the spec. `measured:` off the session
transcript, time from the owner's message to the first edit of the screen file was 1.2, 1.2, 0.9,
0.3, 2.2 and 2.8 minutes, several of those landing before any measurement was taken.

- [ ] **1. Run the exists-check.** `npm run exists <keyword>` plus synonyms, including the graveyard.
      Terminal directions A and C are IN the graveyard. Do not re-propose them.
- [ ] **2. Write the class in the file header.** "Operator screen. Governed by TASTE_LOG 2026-07-15
      plus TERMINAL_PRINCIPLES.md. The customer FLOORS LAW does not apply, specifically not the
      imagery floor, the semantic-colour requirement, or the sunken tray."
- [ ] **3. Write the job in one sentence, with a person in it.** Not "a page". A person, a situation,
      an outcome. Every element is then justified against that sentence out loud, or it is cut.
- [ ] **4. Write the anchor sentence before any markup.** The actual string, with the live number in
      it, and the column it comes from. If you cannot name the column, you do not have an anchor.
- [ ] **5. Write the three targets as numbers.** Boxes: which ONE kind, its instance cap, and its
      worst-case boxed share. Gaps: 32 and 16, nothing else on the layout ladder. Type: the anchor,
      the workhorse, the small, and the anchor-to-workhorse ratio (at least 1.8).
- [ ] **6. Name every tone and the column each derives from.** No column, no tone. Compute the
      contrast on white before shipping: 4.5:1 for text, 3:1 for a stroke or disc.
- [ ] **7. List the elements already repeated on every instance**, and pick the state carrier from
      that list before considering a new element.
- [ ] **8. Build the whole screen, populated from seed data.** Not a component in isolation, not a
      swatch board. Seeding the database is the fix for an empty section, never a violation.
- [ ] **9. OPEN AND USE the running page.** Click every control. Fill every chair. Trigger the
      disabled state and read what it says. Let it sit a minute and see whether the numbers move.
      **This is the step this estate skips.** TASTE_LOG 2026-08-16 records the honest limit: a script
      collecting six scalars ran every round while nobody clicked anything, and the two most
      expensive rejections ("the mockup isn't working at all", "you just made setup") were not design
      defects at all. One rendered nothing; the other did nothing.
- [ ] **10. Measure the rendered screen at 390x844, in every view**, not just the first: type sizes
      and weights, the gap set, container count excluding chrome, chromatic area share, minimum touch
      dimension, and where the fold lands relative to the floating bar.
- [ ] **11. Have someone who did not build it look at the WHOLE screen before the owner does.**
      Round 11 measured four verifier runs across 38 turns, with exactly ONE finishing before
      handover, and rounds 8 to 12 had no whole-screen review of any kind. **And write that brief
      from the RULES, not from the last rejection.** All four historical briefs were the previous
      rejection in checkbox form, which is precisely why each one caught only what had already been
      caught.
- [ ] **12. Show a mockup and get approval before touching shipped code.** Unchanged, and it binds
      here too.

---

## 11. Contradictions between these docs and the running code

Found by measuring on 2026-08-17. Listed rather than smoothed, per `CLAUDE.md` rule 18. **None is
fixed by this file**, which owns no code and no other document.

1. **The middot is a hard-rule breach.** `LOCKFILE.md` §0.1, under "Hard rules (NEVER allowed)", bans
   the `·` middot as a meta-separator on a repeated owner flag, and §0.12(e) repeats the ban for
   running copy. `measured:` the terminal renders it in at least five strings, including
   `"Men's Haircut · #A-042"`, `"Haircut at 21:45 · asked 0 min ago"`, `"Luca · now"` and
   `"Needs a decision · 4"`. The rule's own remedy is spacing, a comma, or a stacked line.
2. **Three weights against a ceiling of two.** `CLAUDE.md:53` and `LOCKFILE.md:378` cap a screen at
   4 sizes AND 2 weights. `measured:` 400, 500 and 600 in every view. `MerchantTerminal.md:89`
   records "3 weights (400 / 500 / 600)" as the spec without noting it is over. Round 11 item 8
   already measured the same three against "its own cap of 2" while fixing the gate's parser, and
   the file was never brought under the cap. **Either a weight goes, or the terminal needs a written
   dated carve-out. It currently has neither.**
3. **The anchor grew and nobody recorded it.** TASTE_LOG 2026-08-16 and PRINCIPLES.md §6 both record
   the approved ladder as `{13, 15, 18, 28}` with the anchor at 2.15x body. `measured:` the anchor is
   **30**, at 2.31x the 13px workhorse. Still legal against every floor, simply not what the approved
   state says.
4. **"Nothing between 16 and 32 anywhere" is false.** `MerchantTerminal.md:88`. `measured:` a 20px
   `pt-5` under the drag handle and a 20px `px-5` gutter in 15 places. Section 3 proposes wording
   that survives measurement.
5. **The container count is written as a constant and is a function of the data.**
   `MerchantTerminal.md:84` records "Board 1, Chairs 0, Log 0, This screen 0". `measured:` the Board
   carried 2, then 4, one box per pending request, reaching 57.8% of a viewport against a 35%
   ceiling. Section 6 proposes the per-kind form.
6. **The 25.2% approved-card figure is stale.** TASTE_LOG 2026-08-16, quoted in PRINCIPLES.md §4.
   `measured:` one card is now 122px tall, which is **13.0%** of the viewport. The card was
   deliberately shrunk in Round 10 and the recorded figure was never updated.
7. **The fourth view has two names.** `MerchantTerminal.md:103` calls it "This screen". `measured:`
   the tab label reads "Shop".
8. **A third staff-face size exists and is undocumented.** `MerchantTerminal.md:83` records board 78
   and list 54, matching `StaffChip.tsx` `SIZES`. `measured:` a waiting row renders a **32px** face
   with **no ring**, using the plain `Avatar` primitive. That is arguably correct (the ring carries
   state, a bare avatar carries identity) but it is written down nowhere.
9. **"41 dashboard routes" is stale.** Both `MerchantTerminal.md` and `PRINCIPLES.md` say 41.
   `measured:` **49** `page.tsx` files under `app/[locale]/dashboard/` today.
10. **A stale token comment.** `tailwind.config.js:186` warns about `s-urgency (#9A3412)`, while the
    token defined three lines above at `:183` is `#C2410C`. `measured:` the DOM renders `#C2410C`,
    which is also what `status.ts` reasons about. The comment is wrong, not the token.
11. **Six controls at 32px wide against the 44px house floor.** Section 8. Legal under WCAG 2.5.8,
    under our own floor.
12. **The LOCKFILE grey-tray line still carries no audience qualifier** (`LOCKFILE.md:1980`) and
    outranks the `CLAUDE.md` scope block that fixed it. Already flagged in PRINCIPLES.md §1, repeated
    here because it is the single line most likely to send a builder back to the rejected grey
    canvas.

---

## The five lines, if you remember nothing else

1. **Operator screen. White canvas, no imagery floor, no required colour, no grey tray.** The
   customer FLOORS LAW produced the two things he rejected by name.
2. **One anchor per view, and it is a sentence carrying the live number.** Everything else recedes to
   13px.
3. **32 between sections, 16 inside one, and 12 / 8 / 4 / 2 only inside a single block.** Nothing at
   24.
4. **Colour is derived from a column, shown in one place, and proportional to how much is wrong.** A
   quiet shift is black and white. Colour what is already on the screen instead of adding something
   to carry it.
5. **One boxed KIND with an instance cap.** Everything else is a bare row on white. And before
   handing it over: open it, click every control, and let somebody who did not build it look at the
   whole screen.

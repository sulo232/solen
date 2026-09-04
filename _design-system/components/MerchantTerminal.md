<!-- exists-check: net-new vs DashboardUI.md (the 41-route /dashboard console, blue-accent vibrant
skin, panels on a sunken canvas , the terminal is deliberately the OPPOSITE of that: one screen, no
panels, no blue, bare rows on white), vs StatusInline.md and StatusPill.md (both are a customer
open/closed WORD, binary, no derivation , this doc owns a four-tone system derived from queue
timings), and vs SalonCard.md / SearchBar.md / SearchOverlay.md / FilterSheet.md / MapSalonDetail.md
(all customer surfaces). Nothing in the registry covers an operator counter screen. The one thing it
EXTENDS rather than restates is the merchant round in TASTE_LOG.md 2026-07-15, which it cites. -->

# MerchantTerminal

The screen a salon leaves open at the counter to receive, start and finish work without opening the
dashboard. **OPERATOR surface.** The customer FLOORS LAW does not govern it: no imagery floor, no
semantic-colour requirement, no sunken tray. Its life source is live data, not photography.

Governed by the merchant round in [TASTE_LOG.md](../TASTE_LOG.md) (2026-07-15) plus the rules below,
which are what eight rejected rounds between 2026-08-15 and 2026-08-17 actually settled.

**Route:** `/terminal` (bare, outside the locale segment, dev only).
**Files:** `app/[locale]/dev/terminal/Screen.tsx`, `StaffChip.tsx`, `status.ts`, `prototype.ts`,
`loadTerminalData.ts`.

---

## 1. The screen's job, in one sentence

The person at the counter sees who is in a chair, who is waiting, and what needs a decision, and
acts in one tap.

Every element is justified against that sentence or it is cut.

---

## 2. Indication: what a colour MEANS

Owner, 2026-08-17: *"make acc system fir indication instead of rndm sg"*. One file owns this,
`status.ts`, and nothing else on the screen may pick a colour.

A colour answers one question: **does this need me, and how soon.**

| tone | shows on | what has to be true |
|---|---|---|
| green | a stylist's ring | free. A chair is open. |
| ink | a stylist's ring | working, and the line under the face says when they finish |
| grey | a waiting row's minutes | waited under 25 minutes |
| orange | a waiting row's minutes | waited 25 to 39 minutes |
| red | a waiting row's minutes | waited 40 minutes or more |

Two rules keep it a system rather than a palette:

1. **A tone is DERIVED from data that exists.** Every one above is computed from `joined_at`,
   `started_at` and `services.duration_minutes`, all real columns. There is no "looks busy" tone,
   because nothing in the database says that.
2. **A tone is shown in exactly ONE place.** A green "Free" under an orange ring is one stylist
   reporting two states at once. The ring speaks; the word underneath stays neutral.

**The wait thresholds are ABSOLUTE, and that is a deliberate trade** (owner, 2026-08-17). They used
to be relative to the wait each person was promised, which is truer and looked broken: 28 minutes
rendered red while 33 rendered grey two rows below, because the first was promised 15 and the second
45. The promise is not on the screen, so the reader saw two numbers and a rule that appeared to be
counting rows. The cost of the absolute version, named rather than buried: somebody promised 85 and
waiting 40 now shows an alarm we have not earned, and somebody promised 15 and waiting 24 stays quiet
one minute from breaking our word. Worth revisiting if the promise ever renders on the row.

**The ring is green or ink, never red** (corrected the same day). A free stylist used to go red when
the queue was overdue, so red meant "problem" on a number and "available" on a face, in one viewport.
`#C2410C` is the orange, not the system's warning amber, because amber measures 1.94:1 on white and
this measures 4.9:1, and these numbers are text.

**Why the ring and not a badge.** Four rounds went into matching a badge to the owner's reference
before the answer turned out to be deleting it. His reference is an onboarding screen introducing
ONE person, where a badge is the only thing that could carry a state. A board reports on everybody
at once, and the circle around each face is already there, already repeated, already identical for
everyone. Colour what exists rather than add what does not.

---

## 3. Anatomy

| part | spec |
|---|---|
| top band | 110px, `bg-s-ink`, salon name centred at 18/600 white, two 44px circular controls (Replay left, sound right). Both do something: a control that is only a costume is a dead affordance. |
| sheet | overlaps the band by 20px, `rounded-t-[32px]`, white, 36x4 drag handle |
| stylist chip | `StaffChip`. Ring 0.039 of the outer circle, white band 0.059 (one and a half times the stroke), photo fills the rest. Board size 78, list size 54. Measured off the owner's own screenshot with PIL. |
| the ONE card | the "Needs a decision" block, `rounded-[24px]` + hairline. The merchant law allows exactly one container per screen and this earns it: it is the only thing on the board that will not resolve itself. **The count excludes persistent chrome**, corrected 2026-08-17: a verifier applying the rule literally counted the floating bottom bar as a second container on every view, and it is right that a rounded, shadowed, 358px-wide element meets the test. The bar is navigation that never scrolls and never competes with content, so the rule is about CONTENT containers. Measured after the carve-out: Board 1, Chairs 0, Log 0, This screen 0. |
| every other list | bare rows on the canvas: hairline above, `px-5 py-4`, no card, no box, no pill costume |
| a waiting row | name leads, then `service · #ticket`, then the labelled wait ("waiting 44 min"). On the right: the assigned stylist's FACE, a plain `Start`, and the dots. The face answers "which chair" and tapping it changes the chair. **The stylist's NAME never goes on the button**: it put the same name on every row and then repeated it inside the menu one row below, which is the version the owner rejected ("why is there two start w mia"). |
| the two menus | separate on purpose, because one menu doing two jobs made neither obvious. The FACE opens the chair picker, listing every stylist with the busy ones greyed rather than hidden (a list that silently drops a name reads as a bug the first time somebody looks for it). The DOTS hold only the endings that are not a haircut: did not turn up, remove from queue. Both are placed from the measured position of the control that opened them, and "does it fit below" stops above the floating bar, not at the window edge. |
| rhythm | **32 between sections, 16 inside one.** Corrected 2026-08-17 after a verifier measured the claim: "binary only" was not true and could not be, because a title and its sub-line, or an icon and the text beside it, are not section spacing. The real ladder is 32 / 16 for LAYOUT, and 12 / 8 / 4 / 2 for the inside of a single text block or row (`gap-3` icon to control, `mt-2` inside the headline block, `mt-1` title to sub-line, `mt-0.5` name to meta). Measured live: 32 at five section boundaries, 16 for row and card padding, and nothing between 16 and 32 anywhere. |
| type | 4 sizes (13 / 15 / 18 / 30), 3 weights (400 / 500 / 600). One 30px anchor per view, never two. |
| the one ink CTA | Accept, inside the card. Every repeating row commit (Start, Done) uses the row rung instead: white + hairline + `shadow-whisper`. |
| bottom bar | floating pill, four 44px controls, each opening a real view |

---

## 4. The four views

One bottom control each, and each changes what the sheet renders. A nav that only moves a highlight
is a dead affordance.

- **Board**: the stylist row, the wait headline, the decision card, Waiting, Today.
- **Chairs**: one row per stylist, the same chip at list size, and the only place a chair is freed.
- **Log**: every action taken today with its time, newest first. The owner asked for this by name.
- **Shop**: the day's real derived numbers, and one honest line saying whether the live booking feed is connected. Named Shop here and on the tab; it used to be "This screen" in this doc and "Shop" on the tab, which is two names for one view.

---

## 5. Rules learned the hard way

1. **A reference's SIZE is not transferable, only its proportions, and only after asking what the
   element IS on each side.** A hero on an onboarding screen and a repeated item in a row are not the
   same object. Ours are grounded in `SalonTeam.tsx` (88px for a staff avatar as the CONTENT of a
   section), so supporting stylists sit one step below that.
2. **A ratio is only as good as the two edges it is a ratio of.** Two rounds were lost to measuring
   against the ring's inner edge instead of against the photo.
3. **Start must MOVE a person, not delete them.** Assigning a chair is the point; a status change
   with no assignment drops the customer off every list at once.
4. **Every action is reversible for eight seconds.** An undo that lives forever is a second source
   of truth.
5. **A disabled control says why.** Start is disabled when every chair is full, and the screen says
   so in a line rather than handing the counter a button that does nothing.

---

## 6. Not wired yet

`bookings` is not in the Supabase realtime publication (verified live 2026-08-15), so no
subscription can fire and arrivals are scripted in `prototype.ts`. The "This screen" view says so on
the screen rather than implying the feed is live.

**The seed ages, and that is real data behaving correctly.** Waits are computed from `joined_at`, a
real column, so a queue seeded an hour ago genuinely has been waiting an hour and the whole board
goes red. Replay rebases to the waits the page OPENED with, which keeps a demo run stable, but it
cannot make the seed younger than it is. Re-seed `joined_at` before showing the screen if the
middle tone matters. This is a property of the fixture, not a bug in the tone table.

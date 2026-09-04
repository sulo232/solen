<!-- exists-check: `npm run exists "airbnb"` plus a grep for PRINCIPLES across _design-system/ both run
     this turn, 2026-08-16. Existing near-matches, all read before writing:
       - research/PRINCIPLES_50.md and research/GEOMETRY_PRINCIPLES_2026-07-17.md are harvested
         external-principle EVALUATIONS (adopt / already-exists verdicts), not a deciding procedure.
       - AIRBNB_PROFILE_PRINCIPLES.md is one surface's capture notes.
       - RATIONALE.md owns the WHY. LOCKFILE.md owns frozen literals. SOURCE.md owns the canonical
         system in prose. COPY_LAW.md owns writing. PROCESS.md owns how work is scoped and graded.
         TASTE_LOG.md owns his dated calls.
     NET-NEW: none of them is the layer that says HOW TO DECIDE before any markup. That is what the
     2026-08-16 panel found missing after six rejections, and TASTE_LOG.md:884 ("THE SCREEN
     PRINCIPLE, and it is five lines before any markup") is his own five-line version of it. This
     file EXTENDS that entry into the full deciding pass and adds nothing that contradicts it.
     Added to CANON in scripts/hooks/canon-archive-gate.py in the same turn, per that gate's own
     instruction, with the concern it owns.
     This file states NO new frozen literal. Where a number appears it is quoted from LOCKFILE or
     from a dated TASTE_LOG round, with the pointer. -->

# PRINCIPLES

**How to decide, before any markup. Read this in five minutes, every time, before you open a file.**

This is the layer that was missing. Everything else in `_design-system/` tells you what the answer
IS once you know what you are building. Nothing told you how to work out what you are building, so
every decision defaulted to the smallest unit available: one class string, copied from whatever file
happened to have it. That is what six rejected rounds of a merchant terminal on 2026-08-16 were made
of.

It states no new frozen value. Numbers here are quoted from `LOCKFILE.md` or from a dated round in
`TASTE_LOG.md`, with the pointer, so this file can never quietly outrank one of his decisions.

**Order of authority, unchanged, from `CLAUDE.md:344-355`:** his latest word, then the statutory
floors (WCAG AA, nFADP and GDPR, the Swiss total-price rule), then hooks and gates, then
`LOCKFILE.md`, then the pinned blocks in `CLAUDE.md`, then dated `TASTE_LOG.md` decisions, then
memory, then the global rules. This file is a reading order, not a new tier.

---

## 1. What kind of screen is this

**Say it out loud first, in the file, before anything else. This is the step that was skipped six
times in a row.**

Four classes. Pick one and write it at the top of the screen file.

| Class | What it is | Whose law governs it |
|---|---|---|
| **customer** | Someone choosing, booking or paying. Discovery, search, the salon page, booking, checkout, profile, Inspo. | FLOORS LAW, `CLAUDE.md:96-117`. All of it. |
| **operator** | Someone running a shop. Any `/dashboard/*` screen, the merchant terminal, the queue display. | The dated merchant round, `TASTE_LOG.md` 2026-07-15, plus THE CONTAINER TEST, `LOCKFILE.md:561-584`. |
| **internal-tool** | Only staff or admins ever see it. Admin preview chrome, the dev index. | Nothing aesthetic. It is not a design reference and must never be copied from. |
| **prototype** | A demo of a screen, not the screen. Anything under `app/[locale]/dev/`. | The class it is prototyping, plus a header naming what is scripted and what is real. |

### Why this line exists, in his own case
A merchant terminal was rejected six times. Nobody ever wrote down that it was an operator screen,
so the CUSTOMER law was applied by default, and two of its floors then actively DEMANDED the two
things he rejected:

- FLOORS LAW 4 says grouped content on white with no photo REQUIRES the grey tray. That produced the
  grey canvas. He said: *"i dont like ths gray backrgrounf"*.
- FLOORS LAW 1d says every screen needs a semantic-colour moment. On a screen with no photography
  the only pale token left is `s-warning.bg` `#FDF6E7`, so it became a full-bleed beige bar. He said:
  *"You made up a random fucking collar that's beige."* That colour is banned by name in taste rule 3.

The law contradicted itself and nothing said which half wins on which screen. Full write-up:
`TASTE_LOG.md:847-915`.

### What is true of an operator screen and is NOT true of a customer screen
- **No imagery floor.** Its life source is LIVE DATA, not photography.
- **No semantic-colour requirement.** A screen with nothing wrong on it carries no colour at all.
- **No grey tray.** Boundaries come from whitespace, a hairline, and the gap ladder.
- **One carded hero at most.** Everything else is bare text on the canvas.

### Two holes in this, named rather than smoothed
**One.** The class is inferred from a DIRECTORY today (`LOCKFILE.md` §12.4 scopes the operator skin
to `app/[locale]/dashboard/**`), which is exactly why a terminal prototype living at
`app/[locale]/dev/terminal/` never picked up the carve-out. Until the class is a declared line the
LOCKFILE reads, **write it in the file header yourself and say which law you are applying.**

**Two, and it is live.** The scope fix of 2026-08-16 went into `CLAUDE.md:66-92`, but
`LOCKFILE.md:1980` still states the grey-tray mandate with no audience qualifier, and the precedence
chain puts LOCKFILE above the CLAUDE.md blocks. **So the corrected copy currently loses the tie.**
Until that is repaired in LOCKFILE: an operator screen is white, and the LOCKFILE line is the stale
one.

---

## 2. The screen's job

**One sentence, with a person in it, before any markup.**

Not "a page". Not "the terminal". A person, a situation, an outcome:

> "Someone at the counter with three people waiting takes the next one without asking anybody
> anything."

> "A woman on a tram at 18:40 decides whether this salon is worth the walk."

**Then the rule: every element on the screen is justified against that sentence, out loud, or it is
cut.** No matter how well it is built. This is FLOORS LAW 10 (`CLAUDE.md:107`), and the case that
produced it was him asking why his own profile screen has a search bar. It has one because a search
bar was easy to add, not because anyone searches their own saved list.

Two things the rule did not originally cover and that keep biting:

- **A shell that changes by role has one job PER ROLE.** The dashboard shell shows a staff member 4
  destinations and an owner 14. That is three different jobs from one file, so justify each role view
  against its own sentence. An element that belongs to the admin's job is clutter in the staff
  member's.
- **A prototype's demo controls (Replay, Sound, a scripted timer) belong to the DEMO's job, not the
  screen's.** They are legal in a prototype and they must not survive into the shipped surface. Say
  which is which in the file header.

---

## 3. What colour means

Not which hex codes are legal. `LOCKFILE.md` §1 owns that. This is what a colour SAYS, which nothing
in this system has ever written down, and its absence is why a red "New" badge and a black Accept
button could both be legal on the same screen while contradicting each other.

### The meaning table

| Hue | The claim it makes | It is disqualified when |
|---|---|---|
| **Green** | A good outcome happened, or this resource is free. | Nothing good happened yet. Green on a pending thing is a lie. |
| **Red** | Something is wrong, or it costs the shop money. | It is merely important. Important is not wrong. |
| **Amber** | A decision is due soon and nobody has made it. | The deadline is not real. |
| **Yellow** | A rating. That is its only job. | Anything else. |
| **Pink, the heart** | The user saved this. | It is not the user's own act. |
| **Blue** | A hyperlink, or a neutral system state. | It is a button. Blue never fills a primary action (`LOCKFILE.md:16`). |
| **Ink black** | Words. Prices. The one primary action. | Never. This is the default. |
| **White, or the cool grey `#F4F4F5`** | A surface. | Grey is never the page canvas on an operator screen. |

### Three rules that follow from the table

**An AGE is not a state.** "New", "Recent", "Just added" get no colour, because they stop being true
by themselves, with no event and nobody's decision. A colour that expires on a timer is not carrying
meaning, it is decorating.

**One claim per screen wins.** If Free is green and Confirmed is green and the button that does the
confirming is black, the screen is saying three things at once and the reader ranks none of them.
Decide which single element the eye should land on and let the rest recede.

**Colour is a budget, not a choice.** Before you add a hue, ask what fraction of the screen is
already coloured. The reference number, measured: on Airbnb's photo-less operator screens, colour is
between 0.0% and 0.5% of the screen, and on the one screen that has a commit button, that button
holds 79 to 80% of all the colour on the page. Two of five such screens measured exactly zero.
Evidence: `research/AIRBNB_TEARDOWN_2026-08-16.md` section 4.

### The Airbnb colour question, presented as the open decision it is

**Both positions, both dates, and it is not decided here.**

- **Ours, LOCKED 2026-06-10, `CLAUDE.md:35`:** roughly 80% neutral surfaces, roughly 17% ink, blue
  only on small clickable bits, and the one commit CTA stays ink. That same rule already carries its
  own correction dated 2026-07-28 saying, in his file, that Apple and Airbnb do not support it and
  that it is *"a defensible MINORITY position"*.
- **His, 2026-08-12, `CLAUDE.md:158`:** *"airbnb te is source of truth"*, on both axes. Confirmed on
  2026-08-16 to include colour explicitly.

**What the measurement actually says, and it is not what the collision implies.** Adopting Airbnb on
colour means LESS colour, not more. On every axis except the last guest payment button, Airbnb is
more achromatic than we are today. Their links are black and underlined, their stars are black
(measured saturation 0.00), their prices are black, their toggles are black, every selected state is
black, and their operator screens carry zero coloured buttons. Our budget and theirs are about the
same size. We scatter ours; they concentrate all of it into one object.

**So the real open question is narrow: the ONE guest payment commit.** Everything else either already
agrees with us or is a cleanup that can be argued on its own merits.

**One hard blocker on that narrow question, and it is statutory, not taste.** Their commit button is
a pink gradient carrying white text. The hex has not been sampled from the live button, only off
compressed reference renders, so the contrast is unknown. It plausibly sits between 3:1 and 4.5:1,
which clears the large-text floor and fails the normal-text one. Our ink button measures roughly 19
to 21:1. WCAG AA is tier 2 and cannot be outranked by a taste source, so **no brand commit colour
ships until the hex is sampled live and the ratio is computed at our real label size.** If it lands
under 4.5:1 the answer is a darker Solen colour, not theirs.

Until he decides: **build ink.** That is what `LOCKFILE.md:16` says, it is what Airbnb does on every
operator screen and every non-final guest button, and it is the only answer that nothing currently
contradicts.

---

## 4. When a container is earned

**Whitespace first. A box is the exception and it has to earn its place.**

This is THE CONTAINER TEST, his decision of 2026-07-28, `LOCKFILE.md:561-584`, quoted rather than
rewritten. A container is earned only when it does something whitespace cannot. Exactly three cases:

1. **It sits on a non-white surface** (a photo, a tint, the sunken grey), so whitespace has no edge
   to read against.
2. **It is one of several peer items competing in one scroll**, and the reader must see where one
   entity ends and the next begins.
3. **The whole box is tappable as one unit.**

If none of the three apply: whitespace and an inset hairline. No border, no card. His own named
no-container list: a settings or preferences list, a single-column form section, a menu of
destinations, an account hub.

**Never both.** A container plus a hairline between every row is two devices claiming one boundary.
Inside a container, rows may be hairline-divided. Outside one, they may not.

### The box budget, which is the half the test never had
The test asks whether ONE group gets a box. It never asks how much of a SCREEN may be boxed, so a
screen can pass it group by group and still be box soup.

- **Aim for ONE box per screen**, and it goes to the thing the screen exists to make you act on.
- Every additional box passes a case on its own and says which one, in a `boxed-ok:` note on the
  line. That marker already exists and `entity-card-gate.py` already reads it.
- The measured shape he approved on 2026-08-16: **one card at 25.2% of the viewport against a 35%
  ceiling** (`TASTE_LOG.md:910-915`).

### The collision to know about before you box a list
Two dated decisions of his point opposite ways and neither names the other:
- THE CONTAINER TEST, 2026-07-28, above.
- The grouped list-card lock, 2026-06-11, `LOCKFILE.md:633-647`: any LIST of same-kind rows renders
  as ONE grouped card per group.

The shipped code follows the older one, and he has rejected the output of it twice by name. **Until
he settles it: the later decision governs, so run the three-case test first, and box a list only when
it passes a case.** If you box one anyway, say which case in the `boxed-ok:` note.

### A divider is earned too, and by ROW COMPLEXITY
We legislate the divider's colour (`CLAUDE.md:138`) and its 24px inset (`LOCKFILE.md:585`) and never
when one appears. The measured reference ladder, three rungs:

- **No divider** when rows are single-line nav items. Spacing alone groups them.
- **One divider**, at a section boundary only, when the rows are simple but the screen has two groups.
- **A divider between every row**, once each row carries a label plus a value plus a right-side
  action.

Source: `research/AIRBNB_TEARDOWN_2026-08-16.md` section 2.

---

## 5. The rhythm

**One ladder. Say it once, use it everywhere, and do not invent a fourth number.**

| Between | Value |
|---|---|
| Page sections | **32** |
| A section heading and its own content | **16** |
| Sibling cards or list items | **12** |
| Groups inside a card | **16** |

The first, third and fourth rows are DS-5, `LOCKFILE.md:612-631`, owner-approved. **The second row is
the one the ladder never had**, which is why the gap under a heading is hand-picked on every screen
and keeps landing on the exact `mt-5` values DS-5 itself calls drift. Use 16 until a dated round says
otherwise, and say in the mockup that you did.

**Drift signal, unchanged: any `mt-5 / mt-6 / mt-7 / space-y-5` between sections or cards.**

**Two named exceptions, both already law, do not "fix" them:** the home feed keeps its owner-tuned
tighter rhythm at roughly 24px (`LOCKFILE.md:626-631`), and mobile gets MORE air than desktop, never
less.

**The proof this is achievable:** the terminal state he approved measured section gaps of exactly
`[32, 32, 32, 32]` (`TASTE_LOG.md:910-915`). Four sections, one number, no exceptions.

**Why it matters beyond tidiness:** FLOORS LAW 5 (`CLAUDE.md:100`) says a deletion is legal only if
the surviving cue passes a measured floor, "between-group gap at least 2x the in-group gap". With no
defined in-group gap that test cannot be run at all. 32 against 16 makes it exactly 2x.

---

## 6. The type ladder

**Four sizes on a screen, and they must be FAR APART.**

Two rules, and the second is the one that gets forgotten.

1. **At most 4 distinct sizes and at most 2 weights on one screen** (`CLAUDE.md:53`,
   `LOCKFILE.md:378`).
2. **Variety is not range.** Four sizes all sitting within about 6px of each other costs you
   consistency and buys you no hierarchy at all. That is the worst case, worse than breaking the
   ceiling. Count the sizes AND measure the spread (`CLAUDE.md:115`, FLOORS LAW 7c).

### What "far apart" means, with real distance
The approved terminal ladder, measured, `TASTE_LOG.md:910-915`:

> **`{13, 15, 18, 28}`, with 14 deleted on purpose, and the anchor at 2.15x the body.**

Read that as the SHAPE, not as four magic numbers:

- **An anchor.** The biggest thing, by a long way. At least 1.8x the body (`CLAUDE.md:114`), and at
  least 28px on a customer screen (`CLAUDE.md:101`).
- **A workhorse.** The size most of the screen is set in.
- **One small.** Meta, timestamps, axis labels.
- **One more, only if it earns it.** Nothing that appears once. A size used once is not a level, it
  is a mistake with a number on it.

### The anchor is a SENTENCE, not a label
On a data screen the biggest type on the page should BE the data:

> "Sie haben heute 7 Termine", not "Termine" with a small 7 somewhere below it.

This is the single biggest reason a photo-less screen reads finished instead of like a wireframe. The
small label names the route at the top; the big sentence carries the state and takes two to three
times the size. Measured across the reference:
`research/AIRBNB_TEARDOWN_2026-08-16.md` section 3.

**Test it in German and French before you lock the size.** Our own i18n numbers put both 15 to 35%
longer than English (`_rules/I18N_ROUTING.md` Rule 35, cited at `CLAUDE.md:130`). A three-line English
hero becomes a five-line German one.

### Known problem, so a gate does not surprise you
Our core ramp (`LOCKFILE.md:361-376`) tops out at 22px, so a 28px anchor is off-ramp and the
drift-checker flags it. That is a gap in the ramp, not a mistake in the anchor. Until the ramp gains
a named anchor role, put the anchor in and note in the mockup that it is the FLOORS LAW 6 display
anchor.

---

## 7. When the class string already exists in the repo

**Finding the string is not permission to use it. The file you copied it from is never a reason. The
rule line is the only reason.** (His words, `TASTE_LOG.md:897-902`.)

Write one line beside the paste, in your own words, naming the rule and the condition it sets.

Legal:
> `// LOCKFILE 561: container earned, case 2, these are peer entities in one scroll`

Not legal:
> `// DashboardLayout.tsx has it`

That example is real. The warm bar that got rejected came from an admin preview banner in
`components-legacy/dashboard/DashboardLayout.tsx`, an internal tool nobody outside the company ever
sees. It was copied because nothing said not to. **Files under `components-legacy/` and anything
marked internal-tool are not design references. Do not copy from them.**

Two corollaries:

- **If the registry owns the component, compose it, do not redraw it** (FLOORS LAW 9,
  `CLAUDE.md:105`). A hand-drawn copy inherits none of the system's decisions and then drifts alone.
- **A thing that appears on two screens is ONE component with a documented variant, never two
  implementations** (FLOORS LAW 8, `CLAUDE.md:103`). A variant may change density, which optional
  fields render, and which actions are offered. A variant may never change the entity name's type
  role, the avatar size, the badge grammar, or the radius.

---

## 8. What we are adopting from Airbnb

He made Airbnb the source of truth on 2026-08-12, on both axes. These are the parts of the measured
teardown that are safe to adopt now, because each either agrees with an existing rule of ours or
fills a hole we have. Full evidence and every mobbin link:
`research/AIRBNB_TEARDOWN_2026-08-16.md`.

1. **A photo-less screen is WHITE, and it does not need a grey canvas to look finished.** Their host
   Earnings and Insights screens are white, cardless, colourless and photographless, and they read
   finished because the anchor is a sentence carrying the live number at roughly 2.2x body. Measured:
   92.4% of pixels on host Insights fall in the near-white band, and four capture passes found zero
   grey page canvases anywhere in their operator estate.
2. **Bare rows on white are the default, and a card is rationed.** Zero cards on a hub, one card when
   something is wrong, five to eight only on an editor. Border or shadow, never both.
3. **The divider ladder** in section 4 above.
4. **The alert anatomy, and this is the direct fix for the beige bar.** A white card, one hairline,
   ONE small solid coloured disc of roughly 20 to 32px, a black title, a grey body. That gives a
   photo-less screen its semantic-colour moment at about 0.2% of the screen instead of a full-bleed
   tint.
5. **An alert never gets the primary button.** Its own actions are a white hairline button and an
   underlined text link, so the alert claims attention with its icon and hands weight back to the
   screen. This is what lets an operator screen carry an urgent problem without becoming an alarm.
6. **Black is the default button fill, and colour is spent once.** Every step-forward, selection,
   dismissal and operator action is black. Their brand colour appears only on the single irreversible
   guest commit, and one flow contains both fills, split exactly at the point of no return. On
   operator screens this AGREES with `LOCKFILE.md:16`.
7. **The label-plus-sentence title split.** The small label names the route, the big sentence carries
   the state.
8. **The zero state instead of an empty state.** Render the populated layout with zeros rather than
   replacing the screen with an illustration. Better for an operator screen than what our states row
   currently allows, and worth proposing as a mockup.
9. **Trust copy sits in the DOM directly under the commit.** We already require this
   (`CLAUDE.md:117`). Airbnb confirms it on every checkout screen.

---

## 9. What we deliberately do differently

Every line here is a place where Airbnb and a dated decision of his disagree. **None of these is
resolved by this file.** The dated decision stands until he changes it by name. Where the
disagreement is real, both dates are written out so he can decide with the whole thing in front of
him.

### 9.1 Immutable, never touched by any research
- **WCAG 2.2 AA** on every published customer surface. Tier 2 statutory, `CLAUDE.md:346`.
- **Swiss nFADP and, for EU users, GDPR**, including special-category handling of allergy and
  treatment notes.
- **The Swiss total-price rule (PBV).**
- **No dark mode on web.** `CLAUDE.md:52` and `:146`. Rejected twice, gate wired.
- **No fabricated data.** `CLAUDE.md:31`. Seeding the database is the fix, not the violation.
- **Any dated decision in `TASTE_LOG.md`.**

If Airbnb collides with one of those, the collision is surfaced, never applied.

### 9.2 The live collisions, with both dates

**Text links.** Ours: blue `#276EF1`, LOCKED 2026-06-10, `CLAUDE.md:35`, plus the §1.5 v3 council
rule of 2026-06-11. Airbnb: black with an underline, on every link, in four capture passes, with no
blue link found anywhere. **Extra weight that has nothing to do with Airbnb:** accessibility-05
measured our blue at 4.17:1 on the sunken grey, which fails AA for body text, and our own
edge-visibility floor promotes that grey as a default list surface. **Open.**

**Selected state.** Ours: calm grey fill, "NEVER black/ink fill", owner 2026-06-29, `CLAUDE.md:125`,
with the wired `no-black-selected` gate behind it. Airbnb: black on every control type, without
exception. **This is his call with a gate behind it, so it is not a merge candidate. It stays grey.**

**Booking date and time-slot selection.** Ours: the one named blue exception inside that same grey
rule. Airbnb: black. This IS worth raising, on our own terms rather than theirs: it is the only place
a booking screen carries two colour claims at once, so the selected slot competes with the Buchen
button it is meant to lead the eye toward. **Open, and it needs his word, because it is a named
exception inside a dated decision.**

**The star.** Ours: `#FFC32B`, and taste rule 4 says never monochrome a semantic element to ink to
stay on brand. Airbnb: measured saturation 0.00, the star is black. **Recommend keeping ours**, and
the reason is structural rather than sentimental: Airbnb lists unique inventory, so no two listings
are substitutes and it never needs a comparison signal on a card. We list interchangeable salons on
the same street, where rating and price ARE the comparison, and a yellow star is preattentive in a
scanning grid where a black one is not. Keeping it is a named Solen exception, on the record.

**The discount pill.** Ours: a pale-green minus-X% pill in the SalonCard right slot. Airbnb: old
price struck grey, new price black, no pill and no colour. **Same argument as the star. Recommend
keeping ours**, named as an exception.

**Status pips.** Ours: taste rule 2 and `LOCKFILE.md:26` ban coloured status dots BY NAME, after a
repeated flag from him. Airbnb ships exactly that: a 6px amber or green dot inside a WHITE pill with
BLACK text. **This one goes the other way, so adopting Airbnb here means overriding a rule we wrote.
Open, and it needs his word.**

**The dashboard primary button.** We ship three answers for one control: `LOCKFILE.md:16` says ink,
`LOCKFILE.md:1541` says blue for the dashboard, and V3-D426 says outcome-coloured on status screens.
His own Round D1 on 2026-07-15 approved ink and the conflict has sat open for a month. Airbnb settles
it on the evidence, with zero coloured buttons on any operator screen. **Build ink. The supersede
still needs his name on it.**

**The guest payment commit colour.** Ours: ink, LOCKED 2026-06-10. Airbnb: a pink gradient, on that
one button only. Blocked behind the WCAG measurement described in section 3. **Open.**

**Warm cream.** Taste rule 3 bans it by name. FLOORS LAW 4 demands warm pixels or calls the screen a
dead-grey fail. And `LOCKFILE.md` §1 RETIRED records that the whole warm token family was DELETED
from the config on 2026-07-27, so the mandate has no vocabulary left and a builder reaching for
warmth finds only the warning tint. **Airbnb is not evidence for the rejected cream bar either:**
their warm cream is a whole terminal-moment page or a modal sheet ground, never a strip on a working
screen. Until this is repaired: no warm cream, and the warmth half of floor 4 does not apply to an
operator screen.

**Decorative photography.** Airbnb warms up one operator page with a hardcoded photographic band. We
do not, and this one is not close: a static image with no data behind it was rejected three times and
is blocked by a wired gate. Take their white-and-hairline Earnings answer, not their photo band.

**The greyed zero.** Airbnb renders `$0.00` in grey inside an otherwise black headline. Elegant, and
illegal for us: FLOORS LAW 6 bans tertiary grey as text on WCAG grounds and the number is
load-bearing data.

**Uppercase group labels.** Airbnb uses small grey caps for group headings. We ban uppercase outright
and `copy-lint-gate.py` blocks it. **We stay stricter.**

**Whitespace-only row lists.** Airbnb drops dividers entirely on sparse nav rows. Our reservation rows
carry time, client, service, staff, duration, price and status on one line with no image anchoring
the left edge, so the gap alone does not survive. Airbnb agrees with us here: the moment their own
rows get dense they switch to hairlines.

### 9.3 Two stale rules to know about while they are still on disk
- `LOCKFILE.md:1859` still says "Du-form everywhere". That was superseded by the formal-register
  decision of 2026-07-29 (COPY_LAW §1, `Sie` / `vous` / `Lei`). **Write formal.**
- `LOCKFILE.md:886` still specs a `MetaDot` primitive whose whole job is to render the `·` glyph that
  `LOCKFILE.md:14` bans as a hard rule. **Do not add one.**

---

## The five lines, if you remember nothing else

His own version, `TASTE_LOG.md:884-896`, quoted:

1. **Say what this screen is.** One line, with a person in it.
2. **Say whose law applies.** Customer screen or operator screen. This is the step that was skipped
   six times.
3. **Say the one job, in one sentence.** Every element is justified against it or it is cut.
4. **Say the one biggest thing, before any markup**, and give it the anchor. Everything else recedes.
5. **Write the three targets:** how many boxes (aim: one), the gap ladder (32 and 16, nothing else),
   the type ladder (an anchor, a workhorse, one small, and nothing used once in between).

And the honest limit he recorded with it: this prevents four of the six rejections. It does not
prevent "the mockup isn't working at all" or "make an actual prototype". Those need you to OPEN AND
USE the running page, not measure it. Measuring is this estate's reflex, and a script collecting six
numbers ran every round while nobody clicked anything.

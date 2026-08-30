# DESIGN-LAW IMPROVEMENT PASS , 2026-08-17

Weekly run (owner-mandated 2026-07-21: "keep improving taste and design file as we go even outside this
session"). Corpus: CLAUDE.md pinned design blocks, LOCKFILE, SOURCE, TASTE_LOG, RATIONALE,
REJECTED_TREATMENTS.json, `public/_mockups/_BASE.md`, `research/PRINCIPLES_50.md`, MOTION.md,
COMPONENT_REGISTRY.md, COPY_LAW.md.

Window: 2026-08-09 to 2026-08-17.
Counts: **harvested 97 · contradictions 15 new + 9 carried · duplications 11 · safe fixes 8 · owner
decisions needed 12.**

---

## THE HEADLINE: the law files were nine days behind him, and the worst gap was in the file that calls
## itself the most important rule

On **2026-08-12** he said **"airbnb te is source of truth"**, answering a question that quoted the rule
being replaced and named the precedent against it. CLAUDE.md recorded that decision the same day.

Five days later, `LOCKFILE.md` §10.0 , titled **"THE MOST IMPORTANT RULE , read first"** , still said
STRUCTURE comes from Fresha and AESTHETIC from Uber. A grep of the whole file for any mention of the
supersession returned **zero hits**. The LOCKFILE sits **above** CLAUDE.md in the precedence chain, and
its own header tells the reader that a captured Fresha spec loses to the values in it. Anyone reading it
top-down and following the chain literally would still be capturing Fresha today.

CLAUDE.md was also contradicting itself **44 lines apart**: its binary-trigger table still said
`STRUCTURE=Fresha / AESTHETIC=Uber-LOCKFILE`.

Both are fixed (S5). The same shape appeared twice more this pass and is fixed twice more: his
**2026-08-09 input decision** (white fill, hairline, nothing visible on tap) was carried by LOCKFILE and
TASTE_LOG while CLAUDE.md, the file in context every single turn, still printed the superseded
2026-07-17 grey-fill version (S3); and the **green availability pill** he rejected was struck in one line
of TASTE_LOG and left standing twelve lines below, where the same round had promoted it to a universal
colour convention (S6).

**The pattern, stated once:** this estate is good at recording a reversal and bad at propagating it. Every
one of these had the supersession written down, dated, and in some cases owner-quoted. It just never
reached the other files. That is what this turn's harden targets.

---

## 0. HARVEST , 97 dated decisions, and the log had recorded six of them

**The branch problem shrank but did not go away.** `agent-flow-design-overhaul-2af2c2` merged this week,
carrying 383 commits onto `main`. Three branches are still ahead of it with design decisions on them:

| branch | commits ahead of main | tip | decisions harvested |
|---|---|---|---|
| `claude/pdp-styling-updates-b2582b` | 56 | 2026-08-16 | 24 |
| `claude/offline-booking-device-266b10` | 36 | 2026-08-17 | 9 |
| `claude/airbnb-animated-icons-ee4329` | 24 | 2026-08-15 | 4 |
| `main` | , | 2026-08-16 | 60 (54 unrecorded) |

**Fourteen branch decisions and fourteen `main` decisions carry his verbatim words.** The rest are
recorded as **approved-but-unquoted** rather than dressed up as his words. All 97 are now in
`_design-system/TASTE_LOG.md` in two blocks, and the two blocks carry **opposite caveats on purpose**:
the `main` block says *these are live*, the branch block says *this is what he decided, not what the site
does*.

Full tables with quotes and shas: `TASTE_LOG.md`, blocks "2026-08-09 to 2026-08-16 , the home /
search-panel / chrome weeks" and "2026-08-14 to 2026-08-16 , the PDP / terminal / iOS week".

**Three reversals inside the window**, worth naming because a reader of the branch alone would build the
wrong thing:

1. He picked soft-black selected pills on 08-15, overruling the locked calm-grey row and `REMOVED.md:41`
   by name, then on 08-16 called the black too harsh and sent it back to calm grey , the same objection
   he made in June. **`main` was right all along.**
2. Counts came off the star filter pills, reversing half of the 2026-07-24 F2 pick. Chips-over-bars
   survives.
3. Review row stars measured to 13 on 08-15 off his own Fresha capture, then raised to 18 on 08-16 as his
   taste deliberately going past both references.

---

## (a) SAFE FIXES APPLIED , 8 commits

Each applies a supersession that **already existed in writing**, dated, and in five cases owner-quoted.
No locked value changed, no ceiling or floor loosened, nothing deleted , superseded text is struck
through and kept so the reversal stays legible.

| # | Commit | What was wrong | What landed |
|---|---|---|---|
| S1 | `73072dd58` | TASTE_LOG stopped at 2026-08-14 while 37 dated decisions sat in commit bodies on three unmerged branches. | All 37 recorded, each labelled quoted or approved-but-unquoted, under a not-on-main caveat. **extends** the 08-03/08-10 account-hub block. |
| S2 | `791ea3028` | The bigger half: **54 decisions on `main`** , the home rebuild, the still-open category-icon question, the whole search panel, the calendar, all the chrome , with no law record at all. | All recorded under the opposite caveat: these ARE live. Two collisions named inside the block rather than smoothed over. |
| S3 | `3160e9bcf` | **CLAUDE.md was printing an input rule he killed on 2026-08-09.** TASTE_LOG carries his words and the literal line "Supersedes: the 2026-07-17 input-fill decision"; LOCKFILE carried the change; CLAUDE.md, the file in context every turn, still said grey fill + ink focus edge. | Row corrected to white fill + `#E4E4E7` resting line + nothing visible on tap. The accessibility cost he accepted is kept on the row, with the one treatment that would satisfy both. |
| S4 | `4f2053e8a` | The radius row told builders to use **`shadow-elevation`**, which is not a Tailwind class here. Verified against `tailwind.config.js`, whose keys are card, card-hover, surface, surface-hover, warm-*, pressed, whisper, elevation-1/2/3, float, v5-*. Tailwind drops an unresolvable class **silently**, so every card built off that row shipped flat. | Corrected to `shadow-elevation-1`, the value LOCKFILE:558 already gives that same card. LOCKFILE:2090 had already named the phantom by name. |
| S5 | `3b25c5fee` | **The headline.** LOCKFILE §10.0 and a CLAUDE.md binary-trigger row still ran on Fresha-for-structure / Uber-for-aesthetic, five days after he replaced it. | §10.0 opens with a supersession banner carrying his words, the date, and where it is recorded; old text kept verbatim underneath because the axis discipline it teaches outlives the change of reference. Trigger row corrected. What did NOT move is listed by name: statutory tier, FLOORS LAW, no dark mode, no fabricated data, mockup-first. |
| S6 | `00cc1aede` | TASTE_LOG Round 1 struck the green availability pill in its table row and **left the same rule standing twelve lines below**, where it had been promoted to a universal colour convention for any open/free/available signal. | Both the bullet and its applied-in-code tick struck, pointing at the supersession already in the same file. |
| S7 | `d3a6186b2` | **A WCAG failure being handed out by §1 of the LOCKFILE.** One `s-chart-2` row granted the grey a TERTIARY TEXT role (chevrons, placeholders, timestamps, hints). accessibility-05, dated 2026-07-27, computed `#9CA3AF` at 2.54:1 on white and 2.31:1 on sunken , below 1.4.3 even at the large-text 3:1 floor. §17.4 and CLAUDE.md already said chart-only; §1 was the last holdout, and §1 is what a builder reads first. | Text role struck with the arithmetic and the authorised replacement (`s-ink-2`, 5.33:1 / 4.85:1, both AA) on the row. Duplicate dead `s-chart-1` row struck too. |
| S8 | `36afe9a00` | **Three registry rows marked `locked` point at deleted files**: SalonServicesSheet (killed 07-19), Step and MarketplaceVisual (deleted with `/business` on his 08-14 decision). The floor that says screens are composed not drawn sends every builder to this registry. | All three struck, each citing its graveyard line and commit; status now reads DELETED. Verified by `ls`, not assumed. |

**Also fixed in S6's commit, worth one line:** two SOURCE.md blue rows (`7d5ffdc93`) never got the
retirement marker the two rows above them carry, so the semantic-colour table and the token table , the
two places a builder actually looks a colour up , still listed ghost and secondary buttons, see-all, tabs
and icon tints as blue.

---

## (b) OWNER DECISIONS NEEDED , 12

Contradictions with **no written supersession**. Nothing below was touched.

### New this week

**D11. `rounded-input` is 16px in the code and 12px in five law files, and it now ships on a control you
locked.**
`tailwind.config.js:255` = `16px`; `globals.css:44` `--radius-input: 16px`. Against it: `LOCKFILE:553`
("Owner kept shipped 12 over 16, 2026-06-08"), `LOCKFILE:724`, `SOURCE:448`, `CLAUDE.md` radius row,
`PRINCIPLES_50:17`. A sixth voice sits on the 16 side: `TASTE_LOG:842`. **What changed since 08-10:** your
2026-08-10 nav lock specifies the menu button as `rounded-input`, so the token's disputed value now ships
on a nav control, not just form fields. Real inputs only get 12 because a base CSS rule overrides the
token. **Is the token 12 or 16?**

**D12. Which two weights?** Every file agrees the ceiling is two weights per screen. They do not agree
which two. `PRINCIPLES_50:26` says **400/600**. `LOCKFILE:316` says CTA, chip, tile label, nav and
interactive are **500**, and `:319` says NEVER below 500 for nav, labels, prices, buttons. A screen with
body 400, a heading 600 and one CTA 500 is three weights, and the armed type-budget gate blocks it. **On
top of that, your own 08-11 home instruction shipped three weights (400/500/600) on the first viewport.**
Either the ceiling names three, or the 500 rule needs a dated retirement.

**D13. The calendar's selected day: ink or blue?** The design contract keeps blue as the calendar
date/slot fill , it is one of only four named exceptions to the never-black-selected rule. The shipped
calendar has been **ink with white numerals since 2026-08-12**. That change carries no verbatim from you,
so I will not apply the newest-owner-decision rule to it. **One word: ink or blue?**

**D14. Which viewport is a floor measured at?** `CLAUDE.md` and `LOCKFILE` both say the imagery and
emphasis floors are measured on the rendered first viewport at **390x844**. `_BASE.md` says a mockup is
built at **402x874**, and LOCKFILE's own re-measurement was taken at 402. Imagery share and weight share
are both viewport-dependent ratios, so a mockup is built on one screen and graded on another. Nothing
connects them.

**D15. The close control: a circled X, or a pill reading "Close"?** Your 2026-08-10 top-bar decision is
frozen at `LOCKFILE:2085` as a **68x44 pill with the word "Close", never a bare X**. `TASTE_LOG:632`
records the same decision as a **circle**. `CLAUDE.md:202` says a **38px circled X with a border**, and
`MOTION.md:111` says an X at size 20 in a 44px hit area. Two law files disagree about one decision made
on one day, which is why nothing was struck here.

**D16. Availability on a card: ink text, or gone entirely?** `CLAUDE.md` says plain ink text, no green
pill. `REJECTED_TREATMENTS.json` (`card-next-slot-row`, 2026-07-15) says the availability badge and the
next-slot text are **fully deleted from the card**. The shipped `SalonResultCard` still renders a
next-slot element. The green pill is dead either way (S6); the question is whether ink text lives.

### Escalated

**D5 (branch reconciliation). 17 branches, roughly 1,295 commits, still not on `main`.** This is the
fourth pass to flag it, and the first where it improved: the 239-commit design branch merged. Three
branches carrying 37 of your decisions did not. Workstream 67 is PAUSED with two of your questions still
open. **Merge, or tell me which to abandon.**

### Carried unchanged

- **D1. Card press-scale `.985` or `.97`?** *New measurement this pass:* **120 files** now use `.97` (was
  71), and all **six** `.985` sites are on buttons, not cards. `LOCKFILE:720` is the only place asserting
  `.985` as law and **no card in the estate uses it**. MOTION.md did the measuring and stopped at "needs
  an owner call".
- **D2. Card meta 12px or 13px?** `CLAUDE.md` says 12; `LOCKFILE:366` says "12→13" and `:376` says 13.
  *New consumer:* your 2026-08-09 decision pins the section eyebrow to "card-meta size", so this open axis
  now sets a second value.
- **D3. Is blue allowed on small BUTTONS, or only hyperlink-reading text?** `CLAUDE.md` says small
  buttons and chips are legal (locked 2026-06-10). `LOCKFILE §1.5 v3` says hyperlink-reading text only and
  is dated **one day later**. CLAUDE.md is the file always in context and does not acknowledge it.
- **D7. What size is an eyebrow?** *Half-resolved:* your 2026-08-09 answer keeps it, at card-meta size,
  overruling LOCKFILE's "drop it entirely". The size is still five values across four files (11 / 11-12 /
  12 / 13 / "card-meta"), and three UPPERCASE assertions survive inside the file that also bans uppercase.
- **D8. SalonCard shadow: `whisper` or `elevation-2`?** All four re-verified. Zero customer salon cards
  use `whisper`; the code matches your 2026-06-07 quote, and two law files say otherwise. *(Correction to
  the 08-10 report: the SOURCE citation was wrong , the real line is `SOURCE:656`, not `:519`, which is a
  shimmer keyframe.)*
- **D9. Which green is the open-status green?** Unchanged: `tailwind.config.js:171` ships `#22C55E`
  directly beneath its own comment saying `#1F8900` with your 2026-06-12 quote attached. **New evidence
  for you:** the branch work independently re-derived `#1F8900` on contrast grounds (2.32:1 to 4.53:1).
- **D10. "Border OR shadow, never both" , ANSWERED, and the universal form is false.** It binds *a card
  carrying elevation*. It does not bind icon controls (your 08-10 nav lock permits hairline + shadow on
  white by name) and it does not bind all cards (the grouped list-card grammar is **gate-enforced** with
  both). `PRINCIPLES_50:19` overstates its own citation and should get the word "card" back.

---

## (c) DUPLICATION , 11 found, 4 fixed

Ranked by the danger test: would two builders reading two copies build different things?

1. **The card anatomy is stated in five places and no two agree** , shadow, name size and weight, meta
   size, photo radius, availability, review count. **Two builders already do build different cards; that is
   measured and recorded in CLAUDE.md.** Canonical home should be LOCKFILE §17.4, extended into one CARD
   ANATOMY table. NOT fixed: it cannot be canonicalised while the files disagree on the values (D8, D2).
2. **Accent-blue scope, six statements, three generations of wording** , **half fixed** (`7d5ffdc93`
   marked the two unmarked SOURCE rows). The CLAUDE.md-vs-LOCKFILE half is D3.
3. **Eyebrow: five sizes, two cases, four files** , NOT fixed, that is D7. The system already flagged it
   as unfinished in TASTE_LOG.
4. **Focus and selected treatment: LOCKFILE's state matrix vs the pinned blocks vs two armed gates.** A
   builder following the matrix writes code the gates refuse (`ring-2 s-accent` focus, `ring-2 s-ink`
   card-selected). A banner already fixed the List row and stopped one row short. Half-fixed by S3;
   striking the matrix columns needs the D3 answer.
5. **Input treatment** , FIXED as S3. Canonical: TASTE_LOG 2026-08-09.
6. **Radius scale restated in five files, one of them wrong** (`TASTE_LOG:842` says input 16 and omits
   the 24px grouped list-card). Canonical should be `tailwind.config.js` as the executable truth. NOT
   fixed: it would silently resolve D11.
7. **Close/back/menu anatomy in three files** , NOT fixed, that is D15.
8. **FLOORS LAW stated twice, near-verbatim**, with the density floor present in CLAUDE.md and **absent
   from LOCKFILE §17 entirely**, plus the viewport drift (D14) and an anchor-ratio derivation citing a
   16px body the type ramp does not have (the ramp says 14).
9. **Press ladder in two places with different verdicts** , D1.
10. **"Border OR shadow" at two scopes** , D10, answered above.
11. **Type-budget weights naming different weights** , D12.

---

## STALENESS , 7 dangerous, 3 fixed this turn

Verified with `ls`/`grep`/`node`, not assumed. 427 path tokens and 210 wired hooks were resolved; **every
wired hook entry in all four settings files points at a real file**, and `npm run exists`, `removed`,
`check:floors`, `check:press` all run.

**Fixed:** the Fresha/Uber rule (S5), the phantom `shadow-elevation` class (S4), three dead registry rows
(S8).

**Still standing, dangerous, and needing more than a pointer fix:**

- **`s-ink-3` is named in 24 law sites and was deleted from the config.** `--heart-active` is named in six
  and was never defined anywhere.
- **`s-coral` is documented as `#3B7A57` green and is actually `#0A0A0A` ink, with 238 live usages.**
  `s-accent` is listed in a table headed "Retired" with the old yellow `#FFC32B`, while it is the live
  blue.
- **`StatusPill` was removed 2026-06-30 and is still prescribed** by three LOCKFILE rows and three SOURCE
  recipe rows with class strings, while a fourth LOCKFILE row correctly says "do not rebuild".
  **`EntdeckenCard` was removed 2026-08-16** and still appears in eleven SOURCE rows including the live
  card-invariants and type tables.
- **RATIONALE.md's entire `LOCKFILE:NNN` provenance ledger is dead.** 20 of 20 sampled pointers land on
  unrelated text; drift ranges 57 to 216 lines, so no constant rebase fixes it. Anyone checking *why* a
  frozen value exists gets sent to the wrong section.
- **CLAUDE.md misroutes two normative rules to the operator-dashboard section** (§12 is "Operator
  dashboard skin (VIBRANT)"; the type budget actually lives at §2.5 and input radius at §3).

These were left alone because each needs either a value decision (the token ones are D-items) or a
mechanical re-derivation pass big enough to be its own task, not a line edit inside a law file.

---

## (d) PROPOSED UPGRADES , 5, in the PRINCIPLES_50 format. PROPOSED, not law. Added to no file.

**P6. A reversal is not applied until every file that stated the old rule says so.** Recording a
supersession where the decision was made is the easy half; the expensive half is the four other places
that still print the dead version, and the most dangerous of those is whichever file is highest in the
precedence chain.
*Solen application:* the Airbnb decision lived correctly in CLAUDE.md and TASTE_LOG for five days while
the LOCKFILE, which outranks both, still said Fresha. Source: S5, S3, S6 , three instances in one week.

**P7. Deletion is the direction documentation rots, because nothing fires on it.** Every gate in this
estate triggers on writing something. The registry-sync gate fires when a component is created; nothing
fires when one is deleted, so a `locked` row can outlive its file indefinitely.
*Solen application:* three registry rows, `StatusPill`, `EntdeckenCard`. Source: S8.

**P8. A class name that does not resolve fails silently and looks correct.** A wrong hex is visible; a
wrong token name is invisible, because the CSS framework drops it without a word.
*Solen application:* `shadow-elevation` shipped flat cards for months out of the row builders copy from.
The general form: any law that names a token must be checkable against the config, and the ones that are
not are the ones that rot. Source: S4.

**P9. A screen is named operator or customer before it is built, and the customer floors do not bind an
operator screen.** Restraint floors written for a photo-led customer surface demand a sunken tray and a
semantic-colour moment; on a dense operator board those produce exactly the wrong thing.
*Solen application:* six rejections of the merchant terminal before the frame changed rather than the
treatment. Source: B32, and the FLOORS LAW has no scoping sentence today.

**P10. Colour means state, and nothing else.** Not age, not category, not decoration. If a colour is
carrying "this is new" or "this is a heading", it is spending the one signal that should mean "act on
this".
*Solen application:* on the terminal, Accept goes green because green means good, and "New" carries no
colour at all because new is an AGE. This is the positive form of taste rule 4, which only ever said what
you may not take away. Source: B31, B30.

---

## HARDEN , one artifact, landed this turn

**Chosen: FIX THE EXISTING ONE. No new gate.**

The theme of this whole pass is a supersession that is written down and never propagates. There is
already a check that fires on exactly the event where that would be caught , `design-law-integrity-gate`,
a PreToolUse gate on every law-corpus write, built for the owner's rule *"before u add in taste or design
file find duplication or contradiction so it auto flags"*. It looks for duplication and contradiction in
what you are ADDING. It has nothing to say about the four other files still carrying the value you are
superseding.

Widening it is the correct move per LAW_SYSTEM 6.9: a recurring mistake that already has a check is a
binding failure, never a missing-check problem. Nothing is retired, because nothing is added , this is one
existing gate learning one more thing, and it fires on writes that were already being inspected.

**What changed, in one sentence:** the word "supersedes" used to be an unconditional free pass through
this gate, and it now has to NAME WHERE THE OLD RULE LIVES , a law filename, a section (§N), a config
file, or a commit sha , or the write is refused. You cannot say "supersedes the old rule" without an
address, because an address is what makes the propagation checkable by the next reader, and its absence
is how a reversal ends up half-applied.

**Self-tested, 9/9, driven end to end through the installed file with real tool payloads.** The gate had
**no suite at all** before this turn, so it had never been shown to work even once; the suite is now in
the file behind `--selftest`. Cases: a supersession naming a file, one naming only a section, one naming
only a sha, two with no address at all (both refused), a plain `extends` (free), the `law-check-ok`
override, a non-law file, and an addition under the length floor. This pass's own S5 edit was then driven
through the real gate as a tenth case and passes.

**One honest limitation, stated rather than hidden:** `gate-eval.py` cannot evaluate this gate. Its
driver probes with `file_path: app/[locale]/dev/mock/probe/page.tsx` and looks for exit code 2 or
`"decision": "block"`, while this is a PreToolUse gate that only inspects law-corpus paths and answers
with `permissionDecision: deny` at exit 0. So it reports NOT READY for a structural reason, not a
behavioural one. The 9/9 end-to-end run is the evidence; the gate-eval driver would need a
PreToolUse-shaped probe to say anything at all here, and that is a fix to `gate-eval`, not to this gate.

**Nothing was retired, because nothing was added.** One existing gate learned one more thing, on writes it
was already inspecting.

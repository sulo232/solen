# DESIGN-LAW IMPROVEMENT PASS , 2026-08-10

Weekly run (owner-mandated 2026-07-21: "keep improving taste and design file as we go even outside this
session"). Corpus: CLAUDE.md pinned design blocks, LOCKFILE, SOURCE, TASTE_LOG, RATIONALE,
REJECTED_TREATMENTS.json, `public/_mockups/_BASE.md`, `research/PRINCIPLES_50.md`, MOTION.md,
COMPONENT_REGISTRY.md, COPY_LAW.md.

Window: 2026-08-03 to 2026-08-10.
Counts: **harvested 11 · contradictions 3 new + 6 carried · duplications 4 · safe fixes 3 · owner
decisions needed 9.**

---

## THE HEADLINE: the harvest step has been reading the wrong repository for three passes

`main` took **two commits** in this window, both of them checkpoints of previously-untracked files. The
last two passes would have called that a quiet week and moved on.

Five unmerged branches carry **428 commits** since 2026-08-02, holding **eleven dated owner design
decisions**, none of which is in any law file:

| branch | commits since 08-02 | tip |
|---|---|---|
| `claude/agent-flow-design-overhaul-2af2c2` | 239 | 2026-08-10 |
| `claude/security-audit-principles-a877df` | 72 | 2026-08-07 |
| `claude/principles-security-audit-0ae738` | 67 | 2026-08-07 |
| `claude/preference-analysis-gates-620a8d` | 29 | 2026-08-07 |
| `claude/airbnb-animated-icons-ee4329` | 25 | 2026-08-02 |

**Six of the eleven decisions are the same screen, the account hub, corrected six separate times**, and
one of them reads *"why is the notification inside and the hamburger menu inside a fucking profile page?
I told you like ten fucking times."* Another: *"why is heart icon pink n how did u not flag it ever
wtf."* A law pass whose job is to keep the law level with the owner spent two runs unable to see any of
that, because step 1 of its own instructions said `git log --oneline --since="8 days ago"` with no
`--all`.

**Measured, not asserted:** the old command returns 14 commits, the new one returns 428.

That instruction is fixed this turn (see HARDEN below), and all eleven decisions are now recorded in
TASTE_LOG , explicitly labelled as **not live on `main`**, so a record is never mistaken for a
description of the shipping site.

---

## 0. HARVEST , the week's dated owner decisions

Full table with quotes and commit shas: `_design-system/TASTE_LOG.md`, block "2026-08-03 to 2026-08-10,
the account-hub week". Summarised here:

| # | Decision | Quoted? | On main? |
|---|---|---|---|
| H1 | A destination page carries no browse chrome , bell and hamburger off the account hub | yes | no |
| H2 | No box on an account hub, and never box + per-row hairline (already LOCKFILE §17.2 law) | yes | no |
| H3 | Back control = filled grey circle, no border; grey tiles behind row glyphs gone | yes | no |
| H4 | The pink `#FF3366` heart is out of the account hub nav row | yes | no |
| H5 | Row glyphs 19 -> 22px; a subline that only restates its label is cut | yes | no |
| H6 | **OVERHAUL means STRUCTURE, not treatment** (four rounds of treatment called an overhaul) | yes | no |
| H7 | 1:1 against a reference = measure both sides and table the differences, before rebuilding | yes | no |
| H8 | Top-bar back + close = circles with shadow; **hamburger stays square**; border KEPT with the shadow | yes | no |
| H9 | A sheet open is three staged acts; content is ABSENT during the container's travel | yes | no |
| H10 | Every Lucide terminal is butt/miter, never round | **no , approved-but-unquoted** | no |
| H11 | The `Wo?` field keeps white fill + hairline; the grey-fill proposal was overruled | **no , unquoted** | no |

H10 and H11 are labelled rather than dressed up as his words. If either was never actually approved, say
so and the row comes out.

---

## (a) SAFE FIXES APPLIED , 3

Each applies a supersession that **already existed in writing**, dated and owner-quoted. No locked value
changed, no ceiling or floor loosened, nothing deleted , superseded text is struck through and kept so
the reversal stays legible.

| # | Commit | What was wrong | What landed |
|---|---|---|---|
| S1 | `9cc3c375e` | **Five more places still told writers to use `du`**, eleven days after the reversal. The 08-03 pass fixed SOURCE §18 and §1 and disarmed the gate; it missed `LOCKFILE:861` (§6 Brand voice, "`du` not `Sie` (informal Swiss)"), `SOURCE:736`, `SOURCE:1244`, `SOURCE:1340` and `RATIONALE:522`. LOCKFILE is the worst possible location: precedence **tier 3**, above TASTE_LOG, and its own §10.8e claims "LOCKFILE never goes stale, it's the project's truth". Anyone following the precedence chain literally would have written informal German. | All struck and pointed at `COPY_LAW.md` §1. Register is now stated in exactly ONE place. RATIONALE keeps its full ADR under a reversal banner, because that entry's own SACRIFICES line named the exact failure the owner later acted on. No exclamation / no emoji / no over-cap all stay live. |
| S2 | `9934c12da` | **RATIONALE still defended 420ms as a deliberate departure**, twice, citing `MOTION.md:28` , which has said **280ms** since the owner retimed it on 2026-07-26 off the Demo 7 side-by-side. It pointed at the right line and got the wrong number out of it, and recorded ~100ms of perceived snappiness as a price still being paid. It is not: 280ms sits inside the NN/g band and inside the reveal tier of THE SPEED LAW, so the departure is **closed**, not narrowed. | Both mentions struck and corrected, the departure marked closed. The paragraph's own lesson is kept verbatim, because it happens to be why this was findable at all: "silently citing NN/g while shipping 420 is how docs rot." |
| S3 | `461c397c2` | TASTE_LOG , the record of what the founder actually said , stopped at 2026-07-31 while eleven dated decisions shipped on branches. | All eleven recorded, each pointing at its owning file where one exists. Two labelled approved-but-unquoted. The block opens with the not-on-main caveat. **extends** the 07-24/26 and 07-29/31 blocks; supersedes nothing. |

---

## (b) OWNER DECISIONS NEEDED , 9

Contradictions with **no written supersession**. Nothing below was touched.

### New this week

**D8. What shadow does a SalonCard carry? Three files say three different things, and the code is a
fourth voice.**
- `CLAUDE.md` design-contract shadow row + `LOCKFILE.md` §17.2, both dated 2026-07-21: *"SalonCard =
  photo + `shadow-whisper` + NO border"*.
- `SOURCE.md:519`, inside a table headed **"§6.4 Interaction patterns (THE LOCKED RULES) , non-negotiable
  across the system"**: *"Card (photo-first) | scale-1, shadow-elevation-1"*.
- The shipped code (`SalonCard.tsx:413`) uses **`shadow-elevation-2`**, hovering to `-3`.
- `TASTE_LOG` Round 1, 2026-06-07, confirmed by you verbatim (*"all ur count correct"*): *"Soft, visible
  shadow (`elevation-2` family)"* , which is what the code does.

These are materially different CSS, not synonyms (`whisper` carries a 28px spread, `elevation-1` is a
1-3px hairline lift). The awkward part for the precedence chain: **your only actual quote here is the
06-07 one, and it backs the code.** The 07-21 depth table is audit-derived law, not something you said.
Rule 1 of the chain is "latest dated OWNER decision", and by that reading the code is right and two law
files are wrong , but that would mean striking a LOCKFILE frozen literal and a CLAUDE.md contract row,
which is exactly what I am not allowed to do without you naming it. **One word: is a SalonCard `whisper`
or `elevation-2`?**

**D9. The "Geöffnet" green in the code is not the green you asked for, and the comment above it says so.**
`tailwind.config.js:174` ships `"s-open": { DEFAULT: "#22C55E" }`. The comment on the **two lines
directly above it** reads: *"Fresha's calmer rgb(31,137,0), owner 2026-06-12 'make the green more like
Fresha'"* , that is `#1F8900`. `LOCKFILE.md:73` also pins `#1F8900`. Git says `#1F8900` shipped on
2026-06-12 with your quote, and was changed to `#22C55E` on 2026-07-23 inside a large PDP feedback batch
(`5a2adf4e9`) whose message lists it as one line item with **no quote from you**. So either you asked for
the brighter green on 07-23 and three places were never updated, or it drifted. `#22C55E` is Tailwind's
stock green, which is a small tell. **Which green is the open-status green?**

**D10. Does "border OR shadow, never both" extend to icon controls, or is the 08-10 top-bar control a
named exception?**
Your 2026-08-10 decision keeps the border **alongside** the shadow on the back and close circles, with a
stated reason I find convincing (they sit on white, where a soft shadow alone is nearly invisible).
`PRINCIPLES_50` #7 says *"Border OR shadow, never both on one box"*; LOCKFILE §17.2 says *"a card
carrying elevation drops its border, never both"*. §17.2 says **card**, and an icon control is not a
card, so this may already be legal , but principle 7 dropped the word "card" and reads as universal.
**Either it is an exception with your name on it, or principle 7 needs the word "card" back.** Left
alone because narrowing a ceiling is still changing one.

### Escalated , this is D5's third appearance and it is now much larger

**D5 (was: one stranded branch). Five branches, 428 commits, eleven of your decisions, none on `main`.**
07-27 flagged one branch. 08-03 flagged the same one. Today it is five, `agent-flow-design-overhaul`
alone at 239 commits with a tip from this morning. Everything in the harvest table above lives only
there. This is not a law problem I can fix by editing a law file: the work is real, it is yours, and it
is invisible to anything that reads `main`. **Merge, or tell me which to abandon.**

### Carried unchanged from earlier passes

- **D1. Card press-scale `.985` or `.97`?** *New evidence:* `MOTION.md:114-142` measured it on 2026-07-26
  , `.985` produces 2.69px of edge movement, the largest rung on the ladder, and MOTION.md itself
  concludes it "does look like drift from 0.98. Needs an owner call." 71 files use `.97`.
- **D2. Card meta text 12px or 13/14px?** `CLAUDE.md` and `SOURCE.md` say 12; `LOCKFILE:236/318` says
  13/14. No supersession note connects them.
- **D3. Is blue allowed on small BUTTONS, or only on hyperlink-reading text?**
- **D4. `rounded-input` still resolves to 16px in code** while all four law files say 12 (41 usages).
- **D6. Is the spaced en-dash legal in DE/FR/IT prose?** The carve-out is mine, not yours.
- **D7. What size is an eyebrow, and is it still a thing at all?**

---

## (c) DUPLICATION , 4 found, 0 applied

Ranked by danger, meaning: would two builders reading two copies build different things?

1. **Register stated in six places** , FIXED as S1. Canonical: `COPY_LAW.md` §1.
2. **The 420ms entrance in RATIONALE vs 280ms in MOTION** , FIXED as S2. Canonical: `MOTION.md`.
3. **SalonCard's shadow in four voices** , NOT fixed, it is D8. There is no safe canonicalisation while
   the files disagree on the value itself.
4. **`SOURCE.md` §6.4 "THE LOCKED RULES" has no defer-to-LOCKFILE note**, unlike §1 and §3 which both
   carry one ("where a value here conflicts with LOCKFILE, LOCKFILE wins"). That missing sentence is why
   the stale card-shadow row still reads as live, non-negotiable law. Adding the note is a one-line fix
   and I did not make it, because it would silently resolve D8 in LOCKFILE's favour , and per D8 the
   only owner quote points the other way. **It should be added the moment D8 is answered.**

## STALENESS , 0 new

Every file path, hook, npm script, component doc, research file and token cited anywhere in the corpus
was verified to exist (14 gate filenames checked against both hook directories, all component docs, all
`research/*` files, `npm run exists` / `removed` / `check:press` / `check:geometry`). The two known
dangling Uber pixel-ref citations from the 08-03 pass are unchanged and already self-flagged in-doc.

The corpus's live failure mode is not broken pointers. It is a citation that resolves perfectly to a
number that has since changed , S2 is the exact shape: right file, right line, wrong value, and nothing
about it looks broken.

---

## (d) PROPOSED UPGRADES , 5, in the PRINCIPLES_50 format. PROPOSED, not law. Not added to any file.

Each is sourced from something that actually happened this week, not invented.

**P1. Overhaul means structure , changing what is on the screen and in what order, never the container,
the divider and the icon.** A treatment pass wearing the word "overhaul" is the failure mode, because
treatment is the safe half: it always reverses, nothing is invented, and it produces a diff fast.
*Solen application:* when the ask is "overhaul", the row set must change , reorder, merge, cut or
promote , before any container or icon is touched. Source: H6, four rounds of it.

**P2. A destination page carries no browse chrome.** Global nav triggers and notification bells belong
to surfaces you are travelling THROUGH, not to a page whose own rows are its navigation.
*Solen application:* the account hub renders neither bell nor hamburger. The general rule this
generalises: chrome exemptions must be decided per surface, never inherited by falling through an
`else` branch , which is exactly how the bell got there. Source: H1.

**P3. A semantic colour is only semantic where the meaning applies.** `#FF3366` means "saved by you". On
a navigation row that merely leads to saved items, it is decoration wearing a semantic colour.
*Solen application:* extends taste rule 4, which protects semantic colours from being monochromed to ink
but never said the reverse. This is the missing half. Source: H4.

**P4. Measure the artefact that ships, never the artefact you built.** A tick reading "verified:
`.lucide-heart` count is 0" was taken on a mockup while the live component kept the pink heart for days.
A measurement of the wrong artefact reads exactly like a measurement of the right one.
*Solen application:* every verification names its surface , live route at 390x844, or mockup , and a
mockup measurement can never close an item about shipping code. Source: `fc07dccc8`, in his words
*"how did u not flag it ever wtf"*.

**P5. Motion is choreography, not a duration.** Two rects and a duration cannot describe a sequence; a
sheet open is three acts, and the middle act is an EMPTY container travelling.
*Solen application:* MOTION.md has speed tiers and recipes but no vocabulary for staging, which is why
H9 has nowhere to live. A CHOREOGRAPHY section stating leave -> travel -> staggered arrival, with content
absent during travel, is the smallest thing that would give it a home. Source: H9.

---

## HARDEN , one artifact, landed this turn

**Chosen: FIX THE EXISTING ONE. No new gate.**

The recurring mistake already had a check , this pass's own step 1 , and the check was blind. Per
LAW_SYSTEM 6.9 that is a binding failure, not a missing-check problem, and a twelfth gate would have
found nothing while adding one more thing able to interrupt.

`~/.claude/scheduled-tasks/design-law-improve/SKILL.md` step 1 now requires `git log --all` plus a
per-branch `main..$b` count, and requires **reading commit message bodies** on any branch with a
non-zero count, because in this estate the owner's verbatim quotes live in commit bodies rather than in
diffs. It also requires labelling every harvested decision with whether it is on `main`, and recording
an unquoted approval as approved-but-unquoted instead of inventing a quote.

**Self-tested, both commands, this turn:** old form returns **14** commits, new form returns **428** and
names all five branches. Nothing was retired to pay for it, because nothing was added , this is one
instruction corrected in place, and it removes work rather than adding a block.

(The file lives in `~/.claude`, which is not a git repository, so this change is on disk and has no
commit of its own.)

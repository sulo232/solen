# DESIGN-LAW IMPROVEMENT PASS , 2026-08-03

Weekly run (owner-mandated 2026-07-21: "keep improving taste and design file as we go even outside this
session"). Corpus: CLAUDE.md pinned design blocks, LOCKFILE, SOURCE, TASTE_LOG, RATIONALE,
REJECTED_TREATMENTS.json, `public/_mockups/_BASE.md`, `research/PRINCIPLES_50.md`, MOTION.md,
COMPONENT_REGISTRY.md, and , new this pass , `_design-system/COPY_LAW.md` (written 2026-07-29, after
the scheduled task's corpus list was authored).

Window: 2026-07-27 to 2026-08-03, 33 commits.
Counts: **harvested 5 · contradictions 7 open · duplications 5 · safe fixes 8 · owner decisions 7.**

**Say the shape of the week plainly first: this was not a design week.** Every commit in the window
belongs to workstream 42 (principle research) or 43 (copy + voice law) or the 08-01 estate self-audit.
**Zero new dated owner decisions on any visual axis.** So the value of this pass is not "the law fell
behind the owner"; it is that a language decision reached into the design corpus, and while checking
that, the pass found older debt of exactly the kind the 07-27 run named.

**The headline, and it is worse than a stale doc.** `~/.claude/hooks/copy-lint-gate.py` rule 5,
`NO-FORMAL-REGISTER-IN-DE`, was still **armed and blocking** any edit to `messages/de.json` containing
`Sie` / `Ihr` / `Ihre` / `Ihnen`, with a deny message instructing the writer to "Rewrite with
du/dein/deine/dir/dich". The owner reversed exactly that on 2026-07-29 ("make it the Sie instead of the
du"), `COPY_LAW.md` §1 is the law, and 330 German strings plus 161 hand-conjugated ones already shipped
formal. **Verified live, not read off the source:** an Edit adding `"Ihr Termin ist bestätigt"` to
`messages/de.json` returned `permissionDecision: deny`. The gate never fired during the sweep only
because the sweep ran as a node script over Bash, and this is a PreToolUse gate on Write/Edit/MultiEdit.
A precedence **tier-2** artifact was set to undo a **tier-1** owner decision on the next person who
touched the file, and it would have looked like the system correcting them. Disarmed, S8.

---

## 0. HARVEST , the week's dated owner decisions, and whether the law knew

| # | Decision | Owner, verbatim | Was it in the law? | Record |
|---|---|---|---|---|
| H1 | **Register goes FORMAL: `Sie` (de), and by extension `Lei` (it), `vous` (fr).** | *"make it the Sie instead of the du"* | **Half, and the other half said the OPPOSITE in three places.** COPY_LAW.md §1 had it. `SOURCE.md` §18 and its §1 summary both still said "German `du` not `Sie`", and the copy-lint gate still BLOCKED formal German. Fixed: S1, S8. | 69fc74d65, a0423867d, 2026-07-29 |
| H2 | **There must be a written law for HOW we write, not only how much.** | *"research everything and make a whole principle about, like, when you're writing something, how to do it and stuff"* | Delivered as `COPY_LAW.md` (9 sections), but **unreachable**: nothing in the always-loaded CLAUDE.md pointed at it. Fixed: S7. Not in TASTE_LOG. Fixed: S6. | a289a2154, 2026-07-29 |
| H3 | Password minimum = 8, the NIST 15 recommendation knowingly declined. | *"password minimum is eight"* | Backend, not design law. Already true at `lib/validations.ts:686`; no change was needed and none was made. No design-corpus action. | plan record, 2026-07-29 |
| H4 | The Supabase leaked-password toggle is the owner's to flip, on cost grounds. **Stop surfacing it.** | (dictated, recorded in `_plans/COPY_VOICE_LAW.md` D2) | Process decision, correctly parked out of the open list. Named here once so this pass does not re-raise it, and it will not appear in future runs. | plan record, 2026-07-29 |
| H5 | Scope lock: backend and translation only that session, no big frontend changes, owner working frontend in parallel. | (dictated) | Honoured. No design-law action. | plan record, 2026-07-29 |

**Design-law-bearing: 2 of 5 (H1, H2). Actively contradicted by the law and by a live gate: 1 (H1).**

---

## (a) SAFE FIXES APPLIED , 8

Each applies a supersession that **already existed in writing**, or corrects a pointer to a file that
moved or never existed. No locked value changed, no ceiling or floor loosened, nothing deleted , every
superseded line is struck through and kept so the reversal stays legible.

| # | Commit | What was wrong | What landed |
|---|---|---|---|
| S1 | `6ff1acc50` | `SOURCE.md` §18 , the place anyone looks up the voice , told every writer "**Conversational** , German `du` not `Sie` (per audience research)", and its §1 summary repeated it. Five days after the owner chose `Sie` and 491 German strings were swapped. | Register half of §18 marked superseded by name, both lines struck through, pointed at `COPY_LAW.md` §1. The Solen pattern table and anti-patterns stay live. |
| S2 | `4096a9447` | LOCKFILE §12 **defined the Eyebrow role AS uppercase**, printed `font-semibold uppercase tracking-[0.08em]` as the literal to copy, and rule A7 blessed two uppercase roles; `SOURCE.md` called `FÜR SALONS` "the ONE place UPPERCASE is allowed". The owner banned caps outright on 2026-06-18 ("Never fucking caps lock") and `copy-lint-gate.py` has blocked the class ever since. **The law was handing new work a recipe a live gate refuses.** | Uppercase marked dead by name in both files; old text struck through; the one-eyebrow-per-surface ceiling explicitly KEPT (FLOORS LAW 5, a deletion names what it keeps). |
| S3 | `24ffc9e51` | LOCKFILE §3.5's table headed "State matrix (**ENFORCED**)" prescribes `ring-2 s-accent` in **every** focus cell. The owner killed focus rings three times (07-01, 07-02, 07-17) and `no-focus-ring-gate.py` blocks any `ring-*` in a UI file. Two `selected` cells (Card `ring-2 s-ink`, List row `bg-s-accent-bg`) predate the 2026-06-29 gray-fill law **that the same file already states 700 lines later**. | Both columns marked superseded by name, pointing at the CLAUDE.md focus row and LOCKFILE §13.1. Rest / hover / pressed / disabled untouched. |
| S4 | `72ac41f4d` | Three pointers resolving to nothing: MOTION.md line 58 cited `.claude/hooks/motion-recipe-gate.py` (global-only; line 3 of the same file had it right); `SOURCE.md` sent readers to `components/SaveHeart.md` (does not exist , SaveHeart is a variant inside `HeartButton.md`); LOCKFILE told you to acknowledge a one-off by adding to `_design-system/_drift-acks.json`, **which has never existed and no tool reads**, while the three live drift gates honour the inline `drift-ok` marker. | Each repointed at the verified real thing. |
| S5 | `6376521d5` | Four dead citations. `SOURCE.md`'s migration table named `_tasks/archive/SOLEN_DESIGN_pre-V3-D183.archived.md` (real name `SOLEN_DESIGN.archived.md`) and claimed SOLEN_PATTERNS was archived when it is **still live** at `_rules/SOLEN_PATTERNS.md`. LOCKFILE cites three Uber research files as the measured evidence for the blue rule and the imagery rule; `public/_pixel-refs/uber/` is an **empty directory** and none of the three appears in git history on any branch. | Names corrected where a file moved; flagged as unverifiable where it never existed. Both Uber-sourced rules stay locked , only their citations are dangling. |
| S6 | `598c770ca` | TASTE_LOG , the record of what the founder actually said , stopped at 2026-07-26 while two dated decisions shipped. | Both recorded, each pointing at `COPY_LAW.md` rather than restating it. The Italian bare-imperative carve-out is labelled **mine, not the owner's**, and still awaiting a yes or no. |
| S7 | `9336a656a` | `COPY_LAW.md` was commissioned by the owner and 570+ strings were swept to match it, and **nothing in the always-loaded CLAUDE.md pointed at it**. A builder writing a German string would have followed the Copy economy block (length only) and SOURCE §18 (which said `du`). Same wrong-tier failure the 07-27 pass named as the root cause. | Pointer only, above the Copy economy block. No rule copied down, no value changed. |
| S8 | **on disk, not versioned** (`~/.claude` is not a git repo) | The headline above: `copy-lint-gate.py` rule 5 blocking formal German in `messages/de.json`, verified live. | **Disarmed, not inverted** , `REGISTER_RULE_ARMED = False`, detection code kept intact so re-arming is an edit not a rewrite. `COPY_LAW.md` §8 sets the order: the reverse gate is armed as a ratchet only AFTER the sweep lands, and the Italian half is still going. **Self-test 5/5**: formal now passes, informal still passes, NO-CAPS and NO-DECORATIVE-SEPARATOR still fire. |

---

## (b) OWNER DECISIONS NEEDED , 7

Contradictions with **no written supersession**. Nothing below was touched.

### New this week

**D6. Is the spaced en-dash legal in German, French and Italian prose?**
`COPY_LAW.md` §4.2 (2026-07-29) says yes: *"The spaced en-dash is LEGAL in DE, FR and IT prose for a
parenthetical or a range, and remains banned in English UI copy and in code"*, arguing that our own
locale files break the blanket ban 252 times (222 em-dashes, 30 en-dashes measured) and "a rule broken
252 times by its own owner is not a rule". Against it: CLAUDE.md taste rule 10 bans `—` **and** `–`
"anywhere in UI copy, code, comments, or commits"; LOCKFILE §12(a), dated 2026-07-24 and therefore
**later than nothing but higher in tier**, says "with ranges gone the plain no-dash rule stands
everywhere"; and `copy-lint-gate.py`'s NO-EM-DASH rule blocks both characters in code and UI files
today. **This carve-out is mine, not yours** , it has no owner quote behind it. The practical scope is
narrower than it reads (translated strings live in `messages/*.json`, and whether the gate treats those
as "code" is exactly the ambiguity), which is why it needs one word from you rather than more analysis.
*The question:* kill §4.2 and keep the blanket ban, or keep the carve-out and I loosen the gate for
`messages/de|fr|it.json` only?

**D7. What size is an eyebrow , and is it still a thing at all?**
Named as the "eyebrow triple-contradiction" in `UNFINISHED_AUDIT_2026-07-21.md` flaw 5, queued for
resolution when you approved the FLOORS LAW, and never resolved. The values in the corpus right now:
**11/12px 600** (LOCKFILE §12 role table), **"normal-case 13px semibold"** (CLAUDE.md copy rule 5,
mockup-scoped), and **"drop entirely"** (the audit's own third reading). S2 settled the *casing* half
(sentence case, by your 2026-06-18 ban); the *size* is still three numbers.
*The question:* 11/12, 13, or delete the role.

### Carried from 2026-07-27, all four re-verified as still open today

**D1. Card press-scale: `.985` or `.97`?** LOCKFILE §3.5 says `.985`; SOURCE.md §6.4, headed
"non-negotiable", says `0.97` / `0.98`. Same date, no cross-reference. **Re-measured today: 71 files
carry `active:scale-[0.97]`**, and MOTION.md's own measurement calls `.985` "drift". LOCKFILE outranks,
so as written the law blesses the value its own measurement rejects. Proposed principle 51 (07-27 pass)
is the tool that answers this: derive the rung from the control's width.

**D2. Card meta text: 12px or 13/14px?** CLAUDE.md contract row and SOURCE.md §336 both say 12.
LOCKFILE §236 says "Body small (meta rows, secondary) | 13px | 14px" and outranks both. Every card on
every browse surface.

**D3. Is blue allowed on small BUTTONS, or only on hyperlink-reading text?** CLAUDE.md taste rule 3
(2026-06-10) lists "small buttons / chips"; LOCKFILE §1 (2026-06-11) says blue "lands ONLY on text that
reads as an `<a href>` inside prose". LOCKFILE both outranks and postdates, but names "v2 generous" as
what it supersedes, never this phrase.

**D4. `rounded-input` still resolves to 16px in code while all four law files say 12.** Unanimous in
the law, wrong in the tokens: `tailwind.config.js` has `input: "16px"` and `globals.css` has
`--radius-input: 16px`. Real `<input>` elements render 12 only because a hardcoded `border-radius: 12px`
in `@layer base` wins on specificity. **Re-counted today: 41 usages** repo-wide excluding node_modules
and worktrees (last week's report said 36; 41 is the number measured today with the wider file-type
sweep, and it is the one to trust). Code change, so it goes through the loop, not this pass.

**D5. Branch `claude/taste-rationale-frameworks-37390c`, 33 commits ahead of main.** Three of last
week's fixes were restores from it, found only because law files cited the missing files by name.
Whatever else is on it is still stranded. Targeted merge, or abandon it deliberately?

---

## (c) DUPLICATION , one canonical home per rule

| # | Rule | Stated in | Proposed canonical | Status |
|---|---|---|---|---|
| U1 | Voice register | `SOURCE.md` §1 summary, `SOURCE.md` §18, `COPY_LAW.md` §1 | **`COPY_LAW.md` §1** | **Done this pass** (S1): both SOURCE copies now point instead of restating. |
| U2 | Punctuation / dashes | CLAUDE.md taste rule 10, `SOURCE.md` §18 anti-patterns, LOCKFILE §12(a)+(e), `COPY_LAW.md` §4 | **`COPY_LAW.md` §4** | **Blocked on D6.** Four statements, one of which now flatly contradicts the other three; consolidating before you answer would be picking a side. |
| U3 | ALL-CAPS ban | CLAUDE.md copy rule 5 (mockup-scoped only), `SOURCE.md` §18, LOCKFILE A7, `COPY_LAW.md` §4.4, plus the gate | **`COPY_LAW.md` §4.4** | Half done (S2 killed the two carve-outs). Remaining drift: CLAUDE.md scopes the ban to **mockups** while the gate and COPY_LAW apply it everywhere , the weakest statement is the one always in context. |
| U4 | Per-screen type budget | CLAUDE.md floor 2, LOCKFILE §12:323, RATIONALE:63, :128, :351 | **LOCKFILE §12** | Values agree since the 07-27 pass; five copies remain. Low risk, high re-drift cost , next pass converts three of the five into pointers. |
| U5 | Selected / active state | CLAUDE.md contract row, LOCKFILE §13.1, LOCKFILE tab-label row, LOCKFILE state matrix | **LOCKFILE §13.1** | **Done this pass** (S3): the contradicting matrix cells now defer to §13.1 by name. |

---

## (d) STALENESS , verified with `ls` / `grep` / `git log`, never assumed

Fixed: the MOTION gate path, `SaveHeart.md`, `_drift-acks.json`, the SOLEN_DESIGN archive name (S4, S5).

Flagged, not fixable here:
- **`public/_pixel-refs/uber/` is empty.** Three cited research files (`UBER-FEEDBACK-BLUE.md`,
  `UBER-BLUE-INVENTORY.md`, `UBER-IMAGERY-PATTERN.md`) are absent from disk **and from git history on
  every branch**, unlike last week's stranded-branch case where the files existed and were restorable.
  Two locked rules quote their numbers. Annotated in place.
- **`_rules/SOLEN_PATTERNS.md` is live** while SOURCE.md claimed it was archived , emerald / cream /
  Peace Sans token specs sitting in a file the precedence chain calls history. Corrected in the record;
  actually archiving it is a separate call.

Live **code** debt this pass measured but did not touch (law is clean, code is not):
- **173 `uppercase` occurrences across 65 files** in `app/` + `components/`, against an owner ban dated
  2026-06-18 and a wired gate. The gate only blocks *new* ones.
- **41 `rounded-input` usages** getting 16px from the token (D4).
- 11 `tracking-[0.08em]` usages, the old eyebrow recipe (pending D7).

---

## (e) PROPOSED UPGRADES , 5, in THE 50 format. PROPOSED, added to no law file.

Continues 51-55 from the 07-27 pass. Each is sourced from this week's actual work.

**56. A gate outlives the rule that spawned it** , when a decision is reversed, the enforcement written
for the old decision is the *first* thing to change, not the last, because a gate is the only law that
argues back.
*Solen:* `NO-FORMAL-REGISTER-IN-DE` kept blocking `Sie` for five days after the owner chose `Sie`, and
would have told the next editor, with authority, to undo 491 swapped strings. Docs that go stale are
read as suggestions; a stale gate is read as a correction. **Rule: any reversal ships with a grep for
gates citing the reversed doc, in the same session.** Source: S8, this pass.

**57. A rule broken by its own author is data, not a violation** , when the corpus that a rule governs
breaks it at scale, measure before you decide whether to enforce it or retire it.
*Solen:* the blanket no-dash rule is broken 252 times inside our own four locale files. That number is
the argument for `COPY_LAW.md` §4.2's carve-out and equally the argument for a cleanup sweep , which is
exactly why it is D6 and not a unilateral edit. **The measurement is neutral; the conclusion is the
owner's.** Source: `COPY_LAW.md` §4.2, measured 2026-07-29.

**58. A decision in one language is a decision about the product** , a call made for one locale must be
tested against every locale before it is recorded as narrow.
*Solen:* the owner said "Sie instead of du" about German. Measuring first showed French was **already
90% formal** and Italian **100% informal** , the four locales had been contradicting each other and
nobody noticed, because nobody reads two locale files at once. Treating it as a German decision would
have left Italian pointing the other way. Source: `COPY_LAW.md` §1, measured across all four files.

**59. An asymmetry between languages is a rule, not an exception** , when one locale cannot follow a
rule the way another can, write down *why*, or the next pass reads it as sloppiness and "fixes" it.
*Solen:* German buttons get formality free (`Speichern` is an infinitive that reads right under Sie);
Italian has no such form, so its 559 button labels stay bare imperatives (`Salva`, not `Salvi`).
Without §6b that reads as 559 missed strings. **A carve-out with a written mechanism survives; one
without gets re-litigated every sweep.** Source: `COPY_LAW.md` §6b, 2026-07-31.

**60. Cite the evidence or cite that you cannot** , a rule whose stated justification points at a file
nobody can open is a rule with no justification, and it will be re-opened by the first person who
looks.
*Solen:* two locked rules , the blue-restraint model and the 5-pattern imagery system , cite three Uber
research files that are not on disk and never entered git. The rules may well be right; their evidence
is currently unfalsifiable, and that is a different thing from being proven. **Rule: a citation is
checked when it is written, and a dangling one is annotated rather than quietly carried.** Source: S5,
this pass.

---

## Method note

Everything above was verified against the live estate, not recalled: gate behaviour by executing the
gate with a crafted payload, file existence by `ls` and by `git log --all --name-only`, counts by
`grep -rn` with node_modules and worktrees excluded. Where a number in a previous report disagreed with
today's measurement (`rounded-input` 36 vs 41), today's number and its method are stated rather than
the older one repeated.

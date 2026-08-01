# SELF-AUDIT 2026-08-01 , weekly estate pass (workstream #17 LAW, standing loop)

Doctrine: `~/.claude/IMPROVE_SYSTEM.md` §5 + `~/.claude/LAW_SYSTEM.md`. Owner-sanctioned standing
loop since 2026-07-10. Scope guard for this pass: hook scripts under `~/.claude/hooks` and doctrine
`.md` may be edited; product code is READ-ONLY; no push; commit `_plans` only.

**Headline:** the class the 2026-07-25 audit named as structural got 4x worse in one week, and the
tool built to contain it could not have contained it. **20 gates authored 2026-07-31/08-01, 18 with
green self-tests, were enforcing nothing** , and `wire-pending-gates.sh`, the script written last
pass specifically to arm gates the sandbox cannot wire, carried a HARDCODED list of 5 names and would
have printed *"nothing to do , all four already wired"*. It also could not run at all under the
sandbox (heredoc + temp file = `Operation not permitted`), which is exactly the environment it exists
for. Both are fixed and self-tested; arming still needs one command from a normal shell (§P0).

Health check: **37 -> 34** violations this pass.

---

## Audit steps , atomic checkboxes (the 8 doctrine steps, one box each)

- [x] 1. `system-health-check.py --report`, list every violation
- [x] 2. Read `~/.claude/state/skip-flag-ledger.log`, flag gates being skip-flagged into silence
- [x] 3. Profile UserPromptSubmit injection sizes, flag anything off the once-per-session diet
- [x] 4. Read `mistake-themes-global.json`, list warning-tier themes (2 sessions / 14 days)
- [x] 5. Verify the newest 5 `_rules/LESSONS_LEARNED.md` entries parse against `lessons-ledger-inject.py`
- [x] 6. design-suggest gather+record only (refresh `SUGGESTIONS.md`, no chips)
- [x] 7. DOC-VS-GATE reconciliation (drift-gate literals vs LOCKFILE §1-3; phantom gate names in prose)
- [x] 8. Write this report + `ACTIVE.md` row + WORKLOG entry + commit `_plans`

---

## 1. Health check , every violation

### BEFORE: 37 violations

| # | invariant | count | verdict |
|---|---|---|---|
| 1 | hook wiring , orphans | 21 | **19 real** (see 1a) + 2 false (helper libraries, fixed) |
| 1 | hook wiring , missing file | 0 | clean |
| 2 | memory index | 1 | real, fixed |
| 3 | stale flags | 3 | report-only by design, benign (396-490h old `gemini-mandate-*`) |
| 4 | phantom strings | 3 | known, unchanged , 4th audit running (see 1c) |
| 5 | skill refs | 0 | clean |
| 6 | ledger staleness | 0 | newest entry 2026-07-31, 1d |
| 7 | gate profiles | 0 | clean |
| 8 | law claims | 0 | **the 0 was partly blind** , see 1d, fixed |
| 9 | skip-flag mute | 2 | owner decision (§2) |
| 10 | serial gate groups | 6 | consolidation candidates, unchanged |
| 11 | hook sprawl ceiling | 1 | 183 wired vs threshold 150 |
| 12 | retired-gate ledger | 0 | clean |

### AFTER the fixes: 34 violations
Orphans 21 -> 19 (two helper libraries correctly SHELVED), memory index 1 -> 0.

### 1a. The 19 REAL orphans , the recurring class, 4x bigger

All 19 are absent from every settings file. Authored dates and self-test state, measured:

| authored | count | self-test |
|---|---|---|
| 2026-07-31 | 17 | 17 green |
| 2026-08-01 | 1 (`loop-does-not-report-gate.py`) | green |
| 2026-07-26 | 1 (`no-plumbing-in-reply-gate.py`) | **none** |

Full list with the event each declares in its own header (all parse cleanly, none needed a guess):

```
Stop        always-give-link-gate.py            animation-full-clip-verify-gate.py
Stop        loop-does-not-report-gate.py        no-invented-visual-motif-gate.py
Stop        no-permission-question-gate.py      no-plumbing-in-reply-gate.py
Stop        no-regression-by-fix-gate.py        no-self-limit-excuse-gate.py
Stop        no-unrequested-removal-gate.py      plain-english-gate.py
Stop        repeat-fix-simplify-gate.py
PreToolUse (Write|Edit|MultiEdit)   chrome-consistency-gate.py   locked-value-gate.py
PreToolUse (Write|Edit|MultiEdit)   measure-the-live-page-gate.py
PreToolUse (Write|Edit|MultiEdit)   mockup-compose-registered-card-gate.py
PreToolUse (Write|Edit|MultiEdit)   overstep-gate.py             scope-creep-gate.py
PreToolUse (Write|Edit|MultiEdit)   touch-action-scroll-gate.py
PreToolUse (Agent|Workflow)         subagent-phone-view-gate.py
```

**Root cause is unchanged from 2026-07-25 and is not a mystery:** `~/.claude/settings.json` is
unwritable under `SANDBOX_RUNTIME=1`, so `/harden` can BUILD and SELF-TEST a gate but cannot ARM it.
What IS new is that the containment measure failed twice over, and both failures were structural:

1. **The hardcoded list.** `wire-pending-gates.sh` named 5 specific gates. Twenty gates authored
   after it was written were invisible to it. Run against today's estate it would have said
   "nothing to do". A workaround with a hardcoded list only ever fixes the incident that produced it.
2. **It could not run in the sandbox.** Its logic lived in a `python3 - <<'PY'` heredoc, and bash
   cannot create the heredoc temp file under this sandbox: `cannot create temp file for here
   document: Operation not permitted`. So the tool for the sandbox problem was unusable from inside
   the sandbox. Verified by running it, not inferred.

### 1b. FIXED , the wiring tool now discovers instead of remembering

`wire-pending-gates.sh` is now a thin wrapper; the logic moved to `wire-pending-gates.py` (no
heredoc, runs under the sandbox). It:
- **discovers** orphans with the same rule `system-health-check.py` invariant 1 uses (top-level
  `*.py`/`*.sh` in `~/.claude/hooks`, in no settings file, not in `SHELVED.txt`) , so next week's
  gate is armed by the same command with no edit here;
- reads **event + matcher from each gate's own header** (`"""<name> , <Event> (<matcher>).`), and
  **refuses to guess**: no readable event, or a PreToolUse gate with no readable matcher, is printed
  as `NEEDS-DECISION` and left alone. Wiring to the wrong matcher makes a gate fire on everything or
  on nothing, and both are worse than unwired;
- **runs each gate's self-test before wiring it** (global rule 12.5, which the doctrine has always
  stated and no script enforced) , a FAILING self-test prints `BLOCKED` and that gate is not wired;
- keeps `--dry-run`, the `.bak`, idempotency; adds `--only`, `--skip-selftest`, `--selftest`.

Self-test: **14/14 PASS** , discovery, SHELVED exclusion, already-wired exclusion, non-hook-file
exclusion, Stop + PreToolUse header parse, **two negative refusals** (eventless file, matcherless
PreToolUse), apply-on-a-copy, idempotency (second apply adds 0), matcher written onto the new block,
backup written.

Live dry-run against the real estate resolves all 19 with no NEEDS-DECISION and no BLOCKED:
18 `[self-test PASS]`, 1 `[no self-test]`.

### 1c. Unchanged / benign
- **Phantom strings x3**, 4th audit in a row: retired prefix `mcp__Claude_Preview__` at
  `solen:hooks/browser-verify-gate.sh:28,30,89`. Product repo, cosmetic, the gate works.
- **Stale flags x3**: `gemini-mandate-*`, 396-490h old. Report-only by the checker's own design.
- **Hook sprawl**: 183 wired vs a 150 threshold. Arming the 19 takes it to 202. The ceiling is
  either wrong or the consolidation in §10 is overdue , owner call, see P4.

### 1d. FIXED , invariant 8 had a third-hook-directory blind spot

Invariant 8 (law claims) flags a doc sentence saying "hook X enforces this" when X is wired nowhere,
but only when X is **on disk**, and it looked in exactly two directories: `~/.claude/hooks` and
`<project>/.claude/hooks`. The project has a **third**: `/Users/sulo/Documents/solen/scripts/hooks`,
holding 4 hooks with 8 wiring lines in `.claude/settings.json`. Two of them,
`visual-deliverable-gate.py` and `mockup-resurrection-gate.py`, are cited by name in
`_design-system/TASTE_LOG.md` and `_design-system/DRIFT_LEDGER.md`. Had either been unwired, the
claim would have passed silently , precisely the hole invariant 8 exists to close.

Fixed by introducing `ALL_HOOK_DIRS` (three dirs) and using it for the `on_disk` test. Verified both
ways: both names now resolve on disk where they previously did not, and a nonexistent name still
resolves to nothing (no new false positives).

---

## 2. Skip-flag ledger , which gates keep getting muted

Ledger: 686 lines. Counted by flag name over 7 and 30 days.

| 7d | 30d | flag | read |
|---|---|---|---|
| 46 | 46 | `mockup-preflight-skip.flag` | **worst, and worse than last week (was 43 at the health check's own count)** |
| 16 | 16 | `exists-skip.flag` | over the mute threshold |
| 7 | 7 | `mockup-approved-skip.flag` | same family as #1 |
| 7 | 7 | `ss-measured.flag` | |
| 5 | 5 | `mockup-base-skip.flag` | same family as #1 |
| 2 | 17 | `finish-autonomously-skip.flag` | **collapsed: 17 in 30d but only 2 in 7d** |
| 3 | 3 | `tunnel-relink-skip.flag` | |
| 1-2 each | | 9 others | below threshold |
| 259 | 313 | *(no flag name on the line)* | see the caveat below |

**Two readings that matter:**

1. **`finish-autonomously` self-corrected.** Last audit flagged it at 40 skips in 6 days and asked
   for a tune-or-accept decision. It is now **2 in the last 7 days** against 17 in 30. Nothing was
   changed in the gate. The rate fell on its own, which means the 40 was a burst tied to one
   workstream, not a mis-tuned trigger. **P2 from last pass can be closed with no action** , that is
   the honest outcome, and it is worth recording so a future pass does not re-open it.
2. **The mockup family did not self-correct: 58 skips in 7 days across 3 flags** (46 + 7 + 5),
   every one of them this week. Sampling the reasons: they are overwhelmingly *"owner standing order:
   mockups only, do not touch real components"* and *"verified false positive, Nth firing this
   session"* , one entry literally reads "false positive, fourth firing this session". A gate that a
   real user has to talk past four times in one session is not enforcing a law, it is a toll booth.
   This is P1 from 2026-07-25, unanswered, now measurably worse.

**Caveat on the 259 "no flag name" lines, stated rather than papered over:** the ledger records the
justification command, and many set the flag via a path the counter's regex does not match (a
`.claude/`-relative flag, or a `printf` piped into a file). So the per-flag counts are a FLOOR, not a
total. The relative ordering is sound; the absolute numbers understate.

---

## 3. UserPromptSubmit injection diet

20 wired hooks (17 global + 3 project). Profiled by piping real payloads with
`CLAUDE_PROJECT_DIR` set , **without it, `$CLAUDE_PROJECT_DIR`-based commands return rc=127/rc=2 and
the profiler silently measures a python "file not found" message as if it were an injection.** That
trap cost the first run of this step and is recorded so the next pass does not repeat it.

Bytes of `additionalContext` per firing:

| hook | design prompt | backend prompt | "ok continue" | same session, 2nd firing |
|---|---|---|---|---|
| `taste-log-inject.py` | **1209** | 0 | 0 | 0 |
| `drift-ledger-inject.py` | **686** | 0 | 0 | 0 |
| `mockup-variations.py` | 541 | 0 | 0 | 0 |
| `backend-doc-pointer.py` | 0 | 509 | 0 | 0 |
| `user-prompt-binary-triggers.sh` | 411 | 0 | 0 | 0 |
| `fable-skill-trigger.py` | 408 | 0 | 0 | 0 |
| `owner-phrase-trigger.py` | 399 | 0 | 0 | 0 |
| `no-loop-narration-nudge.py` | 142 | 142 | 390 | **142** (decays) |
| `plan-active-prompt.py` | 250 | 99 | 250 | **99** (decays) |
| `tunnel-health-preflight.py` | 360 | 360 | **360** | **360** (does NOT decay) |
| 10 others | 0 | 0 | 0 | 0 |
| **TOTAL** | **4406 (~1.1k tok)** | 1110 | 1000 | 601 |

**This also closes P6 from 2026-07-25**, which asked for a targeted profile of `taste-log-inject.py`
and `drift-ledger-inject.py` with keyword-matching prompts after they measured 0 B on generic probes.
They are the two largest injections in the system: **1209 B and 686 B**. Both are relevance-gated and
silent otherwise, so this is correct behaviour, not a violation , but the number was unknown until now.

**One real violation, and it FAILED the diet:** `tunnel-health-preflight.py` was the only hook with
no per-session decay and no relevance gate. It injected 360 B on **every** prompt, including
`ok continue` on a backend task, and the identical 360 B again on the second firing of the same
session, while every sibling halved or went silent. Last pass reported "PASS , no hook exceeds the
once-per-session diet"; that verdict was wrong for this hook, and the correction is recorded here
rather than quietly overwritten.

**FIXED + self-tested.** A relevance gate now fires it only when (a) the prompt reads visual /
link-shaped, or (b) a `cloudflared` log was written in the last 24h , meaning a preview link is
plausibly live in the conversation, so even a terse "ok continue" can still be the turn that
re-sends it. Self-test **10/10** (4 visual positives incl. German, 3 non-visual negatives,
3 state-channel including the window boundary). Verified live end-to-end: **0 bytes** on
`ok continue`, **361 bytes** on `show me the mockup again`.

*Why gating is not a weakening:* `link-gate.py` already BLOCKS a dead link at send time (this hook's
own docstring calls that "half 1"). The preflight buys a saved round trip, not the safety net.
Missing it on a genuinely non-visual turn costs at most one retry inside that turn; firing on every
turn costs 360 B forever.

---

## 4. Mistake themes , warning tier (2+ sessions in 14 days)

| sessions in 14d | theme | total ever | dates |
|---|---|---|---|
| **9** | `link` | 12 | 07-18, 07-19, 07-20, 07-23 x2, 07-26, 07-29 x2, 07-31 |
| **6** | `promised-visual` | 11 | 07-20 x2, 07-23, 07-26, 07-31 x2 |
| **3** | `blue-black` | 3 | 07-23, 07-24 x2 |
| **2** | `stopped-early` | 2 | 07-29, 07-31 |
| **2** | `selected-state` | 2 | 07-23 x2 |
| **2** | `measure` | 3 | 07-31 x2 |
| **2** | `guessed` | 2 | 07-18, 07-31 |
| 1 | `font`, `fabricated`, `emdash`, `duplicated`, `dots` | 1 each | below tier |
| 0 | `verify` | 1 | dormant |

**Seven themes at warning tier, up from four last pass.** `link` and `promised-visual` are the same
failure wearing two names and together account for 15 of the 27 warning-tier session-hits. Both are
about handing over a preview that is dead or was never built. That is the exact class
`tunnel-health-preflight.py` covers , and the hook fixed in §3 is the "between turns" half of it.

`blue-black` + `selected-state` (5 hits) are the palette/selected-state class that
`peer-list-ink-cta-gate.py` was armed for on 2026-07-25; no new hits since 07-24, so that arming
appears to have worked. Recorded as tentative, not proven , one week is not a trend.

**Two new-this-week entries:** `fabricated` (07-31) and `measure` (07-31 x2). `measure` reaching
warning tier the same week `measure-the-live-page-gate.py` was authored and left **unwired** is the
whole §1 problem in one line: the gate for the mistake exists, has a green self-test, and is
enforcing nothing while the mistake is being made.

---

## 5. Lessons-ledger-inject verification , newest 5 entries

Parsed the live ledger through the hook's own `parse_entries()`: **51 entries, all parse.** The 5
newest, verified by piping a real `Edit` payload at a path each entry names:

| entry | probe path | result |
|---|---|---|
| Blanket-law application OVERRODE a dated owner approval | `app/[locale]/_components/primitives/SeeAllButton.tsx` | **INJECTS** |
| Skip-flag SPAM neutered the whole gate system | `.claude/hooks/flag-spam-gate.py` | **INJECTS** |
| A view is INVISIBLE to row level security by default | `supabase/migrations/2026...security_invoker.sql` | **INJECTS** |
| A register/copy sweep keyed on PRONOUNS is blind to VERBS | `scripts/register-sweep.mjs` | **INJECTS** |
| `apply_migration` writes NO local file | `scripts/check-migrations.mjs` | **INJECTS** |

**5/5 PASS.** One non-finding worth naming so it is not re-investigated: probing the RLS entry at its
other path, `_rules/SECURITY_RULES.md`, returns nothing , `lessons_channel()` has an explicit
`if path.endswith(".md"): return None`. That is deliberate (do not nag while editing docs), not a
parse failure.

**Two structural observations, not defects:**
1. **0 of 51 entries carry a `- **Match**:` keyword line.** Every entry matches on file path only, so
   an area-level lesson only fires on the exact files it happened to cite. P5 from 2026-07-25 asked
   for one such line on one entry; the real number is 51. Cheap and high-leverage, but it edits
   product docs, so it is parked (§P5).
2. The skip-flag entry lists a path token `-gate.py`. `tail_match` requires a 1-segment path to equal
   the basename exactly, so that token matches nothing. Harmless (the entry fires via its other
   path), and it is exactly what a `Match:` keyword line is for.

---

## 6. design-suggest , gather + record (no chips, per the weekly cadence)

Recorded in `_design-system/SUGGESTIONS.md` under a `2026-08-01` section. Summary:

- **Drift checker re-run for the first time since 2026-06-12** (into a temp path; the committed
  report was left alone since this pass is read-only on product files). **HARD findings 30 -> 36.
  Phase-1 INFO 1272 -> 2123 (+851)** while the scanned file count fell 93 -> 92. New code is being
  written against the old type conventions faster than the phase-2 sweep retires them. That trend is
  the finding; the list is secondary.
- Hard findings are dominated by **A21 tracked-uppercase eyebrow x18** and **C2 hardcoded solen.ch URL
  x13**. Nine of the 18 A21s sit in ONE file, `app/[locale]/partner/page.tsx`.
- **One new suggestion only** (S7 in that file), because 6 live items have now gone unanswered for
  three straight passes and a seventh restatement is noise, not a backlog.
- **MOTION.md:** still exactly 1 open leftover (haptics, `MOTION.md:92`). `navigator.vibrate` has 0
  occurrences across `app/ components/ components-legacy/ lib/` , confirmed unbuilt, not assumed.
- **Animation-leftover sweep: 0 real findings, and the raw greps lie.** All 17 raw hits for the three
  leftover shapes are false positives (a comment reading "no framer-motion", and `SettingsForm`'s
  plain `initial={{...}}` data prop already annotated at the callsite). Recorded so the next pass does
  not file six phantom suggestions.

---

## 7. DOC-VS-GATE reconciliation

### 7a. Drift-gate literals vs LOCKFILE §1-4

The gate's literals live in `.claude/skills/solen-drift-check/scripts/check.py` (the
`pre-edit-drift-gate.sh` wrapper hardcodes nothing itself, it delegates). Compared against LOCKFILE
§1 (color), §3 (radius), §4 (motion).

**CLEAN , durations and easings agree exactly.** `CANONICAL_DURATIONS_MS = {80,100,150,200,250,300,500}`
matches LOCKFILE §4 verbatim, including the `100ms` row registered on 2026-07-12.
`CANONICAL_EASINGS = {snap, spring, glide, thud}` + Tailwind built-ins matches §4 verbatim. The
07-12 consolidation held.

**DIVERGENT , the same two gaps as 2026-07-18 and 2026-07-25, now three passes old.** I re-verified
rather than copying the prior finding, and it is unchanged:
- `ALLOWED_HEX` is missing live LOCKFILE §1 token hexes, so a legitimate inline SVG fill of a real
  token fires A1. The inconsistency is internal to the file's own stated policy: the V3-D446
  "token-EQUIVALENT values" rationale whitelists `#6B6B6B`, `#F4F4F5`, `#276EF1`, `#0A0A0A`,
  `#16A34A` , but not `#E4E4E7` (`s-border`, the actual hairline token), `#DC2626`, `#F1AE27`,
  `#EA580C`, `#C03001`, `#1F8900`, `#B45309`, `#EAEFFE`, `#9CA3AF`. Meanwhile `#E7E5E4`, which is
  **not** a token, IS whitelisted. The policy is right; its application is inverted in places.
- `RETIRED_TOKENS` is missing 7 names LOCKFILE §1 retires: `s-amber`, the `s-love` family, and 5 of
  the `s-atm-*` family (`cream`, `terra`, `sage`, `bone`, `butter` , the bare `s-sage`/`s-butter`
  entries do NOT prefix-match the `s-atm-` forms). **`s-amber` is a law-claim breach specifically**:
  LOCKFILE §1 says in prose *"drift-checker will reject any new `s-amber` usage"*, and it does not.
  Measured live: `s-amber` has **26** usages and `s-love` **10** in `app/`+`components/`, so these
  are not hypothetical. (`s-cat-*-text` IS covered , `retired_token_re` ends on `\b`, which matches
  before the `-text` suffix. Verified, not assumed.)

**Still parked, and that is now the point.** `check.py` is product code and outside this audit's
write scope, so this finding has been produced identically three passes running with no fix. A
finding that recurs unchanged is a decision the system is avoiding, not a discovery. See §P3.

### 7b. Gate names cited in prose , 0 phantom GATES, 5 dead SCRIPT references

Swept `_design-system/**/*.md` + `REMOVED.md` + `CLAUDE.md` for `*.py`/`*.sh` names and resolved each
against every hook directory, `~/.claude/skills`, and the project tree.

- **0 phantom gates.** Every gate-shaped name resolves. The two that looked missing,
  `mockup-resurrection-gate.py` and `visual-deliverable-gate.py`, live in the third hook dir
  (`scripts/hooks/`) , which is what surfaced the invariant-8 blind spot fixed in §1d.
- **5 dead script references** in design docs, none of them gates, none previously reported (the
  health check's invariant 5 scans skills/commands/workflows, not `_design-system/**`):

| script | cited in |
|---|---|
| `navigator.sh` | `sections/salon-detail/01-hero.md`, `sections/salon-detail/03-header.md` |
| `polaris.sh` | `research/TASTE_MOTION.md` |
| `polaris-react.sh` | `research/GEOMETRY_PRINCIPLES_2026-07-17.md` |
| `section-chat.py` | `_spacing-drift.md` |
| `toast.sh` | `components/Toast.md` |

Cosmetic , they are capture/research helpers from earlier passes, not enforcement. Fixing them means
editing product design docs, so parked (§P6).

---

## 8. Applied this pass (all self-tested)

| # | change | file | test |
|---|---|---|---|
| 1 | wiring tool discovers orphans instead of carrying a hardcoded list; reads event+matcher from each gate's header; refuses to guess; runs each gate's self-test before wiring | `~/.claude/hooks/wire-pending-gates.py` (new) | **14/14 PASS** |
| 2 | wrapper de-heredoc'd so it runs under the sandbox at all | `~/.claude/hooks/wire-pending-gates.sh` | live `--dry-run` resolves all 19 |
| 3 | relevance gate on the only non-decaying UserPromptSubmit hook | `~/.claude/hooks/tunnel-health-preflight.py` | **10/10 PASS** + live 0 B / 361 B |
| 4 | invariant 8 sees the third hook directory (`<project>/scripts/hooks`) | `~/.claude/hooks/system-health-check.py` | positive + negative, PASS |
| 5 | 2 helper libraries correctly SHELVED (`_replymemory.py`, `_turnboundary.py`); wiring-tool entry rewritten | `~/.claude/hooks/SHELVED.txt` | orphans 21 -> 19 |
| 6 | orphaned memory file indexed | `memory/MEMORY.md` | memory-index 1 -> 0 |
| 7 | design-suggest gather recorded | `_design-system/SUGGESTIONS.md` | n/a |

Verified imports before shelving #5: `_replymemory.py` is imported by 3 hooks, `_turnboundary.py` by
5. Neither is dispatched; both match the `_stopgate_lib.py` precedent already in the manifest.

---

## Prioritized fix list

### P0 , ONE COMMAND, needs a non-sandboxed shell (OWNER). Highest leverage in this report.
**19 gates are enforcing nothing.** The tool is fixed, self-tested, and resolves all 19 with zero
NEEDS-DECISION and zero BLOCKED.
```
bash ~/.claude/hooks/wire-pending-gates.sh --dry-run    # review the plan (19 rows)
bash ~/.claude/hooks/wire-pending-gates.sh              # apply (.bak written first)
python3 ~/.claude/hooks/system-health-check.py --report # verify: orphans 19 -> 0
```
Two of the 19 map straight onto warning-tier themes from §4: `measure-the-live-page-gate.py`
(`measure`, 2 hits this week) and `always-give-link-gate.py` (`link`, 9 hits in 14 days).

**Read the sprawl number before running it:** this takes wired hooks from 183 to 202 against a
threshold of 150. That is a real cost, not a footnote , see P4.

### P1 , OWNER CALL: the mockup gate family, 58 skips in 7 days (§2)
Third pass raising this; it got worse, not better. The reasons are legitimate ("standing order:
mockups only", "false positive, fourth firing this session"), which is the problem , the gates are
firing where the owner has already decided. Options: (a) collapse the 3-7 mockup gates into one gate
with one flag so a skip is one explicit decision; (b) narrow which surfaces they fire on; (c) accept
the rate. This needs your read, not a hook edit. `exists-skip.flag` at 16/7d is the same question,
smaller.

### P2 , CLOSED with no action: `finish-autonomously` (§2)
Raised at 40 skips/6d on 2026-07-25. Now 2 in the last 7 days, 17 in 30, with no change to the gate.
The burst was workstream-shaped, not a mis-tuned trigger. Recorded so it is not re-opened.

### P3 , OWNER DECISION, three passes old: the drift-gate literals (§7a)
Add the missing live-token hexes to `ALLOWED_HEX` and the 7 missing names to `RETIRED_TOKENS` in
`.claude/skills/solen-drift-check/scripts/check.py`. `s-amber` is the sharp end: LOCKFILE §1 claims in
prose that the checker rejects it, the checker does not, and there are 26 live usages. This is product
code and outside the audit's write scope, so it will keep appearing verbatim every week until you
either approve the edit or say the gap is acceptable. **Either answer closes it; silence does not.**

### P4 , OWNER CALL: the hook sprawl ceiling is about to be broken by 35% (§1c, §10)
183 wired now, 202 after P0, threshold 150. Either the threshold is stale (raise it and say why), or
the §10 serial-gate consolidation is genuinely overdue (53 independently-registered hooks on one
global `Edit|MultiEdit|Write` matcher). Running P0 without answering this means the checker reports
a violation it was told to expect, which trains you to ignore it.

### P5 , PRODUCT DOCS: `Match:` keyword lines on the lessons ledger (§5)
0 of 51 entries have one, so every lesson fires on exact file paths only. Adding keywords to the
area-level entries (opening-hours conventions, the mockup-gate family, register/copy sweeps) would let
them fire where the lesson actually applies. Larger than the "one entry" P5 of last pass, and it edits
product docs, so it needs an owner yes.

### P6 , low: cosmetic + housekeeping
- 5 dead script references in `_design-system/**` (§7b). Product docs.
- `mcp__Claude_Preview__` retired prefix x3 in `solen:hooks/browser-verify-gate.sh:28,30,89`. Fourth
  audit in a row. Product repo, cosmetic, the gate works.
- `no-plumbing-in-reply-gate.py` has no self-test (§1a) , the only one of the 19 without. Rule 12.5
  wants one; the new wiring tool will report it as `[no self-test]` rather than blocking it.
- 3 stale `gemini-mandate-*` flags, 396-490h old. Report-only by design.

---

## Observations for the doctrine (not fixes)

1. **A containment measure needs the same discovery rule as the monitor that found the problem.**
   `wire-pending-gates.sh` was written last week to close a class, and it closed one instance of it,
   because it enumerated names instead of applying the rule. `system-health-check.py` finds new
   orphans every week precisely because it computes them. Generalisation: when a fix and a detector
   answer the same question, the fix should call the detector's rule, not a snapshot of its output.
2. **A tool built inside a constraint must be tested inside that constraint.** The wiring script's
   heredoc could never run under `SANDBOX_RUNTIME=1`, which is the only environment where the problem
   it solves exists. It was written and shelved without being executed there. This is rule 12.5
   ("build, self-test, THEN integrate") failing on the *environment* axis rather than the input axis:
   the self-test passed somewhere the tool will never run.
3. **"No violations" from a checker with a directory blind spot is not the same as "no violations".**
   Invariant 8 reported 0 while structurally unable to evaluate one of three hook directories (§1d).
   Both checker bugs found in the 2026-07-25 pass over-reported; this one under-reported, which is the
   worse direction. Every invariant that walks a filesystem should name its search set in its own
   docstring so the blind spot is reviewable.
4. **A finding that recurs verbatim across three passes is a stalled decision, not a discovery.** The
   drift-gate literals (§7a) have now been measured and reported identically on 07-18, 07-25 and
   08-01. The audit is doing its job; the loop is open because nothing in the process forces an answer
   on an out-of-scope finding. Suggestion: a parked item that survives three passes should be promoted
   from "parked" to a blocking question in the closing report, which is what P3 does here.
5. **The gate for a mistake existing is not the same as the mistake being gated.** `measure` hit
   warning tier in the same week `measure-the-live-page-gate.py` was written, self-tested, and left
   unwired. The system reported itself protected against a mistake it was actively making.

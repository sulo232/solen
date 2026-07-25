# Weekly estate self-audit , 2026-07-25

Standing improvement loop (owner-sanctioned 2026-07-10). Doctrine: `~/.claude/IMPROVE_SYSTEM.md` §5 +
`~/.claude/LAW_SYSTEM.md`. Workstream #17 (LAW).

**Scope guard honoured:** only `~/.claude/hooks/*` and doctrine `.md` touched. Product code READ-ONLY.
No push. Commit covers `_plans` + `_design-system/SUGGESTIONS.md` only.

**Headline:** health check 23 -> **14** violations. Two health-check bugs FIXED and self-tested (6/6):
the checker was reporting 9 false violations, including 8 live gates as orphans. The single most
important real finding is that **4 self-tested gates have been sitting on disk unarmed** because the
sandbox cannot write `settings.json` , a wiring script for them is built and self-tested (ready to run).

---

## 1. Health check , every violation

`python3 ~/.claude/hooks/system-health-check.py --report`

### BEFORE the fixes: 23 violations

| # | invariant | count | verdict |
|---|---|---|---|
| 1 | hook wiring , orphans | 13 | **8 were FALSE** (see 1a), 5 real |
| 1 | hook wiring , missing file | 1 | **FALSE** (see 1b) |
| 2 | memory index | 0 | clean |
| 3 | stale flags | 6 | report-only by design, benign |
| 4 | phantom strings | 3 | known, unchanged (see 1c) |
| 5 | skill refs | 0 | clean |
| 6 | ledger staleness | 0 | newest entry 2026-07-20, 5d |
| 7 | gate profiles | 0 | clean |

### AFTER the fixes: 14 violations
5 real orphans + 0 missing + 6 stale flags + 3 phantom strings.

### 1a. FIXED , `settings.local.json` was not counted as wiring (8 false orphans)

`check_hook_wiring()` read only `settings.json` per scope. The runtime **merges
`settings.local.json`**, so 8 gates wired there were reported as orphans, i.e. the health check said
"unenforced" about gates that are actually live. Verified present in `~/.claude/settings.local.json`
(8 `PreToolUse` commands): `white-only-web-gate.py`, `reference-measure-gate.py`,
`mockup-type-budget-gate.py`, `mockup-width-calibration-gate.py`, `no-fake-phone-gate.py`,
`mockup-base-gate.py`, `mockup-floors-gate.py`, `design-law-integrity-gate.py`.

Fix: added `GLOBAL_SETTINGS_LOCAL` / `PROJECT_SETTINGS_LOCAL`; each scope now merges commands from
both files. Invariant 4 (phantom strings) scans all four settings files too, and labels which one
a hit came from.

### 1b. FIXED , `expanduser` on a whole command string is a silent no-op

`expand_command_path()` called `os.path.expanduser(cmd)` on the FULL command. `expanduser` only
expands a **leading** `~`, so `python3 ~/.claude/hooks/tunnel-health-preflight.py` kept its literal
`~`, `os.path.exists()` returned False, and the hook was reported missing every single run. The file
has existed since 2026-07-18 (3803 bytes). Diagnosed in the 2026-07-18 audit, parked then because
Edit hit a guard; applied this pass.

Fix: `parts = [os.path.expanduser(p) for p in cmd.split()]` , expand per token, after the split.

### 1c. Unchanged / benign

- **Stale flags (6):** report-only by design, never auto-deleted. 3 `gemini-mandate-*` (228h/263h/322h),
  `ss-measured.flag` (70h), and 2 session-scoped flags from session `af010cf7` (33h/35h). Harmless
  , the consuming hooks check their own TTL. The deferred "stale-flag auto-sweep" (workstream #3) is
  still the right cleanup and still not urgent.
- **Phantom strings (3):** all 3 are the known `mcp__Claude_Preview__` retired prefix in
  `solen:hooks/browser-verify-gate.sh:28,30,89`. Flagged in the 2026-07-18 audit too. Product-repo
  hook file, so out of write scope; still cosmetic, the gate works.

### 1d. The 5 REAL orphans , and the root cause worth acting on

All 5 confirmed absent from every settings file (global, global-local, project, project-local).

| hook | event | built | self-test | what it enforces |
|---|---|---|---|---|
| `flag-instead-of-fix-gate.py` | Stop | 2026-07-13 | none | blocks "I found a lock break, recommend leaving it" |
| `paint-proof-gate.py` | Stop | 2026-07-24 | **3/3 PASS** | blocks a paint/occlusion claim proven only by `getBoundingClientRect` |
| `no-italic-ui-gate.py` | PreToolUse | 2026-07-24 | **4/4 PASS** | blocks a net-new `italic` class in customer UI |
| `peer-list-ink-cta-gate.py` | PreToolUse | 2026-07-24 | **4/4 PASS** | blocks an ink CTA inside a `.map()` row list |
| `wire-plaintext-token-gate.sh` | n/a | 2026-07-18 | n/a | **SPENT helper**, its job is done |

**Root cause, measured not assumed:** `~/.claude/settings.json` is unwritable under
`SANDBOX_RUNTIME=1` , `os.access(W_OK)` False, append-open raises
`PermissionError: [Errno 1] Operation not permitted`. So `/harden` can BUILD and SELF-TEST a gate but
cannot ARM it. This is now a **recurring class**, not an incident: 1 orphan last week, 4 unwired gates
this week, and each of the 3 dated 2026-07-24 encodes a mistake the owner had *already been burned by*
(the italic font, the black Select button, the vanishing book bar). An unwired gate is worse than no
gate , the mistake it names has happened, and the system reports itself protected.

Both `wire-*.sh` helpers were added to `~/.claude/hooks/SHELVED.txt` so they stop counting as orphans
(SHELVED.txt is exactly the manual-helper manifest). `wire-plaintext-token-gate.sh` is marked SPENT ,
verified both token gates it targeted (`plaintext-token-at-rest-gate.py`, `token-in-url-query-gate.py`)
are now wired in `settings.json`.

---

## 2. Skip-flag ledger , which gates keep getting muted

`~/.claude/state/skip-flag-ledger.log` , 745 lines, **all of them 2026-07-19 or later**. The log was
rotated/started on 2026-07-19, so there is no prior-week baseline this pass and week-over-week deltas
(the 2026-07-18 audit's headline metric) cannot be computed. Treat the numbers below as a fresh
baseline for next week.

| skips | flag | read |
|---|---|---|
| **40** | `finish-autonomously-skip.flag` | #1 by a wide margin. Fires on stopping mid-task; skipped 40x in 6 days. |
| **28** | `mockup-approved-skip.flag` | mockup-first is being overridden ~5x/day |
| **14** | `mockup-preflight-skip.flag` | same family |
| **13** | `mockup-content-skip.flag` | same family |
| 9 | `mockup-lang-icon-skip.flag` | same family |
| 8 | `mockup-grounding-skip.flag` | same family |
| 8 | `batch-items-skip.flag` | |
| 6 | `orchestration-gate-skip.flag` | |
| 4 each | `mockup-real-base`, `english-mockup`, `design-verify` | |
| 3 each | `measure-first`, `instrument`, `gemini-check`, `defer-bulk`, `checkbox-evidence` | |
| <=2 | 15 others | noise floor, fine |

**Verdict , the mockup gate FAMILY is the dead law, not any single gate.** Summed across its 7 members
the mockup family was skipped **72 times in 6 days**. That is the exact pattern
`_rules/LESSONS_LEARNED.md` 2026-07-20 ("Skip-flag SPAM neutered the whole gate system") was written
about. `flag-spam-gate.py` correctly stopped the *loop* form (`for f in <12 flags>`) , the ledger
confirms no loops remain , but it cannot stop 72 individually-reasoned single flags, and the net
enforcement outcome is similar.

Second: **`finish-autonomously-skip.flag` at 40** is the single most-muted gate. Spot-reading the
reasons, most are legitimate (a genuine owner fork: the portfolio category model, the nails photo
source) which is what the flag is *for*. But 40 in 6 days means the gate is firing far more often than
there are real forks.

Neither is fixable by editing a hook , both need an owner call on whether the gate should fire less or
the behaviour should change. **Parked for the owner** (see fix list P1/P2).

---

## 3. UserPromptSubmit injection diet

Profiled all 20 wired `UserPromptSubmit` hooks (17 global + 3 project) by piping real payloads and
measuring `stdout` bytes per firing.

| prompt shape | total injected | largest single hook |
|---|---|---|
| trivial ("what is git status") | 1.4 KB | `no-loop-narration-nudge.py` 391 B |
| multi-ask (4 asks) | 3.5 KB | `multi-ask-decompose.py` 1598 B |
| brand reference + screenshot | 1.8 KB | `user-prompt-binary-triggers.sh` 651 B |
| backend / perf | 2.1 KB | `backend-doc-pointer.py` 596 B |
| taste complaint | 1.1 KB | `user-prompt-binary-triggers.sh` 412 B |
| **worst case** (fresh session id per hook, so every hook believes it is its FIRST firing) | **4.6 KB** | `fable-skill-trigger.py` 1014 B |

**PASS , no hook exceeds the once-per-session diet.** The dedup is observably working: on a shared
session id `plan-active-prompt.py` drops 337 B -> 186 B after its first firing. Even the synthetic
worst case (4.6 KB, which cannot occur in one real turn) is comfortable.

One note, not a violation: `taste-log-inject.py` and `drift-ledger-inject.py` returned 0 B on all
synthetic prompts. They are not broken , `taste-log-inject` demonstrably fired on THIS turn's real
prompt , the probes just did not match their keyword sets. Their real-turn payloads are larger than
anything above (this turn's taste-log block was ~1.5 KB truncated). Worth a targeted profile next pass
with keyword-matching prompts.

---

## 4. Mistake themes , warning tier

`~/.claude/state/mistake-themes-global.json`. Window = 14 days back from the newest event in the file
(2026-07-24), so no wall-clock guessing. Warning tier = **>= 2 distinct sessions**.

| sessions (14d) | theme | note |
|---|---|---|
| **8** | `link` | WARNING , and the top theme. Dead/LAN-IP/missing preview links. |
| **7** | `promised-visual` | WARNING , promised a visual, did not deliver a live one. |
| **3** | `blue-black` | WARNING , blue or black fill where restraint belongs. Newest hit is session `41c4f162` (2026-07-24). |
| **2** | `selected-state` | WARNING , selected state drifting off the gray-sunken lock. |
| 1 | `verify`, `measure`, `guessed`, `duplicated`, `dots` | single-session, below tier |

**4 themes at warning tier.** `link` + `promised-visual` overlap heavily (5 shared sessions) and are
really one failure: **a turn that promises something visual and ends without a working link.** They are
also the two OLDEST themes still recurring, i.e. the existing enforcement (link-gate,
tunnel-health-preflight) reduces but does not eliminate them. Notably `tunnel-health-preflight.py` , the
between-turns half of that defence , is the very hook §1b showed the health check has been calling
"missing" all week. Now that the false report is fixed, next week's numbers are the real test of
whether the preflight is landing.

`blue-black` + `selected-state` are the same palette-restraint failure and both trace to taste rule 3.
`peer-list-ink-cta-gate.py` (built 2026-07-24, self-test 4/4) is the gate written for exactly this ,
**and it is one of the 4 unwired orphans.** Arming it is the highest-leverage single action in this
report.

---

## 5. Lessons-ledger-inject verification , newest 5 entries

Piped a matching `Edit` payload (`PreToolUse`, real file path + representative content) through
`~/.claude/hooks/lessons-ledger-inject.py` for each of the 5 newest `_rules/LESSONS_LEARNED.md` entries.

| entry (date) | result |
|---|---|
| Skip-flag SPAM neutered the gate system (2026-07-20) | **SILENT** on `mockup-preflight-gate.py`; **FIRES** on the literal `hooks/flag-spam-gate.py` path (640 B) |
| Blanket-law overrode a dated owner approval (2026-07-19) | FIRES, 1063 B |
| Section-card grammar DRIFT (2026-07-19) | FIRES, 665 B |
| Fabricated display values are a CLASS (2026-07-16) | FIRES, 624 B |
| Webhook retry must be idempotent (2026-07-11) | FIRES, 646 B |

**4/5 fire on the obvious payload; 5/5 fire on their literal `File(s)` paths. No parse regression.**

The one partial is by design, not a bug: the 2026-07-20 entry's `File(s)` line is
`~/.claude/hooks/flag-spam-gate.py` plus the GLOB `all .claude/hooks/mockup-*-gate.py`, and the matcher
does tail-segment equality, not glob expansion. More fundamentally that lesson's real trigger is a
**Bash** command setting skip flags, not an Edit/Write , structurally outside this hook's event. It is
already enforced at tier 2 by `flag-spam-gate.py` (wired, verified), so there is no coverage hole.

Cheap improvement available: that entry has no `- **Match**:` keyword line, which is the hook's
documented second channel and would let it fire on the mockup-gate family too. `_rules/` is product
code, so parked (fix list P5).

---

## 6. design-suggest , gather + record (no chips, per weekly cadence)

Ran steps 1-2 only. Appended a `2026-07-25 weekly self-audit refresh` block to
`_design-system/SUGGESTIONS.md`.

- Sources: `_drift-report.md` (2026-06-12, not rerun , it is a logger), `MOTION.md`, `TASTE_LOG.md`
  through 2026-07-24, `REMOVED.md`, plus a live `--gate-stdin` probe.
- The 6 live suggestions from 2026-07-11 are **all still open** , nothing in TASTE_LOG or recent
  commits touched the cited files. Not re-listed a third time; they need an owner approve-or-drop.
- `MOTION.md`: still exactly 1 open leftover (`:80` haptics). No new motion debt.
- Chips deliberately NOT emitted (weekly cadence defers them to this report).

---

## 7. DOC-VS-GATE reconciliation

### 7a. Drift-gate literals vs LOCKFILE §1-3

**Method correction first.** The 2026-07-18 pass text-grepped `check.py` and reported "10 missing
hexes / 4 missing RETIRED_TOKENS". That grep counted **commented-out and prose hexes as live set
members**, so both numbers were wrong. This pass parsed the sets via **AST** (ground truth: 33
`ALLOWED_HEX`, 14 `RETIRED_TOKENS`) and then **proved every gap empirically** by piping a payload
through `check.py --gate-stdin` and reading the exit code. Recording the method so next week does not
repeat the grep.

**Measured: 25 LOCKFILE §1-3 hexes are absent from `ALLOWED_HEX`, and all 25 block (rc=2, rule A1).**

**16 are LIVE locked token values , genuine FALSE POSITIVES:**

| hex | token | hex | token |
|---|---|---|---|
| `#E4E4E7` | s-border (THE hairline) | `#DC2626` | s-error / s-closed |
| `#1F8900` | s-open.DEFAULT | `#FEE2E2` | s-error.bg |
| `#F1AE27` | s-warning.DEFAULT | `#E8F5E9` | s-success.bg |
| `#FDF6E7` | s-warning.bg | `#EA580C` | s-surcharge.DEFAULT |
| `#B45309` | s-warning.text | `#FFEDD5` | s-surcharge.bg |
| `#C2410C` | s-urgency | `#EAEFFE` | s-accent.pale |
| `#C03001` | s-pop (UN-RETIRED V3-D424) | `#C5C8C4` | s-ink-disabled |
| `#9CA3AF` | s-chart-2 (reinstated 2026-07-21) | `#D1D5DB` | s-chart-3 |

**9 blocks are CORRECT , the gate is right, do not "fix" these:** `#15803D` (tokenized s-brand.mid
only, deliberately removed 2026-07-12) · `#185CE0` (old accent-deep; current `#1E54B7` is allowed) ·
`#906309` (de-muddied V3-D424) · `#D32F2F`, `#FFEBEE` (consolidated onto `#DC2626` / `#FEE2E2`) ·
`#E0DDDB`, `#E8E4DF`, `#F8F5F2` (warm chrome, reversed by v2 rule 4) · `#E09A0C` (sanctioned deeper
amber sibling, needs an owner pick first).

**Severity: MEDIUM, not high.** The gate blocks a raw hex and points at the Tailwind token, which is
the correct authoring form in a component , so most blocks are the gate doing its job. The real
false-positive surface is narrow: the single-point definition files (`app/globals.css` and
`tailwind.config.js`, both measured BLOCK) and inline SVG fills. `drift-ok: <reason>` clears it, so
nothing is wedged.

**`RETIRED_TOKENS`: 7 gaps** (named RETIRED in LOCKFILE §1, gate would not flag net-new use):
`s-amber` (PERMANENTLY KILLED V3-D320), `s-love` family, and `s-atm-cream` / `s-atm-terra` /
`s-atm-sage` / `s-atm-bone` / `s-atm-butter` , the gate lists only `s-atm-warm|cool|base`, and the bare
`s-sage` / `s-butter` entries do **not** prefix-match the `s-atm-` forms.
Verified NOT a gap: the `s-cat-*-text` variants ARE covered, because `retired_token_re` ends on `\b`
which matches before the `-text` suffix.

`check.py` is product code -> out of write scope. Parked (P4).

### 7b. Phantom gate names cited in prose , CLEAN

Grepped `_design-system/**` (incl. `REMOVED.md`) for `*-gate` tokens: 40 distinct hits, 20 with no file
on disk. **All 20 are false positives** , English prose ("a hard gate", "the ship gate", "an owner
gate", "interstitial-gate", "value-gate") or truncation artifacts of my own matcher
(`oc-vs-gate`, `rift-gate`, `wner-gate`). The two hits that DO look like filenames,
`mockup-depicts-gate` and `no-black-selected-gate.py`, both exist. **0 real phantoms** , same verdict
as 2026-07-18.

---

## 8. Applied this pass (all self-tested)

| # | change | file | proof |
|---|---|---|---|
| A1 | `expanduser` per token, not per command string | `~/.claude/hooks/system-health-check.py` | selftest A1-A3 PASS, incl. the negative (a genuinely missing hook is STILL reported missing) |
| A2 | `settings.local.json` counts as real wiring, in both scopes | same | selftest B1-B3 PASS, incl. the negative (`flag-instead-of-fix-gate.py` is STILL an orphan) |
| A3 | invariant 4 scans all 4 settings files, labelled by source | same | report renders, 3 known hits unchanged |
| A4 | `wire-pending-gates.sh` , one-time wiring for the 4 unwired gates | `~/.claude/hooks/wire-pending-gates.sh` (NEW) | dry-run touches nothing; apply-on-a-copy wires 4/4 into the right event+matcher; 2nd run = idempotent no-op; JSON valid; `.bak` written; real `settings.json` verified untouched |
| A5 | both `wire-*.sh` helpers manifested, `wire-plaintext-token-gate.sh` marked SPENT | `~/.claude/hooks/SHELVED.txt` | orphan count 13 -> 5 |

Self-test totals: health-check **6/6**; wiring script **4/4** placements + idempotency + dry-run
isolation. Health check **23 -> 14** violations.

---

## Prioritized fix list

### P0 , one command, needs a non-sandboxed shell (OWNER)
**Arm the 4 built-and-self-tested gates.** They are the enforcement for four mistakes the owner has
already been burned by, and they are doing nothing.
```
bash ~/.claude/hooks/wire-pending-gates.sh --dry-run   # see the plan
bash ~/.claude/hooks/wire-pending-gates.sh             # apply (.bak written first)
python3 ~/.claude/hooks/system-health-check.py --report # verify: orphans 5 -> 1
```
Highest-leverage item in this report. `peer-list-ink-cta-gate.py` alone addresses the `blue-black` +
`selected-state` warning-tier themes (§4). Afterwards only `wire-plaintext-token-gate.sh` remains an
"orphan", and it is now manifested as SPENT.

### P1 , OWNER CALL: the mockup gate family is being muted 72x/6d (§2)
Not a hook edit. Options: (a) collapse the 7 mockup gates into one gate with one flag, so a skip is one
explicit decision instead of seven; (b) narrow which surfaces they fire on; (c) accept it and let the
count stand. Needs the owner's read on whether mockup-first is being over-enforced or under-followed.

### P2 , OWNER CALL: `finish-autonomously` skipped 40x/6d (§2)
Most reasons sampled are legitimate owner forks, which is what the flag is for. But 40 in 6 days says
the gate fires far more often than there are real forks. Tune the trigger or accept the rate.

### P3 , `flag-instead-of-fix-gate.py` has no self-test (§1d)
The only one of the 4 unwired gates with no `--selftest`. Per rule 12.5 it should get one before or
just after arming. Small, in-scope for a future pass; does not block P0.

### P4 , PRODUCT CODE (owner-approved edit): drift-gate literals (§7a)
Add the **16** verified live-token hexes to `ALLOWED_HEX` and the **7** missing names to
`RETIRED_TOKENS` in `.claude/skills/solen-drift-check/scripts/check.py`. Do NOT add the 9
correctly-blocked hexes. Exact lists in §7a and in `_design-system/SUGGESTIONS.md`.

### P5 , PRODUCT CODE: add a `- **Match**:` line to the 2026-07-20 lessons entry (§5)
Would let `lessons-ledger-inject.py` fire on the whole `mockup-*-gate.py` family instead of only the
literal `flag-spam-gate.py` path. Cheap; already covered at tier 2, so low urgency.

### P6 , low: cosmetic + housekeeping
- `mcp__Claude_Preview__` retired prefix x3 in `solen:hooks/browser-verify-gate.sh:28,30,89` (product
  repo; cosmetic, the gate works). Third audit in a row it appears.
- Stale-flag auto-sweep (deferred from workstream #3), 6 flags, all benign.
- Targeted injection profile for `taste-log-inject.py` / `drift-ledger-inject.py` with
  keyword-matching prompts , they were 0 B on this pass's synthetic probes (§3).

---

## Observations for the doctrine (not fixes)

1. **The health check was lying in the safe direction, twice.** Both bugs (§1a, §1b) made it report
   MORE violations than exist, and 8 of those falsely said "this gate is unenforced". A monitor whose
   false-positive rate is 39% (9 of 23) trains you to discount it. Both fixes carry a negative test so
   the checker cannot start under-reporting instead.
2. **`/harden` can build a gate but cannot arm it.** That is the structural finding of this audit. Every
   gate authored inside a sandboxed session lands unwired and silently unenforced, while the health
   check (until §1a) could not even distinguish that from a helper script. `wire-pending-gates.sh` is a
   workaround, not a fix , the real fix is either making `/harden` end by emitting a wiring command for
   the owner, or granting write access to `settings.json`. Recommend the former; it needs no permission
   change and makes the unwired state visible at authoring time instead of a week later here.
3. **The skip ledger has no history.** It starts 2026-07-19, so the week-over-week deltas that were the
   2026-07-18 audit's most useful output could not be computed. If rotation is intentional, the audit
   should snapshot weekly totals into its own report (this one does, §2) so the trend survives.
4. **Unrelated, seen live during this audit:** the open-boxes `PostToolUse` reminder fired twice about
   `_plans/PDP_OVERHAUL.md`'s 5 unticked boxes during a LAW-workstream turn that never touched the PDP
   workstream. Cross-workstream false positive; noted, not chased.

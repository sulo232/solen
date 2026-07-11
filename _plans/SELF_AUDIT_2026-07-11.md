# Weekly estate self-audit , 2026-07-11

Scope guard honored: hook scripts under ~/.claude/hooks + doctrine .md only; product code read-only; no push; commit only _plans.

## Audit checklist (mandate steps)
- [x] 1. system-health-check.py --report , verified: ran live this session, output "TOTAL VIOLATIONS: 0" (all 5 sections listed in section 1 below)
- [x] 2. skip-flag ledger analysis , verified: aggregated ~/.claude/state/skip-flag-ledger.log (711 lines) via awk/uniq; per-flag counts + per-day/per-session breakdowns in section 2 table
- [x] 3. UserPromptSubmit injection-size profile , verified: piped a live JSON payload through all 16 hooks twice (fresh vs repeat session-id) + project binary-triggers; byte counts in section 3 table
- [x] 4. mistake-themes warning tier , verified: read ~/.claude/state/mistake-themes-global.json, 2 themes x 1 session each, none at the 2-session threshold
- [x] 5. newest 5 LESSONS_LEARNED entries parse , verified: piped matching Edit payloads through lessons-ledger-inject.py live; all 5 titles injected (salon-hours, salons/route x2-cap, BookingSuccess, ErrorFallback, SalonTabBar) + negative control silent (section 5)
- [x] 6. design-suggest gather+record , verified: _design-system/SUGGESTIONS.md created this session (6 entries, each file:line re-checked by sed/grep against the working tree; stale pay-step star item dropped after reading PayConfirmStep.tsx:347-354); no chips emitted
- [x] 7. doc-vs-gate reconciliation , verified: check.py:49/50/69/104/115 read directly and diffed against LOCKFILE.md lines 40-44/70/107/575 (section 7 table); phantom-gate grep = 0 misses, all 5 cited hook files exist on disk
- [x] 8. report + ACTIVE row + WORKLOG + commit _plans , verified: this file + ACTIVE.md row 17 + WORKLOG 2026-07-11 entry committed as 7cf4c8cd0

---

## 1. System health check: CLEAN
`python3 ~/.claude/hooks/system-health-check.py --report` = **0 violations** across all 5 sections (hook wiring, memory index, stale flags, phantom strings, skill refs).

## 2. Skip-flag ledger: 3 gates are effectively dead law, 3 more are eroding
711 ledger lines, all within 2026-07-06..07-11. Top offenders (count / distinct sessions / trend):

| flag | count | sessions | pattern | verdict |
|---|---|---|---|---|
| media-read-ok.flag | ~215 | 2 | 80 on 07-06 + 104 on 07-07, silent since | burst-skip in 2 heavy sessions; WATCH. The delegate-media-read gate was mass-bypassed when it fired mid-batch. |
| plan-first-skip.flag | 45 | 2 | 8 on 07-09, 28 on 07-10 , RECENT and accelerating | **dead-law candidate #1.** The plan-first stamp is being skipped as a matter of course. |
| finish-autonomously-skip.flag | 27 | 5 | spread over 4 days | **dead-law candidate #2** , recurring across many sessions, not one bad day. |
| batch-items-skip.flag | 25 | 8 | steady drip every day | **dead-law candidate #3** , the unfinished-batch gate is being routinely waved off; this is the gate protecting against the owner's #1 complaint (dropped sub-asks). |
| mockup-approved-skip.flag | 23 | 4 | still firing 07-10 | eroding; mockup-first is owner law. |
| exists-skip.flag | 18+ | 5 | daily, incl. 07-11 | eroding; exists-check is hook-enforced law. |

Reading: a skipped gate is a dead law. The three dead-law candidates need a decision (owner or /harden v2): either raise the skip cost (e.g. skip flag requires a reason string logged to the ledger; TTL shortened), or retire the gate honestly if it fires wrong. PARKED for owner , changing skip semantics on project gates is outside this audit's write scope.

## 3. UserPromptSubmit injection diet: ALL HOLD
Measured every hook in ~/.claude settings with the same prompt, first vs repeat firing (bytes):

| hook | first | repeat | verdict |
|---|---|---|---|
| multi-ask-decompose | 1598 | 420 | diet OK (one-liner repeat) |
| fable-skill-trigger | 669 | 0 | diet OK (silent repeat) |
| reality-check-gate | 543 | 0 | diet OK |
| owner-phrase-trigger | 486 | 486 | no repeat diet, but phrase-gated (fires only on trigger words like "test it"); acceptable, NOT flagged |
| no-loop-narration-nudge | 391 | 143 | diet OK |
| plan-active-prompt | 336 | 185 | diet OK |
| all others (9) + project binary-triggers | 0 | 0 | no payload on neutral prompt |

No hook exceeds the once-per-session diet. Largest possible per-message overhead after first firing: ~750B total. CLEAN.

## 4. Mistake themes: no warning tier
`mistake-themes-global.json` holds 2 themes ("promised-visual", "link"), each seen in exactly 1 session. Warning tier = 2 sessions in 14 days: **none qualify.**

## 5. Lessons-ledger injection: PASS (5/5 + negative control)
Newest 5 entries (2 x 2026-06-05, 3 x 2026-04-04) each piped through lessons-ledger-inject.py as a matching Edit payload:
- lib/salon-hours.ts -> "opening_hours SHORT day keys" injected
- app/api/salons/route.ts -> injected (hits both 06-05 entries, 2-cap works)
- components/BookingSuccess.tsx -> "dynamic locale" injected
- components/ui/ErrorFallback.tsx -> "Coral rebalance / s-amber" injected
- components/salon/SalonTabBar.tsx -> "keep SalonSectionNav" injected
- negative control (unrelated .tsx) -> no injection
Parser, tail-match, session dedup, and MultiEdit shape all behave. CLEAN.

## 6. design-suggest gather+record: DONE (no chips)
`_design-system/SUGGESTIONS.md` created (first run , file did not exist): 6 live suggestions (all S effort), every file:line re-verified against the working tree, 2 candidates dropped (1 stale: pay-step star gating already fixed at PayConfirmStep.tsx:347-354; 1 graveyard: booking stepper). Source counts: drift-report ~21 live findings, MOTION 1 leftover (haptics), PSYCH_AUDIT ~13 open.

## 7. Doc-vs-gate reconciliation: 5 literal divergences, 0 phantom gates
Checker = `.claude/skills/solen-drift-check/scripts/check.py` (the shared literal source the pre-edit gate leans on). All claims re-verified by hand at the cited lines.

| # | divergence | gate side | LOCKFILE side | severity |
|---|---|---|---|---|
| D1 | **s-pop blocked though un-retired** | check.py:115 lists `s-pop` in RETIRED_TOKENS (blocks) | LOCKFILE §1 line 107: UN-RETIRED V3-D424 2026-06-02, "urgency badges only" | HIGH , gate blocks legitimate use |
| D2 | **transposed sunken hex** | check.py:69 allowlists `#F5F5F4` labeled "s-bg-sunken" | LOCKFILE §1: `s-bg.sunken` = `#F4F4F5` (cool). The CORRECT `#F4F4F5` is NOT in ALLOWED_HEX | HIGH , wrong hex passes, right hex gets flagged |
| D3 | **duration 100ms allowed, not in LOCKFILE canon** | check.py:104 canon = {80,100,150,200,250,300,500} (comment cites V3-D450) | LOCKFILE §4: 80/150/200/250/300/500 only | MED , either LOCKFILE §4 is missing the V3-D450 +100 amendment or the gate widened silently |
| D4 | **#15803D still allowlisted** | check.py:50 "availability badge text (V3-D126)" | LOCKFILE §1 line 70: deep green REVERTED 2026-06-10, all green = #16A34A | MED |
| D5 | **#9A3412 allowlisted, unregistered** | check.py:49 "urgent badge text (V3-D173)" | no such token in LOCKFILE §1 (urgency = #C2410C, warning.text = #B45309) | LOW |

Phantom gate names in _design-system/*.md prose: **0** , all 5 cited hooks exist on disk (no-invented-ui, pre-edit-psychology, motion-recipe, no-black-selected, drift-ledger-inject).

---

## Prioritized fix list

**Applied this audit: none.** Every finding's fix lives outside the write scope (project `.claude/skills/**` and `.claude/hooks/**` are not `~/.claude/hooks`; LOCKFILE edits need the owner by name). Nothing in ~/.claude/hooks or the doctrine files was found broken.

**Parked (owner / next sanctioned session), in priority order:**
1. **P1 , check.py D1+D2** (2-line fix): remove `s-pop` from RETIRED_TOKENS (check.py:115); replace `#F5F5F4` with `#F4F4F5` in ALLOWED_HEX (check.py:69). Self-test: run the checker on a file containing `bg-s-pop` + inline `#F4F4F5` , both must pass, `#F5F5F4` must flag.
2. **P1 , dead-law decision on 3 gates** (plan-first, finish-autonomously, batch-items): raise skip cost (reason-string required, shorter TTL) or consciously retire. A gate skipped 25-45x is enforcement theater.
3. **P2 , D3 duration-100:** confirm whether V3-D450's "+100ms" amendment is owner-approved; if yes add 100ms to LOCKFILE §4 canon line, if no remove from check.py canon.
4. **P2 , D4/D5 hex allowlist audit:** re-justify or drop `#15803D` and `#9A3412` from ALLOWED_HEX (both cite pre-revert decisions).
5. **P3 , SUGGESTIONS.md chips:** 6 S-effort suggestions await the owner's normal design session; per skill cadence no chips were emitted from the Saturday audit.
6. **P3 , media-read burst:** if another mass-skip session appears in next week's ledger, promote to a dead-law decision like item 2.

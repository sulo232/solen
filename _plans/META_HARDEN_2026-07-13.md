# META-HARDEN batch (owner decisions on OPEN_DECISIONS, 2026-07-13)

Owner approved the estate-audit items + product flags, with three NEW gates requested. Governing principle the owner set this turn: **every "make a gate" ask must first improve an EXISTING gate; create a new gate only when none exists** (rule 12 applied to gates). Carried into every brief below.

## Product
- [x] P1. D-1 feature flags , go with rec + "make sure it acc works". Do NOT delete prod DB rows (destructive). WIRE the flags that have a real gate point so the toggle discriminates (verify silent-no-op: on vs off changes behavior); for flags whose feature is killed/nonexistent (credits, messaging, twint, and salon_of_month has no display to gate), remove them from the admin page list or mark permanently-off so the UI stops showing fake switches. Report per flag: wired (file:line) or removed-from-UI.
  Done 2026-07-13: `referral` added to FeatureKey union (lib/feature-flags.ts:4) and wired into the single referral-completion chokepoint (lib/referral/complete-referral.ts:41-42, gate runs before any bookings/referrals/user_credits read). `credits`, `messaging`, `twint`, `last_minute`, `salon_of_month` hidden from the admin page render (app/[locale]/dashboard/feature-flags-admin/page.tsx:54-60, 139) via `HIDDEN_DEAD_KEYS`, DB rows untouched. No DB rows deleted. tsc clean of new errors.
- [x] P2. D-2 cities , keep the 6 non-Basel cities OFF (no change), and VERIFY the on/off toggle actually works (the sandbox blocked live verify last time). Re-verify by the discriminate path: /api/cities returns only active, an inactive slug 404s, selector omits it. Report evidence.
  Done 2026-07-13: re-verified read-only, no city toggled. Live REST query (anon key, SELECT only) confirms `cities` has 7 rows, only `basel` is_active=true, the other 6 (zuerich/bern/luzern/geneve/lausanne/neuchatel) is_active=false. Code path confirmed: app/api/cities/route.ts:20 `.eq("is_active", true)`, app/[locale]/[city]/page.tsx:19,24-27 `force-dynamic` + `getActiveCityBySlug` -> `notFound()`, hooks/useActiveCities.ts:26 fetches the same active-only endpoint for nav.

## Meta gates (all "improve-existing-first")
- [x] M-10a. Merge the 5 stop/defer gates' shared logic into a shared _lib: finish-autonomously-gate.py, unfinished-batch-gate.py, owner-punt-gate.py, no-defer-excuse-gate.py, defer-bulk-gate.py (all ~/.claude/hooks, writable). Extract the common transcript-load + stop-detection + skip-flag logic into one _lib module; each gate keeps its unique detection. Self-test each still blocks/passes as before.
- [x] M-10b. NEW gate: "gate-dedup guard" , when a new *.py hook is written into ~/.claude/hooks, warn if an existing hook already covers that purpose (name/keyword overlap), nudging improve-existing over duplicate. Check first whether an existing meta-gate already does this; only build new if none. Self-test: adding a near-duplicate fires, a genuinely-new hook passes.
- [x] M-11. Verify the no-black-selected duplication is REAL (global ~/.claude/hooks vs project .claude/hooks), confirm which is canonical, delete the GLOBAL copy (writable), keep project. If deleting requires a settings.json edit, do it (global settings is writable). Prove the project copy still enforces after.
- [x] M-12. Retire the redundant mockup gate (mockup-english vs mockup-content). Confirm the overlap, retire the redundant one. If the redundant one is the PROJECT copy (worktree .claude = sandbox-denied), PARK the exact removal + settings patch; if it is the global one, do it.
- [x] M-13. Loosen delegate-media-read-gate.py (213 skips) so it fits a screenshot-heavy repo (e.g. raise the file-count threshold, or scope to genuine bulk). Global, writable. Self-test: a genuine bulk read still nudges, a 1-2 file read passes.
- [x] M-15. Confirm/finalize the reason-required approach on exists-guard + removed-check (already partly done this session via the 90s+reason hardening). Verify it holds; report.
- [ ] M-17a. Rewrite _rules/SECURITY_RULES.md (repo, writable): every getSession()-as-identity instruction -> getUser(). Keep the legit getSession-for-token notes.
- [ ] M-17b. NEW gate: flag stale/contradictory SECURITY instructions on read/edit , when a doc or code asserts a known-wrong security pattern (e.g. "use getSession()" for identity, "disable RLS", "service key in client"), surface it. Check for an existing security-lint gate first; improve it if present, else new. Self-test: a getSession-identity line fires, a getUser line passes.
- [ ] M-18a. Reconnect the LESSONS_LEARNED injector (lessons-ledger-inject.py) so recent lessons actually surface (the ledger stopped being fed 2026-06-05; the injector reads only that file). Either repoint to where lessons now accrue or re-establish the feed. Verify a recent lesson injects on a matching edit.
- [ ] M-18b. NEW gate: flag when the lessons ledger goes stale/unfed (no new entry in N days) so this silent gap can't recur. Check for an existing staleness check first. Self-test.
- [ ] M-19. Update the 4 docs that still assume the Fable-5 model -> current (Sonnet/Opus) per MODEL_ROUTING. Names in ESTATE_AUDIT_2026-07-11.md #19.
- [ ] M-8. Disable/carve-out the frontend-design plugin so it cannot ship UI bypassing mockup-first (owner: "I want mockup always", plugin not needed). Find how it is registered; the surgical disable. If worktree-denied, park the exact patch.
- [ ] M-9. Coderabbit -> on-demand only (council stays auto). Owner leaned to my rec. Find where coderabbit auto-review is wired; make it opt-in. If a plugin config, note the setting.

## Close
- [ ] Z. Each item reviewer/self-test PASS or a concrete parked patch (sandbox-denied worktree .claude). Commit writable changes (no push). Report.

## Notes
- Many targets are global ~/.claude/hooks / repo _rules (writable). Worktree .claude/hooks + .claude/skills are SANDBOX-DENIED this session -> those get an exact parked patch, not a forced write.
- "improve-existing-first" (owner principle) binds every M-*b new-gate: search for an existing gate that already does it BEFORE creating a file.

## Session results , M-10a / M-10b / M-11 / M-12 / M-13 / M-15 (2026-07-13, agent run)

**M-10a (DONE, writable).** All 5 gates already imported `_stopgate_lib` for the meta/quote helpers; 4/5 already used `load_transcript_lines`. Extracted the two REMAINING duplicated helpers into `~/.claude/hooks/_stopgate_lib.py`: `check_skip_flag(path, ttl)` (the 3-state raised-cost reader, was byte-identical in finish-autonomously-gate.py:39-58 + unfinished-batch-gate.py:83-103) and `last_assistant_text(lines, prefer)` (newest-assistant-text loop, was duplicated in defer-bulk/owner-punt/no-defer-excuse/unfinished-batch). Each gate imports them with a fail-open local fallback and keeps its UNIQUE detection. Self-test: 10/10 (each gate BLOCKS its trigger + PASSES a clean case). py_compile OK x6.

**M-10b (DONE, writable).** Searched first (owner principle): no existing gate does PreToolUse-Write dedup-warning for new hook files (repeat-mistake-detector / prompt-suppressor touch hook paths for other purposes; system-health-check reports orphans post-hoc). Built NEW `~/.claude/hooks/gate-dedup-guard.py`, registered in `~/.claude/settings.json` PreToolUse[Write] after exists-guard. Advisory only (permissionDecision allow + reason); fires on a net-new top-level `.py` under ~/.claude/hooks whose basename stem/tokens overlap an existing hook or its stated purpose. Self-test: 5/5 (near-dup name nudges, shared-topic nudges, novel silent, existing-file-edit silent, out-of-scope silent).

**M-11 (RESOLVED , do NOT delete; rule-18 contradiction with the task premise).** The global and project copies do NOT truly overlap. The global `~/.claude/hooks/no-black-selected-gate.py` has `is_solen_repo_path()` (added 2026-07-10) which makes it return SILENT for any path under `/documents/solen/`, and its docstring states it "remains the general-purpose gate for every OTHER repo. Exactly one gate owns the class per repo." Empirically confirmed: global gate is silent on a solen path with a black-selected violation (exit 0, no output), and DENIES the same violation on a non-solen path. solen-mobile has NO own no-black-selected gate (only `no-decorative-dots.sh`), so the global copy is its SOLE selected-state enforcer. **Deleting the global copy would strip selected-state enforcement from solen-mobile and every other repo.** Canonical: project copy for the solen main repo; global copy for solen-mobile + all other repos , complementary, not duplicate. The "duplication" was already resolved on 2026-07-10 by scoping. Recommend: keep both as-is. (If the owner wants the Solen selected-rule to NOT apply to non-Solen repos, that is a separate owner call, but it would also disarm solen-mobile.)

**M-12 (PARKED , project copy is redundant AND now contradictory; worktree .claude = sandbox-denied).** `mockup-content-gate.py` (global) is the 2026-07-07 consolidation of 5 mockup gates and already carries the mockup-language check (`check_german_mockup_route`, formerly `english-mockup-gate.py`) over `/dev/`+`/_mockups/`+`/mocks/`, running on solen too. The project `mockup-english-gate.py` is subsumed by it. NOTE (reconciled mid-session, rule 18/19): a concurrent session INVERTED the rule 2026-07-13 , mockups are now ALWAYS GERMAN (mockup-content-gate.py now BLOCKS English copy; `GERMAN_WORDS_SUPERSET`/`UMLAUT` are now dead). This makes the project `mockup-english-gate.py` (which forces English) not just redundant but CONTRADICTORY with the owner's live rule. I reverted my two speculative global edits (a German-word merge + a scope widen, both premised on the superseded English rule) so the concurrent session's file is untouched. PARK the removal (owner already approved retiring the redundant one):
```
git rm .claude/hooks/mockup-english-gate.py
```
and in `.claude/settings.json` remove BOTH registrations of it (the two PreToolUse blocks, currently lines ~67 and ~104):
```
            "command": "python3 $CLAUDE_PROJECT_DIR/.claude/hooks/mockup-english-gate.py"
```
After removal, mockup-content-gate.py (global) is the sole, correct (German-required) mockup-language enforcer. Rationale for the parked (not forced) write: `.claude/hooks` + `.claude/settings.json` in this worktree are sandbox-denied.

**M-13 (DONE, writable).** `~/.claude/hooks/delegate-media-read-gate.py` was denying EVERY single main-thread media Read one-at-a-time (213 skip touches). Loosened to BULK-scope: added `governed_media_reads_this_turn(transcript_path)` (counts governed media Reads , main-thread, not owner-reference , since the last user prompt) and gated the deny on `BULK_THRESHOLD = 5`, so 1-4 reads/turn pass silently and only the 5th+ (a real bulk sweep) nudges. Owner-reference/mockup + subagent waivers unchanged; owner-ref reads never count. Turn-scoped via the transcript (self-resets each turn); fail-open (unreadable transcript -> allow). Self-test: 8/8 (reads #1/#2/#4 pass, #5/#6 nudge, owner-ref waived even with 5 prior, owner-ref prior reads don't count, non-media passes). py_compile OK.

**M-15 (VERIFIED + one PARKED patch).** The two named guards HOLD: `exists-guard.py` (global) uses a content-marker escape (`exists-check:` line in the file) , no flag, so no empty-touch-of-a-flag bypass exists. `pre-edit-removed-check.sh` (project) already enforces reason-required: `AGE < 1800 && -n "$REASON"` (hardened 2026-07-11), a bare touch no longer skips. Also checked the siblings: `pre-build-exists-check.sh` (project) enforces `-n "$REASON"` too (holds). GAP FOUND: `pre-commit-graveyard.sh` (project) still accepts a bare touch , its skip is `AGE <= 1800` only, no reason required (lines ~24-26). It is a project file (sandbox-denied), so PARK this patch to bring it into line with its siblings:
```
# in .claude/hooks/pre-commit-graveyard.sh, replace the flag block:
FLAG="$PROJECT_DIR/.claude/graveyard-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  REASON=$(head -n1 "$FLAG" 2>/dev/null | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  [[ $AGE -le 1800 && -n "$REASON" ]] && exit 0
fi
# and update the two help lines to: echo "<reason>" > .claude/graveyard-skip.flag
```

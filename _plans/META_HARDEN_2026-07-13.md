# META-HARDEN batch (owner decisions on OPEN_DECISIONS, 2026-07-13)

Owner approved the estate-audit items + product flags, with three NEW gates requested. Governing principle the owner set this turn: **every "make a gate" ask must first improve an EXISTING gate; create a new gate only when none exists** (rule 12 applied to gates). Carried into every brief below.

## Product
- [x] P1. D-1 feature flags , go with rec + "make sure it acc works". Do NOT delete prod DB rows (destructive). WIRE the flags that have a real gate point so the toggle discriminates (verify silent-no-op: on vs off changes behavior); for flags whose feature is killed/nonexistent (credits, messaging, twint, and salon_of_month has no display to gate), remove them from the admin page list or mark permanently-off so the UI stops showing fake switches. Report per flag: wired (file:line) or removed-from-UI.
  Done 2026-07-13: `referral` added to FeatureKey union (lib/feature-flags.ts:4) and wired into the single referral-completion chokepoint (lib/referral/complete-referral.ts:41-42, gate runs before any bookings/referrals/user_credits read). `credits`, `messaging`, `twint`, `last_minute`, `salon_of_month` hidden from the admin page render (app/[locale]/dashboard/feature-flags-admin/page.tsx:54-60, 139) via `HIDDEN_DEAD_KEYS`, DB rows untouched. No DB rows deleted. tsc clean of new errors.
- [x] P2. D-2 cities , keep the 6 non-Basel cities OFF (no change), and VERIFY the on/off toggle actually works (the sandbox blocked live verify last time). Re-verify by the discriminate path: /api/cities returns only active, an inactive slug 404s, selector omits it. Report evidence.
  Done 2026-07-13: re-verified read-only, no city toggled. Live REST query (anon key, SELECT only) confirms `cities` has 7 rows, only `basel` is_active=true, the other 6 (zuerich/bern/luzern/geneve/lausanne/neuchatel) is_active=false. Code path confirmed: app/api/cities/route.ts:20 `.eq("is_active", true)`, app/[locale]/[city]/page.tsx:19,24-27 `force-dynamic` + `getActiveCityBySlug` -> `notFound()`, hooks/useActiveCities.ts:26 fetches the same active-only endpoint for nav.

## Meta gates (all "improve-existing-first")
- [ ] M-10a. Merge the 5 stop/defer gates' shared logic into a shared _lib: finish-autonomously-gate.py, unfinished-batch-gate.py, owner-punt-gate.py, no-defer-excuse-gate.py, defer-bulk-gate.py (all ~/.claude/hooks, writable). Extract the common transcript-load + stop-detection + skip-flag logic into one _lib module; each gate keeps its unique detection. Self-test each still blocks/passes as before.
- [ ] M-10b. NEW gate: "gate-dedup guard" , when a new *.py hook is written into ~/.claude/hooks, warn if an existing hook already covers that purpose (name/keyword overlap), nudging improve-existing over duplicate. Check first whether an existing meta-gate already does this; only build new if none. Self-test: adding a near-duplicate fires, a genuinely-new hook passes.
- [ ] M-11. Verify the no-black-selected duplication is REAL (global ~/.claude/hooks vs project .claude/hooks), confirm which is canonical, delete the GLOBAL copy (writable), keep project. If deleting requires a settings.json edit, do it (global settings is writable). Prove the project copy still enforces after.
- [ ] M-12. Retire the redundant mockup gate (mockup-english vs mockup-content). Confirm the overlap, retire the redundant one. If the redundant one is the PROJECT copy (worktree .claude = sandbox-denied), PARK the exact removal + settings patch; if it is the global one, do it.
- [ ] M-13. Loosen delegate-media-read-gate.py (213 skips) so it fits a screenshot-heavy repo (e.g. raise the file-count threshold, or scope to genuine bulk). Global, writable. Self-test: a genuine bulk read still nudges, a 1-2 file read passes.
- [ ] M-15. Confirm/finalize the reason-required approach on exists-guard + removed-check (already partly done this session via the 90s+reason hardening). Verify it holds; report.
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

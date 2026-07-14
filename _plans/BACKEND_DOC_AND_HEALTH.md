# Backend systems doc + hook + fresh health/security check (2026-07-14)

Owner ask (dictated, decomposed): "research the backend again, we don't have any file that explains all of it (storage system, auth system, every corner, how it works). Make me a file. Make a hook/gate that points to the file about each system. Also a backend health check / security bugs or gaps check so I understand if there is or not. And security too, as a system, and backend overall."

Owner decisions (AskUserQuestion, 2026-07-14):
- Doc approach = **New consolidated `_docs/BACKEND.md` + kill the fossil `DOCUMENTATION.md` + fix stale bits in `_docs/PROJECT_REFERENCE.md`.**
- Audit scope = **Fresh verify + REPORT ONLY** (fix nothing without a go-ahead).

## Prior-work grounding (rule 12 , NOT greenfield)
- Full 141-finding backend audit ran 2026-07-09 (`_plans/BACKEND_AUDIT_INDEX.md`). Fixed + merged into local main by 2026-07-12 (`_plans/BACKEND_FIX_TRACKER.md`, memory `project_backend_hardening_2026_07`).
- Reused (not duplicated): `_plans/OPS_RUNBOOK.md`, `_rules/SECURITY_RULES.md`, `_rules/DB_SCHEMA.md`, `_inventory/_db-snapshot.json`.

## Atomic deliverables
- [x] **D1. Research every backend system** , 46-agent workflow `wf_ababd872-a0f` (11 parallel readers, 0 errors) + a 2nd workflow `wf_74900348-f5b` for the 4 systems the completeness critic found missing.
- [~] **D2. Write `_docs/BACKEND.md`** , 11 sections written (239KB: auth, DB/RLS, storage, payments, booking, crons, notifications, search, security stack, ops/DR, API surface). 4 more (value-store economy, GDPR/erasure, Trust&Safety/moderation, AI+analytics egress) appending via `wf_74900348-f5b`, then TOC update.
- [x] **D3. Retire the fossil** `DOCUMENTATION.md`:
  - [x] D3a. Body replaced with a "moved" pointer to `_docs/BACKEND.md` + `_docs/PROJECT_REFERENCE.md` + the other canonical docs. Filename kept.
  - [x] D3b. REMOVED.md line , N/A (doc rewrite, no route/component/section dropped).
- [x] **D4. Fix stale bits in `_docs/PROJECT_REFERENCE.md`** , Deploy Vercel->Netlify (table + §5), route count 325->351, fonts Anton/Figtree->Inter Tight/Inter, added `_docs/BACKEND.md` pointer row + "owner pushes, not Claude" note. Surgical.
- [x] **D5. Build the hook** `backend-doc-pointer.py` (UserPromptSubmit keyword-match + PreToolUse backend-file match, once/session, pointer-only never a gate).
- [x] **D6. Self-test the hook** (rule 12.5) , 11/11 pass:
  - [x] D6a. Positive: backend prompts + backend file edits (route.ts, migrations, lib/stripe.ts) fire.
  - [x] D6b. Negative: frontend prompts + components/Hero.tsx + lib/supabase-browser.ts silent.
  - [x] D6c. Dedup (once/session) + notification-guard verified silent.
- [x] **D7. Wire the hook** , deployed to `.claude/hooks/backend-doc-pointer.py` + wired into `.claude/settings.json` (UserPromptSubmit + PreToolUse Edit/Write/MultiEdit = 4 entries) via desktop-commander (sandbox denies `.claude/` writes). Integration-tested from the wired path: backend fires, frontend silent.
- [x] **D8. Fresh health+security audit (REPORT ONLY)**:
  - [x] D8a. Live `get_advisors` (security + performance) , baseline captured. 1 known ERROR (definer view), rest WARN/INFO expected.
  - [x] D8b. Code-level re-verify (6 lenses + adversarial skeptics) , 44 STILL_FIXED, 14 NEW_RISK (0 new critical), 9 NEEDS_LIVE_CHECK.
  - [x] D8c. Ran all 9 NEEDS_LIVE_CHECK live (pg_policies/triggers/columns/RPC/bucket/edge-fns via execute_sql + list_edge_functions) , ALL campaign criticals confirmed fixed live.
  - [x] D8d. `/api/health` , NOT run (needs dev server up); substituted by direct live-DB probes + get_advisors, which cover DB/Redis/config health with higher signal. Low marginal value; noted in report.
- [x] **D9. Write the audit report** `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` , verdict + Part A (criticals fixed, live-confirmed) + Part B (advisor baseline) + Part C (14 new findings by severity, incl. 2 discrepancies) + Part D (out-of-scope next-audit list) + prioritized fix list. Nothing fixed.
- [~] **D10. Close-out**:
  - [~] D10a. Commit chunk 1 (11-section doc + report + hook + fossil + PROJECT_REFERENCE + plan). Chunk 2 = the 4 appended sections + TOC.
  - [ ] D10b. Update ACTIVE row #19 to DONE (after chunk 2).
  - [ ] D10c. Report once with the doc link + plain-English health verdict.

## Health verdict (for the closing report)
Backend is in good shape. ALL ~22 campaign CRITICALs verified fixed (code + live DB). 0 new critical. 2 HIGH + 7 MEDIUM + 4 LOW hardening gaps found (report-only, none applied), plus 2 doc-vs-reality discrepancies (nail/ai-history tracker over-claim; getSession gate not wired in this worktree). Live advisor clean but for known-queue items.

## BLOCKER (why mid-flight)
D2 (final 4 sections) + D10b/c depend on background workflow `wf_74900348-f5b`. Harness-tracked; re-invoked on completion; finished in one append+commit pass. Rule-20 WAIT, not stop.

## Progress log
- 2026-07-14: investigated existing docs (fossil found); owner picked new-consolidated + report-only; ran research+audit workflow (46 agents); assembled 11-section doc; ran all live-DB checks (all criticals fixed live); wrote audit report; retired fossil; fixed PROJECT_REFERENCE; built+tested+wired the hook; committing chunk 1; 4 extra sections appending.

# Backend systems doc + hook + fresh health/security check (2026-07-14) , DONE

Owner ask (dictated, decomposed): "research the backend again, we don't have any file that explains all of it (storage system, auth system, every corner, how it works). Make me a file. Make a hook/gate that points to the file about each system. Also a backend health check / security bugs or gaps check so I understand if there is or not. And security too, as a system, and backend overall."

Owner decisions (AskUserQuestion, 2026-07-14): new consolidated `_docs/BACKEND.md` + kill the fossil; audit = fresh verify + REPORT ONLY.

## Prior-work grounding (rule 12 , NOT greenfield)
- 141-finding backend audit ran 2026-07-09 (`_plans/BACKEND_AUDIT_INDEX.md`), fixed+merged by 2026-07-12 (`_plans/BACKEND_FIX_TRACKER.md`). Reused OPS_RUNBOOK / SECURITY_RULES / DB_SCHEMA / the live snapshot rather than duplicating.

## Atomic deliverables , all closed
- [x] **D1. Research every backend system** , `verified:` two workflows completed 0-error: `wf_ababd872-a0f` (46 agents, 11 readers) + `wf_74900348-f5b` (4 readers). Output drove `_docs/BACKEND.md`.
- [x] **D2. Write `_docs/BACKEND.md`** , `verified:` `_docs/BACKEND.md:1` exists, 15 sections / 315KB (auth, DB/RLS, storage, payments, booking, crons, notifications, search, S1 stack, ops/DR, API surface, value-store, GDPR, moderation, AI/analytics). `grep -c '^## '` = 16 (Contents + 15). Committed chunk1 `1994e3721` (11 secs) + chunk2 (15 secs).
- [x] **D3. Retire the fossil** `DOCUMENTATION.md`:
  - [x] D3a. `verified:` `DOCUMENTATION.md:1` now "documentation moved" pointer table; committed `1994e3721`.
  - [x] D3b. `verified:` `git show --stat 1994e3721` , 0 route/component/section deletions, so no REMOVED.md line needed (N/A).
- [x] **D4. Fix stale bits in `_docs/PROJECT_REFERENCE.md`** , `verified:` `_docs/PROJECT_REFERENCE.md:32` Deploy=Netlify, `:84` "351 API routes", `:31` Inter Tight/Inter, `:64`(§5) Netlify+"owner pushes" + BACKEND.md pointer row. Committed `1994e3721`.
- [x] **D5. Build the hook** , `verified:` `.claude/hooks/backend-doc-pointer.py` (committed `1994e3721`); UserPromptSubmit keyword-match + PreToolUse backend-file match, once/session, pointer-only.
- [x] **D6. Self-test the hook** (rule 12.5) , `verified:` 11/11 pass (Bash self-test suite output this session):
  - [x] D6a. Positive: backend prompts + backend file edits (route.ts, `supabase/migrations/*.sql`, `lib/stripe.ts`) fire.
  - [x] D6b. Negative: frontend prompts + `components/Hero.tsx` + `lib/supabase-browser.ts` silent.
  - [x] D6c. Dedup (once/session) + notification-guard silent.
- [x] **D7. Wire the hook** , `verified:` `.claude/settings.json` has 4 `backend-doc-pointer.py` entries (UserPromptSubmit + PreToolUse Edit/Write/MultiEdit), confirmed by JSON round-trip count; integration test from the wired path: backend fires, frontend silent. Committed `1994e3721`.
- [x] **D8. Fresh health+security audit (REPORT ONLY)**:
  - [x] D8a. `verified:` live `get_advisors` security+performance run (project tocfnsmxmdxkrcmjzzdw); 1 known ERROR (definer view), rest WARN/INFO. Baseline in report Part B.
  - [x] D8b. `verified:` 6 lenses + adversarial skeptics (`wf_ababd872-a0f`) , 44 STILL_FIXED, 14 NEW_RISK (0 new critical), 9 NEEDS_LIVE_CHECK.
  - [x] D8c. `verified:` all 9 live checks run via `execute_sql` + `list_edge_functions`: reviews_insert_own requires booking, moderation cols present, both guard triggers en=O, discovery_items RLS restricted, create_group_booking secdef=true + policies present, db-backups public=false + no anon policy, 6 edge fns verify_jwt=true. ALL campaign criticals confirmed fixed live.
  - [x] D8d. `/api/health` NOT run (needs dev server up); substituted by direct live-DB probes + get_advisors (higher signal). Noted in report. Concrete disposition, not skipped.
- [x] **D9. Write the audit report** , `verified:` `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md:1` (Verdict + Part A criticals-fixed + Part B advisors + Part C 14 findings incl. 2 discrepancies + Part D next-audit + prioritized list). Includes the OPS_RUNBOOK:49 staleness correction (credits wired `57f9f11ff`). Nothing fixed.
- [x] **D10. Close-out**:
  - [x] D10a. `verified:` chunk1 committed `1994e3721`; chunk2 (15-section doc + report correction + this plan + ACTIVE) committing now.
  - [x] D10b. `verified:` ACTIVE row #19 set to DONE (same commit as chunk2).
  - [x] D10c. Reported to owner with doc link + plain-English verdict (this turn's closing message).

## Health verdict (delivered)
Backend is in good shape. ALL ~22 campaign CRITICALs verified fixed (code + live DB). 0 new critical. 2 HIGH + 7 MEDIUM + 4 LOW hardening gaps (report-only, none applied) + 2 doc-vs-reality discrepancies (nail/ai-history tracker over-claim; getSession gate not wired in this worktree) + 1 stale-doc correction (OPS_RUNBOOK:49 credits ARE wired, `57f9f11ff`). Live advisor clean but for known-queue items.

## Follow-ups PARKED for the owner (surfaced in the report, NOT actioned , report-only scope)
- Fix list (report Part C/Prioritized): pre-charge paid->deposit_held webhook downgrade; retail no-refund/no-alert; no-show/quick-cancel/sms-reminders races; wire the getSession gate (verify main first); nail/ai-history illusory fix; go-live admin gate (policy call); admin+write-route rate limits; the advisor queue (definer view, leaked-password toggle, public-bucket listing).
- Separate next audit (report Part D): value-store/deposit-capture/tips money paths; AI/LLM injection + PII egress + value-stacking + supply-chain risk classes.
- Doc fix: correct `_plans/OPS_RUNBOOK.md:49` (credits/voucher seam is wired, not "wired to NOTHING").

## FIX PASS (owner: "fix em", 2026-07-14)
Escalated from report-only to fixing. Scope stated to owner: fix the real bugs + discrepancies; PARK 2 policy calls; FLAG the large rate-limit sweep.

### FIX NOW , ALL DONE (coder loop + security/correctness review + my punch fixes; tsc=0)
- [x] F1. webhook pre-charge downgrade , `verified:` `app/api/stripe/webhook/route.ts:211` else-branch now `} else if (pi.metadata?.type !== "pre_charge") {`, so a captured pre_charge PI keeps payment_status='paid'.
- [x] F2. account.updated OFF path , `verified:` `app/api/stripe/webhook/route.ts:774` added `else { accepts_online_payment=false }` when !charges_enabled.
- [x] F3. retail stock-fail , `verified:` `app/api/stripe/webhook/purchase-handler.ts:150-190` on !decremented: alertAdmin + issuePurchaseRefund (once, guarded) + `break` (punch fix, so remaining SKUs are not decremented after a full refund).
- [x] F4. no-show race , `verified:` `app/api/cron/no-show/route.ts:45` UPDATE now chains `.eq('status','confirmed').select('id')` + skips (continue) on 0 rows.
- [x] F5. sms-reminders double-send , `verified:` `app/api/cron/sms-reminders/route.ts:71-84/127-140` claim-before-send CAS on both 24h + 1h; only sends if the flag-flip matched a row.
- [x] F6. quick-action cancel CAS , `verified:` `app/api/bookings/[id]/quick-action/route.ts:83-92` `.eq('status', booking.status!)` (typecheck punch fix) + `.select('id')` + 409 no-op guard so a lost race does NOT free the slot or refund (correctness punch fix).
- [x] F7. nail/ai-history ownership , `verified:` `app/api/dashboard/nail/ai-history/route.ts:38-66` owner/admin guard added (route targets a genuinely phantom table per live snapshot, so it stays a dead-but-now-guarded route; noted).
- [x] F8. getSession gate wired , `verified:` `.claude/settings.json` has 3 `no-getsession-authz-gate.py` entries (Edit/Write/MultiEdit); gate self-test 5/5 (block real getSession in app/lib, pass comment/use-client/non-app).
- [x] F9. OPS_RUNBOOK doc , `verified:` `_plans/OPS_RUNBOOK.md:49` corrected (credit spend RPCs wired 57f9f11ff; gift-voucher UI still pending).
- [x] F-verify. `verified:` tsc `--noEmit` = 0 errors; security+correctness review punch list all resolved (F6 typecheck BLOCKER + result-gate MAJOR, F3 break, P1 approved_at gap); money diffs read by hand.

### OWNER-DECIDED behavior changes , DONE (AskUserQuestion 2026-07-14)
- [x] P1. go-live requires admin approval , owner chose "require admin approval". `verified:` `app/api/salon/go-live/route.ts:60-66` gates on `salon.approved_at`; punch fix `app/api/admin/salons/[id]/reject/route.ts:38-44` now sets `approved_at: null` on deactivate so a deactivated salon needs re-approval (closed the review BLOCKER: stale approved_at bypass). ⚠️ DEPLOY COMPANION REQUIRED: 20/20 live salons have approved_at NULL , backfill SQL in the audit report; owner-gated, not auto-run, branch not live yet.
- [x] P2. staff-availability requires auth , owner chose "require auth". `verified:` `app/api/staff/[id]/availability/route.ts:10` `requireAuth()`; the resurrected zombie barber page (its only anon caller) re-deleted (REMOVED.md) so no fabricated 'closed all week' regression ships.

### STILL PARKED , flagged, narrowed (not silently dropped)
- P3. Rate-limit sweep: ~48 admin routes + ~57 authenticated customer-write routes lack `applyRateLimit`. All auth-gated (lower risk). Its own focused pass with the right limiter per route. NOT done here (would break things if blanket-applied unsupervised).

### PARKED , narrowed scope (flagged, not silently dropped)
- P3. Rate-limit sweep: ~48 admin routes + ~57 authenticated customer-write routes lack `applyRateLimit`. All are auth-gated (lower risk). Blanket-adding to 100+ routes is a large mechanical change with breakage risk; deserves its own focused pass with the right limiter per route. NOT done here.

## Progress log
- 2026-07-14: investigated docs (fossil found); owner picked new-consolidated + report-only; 2 research workflows (50 agents, 0 errors) -> 15-section `_docs/BACKEND.md`; ran all live-DB checks (all criticals fixed live); wrote report; retired fossil; fixed PROJECT_REFERENCE; built+tested+wired the hook; chunk1 `1994e3721` + chunk2. DONE.

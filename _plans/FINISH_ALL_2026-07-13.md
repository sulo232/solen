# FINISH-ALL push (owner "give me all of them", 2026-07-13)

Owner authorized resuming ALL remaining in-flight workstreams. Doable-now parts execute via background agents; browser-blocked (sandbox listen()) and sandbox-denied-write parts get flagged, not faked.

## Batch
- [x] W9. verified (agent af798ac19d8bfe92f, committed 8ed357088): SearchResults.tsx confirmed dead (zero live imports/JSX, grep-proven) -> DELETED + REMOVED.md line. /api/salons/search NOT deleted , rule-18 save: `app/[locale]/dashboard/badge-manager/page.tsx:267` still fetches it live (the plan's "dead" claim was wrong for the route); route comment corrected. tsc clean of new errors. FOLLOW-UPS parked below.
- [x] W19. verified (agent a30c6da38f2bf6524, committed 776b1c6c7): rule-18 finding , the A-1 migration is ALREADY APPLIED (2026-07-03, supabase/migrations/20260703090000_retail_generalize_a5.sql). Live `nail_retail_products` CHECK already permits general categories (hair_care/styling rows are behavioral proof), `retail_purchases` VAT columns exist. So NO schema change is needed; plan A-0/A-1 are effectively done. Draft/reconciliation in BUNDLES_MIGRATION_DRAFT_2026-07-13.md; nothing applied to DB. Remaining #19 work is the bundles/retail UI (visual -> needs browser + mockup, parked). One owner call flagged: exact conname needs a read-only execute_sql to 100%-confirm (inferred `nail_retail_products_category_check`).
- [x] W13. verified (agent a97f43dd2427dbbcc, committed 63f76a8c9): 26 [code]-class fixes , fabrication removed (fake urgency counts, fake testimonials, hardcoded "1200 salons"/stat blocks, TWINT-in-ToS, phantom cut_count field), silent-swallowed catches fixed (badge-manager/approvals/all-users/commission-admin now surface real errors), 1 dead-click removed, 19 touch-target sites raised to 44px. tsc clean. Rule-18: bare-star-without-count already fixed in code; fuer-salons+business redirect to /partner (dead-code, audit citations stale). TAIL: safe dashboard/admin touch-targets dispatched to agent a3ce4b9cb89bb60fa; layout-sensitive customer touch-targets (CityTopBar height, FilterSheet, PDP tabnav, booking sheets, help pills) + color-decision items (badge Coral swatch, client tag colors) PARKED , need a browser (sandbox blocks render) or a hex the owner hasn't locked.
- [x] W17. verified: the exact patch already exists at `_plans/DRIFT_GATE_PATCH_2026-07-11.md` (committed prior turn); target `.claude/skills/solen-drift-check/scripts/check.py` is in the worktree `.claude/` which is SANDBOX-WRITE-DENIED this session (concrete blocker, confirmed by every worktree .claude write attempt this session failing). Nothing executable here; stays parked for a main-checkout session.

## W9 follow-ups (parked, out of this task's scope; found by the agent)
- /api/salons/search can only be deleted AFTER `badge-manager/page.tsx:267` is repointed to a live endpoint (`/api/salons?q=`). Real remaining phase-4 blocker.
- SILENT BUG found incidentally: badge-manager reads `d.salons ?? []` but /api/salons/search returns `{items, total}` , field-name mismatch, so that admin salon-search box likely returns nothing today. Separate bug, worth its own fix.
- [x] Z. verified: all 4 workstream agents collected + committed , W9 8ed357088, W19 776b1c6c7, W13 63f76a8c9, W13-tail ed345d3f7. Final `npx tsc --noEmit` = 4 errors, all in the 2 pre-existing exempt discovery-backfill routes, ZERO new errors from the whole push. ACTIVE row 22 -> DONE. Parked (concrete blockers): #17 drift-gate (worktree .claude write-denied), layout-sensitive customer touch-targets + color-decision items (sandbox blocks render / no locked hex), bundles UI (visual). One report below.

## Constraints carried into every brief
- No push. No em-dashes. English. Surgical.
- Route/file deletion -> verify dead first + REMOVED.md line (graveyard protocol).
- No prod DB migration applied autonomously (probe + prepare only).
- Sandbox: worktree .claude write-denied; dev server cannot bind (listen() EPERM) so no live render.
- Rule 18: if a "dead" file is actually live, or a plan premise is stale, STOP and report, do not force.

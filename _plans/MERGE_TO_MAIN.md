# Merge backend campaign -> local main (2026-07-15) , DONE

Owner: "go". Merged `claude/backend-docs-security-audit-cd44e5` into LOCAL main (main had moved
18 commits ahead). 7 conflicts, owner-agreed principle: **KEEP BOTH SIDES, never pick a winner.**

Owner facts confirmed + verified against the repo (not memory):
- **Vercel is NOT used at all. Netlify is the host.** `verified:` netlify.toml exists, vercel.json
  gone, package.json has 0 @vercel deps, instrumentation.ts has no OTel.
- "main" = LOCAL main. Never pushed.

## Conflicts , all resolved KEEP-BOTH
- [x] C1. `app/api/cron/process-deletions/route.ts` , `verified:` only the import block conflicted;
      git auto-merged both bodies. Kept all 4 imports. Order proven correct: main's storage purge
      (L131) -> user delete loop (L187) -> my PostHog erasure (L201). Both present, neither dropped.
- [x] C2. `components-legacy/dashboard/DashboardLayout.tsx` , `verified:` both icons (Gauge+Crown)
      on one import line, both nav rows (aiLimit + salonOfMonth), main's blue->grey sweep kept.
- [x] C3. `app/api/admin/salon-of-month/route.ts` , `verified:` main's `logAuditEvent` import kept +
      my `adminLimiter` survived (grep: adminLimiter=3, logAuditEvent=2).
- [x] C4-C7. `messages/{de,en,fr,it}.json` , resolved by a real 3-way deep JSON merge (regex attempt
      produced invalid JSON and was reverted). `verified:` 0 keys dropped from EITHER side
      (de 5446+5470->5487, en 5435+5459->5476, fr 5428+5452->5469, it 5417+5441->5458).

## Verification
- [x] V1. ADMIN_NAV rail , `verified:` slice(0,6) = approvals/allSalons/allUsers/revenue/commission/
      platformAnalytics. platformAnalytics kept its slot; aiLimit is #7 (full sidebar). No regression.
- [x] V2. PostHog block redundant? , NO. `verified:` main's GDPR migration + lib/gdpr/* contain ZERO
      posthog references. My erasure is additive, not duplicate.
- [x] V3. i18n valid JSON + parity , `verified:` all 4 parse. Locale gaps (en -11, fr -18, it -29 vs
      de) are IDENTICAL before merge, on main, and after merge = pre-existing translation debt, NOT
      merge drift. Not fixed here (out of scope, flagged).
- [x] V4. `npx tsc --noEmit` = 0.
- [x] V5. `npx vitest run` = 76/76. `npm run smoke` = 10/10.
- [x] V6. council tier-3 on the merged conflict files , 3 HIGH found, all in MAIN's new GDPR code,
      not in my resolution. 2 fixed (below), 1 flagged (below).
- [x] V7. Netlify doc , `_docs/BACKEND.md` already correct (its Vercel mentions are accurate
      history). Fixed 3 stale claims in `_docs/PROJECT_REFERENCE.md` (build comment, instrumentation
      OTel, deployment section). 0 Vercel claims remain in my docs.
- [x] V8. Committed. Merge = a79a7c846, docs = 569b72621, GDPR fix = 2a79724f6.

## Council findings on main's GDPR code (found post-merge)
- [x] FIXED (HIGH, silent no-op): `purgeClientPhotoStorage` passed the full public URL to
      `storage.remove()` (needs a bucket-relative path) -> matched nothing, deleted nothing, no
      error. Erased customers' photos were never purged. Added `pathFromPublicUrl()` mirroring the
      review sibling. Discriminating test 4/4.
- [x] FIXED (HIGH, dead gate): `scripts/gdpr-deletion-completeness-check.ts` seeded client_photos
      photo_url as a RAW path while seeding review_photos with the real getPublicUrl shape, so the
      gate passed against a shape production never produces. Now seeds the real shape.
- [x] FIXED (HIGH, visibility): photo-purge failures only console.error'd; now alertAdmin, matching
      the PostHog step.
- [ ] FLAGGED for owner (NOT fixed, needs a design call): the storage purge runs for the WHOLE due
      batch BEFORE per-user `deleteUser()` succeeds, so a user whose deleteUser fails has photos
      removed while their account survives. NOTE the ordering is DELIBERATE and not a simple
      reorder: the profiles BEFORE DELETE trigger nulls `photo_url`, so paths are unfindable after
      deletion. A correct fix = split "collect paths" from "remove bytes" (collect before, remove
      only for users whose deleteUser succeeded). Severity is lower than the council framed: the
      affected user REQUESTED erasure (photos gone is the intent) and the cron retries next run.
      Owner decision: refactor main's pipeline, or accept.

## Parallel-worktree note
`claude/taste-rationale-frameworks-37390c` (worktree happy-jackson-514459) has 4 commits NOT in
main that also touch DashboardLayout. My merge cannot drop them (separate branch/checkout), but
THAT session will hit its own DashboardLayout conflict when it merges. Flagged, not touched.

# Merge backend campaign -> local main (2026-07-15)

Owner: "go". Merge `claude/backend-docs-security-audit-cd44e5` (16 commits) into LOCAL main
(main moved 18 commits ahead independently). merge-tree proved 7 conflicts. Owner-confirmed
resolution principle: **KEEP BOTH SIDES on every conflict, never pick a winner.**

Owner facts confirmed this turn:
- **Vercel is NOT used at all anymore. Netlify is the host.** (main had a commit saying "since
  the Vercel migration"; that is history, not current.) `_docs/BACKEND.md` must say Netlify.
- "main" = LOCAL main (no remote work).

## Conflicts + agreed resolution
- [ ] C1. `app/api/cron/process-deletions/route.ts` , main added the GDPR completeness sweep
      (~18 more TABLES_CLEARED + purgeClientPhotoStorage/purgeReviewPhotoStorage imports); I added
      the PostHog person erasure block after the delete loop. KEEP BOTH (different stages: main
      purges our DB + storage, mine purges the third-party PostHog copy).
- [ ] C2. `components-legacy/dashboard/DashboardLayout.tsx` , main added `salonOfMonth` nav +
      the blue->grey focus/selected sweep (locked design law); I added the `aiLimit` nav entry.
      KEEP BOTH: both icons (Crown + Gauge), both nav rows, main's colour sweep wholesale.
- [ ] C3. `app/api/admin/salon-of-month/route.ts` , main rewrote the route (+99 lines); I added
      an adminLimiter rate-limit. KEEP BOTH: take main's route, re-apply the 4-line limiter.
- [ ] C4. `messages/de.json` , main `salonOfMonth` keys + mine `aiLimitsAdminPage`/nav.aiLimit. KEEP BOTH.
- [ ] C5. `messages/en.json` , same. KEEP BOTH.
- [ ] C6. `messages/fr.json` , same. KEEP BOTH.
- [ ] C7. `messages/it.json` , same. KEEP BOTH.

## Post-merge verification (do NOT assume)
- [ ] V1. ADMIN_NAV desktop rail: main + mine BOTH insert near index 5 and the rail renders
      `ADMIN_NAV.slice(0, 6)`. Re-check nothing got pushed off the rail (I fixed exactly this
      regression pre-merge; the merge can re-introduce it).
- [ ] V2. Is my PostHog erasure block redundant now? Check main's GDPR trigger/migration
      (20260713150000) does NOT already handle the PostHog side. If it does, drop my block.
- [ ] V3. All 4 message files valid JSON + no duplicate keys.
- [ ] V4. `npx tsc --noEmit` = 0.
- [ ] V5. money tests (`npx vitest run`) + `npm run smoke`.
- [ ] V6. council (tier 3) on the merged conflict files.
- [ ] V7. `_docs/BACKEND.md` says Netlify, no stale Vercel claim anywhere in my docs.
- [ ] V8. Commit the merge; report.

## Guardrails
- Merge into LOCAL main only. Never push (owner pushes).
- If a conflict resolution is ambiguous beyond "keep both", STOP and ask, do not guess.

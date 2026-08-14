# A7 — Backend fix plan (synthesis, 2026-07-06)

Sources: A1_SECURITY (agent + Fable live-DB verify), A3_SCALABILITY, A4_STORAGE, A5_DEADCODE, FINDINGS_SOLO (C1 booking race), A6_HARDCODED (pending). Baseline: backend is mature/hardened; findings are a handful of real issues + scale/polish.

## SPLIT: code-fixes (execute via refine loop, commit, no push) vs prod-DB migrations (PARK for owner — apply_migration is the owner-decision boundary).

## PARKED for owner approval (prod DB migrations — ready SQL, do NOT auto-apply)
- **P1 [CRITICAL, money] Revoke anon EXECUTE on credit/voucher/promo RPCs.** Verified anon can call redeem_voucher/redeem_user_credits/restore_voucher/restore_user_credits (double-spend + griefing); all 4 have ZERO in-app callers so revoke is zero-risk + reversible. SQL in A1_SECURITY C3. THIS IS THE MOST URGENT ITEM — flag first in report.
- **P2 [HIGH] staff_members column-level protection.** After the route fix (code), anon key can still `select commission_rate from staff_members where is_active` directly. Real close = a public VIEW with safe cols + REVOKE column SELECT on commission_rate/permissions from anon/authenticated, or split the public policy. Migration.
- **P3 [MED] Verify/lock profile_summaries + public_profiles SECURITY DEFINER views** (get_advisors ERROR). Confirm columns exposed to anon are safe; if not, recreate as SECURITY INVOKER or restrict.
- **P4 [MED] Revoke anon on toggle_discovery_like/save + set_customer_persona + discovery_recent_searches** (trust client user-id → act/read-as-another-user). Ideally rewrite to use auth.uid() internally.
- **P5 [LOW] Pin search_path on service_bundles_min_items + older SECURITY DEFINER fns** (handle_new_user, generate_referral_code, discovery fns). L5.
- **P6 [LOW] Rating-cache moderation trigger:** add is_hidden filter to update_salon_rating() SELECT + AFTER UPDATE/DELETE trigger (A4 F2). Alternative code-side recompute is in B-DATA below (pick one; trigger is cleaner but is a migration).
- **P7 [LOW, ops, no code] Enable HaveIBeenPwned leaked-password protection** (Auth dashboard toggle). Tighten public bucket LISTING on discovery-images/service-photos (gift-card-assets is a killed feature).

## CODE FIXES (execute)

### Batch B-SEC-AUTHZ (IDOR / ownership) — highest security value
- H1 GET /api/dashboard/clients/[id]/notes — add salons.owner_id ownership check (mirror the POST/DELETE in the same file).
- H2 (route layer) GET /api/staff — drop commission_rate + permissions from the public select (dashboard has its own owner-gated read); OR require salon-owner session. (Base-table layer = P2 migration.)
- H3 GET /api/dashboard/barber-leaderboard — ownership check on salon_id.
- M2 GET /api/dashboard/clients/[id]/tags — ownership check (same shape as H1).
- M3 GET /api/dashboard/walkin-analytics — ownership check on salon_id.
- M4 POST /api/dashboard/spa/treatment-outcomes — ownership check on the target client/salon.
- M5 PATCH /api/bookings/[id] — role-scope status transitions completed/no_show to salon only (lib/validations.ts:767 bookingPatchSchema + the route). Verify a customer can't self-mark completed/no_show.
- M6 POST /api/bookings/express-rebook/confirm — verify service_id belongs to slot.salon_id; verify staff_id/source_booking_id. (Gated behind barber_features.)

### Batch B-SEC-ABUSE (auth/rate-limit/injection)
- C1-sec /api/vouchers/create — VERIFIED dead (only a comment references it; /vouchers + /vouchers/buy are COMING_SOON middleware-redirected stubs; gift-cards/vouchers is a hidden feature). DECISION: SECURE not delete (feature may be revived like bundles were). Add requireAuth (block anon) + hard max on discountValue + is_active:FALSE at insert (webhook flips true on payment_intent.succeeded) + derive created_by from session, not client body. Reversible, closes the exploit. (Parked micro-question: delete vs keep the hidden route — but vuln is closed either way.)
- L4 /api/referral/validate:27 — replace `.or("code.eq.${code},...")` string-interp with .eq()/sanitized (PostgREST filter injection).
- M7 /api/referral/complete — enforce referrer max_uses + a booking/purchase precondition (sybil farming).
- M8 /api/auth/verify-phone/send — add per-PHONE-number rate limit (not just IP); do NOT return success/log OTP when SEVEN_API_KEY unset.
- M1 /api/directory/[id]/claim — add IP+target rate limit + attempt cap + uniform errors.
- C2-solo /api/partner/leads — add generalLimiter by IP.

### Batch B-BOOK (correctness)
- C1 /api/bookings/route.ts:471 — add `.eq("status","available")` to the slot flip + rowcount-0 rollback (mirror the 23P01 branch). Prevents same-slot double-book LWW race. Verify with a concurrency scenario.

### Batch B-PERF (scale)
- A3-N1 /api/salons/route.ts:546-559 (with_slots) — ATTEMPTED the single `.in("service_id",ids)` + JS-group-slice-3 collapse; loop-reviewer LIVE-TESTED and FAILED it: unbounded `.in()` hits PostgREST's 1000-row default cap (measured 1000 of 16,716 rows for a 72-service page), and because rows sort by (service_id, starts_at) the later service_ids get FALSE-ZERO slots — reintroduces the exact bug commit a770b2099 fixed. REVERTED to the correct per-service version. PROPER FIX = PARK (owner): a `ROW_NUMBER() OVER (PARTITION BY service_id ORDER BY starts_at) <= 3` RPC (top-3-per-service server-side, like salons_with_slot_in_hours) — that's a prod migration. ALTERNATIVE code-only follow-up (no migration): keep per-service but CHUNK the Promise.all to ~10 concurrent (bounds pool without changing correctness). Left as parked/backlog; the N+1 is a SCALE risk not a current bug (thin data). Also note: no index on availability_slots.service_id alone (pre-existing).
- (superseded) A3-N1 old note: NOT locally reproducible — basel/coiffeur returns 0 salons with current thin seed data, so the fan-out (which scales with salons-on-page x services) doesn't trigger; warm latency ~0.49s both with/without slots. Frame the fix as connection-pool SCALE-RISK removal, not a measured speedup. Correct to do; verify shape via unit reasoning + reviewer, not a before/after number.
- A3-U2 /api/salon/clients:27 — add a lookback window (e.g. 12 months) or pagination to the unbounded lifetime-bookings pull.
- (defer, roadmap) metrics/global full-scan (24h cached), analytics/salon SQL aggregation, archival/TTL.

### Batch B-HARDCODED (A6 — includes 2 live bugs)
- A6-H1 [HIGH, live SEO bug] app/sitemap.ts:9 — hardcodes `"zurich"` (live slug is `"zuerich"`) + nonexistent winterthur/st-gallen → broken sitemap.xml. FIX: derive from the canonical city list (lib/cities.ts CITY_SLUGS = basel/zuerich/bern), don't hardcode.
- A6-H2 [HIGH, fabricated-data] forYouSalons.ts — hardcoded salon UUIDs feed "Weil du X magst" homepage section unconditionally in prod (no NODE_ENV guard, unlike sibling useRecentlyViewed.ts). Violates no-fab-data rule. FIX: guard to dev-only OR wire to real personalization; if neither, hide the section when no real data.
- A6-M1 [MED] VAT rate 8.1 hardcoded in 4 files — centralize (there's already DEFAULT_COMMISSION_RATE_PERCENT; add DEFAULT_VAT_RATE_PERCENT in lib/vat.ts and import).

### Batch B-DATA (integrity/polish)
- C3-solo /api/analytics/platform — replace hardcoded `|| 42/18/24/11` fallbacks with `|| 0` (no fabricated counts).
- (if not doing P6 migration) code-side rating recompute in app/api/admin/reviews/[id]/route.ts when is_hidden toggles.

### Batch B-CLEAN (dead code)
- Delete app/[locale]/_components/search/SearchResults.tsx (404 dead) + components-legacy/search/SplitView.tsx (254 dead) + REMOVED.md lines.
- Repoint dashboard/badge-manager/page.tsx:267 off /api/salons/search → /api/salons?q=, then delete /api/salons/search route.
- Delete the 10 retired homepage/layout components (A5 table) + REMOVED.md.
- PARK for owner: CategoryHeroCarousel (built, never wired — revive or delete?), src/_pages-draft + src/spa_pages (16 files — confirm safe).

### Batch B-HARDEN (rules/hooks — prevent recurrence)
- Money-unit landmine (A4 F1): add a convention (naming `_rappen` or a doc + a drift note) so a future query can't assume the wrong unit. Consider a lint/hook.
- Add a hook/rule: new service-role route MUST have an ownership check (the IDOR class). 
- Add a hook/rule: new SECURITY DEFINER function MUST REVOKE anon/authenticated unless explicitly public-read.

## Execution order (value x safety): B-BOOK (C1) → B-SEC-AUTHZ → B-SEC-ABUSE → B-PERF → B-DATA → B-CLEAN → B-HARDEN. Council tier-3 on anything touching bookings/payments/auth. Park P1-P7 for owner.

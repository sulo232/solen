# A1 — Backend security audit (agent a0c628cd, 2026-07-06)

Scope: ~285 route handlers under app/api/**, middleware.ts, lib/ auth/supabase/ratelimit/feature-flags/env, Stripe webhook + PI routes, supabase/migrations RLS + RPCs, live snapshot (145 tables).

Overall posture: genuinely hardened. Centralized lib/auth/require.ts (requireAuth/requireAdmin/requireSalonOwner/requireRole), zod env schema no client-secret leak, server-computed Stripe amounts, webhook sig verify + atomic idempotency, all 24 crons CRON_SECRET-gated, all 145 tables RLS-enabled, 2026-07 money/stock RPCs correctly locked (SECURITY DEFINER + pinned search_path + REVOKE from anon/authenticated). No secrets committed. No rpc string-interpolation, no raw SQL, no NEXT_PUBLIC_ secret misuse. Problems concentrated in a handful of legacy/uneven routes + one messy RLS migration-history area.

## CRITICAL

### C1. POST /api/vouchers/create — unauthenticated minting of unbounded active discount codes
`app/api/vouchers/create/route.ts`. No auth; uses service-role client. `discountValue: z.number().positive()` has NO max. Writes promo_codes row `is_active:true` (L82) BEFORE payment; `created_by` from client body (IDOR attribution). Verified: all cols exist live; booking-pay-intent (L214-253) trusts any active promo_codes row by code, only caps discount at charge amount. Anonymous `POST {discountType:"fixed",discountValue:100000,customerId:<uuid>}` yields a working code dropping ANY booking at ANY salon to the CHF 0.50 floor. Salon-omitted → platform-wide; unlimited codes. No in-app caller (dead UI) but route deployed + reachable (middleware only redirects the /vouchers PAGE, not the API).
FIX: delete the route OR add requireAuth + hard max + webhook-gated activation (is_active:false until payment_intent.succeeded) + derive created_by from session.

### C2. Legacy permissive RLS `USING(true)` may still be live on bookings/reviews/etc — NEEDS LIVE VERIFY
`001_booking_reviews.sql` created `"Public can view bookings" FOR SELECT USING(true)` + `"Public can insert bookings" WITH CHECK(true)`. Later migrations added scoped policies under DIFFERENT names (bookings_select_own...). Postgres ORs permissive policies; NO migration drops the legacy names by name. If both live, USING(true) SELECT wins → entire bookings table (957 live rows: guest_email/guest_name/user_id/times/salon) world-readable via anon key. Same pattern reviews + `(true)` writes on salon_photos/addons/inventory/sms_reminders/staff_calendars/loyalty_stamps/quartier_subscriptions.
VERIFY (read-only): SELECT tablename,policyname,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND qual='true' ... ; or Supabase get_advisors(security). If any qual/with_check is true → drop that policy. HIGHEST severity if confirmed live.

### C3 (NEW, live-DB, CRITICAL money) — SECURITY DEFINER credit/voucher RPCs executable by anon
The intro's "money RPCs correctly locked (REVOKE from anon/authenticated)" is FALSE for the credit/voucher functions. Verified via pg_proc.proacl (project tocfnsmxmdxkrcmjzzdw, 2026-07-06):
- `redeem_voucher(p_code,p_salon_id,p_amount,p_user,p_booking,p_pi)` — grantees anon+authenticated+service_role. SECURITY DEFINER. Trusts client `p_user`/`p_amount`/`p_booking`. Anon can call `/rest/v1/rpc/redeem_voucher` to BURN any salon voucher's remaining_amount (griefing) or redeem another user's voucher.
- `redeem_user_credits(p_user,p_amount,p_booking,p_pi)` — anon+authenticated. Trusts client `p_user` → drain ANY victim's user_credits (fresh p_booking each call bypasses the per-booking idempotency). Griefing/credit-destruction.
- `restore_user_credits(p_pi)` — anon+authenticated. Takes ONLY a PI string; adds amount_redeemed back to user_credits + DELETEs the redemption. A user who booked with credits calls this with their own PI → gets credits back while keeping the booking discount = DOUBLE-SPEND (free money). HIGH-money.
- `restore_voucher(p_pi)` — anon+authenticated. Same double-spend for vouchers.
- `increment_promo_use(text)` + `next_walkin_ticket_seq(uuid)` — granted to PUBLIC too; called ONLY via service-role admin.rpc in-app.
KEY: all 4 redeem/restore fns have ZERO callers in the whole repo (credits/vouchers are applied via the webhook handlers directly, not these RPCs). So they are pure attack surface. FIX (additive, zero-risk, PARK for owner — prod migration = owner-decision boundary):
```sql
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(text,uuid,numeric,uuid,uuid,text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_user_credits(uuid,numeric,uuid,text)      FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_voucher(text)                            FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_user_credits(text)                       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promo_use(text)                        FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_walkin_ticket_seq(uuid)                     FROM anon, authenticated, PUBLIC;
```
Also flagged by get_advisors (anon/authenticated_security_definer_function_executable). service_role retains EXECUTE so the app is unaffected.

### Supabase get_advisors(security) live results (2026-07-06)
- ERROR x2: SECURITY DEFINER views `public.profile_summaries` + `public.public_profiles` (enforce creator RLS, not caller's) — verify they expose only safe columns to anon. PARK/verify.
- WARN money: the C3 anon-executable SECURITY DEFINER fns above (redeem/restore/increment/next_walkin).
- WARN social (lower): `toggle_discovery_like(p_item,p_user)`, `toggle_discovery_save(...)`, `set_customer_persona(jsonb)`, `discovery_recent_searches(p_user_id,...)` anon-executable + trust a client user-id → act/read-as-another-user (griefing/privacy). Proper fix: use auth.uid() inside, revoke anon. `search_salons_ranked`/`search_suggest`/`discovery_trending_terms` anon-exec = OK (public read-only).
- WARN: `function_search_path_mutable` on `service_bundles_min_items` (pin search_path). `extension_in_public` (cube/earthdistance/btree_gist) standard note. `rls_policy_always_true` quartier_subscriptions INSERT (spam). `public_bucket_allows_listing` on discovery-images/gift-card-assets/service-photos (file enumeration; gift-card-assets is a KILLED feature). `auth_leaked_password_protection` disabled (enable HaveIBeenPwned in Auth settings — dashboard toggle, no code).
- INFO: `rls_enabled_no_policy` on ~17 tables (customer_segments*, discovery_boards/likes/pins/staging, partner_leads, platform_stats, processed_webhook_events, salon_engagement, salon_page_views, search_events, sms_reminders, waitlist) = deny-all (fail-closed, only service_role) — SAFE; note only if any client path silently fails against them.

## LIVE-DB VERIFICATION (Fable, read-only pg_policies + information_schema, 2026-07-06, project tocfnsmxmdxkrcmjzzdw)
- C2 WORST CASE REFUTED: `bookings` has NO `USING(true)` SELECT policy live. Guest PII is NOT world-readable. `reviews`/`salon_photos`/`addons`/`review_photos`/`staff_portfolio_images`/`staff_services`/`service_options`/`discovery_*`/`feature_flags`/`tier_perks`/`search_embeddings`/`salon_directory` have public-read USING(true) — all catalog/discovery/public-display, no PII/money. `inventory` + `staff_calendars` public-read = low-risk note (should they be public? availability is shown publicly anyway). `quartier_subscriptions` public INSERT = spam vector (like partner/leads). => C2 downgraded from CRITICAL to LOW/note.
- H2 CONFIRMED: route uses `staff_members` (not `staff`); live SELECT policy = `(owner) OR (is_active=true)`; columns commission_rate + permissions EXIST. `GET /api/staff?salon_id=X` has NO auth → anon reads commission_rate + permissions for all active staff. Two-layer fix: (1) route: drop commission_rate/permissions from the public select (dashboard has its own owner-gated read); (2) RLS/base-table: anon key can still `select commission_rate from staff_members where is_active` directly — real close needs a public VIEW with safe columns + REVOKE column SELECT on commission_rate/permissions from anon/authenticated (additive migration).
- Note: live `staff` table (distinct from `staff_members`) has no RLS policies + none of these columns — migration 014's `staff_select_public` is drift, not the live path.

## HIGH
- H1. GET /api/dashboard/clients/[id]/notes:11-31 — cross-salon client-notes PII IDOR. Auth-only, reads client_notes on service-role by client-supplied customer_id+salon_id with NO ownership check. POST(47)/DELETE verify salons.owner_id; GET does not. Any logged-in user reads any salon's private client notes.
- H2. GET /api/staff:6-48 — no auth, selects commission_rate + permissions. Backed by staff_select_public = FOR SELECT USING(is_active=true) (mig 014), no role restriction; RLS can't filter columns → commission_rate+permissions for every active staff exposed to ANON (via route AND anon key directly). FIX: drop those cols from public policy/route; gate GET behind salon ownership.
- H3. GET /api/dashboard/barber-leaderboard — per-staff revenue IDOR. Authed but no ownership check on client-supplied salon_id; returns per-employee revenue (bookings.price_paid) + counts for any salon.

## MEDIUM
- M1. POST /api/directory/[id]/claim — unauth, unthrottled 6-digit claim code (15-min, no attempt cap) → brute-force to claim any listing (returns email/phone/address); Step-1 email-bombing; distinct 404/409/422 enable enumeration. Add IP+target rate limit, attempt cap, uniform errors.
- M2. GET /api/dashboard/clients/[id]/tags — same shape as H1 (auth-only, service-role, no ownership); leaks another salon's client segmentation tags.
- M3. GET /api/dashboard/walkin-analytics — no ownership check on salon_id; returns another salon's walk-in analytics.
- M4. POST /api/dashboard/spa/treatment-outcomes — auth-only; service-role INSERT of PII outcome rows into any client/salon by client-supplied ids (GET gated).
- M5. PATCH /api/bookings/[id] lets CUSTOMER set status completed/no_show. bookingPatchSchema (lib/validations.ts:767) allows those for either role; customer self-marking completed sets completed_at (early release-payments/upcharge eligibility); no_show triggers evaluateBookingPenalties. Role-scope these transitions to salon only.
- M6. POST /api/bookings/express-rebook/confirm — creates a CONFIRMED booking on service-role from client ids with no relational checks: service_id never verified vs slot.salon_id (price_paid can anchor to a cheaper/other-salon service); staff_id/source_booking_id unverified. Gated behind barber_features.
- M7. POST /api/referral/complete — referrer max_uses cap NOT enforced (sybil). Cap only in advisory referral/validate; complete re-checks only the referred caller → N fresh accounts each grant CHF10+CHF10 with no booking/purchase precondition.
- M8. auth/verify-phone/send — rate-limited by IP only (5/min), not per phone; sends to arbitrary client number → SMS-bombing / seven.io cost abuse. Also logs OTP + returns success when SEVEN_API_KEY unset (verification bypass if key missing in prod).

## LOW / hardening
- L1. vouchers/confirm binds no PI↔voucher check (any succeeded PI can confirm a voucher's full value); bounded by vouchers_update_redemption RLS (owner/admin only). Add voucher.stripe_payment_intent_id === payment_intent_id.
- L2. Rate limiting + feature flags FAIL OPEN. applyRateLimit returns null (allows) when Upstash env unset (lib/ratelimit.ts:97); checkFeatureEnabled returns null (allows) on DB error (lib/feature-flags.ts:38). If Upstash not provisioned in prod, rate-limiting silently no-ops. CONFIRM Upstash configured in prod.
- L3. vouchers/validate — code lookup no auth + no rate limit (value-disclosure enumeration); contrast gift-cards/balance (5/min/IP).
- L4. referral/validate:27 — client code interpolated into PostgREST `.or("code.eq.${code},referral_code.eq.${code}")` after only toUpperCase().trim(); commas/parens not stripped → PostgREST filter-expression injection. Use .eq()/parameterized.
- L5. Older SECURITY DEFINER fns lack pinned search_path — handle_new_user (014/076), generate_referral_code + referral trigger (049), discovery fns (067). Add SET search_path=''. (Money/stock RPCs already correct.)
- L6. bookings/[id]/quick-action — cancel flips a possibly-paid booking to cancelled with no refund/hold-release, mutates state on GET (prefetch/scanner bots auto-fire). Latent: no HMAC-token mint site exists today.
- L7. All 24 cron guards + lib/barber/loyalty-qr.ts:29 use non-constant-time ===/!== for secret/HMAC compare. Prefer crypto.timingSafeEqual (house standard in walkin/confirm).
- L8. Anon-writable storage: 005_reviews_trust.sql:46 "Anyone can upload review photos" WITH CHECK(bucket_id='review-photos') + public read — free-CDN/storage-spam (no booking/ownership check). Verify vs live storage policies.
- L9. Admin-namespace ungated: admin/badges GET + admin/salon-of-month GET do ungated service-role reads (public-grade data), admin/notify-new-salon POST no auth (admin-inbox spam), admin/preview-salon DELETE checks auth not role. Other 46 admin routes correctly verify profiles.role==='admin'.
- L10. Dead authz from schema drift: salon/last-minute-settings checks salons.user_id (phantom; live is owner_id) + salon_admins (no such table) — fails closed now, would open if user_id ever added. Fix to owner_id/getActiveSalon.
- L11. getSession() (cookie-decode, no network) used in every API auth gate (lib/auth/require.ts:52) vs getUser(). Documented decision (Rule 25), mitigated by signed httpOnly cookies + middleware getUser(). getClaims() would close the theoretical gap.

## Confirmed solid (no action)
Stripe webhook: sig verify + atomic processed_webhook_events idempotency w/ release-on-failure; amounts/commission from PI. PI routes: server-trusted prices, promo re-validated server-side, deterministic idempotency keys, ownership checks. GDPR endpoints hard-scoped to user.id. clients/[id]/* medical PII scoped to caller's salon. conversations/client-notes/review-creation enforced by RLS. walkin/queue/* 256-bit possession proofs. dev/login hard-gated NODE_ENV==='development'. All 24 crons verify CRON_SECRET.

## Fix order
C1 (delete/gate vouchers/create) → C2 (verify pg_policies on bookings) → H1/H2/H3 (ownership/auth on 3 dashboard/staff GETs) → M-series → L-series.

---

## Task C addendum , service-role authz spot-check (Fable, 2026-07-06, read-only)

Scope: the 8 named service-role files below (none previously covered by name in this doc), plus a 6-route spot-check of dashboard/salon/staff mutation routes for client-id-trusted-instead-of-session-scoped IDOR. All 8 named files: CLEAN. All 6 spot-checked mutation routes: CLEAN (consistent `getActiveSalon(admin, user.id, ...)` pattern, never a client-supplied salon_id for a mutation).

### Verified CLEAN (no gap found)
- **`app/api/directory/route.ts`** , public GET, uses the regular (RLS-respecting) server client not admin (comment confirms `salon_directory` is intentionally public), rate-limited. Not a service-role authz surface at all.
- **`app/api/availability/time-slots/route.ts`** , service-role GET, but the data returned (a salon's open slot times) is legitimately public booking-availability info. The one authenticated branch (line ~95-108, "grey out times I already booked") correctly scopes to `session.user.id` from the caller's own cookie session, never a client-supplied user id.
- **`app/api/availability/unavailable-dates/route.ts`** , same shape, public availability data scoped by `salon_id` query param (legitimately public, needed to render the booking calendar), no user-scoped data returned at all.
- **`app/api/salons/[slug]/gallery/route.ts`** , POST/DELETE/PATCH all independently re-verify `salon.owner_id !== user.id` (lines 37, 140, 210) BEFORE any storage or DB mutation, using a session token decoded via `auth.getUser(sessionToken)`. Correct pattern, repeated identically for all 3 mutating verbs.
- **`app/api/content/route.ts`** , public GET of CMS copy strings (`site_content` table) by an explicit `key` allowlist param, no PII, no mutation endpoint exists on this route. Minor NON-security bug noted: the select list omits `value_it`, so `?locale=it` silently returns empty string content (falls through the `r[localeColumn]` lookup) , functional bug, not a security gap.
- **`app/api/admin/test-salon/route.ts`** , GET/POST/DELETE all independently check `profile.role === "admin"` (via a fresh `profiles` lookup keyed on `session.user.id`, never trusting a client-supplied role) before any service-role operation. DELETE additionally re-verifies `salon.owner_id === session.user.id` AND `salon.name.startsWith(TEST_PREFIX)` before cascading the delete, so an admin can't accidentally (or a stolen-but-scoped session can't be tricked into) delete a real production salon via this path.
- **`app/api/admin/preview-salon/route.ts`** , POST/DELETE both check `profile.role === "admin"` first, and POST additionally re-verifies the target `salon_id` actually has the `[TEST]` name prefix before minting the preview cookie, so this cannot be used to preview/impersonate a real salon.
- **`lib/notifications.ts`** , not an HTTP endpoint; a plain internal helper (`sendNotification({ userId, ... })`) called server-side by other routes with a trusted `userId` they already derived from their own session/booking-ownership check. No authz gap of its own; correctness depends on callers passing the right id, which is the callers' existing responsibility (not re-audited here, out of scope for "does this file authz correctly").

### Mutation-route spot-check (dashboard/salon/staff, client-id-trusts-session test)
Checked: `app/api/salon/dynamic-pricing/route.ts` (GET/POST/DELETE), `app/api/salon/chairs/route.ts`, `app/api/salon/loyalty/route.ts`, `app/api/salon/stations/route.ts`, `app/api/salon/bundles/route.ts` (POST/PATCH/DELETE), `app/api/staff/route.ts`, `app/api/staff/[id]/profile/route.ts`, `app/api/staff/[id]/availability/route.ts`.
- Every mutation route resolves the acting salon via `getActiveSalon<{id:string}>(admin, user.id, "id")` (`lib/active-salon.ts:56`) , i.e. derived from the AUTHENTICATED session's `user.id`, never from a client-supplied `salon_id`/`salonId` body field. This is the correct, consistently-applied pattern across every file checked.
- `dynamic-pricing` DELETE additionally double-scopes the target row: `.eq("id", ruleId).eq("salon_id", salon.id)` (lines 87-91) , so even if an attacker guesses another salon's `rule id`, the delete predicate still requires it to belong to THEIR OWN resolved `salon.id`, closing the classic "delete-by-id-only" IDOR shape.
- `staff/route.ts` and `staff/[id]/profile|availability/route.ts` are GET-only public reads of already-public PDP/booking data (staff roster, public profile, weekly schedule template) , no mutation surface, no PII beyond what the public PDP already shows.
- No new IDOR found in this 6-route spot-check; it corroborates rather than contradicts the H1/H2/H3/M2/M3/M4 findings already logged above (those are a DIFFERENT set of dashboard client-data routes that DO trust a client-supplied id , this spot-check's routes are not among them, but the pattern discrepancy is worth naming: `salon/*` routes uniformly resolve salon_id from session, while several `dashboard/*` routes (H1, H3, M2, M3, M4) accept a client-supplied `salon_id`/`customer_id` with no ownership re-check. The FIX for those should follow the exact `getActiveSalon` pattern already proven correct and consistently used across every `salon/*` route in this spot-check.

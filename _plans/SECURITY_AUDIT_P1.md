# Phase 1 , Backend Security Audit (Solen.ch)

Generated 2026-07-07 by the Fable-orchestrated / Sonnet-executed audit workflow (`w5bbivzk1`).
60 subagents, 29 sections planned, 29 returned findings, adversarially verified.

**Counts:** 11 critical · 22 high · 24 medium · 33 low · 28 sections audited · 90 ranked (deduped) · 118 raw confirmed.

## Executive summary

Phase-1 audited 28 route/section groups across 359 API routes, 192 migrations, middleware, and shared security libs. The posture is "authz-thin, RLS-untrusted, and rate-limit-inconsistent." Confirmed findings cluster into seven systemic patterns rather than isolated bugs:

1. RLS is not a reliable backstop and is actively broken in one catastrophic place. profiles' UPDATE policy has no column restriction, so any authenticated user can PATCH their own row to role='admin' via PostgREST with the public anon key (rank 1). The vouchers table is anon-readable (codes+PII) and anon/any-user-insertable. Several SECURITY DEFINER RPCs (increment_promo_use, next_walkin_ticket_seq, discovery_recent_searches) ship with default PUBLIC EXECUTE. Because the service-role/admin client bypasses RLS everywhere it's used, RLS cannot be leaned on as the primary gate, yet many routes do exactly that.

2. IDOR via GET handlers that skip the ownership check their sibling POST/PATCH enforce. This exact asymmetry recurs across dashboard walkin-analytics, barber-leaderboard, client tags/notes, staff listing, spa treatment-outcomes, and nail ai-history, leaking cross-salon revenue, commission_rate, permissions, and customer PII/health records to any logged-in account (often any customer).

3. Payment/value integrity is the biggest money risk, spread over a promo/voucher/gift-card/credit abuse cluster: gift-card redeem debits any card with no purchase linkage; vouchers/confirm activates any voucher against an unrelated succeeded PaymentIntent with no auth; create-payment-intent trusts a client-chosen deposit amount that is later captured verbatim; save-card lets an attacker attach their card to a victim's booking; the recurring-booking route bypasses the deposit/prepay gate entirely; referral completion is a check-then-act race that double-credits.

4. The S1 stack (feature-flag -> auth -> ban -> rate-limit -> zod) is applied inconsistently. ~30+ routes miss one or more steps, with a sibling route in the same folder doing it correctly, proving convention-drift not intent. getClientIp() trusting spoofable X-Forwarded-For is the highest-leverage instance: it defeats every IP-keyed limiter including the phone-OTP and login brute-force caps.

5. Repo/live drift: RLS policies fixed live (gift_cards gc_public_check, staff_invites invites_by_token, five never-RLS-enabled tables) were never mirrored into migrations, so a fresh apply silently reopens already-fixed holes. Migrations are not the source of truth, and one live-policy state (staff_invites) could not be confirmed and needs a live pg_policies check.

6. Silent no-ops (this codebase's documented #1 failure mode) that give operators false confidence: is_suspended is written by the admin suspend action but read by nothing, so suspending a user does nothing while the UI claims they can no longer log in; tos/notify's RLS-scoped bulk query can only ever see the admin's own row (ToS notifications never fire); the discovery_interactions action enum mismatch silently discards click/share events a live personalization query depends on; staff schedule auto-apply reads long day-keys against short-keyed data.

7. Race conditions (missing CAS) on referral credit, primary + express-rebook slot claims, and loyalty stamps.

SSRF exists (ai-vision, thumb proxy) but is mostly admin-gated or bounded by third-party oExplorer behavior, so it lands high/medium rather than critical. Recommend fixing the RLS profiles hole, the money cluster, and the IDOR GETs first; the large tail of missing-rate-limit routes is safe to batch-fix via the coder+reviewer loop.

## Ranked findings (deduped, most severe first)

### CRITICAL

**1. profiles RLS UPDATE has no column restriction, enabling role='admin' self-promotion via PostgREST**  
`rls-gap` · `supabase/migrations/014_new_schema.sql:74` · fix-risk: **risky**  
- Exploit: Any authenticated customer PATCHes profiles?id=eq.<own-uuid> with {"role":"admin"} using their own session token + the public anon key; profiles_update_own only checks auth.uid()=id and has no WITH CHECK, so the write lands and every S6 DB role re-check across the app now trusts it.
- Fix: Add a SECURITY DEFINER BEFORE UPDATE trigger on profiles that reverts role/account_status/deletion_requested_at to OLD.* for non-service-role callers (RLS/WITH CHECK cannot express column-level limits); apply as a new migration.

**2. Gift-card redemption has no purchase/booking linkage; any authenticated user drains any card's balance**  
`price-manipulation` · `app/api/gift-cards/redeem/route.ts:26` · fix-risk: **risky**  
- Exploit: Any non-banned user who obtains a card code POSTs /api/gift-cards/redeem {code, amount:<full balance>}; the route never checks recipient identity or ties the debit to a real charge, so the card zeroes with no purchase.
- Fix: Add booking_id/payment_intent_id to giftCardRedeemSchema, verify the booking belongs to the caller and amount<=owed, and perform the deduction atomically inside the booking-charge transaction, not as a standalone caller-invokable debit.

**3. vouchers table is anon-SELECTable, leaking every unredeemed voucher's code, amount, and buyer/recipient PII**  
`rls-gap` · `supabase/migrations/20260401_gift_vouchers.sql:32` · fix-risk: **risky**  
- Exploit: GET <project>.supabase.co/rest/v1/vouchers?select=*&redeemed_at=is.null with only the public anon key returns every unredeemed voucher: code, amount, remaining_amount, recipient/buyer email+name, message, salon_id.
- Fix: Drop vouchers_public_read_by_code; replace with a rate-limited SECURITY DEFINER RPC voucher_lookup_by_code(p_code) that exact-matches and returns only redemption columns (no PII) to anon.

**4. vouchers INSERT policy is WITH CHECK(auth.uid() IS NOT NULL) and /api/vouchers/confirm activates any voucher against an unrelated succeeded PaymentIntent with no auth**  
`price-manipulation` · `app/api/vouchers/confirm/route.ts:24` · fix-risk: **risky**  
- Exploit: Attacker INSERTs a voucher row with any amount/salon_id (policy only needs a session), or completes any trivial charge then POSTs /api/vouchers/confirm {payment_intent_id, voucher_id} (no auth, no PI-to-voucher match) to flip remaining_amount to full value and redeem free.
- Fix: Set vouchers_authenticated_insert to WITH CHECK(false) so only the service-role finalizer writes; delete/lock confirm/route.ts (superseded by salon-voucher-handler.ts) or require auth + buyer_id=auth.uid() + paymentIntent.id===voucher.stripe_payment_intent_id + amount match; UNIQUE on stripe_payment_intent_id.

**5. POST /api/stripe/save-card lets any user attach a Stripe customer/PM to another user's booking, hijacking off-session charges**  
`authz-idor` · `app/api/stripe/save-card/route.ts:37` · fix-risk: **risky**  
- Exploit: Attacker with victim's booking_id POSTs {booking_id, customer_id:<own Stripe cust>} with their own session; no booking.user_id check exists, so the webhook writes the attacker's payment method onto the victim's booking and the no-show/fee cron later charges the attacker's card (or a garbage id silently fails the victim's legit fee).
- Fix: Load the booking with the admin client and require booking.user_id===user.id (403 otherwise), ignore the client customer_id and resolve it server-side from profiles.stripe_customer_id, mirroring booking-pay-intent; have the webhook verify si.metadata owner before writing.

**6. Recurring booking route bypasses feature-flag, ban, rate-limit, and the deposit/prepay payment gate**  
`price-manipulation` · `app/api/bookings/recurring/route.ts:8` · fix-risk: **risky**  
- Exploit: Any authenticated (even banned) user POSTs /api/bookings/recurring against a deposit/prepay salon and receives status:'confirmed' with zero payment collected and no PaymentIntent; unconditional slot UPDATE also allows a double-booking race.
- Fix: Add checkFeatureEnabled('bookings'), checkUserBanned, applyRateLimit; route first-occurrence creation through the payment_mode-aware status logic in app/api/bookings/route.ts; make the slot UPDATE conditional on status='available' with rollback.

**7. Salon verification confirmation is a forgeable IDOR: any user's own access token clears warnings on an arbitrary salon_id via GET**  
`authz-idor` · `app/api/salons/verify/route.ts:22` · fix-risk: **risky**  
- Exploit: The cron mints an unsigned btoa(JSON) token but the route calls admin.auth.getUser(token) (a different code path) and, since app_metadata.salon_id is set nowhere, unconditionally trusts the ?salon_id query param; a plain customer calls GET /api/salons/verify?token=<own session token>&salon_id=<any salon> to zero another salon's verification_warnings, defeating the 6-month inactivity freeze.
- Fix: Mint an HMAC-signed token in the cron, verify signature+expiry in the route, derive salon_id only from the verified payload, check token owner_id===salons.owner_id, and convert the state-changing GET to POST.

**8. dashboard/walkin-analytics GET has zero ownership check on salon_id (cross-salon IDOR)**  
`authz-idor` · `app/api/dashboard/walkin-analytics/route.ts:8` · fix-risk: **safe**  
- Exploit: Any authenticated user (customer account suffices) calls GET /api/dashboard/walkin-analytics?salon_id=<victim salon> and receives that salon's full walk-in analytics; salon_id is client-supplied and every query runs via the RLS-bypassing admin client.
- Fix: Resolve the caller's salon via getActiveSalonId(admin,user.id) or verify salons.owner_id===user.id / admin role before any query; reject 403 on mismatch.

**9. dashboard/barber-leaderboard GET has no ownership check on salon_id (full IDOR)**  
`authz-idor` · `app/api/dashboard/barber-leaderboard/route.ts:4` · fix-risk: **safe**  
- Exploit: GET /api/dashboard/barber-leaderboard?salon_id=<any> as any authenticated user returns the full staff list, per-staff revenue (sum price_paid), and walk-in conversion for an arbitrary salon; no owner/getActiveSalon/admin check exists.
- Fix: Add the owner/admin ownership check (getActiveSalon or salons.owner_id===user.id) plus checkFeatureEnabled('barber_features'), checkUserBanned, and applyRateLimit, matching sibling routes.

**10. is_suspended is written by the admin suspend action but read by no auth/session check, so suspending a user is a silent no-op**  
`silent-no-op` · `app/api/admin/users/route.ts:61` · fix-risk: **risky**  
- Exploit: An admin suspends an abusive user and sees a dialog stating the user can no longer log in, but checkUserBanned reads only banned_at/ban_reason and nothing anywhere reads is_suspended, so the target's sessions, logins, bookings, and payments continue unaffected, giving T&S false confidence.
- Fix: Wire is_suspended into checkUserBanned (or a parallel checkUserSuspended called everywhere checkUserBanned is), or migrate suspend writes to set banned_at so a single enforced mechanism exists.

**11. create_group_booking RPC never sets user_id, which the bookings_insert_auth RLS WITH CHECK should reject for every real caller**  
`rls-gap` · `supabase/migrations/071_megabuild_booking_crm_payments.sql:155` · fix-risk: **risky**  
- Exploit: The RPC runs SECURITY INVOKER as the authenticated user and inserts bookings with user_id NULL; bookings_insert_auth is WITH CHECK(auth.uid()=user_id), so every genuine group booking should fail at the INSERT and surface as a misleading 409 slot-conflict, a security-relevant silent feature outage (needs live confirmation).
- Fix: Add p_user_id param, pass the caller's user.id, and set user_id on the INSERT; verify against a live project whether group booking currently works for a non-owner customer.

### HIGH

**12. getClientIp() trusts the spoofable X-Forwarded-For leftmost value, defeating every IP-keyed limiter including auth/OTP brute-force**  
`rate-limit-missing` · `lib/ratelimit.ts:139` · fix-risk: **risky**  
- Exploit: An attacker sends a fresh random X-Forwarded-For per request; getClientIp reads xff[0] as the client IP, landing each request in a new bucket, so the 5/min authLimiter (login, verify-otp, verify-phone/check) and guestLookupLimiter never engage, making the 6-digit phone OTP and login password guessing effectively unthrottled.
- Fix: Prefer Netlify's trusted x-nf-client-connection-ip (already used elsewhere as x-nf-geo), fall back to XFF only when absent; additionally key authLimiter on a second dimension (target email/phone).

**13. create-payment-intent lets the client choose any deposit_amount, ignoring the salon's deposit_percent, and it is later captured verbatim**  
`price-manipulation` · `app/api/stripe/create-payment-intent/route.ts:73` · fix-risk: **risky**  
- Exploit: On checkout, the attacker edits the unsigned booking_intent JSON query param to deposit_amount=CHF 0.50 on a high-value service; the route bounds only by MIN 0.50 and full price (never reads deposit_percent), and the manual-capture PI is captured at that manipulated amount while the slot stays reserved.
- Fix: Select salon.deposit_percent, compute required deposit server-side in Rappen, and use that for the PI instead of trusting client deposit_amount; keep estimated_price as display-only echo.

**14. discovery_recent_searches RPC is SECURITY DEFINER, granted to anon, and trusts a client-supplied p_user_id with no auth.uid() check**  
`authz-idor` · `supabase/migrations/20260531_discovery_recent_and_style_suggest.sql:24` · fix-risk: **risky**  
- Exploit: POST /rest/v1/rpc/discovery_recent_searches {p_user_id:<victim>,p_limit:50} with only the public anon key returns any user's full search history; the Next.js route's session check is irrelevant to direct PostgREST callers (one verifier rated this critical, another medium).
- Fix: Drop the p_user_id parameter and filter on auth.uid() internally; drop the anon grant (keep authenticated only) and add IF p_user_id!=auth.uid() guard as belt-and-braces if the param stays.

**15. increment_promo_use SECURITY DEFINER RPC has no REVOKE/GRANT, defaulting to PUBLIC-executable, letting anyone burn any promo code's usage cap**  
`authz-idor` · `supabase/migrations/20260630_booking_promo_code.sql:23` · fix-risk: **safe**  
- Exploit: POST /rest/v1/rpc/increment_promo_use {p_code:'WELCOME10'} with the anon key increments current_uses with no auth or purchase; looped over codes it exhausts max_uses on limited promos before real customers can redeem, and probes which codes exist.
- Fix: REVOKE EXECUTE FROM PUBLIC,anon,authenticated; GRANT to service_role only (the sole legit caller is the Stripe webhook admin client), mirroring the retail_stock_rpcs_a5 pattern.

**16. Referral completion is a check-then-act race (both /referral/complete and inline in bookings) that double/multi-credits**  
`price-manipulation` · `app/api/referral/complete/route.ts:68` · fix-risk: **risky**  
- Exploit: Concurrent POSTs with the same pending referral_code all pass the status='pending' SELECT before any commits its UPDATE (filtered only by id, no status guard, no affected-row check), so each proceeds to insert user_credits crediting both parties CHF 10 per concurrent request.
- Fix: Add WHERE status='pending' to the UPDATE and verify one row was returned before crediting, or consolidate both call sites into a single SECURITY DEFINER RPC using atomic UPDATE...RETURNING.

**17. GET /api/staff has no auth and no ownership check, leaking commission_rate and permissions for any salon**  
`authz-idor` · `app/api/staff/route.ts:6` · fix-risk: **risky**  
- Exploit: curl /api/staff?salon_id=<any-uuid> with no cookies returns id, name, commission_rate, permissions, and future_bookings for every active staff member; the RLS policy staff_select_public is USING(is_active=true) with no ownership predicate, so the RLS-bound client leaks it platform-wide.
- Fix: Require a session and verify caller is the salon owner or a staff row for that salon before returning sensitive fields; split into a public projection (name/avatar/specialties only) plus an authenticated route for commission_rate/permissions.

**18. client tags/notes GET endpoints skip the ownership check their own POST/DELETE enforce (cross-salon PII IDOR)**  
`authz-idor` · `app/api/dashboard/clients/[id]/tags/route.ts:11` · fix-risk: **safe**  
- Exploit: GET /api/dashboard/clients/<customer>/tags?salon_id=<victim salon> (and /notes) as any authenticated user returns that salon's private CRM notes/tags (allergy/behavior flags, free-text) via the admin client, while POST/DELETE in the same files correctly gate on salons.owner_id.
- Fix: Add the identical owner/admin ownership check present in POST/DELETE to both GET handlers before querying client_tags/client_notes.

**19. client-notes POST lets any customer inject CRM notes into any salon with no relationship/booking check**  
`authz-idor` · `app/api/client-notes/route.ts:50` · fix-risk: **risky**  
- Exploit: Any non-banned customer POSTs /api/client-notes {salon_id:<scraped public salon>, customer_id:<own uid>, note:'...', note_type:'booking'} with no booking_id; it passes zod and the RLS WITH CHECK (customer_id=auth.uid() AND note_type='booking'), and the salon owner then sees the attacker's note in their CRM with no prior relationship.
- Fix: Require an actual bookings row linking customer_id to salon_id (and validate booking_id when supplied) before insert, and tighten the RLS INSERT policy to the same EXISTS-against-bookings condition.

**20. spa/treatment-outcomes POST has no ownership check and no zod validation (IDOR write of forged client health records)**  
`authz-idor` · `app/api/dashboard/spa/treatment-outcomes/route.ts:35` · fix-risk: **safe**  
- Exploit: Any authenticated user POSTs with an arbitrary salon_id/client_id and inserts a forged spa_treatment_outcomes row (fake satisfaction_rating, arbitrary skin_before/after text, unbounded lengths) into another salon's client health records; the GET in the same file has the ownership check, POST does not.
- Fix: Add the file's own GET ownership check (salons.owner_id / admin) before the INSERT and replace the raw body destructure with a validateBody zod schema.

**21. nail/ai-history PATCH has no ownership check, letting any user toggle another salon's AI staging records**  
`authz-idor` · `app/api/dashboard/nail/ai-history/route.ts:36` · fix-risk: **safe**  
- Exploit: Any authenticated user who obtains/guesses a nail_ai_staging row UUID PATCHes is_saved on a record belonging to a different salon; the GET has the ownership check, PATCH only checks that a session exists.
- Fix: Look up the record's salon_id and verify it matches the caller's owned salon (or admin) before the update, mirroring the file's GET handler.

**22. create_group_booking RPC does not validate slot/salon/service consistency or compute price server-side**  
`authz-idor` · `supabase/migrations/071_megabuild_booking_crm_payments.sql:144` · fix-risk: **risky**  
- Exploit: An attacker calls /api/bookings/group with p_salon_id=Salon A but a member slot_id belonging to Salon B; the RPC only checks slot status FOR UPDATE, so it books B's slot while stamping the row salon_id=A, with no price_paid computed or charged.
- Fix: In the RPC loop, join availability_slots to assert slot.salon_id=p_salon_id and service_id/staff_member_id match, and compute price_paid from services.price server-side.

**23. Public GET /api/slots leaks booked_by (customer profile UUID) and booking_id via select(*) with no auth**  
`authz-idor` · `app/api/slots/route.ts:37` · fix-risk: **safe**  
- Exploit: curl /api/slots?salon_id=<uuid>&date=... with no auth returns every slot including booked ones with booked_by (customer profile UUID) and booking_id; the RLS policy slots_select_available is USING(true), enabling anonymous deanonymization of who booked which salon when.
- Fix: Replace select(*) with an explicit column list excluding booked_by and booking_id on the public path (mirror app/api/availability/[salon_id]); gate those fields behind an authenticated-owner check.

**24. Reschedule route has zero rate limit, zero ban check, and only a truthy check on new times**  
`rate-limit-missing` · `app/api/bookings/[id]/reschedule/route.ts:8` · fix-risk: **safe**  
- Exploit: A banned or scripted user loops POST /api/bookings/{id}/reschedule (no throttle anywhere in the chain) and can submit ends_at earlier than starts_at or any duration, written straight onto the booking since only new_starts_at/new_ends_at truthiness is checked.
- Fix: Add checkUserBanned and applyRateLimit(bookingLimiter), and replace the truthy check with a zod schema validating ISO datetimes, ends_at>starts_at, and duration against the service.

**25. GET /api/salons/[slug] (main PDP fetch) has zero rate limiting on the busiest public read path**  
`rate-limit-missing` · `app/api/salons/[slug]/route.ts:15` · fix-risk: **safe**  
- Exploit: Unlimited GET /api/salons/<slug> from one IP each triggers the full loadSalonDetail fan-out (salon + services + staff + reviews + staff_services) with no throttle, enabling high-speed catalogue scraping or DB-load DoS; sibling score/route.ts already rate-limits.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(request)}) at the top of GET, mirroring the sibling score route.

**26. notify/review-posted and notify/review-replied are public unauthenticated email-send endpoints with unescaped body content**  
`missing-auth` · `app/api/notify/review-posted/route.ts:8` · fix-risk: **safe**  
- Exploit: POST /api/notify/review-posted {review_id} with no auth emails the salon owner (spam + Resend cost, and 200-vs-404 enumerates valid review UUIDs); POST /api/notify/review-replied injects attacker-controlled unescaped reply_text HTML into an email sent to the customer, impersonating the salon.
- Fix: Inline the notification into the auth+ownership-gated reviews routes, or require a server-only shared-secret header, add rate limiting, and re-derive reply_text/salon name from the DB rather than the request body.

**27. Directory listing claim's 6-digit verification code has no rate limit, enabling brute-force takeover of unclaimed listings**  
`authz-idor` · `app/api/directory/[id]/claim/route.ts:39` · fix-risk: **safe**  
- Exploit: Attacker triggers a code for a target listing then scripts all 1,000,000 6-digit codes against the same id within the 15-min window (no per-IP/per-id throttle, and step 1 can be re-triggered freely), then claims the listing and pulls back its private contact fields with no proof of inbox control.
- Fix: Add a dedicated tight limiter (guestLookupLimiter pattern) keyed by id and IP on both the send and verify branches, plus a persisted max-attempts counter that invalidates the code after ~5 tries; use constant-time comparison.

**28. TikTok thumbnail proxy /api/discovery/thumb/[id] has zero rate limiting and no feature-flag on an expensive multi-fetch public endpoint**  
`rate-limit-missing` · `app/api/discovery/thumb/[id]/route.ts:66` · fix-risk: **safe**  
- Exploit: Looping requests for un-cached discovery_items ids (enumerable from the public feed) forces a DB lookup + TikTok oEmbed fetch + CDN image fetch + Storage upload per miss with no throttle, a cost-amplification/DoS vector that also risks TikTok blocking the server IP.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(req)}) and checkFeatureEnabled('discovery') at the top of GET.

**29. analyzeDiscoveryImage fetches attacker-influenced URLs with no SSRF guard, no timeout, no content-type gate, no size cap**  
`ssrf` · `lib/ai-vision.ts:215` · fix-risk: **risky**  
- Exploit: An admin session (legit, stolen, or CSRF'd) POSTs /api/admin/discovery/analyze with image_url=http://169.254.169.254/... or an internal target; the bare fetch(imageUrl) has no host restriction, base64s whatever returns (content-type never checked) into Gemini, exfiltrating to the admin UI, and the missing timeout ties up the function. Admin-gated per S6, so bounded but real.
- Fix: Add a shared isSafeFetchUrl() (https-only, reject loopback/RFC1918/link-local/metadata before and after redirects) used by analyzeDiscoveryImage and fetchImageBase64, plus AbortSignal.timeout, a content-type image/ gate, and a response-size cap.

**30. gift_cards anon-readable SELECT policy gc_public_check still in the migrations repo despite being dropped live, reappears on fresh apply**  
`rls-gap` · `supabase/migrations/071_megabuild_booking_crm_payments.sql:128` · fix-risk: **safe**  
- Exploit: Replaying migrations 001-192 to a fresh project (branch, DR, teammate env) recreates gc_public_check USING(true), reopening anon-enumerable gift card codes/balances that the team already fixed live but never mirrored to source control.
- Fix: Add a migration with DROP POLICY IF EXISTS "gc_public_check" ON gift_cards so the repo matches the live fixed state.

**31. staff_invites anon-enumerable SELECT policy invites_by_token still USING(true) in repo with no DROP; live state unconfirmed**  
`rls-gap` · `supabase/migrations/069_megabuild_staff.sql:21` · fix-risk: **risky**  
- Exploit: If still live (needs pg_policies check), anon can SELECT token,email,salon_id,staff_name for every pending invite with the public anon key, bypassing accept-invite's email check; on any fresh migration replay it is definitely recreated.
- Fix: Run SELECT policyname,qual FROM pg_policies WHERE tablename='staff_invites' live; add DROP POLICY IF EXISTS "invites_by_token" ON staff_invites as an idempotent migration and adopt a rule mirroring every live-only RLS drop into a migration.

**32. admin/users PATCH has no audit log, no rate limit, no ban check, and no self/last-admin protection on role changes**  
`missing-auth` · `app/api/admin/users/route.ts:44` · fix-risk: **safe**  
- Exploit: A compromised/rogue admin session PATCHes {user_id,role:'admin'} to escalate an accomplice, {role:'customer'} to demote a rival admin, or {is_suspended:true} to lock accounts, with no audit_log row and no throttle on scripted mass-iteration.
- Fix: Add checkUserBanned, applyRateLimit(adminLimiter), and logAuditEvent for role_change/suspend_toggle, plus a COUNT guard blocking self-downgrade and last-admin demotion.

**33. admin/tos/notify uses the RLS-bound client for a cross-user bulk query, so it can only ever see the calling admin's own row**  
`rls-gap` · `app/api/admin/tos/notify/route.ts:33` · fix-risk: **safe**  
- Exploit: The bulk profiles query runs via createServerSupabaseClient under the profiles SELECT policy USING(auth.uid()=id) with no admin bypass, so it returns at most the admin's own row and the ToS-notify feature returns {success:true, notified_count:0} while notifying nobody, a compliance-relevant silent failure.
- Fix: Use createAdminSupabaseClient() for the cross-user bulk read, consistent with admin/segments and admin/users.

### MEDIUM

**34. Five legacy tables (salon_photos, addons, inventory, sms_reminders, staff_calendars) have USING(true)/WITH CHECK(true) write policies**  
`authz-idor` · `supabase/migrations/004_salon_photos.sql:27` · fix-risk: **risky**  
- Exploit: Any caller (even anon) can INSERT/UPDATE/DELETE arbitrary rows via direct PostgREST; currently low-impact because all five hold 0 rows and no app code queries them, but the hole opens the moment any table is reused.
- Fix: Replace the true-policies with salon-ownership-scoped checks (mirror 069_megabuild_staff.sql) or drop the tables if confirmed dead and log in REMOVED.md.

**35. next_walkin_ticket_seq SECURITY DEFINER RPC has no REVOKE/GRANT, defaulting to PUBLIC-executable**  
`rate-limit-missing` · `supabase/migrations/20260602150000_walkin_ticket_seq.sql:17` · fix-risk: **safe**  
- Exploit: Any anon caller repeatedly POSTs /rest/v1/rpc/next_walkin_ticket_seq {p_salon_id:<any>} to burn through a salon's walk-in ticket sequence, confusing queue numbering (griefing, not financial).
- Fix: REVOKE EXECUTE FROM PUBLIC,anon,authenticated; GRANT to service_role, matching retail_stock_rpcs_a5.

**36. Platform-admin dashboard pages missing from middleware adminOnlyPaths allowlist, reachable by any salon_owner**  
`authz-idor` · `middleware.ts:200` · fix-risk: **safe**  
- Exploit: Any authenticated salon_owner navigates to /de/dashboard/commission-admin, homepage-admin, cities-admin, or admin-sandbox; middleware does not redirect and the client guard passes, so the admin page shell (including admin-sandbox's impersonation UI) renders, though the underlying /api/admin/* calls still 403.
- Fix: Add the four paths to adminOnlyPaths in middleware.ts and add a shared layout-level AdminGuard so future admin pages are not silently exposed.

**37. Gift card balance-check fails open (no rate limit) when Upstash env vars are unset, enabling code enumeration**  
`rate-limit-missing` · `app/api/gift-cards/balance/route.ts:22` · fix-risk: **safe**  
- Exploit: When UPSTASH env vars are missing (a real, boot-succeeding config state since both are .optional()), balanceLimiter is null and the guard skips rate limiting entirely, allowing unthrottled enumeration of valid gift-card codes/balances that feeds the redeem theft.
- Fix: Fail closed (503 or a stricter fallback limiter) when Upstash env vars are missing rather than skipping the limiter, and consider requiring auth for this value-bearing lookup.

**38. Referral completion is implemented twice (referral/complete + inline in bookings) with no shared lock, compounding the race and drift**  
`authz-idor` · `app/api/bookings/route.ts:560` · fix-risk: **risky**  
- Exploit: Calling /api/referral/complete and simultaneously completing a first booking carrying the same referral_code hits two independent, non-communicating find-check-update-credit paths, compounding the double-credit beyond the single-endpoint race.
- Fix: Consolidate both call sites into one shared atomic RPC so there is a single lock point for referral completion.

**39. Six public salon-discovery GET routes have no rate limiting**  
`rate-limit-missing` · `app/api/salons/similar/route.ts:4` · fix-risk: **safe**  
- Exploit: Unlimited per-IP calls to similar, recommendations, last-minute, quartier-counts, quartier-featured (and trending) scrape rankings or drive unthrottled multi-query/RPC DB load; sibling nearby/by-category/by-slugs routes correctly rate-limit.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(request)}) at the top of each GET, matching app/api/salons/nearby.

**40. Salon gallery upload/delete/reorder routes have no rate limit, feature-flag, or ban check**  
`rate-limit-missing` · `app/api/salons/[slug]/gallery/route.ts:10` · fix-risk: **safe**  
- Exploit: A banned or feature-flag-disabled owner (or a should-be-revoked token holder) can still upload/delete/reorder gallery photos since checkUserBanned is absent, and rapid POST+DELETE cycles incur unthrottled Storage egress cost and gallery_urls UPDATEs.
- Fix: Add checkUserBanned(user.id) and applyRateLimit(generalLimiter,{userId:user.id}) after the auth check in POST/DELETE/PATCH.

**41. Public /api/services listing leaks services (names, CHF prices) from hidden/test/inactive salons**  
`rls-gap` · `app/api/services/route.ts:12` · fix-risk: **safe**  
- Exploit: GET /api/services?salon_id=<hidden/test/delisted salon> with no auth returns the full active service list because the RLS policy services_select_active only checks the row's own is_active, never the parent salon's is_active/listed_on_marketplace/is_test.
- Fix: Fetch the salon's visibility flags via the admin client and return empty if not visible (mirror app/api/salon/retail BUG-4), or fix the RLS policy to join salons.

**42. Entire /api/services/* mutation surface (create/edit/delete/reorder/import/photos) missing ban check and rate limit**  
`rate-limit-missing` · `app/api/services/route.ts:25` · fix-risk: **safe**  
- Exploit: A banned salon owner retains full write access to services indefinitely (checkUserBanned never called), and any owner session can script unlimited requests across all five endpoints (including 2MB CSV import) with zero throttle; ownership checks are present but ban/rate are not.
- Fix: Add checkUserBanned and applyRateLimit(generalLimiter,{userId}) after the session resolve in all five files.

**43. Public partner lead-capture POST has no rate limiting**  
`rate-limit-missing` · `app/api/partner/leads/route.ts:11` · fix-risk: **safe**  
- Exploit: Unlimited unauthenticated POSTs with distinct emails write partner_leads rows via the service-role client with no IP/user throttle, enabling storage/cost abuse, lead-quality pollution, or an email-enumeration/spam oracle; sibling salon-draft rate-limits.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(request)}) before the DB insert.

**44. Public unauthenticated GET /api/walkin/queue leaks every waiting customer's full name and queue position by salon_id**  
`pii-exposure` · `app/api/walkin/queue/route.ts:34` · fix-risk: **safe**  
- Exploit: curl /api/walkin/queue?salon_id=<any walk-in salon> with no auth returns customer_name + position + status for every waiting/in-chair customer; salon_id is enumerable from public pages, building a live cross-salon feed of names + shop + position. The route appears to have no current frontend caller.
- Fix: Strip customer_name from the public GET (return only id/position/status/wait like queue-stats), or gate an operator variant behind owner auth; delete the GET if unused and log in REMOVED.md.

**45. express-rebook/confirm slot claim is check-then-act with no CAS guard, enabling a double-booking race**  
`race-condition` · `app/api/bookings/express-rebook/confirm/route.ts:39` · fix-risk: **safe**  
- Exploit: Two concurrent POSTs for the same slot_id both read status='available', both insert a booking and both flip the slot to booked (unconditional .eq('id',slot_id) update, no status guard, no 23P01 handling), so two customers are confirmed for one slot.
- Fix: Make the claim atomic: .update({status:'booked'}).eq('id',slot_id).eq('status','available').select().maybeSingle(); on zero rows delete the just-inserted booking and return 409.

**46. Primary booking creation's slot-claim update lacks a status=available CAS guard on the non-bundle path**  
`race-condition` · `app/api/bookings/route.ts:471` · fix-risk: **safe**  
- Exploit: Two near-simultaneous POST /api/bookings for the same slot_id both pass the initial availability SELECT before either commits; the slot UPDATE is .eq('id',resolvedSlotId) with no status re-check, and the GIST constraint only guards different rows, so both bookings land on one slot on the highest-traffic path.
- Fix: Add .eq('status','available') plus .select().maybeSingle() to the slotUpdate; on a lost race delete the inserted booking and return the existing 409 SLOT_TAKEN.

**47. Customer/salon cancel POST has no rate limiting and no ban check**  
`rate-limit-missing` · `app/api/bookings/[id]/cancel/route.ts:69` · fix-risk: **safe**  
- Exploit: A banned user can still cancel their bookings, trigger refund computation and (customer cancel) an off-session chargeFee attempt, and with no rate limit a script can hammer cancel across booking ids; sibling refund/PATCH routes have both guards.
- Fix: Add checkUserBanned and applyRateLimit(paymentLimiter,{userId}) immediately after the session/user check.

**48. Legacy PATCH /api/bookings/[id] lets the booking's own customer set status to completed/no_show**  
`authz-idor` · `app/api/bookings/[id]/route.ts:106` · fix-risk: **risky**  
- Exploit: A customer PATCHes their own booking to status='completed' before the appointment; bookingPatchSchema permits it and isBookingOwner passes the gate, unlocking review submission (reviews/eligibility checks completed) and counting as a qualifying loyalty visit, letting them fabricate reviews and game Solen Status tier.
- Fix: Restrict transitions per actor: only isSalonOwner may set completed/no_show; isBookingOwner may only reach cancelled; 403 otherwise.

**49. admin/discovery/smart-import's import action bypasses zod, writing raw client body into the public discovery_items table**  
`input-validation` · `app/api/admin/discovery/smart-import/route.ts:45` · fix-risk: **safe**  
- Exploit: An admin (or CSRF'd admin session) POSTs {action:'import', photos:[{url:'not-a-url', author:'A'.repeat(100000), tags:[unbounded]}]}; handleImport upserts verbatim with status:'published', no url-format check or length caps (unlike sibling schemas), and public endpoints filtering status='published' then serve the malformed rows.
- Fix: Define a zod schema for the import action mirroring adminDiscoveryItemSchema (image_url url, length-capped author/alt_text, tags max) and call validateBody before handleImport.

**50. content_reports has no uniqueness or per-target limiter, enabling mass false-flagging of a single review/salon/user**  
`rate-limit-missing` · `app/api/reports/route.ts:33` · fix-risk: **safe**  
- Exploit: A non-banned user scripts POST /api/reports at ~28/min (under the 30/min generalLimiter) with the same targetId; each call inserts a fresh row (no UNIQUE, no upsert), flooding the moderation queue and any report-count escalation logic against one target.
- Fix: Add a unique/partial index on (reporter_id,target_type,target_id) or ON CONFLICT DO NOTHING, plus a dedicated tighter limiter (e.g. 5/hour) for this route.

**51. notifications/off-peak has no rate limit and no per-user-per-salon-per-7-day suppression despite the docstring claiming one**  
`rate-limit-missing` · `app/api/notifications/off-peak/route.ts:12` · fix-risk: **safe**  
- Exploit: An authenticated salon owner calls POST /api/notifications/off-peak repeatedly with no cooldown (the sevenDaysAgo variable is computed but never used), re-sending the off-peak email to every favoriting deals_enabled user each time, burning Resend quota and spamming customers.
- Fix: Add applyRateLimit(generalLimiter,{userId}) and implement the documented suppression via a last-sent timestamp per (salon_id,user_id) checked before sending.

**52. coming-soon-notify is a public unauthenticated write endpoint with zero rate limiting**  
`rate-limit-missing` · `app/api/coming-soon-notify/route.ts:7` · fix-risk: **safe**  
- Exploit: An attacker scripts unlimited POSTs with varied emails/features, upserting unbounded rows into coming_soon_signups with no IP throttle and no abuse signal (errors are swallowed, always returns {ok:true}); sibling newsletter route rate-limits.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(req)}) as the first check.

**53. client-notes GET has no app-level ownership check and no rate limit, relying solely on RLS with zero defense in depth**  
`missing-auth` · `app/api/client-notes/route.ts:10` · fix-risk: **safe**  
- Exploit: Not cross-salon exploitable today (RLS blocks it) but there is no rate limit on this PII-read endpoint and no app-level ownership check, so a future swap to the admin client (the pattern in most sibling client-detail routes) would silently remove the only access control.
- Fix: Add applyRateLimit(generalLimiter,{userId}) to GET and an explicit getActiveSalon ownership check as defense in depth.

**54. Seven public availability/slot endpoints have no rate limiting (scraping + DoS surface)**  
`rate-limit-missing` · `app/api/availability/[salon_id]/route.ts:1` · fix-risk: **safe**  
- Exploit: An attacker loops over salon_ids x date ranges against availability/[salon_id], time-slots, unavailable-dates, services GET, slots GET, slots/last-minute, slots/next-available with no throttle to scrape full calendars or degrade Postgres; sibling cities/categories/search routes rate-limit.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(request)}) as the first line of each of the seven GET handlers.

**55. tiktok_url accepted with only URL-syntax validation; isValidTikTokUrl() exists but is never called, and the thumb fetch has no destination allowlist**  
`ssrf` · `lib/validations.ts:206` · fix-risk: **safe**  
- Exploit: An authenticated user POSTs /api/discovery/post with tiktok_url=http://169.254.169.254/... stored verbatim into discovery_items.tiktok_url, and every downstream consumer treats it as trusted; the thumb route's fetch(freshUrl) has no host allowlist, so any change to TikTok oEmbed behavior turns this into a real internal-fetch primitive.
- Fix: Add .refine(isValidTikTokUrl) to discoveryPostSchema.tiktok_url, discoveryTikTokImportSchema.urls, and createSalonSchema.tiktok_url, and validate freshUrl's hostname against a TikTok CDN allowlist with redirect:'manual' before fetching.

**56. recommendations and recommendations/chips key their guest rate limit on raw X-Forwarded-For instead of getClientIp()**  
`rate-limit-missing` · `app/api/recommendations/route.ts:47` · fix-risk: **safe**  
- Exploit: A guest rotates X-Forwarded-For per request; the raw header becomes the sliding-window key so each request lands in a fresh bucket, defeating the 30/min limiter and forcing a paid Gemini call (recommendations) or a 5-query+RPC fan-out (chips) per hit.
- Fix: Replace req.headers.get('x-forwarded-for') with getClientIp(req) in both files; consider the tighter discoveryAiLimiter for the Gemini path.

**57. Sensitive admin routes lack logAuditEvent, most notably the users PATCH role/suspend mutation**  
`missing-auth` · `app/api/admin/segments/[id]/members/route.ts:20` · fix-risk: **safe**  
- Exploit: A compromised or rogue admin's mutations to feature_requests state and (per rank 32) user roles/suspension leave no forensic trail, making insider abuse of these routes undetectable after the fact; feature-flags PATCH audits even a boolean toggle, so coverage is inconsistent.
- Fix: Add logAuditEvent to state-mutating routes in this section (feature-requests/[id] PATCH and users PATCH per rank 32); treat the read-only segments GETs as lower priority.

### LOW

**58. Five tables created with RLS never enabled in the repo (live snapshot shows RLS on, so repo/live drift, not current exposure)**  
`rls-gap` · `supabase/migrations/025_waitlist.sql:1` · fix-risk: **risky**  
- Exploit: Not currently exploitable (the authoritative live snapshot shows rls:true for waitlist, customer_segments, customer_segment_members, salon_analytics, platform_stats), but a fresh migration replay would leave RLS disabled there, and the repo has no policies so the root-cause drift is real.
- Fix: Add ALTER TABLE ... ENABLE ROW LEVEL SECURITY plus explicit least-privilege policies for all five so a replay matches the live state, and verify live policies actually restrict access.

**59. POST /api/stripe/create-customer never checks for an existing stripe_customer_id despite the comment, minting orphan duplicates**  
`silent-no-op` · `app/api/stripe/create-customer/route.ts:26` · fix-risk: **safe**  
- Exploit: Not exploitable today (no live caller found); if wired up it would silently create a duplicate Stripe customer per call and never persist the id, fragmenting saved payment methods from the canonical stripe_customer_id.
- Fix: Read profiles.stripe_customer_id first and return it if present, else create and persist the id; if truly unused, remove per the graveyard protocol.

**60. Barber loyalty stamp/redeem increments are not CAS-guarded (low-severity race, salon-staff actor)**  
`race-condition` · `app/api/loyalty/stamp/route.ts:74` · fix-risk: **safe**  
- Exploit: Two near-simultaneous stamp requests for the same card (double-tap / scanner race) skip validation of the prior read and could award an extra stamp or double-trigger redeem; the actor must be the salon owner, so blast radius is a self-harm business-logic race.
- Fix: Add a CAS filter on the update (.eq('stamps_collected',card.stamps_collected) / .eq('status','completed')) and verify a row was affected before proceeding.

**61. Cron routes compare CRON_SECRET with plain !== instead of constant-time comparison**  
`authentication` · `app/api/cron/auto-complete/route.ts:11` · fix-risk: **safe**  
- Exploit: Theoretically a remote timing attack on the Bearer token, but impractical: internet-level jitter dwarfs the nanosecond early-exit difference, CRON_SECRET is >=16 chars, and this is a consistent house pattern across all 24+ cron routes (UNCERTAIN).
- Fix: Wrap the header comparison in crypto.timingSafeEqual on equal-length Buffers (already used in guest-access.ts); low priority.

**62. GET /api/services/suggest makes a live Gemini call per request with no rate limit (auth is present)**  
`rate-limit-missing` · `app/api/services/suggest/route.ts:8` · fix-risk: **safe**  
- Exploit: A logged-in (even freshly registered) user scripts unlimited GETs, each billing the Gemini API key, since there is no rate limit despite the session requirement; the original 'unauthenticated' claim was refuted (getSession + 401 is present).
- Fix: Add applyRateLimit(generalLimiter,{userId:session.user.id}) before the Gemini call.

**63. Waitlist POST routes (bookings/waitlist and /waitlist) have no rate limit and no ban check**  
`rate-limit-missing` · `app/api/bookings/waitlist/route.ts:5` · fix-risk: **safe**  
- Exploit: An authenticated (including banned) user scripts inserts/upserts by varying service_id/preferred_date to defeat the unique-constraint dedup, flooding booking_waitlist/waitlist with rows; reviews/route.ts shows the expected checkFeatureEnabled+ban+rate stack.
- Fix: Add applyRateLimit(bookingLimiter or generalLimiter,{userId}) and checkUserBanned before the insert in both files.

**64. dashboard/batch has no rate limiting despite fanning out up to 5 parallel DB queries per call**  
`rate-limit-missing` · `app/api/dashboard/batch/route.ts:18` · fix-risk: **safe**  
- Exploit: An authenticated account scripts repeated POSTs with all 5 batch keys, multiplying DB query volume ~5x per HTTP call against their own/admin-accessible salon with no throttle; ownership is correctly enforced so this is amplification not IDOR.
- Fix: Add applyRateLimit(generalLimiter,{userId:session.user.id}) after the auth check.

**65. Several barber/coiffeur/nail GET routes skip feature-flag and rate-limit checks (S1 gap vs sibling routes)**  
`rate-limit-missing` · `app/api/dashboard/barber/pl-comparison/route.ts:16` · fix-risk: **safe**  
- Exploit: An authenticated low-trust account calls pl-comparison, cycle-metrics, consultations, infill-due, reminder-metrics, retail-sales, stations/utilization with no rate ceiling and no kill-switch via the category feature flags; sibling fade-blueprints/spa-rooms have both.
- Fix: Add checkFeatureEnabled(<flag>) and applyRateLimit(generalLimiter,{userId}) to each listed route.

**66. barber-reminders/send has no audit log for the outbound PII email it sends**  
`missing-auth` · `app/api/dashboard/barber-reminders/send/route.ts:52` · fix-risk: **safe**  
- Exploit: The full S1 stack is present but no logAuditEvent, so repeated/abusive reminder-sends by a malicious owner leave no forensic trail beyond the client_notes row; the whole dashboard module lacks audit logging.
- Fix: Add logAuditEvent after the Resend send recording actor, action='barber_reminder_sent', target=client_id, salon_id.

**67. Test-salon and seed admin routes have no rate limiting**  
`rate-limit-missing` · `app/api/admin/seed-test-salons/route.ts:111` · fix-risk: **safe**  
- Exploit: A compromised admin session loops POST seed-test-salons / test-salon / test-salon/seed with no throttle, each doing many inserts (up to 14 days x ~18 slots x 4 templates x N cities); role is correctly DB-verified so this is DB-load/cost only.
- Fix: Add applyRateLimit(adminLimiter,{userId}) after the role check in every handler of the four files, matching salons/commission.

**68. GET /api/admin/revenue has no rate limit**  
`rate-limit-missing` · `app/api/admin/revenue/route.ts:7` · fix-risk: **safe**  
- Exploit: A compromised admin session hammers this endpoint's date-range bookings + salon_payouts + salons queries plus in-memory aggregation unthrottled; commission/route.ts rate-limits, this is the odd one out.
- Fix: Add applyRateLimit(adminLimiter or generalLimiter,{userId}) right after the role check.

**69. GET /api/admin/salon-of-month has zero auth/role check and zero rate limit**  
`missing-auth` · `app/api/admin/salon-of-month/route.ts:10` · fix-risk: **safe**  
- Exploit: Anyone unauthenticated calls GET repeatedly to run a sorted top-5 query over active salons via the service-role client (RLS bypassed) with no session, role, or rate limit; the POST handler in the same file correctly checks role.
- Fix: Add the same session + profiles.role==='admin' check used in this file's POST, plus applyRateLimit.

**70. salon_of_month admin action is a silent no-op: nothing reads the flag it writes**  
`silent-no-op` · `app/api/admin/salon-of-month/route.ts:47` · fix-risk: **risky**  
- Exploit: An admin picks a salon of the month and gets success, but the value is embedded in a feature_flags.description string with zero consumers anywhere, so no customer-facing surface reflects it (functional, not security).
- Fix: Wire a consumer that reads it (or add a dedicated salon_of_month_id column) and render it, or remove/relabel the action until a consumer exists.

**71. POST /api/admin/notify-new-salon has no admin/auth check, only IP rate limit**  
`rate-limit-missing` · `app/api/admin/notify-new-salon/route.ts:16` · fix-risk: **safe**  
- Exploit: Any unauthenticated caller POSTs attacker-controlled salon_name/email/address to trigger an email to ADMIN_EMAIL, throttled only 30/min per IP (no cross-IP cap), enabling inbox-flooding via IP rotation; no in-repo caller found.
- Fix: Move it out of /api/admin/** and add a dedicated low-cap limiter if it must stay public, or add a server-only shared-secret check if it should be internal.

**72. Salon gallery routes only check client-supplied MIME type (no magic-byte sniff) and PATCH accepts arbitrary URL strings**  
`input-validation` · `app/api/salons/[slug]/gallery/route.ts:47` · fix-risk: **safe**  
- Exploit: An owner uploads a file with a spoofed Content-Type:image/png whose bytes are HTML/SVG-with-script (served publicly via getPublicUrl with no bucket content-type lock, a stored-content-spoofing vector), and PATCH writes arbitrary strings into gallery_urls (hotlinks, tracking pixels, broken renderer) with only Array.isArray validation.
- Fix: Sniff actual file magic bytes server-side before upload, lock the storage bucket to a fixed Content-Type/Content-Disposition, and validate urls with z.array(z.string().url()) asserting the salon's own storage prefix.

**73. is_test=false filter missing on several discovery endpoints, letting seed/test salons surface publicly**  
`silent-no-op` · `app/api/salons/similar/route.ts:25` · fix-risk: **safe**  
- Exploit: Not attacker-exploitable; test/seed salons surface in nearby/similar/recommended/by-category results shown to real customers because those queries filter only is_active + listed_on_marketplace, undermining is_test's intent (main search and trending correctly filter it).
- Fix: Add .eq('is_test',false) to the salons queries in the five listed files.

**74. PUT /api/salon/retail missing ban check and rate limit present on its sibling verbs**  
`missing-auth` · `app/api/salon/retail/route.ts:83` · fix-risk: **safe**  
- Exploit: A banned salon owner can still PUT retail product edits indefinitely (ban only blocks POST/DELETE in this file), and no PUT caller is throttled.
- Fix: Add checkUserBanned(user.id) and applyRateLimit(generalLimiter,{userId}) after resolving the session user in PUT, matching POST/DELETE.

**75. last-minute-settings ownership check reads phantom column salons.user_id and phantom table salon_admins (fails closed)**  
`silent-no-op` · `app/api/salon/last-minute-settings/route.ts:29` · fix-risk: **safe**  
- Exploit: Not exploitable today (both references are undefined, so GET/POST always 403 including for the real owner, a dead feature); the latent risk is a future migration adding a real salons.user_id or salon_admins with different semantics silently flipping the check to pass with wrong logic.
- Fix: Replace the check with the getActiveSalon(supabase,session.user.id) pattern used elsewhere and drop the salon_admins query.

**76. POST /api/staff/accept-invite has no rate limit unlike sibling staff routes**  
`rate-limit-missing` · `app/api/staff/accept-invite/route.ts:8` · fix-risk: **safe**  
- Exploit: An authenticated attacker calls accept-invite unlimited times (3-5 DB round-trips each) for cost/DoS and can use the distinct 403/404/410 codes as a probing oracle; brute force itself is infeasible given the 32-byte token.
- Fix: Add applyRateLimit(generalLimiter,{userId}) after the auth check, matching staff/invite and staff/portfolio.

**77. PATCH /api/staff/[id] has no zod schema; arbitrary-typed values can be written to commission_rate/permissions**  
`input-validation` · `app/api/staff/[id]/route.ts:31` · fix-risk: **safe**  
- Exploit: An owner (or stolen owner session) PATCHes {permissions:'admin'} or {commission_rate:-999999}; the write succeeds with no validation and downstream my-schedule reads staff.permissions as string[] then .includes(), causing substring-match misbehavior or a 500.
- Fix: Add a zod schema (commission_rate number 0-100, permissions array of enum, years_experience int 0-80) and run validateBody before building the update.

**78. staff/schedule/auto-apply reads opening_hours with long day-name keys while the column is short-keyed, silently discarding configured hours**  
`silent-no-op` · `app/api/staff/schedule/auto-apply/route.ts:46` · fix-risk: **safe**  
- Exploit: Not attacker-facing; every auto-apply call produces the hardcoded 09:00-18:00 default for all 7 days because dayMap uses monday/tuesday against a mon/tue-keyed object, so hours?.[day] never resolves, silently ignoring the salon's real hours.
- Fix: Change dayMap to short keys {mon:1,...,sun:0} or reuse the DAY_OFFSET mapping from app/api/slots/bulk.

**79. walkin/queue-stats and walkin/salon-info have no rate limiting and no feature-flag gating unlike sibling walk-in routes**  
`rate-limit-missing` · `app/api/walkin/queue-stats/route.ts:1` · fix-risk: **safe**  
- Exploit: Unlimited requests to queue-stats/salon-info by salon_id run live admin-client DB reads (barber_walkin_queue/staff_members/services/salons) with no throttle and, lacking checkFeatureEnabled('barber_features'), keep serving even when the walk-in kill-switch is off.
- Fix: Add checkFeatureEnabled('barber_features') and applyRateLimit(generalLimiter,{ip:getClientIp(req)}) to both GET handlers.

**80. Group booking route's salon-existence check is dead code gated on an unrelated field**  
`silent-no-op` · `app/api/bookings/group/route.ts:30` · fix-risk: **safe**  
- Exploit: The eq filter is gated on the truthiness of a member's service_id rather than validating salon_id, and the result is never referenced; a non-existent salon_id reaches the RPC and surfaces as a confusing 409 instead of a clean 404 (not an authz bypass since the RPC is the real gate).
- Fix: Either delete the dead fetch or make it real: .eq('id',body.salon_id).single() and 404 if missing before calling the RPC.

**81. POST /api/favorites/toggle has no rate limiting**  
`rate-limit-missing` · `app/api/favorites/toggle/route.ts:29` · fix-risk: **safe**  
- Exploit: An authenticated attacker scripts unbounded toggles generating unlimited insert/delete churn on their own favorites rows (abuse/resource, not cross-user); sibling profile/favorites rate-limits all three handlers.
- Fix: Add applyRateLimit(generalLimiter,{userId:user.id}) after the auth check.

**82. /api/reports skips the feature-flag/maintenance-mode check and has no zod validation on target_id/details**  
`input-validation` · `app/api/reports/route.ts:21` · fix-risk: **safe**  
- Exploit: target_id/details are destructured raw with no validateBody and no length cap, so a user can insert arbitrarily large details on every request (storage/DoS-lite), and this is the one moderation endpoint that keeps running during a maintenance-mode flip that disables every sibling.
- Fix: Add 'reports' to FeatureKey + a flag row, call checkFeatureEnabled('reports') (restores maintenance coverage), and validate with a zod schema (targetId uuid, reason enum, details max 1000).

**83. reviews INSERT RLS policy checks salon-level booking existence but never joins the actual booking_id**  
`authz-idor` · `supabase/migrations/061_fix_review_inserts.sql:12` · fix-risk: **risky**  
- Exploit: Not exploitable today (both live write paths re-verify or use service role), but the WITH CHECK accepts 'confirmed' not just 'completed' and never references reviews.booking_id, so a future direct-client insert path could let a merely-confirmed booking post a review with any booking_id.
- Fix: Tighten WITH CHECK to join bookings on reviews.booking_id with b.user_id=auth.uid(), b.salon_id=reviews.salon_id, b.status='completed' (OR source='google' OR walkin_queue_id IS NOT NULL).

**84. content, homepage-sections, and brand/[slug] public GETs have zero rate limiting (content/keys also uncapped)**  
`rate-limit-missing` · `app/api/content/route.ts:7` · fix-risk: **safe**  
- Exploit: Unlimited GETs hit the RLS-bypassing service-role client with no IP throttle (sibling help/route.ts is protected), and /api/content's keys param is an uncapped comma-split fed into .in('key',keys), cheaply multiplying query volume.
- Fix: Add applyRateLimit(generalLimiter,{ip:getClientIp(req)}) to all three and cap parsed keys (e.g. slice(0,50)).

**85. off-peak and notifications/off-peak routes never call checkUserBanned**  
`missing-auth` · `app/api/off-peak/route.ts:14` · fix-risk: **safe**  
- Exploit: A banned salon-owner account still has owner_id matching their salon, so GET/POST/DELETE on off-peak and POST on notifications/off-peak all succeed, letting a banned owner keep manipulating pricing rules and firing customer emails post-ban.
- Fix: Add checkUserBanned(user.id) immediately after the auth check in off-peak (GET/POST/DELETE) and notifications/off-peak POST.

**86. off-peak POST email block queries nonexistent table user_favorites instead of favorites, so deal-alert emails silently never fire**  
`silent-no-op` · `app/api/off-peak/route.ts:109` · fix-risk: **safe**  
- Exploit: Not attacker-exploitable; every POST /api/off-peak silently no-ops its email path (the query targets user_favorites, which exists nowhere; the real table is favorites) inside a swallowed try/catch that still returns 201, so opted-in users never get deal alerts via this trigger.
- Fix: Change .from('user_favorites') to .from('favorites') to match the real table used everywhere else.

**87. No rate limit on public analytics ingestion endpoint track-view**  
`rate-limit-missing` · `app/api/analytics/track-view/route.ts:11` · fix-risk: **safe**  
- Exploit: Looping POST /api/analytics/track-view {salon_id,source} with a fresh/absent cookie jar passes zod and triggers an unthrottled admin-client insert each time, letting an attacker inflate/pollute a competitor's view-count analytics or bloat the table.
- Fix: Add applyRateLimit(generalLimiter or a dedicated low-cap limiter,{ip:getClientIp(req)}) before the insert.

**88. Unhandled JSON.parse on viewedSalonIds query param bypasses the recommendations route's own try/catch fallback**  
`input-validation` · `app/api/recommendations/route.ts:76` · fix-risk: **safe**  
- Exploit: GET /api/recommendations?viewedSalonIds=not-json triggers an uncaught SyntaxError before the try block starts, returning a raw error instead of the intended graceful fallback (no data exposure).
- Fix: Move the JSON.parse inside a try/catch and default to [] on parse failure.

**89. Unbounded .ilike() length on treatment/city params in public search/treatments**  
`input-validation` · `app/api/search/treatments/route.ts:33` · fix-risk: **safe**  
- Exploit: A caller sends a multi-KB treatment/city value interpolated raw into ilike patterns; rate-limiting bounds volume so residual risk is only extra per-request CPU, inconsistent with sibling search routes that .slice(0,100).
- Fix: Add .slice(0,100) to treatment and city after reading them, matching search/suggest and search/no-results.

**90. search/treatments price_asc sort is applied client-side over a single paginated page (pagination correctness no-op)**  
`silent-no-op` · `app/api/search/treatments/route.ts:116` · fix-risk: **risky**  
- Exploit: Not an authz exploit; with sort=price_asc the DB still orders by rating and paginates before a client-side .sort() by price runs on the already-sliced page, so page 2 of 'cheapest first' can show items more expensive than page 1.
- Fix: Resolve the full matching id set, sort by price across all of them, then slice the requested page (mirror the computed-filter pattern in app/api/salons/route.ts), or add a real DB-level price ORDER BY.

## Fix queue A , SAFE (apply via coder+reviewer, no owner sign-off)

1. dashboard/walkin-analytics GET has zero ownership check on salon_id (cross-salon IDOR)
2. dashboard/barber-leaderboard GET has no ownership check on salon_id (full IDOR)
3. client tags/notes GET endpoints skip the ownership check their own POST/DELETE enforce (cross-salon PII IDOR)
4. spa/treatment-outcomes POST has no ownership check and no zod validation (IDOR write of forged client health records)
5. nail/ai-history PATCH has no ownership check, letting any user toggle another salon's AI staging records
6. Public GET /api/slots leaks booked_by (customer profile UUID) and booking_id via select(*) with no auth
7. Reschedule route has zero rate limit, zero ban check, and only a truthy check on new times
8. GET /api/salons/[slug] (main PDP fetch) has zero rate limiting on the busiest public read path
9. TikTok thumbnail proxy /api/discovery/thumb/[id] has zero rate limiting and no feature-flag on an expensive multi-fetch public endpoint
10. increment_promo_use SECURITY DEFINER RPC has no REVOKE/GRANT, defaulting to PUBLIC-executable, letting anyone burn any promo code's usage cap
11. gift_cards anon-readable SELECT policy gc_public_check still in the migrations repo despite being dropped live, reappears on fresh apply
12. next_walkin_ticket_seq SECURITY DEFINER RPC has no REVOKE/GRANT, defaulting to PUBLIC-executable
13. Gift card balance-check fails open (no rate limit) when Upstash env vars are unset, enabling code enumeration
14. Six public salon-discovery GET routes have no rate limiting
15. Salon gallery upload/delete/reorder routes have no rate limit, feature-flag, or ban check
16. Entire /api/services/* mutation surface (create/edit/delete/reorder/import/photos) missing ban check and rate limit
17. Public partner lead-capture POST has no rate limiting
18. Public unauthenticated GET /api/walkin/queue leaks every waiting customer's full name and queue position by salon_id
19. express-rebook/confirm slot claim is check-then-act with no CAS guard, enabling a double-booking race
20. Primary booking creation's slot-claim update lacks a status=available CAS guard on the non-bundle path
21. Customer/salon cancel POST has no rate limiting and no ban check
22. admin/discovery/smart-import's import action bypasses zod, writing raw client body into the public discovery_items table
23. content_reports has no uniqueness or per-target limiter, enabling mass false-flagging of a single review/salon/user
24. notifications/off-peak has no rate limit and no per-user-per-salon-per-7-day suppression despite the docstring claiming one
25. coming-soon-notify is a public unauthenticated write endpoint with zero rate limiting
26. client-notes GET has no app-level ownership check and no rate limit, relying solely on RLS with zero defense in depth
27. Seven public availability/slot endpoints have no rate limiting (scraping + DoS surface)
28. tiktok_url accepted with only URL-syntax validation; isValidTikTokUrl() exists but is never called, and the thumb fetch has no destination allowlist
29. recommendations and recommendations/chips key their guest rate limit on raw X-Forwarded-For instead of getClientIp()
30. Sensitive admin routes lack logAuditEvent, most notably the users PATCH role/suspend mutation
31. POST /api/stripe/create-customer never checks for an existing stripe_customer_id despite the comment, minting orphan duplicates
32. Barber loyalty stamp/redeem increments are not CAS-guarded (low-severity race, salon-staff actor)
33. Cron routes compare CRON_SECRET with plain !== instead of constant-time comparison
34. GET /api/services/suggest makes a live Gemini call per request with no rate limit (auth is present)
35. Waitlist POST routes (bookings/waitlist and /waitlist) have no rate limit and no ban check
36. dashboard/batch has no rate limiting despite fanning out up to 5 parallel DB queries per call
37. Several barber/coiffeur/nail GET routes skip feature-flag and rate-limit checks (S1 gap vs sibling routes)
38. barber-reminders/send has no audit log for the outbound PII email it sends
39. Test-salon and seed admin routes have no rate limiting
40. GET /api/admin/revenue has no rate limit
41. Salon gallery routes only check client-supplied MIME type (no magic-byte sniff) and PATCH accepts arbitrary URL strings
42. is_test=false filter missing on several discovery endpoints, letting seed/test salons surface publicly
43. PUT /api/salon/retail missing ban check and rate limit present on its sibling verbs
44. last-minute-settings ownership check reads phantom column salons.user_id and phantom table salon_admins (fails closed)
45. POST /api/staff/accept-invite has no rate limit unlike sibling staff routes
46. PATCH /api/staff/[id] has no zod schema; arbitrary-typed values can be written to commission_rate/permissions
47. staff/schedule/auto-apply reads opening_hours with long day-name keys while the column is short-keyed, silently discarding configured hours
48. walkin/queue-stats and walkin/salon-info have no rate limiting and no feature-flag gating unlike sibling walk-in routes
49. Group booking route's salon-existence check is dead code gated on an unrelated field
50. POST /api/favorites/toggle has no rate limiting
51. /api/reports skips the feature-flag/maintenance-mode check and has no zod validation on target_id/details
52. content, homepage-sections, and brand/[slug] public GETs have zero rate limiting (content/keys also uncapped)
53. off-peak and notifications/off-peak routes never call checkUserBanned
54. off-peak POST email block queries nonexistent table user_favorites instead of favorites, so deal-alert emails silently never fire
55. No rate limit on public analytics ingestion endpoint track-view
56. Unhandled JSON.parse on viewedSalonIds query param bypasses the recommendations route's own try/catch fallback
57. Unbounded .ilike() length on treatment/city params in public search/treatments
58. admin/tos/notify uses the RLS-bound client for a cross-user bulk query, so it can only ever see the calling admin's own row
59. admin/users PATCH has no audit log, no rate limit, no ban check, and no self/last-admin protection on role changes

## Fix queue B , NEEDS OWNER REVIEW (live auth/payments/RLS or a judgment call)

1. profiles RLS UPDATE has no column restriction, enabling role='admin' self-promotion via PostgREST
2. Gift-card redemption has no purchase/booking linkage; any authenticated user drains any card's balance
3. vouchers table is anon-SELECTable, leaking every unredeemed voucher's code, amount, and buyer/recipient PII
4. vouchers INSERT policy is WITH CHECK(auth.uid() IS NOT NULL) and /api/vouchers/confirm activates any voucher against an unrelated succeeded PaymentIntent with no auth
5. POST /api/stripe/save-card lets any user attach a Stripe customer/PM to another user's booking, hijacking off-session charges
6. Recurring booking route bypasses feature-flag, ban, rate-limit, and the deposit/prepay payment gate
7. Salon verification confirmation is a forgeable IDOR: any user's own access token clears warnings on an arbitrary salon_id via GET
8. is_suspended is written by the admin suspend action but read by no auth/session check, so suspending a user is a silent no-op
9. create_group_booking RPC never sets user_id, which the bookings_insert_auth RLS WITH CHECK should reject for every real caller
10. getClientIp() trusts the spoofable X-Forwarded-For leftmost value, defeating every IP-keyed limiter including auth/OTP brute-force
11. create-payment-intent lets the client choose any deposit_amount, ignoring the salon's deposit_percent, and it is later captured verbatim
12. discovery_recent_searches RPC is SECURITY DEFINER, granted to anon, and trusts a client-supplied p_user_id with no auth.uid() check
13. Referral completion is a check-then-act race (both /referral/complete and inline in bookings) that double/multi-credits
14. GET /api/staff has no auth and no ownership check, leaking commission_rate and permissions for any salon
15. client-notes POST lets any customer inject CRM notes into any salon with no relationship/booking check
16. create_group_booking RPC does not validate slot/salon/service consistency or compute price server-side
17. notify/review-posted and notify/review-replied are public unauthenticated email-send endpoints with unescaped body content
18. Directory listing claim's 6-digit verification code has no rate limit, enabling brute-force takeover of unclaimed listings
19. analyzeDiscoveryImage fetches attacker-influenced URLs with no SSRF guard, no timeout, no content-type gate, no size cap
20. staff_invites anon-enumerable SELECT policy invites_by_token still USING(true) in repo with no DROP; live state unconfirmed
21. Five legacy tables (salon_photos, addons, inventory, sms_reminders, staff_calendars) have USING(true)/WITH CHECK(true) write policies
22. Platform-admin dashboard pages missing from middleware adminOnlyPaths allowlist, reachable by any salon_owner
23. Referral completion is implemented twice (referral/complete + inline in bookings) with no shared lock, compounding the race and drift
24. Public /api/services listing leaks services (names, CHF prices) from hidden/test/inactive salons
25. Legacy PATCH /api/bookings/[id] lets the booking's own customer set status to completed/no_show
26. Five tables created with RLS never enabled in the repo (live snapshot shows RLS on, so repo/live drift, not current exposure)
27. salon_of_month admin action is a silent no-op: nothing reads the flag it writes
28. reviews INSERT RLS policy checks salon-level booking existence but never joins the actual booking_id
29. search/treatments price_asc sort is applied client-side over a single paginated page (pagination correctness no-op)
30. GET /api/admin/salon-of-month has zero auth/role check and zero rate limit
31. POST /api/admin/notify-new-salon has no admin/auth check, only IP rate limit

---

## OWNER ACTION QUEUE (live-verified 2026-07-07, supersedes the synthesis Fix Queue B)

After live DB verification (pg_policies + Supabase advisor + legit-path tracing), these need an owner decision or an action only the owner can take. I did NOT auto-apply them because each either interacts with a live payment/purchase flow, needs a new secret, or is a prod-config toggle.

### Needs an owner decision (would risk a live flow if guessed)
1. **vouchers INSERT RLS** , live `WITH CHECK` is `role='admin' OR auth.uid() IS NOT NULL`, so any authed user can forge a voucher row. BUT the legit purchase inserts via the user's client (`app/api/vouchers/route.ts:87`, sets `buyer_id`), and may support guest checkout, so admin-only would break purchases. Recommended: `WITH CHECK (buyer_id = (select auth.uid()))` IF guest voucher purchase is not a thing; plus ensure `remaining_amount` cannot be client-set (webhook-only). Confirm the guest-checkout question first.
2. **recurring-booking deposit gate** (`app/api/bookings/recurring/route.ts`) , now has auth/ban/rate-limit + slot CAS, but still inserts `status:'confirmed'` with `price_paid` computed and ZERO collected. Decide the payment model for recurring bookings (route through the normal `payment_mode` logic).
3. **salons/verify HMAC token** , IDOR is closed (ownership check), but the token scheme is still a plain base64 blob. Full fix needs a `VERIFY_SECRET` env var to HMAC-sign the emailed link. Provision the secret, then the signing can be added. (Also: `dashboard/settings/page.tsx:628` POSTs to this GET-only route , the re-verify button is already broken/405, unrelated pre-existing bug.)

### Prod-config toggles (owner-only, not code)
4. **Leaked-password protection is OFF** , enable in Supabase Auth settings (checks HaveIBeenPwned). One toggle. [remediation](https://supabase.com/docs/guides/auth/password-security)
5. **3 public buckets allow listing** (`discovery-images`, `gift-card-assets`, `service-photos`) , clients can list all files. Tighten the storage SELECT policy to object-URL access only.

### Needs per-item review (potential IDOR, but could break discovery/search)
6. **6 SECURITY DEFINER functions** callable by anon/authenticated take a `user_id`/params: `toggle_discovery_like(p_user_id)`, `toggle_discovery_save(p_user_id)`, `current_user_tier(uid)`, `set_customer_persona`, `search_salons_ranked`, `search_suggest`. Verify each ignores the passed id and uses `auth.uid()` internally (or revoke EXECUTE). The `toggle_*` ones taking an explicit `p_user_id` are the suspicious ones (act-as-another-user).
7. **2 SECURITY DEFINER views** (`profile_summaries`, `public_profiles`) , confirm they expose only intended columns (they run with creator privileges, bypassing RLS).
8. **quartier_subscriptions INSERT** is `WITH CHECK (true)` , anyone can insert. Low impact (email capture). Restrict if desired.

### Informational (NOT holes)
- **16 RLS-enabled-no-policy tables** (customer_segments*, discovery_boards*, partner_leads, platform_stats, processed_webhook_events, salon_engagement, salon_page_views, search_events, sms_reminders, waitlist, ...) are **locked** (deny-all to anon/authenticated); the app reaches them via the service-role client. Not a leak.
- **save-card webhook defense-in-depth**: the primary IDOR is closed at the route; the `setup_intent.succeeded` handler in `stripe/webhook/route.ts` could additionally re-verify owner (optional hardening).

### Applied live this session (verified)
- profiles privilege-column guard trigger (critical #1) , migration `20260707120000`.
- gift_cards SELECT scoped to owner (critical #2b) , migration `20260707130000`.

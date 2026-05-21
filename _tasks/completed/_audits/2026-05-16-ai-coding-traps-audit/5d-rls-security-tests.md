## Topic 5D — RLS policies + security-critical paths needing tests

**Scope:** `supabase/migrations/` (125 SQL files), `app/api/` (~340 route handlers), `middleware.ts`, `lib/supabase.ts`, `lib/ratelimit.ts`.

**Counts:**
- 286 `CREATE POLICY` statements
- 117 `ALTER TABLE … ENABLE ROW LEVEL SECURITY` statements
- 5 raw `SUPABASE_SERVICE_ROLE_KEY` references (4 unique files)
- ~322 `supabase.auth.getSession()` calls in API routes vs only 5 `getUser()` calls
- 19 routes use `applyRateLimit(...)` from `lib/ratelimit.ts`

---

## RLS coverage by table

| Table | RLS enabled | SELECT | INSERT | UPDATE | DELETE | Test priority |
|---|---|---|---|---|---|---|
| **bookings** (014) | yes | `bookings_select_own` (user OR salon owner) | `bookings_insert_auth` (`auth.uid()=user_id`) | `bookings_update_own` (user OR salon owner) | none → admin-only via service role | **CRITICAL** |
| **salons** (014) | yes | `salons_select_active` (active OR owner) | `salons_insert_owner` (`auth.uid()=owner_id`) | `salons_update_owner` (owner) | none (default deny) | HIGH |
| **profiles** (014/027) | yes | `profiles_select_own` (`auth.uid()=id`) | none (default deny — only via trigger `handle_new_user`) | `profiles_update_own` | none | **CRITICAL** |
| **services** (014) | yes | `services_select_active` (active=true) | `services_manage_owner` ALL | `services_manage_owner` ALL | `services_manage_owner` ALL | HIGH |
| **availability_slots** (014) | yes | `slots_select_available` `USING (true)` | `slots_manage_owner` ALL | `slots_manage_owner` ALL | `slots_manage_owner` ALL | HIGH |
| **staff_members** (014) | yes | `staff_select_public` (active=true) | `staff_manage_owner` ALL | `staff_manage_owner` ALL | `staff_manage_owner` ALL | MEDIUM |
| **conversations** (014) | yes | participant | `conversations_insert_auth` | participant | none | HIGH |
| **messages** (014) | yes | conversation participant | conversation participant + sender_id | sender_id only | none | HIGH |
| **reviews** (014/029) | yes | `reviews_select_public USING (true)` | `auth.uid()=user_id` | `auth.uid()=user_id AND ≤48h` | own OR admin | MEDIUM |
| **user_preferences** (014) | yes | `auth.uid()=user_id` | `auth.uid()=user_id` (FOR ALL) | same | same | MEDIUM |
| **recurring_booking_rules** (014) | yes | `auth.uid()=user_id` | FOR ALL | same | same | MEDIUM |
| **favorites** (035) | yes | own | own | — | own | LOW |
| **price_disputes** (038) | yes | customer + salon + admin | `disputes_insert_salon` | customer + admin | none (admin FOR ALL covers) | HIGH |
| **booking_disputes** (075) | yes | reporter + salon + admin | reporter | salon + admin | none | HIGH |
| **notifications** (075) | yes | own user | none (service-role only via `Service role full access on notifications` policy — but check exists) | own user | none | MEDIUM |
| **notification_preferences** (036) | yes | own | own | own | none | LOW |
| **voucher_purchases** (084) | yes | customer + admin | `auth.uid()=customer_id` + admin | admin only | admin only | HIGH |
| **promo_codes** (048) | yes | public read (active) | admin only | admin only | admin only | MEDIUM |
| **referrals** (049) | yes | own + admin | own | own + admin | admin | HIGH |
| **user_credits** (050) | yes | own | none | admin only | admin only | HIGH |
| **audit_log** (031) | yes | admin only | auth users only (`INSERT WITH CHECK true`) | none | none | HIGH (write spam) |
| **data_deletion_log** (030) | yes | admin only | none (service role) | none | none | LOW |
| **feature_flags** (028) | yes | public read | admin only | admin only | admin only | LOW |
| **site_content** (020) | yes | public read | admin only | admin only | admin only | LOW |
| **salon_directory** (027) | yes | public read | admin only | admin only | admin only | LOW |
| **salon_documents** (077) | yes | owner + admin | owner | owner | owner | HIGH (KYC docs) |
| **salon_drafts** (080) | yes | own user_id | own | own | own | LOW |
| **content_reports** (078) | yes | auth users insert | admin only | admin only | admin only | MEDIUM |
| **price_offers** (037) | yes | participants | salon insert | participants update | none | HIGH |
| **client_notes** (040) | yes | salon + own booking | salon + own booking | salon | salon | MEDIUM |
| **review_replies** (041) | yes | public + author + salon | salon manage | salon manage | salon manage | LOW |
| **staff_portfolio_images** (032) | yes | public | owner | owner | owner | LOW |
| **off_peak_slots** (042) | yes | public | owner | owner | owner | LOW |
| **loyalty_cards** (039) | yes | public read | owner | owner | owner | LOW |
| **loyalty_stamps** (039) | yes | own + salon | `_insert_system` (admin-bound logic) | system | none | MEDIUM |
| **discovery_items** (067) | yes | published+active OR own + admin | own + admin | own + admin | own + admin | LOW |
| **discovery_comments** (067) | yes | non-hidden | own | none | own + admin | LOW |
| **search_embeddings** (074) | yes | public | admin only | admin only | none | LOW |
| **booking_waitlist** (045) | yes | own | own | own (admin can update) | own | MEDIUM |
| **package_purchases** (071) | yes | own + salon | **none** (service role insert via RPC only) | none | none | MEDIUM |
| **service_packages** (071) | yes | public (active) | salon FOR ALL | salon FOR ALL | salon FOR ALL | LOW |
| **client_formulas** (071) | yes | salon FOR ALL | salon FOR ALL | salon FOR ALL | salon FOR ALL | MEDIUM |
| **intake_form_responses** (071) | yes | salon + customer | salon FOR ALL (intake_salon_manage) | salon FOR ALL | salon FOR ALL | MEDIUM |
| **client_photos** (071) | yes | salon FOR ALL | salon FOR ALL | salon FOR ALL | salon FOR ALL | MEDIUM |
| **tips** (071) | yes | salon | none | none | none | LOW |
| **processed_webhook_events** (068) | yes | none (deny-all → service role only) | none | none | none | LOW (intended) |
| **staff_schedules** (070) | yes | salon owner + staff member | same | same | same | LOW |
| **salon_closures** (070) | yes | public | salon owner | salon owner | salon owner | LOW |
| **staff_breaks/staff_time_off** (070) | yes | salon owner + staff | same | same | same | LOW |
| **staff_services** (069) | yes | public | salon | salon | salon | LOW |
| **guest_bookings** (071) | yes | salon owner only | **none** | none | none | MEDIUM |
| **group_bookings** (071) | yes | organizer + salon | **none** (RPC only) | none | none | MEDIUM |
| **gift_cards** (071) | yes | **`USING (true)` — PUBLIC** | salon | salon | salon | **CRITICAL** |
| **staff_invites** (069) | yes | **`USING (true)` — PUBLIC** | salon | salon | salon | **CRITICAL** |
| **inventory** (005, legacy) | yes | **`USING (true)` — PUBLIC** | **`WITH CHECK (true)` — any auth user** | **`USING (true)` — any auth user** | **`USING (true)` — any auth user** | **CRITICAL** |
| **sms_reminders** (005, legacy) | yes | **`USING (true)` — PUBLIC** | **`WITH CHECK (true)`** | **`USING (true)`** | none | **CRITICAL** |
| **staff_calendars** (005, legacy) | yes | **`USING (true)` — PUBLIC** | **`WITH CHECK (true)`** | **`USING (true)`** | **`USING (true)`** | **CRITICAL** |
| **addons** (006, legacy) | yes | **`USING (true)` — PUBLIC** | **`WITH CHECK (true)`** | **`USING (true)`** | **`USING (true)`** | **CRITICAL** |
| **salon_photos** (004) | yes | public | **`WITH CHECK (true)`** | **`USING (true)`** | **`USING (true)`** | **CRITICAL** |
| **stylist_availability** (007) | yes | public | (FOR ALL not scoped — needs read) | — | — | MEDIUM |
| **service_addons** (034) | yes | public | salon | salon | salon | LOW |
| **stores** (legacy 011) | yes | public USING(true) | — | — | — | unknown — table may be dropped |
| **payments** (no table — Stripe-only) | — | — | — | — | — | — |

### Gaps & critical findings

#### CRITICAL — RLS catastrophes

1. **`inventory` (migration 005)** — `Auth insert/update/delete inventory ... WITH CHECK (true) / USING (true)`. Any logged-in user (a regular customer) can read, modify, or delete EVERY salon's inventory rows. No salon_id ownership constraint. **Never patched** in 027 or later.

2. **`sms_reminders` (migration 005)** — same anti-pattern. Public read of `phone` text + `message` text columns leaks PII (customer phone numbers + reminder content) to ANY anonymous visitor. Any auth user can write/update arbitrary reminders.

3. **`staff_calendars` (migration 005)** — same pattern. Any auth user can corrupt any salon's schedule.

4. **`addons` (migration 006)** — same pattern. Any auth user can rewrite any salon's price catalog.

5. **`salon_photos` (migration 004)** — `Public can view`/`Authenticated users can insert/update/delete ... USING (true) / WITH CHECK (true)`. Any auth user can replace any salon's gallery photos including the cover photo. No ownership check.

6. **`staff_invites` (migration 069)** — `CREATE POLICY "invites_by_token" ON staff_invites FOR SELECT USING (true)` — any authenticated user can `SELECT * FROM staff_invites` and read the secret `token` column for every pending invite. Combined with `app/api/staff/accept-invite/route.ts` which only WARNS on email mismatch (`emailMismatch` is a boolean returned to the client but is NOT a hard fail), any authenticated user can take over any salon's pending staff slots, become a staff_member at any salon, and gain `staff_salon_id` privileges.

7. **`gift_cards` (migration 071)** — `CREATE POLICY "gc_public_check" ON gift_cards FOR SELECT USING (true)` — anonymous SELECT exposes the `code` text column (gift card numbers!) along with `remaining_amount`. Anyone can scrape every active voucher code.

#### MEDIUM — RLS deny-by-default that might bite real flows

- **`bookings` has no DELETE policy** — any DELETE attempt with anon/auth client silently no-ops. Cancellations therefore must use UPDATE (which they do via `cancel/route.ts`). OK.
- **`guest_bookings`/`group_bookings` have no INSERT policy** — these MUST be inserted via service role (admin client) or RPC. If any non-admin code path tries to insert, it silently fails. Confirm endpoints use admin client (the `create_group_booking` RPC does; verify guest checkout endpoint).
- **`package_purchases`** — no INSERT policy; relies on service role / RPC.
- **`client_photos`** — `salon FOR ALL` only — customers cannot read their own photos. Intentional?
- **`tips`** — only salons can read; customer can't see their tip history. Intentional?
- **`audit_log`** — `audit_log_insert_auth USING true` lets any authenticated user spam writes into the audit log. Mitigation = rate limit, but the log is the primary forensic trail. If an attacker floods 10k garbage rows, real events get drowned.

---

## Admin / sensitive endpoints

All admin endpoints under `app/api/admin/*` follow the pattern:
```ts
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;
if (!user) return 401;
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return 403;
```

| Path | Auth | Role check | Rate-limit | Risk | Status |
|---|---|---|---|---|---|
| All `app/api/admin/**/route.ts` (~50 routes) | `getSession()` | yes (`role === 'admin'`) | mixed | **`getSession()` weakness** | needs hardening |
| `POST /api/stripe/create-payment-intent` | `getSession()` | n/a | paymentLimiter | **deposit_amount tampering** | **CRITICAL** |
| `POST /api/bookings/[id]/cancel` | `getSession()` | customer OR salon owner | none | OK | OK |
| `POST /api/staff/accept-invite` | `getSession()` | none (any auth user can use any token!) | none | **CRITICAL** | combined with broken RLS |
| `POST /api/partner/leads` | none (anon write) | none | none | LOW (lead capture) | OK (uses service role to bypass RLS for write only) |
| `POST /api/salons/[slug]/gallery` | `Bearer` header → `getUser()` | owner_id check | none | OK | OK |
| `GET /api/content` | none | none | none | service role used unnecessarily for public-readable table | LOW |
| `GET /api/cron/*` (all 18 routes) | `Bearer ${CRON_SECRET}` | n/a | none | OK | OK |
| `app/api/auth/callback` GET | n/a | n/a | authLimiter | sanitized redirect via `startsWith("/") && !startsWith("//")` | OK |

### Key admin-endpoint concerns

- **`getSession()` is documented as unsafe for auth decisions** in `middleware.ts` line 133: `// SECURITY: Use getUser() for proper JWT verification — getSession() is not safe for auth decisions`. The codebase's own middleware uses `getUser()` for the dashboard guard, but ~322 API routes use `getSession()`. `getSession()` returns the cached session from the cookie without re-verifying the JWT signature with Supabase. If an attacker gets a single Supabase project secret leak or if the cookie signing key is ever rotated improperly, all `getSession()`-guarded routes become bypass-able. The dashboard middleware re-verifies with `getUser()`; the API routes do not.
- **Admin endpoints all check role server-side**, so a forged session would still need the attacker to have an admin's stale session cookie. Practical risk is medium — concrete exploit path requires a separate cookie-theft primitive — but the audit recommends migrating critical endpoints to `getUser()`.
- **Role check uses a database round-trip per request**. Not a security issue, but a perf hit on hot admin paths.

---

## Service role usage

| Site | Context | Properly authorized? |
|---|---|---|
| `lib/supabase.ts:61` `createAdminSupabaseClient()` factory | helper | n/a |
| `app/api/content/route.ts:24` | public GET for site_content | **unnecessary** — `site_content` already has `FOR SELECT USING (true)` policy; should use anon client |
| `app/api/partner/leads/route.ts:21` | anon POST writes to `partner_leads` | OK — bypasses RLS deliberately for unauthenticated lead capture; no RLS on partner_leads to begin with |
| `app/api/salons/[slug]/gallery/route.ts:4-7` (`getSupabase` helper) | per-call `createClient(url, SERVICE_ROLE_KEY)` then `auth.getUser(token)` from Bearer header for authz | OK — verifies user via `getUser(sessionToken)` then checks `owner_id === user.id` |
| All `createAdminSupabaseClient()` call sites (~70+ across stripe webhook, cron jobs, admin endpoints) | various | **mixed** — admin endpoints check role FIRST then use admin client = OK; some routes use admin client AFTER weak `getSession()` check, inheriting the `getSession()` weakness |

Service role usage is mostly disciplined. The one improper case is `app/api/content/route.ts` which uses service role for a public read where RLS would happily allow anon SELECT. Reduce blast radius by switching to anon client.

---

## Stripe webhook signature verification

**File:** `app/api/stripe/webhook/route.ts`

- Verification present: **yes**
- Lines 21–31:
  ```ts
  if (!sig || !webhookSecret) return 400;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signature verification failed:", err);
    return 400;
  }
  ```
- Body read raw via `await req.text()` BEFORE `constructEvent` — correct (signature won't verify against parsed JSON).
- Idempotency table `processed_webhook_events` is checked + populated for replay protection (lines 36–39). 
- `STRIPE_WEBHOOK_SECRET` env requirement is enforced.

**Test recommendations:**
1. Replay a previously-processed event → assert 200 with `{ received: true }` and no DB side-effects.
2. Send event with tampered `sig` → assert 400.
3. Send event with valid `sig` but unknown `event.type` → assert 200 (current code silently breaks, OK).
4. Concurrent duplicate event delivery → assert the SECOND request hits `processed_webhook_events.event_id` PK constraint and no double-payout is recorded (current code does a single `select … eq("event_id")` then `insert` — there's a race window where two concurrent webhooks both miss the SELECT, both run the handler, then one INSERT fails. Mitigated by Stripe's at-least-once delivery + idempotent UPDATEs, but worth a test).
5. `setup_intent.succeeded` mutates booking `payment_status` based on `metadata.booking_id` from Stripe — if booking_id is forged in metadata, an attacker controlling a Stripe Connect account could in theory mark arbitrary bookings as `card_saved`. Verify metadata immutability (Stripe metadata is set by the platform when creating PIs, so should be safe — but worth one regression test).

---

## Payment intent amount tampering — **CRITICAL**

**File:** `app/api/stripe/create-payment-intent/route.ts` + `lib/validations.ts:72–77`

```ts
export const createPaymentIntentSchema = z.object({
  salon_id: uuid,
  service_name: z.string().max(200).optional(),
  estimated_price: z.number().positive(),
  deposit_amount: z.number().positive(),
});
```

`deposit_amount` is passed straight from client to `stripe.paymentIntents.create({ amount: depositRappen, ... })`. There is **no server-side reconciliation** that the deposit matches the actual service price or the salon's deposit policy. A customer can call:

```
POST /api/stripe/create-payment-intent
{ "salon_id": "...", "estimated_price": 0.01, "deposit_amount": 0.01 }
```

…and book a service that should cost 500 CHF for 1 cent. The booking is then created with that payment intent.

**Test recommendation:** assert that any deposit < (salon-configured deposit_percent × actual service price from `services.price`) returns 400.

---

## Redirect / fetch user-input sanitization

| Site | Input | Sanitized? |
|---|---|---|
| `app/api/auth/callback/route.ts:13–15` | `?redirect` / `?next` query param | yes — `startsWith("/") && !startsWith("//")` blocks external + protocol-relative |
| `app/api/staff/accept-invite/route.ts:22` | constructs internal `/de/auth/login?invite_token=…&redirect=…` from validated input | OK (no user-controlled redirect) |
| `middleware.ts:151` | constructs `?redirect=${pathname}` for dashboard auth bounce | OK (server-built) |
| `app/api/admin/discovery/staging/route.ts:83` `fetch(item.image_url)` | admin-supplied image_url | admin-only; LOW risk SSRF |
| `app/api/admin/discovery/import-tiktok/route.ts` | admin-supplied URL | admin-only |
| `app/api/admin/discovery/backfill/route.ts` | admin-supplied URL | admin-only |

No CSRF tokens are emitted, but state-changing endpoints all read JSON body (not HTML form-encoded), and Supabase auth cookies use SameSite=Lax. SameSite=Lax + JSON content-type + middleware origin allowlist (`solen.ch`, `www.solen.ch`) provides CSRF defense-in-depth.

**Note on CORS:** `middleware.ts:47–51` only allow-lists `solen.ch` + `www.solen.ch` + (in dev) `localhost:3000`. Browsers will still send the request and run side-effects before checking CORS — the CORS allowlist only blocks the *response* from being readable. **This is not CSRF protection.** If state-changing endpoints can be reached via a simple POST (no preflight), they ARE vulnerable. All API routes use JSON which DOES trigger preflight (Content-Type: application/json is not "simple"), so the preflight will be blocked by the allowlist. OK.

---

## Rate limiting

**Library:** `@upstash/ratelimit` + `@upstash/redis` configured in `lib/ratelimit.ts`.

**Limiters defined:**
- `generalLimiter` 30/min
- `bookingLimiter` 5/h
- `messageLimiter` 10/min
- `paymentLimiter` 3/h
- `adminLimiter` 20/min
- `authLimiter` 5/min
- `referralLimiter` 10/30d
- `roadmapLimiter` 5/min
- `discoveryFeedLimiter` 60/min, `discoveryPostLimiter` 3/d, `discoveryCommentLimiter` 10/min, `discoveryLikeLimiter` 30/min, `discoveryAdminLimiter` 10/min

**Routes covered (have `applyRateLimit` calls):** ~25 routes, including auth/login, auth/callback, create-payment-intent, admin/commission, admin/disputes, admin/feature-flags, admin/discovery/*.

**Routes NOT covered (sample, public-facing or high-risk):**
- `POST /api/auth/signup` — **no rate limit** (only login + callback are limited)
- `POST /api/auth/verify-otp`, `verify-phone/send`, `verify-phone/check` — **no rate limit on SMS-cost endpoint**
- `GET /api/search/smart`, `GET /api/search/suggest` — expensive embedding lookups, no limit
- `POST /api/bookings/route.ts` — booking creation has no rate limit beyond payment-side
- `POST /api/reviews/route.ts` — no limit (spam reviews)
- `POST /api/conversations/[id]/messages` — only some routes use `messageLimiter`
- `POST /api/staff/accept-invite` — no limit (combined with broken RLS = full exploit)
- All `POST /api/admin/admin/*` admin endpoints have only `adminLimiter` at best — not always present

**Fail-open behavior:** if Upstash Redis is misconfigured or unreachable, `applyRateLimit` returns null (request allowed). Acceptable for ops resilience but means an attacker could DoS Redis to disable the limiter.

---

## Recommended security test list (in priority order)

1. **RLS — `inventory`/`sms_reminders`/`staff_calendars`/`addons` lockdown.** New migration must DROP the existing broken policies and replace with `salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())` patterns. Test: as user A, attempt to UPDATE inventory row owned by salon B → expect zero rows updated. As anon, attempt to SELECT `sms_reminders` → expect empty result.

2. **RLS — `staff_invites` token leak.** New migration: drop `invites_by_token`, replace with `FOR SELECT USING (token = current_setting('request.headers.x-invite-token', true))` OR restrict accept-invite logic to admin-client lookup. Test: as user A authenticated, attempt `SELECT token FROM staff_invites` → expect zero rows.

3. **RLS — `gift_cards.code` leak.** Drop `gc_public_check`, replace with policy that only returns the row when caller provides the exact code (or remove the public select entirely; validate codes via admin client in `/api/vouchers/validate`). Test: as anon, `SELECT code FROM gift_cards` → expect empty.

4. **RLS — `salon_photos` ownership.** Drop the four `USING (true)` policies, replace with `salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())`. Test: as salon-B owner, attempt to UPDATE photo owned by salon A → expect zero rows.

5. **Payment intent amount enforcement.** Add server-side cross-check in `app/api/stripe/create-payment-intent`: query `services` for the requested `service_id` (require it in request), recompute deposit from salon's `deposit_percent`, reject if request-supplied `deposit_amount` deviates by >1%. Test: POST with `deposit_amount: 0.01` against a 100 CHF service → expect 400.

6. **`accept-invite` email match enforcement.** Hard-fail when `user.email !== invite.email` instead of returning a soft `emailMismatch: true` flag. Test: as user A with email `a@x.com`, attempt to accept an invite for `b@x.com` → expect 403.

7. **`bookings` RLS impersonation.** As user A, attempt `SELECT * FROM bookings` → expect only own bookings + bookings at salons A owns. As user A, attempt `UPDATE bookings SET status='cancelled' WHERE user_id='<userB>'` → expect zero rows.

8. **`profiles` impersonation.** As user A, attempt `SELECT email, phone FROM profiles WHERE id != auth.uid()` → expect empty result (after 027_rls_hardening).

9. **`getSession()` → `getUser()` migration for admin endpoints.** All ~50 admin routes should call `getUser()` to force JWT signature verification. Test: forge a session cookie with valid base64 but invalid signature → expect 401 (currently might pass with `getSession()`).

10. **Webhook idempotency under concurrency.** Send the same Stripe event twice within 100ms → expect only one `salon_payouts` row created.

11. **Auth rate-limit on signup + OTP.** Send 100 `POST /api/auth/signup` requests from the same IP in 1 minute → expect 429 after N. Currently no limit is in place; will create test for after fix.

12. **Audit log write spam.** As authenticated user, attempt to INSERT 10,000 rows into `audit_log` → expect rate limit kicks in. Currently no limit; consider service-role-only INSERT instead.

13. **`group_bookings` / `guest_bookings` / `package_purchases` write paths.** Confirm only RPC/service-role paths can insert; direct POST from anon/auth client to a hypothetical insert → expect zero rows.

14. **CORS regression.** Send `POST /api/bookings` with `Origin: https://evil.com` and `Content-Type: application/json` → browser sends preflight, server omits ACAO header, browser blocks read. Manual test only (curl bypasses CORS).

15. **SSRF probe via admin discovery.** As admin, submit `image_url: http://169.254.169.254/latest/meta-data/` → confirm fetch is allowed (admin-only, acceptable) but log a warning. Consider domain allowlist for non-admin paths.

---

## Summary

**CRITICAL findings: 7**

1. `inventory` RLS allows any auth user to read/write any salon's data (`supabase/migrations/005_dashboard_upgrades.sql:25-28`).
2. `sms_reminders` RLS leaks customer phone numbers to anon visitors + allows any auth user to write (`supabase/migrations/005_dashboard_upgrades.sql:49-51`).
3. `staff_calendars` RLS — same anti-pattern (`supabase/migrations/005_dashboard_upgrades.sql:70-73`).
4. `addons` (legacy) RLS — same anti-pattern (`supabase/migrations/006_bleaching_addons.sql:23-26`).
5. `salon_photos` RLS — any auth user can replace any salon's gallery (`supabase/migrations/004_salon_photos.sql:22-35`).
6. `staff_invites` exposes secret invite tokens via public SELECT (`supabase/migrations/069_megabuild_staff.sql:21`) — combined with `app/api/staff/accept-invite/route.ts:46` only-warns-on-email-mismatch, an attacker can hijack any salon's staff seat.
7. `gift_cards` exposes voucher codes to anon SELECT (`supabase/migrations/071_megabuild_booking_crm_payments.sql:128`).

**Plus 1 CRITICAL API-level issue:**
- Payment intent `deposit_amount` accepted from client without server-side price reconciliation (`app/api/stripe/create-payment-intent/route.ts:46-78`, `lib/validations.ts:72-77`).

**Test punch list:** 15 prioritized tests above. Items 1–8 are P0 (data exfiltration / financial loss); items 9–15 are P1 (defense-in-depth + auth hardening).

**Audit file:** `_audits/2026-05-16-ai-coding-traps-audit/5d-rls-security-tests.md`

# Topic 5B — Critical surfaces inventory

Date: 2026-05-16
Scope: Every test-worthy surface in the Solen codebase. Where tests MUST exist when a test suite is bootstrapped.

> Solen currently has ZERO unit/integration/DB tests (see 5A — only 1 Playwright visual-regression file `e2e/visual/homepage.spec.ts`, which is a snapshot harness, not a behavior test). Every surface listed below is **untested** unless explicitly marked.

---

## Headline counts

| Surface class | Count | Tested |
|---|---|---|
| Total API route files | 332 | 0 |
| - Admin routes (auth-required, admin role) | 48 | 0 |
| - Cron routes (auth via CRON_SECRET bearer) | 18 | 0 |
| - Stripe routes (financial) | 9 | 0 |
| - Auth routes | 7 | 0 |
| - Booking routes | 19 | 0 |
| - Voucher routes | 4 | 0 |
| - Package routes | 4 | 0 |
| - Discovery routes | 13 | 0 |
| - Review routes | 10 | 0 |
| - Staff routes | 14 | 0 |
| - Availability routes | 5 | 0 |
| - Slot routes | 4 | 0 |
| - Notification routes | 2 | 0 |
| - Profile routes | 8 | 0 |
| - Other (~167 routes) | ~167 | 0 |
| Server actions (`'use server'`) | 0 (none in `app/` or `lib/`) | n/a |
| Stripe webhook handler files | 2 (`route.ts` + `voucher-handler.ts`) | 0 |
| RLS policies (`CREATE POLICY`) | 286 statements | 0 |
| Unique tables under RLS | 110 | 0 |
| DB functions (`CREATE FUNCTION`) | 17 | 0 |
| DB triggers (`CREATE TRIGGER`) | 15 | 0 |

> **No server actions.** Solen exclusively uses API route handlers in `app/api/`. The `'use server'` directive does not appear anywhere in `app/` or `lib/`. This means EVERY mutation goes through an API route — no Server Action surface to test.

> **No GitHub Actions workflow file for crons.** `CLAUDE.md` and CRON_SECRET comments reference `.github/workflows/cron-jobs.yml`, but `.github/` contains ONLY `pull_request_template.md`. The workflow file referenced in code comments **does not exist in this branch** — crons are either invoked manually, scheduled elsewhere (e.g. cron-job.org), or this is a gap. **This is itself a finding** worth filing as a separate issue.

---

## Critical surfaces by priority

### CRITICAL — must test FIRST

> The four items below all touch money or auth identity. A single regression here causes customer/financial harm and may not be recoverable from logs.

#### 1. Stripe webhook handler — `app/api/stripe/webhook/route.ts` (305 lines)

Absolute path: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/stripe/webhook/route.ts`

Events handled (8 total):
- `payment_intent.succeeded` — marks booking `deposit_held`, records `salon_payouts` row, sends booking confirmation, tracks PostHog events. Also delegates to `voucher-handler.ts` for voucher purchases.
- `payment_intent.payment_failed` — marks booking `cancelled`, frees slot, notifies customer.
- `charge.dispute.created` — sends admin notification email.
- `setup_intent.succeeded` — saves card to booking row (`payment_status='card_saved'`, stripe_customer_id, stripe_payment_method_id).
- `account.application.deauthorized` — disables online payments for salon.
- `account.updated` — enables online payments when `charges_enabled`.
- `charge.refunded` — adjusts `salon_payouts` row gross/commission/net amounts.
- `payout.paid` / `payout.failed` — notifies salon owner about payout outcome.

DB writes (across all handlers): `bookings`, `availability_slots`, `salon_payouts`, `salons`, `processed_webhook_events`, `voucher_purchases`/`vouchers` (via handler).

Idempotency: yes — `processed_webhook_events` table checked then inserted (line 36-39).
Signature verification: yes (line 27).

**Test type:** integration (Stripe test mode + ephemeral Postgres).
**Status:** NO TESTS.

Test cases that MUST exist:
- valid signature + new event → handler runs + event_id stored
- valid signature + replayed event_id → handler returns received, no double-writes (idempotency)
- invalid signature → 400
- missing signature header → 400
- each event type: assert DB state transitions match expected
- `account.application.deauthorized` → salon must be flagged `accepts_online_payment=false`
- `charge.refunded` arithmetic: gross - refund = new gross, commission and net recalculated to 2 decimal places
- commission rate read from `platform_settings.value.rate_percent`, default 15 — assert the default fallback when row missing
- voucher purchase routing: handler delegates correctly when `pi.metadata.type === "voucher"`

#### 2. Booking creation — `app/api/bookings/route.ts` POST (lines 36-230)

Absolute path: `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/bookings/route.ts`

Multi-step write: validates slot availability → creates booking row → marks slot `booked` → sends customer email → sends salon owner email → completes referral & issues credits.

DB writes: `bookings`, `availability_slots`, `referrals`, `user_credits` (x2).
Feature flag: `bookings`. User-ban check: yes. Rate limit: `bookingLimiter` per user.

**Test type:** integration.
**Status:** NO TESTS.

Test cases:
- valid request → booking row + slot status flip in same transaction-ish flow
- slot already booked → 409 `SLOT_TAKEN`
- referral_code: only completes if first booking AND no existing referral
- `is_first_visit` fallback chain: body → profile.is_first_visit_default → true
- confirmation mode `manual_approval` → status `pending_approval` not `confirmed`
- price fallback: `slot.price_override ?? services.price ?? 0`
- banned user → 403
- feature flag disabled → blocked
- referral_code with `referrer_id === user.id` → no self-reward
- email-send failure → booking still persists (try-catch wraps email)

#### 3. Auth flow (signup + login + verify-otp + callback) — 7 routes

Absolute paths:
- `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/auth/signup/route.ts`
- `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/auth/login/route.ts`
- `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/auth/verify-otp/route.ts`
- `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/auth/logout/route.ts`
- `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/app/api/auth/callback/route.ts`

Signup validates: 8+ chars, 1 uppercase, 1 digit; min age 16 (calc'd from birthday); either birthday OR salon_name required.

Login: handles password login, Google OAuth, AND password reset on the same POST (router by zod schema).

Callback: SECURITY — only allows internal relative paths; blocks `//` and external URLs.

**Test type:** integration (Supabase test instance).
**Status:** NO TESTS.

Test cases:
- signup: weak password rejected (no upper, no digit, < 8 chars)
- signup: under-16 birthday rejected
- signup: existing email returns 409 (identities empty array trick)
- signup: missing both birthday AND salon_name → validation error
- login: each branch (password / OAuth / reset) routed by `safeParse` discriminator
- login: rate limit triggered after N attempts in window
- verify-otp: token length exactly 6, type ∈ {signup, email}
- callback: external URL in `redirect` → forced to `/de` (XSS open-redirect defense)
- callback: protocol-relative URL `//evil.com` → forced to `/de`
- callback: bad code → redirect to login with error
- callback: cookie response uses request.cookies + redirect response.cookies pattern (cookie session must survive redirect)
- logout: signOut called + redirect respects locale from referer

#### 4. RLS policies — 286 policies across 110 tables

Source: `supabase/migrations/*.sql` (every file with `CREATE POLICY`).

Most policy-dense files:
- `014_new_schema.sql` — 26 policies (foundation)
- `068_megabuild_foundation.sql` — heavy (count: see migration file)
- `071_megabuild_booking_crm_payments.sql` — 13 policies
- `027_rls_hardening.sql` — 5 policies (security hardening)
- `029_review_policies.sql` — 3 review-specific
- `038_price_disputes.sql`, `039_loyalty.sql`, `030_gdpr_support.sql` — financial/PII sensitive

Tables with HIGH-stakes RLS (test before any other RLS):
- `bookings`, `availability_slots`, `salons`, `profiles` — core funnel
- `salon_payouts`, `user_credits`, `voucher_purchases`, `vouchers`, `gift_cards`, `package_purchases`, `tips` — money
- `audit_log`, `data_deletion_log`, `account_actions`, `account_warnings`, `content_reports` — admin/legal
- `client_notes`, `client_photos`, `wellness_journals`, `intake_form_responses`, `barber_cut_history`, `nail_design_history`, `client_formulas` — sensitive customer data
- `storage.objects` — bucket-level RLS

**Test type:** SQL impersonation tests against a seeded test DB. Per-policy: `SET LOCAL role authenticated; SET LOCAL request.jwt.claims = '{"sub": "user-A"}'; SELECT/INSERT/UPDATE/DELETE attempts → assert outcome.`
**Status:** NO TESTS. No `tests/` or `supabase/tests/` directory.

Minimum suite ≈ 110 tables × 4 verbs × ≥1 actor each = ~440 tests. The pragmatic starter set is the ~25 money/funnel tables × 4 verbs × 3 actors (anon, owner, other-user) ≈ 300 tests for first sprint.

---

### HIGH — test in week 2

#### 5. Stripe Connect & payment-helper routes (8 routes besides webhook)

- `app/api/stripe/create-payment-intent/route.ts` — creates PI, applies commission to `application_fee_amount`, transfers via `transfer_data.destination` when salon has Connect account.
- `app/api/stripe/save-card/route.ts` — SetupIntent for cards 7+ days before appointment.
- `app/api/stripe/approve-increase/route.ts` — customer approves a price increase; ownership check (`booking.user_id !== user.id` → 403).
- `app/api/stripe/confirm-price/route.ts` — confirms the new price.
- `app/api/stripe/create-customer/route.ts` — Stripe customer creation.
- `app/api/stripe/payment-methods/route.ts` — saved card listing.
- `app/api/stripe/connect/create-account/route.ts` — salon-owner Stripe Connect onboarding link.
- `app/api/stripe/connect/status/route.ts` — Connect account status read.

**Test cases for each:** auth required, banned check, rate limit, feature flag `payments`, validated body via zod, owner-only writes assert 403 for wrong user.

#### 6. Cron jobs — 18 routes

All under `app/api/cron/*`. Every cron checks `Bearer ${CRON_SECRET}` (verified: all 18 have this guard). All use `createAdminSupabaseClient()` (service role).

| Cron | What it does | DB writes | Cadence (per comment) |
|---|---|---|---|
| `birthday-messages` | Send birthday emails to profiles with matching month-day | `profiles` (read) + email | Daily 8am CET |
| `welcome-series` | Day 0/3/7 emails to new users | `profiles` (read) + email | Daily |
| `no-show` | Find confirmed bookings ending 24h+ ago → mark no-show + charge fee | `bookings`, Stripe charges | unspecified |
| `rebooking-nudge` | 28+ days since last completed booking → nudge email | RPC `get_rebooking_candidates`, `nudge_log` | Daily |
| `salon-onboarding` | 5-email drip for new salon owners | `salons` (read) + email + nudge tracking | Daily |
| `auto-complete` | Bookings 48h past end + no dispute → status `completed` | `bookings` | Every 15min |
| `generate-slots` | Generate next 30d of `availability_slots` from `staff_schedules` | `availability_slots` | Nightly |
| `late-cancel` | Charges `late_cancel_fee_percent` on cancellations inside `cancellation_hours` window | `bookings`, Stripe charges | Every 30min |
| `release-deposits` | Deposits held > 72h → release | `bookings`, Stripe refunds | Daily |
| `release-payments` | Capture (release) held PaymentIntents 24h after booking completion | `bookings`, Stripe captures, `audit_log` | Hourly |
| `pre-charge` | Pre-charge saved cards 5 days before appointment | `bookings`, Stripe charges | Daily |
| `pending-timeout` | `pending_approval` bookings > 24h → cancel + refund + email | `bookings`, Stripe refunds, email | unspecified |
| `nail-infill-reminders` | Daily reminders based on `reminder_cycle_days` | `nudge_log` + email | Daily |
| `barber-smart-reminders` | Visit-cycle algorithm reminder for barbershop clients | `nudge_log` + SMS | Daily |
| `sms-reminders` | 24h + 1h pre-appointment SMS via seven.io | `sms_reminders` | Every 30min |
| `reminders` | Hourly upcoming-appointment reminders (SMS) | `sms_reminders` | Hourly |
| `review-prompt` | 24h after completed booking → review prompt email | email + tracking | Hourly |
| `process-deletions` | GDPR: profile `deletion_requested_at` > 30d → delete | `profiles`, `data_deletion_log`, auth | unspecified |

**Test type:** integration. Same pattern for all: bad/missing bearer → 401; correct bearer → expected DB transition; idempotency (running cron twice does not double-send).

Special priorities: `release-payments`, `pre-charge`, `release-deposits`, `late-cancel`, `pending-timeout` — these all move money. Test first.

#### 7. Admin routes — 48 routes

Every admin route uses the same pattern (verified in `app/api/admin/users/route.ts`):
```
const supabase = await createServerSupabaseClient();
const { data: { session } } = await supabase.auth.getSession();
if (!user) return 401;
const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
if (profile?.role !== "admin") return 403;
const admin = createAdminSupabaseClient();
```

Highest-impact admin endpoints:
- `app/api/admin/commission/route.ts` — updates `platform_settings.commission.rate_percent` (drives every payout calculation everywhere)
- `app/api/admin/booking-disputes/[id]/action/route.ts` — refund / partial refund / deny dispute
- `app/api/admin/disputes/route.ts` — dispute resolution
- `app/api/admin/users/route.ts` — sets `role`, `is_suspended`
- `app/api/admin/salons/[id]/{approve,reject,freeze,warn}/route.ts` — salon lifecycle
- `app/api/admin/tos/notify/route.ts` — legal notice
- `app/api/admin/badges/{auto-assign,assign}/route.ts` — salon trust signals
- `app/api/admin/solen-score/recalculate/route.ts` — affects rankings
- `app/api/admin/discovery/*` (12 routes) — content moderation including bulk-import and AI analyze

**Test cases per route:** anonymous → 401; authed non-admin → 403; authed admin → success path; admin sets values that affect other surfaces (e.g. commission rate) → assert downstream behavior changes.

#### 8. Voucher + Package + Tip + Gift card flows

- `app/api/vouchers/create/route.ts` — creates Stripe Coupon + Promotion Code + DB row + PaymentIntent. Note: handler uses `createAdminSupabaseClient()` directly (no user-session check at top — relies on validated `customerId` in body — confirm this is intentional or a bug).
- `app/api/vouchers/confirm/route.ts` — called from checkout success page, retrieves PaymentIntent, marks voucher paid.
- `app/api/vouchers/validate/route.ts` — case-insensitive voucher code lookup per salon.
- `app/api/packages/purchase/route.ts` — Stripe-routed package purchase.
- `app/api/packages/redeem/route.ts` — session redemption from purchased package.
- `app/api/packages/[id]/route.ts` — package CRUD.
- `app/api/tips/route.ts` — post-service tipping flow.

Test cases include race conditions (voucher max_redemptions=1 → double-redeem must fail) and PaymentIntent state-machine validation (retrieve → assert succeeded → mark paid).

#### 9. Reviews + automod

- `app/api/reviews/route.ts` POST — creates review, runs `checkReview` (lib/automod) for content moderation.
- `app/api/reviews/eligibility/route.ts` — can-user-review check per booking.
- `app/api/reviews/reply/route.ts` — salon owner reply.
- `app/api/reviews/my-booking/route.ts` — fetches reviewable bookings.
- `app/api/reviews/homepage/route.ts` + `featured/route.ts` — public reads.

Stakes: reviews drive salon trust + ranking. Bypassing automod or eligibility = injection of fake reviews.

#### 10. Booking sub-routes — 19 routes

`app/api/bookings/*` includes: `[id]/route.ts`, `recurring/`, `walk-in/`, `walk-in-verify/`, `express-rebook/`, `group/`, `user/`, `waitlist/`.

`PATCH /api/bookings/[id]` is the cancellation surface — confirm ownership check + late-cancel rules.
`POST /api/bookings/walk-in` — cash payment path (skips Stripe). Confirm `paid_via = "walk_in"` set correctly so `release-payments` cron correctly skips.

---

### MEDIUM

#### 11. Database functions (17) and triggers (15)

Functions:
- `public.update_updated_at()` — generic
- `public.handle_new_user()` — auth.users INSERT trigger → profiles row + role-from-metadata logic (UPDATED in migration 076). HIGH stakes — wrong role assignment = privilege escalation.
- `public.update_salon_rating()` — review aggregation
- `public.get_last_minute_slots(...)` — discovery feed
- `public.generate_referral_code()` — referral code uniqueness
- `toggle_discovery_like(p_item_id, p_user_id)` — discovery interaction
- `toggle_discovery_save(p_item_id, p_user_id, p_collection_id)` — discovery save
- `set_updated_at()`, `increment_view_count()` — generic
- `create_group_booking(...)` — multi-row insert in one call
- `update_booking_disputes_updated_at()`, `update_pricing_rules_updated_at()` — generic
- `match_search_embeddings(...)` — pgvector RPC + city-filtered variant in `20260326000002_match_search_embeddings_city.sql`
- `handle_new_user()` (migration 076) — UPDATED version
- `get_nearby_salon_ids(...)` — geospatial
- `refresh_salon_min_prices()` — caching layer

Triggers:
- `on_auth_user_created` (AFTER INSERT ON auth.users) — invokes `handle_new_user()`. **TEST FIRST** — wrong behavior = no profile, no role, no onboarding flow.
- `reviews_update_salon_rating` — keeps salon rating fresh on review insert/update/delete
- `trg_generate_referral_code` — unique code generation
- `trg_refresh_salon_min_prices` — caching trigger
- Generic `_updated_at` triggers on multiple tables
- `trg_view_count` — discovery view counting

**Test type:** SQL — `pg_prove` or plain SQL assertions. Insert a fake `auth.users` row → assert `profiles` row exists with expected columns.

#### 12. Profile / GDPR routes

- `app/api/profile/route.ts` GET/PATCH — has an `solen_admin_preview` cookie path that lets admins "impersonate" a salon (line 21+ of GET). This is a privilege surface — test that the cookie only works when `data.role === "admin"`.
- `app/api/profile/delete/route.ts` DELETE — blocks deletion if owner has active bookings.
- `app/api/profile/export/route.ts` GET — GDPR data export.
- `app/api/profile/accept-tos/route.ts`, `favorites/`, `vouchers/`, `live-state/`, `preferences/`.

#### 13. Slots / availability — public-readable but sensitive

- `app/api/slots/route.ts` GET — public slot listing. Confirm no PII leaks.
- `app/api/slots/last-minute/route.ts` — discovery feed.
- `app/api/availability/manage/route.ts` — salon-owner schedule writes.
- `app/api/availability/time-slots/route.ts` — composite read.

#### 14. Staff routes — 14 routes

`app/api/staff/{invite, accept-invite, breaks, time-off, my-schedule, portfolio, services, featured, [id]}/route.ts` — staff lifecycle including invite tokens. Invite-token replay protection must be tested.

#### 15. Discovery — 13 routes

Includes `discovery/post`, `discovery/upload`, `discovery/generate-description` — content surfaces with moderation paths (`discovery_moderation.ts`, `automod.ts`). High visibility + AI-cost-money endpoints.

---

### LOW

#### 16. Public read-only routes (~30 routes)

- `app/api/cities/route.ts`, `app/api/categories/route.ts`, `app/api/health/route.ts`, `app/api/content/route.ts`, `app/api/homepage-sections/route.ts`, `app/api/help/route.ts`, `app/api/site-content/*` etc.
- Risk: cache poisoning if write-path missing auth, but most return static data.
- Test: HTTP-snapshot tests (cheap golden-file checks) are sufficient.

#### 17. Newsletter / waitlist / coming-soon-notify

- `app/api/newsletter/route.ts`, `app/api/waitlist/route.ts`, `app/api/coming-soon-notify/route.ts`.
- Risk: spam vector. Confirm rate limit + email-validation + opt-in.

---

## API route inventory (sampled — full route list in glob `app/api/**/route.ts`, 332 files)

| Method | Path | Auth | Mutating | Status |
|---|---|---|---|---|
| POST | /api/bookings | auth | yes (creates booking + slot + referral) | untested |
| GET | /api/bookings | auth | no | untested |
| GET/PATCH/DELETE | /api/bookings/[id] | auth+owner | yes | untested |
| POST | /api/bookings/walk-in | auth (salon-owner) | yes | untested |
| POST | /api/bookings/express-rebook | auth | yes | untested |
| POST | /api/bookings/recurring | auth | yes | untested |
| POST | /api/auth/signup | public | yes (auth.users + email) | untested |
| POST | /api/auth/login | public (rate-limited) | no | untested |
| POST | /api/auth/verify-otp | public (rate-limited) | yes (auth.users update) | untested |
| POST | /api/auth/logout | auth | no | untested |
| GET | /api/auth/callback | public | yes (sessions) | untested |
| POST | /api/stripe/webhook | Stripe-signature | yes (heavy) | untested |
| POST | /api/stripe/create-payment-intent | auth | yes (Stripe) | untested |
| POST | /api/stripe/save-card | auth | yes (Stripe SetupIntent + booking) | untested |
| POST | /api/stripe/approve-increase | auth+owner | yes (Stripe + booking) | untested |
| POST | /api/stripe/confirm-price | auth+owner | yes | untested |
| POST | /api/stripe/create-customer | auth | yes (Stripe) | untested |
| POST | /api/stripe/save-card | auth | yes | untested |
| POST | /api/stripe/connect/create-account | auth (salon-owner) | yes | untested |
| GET | /api/stripe/connect/status | auth | no | untested |
| POST | /api/reviews | auth | yes | untested |
| POST | /api/reviews/reply | auth (salon-owner) | yes | untested |
| GET | /api/reviews/eligibility | auth | no | untested |
| POST | /api/vouchers/create | service-role internal | yes (Stripe Promo + DB) | untested |
| POST | /api/vouchers/confirm | public-ish (verifies PI) | yes | untested |
| POST | /api/vouchers/validate | public | no | untested |
| POST | /api/packages/purchase | auth | yes (Stripe) | untested |
| POST | /api/packages/redeem | auth | yes | untested |
| POST | /api/favorites/toggle | auth | yes | untested |
| GET | /api/me | session-optional | no | untested |
| GET/PATCH | /api/profile | auth | yes | untested |
| DELETE | /api/profile/delete | auth | yes (heavy) | untested |
| GET | /api/profile/export | auth | no (GDPR) | untested |
| POST | /api/profile/accept-tos | auth | yes | untested |
| GET | /api/slots | public | no | untested |
| GET | /api/slots/last-minute | public | no | untested |
| GET | /api/availability/[salon_id] | public | no | untested |
| POST | /api/availability/manage | auth (salon-owner) | yes | untested |
| POST | /api/staff/invite | auth (salon-owner) | yes | untested |
| POST | /api/staff/accept-invite | public (token) | yes | untested |
| POST | /api/admin/commission | admin-role | yes | untested |
| GET | /api/admin/users | admin-role | no | untested |
| PATCH | /api/admin/users | admin-role | yes | untested |
| POST | /api/admin/salons/[id]/approve | admin-role | yes | untested |
| POST | /api/admin/salons/[id]/freeze | admin-role | yes | untested |
| POST | /api/admin/booking-disputes/[id]/action | admin-role | yes (Stripe refund) | untested |
| GET | /api/cron/release-payments | CRON_SECRET bearer | yes (Stripe + DB) | untested |
| GET | /api/cron/pre-charge | CRON_SECRET bearer | yes (Stripe + DB + email) | untested |
| GET | /api/cron/late-cancel | CRON_SECRET bearer | yes | untested |
| GET | /api/cron/release-deposits | CRON_SECRET bearer | yes | untested |
| GET | /api/cron/auto-complete | CRON_SECRET bearer | yes | untested |
| GET | /api/cron/no-show | CRON_SECRET bearer | yes | untested |
| GET | /api/cron/process-deletions | CRON_SECRET bearer | yes (GDPR delete) | untested |
| ... | (remaining ~270 routes) | mixed | mixed | untested |

---

## Server actions inventory

**Empty.** `grep -rl "use server"` across `app/` and `lib/` returned no files. All mutations route through `app/api/*/route.ts`.

---

## Cron jobs inventory (18 routes)

All under `app/api/cron/`, all check `Bearer ${process.env.CRON_SECRET}`, all use service-role admin client.

- `auto-complete` — 15min cadence — bookings → completed
- `barber-smart-reminders` — daily — visit-cycle SMS
- `birthday-messages` — daily 8am CET — birthday emails
- `generate-slots` — nightly — `staff_schedules` → `availability_slots` (next 30d)
- `late-cancel` — every 30min — charges late-cancel fee
- `nail-infill-reminders` — daily — semi-auto infill reminders
- `no-show` — unspecified cadence — confirmed bookings 24h+ past end
- `pending-timeout` — unspecified — pending_approval bookings > 24h
- `pre-charge` — daily — pre-charge saved cards 5d before appointment
- `process-deletions` — unspecified — GDPR profile deletion 30d after request
- `rebooking-nudge` — daily — 28+ days since last booking
- `release-deposits` — daily — deposits > 72h released
- `release-payments` — hourly — capture held PaymentIntents 24h after completion
- `reminders` — hourly — SMS reminders
- `review-prompt` — hourly — review request 24h after completed
- `salon-onboarding` — daily — 5-email drip
- `sms-reminders` — every 30min — 24h + 1h pre-appointment SMS
- `welcome-series` — daily — day 0/3/7 emails

**Gap:** the actual scheduler config (`.github/workflows/cron-jobs.yml`) does not exist on this branch. `process-deletions/route.ts` line 9 explicitly references it in a comment. **This means: either crons are run from a different scheduler (cron-job.org or similar), or none of them are running.** Either way, NOT a substitute for tests — tests assert "given X DB state, calling the cron produces Y DB state."

---

## RLS policy inventory

**286 `CREATE POLICY` statements across 110 unique tables.** Full list of tables above. Top files:
- `014_new_schema.sql` (26)
- `005_dashboard_upgrades.sql` (11)
- `068_megabuild_foundation.sql` (heavy — list of tables in file)
- `071_megabuild_booking_crm_payments.sql` (13)
- `027_rls_hardening.sql` (5 — security backstop migration)

Tables with policies most worth testing first (money + identity + PII):
1. `public.bookings`
2. `public.availability_slots`
3. `public.salons`
4. `public.profiles`
5. `public.salon_payouts`
6. `public.user_credits`
7. `public.vouchers` + `public.voucher_purchases` + `gift_cards`
8. `package_purchases` + `service_packages`
9. `public.tips`
10. `public.audit_log`
11. `public.data_deletion_log`
12. `public.account_actions` + `public.account_warnings`
13. `public.content_reports`
14. `public.client_notes` + `client_photos` + `client_formulas`
15. `intake_form_responses`
16. `barber_cut_history`, `nail_design_history`, `wellness_journals`
17. `public.messages` + `public.conversations`
18. `storage.objects` (bucket-level)

Each table needs at least 4 verbs × ≥3 actors (anon / owner / different-user / admin) = 12+ assertions per table. Top-15 tables = ~180 RLS tests as starting point.

---

## DB functions / triggers inventory

### Functions (17 total)

| Function | Source migration | Stakes | Test priority |
|---|---|---|---|
| `public.handle_new_user()` (v1) | 014 | profile + role assignment from `raw_user_meta_data` | CRITICAL |
| `public.handle_new_user()` (v2 update) | 076 | updated version of above | CRITICAL |
| `public.update_salon_rating()` | 014 | review aggregation | HIGH |
| `public.update_updated_at()` | 014 | generic timestamp | LOW |
| `public.get_last_minute_slots(...)` | 014 | discovery feed | MED |
| `public.generate_referral_code()` | 049 | unique code generation | MED |
| `toggle_discovery_like(p_item_id, p_user_id)` | 067 | engagement counter | MED |
| `toggle_discovery_save(p_item_id, p_user_id, p_collection_id)` | 067 | engagement counter | MED |
| `set_updated_at()` | 067 | generic | LOW |
| `increment_view_count()` | 067 | view counter | LOW |
| `create_group_booking(...)` | 071 | multi-row atomic insert | HIGH |
| `update_booking_disputes_updated_at()` | 075 | generic | LOW |
| `match_search_embeddings(...)` | 074 | pgvector RPC | MED |
| `match_search_embeddings(...)` city-filtered | 20260326000002 | RPC overload | MED |
| `get_nearby_salon_ids(...)` | 077 | geospatial query | MED |
| `update_pricing_rules_updated_at()` | 082 | generic | LOW |
| `refresh_salon_min_prices()` | 20260401 | caching layer | MED |

### Triggers (15 total)

| Trigger | Source | Function called | Test priority |
|---|---|---|---|
| `on_auth_user_created` | 014 | `handle_new_user()` | CRITICAL |
| `reviews_update_salon_rating` | 014 | `update_salon_rating()` | HIGH |
| `trg_generate_referral_code` | 049 | `generate_referral_code()` | HIGH |
| `trg_refresh_salon_min_prices` | 20260401 | `refresh_salon_min_prices()` | MED |
| `trg_view_count` | 067 | `increment_view_count()` | LOW |
| `trg_discovery_items_updated` | 067 | `set_updated_at()` | LOW |
| `profiles_updated_at`, `salons_updated_at`, `slots_updated_at`, `bookings_updated_at`, `preferences_updated_at`, `feature_flags_updated_at`, `pricing_rules_updated_at`, `booking_disputes_updated_at`, `trigger_feature_requests_updated_at` | various | `update_updated_at()` / similar | LOW |

---

## Booking flow (consumer-facing) — file-by-file

The end-to-end booking happy path crosses these files. Tests must trace EACH transition:

1. `app/[locale]/salon/[slug]/page.tsx` — salon detail page (server component, fetches salon + services + reviews).
2. User clicks "Book" → navigates to `app/[locale]/salon/[slug]/booking/page.tsx`.
3. Booking page reads slots via fetch to `GET /api/slots?salon_id=...&date=...&service_id=...&staff_member_id=...` (`app/api/slots/route.ts`).
4. User picks slot → navigates to `app/[locale]/checkout/page.tsx`.
5. Checkout calls `POST /api/stripe/create-payment-intent` with `{ salon_id, service_name, estimated_price, deposit_amount }` → returns `client_secret`.
6. Stripe Elements confirms payment client-side.
7. Webhook `POST /api/stripe/webhook` receives `payment_intent.succeeded` → marks `bookings.payment_status='deposit_held'`, inserts `salon_payouts` row.
8. Checkout success page → `app/[locale]/confirmation/page.tsx`.
9. (Parallel) `POST /api/bookings` was called to create the booking row earlier, marking slot `booked`.
10. Cron `release-payments` (1h cadence) captures PaymentIntent 24h after booking completion → `payment_status='paid'`.

Per-step test coverage required:
- Step 3: slot listing — empty data, future-only, exclude blocked dates
- Step 4: booking-create — race condition on slot
- Step 5: PaymentIntent — Connect routing, commission math
- Step 6: webhook signature + idempotency
- Step 10: release-payments cron — only captures completed bookings with `payment_status='deposit_held'` and `paid_via != "walk_in"`

---

## Notes / Recommendations

### Suggested testing order (4 sprints)

**Sprint 1 (Critical money paths):**
1. Stripe webhook handler — all 8 event branches + idempotency + signature
2. `POST /api/bookings` — happy path + slot race + referral
3. `POST /api/stripe/create-payment-intent` — commission math + Connect routing
4. `release-payments` + `pre-charge` + `release-deposits` crons — Stripe state transitions
5. `processed_webhook_events` idempotency (DB-level)

**Sprint 2 (Auth + RLS for money tables):**
1. Auth flow: signup / login / verify-otp / callback / logout
2. RLS on top-15 money/identity tables (bookings, salons, profiles, salon_payouts, user_credits, vouchers, package_purchases, etc.) — 4 verbs × 3 actors each
3. `handle_new_user()` trigger — verify role-from-metadata correctness
4. Admin auth pattern (the `profile.role === 'admin'` check) — assert 401/403/200 matrix

**Sprint 3 (Admin + Business rules):**
1. All admin routes — 48 routes × 3 actors
2. `late-cancel`, `auto-complete`, `pending-timeout`, `no-show` crons
3. Voucher + package flows including race conditions on `max_redemptions=1`
4. Review system + automod (`checkReview` from `lib/automod.ts`)

**Sprint 4 (Discovery + Long tail):**
1. Discovery routes (13) — moderation + uploads
2. Staff invite-token replay defenses
3. GDPR `process-deletions` cron + `app/api/profile/delete`
4. Public read-only routes — HTTP-snapshot tests

### Required infrastructure (covered separately in 5C)

- Test runner choice (Vitest is the natural pick — fast, ESM-native, plays well with Next.js 15)
- Ephemeral Postgres (Supabase CLI's `supabase start --no-imap` or Testcontainers)
- Stripe test mode + signed webhook generation helper (`stripe trigger`)
- HTTP test harness for route handlers (call the exported `POST`/`GET` directly with a `NextRequest` mock)
- Test data factories (no fixtures — programmatic builders for `user`, `salon`, `service`, `slot`, `booking`)
- CI: GitHub Actions matrix (postgres + node + test) — note again that `.github/workflows/` is currently empty besides PR template

### Process gaps surfaced by this audit

1. `.github/workflows/cron-jobs.yml` is referenced in `process-deletions/route.ts` line 9 and in `CLAUDE.md`, but does not exist on this branch. Either crons aren't scheduled or they're scheduled elsewhere. **Worth filing as its own issue.**
2. `app/api/vouchers/create/route.ts` uses `createAdminSupabaseClient()` directly with no `getSession()` check at the top of the handler — it relies on `customerId` in the body to scope the customer. This is potentially exploitable (caller controls customer_id). **Verify intentional or fix before writing tests.**
3. `app/api/profile/route.ts` has a `solen_admin_preview` cookie path that lets admins impersonate salons (line 21+). This is a legitimate admin feature but is a privilege-escalation surface. Test that the cookie ONLY works when the requesting user has `role === 'admin'`.
4. Several routes (e.g. `app/api/bookings/route.ts` line 123, line 153) swallow email-send errors with bare `catch { }` — this means failed emails are invisible. Tests should at minimum assert that the BOOKING DB write still succeeds even when email fails, but the empty-catches finding from 5A1a is also relevant here.

---

## Total CRITICAL surfaces: 4

1. Stripe webhook handler (1 file, 8 event branches, ~10 DB-write paths) — `app/api/stripe/webhook/route.ts`
2. Booking creation (1 file, multi-step write) — `app/api/bookings/route.ts`
3. Auth flow (5 files: signup, login, verify-otp, logout, callback) — `app/api/auth/*`
4. RLS policies (286 statements across 110 tables) — `supabase/migrations/*.sql`

**Path:** `/Users/sulo/Documents/solen/.claude/worktrees/vigorous-spence-0e9aa7/_audits/2026-05-16-ai-coding-traps-audit/5b-critical-surfaces.md`

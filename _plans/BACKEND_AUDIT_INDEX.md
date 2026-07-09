# Solen backend audit — MASTER INDEX (2026-07-09)

Autonomous adversarial audit loop: 9 backend flows. Each flow = parallel finders → 3 independent skeptics per finding (>=2/3 to confirm, default-refute). Many findings were confirmed against the LIVE database (pg_policies / information_schema / rolled-back-transaction probes), not just by reading code. Read-only: **nothing was fixed**.

**141 confirmed findings** — 22 CRITICAL · 52 HIGH · 49 MEDIUM · 18 LOW.

## Per-flow
| Flow | Doc | C | H | M | L |
|---|---|--:|--:|--:|--:|
| Auth / accounts / RLS | [AUTH_BACKEND_AUDIT.md](AUTH_BACKEND_AUDIT.md) | 0 | 6 | 5 | 1 |
| Booking (core+sub-flows) | [BOOKING_BACKEND_AUDIT.md](BOOKING_BACKEND_AUDIT.md) | 7 | 21 | 24 | 7 |
| Cross-cutting (notify/crons/media) | [CROSSCUTTING_BACKEND_AUDIT.md](CROSSCUTTING_BACKEND_AUDIT.md) | 1 | 4 | 1 | 0 |
| Dashboard / CRM | [DASHBOARD_CRM_BACKEND_AUDIT.md](DASHBOARD_CRM_BACKEND_AUDIT.md) | 1 | 4 | 4 | 3 |
| Loyalty / credits | [LOYALTY_CREDITS_BACKEND_AUDIT.md](LOYALTY_CREDITS_BACKEND_AUDIT.md) | 2 | 1 | 2 | 1 |
| Onboarding / registration | [ONBOARDING_BACKEND_AUDIT.md](ONBOARDING_BACKEND_AUDIT.md) | 2 | 3 | 2 | 2 |
| Payments & payouts | [PAYMENTS_BACKEND_AUDIT.md](PAYMENTS_BACKEND_AUDIT.md) | 4 | 7 | 5 | 1 |
| Reviews / ratings | [REVIEWS_BACKEND_AUDIT.md](REVIEWS_BACKEND_AUDIT.md) | 3 | 3 | 2 | 2 |
| Search / discovery | [SEARCH_DISCOVERY_BACKEND_AUDIT.md](SEARCH_DISCOVERY_BACKEND_AUDIT.md) | 2 | 3 | 4 | 1 |
| **TOTAL** | | **22** | **52** | **49** | **18** |

## All CRITICAL findings

- **[Booking (core+sub-flows)]** Customer cancellation refunds NOTHING and charges a fee on top (full money loss) — `app/api/bookings/[id]/cancel/route.ts:143-210`
- **[Booking (core+sub-flows)]** Non-atomic single-booking slot flip → double-booking / double-charge on one slot — `app/api/bookings/route.ts:156`
- **[Booking (core+sub-flows)]** recurring — preferred_day type mismatch crashes rule creation whenever the field is supplied — `lib/validations.ts:892`
- **[Booking (core+sub-flows)]** group — Group-booking RPC's own INSERT is blocked by RLS (no INSERT policy on group_bookings) — feature never completes a single call — `supabase/migrations/071_megabuild_booking_crm_payments.sql:151`
- **[Booking (core+sub-flows)]** group — Even past the RLS block, the bookings INSERT violates NOT NULL constraints (starts_at, ends_at, price_paid) on every call — `supabase/migrations/071_megabuild_booking_crm_payments.sql:155`
- **[Booking (core+sub-flows)]** guest-access — walk-in-verify (and its sibling quick-action) read `bookings` through the RLS-bound session client, so the entire guest audience the endpoint is built for gets silently 404'd regardless of a valid token — `app/api/bookings/walk-in-verify/route.ts:49`
- **[Booking (core+sub-flows)]** express-rebook — Express-rebook confirm bypasses full-prepay payment entirely, unconditional status='confirmed' — `app/api/bookings/express-rebook/confirm/route.ts:59`
- **[Cross-cutting (notify/crons/media)]** Unauthenticated open email relay + HTML injection — `/api/notify/review-replied` — `app/api/notify/review-replied/route.ts:8-42`
- **[Dashboard / CRM]** salon-crud-authz — spa/treatment-outcomes POST has zero ownership check, writing arbitrary data to any salon/client — `app/api/dashboard/spa/treatment-outcomes/route.ts:35`
- **[Loyalty / credits]** loyalty-rank — bookings RLS write policies have no WITH CHECK — customer can self-fabricate 'completed' bookings to game Solen Status tier and unlock the member discount — `supabase/migrations/20260601_sp1_bookings_guest_rls.sql:44`
- **[Loyalty / credits]** credit-promo-stacking — Customer can self-mark their own booking 'completed' with zero verification, gaming Solen Status tier and unlocking the member discount — `app/api/bookings/[id]/route.ts:106`
- **[Onboarding / registration]** customer-onboarding — Unrated OTP brute-force lets an attacker claim ANY unclaimed salon_directory listing (business impersonation, permanent lockout of the real owner) — `app/api/directory/[id]/claim/route.ts:39`
- **[Onboarding / registration]** onboarding-edges — IDOR in salon re-verification endpoint lets any authenticated user reset ANY salon's verification/freeze status — `app/api/salons/verify/route.ts:22`
- **[Payments & payouts]** payout-ledger — Pre-charge cron's PaymentIntent metadata omits salon_id, so pre-charged bookings never get a salon_payouts ledger row — `app/api/cron/pre-charge/route.ts:65`
- **[Payments & payouts]** connect-onboarding — Retail purchase, tips, and gift-card checkout route customer money to a salon's Connect account based only on stripe_account_id being non-null — no onboarding-status check at all — `app/api/salon/retail/purchase/route.ts:40`
- **[Payments & payouts]** money-crons — abandon-sweep never cancels/voids the Stripe PaymentIntent for abandoned bookings — `app/api/cron/abandon-sweep/route.ts:32`
- **[Payments & payouts]** money-crons — abandon-sweep frees the slot even when the guarded cancel update matched zero rows — `app/api/cron/abandon-sweep/route.ts:106`
- **[Reviews / ratings]** review-submit — Review-authenticity gate exists only in app code; live RLS lets anyone post unlimited fake reviews for any salon — `app/api/reviews/route.ts:38`
- **[Reviews / ratings]** rating-integrity — Review moderation is completely broken live: writes to a column that does not exist in production — `app/api/admin/reviews/[id]/route.ts:30`
- **[Reviews / ratings]** review-moderation — Phantom moderation_status column silently breaks review flagging AND admin moderation end-to-end — `app/api/reviews/[id]/flag/route.ts:62`
- **[Search / discovery]** discovery-inspo — discovery_items has no RLS INSERT policy — the entire "Post from Discover" user-generated-content feature is permanently broken — `app/api/discovery/post/route.ts:81`
- **[Search / discovery]** search-geo-semantic — Public /api/recommendations returns full unredacted salon rows (select("*")), leaking stripe_account_id and owner_id — `app/api/recommendations/route.ts:206`

## All HIGH findings

- **[Auth / accounts / RLS]** IDOR — any logged-in user reads any salon's private client NOTES — CONFIRMED — `app/api/dashboard/clients/[id]/notes/route.ts:11-31`
- **[Auth / accounts / RLS]** IDOR — any logged-in user reads any salon's client TAGS — CONFIRMED — `app/api/dashboard/clients/[id]/tags/route.ts:11-31`
- **[Auth / accounts / RLS]** auth-routes — Auth rate limiting keyed on a client-spoofable X-Forwarded-For header — `lib/ratelimit.ts:139`
- **[Auth / accounts / RLS]** authz-escalation — Referral-completion endpoint grants CHF 10 credit to any two accounts with no real qualifying action (booking/purchase) required — `app/api/referral/complete/route.ts:26`
- **[Auth / accounts / RLS]** admin-get-idor-sweep — IDOR: /api/dashboard/barber-leaderboard leaks any salon's staff revenue/bookings to any authenticated user — `app/api/dashboard/barber-leaderboard/route.ts:?`
- **[Auth / accounts / RLS]** admin-get-idor-sweep — IDOR: /api/dashboard/walkin-analytics leaks any salon's walk-in and revenue analytics to any authenticated user — `app/api/dashboard/walkin-analytics/route.ts:?`
- **[Booking (core+sub-flows)]** Webhook `payment_failed` frees a PAID slot on out-of-order Stripe events → double-booking — `app/api/stripe/webhook/route.ts:429-433`
- **[Booking (core+sub-flows)]** Cancellation fee read from LIVE salon columns, not the frozen `policy_snapshot` — `cancel/route.ts:148-153`
- **[Booking (core+sub-flows)]** Reschedule has NO booking-status guard → cancelled/completed booking re-occupies inventory — `app/api/bookings/[id]/reschedule/route.ts`
- **[Booking (core+sub-flows)]** Reschedule new-slot claim is TOCTOU (no `status='available'` guard) → double-book — `reschedule:58-65`
- **[Booking (core+sub-flows)]** Cron computes one duration per staff → wrong `ends_at` for every non-first service → physical overlap — `app/api/cron/generate-slots/route.ts:114-116`
- **[Booking (core+sub-flows)]** Timezone split: dashboard-created slots stored at the wrong instant — `generate-slots:15-23`
- **[Booking (core+sub-flows)]** GIST double-booking constraint ignores NULL staff_member_id → no DB backstop for null-staff salons — `20260328_prevent_double_booking_gist.sql:7-10`
- **[Booking (core+sub-flows)]** Concurrent different-amount refunds both fire at Stripe, only one recorded → silent over-refund — `lib/bookings/issue-refund.ts:134,151,176-210`
- **[Booking (core+sub-flows)]** `resequence_walkin_queue` no-ops whenever a chair is occupied → queue positions never compact — `status='waiting'`
- **[Booking (core+sub-flows)]** Referral reward + credits issued at booking CREATE, before payment (online-pay) → credit farming — `bookings/route.ts:560-631`
- **[Booking (core+sub-flows)]** recurring — Recurring bookings are inserted as fully-paid/confirmed with zero payment flow, no Stripe, no payment_mode enforcement — `app/api/bookings/recurring/route.ts:74`
- **[Booking (core+sub-flows)]** recurring — POST /api/bookings/recurring omits the ban/suspension and feature-flag checks every other booking-creation route enforces — `app/api/bookings/recurring/route.ts:8`
- **[Booking (core+sub-flows)]** group — organizer_user_id patch also silently no-ops (missing UPDATE policy on group_bookings) — `app/api/bookings/group/route.ts:66`
- **[Booking (core+sub-flows)]** group — No payment implementation exists for group bookings at all — `supabase/migrations/071_megabuild_booking_crm_payments.sql:33`
- **[Booking (core+sub-flows)]** group — Slot inventory leak: booked_by/booking_id never set on the slot, and neither cleanup cron's filter matches this RPC's booking state — `supabase/migrations/071_megabuild_booking_crm_payments.sql:158`
- **[Booking (core+sub-flows)]** waitlist — Waitlist entries are marked notified_at even when no notification was ever delivered — `app/api/bookings/[id]/cancel/route.ts:231`
- **[Booking (core+sub-flows)]** waitlist — Waitlist notification is wired into only one of several slot-freeing code paths — `app/api/bookings/[id]/quick-action/route.ts:74`
- **[Booking (core+sub-flows)]** express-rebook — No server-side check that client-supplied service_id/staff_id belong to the slot's salon — `app/api/bookings/express-rebook/confirm/route.ts:44`
- **[Booking (core+sub-flows)]** express-rebook — TOCTOU race: slot availability is read-then-inserted without an atomic claim, and bookings.slot_id has no unique constraint — `app/api/bookings/express-rebook/confirm/route.ts:33`
- **[Booking (core+sub-flows)]** admin-disputes — Legacy 'refund' admin action has no status/state-machine guard at all — `app/api/admin/booking-disputes/[id]/action/route.ts:93`
- **[Booking (core+sub-flows)]** admin-disputes — TOCTOU race in issueRefund: remaining-check and Stripe idempotency key both use a stale, unlocked read, allowing a genuine over-refund under concurrent differing-amount admin refund calls — `lib/bookings/issue-refund.ts:92`
- **[Cross-cutting (notify/crons/media)]** Unauthenticated `/api/notify/review-posted` → salon-owner email-bombing — `app/api/notify/review-posted/route.ts`
- **[Cross-cutting (notify/crons/media)]** Supabase Edge Functions have NO in-code request-auth gate — `booking-reminder`
- **[Cross-cutting (notify/crons/media)]** SMS OTP send is rate-limited by IP, not by target phone → victim SMS-bombing — `app/api/auth/verify-phone/send/route.ts:18`
- **[Cross-cutting (notify/crons/media)]** `booking-reminder` send-once guard is a non-atomic read-then-write → duplicate reminder emails — `supabase/functions/booking-reminder/index.ts:40`
- **[Dashboard / CRM]** salon-crud-authz — nail/ai-history PATCH lets any authenticated user toggle is_saved on any salon's AI image, no ownership check — `app/api/dashboard/nail/ai-history/route.ts:36`
- **[Dashboard / CRM]** salon-crud-authz — GET /api/staff has no auth or ownership check at all, leaking commission_rate and permissions for any salon — `app/api/staff/route.ts:6`
- **[Dashboard / CRM]** staff-permissions — Staff-invite acceptance silently fails to link the new hire's account (RLS grant missing for the invited user) — `app/api/staff/accept-invite/route.ts:85`
- **[Dashboard / CRM]** dashboard-reads-logic — Booking reschedule has no atomic guard on the final slot-booking write — TOCTOU double-booking — `app/api/bookings/[id]/reschedule/route.ts:120`
- **[Loyalty / credits]** credits-ledger — user_credits has no spend/redemption path anywhere in the codebase; earned referral credit can never be applied to a charge — `app/[locale]/checkout/page.tsx:575`
- **[Onboarding / registration]** salon-registration — Directory-listing claim code has no rate limit, brute-forceable in minutes — `app/api/directory/[id]/claim/route.ts:39`
- **[Onboarding / registration]** customer-onboarding — Admin salon-approval is fully bypassable: an owner can self-flip is_active (the marketplace-listing gate) via /api/salon/go-live without any admin review ever happening — `app/api/salon/go-live/route.ts:57`
- **[Onboarding / registration]** onboarding-edges — Salon categories are never validated against the canonical service_categories taxonomy on create or update — `app/api/salons/[slug]/route.ts:64`
- **[Payments & payouts]** payout-ledger — charge.dispute.closed ('lost') decrements salon_payouts via a non-atomic read-then-write with no CAS guard, unlike the sibling charge.refunded handler — `app/api/stripe/webhook/route.ts:566`
- **[Payments & payouts]** retail-packages — Concurrent last-unit purchases both succeed: customer charged for stock that no longer exists, no automatic refund — `app/api/salon/retail/purchase/route.ts:70`
- **[Payments & payouts]** retail-packages — Duplicate product_ids in one purchase decrement stock more times than the customer is charged for — `app/api/salon/retail/purchase/route.ts:78`
- **[Payments & payouts]** vouchers-giftcards — POST /api/vouchers/create has zero auth/authz — anyone can mint real Stripe coupons and spoof a customer identity — `app/api/vouchers/create/route.ts:?`
- **[Payments & payouts]** connect-onboarding — account.updated webhook only ever turns accepts_online_payment ON, never back OFF when Stripe later restricts the account — `app/api/stripe/webhook/route.ts:656`
- **[Payments & payouts]** connect-onboarding — payouts_enabled is never checked anywhere in the codebase — only charges_enabled gates payment routing — `app/api/stripe/webhook/route.ts:658`
- **[Payments & payouts]** money-crons — no-show cron flips booking status to no_show with no re-assert guard, racing any concurrent status change — `app/api/cron/no-show/route.ts:43`
- **[Reviews / ratings]** review-submit — Review moderation removal is fully broken in production: writes to a phantom `moderation_status` column — `app/api/reviews/[id]/flag/route.ts:62`
- **[Reviews / ratings]** rating-integrity — average_rating/review_count are never recomputed on review UPDATE or DELETE -- only on new-review INSERT — `supabase/migrations/014_new_schema.sql:414`
- **[Reviews / ratings]** review-moderation — salons.average_rating / review_count never recomputed after an admin deletes or hides a review — `app/api/admin/reviews/[id]/route.ts:51`
- **[Search / discovery]** search-salons — Time-of-day (period) search filter silently returns the wrong salons: hour extracted in UTC, not Zurich local time — `supabase/migrations/20260607182403_add_salons_with_slot_in_hours_rpc.sql:20`
- **[Search / discovery]** discovery-inspo — discovery_items RLS SELECT policy is unrestricted (qual=true) — staging/flagged/archived/inactive content is world-readable via direct REST, bypassing every app-level status filter — `supabase/migrations/067_discovery.sql:158`
- **[Search / discovery]** search-geo-semantic — Salon-detail "nearby" recommendations have no geographic bound and skip the marketplace-visibility gate — `app/api/salons/[slug]/nearby/route.ts:31`

## Recurring root causes (fix the theme, not the instance)

1. **Migration-vs-live schema drift** — the live DB's RLS policies/columns are not what the code assumes: anyone can post fake reviews (missing WITH CHECK), review moderation writes a `moderation_status` column that doesn't exist in prod (every flag/hide 500s), the discovery 'Post' feature is dead (missing INSERT policy), and customers can self-complete bookings to farm loyalty tier. Verify live with pg_policies/information_schema, re-apply as idempotent migrations, add integration coverage.
2. **Service-role route missing an ownership check** (the IDOR class) — `createAdminSupabaseClient` bypasses RLS, so each route must check ownership itself. Instances: client notes, client tags, barber-leaderboard, walkin-analytics, spa/treatment-outcomes, nail/ai-history, `/api/staff`, `/api/salons/verify`. Typically a GET that forgot the check its sibling POST/DELETE has.
3. **Check-then-act with no DB guard** — booking / reschedule / express-rebook slot flips, credit spend, promo `max_uses`, booking-reminder send-once. The group-booking RPC already demonstrates the correct `FOR UPDATE` pattern; the single-booking path just doesn't use it.
4. **Full-prepay model mismatch** — the cancel/fee code was written for a save-card-no-prepay world, so a customer who cancels loses their whole prepayment (and gets charged a fee on top).
5. **Client-trusted money/identity values** — `create-payment-intent` amount, `save-card` Stripe customer_id, self-marked booking completion, referral credit with no qualifying action.
6. **Unauthenticated / weakly-throttled abuse surfaces** — `/api/notify/*` open email relay with HTML injection, `/api/vouchers/create` with zero auth, directory-claim OTP unthrottled (brute-force → business impersonation), auth rate-limits keyed on a spoofable `x-forwarded-for`, SMS OTP throttled by IP not target phone, Supabase Edge Functions with no request-auth gate.

## Suggested fix order
1. **Money + impersonation CRITICALs**: customer-cancel refund, double-booking race, webhook slot-free, `/api/notify/review-replied`, `/api/vouchers/create`, directory-claim OTP, `/api/salons/verify` IDOR.
2. **The schema-drift cluster** — several are one migration each (reviews RLS WITH CHECK, `moderation_status` columns, `discovery_items` INSERT policy, bookings write-column restriction).
3. **The service-role IDOR class** — one shared `assertSalonOwner()` helper applied to all 8 sites.
4. The concurrency guards (conditional updates / FOR UPDATE), then the rate-limit + Edge-Function gates.

## Coverage note
The cross-cutting sweep's session-limit blind spot (image-proxy SSRF + storage upload authz) was closed by hand: no SSRF in the thumb proxy (fixed TikTok host only), and all six storage upload routes are properly ownership-gated with type + size limits (details in CROSSCUTTING_BACKEND_AUDIT.md). All 9 backend flows are now audited.

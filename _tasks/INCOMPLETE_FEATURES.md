# Incomplete Features

> This file tracks features that have been partially built. See CLAUDE.md Rule 45 for protocol.

---

## Branch recovery: live verification and deferred source, 2026-09-08

- **Recurring booking recovery**: [route](/Users/sulo/Documents/solen/app/api/bookings/recurring/route.ts:30). The missing claim and compensation checks are committed on local main with actual-handler tests using mocked external boundaries. **Remaining**: the existing RLS lesson requires a non-owner transaction in the target runtime; that live check has not run. **Next step**: use an authorized isolated customer fixture, suppress outbound delivery through an approved test setup, and verify competing slot claims and returned compensation rows. Do not describe mocked tests as live RLS proof.
- **Approved fee-payment recovery**: [intent route](/Users/sulo/Documents/solen/app/api/bookings/[id]/fee-pay-intent/route.ts:1). The reproduced concurrent-intent, replacement, pointer-overwrite and metadata cases are repaired in the integrated local source and independently reviewed. Main161actual-handler/helper tests plus3mounted tests pass; full TypeScript passes. **Remaining**: no live Stripe/3DS/Connect/email transaction was exercised. Expired unknown claims and inherited pre-charge publication failure remain the explicit operational items below. Evidence: [final review](/Users/sulo/Documents/Codex/solen-consolidation/2026-09-08/branches/fee-review-precharge-final.md).
- **Remaining unique branch work and design choices**: [current reconciliation](/Users/sulo/Documents/solen/_plans/BRANCH_RECONCILIATION_2026-08-14.md:3) owns the active recovery order, source identities and pending signup/calendar choice. These items are in progress, not silently dropped or treated as merged. Five completed branch/worktree pairs have been removed with preservation and dependency checks; unresolved source and active dependencies remain retained.

---

## Netlify Migration: Cron Jobs — RESOLVED via GitHub Actions (2026-05-06)

- **Context**: Migrated deploy from Vercel to Netlify on 2026-05-06 (Vercel account blocked). `netlify.toml` covers build + headers; `vercel.json` had 19 cron jobs that do **not** transfer.
- **Backend**: All 19 `/api/cron/*` route handlers exist and are functional.
- **Status**: ✅ migrated to GitHub Actions cron. See `.github/workflows/cron-jobs.yml` + `.github/actions/ping-cron/action.yml`. Each scheduled job hits the configured `/api/...` endpoint(s) with `Authorization: Bearer ${CRON_SECRET}` (secret stored both in GitHub Actions repo secrets and in Netlify env vars).
- **HTTP method nuance**: 18 routes use GET; only `/api/admin/solen-score/recalculate` uses POST — handled per-job in the workflow.
- **What still needs verification**: After the workflow lands on `main`, watch the first scheduled run for each schedule and confirm 2xx responses. The workflow soft-fails on individual endpoint errors so a single bad endpoint doesn't suppress the others.
- **Priority** (was): HIGH — these run booking reminders, review prompts, late-cancel handling, deposit release, payment release, account deletion, SMS reminders, slot generation, no-show timeouts.
- **Affected paths** (verbatim from `vercel.json`):
  - `/api/cron/reminders` (hourly)
  - `/api/cron/review-prompt` (hourly)
  - `/api/cron/late-cancel` (every 30 min)
  - `/api/admin/solen-score/recalculate` (daily 03:00)
  - `/api/cron/welcome-series` (daily 10:00)
  - `/api/cron/rebooking-nudge` (daily 11:00)
  - `/api/cron/salon-onboarding` (daily 09:00)
  - `/api/cron/release-deposits` (every 6h)
  - `/api/cron/nail-infill-reminders` (daily 10:00)
  - `/api/cron/barber-smart-reminders` (daily 08:00)
  - `/api/cron/sms-reminders` (every 30 min)
  - `/api/cron/auto-complete` (every 15 min)
  - `/api/cron/birthday-messages` (daily 09:00)
  - `/api/cron/generate-slots` (daily 02:00)
  - `/api/cron/no-show` (every 30 min)
  - `/api/cron/pending-timeout` (every 15 min)
  - `/api/cron/pre-charge` (hourly)
  - `/api/cron/process-deletions` (daily 03:00)
  - `/api/cron/release-payments` (every 6h)

---

## Netlify Migration: Post-Deploy Manual Steps

- **Env vars**: copy from Vercel dashboard (Supabase, Stripe, Upstash, PostHog, Gemini, fal.ai, MAPBOX_API, etc.) into Netlify Site settings → Environment.
- **Stripe webhooks**: re-point to new Netlify domain at `dashboard.stripe.com/webhooks`. If left at the Vercel URL, payments break silently.
- **Supabase Auth callbacks**: update redirect URLs in Supabase project settings. Otherwise OAuth login breaks.
- **Google OAuth callbacks** (if separate from Supabase): update in Google Cloud Console.
- **Branch deploy filter**: replicate `vercel.json`'s `git.deploymentEnabled.main: false` via Netlify Site → Build & deploy → Branches.
- **Domain DNS**: cut over `solen.ch` from Vercel nameservers / A records to Netlify when the deploy is verified working.
- **Priority**: BLOCKING — site does not function correctly until env vars + Stripe + Auth callbacks are done.

---

## Last-Minute Notify Me Button

- **Backend**: `POST /api/waitlist` exists in `app/api/waitlist/route.ts` but requires `{ salon_id, service_id, preferred_date, preferred_time_range }` — not `{ email, feature }`.
- **Frontend**: Notify Me button added to `app/[locale]/angebote/page.tsx` (empty state). The button uses `prompt()` to collect email and posts to `/api/waitlist`, but the API will return 400 (validation error) because the schema doesn't match. The error is caught silently.
- **Missing**: A proper `/api/notify-me` or `/api/last-minute-waitlist` endpoint that accepts `{ email, feature }` and stores email subscriptions. Alternatively, extend the existing waitlist schema to support feature-based subscriptions.
- **Priority**: LOW — fails silently, does not crash the page.

---

## Homepage Entdecken → Real TikTok Previews — RESOLVED (V3-D160, 2026-05-26)

- **What was missing**: live wire to `/api/discovery/feed`, fresh-signed thumbnails (the stored `tiktok_thumbnail_url` values are TikTok signed URLs that expire), and a working Supabase service-role key for the API to query the DB.
- **Resolution**:
  1. `SUPABASE_SERVICE_ROLE_KEY` rotated to new-format `sb_secret_*` in `.env.local`.
  2. `Entdecken.tsx` now fetches `/api/discovery/feed?category=hair&limit=8` on mount, falls back to DEMO if 0 items or error. IntersectionObserver re-attaches when looks swap in.
  3. New `app/api/discovery/thumb/[id]/route.ts` proxy — DB lookup → TikTok oEmbed → image fetch → pipe back with `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`. Solves the signed-URL expiry for every consumer (homepage + any future caller).
- **Known follow-ups**: the `/discover` detail page (`/de/entdecken/[id]`) still reads raw `tiktok_thumbnail_url` via `VideoCard` — same expiry bug applies there. If detail-page thumbnails go dead, point `VideoCard` at the new `/api/discovery/thumb/[id]` proxy too.

---

## Discovery → Store: share-to-DM + book-from-inspo (customer↔store messaging) — PLANNED (user vision, 2026-05-31)

- **Vision (user, verbatim gist)**: From a Discovery inspo (a look / TikTok), a customer can (a) **share it directly to a store's DM**, or (b) **book it directly** — and all the look details flow into the store's messages. "When you want to book in, all the details go to the store… and it goes to the DM." A customer↔store DM layer that carries inspo + booking context. Discovery is the front door; the DM/booking is the hand-off to the salon.
- **Scope** (3 connected pieces):
  1. **Customer↔store DM / messaging** — "text in between stores and stuff." Threaded conversation between a customer and a salon.
  2. **Share inspo → store DM** — from a Discovery look/TikTok, send it into a salon's DM (the inspo image + style tags + name as a message).
  3. **Book-from-inspo** — booking a look carries the chosen inspo (image + tags + notes) so the salon receives full context in their inbox/DM alongside the booking.
- **Existing infra to build on** (do NOT rebuild from scratch — audit these first):
  - `app/api/conversations/route.ts`, `app/api/conversations/[id]/messages/route.ts`, `app/api/conversations/[id]/price-offer/route.ts` — a conversations/messaging system already exists.
  - `app/api/bookings/[id]/inspo/route.ts` — booking already supports attaching an inspo. This is likely 60% of piece #3.
  - `app/api/discovery/salons-for-style/route.ts` — maps a style → salons that do it (answers "which store can do this look").
  - `components-legacy/discovery/BookCTA.tsx`, `ShareButton.tsx`, `PickStylistFlow.tsx`, `SalonScript.tsx` — discovery-side CTAs that likely already gesture at this flow.
  - Discovery detail page `/discover/[id]` — where the "Share to store" / "Book this look" actions live.
- **Next steps (when picked up)**:
  1. Audit conversations schema + `bookings/[id]/inspo` + BookCTA/ShareButton/PickStylistFlow — map what's wired vs. missing.
  2. Add "Share to store" + "Book this look" actions on the inspo detail (and maybe the card).
  3. On action: open/create a conversation with the chosen salon, post the inspo (image + style tags + look name) + booking details as the first message.
  4. Store-side: the salon's DM/inbox surfaces the inspo + booking context.
- **Open questions**: when an inspo isn't tied to a specific salon, which store receives a share? (suggest via `salons-for-style`, or let the user pick). Does `conversations` support customer→salon initiation + image attachments? Is there a salon-side inbox UI yet?
- **Priority**: DEFERRED — explicitly AFTER the current Discovery build (Filter ✅ · Boards · Saved-system · Consistency+animations). User: "we're gonna do it after everything we've done."

---

## Future: SMS + email notifications (flagged 2026-06-01 by user — NOT built)
**SMS is not wired** — there is no provider integration (Twilio / MessageBird / etc.). The `/api/bookings/walk-in` route *references* sending an SMS link but no real SMS is sent. Email exists (`lib/email`) for booking confirmations only.
Future scope (own folder/epic):
- **SMS provider integration**: booking confirmations, walk-in ticket issued + "du bist als Nächstes dran" alerts, reminders, no-show warnings.
- **Email parity + lifecycle**: walk-in ticket/queue emails, reschedule / cancel / no-show / review-request emails (currently only the confirmation exists).
- Per-channel user preferences + opt-out (DSG/GDPR).
- Decision: transactional provider (Resend already? for email) + an SMS provider; gate behind salon plan tier?

---

## Booking write — two hardening gaps surfaced by G1 (2026-06-01, NOT fixed)
G1 (the consumer booking contract) is fixed + verified, but two adjacent issues remain:
- **Double-book race — no DB guard.** `app/api/bookings/route.ts` POST resolves an available slot, inserts the booking, THEN marks the slot booked (check-then-act, no lock). `bookings` has only a PK on `id` — NO unique constraint on `slot_id`. Two concurrent requests for the same slot can both insert. Pre-existing (the legacy slot_id path had the same race; G1 inherits, does not worsen). Fix: a partial unique index `CREATE UNIQUE INDEX ON bookings (slot_id) WHERE status IN ('confirmed','pending_approval')` (DB migration → needs approval per the schema-drift rule), or claim-then-insert with a `.eq("status","available")`-guarded update + rowcount check.
- **G2 — appointment payment is a no-op.** PayConfirmStep sends `payment_method` + `promo_code` + `gift_card_code` + `total_price`, but `/api/bookings` ignores all of them: it writes `price_paid = slot.price_override ?? service.price` (server-authoritative, good) and never charges Stripe or applies the promo/gift discount. So a booking is created but (a) no money moves and (b) the price the user saw (with discounts) can differ from `price_paid`. Decision needed: deposit / full prepay / auth-hold (like walk-in) / pay-in-store. Until then "online payment" = a free booking.

## Lane A charge-fee commission fallback drifts from canonical 15% (2026-06-01) — ✅ RESOLVED 2026-06-01
**RESOLVED in the de-hardcode pass.** `lib/bookings/charge-fee.ts` now imports
`DEFAULT_COMMISSION_RATE_PERCENT` and uses `?? DEFAULT_COMMISSION_RATE_PERCENT` instead of
`?? 1`. The same fix was applied to the two OTHER divergent sites found in the same sweep:
`app/api/cron/pre-charge/route.ts` (was `?? 1`) and `app/api/stripe/confirm-price/route.ts`
(was a hardcoded `PLATFORM_FEE_PERCENT = 0.01` / 1%, now reads `platform_settings.commission`
with the canonical fallback; the dead `PLATFORM_FEE_PERCENT` const was removed from
`lib/stripe.ts`). All 11 commission-read sites now share the single canonical default.
Original report kept below for history:

`lib/bookings/charge-fee.ts` (the cancellation/no-show off-session chokepoint) reads the
commission rate from `platform_settings.commission.rate_percent` but falls back to a bare
literal `?? 1` (1%) when the row is absent. The canonical fallback is
`DEFAULT_COMMISSION_RATE_PERCENT = 15` (`lib/constants/billing.ts`), used by
`booking-pay-intent`, `create-payment-intent`, and the new upcharge executor
(`lib/bookings/dispute-engine.ts` `chargeUpcharge`). When `platform_settings.commission`
is unset, cancellation/no-show fees would take 1% commission while every other charge path
takes 15% — silent revenue drift (the exact bug `lib/constants/billing.ts` documents it was
created to kill). NOT changed in this pass to avoid altering live money behavior in the cron
path without sign-off. Fix: import `DEFAULT_COMMISSION_RATE_PERCENT` in charge-fee.ts and
replace `?? 1` with it. file:line — lib/bookings/charge-fee.ts ~line 145.

---

## De-hardcode + actor-wiring pass: still-open items (2026-06-01)

### FE online-pay step is mockup-only — NOT wired to Stripe Elements (carried, still open)
The customer-facing "pay online" step does not collect a real card or confirm a PaymentIntent
client-side; it is a mockup/placeholder. The full-prepay BACKEND exists (SP-G2:
`app/api/stripe/booking-pay-intent/route.ts` creates the PI + `application_fee` + Connect
`transfer_data`; the `payment_intent.succeeded` webhook persists `paid_amount`/`platform_fee`/
saved-card ids), but the FRONTEND does not mount Stripe Elements (`<PaymentElement>`), confirm
with `stripe.confirmPayment`, nor handle SCA / 3DS.
- file:line — `components-legacy/booking/PayConfirmStep.tsx` (sends `payment_method`/`total_price`
  to `/api/bookings` but no Elements mount); `app/api/bookings/route.ts` POST still writes a
  booking WITHOUT charging (see the existing "G2 — appointment payment is a no-op" entry above —
  these are the same gap from the two ends).
- **Blocker**: FE is owner-policy mockups-first (REFUND_APPEAL_PLAN §12); real Elements wiring is
  a deliberate post-sign-off build. SP-G2's `booking-pay-intent` route + saved-card columns are
  the server half waiting for it.
- **Next step**: mount `<PaymentElement>` in the pay step against a `booking-pay-intent`
  clientSecret, `confirmPayment` with `return_url`, handle `requires_action`/decline, and switch
  `/api/bookings` POST to create-then-charge (or charge-then-confirm) instead of a free insert.
  Tie the displayed (discounted) total to `paid_amount` so they can't diverge.

### quick-action route NOT migrated to resolveBookingActor — intentional (2026-06-01)
`app/api/bookings/[id]/quick-action/route.ts` was deliberately LEFT on its own auth: it is a
PUBLIC one-click confirm/cancel link authorized by a signed `BOOKING_HMAC_SECRET` token in the
URL (email action links), NOT a session. `resolveBookingActor` resolves session/admin/salon +
the guest *cookie* — it has no notion of the HMAC action token, so wiring it in would BREAK the
public link (every click would 404/403). Confirm/PATCH/GET/reschedule were migrated; quick-action
is correctly out of scope.
- file:line — `app/api/bookings/[id]/quick-action/route.ts:9` (`verifyActionToken`), `:47` (its
  own gate).
- **Next step (only if ever unified)**: teach `resolveBookingActor` an optional 5th branch that
  accepts a validated HMAC action token → a scoped `'link'` actor, then migrate. Low priority;
  the HMAC path is self-contained and already constant-time + expiring.

### GET /api/bookings/[id] now additionally grants admin + token-guest read (2026-06-01)
Wiring `resolveBookingActor` into the GET changed read access from "booking owner OR salon owner"
to "any resolved actor" — which now ALSO lets a platform `admin` and a token-authorized `guest`
read the booking. For logged-in NON-admin users behavior is identical (owner/salon pass, everyone
else 403). The added admin-read (platform support) + guest-read (their own booking via the §10b.7
token) are plan-aligned and intended, but flagged here as a deliberate access-surface change in
case a stricter GET policy is ever wanted.
- file:line — `app/api/bookings/[id]/route.ts` GET (~line 33).
- **Next step**: none required; document-only. If GET must stay owner/salon-only, gate on
  `actor === 'customer' || actor === 'salon'` instead of `actor !== null`.

### Guest reschedule cannot complete (write path uses the session client) (2026-06-01)
`reschedule` now authorizes via `resolveBookingActor` (which accepts a token `guest`), but the
slot free/book + booking-update writes still go through the session-scoped `getSessionUser()`
supabase client. A guest has no session, so those writes hit RLS and fail even though the actor
check passed. Acceptable today because the guest reschedule FE is mockup-only, but the auth layer
now advertises guest support the write layer doesn't honor.
- file:line — `app/api/bookings/[id]/reschedule/route.ts:~42` (`getSessionUser()` client used for
  all subsequent writes); `booked_by: userId ?? booking.user_id` is null-safe for guests but the
  RLS write still fails.
- **Next step**: when guest reschedule ships, route the slot/booking writes through a service-role
  (`createAdminSupabaseClient`) client after the resolver proves entitlement, mirroring how
  cancel/dispute/escalate do their privileged writes.

### D7 refund_application_fee not yet sourced from a settings table (2026-06-01)
`lib/bookings/refund-config.ts` `getRefundConfig()` resolves the D7 "refund the platform
commission?" flag from env `REFUND_APP_FEE_DEFAULT` with a documented hardcoded default of `false`
(keep the commission). The intended source-of-truth — a `platform_settings` row `'refund_policy'`
(per-reason / global) — is NOT wired because the `platform_settings` table does NOT exist in the
live DB (verified 2026-06-01; the `commission` reads everywhere also fall through to their
constant for the same reason). This is a SAFE documented fallback, logged here per the
no-speculative-tables rule.
- file:line — `lib/bookings/refund-config.ts:30-42`.
- **Next step**: when `platform_settings` is created (it backs `commission` too), read
  `'refund_policy'` in `getRefundConfig()` BEFORE the env fallback; no caller change needed (the
  function is already async). Same migration should seed `commission.rate_percent` so the 15%
  fallback stops being load-bearing.

---

## Add to Apple Wallet on the confirmation screen — NOT built (no wallet-pass infra) (2026-06-01, owner-flagged "add later")
The approved confirmation mockup (`public/solen-refund-confirmation-order-number.html`) shows an "Add to Apple Wallet" button. There is no PassKit / `.pkpass` signing infrastructure in the app, so it was omitted from the real confirmation screen. Calendar (ICS), Directions (maps), and Share (Web Share) are wired with real handlers instead.
- **Blocker**: needs an Apple PassKit pass-type id + signing certificate + a server endpoint that generates a signed `.pkpass` (order number / barcode / booking details), plus the Wallet button gated to iOS/Safari.
- file:line — `components-legacy/booking/BookingConfirmation.tsx` (JSDoc notes the omission); confirmation route `app/[locale]/confirmation/page.tsx`.
- **Next step**: stand up the `.pkpass` generation service + cert, add `/api/bookings/[id]/wallet-pass`, then render the Wallet button on the confirmation screen (Google Wallet optional twin).

---

## Walk-in analytics: 3 dashboard metrics intentionally returned as 0 — no data source in current schema (2026-06-02)
Replaced the fabricated walk-in analytics (`Math.random`/`Math.sin` sparklines, `12 + total%10` waits, `40 + totalBookings` chair util, and a query on the nonexistent `is_walkin` column) with real metrics computed from `barber_walkin_queue`. Three metrics the dashboard UI still renders have NO real source in the live schema, so they are returned as `0` (honest) rather than fabricated:
- `chair_utilization` (WalkinAnalytics) + `chair_utilization_pct` (BarberLeaderboard) — needs a per-chair schedule / open-hours occupancy model that does not exist.
- `retention_pct` (BarberLeaderboard) — needs a client-recurrence calculation across booking history; not modelled in this route.
- `avg_tip` (BarberLeaderboard) — there is NO tip/gratuity column anywhere on `bookings` (verified via information_schema 2026-06-02).
- file:line — `app/api/dashboard/walkin-analytics/route.ts:80` (chair_utilization); `app/api/dashboard/barber-leaderboard/route.ts:81-86` (retention/tip/chair util).
- **Also note**: `barber_walkin_queue` has no revenue column, so walk-in revenue in `pl-comparison` comes only from PAID walk-ins (bookings linked via `walkin_queue_id`). Cash walk-ins (payment_intent_id NULL, no linked booking) contribute to walk-in COUNT but not revenue — documented gap. file:line — `app/api/dashboard/barber/pl-comparison/route.ts:9-14`.
- **Next step**: add a tips column (or tips table) to surface `avg_tip`; build a chair/occupancy model for chair utilization; add a recurrence query for retention. Until then these stay 0, not fabricated.

## Service-photo editor flow broken (discovered 2026-06-03, review fix Phase A/A3)
- **File:** `app/[locale]/dashboard/services/page.tsx:174` POSTs to `/api/services/photos` (flat) — that route **does not exist** (only `app/api/services/[id]/photos/route.ts` does). So editor photo **upload** is misrouted, and it reads `const { url } = res.json()` while the real endpoint returns `{ data: { url } }`.
- **Delete not persisted:** the X-button (`:157`) only does `setPhotos(filter)` locally; no DELETE call, and PATCH doesn't carry photos → removed photos reappear on refetch.
- **Next steps:** repoint upload to `/api/services/${initial.id}/photos`, fix the response-shape read (`data.url`), add a DELETE handler to that endpoint + wire the X-button to it. Frontend + endpoint work — deferred from Phase A (safe-backend) because it's frontend-coupled and wider than the original photo_urls read-fix.

## Auto-assignment + daily-limit ENFORCEMENT — RESOLVED (Phase E, 2026-06-03)
- SchedulingTab persists `auto_assign_method` / `daily_limit_enabled` / `daily_limit`. The booking POST now consumes them via `lib/bookings/auto-assign.ts`: an "any staff" booking auto-assigns per **least_busy** (fewest bookings that day) / **round_robin** (least-recently assigned) / **manual** (first available); the per-stylist **daily cap** drops over-capped stylists for "any" and rejects (`STAFF_DAILY_LIMIT`) a specifically-chosen capped stylist. Opt-in: defaults (`manual` + limit off) keep the exact prior "first available" behaviour, and any engine error falls back to the first slot. **Verify** with a live multi-staff booking (set round_robin/least_busy + a low daily_limit, book "egal" a few times, confirm rotation + the cap).

## Booking: per-service staff assignment (Fresha parity gap)
- **Where:** `components-legacy/booking/StaffStep.tsx` (mockup-20 flow, 2026-06-12)
- **What:** Fresha's team step also offers "choose a different team member per service" for multi-service carts; Solen supports ONE stylist per booking (`formData.selectedStaffId`). StaffStep filters to staff capable of ALL selected services, so mixed carts (e.g. cut + nails) can collapse to "Keine Präferenz" only.
- **Blocker:** booking schema stores a single `staff_member_id` per booking; per-service assignment needs per-line staff + slot intersection logic.
- **Next steps:** if demanded, add per-service staff rows on StaffStep + extend slot engine to intersect availability per line item.

## app/api/salons/[slug]/route.ts , 500 on anonymous review_replies (found 2026-07-03, B-2 verify)
- Symptom: `(r.review_replies ?? []).filter is not a function` 500s when the endpoint is hit anonymously for at least muse-beauty-studio's reviews shape.
- Blast radius: LOW , the PDP page /de/salon/<slug> still renders 200; only this sub-endpoint errors. Pre-existing, NOT from A5.
- Next: review_replies likely comes back as an object (single) not an array in some shape; coerce to array before .filter, or fix the select. Verify anon vs authed shapes.

## PDP salon visibility gate incomplete (council note 2026-07-04, PRE-EXISTING)
- lib/salon-detail.ts loadSalonDetail() gates on the salon existing but NOT on is_test / listed_on_marketplace, so a test/unlisted salon's PDP renders by slug. Pre-existing (not from the server-root refactor). Fix: add the marketplace-visibility predicate (is_active AND listed_on_marketplace IS NOT FALSE AND NOT is_test) , but verify it doesn't 404 legit not-yet-listed salons (preview links).
- Also: app/[locale]/salon/[slug]/layout.tsx generates metadata for hidden salons even when the body 404s , tighten to the same gate.

## Dashboard dep consolidation (B4 audit, reported-not-forced 2026-07-04)
- Two drag-drop libs: @dnd-kit (1 file, discovery-admin GRID sort via rectSortingStrategy) vs @hello-pangea/dnd (2 files, calendar+services LIST sort). Different interaction patterns , consolidating = a real behavior-risk rewrite, NOT mechanical. Left as-is; consolidate deliberately later if desired.
- @react-google-maps/api (1 file, AddressAutocomplete in onboarding): swapping to Mapbox Geocoding = a feature rebuild, not a dep swap. Left as-is.

## Backend core-issue sweep 2026-07-10 , items deliberately NOT hot-patched (record: _plans/BACKEND_SWEEP_2026-07-10.md)
The estate-wide sweep fixed 22 confirmed findings across batches 1-5 (commits ac8c02e5c, 462741003, a23de923c, eca3682db, 1f65b45db + DB trigger). Three were flagged rather than fixed:
- **`app/api/stripe/booking-pay-intent/route.ts:227` (promo max_uses race) + `:338` (Solen Plus member-discount per-window use-cap race).** Both are non-atomic check-then-act: the cap is read, then the discount is baked into the created PaymentIntent's amount; the only atomic increment is in the webhook, on success. Under concurrent pay attempts a promo/discount can be honored a few times past its cap. **Blocker:** this is the single most critical + most-hardened money file; the correct fix is an atomic RESERVE-at-intent-creation (UPDATE ... WHERE current_uses < max_uses RETURNING) with a DECREMENT on abandon/failure (touches the abandon-sweep + webhook-failure paths), NOT a hot-patch. **Impact is bounded and low** (a handful of extra discounted bookings under a genuine race). **Recommendation:** accept the bounded overage for now; schedule the reservation refactor as its own tested change. Owner call.
- **`app/api/conversations/[id]/messages/route.ts:33` (read-receipt UPDATE is a no-op).** The recipient's read-receipt update filters for messages NOT sent by the caller, the opposite of the only RLS UPDATE policy, so it affects zero rows. **Blocker:** messaging is a fully-disabled feature; the correct fix (admin-client update or an RLS policy that lets a conversation participant mark the other party's messages read) is a design decision to make when/if messaging is revived. Latent, unreachable today.
- **Voucher redemption/spend path does not exist.** `vouchers.remaining_amount` is only ever SET (to face value by the webhook on payment); no endpoint decrements it, so a paid voucher cannot actually be applied to a booking. Incomplete feature (buy-only), not a security bug. If voucher spend is built, it MUST use the optimistic-lock pattern from `app/api/gift-cards/redeem/route.ts:68` (`.eq("remaining_amount", prev)`) to avoid double-spend.

Second (money-lib + webhook) sweep fixed 9 more across batches 6-8 (commits 7c51c73a3, 3f30a9340, 6a597956a, 9beaa00fe + a DB column). Two flagged rather than fixed:
- **`app/api/stripe/webhook/route.ts:172` promo `increment_promo_use` is not idempotent across retries.** The event-body's claim-release-on-failure (line ~755) re-runs the whole handler on a retry, re-calling increment_promo_use. **Fails SAFE**: it over-counts `current_uses`, so a promo hits `max_uses` EARLIER and denies legit customers , a mild availability bug, never an over-redemption / money loss. Full idempotency needs a `promo_counted` boolean on bookings, set by a CAS gated on the pending->confirmed transition. Low priority.
- **`lib/bookings/perks.ts:202` member-discount per-window use cap has no atomic reservation** , the SAME root cause as `booking-pay-intent:338` above (perks.ts is what that route reads). Fold into the same reserve-at-checkout refactor; do not fix separately.
- Residual (batch 7): the claim-first refund inversion leaves a rare phantom-reservation window on a mid-flight process crash (bookings caught by cron/reconcile refund_drift; purchases now caught by the new purchase check, but only within the 48h charge-creation window). A durable `refund_pending` marker + sweeper would close it fully , scoped follow-up, not built.

## `/api/admin/solen-score/recalculate` writes no cron_runs row (found building A11-cron-heartbeat, 2026-07-27)
- Every other cron in `.github/workflows/cron-jobs.yml` calls `withCronRun(name, ...)` (`lib/cron-run.ts`), which logs a `cron_runs` row on every run, success or failure. `app/api/admin/solen-score/recalculate/route.ts` (POST, part of the daily-03-utc job) does not: it has no `withCronRun` call at all, so it never writes to `cron_runs`.
- Impact: it is invisible to both the existing failures-only digest section and the new heartbeat section in `lib/cron-heartbeat.ts` (`app/api/cron/daily-digest/route.ts`). It is deliberately excluded from `EXPECTED_CRON_INTERVALS_MS` rather than added, because including a name that structurally never logs would report it as permanently overdue every day, drowning the real signal.
- Fix: wrap the handler body in `withCronRun("solen-score-recalculate", async () => { ... })` the same way the other 24 cron routes do, then add it to `EXPECTED_CRON_INTERVALS_MS` with a 24h interval. Not done here: out of scope for A11 (that item was the digest's missing-cron detection, not retrofitting every route's instrumentation), and changing solen-score's response shape/status codes touches a route this file doesn't own the risk profile of without its own verification pass.

## Home + salon PDP First Load JS budget already exceeded 4x (found writing fe-09 performance trigger, 2026-07-27)
- **Where:** `_rules/PERFORMANCE.md` (the fe-09 bundle-size trigger this finding wrote). `next build`'s own output (First Load JS column, confirmed gzipped by comparing the reported shared-chunk size against a direct `gzip -c` byte count).
- **What:** the 200KB-gzipped-First-Load-JS trigger for mandatory `next/dynamic` has already fired, by a wide margin, on the two highest-traffic customer routes: `/[locale]` (home) at 862 kB and `/[locale]/salon/[slug]` (PDP) at 901 kB, both over 4x the 200KB threshold. `/[locale]/[city]/[category]`, `/coiffeur`, `/barbershop`, `/search`, and `/inspo` sit at 359-376 kB, also over.
- **Blocker:** identifying the actual contributors needs `ANALYZE=true npm run build`'s treemap (`@next/bundle-analyzer`, already wired per performance-08) and a real decomposition pass (finding which heavy, non-first-paint components on these two routes should move behind `next/dynamic`), not a doc change. That's a substantial, separate engineering task this pass did not attempt.
- **Next steps:** run `ANALYZE=true npm run build`, open the treemap for `/[locale]` and `/salon/[slug]`, identify the largest non-critical contributors (likely candidates: map libraries, chart/analytics libraries, rich editors, anything only needed after a click), convert to `next/dynamic({ ssr: false })` where not SEO-relevant, re-measure via `npm run build`'s First Load JS column until under 200KB or a documented reason it can't be.

## Previewing a treatment on EVERY real screen is blocked: it crashes the build (found 2026-08-23)

WHAT WAS BEING BUILT: `app/[locale]/dev/_shared/LookPreview.tsx` (written, on disk, currently unused).
It reads `?v=` from the address and restyles the page it is on, reusing the existing
`VariantSwitcher`. Mounted in `app/[locale]/layout.tsx` it would let ANY real screen be opened as
`/de/inspo?v=anchor` and restyle itself in place. That is the decision-mockup format this project
already settled on: the whole real page, only the treatment changed, switched by `?v=`.

WHY IT IS NOT MOUNTED: with it in the root locale layout, `npm run build` dies during "Collecting
page data" with `SIGSEGV`, twice in a row. Reverting the layout and rebuilding on the same machine
in the same minute succeeded, so it is that mount and not the machine. Guess not yet tested: a
client component reading the URL inside the ROOT layout forces every route through a different
data-collection path, and something in that path crashes rather than erroring. NOT investigated
further, because two failures on one theory is where the method should change, and the goal
(showing him three screens) does not need the root layout at all.

WHAT TO DO INSTEAD, and it is cheaper: give each screen its own `/dev` route that renders that real
page component with the treatment applied, the way `/dev/unify` already does for search results.
No product file is touched and there is no crash.

BLOCKER: none. This is a choice not to spend more on a route that was never required.
IMPACT: none on the product. `LookPreview.tsx` is imported by nothing, so it ships nowhere.

## A clickable preview for the Inspo screen: two approaches failed, the numbers are in hand (2026-08-23)

WHAT IS DONE: the treatment for Inspo is measured and proven on the real page. Injected into the
live screen at 390x844, the biggest text goes from 14px to 17px and the gap between biggest and
smallest goes from 1.17x to 1.42x. For reference the store page he likes sits at 30px and 2.31x, so
this is a step toward it and not the whole distance.

THE ONE VISIBLE COST, seen in the picture and not hidden: at 17px the style label on a picture can
run out of room, so "Brow Lamination" truncates to "Brow Lamina...". Either the label wraps to two
lines or it stays smaller. That is a real decision, not a rendering bug.

WHAT IS NOT DONE: a link he can tap to compare the looks himself. Two approaches failed:
  1. Mounting a URL-driven switch in the shared page frame crashed the build twice (SIGSEGV while
     collecting page data). Written up separately above.
  2. Rendering the real Inspo page component inside a preview route redirects straight to the home
     page, because that page navigates on mount to set its own default filters. Route deleted; a
     copy is in the session scratch directory.
This is the second failed theory for one goal, which is the point at which the method should change
rather than a third variant of the same idea being tried.

BLOCKER: none technical. It needs a different method, not more attempts at this one. The obvious
untried one: apply the treatment as a real, committed change behind a switch on the preview server
only, so no embedding or URL reading is involved.
IMPACT: none on the product. Nothing was applied to any real screen.

## Expired unknown fee-intent reservation recovery (2026-09-08)

- Files: `lib/bookings/charge-fee.ts` (`prepareFeePayment` retention guard), `app/api/bookings/[id]/fee-pay-intent/route.ts` (reconciliation response and admin alert).
- Known exact Stripe intents can be recovered and published by the fee route even after the creation-key retention window. An expired claim with no safely identifiable intent is deliberately blocked instead of creating a potentially duplicate charge.
- Blocker: `app/api/cron/reconcile/route.ts` reports payment mismatches but has no fee claim reset handler; no `app/api/admin` handler writes `fee_charge_claimed_at`. The customer sees payment review required and no retry-payment action for this case.
- Next step: inspect the named booking and Stripe obligation with authorization, then implement and independently review a bounded administrative repair that proves the old intent is canceled/absent or adopts its verified pointer before releasing the claim. No claim reset or live payment/database operation was performed during consolidation.

## Pre-charge pointer publication failure (inherited, 2026-09-08)

- Files: `app/api/cron/pre-charge/route.ts:132`, `lib/bookings/off-session-charge.ts`.
- Observed boundary: if Stripe creates an intent but the database refuses its pointer publication, a confirmed/card_saved booking can remain eligible with a null pointer. A later attempt beyond Stripe idempotency retention is not guaranteed to reuse the original intent. Baseline comparison confirms the preceding synchronous charged path has the same create-before-publication shape.
- Blocker: no persisted pre-create claim protects this existing pre-charge path during a database publication outage. Successful pending-pointer persistence and normal webhook order tests do not establish that missing guarantee.
- Next step: separately scope and review durable pre-charge reservation/reconciliation against creation, failed publication and an expired retry, using an isolated payment fixture before activation. No live duplicate charge or database outage was demonstrated during consolidation.

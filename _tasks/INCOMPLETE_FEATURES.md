# Incomplete Features

> This file tracks features that have been partially built. See CLAUDE.md Rule 45 for protocol.

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

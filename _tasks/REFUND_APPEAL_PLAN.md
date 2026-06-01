# Money-Adjustment System: Guest Booking + Order Numbers + Upcharges + Refund Appeals + Admin Tracking

Created 2026-06-01. Owner-requested ("Raymond"). Status: PROPOSAL, awaiting council sign-off + owner approval. No code written yet.

Decoded goal (voice brief, 2026-06-01): let people book as a **guest or logged in (both)**, give every booking a **human order/confirmation number**, and support post-booking money adjustments in **both directions**, with an **admin/operator surface that can look up a code and see what it is, what happened, and act on it**. Email-after-booking is explicitly the owner's to build later, so notifications are OUT of scope here (we leave clean hooks).

**Both directions are first-class (owner confirmed):**
- **Salon side: price adjustment / upcharge.** A salon asks for more on a completed booking; the customer approves or disputes. This already has code (`price_disputes`) and we KEEP it.
- **Customer side: refund request / appeal.** A customer (incl. a guest with no account) asks for money back, references the order number, and can appeal a rejection. This is NEW.
One admin surface tracks both.

---

## 1. What already EXISTS (reuse, do not rebuild)

| Piece | Where | State |
|---|---|---|
| Logged-in booking write | `/api/bookings` POST + `lib/validations.ts` | DONE (G1, verified) |
| Salon-initiated refund (Stripe) | `/api/bookings/[id]/refund` | Code exists; reads drifted cols (see Section 3) |
| Price adjustment / upcharge (salon to customer) | `/api/bookings/[id]/dispute` + `price_disputes` | Code exists, table MISSING (drift). KEEP this: salon-side flow the owner wants. Phase 0 revives it. |
| Admin dispute panel + action | `/api/admin/disputes`, `/api/admin/booking-disputes/[id]/action`, `components-legacy/admin/BookingDisputePanel.tsx` | UI/API exist; depend on the missing tables |
| "Report a problem" complaint | `/api/bookings/[id]/report` + `content_reports` table | LIVE (table has 10 cols). Reusable seed for the customer appeal flow |
| Human code + guest tracking token pattern | `lib/barber/walkin-ticket.ts` (`ticket_number` + `tracking_token` via nanoid) | LIVE for walk-ins. Exact pattern for guest access by number |
| Stripe refund mechanics | `lib/stripe.ts` `refunds.create`, used by refund route | LIVE |

**Reuse decisions:**
- Money out (refund) = the existing `/api/bookings/[id]/refund` Stripe path. New appeal logic calls into it on approval; we do NOT write a second Stripe refund path.
- Money in (upcharge) = the existing `price_disputes` flow, revived in Phase 0.
- Guest-access-by-number = the walk-in `tracking_token` pattern, mirrored for bookings, not reinvented.
- Admin tracking UI = extend the `BookingDisputePanel` pattern into a unified case queue, not a from-scratch admin.

## 2. The GAPS to build

1. **Guest booking** does not exist: `bookings.user_id` is `NOT NULL`, no guest columns, `/api/bookings` 401s without a session, and `GuestBookingForm` is orphaned (exported, never rendered).
2. **Order/confirmation number** does not exist on appointment bookings (walk-ins have one; appointments do not).
3. **Customer/guest-initiated refund request + appeal** does not exist.
4. **Guest access to manage/appeal** does not exist (every booking sub-route requires `user.id` + ownership; a guest cannot authenticate).
5. **Unified admin/salon tracking by code** does not exist for refunds (the panel targets the salon-upcharge disputes, and its tables are drifted).
6. **Real dates** are thin because `staff_schedules` is nearly empty, so the 30-day per-stylist generator produces nothing.

## 3. Foundation problem: schema drift (Phase 0, blocking)

Confirmed via live DB introspection (`cols: 0` = table absent):
- `price_disputes` ABSENT (the dispute/upcharge code uses it). REVIVE in Phase 0.
- `booking_disputes`, `disputes` ABSENT.
- `bookings.refunded_amount`, `bookings.paid_amount` appear ABSENT (the refund route reads them).
- `content_reports` present (10 cols). `bookings` present (35 cols). `barber_walkin_queue` present (20 cols).

Per the schema-drift memory + DB rules, the fix is migrations applied via `supabase db push` (NOT ad-hoc SQL), and it needs owner approval. Phase 0 reconciles ONLY the payment/refund/dispute slice this plan touches.

## 4. Proposed data model

### 4a. Booking reference + guest fields (migration)
- `bookings.user_id` to NULLABLE (guest bookings have no user).
- `bookings.guest_name`, `bookings.guest_email`, `bookings.guest_phone` (text, nullable).
- `bookings.reference_code` (text, unique, e.g. `SOL-7K2QX`): the human "order number".
- `bookings.access_token` (text, high-entropy): secret for guest access by number (mirror walk-in `tracking_token`).
- Backfill `reference_code` for existing rows.

### 4b. Salon upcharge (revive existing `price_disputes`)
- Apply the migration that matches the columns the dispute route already expects: `original_amount`, `requested_amount`, `salon_reason`, `status`, `expires_at`, `customer_response`, `customer_responded_at`.

### 4c. Refund appeals (new table `refund_requests`)
- `id`, `booking_id` fk
- `requested_by_user_id` uuid null (null = guest, authorized via booking `access_token`)
- `reason_code` (`service_quality` | `no_show_salon` | `wrong_charge` | `double_charge` | `other`), `reason_text`
- `requested_amount` numeric null (null = full)
- `status`: `open` -> `salon_reviewing` -> (`salon_approved` | `salon_rejected`) -> `escalated` -> (`admin_approved` | `admin_rejected`) -> `refunded` | `closed`
- `salon_response`, `salon_responded_at`, `admin_response`, `admin_responded_at`
- `resolved_amount` numeric null, `stripe_refund_id` text null
- `created_at`, `updated_at`
- history: a small `case_events` child table (actor, action, note, at) powering the admin "what happened" timeline, shared by upcharge + refund.

## 5. The flows

**Booking (guest or logged-in):** pick service/stylist/time. If logged out, show `GuestBookingForm` (name + phone required, email optional). POST `/api/bookings` accepts EITHER a session OR guest info. On success, a `reference_code` + `access_token` are issued and shown on confirmation (emailed later, owner's piece).

**Salon upcharge (salon to customer):** salon opens a completed booking, requests a higher amount with a reason (capped at +50%). Customer approves (charged the difference) or disputes (goes to admin). Auto-expiry after 48h is the current behavior, to confirm.

**Refund appeal (customer or guest):** customer opens their booking (account, or guest lookup by `reference_code` + access link). "Request a refund" button -> reason + amount -> POST `/api/bookings/[id]/refund-request` (guest authorized by token). Salon approves (calls existing Stripe refund) or rejects with a reason. If rejected, customer escalates -> admin makes the final call.

**Admin tracking:** one panel listing both upcharges and refund requests, searchable by `reference_code`, showing the booking, who filed it, the reason, the full timeline, and actions. Extends `BookingDisputePanel`.

## 6. Phased build plan

Tags: [DB] migration (needs approval), [BE] backend, [FE] frontend.

- **Phase 0: schema reconciliation** [DB]. Audit + apply the missing migrations for `price_disputes` (REVIVE) and `bookings.refunded_amount/paid_amount`, via `supabase db push` after a dry-run diff + backup. Foundation for everything else.
- **Phase 1: guest booking** [DB][BE](+small [FE]). Nullable `user_id` + guest cols + `reference_code` + `access_token`. `/api/bookings` accepts session OR guest info. Wire `GuestBookingForm` into the logged-out flow.
- **Phase 2: order numbers everywhere** [BE][FE]. Generate `reference_code` on every booking (reuse the walk-in nanoid helper, with collision retry). Show on confirmation + booking detail + dashboard rows. Guest lookup page `/booking/lookup`.
- **Phase 3: both adjustment backends** [DB][BE]. (a) Confirm/repair the revived upcharge flow end to end. (b) New `refund_requests` + `/api/bookings/[id]/refund-request` (create, guest-token authorized) + salon review (approve -> existing Stripe refund, reject, escalate) + admin final-decision endpoint. Shared `case_events` timeline.
- **Phase 4: customer/guest frontend** [FE]. "Request a refund" button + form (customer + guest), a status/timeline view, escalate button; the customer side of the upcharge approve/dispute. (Per owner policy: competitor-informed mockups first, then build on approval.)
- **Phase 5: admin/salon tracking** [FE][BE]. Extend `BookingDisputePanel` into a unified case queue (upcharges + refunds), search by code, timeline, actions. Salon-side widget in the salon dashboard.
- **Phase 6: real dates** [DB][BE]. Seed weekly `staff_schedules` for demo stylists + run the generator -> 30 days of per-stylist slots (also fixes specific-stylist "no dates"). For real salons this works once an owner sets hours.

Dependency: the actual money movement (Phase 3 refund approve, and the upcharge charge) only works once appointment **payments** exist (G2, not built). The systems (request, track, admin, statuses, timeline) can be built and tested now with the Stripe call stubbed/zeroed, and the real charge/refund wired when G2 lands.

## 7. Gaps and risks

### Money / Stripe
- **Payment dependency (hard).** No appointment charges exist yet (G2). Until then, both refund and upcharge move no real money. Build the systems now, wire money at G2.
- **Stripe Connect + payouts.** If a salon's funds were already paid out, a refund can push its balance negative. Need the Connect model (destination charges vs separate charges + transfers) and a policy for who absorbs post-payout refunds. Classic marketplace risk.
- **Idempotency / double action.** Salon and admin both acting, or a double-click, can double-refund or double-charge. Require Stripe idempotency keys + DB status guards + one-open-case-per-booking.
- **Unit mismatch.** The refund route uses cents (amount * 100) while `bookings.price_paid` is numeric (likely CHF units). One unit convention must hold end to end, verified.
- **Upcharge collection.** Charging more after the fact needs a saved payment method + off-session charge, which triggers SCA (EU/Swiss strong customer auth). May require customer re-confirmation.

### Security / auth / privacy
- **Guest bearer token.** `access_token` in a link is a secret: leakage via shared links, no expiry, enumeration. Mitigate with high-entropy tokens, rate-limited lookups, optional expiry, and never the order number alone as auth (order numbers are guessable).
- **Multi-actor authz.** One resource accessed by guest (token), customer (session), salon (ownership), admin (role). Centralize the authorization check to avoid a hole.
- **PII / Swiss DSG + GDPR.** Guest name/email/phone on bookings + appeals. Need retention, right-to-deletion (guests have no account to self-serve), and no PII in URLs or logs.

### Data / schema
- **Drift reconciliation is itself risky.** `db push` against a drifted live DB can conflict or partially apply. Require a dry-run diff + backup before push.
- **Revived table must match code.** `price_disputes` columns must match what the dispute route already reads; otherwise reviving it just moves the breakage. Verify migration vs code.
- **Code uniqueness.** `reference_code` collisions under concurrency; reuse the walk-in retry-on-collision helper, with a DB unique constraint.

### Product / flow / abuse
- **Status-machine complexity.** Two flows, each multi-step with auto-expiry. Define the state machine explicitly and guard transitions to avoid stuck/invalid states.
- **Abuse both ways.** Customers spamming refund requests; salons over-upcharging. Mitigate with one-open-request-per-booking, rate limits, the +50% upcharge cap, and a full audit trail.
- **Notifications deferred = flows feel broken.** Without email/SMS (owner's later piece), neither party learns of a request or decision. Leave hooks; flag as a UX dependency.
- **Two booking types.** Walk-ins and appointments both need refunds; do not fork (walk-in refund is task #16). Unify the path.
- **Guest expectations.** A guest with no account can only act via the token link; set expectations and consider a "claim this booking into an account" upgrade.

### Operational
- **Unified admin view spans 3 tables** (`content_reports`, `price_disputes`, `refund_requests`); needs normalization + search indexes on `reference_code`.
- **Auto-expiry jobs** (48h upcharge auto-approve, refund SLAs) need cron; infra exists (GitHub Actions) but must be wired with `CRON_SECRET`.

## 8. Decisions (status 2026-06-01)

DECIDED by owner:
- **D7 platform fee on refund:** KEEP Solen's commission wherever it is legally allowed; give it back only where the law requires. Needs a Swiss consumer-law check. Build it CONFIGURABLE (a per-reason / global toggle driving Stripe `refund_application_fee`) so it can go either way without a code change.
- **D8 upcharge no-response (explained below):** NO silent auto-approve. No customer response = VOID (no charge). An upcharge only goes through on explicit customer approval.
- **D9:** EXTEND `booking_disputes`. No new `refund_requests` table.
- **D10:** walk-in refunds are DEFERRED out of this pass.
- **D11 payment model = FULL PREPAY at booking** via Stripe (the Fresha model), with the card SAVED (off-session) for later charges. This is G2, now IN SCOPE and FOUNDATIONAL: it is what makes refunds, upcharges, and cancellation/no-show fees actually move money. New subplan SP-G2.
- **D12 cancellation + no-show = AUTO-charge** the saved card per the salon's preset policy (the Fresha/Treatwell model), disclosed and accepted at booking. This is the policy-automated lane: no per-case review, because the customer pre-agreed. New subplan SP-AC. Ties to tasks #16/#17.
- **D13 upcharge confirmed:** kept; the customer must explicitly approve (never silent); on approval the difference is charged to the saved card (SP-G2).
- **Review-first (owner directive):** nothing auto-approves. Every refund AND every upcharge is reviewed by a human before money moves. The system may RECOMMEND / fast-track, but a person confirms. See Section 11.
- **Frontend = MOCKUPS only (owner policy):** all front-end work is delivered as competitor-informed mockups for sign-off before any real build. See Section 12.

ASSUMED defaults (tell me to change any):
- **Who reviews:** salon first, Solen admin on escalation.
- **Partial refunds allowed** (capped at amount paid), not full-only.
- **Guest auth:** order number for display + a hashed access-token link for authorization, with a rate-limited "resend my link".
- **Build order:** payments (SP-G2 full prepay) + foundation (SP-0) are Layer 1, because every money flow depends on a real charge existing. See Section 14.

**D8 explained:** an "upcharge" is when, after a completed appointment, the salon asks for more than was booked (extra product, extra time). The question was: if the customer never answers, what is the default? *Auto-approve* (charge them anyway after 48h) is salon-friendly but bills a silent, possibly-unaware customer, which is unfair and a chargeback/legal risk, especially with no email live yet. *Void* (no charge on silence) is the safe default. Per your "it needs to get reviewed first," we go further: an upcharge only proceeds on explicit customer approval, and refunds are always reviewed too. Nothing charges or refunds on its own.

## 9. Out of scope (hooks left, not built)
- Email/SMS notifications (owner's, later). Clean trigger points left.
- Bank-side chargebacks / Stripe disputes (different from in-app appeals).
- Full schema-drift cleanup beyond the payment/refund/dispute slice.

---

## 10. Council review (2026-06-01): VERDICT + binding revisions

Five-member council (payments, security/privacy, database/migration, backend architecture, product/abuse). **Verdict: 5/5 APPROVE_WITH_CHANGES.** Directionally sound, but the items below are binding and SUPERSEDE the earlier sections where they conflict. Do not start building until these are reflected.

### 10a. Corrected facts (supersede Sections 1, 3, 9)
- **"Report a problem" writes `booking_disputes` (migration 075), NOT `content_reports`.** `content_reports` is generic UGC moderation (reviews/photos), out of scope. `booking_disputes` is the live customer-complaint spine: it already has a reason taxonomy (`overcharge`, `no_show_by_salon`, `wrong_service`), salon reply, admin escalate/refund/warn, and ~30-day mediation. Section 1 mislabeled this.
- **Two Stripe refund call sites ALREADY exist:** `app/api/bookings/[id]/refund/route.ts` (salon) and `app/api/admin/booking-disputes/[id]/action/route.ts` (admin, action `refund`). The claim "we do NOT write a second Stripe refund path" is already violated in shipped code. A third caller is coming.
- **Walk-in refunds already exist** and run off `barber_walkin_queue.payment_intent_id` (`app/api/walkin/queue/[id]/route.ts`), a separate path from `bookings`.
- **The complaint path already emails via Resend** (`report` route + admin action). Notifications are NOT fully deferred for this slice.
- **`price_disputes` (038) vs code mismatch:** the dispute route inserts `expires_at` but 038 has `auto_approve_at`; no `auto_approved` writer/cron exists, so the documented 48h auto-approve does NOT actually fire.

### 10b. Binding architecture changes
1. **EXTEND `booking_disputes`, do NOT create a new `refund_requests` table.** It already covers ~80% (reason codes, salon reply, admin refund-via-Stripe, mediation). Add: `requested_amount`, `resolved_amount`, guest columns, a customer-`escalated` status. A new table = a 4th overlapping system (the duplication the owner forbids).
2. **Collapse "report a problem" and "request a refund" into ONE entry point.** One form, reason picker, optional "I want money back (amount)" toggle. Same record with/without `requested_amount`. Two buttons for one intent is the confusion to avoid.
3. **ONE shared refund chokepoint.** Extract `lib/bookings/issue-refund.ts` `issueRefund({ source: 'booking'|'walkin', id, amount, actor })`, pass a Stripe **idempotency key**, set Connect **`reverse_transfer: true`** (and decide `refund_application_fee`), reconcile `salon_payouts` (incl. walk-ins). Migrate BOTH existing call sites onto it before adding the appeal caller. This is the single highest-leverage anti-duplication fix.
4. **Phase 0 is NOT `supabase db push`.** Local migration files and the remote `schema_migrations` history are divergent lineages; a push would replay 100+ untracked, partly non-idempotent files and abort mid-apply. Instead: reconcile history (`supabase migration repair`), then apply ONE new forward-only timestamped migration with `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS ... ADD CONSTRAINT` guards, on a Supabase branch / with a backup. Carry the needed 068 columns + the 038 fixes INTO that one migration (they will never apply on their own).
5. **Money unit = integer Rappen (cents) end-to-end.** Confirmed live bug: `bookings.price_paid` is CHF while `paid_amount`/`refunded_amount` are integer cents, and `refund/route.ts:51` coalesces them; `pre-charge/route.ts:52` charges a CHF value as Rappen (100x under-charge). Fix both as part of Phase 0; all new amount columns are Rappen; convert CHF at the FE boundary only.
6. **Nullable `user_id` does NOT enable guest booking by itself.** RLS `bookings_insert_auth WITH CHECK (auth.uid() = user_id)` rejects guest rows. Guest inserts go through a service-role server route; rewrite the bookings RLS so guest rows are reachable ONLY via the token-gated service-role path (not anon-visible). New-table guest access is app-layer token auth, never RLS (`auth.uid()` is null for guests).
7. **Guest token spec (in code, not prose):** `crypto.randomBytes(32).toString('base64url')` (256-bit), store a SHA-256 HASH (`access_token_hash`), look up by hash, `timingSafeEqual` if compared, TTL + regenerate-on-resolution. Never accept `reference_code` alone as auth. Token in a query param exchanged for a short-lived httpOnly cookie, never in the URL path or logs. Uniform 404 for bad-code and bad-token (no enumeration). One centralized `resolveBookingActor()` for guest/customer/salon/admin used by every booking sub-route.
8. **Upcharge default flips to VOID on no-response** (not auto-approve) while notifications are deferred; auto-approve-against-a-silent-guest is customer-hostile. Also: there is no charge executor and no auto-approve cron today, so either Phase 3 builds them (cron + on-session SCA re-confirm) or the upcharge-charge is explicitly descoped to G2.
9. **Reuse the existing Resend hooks** for appeal notifications; do not build a parallel notification system.
10. **Guest recovery + PII lifecycle are build items:** "resend my access link" by `reference_code` + email/phone match (rate-limited) + admin lookup fallback; retention/auto-purge cron for guest PII on closed cases; GDPR/DSG erasure NULLs the `guest_*` columns (do not hard-delete the booking, it cascades to reviews).
11. **Concurrency + state:** idempotency keys on every Stripe call; atomic refund accounting (`UPDATE ... WHERE refunded_amount = $stale`, not read-modify-write, since salon + admin can both approve); explicit status transition table with `.eq("status", expected)` CAS guards + terminal states; partial unique index for one-open-case-per-booking; `updated_at` trigger; `case_events` with two nullable FKs + an XOR CHECK.
12. **Rate-limit the money/lookup surface** with a dedicated limiter (not the 30/min `generalLimiter`); model **no-show / cancellation refunds** (the highest-volume real case) and tie them to the cancellation policy (tasks #16/#17), so refunds follow a rule, not ad hoc.

### 10c. New owner decisions (add to Section 8)
- **D7. Platform fee on refund:** when a booking is refunded, also refund the Solen commission, or keep it? (Drives `refund_application_fee` + the admin UI.)
- **D8. Upcharge no-response default:** void/decline (recommended) vs auto-approve. (Council: do not auto-approve while email is off.)
- **D9. Extend `booking_disputes`** (recommended) vs a new table. (Council strongly: extend.)
- **D10. Walk-in refunds:** include in the shared `issueRefund` helper now, or scope walk-ins out of this pass?

Build is gated on Sections 10b + the owner answering Section 8 + 10c.

---

## 11. What qualifies as a refund + the review workflow (owner directive 2026-06-01)

Money moves two ways and they are handled differently (this matches Fresha/Treatwell for charges + Uber for refunds).

LANE A: POLICY-AUTOMATED CHARGES (no per-case review; the customer pre-agreed at booking)
- Cancellation fee: customer cancels INSIDE the salon's preset window -> auto-charge the saved card the policy amount (up to 100%). Window + fee are salon settings (tasks #16/#17), shown and accepted at booking.
- No-show fee: salon marks a no-show -> auto-charge the saved card the policy amount.
- Upcharge (D13): salon requests more for a completed booking; the CUSTOMER must approve (this one is not silent); on approval the difference is charged.
- Rationale: the rule was disclosed and accepted, so no human adjudication is needed. Executes off-session against the SP-G2 saved card (SCA handled).

LANE B: REVIEWED REFUNDS (money back to the customer; a human always confirms = your "review first")
- Salon cancelled or no-showed the customer: full refund (fast-track recommended, still confirmed).
- Service not delivered, or materially different from booked: reviewed, partial or full.
- Wrong amount / overcharge / double charge: refund the difference (fast-track recommended).
- Quality complaint: discretionary, salon decides, admin on escalation.
- NOT eligible by default: change of mind after the service; cancellation outside the policy window (beyond the policy refund).
- Reporting window: a customer can open a refund case up to N days after the appointment (Uber uses 48h; proposed default 14 days for appointments, owner to confirm).

Lane B workflow: `open` -> salon review (approve full/partial, or reject with a reason) -> if rejected, the customer escalates -> Solen admin final decision. Fast-track is a hint, never automatic. Every state change writes to the case timeline.

So: money OUT (refunds) is always reviewed; money IN per a pre-agreed policy (cancellation/no-show) is automated; upcharge is customer-approved. Open: the cancellation window + fee values (tasks #16/#17), the D7 legal question, and the Lane B reporting window.

## 12. Front-end work = mockups (owner policy). Inventory to design.

Every screen below is delivered as a competitor-informed mockup in the Solen design system for sign-off BEFORE any real build (brief template: `_design-system/AGENT_BRIEF_TEMPLATE.md`). None are built for real until signed off.

1. Guest booking form (exists but orphaned): design check + where it slots into the logged-out flow.
2. Confirmation screen with the order number (copy + share + "save your access link").
3. Guest lookup page: enter order number, access via the token link.
4. "Resend my access link" page (rate-limited).
5. Unified "Report a problem / Request a refund" entry on a booking: one button -> one form (reason picker + optional "I want money back" + amount).
6. Refund / appeal status + timeline view (customer and guest).
7. Escalate-to-Solen affordance + its states.
8. Salon dashboard: refund REVIEW queue + review detail (approve full/partial, reject + reason, eligibility category).
9. Admin: unified case queue (search by order code) + case detail with full timeline + actions.
10. Salon upcharge: request form (salon side) + customer approve/decline screen.

## 13. Subplans (precise, per gap)

Detailed, code-grounded subplans live in `_tasks/refund-appeal/`. Each lists exact files, schema DDL, endpoint contracts, logic, acceptance criteria, risks, and the mockups it needs. They incorporate the Section 8 decisions + the Section 10 council fixes.

- **SP-0 Foundation:** migration-history reconcile + single guarded migration + centimes unit lock + shared `issueRefund` chokepoint -> `_tasks/refund-appeal/SP0-foundation.md`
- **SP-1 Guest booking:** nullable user_id + guest RLS + service-role insert + guest fields + form wiring -> `SP1-guest-booking.md`
- **SP-2 Order numbers + guest access:** reference_code + hashed token + lookup + resend + central authz -> `SP2-order-numbers.md`
- **SP-3 Adjustments core:** extend `booking_disputes` + eligibility + review-first workflow + escalation -> `SP3-adjustments.md`
- **SP-5 Review interfaces:** salon refund-review queue + admin unified tracking -> `SP5-review-admin.md`
- **SP-G2 Payments (full prepay):** charge the full amount at booking via Stripe + save the card for later + Connect + SCA -> `SPG2-payments.md` (Layer 1, foundational)
- **SP-AC Auto-charge:** salon cancellation/no-show policy settings + off-session charge of the saved card per policy -> `SPAC-autocharge.md`
- Phase 4 FE = Section 12 mockups. Phase 6 dates = WAVE_PLAN. Walk-in refunds deferred (D10).

---

## 14. Execution model + how we start (owner directive 2026-06-01)

How the build runs autonomously and safely: the bulletproof model from the stress test, plus the owner's build -> review -> log -> mockups flow.

SEQUENCED PIPELINE (not naive parallel; it is a dependency DAG over shared state):
- **Layer 1 (foundation):** SP-0 (schema reconcile + single guarded migration + centimes lock + `issueRefund`) and SP-G2 (full prepay + saved card). One writer owns the migration + shared files.
- **Layer 2:** SP-2 (order numbers + token + `resolveBookingActor`), then SP-1 (guest booking).
- **Layer 3:** SP-3 (refund + upcharge engine) and SP-AC (cancellation/no-show auto-charge).
- **Layer 4:** SP-5 (salon review + admin tracking).
- **Then:** all the Section 12 mockups (parallel-safe, independent HTML files).

RULES (so there are no duplicates or risk gaps):
- ONE writer per shared artifact (the migration, `bookings/route.ts`, `validations.ts`, the `lib/` helpers). Other agents call them, never co-edit.
- BUILD then REVIEW after each layer: a review agent (council-style) checks the layer for duplication, missed reuse, gaps, and the Section 10 risks, before the next layer starts. Plus a final full review pass.
- VERIFICATION GATE per layer: tsc + targeted SQL/curl checks must pass before proceeding (money/auth/PII, no skipping).
- Anything not finished is logged to `_tasks/INCOMPLETE_FEATURES.md` (file:line, blocker, next steps), never silently dropped.

THE ONE SAFETY GATE: applying the schema migration. The live DB is real and already drifted, so the migration runs on a SUPABASE BRANCH (isolated copy) + a git feature branch. Everything is autonomous on the branch; the owner reviews + merges when happy. No live-DB risk, no merge mess on main. (Alternative if no branch: I write + verify all I can, and the owner presses apply once.)

START CONDITION: owner says go + picks the migration approach (Supabase branch recommended) + confirms full prepay (SP-G2). Then Layer 1 begins.

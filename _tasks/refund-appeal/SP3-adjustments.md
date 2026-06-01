# SP-3 Adjustments Core

> Drafted 2026-06-01. Subplan of `_tasks/REFUND_APPEAL_PLAN.md` (Sections 8, 10, 11).
> Backend + DB design only. No code is written by this document. Front-end is MOCKUPS-first (owner policy, Section 12).
> **Honors the binding council decisions:** D9 EXTEND `booking_disputes` (no new `refund_requests` table), review-first (NOTHING auto-approves), D8 upcharge no-response = VOID, the shared `issueRefund` chokepoint from SP-0, eligibility categories from Section 11, Rappen-everywhere money unit (§10b-5), one centralized `resolveBookingActor()` from SP-2 (§10b-7).

---

## Objective

Build the **two-direction money-adjustment engine** on top of a single, extended `booking_disputes` table:

1. **Customer/guest direction (refund / complaint).** ONE entry point creates a case. "Report a problem" and "request a refund" are the SAME record, distinguished only by whether `requested_amount` is set (null = complaint with no money ask; a value = a refund ask). Replaces the two-buttons-for-one-intent confusion (§10b-2).
2. **Salon direction (upcharge).** The salon asks for more on a completed booking; the customer must **explicitly approve** before any money moves. No silent auto-approve; no-response = VOID (D8).
3. A **review-first status machine** common to both directions: every money movement is confirmed by a human (salon first, Solen admin on escalation). The system may *recommend* a fast-track but never acts on its own (Section 11). Each direction has its own legal transition set inside one enum.
4. An explicit, **CAS-guarded** (`.eq("status", expected)`) status machine with terminal states, a **partial unique index** enforcing one-open-case-per-booking, and a **`case_events`** timeline row written on every transition.

This SP delivers the **backend + DB contract**. It calls the shared `issueRefund` chokepoint (SP-0) for money-out. For money-in (the approved upcharge), it specifies the executor but **defers the actual SCA charge to G2** (see "Out of scope" + the §10b-8 rationale).

---

## Depends on

| Dep | What SP-3 needs from it | Status |
|---|---|---|
| **SP-0 Foundation** | (a) The single guarded forward-migration that REVIVES `booking_disputes` live (confirmed ABSENT — `cols: 0`); SP-3's column additions ride INSIDE that one migration or a single follow-on guarded migration. (b) `lib/bookings/issue-refund.ts` `issueRefund({ source, id, amount, actor, idempotencyKey, reason })` — the ONE Stripe refund chokepoint; SP-3 calls it, never calls `stripe.refunds.create` directly. (c) Rappen (integer cents) money unit locked end-to-end; `bookings.paid_amount` / `refunded_amount` added as integer Rappen. | **BLOCKING.** `_tasks/refund-appeal/SP0-foundation.md` (not yet written; referenced by Section 13). |
| **SP-2 Order numbers + guest access** | `resolveBookingActor(req, bookingId)` returning `{ actor: 'guest'|'customer'|'salon'|'admin', userId? }` — the single authorization resolver used by every endpoint here. Guest is authorized by the hashed `access_token` exchanged for a short-lived httpOnly cookie (never the `reference_code` alone). Also `bookings.guest_name/guest_email/guest_phone`, `reference_code`, `access_token_hash`. | **BLOCKING for the guest path.** `_tasks/refund-appeal/SP2-order-numbers.md` (not yet written). The logged-in path can land first if SP-2 lags; guest create returns 401 until `resolveBookingActor` exists. |
| **SP-1 Guest booking** | Nullable `bookings.user_id` so a guest case can reference a guest booking. | Indirect (via SP-2). |
| Existing primitives (no change) | `paymentLimiter` (`lib/ratelimit.ts:35`) for the money/lookup surface; `logAuditEvent` (`lib/audit.ts`); `checkUserBanned`, `checkFeatureEnabled` (`lib/feature-flags.ts`); `validateBody` + zod (`lib/validations.ts`); Resend hooks already in `report` + admin-action routes. | LIVE. |

> **Live-DB reality (verified 2026-06-01, project `tocfnsmxmdxkrcmjzzdw`):** `booking_disputes`, `price_disputes`, `case_events`, `salon_payouts` are ALL absent (`cols: 0`). `bookings` has 35 cols incl. `price_paid` (numeric/CHF), `payment_intent_id`, `payment_status`, `user_id`; it does NOT yet have `paid_amount`, `refunded_amount`, `guest_*`, `reference_code`, or `access_token_hash`. So 075/038 never applied live — SP-0 reconciliation is a hard prerequisite, not a nicety.

---

## Schema / DB changes

All DDL is **forward-only, guarded** (`ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS … ADD CONSTRAINT`, `CREATE … IF NOT EXISTS`), applied as ONE new timestamped migration that runs AFTER SP-0 has revived `booking_disputes`. The base table (075) is referenced, not re-created, here.

### A. `booking_disputes` extensions (base table = migration `075_booking_disputes.sql`, revived by SP-0)

Reference of the existing 075 columns SP-3 keeps as-is: `id`, `booking_id` (FK, `ON DELETE CASCADE`), `reporter_id`, `reported_id`, `issue_type`, `description`, `status`, `salon_response`, `salon_responded_at`, `resolution`, `resolved_by`, `resolved_at`, `mediation_started_at`, `mediation_deadline_at`, `created_at`, `updated_at`, `CONSTRAINT one_complaint_per_booking UNIQUE (booking_id)`.

**New columns (all nullable unless noted):**

| Column | Type | Notes |
|---|---|---|
| `direction` | `text NOT NULL DEFAULT 'refund'` | `CHECK (direction IN ('refund','upcharge'))`. Tags which engine owns the row. The customer entry point writes `'refund'`; the salon upcharge entry point writes `'upcharge'`. |
| `reason_code` | `text` | The Section 11 eligibility taxonomy (see §B). Nullable for legacy/`upcharge` rows. Supersedes nothing — `issue_type` (075) stays for back-compat; `reason_code` is the richer field new code reads. New writes set BOTH (`issue_type` mapped from `reason_code`, see "Reuse"). |
| `requested_amount` | `integer` | **Rappen.** `CHECK (requested_amount IS NULL OR requested_amount >= 0)`. `refund` direction: null = full refund of remaining; value = partial ask. `upcharge` direction: the extra the salon wants (the +50% cap is enforced in code against `bookings.paid_amount`, see endpoints). |
| `resolved_amount` | `integer` | **Rappen.** The amount actually moved (refunded, or charged on an approved upcharge). Set by the approving transition. `CHECK (resolved_amount IS NULL OR resolved_amount >= 0)`. |
| `eligibility` | `text` | `CHECK (eligibility IS NULL OR eligibility IN ('eligible','discretionary','not_eligible'))`. Computed at create from `reason_code` (Section 11 map). A stored HINT for the reviewer. |
| `fast_track_recommended` | `boolean NOT NULL DEFAULT false` | Hint only. NEVER triggers an automatic action (Section 11). |
| `requested_by_user_id` | `uuid` | `REFERENCES auth.users(id) ON DELETE SET NULL`. **Null = guest** (authorized via SP-2 token). Distinct from `reporter_id` (075 `NOT NULL` → see migration note). |
| `customer_response` | `text` | `CHECK (… <= 1000)`. The upcharge approve/decline note + the refund-requester's escalation note. |
| `customer_responded_at` | `timestamptz` | |
| `escalated_at` | `timestamptz` | Set when the customer escalates a `salon_rejected` refund. |
| `admin_response` | `text` | `CHECK (… <= 1000)`. Distinct from 075 `resolution` (kept for back-compat); new admin code writes `admin_response` + still sets `resolution`. |
| `admin_responded_at` | `timestamptz` | |
| `stripe_refund_id` | `text` | Returned by `issueRefund`; stored for reconciliation + idempotency audit. |
| `idempotency_key` | `text` | The key SP-3 generates and passes to `issueRefund` (and, at G2, to the upcharge charge). `UNIQUE` (partial, `WHERE idempotency_key IS NOT NULL`) so a retry can't double-move money even across rows. |
| `expires_at` | `timestamptz` | **Upcharge only.** The window after which a no-response upcharge VOIDS (D8). No cron auto-approves; voiding is lazy (computed on read) + an optional housekeeping cron may flip it to `void` (see Risks). For `refund` rows this is null. |

> **075-migration interaction (must be in the SP-3 migration, guarded):**
> - 075's `reporter_id NOT NULL` blocks guest refunds. SP-3 migration: `ALTER TABLE booking_disputes ALTER COLUMN reporter_id DROP NOT NULL;` (a guest case has `reporter_id = NULL`, `requested_by_user_id = NULL`, and is authorized by the booking token). `reported_id` likewise `DROP NOT NULL` (salon owner may be derived later for guest cases).
> - 075's `issue_type` CHECK lacks the new `reason_code` values; we DON'T widen `issue_type`. Instead new code maps `reason_code → issue_type` (see Reuse) so the old CHECK still passes.
> - 075's `one_complaint_per_booking UNIQUE (booking_id)` is **too strict** for the two-direction world (a booking could have a closed refund AND a new upcharge). **Replace** it with a partial unique index on OPEN states only (see §D). Migration: `ALTER TABLE booking_disputes DROP CONSTRAINT IF EXISTS one_complaint_per_booking;` then create the partial index.

### B. The status enum (one enum, two legal sub-paths)

Stored as `text` with a single `CHECK` (matches the 075 style; avoids a Postgres enum-type migration). The **full closure**:

```
open, salon_reviewing, salon_approved, salon_rejected,
escalated, admin_approved, admin_rejected,
refunded, charged, void, closed
```

`CHECK (status IN ('open','salon_reviewing','salon_approved','salon_rejected','escalated','admin_approved','admin_rejected','refunded','charged','void','closed'))`.

- `refunded` = terminal success for the **refund** direction (money returned via `issueRefund`).
- `charged` = terminal success for the **upcharge** direction (extra collected — at G2; pre-G2 an approved upcharge stops at `salon_approved`/`admin_approved` with money deferred, see Out of scope).
- `void` = terminal, no money moved (upcharge no-response/decline, or a withdrawn refund).
- `closed` = terminal catch-all (rejected-and-not-escalated refund after a grace window, admin dismiss).
- `salon_approved` / `admin_approved` are **transient** for refunds (they immediately drive the `issueRefund` call inside the same request and advance to `refunded`); they are persisted as a checkpoint only if the Stripe call fails (so a retry can resume).

The **two legal transition sub-tables** live in the Backend section (one per direction) — the enum is shared, the *allowed edges* are not.

### C. `case_events` (new child table — the timeline; shared by both directions)

```sql
CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.booking_disputes(id) ON DELETE CASCADE,
  actor_role text NOT NULL CHECK (actor_role IN ('customer','guest','salon','admin','system')),
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- null for guest/system
  action text NOT NULL,            -- e.g. 'created','salon_approved','escalated','refund_issued','voided'
  from_status text,                -- snapshot of the status before this event
  to_status text,                  -- snapshot after
  amount integer,                  -- Rappen, when the event moved/claimed money
  note text CHECK (note IS NULL OR char_length(note) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS case_events_dispute_id_idx ON public.case_events (dispute_id, created_at);
```

- Written **inside the same transaction / immediately after** every successful status transition. If the event insert fails, log `console.error("[booking-disputes] case_event write failed:", err)` but do NOT roll back a completed money move (the audit-log via `logAuditEvent` is the redundant trail).
- RLS: readable by the same parties allowed to read the parent dispute (mirror the 075 select policies via an `EXISTS (SELECT 1 FROM booking_disputes d WHERE d.id = case_events.dispute_id AND <075-visibility>)`). Inserts are server-side (service-role) only.
- The §10b-11 "two nullable FKs + XOR CHECK" note applies to the *parent* if it ever points at two booking sources; here `case_events` has a single `dispute_id` FK, so no XOR is needed at this level.

### D. Partial unique index — one OPEN case per booking per direction

Replaces 075's blanket `UNIQUE (booking_id)`. A booking may have at most ONE non-terminal case **per direction** (so a customer refund and a salon upcharge can't both be juggled in a way that double-moves money, but a closed case doesn't block a new one):

```sql
CREATE UNIQUE INDEX IF NOT EXISTS booking_disputes_one_open_per_dir
  ON public.booking_disputes (booking_id, direction)
  WHERE status NOT IN ('refunded','charged','void','closed','salon_rejected','admin_rejected');
```

> Rejected states are excluded from the index so a rejected refund can be RE-opened only via escalation on the SAME row (we never create a second row for the same dispute) — escalation mutates the existing row, it does not insert. A brand-new refund after a fully `closed` one is allowed. The `23505` from this index maps to HTTP 409 in the create endpoints.

### E. `updated_at` trigger

075 already installs `booking_disputes_updated_at`. No change. `case_events` is append-only (no `updated_at`).

### F. Feature flag

Reuse the existing `dispute_reporting` flag (075 seeds it) as the kill-switch for the customer create endpoint. Add `INSERT … ('upcharge_requests', true, …) ON CONFLICT DO NOTHING` for the salon upcharge direction so the two directions can be toggled independently.

---

## Backend changes

Conventions for every endpoint below: `runtime = "nodejs"`, `dynamic = "force-dynamic"`; `validateBody(<schema>, body)` for input; `applyRateLimit(paymentLimiter, …)` on every money/lookup mutation (NOT `generalLimiter` — §10b-12); `checkUserBanned` on authenticated actors; authorization via `resolveBookingActor()` (SP-2); `logAuditEvent(req, actorId, action, "booking_dispute", id, meta)` on every mutation; a `case_events` row on every transition; all amounts **Rappen**.

### Reused/extended files (NOT new)

- **`app/api/bookings/[id]/report/route.ts`** — EXTEND the existing `POST` (currently writes `booking_disputes` with `issue_type` + `description`). This becomes the **unified customer/guest create** (refund direction). Keep `GET` (customer views their case) and widen it to also serve a guest via `resolveBookingActor`.
- **`app/api/bookings/[id]/dispute/route.ts`** — currently writes the separate `price_disputes` table. **Re-point it at `booking_disputes` with `direction='upcharge'`** so both directions share one spine (§10b-1). `price_disputes` (038) is then dead for new writes; SP-0 decides whether to migrate any legacy rows (none exist live — `cols: 0`).
- **`app/api/admin/booking-disputes/[id]/action/route.ts`** — EXTEND: the admin final-decision endpoint. Its inline `stripe.refunds.create` (lines ~119-128) is **replaced by a call to `issueRefund`** (SP-0) so there's one chokepoint. Add `admin_approved`/`admin_rejected` transitions + `case_events`.
- **`app/api/admin/disputes/route.ts`** — currently lists `price_disputes`. SP-5 turns this into the unified queue; SP-3 only needs it to also read `booking_disputes` (left to SP-5; noted here so the two SPs don't collide).

> New zod schemas to ADD to `lib/validations.ts` (existing relevant ones: `reportDisputeSchema` line 552, `salonDisputeResponseSchema` 557, `priceAdjustmentSchema` 250, `disputeResponseSchema` 255, `adminDisputeBookingActionSchema` 561, `bookingRefundSchema` 690). New: `createCaseSchema`, `salonReviewSchema`, `customerEscalateSchema`, `upchargeRequestSchema`, `upchargeRespondSchema`, `adminCaseDecisionSchema` (shapes given per-endpoint below).

---

### Endpoint 1 — Customer/guest create a case (unified report + refund)

- **METHOD / path:** `POST /api/bookings/[id]/report`  *(extend existing)*
- **Authorized actor:** `customer` (session, owns the booking) OR `guest` (booking `access_token` via `resolveBookingActor`). 401 if neither; 403 if the actor doesn't match the booking.
- **Request** (`createCaseSchema`):
  ```ts
  {
    reason_code: 'salon_cancelled' | 'no_show_salon' | 'not_delivered'
               | 'wrong_amount' | 'double_charge' | 'quality' | 'other',
    description: string (min 20, max 1000),
    requested_amount?: integer (Rappen, >=0, <= remaining refundable)  // null/omitted = complaint, or full refund if the reason is money-bearing
    wants_refund: boolean        // explicit toggle from the unified form (Section 12 #5)
  }
  ```
  Rule: if `wants_refund` is false → store `requested_amount = NULL` (pure complaint). If true and `requested_amount` omitted → `NULL` means "full" (resolved at approval against remaining). If true and provided → partial, validated `<= (paid_amount - refunded_amount)`.
- **Logic:**
  1. Load booking (`id, user_id, salon_id, status, paid_amount, refunded_amount, salons(owner_id)`). Booking must be `completed` (mirror 075 INSERT policy) for refund/complaint; `wrong_amount`/`double_charge` also allowed on `confirmed`.
  2. `eligibility` + `fast_track_recommended` from the Section 11 map (§ below).
  3. `issue_type` derived from `reason_code` (map below) so the 075 CHECK passes.
  4. Insert `booking_disputes` with `direction='refund'`, `status='open'`, `reporter_id = customer userId or NULL (guest)`, `requested_by_user_id` same, `reported_id = salons.owner_id or NULL`.
  5. On insert, the partial unique index (`booking_disputes_one_open_per_dir`) enforces one-open-refund-per-booking → `23505` ⇒ **409**.
  6. Write `case_events`: `action='created'`, `to_status='open'`, `amount = requested_amount`.
  7. Reuse the existing Resend hook (already in the file) to notify the salon owner.
- **Response:** `201 { case: { id, status, reason_code, eligibility, fast_track_recommended, requested_amount } }`
- **Status codes:** 201 created · 400 validation/booking-not-eligible-status · 401 unauth · 403 wrong actor · 409 open case already exists · 500.

### Endpoint 2 — Customer/guest view a case

- **METHOD / path:** `GET /api/bookings/[id]/report`  *(extend existing GET)*
- **Authorized actor:** `customer` or `guest` (via `resolveBookingActor`). Salon/admin use their own surfaces (SP-5).
- **Response:** `200 { case: {...} | null, events: CaseEvent[] }` — the case + its timeline (for Section 12 #6). Guests get the same shape.
- **Codes:** 200 · 401 · 403.

### Endpoint 3 — Salon review a refund case (approve full/partial, or reject)

- **METHOD / path:** `PATCH /api/bookings/[id]/report`  *(extend; salon branch)* — or a dedicated `POST /api/bookings/[id]/dispute-review` if cleaner; **decision: keep on the existing `report` PATCH** (075 already has a salon PATCH there) to avoid a new file.
- **Authorized actor:** `salon` (owner of the booking's salon, via `resolveBookingActor`). 403 otherwise.
- **Request** (`salonReviewSchema`):
  ```ts
  { action: 'approve' | 'reject',
    approved_amount?: integer (Rappen, required when action='approve'; <= remaining refundable),
    salon_response: string (min 10, max 1000) }   // reason required on reject
  ```
- **Logic (review-first; salon is the FIRST reviewer):**
  1. CAS-load the case: `.eq("booking_id", id).eq("direction","refund").eq("status","open")`. (Optionally also accept `salon_reviewing` if a "claim" step is added; v1 transitions `open → …` directly.) If no row at that status ⇒ **409 stale**.
  2. **reject:** `UPDATE … SET status='salon_rejected', salon_response, salon_responded_at=now() WHERE id=$id AND status='open'`. If `rowCount=0` ⇒ 409. `case_events`: `salon_rejected`. Respond `200 { status:'salon_rejected' }`. (Customer may now escalate — Endpoint 4.)
  3. **approve:** compute `amount = approved_amount ?? (paid_amount - refunded_amount)` (full if null). Guard `amount <= remaining`.
     a. CAS to a checkpoint: `UPDATE … SET status='salon_approved', resolved_amount=$amount, salon_response, salon_responded_at=now() WHERE id=$id AND status='open'`. `rowCount=0` ⇒ 409.
     b. Generate `idempotency_key` (e.g. `dispute:${id}:refund:${amount}`), persist it.
     c. Call **`issueRefund({ source:'booking', id: bookingId, amount, actor:{role:'salon', userId}, idempotencyKey, reason:'requested_by_customer' })`** (SP-0). It performs the Stripe refund with `reverse_transfer:true` + the configurable `refund_application_fee` (D7) and updates `bookings.refunded_amount`/`payment_status` **atomically** (`UPDATE … WHERE refunded_amount = $stale`, §10b-11) — SP-3 does NOT touch those columns itself.
     d. On success: `UPDATE … SET status='refunded', stripe_refund_id=$rid WHERE id=$id AND status='salon_approved'`. `case_events`: `refund_issued`, `amount`. Respond `200 { status:'refunded', resolved_amount, stripe_refund_id }`.
     e. On `issueRefund` failure: leave status at `salon_approved` (checkpoint), return **502** with the Stripe message; a retry re-enters at step (b) with the SAME idempotency key (no double refund).
- **Status codes:** 200 · 400 (amount > remaining / missing reason) · 401 · 403 · 409 (stale status) · 502 (Stripe).

### Endpoint 4 — Customer escalate a rejected refund

- **METHOD / path:** `POST /api/bookings/[id]/escalate`  *(new, small)*
- **Authorized actor:** `customer` or `guest` (the original requester, via `resolveBookingActor`).
- **Request** (`customerEscalateSchema`): `{ note?: string (max 1000) }`
- **Logic:** CAS `UPDATE … SET status='escalated', escalated_at=now(), customer_response=$note WHERE id=$id AND direction='refund' AND status='salon_rejected'`. `rowCount=0` ⇒ 409 (can only escalate a salon-rejected case). `case_events`: `escalated`. Reuse Resend hook to notify admin. Respond `200 { status:'escalated' }`.
- **Status codes:** 200 · 401 · 403 · 409 · 500.

### Endpoint 5 — Admin final decision (refund direction)

- **METHOD / path:** `POST /api/admin/booking-disputes/[id]/action`  *(extend existing)*
- **Authorized actor:** `admin` (role check, as today).
- **Request** (extend `adminDisputeBookingActionSchema`, add `admin_approve`/`admin_reject`):
  ```ts
  { action: 'admin_approve' | 'admin_reject' | 'dismiss' | 'escalate' | 'warn_customer' | 'warn_salon',
    resolution_note?: string (max 500),
    refund_amount?: integer (Rappen) }   // for admin_approve; default = remaining refundable
  ```
- **Logic:**
  - **admin_approve:** allowed only from `status='escalated'`. Same approve machinery as Endpoint 3.3 but actor `admin`: checkpoint `admin_approved` (CAS `WHERE status='escalated'`), `idempotency_key`, call `issueRefund` (actor admin), advance to `refunded`, `case_events: refund_issued`. The existing inline `stripe.refunds.create` block is REMOVED in favor of this.
  - **admin_reject:** CAS `escalated → admin_rejected` (terminal-ish; a follow-up grace cron may move it to `closed`). `case_events: admin_rejected`.
  - **dismiss / escalate / warn_*:** keep the existing behaviors (075/current route), but each now writes a `case_events` row.
- **Status codes:** 200 · 400 · 401 · 403 · 409 (wrong source status) · 502 (Stripe).

### Endpoint 6 — Salon UPCHARGE request (salon → customer)

- **METHOD / path:** `POST /api/bookings/[id]/dispute`  *(re-point existing at `booking_disputes`)*
- **Authorized actor:** `salon` (owner). 403 otherwise.
- **Request** (`upchargeRequestSchema`, supersedes `priceAdjustmentSchema` usage): `{ requested_amount: integer (Rappen, >0), salon_reason: string (3..500) }`
- **Logic:**
  1. Load booking; must be `completed`; actor must own the salon.
  2. Cap: `requested_amount <= round(paid_amount * 0.5)` (the +50% rule, now in Rappen against `paid_amount`).
  3. `expires_at = now() + 48h` (the no-response **VOID** window — D8; NOT auto-approve).
  4. Insert `booking_disputes` with `direction='upcharge'`, `status='open'`, `requested_amount`, `salon_response = salon_reason` (or keep a dedicated field), `reported_id`/`reporter_id` per the salon/customer mapping. Partial unique index ⇒ one open upcharge per booking ⇒ `23505`/409.
  5. `case_events: created`. Reuse Resend to notify the customer.
- **Response:** `201 { case: { id, status:'open', requested_amount, expires_at } }`
- **Status codes:** 201 · 400 (over cap / not completed) · 401 · 403 · 409 · 500.

### Endpoint 7 — Customer respond to an upcharge (EXPLICIT approve / decline)

- **METHOD / path:** `PATCH /api/bookings/[id]/dispute`  *(re-point existing at `booking_disputes`)*
- **Authorized actor:** `customer` or `guest` (the booking's customer). 403 otherwise.
- **Request** (`upchargeRespondSchema`): `{ action: 'approve' | 'decline', customer_response?: string (max 500) }`
- **Logic (NO silent auto-approve — D8):**
  1. CAS-load: `.eq("booking_id", id).eq("direction","upcharge").eq("status","open")`. Also reject if `now() > expires_at` ⇒ treat as VOID (see step 4). `rowCount`/no-row ⇒ 409.
  2. **decline:** `UPDATE … SET status='void', customer_response, customer_responded_at=now() WHERE id=$id AND status='open'`. `case_events: voided` (`note='declined'`). Respond `200 { status:'void' }`. No money moves.
  3. **approve (pre-G2 behavior — see Out of scope):** `UPDATE … SET status='salon_approved', customer_response, customer_responded_at=now() WHERE id=$id AND status='open'`. **Do NOT charge yet** (no charge executor + SCA work deferred to G2). `case_events: customer_approved` (`note='charge deferred to G2'`). Respond `200 { status:'salon_approved', note:'charge pending payment system (G2)' }`.
     - **G2 behavior (specified, deferred):** on approve, generate `idempotency_key`, call the (future) on-session SCA charge executor `chargeUpcharge({ bookingId, amount, idempotencyKey })`, on success advance to `charged` + `case_events: upcharge_charged`; on SCA-required, return a client-action payload so the customer re-confirms in Stripe.
  4. **expired/no-response:** there is **no auto-approve cron** today (confirmed: no writer for 038's `auto_approve_at`, no cron). VOID is **lazy** — any read past `expires_at` returns `void` semantics, and an OPTIONAL housekeeping cron (Risks) may flip `open → void` for tidiness. Silence NEVER charges.
- **Status codes:** 200 · 400 · 401 · 403 · 409 (stale/expired) · 500. (502 only once the G2 charge path exists.)

### The status transition tables (CAS-guarded; the enum is shared, the edges are per-direction)

Every `UPDATE` carries `.eq("status", <FROM>)` (optimistic CAS). `rowCount = 0` ⇒ the row moved under us ⇒ **409**. Terminal states accept no outgoing edges.

**Refund direction (`direction='refund'`):**

| From | Event (actor) | To | Money | Endpoint |
|---|---|---|---|---|
| `open` | salon approve | `salon_approved` → `refunded` | `issueRefund` | 3 |
| `open` | salon reject | `salon_rejected` | none | 3 |
| `salon_rejected` | customer escalate | `escalated` | none | 4 |
| `salon_rejected` | (grace cron, optional) | `closed` | none | cron |
| `escalated` | admin approve | `admin_approved` → `refunded` | `issueRefund` | 5 |
| `escalated` | admin reject | `admin_rejected` | none | 5 |
| `salon_approved` | retry after Stripe fail | `refunded` | `issueRefund` (same idem key) | 3 |
| `admin_approved` | retry after Stripe fail | `refunded` | `issueRefund` (same idem key) | 5 |
| any non-terminal | admin dismiss | `closed` | none | 5 |
| `refunded` / `closed` / `admin_rejected` | — | (terminal) | — | — |

**Upcharge direction (`direction='upcharge'`):**

| From | Event (actor) | To | Money | Endpoint |
|---|---|---|---|---|
| `open` | customer approve (pre-G2) | `salon_approved` (charge deferred) | none yet | 7 |
| `open` | customer approve (G2) | `charged` | `chargeUpcharge` | 7 (G2) |
| `open` | customer decline | `void` | none | 7 |
| `open` | no-response past `expires_at` | `void` (lazy / optional cron) | none | 7 / cron |
| `salon_approved` (pre-G2) | G2 charge runs | `charged` | `chargeUpcharge` | G2 |
| `charged` / `void` | — | (terminal) | — | — |

### `reason_code → eligibility / fast_track / issue_type` map (Section 11, encoded)

| `reason_code` | `eligibility` | `fast_track_recommended` | `issue_type` (075 back-compat) |
|---|---|---|---|
| `salon_cancelled` | `eligible` | `true` | `no_show_by_salon` |
| `no_show_salon` | `eligible` | `true` | `no_show_by_salon` |
| `not_delivered` | `eligible` | `false` | `wrong_service` |
| `wrong_amount` | `eligible` | `true` | `overcharge` |
| `double_charge` | `eligible` | `true` | `overcharge` |
| `quality` | `discretionary` | `false` | `quality` |
| `other` | `not_eligible` (default) | `false` | `other` |

> `fast_track_recommended` and `eligibility` are **hints surfaced to the reviewer only** — no transition reads them to act automatically (Section 11 + review-first directive). "Customer cancellation within the policy window" (Section 11 ELIGIBLE #4) is **out of scope here** — it depends on the cancellation policy (tasks #16/#17) and is flagged, not built.

---

## Reuse + anti-duplication

- **EXTEND `booking_disputes`; do NOT create `refund_requests`** (D9 / §10b-1). Earlier draft Section 4c proposed `refund_requests` — that is SUPERSEDED. Both money directions live on this one table via the `direction` column.
- **Collapse the two customer intents into ONE entry point** (§10b-2): the existing `POST /api/bookings/[id]/report` becomes report-or-refund via `wants_refund` + `requested_amount`. No second "request refund" route/table.
- **Re-point the salon upcharge** (`/api/bookings/[id]/dispute`) from `price_disputes` (038) onto `booking_disputes` so admin/timeline/queue see ONE spine. `price_disputes` becomes dead for new writes; no new rows exist live (`cols: 0`), so there's nothing to migrate (SP-0 confirms).
- **ONE Stripe refund chokepoint** (§10b-3): every approval (salon Endpoint 3, admin Endpoint 5) calls `issueRefund` (SP-0). The inline `stripe.refunds.create` in `app/api/admin/booking-disputes/[id]/action/route.ts` (and the salon-only `app/api/bookings/[id]/refund/route.ts`) are migrated onto it by SP-0 BEFORE SP-3 adds its caller. SP-3 writes ZERO direct Stripe refund calls.
- **One authorization resolver** (§10b-7): `resolveBookingActor()` (SP-2) is the only authz path in all seven endpoints. No endpoint re-implements the guest-token / ownership / admin-role checks.
- **Reuse existing primitives:** `paymentLimiter`, `logAuditEvent`, `checkUserBanned`, `checkFeatureEnabled`, `validateBody`, the Resend notification hooks already in `report` + admin-action routes (§10b-9 — no parallel notifier). The walk-in ticket helper's retry-on-`23505` idempotency pattern (`lib/barber/walkin-ticket.ts`) is the model for handling the partial-unique-index collision.
- **`case_events` is the single timeline** for BOTH directions and is what SP-5's admin "what happened" view reads — SP-5 does not invent a second history store.

---

## Acceptance criteria

Testable against a dev DB after SP-0 + SP-2 land (or with `resolveBookingActor` stubbed for the logged-in path).

**Walk A — full refund happy path (open → review → approve → refund):**
1. Customer `POST /api/bookings/[id]/report` with `reason_code='no_show_salon'`, `wants_refund=true`, no amount → `201`, case `status='open'`, `eligibility='eligible'`, `fast_track_recommended=true`, one `case_events(created)` row.
2. Second identical `POST` → `409` (partial unique index).
3. Salon `PATCH … { action:'approve' }` (no `approved_amount`) → case goes `open → salon_approved → refunded`; `issueRefund` called ONCE with an idempotency key; `bookings.refunded_amount` increased by the full remaining (Rappen); `payment_status='refunded'`; `case_events` has `created` + `refund_issued`; response `200 { status:'refunded', stripe_refund_id }`.
4. Re-`PATCH` approve → `409` (status no longer `open`).

**Walk B — reject → escalate → admin (reject path):**
1. Customer creates a `reason_code='quality'` case → `eligibility='discretionary'`, `fast_track=false`.
2. Salon `PATCH { action:'reject', salon_response:'…' }` → `salon_rejected`; `case_events(salon_rejected)`.
3. Customer `POST /api/bookings/[id]/escalate` → `escalated`; `case_events(escalated)`. Escalating a non-rejected case → `409`.
4. Admin `POST /api/admin/booking-disputes/[id]/action { action:'admin_approve', refund_amount:<partial> }` → `escalated → admin_approved → refunded`; `issueRefund` called once (actor admin); partial `refunded_amount`; `payment_status='partially_refunded'`; `case_events(refund_issued)`.
5. Variant: admin `admin_reject` → `admin_rejected` (terminal), no money moved.

**Walk C — upcharge, explicit approve + void (D8):**
1. Salon `POST /api/bookings/[id]/dispute { requested_amount, salon_reason }` within +50% cap → `201`, `direction='upcharge'`, `status='open'`, `expires_at≈now+48h`. Over-cap amount → `400`.
2. Customer `PATCH … { action:'decline' }` → `void`, no money; `case_events(voided)`.
3. New upcharge, customer `PATCH { action:'approve' }` (pre-G2) → `salon_approved`, **no charge**, response notes "charge deferred to G2", `case_events(customer_approved)`.
4. No-response: a read after `expires_at` reflects VOID semantics; no charge ever occurs without an explicit approve.

**Cross-cutting:**
- Every mutation writes exactly one `case_events` row and one `logAuditEvent` entry.
- A guest (no session) can run Walk A steps 1, the escalate, and the upcharge response when authorized by the SP-2 token; the SAME endpoints return `401` with no token and `403` with a token for a different booking.
- All amounts in `requested_amount`/`resolved_amount`/`case_events.amount`/the `issueRefund` arg are integer Rappen; converting any of them to CHF happens only at the FE boundary (verified by reading the values back).
- Concurrent double-approve (two requests) results in exactly ONE `issueRefund` call and one `refunded` row (CAS + idempotency key).

---

## Risks + edge cases (Section 10)

- **Idempotency / double action (§10b-3, §10b-11, §10/Stripe).** Salon + admin can both try to approve; a double-click can fire twice. Mitigation: every approval persists an `idempotency_key` (unique partial index) BEFORE calling Stripe and passes it to `issueRefund`; CAS `.eq("status", expected)` means only the first transition wins; a retry after a Stripe failure re-enters with the same key (Stripe dedupes) and the same `salon_approved`/`admin_approved` checkpoint.
- **Concurrent salon + admin approve.** The status machine forbids it by construction: a refund is only admin-approvable from `escalated`, which is only reachable from `salon_rejected` — a salon-approved case is already `refunded`/terminal, so admin can't also approve it. The partial unique index + CAS close the residual race.
- **Atomic refund accounting (§10b-11).** SP-3 never read-modify-writes `bookings.refunded_amount`; `issueRefund` (SP-0) does the `UPDATE … WHERE refunded_amount = $stale` so two refunds against the same booking can't both think the full amount is available.
- **Units (§10b-5).** Confirmed live: `bookings.price_paid` is CHF (numeric) while the refund routes treat `paid_amount`/`refunded_amount` as integer cents, and `refund/route.ts:51` coalesces them — a real 100x bug. SP-3 reads `paid_amount`/`refunded_amount` (Rappen, added by SP-0), NEVER `price_paid`, for any math. All SP-3 amount columns are Rappen with `>= 0` CHECKs.
- **Stripe failure mid-approval.** Handled by the `salon_approved`/`admin_approved` checkpoint + same-key retry; the case never silently sits in a half-refunded state — it's either `salon_approved` (retryable) or `refunded`.
- **One-open-case race.** Two simultaneous creates → the partial unique index throws `23505` on the loser → 409 (mirrors the walk-in helper's `23505` handling).
- **No charge executor / no auto-approve cron for upcharges (§10b-8, confirmed in code).** 038 has `auto_approve_at` but NO writer and NO cron consumes it, so the "48h auto-approve" never fired. SP-3 makes the **no-response default VOID** explicit and **defers the upcharge charge to G2** (no on-session SCA charge built now). Optional housekeeping cron (with `CRON_SECRET`, GitHub Actions `cron-jobs.yml`) may flip expired `open` upcharges to `void`; it must NEVER approve/charge.
- **Guest authz holes (§10b-6/7).** Every endpoint routes through `resolveBookingActor`; guest is token-gated (hashed token → short-lived httpOnly cookie, never `reference_code` alone, uniform 404 on bad code/token). 075's `reporter_id NOT NULL` is dropped so guest rows are representable. RLS does not authorize guests (`auth.uid()` is null) — guest writes go via the service-role server route only.
- **`case_events` write failure after a money move.** Do not roll back the refund; log + rely on `logAuditEvent` as the redundant trail.
- **Rate-limit surface (§10b-12).** All money/lookup mutations use `paymentLimiter`, not the 30/min `generalLimiter`.
- **Notifications deferred.** Reuse existing Resend hooks; absence of email is a known UX gap (owner's later piece), flagged not solved.
- **PII / GDPR-DSG.** Guest `description`/`customer_response` may contain PII; retention/erasure NULLs `guest_*` on the booking (SP-1/SP-2) and should also redact free-text on closed cases (flag for the purge cron, not built here).
- **D7 platform fee on refund.** Driven by `issueRefund`'s configurable `refund_application_fee` (SP-0). SP-3 passes through the actor + reason; it does not decide the fee.
- **Cancellation-window refunds (Section 11 #4, §10b-12).** The highest-volume real case ties to the cancellation policy (tasks #16/#17). Out of scope for SP-3; the `reason_code` taxonomy leaves room (`other` / a future `customer_cancel_in_window`) but no policy logic is built.

---

## Front-end mockups needed (Section 12)

Per owner policy, ALL FE is competitor-informed mockups first, signed off before any real build (brief: `_design-system/AGENT_BRIEF_TEMPLATE.md`). SP-3 needs:

- **#5 Unified "Report a problem / Request a refund" entry** — one button → one form: reason picker (`reason_code`), optional "I want money back" toggle (`wants_refund`) + amount field (Rappen→CHF at the boundary). Drives Endpoint 1.
- **#6 Refund / appeal status + timeline view** (customer AND guest) — renders the case + `case_events` from Endpoint 2.
- **#7 Escalate-to-Solen affordance + its states** — the button shown only when `status='salon_rejected'`; drives Endpoint 4; shows `escalated` / `admin_*` states.
- **#10 Salon upcharge request form (salon side) + customer approve/decline screen** — Endpoints 6 + 7; the customer screen must make decline as prominent as approve (no dark-pattern) and state that no response = no charge (D8).

> (Section 12 #8 salon refund-REVIEW queue + #9 admin unified queue are SP-5's mockups, not SP-3's — listed here only to mark the boundary.)

---

## Out of scope for this SP

- **The actual upcharge CHARGE** (money-IN). No charge executor and no auto-approve cron exist today; building the on-session SCA charge is **deferred to G2**. SP-3 specifies the executor contract (`chargeUpcharge`) + the `salon_approved → charged` edge so G2 only wires the Stripe call. Pre-G2, an approved upcharge stops at `salon_approved` with money explicitly deferred.
- **`issueRefund` itself + the migration-history reconcile + the Rappen unit fix + reviving `booking_disputes` live** — all SP-0.
- **`resolveBookingActor`, guest token issue/lookup, `reference_code`, resend-link** — SP-2.
- **Nullable `user_id` + guest columns + guest RLS rewrite** — SP-1.
- **Salon refund-review queue UI + admin unified case queue** (Section 12 #8/#9) and turning `app/api/admin/disputes` into the unified list — **SP-5**.
- **Walk-in refunds** — DEFERRED (D10); they run off `barber_walkin_queue.payment_intent_id` and join the shared `issueRefund` only when D10 is reversed.
- **Cancellation-policy-driven refunds** (Section 11 ELIGIBLE #4) — tasks #16/#17.
- **Email/SMS notifications** beyond reusing existing Resend hooks (owner's later piece).
- **All real FE builds** — mockups only until sign-off.

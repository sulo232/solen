# SP-5 Review Interfaces

> Subplan of `_tasks/REFUND_APPEAL_PLAN.md` (Sections 8, 10, 11, 12). This SP builds **only the human review + tracking surfaces**: the salon-side refund/complaint review queue and the unified admin case queue searchable by order code. It does NOT move money (that is SP-3's `issueRefund` chokepoint), define the data model (SP-0/SP-3), or build customer/guest screens (Phase 4 / Section 12 #1–7, #10).

## Objective

Give a human the surfaces to **review and act on** every refund/complaint case, honoring the owner's review-first directive (Section 11): nothing auto-approves; a person confirms every refund/upcharge.

1. **Salon review queue** (salon dashboard): a salon owner sees the OPEN cases on their own salon's bookings, with the booking, the customer's `reason_code` + the SP-3 eligibility category, the `requested_amount`, and acts: **approve full / approve partial** (which calls SP-3's review action → `issueRefund`), or **reject + reason**. Today the salon can only post a free-text reply (`DisputeNotification.tsx` → `report` PATCH); there is no approve/partial/reject-with-amount action and no queue view. This SP adds the queue + the salon decision endpoint.
2. **Admin unified case queue** (extend the existing admin panel): one queue spanning `booking_disputes` in **both directions** (customer refund requests AND, post-SP-3, salon upcharges folded onto `booking_disputes`), **searchable by `reference_code`** (the human order number). Case detail shows the full `case_events` timeline ("what happened", with actor), and the final-decision actions (`admin_approved` / `admin_rejected`, plus force-refund via `issueRefund`).

Scope guardrail (Section 12): the **front-end is delivered as MOCKUPS** (Section 12 #8 salon review, #9 admin queue). This SP specifies the **backend endpoints + data contracts precisely** and **describes the screens to mock**; it does not build production visuals.

## Depends on

Hard dependencies — SP-5 cannot be built or tested before these land. Confirmed via live DB introspection 2026-06-01: `booking_disputes`, `price_disputes`, and `case_events` are ALL ABSENT in the live DB; `bookings` (35 cols) has none of `reference_code` / `access_token_hash` / `guest_*` / `paid_amount` / `refunded_amount`. So every column SP-5 reads below is created by SP-0/SP-3, not yet present.

- **SP-0 (foundation):** the single guarded forward migration that (a) creates `booking_disputes` for real (currently only the migration file `supabase/migrations/075_booking_disputes.sql` exists, never applied), (b) adds `bookings.reference_code` (unique human order number) + backfill, (c) creates the shared **`case_events`** child table (actor, action, note, timestamp) that powers the admin timeline, (d) the shared **`issueRefund`** chokepoint `lib/bookings/issue-refund.ts`, (e) the Rappen (integer cents) money unit lock. SP-5's admin "force refund" and salon "approve" both call `issueRefund`; SP-5 never calls Stripe directly.
- **SP-3 (adjustments core):** EXTEND `booking_disputes` (council D9 / §10b-1) with `requested_amount`, `resolved_amount` (Rappen), the customer-`escalated` status, the eligibility-category field, and the review-first state machine (`open → salon_reviewing → salon_approved|salon_rejected → escalated → admin_approved|admin_rejected → refunded|closed`, Section 4c). SP-3 also owns the per-transition CAS guards and the writer that appends to `case_events` on every state change. SP-5 **reads** `case_events`/status and **invokes** the SP-3 review actions; the canonical decision-writing logic lives in SP-3.
- **SP-2 (order numbers + guest access):** `reference_code` is the admin search key; SP-2 generates it on every booking (walk-in nanoid helper + collision retry + unique constraint). Admin search is meaningless without it populated.
- Existing (already shipped, reused as-is): `createServerSupabaseClient` + `createAdminSupabaseClient` (`lib/supabase.ts:70`), `adminLimiter` / `applyRateLimit` (`lib/ratelimit.ts`), `logAuditEvent` (`lib/audit.ts`), `validateBody` + Zod (`lib/validations.ts`), `DashboardLayout`, `DashStatusPill`, `formatCurrency`.

## Schema / DB changes (likely indexes only; search by reference_code)

SP-5 introduces **no new tables and no new columns** — all structure comes from SP-0/SP-3. SP-5 only adds the **indexes** that make the two query patterns (salon-scoped list, admin search-by-code) fast. Ship these inside SP-0's single guarded migration (council §10b-4: one forward-only migration, `IF NOT EXISTS` guards, no `db push`); they are listed here because SP-5 is the consumer that requires them.

```sql
-- Admin search-by-order-code: booking_disputes has no salon_id/reference_code of its own;
-- the code lives on bookings. Index the join key + the code itself.
CREATE INDEX IF NOT EXISTS idx_bookings_reference_code ON public.bookings (reference_code);
CREATE INDEX IF NOT EXISTS idx_booking_disputes_booking_id ON public.booking_disputes (booking_id);

-- Salon-scoped open-case list: filter by status, order by recency. salon_id is reached
-- via bookings.salon_id (salon owner → salons.owner_id), so the bookings index above
-- carries the salon scoping; this one keeps the status filter + ordering cheap.
CREATE INDEX IF NOT EXISTS idx_booking_disputes_status_created ON public.booking_disputes (status, created_at DESC);

-- case_events timeline fetch by case (defined in SP-0; restated as an SP-5 read requirement).
CREATE INDEX IF NOT EXISTS idx_case_events_dispute_created ON public.case_events (dispute_id, created_at);
```

Notes:
- No `salon_id` is denormalized onto `booking_disputes` — salon scoping stays through `bookings.salon_id → salons.owner_id` to avoid a second source of truth (the existing salon RLS policy `booking_disputes_select_salon` in 075 already joins this way). The salon-list endpoint uses the service-role client with an explicit owner filter (mirrors every `app/api/admin/*` route), so it does not rely on RLS.
- Admin search is an **exact-code lookup** (`reference_code = $1`, uppercased/trimmed), not a fuzzy text search — order codes are exact tokens (e.g. `SOL-7K2QX`). No trigram/`pg_trgm` index needed. Keep the uniform-404 / no-enumeration posture from council §10b-7 for bad codes on any guest-facing path; the admin path is role-gated so it may return a precise "not found".

## Backend changes (per endpoint: METHOD path, authorized actor, request, response)

Money convention: all amounts are **integer Rappen (cents)** end-to-end (council §10b-5). The FE converts CHF↔Rappen at its boundary only. This matches the already-shipped `adminDisputeBookingActionSchema.refund_amount` (`z.number().int().positive()`, `lib/validations.ts:565`).

### 1. Salon-scoped pending-case list (NEW)

- **GET `/api/dashboard/disputes`** — runtime `nodejs`.
- **Authorized actor:** authenticated **salon owner**. Pattern: `createServerSupabaseClient().auth.getSession()` → resolve the caller's salon(s) via `salons.owner_id = user.id`; reject (403) if the user owns no salon. Then query with `createAdminSupabaseClient()` (service role) filtered to those salon ids — same shape as every `app/api/admin/*` route, but gated on salon-ownership instead of `role='admin'`.
- **Request:** query params — `status` (optional; default = the open set `open,salon_reviewing,escalated`), `limit` (default 50, max 100), `cursor` (optional, `created_at` keyset). No body.
- **Response 200:**
  ```jsonc
  {
    "cases": [
      {
        "id": "uuid",                         // booking_disputes.id
        "booking_id": "uuid",
        "reference_code": "SOL-7K2QX",        // bookings.reference_code (the order number)
        "direction": "refund",                // 'refund' | 'upcharge' (derived: requested_amount sign / origin; SP-3 defines the discriminator)
        "reason_code": "service_quality",     // booking_disputes.issue_type (taxonomy: quality|no_show_by_salon|wrong_service|overcharge|other)
        "eligibility": "discretionary",       // SP-3 eligibility category: eligible_full | eligible_partial | discretionary | not_eligible
        "fast_track": false,                  // SP-3 "fast-track recommended" hint (a hint only; never auto-acts — Section 11)
        "requested_amount": 4500,             // Rappen; null = full refund of remaining
        "amount_paid": 9000,                  // bookings.paid_amount (Rappen) — the cap for partial
        "already_refunded": 0,                // bookings.refunded_amount (Rappen)
        "status": "open",
        "description": "…",                   // customer's complaint text
        "customer_name": "…",                 // guest_name or profile.display_name
        "created_at": "iso",
        "booking": { "starts_at": "iso", "service_name": "…" }
      }
    ],
    "next_cursor": "iso|null"
  }
  ```
- **Errors:** 401 no session; 403 caller owns no salon; 500 on query error (PostgREST message). Rate-limit with the dedicated money/lookup limiter from council §10b-12 (NOT the 30/min `generalLimiter`).

### 2. Salon decision on a case (NEW)

- **POST `/api/dashboard/disputes/[id]/action`** — runtime `nodejs`.
- **Authorized actor:** the **salon owner of the booking** behind this case. Verify ownership by fetching the case → `bookings.salon_id → salons.owner_id === user.id` (the exact join `report/route.ts:131-143` already uses for the PATCH-reply path; reuse it). 403 otherwise.
- **Request body** (new Zod `salonDisputeDecisionSchema` in `lib/validations.ts`):
  ```jsonc
  {
    "action": "approve_full" | "approve_partial" | "reject",
    "amount": 4500,           // Rappen; REQUIRED iff action==='approve_partial'; must be >0 and <= amount_paid - already_refunded
    "reason": "…"             // REQUIRED iff action==='reject' (min 10 chars, max 500); the customer-visible reason
  }
  ```
- **Behavior (thin wrapper over SP-3 — SP-5 does NOT re-implement decision logic):**
  - `approve_full` / `approve_partial` → call the **SP-3 salon-review action**, which (a) CAS-guards the transition `…→ salon_approved` (`.eq("status", expected)`), (b) calls `issueRefund({ source:'booking', id: booking_id, amount, actor:{type:'salon', id:user.id} })` with a Stripe idempotency key, (c) writes `resolved_amount`, (d) appends a `case_events` row. **Until appointment payments (G2) land, `issueRefund` is the stubbed/zeroed call** (master plan Section 6) — the status machine + timeline still exercise fully.
  - `reject` → SP-3 transition `…→ salon_rejected`, persist `salon_response`/reason, append `case_events`. The customer may then escalate (SP-3 `escalated`), which is what surfaces the case to the admin queue below.
- **Response 200:** `{ "case": { "id", "status", "resolved_amount" }, "message": "…" }`. **Errors:** 400 validation / missing `amount` on partial / amount exceeds refundable; 403 not owner; 404 case not found; 409 stale status (CAS guard lost the race — salon + admin both acted, council §10b-11); 500.
- `await logAuditEvent(req, user.id, \`salon_dispute_${action}\`, "booking_dispute", id, {...})` (same audit call shape as `booking-disputes/[id]/action/route.ts:154`).

### 3. Admin unified case queue + search-by-code (EXTEND existing endpoint)

- **GET `/api/admin/booking-disputes`** — **extend the existing route** at `app/api/admin/booking-disputes/route.ts` (do NOT add a parallel admin route). Today it `select('*')` of ALL `booking_disputes` with no filter/search.
- **Authorized actor:** **admin** — keep the existing inline gate verbatim (`getSession()` → `profiles.role !== 'admin'` → 403 → `createAdminSupabaseClient()`). This is the repeated app-wide pattern (39 `app/api/admin/*` routes); no shared helper exists, so match it, do not invent one.
- **Request (new query params, all optional, additive — existing no-arg call still returns everything):**
  - `code` — exact `reference_code` lookup (uppercased + trimmed server-side). When present, resolve `bookings.id` by `reference_code` then return that booking's case(s) (refund + upcharge directions).
  - `status` — filter (default: all).
  - `direction` — `refund | upcharge | all` (default all).
  - `limit` (default 50, max 100), `cursor` (`created_at` keyset).
- **Response 200 (superset of today's `{ disputes: [...] }`, key kept for back-compat):**
  ```jsonc
  {
    "disputes": [
      {
        "id": "uuid", "booking_id": "uuid",
        "reference_code": "SOL-7K2QX",
        "direction": "refund",
        "reason_code": "service_quality", "eligibility": "discretionary", "fast_track": false,
        "requested_amount": 4500, "resolved_amount": null,
        "amount_paid": 9000, "already_refunded": 0,
        "status": "escalated",
        "description": "…", "salon_response": "…",
        "reporter": { "display_name": "…" },          // existing join, kept
        "reported": { "display_name": "…" },           // existing join, kept (salon owner)
        "bookings": { "id":"uuid","starts_at":"iso","price_paid":0,"salon_id":"uuid","salons": { "name":"…","slug":"…" } }, // existing join shape, kept; add reference_code to the bookings select
        "created_at": "iso", "updated_at": "iso"
      }
    ],
    "next_cursor": "iso|null"
  }
  ```
  Add `reference_code` to the existing `bookings(...)` select string and the new top-level filters; preserve the current join aliases (`reporter:profiles!reporter_id`, `reported:profiles!reported_id`) so the existing panel keeps rendering.

### 4. Admin case detail + timeline (NEW)

- **GET `/api/admin/booking-disputes/[id]`** — runtime `nodejs`. (The `[id]` folder exists today with only `action/route.ts`; add a sibling `route.ts`.)
- **Authorized actor:** admin (same inline gate).
- **Request:** path `id` (the `booking_disputes.id`). No body.
- **Response 200:**
  ```jsonc
  {
    "case": { /* same enriched shape as a queue row above, plus salon_response, admin_response, resolved_by, resolved_at, mediation_started_at, mediation_deadline_at */ },
    "timeline": [                                  // from case_events, ascending — the "what happened"
      { "id":"uuid", "action":"opened", "actor_type":"customer", "actor_id":"uuid", "actor_name":"…", "note":"…", "at":"iso" },
      { "action":"salon_rejected", "actor_type":"salon", "note":"…", "at":"iso" },
      { "action":"escalated", "actor_type":"customer", "at":"iso" }
    ]
  }
  ```
  `actor_name` is resolved by the endpoint (join `profiles.display_name`, or `guest_name` when `actor_id` is null = guest). **Errors:** 401/403 gate; 404 if no case. `case_events` is read-only here; rows are written by SP-3 transitions, never by SP-5.

### 5. Admin final decision (EXTEND existing endpoint)

- **POST `/api/admin/booking-disputes/[id]/action`** — **extend the existing route** at `app/api/admin/booking-disputes/[id]/action/route.ts`. It already handles `dismiss | warn_customer | warn_salon | escalate | resolve_with_note | refund` and already calls `stripe.refunds.create` inline (lines 119-134).
- **Authorized actor:** admin (gate already present, unchanged).
- **Two required changes:**
  1. **Route the `refund` action through SP-0's `issueRefund` chokepoint** instead of the inline `stripe.refunds.create` + manual `bookings.refunded_amount` write (council §10b-3: ONE shared refund path; the inline call is exactly the duplication being removed). The existing cap check (`refund_amount > paid_amount - already_refunded → 400`) moves into / is duplicated by `issueRefund`. Keep `refund_amount` in Rappen (already validated as int). After `issueRefund`, set the case status via SP-3's terminal transition and append `case_events` (actor = admin).
  2. **Add `admin_approved` / `admin_rejected` to the final-decision set** (extend `adminDisputeBookingActionSchema.action` enum, `lib/validations.ts:563`). `admin_approved` = admin overrides a salon rejection and grants the refund (→ `issueRefund` + `refunded`); `admin_rejected` = admin upholds the rejection (→ `closed`, customer-visible `admin_response`). Both must (a) CAS-guard from `escalated` (`.eq("status","escalated")`, council §10b-11), (b) append a `case_events` row. The existing `escalate` / `warn_*` / `dismiss` branches stay as-is.
- **Request body:** existing `{ action, resolution_note?, refund_amount? }` + the two new enum values. For `admin_approved`, `refund_amount` (Rappen) optional → defaults to full remaining (same default as the current `refund` branch, line 113).
- **Response / errors:** unchanged shape (`{ message }`); add 409 on stale-status CAS loss. `logAuditEvent` already fires (line 154) with `booking_dispute_${action}` — covers the new actions automatically.

## Reuse + anti-duplication (extend BookingDisputePanel + admin endpoints)

The owner forbids parallel systems (master plan §10b-1; D9). Concrete reuse mandates:

- **Extend `components-legacy/admin/BookingDisputePanel.tsx`, do not build a new admin component.** It already renders the `booking_disputes` list and the full admin action set (dismiss / warn / escalate / refund) wired to `/api/admin/booking-disputes/[id]/action`. SP-5 adds to it: (a) a **search-by-`reference_code`** input that drives the `?code=` param; (b) a **`direction` filter** (refund / upcharge / all); (c) the new `requested_amount` / `eligibility` / `fast_track` fields in each row; (d) a **case-detail expansion** rendering the `case_events` **timeline** from endpoint #4; (e) the two new `admin_approved` / `admin_rejected` buttons. Its `refund_amount` is **already in cents** (`BookingDisputePanel.tsx:53`) — keep that; it now lands on `issueRefund`.
- **Fold the upcharge panel into the same queue.** `app/[locale]/dashboard/disputes/page.tsx` today shows TWO separate things: an inline `price_disputes` (upcharge) list (its own `/api/admin/disputes` fetch) AND `<BookingDisputePanel />` below it. Per council §10b-1, upcharges migrate onto `booking_disputes` in SP-3; SP-5's admin queue then spans BOTH directions in ONE list filtered by `direction`. The legacy inline `price_disputes` block + `/api/admin/disputes` route become redundant once SP-3's migration completes — flag for removal in SP-3, do not duplicate their logic in the new queue.
- **Extend the two existing admin endpoints** (`booking-disputes/route.ts`, `booking-disputes/[id]/action/route.ts`) rather than creating new ones — both already exist with the right auth gate and audit logging; SP-5 only adds params/actions.
- **Reuse the admin auth gate inline** (`getSession` → `profiles.role==='admin'` → `createAdminSupabaseClient`). It is repeated across ~39 admin routes with no shared helper; match the pattern, do not introduce a new abstraction in this SP.
- **Salon side: extend the salon dispute surface, do not fork it.** The salon already has `DisputeNotification.tsx` (free-text reply via `report` PATCH) embedded per-booking in `app/[locale]/dashboard/bookings/page.tsx:303`. SP-5 adds a **dedicated review queue page** (a new salon dashboard route) for the at-a-glance triage the owner wants; `DisputeNotification`'s reply affordance can stay for inline context, but the **approve/partial/reject decision** lives in the new salon endpoint #2, not duplicated into the per-booking widget.
- **Money: never call Stripe in an SP-5 file.** Both the salon "approve" and admin "force refund" go through SP-0's `lib/bookings/issue-refund.ts`. SP-5 removes the last inline `stripe.refunds.create` (in the admin action route) as part of this consolidation.
- **Timeline: read-only.** `case_events` is written only by SP-3 transition logic; SP-5's detail endpoint only SELECTs it. No duplicate event-writing in review endpoints.

## Acceptance criteria (testable)

1. **Salon sees only its own cases.** Seed two salons A and B, each with a booking that has an open `booking_disputes` row. As owner A, `GET /api/dashboard/disputes` returns ONLY salon A's case; salon B's case is absent. As a user who owns no salon → 403. As an admin who is not the owner → still 403 on this salon endpoint (admins use the admin queue, not this one).
2. **Salon decision drives the state machine + timeline.** `POST /api/dashboard/disputes/[id]/action` with `approve_partial` + `amount` < `amount_paid - already_refunded` → 200, case status → `salon_approved`, `resolved_amount` set, a new `case_events` row appended (actor_type `salon`), and `issueRefund` invoked once (stub/zero pre-G2). `approve_partial` without `amount`, or `amount` > refundable → 400. `reject` without `reason` → 400; with `reason` → status `salon_rejected` + customer-visible reason persisted.
3. **Admin search by order code returns the case + timeline.** `GET /api/admin/booking-disputes?code=SOL-7K2QX` returns exactly the case(s) for the booking whose `reference_code` is `SOL-7K2QX`, in BOTH directions if present (refund + upcharge), each enriched with `reference_code`, `reason_code`, `eligibility`, `requested_amount`. Case is uppercased/trimmed (`sol-7k2qx ` matches). A non-existent code → empty `disputes: []`. The legacy no-arg `GET /api/admin/booking-disputes` still returns all cases (back-compat preserved).
4. **Admin case detail shows the full timeline with actors.** `GET /api/admin/booking-disputes/[id]` returns `timeline[]` ascending from `case_events`, each entry with `action`, `actor_type`, resolved `actor_name` (display_name or guest_name), and `at`; the sequence reflects the real history (e.g. `opened` → `salon_rejected` → `escalated`).
5. **Admin final decision is review-first + single-path + race-safe.** `POST …/[id]/action` `admin_approved` on an `escalated` case → `issueRefund` called once (NOT a direct `stripe.refunds.create`), status → `refunded`, `case_events` appended (actor_type `admin`). `admin_rejected` → status `closed` + `admin_response` persisted. A second concurrent decision on the same case → 409 (CAS guard), no double-refund. `grep -R "stripe.refunds.create" app/api/admin/booking-disputes` returns nothing after this SP (the inline call is gone).
6. **No new admin component or parallel admin route.** The admin queue is the EXTENDED `BookingDisputePanel.tsx`; `git status` shows it modified, not a new `*Panel.tsx` added. No new file under `app/api/admin/` other than the case-detail `[id]/route.ts`.
7. **Nothing auto-acts.** No code path transitions to `*_approved` / `refunded` without an explicit human action call (salon endpoint #2 or admin endpoint #5). `fast_track` is present in payloads as a boolean hint only; grep shows no branch that auto-approves when `fast_track === true` (Section 11).

## Front-end mockups needed (Section 12 #8, #9)

Per the owner's mockups-only policy (Section 12) these ship as competitor-informed mockups in the Solen design system for sign-off BEFORE any real FE build. Use the brief template `_design-system/AGENT_BRIEF_TEMPLATE.md`; B&W Layer-1 chrome + Layer-3 semantic color where meaning demands it (status pills, eligibility). Do **not** build production visuals in this SP.

**Section 12 #8 — Salon dashboard: refund REVIEW queue + review detail.** Screens to mock:
- **Queue list:** open cases for the salon, one row each. Per row: customer name, `reference_code`, time/service of the booking, `reason_code`, **eligibility category badge** (eligible-full / eligible-partial / discretionary / not-eligible — Section 11 taxonomy), `requested_amount` (CHF), a `fast-track recommended` hint chip when set. Empty state. Filter chips by status (reuse the `bookings/page.tsx` chip pattern).
- **Review detail:** the customer's complaint text, the booking summary, amount paid vs already refunded, and the three actions — **Approve full**, **Approve partial** (amount input, capped at refundable), **Reject** (required reason textarea). Show the eligibility category prominently as the reviewer's guide; make explicit that fast-track is a hint, not an auto-action. A read-only mini-timeline of what's happened so far.

**Section 12 #9 — Admin: unified case queue (search by order code) + case detail with full timeline + actions.** Screens to mock:
- **Unified queue:** one list spanning BOTH directions (refund + upcharge), each row tagged with a **direction badge**. Prominent **search-by-order-code** field at the top. Filters: status, direction. Per row: `reference_code`, customer ↔ salon, `reason_code`, eligibility, `requested_amount` / `resolved_amount`, status pill. This is the extended `BookingDisputePanel` look.
- **Case detail:** the full **`case_events` timeline** ("what happened") as a vertical event log with actor + timestamp per entry; the booking + parties; salon's response; and the final-decision actions — **Approve (force refund via issueRefund)** with amount, **Reject/uphold**, plus the existing dismiss / warn-salon / warn-customer / escalate. Show the refund amount input in CHF (converts to Rappen at the boundary).

Reference for both: the existing `app/[locale]/dashboard/disputes/page.tsx` layout + `BookingDisputePanel.tsx` as the structural starting point (Fresha-bones / Solen-skin per the dual-axis rule).

## Out of scope for this SP

- **The data model + state machine + `case_events` writer** — owned by SP-0 (tables, `reference_code`, `case_events`, `issueRefund`) and SP-3 (extend `booking_disputes`, eligibility, transitions). SP-5 consumes them.
- **Actual money movement / Stripe wiring** — SP-5 calls `issueRefund`; the real charge/refund is the SP-0 chokepoint and only moves real money once appointment payments (G2) land. SP-5 is testable with the stubbed/zeroed call.
- **Customer/guest-facing screens** — the refund-request entry, status/timeline view, escalate affordance, guest lookup (Section 12 #1–7) and the salon upcharge REQUEST form + customer approve/decline (Section 12 #10) are Phase 4 / SP-3, not SP-5. SP-5 is review/track surfaces only.
- **Producing the mockups themselves** — this SP specifies the screens; the mockup build is the Phase 4/5 FE pass per Section 12.
- **Notifications** — review decisions reuse the existing Resend hooks (already present in `report`/`action` routes, council §10b-9); no new notification system, and the owner's email build is out of scope (Section 9).
- **Walk-in refunds** — deferred (D10); the admin queue covers `bookings`-direction cases only this pass.
- **Removing the legacy `price_disputes` panel + `/api/admin/disputes` route** — flagged here as redundant once SP-3 folds upcharges onto `booking_disputes`, but the actual deletion belongs to SP-3's migration cleanup, not SP-5.

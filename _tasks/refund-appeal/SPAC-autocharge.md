# SP-AC Auto-charge (cancellation / no-show)

> Subplan of `_tasks/REFUND_APPEAL_PLAN.md`. This is **Lane A** (Section 11): policy-automated charges, **no per-case human review**, because the customer **pre-agreed** to the salon's cancellation/no-show policy at booking. Distinct from Lane B (reviewed refunds = SP-3). Honors D11 (full prepay + SAVED card, SP-G2), D12 (auto-charge per preset policy), Section 10 binding fixes (esp. **10b#5 integer Rappen end-to-end**, **10b#3 idempotency + Connect + shared charge chokepoint**, **10b#12 dedicated money limiter + tie no-show/cancellation fees to tasks #16/#17**). **Money unit = integer Rappen (centimes) end-to-end**; CHF is converted only at the FE/settings boundary via `toRappen` (`lib/stripe.ts:25`). Layer 3 in the execution DAG (Section 14): depends on SP-G2 (saved card) + SP-0 (migration + unit lock + chokepoint pattern). **Backend + DB only; FE = mockups (Section 12).**

## Objective

Make the salon's **pre-agreed** cancellation and no-show policy move money automatically, off-session, against the SP-G2 saved card, in three moves:

1. **Settle the policy storage + dashboard surface (tasks #16/#17).** The canonical policy columns and a salon settings surface **already exist** (live `salons.cancellation_fee_type` / `cancellation_fee_value` / `free_cancel_hours` / `no_show_deposit_amount`; the `CancellationTab` in `app/[locale]/dashboard/settings/page.tsx:433`; the PATCH allowlist in `app/api/salons/[slug]/route.ts:109`). SP-AC **does not rebuild them** — it (a) adds the **one missing field**, an explicit `no_show_fee_value` + `no_show_fee_type` (today only a single `no_show_deposit_amount` numeric exists, and it is CHF-scaled, not a policy fee), (b) **retires the dead drifted second surface** (`payment_mode` / `deposit_percent` / `cancellation_hours` / `late_cancel_fee_percent` — columns that do **not** exist on the live table), and (c) adds Zod validation + the payment limiter to the PATCH that today passes raw.
2. **Disclose + persist acceptance at booking.** Snapshot the policy onto the booking at create time (`policy_accepted_at`, `policy_snapshot` jsonb) so a later auto-charge is provably what the customer agreed to. This is the legal spine of "no review needed."
3. **Build the charge executor** — a shared `chargeFee()` chokepoint (sibling to SP-0's `issueRefund`), called from (a) an **on-cancel hook** inside `app/api/bookings/[id]/cancel/route.ts` when a customer cancels INSIDE the window, and (b) a **no-show sweep cron** (`app/api/cron/charge-no-show/route.ts`, or fold into the existing `no-show` cron). Off-session charge of the saved card, Connect destination + application fee, deterministic idempotency key, **SCA `authentication_required` fallback** (mark `requires_action`, notify, do not silently retry).

### Verified live-DB + code state (project `tocfnsmxmdxkrcmjzzdw`, 2026-06-01) — drives every decision below

| Fact | Evidence | Consequence for SP-AC |
|---|---|---|
| Live `salons` policy cols = `cancellation_fee_type` (text, default `'free'`), `cancellation_fee_value` (numeric, 0), `free_cancel_hours` (int, 24), `cancellation_window_hours` (int, 24), `no_show_deposit_amount` (numeric, 20), `deposit_min/max` | `information_schema.columns` | The **canonical** policy set. SP-AC reads `cancellation_fee_type/value` + `free_cancel_hours`. Adds `no_show_fee_type/value`. Does NOT re-add what exists. |
| `cancellation_fee_type` has **no CHECK constraint** live | `pg_get_constraintdef` returned `[]` | Free text today; code uses `'free' \| 'flat' \| 'percentage'` (`settings/page.tsx:431`). SP-AC adds a guarded CHECK so the executor can trust the enum. |
| Live `salons` does **NOT** have `cancellation_hours`, `late_cancel_fee_percent`, `payment_mode`, `deposit_percent` | `information_schema.columns` (absent) | The `late-cancel` cron + the `PaymentMode` settings block + the PATCH allowlist all reference **dead** columns. Writes silently no-op / error. SP-AC retires this lane. |
| Live `bookings` has **NO** `stripe_customer_id`, `stripe_payment_method_id`, `stripe_setup_intent_id`, `paid_amount`, `refunded_amount` | columns query returned only `payment_intent_id, payment_status, platform_fee, price_paid, price_*, deposit_amount, ...` | The saved-card columns the off-session charge needs **do not exist live** — they arrive via **SP-G2** (booking-level save) confirmed by SP-0 §"Verified live-DB state". SP-AC **hard-depends** on SP-G2 landing them. |
| Live `bookings.price_paid` = `numeric` **NOT NULL** (CHF); `paid_amount` arrives INTEGER Rappen via SP-0 | SP-0 §B4 + columns query | The unit bug root. SP-AC's charge base = `toRappen(price_paid)` at the boundary OR the Rappen `paid_amount` once populated; **never** mixes them. |
| `app/api/cron/pre-charge/route.ts` already does the **exact off-session pattern** (`off_session:true, confirm:true`, `customer` + `payment_method`, `application_fee_amount` + `transfer_data.destination`) | file read | **Reuse this pattern verbatim** in `chargeFee()`. But it has the **CHF-as-Rappen bug** (`amount: booking.price_paid` line 52) — SP-0 §B4 fixes it; SP-AC's chokepoint must use Rappen from day one. |
| `pre-charge` reads `booking.stripe_customer_id` / `stripe_payment_method_id` (booking-level) | `pre-charge/route.ts:26,54-55` | Confirms the saved-card lives on the **booking** (written by webhook lines 248-251), not just `profiles`. SP-AC reads the same booking columns (post SP-G2). |
| `app/api/stripe/webhook/route.ts` writes `card_saved` + `stripe_setup_intent_id/customer_id/payment_method_id` on `setup_intent.succeeded` (lines 246-251) | grep | This is the SP-G2 save path SP-AC consumes. SP-AC does not build the save; it spends the saved card. |
| Webhook handles **no** `authentication_required` / `requires_action` anywhere | grep (zero hits) | SCA-fallback is a **net-new** behavior SP-AC must add (catch the off-session decline, set `requires_action`, leave a hook for re-auth). |
| `app/api/cron/no-show/route.ts` exists: marks `no_show`, **captures a held PI** (`pi.status==='requires_capture'` → `capture`), increments `profiles.no_show_count` | file read | **Model mismatch**: it assumes auth-and-hold (manual capture), but SP-G2/D11 is **full prepay + saved card** (off-session charge). It reads `booking.stripe_payment_intent_id` — a column that does **not exist** live (the col is `payment_intent_id`). SP-AC reworks the fee step to off-session `chargeFee`, keeps the status/no_show_count logic. |
| `app/api/cron/late-cancel/route.ts` exists: charges `late_cancel_fee_percent` by capturing a held PI, reads `salons.cancellation_hours/late_cancel_fee_percent/payment_mode` + `bookings.late_fee_charged` | file read | **All four columns are absent live** → this cron is a **dead no-op today** (its `.select` of nonexistent cols returns rows with nulls, `salon.payment_mode==='at_salon'` is null so it skips, or errors). SP-AC **supersedes it** with the on-cancel hook + canonical columns; flag late-cancel for retirement (do not run both). |
| `app/api/bookings/[id]/cancel/route.ts` already computes a **refund** via `calculateRefund` (`lib/cancellation-policy.ts`) using `salon.cancellation_fee_percent ?? 30` + `cancellation_window_hours ?? 24` | file read | **Two problems:** (1) it reads `cancellation_fee_percent` which is **absent live** (the live col is `cancellation_fee_value` + a `_type`); the `?? 30` masks the drift. (2) It only ever **refunds** (money out); it never **charges** a cancellation fee against a saved card. SP-AC adds the charge branch + switches to the canonical `_type/_value` policy read. |
| `lib/cancellation-policy.ts` `calculateRefund(paid, feePct, windowHrs, startsAt)` returns `{refundAmount, feeAmount, isWithinWindow}`, percentage-only, rounds in the paid unit | file read | Reuse the **window math** (`isWithinWindow`), but generalize fee computation to handle `flat` (CHF→Rappen) **and** `percentage`, in Rappen. Add a sibling `calculateCancellationFee()` (Rappen) rather than overloading the refund fn. |
| SP-0 ships `lib/bookings/issue-refund.ts` `issueRefund({db,source,id,amountCents,actor,reason})` + `lib/bookings/refund-config.ts` `getRefundConfig()` + the migration `supabase/migrations/20260601_refund_appeal_foundation.sql` + `case_events` table | `_tasks/refund-appeal/SP0-foundation.md` | SP-AC mirrors the chokepoint shape for **charges** (`lib/bookings/charge-fee.ts`), reuses `case_events` for the timeline, and **rides the SP-0 migration** for booking-level columns (adds its own to the same file, see Schema). |
| `lib/ratelimit.ts` has `paymentLimiter` (3/hour, line 35) | grep | Reuse for the policy-settings PATCH (money-adjacent) + any manual charge trigger. Crons are CRON_SECRET-gated, not rate-limited. |
| `.github/workflows/cron-jobs.yml` `every-30-min` pings `/api/cron/no-show` (+ late-cancel, sms-reminders) with `secrets.CRON_SECRET` | file read | The no-show sweep already runs every 30 min. SP-AC's no-show fee rides the **existing** `no-show` job (rework in place) — no new workflow entry needed unless a separate route is chosen. |

## Depends on

- **SP-G2 (full prepay + saved card) — HARD blocker.** The off-session charge needs `bookings.stripe_customer_id` + `stripe_payment_method_id` populated and `payment_status='card_saved'|'paid'`. These columns + the `setup_future_usage` save are SP-G2's. Until SP-G2 lands them, `chargeFee()` can be built + unit-tested against Stripe test mode with a manually-attached test PM, but the live cancel/no-show wiring is inert (no saved card to charge). Mirrors the master-plan Section 6 note: "the actual money movement only works once payments exist."
- **SP-0 (foundation) — HARD blocker.** Provides: the single guarded migration file SP-AC appends to, the integer-Rappen unit lock (incl. the `pre-charge` `toRappen` fix SP-AC's executor depends on for a correct `paid_amount`), `case_events` for the charge timeline, and the chokepoint convention (`lib/bookings/*`). SP-AC's `chargeFee()` is the **sibling** to `issueRefund()`.
- **Tasks #16 (walk-in cancel + refund per policy) and #17 (salon-set cancellation policy) in the live task list** — SP-AC implements the appointment side of #16's charge half + completes #17 (the settings surface largely exists; SP-AC hardens + extends it). Walk-in refunds themselves are **D10-deferred**; the shared `chargeFee()` reserves a `source:'walkin'` for later.
- External preconditions before live wiring: (a) Supabase **branch / backup** for the migration (per SP-0); (b) owner confirms the **default policy values** (window hours, cancellation fee, no-show fee) — these are salon-set, but the platform default matters for salons that never configure; (c) Swiss consumer-law note on max cancellation fee (Section 10 fairness; the executor caps at 100% of `paid_amount`).

## Schema / DB changes (policy settings columns/table; acceptance on booking; ride SP-0 migration)

**All DDL rides the ONE SP-0 migration file `supabase/migrations/20260601_refund_appeal_foundation.sql`** (forward-only, fully guarded, re-runnable — SP-0 §"Guards used"). SP-AC **appends a new clearly-commented section**; it does **not** create a second migration (one writer per migration, Section 14). All amount columns are **integer Rappen**; the legacy CHF `cancellation_fee_value` / `no_show_deposit_amount` stay as-is (read at the settings boundary, converted via `toRappen`).

```sql
-- ============================================================
-- SP-AC: cancellation / no-show auto-charge (appended to 20260601_refund_appeal_foundation)
-- ============================================================

-- 1. SALONS: complete the policy set. cancellation_* already exist live.
--    Add an explicit no-show FEE (distinct from the legacy no_show_deposit_amount,
--    which is a CHF deposit figure, not a structured policy fee).
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS no_show_fee_type  text;     -- 'free' | 'flat' | 'percentage'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS no_show_fee_value numeric DEFAULT 0;  -- CHF at the settings boundary

-- 2. Guard the policy-type enums so the executor can trust them (free text today).
DO $$ BEGIN
  ALTER TABLE public.salons DROP CONSTRAINT IF EXISTS salons_cancellation_fee_type_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.salons ADD CONSTRAINT salons_cancellation_fee_type_check
  CHECK (cancellation_fee_type IS NULL OR cancellation_fee_type IN ('free','flat','percentage'));
DO $$ BEGIN
  ALTER TABLE public.salons DROP CONSTRAINT IF EXISTS salons_no_show_fee_type_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.salons ADD CONSTRAINT salons_no_show_fee_type_check
  CHECK (no_show_fee_type IS NULL OR no_show_fee_type IN ('free','flat','percentage'));

-- 3. BOOKINGS: disclosure / acceptance of the policy at booking time (Section 11 spine).
--    policy_snapshot freezes the exact terms the customer agreed to (window + fee shape),
--    so a later auto-charge is provably consented — the legal basis for "no review".
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS policy_accepted_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS policy_snapshot    jsonb;
--   policy_snapshot shape (written at booking create, SP-G2/SP-1 owns the write site):
--   { "cancellation_fee_type": "...", "cancellation_fee_value": <num CHF>,
--     "free_cancel_hours": <int>, "no_show_fee_type": "...", "no_show_fee_value": <num CHF>,
--     "currency": "chf", "captured_at": "<iso>" }

-- 4. BOOKINGS: idempotency + auditability for the auto-charge.
--    fee_charge_status guards against double-charge across the on-cancel hook + cron.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_status text;  -- CHECK below
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charged_amount integer; -- Rappen actually charged
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_intent_id text;  -- Stripe PI id of the fee charge
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS fee_charge_kind text;       -- 'cancellation' | 'no_show'
DO $$ BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_fee_charge_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_fee_charge_status_check
  CHECK (fee_charge_status IS NULL OR fee_charge_status IN
    ('none','charged','requires_action','failed','waived'));
--   'requires_action' = SCA authentication_required on the off-session charge (re-auth hook).
```

**Notes:**
- **`case_events` is reused** (SP-0 ships it). The charge writes a `case_events` row with `actor:'system'|'salon'`, `action:'cancellation_fee_charged'|'no_show_fee_charged'`, `amount:<rappen>`. But `case_events.CONSTRAINT case_events_one_parent` requires exactly one of `booking_dispute_id` / `price_dispute_id`. A pure policy auto-charge has **no dispute parent**. **Decision (flagged for SP-0 merge):** relax the XOR to allow a **booking-only** event, i.e. add a nullable `booking_id` FK to `case_events` and change the CHECK to "at least one of {booking_dispute_id, price_dispute_id, booking_id}", OR keep `case_events` dispute-only and write Lane-A charges to the **`audit_log`** via `logAuditEvent` (`lib/audit.ts`) instead. **Recommendation: use `audit_log` for Lane A** (no dispute exists; auto-charges are not "cases"), and reserve `case_events` for Lane B reviewed flows. This avoids mutating SP-0's XOR. Surfaced here for the orchestrator to confirm (one writer owns `case_events`).
- **Why not retype `cancellation_fee_value` / `no_show_*` to Rappen integers?** Same reason SP-0 left `platform_fee` numeric: live rows + the settings UI already speak CHF there. SP-AC converts CHF→Rappen at the executor boundary (`toRappen`) and keeps the structured fee columns as the salon-facing CHF figures. The **charged** amount is persisted in Rappen (`fee_charged_amount`).

## Backend changes (per endpoint/cron/file: path, trigger, logic, off-session charge, idempotency, SCA fallback)

### B1. NEW shared charge chokepoint — `lib/bookings/charge-fee.ts` (sibling to SP-0's `issueRefund`)

The single place that talks to Stripe for an **off-session policy fee** and writes `fee_charge_*`. Mirrors `issueRefund`'s shape so the codebase has exactly one charge path and one refund path.

```ts
// lib/bookings/charge-fee.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export type FeeKind = "cancellation" | "no_show";
export type FeeSource = "booking" | "walkin"; // walkin reserved (D10); SP-AC implements 'booking'

export interface ChargeFeeArgs {
  db: SupabaseClient;        // ADMIN (service-role) client from the caller
  source: FeeSource;
  id: string;                // booking id
  amountCents: number;       // integer Rappen, > 0, already capped <= paid/price base
  kind: FeeKind;
  actor: "salon" | "system"; // 'system' = cron no-show / window expiry
  reason: string;            // audit / timeline text
}
export interface ChargeFeeResult {
  status: "charged" | "requires_action" | "failed";
  paymentIntentId?: string;
  chargedCents?: number;
  clientSecret?: string;     // present when requires_action (for the re-auth hook)
}
export async function chargeFee(args: ChargeFeeArgs): Promise<ChargeFeeResult>;
```

**Logic steps (`source='booking'`):**
1. **Validate** `amountCents` is an integer > 0 (`FeeError('INVALID_AMOUNT')`).
2. **Fetch booking** (admin client): `id, payment_intent_id, paid_amount, price_paid, fee_charge_status, stripe_customer_id, stripe_payment_method_id, salon_id, salons(stripe_account_id)`.
3. **Idempotency / status guard (CAS).** If `fee_charge_status IN ('charged','requires_action')` → return current state, no second charge. Otherwise stamp intent via a CAS update `… .eq('fee_charge_status', staleOrNull)` so the on-cancel hook and the cron can never both charge.
4. **Require a saved card** (`stripe_customer_id` + `stripe_payment_method_id`). If absent → `FeeError('NO_SAVED_CARD')` (SP-G2 not satisfied for this booking; log + skip, do not crash the cron loop).
5. **Resolve fee base in Rappen.** `base = paid_amount ?? toRappen(price_paid)`; **cap `amountCents <= base`** (never charge more than the customer paid/owes; fairness — Section 10). `application_fee_amount = Math.round(amountCents * PLATFORM_FEE_PERCENT)` (or read `platform_settings.commission` like pre-charge does, with the same fallback).
6. **Deterministic idempotency key:** `fee:${source}:${id}:${kind}:${amountCents}` — a retry (double cron tick, hook + cron race) collapses to one Stripe charge.
7. **Off-session charge (reuse the `pre-charge` pattern exactly):**
   ```ts
   const pi = await getStripe().paymentIntents.create({
     amount: amountCents,                 // Rappen
     currency: "chf",
     customer: stripeCustomerId,
     payment_method: stripePaymentMethodId,
     off_session: true,
     confirm: true,
     ...(stripeAccountId ? {
       application_fee_amount: applicationFeeRappen,
       transfer_data: { destination: stripeAccountId },  // Connect destination charge
     } : {}),
     metadata: { type: `${kind}_fee`, booking_id: id, actor: args.actor },
   }, { idempotencyKey });
   ```
8. **SCA fallback (net-new).** Wrap in try/catch. Stripe throws `StripeCardError` with `err.code === 'authentication_required'` (or `err.raw.payment_intent.status === 'requires_action'`) when the saved card needs SCA even off-session. On that branch:
   - Set `fee_charge_status='requires_action'`, persist `fee_charge_intent_id = err.raw.payment_intent.id`, `fee_charge_kind=kind`.
   - Return `{ status:'requires_action', paymentIntentId, clientSecret: err.raw.payment_intent.client_secret }`.
   - **Do not retry off-session.** The customer must re-authenticate on-session — leave the hook (an email/in-app "confirm this charge" link is the owner's notification piece, Section 9; SP-AC leaves the PI + client_secret + status so the FE/email can complete it later). Any other Stripe error → `fee_charge_status='failed'`, log `console.error("[charge-fee] …", err)`, return `{status:'failed'}` (cron continues to the next booking).
9. **On success:** `fee_charge_status='charged'`, `fee_charged_amount=amountCents`, `fee_charge_intent_id=pi.id`, `fee_charge_kind=kind` (CAS on the stamped intent row).
10. **Audit (not money):** the **caller** writes the audit/timeline row (`logAuditEvent` for Lane A per the `case_events` note above), passing the dispute-less booking context. Keeps the chokepoint single-responsibility, identical to how `issueRefund` leaves `case_events` to its caller.

### B2. On-cancel hook — `app/api/bookings/[id]/cancel/route.ts` (customer cancels INSIDE the window)

**Trigger:** existing customer-initiated POST cancel. **Today** the route only computes a **refund** (`calculateRefund`) and reads the **absent** `cancellation_fee_percent`. Changes:

- **Switch the policy read to the canonical live columns:** select `salons(owner_id, cancellation_fee_type, cancellation_fee_value, free_cancel_hours, no_show_fee_type, no_show_fee_value)` (drop the `cancellation_fee_percent` / `cancellation_window_hours` reads that mask drift).
- **Branch on who cancels** (unchanged): salon-owner cancel → full refund (Lane B fast-track, via SP-0 `issueRefund`, **not** this SP's concern beyond not breaking it). Customer cancel → compute the policy via a **new** `lib/cancellation-policy.ts` helper:
  ```ts
  // calculateCancellationFee(feeType, feeValueChf, freeCancelHours, paidCents, startsAt)
  //   → { feeCents: number; isWithinWindow: boolean }
  // free            → feeCents 0
  // outside window  → feeCents 0 (free cancellation honored)
  // inside window:
  //   flat        → toRappen(feeValueChf), capped at paidCents
  //   percentage  → round(paidCents * pct/100), capped at paidCents
  ```
  (Reuses the `isWithinWindow` time math already in `calculateRefund`; generalizes fee shape; **Rappen** throughout.)
- **If `feeCents > 0` AND the booking was prepaid with a saved card** → call `chargeFee({ db: admin, source:'booking', id, amountCents: feeCents, kind:'cancellation', actor:'system', reason:'customer cancellation inside policy window' })`. Use an **admin** client for the charge (RLS-free), keep the ownership check on the request client (mirror SP-0 §B2).
- **Order of operations:** set `status='cancelled'` + free the slot **first** (the cancellation is honored regardless of the charge), then attempt the fee charge; persist the `chargeFee` result. A charge that returns `requires_action`/`failed` does **not** roll back the cancellation (the appointment is still cancelled; the fee is pursued out-of-band). Surface `fee_charge_status` in the JSON response so the FE can show "a CHF X fee was charged" or "we'll confirm your fee charge".
- **Remove the refund-on-customer-cancel path's reliance on `cancellation_fee_percent`** but **do not** delete the existing salon-owner refund branch — it stays (and SP-3/SP-0 own the refund chokepoint migration). SP-AC's surgical change is: customer-inside-window now **charges a fee** instead of silently `feeAmount`-ing a refund that never moved money.

### B3. No-show sweep — rework `app/api/cron/no-show/route.ts` (salon marks / cron detects no-show)

**Trigger:** existing `every-30-min` GitHub Actions job (`cron-jobs.yml`), CRON_SECRET-gated. Keep the auth + the `no_show` status write + `profiles.no_show_count` increment. **Replace the fee step:**

- **Bug fix:** the route reads `booking.stripe_payment_intent_id` (a column that does **not exist** live; the column is `payment_intent_id`). Fix the select.
- **Replace the `requires_capture`/`capture` block** (which assumes auth-and-hold) with the **off-session** model: read the salon's `no_show_fee_type/value` + the booking's `policy_snapshot`, compute `feeCents = calculateNoShowFee(...)` (sibling helper; `flat`→`toRappen`, `percentage`→`round(base*pct/100)`, capped at `base`), and call `chargeFee({ …, kind:'no_show', actor:'system', reason:'salon-marked no-show' })`.
- **Idempotency:** the `fee_charge_status` CAS in `chargeFee` + the deterministic key prevent a double-charge if the sweep runs twice or the salon also marks no-show manually.
- **Manual no-show path:** if a salon can mark no-show from the dashboard (booking status PATCH), that path must call the **same** `chargeFee` (one executor). Verify the status-change endpoint (`app/api/bookings/[id]/status` or the barber/walk-in equivalent) and route its `no_show` transition through `chargeFee` too — flag if the manual path is out of SP-AC's file scope and lives in SP-5.
- **Decision: same cron vs new route.** Recommend **reworking the existing `no-show` cron in place** (it already runs every 30 min and owns the `no_show` transition) rather than a parallel `charge-no-show` route — avoids two jobs racing on the same bookings. If a separate route is preferred for separation of concerns, add it to the `every-30-min` job's `paths` list in `cron-jobs.yml` and have it select `status='no_show'` AND `fee_charge_status IS NULL`.

### B4. Retire the dead `late-cancel` lane — `app/api/cron/late-cancel/route.ts` + drift cleanup

- The `late-cancel` cron reads four **absent** live columns (`salons.cancellation_hours/late_cancel_fee_percent/payment_mode`, `bookings.late_fee_charged`) and the auth-and-hold capture model. It is a **dead no-op** today and **conflicts** with B2 (both would charge a late-cancellation fee). **Action:** the on-cancel hook (B2) supersedes it. Either (a) gut `late-cancel` to a `{ retired: true }` 410/no-op, or (b) remove it from the `every-30-min` `paths` in `cron-jobs.yml`. **Do not run B2 and `late-cancel` simultaneously.** (Code change is read-only-flagged here; the orchestrator/owner picks retire-vs-delete.)
- **Settings drift cleanup:** remove the dead `PaymentMode` block (`settings/page.tsx:680-857`, columns absent) OR re-point it at canonical columns — **flag as a separate FE task** (it's the `payment_mode/deposit_percent/cancellation_hours/late_cancel_fee_percent` surface). The PATCH allowlist (`app/api/salons/[slug]/route.ts:115`) should drop those four keys. SP-AC's settings work (B5) is the **canonical** `CancellationTab` + the new no-show fee; the deposit/payment-mode surface is out of this SP unless the orchestrator folds it in.

### B5. Harden the policy-settings PATCH (task #17 completion) — `app/api/salons/[slug]/route.ts`

- **Add the new fields to the allowlist:** `no_show_fee_type`, `no_show_fee_value` (lines 109-120). **Drop** the dead `payment_mode`, `deposit_percent`, `cancellation_hours`, `late_cancel_fee_percent` (per B4).
- **Add Zod validation.** Today the PATCH passes the raw allowlist straight to `admin.update` with **no schema**. Add a `salonPolicyUpdateSchema` to `lib/validations.ts` validating `cancellation_fee_type`/`no_show_fee_type` ∈ `{free,flat,percentage}`, `cancellation_fee_value`/`no_show_fee_value` ≥ 0 (and ≤ 100 when type is `percentage`), `free_cancel_hours` ∈ a sane range (1..168). Reuse the existing `validateBody` pattern (`lib/validations.ts`).
- **Add `paymentLimiter`** (`lib/ratelimit.ts:35`) to the PATCH — policy changes are money-adjacent; today it's unthrottled.
- **Settings surface (task #17):** the `CancellationTab` (`settings/page.tsx:433`) **already writes** `cancellation_fee_type/value` + `free_cancel_hours` correctly. SP-AC adds a **no-show fee** control to the same tab (mirror the fee-type cards + value input) wired to `no_show_fee_type/value`. **This is the FE = mockup deliverable (Section 12), not a real build in this SP** — see "Front-end mockups needed."

### B6. Disclosure write at booking create (acceptance persistence)

- The **write site** of `policy_accepted_at` + `policy_snapshot` is the booking-create path (`app/api/bookings/route.ts` POST, owned by SP-1/SP-G2 as the "one writer" of `bookings/route.ts` per Section 14). SP-AC **specifies the contract** (the jsonb shape in the Schema section) and **flags** that the create route must snapshot the salon's live policy + stamp `policy_accepted_at = now()` when the customer checks the disclosure box. SP-AC does **not** co-edit `bookings/route.ts` (one-writer rule). The executor (B1) reads `policy_snapshot` as the source of truth for the agreed terms; if absent (legacy bookings), it falls back to the salon's current policy and logs the fallback.

### B7. (no-op confirm) `lib/stripe.ts`, `lib/cancellation-policy.ts`

- `lib/stripe.ts`: reuse `getStripe()`, `toRappen()`, `PLATFORM_FEE_PERCENT`. No new client/converter.
- `lib/cancellation-policy.ts`: **extend** with `calculateCancellationFee()` + `calculateNoShowFee()` (Rappen, type-aware). **Keep** `calculateRefund` (still used by the salon-owner refund branch); do not overload it.

## Reuse + anti-duplication (pre-charge cron pattern, cancel route, tasks #16/#17)

- **`app/api/cron/pre-charge/route.ts`** — the off-session charge pattern (`off_session:true, confirm:true`, `customer`+`payment_method`, `application_fee_amount`+`transfer_data.destination`, commission read from `platform_settings` with fallback) is **copied into `chargeFee()` verbatim**. Do **not** write a second off-session pattern. (And inherit SP-0 §B4's `toRappen` fix so the base unit is correct.)
- **SP-0 `lib/bookings/issue-refund.ts`** — `chargeFee()` is its **structural sibling** (same args shape, admin-client, deterministic idempotency key, CAS status guard, Connect-aware, caller-writes-timeline). One refund path + one charge path, both in `lib/bookings/`.
- **`lib/cancellation-policy.ts`** — reuse the `isWithinWindow` time math; add the two fee calculators rather than a parallel module.
- **Existing `salons` policy columns + `CancellationTab` + PATCH allowlist** — task #17 is **~80% built**. SP-AC extends (no-show fee + validation + limiter), it does **not** rebuild the cancellation settings surface.
- **`app/api/cron/no-show/route.ts`** — reuse the no-show detection + status + `no_show_count` logic; replace only the fee mechanic (capture→off-session `chargeFee`).
- **`case_events` (SP-0)** vs **`audit_log` (`lib/audit.ts`)** — Lane A auto-charges have no dispute parent; **reuse `logAuditEvent`** rather than forcing a `case_events` XOR change (flagged for SP-0 owner). No new audit system.
- **`lib/ratelimit.ts` `paymentLimiter`** — reuse for the money-adjacent PATCH; do not invent a limiter (Section 10b#12).
- **`.github/workflows/cron-jobs.yml` `every-30-min`** — the no-show sweep rides the **existing** job; no new workflow entry. Retire `late-cancel` from its `paths` (B4) rather than adding a competing fee job.
- **Tasks #16/#17** — #17 (salon policy settings) completed by B5; #16's appointment charge half implemented by B2/B3 (`chargeFee`). Walk-in refund half of #16 is **D10-deferred**; `chargeFee` reserves `source:'walkin'`.

## Acceptance criteria (testable: cancel-inside-window charges the policy amount in Stripe test; no-show cron charges; disclosure stored)

**DB (after applying the SP-0 migration with the SP-AC section, on a branch):**
1. `SELECT column_name,data_type FROM information_schema.columns WHERE table_name='salons' AND column_name IN ('no_show_fee_type','no_show_fee_value');` → 2 rows.
2. `SELECT conname FROM pg_constraint WHERE conname IN ('salons_cancellation_fee_type_check','salons_no_show_fee_type_check','bookings_fee_charge_status_check');` → 3 rows.
3. `SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('policy_accepted_at','policy_snapshot','fee_charge_status','fee_charged_amount','fee_charge_intent_id','fee_charge_kind');` → 6 rows.
4. `INSERT INTO salons(... cancellation_fee_type) VALUES (...,'bogus')` → fails the CHECK; `'flat'` succeeds. Re-running the whole migration → no error (idempotent).

**Disclosure stored (B6 contract):**
5. Create a booking with the disclosure accepted → row has `policy_accepted_at` set and `policy_snapshot` jsonb containing the salon's `cancellation_fee_type/value`, `free_cancel_hours`, `no_show_fee_type/value`. (Asserted once SP-1/SP-G2 wires the write per the contract; SP-AC asserts the executor reads it.)

**Cancellation fee — cancel INSIDE window charges the policy amount (Stripe test mode):**
6. Salon policy `cancellation_fee_type='percentage'`, `cancellation_fee_value=50`, `free_cancel_hours=24`; booking `price_paid=80.00` CHF (→ base 8000 Rappen), saved test card attached, starts in 12h. Customer POSTs `/api/bookings/{id}/cancel` → a Stripe PaymentIntent is created with `amount=4000` (Rappen, CHF 40.00), `off_session:true, confirm:true`, `transfer_data.destination` = salon's `stripe_account_id`, `application_fee_amount=round(4000*0.01)=40`. Booking row: `status='cancelled'`, `fee_charge_status='charged'`, `fee_charged_amount=4000`, `fee_charge_kind='cancellation'`.
7. Same booking but starts in 48h (outside the 24h window) → cancel succeeds, **no** Stripe charge, `fee_charge_status` stays null/`'none'`.
8. `cancellation_fee_type='flat'`, `cancellation_fee_value=25` → charge `amount=2500`.
9. `cancellation_fee_type='free'` → cancel, no charge.
10. Fairness cap: `flat` value 200 CHF on an 80 CHF booking → charged amount capped at 8000 Rappen (never exceeds `paid`).

**No-show fee — cron charges (Stripe test mode):**
11. Booking ended >24h ago, `status='confirmed'`, saved card, salon `no_show_fee_type='flat'`, `no_show_fee_value=30`. GET `/api/cron/no-show` with the CRON_SECRET bearer → booking `status='no_show'`, a PI for `amount=3000` Rappen created off-session with Connect destination, `fee_charge_status='charged'`, `fee_charge_kind='no_show'`, `profiles.no_show_count` incremented.
12. Re-run the cron immediately → **no second charge** (the `fee_charge_status` CAS + idempotency key collapse it); `processed` does not re-charge.

**Idempotency / concurrency:**
13. Fire the on-cancel hook and the no-show cron against the same booking (race) → exactly one Stripe charge (deterministic key + CAS), one `fee_charge_intent_id` persisted.

**SCA fallback:**
14. Use a Stripe test PM that forces `authentication_required` off-session (`pm_card_authenticationRequiredOnSetup` flow) → `chargeFee` catches it, sets `fee_charge_status='requires_action'`, persists `fee_charge_intent_id` + returns a `clientSecret`; **no** exception bubbles to crash the cron; the booking is still cancelled/no_show.

**Drift / dead-lane:**
15. `late-cancel` is retired (route is a no-op/410 OR removed from `cron-jobs.yml` `every-30-min` `paths`); running it does not double-charge a booking already handled by B2.
16. `grep -rn "paymentIntents.create" lib/bookings/charge-fee.ts app/api/cron/pre-charge` — off-session policy charges go through `chargeFee` (no third ad-hoc off-session create in the cancel/no-show paths).

**Settings PATCH (task #17):**
17. PATCH `/api/salons/{slug}` with `no_show_fee_type='percentage', no_show_fee_value=120` → **400** (percentage > 100, Zod). With `=50` → 200, row updated. The dead keys (`payment_mode` etc.) are no longer accepted. Limiter returns 429 after the configured `paymentLimiter` budget.

## Risks + edge cases (cite Section 10: off-session SCA, units, idempotency; unfair-charge fairness)

- **Off-session SCA (Section 10 "Upcharge collection / SCA").** Even with `setup_future_usage`, a Swiss/EU card can demand SCA on an off-session charge → Stripe `authentication_required`. **Mitigation:** B1 step 8 catches it, parks the PI as `requires_action` with its `client_secret`, and leaves a re-auth hook (the customer confirms on-session via a notification link — owner's notification piece, Section 9). **Never** retry off-session (it will keep failing) and **never** crash the cron loop. Residual: until the customer re-auths, the fee is uncollected — acceptable for a policy fee; surfaced in the salon dashboard via `fee_charge_status`.
- **Unit mismatch (Section 10b#5, live bug).** `price_paid` is CHF; `paid_amount`/all SP-AC amount columns are Rappen; the salon's `cancellation_fee_value`/`no_show_fee_value` are CHF. **Mitigation:** every charge computes Rappen via `toRappen` at the boundary, persists `fee_charged_amount` in Rappen, and **never** sends a CHF number into Stripe's `amount` (the exact `pre-charge` bug SP-0 fixes). Acceptance #6/#8/#11 assert the Rappen values.
- **Idempotency / double-charge (Section 10b#3).** The on-cancel hook **and** the no-show cron **and** a manual salon no-show can all target one booking; a cron can double-tick. **Mitigation:** deterministic idempotency key `fee:booking:{id}:{kind}:{cents}` + a `fee_charge_status` CAS guard + select-where-`fee_charge_status IS NULL`. Acceptance #12/#13.
- **Connect / post-payout balance (Section 10 "Stripe Connect").** A destination charge with `application_fee_amount` assumes funds are available; for a fee charge (money IN) this is the normal happy path (unlike a refund), but if the salon account is restricted the charge can fail → `fee_charge_status='failed'`, logged, retried on the next cron tick (idempotency-safe). Flag: a no-show fee on a fully-prepaid booking is a **second** charge (the original prepay already paid the service); confirm the salon's intent is "service price was refunded/voided then a fee charged" vs "fee on top". **Open product question** — SP-AC charges the **policy fee as a standalone PI**; if the model is "keep part of the prepay as the fee," that's a capture/partial-refund of the original PI instead, which is the **deposit/auth-hold** model SP-AC explicitly moved away from. Surfaced for owner confirmation.
- **Unfair-charge fairness (Section 10 "Abuse both ways" + Section 11).** A salon could set a punitive fee or mark a false no-show. **Mitigations:** (1) hard cap at 100% of `paid_amount` (acceptance #10); (2) the charge is only justified because the customer **accepted `policy_snapshot`** at booking — if `policy_accepted_at` is null AND no snapshot, the executor should **decline to auto-charge** and route to Lane B review instead (no silent charge without proven consent); (3) full `audit_log` trail; (4) no-show is salon-asserted — flag that a customer dispute of a no-show fee falls to **Lane B** (SP-3 reviewed refund), i.e. the auto-charge is reversible via the refund chokepoint. This is the Lane A ↔ Lane B bridge.
- **Policy drift between booking and execution.** The salon may change its policy after the customer booked. **Mitigation:** the executor reads `policy_snapshot` (frozen at booking), **not** the salon's current settings, so the customer is charged what they agreed to. Legacy bookings without a snapshot → fall back to current policy + log (acceptance #5 covers the snapshot path).
- **`stripe_payment_intent_id` vs `payment_intent_id` (live drift).** The `no-show` + `late-cancel` crons read a column name that **does not exist** live. **Mitigation:** B3 fixes the select; B4 retires `late-cancel`. Without this fix the no-show charge silently never fires.
- **Two crons racing (`no-show` reworked + `late-cancel` legacy).** Both could fee the same booking. **Mitigation:** B4 retires `late-cancel`; the `fee_charge_status` CAS is the backstop even if both run.
- **`case_events` XOR (SP-0).** Lane A has no dispute parent → would violate `case_events_one_parent`. **Mitigation/flag:** use `audit_log` for Lane A (recommended), or have SP-0 relax the XOR to allow a booking-only event. One writer (SP-0 orchestrator) decides; do not mutate `case_events` from SP-AC.
- **SP-G2 not yet built.** All live wiring is **inert** until SP-G2 lands the saved-card columns + save flow. **Mitigation:** build + unit-test `chargeFee` against Stripe test mode with a manually-attached PM now; gate the cancel/no-show wiring behind `stripe_payment_method_id IS NOT NULL` (already step 4) so it degrades to a no-op (no crash) pre-G2. Log to `_tasks/INCOMPLETE_FEATURES.md` if shipped ahead of G2.

## Front-end mockups needed (Section 12; salon policy settings screen + booking disclosure)

Per owner policy (Section 12), all FE is delivered as competitor-informed mockups in the Solen design system (brief: `_design-system/AGENT_BRIEF_TEMPLATE.md`) before any real build. SP-AC touches two Section-12-adjacent surfaces (neither is explicitly numbered 1-10, so they are **new** mockups this SP introduces):

- **M-AC-1 · Salon cancellation + no-show policy settings (completes task #17).** Extend the existing `CancellationTab` (`app/[locale]/dashboard/settings/page.tsx:433`) with a **no-show fee** control mirroring the cancellation fee-type cards (free / flat CHF / percentage) + value input, plus the live customer-facing preview string ("No-show is charged CHF X / Y% of the booking"). Show the cancellation + no-show policy together as one coherent "Stornierung & No-Show" panel. Mockup must show: fee-type selection, value input, free-cancel window selector, and the customer preview. (The cancellation half already exists in code — the mockup is the **no-show addition + the combined layout**.)
- **M-AC-2 · Booking disclosure + acceptance (the consent that makes Lane A lawful).** A disclosure block in the booking/pay flow (sits alongside the SP-G2 payment step, e.g. near `components-legacy/booking/PayConfirmStep.tsx`) showing the salon's policy in plain language ("Free cancellation until 24h before. Cancel later and you'll be charged CHF X. No-show is charged CHF Y.") with an explicit **checkbox/affirmation** that drives `policy_accepted_at`. Mockup must show the disclosure copy, the affirmation control, and how it gates the "Pay & Book" CTA.
- **(Salon-facing read-out, optional)** A small `fee_charge_status` indicator on the salon's booking/queue detail ("Cancellation fee CHF X charged" / "Fee pending customer authentication"). Likely folds into the SP-5 salon dashboard surfaces — flag rather than a standalone mockup.

These are **mockups only**; the real `CancellationTab` extension + disclosure component build follow sign-off.

## Out of scope for this SP

- **SP-G2 itself** (the full-prepay charge at booking + the saved-card `setup_future_usage` flow + the `stripe_customer_id/payment_method_id` columns). SP-AC **consumes** the saved card; it does not build the save.
- **SP-0 itself** (the migration-history reconcile, the `pre-charge` `toRappen` fix, `issueRefund`, `case_events`). SP-AC appends DDL to SP-0's migration and mirrors its chokepoint, but does not own those.
- **Lane B reviewed refunds** (service-not-delivered, overcharge, quality, escalation, the unified report/refund entry) → **SP-3**. SP-AC only notes the Lane A↔B bridge (a disputed no-show fee is reversed via SP-3's refund).
- **Walk-in cancel/refund + no-show fees** (`barber_walkin_queue`) → **D10-deferred**; `chargeFee` reserves `source:'walkin'` but implements only `'booking'`. (Task #16's walk-in half stays open.)
- **The actual write of `policy_accepted_at` / `policy_snapshot` into `app/api/bookings/route.ts`** → owned by the SP-1/SP-G2 "one writer" of the create route; SP-AC specifies the contract only.
- **Notifications** (the "your card needs re-authentication" email/SMS, the "you were charged a fee" message) → owner's Resend piece (Section 9); SP-AC leaves the `requires_action` PI + `client_secret` + status hooks.
- **Retyping `cancellation_fee_value` / `no_show_*` / `platform_fee` numeric→integer** → separate risky migration (SP-0 made the same call for `platform_fee`); SP-AC converts at the boundary.
- **The deposit / `payment_mode` settings surface + the `late-cancel` cron deletion** → SP-AC **flags** them for retirement (B4) but the FE removal of the `PaymentMode` block + the final delete-vs-noop call are a separate cleanup task / orchestrator decision (one-writer on `settings/page.tsx` + `cron-jobs.yml`).
- **Admin/salon unified case tracking UI** → SP-5.
- **Building `salon_payouts` / `platform_settings` / `warnings`** (absent live, per SP-0) → not this slice; `chargeFee` reads `platform_settings` commission with the same safe fallback `pre-charge` uses.

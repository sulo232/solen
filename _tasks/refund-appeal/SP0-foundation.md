# SP-0 Foundation

> Subplan of `_tasks/REFUND_APPEAL_PLAN.md`. Honors Section 8 decisions (D7/D8/D9/D10 + review-first), Section 10 binding council fixes (esp. 10b #3/#4/#5 + 10a corrected facts), and Section 11 (review-first). All amount columns are **integer Rappen (centimes)**. This SP is **backend + DB only**; no front-end.

## Objective

Lay the money/data foundation every later SP depends on, in three moves:

1. **Reconcile the divergent migration lineage** (local files vs remote `schema_migrations` are different histories) and ship **ONE** new forward-only, fully guarded migration that carries the columns this feature needs (including the parts of 068 + 038 that never applied), extends `booking_disputes`, and adds the `case_events` timeline table. No `supabase db push` of the whole dir.
2. **Lock the money unit to integer Rappen end-to-end** and fix the two confirmed live unit bugs (`pre-charge` charging a CHF value as Rappen; `refund` coalescing CHF `price_paid` into an integer Rappen field).
3. **Extract one shared refund chokepoint** `lib/bookings/issue-refund.ts` and migrate the **two existing** Stripe-refund call sites onto it (idempotency key + Connect `reverse_transfer` + configurable `refund_application_fee` + atomic `refunded_amount` accounting + payout reconciliation). This is council fix 10b#3 — the single highest-leverage anti-duplication move, and the seam SP-3's appeal flow will call.

### Verified live-DB state (project `tocfnsmxmdxkrcmjzzdw`, 2026-06-01) — drives every decision below

| Fact | Evidence | Consequence for SP-0 |
|---|---|---|
| Local files `038`, `068_megabuild_foundation`, `075_booking_disputes` are **NOT** in remote `schema_migrations` | `list_migrations` shows `2026xxxxxxxxxx`-style versions, re-sequenced; `014_new_schema` is split into `new_schema_part1..5`; there is a *different* `075_booking_confirmation_mode_fix`. No `038/068/075_booking_disputes` rows. | History is divergent. We cannot replay the dir. Carry needed DDL into ONE new migration. |
| `price_disputes` ABSENT | `to_regclass('public.price_disputes')` = `null`; `col_count`=0 | 038 never applied. Out of scope to revive here (SP-3 owns the upcharge table per D9 = extend `booking_disputes`). SP-0 does **not** create it. |
| `booking_disputes` ABSENT | `to_regclass` = `null`; `col_count`=0 | The 075 spine never applied. SP-0 creates it (base 075 DDL) **then** extends it, both guarded, in the one migration. |
| `case_events` ABSENT | `to_regclass` = `null` | SP-0 creates it. |
| `salon_payouts` **ABSENT** | `to_regclass('public.salon_payouts')` = `null`; `col_count`=0 | The webhook `charge.refunded` handler and the plan's "payout reconciliation" reference a table that **does not exist live**. `issueRefund`'s payout step MUST be null/existence-safe (no throw when absent). SP-0 does **not** create it (out of scope; flagged). |
| `platform_settings` ABSENT | `to_regclass` = `null` | pre-charge + webhook read it via `.single()` and fall back to a default — safe. No SP-0 action. |
| `warnings` ABSENT | `to_regclass` = `null` | admin `warn_*` action writes a non-existent table. Pre-existing latent bug; **out of scope**, flagged. |
| `bookings.user_id` = **NOT NULL** | `information_schema.columns` `is_nullable='NO'` | Guest booking blocked at the column level. SP-0 makes it NULLABLE (the DDL); RLS rewrite + service-role insert is **SP-1**. |
| `bookings.paid_amount`, `refunded_amount` **ABSENT**; `guest_*`, `reference_code`, `access_token*` ABSENT | columns query returned only `paid_via, payment_intent_id, payment_status, platform_fee, price_paid, user_id` | 068's payment columns never landed. No live integer-vs-numeric *conflict yet* — they arrive as INTEGER via this migration. |
| `bookings.platform_fee` = **`numeric`** (default 0) | `information_schema.columns` | 068 wanted INTEGER; the column already exists as numeric (different lineage created it). We do **not** retype it in SP-0 (risky, and pre-charge writes to it). Flag as drift; `paid_amount`/`refunded_amount` come in clean as INTEGER. |
| `bookings.price_paid` = `numeric` NOT NULL | `information_schema.columns` | This is **CHF**, the root of the unit bug. Stays numeric/CHF; never coalesced into a Rappen field. |
| `bookings.payment_status` default `'none'`; existing CHECK lineage unknown | columns query | 068's CHECK enum never applied as-is. SP-0 re-applies the full enum CHECK guarded (drop-if-exists then add). |
| `bookings_insert_auth` = `WITH CHECK (auth.uid() = user_id)` | `pg_policy` dump | Confirms council 10b#6: nullable `user_id` alone does not enable guests. RLS rewrite deferred to SP-1. |
| `processed_webhook_events` PRESENT (2 cols), `feature_flags` PRESENT | `to_regclass` / `col_count` | Webhook idempotency intact. `feature_flags` exists so the 075 kill-switch `INSERT ... ON CONFLICT` is safe. |

## Depends on

- **Nothing.** SP-0 is the root. SP-1 (guest RLS + service-role insert), SP-2 (reference_code generation + hashed token resolve + central authz), SP-3 (extend-`booking_disputes` workflow + `case_events` writes + appeal caller of `issueRefund`), and SP-5 (review/admin UIs) all depend on SP-0.
- External preconditions to confirm before running the migration: (a) a Supabase **branch** or a fresh **backup/PITR checkpoint**; (b) owner sign-off on **D7** (does a refund also refund the Solen commission?) because it sets the *default* of the `refund_application_fee` config; the code is built configurable so the answer can flip without a code change.

## Schema / DB changes (exact DDL, guarded, centimes integers)

### Step A — reconcile history (commands, run by orchestrator, NOT in the SQL file)

The remote history is a re-sequenced subset; the local dir has ~150 files, many never applied and some non-idempotent. **Do not `supabase db push` the dir.** Instead:

```bash
# 1. See the divergence explicitly
supabase migration list            # local-vs-remote columns; the gap is large and expected

# 2. Mark the historical local files as already-applied so the CLI stops trying to replay them.
#    These are the lineage that diverged; the live schema already reflects an equivalent state.
#    Repair to the REMOTE timestamp versions actually present (from list_migrations), e.g.:
supabase migration repair --status applied 20260315215731   # new_schema_part1 (== local 014)
#    ...repeat for the set the CLI reports as remote-only, OR mark local-only legacy files reverted:
supabase migration repair --status reverted 038 068 075     # local files that never applied & are superseded
#    The exact repair list is produced by `migration list`; the rule is:
#      - remote-only version  -> repair --status applied <version>
#      - local-only legacy file we are NOT shipping -> repair --status reverted <localname>
#    GOAL: `supabase migration list` shows local and remote converged EXCEPT our single new file.

# 3. Apply ONLY the new file, on a branch / against a backup:
supabase db push --include-all=false   # pushes only un-applied; our one new migration
#   (or apply via the dashboard SQL editor against a branch, then repair --status applied for it)
```

> The new migration is written to be **idempotent and re-runnable** so that even if the repair classification is imperfect, applying it twice is a no-op. That is the safety net; repair is the cleanup.

### Step B — the ONE new migration

**File:** `supabase/migrations/20260601_refund_appeal_foundation.sql` (single forward-only migration; timestamp prefix matches the remote convention).

```sql
-- ============================================================
-- 20260601_refund_appeal_foundation
-- Refund/appeal foundation. Forward-only, fully guarded, re-runnable.
-- Carries the 068 payment columns + 038-derived fixes that never applied,
-- creates + extends booking_disputes, adds case_events timeline.
-- MONEY UNIT: all *_amount columns added here are INTEGER Rappen (centimes).
-- ============================================================

-- ------------------------------------------------------------
-- 1. BOOKINGS: guest fields + reference + token + money columns
-- ------------------------------------------------------------

-- 1a. user_id NULLABLE (guest bookings have no auth user).
--     Guarded: dropping NOT NULL is idempotent (no-op if already nullable).
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 1b. Guest contact fields (nullable text).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_name  text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_phone text;

-- 1c. Human order/confirmation number. Unique. Generated in app (SP-2).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reference_code text;

-- 1d. Guest access token — store ONLY the SHA-256 hash (council 10b#7).
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS access_token_hash       text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS access_token_expires_at timestamptz;

-- 1e. Money columns from 068 that never applied. INTEGER Rappen.
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_amount     integer;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS refunded_amount integer NOT NULL DEFAULT 0;
-- NOTE: platform_fee already exists live as NUMERIC (divergent lineage). We deliberately
-- do NOT retype it here (pre-charge writes it; retype is a separate, risky migration).
-- Flagged in "Risks". New code treats platform_fee as Rappen going forward.

-- 1f. payment_status full enum CHECK (068's enum never applied as-is). Guarded re-add.
DO $$ BEGIN
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_payment_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN (
    'pending','card_saved','deposit_held','paid','none','refunded','partially_refunded','disputed'
  ));

-- 1g. Unique reference_code (partial: only when present, so existing NULLs don't collide).
CREATE UNIQUE INDEX IF NOT EXISTS bookings_reference_code_key
  ON public.bookings (reference_code) WHERE reference_code IS NOT NULL;

-- 1h. Lookup index for token-gated guest access (by hash).
CREATE INDEX IF NOT EXISTS bookings_access_token_hash_idx
  ON public.bookings (access_token_hash) WHERE access_token_hash IS NOT NULL;

-- ------------------------------------------------------------
-- 2. BOOKING_DISPUTES: create-if-absent (base 075), THEN extend.
--    Live DB lacks this table (075 never applied). Both steps guarded.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.booking_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,        -- NULLABLE for guests (was NOT NULL in 075)
  reported_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,        -- NULLABLE: guest complaints may not name a user
  issue_type text NOT NULL CHECK (issue_type IN ('quality','no_show_by_salon','wrong_service','overcharge','other')),
  description text NOT NULL CHECK (char_length(description) >= 20 AND char_length(description) <= 1000),
  status text NOT NULL DEFAULT 'open',                                  -- CHECK added below (extended enum)
  salon_response text CHECK (salon_response IS NULL OR char_length(salon_response) <= 1000),
  salon_responded_at timestamptz,
  resolution text CHECK (resolution IS NULL OR char_length(resolution) <= 500),
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  mediation_started_at timestamptz,
  mediation_deadline_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT one_complaint_per_booking UNIQUE (booking_id)
);

ALTER TABLE public.booking_disputes ENABLE ROW LEVEL SECURITY;

-- 2a. EXTEND columns (council 10b#1: extend, do NOT create refund_requests).
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS requested_amount integer; -- Rappen, NULL = full refund
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS resolved_amount  integer; -- Rappen actually refunded
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_name  text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_email text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS guest_phone text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS stripe_refund_id text;
ALTER TABLE public.booking_disputes ADD COLUMN IF NOT EXISTS expires_at timestamptz;   -- review SLA / lifecycle (see reconcile note)

-- 2b. Reconcile the status enum: base 075 had open/in_review/resolved/escalated.
--     Add the customer-side 'escalated' (already present) + review-first states.
--     Council Section 11 workflow: open -> salon review -> (resolved | rejected) -> escalated -> (admin resolved/rejected).
DO $$ BEGIN
  ALTER TABLE public.booking_disputes DROP CONSTRAINT IF EXISTS booking_disputes_status_check;
EXCEPTION WHEN undefined_object THEN NULL; END $$;
ALTER TABLE public.booking_disputes ADD CONSTRAINT booking_disputes_status_check
  CHECK (status IN (
    'open',            -- filed, awaiting salon
    'in_review',       -- salon looking
    'salon_rejected',  -- salon declined (customer may escalate)
    'escalated',       -- customer escalated to Solen admin
    'resolved',        -- closed: refunded or accepted resolution
    'rejected'         -- terminal admin rejection
  ));

-- 2c. expires_at vs auto_approve_at reconcile (council Section 10a / 10b#11):
--     038's price_disputes used auto_approve_at (48h silent auto-approve) — that flow is VOID-on-silence now (D8).
--     booking_disputes never had auto_approve_at; we use expires_at purely as a review-SLA marker (no auto money move).
--     No auto_approve_at column is added anywhere in this feature. Documented so SP-3 does not reintroduce it.

-- 2d. Partial unique: at most ONE open/in-flight case per booking (council 10b#11).
--     Terminal states (resolved/rejected) excluded so a booking can have a new case after closure.
CREATE UNIQUE INDEX IF NOT EXISTS booking_disputes_one_open_per_booking
  ON public.booking_disputes (booking_id)
  WHERE status IN ('open','in_review','salon_rejected','escalated');

-- 2e. updated_at trigger (reuse the canonical helper from migration 014).
DROP TRIGGER IF EXISTS booking_disputes_updated_at ON public.booking_disputes;
CREATE TRIGGER booking_disputes_updated_at
  BEFORE UPDATE ON public.booking_disputes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 2f. RLS (base 075 policies, recreated idempotently). Guest authz is APP-LAYER (token), never RLS.
DROP POLICY IF EXISTS "booking_disputes_select_reporter" ON public.booking_disputes;
CREATE POLICY "booking_disputes_select_reporter" ON public.booking_disputes
  FOR SELECT USING (reporter_id = auth.uid());
DROP POLICY IF EXISTS "booking_disputes_select_salon" ON public.booking_disputes;
CREATE POLICY "booking_disputes_select_salon" ON public.booking_disputes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.salons s ON s.id = b.salon_id
    WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "booking_disputes_update_salon" ON public.booking_disputes;
CREATE POLICY "booking_disputes_update_salon" ON public.booking_disputes
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.bookings b JOIN public.salons s ON s.id = b.salon_id
    WHERE b.id = booking_disputes.booking_id AND s.owner_id = auth.uid()));
DROP POLICY IF EXISTS "booking_disputes_admin_all" ON public.booking_disputes;
CREATE POLICY "booking_disputes_admin_all" ON public.booking_disputes
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- NOTE: no anon/guest RLS policy by design. Guest reads/writes go through a service-role,
-- token-gated server route (SP-2's resolveBookingActor), never the anon key.

-- 2g. Kill-switch feature flag (feature_flags exists live). Safe upsert.
INSERT INTO public.feature_flags (key, enabled, description, updated_by)
VALUES ('dispute_reporting', true, 'Customer-initiated dispute / refund-appeal system', 'migration')
ON CONFLICT (key) DO NOTHING;

-- ------------------------------------------------------------
-- 3. CASE_EVENTS: shared timeline for the "what happened" view.
--    Two nullable FKs + XOR CHECK (council 10b#11).
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.case_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_dispute_id uuid REFERENCES public.booking_disputes(id) ON DELETE CASCADE,
  price_dispute_id   uuid,   -- FK omitted: price_disputes is ABSENT live; add FK in SP-3 if/when revived
  actor   text NOT NULL,     -- 'customer' | 'guest' | 'salon' | 'admin' | 'system'
  action  text NOT NULL,     -- 'created' | 'salon_approved' | 'salon_rejected' | 'escalated' | 'admin_approved' | 'admin_rejected' | 'refunded' | 'note'
  note    text CHECK (note IS NULL OR char_length(note) <= 1000),
  amount  integer,           -- Rappen, when the event moved money (nullable)
  created_at timestamptz DEFAULT now(),
  -- XOR: exactly one parent case must be set.
  CONSTRAINT case_events_one_parent CHECK (
    (booking_dispute_id IS NOT NULL)::int + (price_dispute_id IS NOT NULL)::int = 1
  )
);

CREATE INDEX IF NOT EXISTS case_events_booking_dispute_idx ON public.case_events (booking_dispute_id);
CREATE INDEX IF NOT EXISTS case_events_price_dispute_idx   ON public.case_events (price_dispute_id);

ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

-- RLS: readable by the salon owner / reporter of the parent dispute, and admins.
DROP POLICY IF EXISTS "case_events_select_party" ON public.case_events;
CREATE POLICY "case_events_select_party" ON public.case_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.booking_disputes d
      JOIN public.bookings b ON b.id = d.booking_id
      LEFT JOIN public.salons s ON s.id = b.salon_id
      WHERE d.id = case_events.booking_dispute_id
        AND (d.reporter_id = auth.uid() OR s.owner_id = auth.uid())
    )
  );
DROP POLICY IF EXISTS "case_events_admin_all" ON public.case_events;
CREATE POLICY "case_events_admin_all" ON public.case_events
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
-- Writes happen via service-role server routes (so guest/system events are insertable); no public INSERT policy.
```

**Guards used (council 10b#4):** `ALTER COLUMN ... DROP NOT NULL` (idempotent), `ADD COLUMN IF NOT EXISTS`, `DROP CONSTRAINT IF EXISTS ... ADD CONSTRAINT`, `CREATE TABLE IF NOT EXISTS`, `CREATE [UNIQUE] INDEX IF NOT EXISTS`, `DROP POLICY IF EXISTS ... CREATE POLICY`, `DROP TRIGGER IF EXISTS ... CREATE TRIGGER`, `INSERT ... ON CONFLICT DO NOTHING`. The whole file is re-runnable.

## Backend changes (per file: exact path + change; per function: signature, logic steps)

### B1. NEW shared chokepoint — `lib/bookings/issue-refund.ts`

The single place that talks to Stripe `refunds.create` and writes `refunded_amount`. (`lib/bookings/` does not exist yet — create the dir.)

```ts
// lib/bookings/issue-refund.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";

export type RefundSource = "booking" | "walkin"; // walkin is wired in D10/later; SP-0 implements 'booking'

export interface IssueRefundArgs {
  db: SupabaseClient;          // pass an ADMIN client (service role) from the caller
  source: RefundSource;
  id: string;                  // booking id (source='booking')
  amountCents: number;         // integer Rappen to refund; must be > 0 and <= remaining
  actor: "salon" | "admin" | "customer" | "system";
  reason: string;              // free text for the case timeline / audit
  refundApplicationFee?: boolean; // D7 config; default resolved from getRefundConfig() if omitted
}

export interface IssueRefundResult {
  refundId: string;
  totalRefundedCents: number;
  paymentStatus: "refunded" | "partially_refunded";
}

export async function issueRefund(args: IssueRefundArgs): Promise<IssueRefundResult>;
```

**Logic steps (`source='booking'`):**

1. **Validate input.** `amountCents` is an integer > 0. Throw `RefundError('INVALID_AMOUNT')` otherwise.
2. **Fetch booking** (admin client): `id, payment_intent_id, paid_amount, refunded_amount, salon_id, salons(stripe_account_id)`. 404-equivalent throw if missing.
3. **Compute remaining** in Rappen: `remaining = (paid_amount ?? 0) - (refunded_amount ?? 0)`. **Never** fall back to `price_paid` (that is CHF — this is the bug being killed). If `paid_amount` is null/0 -> throw `RefundError('NO_PAID_AMOUNT')` (cannot refund what we have no integer record of). Guard `amountCents <= remaining` else `RefundError('EXCEEDS_REMAINING')`.
4. **Require `payment_intent_id`** else `RefundError('NO_PAYMENT')`.
5. **Resolve fee policy:** `const appFee = args.refundApplicationFee ?? (await getRefundConfig()).refundApplicationFeeDefault;` (D7). See B5.
6. **Build idempotency key:** `refund:${source}:${id}:${currentRefundedCents}:${amountCents}` — deterministic per (booking, prior-refunded-total, amount), so a double-click or Stripe retry collapses to one refund. Pass as `{ idempotencyKey }` second arg to `refunds.create`.
7. **Stripe call:**
   ```ts
   const refund = await getStripe().refunds.create({
     payment_intent: pi,
     amount: amountCents,                 // Rappen — Stripe's smallest unit for CHF
     reason: "requested_by_customer",
     reverse_transfer: !!stripeAccountId, // Connect: claw back from the salon's transferred funds (council 10b#3)
     refund_application_fee: appFee,      // D7-driven
   }, { idempotencyKey });
   ```
   Only set `reverse_transfer`/`refund_application_fee` when the booking was a Connect destination charge (`stripeAccountId` present). For non-Connect, omit both.
8. **Atomic accounting (council 10b#11)** — compare-and-set, NOT read-modify-write (salon + admin can both act):
   ```ts
   const staleRefunded = refunded_amount ?? 0;
   const newTotal = staleRefunded + amountCents;
   const isFull = newTotal >= paid_amount;
   const { data, error } = await db.from("bookings")
     .update({ refunded_amount: newTotal,
               payment_status: isFull ? "refunded" : "partially_refunded" })
     .eq("id", id)
     .eq("refunded_amount", staleRefunded)   // CAS guard — rejects if another actor moved it
     .select("id").single();
   ```
   If the CAS update matches 0 rows -> a concurrent refund already advanced the total. Because the Stripe idempotency key is keyed on the same `staleRefunded`, the Stripe side also collapsed; re-read and return the current state rather than double-counting. (Throw `RefundError('CONCURRENT_RETRY')` only if state is inconsistent.)
9. **Payout reconciliation — existence-guarded.** `salon_payouts` is **ABSENT in the live DB** (verified). Wrap in a table-exists / error-tolerant block: attempt to fetch the payout by `stripe_payment_intent_id` and decrement gross/commission/net; if the table is missing or no row, **log and continue** (do not throw). Mirrors the webhook `charge.refunded` math but is null-safe. This keeps SP-0 correct today and self-healing if `salon_payouts` is created later.
10. **Return** `{ refundId: refund.id, totalRefundedCents: newTotal, paymentStatus }`.

**Note on case_events / audit:** `issueRefund` does the money + booking row only. The **caller** writes `case_events` (it knows the dispute id) and the audit log. This keeps the chokepoint single-responsibility.

### B2. Rewrite `app/api/bookings/[id]/refund/route.ts` (salon-triggered) to call `issueRefund`

- **Keep** auth (salon-owner check), `checkUserBanned`, validation via `bookingRefundSchema` (already integer cents — `z.number().int().min(0).max(100000)`).
- **Swap limiter:** `generalLimiter` -> `paymentLimiter` (council 10b#12 — money surface gets the dedicated 3/hour limiter, line 5/25 import + use).
- **Delete** lines 51-86 (the manual `paidAmount = booking.paid_amount ?? booking.price_paid ?? 0` coalesce **[the bug, line 51]**, the direct `getStripe().refunds.create`, and the manual booking update).
- **Replace with:**
  ```ts
  const admin = createAdminSupabaseClient();
  try {
    const result = await issueRefund({
      db: admin, source: "booking", id: bookingId,
      amountCents: amount, actor: "salon", reason,
      // refundApplicationFee omitted -> resolves from D7 config
    });
    return NextResponse.json({ data: {
      booking_id: bookingId, refunded_amount: amount,
      total_refunded: result.totalRefundedCents, payment_status: result.paymentStatus,
    }});
  } catch (e) { /* map RefundError code -> 400/404/500 with console.error("[refund] ", e) */ }
  ```
- Ownership check stays on the **request** client (RLS-scoped). The actual write uses the **admin** client inside `issueRefund` (so the CAS update isn't fighting RLS).

### B3. Rewrite the `refund` branch of `app/api/admin/booking-disputes/[id]/action/route.ts` to call `issueRefund`

- Lines 91-141 currently do their own Stripe `refunds.create` + the same CHF coalesce **[line 111]** + manual update. **Replace** the Stripe + booking-update portion (lines 107-134) with:
  ```ts
  const result = await issueRefund({
    db: admin, source: "booking", id: disputeFetch.booking_id,
    amountCents: validated.refund_amount ?? /* remaining */, actor: "admin",
    reason: resolution_note ?? "Refund issued by admin",
  });
  ```
  For the default (full remaining) when `refund_amount` is omitted: fetch `paid_amount, refunded_amount` and pass `paid_amount - refunded_amount` (integer Rappen). Do **not** coalesce `price_paid`.
- **Keep** the `booking_disputes` status update (lines 136-141) and `logAuditEvent` (line 154). **Add** a `case_events` insert: `{ booking_dispute_id: disputeId, price_dispute_id: null, actor: 'admin', action: 'refunded', amount: refundedCents, note: resolution_note }`.
- `validated.refund_amount` is already `z.number().int().positive()` (cents) — unit-correct.

### B4. Fix the live unit bug in `app/api/cron/pre-charge/route.ts`

- **Bug (line 52 + 48):** `amount: booking.price_paid ?? 0` sends a **CHF** value into Stripe's `amount` (Rappen) — a 100x undercharge. `platformFee` (line 48) is also computed off CHF.
- **Fix:** convert at the boundary using the existing helper `toRappen` from `lib/stripe.ts`.
  - `const amountRappen = toRappen(booking.price_paid ?? 0);`
  - `piParams.amount = amountRappen;`
  - `const platformFee = Math.round(amountRappen * (ratePercent / 100));` (fee in Rappen, integer).
  - On success update: `paid_amount: amountRappen` (Rappen — matches the new INTEGER column), `platform_fee: platformFee`.
- Add `import { toRappen } from "@/lib/stripe";` (file already imports `getStripe` from there).
- This is the one place that *populates* `paid_amount`; getting it right in Rappen is what makes `issueRefund`'s `remaining` math correct downstream.

### B5. NEW tiny config module — `lib/bookings/refund-config.ts` (D7)

```ts
// lib/bookings/refund-config.ts
export interface RefundConfig { refundApplicationFeeDefault: boolean; }
// D7: default driven by owner answer / env. Built configurable so it flips without code change.
// Source of truth order: platform_settings row 'refund_policy' (when that table exists) -> env -> hardcoded default.
export async function getRefundConfig(): Promise<RefundConfig>;
```
- For SP-0, implement env-backed: `refundApplicationFeeDefault = process.env.REFUND_APP_FEE_DEFAULT === "true"` (default `false` = keep the commission, the D7 "keep unless law requires" stance). When `platform_settings` lands, read a `refund_policy` row first. `issueRefund` calls this when `refundApplicationFee` arg is omitted.

### B6. (no-op confirm) `lib/stripe.ts`

- No change required: `getStripe()`, `toRappen()`, `PLATFORM_FEE_PERCENT` already exist. `issueRefund` and the pre-charge fix both reuse `toRappen`. Documented here so the implementer does not re-add a converter.

## Reuse + anti-duplication (existing code to extend, file paths)

- **`lib/stripe.ts`** — reuse `getStripe()` (singleton) + `toRappen()` (CHF->Rappen). Do not create a second Stripe client or converter.
- **`public.update_updated_at()`** (migration `014_new_schema.sql:8`) — reuse for the `booking_disputes` updated_at trigger instead of the bespoke `update_booking_disputes_updated_at()` that 075 defined. One canonical trigger fn.
- **`lib/validations.ts`** — reuse `bookingRefundSchema` (line 690) and `adminDisputeBookingActionSchema` (line 561). Both already type amounts as **integer cents** (`z.number().int()`), which is the convention we are locking. No schema edits needed in SP-0.
- **`lib/ratelimit.ts`** — reuse the existing `paymentLimiter` (line 35, 3/hour) for the refund route; do not invent a new limiter (council 10b#12 satisfied by the existing dedicated payment limiter).
- **`lib/audit.ts`** `logAuditEvent(...)` — keep on the admin action route; reuse, don't duplicate.
- **Webhook `charge.refunded` payout math** (`app/api/stripe/webhook/route.ts:285-303`) — `issueRefund`'s reconciliation **mirrors** this formula (gross - refunded, recompute commission/net). Keep the webhook as the async backstop; `issueRefund` does the synchronous best-effort decrement. They converge on the same row; the webhook is idempotent enough (recompute is absolute, not incremental on `gross`). Flag for SP-3 to ensure no double-decrement once `salon_payouts` exists.
- **068 / 038 / 075 DDL** — carried INTO the one new migration (they will never apply on their own); do not re-ship the old files.
- **`booking_disputes`** is the spine SP-3 extends further (eligibility, review-first workflow). SP-0 only creates + adds the columns/indexes/states the foundation needs.

## Acceptance criteria (testable: SQL/curl/expected)

**DB (run after applying the one migration on a branch):**

1. `SELECT is_nullable FROM information_schema.columns WHERE table_name='bookings' AND column_name='user_id';` -> `YES`.
2. `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='bookings' AND column_name IN ('guest_name','guest_email','guest_phone','reference_code','access_token_hash','access_token_expires_at','paid_amount','refunded_amount');` -> 8 rows; `paid_amount`/`refunded_amount` `data_type='integer'`; `refunded_amount` NOT NULL default 0.
3. `SELECT to_regclass('public.booking_disputes'), to_regclass('public.case_events');` -> both non-null.
4. `SELECT conname FROM pg_constraint WHERE conname IN ('booking_disputes_status_check','case_events_one_parent','bookings_payment_status_check');` -> 3 rows.
5. `SELECT indexname FROM pg_indexes WHERE indexname IN ('bookings_reference_code_key','booking_disputes_one_open_per_booking','bookings_access_token_hash_idx');` -> 3 rows.
6. **XOR check works:** `INSERT INTO case_events(actor,action) VALUES('admin','note');` -> fails (CHECK violation). `INSERT ... (booking_dispute_id, actor, action)` with a real id -> succeeds.
7. **One-open-case guard:** two inserts into `booking_disputes` for the same `booking_id` with status `'open'` -> second fails on `booking_disputes_one_open_per_booking`. A third with status `'resolved'` after closing the first -> succeeds.
8. **Idempotent re-run:** apply the migration file a second time -> no error (all guards hold).
9. `SELECT enabled FROM feature_flags WHERE key='dispute_reporting';` -> `true`.

**Unit lock / code:**

10. `pre-charge`: with a booking `price_paid = 50.00` CHF, the created PaymentIntent has `amount = 5000` (Rappen) and the row's `paid_amount = 5000`. (Assert via the `pi` object / DB read in a stubbed-Stripe test, or a Stripe test-mode dry run.)
11. `grep -rn "price_paid" app/api/bookings/\[id\]/refund/route.ts app/api/admin/booking-disputes/\[id\]/action/route.ts` -> **no** `?? booking.price_paid` coalesce remains (the CHF-into-Rappen bug is gone).
12. `grep -rn "refunds.create" app/api` -> appears **only** inside `lib/bookings/issue-refund.ts` (both former call sites now route through it).

**Chokepoint behavior (integration, stubbed Stripe):**

13. `issueRefund({ amountCents > remaining })` -> throws `EXCEEDS_REMAINING`, no Stripe call, `refunded_amount` unchanged.
14. Two concurrent `issueRefund` calls for the same booking+amount -> exactly one advances `refunded_amount` (CAS), Stripe called once (same idempotency key); no double refund.
15. `issueRefund` against a booking whose `salon_payouts` row is absent (i.e. today) -> succeeds, logs the skipped reconciliation, does not throw.
16. `issueRefund` on a Connect booking -> Stripe args include `reverse_transfer: true`; `refund_application_fee` matches `getRefundConfig()` (default `false`).

**curl smoke (salon refund route, after wiring):**

```
curl -X POST $BASE/api/bookings/$BID/refund \
  -H "Cookie: $SALON_OWNER_SESSION" -H "Content-Type: application/json" \
  -d '{"amount": 2500, "reason": "service not delivered"}'
# expect 200 { data: { total_refunded, payment_status } }; amount is Rappen (CHF 25.00)
```

## Risks + edge cases (cite the council Section 10 items)

- **10b#4 migration drift is itself risky.** The repair classification could mis-mark a file. Mitigation: the new migration is fully guarded + re-runnable (acceptance #8), applied on a **branch / with a backup**, and `supabase migration list` must show convergence before `db push --include-all=false`. Never push the whole dir.
- **10b#5 unit mismatch (live bug).** `price_paid` is CHF; `paid_amount`/`refunded_amount` are Rappen. Risk: any code path still coalescing them double/100x-miscounts. Mitigation: acceptance #11/#12 grep gates; `issueRefund` never reads `price_paid`; pre-charge converts via `toRappen`. **Residual:** `platform_fee` stays `numeric` live (we chose not to retype). New writes put Rappen integers in it; **old rows may hold CHF-scaled or 0 values** — flagged as out-of-scope cleanup; nothing in SP-0 reads `platform_fee` for refunds.
- **10b#3 idempotency / double-action.** Salon + admin can both refund. Mitigation: deterministic Stripe idempotency key + DB CAS (`.eq('refunded_amount', stale)`) + `booking_disputes_one_open_per_booking` partial unique (acceptance #7/#14).
- **10b#3 Connect / post-payout negative balance.** `reverse_transfer: true` claws back transferred funds; if already paid out, the salon balance can go negative — a Stripe-level / policy concern, not solvable in code here. Flagged: D7 + the payout model are owner/finance decisions; `issueRefund` exposes `refundApplicationFee` so the commission half is configurable.
- **`salon_payouts` ABSENT (verified live).** Risk: a naive reconciliation throws and aborts the refund. Mitigation: existence/error-guarded block (B1 step 9, acceptance #15). Also flag: the webhook `charge.refunded` handler already targets this missing table — pre-existing silent no-op, out of SP-0 scope to create.
- **`warnings` + `platform_settings` ABSENT (verified live).** Out of scope, but flagged: admin `warn_*` action writes a non-existent table (latent bug); `platform_settings` reads fall back to defaults safely. Do not let SP-3 assume these exist.
- **10b#1 extend, don't duplicate.** Creating `refund_requests` is forbidden; SP-0 only creates `booking_disputes` (because it's absent) + extends it. Risk of a future dev re-adding `auto_approve_at` — explicitly documented as banned (2c) per **D8** (void-on-silence, no auto money).
- **10b#11 status machine.** Risk of stuck/invalid states. Mitigation: explicit CHECK enum (2b) + CAS `.eq('status', expected)` guards are specified for SP-3; SP-0 lays the enum + the partial-unique. Terminal states (`resolved`/`rejected`) are excluded from the open-case index so re-filing post-closure works.
- **10b#6/#7 guest auth is NOT enabled by SP-0.** Making `user_id` nullable + storing `access_token_hash` are necessary but not sufficient. The RLS rewrite, service-role insert path, and `resolveBookingActor()` are **SP-1/SP-2**. SP-0 deliberately stops at the columns/indexes so a half-built guest path can't leak (no anon RLS policy is added).
- **Existing-data NOT NULL flip.** `ALTER COLUMN user_id DROP NOT NULL` is safe (loosening). No backfill needed. `refunded_amount` added with `DEFAULT 0 NOT NULL` is safe on existing rows.

## Front-end mockups needed (reference Section 12 numbers, likely none for SP-0)

**None.** SP-0 is DB + backend plumbing only. The Section 12 mockups (1-10) belong to SP-2 (confirmation/lookup/resend), SP-3/Phase-4 (report-a-problem + status/timeline + escalate), and SP-5 (salon review queue + admin unified case queue). SP-0 leaves the data + the `issueRefund` seam those screens will sit on.

## Out of scope for SP-0

- **Guest RLS rewrite + service-role guest insert** -> SP-1 (council 10b#6).
- **`reference_code` generation (nanoid + collision retry) + hashed-token mint/verify + `resolveBookingActor()` central authz + lookup/resend endpoints** -> SP-2 (council 10b#7/#10).
- **Reviving `price_disputes` (038) + the upcharge charge executor / SCA re-confirm** -> SP-3 (D8: void-on-silence; the upcharge-charge may be descoped to G2).
- **The full review-first workflow logic, eligibility categories, escalation transitions, `case_events` writes for the appeal flow, the unified "report a problem / request a refund" single entry** -> SP-3 (council 10b#1/#2, Section 11).
- **Salon refund-review queue UI + admin unified case queue UI** -> SP-5.
- **Walk-in branch of `issueRefund` (`source='walkin'`, off `barber_walkin_queue.payment_intent_id`)** -> deferred per **D10**; the signature reserves `source` but SP-0 implements only `'booking'`.
- **Creating `salon_payouts` / `platform_settings` / `warnings`** (absent live) -> not this feature's slice (Section 9: no full schema-drift cleanup beyond the payment/refund/dispute columns). `issueRefund` is written to tolerate `salon_payouts` being absent.
- **Retyping `bookings.platform_fee` numeric->integer** -> separate risky migration; flagged, not done here.
- **Notifications / Resend wiring for refund decisions** -> reuse existing hooks in SP-3 (council 10b#9); none added in SP-0.

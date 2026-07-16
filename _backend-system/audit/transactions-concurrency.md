# Transactions & concurrency , Solen audit 2026-07-16

## Verdict

Solen follows this topic's law well on the paths that touch real money. Every shared-balance
consumer (credits, vouchers, promo caps, member-discount caps, staff daily limits) is a
SECURITY DEFINER Postgres function that serializes with either `pg_advisory_xact_lock` or a
`SELECT ... FOR UPDATE` row lock taken before the read that decides the outcome, exactly the
lock-then-check-then-act order the law requires, and this was hardened three separate times in
the last two weeks (2026-07-10, 2026-07-11, 2026-07-14) after real double-debit bugs. The
booking slot-claim path is a textbook compare-and-swap with a live DB-level backstop (GIST
exclusion constraint + a unique partial index) behind it, and every Stripe charge site sampled
carries a deterministic `Idempotency-Key`. The one real structural gap is `cron/pre-charge`,
which reads a booking, waits through a loop of up to 50 Stripe calls, then writes `paid` without
ever re-checking the booking is still `confirmed` at charge time, unlike its sibling `no-show`
cron which does exactly that re-check. The second gap is architectural rather than a live bug:
no cron in the 26-route fleet has an overlap guard (advisory lock or a "running" flag), so
double-invocation safety depends entirely on each cron's own idempotency filters, which mostly
hold but were never verified as a fleet-wide property.

## Coverage + sampling method

- Read in full: both advisory-lock migrations (staff daily limit, member discount), the
  credit/voucher advisory-lock fix migration, both promo-cap migrations, `lib/bookings/charge-fee.ts`,
  `lib/bookings/off-session-charge.ts`, `lib/credits/redeem.ts`, `lib/referral/complete-referral.ts`,
  `app/api/cron/no-show/route.ts`, `app/api/cron/pre-charge/route.ts`, `app/api/bookings/[id]/cancel/route.ts`
  (slot-claim + CAS sections), `lib/cron-run.ts`, the `20260328_prevent_double_booking_gist.sql` and
  `20260707155609_bookings_one_active_per_slot.sql` constraint migrations.
- Read the relevant sections (not full files) of `app/api/bookings/route.ts` (slot-claim block),
  `app/api/stripe/booking-pay-intent/route.ts` (idempotency-key + reservation/reconciliation blocks),
  `app/api/salon/clients/route.ts` and `app/api/admin/badges/auto-assign/route.ts` (loop/embedding check).
- Grepped the full `supabase/migrations/` tree (264 files) for `pg_advisory`, `EXCLUDE USING gist`,
  `SERIALIZABLE`/`REPEATABLE READ`, and time-range table shapes; grepped `app/` + `lib/` for
  `idempotencyKey`/`Idempotency-Key`, raw `pg`/`@prisma`/`DATABASE_URL`, and `for (const ... of` loops
  immediately followed by an awaited `.from()` call.
- Ran two live read-only queries against the production Supabase Postgres instance (project
  `tocfnsmxmdxkrcmjzzdw`) via the Supabase MCP `execute_sql` tool: `pg_settings` for
  `deadlock_timeout`, `default_transaction_isolation`, `max_locks_per_transaction`, `max_connections`,
  `max_prepared_transactions`. No writes, no DDL, no data touched.
- Sampled, not exhaustive: of 354 API routes and 26 cron routes, this audit opened roughly 15 files
  in full and grepped the rest. The N+1/embedding check (question 6) sampled 4 files that looked
  loop-heavy out of ~169 grep hits for `for (const ... of` in `app/` + `lib/`; the other ~165 were not
  individually opened. Cron overlap-guard coverage (question 9) is a fleet-wide grep for
  `advisory`/`lock`/`is_running` across all 26 cron routes (a real negative result, not a sample), but
  only 2 of the 26 cron bodies (`no-show`, `pre-charge`) were read in full for their own internal
  check-then-act correctness.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| TXN-01 | Stay on Read Committed, no isolation-level change without a retry wrapper | MATCH | Live query: `default_transaction_isolation = 'read committed'`, source `default` (not overridden anywhere in migrations; grep for `SERIALIZABLE`/`REPEATABLE READ` across all 264 migrations returned zero hits) | NONE |
| TXN-02 | Atomic multi-write money ops must be one Postgres function via `.rpc()`, never sequential client calls | PARTIAL | `redeem_user_credits`/`redeem_voucher`/`reserve_promo_use`/`reserve_member_discount` are all correctly RPCs (`supabase/migrations/20260714160410_fix_redeem_credit_voucher_advisory_lock.sql`, `20260714130000_promo_per_user_cap_fixes.sql`, `20260710103441_audit_fix_member_discount_reserve.sql`). But `lib/referral/complete-referral.ts:64-107` does the referral CAS-update and the two `user_credits` INSERTs as two sequential app-level `.from()` calls, not one RPC | MEDIUM (see gap detail) |
| TXN-03 | Single-row state-flip UPDATEs must check row count, not just error | MATCH (primary path); PARTIAL (one secondary path) | `app/api/bookings/route.ts:531-556` checks `slotUpdateRows?.length`; `app/api/bookings/[id]/cancel/route.ts:167-187` uses CAS + `.maybeSingle()` + null-check; `app/api/cron/no-show/route.ts:48-58` re-asserts `status=confirmed` and checks `updatedRows.length`. Gap: `lib/bookings/charge-fee.ts:284-292` `casUpdate()` checks only `error`, never row count, on the post-charge status write | LOW (gap; mitigated, see detail) |
| TXN-04 | Balance-consuming RPCs must take the lock as the FIRST statement, before any idempotency check | MATCH | `redeem_user_credits`/`redeem_voucher` (`20260714160410`, lines 17-18 and 50-51: `PERFORM pg_advisory_xact_lock(...)` is line 1 of the body, EXISTS-check is line 2); `reserve_member_discount` (`20260710103441:28`, lock before any read); `enforce_staff_daily_limit` trigger (`20260710225432:40`, lock before the count SELECT). `reserve_promo_use` uses `SELECT ... FOR UPDATE` on `promo_codes` (not `pg_advisory_xact_lock`) but the row lock is still acquired (`20260714130000:26`) before the per-user-limit count read and the `current_uses` increment, satisfying the underlying serialization requirement via a different (also valid) mechanism | NONE |
| TXN-05 | A DB-level EXCLUDE/UNIQUE/CHECK backstop must exist for every double-allocation risk | MATCH | `prevent_double_booking` GIST EXCLUDE on `availability_slots(staff_member_id, tstzrange(starts_at,ends_at))` (`supabase/migrations/20260328_prevent_double_booking_gist.sql:5-10`), PLUS a second independent backstop `bookings_one_active_per_slot` unique partial index on `bookings(slot_id)` (`20260707155609_bookings_one_active_per_slot.sql`). No other table in the live schema models a concurrently-write-contended exclusive time-range allocation (`staff_schedules`/`staff_breaks`/`staff_time_off` are single-owner-edited recurring templates, not customer-facing booking contention; `spa_treatment_rooms` is a room catalog with no time-range column of its own) | NONE |
| TXN-06 | Every plausibly-double-triggerable Stripe charge must carry a stable Idempotency-Key on the SDK call | MATCH | All 5 named call sites verified: `lib/bookings/charge-fee.ts:170` (`fee:${source}:${id}:${kind}:${chargeCents}`), `lib/bookings/off-session-charge.ts:84` (passes caller's key straight to `paymentIntents.create`), `app/api/cron/pre-charge/route.ts:77` (`pre-charge:${booking.id}:${amountRappen}`), `app/api/cron/no-show/route.ts` (calls `chargeFee`, inherits its key), `app/api/stripe/booking-pay-intent/route.ts:481-487` (sha256 of `booking-pay:${booking.id}:${baseAmountRappen}`, explicitly keyed on the pre-discount amount so a discount-cap change between attempts can't fork a second PI) | NONE |
| TXN-07 | No raw `pg`/Prisma/`DATABASE_URL` in request-serving code | MATCH | `grep -rn '"pg"\|@prisma/client' package.json` = 0 hits; `grep -rn "DATABASE_URL\|POSTGRES_URL" app lib scripts` = 2 hits, both in `scripts/ring8*-kill-test.ts` comments stating the ABSENCE of such a path, not a usage | NONE |
| TXN-08 | Prefer PostgREST resource embedding over a per-row `.from()` loop | MATCH (customer paths); LOW-severity exception (admin path) | `app/api/bookings/route.ts:183` embeds `salons(...)`/`services(...)` in one `.select()`; `app/api/salon/clients/route.ts:27-91` bulk-fetches `public_profiles`/`client_tags`/`client_rfm_segments` once then joins in memory (no per-row loop). Exception: `app/api/admin/badges/auto-assign/route.ts:56-69` does one `.from("salon_badge_assignments")` call per qualifying salon inside a `for` loop, an admin batch job bounded by the live salon count (~28), not a customer request path | LOW |
| TXN-09 | Two-plus locks in one function must have a documented, consistent acquisition order | MATCH (vacuously) | Read every function containing `pg_advisory_xact_lock` (4 hits across 3 migration files); each takes exactly one key per function call, none combine two advisory locks or an advisory lock with a `FOR UPDATE` on a second table | NONE (not yet a live risk, correctly deferred per the principle's own framing) |
| TXN-10 | Treat deadlock detection (default 1s `deadlock_timeout`) as a backstop, interpret 40P01 correctly if it ever fires | MATCH | Live query confirms `deadlock_timeout = 1000ms`, source `default`, matching the assumed Postgres default exactly; no deadlock has been logged in migration history or the health audit | NONE |
| TXN-11 | Don't adopt a distributed lock service; use `pg_advisory_xact_lock` | MATCH | No Redis-based locking found anywhere; Upstash (`@upstash/ratelimit`/`@upstash/redis`) is used only for rate limiting, never for cross-request mutual exclusion; all 4 concurrency-control sites use in-transaction Postgres locking | NONE |

## The gaps in detail

### Gap 1: `cron/pre-charge` never re-checks booking status at charge time (TXN-03)

**What is wrong.** The pre-charge cron SELECTs bookings where `status='confirmed'` AND
`payment_status='card_saved'` (`app/api/cron/pre-charge/route.ts:27-36`), then loops through up
to 50 of them, and for each one calls `chargeOffSession` (a real Stripe charge) without
re-reading or re-asserting the booking's current status. Only AFTER a successful charge does it
write `payment_status:'paid'` (lines 92-100), and that write has no `.eq("status", "confirmed")`
guard and no `.select()` row-count check.

**The exact code:**
```ts
// app/api/cron/pre-charge/route.ts:41-100 (abridged)
for (const booking of bookings ?? []) {
  ...
  const result = await chargeOffSession({
    amountCents: amountRappen,
    stripeCustomerId: booking.stripe_customer_id,
    stripePaymentMethodId: booking.stripe_payment_method_id,
    ...
    idempotencyKey: `pre-charge:${booking.id}:${amountRappen}`,
    ...
  });
  ...
  await admin
    .from("bookings")
    .update({ payment_status: "paid", payment_intent_id: result.paymentIntentId, ... })
    .eq("id", booking.id);   // <-- no .eq("status","confirmed"), no row-count check
```

Compare this to the sibling `no-show` cron in the same file family, which does it correctly:
```ts
// app/api/cron/no-show/route.ts:48-58
const { data: updatedRows } = await admin
  .from("bookings")
  .update({ status: "no_show", ... })
  .eq("id", booking.id)
  .eq("status", "confirmed")   // <-- re-assert precondition
  .select("id");
if (!updatedRows || updatedRows.length === 0) {
  console.error(`[no-show] booking ${booking.id} no longer confirmed ... skipping`);
  continue;
}
```

**What breaks in practice.** A customer can cancel a booking (via `app/api/bookings/[id]/cancel/route.ts`,
which correctly CASes the booking to `cancelled`) at any point during the cron's iteration over
its batch of up to 50 bookings, a loop that does a DB read, a commission-rate read, and a
synchronous Stripe API round-trip per booking, so it is not instantaneous. If the cancellation
lands after the cron's SELECT already fetched that booking but before the loop reaches it, the
cron still charges the customer's saved card for a booking that is, at that moment, cancelled.
This is a real-money customer-harm bug (an unauthorized-feeling charge on a cancelled
appointment), not merely a data-integrity nit. The idempotency key protects against the cron
double-charging the SAME booking on a retry; it does nothing to stop this specific charge from
happening once, wrongly, the first time.

**The concrete fix and its cost.** Add a claim-first conditional UPDATE before the Stripe call,
mirroring `no-show`'s pattern exactly: `UPDATE bookings SET payment_status='charging' WHERE id=? AND
status='confirmed' AND payment_status='card_saved' RETURNING id`, skip the booking if 0 rows come
back, and only then call `chargeOffSession`. Cost: about 10 lines, one extra UPDATE per booking
(negligible at 28-salon scale), no schema change (payment_status already accepts new string
values). This is the same fix pattern already proven correct and shipped in `no-show` and
`bookings/[id]/cancel`, so it is a copy of an existing, trusted pattern, not new design work.

### Gap 2: referral completion is two sequential app-level writes, not one RPC (TXN-02)

**What is wrong.** `completeReferralForFirstBooking` (`lib/referral/complete-referral.ts`) does
the referral-row CAS and the two `user_credits` INSERTs as two separate `.from()` calls
(separate PostgREST transactions per TXN-02's own definition), not a single Postgres function.

**The exact code:**
```ts
// lib/referral/complete-referral.ts:64-107 (abridged)
const { data: won, error: casError } = await admin
  .from("referrals")
  .update({ referred_user_id: userId, status: "completed", completed_at: ... })
  .eq("id", referral.id)
  .eq("status", "pending")
  .select("id")
  .maybeSingle();
...
if (!won) return { completed: false };
...
const { error: creditError } = await admin.from("user_credits").insert([ ... two rows ... ]);
if (creditError) {
  // explicit compensation: delete any credits that landed + revert referral to 'pending'
}
```

The code is genuinely careful: the CAS closes the concurrent-double-completion race (verified,
backed by a `referrals_one_completed_per_referred_uidx` unique index as a second backstop on
23505), and the `creditError` branch explicitly compensates by deleting credits and reverting
the referral to `pending` so a later retry can complete it. What it does NOT handle is a crash
between the two `await`s where NO error is ever thrown, for example the serverless function
being killed for a timeout or a cold-start eviction right after the CAS commits but before the
INSERT call even executes. In that specific window, the referral row is left `status='completed'`
permanently, and no code path ever grants the CHF 10/CHF 10 credits: every future call to this
function first SELECTs on `.eq("status","pending")` (line 58-60), which will now find nothing,
so it silently returns `{ completed: false }` without granting credits or logging that anything
was missed.

**What breaks in practice.** A narrow-window (crash-only, not concurrency-only) loss of a
CHF 10 + CHF 10 referral reward, with no reconciliation cron and no alert, so it would only
surface if a customer complained "where's my referral credit". Grepped `app/api/cron/` for any
referral reconciliation job: none exists. Low likelihood (needs a mid-function process kill, not
just a race between two requests), genuine impact (silent stored-value loss with no recovery
path), money-adjacent but small denomination.

**The concrete fix and its cost.** Fold the CAS + double-insert into one `SECURITY DEFINER`
Postgres function (`complete_referral(p_referral_id, p_user_id)`), called via `.rpc()`, mirroring
the exact shape of `redeem_user_credits`. Cost: one migration (~30 lines, same shape as the
already-shipped credit-redemption RPCs), a one-line change at each of the 3 call sites
(`app/api/referral/complete/route.ts`, `app/api/bookings/route.ts`, `app/api/bookings/[id]/confirm/route.ts`,
`app/api/stripe/webhook/route.ts`) to call the RPC instead of the TS function. This is a genuine,
if small, gap between the codebase's own stated law (RPC for atomic money writes) and this one
file, which predates the credit/voucher RPC hardening pass.

### Gap 3 (structural, not a live bug): no cron overlap guard exists anywhere in the 26-route fleet (TXN-09 audit question)

**What is wrong.** `lib/cron-run.ts` (`withCronRun`, wraps every `/api/cron/*` handler) is
observability-only: it times the run and best-effort logs one row to `cron_runs`. It has no
"already running" check and takes no lock. Grepping all 26 cron route files for
`advisory`/`lock`/`is_running`/`already_running` returns only incidental word matches (comments
containing "unblock" or code containing the substring "blocked" as an availability-slot status),
confirmed by reading the matches directly; there is no actual overlap-prevention mechanism
anywhere in the cron fleet.

**What breaks in practice, if it ever did.** Most individual crons are self-protecting against a
double-run of the SAME row because they filter on a status column that changes once the row is
processed (`fee_charge_status IS NULL`, `.eq("status","confirmed")` re-asserts, deterministic
Stripe idempotency keys), so an accidental double-invocation is mostly a wasted read, not a
double-write. The genuine exposure is a cron whose own internal loop does a revert-then-reapply
pattern without an idempotency key, e.g. `generate-slots`' capacity-blocking logic
(`app/api/cron/generate-slots/route.ts:230-353`, which reverts its own prior `block_reason='capacity'`
rows then recomputes), where two overlapping runs for the same salon could interleave their
revert/reapply writes. This affects availability-slot blocking, not money.

**Why this is LOW-MEDIUM, not HIGH, at Solen's current scale.** Each GH Actions job in
`.github/workflows/cron-jobs.yml` has its own `timeout-minutes` (5-10 min) well inside its own
schedule interval (the tightest is every 15 minutes), so under normal conditions the same cron
should not still be running when its next scheduled tick fires. The realistic overlap trigger
would be a manual `workflow_dispatch` run colliding with a scheduled tick, or the underlying
Netlify function continuing to execute after the GH Actions HTTP client times out and gives up
(client-side timeout does not guarantee server-side cancellation) , neither was reproduced or
observed in this audit; both are plausible-but-unverified.

**The concrete fix and its cost.** Add one `pg_advisory_xact_lock`-style guard, but since a cron
run is not itself a single Postgres transaction (it is a whole HTTP request making many separate
calls), the mechanism must be a session-scoped `pg_try_advisory_lock` (not `_xact_`) taken at the
top of `withCronRun` and explicitly released (or a `cron_runs` row with a `status='running'`
value checked-and-claimed via a CAS UPDATE before the handler runs, released after). Cost: one
shared change to `lib/cron-run.ts` (~20 lines) plus a migration to add a claim column/function if
going the DB route; touches all 26 crons at once since they share the wrapper, so this is worth
doing centrally rather than per-cron. Given the actual risk is availability-slot flapping, not
money, this is reasonably deferred rather than urgent.

## What Solen already does RIGHT (name it, do not "fix" these)

- **The credit/voucher/promo/member-discount/staff-daily-limit RPCs are the correct reference
  pattern for TXN-04.** All five take their serialization lock (advisory or row `FOR UPDATE`)
  before any idempotency check or count read, all were fixed to this exact shape within the last
  week (2026-07-10 through 2026-07-14) after real bugs, and `lib/credits/redeem.ts` explicitly
  documents the correct boundary: its own balance read is "never to gate the RPC's own
  atomicity, the RPC re-checks everything under FOR UPDATE regardless." Do not add extra
  app-level balance checks in front of these RPCs; they would be redundant at best and a new
  TOCTOU surface at worst.
- **The booking slot-claim path (`app/api/bookings/route.ts`) is layered defense done right**:
  app-level CAS with row-count check, a DB-level GIST EXCLUDE constraint AND a second independent
  unique partial index as backstops, and an explicit compensating rollback (delete the
  just-inserted booking) on any slot-claim failure. This is the textbook implementation of both
  TXN-03 and TXN-05 together. Do not touch the 23P01 handling or the rollback logic.
- **Idempotency-Key discipline on every sampled Stripe charge call is thorough and deliberate**,
  including choosing to key `booking-pay-intent`'s hash on the PRE-discount base amount
  specifically so a promo/member-discount change between retries can't fork a second live
  PaymentIntent, and post-charge reconciliation logic that reads the discount actually reflected
  on the (possibly replayed) returned PaymentIntent rather than trusting the request's own
  freshly-computed values. This is meaningfully more careful than the median Stripe integration.
- **`app/api/cron/no-show` and `app/api/bookings/[id]/cancel` are the correct reference pattern
  for TXN-03** on a read-then-mutate-later cron/route: both re-assert the precondition in the
  final UPDATE's WHERE clause and check the row count before trusting the write happened. Copy
  this pattern into the pre-charge fix above rather than inventing a new one.
- **No raw Postgres driver, no distributed lock service, no isolation-level override anywhere.**
  All three are correctly-premature non-adoptions for a 28-salon, service-role-and-PostgREST-only
  codebase; nothing here needs building ahead of an actual need.

## Unknowns

- **Whether the pre-charge race in Gap 1 has ever actually fired in production.** This audit
  found the code path is open, not that a customer has actually been wrongly charged. Checking
  would require correlating `cron_runs` timing for `pre-charge` against `bookings.cancelled_at`
  timestamps that fall inside a `pre-charge` run's window for the same booking id, cross-referenced
  with `payment_status='paid'` on a booking whose `status='cancelled'`. Not attempted this session
  (would require a live data query beyond the schema-only checks already run).
  Since the recommended queries below are read-only, they could be run on request.
- **Whether the GH Actions client-side timeout actually aborts the underlying Netlify function
  server-side**, which determines how real the cron-overlap exposure in Gap 3 actually is. This
  needs a Netlify support/docs check (does a client hang-up cancel Netlify's Node.js function
  execution, or does it run to completion regardless), not attempted this session.
- **Full coverage of the ~165 unopened `for (const ... of` loop hits** from the TXN-08 grep. Four
  were opened and found either fine (bulk-fetch-then-join) or low-severity-and-bounded (admin
  batch job); the remaining ~165 were not individually read, so a genuine N+1 could exist in an
  unsampled route. A full sweep would need either a dedicated static-analysis pass or a much
  larger per-file read budget than this single-topic audit allows.
- **Whether any OTHER money-adjacent function besides `complete-referral` still does sequential
  app-level writes instead of an RPC.** This audit checked the specific functions named in the
  research brief (credits, vouchers, promo, member-discount, staff-daily-limit) plus one more
  found via `user_credits`/`vouchers` grep (referral). A full inventory of every write path that
  touches a shared balance or count was not attempted; the `_docs/BACKEND.md` "value-store
  economy" section (section not read in full this session) may name others worth checking.

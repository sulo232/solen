# Transactions & concurrency, researched law

Date: 2026-07-16. Sources fetched this run: 15 primary/authoritative pages (listed at
the bottom, each with what it established). For: any session touching bookings,
payments, credits/vouchers, promo codes, staff daily limits, or any write path where
two requests can race. Companion doc: `_docs/BACKEND.md` (section 5, "Booking engine")
describes WHAT the code does today; this file is WHY, with tiers, and what to do next.

Solen-specific fact that reframes almost everything below: **Solen never opens a raw
Postgres connection.** Every read/write in `app/api/**` goes through `supabase-js`
(`lib/supabase.ts`, `createServerClient` from `@supabase/ssr`) over HTTPS to Supabase's
PostgREST layer. There is no `pg` driver, no Prisma, no `DATABASE_URL` connection string
anywhere in the app code (verified: `grep -rn "\"pg\":\|@prisma\|DATABASE_URL"
package.json app lib` returns nothing but two comments in one-off scripts). This one
fact changes the connection-pooling section (§5) and the locking section (§2) more than
any other, so read the note there before assuming generic "serverless + Postgres"
advice applies verbatim.

---

## 0. The short version

1. **Read Committed is Postgres's default and Solen never overrides it.** It permits
   non-repeatable reads and phantom reads but blocks dirty reads. Fine for almost every
   Solen query; wrong for the handful of read-then-write money/slot decisions (T1,
   [postgresql.org/docs/current/transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html)).
2. **A `supabase.from(...)` call from Next.js is NOT a multi-statement transaction.**
   PostgREST wraps exactly one HTTP request in one transaction; `supabase-js` has no
   client-side transaction API. The only way to get atomicity across more than one
   write in this stack is a Postgres function called via `.rpc()`, because the whole
   function body runs inside the single transaction PostgREST opens for that one RPC
   call (T1, [docs.postgrest.org/en/v12/references/transactions.html](https://docs.postgrest.org/en/v12/references/transactions.html);
   confirmed for supabase-js specifically at
   [github.com/orgs/supabase/discussions/4562](https://github.com/orgs/supabase/discussions/4562)).
3. **Check-then-act across two separate `.from()` calls is a race, full stop.** Solen
   has shipped this bug at least three times in production (staff daily limit, credit
   redemption, voucher redemption, all below) and the fix every time was the same
   pattern: move the check inside a Postgres function, guarded by a lock, so the whole
   check+write is one transaction (T1 mechanic, direct evidence from this repo's own
   migrations, see §2 and §3).
4. **Optimistic locking (conditional UPDATE, "claim only if still available") is
   Solen's default concurrency control, and it already works correctly on the hot path**
   (booking slot claim in `app/api/bookings/route.ts`). Use it whenever the race is a
   single-row state flip. Use pessimistic locking (`pg_advisory_xact_lock` or
   `SELECT ... FOR UPDATE`) only when the operation spans multiple rows or needs to
   read-modify-write a running balance (T2 mechanic + this repo's evidence, §3).
5. **N+1 queries are a real but currently-contained risk.** PostgREST's resource
   embedding (`salons(name), services(price)` inside one `.select()`) already collapses
   the classic N+1 shape into one query in most of the booking/search code; the risk is
   in hand-rolled loops that call `.from()` per row (T1 mechanic, §4).
6. **Connection-pool exhaustion, the textbook "serverless killer," does not hit Solen's
   application code today**, because there is no persistent Postgres socket per lambda
   invocation; PostgREST and Supabase's own pooling absorb that entirely. It WOULD start
   to matter the day anyone adds a raw `pg`/Prisma client for a perf reason (T1 for the
   general mechanism, T1+direct grep for the Solen-specific absence, §5).
7. **Deadlocks are rare at ~28 salons' traffic and Postgres auto-detects and aborts one
   side within `deadlock_timeout` (1s default).** The mitigation that matters more than
   deadlock handling is simply: touch resources (rows, advisory-lock keys) in a
   consistent order across every code path that can lock more than one thing (T1, §6).
8. **`SERIALIZABLE` is not used anywhere in Solen and should not be adopted broadly.**
   It requires retry-the-whole-transaction logic on SQLSTATE `40001`, which the current
   architecture (one-shot HTTP requests, no retry wrapper) does not have. Where true
   serializability is needed, the existing advisory-lock pattern is cheaper to reason
   about at this scale (T1 mechanic + explicit scale judgment, §1 and "Premature").
9. **A fabricated number in this space is worse than a missing one.** Never invent a
   Postgres throughput ceiling, a Supabase connection limit, or a "handles N req/s"
   claim without a fetched source for Solen's actual tier; the ones in this file are all
   qualitative or directly sourced (see per-section notes and "Unverified").

---

## 1. Isolation levels

**The question:** which anomalies can slip through at each level, and does Solen ever
need anything stronger than the default.

**What the evidence says.**

Postgres implements three of the four SQL-standard levels distinctly (Read Uncommitted
behaves exactly like Read Committed because Postgres's MVCC design never exposes
uncommitted rows to another transaction, T1,
[transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html)):

| Level | Dirty read | Non-repeatable read | Phantom read | Serialization anomaly | Snapshot taken |
|---|---|---|---|---|---|
| Read Committed (Postgres default) | No | Possible | Possible | Possible | Per statement |
| Repeatable Read | No | No | No (Postgres's snapshot-isolation implementation is stricter than the SQL standard requires here) | Possible | Per transaction (first non-control statement) |
| Serializable | No | No | No | No | Per transaction + predicate locks |

Definitions (T1, foundational CS, Wikipedia is acceptable here per the research brief;
[en.wikipedia.org/wiki/Isolation_(database_systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems))):
- **Dirty read**: transaction A reads a row transaction B wrote but has not committed.
- **Non-repeatable read**: A reads a row twice; B commits a change to it in between.
- **Phantom read**: A re-runs a range query; B commits an insert/delete that changes
  which rows match, in between.
- **Write skew**: A and B each read overlapping data, then each write disjoint columns
  or rows based on what they read, producing a combined result neither read-and-decided
  transaction would have permitted alone. This is the anomaly Repeatable Read (Snapshot
  Isolation) still permits and only Serializable closes.

**Read Committed's per-statement re-read is the subtle one for Solen.** Because each
statement inside a Read Committed transaction gets a fresh snapshot, and because an
`UPDATE`/`DELETE` that hits a row concurrently modified by another committed transaction
"re-evaluates its WHERE clause against the new row version" and proceeds
(T1, [transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html)),
Read Committed does NOT raise an error on a lost-update-shaped race, it just silently
applies your write on top of someone else's already-committed write. This is why the
booking route's slot claim uses a conditional `UPDATE ... WHERE status = 'available'` and
CHECKS THE ROW COUNT (`slotUpdateRows?.length`), rather than trusting that the update
"worked" because it returned 200. Read Committed alone would let two concurrent claims
both silently succeed if the code only checked `error === null`.

**Repeatable Read and Serializable trade a silent-race problem for an explicit-retry
problem.** Both raise SQLSTATE `40001` ("could not serialize access due to concurrent
update" for Repeatable Read; "could not serialize access due to read/write dependencies
among transactions" for Serializable) when a conflict is detected, and Postgres
explicitly does NOT auto-retry: "It is important to retry the complete transaction,
including all logic that decides which SQL to issue and/or which values to use.
Therefore, PostgreSQL does not offer an automatic retry facility, since it cannot do so
with any guarantee of correctness" (T1,
[mvcc-serialization-failure-handling.html](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html)).
Serializable is implemented as Serializable Snapshot Isolation (SSI): it runs exactly
like Repeatable Read but additionally tracks predicate locks (visible in `pg_locks` as
`SIReadLock`) to detect read/write dependency cycles across concurrent transactions,
without adding blocking beyond what Repeatable Read already does (T1, same source, and
[wiki.postgresql.org/wiki/SSI](https://wiki.postgresql.org/wiki/SSI)).

**Where the real tradeoff lies.** Repeatable Read / Serializable push the entire retry
burden onto the CALLER. In a request/response HTTP handler (which is all Solen has, no
background worker with a retry loop), "retry the whole transaction" means "retry the
whole HTTP request," which the client, not the server, would have to do. Solen's actual
pattern instead (see §2/§3) does the equivalent work explicitly, in application logic:
conditional UPDATE + checked row count, or an advisory lock that serializes the
critical section so there is nothing to retry. This is a legitimate, well-known
alternative to raising the isolation level: it is more code per site, but it fails with
a clean, chosen HTTP status (409) instead of a database-level exception the route would
have to catch and translate anyway.

**Recommended default for Solen:** stay on Read Committed everywhere (Postgres's
default, do nothing to change it) and use explicit optimistic (conditional UPDATE) or
pessimistic (advisory lock / `FOR UPDATE`) patterns at the specific handful of sites
that need atomicity, rather than reaching for `SET TRANSACTION ISOLATION LEVEL
SERIALIZABLE` project-wide. Cost of the recommended default: every NEW money/slot/limit
write path has to be individually audited for the check-then-act shape, since Read
Committed will not catch it for you. Cost of the alternative (Serializable everywhere):
a 40001 retry wrapper would need to be built and would need to wrap every mutating route,
for anomalies (write skew, phantom-driven double-insert) that Solen's actual write
patterns barely produce today, because most money/slot writes are single-row
UPDATE-with-WHERE, not multi-row read-decide-write.

---

## 2. Optimistic vs pessimistic locking

**The question:** version-column/compare-and-swap vs `SELECT FOR UPDATE`/advisory
locks, and when each is the right tool.

**What the evidence says.**

*Optimistic concurrency control* (Martin Fowler's Patterns of Enterprise Application
Architecture calls this "Optimistic Offline Lock"): read a row (optionally with a
version/timestamp column), decide the new value in application code, then write with a
conditional `UPDATE ... WHERE <original-state still holds>`, and check whether the
UPDATE actually matched a row. Zero rows affected means someone else changed the row
first, so treat it as a conflict rather than trusting the 200 (T2,
[martinfowler.com/isa/concurrency.html](http://thierryroussel.free.fr/java/books/martinfowler/www.martinfowler.com/isa/concurrency.html);
mechanic corroborated by multiple DB pattern write-ups on the compare-and-swap
approach). This is exactly what Solen's booking route does, with `status` as the
implicit version column instead of a numeric counter:

```ts
// app/api/bookings/route.ts, lines 531-536
const { data: slotUpdateRows, error: slotUpdateError } = await db
  .from("availability_slots")
  .update(slotUpdate)
  .eq("id", resolvedSlotId)
  .eq("status", "available")   // <- the "compare" half of compare-and-swap
  .select("id");                // <- the check: did it actually match?
```

If `slotUpdateRows` comes back empty, the code treats it as a lost race (someone else's
request flipped the slot to `booked` between this request's read and this write) and
rolls back the just-inserted booking row. The code's own comment calls this the "TOCTOU
guard." This is optimistic locking done correctly: no lock is held anywhere, the DB's
own atomic single-row UPDATE is the compare-and-swap primitive, and losers get a clean
409 instead of a corrupted double-booking.

*Pessimistic concurrency control*: acquire a lock BEFORE reading, so no other
transaction can even start the conflicting operation. Postgres's row-level `SELECT ...
FOR UPDATE` locks the selected rows against concurrent `UPDATE`/`DELETE`/`FOR
UPDATE`/`FOR SHARE`, and any transaction reading with these clauses on an
already-locked row simply waits for the lock-holder to commit or roll back (T1,
[explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html)).
Advisory locks (`pg_advisory_lock` / `pg_advisory_xact_lock`) are Postgres's
application-defined lock primitive: an arbitrary 64-bit key (Solen hashes a string key
with `hashtext(...)`) that has no relation to any actual row, used purely to serialize a
critical section across concurrent transactions. Session-level advisory locks survive a
rollback and need an explicit unlock; transaction-level ones (`_xact_lock`, what Solen
uses everywhere) auto-release at COMMIT/ROLLBACK, which is the right choice whenever the
lock's lifetime should exactly match one Postgres function call (T1, same source).

Solen uses BOTH row-level `FOR UPDATE` and advisory locks together inside its
money-moving RPC functions, and the combination is instructive:

```sql
-- redeem_user_credits, supabase/migrations/20260714160410_fix_redeem_credit_voucher_advisory_lock.sql
PERFORM pg_advisory_xact_lock(hashtext('credit-redeem:' || p_booking::text));  -- serializes per booking
IF EXISTS (SELECT 1 FROM credit_redemptions WHERE booking_id = p_booking) THEN
  RETURN ...;  -- idempotency check, now safe because the lock above makes it race-free
END IF;
...
FOR r IN SELECT id, remaining FROM user_credits WHERE ... FOR UPDATE  -- locks the specific credit rows
```

The advisory lock serializes "has this booking already redeemed credits" (an
idempotency check across the WHOLE booking, not tied to any single row that could be
locked with `FOR UPDATE`), while the row-level `FOR UPDATE` inside the loop protects the
specific `user_credits` balance rows being decremented. Neither alone was sufficient:
the migration's own commit message explains the bug this fixed (see §3).

**Where the real tradeoff lies.** Optimistic locking has zero lock-wait cost and scales
better under low contention, but every losing request does real work (an INSERT, in the
booking case) that then has to be explicitly rolled back, and the loser gets a 409 the
user has to react to (retry the search). Pessimistic locking (advisory lock or `FOR
UPDATE`) guarantees correctness for read-modify-write balance operations without a
rollback-and-retry dance, but a lock held across a slow operation (e.g. an external
Stripe call made WHILE holding an advisory lock) would serialize every other request on
that key and, on Supabase's hosted Postgres with normal query timeouts, risks a
lock-wait timeout under real concurrency. None of Solen's current advisory-lock RPCs
make an external network call while holding the lock (verified by reading both
migrations above end-to-end); that discipline needs to hold for every future RPC that
adds a lock.

**Recommended default for Solen:** optimistic (conditional UPDATE + row-count check) for
any single-row state flip where "someone else already changed it" is a legitimate
409, not a bug, e.g. slot claims, single status transitions. Pessimistic (advisory lock
inside a Postgres function, transaction-scoped) for anything that reads a running
balance and decides how much to take from it (credits, vouchers, promo-code usage caps,
per-stylist daily limits), because there the correct answer literally depends on the
current state of a value shared across concurrent callers, not just "did the row I
already decided to write still look the way I expected." Cost: pessimistic paths must
live inside a Postgres function (RPC), never as several client-side `.from()` calls,
because the lock is only meaningful if it is held for the ENTIRE check+write, and only a
single-transaction RPC gives you that in this stack (see §0.2, §3).

---

## 3. Race conditions: double-booking, double-charge, check-then-act, TOCTOU

**The question:** what the general pattern is, and what Solen has actually shipped and
fixed.

**What the evidence says.** CWE-367 (MITRE's formal, T1 definition of this bug class)
states it plainly: "The product checks the state of a resource before using that
resource, but the resource's state can change between the check and the use in a way
that invalidates the results of the check"
([cwe.mitre.org/data/definitions/367.html](https://cwe.mitre.org/data/definitions/367.html)).
MITRE's listed mitigations are, in order of strength: eliminate the separate check
entirely, make check-and-use one atomic operation, lock before checking (not after),
and re-verify at time of use if a gap can't be closed. Solen's own migration history is
a live case study of exactly this bug class, independently discovered and fixed three
times:

1. **Staff daily limit** (`20260710225432_audit_fix_staff_daily_limit_atomic_trigger.sql`):
   the limit was originally enforced with an app-level `SELECT count(*)` followed by an
   `INSERT`. Two concurrent bookings for different slots but the same stylist/day could
   both read a count under the limit, then both insert, oversubscribing the stylist. Fix:
   moved the count+insert into a `BEFORE INSERT` trigger that takes
   `pg_advisory_xact_lock(hashtext(stylist || day))` before counting, so the whole
   check-then-insert became one serialized unit inside the INSERT's own transaction.
2. **Credit redemption** (`20260714160410_fix_redeem_credit_voucher_advisory_lock.sql`):
   the idempotency `EXISTS` check ("has this booking already redeemed credits") ran
   BEFORE any lock. Two concurrent calls for the same booking both passed the check,
   both debited the user's credit balance, and the second ledger row was silently
   dropped by `ON CONFLICT DO NOTHING`, a permanent stored-value loss with no error
   surfaced anywhere. Fix: `pg_advisory_xact_lock` keyed on the booking, taken as the
   FIRST statement, before the idempotency check.
3. **Voucher redemption**: identical bug, identical fix, same migration file, same
   commit.
4. **Booking slot double-claim** (`app/api/bookings/route.ts`, comment marks it "audit
   fix B"): the fix already documented in §2, the classic double-booking shape (two
   requests both read `status = 'available'`, both would otherwise write `status =
   'booked'`), closed with a conditional UPDATE plus a hard backstop, the
   `prevent_double_booking` GIST exclusion constraint
   (`supabase/migrations/20260328_prevent_double_booking_gist.sql`):
   ```sql
   ALTER TABLE public.availability_slots
   ADD CONSTRAINT prevent_double_booking
   EXCLUDE USING gist (
     staff_member_id WITH =,
     tstzrange(starts_at, ends_at) WITH &&
   ) WHERE (status IN ('booked', 'blocked'));
   ```
   This constraint means even if the application-level conditional UPDATE were somehow
   bypassed, Postgres itself refuses to let two overlapping time ranges exist for the
   same staff member with status booked/blocked, raising SQLSTATE `23P01`
   (exclusion_violation) that the route explicitly catches and turns into a clean 409
   with a rollback of the just-inserted booking row.

**Double-charge specifically** is a payments-domain instance of the same race
(check-then-act on "has this booking already been charged"), and the industry-standard
closure is Stripe's idempotency key mechanism: a client-supplied key on any mutating
(`POST`) request; if Stripe has seen that key before (within a 24-hour window), it
replays the SAME cached response (including a cached error) instead of re-executing the
charge, and if a second request with the same key arrives while the FIRST is still
executing, Stripe does not cache anything for either and tells the caller to retry (T1,
official Stripe docs,
[docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests)).
Stripe recommends V4 UUIDs or a key derived from a stable business-object id (e.g. the
booking id) as the key. Solen's codebase already threads idempotency-shaped logic
through `lib/bookings/charge-fee.ts`, `lib/bookings/off-session-charge.ts`,
`app/api/stripe/webhook/route.ts`, and the credit/voucher RPCs above (booking id as the
natural idempotency key for a "charge this booking once" operation); the audit
question below is whether every one of those call sites actually PASSES a Stripe
idempotency key on the Stripe API call itself, not just an application-level dedupe
check, since those are two different, complementary layers (Stripe's key stops a
literal duplicate HTTP retry from creating two PaymentIntents; the app-level ledger
check stops two DIFFERENT triggers, e.g. webhook + cron, from both trying to charge the
same booking).

**Where the real tradeoff lies.** Eliminating the check (MITRE's strongest mitigation)
usually isn't available in a booking/payments domain because "check first" IS the
product requirement (don't sell a slot twice, don't charge twice). So the real choice is
between "atomic check+use" (conditional UPDATE, exclusion constraint, advisory lock) and
"idempotency key" (make repeating the SAME logical operation safe rather than
preventing concurrent attempts). Solen already uses both, correctly layered: the GIST
constraint prevents two DIFFERENT bookings from double-claiming a slot; Stripe's
idempotency key would prevent one booking's charge attempt from being executed twice if
the SAME request got retried (e.g. a timeout that hid a successful charge from the
caller).

**Recommended default for Solen:** for every NEW write path that reads shared state and
then decides to write based on it, whether that's an INSERT (booking), an UPDATE
(balance decrement), or a Stripe charge, ask explicitly "what stops two concurrent
callers from both passing the check." If the answer is "nothing yet," that is the
finding, not a hypothetical. Cost of doing this systematically: it is genuinely easy to
miss, because the code LOOKS correct in isolation and passes every single-request test;
the bug only appears under concurrency, which is why this project's own audits kept
re-discovering it after the fact rather than at review time.

---

## 4. N+1 queries

**The question:** where Solen is exposed to the classic ORM N+1 shape, and what closes
it.

**What the evidence says.** The N+1 pattern: fetch N parent rows with one query, then
issue one additional query PER parent row to fetch its related data, for N+1 total
round trips instead of one. This is "the single most common performance problem in web
applications that use an ORM" per multiple independent write-ups (T2, converging
sources:
[appmap.io/blog/2021/02/04/eager-loading-and-the-n-plus-one-query-problem](https://appmap.io/blog/2021/02/04/eager-loading-and-the-n-plus-one-query-problem),
[scoutapm.com/blog/understanding-n1-database-queries](https://www.scoutapm.com/blog/understanding-n1-database-queries)).
The standard fix in any ORM is eager loading: ask for the related rows in the SAME query
via a JOIN, rather than lazily fetching them one parent at a time.

Solen does not use a traditional ORM; it uses PostgREST via supabase-js, and
PostgREST's answer to the same problem is resource embedding: a single `.select()` call
can request related tables through their foreign keys and PostgREST generates the join
server-side, in one query, rather than the client issuing N follow-up requests (T1,
official docs,
[docs.postgrest.org/en/v12/references/api/resource_embedding.html](https://docs.postgrest.org/en/v12/references/api/resource_embedding.html)).
This is exactly the shape used throughout the booking routes already read this session:

```ts
.select("id, user_id, ..., services(name_de, name_en, duration_minutes), staff_members(name)")
```

is one PostgREST/Postgres round trip that returns bookings with their service and
staff-member names embedded, not N+1 separate calls. This is the correct default and it
is already the dominant pattern in the code read this session (`app/api/bookings/route.ts`
GET handlers, both the salon-scoped and user-scoped branches).

**Where the actual N+1 risk lives in THIS codebase** is not the ORM-lazy-load shape (no
ORM), it's hand-written loops that call `.from()` per iteration, e.g. any future code
that does `for (const b of bookings) { await supabase.from(...).eq('id', b.something)
}`. This session did not find such a loop in the booking hot path, but it is the
pattern to grep for (`for.*of.*await.*\.from\(` or similar) whenever reviewing new code
that processes a list.

**Where the real tradeoff lies.** Resource embedding costs you: (a) PostgREST infers
TS types for embedded relations sometimes as arrays even for a to-one relation
(documented in this codebase's own comments, e.g. the `LooseSlot` type workaround in
`app/api/bookings/route.ts` line 219), so a wide embed occasionally needs a manual type
widening; (b) selecting more columns than a specific screen needs, if the embed isn't
trimmed (the codebase's own comments show at least two rounds of trimming an
over-broad `*, salons(*), services(*)` select down to only the fields actually read,
for both payload size and the "don't ship internal Stripe fields to the dashboard"
security reason). Neither cost is a reason to go back to N+1 round trips; they're
reasons to keep the embedded `.select()` explicit and narrow rather than `*`.

**Recommended default for Solen:** keep using PostgREST resource embedding for any
one-to-many or many-to-one read Solen already needs (services, staff, salon on a
booking row); never introduce a per-row loop of `.from()` calls to fetch related data
that a single embedded `.select()` could return. Cost: an explicit column list is more
typing than `select("*, related(*)")`, but this project already treats that as
required practice for a different reason (not shipping unnecessary/internal columns to
the client), so the N+1-avoidance habit and the data-minimization habit reinforce each
other here.

---

## 5. Connection pooling: the serverless killer, and why it mostly doesn't apply here

**The question:** per-invocation connections, PgBouncer transaction vs session mode,
Supabase's Supavisor, prepared-statement incompatibility, and what Solen actually does.

**What the evidence says, general mechanism (T1, applies to any serverless-plus-Postgres
stack that uses a raw driver).** Each serverless function invocation is, in the worst
case, a fresh process that opens its own TCP connection to Postgres. Postgres
connections are relatively expensive (each backend process holds real memory and
Postgres has a hard `max_connections` ceiling), so an auto-scaling fleet of serverless
invocations can open far more simultaneous connections than the database can sustain,
starving or crashing it. This is the reason connection poolers exist at all.
PgBouncer's three pool modes trade off session-state fidelity against connection
reuse density (T1, official docs,
[pgbouncer.org/config.html](https://www.pgbouncer.org/config.html)):
- **session** (PgBouncer's default): one server connection per client for the whole
  session; everything session-scoped (temp tables, prepared statements, `SET`) works
  exactly like a direct connection, but you get essentially no multiplexing benefit.
- **transaction**: a server connection is handed back to the pool the moment a
  transaction ends, so many clients can share few server connections, but "clients must
  not use any session-based features, since each transaction ends up in a different
  connection and thus gets a different session state." `server_reset_query` (default
  `DISCARD ALL`) wipes session state between transactions. Named prepared statements
  are supported since PgBouncer 1.21 via `max_prepared_statements`, but only for
  protocol-level (not SQL-level `PREPARE`) statements, and only if types don't change
  across executions (T2, corroborated by
  [crunchydata.com/blog/prepared-statements-in-transaction-mode-for-pgbouncer](https://www.crunchydata.com/blog/prepared-statements-in-transaction-mode-for-pgbouncer)).
- **statement**: even tighter; multi-statement transactions are outright disallowed.

Supabase's own pooler, Supavisor, mirrors this session/transaction split and states the
serverless recommendation explicitly: "for serverless or edge functions, which require
many transient connections," use **Supavisor transaction mode** (port 6543); direct
connections and Supavisor session mode (port 5432) are for persistent backends and
migrations (T1, official docs,
[supabase.com/docs/guides/database/connecting-to-postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)).
Supavisor's own FAQ is blunt about why session mode is dangerous for serverless
specifically: "serverless/edge functions... hoard connections for brief queries but also
aggressively open and close connections... session mode would allow the first 400
connected clients to monopolize all available direct connections, starving remaining
requests" (T1,
[supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI)).
Supavisor's own docs state transaction mode "does not support prepared statements" and
recommend disabling them client-side, i.e. the same prepared-statement incompatibility
PgBouncer has, inherited by Supabase's managed pooler.

**Solen's actual exposure: essentially none of the above, today.** Every one of
Solen's 354 API routes reads/writes through `supabase-js`'s `createServerClient`, which
talks HTTPS to Supabase's PostgREST/Supavisor edge, not a raw TCP Postgres socket held
by the Netlify function. PostgREST itself maintains its own internal connection pool to
Postgres on Supabase's managed side (outside Solen's control and outside this repo);
each Netlify function invocation makes stateless HTTP requests, and there is nothing in
this app that could exhaust `max_connections` the way a raw-driver serverless app
would. This was verified directly this session: `grep -rn "\"pg\":\|@prisma\|
DATABASE_URL" package.json app lib` returns nothing (no raw driver, no Prisma, no direct
connection string anywhere in application code). The two `DATABASE_URL` mentions that
DO exist in the repo are comments in one-off admin scripts (`scripts/ring8-kill-test.ts`,
`scripts/ring8b-kill-test.ts`) explicitly noting the ABSENCE of a raw-SQL execution
path.

**Where this becomes relevant again:** the moment anyone adds a raw `pg` client,
Prisma, or any tool that opens a literal Postgres connection from a Netlify function
(a common motivation: bypassing PostgREST for a perf-critical bulk query, or using an
ORM's migration tooling), that code MUST use Supavisor in transaction mode (port 6543),
must disable client-side prepared statements, and must not rely on session-scoped SQL
(`SET`, temp tables) surviving across statements. The Supabase MCP tooling used in this
session (`apply_migration`, `execute_sql`) and the Supabase CLI for migrations
presumably use a direct/session-mode connection outside the request path, which is the
correct place for that (T1 general guidance, per Supabase's own docs above:
direct/session mode is FOR migrations and persistent tooling, not for request-serving
code).

**Where the real tradeoff lies.** PostgREST-over-HTTPS avoids the entire connection
pooling problem class, at the cost of: (a) no client-side multi-statement transactions
(forced into the RPC pattern of §0.2/§2/§3, which is more SQL to write per atomic
operation), (b) an HTTP round trip per query instead of a kept-open socket, which is
slightly higher latency per call than a warm pooled connection would be, and (c) total
dependence on Supabase's own PostgREST/pooler capacity and its own tier limits, which
Solen does not control or see the internals of. None of these costs currently show up
as a measured problem at Solen's scale; they would be the first thing to check if
request latency or 5xx rates from `/api/**` routes start climbing with more concurrent
users.

**Recommended default for Solen:** keep everything on supabase-js/PostgREST as the
default data-access path; do not introduce a raw Postgres driver for a "just this one
query" performance win without first confirming (a) PostgREST resource embedding
genuinely cannot express the query and (b) the new code path is wired through Supavisor
transaction mode with prepared statements disabled. Cost of NOT doing this: a future
raw-driver addition done casually (e.g. copy-pasted from a tutorial that assumes a
persistent server, not serverless) is exactly the failure mode that produces the classic
"connections exhausted, site down" incident the general research above describes.

---

## 6. Deadlocks: lock ordering, detection, retry

**The question:** how Postgres handles deadlocks, and what prevents them from mattering.

**What the evidence says.** Postgres **automatically detects deadlocks** by building a
waits-for graph among blocked transactions/backends and periodically checking it for
cycles; on finding one, it aborts one of the participating transactions (the "victim")
to break the cycle, and returns SQLSTATE `40P01` (`deadlock_detected`) to the aborted
transaction's caller (T1, mechanic:
[explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html);
detection algorithm confirmed as the standard waits-for-graph approach at
[en.wikipedia.org/wiki/Two-phase_locking](https://en.wikipedia.org/wiki/Two-phase_locking),
foundational CS reference per this research's Wikipedia-for-foundations allowance). The
check runs on a timer, `deadlock_timeout` (default 1 second): a blocked backend waits
that long before Postgres bothers running the expensive cycle-detection check, on the
theory that most blocking is transient lock contention, not an actual deadlock (T1,
same source). Postgres's own serialization-failure-handling docs group `40P01` alongside
`40001` as errors an application should be prepared to retry, though `40P01` is flagged
as needing more care than an unconditional retry because "deadlock_detected... may
represent persistent errors rather than transient failures" if, say, the code always
acquires the same two locks in the same wrong order (T1,
[mvcc-serialization-failure-handling.html](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html)).

**The actual mitigation that matters more than handling the error is preventing the
deadlock shape in the first place: consistent lock ordering.** A deadlock needs a
cycle: transaction A holds lock 1 and waits for lock 2, while transaction B holds lock 2
and waits for lock 1. If every code path that ever needs to touch more than one
lockable resource always acquires them in the SAME order (e.g. always lock the
lower-UUID row first, or always take the advisory lock keyed by `booking_id` before any
row-level `FOR UPDATE` inside that function), the cycle can never form, and there is
nothing for Postgres's detector to ever need to break (T1 mechanic, standard database
systems teaching, e.g. Wikipedia's Two-Phase Locking article and the CMU database
systems course materials that independently state the same ordering rule).

**Solen's exposure at ~28 salons.** Every advisory-lock site read this session
(daily-limit trigger, credit redemption, voucher redemption, promo-code cap in
`20260714130000_promo_per_user_cap_fixes.sql`) takes exactly ONE lock per function call,
keyed by a single string (stylist+day, or booking id). A single-lock-per-transaction
pattern cannot deadlock against itself; the only way Solen could introduce a deadlock
today is a NEW function that needs to hold two DIFFERENT advisory-lock keys (or a
row lock plus an advisory lock in an order that differs between two call sites) at
once. That has not happened yet in the code read this session.

**Where the real tradeoff lies.** Enforcing lock ordering costs nothing at write time if
it's a rule everyone follows (e.g. "always take the advisory lock on `booking_id` before
touching any row inside the function"), but the cost of NOT enforcing it is invisible
until two specific code paths collide in production under real concurrency, which is
exactly the kind of bug that is nearly impossible to catch by reading one function in
isolation, only by asking "what OTHER function locks a different resource in the
opposite order."

**Recommended default for Solen:** keep the existing single-advisory-lock-per-function
discipline. The moment any new Postgres function needs to hold more than one lock
(two advisory-lock keys, or a `FOR UPDATE` across two different tables in an order that
could vary), write down an explicit, project-wide lock-acquisition order for those two
resource types before shipping it, rather than trusting "it worked in testing." Cost:
this is a design-review-time discipline, not code; it will never be caught by CI, so it
has to be a habit or a written rule an auditor can check.

---

## Decision candidates

| axis | options | when each wins | recommended for Solen | tier |
|---|---|---|---|---|
| Isolation level | Read Committed (default) / Repeatable Read / Serializable | Read Committed for nearly everything; Repeatable Read/Serializable only if you build a real retry-the-whole-request wrapper | Read Committed everywhere, no override; get atomicity from RPC + explicit locking instead | T1 |
| Concurrency control for a single-row state flip | Optimistic (conditional UPDATE + row-count check) / Pessimistic (`FOR UPDATE`, advisory lock) | Optimistic when a lost race is a legitimate "someone beat you to it, try again" outcome (slot claims); pessimistic when the correct VALUE depends on serialized reads of shared state (balances, counts) | Optimistic for slot/status flips (already shipped); pessimistic (advisory lock inside an RPC) for balance/count operations (already shipped) | T2 (mechanic) + direct repo evidence |
| Where atomicity across multiple writes lives | Multiple client-side `.from()` calls / one Postgres function via `.rpc()` | Multiple `.from()` calls are fine when each write is independently safe to fail alone; a Postgres function is required the moment two+ writes must succeed or fail together | Postgres function (RPC) for any multi-write operation that touches money, balances, or a shared cap; already the pattern for credits/vouchers/daily-limit | T1 (PostgREST is 1-request-1-transaction, no client-side transaction API) |
| N+1 avoidance | Per-row `.from()` loop / PostgREST resource embedding in one `.select()` | Embedding wins whenever the relation is expressible via a foreign key; a loop is sometimes unavoidable for logic that genuinely differs per row (rare) | Resource embedding, explicit narrow column list (not `*`) | T1 |
| Data access path | Raw Postgres driver (`pg`/Prisma) / supabase-js over PostgREST | Raw driver only for a specific, measured perf need PostgREST truly cannot express | supabase-js/PostgREST as the only path, today; if a raw driver is ever added, it MUST go through Supavisor transaction mode with prepared statements disabled | T1 |
| Deadlock handling | Rely on Postgres's detector + retry / prevent by lock ordering | Detector+retry is a real backstop but shifts correctness burden onto retry logic Solen doesn't have; ordering prevents the cycle from forming at all | Consistent single-lock-per-function discipline; write an explicit order the day any function needs 2+ locks | T1 |

---

## Myths and traps

- **MYTH: "PostgREST/Supabase gives you transactions for free across a page of
  `.from()` calls."** It does not. Each HTTP request (each `.from()`/`.rpc()` call) is
  its OWN transaction. Two sequential `.from()` writes from a Next.js route can succeed
  independently, with the second one failing after the first already committed,
  producing a half-done operation. Verified from PostgREST's own docs and an explicit
  Supabase discussion thread (§0.2). This is the single most consequential thing to
  internalize about this stack's concurrency model.
- **MYTH: "the error came back null, so the write happened."** Under Read Committed, a
  conditional `UPDATE ... WHERE <stale condition>` can return success with an empty
  result set (zero rows matched) rather than an error. Checking only `error === null`
  and not the returned row count is exactly the bug class this codebase's own "TOCTOU
  guard" comment (§2) exists to prevent. Always check the row count on a
  compare-and-swap UPDATE, never just the absence of an error.
- **MYTH: "check-then-act is fine if the check and the act are close together in the
  code."** Proximity in source code has zero bearing on whether two requests can
  interleave between them; only an atomic DB operation (conditional UPDATE, exclusion
  constraint, lock) closes the gap. This project independently re-discovered this three
  times (§3) before the pattern became a habit.
- **MYTH (stale, non-Solen-specific but worth naming): "PgBouncer/Supavisor transaction
  mode is a drop-in replacement for a direct connection."** It explicitly is not: no
  session-scoped SQL, and only limited (protocol-level, type-stable) prepared statement
  support, per both PgBouncer's and Supavisor's own docs (§5).
- **Netlify/PostgREST-specific trap:** because Solen's request-response model is a
  fresh, one-shot HTTP call to PostgREST with no retry wrapper, adopting Serializable or
  even Repeatable Read as a broad default would produce occasional, unhandled `40001`
  errors surfacing as raw 500s to end users, since nothing in the current route handlers
  catches and retries a serialization failure. If a future feature genuinely needs
  Repeatable Read/Serializable semantics, the retry loop has to be built as part of that
  feature, not assumed to already exist.
- **Stripe Connect trap:** an idempotency key stops the SAME literal request from
  double-charging on retry, but it does NOT stop two logically DIFFERENT triggers
  (e.g. a webhook handler and a cron job) from both deciding, independently, to charge
  the same booking. That is a check-then-act problem (§3) and needs the ledger-row /
  advisory-lock pattern already in use for credits and vouchers, not just a Stripe
  idempotency key.

---

## Premature at our scale

- **A generic Serializable-everywhere policy with a retry-wrapper middleware.** Correct
  at scale/high-write-contention; at ~28 salons the actual write-conflict rate on any
  single row is low enough that the targeted advisory-lock/conditional-UPDATE pattern
  Solen already uses is both cheaper to build and easier for one engineer to reason
  about than a general retry framework. Revisit when: multiple salons+staff routinely
  see visible 409 storms on a single popular slot/resource in production logs, i.e.
  there's a MEASURED contention problem, not a theoretical one.
- **Introducing a raw Postgres driver + Supavisor transaction-mode wiring "for
  performance."** Correct move once a specific PostgREST-shaped query is proven (via
  actual latency logging, not guessing) to be a bottleneck resource embedding cannot
  fix. Premature today: this session found no evidence of such a bottleneck, and adding
  a second data-access path (raw driver alongside supabase-js) is exactly the kind of
  dual-system drift the project's own CLAUDE.md rule 12 warns against.
  Revisit when: a specific route's PostgREST-generated query plan is measured (EXPLAIN
  ANALYZE) as slow and no embed/index fix closes it.
  connection-pool exhaustion monitoring/alerting on Supabase's dashboard. Correct
  practice at high request volume; premature to build a dedicated alert for something
  that, per §5, Solen's architecture structurally does not expose today. Revisit the
  moment a raw driver is introduced (see above), because THAT is the point connection
  exhaustion becomes a live risk again.
- **A dedicated distributed-lock service (Redis-based locks, etc.) for cross-request
  coordination.** Postgres advisory locks already give Solen exactly this, for free,
  inside the same transaction as the work being protected, with automatic release on
  commit/rollback. A separate lock service would add an entire new failure mode
  (lock service down / lock not released / clock skew) for no capability Solen doesn't
  already have via `pg_advisory_xact_lock`. Revisit only if a lock needs to span
  MULTIPLE Postgres transactions/round trips, which none of Solen's current locks do.

---

## Unverified

- Whether every Stripe-charging call site in `lib/bookings/charge-fee.ts`,
  `lib/bookings/off-session-charge.ts`, and the cron jobs (`pre-charge`, `no-show`)
  actually passes a Stripe `Idempotency-Key` header on the Stripe API call itself
  (as opposed to only having an application-level "already charged" ledger check).
  This session read the idempotency-KEYWORD hits in those files (via grep) but did not
  open every file to confirm the Stripe SDK call includes the header. Auditable
  directly from source, see audit questions below.
- Supabase's current exact connection/pool limits for whatever tier Solen's project is
  on (free/pro/team), and whether Solen has ever hit a Supavisor connection ceiling in
  practice. Not checked this session (would require Supabase dashboard/support access,
  not a public doc), and not needed given §5's finding that the app doesn't hold direct
  connections anyway.
- Whether any Solen cron job (`.github/workflows/cron-jobs.yml` triggering `/api/cron/*`)
  can run concurrently with itself if a previous run overruns its schedule window,
  which would be a check-then-act race at the SCHEDULING level rather than the
  database level. Not investigated this session; flagged as a related but distinct risk
  outside this topic's literal scope (isolation/locking/N+1/pooling/deadlocks).
- The exact current `deadlock_timeout` and `max_locks_per_transaction` values configured
  on Solen's live Supabase Postgres instance (defaults assumed from Postgres docs, not
  confirmed against Solen's actual `SHOW deadlock_timeout;` output this session).

---

## Sources

- [postgresql.org/docs/current/transaction-iso.html](https://www.postgresql.org/docs/current/transaction-iso.html) , official Postgres isolation-level definitions, anomaly table, write-conflict behavior, SQLSTATE 40001.
- [postgresql.org/docs/current/mvcc-serialization-failure-handling.html](https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html) , official retry guidance for 40001/40P01/23505/23P01, explicit statement that Postgres will not auto-retry.
- [postgresql.org/docs/current/explicit-locking.html](https://www.postgresql.org/docs/current/explicit-locking.html) , official table/row lock modes, `FOR UPDATE`/`FOR SHARE` semantics, deadlock auto-detection and `deadlock_timeout`, advisory lock session vs transaction scope.
- [docs.postgrest.org/en/v12/references/transactions.html](https://docs.postgrest.org/en/v12/references/transactions.html) , official confirmation that one PostgREST HTTP request equals one Postgres transaction, with rollback on failure.
- [docs.postgrest.org/en/v12/references/api/resource_embedding.html](https://docs.postgrest.org/en/v12/references/api/resource_embedding.html) , official docs on PostgREST joining related tables in one query via foreign keys (the N+1 fix in this stack).
- [supabase.com/docs/guides/database/connecting-to-postgres](https://supabase.com/docs/guides/database/connecting-to-postgres) , official Supabase connection-method table, explicit serverless recommendation (Supavisor transaction mode, port 6543), prepared-statement warning.
- [supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI](https://supabase.com/docs/guides/troubleshooting/supavisor-faq-YyP5tI) , official Supavisor FAQ, transaction vs session mode tradeoffs, why session mode is dangerous for serverless specifically.
- [pgbouncer.org/config.html](https://www.pgbouncer.org/config.html) , official PgBouncer pool_mode definitions and the explicit warning against session-based features in transaction/statement pooling.
- [docs.stripe.com/api/idempotent_requests](https://docs.stripe.com/api/idempotent_requests) , official Stripe idempotency key mechanism: 24-hour window, concurrent-request behavior, key generation guidance.
- [cwe.mitre.org/data/definitions/367.html](https://cwe.mitre.org/data/definitions/367.html) , formal CWE-367 TOCTOU definition and MITRE's ranked mitigation list.
- [en.wikipedia.org/wiki/Isolation_(database_systems)](https://en.wikipedia.org/wiki/Isolation_(database_systems)) , foundational definitions of dirty/non-repeatable/phantom read and write skew, ANSI SQL isolation table.
- [en.wikipedia.org/wiki/Two-phase_locking](https://en.wikipedia.org/wiki/Two-phase_locking) , foundational deadlock waits-for-graph detection mechanism and victim-abort resolution.
- [github.com/ept/hermitage](https://github.com/ept/hermitage) , Kleppmann's Hermitage anomaly test suite naming (G0/G1a-c/OTV/PMP/P4/G-single/G2), used here for anomaly vocabulary and to confirm Postgres Serializable is the level that closes all of them.
- [github.com/orgs/supabase/discussions/4562](https://github.com/orgs/supabase/discussions/4562) and [github.com/orgs/supabase/discussions/526](https://github.com/orgs/supabase/discussions/526) , explicit community/maintainer confirmation that supabase-js has no client-side transaction API and the RPC-function workaround is the recommended pattern.
- Direct repo grounding (not a web fetch, but load-bearing evidence): `app/api/bookings/route.ts`, `lib/supabase.ts`, `supabase/migrations/20260328_prevent_double_booking_gist.sql`, `supabase/migrations/20260710225432_audit_fix_staff_daily_limit_atomic_trigger.sql`, `supabase/migrations/20260714160410_fix_redeem_credit_voucher_advisory_lock.sql`, and a repo-wide grep confirming zero raw `pg`/Prisma/`DATABASE_URL` usage in application code.

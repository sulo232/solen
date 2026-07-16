# Background jobs & async , Solen audit 2026-07-16

## Verdict

Solen's cron fleet does the hard parts right and the easy part wrong. The at-least-once /
idempotent-consumer discipline (JOBS-01) and the deterministic pre-Stripe-call idempotency key
(JOBS-03) are both genuinely well implemented, not just in the one webhook route the research
names but copied correctly into most of the newer crons too. Bounded `.limit()` batches and
re-runnable status-column filters (JOBS-04's mitigation for GitHub Actions' best-effort schedule)
are the house style and are followed in the majority of routes. But the observability wrapper
`withCronRun` has a real, currently-live wiring gap: at least 6 of 26 crons, including every
money-adjacent one the research named by name (`no-show`, `release-payments`, `pre-charge`,
`reconcile`) plus `discovery-ai-backfill` and `process-deletions`, report their per-item failures
under a differently-named field (`declined`, `failed`, `mismatches`, `results`) that `withCronRun`
does not read, so `cron_runs.ok` stays `true` and the GitHub Actions run stays green even on a
night where every single Stripe call in that cron failed. This is exactly the dead-DLQ failure
mode JOBS-08 describes, and it is not hypothetical, it is the current, unfixed shape of the code.
Retry-with-jitter (JOBS-02) is a total, confirmed gap exactly as the research states: there is no
retry loop against an external API anywhere in this codebase, jittered or not, so there is nothing
to fix there yet, only something to build correctly the first time it is needed. Per-cron advisory
locks (JOBS-05) do not exist for any of the 26 crons, but every cron sampled is either naturally
row-idempotent (status-column re-asserts, unique DB indexes) or writes to a fully-recomputed
target, so the absence is a real but currently low-risk gap, matching the research's own framing.

## Coverage + sampling method

- Read the full `.github/workflows/cron-jobs.yml` (293 lines, all 14 job blocks) and the
  `.github/actions/ping-cron/action.yml` composite action in full. Grepped for `concurrency` across
  the whole workflow file and its git history (3 prior commits touching the file): no hit, ever.
- Read `lib/cron-run.ts` (the `withCronRun` wrapper) in full, twice, to derive the exact `ok`
  computation (`!threw && result.ok !== false && errors.length === 0`, where `errors` is built ONLY
  from `result.errors` when it is an array).
- Read all 4 explicitly-named money-adjacent cron routes in full: `no-show`, `release-payments`,
  `pre-charge`, `reconcile` (433 lines).
- Read all 3 explicitly-named data-integrity crons in full: `discovery-ai-backfill`,
  `process-deletions`, `generate-slots`.
- Read 11 more cron routes in full to build the fleet-wide return-shape table: `abandon-sweep`,
  `auto-complete`, `barber-smart-reminders` (partial, first 60 lines + grep for error handling),
  `birthday-messages` (grep only), `daily-digest`, `db-backup`, `discovery-deadcheck`,
  `loyalty-recompute`, `nail-infill-reminders` (grep only), `pending-timeout`, `rebooking-nudge`,
  `sms-reminders`, `style-affinity-recompute` (grep only), `welcome-series`. That is 17 of 26 cron
  routes opened directly (full or targeted grep on error-handling lines), the remaining 9
  (`late-cancel`, `reminders`, `review-prompt`, `release-deposits`, `salon-onboarding`) were
  confirmed only via the `withCronRun`-usage grep and their final `return {...}` line, not read in
  full body.
- Read `lib/bookings/off-session-charge.ts` in full and grepped `lib/bookings/issue-refund.ts` +
  `lib/purchases/issue-purchase-refund.ts` for `idempotencyKey` to confirm computed-before-call
  ordering (line numbers cited in the table).
- Read `app/api/stripe/webhook/route.ts` lines 1-90 plus the full grep of
  `processed_webhook_events`/`event_id` across the file, to re-confirm JOBS-01's exemplar is intact.
- Grepped the entire `lib/` tree (excluding `.test.` files) for `retry|backoff|jitter`
  case-insensitive: zero hits that are an external-API retry loop (all hits are DB
  unique-violation retry-on-23505 patterns or Stripe's own idempotency-collapse comments, which are
  a different mechanism, not a backoff loop). Confirmed no `lib/backoff.ts` / `lib/retry.ts` file
  exists via `find`.
- Grepped all 264 `supabase/migrations/*.sql` files for `pg_cron`/`cron.schedule` (2 pg_cron jobs
  found: `search-popularity-refresh`, `search-events-retention`, both nightly, both naturally
  idempotent full-recompute/anonymize jobs) and for `pg_try_advisory\|advisory_lock` (4 hits, all
  `pg_advisory_xact_lock` inside RPC function bodies for value-store concurrency, none are a
  cron-level session lock).
- Cross-checked every finding against `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` and
  `_plans/BACKEND_AUDIT_INDEX.md` before reporting it, to avoid re-reporting something already
  fixed. Confirmed the no-show re-assert guard (a 2026-07-14 HIGH finding) IS fixed in current code
  (`.eq("status","confirmed")` + row-count check present). Confirmed the `withCronRun`
  errors-wiring gap is NOT mentioned in either doc, it is a genuinely new finding from this pass.
- Did NOT query the live `cron_runs` table row count (no authenticated Supabase MCP session this
  session) or Netlify's dashboard function-duration graphs; both are flagged under Unknowns.
- Sampling is a majority, not exhaustive, of the 26 cron routes; the fleet-wide claims in the table
  below ("at least 6 of 26") are a floor, not a ceiling, since 9 routes were not read in full.

## Per-principle table

| id | rule | verdict | evidence | severity |
|---|---|---|---|---|
| JOBS-01 | Idempotent consumer over exactly-once, everywhere | MATCH | `app/api/stripe/webhook/route.ts:51-63` claim-insert on `processed_webhook_events` (PK `event_id`), duplicate insert → `23505` → no-op return; `:903-907` releases the claim (`DELETE ... WHERE event_id=`) on a thrown handler error so Stripe's retry re-runs it. No second inbound webhook route exists to check for drift (`grep -rli webhook\|callback app/api --include=route.ts` returns only `stripe/webhook` + unrelated OAuth `auth/callback` routes) | NONE |
| JOBS-02 | Jittered backoff (Full Jitter) on any in-process retry loop | GAP (nothing to fix yet, confirmed absent) | `grep -rn "retry\|backoff\|jitter" lib/ -i` (excluding tests): every hit is either a DB `23505`-unique-violation retry (`lib/referral/code.ts:53`, `lib/bookings/reference.ts:88`, `lib/barber/walkin-ticket.ts:181`) or a Stripe-idempotency-collapse comment, none is a backoff-with-sleep loop against Resend/seven.io/Gemini/TikTok. `lib/email.ts`, `lib/sms.ts`, `lib/ai-vision.ts`, `lib/ai/translate.ts` contain zero `setTimeout`/`sleep`/retry-loop constructs. No `lib/backoff.ts` or `lib/retry.ts` file exists | LOW (no live bug; a total gap the research already flagged, correctly deferred until a retry loop is actually written) |
| JOBS-03 | Deterministic idempotency key computed BEFORE the Stripe call | MATCH | `app/api/cron/pre-charge/route.ts:77` builds `pre-charge:${booking.id}:${amountRappen}` and passes it into `chargeOffSession`, which uses it at `lib/bookings/off-session-charge.ts:84` (`paymentIntents.create(piParams, { idempotencyKey })`), key built well before the call. `lib/bookings/issue-refund.ts:134` builds `refund:${source}:${id}:${staleRefunded}:${amountCents}` before the `stripe.refunds.create` call at line 189; `lib/purchases/issue-purchase-refund.ts:340`/`399` is the identical pattern for purchase refunds | NONE |
| JOBS-04 | Never assume a cron fires on schedule; bounded, re-runnable batch queries | PARTIAL | Most-sampled crons DO bound their query: `no-show`/`abandon-sweep`/`pending-timeout`/`release-deposits` all `.limit(50)`; `auto-complete`/`sms-reminders` `.limit(100)`; `review-prompt` `.limit(50)`; `discovery-ai-backfill` `.limit(10)`. But at least 3 sampled crons have NO `.limit()` at all on their main query: `rebooking-nudge` (`app/api/cron/rebooking-nudge/route.ts:40-45`, every user inactive 28+ days, unbounded), `welcome-series` (`app/api/cron/welcome-series/route.ts:48-53`, every profile created on a given date, unbounded per day-group), `discovery-deadcheck` (`app/api/cron/discovery-deadcheck/route.ts:33-38`, every published item with a `tiktok_url`, unbounded), `barber-smart-reminders` (`app/api/cron/barber-smart-reminders/route.ts:25-29` salons query has no limit, and the per-salon customer list at line 40 has no limit either) | LOW at current scale (28 salons, small user base); becomes MEDIUM as the customer/discovery-item base grows, see gap detail |
| JOBS-05 | Per-cron-name advisory lock (session-level, non-`_xact`) where side effects are not naturally row-idempotent | GAP, but low-risk (matches research's own framing) | `grep -rln "pg_try_advisory\|advisory_lock" app/api/ lib/` returns nothing; zero cron routes take any lock. Every sampled cron is nonetheless naturally idempotent by a different mechanism: status-column re-asserts (`no-show`, `abandon-sweep`, `sms-reminders`'s claim-before-send flip), a live DB unique index (`availability_slots_dedup_uniq` on `(salon_id, service_id, staff_member_id, starts_at)`, `supabase/migrations/20260703200921_gap_hunt_d3_d5_d8_hardening.sql:24-26`, makes a double `generate-slots` run collapse safely), or full-recompute-and-overwrite (`loyalty-recompute`, `style-affinity-recompute`, `db-backup`'s date-prefixed export). The only genuinely NOT-naturally-idempotent side effect found is `auto-complete`'s per-row `UPDATE` at `app/api/cron/auto-complete/route.ts:57-61`, which has no re-assert guard (`.eq("status","confirmed")` is missing from the WHERE, unlike its sibling `no-show`) and no row-count check, but a double-run of it just re-sets `status='completed'`/`completed_at` to a slightly later timestamp, no double money-movement, no double notification (auto-complete sends none) | LOW |
| JOBS-06 | Explicit `maxDuration` sized to worst-case batch latency, on any cron looping an external API call per item | GAP, confirmed live and broader than the research's opening list | `grep -n "maxDuration" app/api/cron/*/route.ts` returns exactly ONE hit: `discovery-ai-backfill` (`maxDuration = 300`). None of `sms-reminders` (up to 200 sequential `sendSMS` calls, 100+100 `.limit()`, fully serial, no concurrency cap, `app/api/cron/sms-reminders/route.ts:64-106` and `:120-162`), `barber-smart-reminders` (unbounded customers × unbounded salons, sequential `sendSMS`), `discovery-deadcheck` (unbounded items, sequential `fetch` to TikTok oEmbed with a 12s timeout each, `app/api/cron/discovery-deadcheck/route.ts:49-52`), `welcome-series`/`rebooking-nudge` (concurrency-capped at 5 via `runWithConcurrency`, but unbounded task count) declare one | MEDIUM (sms-reminders + discovery-deadcheck: unbounded-or-large serial external-call loops with no declared ceiling, worth fixing next touch; not yet an observed production timeout) |
| JOBS-07 | Order the local write / external call so a crash between them is recoverable, not double-counted (outbox-substitute discipline) | MATCH | Same evidence as JOBS-03: the idempotency key is derived from state that exists BEFORE the Stripe call, so a crash after the Stripe call but before the DB write (e.g. `pre-charge`'s `admin.from("bookings").update(...)` at line 92-100, after the `chargeOffSession` call at line 71) just means the next run's SELECT still finds the booking `payment_status='card_saved'`, retries, and Stripe's own idempotency key collapses the retry to the same charge instead of a second one. No literal outbox table exists nor is one needed at this scale | NONE |
| JOBS-08 | Fix the `errors[]` wiring gap on money-adjacent crons so per-item failures flip `cron_runs.ok` to false | GAP, CONFIRMED LIVE, the report's single most important finding | `lib/cron-run.ts:67-74`: `ok` is only flipped false by a THROWN error, an explicit `result.ok === false`, or a `result.errors` field that is an ARRAY. Four money-adjacent crons never populate `errors`: `release-payments` returns `{ released, failed, processed }` (`app/api/cron/release-payments/route.ts:64`, a night where every Stripe `capture()` call throws still returns `ok:true`); `pre-charge` returns `{ charged, declined, processed }` (`app/api/cron/pre-charge/route.ts:123`, every declined card is silently `ok:true`); `no-show` returns `{ processed, charged }` (`app/api/cron/no-show/route.ts:147`, does not even COUNT `chargeFee` failures, let alone surface them); `reconcile` returns `{ checked, checkedPurchases, skipped, mismatches, processed }` (`app/api/cron/reconcile/route.ts:424-430`, a `mismatches` array of real Stripe-vs-DB money drift never sets `ok:false`, it only reaches a human via the separate admin-email path, which itself silently no-ops if `ADMIN_EMAIL` is unset, `reconcile/route.ts:419-421`). Two more non-money crons share the exact bug: `discovery-ai-backfill` returns `{ ok: true, analyzed, failed, ... }` (`discovery-ai-backfill/route.ts:74`, `ok: true` is HARDCODED regardless of `failed` count) and `process-deletions` collects per-user failures into a `results` array (`process-deletions/route.ts:190-200, 246`) that is never renamed to `errors`, so a GDPR erasure that fails for every single due user still reports `ok:true` | HIGH (money-adjacent: silent green light on a night every Stripe call fails is a real monitoring blind spot at 28 salons, where a human is the actual safety net) |
| JOBS-09 | Do not adopt a broker/outbox/SKIP LOCKED/lock-service before its trigger condition is met | MATCH | No such system exists in the codebase (`grep -rn "SKIP LOCKED\|qstash\|amqplib\|kafkajs" package.json lib/ app/` = 0 hits outside this audit's own text). At ~28 salons with one sequential consumer per cron, none of the trigger conditions (concurrent worker pool, cross-service fan-out, high failure volume) hold | NONE |
| JOBS-10 | Verify Netlify's real sync-function timeout empirically before trusting either doc page | UNKNOWN (unchanged from research; not independently re-verified this pass) | No sleep-and-observe test was run this session (would require a deployed test route + wall-clock observation, out of scope for a read-only code/DB audit). `netlify.toml` was not re-read this pass for a functions-timeout override | N/A (see Unknowns) |

## The gaps in detail

### 1. `withCronRun`'s `errors[]` contract is silently violated by 6+ crons (JOBS-08)

**What is wrong.** `lib/cron-run.ts` only flips `cron_runs.ok` to `false` (and the HTTP status to
500, which is what `ping-cron`'s `jq -e '.ok == true'` hard-assert checks) when the handler either
throws, explicitly returns `ok: false`, or returns an `errors` field that is an ARRAY. Several
crons, including every one of the four money-adjacent crons the research asked to re-check by
name, count their per-item failures into a differently-named field instead:

```ts
// app/api/cron/release-payments/route.ts:64
return { released, failed, processed: released + failed };
// app/api/cron/pre-charge/route.ts:123
return { charged, declined, processed: charged + declined };
// app/api/cron/no-show/route.ts:147
return { processed, charged };  // failures aren't even counted
// app/api/cron/reconcile/route.ts:424-430
return { checked, checkedPurchases, skipped, mismatches, processed: checked + checkedPurchases };
// app/api/cron/discovery-ai-backfill/route.ts:74
return { ok: true, analyzed, failed, picked: items?.length ?? 0, processed: analyzed };
// app/api/cron/process-deletions/route.ts:246
return { message: `Processed ${dueUsers.length} users`, results, processed: dueUsers.length };
```

**What breaks in practice.** Picture a night where seven.io/Stripe has an outage window and every
`release-payments` capture call throws, or every `pre-charge` card is declined because the
`chargeOffSession` primitive has a bug. `failed`/`declined` climbs to the full batch size, but
`withCronRun` still computes `ok: true` (no throw, `result.ok !== false`, `errors.length === 0`
because `errors` was never populated). The GitHub Actions run stays green
(`ping-cron/action.yml`'s `jq -e '.ok == true'` passes), no email fires, and `cron_runs` shows a
row that LOOKS like a clean run. The founder's own daily-digest cron reads exactly this table
(`cron_runs.eq("ok", false)`, `daily-digest/route.ts:95-98`) to build its "cron failures" section,
so this isn't just a GitHub Actions blind spot, it is also a blind spot in the one human-facing
ops summary that exists. `reconcile`'s case is slightly better in that a real `mismatches` array
DOES trigger a separate admin email (`reconcile/route.ts:397-421`), but that email path itself
silently no-ops when `ADMIN_EMAIL` is unset (`console.warn` only, `:420`), so `reconcile` has two
independent ways to go quiet, not one.

**The concrete fix and its cost.** Rename the local counters into the `errors: string[]` shape
`withCronRun` already reads, or (cheaper, no behavior change to the counter names other code may
depend on) add one line before each `return` that maps the existing failure signal into an
`errors` array, e.g. for `release-payments`:
```ts
const errorMsgs: string[] = [];
// inside the catch block that currently does failed++:
errorMsgs.push(`booking ${booking.id}: capture failed: ${err.message}`);
// at the return:
return { released, failed, errors: errorMsgs, processed: released + failed };
```
This is a same-shape change already proven correct in 12+ other crons in this same fleet
(`abandon-sweep`, `welcome-series`, `rebooking-nudge`, `sms-reminders`, `salon-onboarding`,
`birthday-messages`, `review-prompt`, `release-deposits`, `discovery-deadcheck` all already do
exactly this, several behind a shared `capErrors()` helper). Cost: roughly 6 small diffs, each
touching only the `return` statement and adding one `errorMsgs.push()` per existing catch block.
No schema change, no migration, no behavior change to the actual money/booking logic.
`discovery-ai-backfill`'s fix is the smallest: replace the hardcoded `ok: true` with nothing (let
`withCronRun` derive it) and add `errors: capErrors(...)` from the existing `failed` accounting.

### 2. Three-plus crons loop an external API call per item with no bound and no declared `maxDuration` (JOBS-04 + JOBS-06)

**What is wrong.** `sms-reminders` runs two fully-sequential loops (no `runWithConcurrency`, unlike
its sibling notification crons) of up to 100 bookings each, calling `sendSMS` (seven.io) once per
booking, awaited in series:
```ts
// app/api/cron/sms-reminders/route.ts:91-105 (24h loop), :147-161 (1h loop, same shape)
const ok = await sendSMS(phone, `Erinnerung: ...`);
```
`barber-smart-reminders` has no `.limit()` at all on either its salons query or its per-salon
unique-customer list, and also sends SMS sequentially. `discovery-deadcheck` has no `.limit()` on
its published-items-with-a-tiktok_url query and calls TikTok's oEmbed endpoint (12s timeout) once
per item, sequentially, weekly. None of these three (nor `welcome-series`/`rebooking-nudge`, which
ARE concurrency-capped at 5 but still pull an unbounded candidate list) declare a `maxDuration`.

**What breaks in practice.** At 28 salons this is currently safe: seven.io calls are typically
sub-second, TikTok's oEmbed likewise, and daily/weekly customer volumes are small. But the design
has no ceiling: if the discovery library grows to a few thousand published TikTok-sourced looks
(a stated product direction), `discovery-deadcheck`'s single weekly run would attempt that many
sequential 12s-capable oEmbed calls with no cap, run long past any Netlify sync-function ceiling
(disputed exact number per JOBS-10, but a hard ceiling exists on every plan), and truncate
mid-batch with the tail of items never checked, silently, since a truncated serverless invocation
does not even reach the `withCronRun` catch block to log the partial state.

**The concrete fix and its cost.** Add `.limit(N)` to the three unbounded queries (bound to
whatever `maxDuration` divided by worst-observed per-item latency yields, following the same
math discovery-ai-backfill's own comment already documents: "10 looks x ~10s AI ~= under the
function limit"), and add an explicit `export const maxDuration = <N>` to each of the four
routes named above. Cost: a one-line `.limit()` addition to 3 queries plus a one-line
`maxDuration` export to 4 route files; no logic change, since all four already resume correctly
next run via their existing sent-once / claim-before-send / is_active guards, an unprocessed tail
just waits for the next scheduled tick.

## What Solen already does RIGHT (name it; a new session needs to know what NOT to "fix")

- **The `processed_webhook_events` claim-then-process pattern** (`app/api/stripe/webhook/route.ts:51-63,
  903-907`) is exactly right: atomic PK insert as the claim, release-on-throw, and it is the ONLY
  inbound webhook route in the codebase, so there is no drift to fix elsewhere yet.
- **The deterministic idempotency-key-before-Stripe-call pattern** is correctly propagated well
  beyond the original webhook, into `pre-charge`, `charge-fee.ts`, `off-session-charge.ts`,
  `issue-refund.ts`, and `issue-purchase-refund.ts`. Do not "refactor" these into a shared
  key-builder unless a real duplication bug shows up; the shape is already consistent.
- **Bounded, re-runnable batch queries with status-column filters** are the default style, not the
  exception: `no-show`, `abandon-sweep`, `pending-timeout`, `release-deposits`,
  `discovery-ai-backfill`, `review-prompt` all `.limit()` and filter on a status/flag column so a
  late or doubled GitHub Actions tick is safe. This is the correct mitigation for JOBS-04 and
  should be the template for any new cron, not something to "harden" further with extra locking.
- **`runWithConcurrency` (`lib/concurrency.ts`)** is a small, correct, deliberately-simple bounded
  worker pool used by 5 notification crons to cap concurrent email sends. It is NOT a retry/backoff
  mechanism and should not be mistaken for one; it solves a different problem (flooding the email
  provider) and solves it well.
- **`capErrors()`** (duplicated verbatim across ~9 crons, each with a "RING 3a" comment) correctly
  caps a per-item failure array at 20 entries plus a "...and N more" tail, so a systemic failure
  never floods the `cron_runs.errors` column. This is the right pattern; the fix for gap #1 above
  is to make the 6 non-conforming crons ALSO use it, not to change it.
- **`availability_slots_dedup_uniq`** (a live unique index, NULLS NOT DISTINCT, on
  `(salon_id, service_id, staff_member_id, starts_at)`) is a real DB-level backstop that makes
  `generate-slots` naturally safe under an overlapping run, exactly the kind of row-idempotency
  substitute for an advisory lock that JOBS-05 endorses as sufficient at this scale.
- **The slot-purge pg_cron job** (`purge_past_available_slots`, scheduled weekly via
  `supabase/migrations/20260711161352_backend_loop_schedule_slot_purge.sql`) confirms the team DOES
  act on a "needs scheduling" follow-up once flagged; `cron_runs`'s own missing purge (Unknowns
  below) is the same class of item, not yet urgent.
- **The no-show re-assert guard** (2026-07-14 HIGH finding) is verified FIXED in current code
  (`app/api/cron/no-show/route.ts:48-58`, re-asserts `status=confirmed` in the WHERE clause and
  checks `updatedRows.length` before proceeding). Do not re-flag this; it is closed.

## Unknowns

- **Live `cron_runs` row count.** No authenticated live-DB session was available this pass (the
  Supabase MCP connector needs owner authorization). `_plans/OPS_RUNBOOK.md:31` states ~30
  rows/day growth as of 2026-07-14 and flags a purge follow-up at ~10k rows (roughly 330 days out
  from table creation); whether that threshold is closer than assumed needs a live `SELECT
  count(*) FROM cron_runs`, which this audit could not run.
- **Netlify's actual synchronous function timeout for Solen's specific plan** (JOBS-10). Not
  independently re-verified this pass; still resting on the two-conflicting-doc-pages ambiguity the
  research already flagged. Would need a deployed test route with a controlled `sleep(N)` and an
  observed cutoff point, which is a live-deploy action outside a read-only audit's scope.
- **Real per-call latency of `sendSMS` (seven.io) and TikTok's oEmbed endpoint under production
  load.** The maxDuration risk analysis above (gap #2) assumes typical sub-second/low-second
  latency based on the discovery-ai-backfill comment's own stated math; no production timing logs
  were available to confirm seven.io's actual p50/p99 response time or how often TikTok's oEmbed
  degrades to near its 12s timeout.
- **Whether `maxDuration` has any effect at all on Netlify's `@netlify/plugin-nextjs` deployment
  model**, versus being a Vercel-specific Next.js convention that Netlify's adapter may or may not
  honor. This audit did not re-read `netlify.toml` or the plugin's current documentation to confirm
  the export is respected rather than silently ignored; if it is ignored, the JOBS-06 fix
  recommended above (add `maxDuration`) is still correct as a documented INTENT but would need a
  different, Netlify-native mechanism (e.g. Netlify's own function `config.timeout` in a
  `netlify/functions` context, not applicable here since these are Next.js route handlers) to
  actually enforce the ceiling.
- **The remaining 9 of 26 cron routes** (`late-cancel`, `reminders`, `review-prompt`,
  `release-deposits`, `salon-onboarding`) were confirmed only via their final `return` line and the
  `withCronRun` usage grep, not read in full. `late-cancel` and `reminders` are known-retired
  stubs (`return { processed: 0, retired: true }`, and the workflow comment "removed 2026-06-03,
  deprecated no-op"), so they carry no real risk, but `review-prompt`, `release-deposits`, and
  `salon-onboarding` were not verified in full for the same `errors[]`-wiring question this report
  raises for the other crons; they DO appear (per the return-line grep) to already use
  `capErrors(errorMsgs)` correctly, but that was not confirmed by reading their full per-item catch
  blocks the way the six flagged crons were.

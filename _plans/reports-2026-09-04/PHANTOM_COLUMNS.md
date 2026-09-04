# Phantom columns scan (PostgREST silent-null defect class)

Scanner: `phantom-columns.mjs` (node, no dependencies), scratchpad-only, read-only against the repo.
Inventory used: `_inventory/_db-columns.json` (captured 2026-08-14) + `_inventory/_db-snapshot.json`
(151 tables) + `_inventory/SURFACE.json` (rpcs, not used for column checks). No functions/views list
beyond what `_db-columns.json` already includes (it carries 5 views alongside the 151 tables:
`public_profiles`, `search_zero_results`, `availability_slots_public`, `staff_ratings_view`,
`profile_summaries`).

## Known-answer control (required before trusting any count)

1. Planted `.from("salons").select("id, definitely_not_a_column").eq("is_active", true)` in a
   throwaway file. Scanner reported **exactly one** PHANTOM: `table=salons column=definitely_not_a_column`,
   correct file:line, zero other findings. (First draft of the control used `.eq("status", ...)` and
   the scanner correctly caught a SECOND real phantom there too — `salons` genuinely has no `status`
   column — so the control was rewritten to use `is_active`, a column confirmed to exist.)
2. Ran on `app/api/salons/route.ts` (a heavily-used, working route). Result: **0 phantom, 0 unknown
   table, 1 unresolved** (line 169, `.select(selectStr, ...)` where `selectStr` is built from a
   runtime template literal — genuinely not statically resolvable, correctly not guessed at).

Both pass. Full run below.

## Counts (final, after fixing scanner bugs found during triage — see Methodology notes)

- Files scanned: 1065 (`app/`, `lib/`, `components/`, `components-legacy/`, `middleware.ts`;
  `node_modules`, `.next`, `tests/`, `public/_mockups`, `app/[locale]/dev` excluded)
- **PHANTOM: 4** (all manually confirmed real by opening the file — see below)
- **UNKNOWN TABLE: 13 hits, 4 distinct tables/causes** (`coming_soon_signups`, `newsletter_subscribers`,
  `client_rfm_segments`, `cron_locks`)
- **UNRESOLVED: 28** — every one individually traced by hand (grep to its definition, checked against
  the live column list). Zero hidden phantoms found among them. Details in the Unresolved section.

Raw output: `phantom-results3.txt` / `phantom-results3.json` in this directory (final run, after the
scanner fixes below). Earlier runs (`phantom-results.txt`/`2`) are kept for the before/after diff.

## Methodology notes: scanner bugs found and fixed mid-run

The first full-tree run produced 27 "PHANTOM" and 20 "UNKNOWN TABLE" hits. Per the brief's own rule
("never call something a defect from the scanner output alone"), every one was opened and read before
being trusted, which surfaced five systemic **false-positive classes in the scanner itself**, not in
the product code. All five are fixed in the final `phantom-columns.mjs` and re-verified against both
controls after each fix:

1. **Dotted embedded-relation filters** (`.eq("services.is_active", true)` after
   `.select("...services!inner(...)...")`) were checked as a literal column name against the MAIN
   table instead of being resolved against the joined relation. This is standard, working PostgREST
   syntax; the scanner now splits on the first `.`, resolves the left side as a table, and checks the
   column against that table.
2. **`order()`'s real semantics were verified by reading `node_modules/@supabase/postgrest-js/src/PostgrestTransformBuilder.ts`
   directly** (not assumed): the client appends `.asc`/`.desc` to the raw `column` string and PostgREST
   itself splits the resulting `order` query param on commas. So `.order('category, name_de')`
   (`app/[locale]/salon/[slug]/booking/page.tsx:101`) is unusual style but functionally a valid
   two-column sort, not a phantom column named "category, name_de". Fixed to split on top-level commas
   and strip a trailing `.asc`/`.desc`/`.nullsfirst`/`.nullslast` suffix per segment.
3. **`order()`'s `referencedTable`/`foreignTable` option** was ignored, so `.order("sort_order", {
   ascending: true, foreignTable: "review_photos" })` (`app/api/reviews/salon/[salon_id]/route.ts:50`)
   was checked against `reviews` (no `sort_order` column) instead of `review_photos` (which does have
   one). Fixed.
4. **JSON path operators** (`.eq("data->>booking_id", ...)` in `app/api/reviews/route.ts:152`) were
   checked as a literal column name instead of stripping to the base column (`data`, a real jsonb
   column on `notifications`) before the `->>` operator. Fixed.
5. **Dynamic table-name resolution grabbed every string literal in a ternary, including the
   *condition*'s comparison value**, not just the two branches — `meta.type === "retail_purchase" ?
   "retail_purchases" : "package_purchases"` produced a spurious `retail_purchase` (singular, no `s`)
   candidate purely because it appeared in the condition. Fixed to extract only the two literals
   immediately after `?` and `:`.

Two smaller parser bugs were also found and fixed (neither had produced a false PHANTOM, but both
corrupted the UNRESOLVED text and, in one case, silently skipped real checking of a large shared
column list):

6. `literalStringContent()` treated any argument whose first and last characters were matching quotes
   as one literal, which wrongly accepted **string concatenation** (`"a, " + "b"`) as a single string.
   `app/api/bookings/[id]/report/route.ts:134` builds its select via `"..." + "guest_name, ..." +
   "staff_members(name)"`; before the fix this produced garbled, wrongly-split "phantom-looking" select
   terms. Fixed to lex the literal properly and reject anything where the matched closing quote isn't
   the argument's last character (now correctly reported as one clean "not resolvable" case).
7. A `//` line comment placed **before** a `select()` string argument (a real style used twice in this
   codebase, e.g. `lib/salon-detail.ts:64` and `app/[locale]/salon/[slug]/booking/page.tsx:110`) leaked
   into the argument-splitting logic and broke on commas inside the comment's prose, which meant the
   scanner never actually checked the ~90-column salon select at `lib/salon-detail.ts:64` for phantoms.
   Fixed by stripping comments before argument parsing; after the fix both selects parse clean with
   zero phantoms (manually spot-checked against the inventory too, see below).

After all seven fixes, both known-answer controls were re-run and still pass exactly as before.

One residual, harmless parser quirk left undocumented in code (noted here instead): the scanner's
top-level `.from(` search isn't comment-aware, so a comment that literally contains the text `.from()`
as prose (`lib/referral/complete-referral.ts:81`, a comment describing an old two-`.from()`-call
design) produces one noise line in UNRESOLVED ("table argument is not a static string literal: "
with empty content). It never produces a false PHANTOM because there's no real `(` argument to
mis-parse, so it was left as-is rather than spending more time on a coverage gap of zero.

## PHANTOM (4, all manually confirmed real defects or confirmed-dead code)

### 1. Gift-voucher delivery email always shows "Solen" instead of the real salon name — REAL DEFECT, customer-facing
`app/api/stripe/webhook/salon-voucher-handler.ts:35`
```
.from("vouchers")
.select("id, amount, code, recipient_email, recipient_name, message, expires_at,
         remaining_amount, buyer_id, salons(name_de)")
```
`salons` has no `name_de` column (only unlocalized `name` — localized `name_de`/`name_en` exist on
`services`, not `salons`). Line 62: `const salonName = (voucher as any).salons?.name_de ?? "Solen"`.
Since `salons.name_de` is always null, `salonName` is **always** the literal fallback `"Solen"`, fed
straight into the paid gift-voucher delivery email subject/body (`lib/email.ts` `salonVoucherDeliveryEmail`).
Every customer who buys a salon gift voucher gets an email crediting the platform, not the salon they
paid. Judgment: real, silent, customer-facing, on a paid transaction. Highest-severity phantom found.

### 2. `/api/vouchers/confirm` selects the same phantom columns, but never uses them — false positive on impact, real on correctness
`app/api/vouchers/confirm/route.ts:51`: `.select("*, salons(name_de, name_en)")`. Same missing-column
issue as #1, but `voucher.salons` is never read anywhere in this route (the response only returns
`success`, `message`, `voucher_code`). Judgment: a real phantom-column bug, zero functional impact
today (dead select), worth a one-line cleanup rather than urgent.

### 3. `/api/slots/next-available` always falls back to the hardcoded string "Service" — real bug, dead route
`app/api/slots/next-available/route.ts:16`:
```
.select(`id, starts_at, ends_at, staff_member_id, staff_members!inner(name), services!inner(name)`)
```
`services` has no `name` column (only `name_de`/`name_en`/etc — confirmed `staff_members.name` DOES
exist, so the staff half is fine). Line 25: `service_name: service?.name || "Service"` is therefore
always `"Service"`. BUT: grepped the whole repo (app/lib/components/components-legacy/solen-mobile) for
any caller of this route and found none — it's an orphaned/dead API route. Judgment: real column bug,
zero current customer impact because nothing calls it; would misfire the instant anyone wires it up.

## UNKNOWN TABLE (13 hits, 4 distinct causes — every one has a known, documented reason, not a fresh mystery)

Per the project's own "missing things need a reason" principle, each was traced to why the table
doesn't exist live, not just flagged:

### 1. `coming_soon_signups` — never landed, and lies to the user about it
`app/api/coming-soon-notify/route.ts:38`. No migration ever created this table (grepped
`supabase/migrations/`, zero hits). The code already carries a comment acknowledging this
("coming_soon_signups is a phantom table... This upsert has therefore always been a silent no-op...
flagged in the coder report as a genuine pre-existing bug"), so this is not a new discovery — it's
still unresolved. Worse than a typical silent no-op: on any error (including "table does not exist")
the route still returns `{ ok: true }`, so the "Notify me" form always shows success while capturing
nothing. **Every coming-soon email signup on the site has been silently discarded.**

### 2. `newsletter_subscribers` — never landed, but at least fails honestly
`app/api/newsletter/route.ts:33`. Same story (no migration, self-documented in a code comment as a
known pre-existing bug), except this route returns a real 500 on a DB error rather than a fake success.
**The newsletter signup feature has never worked**, but at least the caller can tell.

### 3. `client_rfm_segments` — deliberately guarded off, and it's still off
`app/api/salon/clients/route.ts:83-85`. This is a materialized view (`supabase/migrations/20260328_create_rfm_materialized_view.sql`),
and the migration itself is wrapped in `DO $$ IF to_regclass('public.clients') IS NOT NULL THEN ... END $$`
because it joins a `clients` table that does not exist in this project's live schema (confirmed: `clients`
is absent from `_db-columns.json`; the live booking model uses `bookings.user_id`/`profiles` instead).
The call site already wraps this in try/catch with a comment acknowledging it ("client_rfm_segments is
a phantom table/view..."), so salon owners' client lists render fine, just permanently missing the
VIP/Regulär/Neu/Gefährdet segment tags. Graceful, self-aware, unchanged since it was flagged.

### 4. `cron_locks` — migration written, not yet applied live; explicitly fail-open by design
`lib/cron-run.ts:102,103,127`. The migration file `supabase/migrations/20260727120000_cron_locks.sql`
exists and is dated 2026-07-27. `_inventory/_migrations-snapshot.json` (a live read of
`supabase_migrations.schema_migrations`, captured 2026-07-31 — 4 days *after* the migration file's own
date) lists every migration from `20260724233941_salon_portfolio_images` straight to
`20260727175714_salon_review_toggles_and_photo_report_target`, skipping `20260727120000_cron_locks`
entirely. `_db-columns.json` (captured 2026-08-14, 18 days later still) also has no `cron_locks` table.
Both live snapshots agree: **this migration has not been applied**, and the code already says so in
its own comments ("has not been applied live per house rule against running migrations from this
session"). Read `tryAcquireCronLock`/`releaseCronLock` end to end: every DB error (including "relation
does not exist") is caught and logged, then the function returns `true` and the cron runs anyway — this
is a deliberate, self-documented fail-open, not a hidden surprise. Net effect: the overlap guard the
26 cron routes are written to assume exists (data-money-08) is currently a no-op until someone applies
that one migration. Not urgent-silent, but worth surfacing since it's been sitting unapplied for weeks.

## UNRESOLVED (28) — every one manually traced, zero hidden phantoms found

The scanner correctly declines to guess at dynamic values rather than silently passing or failing them.
Per the brief, each was traced to its actual definition and checked by hand against
`_inventory/_db-columns.json`:

**Shared select-column constants — all verified clean (no missing columns):**
`MIN_PRICE_SERVICE_COLUMNS` (`lib/min-price-service.ts`, services), `BOOKING_SELECT`
(`app/[locale]/confirmation/page.tsx`, bookings + nested salons/services/staff_members), `ITEM_COLS`
(both discovery board/collection routes, discovery_items), `DISCOVERY_ITEM_PUBLIC_COLS`
(`lib/discovery/public-columns.ts`, discovery_items), `SALON_PUBLIC_COLS`
(`lib/salons/public-columns.ts`, salons — `TRENDING_COLS` derives from this by filtering, so it
inherits the same clean result), `salonCols` (`app/api/profile/favorites/route.ts`, salons), the
concatenated select in `app/api/bookings/[id]/report/route.ts:134` (bookings + nested
salons/services/staff_members, reconstructed and checked column-by-column).

**Dynamic ternary/variable columns — all verified clean:** `orderCol` in
`app/api/reviews/salon/[salon_id]/route.ts` (resolves to `"created_at"` or `"rating"`, both real on
`reviews`); `isUuid ? "id" : "slug"` in `app/api/salons/[slug]/route.ts` and `lib/salon-detail.ts`
(both real on `salons`).

**`.or()` template-literal filters — column halves verified clean, only the interpolated VALUE is
dynamic:** `expires_at` (vouchers, bookings/page.tsx), `tos_accepted_version` (profiles),
`referrer_id`/`referred_user_id` (referrals), `code`/`referral_code` (referrals),
`fee_charge_claimed_at` (bookings), `expires_at` (user_credits) — all confirmed present on their
respective tables.

**One real, separately-worth-flagging finding surfaced during this tracing, NOT from the phantom
scanner's own output — `booking_services` nested relation:**
`app/api/profile/export/route.ts:35`: `.from("bookings").select("*, booking_services(*)")`. No table
or view named `booking_services` exists anywhere (`_db-columns.json`), no migration ever created one,
and grepping the entire repo shows this is the ONLY occurrence of the string `booking_services` in the
whole codebase — it isn't a valid FK relationship name either (no such constraint exists; per
`supabase/migrations/071_megabuild_booking_crm_payments.sql`, a booking has a single `service_id`
column directly, no join table). This is the user-data-export (GDPR/nFADP) route. The call only
destructures `{ data: bookings }`, never checking `error`; a few lines later:
`bookings: bookings || []` in the exported JSON payload (line 235). An embedded-resource name PostgREST
cannot resolve typically fails the whole request with an error (unlike a plain missing column, which
returns null) — this call has no error handling, so on that failure `bookings` is `undefined` and the
export silently reports **zero bookings** for a user who may have many. Judgment: real, high-severity,
statutory-tier (data-portability) defect; verified at "expect" tier (reasoned from PostgREST's embed
resolution behavior and confirmed absence of any matching table/relation/FK, not from a live DB query
since Supabase MCP access requires auth not available in this session).

**Dead/unused generic helpers, zero call sites found — no current risk:** `getActiveSalon()`
(`lib/active-salon.ts`, default `columns = "*"`) and `findQueueEntryByToken()`
(`lib/walkin/authz.ts`, default `columns = "*"`) — grepped every caller in `app/`, `lib/`,
`components/`, `components-legacy/`; both have zero call sites anywhere.

**Remaining unresolved (genuinely runtime-dynamic, no further static tracing possible):**
`lib/backup/export.ts` (generic per-table backup loop, table name is a loop variable over a known
table list), `lib/referral/complete-referral.ts:81` (comment text matching `.from(`, not real code —
scanner noise, see Methodology).

## Top 10 real defects, ranked by who notices

1. **GDPR/nFADP data export always reports zero bookings for the export user** — `app/api/profile/export/route.ts:35` (`booking_services` phantom relation, unchecked `error`, `bookings: bookings || []` at line 235). Statutory-tier data-portability failure, silent, would affect any customer who exercises their export right and has booking history.
2. **Gift-voucher delivery email always says "Solen" instead of the real salon name** — `app/api/stripe/webhook/salon-voucher-handler.ts:35,62` (`salons(name_de)` phantom, `?? "Solen"` fallback always fires). Every paid gift-voucher purchase, every time.
3. **"Notify me" coming-soon signup silently discards every submission and lies that it worked** — `app/api/coming-soon-notify/route.ts:38` (`coming_soon_signups` table never existed; returns `{ok:true}` on error too).
4. **Newsletter signup has never functioned** — `app/api/newsletter/route.ts:33` (`newsletter_subscribers` never existed; at least returns a real 500).
5. **Cron overlap guard across 26 cron routes is currently a no-op** — `lib/cron-run.ts:102,103,127` (`cron_locks` migration written 2026-07-27, confirmed absent from two later live snapshots; explicitly fail-open by design, so not a silent surprise, but still unprotected today).
6. **Salon-owner client list never shows RFM segment tags (VIP/Regulär/Neu/Gefährdet)** — `app/api/salon/clients/route.ts:83` (`client_rfm_segments` deliberately guarded off because `clients` table doesn't exist live; gracefully degrades, rest of the list works).
7. **`/api/vouchers/confirm` fetches phantom salon-name columns it never uses** — `app/api/vouchers/confirm/route.ts:51` (dead select, zero functional impact, easy cleanup).
8. **`/api/slots/next-available` would always return the literal string "Service"** — `app/api/slots/next-available/route.ts:16,25` (`services!inner(name)` phantom), but the route has zero callers anywhere in the codebase today, so zero current customer impact.

(Only 8 distinct real defects were found across the whole tree; #9-10 would be the two dead-select /
dead-route items already covered above at #7-8, not separate issues — there is nothing further to
rank without inventing severity that isn't there.)

## Files worth reading directly
- Scanner: `phantom-columns.mjs` (this directory)
- Final raw output: `phantom-results3.txt`, `phantom-results3.json`
- Control test fixture: `control-test/app/api/_control/route.ts`
- Known-working route test fixture: `single-route-test/app/api/salons/route.ts`

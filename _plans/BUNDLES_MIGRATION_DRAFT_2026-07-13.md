# A5 / Workstream #19 , A-1 migration DRAFT + probe reconciliation (2026-07-13)

STATUS: PROBE + PREPARE only. NOTHING was applied to the DB in this pass. Applying any
migration is an owner-gated fork (never `supabase db push`/`reset`; additive idempotent
`apply_migration` MCP only). This file is a DRAFT for owner review.

Scope: the FIRST step of the plan only , A-0 probes + the A-1 (PRODUCTS) migration that the
plan gates on the live `nail_retail_products.category` CHECK. B-1 (bundles) is out of this pass.

---

## 1. What the A-1 migration WOULD change, and what it depends on

Per `_plans/BUNDLES_PRODUCTS.md` v2, A-1 has two additive parts, both depending on the LIVE
shape of `nail_retail_products` and `retail_purchases` (NOT the migration files, which drift):

1. Widen `nail_retail_products.category` CHECK from the 072 nail-only set to a general union.
   - Depends on: the live CHECK constraint on `public.nail_retail_products` (name + value list).
   - 072 defined it INLINE and UNNAMED: `category TEXT CHECK (category IN
     ('cuticle_oil','hand_cream','press_on','nail_kit','polish','other'))`
     (supabase/migrations/072_nail_foundation.sql:148). Postgres auto-names an unnamed
     table CHECK `<table>_<column>_check`, i.e. `nail_retail_products_category_check`.
2. Add `retail_purchases.vat_amount / net_amount / vat_rate` IF the probe shows them missing.
   - Depends on: the live column set of `public.retail_purchases`.

---

## 2. Probe results (READ-ONLY, 2026-07-13)

Channel: service-role key from `/Users/sulo/Documents/solen/.env.local` via `@supabase/supabase-js`
(PostgREST). No write / insert / delete performed. Secrets never printed.

| probe | result |
|---|---|
| A-0 #2: `SELECT DISTINCT category FROM nail_retail_products` | 7 live rows. Categories present: `other, cuticle_oil, hair_care, styling, hand_cream, nail_kit, polish`. **`hair_care` + `styling` are NON-nail values.** |
| A-0 #3: `retail_purchases` VAT columns | `select id,vat_amount,vat_rate,net_amount,paid_amount,refunded_amount` returned HTTP 200 (0 rows). **All three VAT columns EXIST live.** Also present in the 2026-07-06 inventory snapshot. |
| product drift cols | `stock_count`, `low_stock_threshold` returned on select. **Both exist live** (the out-of-band drift the plan flagged). |
| A-0 #1: `pg_constraint` / `information_schema` def | NOT reachable via the service-key/REST path (PGRST106 "Invalid schema: information_schema"). No `psql`, no `pg` node module on this machine. So the exact `conname` + full value list COULD NOT be read through the sanctioned channel. |

Inventory files (`_inventory/_db-snapshot.json`, `_inventory/_db-columns.json`) carry table
name/rows/rls and column NAMES only. They hold NO constraint detail, so the snapshot alone
cannot answer A-0 #1. That is why the live probe above was run.

---

## 3. Reconciliation vs plan v2 (rule 18)

Plan v2 ASSUMES (A-0/A-1 left unchecked `[ ]`): the live CHECK is UNKNOWN / possibly still the
072 nail-only set, and the VAT columns may be MISSING. Both need probing before a migration.

LIVE REALITY:
- The live CHECK **already permits the general categories.** A nail-only CHECK would have
  REJECTED an insert of `category='hair_care'` or `'styling'`; those rows EXIST, so the live
  constraint must already allow them. Corroborated by the repo mirror header of
  `supabase/migrations/20260703090000_retail_generalize_a5.sql` ("applied live via MCP
  apply_migration 'retail_generalize_a5' 2026-07-03") and the in-lockstep Zod enum
  (`lib/validations.ts:498-502`, 13-value union).
- The VAT columns **already exist.** The A-1 "add if missing" branch is a NO-OP.

VERDICT: **Drift YES, but already reconciled, in the safe direction.** The A-1 migration the
plan wanted to write has ALREADY BEEN APPLIED (2026-07-03). No schema change is actually
required today. The only live "drift" is documentation/tracking: plan A-0 and A-1 are still
`[ ]` but the work is done , they should be `[x]`. All 7 live category values fall inside the
widened 13-value set, so live data is consistent with the applied constraint.

RESIDUAL UNKNOWN: the exact live `conname` and full value list could not be read read-only via
REST. `conname` is INFERRED as `nail_retail_products_category_check` (Postgres auto-name of the
unnamed 072 CHECK; the applied migration targets exactly this name). 100% confirmation needs one
owner-gated read (below).

---

## 4. DRAFT SQL (idempotent, re-assertable) , NOT APPLIED

Since section 3 shows A-1 is already live, this is a safety MIRROR of the applied migration, safe
to re-run. It matches `supabase/migrations/20260703090000_retail_generalize_a5.sql`. Do NOT add a
new migration file duplicating that one (rule 12); this block exists for owner review only.

```sql
-- Part 2 (VAT columns): PURE ADDITIVE, honors "no drops", already a no-op on live.
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS vat_amount integer;
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS net_amount integer;
ALTER TABLE public.retail_purchases ADD COLUMN IF NOT EXISTS vat_rate  numeric(5,2);

-- Part 1 (CHECK widen): ALREADY APPLIED LIVE. Re-assert form only. FLAG: widening a CHECK is
-- only expressible as DROP + ADD; this is a CONSTRAINT (metadata) drop, NOT a table/column/data
-- drop, and it is data-safe because the new set is a strict SUPERSET (every live row still
-- passes). It technically deviates from the literal "no drops" guardrail, so it is surfaced here
-- for an explicit owner call rather than run silently (rule 10). RECOMMENDATION: do NOT re-run
-- this; instead run the read-only VERIFY in the checklist , applying it is a no-op.
ALTER TABLE public.nail_retail_products
  DROP CONSTRAINT IF EXISTS nail_retail_products_category_check;
ALTER TABLE public.nail_retail_products
  ADD  CONSTRAINT nail_retail_products_category_check
  CHECK (category = ANY (ARRAY[
    'cuticle_oil','hand_cream','press_on','nail_kit','polish','other',
    'care','styling','tools','accessories',
    'hair_care','skin_care','nails'
  ]::text[]));
```

---

## 5. Apply checklist (3 lines) , owner-gated, do NOT auto-run

1. VERIFY first (read-only, owner runs via MCP `execute_sql`): `SELECT conname,
   pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.nail_retail_products'::regclass
   AND contype='c';` , confirm the def already lists the 13 values above.
2. If confirmed present (expected): APPLY NOTHING. Tick plan A-0 + A-1 to `[x]`; this pass is closed.
3. Only if the verify shows the CHECK is somehow narrower than the live data (it cannot be, given
   the hair_care/styling rows): apply Part 1 via `apply_migration` MCP as a fix, then refresh
   `_inventory/_db-snapshot.json` + `_db-columns.json` and run `npm run inventory`.
```

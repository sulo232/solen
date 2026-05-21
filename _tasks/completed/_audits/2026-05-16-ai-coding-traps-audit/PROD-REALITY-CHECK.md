# Prod-Reality Check vs Migration-File Audit
Date: 2026-05-16
Source: live queries against `tocfnsmxmdxkrcmjzzdw` (prod) after the file-based audit completed.

## Headline

The original slice `5d-rls-security-tests.md` was built from **migration files in the repo**, not from prod state. Cross-checking against the actual prod schema revealed substantial drift:

- Repo has **125 migration files**.
- Prod has **42 tables**.
- The **7 "RLS catastrophe" tables** from 5D — `inventory`, `sms_reminders`, `staff_calendars`, `addons`, `salon_photos`, `staff_invites`, `gift_cards` — **DO NOT EXIST in prod**. None of them. The migrations that create them were never applied.

So:
- The "7 RLS catastrophes" in slice 5D are not real prod risks (no table = no policy = no exploit surface).
- The migration written at `supabase/migrations/20260516_fix_rls_catastrophes.sql` is a no-op against current prod (would error on first `DROP POLICY ... ON public.inventory`).
- The route handlers I updated in lockstep (`accept-invite`, `gift-cards/redeem`, `gift-cards/balance`) point at tables that don't exist in prod. **Every call to these routes is silently failing in prod.** Either users never hit them, or they get opaque DB errors.

## What IS real in prod (NEW findings, NOT in the original audit)

### 1. 16 tables have RLS DISABLED in prod

```
customer_segment_members          (RLS off, 0 policies, anon SELECT granted)
customer_segments                 (RLS off, 0 policies, anon SELECT granted)
discovery_board_pins              (RLS off, 0 policies, anon SELECT granted)
discovery_boards                  (RLS off, 0 policies, anon SELECT granted)
discovery_collections             (RLS off, 0 policies, anon SELECT granted)
discovery_comments                (RLS off, 0 policies, anon SELECT granted)
discovery_interactions            (RLS off, 0 policies, anon SELECT granted)
discovery_items                   (RLS off, 0 policies, anon SELECT granted)
discovery_likes                   (RLS off, 0 policies, anon SELECT granted)
discovery_product_recommendations (RLS off, 0 policies, anon SELECT granted)
discovery_products                (RLS off, 0 policies, anon SELECT granted)
discovery_saves                   (RLS off, 0 policies, anon SELECT granted)
discovery_staging                 (RLS off, 0 policies, anon SELECT granted)
platform_stats                    (RLS off, 0 policies, anon SELECT granted)
test_table                        (RLS off, 0 policies, anon SELECT granted)
waitlist                          (RLS off, 0 policies, anon SELECT granted)
```

**Impact:** anyone with the public anon key (which ships in the browser bundle) can SELECT * from every row of every table above. INSERT/UPDATE/DELETE are NOT granted to anon, so this is "everyone can read everything" not "everyone can write anything."

**Severity:** HIGH but not CRITICAL — read-only exposure of behavior tracking + content data, no direct PII (waitlist uses user_id UUID not email).

**Sensitive content per table:**
- `discovery_*` (13 tables) — public anyway in the app (it's a public discovery feed), so read-exposure may be tolerable
- `customer_segments`, `customer_segment_members` — internal marketing data, should be private
- `platform_stats` — internal analytics, should be private
- `test_table` — orphan, drop it
- `waitlist` — has `user_id`, `salon_id`, `service_id`, dates. Behavior-tracking risk; not direct PII

**Fix scope:** ENABLE RLS on each + add scoped policies. Discovery tables likely want `FOR SELECT USING (true)` (public-readable by design) but `WITH CHECK` clauses on writes. `platform_stats` should be admin/service-role only. `customer_segments` should be salon-owner scoped. `waitlist` should be owner-scoped read.

### 2. 8 tables have `USING(true)` SELECT-only policies in prod

```
availability_slots   .slots_select_public        (FOR SELECT USING (true))
cities               .Cities are publicly readable (FOR SELECT USING (true))
feature_flags        .feature_flags_select_public (FOR SELECT USING (true))
reviews              .reviews_select_public      (FOR SELECT USING (true))
salon_badges         .Anyone can read badges     (FOR SELECT USING (true))
salon_directory      .salon_directory_select_public (FOR SELECT USING (true))
search_embeddings    .search_embeddings_select_public (FOR SELECT USING (true))
site_content         .site_content_read_public   (FOR SELECT USING (true))
```

These are SELECT-only public-readable — intentional for the app to function. The dangerous pattern from the audit was `INSERT/UPDATE/DELETE USING(true)` which lets anyone MUTATE data. **None of those exist in prod.**

`search_embeddings` is the one to double-check: if it contains user-derived embeddings (search queries with user context), public read could leak interest profiles. Worth verifying with a single query of the table content.

## What the original audit was based on

The audit agents enumerated `CREATE POLICY` statements in `supabase/migrations/*.sql` files. They didn't validate against the live DB. So findings like "286 RLS policies across 110 unique tables" were repo-file counts, not prod-state counts.

This means **other audit slices (1A/1B/3A/3D especially) may also be partially based on dead-code paths**. For example, the 117 findings in `1b-ignored-db-errors.md` likely include many on tables/routes that don't exist in prod.

## Recommendation

1. **Skip the migration-file-based "RLS catastrophes" fix** — there's nothing to fix in prod for those 7 tables.
2. **Plan a dedicated RLS sprint** to:
   - Enable RLS on the 16 currently-unprotected tables
   - Add scoped policies per table intent
   - This touches 20+ route handlers (discovery feature) — needs careful staging
3. **Drop `test_table`** (orphan).
4. **Re-audit other slices against prod schema** before treating their findings as authoritative.
5. **Decide schema strategy**: do the 80+ unapplied migrations get applied, get deleted, or stay as historical record? The dog-grooming pivot affects this — beauty-specific tables probably never get applied.

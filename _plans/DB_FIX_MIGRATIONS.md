# DB / RLS fixes for the audit CRITICALs — OWNER APPLIES (do not auto-run)

These are prod-DB writes (RLS policies + columns + a function) = owner-decision boundary. I did NOT apply them. Three are already-authored statements that DRIFTED out of the live DB (the migration files exist but live ≠ file); two need design review. Apply via Supabase `apply_migration` (idempotent) after reading, and **verify live with `pg_policies` / `information_schema` afterward — not by re-reading the migration file** (that's exactly how this drift went unnoticed).

---

## 1. READY — Reviews INSERT policy (fixes: anyone can post fake reviews) — REVIEWS C1
Live `reviews_insert_own` only checks `auth.uid() = user_id` (no completed-booking requirement). Re-apply the intended policy from `061_fix_review_inserts.sql` (verbatim, already in-repo):
```sql
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "Public can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can insert reviews after booking" ON public.reviews;
CREATE POLICY "Users can insert reviews after booking"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (SELECT 1 FROM public.bookings b
              WHERE b.user_id = auth.uid() AND b.salon_id = reviews.salon_id
              AND b.status IN ('confirmed','completed'))
      OR source = 'google'
    )
  );
```
Note: walk-in reviews (booking_id NULL) come through the service-role route, which bypasses RLS, so they're unaffected. Verify after: `select policyname, cmd, with_check from pg_policies where tablename='reviews';`

## 2. READY — Review moderation columns (fixes: every flag/hide 500s) — REVIEWS C2/C3
Live `reviews` has no `moderation_status`/`removal_reason` (migration 060 was never applied). Apply `060_review_moderation_status.sql` verbatim:
```sql
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT NOT NULL DEFAULT 'active'
    CHECK (moderation_status IN ('active','under_review','removed')),
  ADD COLUMN IF NOT EXISTS removal_reason TEXT;
CREATE INDEX IF NOT EXISTS reviews_moderation_status_idx ON public.reviews(moderation_status);
```
Verify after: `select column_name from information_schema.columns where table_name='reviews' and column_name in ('moderation_status','removal_reason');`

## 3. READY — discovery_items policies (fixes: Post-from-Discover is dead + staging content world-readable) — SEARCH C1 + H
Live has a single drifted `discovery_items_public_read` (qual=true, all rows public) and NO INSERT policy. Restore 067's intended per-operation policies:
```sql
DROP POLICY IF EXISTS "discovery_items_public_read" ON public.discovery_items;
DROP POLICY IF EXISTS "items_read"        ON public.discovery_items;
DROP POLICY IF EXISTS "items_insert_own"  ON public.discovery_items;
DROP POLICY IF EXISTS "items_update_own"  ON public.discovery_items;
DROP POLICY IF EXISTS "items_delete_own"  ON public.discovery_items;
CREATE POLICY "items_read" ON discovery_items FOR SELECT
  USING (status = 'published' AND is_active = true);
CREATE POLICY "items_insert_own" ON discovery_items FOR INSERT
  WITH CHECK (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
CREATE POLICY "items_update_own" ON discovery_items FOR UPDATE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()))
  WITH CHECK (status IN ('staging','flagged','archived'));
CREATE POLICY "items_delete_own" ON discovery_items FOR DELETE
  USING (owner_user_id = auth.uid() OR EXISTS (SELECT 1 FROM salons WHERE id = owner_salon_id AND owner_id = auth.uid()));
```
(Keep/re-add the four `admin_items_*` policies from 067 if they're also missing live.) Verify after with pg_policies. NOTE: if any live rows are `status <> 'published'` they'll disappear from public reads once `items_read` is restrictive — intended, but confirm no legitimate published rows use a non-'published' status live first.

---

## 4. NEEDS DESIGN — bookings status/money column lockdown (self-complete → loyalty-tier farming) — LOYALTY C1
Live `bookings_update_own` has `with_check = NULL`, so a customer can PATCH their own booking to `status='completed'` (or via direct Supabase REST) and farm Solen Status tier → real member-discount margin leak.
- The **API vector** is closed in CODE by restricting `PATCH /api/bookings/[id]` so only the salon/admin may set `status='completed'|'no_show'` (that file is currently owned by the concurrent session — see BACKEND_FIX_TRACKER; confirm it landed).
- The **direct-REST vector** needs a DB change, but a blunt `REVOKE UPDATE (status,...)` or a strict WITH CHECK will BREAK the legitimate customer-cancel path (which sets `status='cancelled'` through the session client). Correct fix per the audit: route all status/payment writes through `SECURITY DEFINER` functions (owner/service only) and revoke direct customer UPDATE of `status, price_paid, final_price, payment_status, applied_tier, tier_discount_amount`, keeping a narrow function for customer-cancel. This must be designed + tested against the cancel/reschedule flows before applying. Do NOT ship a naive WITH CHECK.

## 5. NEEDS DESIGN — group_bookings (feature 100% non-functional) — BOOKING sub-flow C
Two live breaks: (a) `group_bookings` has only a SELECT policy, so `create_group_booking()` (plain plpgsql, not SECURITY DEFINER) is denied on its own INSERT; (b) the RPC's `INSERT INTO bookings (...)` omits the NOT-NULL `starts_at`, `ends_at`, `price_paid`. Fix requires BOTH:
```sql
-- (a) let the RPC insert (or mark it SECURITY DEFINER instead):
CREATE POLICY "group_bookings_insert_own" ON public.group_bookings FOR INSERT TO authenticated
  WITH CHECK (organizer_user_id = auth.uid());
CREATE POLICY "group_bookings_update_own" ON public.group_bookings FOR UPDATE TO authenticated
  USING (organizer_user_id = auth.uid());
```
```sql
-- (b) replace create_group_booking so the bookings INSERT populates starts_at/ends_at/price_paid
--     from the locked availability_slots row (+ services.price). Draft the CREATE OR REPLACE FUNCTION
--     off the existing 071 body; test it end-to-end (a real 2-member group) before shipping.
```
Confirm the exact `group_bookings` column name for the organizer (organizer_user_id vs organizer_id) against live before applying.

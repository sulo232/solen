# Full Platform Implementation Roadmap: Review System & Search/Discovery

## R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Review Rendering | Ensure flagging only updates metadata column initially, doesn't hard-delete |
| Phase 2 | 🟢 SAFE | Nothing | Add new endpoint independent of existing ones |
| Phase 3 | 🔴 HIGH | Booking lifecycles | Avoid altering existing trigger logic without backwards compatibility |
| Phase 4 | 🟡 MEDIUM | Review UI in dashboard | Safely migrate `salon_response` to `review_replies` table |
| Phase 5 | 🔴 HIGH | Homepage load | Provide fallback empty arrays if APIs fail |
| Phase 6 | 🔴 HIGH | Salon directory ranking | Coalesce null fields during sort to prevent missing data |
| Phase 7 | 🟡 MEDIUM | Location queries | Ensure geospatial functions handle null latitudes gracefully |
| Phase 8 | 🟡 MEDIUM | API timeout on aggregation | Use cron/materialized views for trending aggregation |

---

## 🤖 CODE PHASES: PART 1 (REVIEW SYSTEM)

### Phase 1: Salon Partner "Flag Review" (ToS §7.2)
**Goal:** Allow salon partners to flag a review for moderation.
- **[NEW]** `app/api/reviews/[id]/flag/route.ts` - Endpoint to flag review
- **[MODIFY]** `app/api/admin/reviews/route.ts` - Support viewing flagged reports
- **[MODIFY]** `components/dashboard/ReviewManager.tsx` (or equivalent) - Add UI button for salon owner to flag review

**R4: Code Example**
```typescript
// ✅ DO: Check auth and ownership before flagging
const { data: salon } = await supabase.from('salons').select('owner_id').eq('id', review.salon_id).single();
if (user.id !== salon.owner_id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
```
```typescript
// ❌ DON'T: Allow anyone to flag or blindly update
await supabase.from('reviews').update({ is_flagged: true }).eq('id', reviewId);
```

**R7: Verification**
- **Commit:** `git commit -m "phase 1: implement salon review flagging API and UI"`
- **Verify:** Run `npm run build`. Test `/api/reviews/[id]/flag` via POST. Check DB `is_flagged` status.

> ⚠️ **BE CAREFUL**: Do not delete the review upon flagging. ToS §7.2 states solen.ch makes the final decision. Just insert into moderation queue or set `is_flagged = true`.

---

### Phase 2: Review Photo Upload API
**Goal:** Implement endpoint to upload photos attached to reviews.
- **[NEW]** `app/api/reviews/[id]/photos/route.ts` - Handle multipart/form-data upload to Supabase storage bucket `review-photos`
- **[MODIFY]** `components/ui/ReviewForm.tsx` (or equivalent) - Add image upload UI

**R4: Code Example**
```typescript
// ✅ DO: Validate file type before uploading
if (!['image/jpeg', 'image/png'].includes(file.type)) throw new Error("Invalid format");
```

**R7: Verification**
- **Commit:** `git commit -m "phase 2: add review photo upload endpoint"`
- **Verify:** Run `npm run build`. Upload a photo through the review form and verify it's saved in Supabase storage and linked in `review_photos`.

> ⚠️ **BE CAREFUL**: Validate max file size (e.g., 5MB) and type. Ensure Bucket RLS policies only allow authenticated uploads.

---

### Phase 3: Strikes & Warnings System (ToS §3.3, §4.4, §6.6)
**Goal:** Implement DB tracking for strikes and warnings based on cancellations and no-shows.
- **[NEW]** `supabase/migrations/075_strikes_warnings.sql` - Create generic strikes/warnings tracking table 
- **[MODIFY]** `app/api/bookings/[id]/route.ts` (or similar endpoint handling status) - Trigger strike evaluation on cancellation/no-show status
- **[NEW]** `lib/automoderation.ts` / `lib/strikes.ts` - Utility for evaluating and assigning strikes

**R4: Code Example**
```sql
-- ✅ DO: Use a generic strike tracking table
CREATE TABLE salon_strikes ( id UUID PRIMARY KEY, salon_id UUID, reason TEXT, created_at TIMESTAMPTZ );
```

**R7: Verification**
- **Commit:** `git commit -m "phase 3: track salon and user strikes per ToS"`
- **Verify:** `npm run build`. Cancel 3 bookings in 30 days and check if appropriate record is inserted.

> ⚠️ **BE CAREFUL**: Do not immediately ban or suspend. This should trigger an "account review" payload/alert for admins.

---

### Phase 4: Review Prompt Localization & Reply Consolidation
**Goal:** Send review prompts in user's locale and fix dual-reply technical debt.
- **[MODIFY]** `app/api/cron/review-prompt/route.ts` - Retrieve user's locale from `profiles` and check `banned_at`
- **[MODIFY]** `app/api/reviews/[id]/respond/route.ts` - Migrate to standard `review_replies` usage
- **[NEW]** `supabase/migrations/076_migrate_salon_responses.sql` - Migrate data from old `salon_response` column to `review_replies`

**R4: Code Example**
```typescript
// ✅ DO: Check ban status before sending email
if (profile.banned_at !== null) return; // skip sending email
```

**R7: Verification**
- **Commit:** `git commit -m "phase 4: localize review prompts and migrate legacy responses"`
- **Verify:** Run cron handler locally. Validate `review_replies` has migrated texts.

> ⚠️ **BE CAREFUL**: Ensure the migration `076` correctly copies data without dropping data from the modern `review_replies`.

---

## 🤖 CODE PHASES: PART 2 (SEARCH & DISCOVERY)

### Phase 5: Fix Broken HomePage Section APIs
**Goal:** Add/fix missing endpoints for filtering on homepage sections.
- **[NEW]** `app/api/bookings/route.ts` - Handle `GET /api/bookings?status=completed`
- **[NEW]** `app/api/profile/favorites/route.ts`
- **[NEW]** `app/api/salons/quartier-counts/route.ts`
- **[NEW]** `app/api/salons/quartier-featured/route.ts`
- **[MODIFY]** `app/api/salons/route.ts` - Add support for `sort=last_minute` and `sort=newest`

**R4: Code Example**
```typescript
// ✅ DO: Safely handle sort params in API
if (sort === "newest") { query = query.order("created_at", { ascending: false }); }
```

**R7: Verification**
- **Commit:** `git commit -m "phase 5: resolve missing homepage endpoints"`
- **Verify:** Fetch all 5 endpoints via curl and verify HTTP 200 with valid JSON response models.

> ⚠️ **BE CAREFUL**: Ensure responses return properly structured arrays to avoid UI crashes on `map()`.

---

### Phase 6: Solen Score Ranking & Strike Demotion
**Goal:** Rank salons primarily according to `solen_score` while incorporating strike penalties.
- **[MODIFY]** `app/api/salons/route.ts` - Change default DB query order to use `solen_score`
- **[MODIFY]** `lib/rankings.ts` (or direct) - Multiply/demote scores if strikes exist

**R4: Code Example**
```typescript
// ✅ DO: Default sort by score with a fallback
query = query.order("solen_score", { ascending: false, nullsFirst: false });
```

**R7: Verification**
- **Commit:** `git commit -m "phase 6: apply solen_score to default salon discovery"`
- **Verify:** Load generic `/salons` directory UI, confirm salons with higher scores appear first.

> ⚠️ **BE CAREFUL**: Beware of null handling for `solen_score`—force `nullsFirst: false`. ToS §6.6 requires demoted visibility upon warnings.

---

### Phase 7: "Near You" Geospatial Section
**Goal:** Provide distance-based sorting and filtering capabilities using existing coords.
- **[MODIFY]** `app/api/salons/route.ts` - If `lat`/`lng` is passed, use a DB RPC to query distance.
- **[NEW]** `supabase/migrations/077_geospatial_search.sql` - PostGIS or EarthDistance RPC function for nearby calculation
- **[MODIFY]** `components/HomePage.tsx` - Retrieve geolocation if authorized and pass parameters

**R4: Code Example**
```typescript
// ✅ DO: Use dedicated Postgres functions for distance finding
const { data } = await supabase.rpc('get_salons_nearby', { lat: userLat, lng: userLng });
```

**R7: Verification**
- **Commit:** `git commit -m "phase 7: implement geospatial 'Near You' filtering"`
- **Verify:** Test endpoint with injected mock coordinates and verify distance ranges.

> ⚠️ **BE CAREFUL**: Protect frontend geolocation flow with error boundaries. If declined, omit "Near You".

---

### Phase 8: "Trending in Basel" & "New on solen.ch"
**Goal:** Surface high-engagement and newest salon listings accurately.
- **[NEW]** `supabase/migrations/078_trending_aggregation.sql` - Materialized view for trailing 7-day bookings + views
- **[NEW]** `app/api/salons/trending/route.ts` - Endpoint backed by materialized view
- **[MODIFY]** `components/HomePage.tsx` - Re-enable and tie in the Trending/New horizontal swipe sections
- **[MODIFY]** `CLAUDE.md` - Schema updates for tracking materialized views

**R4: Code Example**
```sql
-- ✅ DO: Use a materialized view to avoid slow queries directly measuring bookings
CREATE MATERIALIZED VIEW trending_salons AS SELECT salon_id, count(*) FROM bookings WHERE created_at > now() - interval '7 days' GROUP BY salon_id;
```

**R7: Verification**
- **Commit:** `git commit -m "phase 8: trending aggregation and discovery update"`
- **Verify:** Rebuild and load homepage. "Trending", "New", "Top rated", and "Near You" rows must display populated arrays.

> ⚠️ **BE CAREFUL**: Do not run raw aggregation tables on client request. Scheduled cron refreshes (e.g. hourly) of the Materialized Views are crucial to database health. Remember to update `CLAUDE.md`!

---

## R6: Dependency Ordering Table

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Salon owner "Flag Review" API & UI | None |
| Phase 2 | 🤖 | Review Photo Uploads | Phase 1 |
| Phase 3 | 🤖 | Strikes/Warnings System DB & Tracker | None |
| Phase 4 | 🤖 | Review Prompts Localization / Reply Cleanup | Phase 1 |
| Phase 5 | 🤖 | Fix missing HomePage APIs | None |
| Phase 6 | 🤖 | Ranking logic update (Solen Score + Strike Demotion) | Phase 3 |
| Phase 7 | 🤖 | Near You (Geospatial) calculation endpoints | Phase 5 |
| Phase 8 | 🤖 | Trending Aggregation + DB structure | Phase 6 |

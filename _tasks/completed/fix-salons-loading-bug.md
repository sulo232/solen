# Task: Fix Salon Loading Bug ("Salons konnten nicht geladen werden")
- **Agent**: bug-agent / Developer 1
- **Started**: 2026-03-16
- **Completed**: 2026-03-16
- **Status**: completed
- **Files touched**: `index.html`

## Root Cause
Migration `013_drop_legacy_schema.sql` dropped the `stores` table entirely, and
`014_new_schema.sql` replaced it with a `salons` table with different column names.

`loadStores()` in `index.html` was still querying `stores` first — Supabase returned a
"relation does not exist" error, `data` was `null`, and the function aborted early,
showing the error banner. The second salons query was never reached.

## What Was Done
All changes in `index.html` at `loadStores()` (~line 5707):

1. **Query**: Replaced `sb.from('stores').select('*').neq('status','pending')...`
   with `sb.from('salons').select('*').eq('is_active',true).order('name')`

2. **Column normalisation shim**: Instead of renaming every consumer, added a `.map()`
   that spreads the new schema and aliases legacy names:
   - `categories → cat` (first element of array)
   - `latitude → lat`, `longitude → lng`
   - `average_rating → avg_rating`
   - `cover_photo_url → image_url`
   - `instagram_url → instagram`
   - `quartier → neighbourhood`
   - `store_id: s.id`

3. **Services**: Added `name: sv.name_de||sv.name_en||sv.name||''` mapping so
   `sv.name` references in render code continue to work.

4. **Bookings query**: Removed non-existent `store_id` column from
   `select('store_id,salon_id')` → `select('salon_id')`.

## Risks / Side Effects
- All downstream render functions (`renderStores`, `renderStoreCard`, etc.) are
  unchanged — they continue using the legacy property names now supplied by the shim.
- If `categories` is empty `[]`, `cat` will be `undefined` — same as before.
- Other agents relying on `allStores` globals will now get correctly-shaped objects.

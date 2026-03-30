# Solen Dashboard: Client CRM & RFM Segmentation

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Database Performance (CPU spiking) | Creating a standard View reading all historic bookings could lock tables. We MUST use a `MATERIALIZED VIEW` refreshed via cron. |
| Phase 2 | 🟢 SAFE | Client Route | Safe modification of UI tabs. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: RFM Materialized View (Database)

**Objective Location:** `supabase/migrations/XXX_create_rfm_materialized_view.sql` `[NEW]`

1. Create a standard `MATERIALIZED VIEW` that calculates `booking_count`, `total_spent`, and `days_since_last_visit` by joining `bookings` and `services`.
2. Implement a `CASE` statement generating the `segment_tag`: 'VIP', 'Gefährdet' (Slipping Away), 'Neu' (New), 'Regulär' (Regular).

✅ **DO:**
```sql
CREATE MATERIALIZED VIEW public.client_rfm_segments AS
SELECT 
  c.id as client_id,
  c.salon_id,
  COUNT(b.id) as booking_count,
  SUM(s.price) as total_spent,
  CASE 
    WHEN COUNT(b.id) >= 4 AND SUM(s.price) >= 500 THEN 'VIP'
    WHEN COUNT(b.id) >= 2 AND EXTRACT(DAY FROM NOW() - MAX(b.starts_at)) > 90 THEN 'Gefährdet'
    WHEN COUNT(b.id) = 1 AND EXTRACT(DAY FROM NOW() - MAX(b.starts_at)) < 30 THEN 'Neu'
    ELSE 'Regulär'
  END as segment_tag
FROM clients c
LEFT JOIN bookings b ON c.id = b.client_id AND b.status = 'completed'
LEFT JOIN services s ON b.service_id = s.id
GROUP BY c.id, c.salon_id;

CREATE UNIQUE INDEX idx_client_rfm_id ON public.client_rfm_segments(client_id);
```

❌ **DON'T:**
```tsx
// Calculating RFM math directly in the Next.js API route array map. It will OOM the Vercel function.
const vips = clients.filter(c => c.bookings.length > 4)
```

**Zone Constraint**: DB layer.
**Commit Message**: `git commit -m "Phase 1: Created RFM materialized view for algorithmic client segmenting"`

> ⚠️ **BE CAREFUL**: The view must handle `NULL` values when `LEFT JOIN` yields no completed bookings to prevent math errors. Count only `status='completed'` bookings to ensure canceled appointments don't generate VIP status.

---

### Phase 2: API & Dashboard Integration

**Objective Location:** `app/api/clients/route.ts` `[MODIFY]`  
**Objective Location:** `app/[locale]/dashboard/clients/page.tsx` `[MODIFY]`

1. Update the `GET /api/clients` query to `LEFT JOIN` the new `client_rfm_segments` materialized view.
2. In the UI, add horizontal tabs above the table using standard `21st.dev` UI components (or a simple flex row) to filter by Segment Tag in-memory (no fresh API call).

✅ **DO:**
```tsx
// Use V3 tokens for the VIP pill badge
<span className="bg-s-yellow/15 text-s-yellow-text border-s-yellow/30 px-2 py-1 rounded-pill text-xs">
  {t('segments.vip')}
</span>
```

❌ **DON'T:**
```tsx
// Wrapping un-translated segment codes natively.
<span>{client.segment_tag}</span> // Bad, prints 'Gefährdet' to English UI.
```

**Zone Constraint**: Zone 3 (Dashboard). Ensure strings are translated via `useTranslations('crm')`.
**Commit Message**: `git commit -m "Phase 2: Updated CRM UI with RFM segment tags and filtering"`

> ⚠️ **BE CAREFUL**: Ensure the API correctly joins the view. Testing requires manually mocking old completed bookings in Supabase to trigger the "Gefährdet" (Slipping Away, 90+ days) status.

---

## 🧑 MANUAL PHASES

### Phase M1: Setup pg_cron Refresh

1. Login to Supabase SQL Editor.
2. Enable `pg_cron` extension.
3. Schedule `REFRESH MATERIALIZED VIEW CONCURRENTLY public.client_rfm_segments;` to run at `0 3 * * *` (3 AM daily).

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Materialized View SQL | Nothing |
| Phase 2 | 🤖 | CRM UI and API changes | Phase 1 |
| Phase M1 | 🧑 | Setup Cron Job | Phase 1 |

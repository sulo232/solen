# Solen Dashboard: Automated Services Import & Visual Reordering

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Service sorting order on live store | Ensure `sort_order` defaults to `0` so existing DB records don't break during migration. |
| Phase 2 | 🔴 HIGH | Edge Function memory limits | Limit CSV parser payload size to 2MB to prevent `papaparse` from crashing the Vercel function. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Visual Reordering Schema & UI

**Objective Location:** `supabase/migrations/XXX_add_sort_order_to_services.sql` `[NEW]`  
**Objective Location:** `app/api/services/route.ts` `[MODIFY]`  
**Objective Location:** `app/[locale]/dashboard/services/page.tsx` `[MODIFY]`

1. Create a migration to add `sort_order` `integer DEFAULT 0` to `services` table.
2. Update `GET /api/services` to sort by `sort_order ASC, created_at DESC`.
3. Integrate `@hello-pangea/dnd` on the services table in the dashboard.

✅ **DO:**
```sql
ALTER TABLE public.services ADD COLUMN sort_order integer DEFAULT 0;
CREATE INDEX idx_services_sort ON public.services(salon_id, sort_order);
```

❌ **DON'T:**
```tsx
// Forgetting to throttle the bulk API patch when dragging multiple items rapidly.
const saveOrder = (items) => items.map(i => fetch(`/api/serv/${i.id}`, {PATCH}))
```

**Zone Constraint**: Zone 3 (Functional Dashboard). Use `lucide-react` `GripVertical` icon for drag handles.
**Commit Message**: `git commit -m "Phase 1: Added sort_order to services and implemented DnD UI"`

> ⚠️ **BE CAREFUL**: The drag-and-drop state must handle nested services (services inside categories). Ensure you are only dragging rows *within* the same category body, or adjusting cross-category drops accurately in the database.

---

### Phase 2: CSV Concierge Edge Function

**Objective Location:** `app/api/services/import/route.ts` `[NEW]`  
**Objective Location:** `app/[locale]/dashboard/services/ImportModal.tsx` `[NEW]`

1. Build a new API route accepting `multipart/form-data` containing the `.csv`.
2. Parse it using `papaparse` server-side.
3. Map "Service Name" → `name_de`, "Price" → `price`, "Duration" → `duration_minutes`.

✅ **DO:**
```tsx
import Papa from 'papaparse';
// Set strict header mapping and handle missing fields safely
const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
const servicesToInsert = parsed.data.map(row => ({
  name_de: row['Service Name'] || row['Behandlung'],
  price: parseFloat(row['Price'] || row['Preis']),
  // etc
}));
```

❌ **DON'T:**
```tsx
// Bypassing Zod validations when bulk inserting CSV data.
await supabase.from('services').insert(rawCsvArray);
```

**Zone Constraint**: Zone 3. The `<ImportModal>` must use standard `border-s-ink/10` and `bg-white` elements with NO glass. Use `useTranslations` for UI text.
**Commit Message**: `git commit -m "Phase 2: Created CSV Upload Modal and papaparse backend route"`

> ⚠️ **BE CAREFUL**: Treatwell and Fresha CSV formats vary slightly by language export. Implement robust fallback regex for the header names (e.g., matching both `Preis` and `Price`).

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | `sort_order` DB + UI implementation | Nothing |
| Phase 2 | 🤖 | Concierge CSV import API | Phase 1 (so imported items can be sorted) |

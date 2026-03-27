# Solen Dashboard: Calendar Drag & Drop + Conflict Blindness

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🔴 HIGH | Booking insertion failures (`POST /api/slots`) | Ensure `EXCLUDE USING gist` only applies to legitimate slot statuses (`booked`, `blocked`). Ignore `canceled` slots. |
| Phase 2 | 🟡 MEDIUM | Calendar visual grid breaking | Wrap the existing grid in `<DragDropContext>` cleanly. Test mobile touch events vs native scrolling. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database Hardening (Conflict Blindness)

**Objective Location:** `supabase/migrations/XXX_prevent_double_booking_gist.sql` `[NEW]`
**Objective Location:** `app/api/slots/route.ts` `[MODIFY]`

1. Create a migration to implement the `EXCLUDE USING gist` constraint.
2. Update the API slot creation handler to catch error code `23P01`.

✅ **DO:**
```sql
ALTER TABLE public.availability_slots
ADD CONSTRAINT prevent_double_booking 
EXCLUDE USING gist (
  staff_member_id WITH =,
  tstzrange(starts_at, ends_at) WITH &&
) WHERE (status IN ('booked', 'blocked'));
```

❌ **DON'T:**
```sql
-- Fails to exclude canceled appointments, permanently locking out time slots.
ALTER TABLE public.availability_slots
ADD CONSTRAINT prevent_double_booking 
EXCLUDE USING gist (staff_member_id WITH =, tstzrange(starts_at, ends_at) WITH &&);
```

**Zone Constraint**: API/DB Level.
**Commit Message**: `git commit -m "Phase 1: Added btree_gist constraint to prevent double bookings"`

> ⚠️ **BE CAREFUL**: The `btree_gist` extension must be enabled before the constraint is applied. If the database already has conflicting overlapping slots, the migration will crash during execution.

---

### Phase 2: React DnD Integration

**Objective Location:** `app/[locale]/dashboard/calendar/page.tsx` `[MODIFY]`
**Objective Location:** `package.json` `[MODIFY]`

1. Install `@hello-pangea/dnd`.
2. Convert the Staff columns into `<Droppable droppableId={staff.id}>` and the appointment slots into `<Draggable draggableId={slot.id} index={index}>`.
3. Dispatch an optimistic UI update, then call `PATCH /api/slots/[id]`.

✅ **DO:**
```tsx
const onDragEnd = async (result: DropResult) => {
  if (!result.destination) return;
  // Optimistic UI update
  setSlots(prev => reorderSlots(prev, result));
  const res = await fetch(`/api/slots/${slotId}`, { method: 'PATCH', body: JSON.stringify(newTimes) });
  if (res.status === 409) {
    toast.error(t('double_booking_error'));
    setSlots(originalSlots);
  }
};
```

❌ **DON'T:**
```tsx
// Using generic hover states that violate UI_RULES.md
<div className="hover:scale-110 shadow-md">
```

**Zone Constraint**: Zone 3 (Dashboard). NO glassmorphism. Use `shadow-warm-md` for the dragging state.
**Commit Message**: `git commit -m "Phase 2: Implemented React DnD for calendar slots with optimistic UI"`

> ⚠️ **BE CAREFUL**: Ensure `aria-label` tags are present on the Draggable elements. Do not remove the `SlotDetailModal` triggering logic from the clicks, differentiate between a drag (mousedown + move) and a click (mousedown + mouseup).

---

## 🧑 MANUAL PHASES

### Phase M1: Execute Migration
1. Log into the Supabase Dashboard.
2. Open the SQL Editor and run `CREATE EXTENSION IF NOT EXISTS btree_gist;`.
3. Verify there are no existing overlaps in the DB: `SELECT staff_member_id, COUNT(*) FROM availability_slots GROUP BY ... HAVING COUNT(*) > 1`.
4. Run the generated migration file.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB Gist Constraint & API Error Handling | Nothing |
| Phase M1 | 🧑 | Execute Migration | Phase 1 |
| Phase 2 | 🤖 | React DnD React Implementation | Phase 1 & M1 |

# R11: Off-Peak Discounts

> **Wave 2** — Parallel-safe. No dependencies on other Wave 2 roadmaps.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB Migration | 🔴 HIGH | Schema changes | Test migration on branch first. Ensure no conflicts with existing columns. |
| Phase 2: API Routes | 🟡 MEDIUM | Slot pricing logic | Add discount AFTER base price calculation. Never overwrite existing price — apply as modifier. |
| Phase 3: Dashboard UI | 🟢 SAFE | New component, no existing code touched | Use existing dashboard card patterns. |
| Phase 4: Customer-facing display | 🟡 MEDIUM | Booking flow pricing | Display only — the actual price calculation happens in the booking API. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Run the Supabase migration via the Supabase Dashboard or CLI.

**🤖 CLAUDE CODE PHASES**
- Phase 1: Database schema (migration file)
- Phase 2: API routes (CRUD + slot price modifier)
- Phase 3: Dashboard UI (OffPeakManager)
- Phase 4: Customer-facing display (booking calendar + SalonCard badges)
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: Database Schema

> ⚠️ **PRE-EXISTING CODE**: Off-peak features already partially exist:
> - `app/api/salons/[slug]/off-peak-today/route.ts` — API route exists
> - `lib/types.ts` — off_peak types already defined
> - `lib/validations.ts` — off_peak validation schemas exist
> - `components/FilterBar.tsx` — off-peak filter already integrated
> - `components/dashboard/nail/DynamicPricingConfig.tsx` — related pricing UI exists
>
> **CHECK all of these before creating anything new.** You may only need to fill in gaps.

#### Files
- `[NEW or MODIFY]` `supabase/migrations/XXX_off_peak_discounts.sql` — check if table already exists first

#### Instructions
Create the `off_peak_discounts` table:
```sql
CREATE TABLE IF NOT EXISTS off_peak_discounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
  start_hour INTEGER NOT NULL CHECK (start_hour BETWEEN 0 AND 23),
  end_hour INTEGER NOT NULL CHECK (end_hour BETWEEN 1 AND 24),
  discount_percent INTEGER NOT NULL CHECK (discount_percent BETWEEN 5 AND 50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, day_of_week, start_hour)
);

-- RLS
ALTER TABLE off_peak_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Salon owners can manage their off-peak discounts"
  ON off_peak_discounts FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "Public can view active off-peak discounts"
  ON off_peak_discounts FOR SELECT
  USING (is_active = true);
```

> ⚠️ **MIGRATION WARNING**: Add this migration file but do NOT execute it automatically. Note in `_tasks/INCOMPLETE_FEATURES.md` if it needs manual running.

---

## Phase 2: API Routes

#### Files
- `[NEW]` `app/api/off-peak/route.ts`
- `[MODIFY]` `app/api/slots/route.ts` (or equivalent slot-fetching API)

#### Instructions
1. **CRUD API** (`/api/off-peak`):
   - `GET` — fetch salon's off-peak rules
   - `POST` — create new rule (validate: no overlapping hours for same day)
   - `DELETE` — remove rule
   - Auth: require `salon_owner` role, verify salon ownership
   - Rate limit: `slidingWindow(5, '1m')`
   - Validate with Zod schema

2. **Slot Price Modifier**: In the slot-fetching API, after calculating base price:
```typescript
// After base price calculation
const offPeakRules = await getActiveOffPeakRules(salonId);
const matchingRule = offPeakRules.find(r => 
  r.day_of_week === slotDate.getDay() && 
  slotHour >= r.start_hour && slotHour < r.end_hour
);
if (matchingRule) {
  slot.discounted_price = Math.round(slot.price * (1 - matchingRule.discount_percent / 100));
  slot.off_peak_discount = matchingRule.discount_percent;
}
```

---

## Phase 3: Dashboard UI

#### Files
- `[NEW]` `components/dashboard/OffPeakManager.tsx`
- `[MODIFY]` `app/[locale]/dashboard/settings/page.tsx`

#### Instructions
1. Build a weekly grid component (7 columns for days × hourly rows).
2. Salon owner clicks an hour slot → modal to set discount percentage (5–50%).
3. Active off-peak hours highlighted with `bg-s-sage-subtle` + `text-s-sage-text`.
4. Delete button on each rule with confirmation.
5. **Zone 4** design rules: `rounded-dash` (12px), no glass, no blobs, Syne 700 headings + DM Sans body.
6. Add OffPeakManager as a section in the dashboard settings page.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="bg-white dark:bg-s-dm-surface rounded-dash border border-s-ink/5 p-6">
  <h3 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-4">
    Rabattzeiten
  </h3>
  {/* Weekly grid */}
</div>
```

❌ **DON'T**
```tsx
<div className="bg-white/80 backdrop-blur-xl rounded-card shadow-glass"> // Zone 4 violation
```

---

## Phase 4: Customer-Facing Display

#### Files
- `[MODIFY]` `components/BookingCalendar.tsx`
- `[MODIFY]` `components/SalonCard.tsx`

#### Instructions
1. **BookingCalendar**: When a time slot has `off_peak_discount`, show:
   - Strikethrough original price
   - Discounted price in `text-s-sage-text`
   - Small badge: `"-{X}%"` in `bg-s-sage-subtle`
2. **SalonCard**: If salon has ANY active off-peak rules for today, show:
   - `"Ab CHF {discounted_price}"` instead of the regular price
   - Small `"Off-Peak"` badge in `bg-s-sage-subtle text-s-sage-text`

> ⚠️ **BE CAREFUL**: Don't modify the actual booking price calculation in BookingCalendar — that should happen server-side in the booking API. Only modify the DISPLAY.

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify migration file exists:
ls supabase/migrations/*off_peak*
# Verify API route exists:
ls app/api/off-peak/route.ts
# Verify component exists:
grep -rn "OffPeakManager" app/ components/ --include="*.tsx"
# Should find import in dashboard/settings/page.tsx
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB Migration file | Nothing |
| Phase 2 | 🤖 | API routes | Phase 1 (migration must be run) |
| Phase 3 | 🤖 | Dashboard OffPeakManager | Phase 2 |
| Phase 4 | 🤖 | Customer-facing display | Phase 2 |
| Phase 5 | 🤖 | Smoke Test | All phases |

---

## R8: FINAL UPDATES TO CLAUDE.md
- Add `off_peak_discounts` table to `_rules/DB_SCHEMA.md`
- Update CLAUDE.md §3.5 Feature 9 to mark as ✅ implemented

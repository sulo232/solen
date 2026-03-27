# Solen Dashboard: Staff Commission Tracker

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Adding a `DEFAULT 0` column is safe. |
| Phase 2 | 🟡 MEDIUM | Gross Earnings Display | Ensure the new API correctly calculates `staff_share` WITHOUT corrupting the existing total revenue graphs. |

---

## 🤖 CLAUDE CODE PHASES

### Phase 1: Database & Profile Editor Update

**Objective Location:** `supabase/migrations/XXX_add_commission_rate.sql` `[NEW]`  
**Objective Location:** `app/[locale]/dashboard/staff/StaffModal.tsx` `[MODIFY]`  
**Objective Location:** `lib/types.ts` `[MODIFY]`

1. Add `commission_rate integer DEFAULT 0` to `staff_members`.
2. Update `StaffMember` interface in `lib/types.ts`.
3. Add a Number Input field to the `StaffModal` frontend allowing owners to dial between 0-100%.

✅ **DO:**
```tsx
import { useTranslations } from 'next-intl';

<div className="flex flex-col gap-2">
  <Label>{t('commission_rate_label')}</Label>
  <Input 
     type="number" min="0" max="100" 
     {...register('commission_rate', { valueAsNumber: true })} 
  />
</div>
```

❌ **DON'T:**
```tsx
// Hardcoding German labels in the admin dashboard violation of Rule 38b.
<Label>Provision (%)</Label> 
```

**Zone Constraint**: Zone 3 (Admin). Standard inputs with `bg-white` and `border-s-ink/10`.
**Commit Message**: `git commit -m "Phase 1: Added commission_rate schema, types, and staff modal field"`

> ⚠️ **BE CAREFUL**: The API submitting the `StaffModal` data must have its Zod schema (`StaffMemberSchema`) updated to allow `commission_rate: z.number().min(0).max(100)` or the backend will drop the field on save.

---

### Phase 2: Earnings Accounting Aggregation

**Objective Location:** `app/api/earnings/staff/route.ts` `[NEW]`  
**Objective Location:** `app/[locale]/dashboard/earnings/page.tsx` `[MODIFY]`

1. Create a new API route `/api/earnings/staff` that calculates gross sums.
2. Group `bookings` (status = 'completed') by `staff_member_id`.
3. Produce logic: `gross = SUM(services.price)`, `staff_share = gross * (commission_rate / 100)`, `house_share = gross - staff_share`.

✅ **DO:**
```tsx
// Using data-text for numbers as per UI_RULES.md (tabular-nums constraint)
<td className="data-text font-medium text-s-ink">CHF {staff.staff_share.toFixed(2)}</td>
```

❌ **DON'T:**
```tsx
// Building an entirely new Earnings layout page.
export default function NewEarningsPage() { /* ... */ } // Violation of Rule 8 (Never Rebuild)
```

**Zone Constraint**: Zone 3. Append the "Mitarbeiter-Abrechnung" (Staff Payouts) table below the existing Revenue Line Charts in `EarningsPage.tsx`. No glass.
**Commit Message**: `git commit -m "Phase 2: Built staff payout API and integrated accounting table into Earnings page"`

> ⚠️ **BE CAREFUL**: The existing Earnings page has date filters (Day, Week, Month). The new `StaffPayoutTable` component MUST correctly listen to these URL search parameters or state values so the accounting report updates accurately based on the selected time window.

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Schema and Staff Profile Form | Nothing |
| Phase 2 | 🤖 | Backend Math API & Dashboard UI | Phase 1 |

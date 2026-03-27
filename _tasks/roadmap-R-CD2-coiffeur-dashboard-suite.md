# R-CD2: Coiffeur Dashboard Suite

> **Wave 3** — Depends on R-CD1 (category-aware dashboard shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration (colour_formulas) | 🟡 MEDIUM | RLS policies may block inserts | Add INSERT + SELECT policies for salon owner. Test with authenticated user. |
| Phase 2: Formula Book component | 🟢 SAFE | New component, additive | Follow existing `FormulaTab.tsx` pattern (already exists in `components/dashboard/`). |
| Phase 3: API route | 🟡 MEDIUM | 500 if table doesn't exist | Run migration BEFORE deploying component. Add graceful fallback for empty results. |
| Phase 4: Colour Cycle Reminders | 🟡 MEDIUM | Client spam if cycle detection wrong | Use conservative defaults (6 weeks). Require explicit opt-in per service. |
| Phase 5: Consultation Notes | 🟢 SAFE | New table, additive | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `colour_formulas` + `consultation_notes` tables
- Phase 2: API Routes — Formula CRUD + Consultation CRUD
- Phase 3: Formula Book Component
- Phase 4: Consultation Notes Component
- Phase 5: Colour Cycle Reminder Config
- Phase 6: Wire coiffeur-crm page
- Phase 7: i18n + Smoke Test

---

## Phase 1: DB Migration

> ⚠️ **PRE-EXISTING CODE**: `components/dashboard/FormulaTab.tsx` (8KB) already exists but uses `client_formulas` table. Check if that table exists. If so, extend it. If not, create it.

#### Files
- `[NEW]` `supabase/migrations/XXX_coiffeur_dashboard.sql`

#### Instructions
1. Check if `client_formulas` table exists (`grep -rn "client_formulas" supabase/migrations/`).
2. If it exists, use it. If not, create `colour_formulas`:

```sql
CREATE TABLE IF NOT EXISTS colour_formulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  brand TEXT NOT NULL,
  shade_code TEXT NOT NULL,
  mixing_ratio TEXT,
  developer_volume TEXT,
  processing_minutes INT,
  root_formula JSONB DEFAULT '{}',
  mid_lengths_formula JSONB DEFAULT '{}',
  ends_formula JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultation_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  hair_condition TEXT,
  scalp_condition TEXT,
  current_dislikes TEXT,
  desired_outcome TEXT,
  allergies TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE colour_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_colour_formulas" ON colour_formulas
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE POLICY "salon_owner_consultation_notes" ON consultation_notes
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );
```

> ⚠️ **BE CAREFUL**:
> - Check existing `client_formulas` table first. `FormulaTab.tsx` already references formula data.
> - If `client_formulas` exists, add new columns to it instead of creating a new table.
> - RLS INSERT policies are mandatory (Rule 12b).

#### Verification
```bash
git add supabase/migrations/ && git commit -m "R-CD2-P1: DB migration — colour_formulas + consultation_notes tables"
```

---

## Phase 2: API Routes

#### Files
- `[NEW]` `app/api/dashboard/coiffeur/formulas/route.ts`
- `[NEW]` `app/api/dashboard/coiffeur/consultations/route.ts`

#### Instructions
1. Formula GET: list formulas for a client within a salon. Params: `salon_id`, `client_id`.
2. Formula POST: create a new formula record. Zod validation for all fields.
3. Consultation GET/POST: same pattern.
4. Both routes use `getSession()` (NEVER `getUser()` — Rule 25).
5. Rate limiting via `@upstash/ratelimit`.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { z } from "zod";

const FormulaSchema = z.object({
  salon_id: z.string().uuid(),
  client_id: z.string().uuid(),
  brand: z.string().min(1).max(100),
  shade_code: z.string().min(1).max(50),
  mixing_ratio: z.string().optional(),
  developer_volume: z.string().optional(),
  processing_minutes: z.number().int().min(1).max(120).optional(),
  notes: z.string().max(500).optional(),
});
```

❌ **DON'T**
```tsx
// WRONG — using getUser() (Rule 25)
const { data: { user } } = await supabase.auth.getUser();
// WRONG — returning data without consistent format (Rule 11)
return NextResponse.json(formulas); // Should wrap: { data: formulas }
```

> ⚠️ **BE CAREFUL**:
> - Verify response format matches frontend expectations (Rule 11).
> - `getSession()` only — never `getUser()`.
> - Add Zod schema to `lib/validations.ts` if it grows beyond one route.

#### Verification
```bash
git add app/api/dashboard/coiffeur/ && git commit -m "R-CD2-P2: API routes — coiffeur formula + consultation CRUD"
npm run build
```

---

## Phase 3: Formula Book Component

#### Files
- `[NEW]` `components/dashboard/coiffeur/FormulaBook.tsx`

#### Instructions
1. Check existing `components/dashboard/FormulaTab.tsx` (8KB) — it may already be the formula book component.
2. If `FormulaTab.tsx` handles formula CRM for all salons, create `FormulaBook.tsx` as a wrapper/extension specifically for coiffeur CRM that adds:
   - Root / mid-lengths / ends formula sections
   - Brand + shade code searchable input
   - Processing time tracker
   - Copy-to-clipboard for formula text
3. **Zone 4 compliance**: `rounded-[12px]`, `bg-white dark:bg-s-dm-surface`, `border border-s-ink/[0.06]`, zero glass.
4. Use `useTranslations("dashboardCoiffeur")` for all labels.
5. Display formulas as a timeline (newest first) with accordion-style expansion.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("formula_history")}
  </p>
  {formulas.map((f) => (
    <div key={f.id} className="border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] py-3 last:border-0">
      <div className="flex items-center justify-between">
        <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{f.brand} — {f.shade_code}</p>
        <span className="text-[10px] data-text text-s-ink/40 dark:text-s-dm-text/40">
          {new Date(f.created_at).toLocaleDateString("de-CH")}
        </span>
      </div>
      {f.mixing_ratio && (
        <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-1">{f.mixing_ratio}</p>
      )}
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — shadow, glass, rounded-xl in Zone 4
<div className="rounded-xl shadow-lg backdrop-blur-lg bg-white/80">
// WRONG — hardcoded German
<h3>Farb-Formeln</h3>
```

> ⚠️ **BE CAREFUL**:
> - Check if `FormulaTab.tsx` already does what we need. If so, EXTEND rather than duplicate.
> - All text via `useTranslations()` — zero hardcoded strings.
> - Formula data (brand/shade codes) should not be exposed to other salons. Verify RLS.

#### Verification
```bash
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P3: FormulaBook component for coiffeur CRM"
npm run build
```

---

## Phase 4: Consultation Notes Component

#### Files
- `[NEW]` `components/dashboard/coiffeur/ConsultationNotes.tsx`

#### Instructions
1. Pre-appointment intake display: hair condition, scalp condition, client dislikes, desired outcome.
2. Stored per-visit — shows as a timeline per client.
3. "Add Note" modal with form fields.
4. Zone 4 compliance.

> ⚠️ **BE CAREFUL**:
> - Check if `IntakeFormTab.tsx` (9KB, in `components/dashboard/`) already handles consultation intake.
> - If it does, add coiffeur-specific fields to the existing intake template rather than creating a new component.
> - Verify `lib/intake-templates.ts` has a `hair_consultation` template.

#### Verification
```bash
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P4: ConsultationNotes component for coiffeur CRM"
npm run build
```

---

## Phase 5: Colour Cycle Reminder Config

#### Files
- `[NEW]` `components/dashboard/coiffeur/ColourCycleConfig.tsx`

#### Instructions
1. Configuration panel where salon owners set default colour service reminder cycles (4, 6, or 8 weeks).
2. Per-service toggle: "Enable colour reminders" on services in the `coiffeur` category.
3. Uses `services.reminder_cycle_days` column (same pattern as nail infill reminders).
4. Saves to services table via existing service update API.

> ⚠️ **BE CAREFUL**:
> - Check if `services.reminder_cycle_days` column exists (nail infill reminders already use it).
> - If it exists, reuse it. If not, add migration.
> - This only configures the cycle — the actual cron/email is a separate roadmap.

#### Verification
```bash
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P5: ColourCycleConfig component for coiffeur reminder settings"
npm run build
```

---

## Phase 6: Wire Coiffeur CRM Page

#### Files
- `[MODIFY]` `app/[locale]/dashboard/coiffeur-crm/page.tsx`

#### Instructions
1. Replace the "Coming Soon" stub with actual components.
2. Layout: FormulaBook + ConsultationNotes side by side on desktop, stacked on mobile.
3. Client selector dropdown at top (search by name).
4. Zone 4 grid: `grid grid-cols-1 lg:grid-cols-2 gap-4`.

> ⚠️ **BE CAREFUL**:
> - Import components from `@/components/dashboard/coiffeur/` — verify files exist first.
> - Client selector needs salon's client list — use existing clients API.

#### Verification
```bash
git add app/[locale]/dashboard/coiffeur-crm/ && git commit -m "R-CD2-P6: wire coiffeur CRM page with FormulaBook + ConsultationNotes"
npm run build
```

---

## Phase 7: i18n + Smoke Test

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Instructions
Add full `dashboardCoiffeur` namespace with all component keys.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify components exist:
ls components/dashboard/coiffeur/FormulaBook.tsx
ls components/dashboard/coiffeur/ConsultationNotes.tsx
ls components/dashboard/coiffeur/ColourCycleConfig.tsx

# Verify imports:
grep -rn "FormulaBook\|ConsultationNotes\|ColourCycleConfig" app/ --include="*.tsx"

# Verify no Zone 4 violations:
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl" components/dashboard/coiffeur/ app/[locale]/dashboard/coiffeur-crm/
# Expected: 0 results

# Verify i18n:
grep -rn "dashboardCoiffeur" messages/
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | API routes | Phase 1 |
| Phase 3 | 🤖 | FormulaBook | Phase 2 |
| Phase 4 | 🤖 | ConsultationNotes | Phase 2 |
| Phase 5 | 🤖 | ColourCycleConfig | Nothing |
| Phase 6 | 🤖 | Wire page | Phase 3, 4, 5 |
| Phase 7 | 🤖 | i18n + Smoke Test | All phases |

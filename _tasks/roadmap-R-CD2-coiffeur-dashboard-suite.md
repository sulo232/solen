# R-CD2: Coiffeur Dashboard Suite ✅ COMPLETED 2026-03-27

> **Wave 3** — Depends on R-CD1 (category-aware dashboard shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.
> **Commit**: `932950b` — all 7 phases executed, build passes, Zone 4 compliant.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Existing formula component | `ls components/dashboard/FormulaTab.tsx` | ✅ Exists (8KB) — uses `client_formulas` table. Must check if table exists before creating `colour_formulas`. |
| Existing formula table | `grep -rn "client_formulas" supabase/migrations/` | Check result determines if we extend or create |
| Intake form tab | `ls components/dashboard/IntakeFormTab.tsx` | ✅ Exists (9KB) — check if it handles coiffeur-specific intake |
| Intake templates | `grep -rn "hair_consultation\|coiffeur" lib/intake-templates.ts` | Check if spa/hair templates exist |
| Reminder cycle column | `grep -rn "reminder_cycle_days" supabase/migrations/` | Verify if `services.reminder_cycle_days` exists (nail infill already uses it) |
| Incomplete features | `cat _tasks/INCOMPLETE_FEATURES.md` | Check for related unfinished work |
| Completed tasks | `ls _tasks/completed/` | Check for past formula/coiffeur decisions |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟡 MEDIUM | RLS policies may block inserts | Add FOR ALL policy. Test with authenticated salon owner. Exact file at risk: `supabase/migrations/` (naming collision). |
| Phase 2: API routes | 🟡 MEDIUM | 500 if table doesn't exist yet, response format mismatch | Run migration BEFORE deploying. Verify response wraps in `{ data: ... }` (Rule 11). Files at risk: none existing. |
| Phase 3: FormulaBook | 🟢 SAFE | New component, additive | Follow existing `FormulaTab.tsx` pattern. |
| Phase 4: ConsultationNotes | 🟢 SAFE | New component, additive | Check `IntakeFormTab.tsx` for overlap. |
| Phase 5: ColourCycleConfig | 🟡 MEDIUM | Client spam if cycle is too aggressive | Default to 6 weeks. Require explicit opt-in per service. |
| Phase 6: Wire page | 🟡 MEDIUM | Page crash if components import wrong | Verify all imports resolve before committing. |
| Phase 7: i18n | 🟢 SAFE | Additive to locale files | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `colour_formulas` + `consultation_notes` tables
- Phase 2: API Routes — Formula CRUD + Consultation CRUD
- Phase 3: FormulaBook Component
- Phase 4: ConsultationNotes Component
- Phase 5: ColourCycleConfig Component
- Phase 6: Wire coiffeur-crm page
- Phase 7: i18n + Smoke Test

---

## Phase 1: DB Migration

> **Zone 4 constraints**: N/A (SQL migration file).
> ⚠️ **PRE-EXISTING CODE**: `components/dashboard/FormulaTab.tsx` (8KB) already exists but uses `client_formulas` table. Check if that table exists. If so, extend it. If not, create `colour_formulas`.

#### Files
- `[NEW]` `supabase/migrations/XXX_coiffeur_dashboard.sql`

#### Instructions
1. Check if `client_formulas` table exists (`grep -rn "client_formulas" supabase/migrations/`).
2. If it exists, use it. If not, create `colour_formulas`:

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
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

-- RLS (mandatory Rule 12b)
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

CREATE INDEX idx_colour_formulas_client ON colour_formulas(client_id, salon_id);
CREATE INDEX idx_consultation_notes_client ON consultation_notes(client_id, salon_id);
```

❌ **DON'T**
```sql
-- WRONG — missing RLS (violates Rule 12b)
CREATE TABLE colour_formulas (...);
-- No ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
-- No CREATE POLICY ...;

-- WRONG — using IF NOT EXISTS without checking existing tables first
-- Could create a duplicate table when client_formulas already exists
```

> ⚠️ **BE CAREFUL**:
> - Check existing `client_formulas` table first. `FormulaTab.tsx` already references formula data.
> - If `client_formulas` exists, add new columns (root_formula, mid_lengths_formula, ends_formula) to it instead of creating a new table.
> - RLS INSERT policies are mandatory (Rule 12b).
> - Migration filename must use timestamp prefix (e.g., `20260328000000_coiffeur_dashboard.sql`).

#### Verification
```bash
# Verify SQL syntax:
cat supabase/migrations/*coiffeur*.sql
git add supabase/migrations/ && git commit -m "R-CD2-P1: DB migration — colour_formulas + consultation_notes tables"
```

---

## Phase 2: API Routes

> **Zone 4 constraints**: N/A (API route files have no UI).

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

export async function GET(request: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... query with RLS
  return NextResponse.json({ data: formulas }); // Rule 11: consistent format
}
```

❌ **DON'T**
```tsx
// WRONG — using getUser() (Rule 25)
const { data: { user } } = await supabase.auth.getUser();
// WRONG — returning data without consistent format (Rule 11)
return NextResponse.json(formulas); // Should wrap: { data: formulas }
// WRONG — no Zod validation
const body = await request.json(); // Raw, unvalidated
```

> ⚠️ **BE CAREFUL**:
> - Verify response format matches frontend expectations (Rule 11): `{ data: ... }` for success, `{ error: ... }` for failure.
> - `getSession()` only — never `getUser()`.
> - Add Zod schema to `lib/validations.ts` if it grows beyond one route.
> - Test with a salon owner who is NOT the row's salon owner — should return empty results (RLS).

#### Verification
```bash
npm run build
npx tsc --noEmit
git add app/api/dashboard/coiffeur/ && git commit -m "R-CD2-P2: API routes — coiffeur formula + consultation CRUD"
```

---

## Phase 3: FormulaBook Component

> **Zone 4 constraints**: This is Zone 4. Use `rounded-[12px]`, `bg-white dark:bg-s-dm-surface`, `border border-s-ink/[0.06]`. ZERO glass, ZERO animation, ZERO Bebas Neue, ZERO shadows above `shadow-s-card`. Eyebrow: `text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber`.

#### Files
- `[NEW]` `components/dashboard/coiffeur/FormulaBook.tsx`

#### Instructions
1. Check existing `components/dashboard/FormulaTab.tsx` (8KB) — it may already be the formula book component.
2. If `FormulaTab.tsx` handles formula CRM for all salons, create `FormulaBook.tsx` as a wrapper/extension specifically for coiffeur CRM that adds:
   - Root / mid-lengths / ends formula sections
   - Brand + shade code searchable input
   - Processing time tracker
   - Copy-to-clipboard for formula text
3. Zone 4 compliance: `rounded-[12px]`, `bg-white dark:bg-s-dm-surface`, `border border-s-ink/[0.06]`, zero glass.
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
// WRONG — Bebas Neue font
<h3 className="font-display text-2xl">
```

> ⚠️ **BE CAREFUL**:
> - Check if `FormulaTab.tsx` already does what we need. If so, EXTEND rather than duplicate.
> - All text via `useTranslations()` — zero hardcoded strings.
> - Formula data (brand/shade codes) should not be exposed to other salons. Verify RLS.
> - Date formatting uses `toLocaleDateString("de-CH")` — but should use locale-aware formatting in production.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|shadow-lg" components/dashboard/coiffeur/FormulaBook.tsx
# Expected: 0 results
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P3: FormulaBook component for coiffeur CRM"
```

---

## Phase 4: ConsultationNotes Component

> **Zone 4 constraints**: This is Zone 4. `rounded-[12px]` max. Solid surfaces. No glass, no animation, no Bebas Neue.

#### Files
- `[NEW]` `components/dashboard/coiffeur/ConsultationNotes.tsx`

#### Instructions
1. Pre-appointment intake display: hair condition, scalp condition, client dislikes, desired outcome.
2. Stored per-visit — shows as a timeline per client.
3. "Add Note" modal with form fields.
4. Zone 4 compliance.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("consultation_history")}
  </p>
  {notes.map((n) => (
    <div key={n.id} className="py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("hair_condition")}</span>
          <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.hair_condition || "—"}</p>
        </div>
        <div>
          <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30">{t("desired_outcome")}</span>
          <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 mt-0.5">{n.desired_outcome || "—"}</p>
        </div>
      </div>
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — using a third-party modal with animation
<Dialog.Overlay className="bg-black/50 animate-fadeIn backdrop-blur-sm">
// WRONG — hardcoded German labels
<label>Haarzustand</label>
```

> ⚠️ **BE CAREFUL**:
> - Check if `IntakeFormTab.tsx` (9KB, in `components/dashboard/`) already handles consultation intake.
> - If it does, add coiffeur-specific fields to the existing intake template rather than creating a new component.
> - Verify `lib/intake-templates.ts` has a `hair_consultation` template.
> - "Add Note" modal should use the existing dashboard modal pattern — check for `DashboardModal` or similar shared component.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/coiffeur/ConsultationNotes.tsx
# Expected: 0 results
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P4: ConsultationNotes component for coiffeur CRM"
```

---

## Phase 5: ColourCycleConfig Component

> **Zone 4 constraints**: This is Zone 4. Config panel uses `rounded-[12px]`, solid surfaces. Toggle switches use `s-coral` active state.

#### Files
- `[NEW]` `components/dashboard/coiffeur/ColourCycleConfig.tsx`

#### Instructions
1. Configuration panel where salon owners set default colour service reminder cycles (4, 6, or 8 weeks).
2. Per-service toggle: "Enable colour reminders" on services in the `coiffeur` category.
3. Uses `services.reminder_cycle_days` column (same pattern as nail infill reminders).
4. Saves to services table via existing service update API.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const CYCLE_OPTIONS = [
  { value: 28, labelKey: "cycle_4_weeks" },
  { value: 42, labelKey: "cycle_6_weeks" },
  { value: 56, labelKey: "cycle_8_weeks" },
];

{CYCLE_OPTIONS.map((opt) => (
  <button key={opt.value}
    onClick={() => setCycle(opt.value)}
    className={`rounded-[12px] border px-4 py-2 text-xs font-heading font-semibold transition-colors duration-150 ${
      cycle === opt.value
        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
        : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/50 dark:text-s-dm-text/50"
    }`}>
    {t(opt.labelKey)}
  </button>
))}
```

❌ **DON'T**
```tsx
// WRONG — range slider with animation (Zone 4 violation)
<input type="range" className="accent-coral animate-slideIn" />
// WRONG — hardcoded cycle values without i18n
<span>4 Wochen</span>
```

> ⚠️ **BE CAREFUL**:
> - Check if `services.reminder_cycle_days` column exists (nail infill reminders already use it).
> - If it exists, reuse it. If not, add a migration in Phase 1.
> - This only configures the cycle — the actual cron/email sending is a separate roadmap.
> - Verify the existing service update API supports PATCH on `reminder_cycle_days`.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/coiffeur/ColourCycleConfig.tsx
# Expected: 0 results
git add components/dashboard/coiffeur/ && git commit -m "R-CD2-P5: ColourCycleConfig component for coiffeur reminder settings"
```

---

## Phase 6: Wire Coiffeur CRM Page

> **Zone 4 constraints**: This is Zone 4. Grid layout: `grid grid-cols-1 lg:grid-cols-2 gap-4`. Max radius `rounded-[12px]`. No decorative shadows.

#### Files
- `[MODIFY]` `app/[locale]/dashboard/coiffeur-crm/page.tsx`

#### Instructions
1. Replace the "Coming Soon" stub with actual components.
2. Layout: FormulaBook + ConsultationNotes side by side on desktop, stacked on mobile.
3. Client selector dropdown at top (search by name).
4. Zone 4 grid: `grid grid-cols-1 lg:grid-cols-2 gap-4`.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import FormulaBook from "@/components/dashboard/coiffeur/FormulaBook";
import ConsultationNotes from "@/components/dashboard/coiffeur/ConsultationNotes";
import ColourCycleConfig from "@/components/dashboard/coiffeur/ColourCycleConfig";

export default function CoiffeurCrmPage() {
  const t = useTranslations("dashboardCoiffeur");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  return (
    <div className="p-6">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-6">
        {t("title")}
      </h1>
      {/* Client selector + components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FormulaBook clientId={selectedClientId} />
        <ConsultationNotes clientId={selectedClientId} />
      </div>
      <div className="mt-6">
        <ColourCycleConfig />
      </div>
    </div>
  );
}
```

❌ **DON'T**
```tsx
// WRONG — importing from wrong path (orphaned import)
import FormulaBook from "@/components/coiffeur/FormulaBook"; // Path doesn't exist
// WRONG — using flex gap instead of grid (inconsistent with dashboard pattern)
<div className="flex flex-wrap gap-4">
```

> ⚠️ **BE CAREFUL**:
> - Import components from `@/components/dashboard/coiffeur/` — verify files exist first with `ls`.
> - Client selector needs salon's client list — use existing clients API (`/api/clients`).
> - Verify the stub page created in R-CD1 Phase 3 actually exists at this path before modifying.
> - Do NOT import components that haven't been built yet in earlier phases.

#### Verification
```bash
npm run build
# Verify all imports resolve:
grep -rn "import.*from.*coiffeur" app/[locale]/dashboard/coiffeur-crm/page.tsx
# Verify each imported component file exists:
ls components/dashboard/coiffeur/FormulaBook.tsx
ls components/dashboard/coiffeur/ConsultationNotes.tsx
ls components/dashboard/coiffeur/ColourCycleConfig.tsx
git add app/[locale]/dashboard/coiffeur-crm/ && git commit -m "R-CD2-P6: wire coiffeur CRM page with FormulaBook + ConsultationNotes + ColourCycleConfig"
```

---

## Phase 7: i18n + Smoke Test

> **Zone 4 constraints**: Verification phase — ensures all prior phases comply with Zone 4.

#### Files
- `[MODIFY]` `messages/de.json`
- `[MODIFY]` `messages/en.json`
- `[MODIFY]` `messages/fr.json`
- `[MODIFY]` `messages/it.json`

#### Instructions
Add full `dashboardCoiffeur` namespace with all component keys (formula labels, consultation labels, cycle labels).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```json
{
  "dashboardCoiffeur": {
    "eyebrow": "Coiffeur",
    "title": "Coiffeur CRM",
    "formula_history": "Farbformeln",
    "consultation_history": "Beratungsnotizen",
    "brand": "Marke",
    "shade_code": "Farbton",
    "mixing_ratio": "Mischverhältnis",
    "processing_minutes": "Einwirkzeit",
    "hair_condition": "Haarzustand",
    "scalp_condition": "Kopfhaut",
    "desired_outcome": "Gewünschtes Ergebnis",
    "cycle_4_weeks": "4 Wochen",
    "cycle_6_weeks": "6 Wochen",
    "cycle_8_weeks": "8 Wochen",
    "add_formula": "Formel hinzufügen",
    "add_note": "Notiz hinzufügen",
    "coming_soon": "Kommt bald"
  }
}
```

❌ **DON'T**
```json
// WRONG — only adding to de.json, forgetting en/fr/it
// WRONG — keys that don't match what components use
```

> ⚠️ **BE CAREFUL**:
> - ALL 4 locale files must have the same keys with translated values.
> - Verify every key used in FormulaBook, ConsultationNotes, and ColourCycleConfig has a translation.
> - Run `grep -rn 't("' components/dashboard/coiffeur/` to find all translation keys referenced.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify components exist:
ls components/dashboard/coiffeur/FormulaBook.tsx
ls components/dashboard/coiffeur/ConsultationNotes.tsx
ls components/dashboard/coiffeur/ColourCycleConfig.tsx

# Verify all components are imported in the page:
grep -rn "FormulaBook\|ConsultationNotes\|ColourCycleConfig" app/[locale]/dashboard/coiffeur-crm/page.tsx

# Verify no Zone 4 violations across all coiffeur files:
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-" \
  components/dashboard/coiffeur/ \
  app/[locale]/dashboard/coiffeur-crm/
# Expected: 0 results

# Verify i18n keys in all locales:
grep -rn "dashboardCoiffeur" messages/de.json messages/en.json messages/fr.json messages/it.json

git add messages/ && git commit -m "R-CD2-P7: i18n keys for coiffeur dashboard components"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | API routes | Phase 1 |
| Phase 3 | 🤖 | FormulaBook | Phase 2 |
| Phase 4 | 🤖 | ConsultationNotes | Phase 2 |
| Phase 5 | 🤖 | ColourCycleConfig | Nothing (uses existing services table) |
| Phase 6 | 🤖 | Wire page | Phase 3, 4, 5 |
| Phase 7 | 🤖 | i18n + Smoke Test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `components/dashboard/coiffeur/` with FormulaBook, ConsultationNotes, ColourCycleConfig
- `CLAUDE.md` Section 6 (Schema Table) — add `colour_formulas`, `consultation_notes` tables
- `_docs/category-system-map.md` §4.1 — update Coiffeur section with new tables, routes, and components
- `_rules/DB_SCHEMA.md` — add new table definitions

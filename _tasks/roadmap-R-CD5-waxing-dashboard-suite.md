# R-CD5: Waxing Studio Dashboard Suite

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Existing reminder config | `ls components/dashboard/nail/InfillReminderConfig.tsx` | ✅ Exists — same reminder pattern to follow |
| Reminder cycle column | `grep -rn "reminder_cycle_days" supabase/migrations/` | Check if `services.reminder_cycle_days` exists |
| Package manager | `find components/ -name "*Package*"` | Check if `PackageManager.tsx` exists for zone bundling |
| Existing waxing code | `grep -rn "waxing" lib/ components/ app/` | Verify no existing waxing-specific code |
| Incomplete features | `cat _tasks/INCOMPLETE_FEATURES.md` | Check for related unfinished work |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟢 SAFE | New tables, additive | — |
| Phase 2: Zone Selector | 🟢 SAFE | New component, additive | — |
| Phase 3: Sensitivity Log | 🟢 SAFE | New component, additive | — |
| Phase 4: Regrowth Reminders | 🟡 MEDIUM | Could conflict with nail infill reminder logic | Verify `services.reminder_cycle_days` column exists and is reusable across categories. |
| Phase 5: Zone Packages | 🟡 MEDIUM | May conflict with existing `service_packages` logic | Check `PackageManager.tsx` pattern before creating parallel system. |
| Phase 6: Wire page | 🟡 MEDIUM | Crash if imports wrong | Verify all component files exist. |
| Phase 7: i18n | 🟢 SAFE | Additive | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `waxing_zone_preferences`, `waxing_sensitivity_log`
- Phase 2: Body Zone Selector Component
- Phase 3: Sensitivity & Reaction Log
- Phase 4: Regrowth Cycle Reminder Config
- Phase 5: Zone Package Pricing
- Phase 6: Wire waxing-admin page
- Phase 7: i18n + Smoke Test

---

## Phase 1: DB Migration

> **Zone 4 constraints**: N/A (SQL migration file).

#### Files
- `[NEW]` `supabase/migrations/XXX_waxing_dashboard.sql`

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```sql
CREATE TABLE IF NOT EXISTS waxing_zone_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  zones_selected TEXT[] NOT NULL,
  wax_type_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waxing_sensitivity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reaction_level TEXT,
  affected_zones TEXT[],
  medications TEXT,
  sun_exposure_recent BOOLEAN DEFAULT false,
  aftercare_provided TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE waxing_zone_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE waxing_sensitivity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_waxing_zones" ON waxing_zone_preferences
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_waxing_sensitivity" ON waxing_sensitivity_log
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE INDEX idx_waxing_zones_client ON waxing_zone_preferences(client_id, salon_id);
CREATE INDEX idx_waxing_sensitivity_client ON waxing_sensitivity_log(client_id, salon_id);
```

❌ **DON'T**
```sql
-- WRONG — storing medications without RLS (health data exposure)
CREATE TABLE waxing_sensitivity_log (...);
-- Missing ENABLE ROW LEVEL SECURITY!
```

> ⚠️ **BE CAREFUL**:
> - Medication data (retinol, accutane) is health-sensitive. Same RLS protection as spa intake.
> - RLS INSERT policy is mandatory (Rule 12b).
> - `reaction_level` should be constrained to valid values: none, mild, moderate, severe.

#### Verification
```bash
cat supabase/migrations/*waxing*.sql
git add supabase/migrations/ && git commit -m "R-CD5-P1: DB migration — waxing_zone_preferences + waxing_sensitivity_log"
```

---

## Phase 2: Body Zone Selector

> **Zone 4 constraints**: This is Zone 4. Zone buttons use `rounded-[12px]`, `border border-s-ink/[0.06]`. Selected state: `border-s-coral bg-s-coral/[0.06] text-s-coral`. Only `transition-colors duration-150` allowed.

#### Files
- `[NEW]` `components/dashboard/waxing/BodyZoneSelector.tsx`
- `[NEW]` `app/api/dashboard/waxing/zone-preferences/route.ts`

#### Instructions
1. Simplified body zone selector — NOT a detailed SVG body (that's R-CD7). Use a clickable grid with body zone icons.
2. Zones: Full Legs, Half Legs (Upper), Half Legs (Lower), Bikini, Brazilian, Underarms, Full Arms, Half Arms, Full Face, Upper Lip, Chin, Back, Chest, Stomach.
3. Multi-select: toggle zones on/off. Show total selected count.
4. Per-zone: wax type preference dropdown (hard wax / strip wax / sugaring).
5. Save per client → auto-pre-fill on next visit.
6. Common combos as presets: "Full Body", "Lower Body", "Face Package".

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const WAXING_ZONES = [
  { key: "full_legs", labelKey: "zones.full_legs", icon: Footprints },
  { key: "bikini", labelKey: "zones.bikini", icon: Shield },
  { key: "underarms", labelKey: "zones.underarms", icon: CircleDot },
];

{WAXING_ZONES.map(zone => (
  <button key={zone.key}
    onClick={() => toggleZone(zone.key)}
    className={`rounded-[12px] border p-3 flex items-center gap-3 transition-colors duration-150 ${
      selected.includes(zone.key)
        ? "border-s-coral bg-s-coral/[0.06] text-s-coral"
        : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06] text-s-ink/60 dark:text-s-dm-text/60"
    }`}>
    <zone.icon size={16} />
    <span className="text-xs font-heading font-semibold">{t(zone.labelKey)}</span>
  </button>
))}
```

❌ **DON'T**
```tsx
// WRONG — complex SVG body diagram (that's R-CD7)
import BodyDiagram from "@/components/shared/BodyDiagram";
// WRONG — animation on selection
<motion.button animate={{ scale: selected ? 1.05 : 1 }}>
// WRONG — glass in Zone 4
<div className="backdrop-blur-lg rounded-xl">
```

> ⚠️ **BE CAREFUL**:
> - Zone 4 — no animation on selection. Use `transition-colors duration-150` only.
> - API route: `getSession()` (Rule 25), Zod validation, `{ data: ... }` format (Rule 11).
> - Presets ("Full Body", etc.) should be i18n keys, NOT hardcoded strings.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/waxing/BodyZoneSelector.tsx
# Expected: 0 results
git add components/dashboard/waxing/ app/api/dashboard/waxing/ && git commit -m "R-CD5-P2: BodyZoneSelector — zone selection with wax type preferences"
```

---

## Phase 3: Sensitivity & Reaction Log

> **Zone 4 constraints**: This is Zone 4. Severity badges use semantic status colors: `text-s-success` (none), `text-s-warning` (mild/moderate), `text-s-error` (severe). No glass, no animation.

#### Files
- `[NEW]` `components/dashboard/waxing/SensitivityLog.tsx`
- `[NEW]` `app/api/dashboard/waxing/sensitivity/route.ts`

#### Instructions
1. Per-client log of skin reactions and sensitivity data.
2. Fields: reaction level (none/mild/moderate/severe), affected zones, medications, sun exposure flag, aftercare notes.
3. Display as timeline with severity badges.
4. High-sensitivity clients get a warning flag in their CRM profile.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const SEVERITY_STYLES: Record<string, string> = {
  none: "bg-s-success/10 text-s-success",
  mild: "bg-s-warning/10 text-s-warning",
  moderate: "bg-s-coral/10 text-s-coral",
  severe: "bg-s-error/10 text-s-error",
};

<span className={`text-[10px] font-heading font-bold uppercase tracking-[.10em] px-2 py-0.5 rounded-[6px] ${SEVERITY_STYLES[entry.reaction_level]}`}>
  {t(`severity.${entry.reaction_level}`)}
</span>

{entry.reaction_level === "severe" && (
  <div className="rounded-[8px] bg-s-error/[0.06] border border-s-error/20 p-2 mt-2">
    <p className="text-[10px] font-heading font-bold text-s-error">{t("severe_warning")}</p>
  </div>
)}
```

❌ **DON'T**
```tsx
// WRONG — using arbitrary colors instead of status tokens
<span className="bg-red-500 text-white"> // Use s-error, not red-500
// WRONG — animated warning banner
<motion.div animate={{ y: 0 }} initial={{ y: -20 }}>
```

> ⚠️ **BE CAREFUL**:
> - Use semantic status colors from UI_RULES.md §15b: `s-success` (none), `s-warning` (mild/moderate), `s-error` (severe).
> - "Severe" entries should show a persistent warning banner on the client's profile.
> - Medication field is free-text — DO NOT create a checkbox list of specific drugs.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion\|red-\|green-\|yellow-" components/dashboard/waxing/SensitivityLog.tsx
# Expected: 0 results (no arbitrary colors)
git add components/dashboard/waxing/ app/api/dashboard/waxing/ && git commit -m "R-CD5-P3: SensitivityLog — skin reaction tracking with severity levels"
```

---

## Phase 4: Regrowth Cycle Reminder Config

> **Zone 4 constraints**: This is Zone 4. Same pattern as `InfillReminderConfig.tsx`. Cycle buttons use `rounded-[12px]` with `border-s-coral` active state.

#### Files
- `[NEW]` `components/dashboard/waxing/RegrowthConfig.tsx`

#### Instructions
1. Same pattern as nail `InfillReminderConfig.tsx` and coiffeur `ColourCycleConfig.tsx`.
2. Configure default regrowth cycle per waxing service (typically 4-6 weeks).
3. Uses `services.reminder_cycle_days` column.
4. Auto-reminder logic reuses existing cron infrastructure.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const REGROWTH_OPTIONS = [
  { value: 21, labelKey: "cycle_3_weeks" },
  { value: 28, labelKey: "cycle_4_weeks" },
  { value: 35, labelKey: "cycle_5_weeks" },
  { value: 42, labelKey: "cycle_6_weeks" },
];

{REGROWTH_OPTIONS.map(opt => (
  <button key={opt.value} onClick={() => setCycle(opt.value)}
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
// WRONG — slider Input (Zone 4 violation — too decorative)
<input type="range" className="accent-coral" />
// WRONG — hardcoded German
<span>4 Wochen</span>
```

> ⚠️ **BE CAREFUL**:
> - Verify `services.reminder_cycle_days` column exists (shared with nail infill reminders).
> - If it doesn't exist, add a migration in Phase 1 instead.
> - This only configures the cycle — the actual cron/email is separate.
> - Model after `InfillReminderConfig.tsx` exactly.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/waxing/RegrowthConfig.tsx
# Expected: 0 results
git add components/dashboard/waxing/ && git commit -m "R-CD5-P4: RegrowthConfig — waxing cycle reminder settings"
```

---

## Phase 5: Zone Package Pricing

> **Zone 4 constraints**: This is Zone 4. Package cards use `rounded-[12px]`, `border border-s-ink/[0.06]`. Discount badge: `bg-s-coral/10 text-s-coral`.

#### Files
- `[NEW]` `components/dashboard/waxing/ZonePackages.tsx`

#### Instructions
1. Create multi-zone discount packages: e.g., "Full Body" = 20% off, "Lower Body" = 10% off.
2. Uses existing `service_packages` table pattern OR a new approach.
3. Check existing `PackageManager.tsx` for reference.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("zone_packages")}
  </p>
  {packages.map(pkg => (
    <div key={pkg.id} className="flex items-center justify-between py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <div>
        <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{pkg.name}</p>
        <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{pkg.zones.join(", ")}</p>
      </div>
      <span className="text-[10px] font-heading font-bold bg-s-coral/10 text-s-coral px-2 py-0.5 rounded-[6px]">
        -{pkg.discount_percent}%
      </span>
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — shadow-lg card
<div className="rounded-xl shadow-lg">
// WRONG — duplicating PackageManager logic instead of extending
```

> ⚠️ **BE CAREFUL**:
> - Check if `PackageManager.tsx` already supports zone-based bundling. If so, extend rather than duplicate.
> - If creating new approach, verify it doesn't conflict with existing `service_packages` table.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|shadow-lg\|animate-" components/dashboard/waxing/ZonePackages.tsx
# Expected: 0 results
git add components/dashboard/waxing/ && git commit -m "R-CD5-P5: ZonePackages — multi-zone discount bundles"
```

---

## Phase 6: Wire waxing-admin Page

> **Zone 4 constraints**: This is Zone 4. Tab layout with `border-b border-s-ink/[0.06]` tab bar. Active: `border-s-coral text-s-coral`.

#### Files
- `[MODIFY]` `app/[locale]/dashboard/waxing-admin/page.tsx`

#### Instructions
1. Replace stub with: BodyZoneSelector, SensitivityLog, RegrowthConfig, ZonePackages.
2. Client selector dropdown at top. Global configs (RegrowthConfig, ZonePackages) in "Settings" tab.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="p-6">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
    {t("eyebrow")}
  </p>
  <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-6">
    {t("title")}
  </h1>
  {activeTab === "client" && selectedClientId && (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <BodyZoneSelector clientId={selectedClientId} />
      <SensitivityLog clientId={selectedClientId} />
    </div>
  )}
  {activeTab === "settings" && (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <RegrowthConfig />
      <ZonePackages />
    </div>
  )}
</div>
```

❌ **DON'T**
```tsx
// WRONG — importing nonexistent component
import WaxingCalendar from "@/components/dashboard/waxing/WaxingCalendar";
```

> ⚠️ **BE CAREFUL**:
> - Verify all 4 component files exist before importing.
> - Verify the stub page from R-CD1 exists at this path.

#### Verification
```bash
npm run build
ls components/dashboard/waxing/BodyZoneSelector.tsx
ls components/dashboard/waxing/SensitivityLog.tsx
ls components/dashboard/waxing/RegrowthConfig.tsx
ls components/dashboard/waxing/ZonePackages.tsx
git add app/[locale]/dashboard/waxing-admin/ && git commit -m "R-CD5-P6: wire waxing-admin page with all waxing components"
```

---

## Phase 7: i18n + Smoke Test

> **Zone 4 constraints**: Verification phase.

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Instructions
Add `dashboardWaxing` namespace with all component keys including zone labels, severity labels, cycle labels.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```json
{
  "dashboardWaxing": {
    "eyebrow": "Waxing",
    "title": "Waxing Studio",
    "zones": { "full_legs": "Ganze Beine", "bikini": "Bikini", "underarms": "Achseln" },
    "severity": { "none": "Keine", "mild": "Leicht", "moderate": "Mittel", "severe": "Stark" },
    "severe_warning": "⚠ Schwere Reaktion dokumentiert",
    "zone_packages": "Zonen-Pakete",
    "cycle_3_weeks": "3 Wochen",
    "cycle_4_weeks": "4 Wochen",
    "coming_soon": "Kommt bald"
  }
}
```

❌ **DON'T**
```json
// WRONG — missing zone labels used by BodyZoneSelector
// WRONG — missing severity labels used by SensitivityLog
```

> ⚠️ **BE CAREFUL**:
> - ALL 4 locale files must have identical key structures.
> - ALL zone keys referenced in `WAXING_ZONES` array must have translations.
> - Run `grep -rn 't("' components/dashboard/waxing/` to find all key references.

#### Verification
```bash
npm run build && npx tsc --noEmit

ls components/dashboard/waxing/BodyZoneSelector.tsx
ls components/dashboard/waxing/SensitivityLog.tsx
ls components/dashboard/waxing/RegrowthConfig.tsx
ls components/dashboard/waxing/ZonePackages.tsx

grep -rn "BodyZoneSelector\|SensitivityLog\|RegrowthConfig\|ZonePackages" app/[locale]/dashboard/waxing-admin/page.tsx

grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-\|motion" \
  components/dashboard/waxing/ \
  app/[locale]/dashboard/waxing-admin/
# Expected: 0 results

grep -rn "dashboardWaxing" messages/de.json messages/en.json messages/fr.json messages/it.json

git add messages/ && git commit -m "R-CD5-P7: i18n keys for waxing dashboard components"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | BodyZoneSelector | Phase 1 |
| Phase 3 | 🤖 | SensitivityLog | Phase 1 |
| Phase 4 | 🤖 | RegrowthConfig | Nothing (uses existing services column) |
| Phase 5 | 🤖 | ZonePackages | Nothing |
| Phase 6 | 🤖 | Wire page | Phase 2-5 |
| Phase 7 | 🤖 | i18n + Smoke Test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `components/dashboard/waxing/` with all components
- `CLAUDE.md` Section 6 (Schema Table) — add `waxing_zone_preferences`, `waxing_sensitivity_log` tables
- `_docs/category-system-map.md` §4.5 — update Waxing section with tables, routes, components
- `_rules/DB_SCHEMA.md` — add new table definitions

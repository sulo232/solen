# R-CD5: Waxing Studio Dashboard Suite

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟢 SAFE | New tables, additive | — |
| Phase 2: Zone Selector | 🟡 MEDIUM | SVG rendering on mobile | Test SVG viewBox in `max-w-[400px]` container. |
| Phase 3: Sensitivity Log | 🟢 SAFE | New component | — |
| Phase 4: Regrowth Reminders | 🟢 SAFE | Extends existing reminder pattern | Check `services.reminder_cycle_days` exists. |

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

#### Files
- `[NEW]` `supabase/migrations/XXX_waxing_dashboard.sql`

#### Instructions
```sql
CREATE TABLE IF NOT EXISTS waxing_zone_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  zones_selected TEXT[] NOT NULL,        -- ["full_legs", "bikini", "underarms"]
  wax_type_preferences JSONB DEFAULT '{}', -- {"legs": "hard", "bikini": "strip"}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waxing_sensitivity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reaction_level TEXT,                   -- "none", "mild", "moderate", "severe"
  affected_zones TEXT[],
  medications TEXT,                       -- e.g. "retinol", "accutane"
  sun_exposure_recent BOOLEAN DEFAULT false,
  aftercare_provided TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE waxing_zone_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE waxing_sensitivity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_waxing_zones" ON waxing_zone_preferences
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "salon_owner_waxing_sensitivity" ON waxing_sensitivity_log
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

> ⚠️ **BE CAREFUL**: Medication data (retinol, accutane) is health-sensitive. Same RLS protection as spa intake.

#### Verification
```bash
git add supabase/migrations/ && git commit -m "R-CD5-P1: DB migration — waxing_zone_preferences + waxing_sensitivity_log"
```

---

## Phase 2: Body Zone Selector

#### Files
- `[NEW]` `components/dashboard/waxing/BodyZoneSelector.tsx`
- `[NEW]` `app/api/dashboard/waxing/zone-preferences/route.ts`

#### Instructions
1. Simplified body zone diagram — NOT a detailed SVG body (that's R-CD7). Use a clickable list with body zone icons from lucide-react.
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
  // ...
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

❌ **DON'T**: Complex SVG body diagram (that's for the shared framework R-CD7). Use a clean list/grid now.

> ⚠️ **BE CAREFUL**: Zone 4 — no animation on selection. Use `transition-colors duration-150` only (colour change allowed).

#### Verification
```bash
git add components/dashboard/waxing/ app/api/dashboard/waxing/ && git commit -m "R-CD5-P2: BodyZoneSelector — zone selection with wax type preferences"
npm run build
```

---

## Phase 3: Sensitivity & Reaction Log

#### Files
- `[NEW]` `components/dashboard/waxing/SensitivityLog.tsx`
- `[NEW]` `app/api/dashboard/waxing/sensitivity/route.ts`

#### Instructions
1. Per-client log of skin reactions and sensitivity data.
2. Fields: reaction level (none/mild/moderate/severe), affected zones, medications, sun exposure flag, aftercare notes.
3. Display as timeline with severity badges (colour-coded: green=none, amber=mild, coral=moderate, red=severe).
4. High-sensitivity clients get a warning flag in their CRM profile.

> ⚠️ **BE CAREFUL**:
> - Use semantic status colors from UI_RULES.md §15b: `s-success` (none), `s-warning` (mild/moderate), `s-error` (severe).
> - "Severe" entries should show a persistent warning banner on the client's profile.

#### Verification
```bash
git add components/dashboard/waxing/ app/api/dashboard/waxing/ && git commit -m "R-CD5-P3: SensitivityLog — skin reaction tracking with severity levels"
npm run build
```

---

## Phase 4: Regrowth Cycle Reminder Config

#### Files
- `[NEW]` `components/dashboard/waxing/RegrowthConfig.tsx`

#### Instructions
1. Same pattern as nail `InfillReminderConfig.tsx` and coiffeur `ColourCycleConfig.tsx`.
2. Configure default regrowth cycle per waxing service (typically 4-6 weeks).
3. Uses `services.reminder_cycle_days` column.
4. Auto-reminder logic reuses existing cron infrastructure.

> ⚠️ **BE CAREFUL**: Verify `services.reminder_cycle_days` column exists (shared with nail infill reminders).

#### Verification
```bash
git add components/dashboard/waxing/ && git commit -m "R-CD5-P4: RegrowthConfig — waxing cycle reminder settings"
npm run build
```

---

## Phase 5: Zone Package Pricing

#### Files
- `[NEW]` `components/dashboard/waxing/ZonePackages.tsx`

#### Instructions
1. Create multi-zone discount packages: e.g., "Full Body" = 20% off, "Lower Body" = 10% off.
2. Uses existing `service_packages` table pattern OR a new `waxing_zone_packages` approach.
3. Check existing `PackageManager.tsx` for reference.

> ⚠️ **BE CAREFUL**: Check if `PackageManager.tsx` already supports zone-based bundling. If so, extend rather than duplicate.

#### Verification
```bash
git add components/dashboard/waxing/ && git commit -m "R-CD5-P5: ZonePackages — multi-zone discount bundles"
npm run build
```

---

## Phase 6: Wire waxing-admin Page

#### Files
- `[MODIFY]` `app/[locale]/dashboard/waxing-admin/page.tsx`

#### Instructions
1. Replace stub with: BodyZoneSelector, SensitivityLog, RegrowthConfig, ZonePackages.
2. Client selector dropdown at top. Global configs (RegrowthConfig, ZonePackages) in "Settings" tab.

#### Verification
```bash
git add app/[locale]/dashboard/waxing-admin/ && git commit -m "R-CD5-P6: wire waxing-admin page with all waxing components"
npm run build
```

---

## Phase 7: i18n + Smoke Test

```bash
npm run build && npx tsc --noEmit
ls components/dashboard/waxing/BodyZoneSelector.tsx
ls components/dashboard/waxing/SensitivityLog.tsx
ls components/dashboard/waxing/RegrowthConfig.tsx
ls components/dashboard/waxing/ZonePackages.tsx
grep -rn "BodyZoneSelector\|SensitivityLog\|RegrowthConfig\|ZonePackages" app/ --include="*.tsx"
grep -rn "backdrop-blur\|glass\|font-display" components/dashboard/waxing/
# Expected: 0 results
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | BodyZoneSelector | Phase 1 |
| Phase 3 | 🤖 | SensitivityLog | Phase 1 |
| Phase 4 | 🤖 | RegrowthConfig | Nothing |
| Phase 5 | 🤖 | ZonePackages | Nothing |
| Phase 6 | 🤖 | Wire page | Phase 2-5 |
| Phase 7 | 🤖 | Smoke Test | All phases |

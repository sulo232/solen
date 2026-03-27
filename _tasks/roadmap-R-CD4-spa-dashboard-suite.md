# R-CD4: Spa & Wellness Dashboard Suite ✅ DONE

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Status**: Completed 2026-03-27.
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Existing station manager | `ls components/dashboard/nail/StationManager.tsx` | ✅ Exists — same room/station pattern to follow |
| Intake templates | `grep -rn "spa_consultation" lib/intake-templates.ts` | Check if spa template exists |
| IntakeFormTab | `ls components/dashboard/IntakeFormTab.tsx` | ✅ Exists (9KB) — may already handle spa intake |
| Chair manager pattern | `ls components/dashboard/barber/ChairManager.tsx` | ✅ Exists — utilization bar pattern to reuse |
| Incomplete features | `cat _tasks/INCOMPLETE_FEATURES.md` | Check for related unfinished work |
| Completed tasks | `ls _tasks/completed/` | Check for past spa decisions |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟡 MEDIUM | RLS policies may block inserts | Add FOR ALL policy. Test with salon owner auth. |
| Phase 2: Room Scheduler | 🟡 MEDIUM | Calendar conflicts if room + staff slots clash | Room scheduler is ADDITIVE — does not replace staff-based calendar. Do NOT modify slot generation. |
| Phase 3: Intake Builder | 🟢 SAFE | Extends existing intake system | Check `lib/intake-templates.ts` for `spa_consultation`. |
| Phase 4: Wellness Journal | 🟢 SAFE | New component, additive | — |
| Phase 5: Wire page | 🟡 MEDIUM | Crash if component imports wrong | Verify all imports resolve. |
| Phase 6: i18n | 🟢 SAFE | Additive | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `spa_treatment_rooms`, `wellness_journals`
- Phase 2: Treatment Room Scheduler
- Phase 3: Spa Intake Questionnaire
- Phase 4: Wellness Journal Component
- Phase 5: Wire spa-admin page
- Phase 6: i18n + Smoke Test

---

## Phase 1: DB Migration

> **Zone 4 constraints**: N/A (SQL migration file).

#### Files
- `[NEW]` `supabase/migrations/XXX_spa_dashboard.sql`

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```sql
CREATE TABLE IF NOT EXISTS spa_treatment_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT DEFAULT 'treatment',
  capacity INT DEFAULT 1,
  prep_buffer_minutes INT DEFAULT 15,
  cooldown_buffer_minutes INT DEFAULT 10,
  equipment TEXT[],
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wellness_journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  tension_areas TEXT[],
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  skin_condition TEXT,
  pressure_preference TEXT,
  products_used TEXT[],
  aftercare_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spa_treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_spa_rooms" ON spa_treatment_rooms
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_wellness_journals" ON wellness_journals
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE INDEX idx_wellness_journals_client ON wellness_journals(client_id, salon_id);
```

❌ **DON'T**
```sql
-- WRONG — missing RLS (violates Rule 12b)
CREATE TABLE spa_treatment_rooms (...);
-- No ENABLE ROW LEVEL SECURITY

-- WRONG — no index on client_id (slow queries for per-client journal)
```

> ⚠️ **BE CAREFUL**:
> - Room management follows the same pattern as `nail_stations` and `barber_chairs`. Check `StationManager.tsx` for reference.
> - Wellness journals are per-visit per-client — similar to `barber_cut_history` pattern.
> - `pain_level` CHECK constraint (1-10) must be enforced at DB level.
> - Health data in `wellness_journals` is sensitive — RLS is mandatory.

#### Verification
```bash
cat supabase/migrations/*spa*.sql
git add supabase/migrations/ && git commit -m "R-CD4-P1: DB migration — spa_treatment_rooms + wellness_journals"
```

---

## Phase 2: Treatment Room Scheduler

> **Zone 4 constraints**: This is Zone 4. Cards use `rounded-[12px]`, `border border-s-ink/[0.06]`. Utilization bars use `bg-s-coral` fill. No glass, no animation, no Bebas Neue.

#### Files
- `[NEW]` `components/dashboard/spa/RoomManager.tsx`
- `[NEW]` `app/api/dashboard/spa/rooms/route.ts`

#### Instructions
1. Room CRUD: add, edit, remove treatment rooms.
2. Room config: name, type (treatment/sauna/pool/steam), capacity, prep buffer, cooldown buffer, equipment checklist.
3. Utilization bar per room (same pattern as `ChairManager.tsx`).
4. Model after existing `StationManager.tsx` but adapted for spa rooms.
5. Zone 4 compliance: `rounded-[12px]`, solid surfaces only.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("treatment_rooms")}
  </p>
  {rooms.map(room => (
    <div key={room.id} className="flex items-center gap-3 py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <div className="flex-1">
        <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{room.name}</p>
        <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{t(`room_type.${room.room_type}`)}</span>
      </div>
      <div className="w-24 h-2 rounded-full bg-s-ink/[0.06] dark:bg-s-dm-text/[0.06] overflow-hidden">
        <div className="h-full bg-s-coral rounded-full" style={{ width: `${room.utilization}%` }} />
      </div>
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — duplicating staff calendar for rooms
import BookingCalendar from "@/components/BookingCalendar"; // Room scheduler is NOT a calendar
// WRONG — glass in Zone 4
<div className="backdrop-blur-lg rounded-xl shadow-lg">
```

> ⚠️ **BE CAREFUL**:
> - Read `components/dashboard/nail/StationManager.tsx` first — same pattern applies.
> - Do NOT integrate with slot generation yet (that's a separate calendar roadmap).
> - Room equipment is an array of strings — UI uses checkboxes.
> - API route uses `getSession()` (Rule 25), Zod validation, `{ data: ... }` format (Rule 11).

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/spa/RoomManager.tsx
# Expected: 0 results
git add components/dashboard/spa/ app/api/dashboard/spa/ && git commit -m "R-CD4-P2: RoomManager — spa treatment room CRUD + utilization"
```

---

## Phase 3: Spa Intake Questionnaire

> **Zone 4 constraints**: This is Zone 4. Form inputs use `rounded-[8px]`, `border border-s-ink/[0.10]`. Labels use `text-[10px] font-heading font-bold uppercase tracking-[.10em]`. No glass, no animation.

#### Files
- `[MODIFY]` `lib/intake-templates.ts` (add `spa_consultation` template)
- `[NEW]` `components/dashboard/spa/SpaIntake.tsx`

#### Instructions
1. Check if `spa_consultation` already exists in `lib/intake-templates.ts`.
2. If not, add spa-specific intake fields: contraindications, pregnancy status, blood pressure issues, recent surgeries, allergies, skin conditions, pressure preference, areas to avoid, areas to focus on.
3. Component renders the intake form in a Zone 4 card.
4. Saves responses to existing `intake_forms` table.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("health_questionnaire")}
  </p>
  <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 mb-4 italic">
    {t("confidentiality_notice")}
  </p>
  {SPA_FIELDS.map(field => (
    <div key={field.key} className="mb-3">
      <label className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/50 dark:text-s-dm-text/50 block mb-1">
        {t(field.labelKey)}
      </label>
      <input className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-3 py-2 text-xs bg-transparent text-s-ink dark:text-s-dm-text" />
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — no confidentiality notice for health data
// WRONG — using a third-party form library with animations
<AnimatedForm className="backdrop-blur-sm">
// WRONG — hardcoded German
<label>Kontraindikationen</label>
```

> ⚠️ **BE CAREFUL**:
> - Health data (contraindications, pregnancy) is SENSITIVE. Ensure it's never exposed to other clients.
> - Use existing `IntakeFormTab.tsx` patterns — don't create a parallel system.
> - Spa intake includes medical questions — add a disclaimer text: "This information is confidential and used only by your therapist."
> - Check if `IntakeFormTab.tsx` already accepts category-specific templates. If so, add `spa_consultation` to the template registry only.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/spa/SpaIntake.tsx
# Expected: 0 results
git add lib/intake-templates.ts components/dashboard/spa/ && git commit -m "R-CD4-P3: SpaIntake — spa consultation questionnaire with health fields"
```

---

## Phase 4: Wellness Journal

> **Zone 4 constraints**: This is Zone 4. Timeline entries use `border-b border-s-ink/[0.04]` dividers. Pain level bar uses `bg-s-coral` fill at proportional width. No glass, no animation.

#### Files
- `[NEW]` `components/dashboard/spa/WellnessJournal.tsx`
- `[NEW]` `app/api/dashboard/spa/wellness-journal/route.ts`

#### Instructions
1. Per-client wellness timeline showing visit history with: tension areas, pain levels, skin condition progression, products used.
2. Pain level uses a horizontal bar (1-10 scale) — Zone 4 visual.
3. Tension areas use a simple text list (body diagram is in R-CD7).
4. "Add Entry" form for post-session notes.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-3">
    {t("wellness_journal")}
  </p>
  {entries.map(e => (
    <div key={e.id} className="py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">
          {new Date(e.created_at).toLocaleDateString()}
        </span>
        <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{e.pressure_preference}</span>
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-heading font-bold uppercase tracking-[.10em] text-s-ink/30 dark:text-s-dm-text/30 w-16 shrink-0">{t("pain")}</span>
        <div className="flex-1 h-2 rounded-full bg-s-ink/[0.06] dark:bg-s-dm-text/[0.06] overflow-hidden">
          <div className="h-full bg-s-coral rounded-full" style={{ width: `${(e.pain_level / 10) * 100}%` }} />
        </div>
        <span className="text-[10px] data-text font-bold text-s-ink/50 dark:text-s-dm-text/50 w-6 text-right">{e.pain_level}</span>
      </div>
      {e.tension_areas?.length > 0 && (
        <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50 mt-1">{t("tension")}: {e.tension_areas.join(", ")}</p>
      )}
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — animated progress bar
<motion.div animate={{ width: `${pain}%` }} className="bg-coral">
// WRONG — using a body SVG here (that's R-CD7)
import BodyDiagram from "@/components/shared/BodyDiagram";
```

> ⚠️ **BE CAREFUL**:
> - Keep it simple — text-based timeline now, visual body diagram later (R-CD7).
> - Verify response format consistency (Rule 11): `{ data: entries }`.
> - API route uses `getSession()` (Rule 25), Zod validation.
> - Pain level is a 1-10 integer — validate at API level with `z.number().int().min(1).max(10)`.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/spa/WellnessJournal.tsx
# Expected: 0 results
git add components/dashboard/spa/ app/api/dashboard/spa/ && git commit -m "R-CD4-P4: WellnessJournal — per-client spa visit timeline with pain tracking"
```

---

## Phase 5: Wire spa-admin Page

> **Zone 4 constraints**: This is Zone 4. Tab layout uses `border-b border-s-ink/[0.06]` with `text-s-coral` active tab indicator.

#### Files
- `[MODIFY]` `app/[locale]/dashboard/spa-admin/page.tsx`

#### Instructions
1. Replace stub with: RoomManager (top), SpaIntake (client-specific), WellnessJournal (client-specific).
2. Client selector dropdown at top.
3. Tab layout: "Rooms" tab (always visible) + "Client" tab (shows intake + journal for selected client).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const [activeTab, setActiveTab] = useState<"rooms" | "client">("rooms");

<div className="flex gap-4 border-b border-s-ink/[0.06] dark:border-s-dm-text/[0.06] mb-6">
  {(["rooms", "client"] as const).map(tab => (
    <button key={tab} onClick={() => setActiveTab(tab)}
      className={`pb-2 text-xs font-heading font-semibold transition-colors duration-150 border-b-2 ${
        activeTab === tab
          ? "border-s-coral text-s-coral"
          : "border-transparent text-s-ink/40 dark:text-s-dm-text/40"
      }`}>
      {t(`tabs.${tab}`)}
    </button>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — animated tab transitions
<motion.div key={activeTab} animate={{ opacity: 1 }} initial={{ opacity: 0 }}>
// WRONG — importing nonexistent component
import SpaCalendar from "@/components/dashboard/spa/SpaCalendar"; // Doesn't exist
```

> ⚠️ **BE CAREFUL**:
> - Import components from `@/components/dashboard/spa/` — verify files exist first with `ls`.
> - Client selector needs salon's client list — use existing clients API.
> - Verify the stub page from R-CD1 exists before modifying.

#### Verification
```bash
npm run build
# Verify imports:
grep -rn "import.*from.*spa" app/[locale]/dashboard/spa-admin/page.tsx
ls components/dashboard/spa/RoomManager.tsx
ls components/dashboard/spa/SpaIntake.tsx
ls components/dashboard/spa/WellnessJournal.tsx
git add app/[locale]/dashboard/spa-admin/ && git commit -m "R-CD4-P5: wire spa-admin page with rooms, intake, journal"
```

---

## Phase 6: i18n + Smoke Test

> **Zone 4 constraints**: Verification phase — ensures all prior phases comply with Zone 4.

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Instructions
Add `dashboardSpa` namespace with all component keys.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```json
{
  "dashboardSpa": {
    "eyebrow": "Spa & Wellness",
    "title": "Spa Verwaltung",
    "treatment_rooms": "Behandlungsräume",
    "room_type": { "treatment": "Behandlung", "sauna": "Sauna", "pool": "Pool", "steam": "Dampf" },
    "health_questionnaire": "Gesundheitsfragebogen",
    "confidentiality_notice": "Diese Angaben sind vertraulich und nur für Ihren Therapeuten bestimmt.",
    "wellness_journal": "Wellness-Journal",
    "pain": "Schmerz",
    "tension": "Spannung",
    "tabs": { "rooms": "Räume", "client": "Klient" },
    "coming_soon": "Kommt bald"
  }
}
```

❌ **DON'T**
```json
// WRONG — missing translations for room_type enum values
// WRONG — keys only in de.json
```

> ⚠️ **BE CAREFUL**:
> - ALL 4 locale files must have the same keys.
> - Confidentiality notice must be translated with proper legal tone in all 4 languages.
> - Run `grep -rn 't("' components/dashboard/spa/` to verify all keys are covered.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify components:
ls components/dashboard/spa/RoomManager.tsx
ls components/dashboard/spa/SpaIntake.tsx
ls components/dashboard/spa/WellnessJournal.tsx

# Verify imports:
grep -rn "RoomManager\|SpaIntake\|WellnessJournal" app/[locale]/dashboard/spa-admin/page.tsx

# Verify Zone 4 compliance:
grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-\|motion" \
  components/dashboard/spa/ \
  app/[locale]/dashboard/spa-admin/
# Expected: 0 results

# Verify i18n:
grep -rn "dashboardSpa" messages/de.json messages/en.json messages/fr.json messages/it.json

git add messages/ && git commit -m "R-CD4-P6: i18n keys for spa dashboard components"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | RoomManager | Phase 1 |
| Phase 3 | 🤖 | SpaIntake | Nothing (extends intake-templates) |
| Phase 4 | 🤖 | WellnessJournal | Phase 1 |
| Phase 5 | 🤖 | Wire page | Phase 2, 3, 4 |
| Phase 6 | 🤖 | i18n + Smoke Test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `components/dashboard/spa/` with RoomManager, SpaIntake, WellnessJournal
- `CLAUDE.md` Section 6 (Schema Table) — add `spa_treatment_rooms`, `wellness_journals` tables
- `_docs/category-system-map.md` §4.3 — update Spa section with new tables, routes, and components
- `_rules/DB_SCHEMA.md` — add new table definitions

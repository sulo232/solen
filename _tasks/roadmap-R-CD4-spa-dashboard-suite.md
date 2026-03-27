# R-CD4: Spa & Wellness Dashboard Suite

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟡 MEDIUM | RLS policies | Add INSERT + SELECT policies. Test with salon owner auth. |
| Phase 2: Room Scheduler | 🟡 MEDIUM | Calendar conflicts if room + staff slots clash | Room scheduler is ADDITIVE — does not replace staff-based calendar. |
| Phase 3: Intake Builder | 🟢 SAFE | Extends existing intake system | Check `lib/intake-templates.ts` for `spa_consultation`. |
| Phase 4: Wellness Journal | 🟢 SAFE | New component, additive | — |

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

#### Files
- `[NEW]` `supabase/migrations/XXX_spa_dashboard.sql`

#### Instructions
```sql
CREATE TABLE IF NOT EXISTS spa_treatment_rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type TEXT DEFAULT 'treatment',  -- treatment, sauna, pool, steam
  capacity INT DEFAULT 1,
  prep_buffer_minutes INT DEFAULT 15,
  cooldown_buffer_minutes INT DEFAULT 10,
  equipment TEXT[],                     -- e.g. ["hot_stones", "aromatherapy", "infrared"]
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
  tension_areas TEXT[],                -- ["neck", "shoulders", "lower_back"]
  pain_level INT CHECK (pain_level BETWEEN 1 AND 10),
  skin_condition TEXT,
  pressure_preference TEXT,            -- "light", "medium", "deep", "variable"
  products_used TEXT[],
  aftercare_notes TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE spa_treatment_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_spa_rooms" ON spa_treatment_rooms
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE POLICY "salon_owner_wellness_journals" ON wellness_journals
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

> ⚠️ **BE CAREFUL**:
> - Room management follows the same pattern as `nail_stations`. Check `StationManager.tsx` for reference code pattern.
> - Wellness journals are per-visit per-client — similar to `barber_cut_history` pattern.

#### Verification
```bash
git add supabase/migrations/ && git commit -m "R-CD4-P1: DB migration — spa_treatment_rooms + wellness_journals"
```

---

## Phase 2: Treatment Room Scheduler

#### Files
- `[NEW]` `components/dashboard/spa/RoomManager.tsx`
- `[NEW]` `app/api/dashboard/spa/rooms/route.ts`

#### Instructions
1. Room CRUD: add, edit, remove treatment rooms.
2. Room config: name, type, capacity, prep buffer, cooldown buffer, equipment checklist.
3. Utilization bar per room (same pattern as `ChairManager.tsx` — horizontal bar showing % daily utilization).
4. Model after existing `StationManager.tsx` (nail stations) but adapted for spa rooms.
5. Zone 4 compliance: `rounded-[12px]`, solid surfaces only.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**: Follow `StationManager.tsx` pattern with Zone 4 styling.

❌ **DON'T**: Duplicate the staff calendar. Room scheduler is ADDITIVE — it shows room availability alongside staff availability, not replacing it.

> ⚠️ **BE CAREFUL**:
> - Read `components/dashboard/nail/StationManager.tsx` first — same pattern applies.
> - Do NOT integrate with slot generation yet (that's a separate calendar roadmap).
> - Room equipment is an array of strings — UI uses checkboxes.

#### Verification
```bash
git add components/dashboard/spa/ app/api/dashboard/spa/ && git commit -m "R-CD4-P2: RoomManager — spa treatment room CRUD + utilization"
npm run build
```

---

## Phase 3: Spa Intake Questionnaire

#### Files
- `[MODIFY]` `lib/intake-templates.ts` (add `spa_consultation` template)
- `[NEW]` `components/dashboard/spa/SpaIntake.tsx`

#### Instructions
1. Check if `spa_consultation` already exists in `lib/intake-templates.ts`.
2. If not, add spa-specific intake fields: contraindications, pregnancy status, blood pressure issues, recent surgeries, allergies, skin conditions, pressure preference, areas to avoid, areas to focus on.
3. Component renders the intake form in a Zone 4 card.
4. Saves responses to existing `intake_forms` table.

> ⚠️ **BE CAREFUL**:
> - Health data (contraindications, pregnancy) is SENSITIVE. Ensure it's never exposed to other clients.
> - Use existing `IntakeFormTab.tsx` patterns — don't create a parallel system.
> - Spa intake includes medical questions — add a disclaimer text: "This information is confidential and used only by your therapist."

#### Verification
```bash
git add lib/intake-templates.ts components/dashboard/spa/ && git commit -m "R-CD4-P3: SpaIntake — spa consultation questionnaire with health fields"
npm run build
```

---

## Phase 4: Wellness Journal

#### Files
- `[NEW]` `components/dashboard/spa/WellnessJournal.tsx`
- `[NEW]` `app/api/dashboard/spa/wellness-journal/route.ts`

#### Instructions
1. Per-client wellness timeline showing visit history with: tension areas, pain levels, skin condition progression, products used.
2. Pain level uses a horizontal bar (1-10 scale) — Zone 4 visual.
3. Tension areas use a simple text list (body diagram is in R-CD7 shared framework roadmap).
4. "Add Entry" form for post-session notes.

> ⚠️ **BE CAREFUL**:
> - Keep it simple — text-based timeline now, visual body diagram later (R-CD7).
> - Verify response format consistency (Rule 11).

#### Verification
```bash
git add components/dashboard/spa/ app/api/dashboard/spa/ && git commit -m "R-CD4-P4: WellnessJournal — per-client spa visit timeline"
npm run build
```

---

## Phase 5: Wire spa-admin Page

#### Files
- `[MODIFY]` `app/[locale]/dashboard/spa-admin/page.tsx`

#### Instructions
1. Replace stub with: RoomManager (top), SpaIntake (client-specific), WellnessJournal (client-specific).
2. Client selector dropdown at top.
3. Tab layout: "Rooms" tab (always visible) + "Client" tab (shows intake + journal for selected client).

> ⚠️ **BE CAREFUL**: Import components from `@/components/dashboard/spa/` — verify files exist first.

#### Verification
```bash
git add app/[locale]/dashboard/spa-admin/ && git commit -m "R-CD4-P5: wire spa-admin page with rooms, intake, journal"
npm run build
```

---

## Phase 6: i18n + Smoke Test

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Verification
```bash
npm run build
npx tsc --noEmit
ls components/dashboard/spa/RoomManager.tsx
ls components/dashboard/spa/SpaIntake.tsx
ls components/dashboard/spa/WellnessJournal.tsx
grep -rn "RoomManager\|SpaIntake\|WellnessJournal" app/ --include="*.tsx"
grep -rn "backdrop-blur\|glass\|font-display" components/dashboard/spa/
# Expected: 0 results
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | RoomManager | Phase 1 |
| Phase 3 | 🤖 | SpaIntake | Nothing |
| Phase 4 | 🤖 | WellnessJournal | Phase 1 |
| Phase 5 | 🤖 | Wire page | Phase 2, 3, 4 |
| Phase 6 | 🤖 | i18n + Smoke Test | All phases |

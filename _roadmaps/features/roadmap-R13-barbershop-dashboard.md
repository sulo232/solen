# R13: Barbershop Dashboard Suite

> **Wave 3** — Depends on Wave 1 (design tokens must be V3-clean) and Wave 2 R10 (SMS wrapper).
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Walk-in Analytics | 🟡 MEDIUM | Query performance on large walkin_queue table | Add appropriate indexes. Use aggregate queries, not client-side calculation. |
| Phase 2: Leaderboard | 🟡 MEDIUM | Privacy concerns if staff data exposed | Add anonymize toggle. Default to anonymized in URL-shared views. |
| Phase 3: Chair Management | 🟢 SAFE | New component, additive | Does not modify slot generation — just displays utilization. |
| Phase 4: Smart Reminders UI | 🟡 MEDIUM | Could trigger SMS without consent | Button sends individual reminders — not batch. Require confirmation dialog. SMS provider not yet configured — code must gracefully skip if `SEVEN_IO_API_KEY` is missing. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None (SMS wrapper already exists from R10).

**🤖 CLAUDE CODE PHASES**
- Phase 1: Walk-in Analytics Dashboard
- Phase 2: Barber Leaderboard
- Phase 3: Chair Management
- Phase 4: Smart Reminders Dashboard UI
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: Walk-in Analytics Dashboard

> ⚠️ **PRE-EXISTING CODE**: `app/api/dashboard/walkin-analytics/route.ts` ALREADY EXISTS. Use it, don't create a duplicate.

#### Files
- `[NEW]` `components/dashboard/barber/WalkInAnalytics.tsx`
- `[MODIFY]` `app/api/dashboard/walkin-analytics/route.ts` (already exists — improve if needed)
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. API route: aggregate data from `walkin_queue` table:
   - Walk-in vs appointment ratio (count walk-ins / count bookings)
   - Average wait time (avg of `started_at - created_at` for completed entries)
   - Conversion rate (completed / total)
   - Abandonment rate (no_show / total)
   - Chair utilization (time in_chair / total operating hours)
2. Component: display metrics as stat cards with `MiniSparkline` for trends.
3. Period toggle: week / month (use existing pattern from other dashboard analytics).
4. **Zone 4** rules: `rounded-dash`, no glass, DM Sans for data with `data-text` class.
5. Add as first section in `barber-ops/page.tsx`.

#### DO / DON'T Examples
✅ **DO**
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <div className="bg-white dark:bg-s-dm-surface rounded-dash border border-s-ink/5 p-4">
    <p className="text-[11px] tracking-[0.2em] uppercase text-s-amber font-heading font-bold">
      Walk-in Rate
    </p>
    <p className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text data-text">
      {walkInRate}%
    </p>
    <MiniSparkline data={weeklyData} color="s-coral" />
  </div>
</div>
```

---

## Phase 2: Barber Leaderboard

> ⚠️ **PRE-EXISTING CODE**: `app/api/dashboard/barber-leaderboard/route.ts` ALREADY EXISTS. Use it, don't create a duplicate.

#### Files
- `[NEW]` `components/dashboard/barber/BarberLeaderboard.tsx`
- `[MODIFY]` `app/api/dashboard/barber-leaderboard/route.ts` (already exists)
- `[MODIFY]` `app/[locale]/dashboard/analytics/page.tsx`

#### Instructions
1. API route: per-staff metrics for barbershop salons:
   - Total bookings (period)
   - Revenue generated
   - Client retention rate (% returning within 6 weeks)
   - Average tip amount
   - Walk-in conversion rate
   - Chair utilization %
2. Component: table with sortable columns. Rank column with 🥇🥈🥉 (use `Trophy`, `Medal` from lucide-react).
3. **Anonymize mode**: toggle that replaces names with "Barber 1", "Barber 2" etc. Useful for team motivation without public shaming.
4. **Period toggle**: week / month.
5. **Chart view**: toggle between table and bar chart (use `recharts` `BarChart`).
6. Conditionally render in analytics page — only for salons with `category = 'barbershop'`.

---

## Phase 3: Chair Management

#### Files
- `[NEW]` `components/dashboard/barber/ChairManager.tsx`
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. Visual chair count configuration: number input (1–20 chairs).
2. Buffer minutes between clients: number input (5–30 min).
3. Utilization bar: horizontal bar showing % of each chair's daily utilization.
4. Color coding: `bg-s-sage` for utilized time, `bg-s-sand-subtle` for idle time.
5. Save configuration to `salons` table (columns: `chair_count`, `chair_buffer_minutes`).
6. If columns don't exist, note in `_tasks/INCOMPLETE_FEATURES.md`.

---

## Phase 4: Smart Reminders Dashboard UI

> Note: The cron job is built in R10. This phase builds only the dashboard UI for manual send.

#### Files
- `[NEW]` `components/dashboard/barber/SmartReminders.tsx`
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. Use `lib/barber/visit-cycle-algorithm.ts` (NOT `visit-cycle.ts` — correct filename!) to calculate overdue clients.
2. Display grouped by barber:
   - Client name, last visit date, days overdue, usual cycle length
   - "Erinnerung senden" button per client
3. Button calls a new API or uses existing SMS wrapper from R10.
4. Confirmation dialog before sending: "SMS an {name} ({phone}) senden?"
5. After send: mark with green checkmark, disable button for 7 days.

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify components exist:
ls components/dashboard/barber/WalkInAnalytics.tsx
ls components/dashboard/barber/BarberLeaderboard.tsx
ls components/dashboard/barber/ChairManager.tsx
ls components/dashboard/barber/SmartReminders.tsx
# Verify imports:
grep -rn "WalkInAnalytics\|BarberLeaderboard\|ChairManager\|SmartReminders" app/ --include="*.tsx"
# Must find imports in dashboard pages
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Walk-in Analytics | Nothing |
| Phase 2 | 🤖 | Leaderboard | Nothing |
| Phase 3 | 🤖 | Chair Management | Nothing |
| Phase 4 | 🤖 | Smart Reminders UI | R10 (SMS wrapper) |
| Phase 5 | 🤖 | Smoke Test | All phases |

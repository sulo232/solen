# R-CD3: Barbershop Dashboard Expansion — Live Walk-In Queue & Fade Blueprint

> **Wave 3** — Extends existing R13 barbershop dashboard. Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

> ⚠️ **PRE-EXISTING CODE**: The barbershop dashboard already has 5 components: `WalkinAnalytics.tsx`, `BarberLeaderboard.tsx`, `ChairManager.tsx`, `SmartReminderConfig.tsx`, `LoyaltyConfig.tsx`. This roadmap ADDS features — do NOT recreate existing ones.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration (fade_blueprints) | 🟢 SAFE | New table, additive | — |
| Phase 2: Live Queue Enhancement | 🔴 HIGH | Existing `WalkinQueue.tsx` and `barber_walkin_queue` Realtime subscriptions | Read existing `components/barber/WalkinQueue.tsx` FIRST. Only ADD the live dashboard view — never modify the customer-facing queue. |
| Phase 3: Fade Blueprint Builder | 🟡 MEDIUM | SVG rendering on mobile | Test SVG viewBox on small screens. Use `aspect-square` container. |
| Phase 4: Express Menu Widget | 🟢 SAFE | New component | — |
| Phase 5: Queue Display Mode | 🟢 SAFE | New page | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `fade_blueprints` table
- Phase 2: Live Walk-In Queue Dashboard Panel
- Phase 3: Fade Blueprint Builder
- Phase 4: Express Service Menu Widget
- Phase 5: TV Queue Display Mode
- Phase 6: Wire Into barber-ops page
- Phase 7: i18n + Smoke Test

---

## Phase 1: DB Migration — Fade Blueprints

#### Files
- `[NEW]` `supabase/migrations/XXX_fade_blueprints.sql`

#### Instructions
```sql
CREATE TABLE IF NOT EXISTS fade_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  -- Zone configuration: guard sizes for each head zone
  top_guard TEXT,         -- e.g. "4", "scissors", "finger length"
  sides_guard TEXT,       -- e.g. "1", "0.5", "skin"
  back_guard TEXT,        -- e.g. "1.5", "0"
  neckline_style TEXT,    -- "tapered", "blocked", "rounded"
  fade_type TEXT,         -- "low", "mid", "high", "drop", "taper", "burst", "temp"
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT,
  products_used TEXT[],
  notes TEXT,
  photo_url TEXT,         -- after photo reference
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fade_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_fade_blueprints" ON fade_blueprints
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_fade_blueprints_client ON fade_blueprints(client_id, salon_id);
```

> ⚠️ **BE CAREFUL**:
> - Check if `barber_cut_history` table already stores guard/fade data. If so, extend it instead of creating a new table.
> - RLS INSERT policy is mandatory.

#### Verification
```bash
git add supabase/migrations/ && git commit -m "R-CD3-P1: DB migration — fade_blueprints table"
```

---

## Phase 2: Live Walk-In Queue Dashboard Panel

> ⚠️ **PRE-EXISTING CODE**: `components/barber/WalkinQueue.tsx` is the CUSTOMER-FACING queue. `components/dashboard/WalkInModal.tsx` is the dashboard walk-in creation modal. `app/api/walkin/` has the queue API routes. DO NOT duplicate these.

#### Files
- `[NEW]` `components/dashboard/barber/LiveQueuePanel.tsx`

#### Instructions
1. Dashboard-side real-time view of current walk-in queue.
2. Show: position #, client name, preferred barber, wait time (calculated live), status (waiting/in_chair).
3. Action buttons per entry: "Start" (→ in_chair), "Complete", "No-Show".
4. Uses Supabase Realtime subscription on `barber_walkin_queue` (same table as customer-facing queue).
5. Shows estimated wait time using `lib/barber/wait-time-calculator.ts` (verify it exists).
6. Zone 4: `rounded-[12px]`, no glass, no animation. Status dots only (green=in_chair, amber=waiting).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] bg-white dark:bg-s-dm-surface p-4">
  <div className="flex items-center justify-between mb-4">
    <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber">{t("live_queue")}</p>
    <span className="text-xs data-text font-bold text-s-coral">{queue.length} {t("waiting")}</span>
  </div>
  {queue.map((entry, i) => (
    <div key={entry.id} className="flex items-center gap-3 py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <span className="text-sm data-text font-bold text-s-ink/40 dark:text-s-dm-text/40 w-6 text-center">#{i + 1}</span>
      <div className={`w-2 h-2 rounded-full shrink-0 ${
        entry.status === "in_chair" ? "bg-s-sage" : "bg-s-amber"
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{entry.name}</p>
        <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{entry.preferred_barber || t("any_barber")}</p>
      </div>
      <span className="text-xs data-text text-s-ink/50 dark:text-s-dm-text/50 shrink-0">{entry.wait_minutes} min</span>
    </div>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — rebuilding the customer-facing queue
import WalkinQueue from "@/components/barber/WalkinQueue"; // This is the CUSTOMER component
// WRONG — animation in Zone 4
<motion.div animate={{ height: "auto" }} />
```

> ⚠️ **BE CAREFUL**:
> - This is a DASHBOARD view — separate from the customer-facing `WalkinQueue.tsx`.
> - Supabase Realtime subscription must be cleaned up on unmount.
> - Do NOT call the walk-in creation API from here — that flow already exists in `WalkInModal.tsx`.

#### Verification
```bash
git add components/dashboard/barber/LiveQueuePanel.tsx && git commit -m "R-CD3-P2: LiveQueuePanel — real-time dashboard queue view"
npm run build
```

---

## Phase 3: Fade Blueprint Builder

#### Files
- `[NEW]` `components/dashboard/barber/FadeBlueprint.tsx`
- `[NEW]` `app/api/dashboard/fade-blueprints/route.ts`

#### Instructions
1. SVG-based head diagram (top-down view of head with zones: top, left side, right side, back, neckline).
2. Each zone is a clickable SVG region that opens a dropdown to select guard size.
3. Guard options: "Skin (0)", "0.5", "1", "1.5", "2", "3", "4", "Scissors", "Finger length".
4. Additional inputs: fade type dropdown, lineup toggle, beard style, notes.
5. Selected zones fill with category-colored opacity (darker = shorter guard).
6. "Save Blueprint" saves to `fade_blueprints` table.
7. Per-client: show last blueprint as default for returning clients.
8. API route: GET (by client_id + salon_id), POST.

> ⚠️ **BE CAREFUL**:
> - SVG must be responsive within a `max-w-[300px] aspect-square` container.
> - Zone 4: no animation on SVG. Use opacity transitions only (150ms).
> - Guard size visual uses opacity gradient: shorter guard = higher opacity fill.

#### Verification
```bash
git add components/dashboard/barber/FadeBlueprint.tsx app/api/dashboard/fade-blueprints/ && git commit -m "R-CD3-P3: FadeBlueprint — SVG head diagram with guard zone selection"
npm run build
```

---

## Phase 4: Express Service Menu Widget

#### Files
- `[NEW]` `components/dashboard/barber/ExpressMenu.tsx`

#### Instructions
1. Quick-select service widget for walk-in flow.
2. Shows top 4-6 most-booked barbershop services as large tap targets.
3. Each option: icon + service name + duration + price.
4. On tap: creates a walk-in entry with that service pre-selected.
5. Uses existing walk-in API (`app/api/walkin/`).
6. Grid: `grid grid-cols-2 gap-2` with `rounded-[12px]` cards.

> ⚠️ **BE CAREFUL**:
> - Check existing walk-in creation flow before duplicating logic.
> - Services must be filtered to `category = 'barbershop'` only.

#### Verification
```bash
git add components/dashboard/barber/ExpressMenu.tsx && git commit -m "R-CD3-P4: ExpressMenu — quick walk-in service selector"
npm run build
```

---

## Phase 5: TV Queue Display Mode

#### Files
- `[NEW]` `app/[locale]/dashboard/queue-display/page.tsx`

#### Instructions
1. Full-screen page designed for a wall-mounted TV/tablet.
2. Shows: "Now Serving", queue list with positions, estimated wait times.
3. Auto-refreshes via Supabase Realtime.
4. Large text (Syne 700, 48px+ for "Now Serving"), high contrast.
5. Dark background (`bg-s-dm-bg`) for TV visibility.
6. No sidebar — standalone page. Uses DashboardLayout's auth guard but hides the sidebar.

> ⚠️ **BE CAREFUL**:
> - This page must work WITHOUT sidebar (full-screen mode).
> - Verify it's accessible behind auth (must be logged in as salon owner/staff).
> - No Bebas Neue — Syne only (Zone 4).

#### Verification
```bash
git add app/[locale]/dashboard/queue-display/ && git commit -m "R-CD3-P5: queue-display — TV mode full-screen walk-in queue"
npm run build
```

---

## Phase 6: Wire Into barber-ops Page

#### Files
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. Add `LiveQueuePanel` as the first section.
2. Add `ExpressMenu` below the queue panel.
3. Keep ALL existing components (WalkinAnalytics, ChairManager, etc.).
4. Add a "TV Display" link button that opens `/dashboard/queue-display` in a new tab.

> ⚠️ **BE CAREFUL**:
> - Read the existing `barber-ops/page.tsx` before modifying. Keep all existing imports.
> - New components go ABOVE existing ones (queue is most urgent info).

#### Verification
```bash
git add app/[locale]/dashboard/barber-ops/ && git commit -m "R-CD3-P6: wire LiveQueuePanel + ExpressMenu into barber-ops page"
npm run build
```

---

## Phase 7: i18n + Smoke Test

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify new components:
ls components/dashboard/barber/LiveQueuePanel.tsx
ls components/dashboard/barber/FadeBlueprint.tsx
ls components/dashboard/barber/ExpressMenu.tsx
ls app/[locale]/dashboard/queue-display/page.tsx

# Verify imports:
grep -rn "LiveQueuePanel\|FadeBlueprint\|ExpressMenu" app/ --include="*.tsx"

# Verify no Zone 4 violations:
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|shadow-lg" components/dashboard/barber/ app/[locale]/dashboard/queue-display/
# Expected: 0 results
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | Nothing |
| Phase 2 | 🤖 | LiveQueuePanel | Nothing (uses existing Realtime) |
| Phase 3 | 🤖 | FadeBlueprint | Phase 1 (needs table) |
| Phase 4 | 🤖 | ExpressMenu | Nothing |
| Phase 5 | 🤖 | TV Queue Display | Phase 2 (shares queue logic) |
| Phase 6 | 🤖 | Wire barber-ops page | Phase 2, 4 |
| Phase 7 | 🤖 | i18n + Smoke Test | All phases |

# R-CD3: Barbershop Dashboard Expansion — Live Walk-In Queue & Fade Blueprint

> **Wave 3** — Extends existing R13 barbershop dashboard. Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.

> ⚠️ **PRE-EXISTING CODE**: The barbershop dashboard already has 5 components: `WalkinAnalytics.tsx`, `BarberLeaderboard.tsx`, `ChairManager.tsx`, `SmartReminderConfig.tsx`, `LoyaltyConfig.tsx`. This roadmap ADDS features — do NOT recreate existing ones.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Existing walk-in components | `find components/ -name "*walkin*" -o -name "*Walkin*"` | `components/barber/WalkinQueue.tsx` (customer-facing), `components/dashboard/WalkInModal.tsx` (modal), `components/dashboard/barber/WalkinAnalytics.tsx` (analytics) |
| Walk-in API routes | `find app/api/walkin -type f` | `app/api/walkin/queue/route.ts`, `app/api/walkin/queue/[id]/route.ts`, `app/api/walkin/queue/remote-join/route.ts`, `app/api/walkin/queue/status/route.ts` |
| Existing barber dashboard | `ls components/dashboard/barber/` | `WalkinAnalytics.tsx`, `BarberLeaderboard.tsx`, `ChairManager.tsx`, `SmartReminderConfig.tsx`, `LoyaltyConfig.tsx` |
| Cut history table | `grep -rn "barber_cut_history" supabase/migrations/` | Check if guard/fade data already stored there |
| Wait time calculator | `ls lib/barber/wait-time-calculator.ts` | Verify it exists before importing |
| Barber-ops page | `cat app/[locale]/dashboard/barber-ops/page.tsx` | Must read FULL content before modifying |
| Incomplete features | `cat _tasks/INCOMPLETE_FEATURES.md` | Check for related unfinished work |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟢 SAFE | New table, additive | — |
| Phase 2: LiveQueuePanel | 🔴 HIGH | Existing `WalkinQueue.tsx` and `barber_walkin_queue` Realtime subscriptions | Read `components/barber/WalkinQueue.tsx` FIRST. Only ADD the dashboard view — never modify customer-facing queue. Exact files at risk: `components/barber/WalkinQueue.tsx`, `app/api/walkin/queue/route.ts`. |
| Phase 3: FadeBlueprint | 🟡 MEDIUM | SVG rendering on mobile | Test SVG viewBox in `max-w-[300px] aspect-square`. |
| Phase 4: ExpressMenu | 🟢 SAFE | New component | — |
| Phase 5: TV Display | 🟢 SAFE | New page | — |
| Phase 6: Wire page | 🟡 MEDIUM | Breaking existing barber-ops layout | Read barber-ops/page.tsx. Keep ALL existing imports. Add new components ABOVE existing ones. |
| Phase 7: i18n | 🟢 SAFE | Additive | — |

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

> **Zone 4 constraints**: N/A (SQL migration file).

#### Files
- `[NEW]` `supabase/migrations/XXX_fade_blueprints.sql`

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```sql
CREATE TABLE IF NOT EXISTS fade_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  top_guard TEXT,
  sides_guard TEXT,
  back_guard TEXT,
  neckline_style TEXT,
  fade_type TEXT,
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT,
  products_used TEXT[],
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fade_blueprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_fade_blueprints" ON fade_blueprints
  FOR ALL USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
  );

CREATE INDEX idx_fade_blueprints_client ON fade_blueprints(client_id, salon_id);
```

❌ **DON'T**
```sql
-- WRONG — missing RLS
CREATE TABLE fade_blueprints (...);
-- No ENABLE ROW LEVEL SECURITY, no CREATE POLICY

-- WRONG — creating a duplicate of barber_cut_history
-- If barber_cut_history already stores guard data, EXTEND it instead
```

> ⚠️ **BE CAREFUL**:
> - Check if `barber_cut_history` table already stores guard/fade data. If so, add columns to it instead of creating a new table.
> - RLS INSERT policy is mandatory (Rule 12b).
> - Migration filename must use timestamp prefix.

#### Verification
```bash
cat supabase/migrations/*fade*.sql
git add supabase/migrations/ && git commit -m "R-CD3-P1: DB migration — fade_blueprints table"
```

---

## Phase 2: Live Walk-In Queue Dashboard Panel

> **Zone 4 constraints**: This is Zone 4. `rounded-[12px]` max. ZERO glass, ZERO animation. Status dots use `bg-s-sage` (in_chair) and `bg-s-amber` (waiting). No `motion.div`, no `animate-*`.
> ⚠️ **PRE-EXISTING CODE**: `components/barber/WalkinQueue.tsx` is CUSTOMER-FACING. `components/dashboard/WalkInModal.tsx` is the walk-in creation modal. `app/api/walkin/` has the queue API. DO NOT duplicate these.

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
// WRONG — importing the customer-facing queue
import WalkinQueue from "@/components/barber/WalkinQueue"; // This is the CUSTOMER component
// WRONG — animation in Zone 4
<motion.div animate={{ height: "auto" }} />
// WRONG — glass in Zone 4
<div className="backdrop-blur-lg bg-white/80 rounded-xl">
```

> ⚠️ **BE CAREFUL**:
> - This is a DASHBOARD view — separate from customer-facing `WalkinQueue.tsx`.
> - Supabase Realtime subscription must be cleaned up on unmount (`useEffect` return cleanup).
> - Do NOT call the walk-in creation API from here — that flow exists in `WalkInModal.tsx`.
> - Verify `lib/barber/wait-time-calculator.ts` exists before importing it.
> - Files that should NOT be touched: `components/barber/WalkinQueue.tsx`, `app/api/walkin/`.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/barber/LiveQueuePanel.tsx
# Expected: 0 results
git add components/dashboard/barber/LiveQueuePanel.tsx && git commit -m "R-CD3-P2: LiveQueuePanel — real-time dashboard queue view"
```

---

## Phase 3: Fade Blueprint Builder

> **Zone 4 constraints**: This is Zone 4. SVG container uses `rounded-[12px]`. Opacity transitions only (`transition-opacity duration-150`). No motion library, no animate-classes.

#### Files
- `[NEW]` `components/dashboard/barber/FadeBlueprint.tsx`
- `[NEW]` `app/api/dashboard/fade-blueprints/route.ts`

#### Instructions
1. SVG-based head diagram (top-down view with zones: top, left side, right side, back, neckline).
2. Each zone is a clickable SVG region that opens a dropdown for guard size.
3. Guard options: "Skin (0)", "0.5", "1", "1.5", "2", "3", "4", "Scissors", "Finger length".
4. Additional inputs: fade type dropdown, lineup toggle, beard style, notes.
5. Selected zones fill with opacity (darker = shorter guard).
6. "Save Blueprint" saves to `fade_blueprints` table.
7. Per-client: show last blueprint as default for returning clients.
8. API route: GET (by client_id + salon_id), POST with Zod validation.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const GUARD_OPTIONS = [
  { value: "skin", label: "Skin (0)", opacity: 0.9 },
  { value: "0.5", label: "0.5", opacity: 0.75 },
  { value: "1", label: "1", opacity: 0.6 },
  { value: "1.5", label: "1.5", opacity: 0.45 },
  { value: "2", label: "2", opacity: 0.3 },
  { value: "3", label: "3", opacity: 0.2 },
  { value: "4", label: "4", opacity: 0.12 },
  { value: "scissors", label: t("scissors"), opacity: 0.06 },
  { value: "finger", label: t("finger_length"), opacity: 0.04 },
];

<div className="max-w-[300px] aspect-square mx-auto rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] overflow-hidden bg-white dark:bg-s-dm-surface">
  <svg viewBox="0 0 200 200" className="w-full h-full">
    {HEAD_ZONES.map(zone => (
      <path key={zone.id} d={zone.d} id={zone.id}
        fill={`rgba(232, 98, 74, ${guards[zone.id]?.opacity || 0})`}
        className="cursor-pointer transition-opacity duration-150"
        onClick={() => openGuardDropdown(zone.id)} />
    ))}
  </svg>
</div>
```

❌ **DON'T**
```tsx
// WRONG — motion animation on SVG
<motion.path animate={{ fill: color }} transition={{ duration: 0.5 }} />
// WRONG — rounded-xl in Zone 4
<div className="rounded-xl shadow-lg">
// WRONG — no Zod validation on API
const body = await request.json();
```

> ⚠️ **BE CAREFUL**:
> - SVG must be responsive within a `max-w-[300px] aspect-square` container.
> - Zone 4: no animation on SVG. Use `transition-opacity duration-150` only.
> - Guard size visual uses opacity gradient: shorter guard = higher opacity fill.
> - API route uses `getSession()` (Rule 25), Zod validation, and consistent `{ data: ... }` format (Rule 11).

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/barber/FadeBlueprint.tsx
# Expected: 0 results
git add components/dashboard/barber/FadeBlueprint.tsx app/api/dashboard/fade-blueprints/ && git commit -m "R-CD3-P3: FadeBlueprint — SVG head diagram with guard zone selection"
```

---

## Phase 4: Express Service Menu Widget

> **Zone 4 constraints**: This is Zone 4. Cards use `rounded-[12px]`, `border border-s-ink/[0.06]`. Active state: `border-s-coral bg-s-coral/[0.06]`. No glass, no shadows above card level.

#### Files
- `[NEW]` `components/dashboard/barber/ExpressMenu.tsx`

#### Instructions
1. Quick-select service widget for walk-in flow.
2. Shows top 4-6 most-booked barbershop services as large tap targets.
3. Each option: icon + service name + duration + price.
4. On tap: creates a walk-in entry with that service pre-selected.
5. Uses existing walk-in API (`app/api/walkin/`).
6. Grid: `grid grid-cols-2 gap-2` with `rounded-[12px]` cards.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="grid grid-cols-2 gap-2">
  {topServices.map(svc => (
    <button key={svc.id}
      onClick={() => createWalkin(svc.id)}
      className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 text-left bg-white dark:bg-s-dm-surface hover:border-s-coral/40 transition-colors duration-150">
      <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{svc.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] data-text text-s-ink/40 dark:text-s-dm-text/40">{svc.duration} min</span>
        <span className="text-[10px] data-text font-bold text-s-coral">{svc.price} CHF</span>
      </div>
    </button>
  ))}
</div>
```

❌ **DON'T**
```tsx
// WRONG — shadow-lg in Zone 4
<button className="rounded-xl shadow-lg hover:shadow-xl transition-shadow">
// WRONG — duplicating the walk-in creation logic instead of using existing API
const { data } = await supabase.from("barber_walkin_queue").insert({...}); // Use the API!
```

> ⚠️ **BE CAREFUL**:
> - Check existing walk-in creation flow (`app/api/walkin/queue/route.ts`) before duplicating logic.
> - Services must be filtered to `category = 'barbershop'` only.
> - Use existing walk-in API — do NOT insert directly into `barber_walkin_queue`.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|shadow-lg\|animate-" components/dashboard/barber/ExpressMenu.tsx
# Expected: 0 results
git add components/dashboard/barber/ExpressMenu.tsx && git commit -m "R-CD3-P4: ExpressMenu — quick walk-in service selector"
```

---

## Phase 5: TV Queue Display Mode

> **Zone 4 constraints**: This is Zone 4. Large text uses Syne 700 only (`font-heading font-bold`). Dark background for TV: `bg-s-dm-bg`. No Bebas Neue or `font-display`.

#### Files
- `[NEW]` `app/[locale]/dashboard/queue-display/page.tsx`

#### Instructions
1. Full-screen page designed for a wall-mounted TV/tablet.
2. Shows: "Now Serving" (Syne 700, `text-[48px]`), queue list with positions, estimated wait times.
3. Auto-refreshes via Supabase Realtime.
4. Dark background (`bg-s-dm-bg`) for TV visibility.
5. No sidebar — standalone page. Auth guard required.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
<div className="min-h-screen bg-s-dm-bg p-8">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-dm-text/30 mb-2">
    {t("queue_display")}
  </p>
  <h1 className="font-heading font-bold text-[48px] text-s-dm-text leading-none mb-8">
    {t("now_serving")}
  </h1>
  <div className="rounded-[12px] border border-s-dm-text/[0.06] p-6 bg-s-dm-surface">
    {/* Current client being served */}
    <p className="font-heading font-bold text-[32px] text-s-coral">{currentClient?.name}</p>
  </div>
</div>
```

❌ **DON'T**
```tsx
// WRONG — Bebas Neue on TV display
<h1 className="font-display text-6xl">
// WRONG — glass on dark background
<div className="backdrop-blur-xl bg-black/50">
// WRONG — no auth guard (anyone could see queue)
```

> ⚠️ **BE CAREFUL**:
> - This page must work WITHOUT sidebar (full-screen mode).
> - Verify it's accessible behind auth (must be logged in as salon owner/staff). Check middleware.
> - No Bebas Neue — Syne only (Zone 4).
> - Test on a 1080p display — text must be legible from 3+ meters away.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|animate-" app/[locale]/dashboard/queue-display/
# Expected: 0 results
git add app/[locale]/dashboard/queue-display/ && git commit -m "R-CD3-P5: queue-display — TV mode full-screen walk-in queue"
```

---

## Phase 6: Wire Into barber-ops Page

> **Zone 4 constraints**: This is Zone 4. Maintain existing layout. New components go ABOVE existing ones (queue = most urgent info).

#### Files
- `[MODIFY]` `app/[locale]/dashboard/barber-ops/page.tsx`

#### Instructions
1. Add `LiveQueuePanel` as the FIRST section (above existing content).
2. Add `ExpressMenu` below the queue panel.
3. Keep ALL existing components (WalkinAnalytics, ChairManager, etc.).
4. Add a "TV Display" link button that opens `/dashboard/queue-display` in a new tab.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
// AT THE TOP of the page content, before existing components:
<LiveQueuePanel salonId={salonId} />
<ExpressMenu salonId={salonId} />
{/* ... existing components below ... */}
<WalkinAnalytics salonId={salonId} />
<ChairManager salonId={salonId} />
```

❌ **DON'T**
```tsx
// WRONG — removing existing components
// WRONG — putting queue panel at the bottom (less urgent visibility)
<WalkinAnalytics salonId={salonId} />
<ChairManager salonId={salonId} />
<LiveQueuePanel salonId={salonId} /> // Too far down!
```

> ⚠️ **BE CAREFUL**:
> - Read the existing `barber-ops/page.tsx` in FULL before modifying. Keep all existing imports.
> - New components go ABOVE existing ones (queue is most urgent info).
> - Verify all new component imports resolve before committing.
> - Files that should NOT be touched during this phase: `components/dashboard/barber/WalkinAnalytics.tsx`, `components/dashboard/barber/ChairManager.tsx`, etc.

#### Verification
```bash
npm run build
# Verify all imports in barber-ops page:
grep -rn "import" app/[locale]/dashboard/barber-ops/page.tsx
# Verify LiveQueuePanel appears before WalkinAnalytics in the file:
grep -n "LiveQueuePanel\|WalkinAnalytics" app/[locale]/dashboard/barber-ops/page.tsx
git add app/[locale]/dashboard/barber-ops/ && git commit -m "R-CD3-P6: wire LiveQueuePanel + ExpressMenu into barber-ops page"
```

---

## Phase 7: i18n + Smoke Test

> **Zone 4 constraints**: Verification phase — ensures all prior phases comply with Zone 4.

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Instructions
Add `dashboardBarber` namespace keys for all new components (LiveQueuePanel, FadeBlueprint, ExpressMenu, QueueDisplay).

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```json
{
  "dashboardBarber": {
    "live_queue": "Live-Warteschlange",
    "waiting": "wartend",
    "any_barber": "Nächster verfügbar",
    "start": "Starten",
    "complete": "Abschliessen",
    "no_show": "Nicht erschienen",
    "fade_blueprint": "Fade-Blueprint",
    "guard_size": "Aufsatzgrösse",
    "express_menu": "Express-Menü",
    "queue_display": "Warteschlange",
    "now_serving": "Jetzt dran"
  }
}
```

❌ **DON'T**
```json
// WRONG — keys only in de.json, missing from en/fr/it
// WRONG — hardcoded German in components instead of using keys
```

> ⚠️ **BE CAREFUL**:
> - ALL 4 locale files must have the same keys.
> - Run `grep -rn 't("' components/dashboard/barber/LiveQueuePanel.tsx components/dashboard/barber/FadeBlueprint.tsx components/dashboard/barber/ExpressMenu.tsx` to find all key references.

#### Verification
```bash
npm run build
npx tsc --noEmit

# Verify new components exist:
ls components/dashboard/barber/LiveQueuePanel.tsx
ls components/dashboard/barber/FadeBlueprint.tsx
ls components/dashboard/barber/ExpressMenu.tsx
ls app/[locale]/dashboard/queue-display/page.tsx

# Verify imports in barber-ops page:
grep -rn "LiveQueuePanel\|FadeBlueprint\|ExpressMenu" app/[locale]/dashboard/barber-ops/page.tsx

# Verify no Zone 4 violations across ALL new files:
grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-\|motion" \
  components/dashboard/barber/LiveQueuePanel.tsx \
  components/dashboard/barber/FadeBlueprint.tsx \
  components/dashboard/barber/ExpressMenu.tsx \
  app/[locale]/dashboard/queue-display/
# Expected: 0 results

# Verify i18n:
grep -rn "dashboardBarber" messages/de.json messages/en.json messages/fr.json messages/it.json

git add messages/ && git commit -m "R-CD3-P7: i18n keys for barbershop dashboard expansion"
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

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `LiveQueuePanel.tsx`, `FadeBlueprint.tsx`, `ExpressMenu.tsx` to `components/dashboard/barber/`
- `CLAUDE.md` Section 6 (Schema Table) — add `fade_blueprints` table
- `_docs/category-system-map.md` §4.6 — add new components and routes to Barbershop section
- `_rules/DB_SCHEMA.md` — add `fade_blueprints` table definition

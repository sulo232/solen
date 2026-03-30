# R-CD6: Makeup Artist Dashboard Suite

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius. Syne 700 + DM Sans only.

---

## R10: PRE-SCAN RESULTS

| Scan | Command | Result |
|---|---|---|
| Retail manager | `find components/ -name "*Retail*" -o -name "*retail*"` | Check if `RetailManager.tsx` exists in nail dashboard — same inventory pattern |
| Group booking type | `grep -rn "GroupBooking" lib/types.ts` | Check if bridal events overlap with group bookings |
| Existing makeup code | `grep -rn "makeup" lib/ components/ app/` | Verify no existing makeup-specific code |
| Storage upload pattern | `grep -rn "supabase.storage" lib/ components/` | Find existing file upload pattern for reference photos |
| Incomplete features | `cat _tasks/INCOMPLETE_FEATURES.md` | Check for related unfinished work |

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟢 SAFE | New tables, additive | — |
| Phase 2: Face Chart Builder | 🟡 MEDIUM | SVG rendering complexity on mobile | Use simple zone-based face diagram, not photorealistic. Test in `max-w-[300px]`. |
| Phase 3: Bridal Planner | 🟢 SAFE | New component, additive | Check `GroupBooking` type. |
| Phase 4: Kit Inventory | 🟡 MEDIUM | May duplicate `RetailManager.tsx` logic | Check existing retail component before creating. |
| Phase 5: Skin Tone Matcher | 🟢 SAFE | New component, additive | — |
| Phase 6: Wire page | 🟡 MEDIUM | Crash if imports wrong | Verify all files exist. |
| Phase 7: i18n | 🟢 SAFE | Additive | — |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- None.

**🤖 CLAUDE CODE PHASES**
- Phase 1: DB Migration — `makeup_face_charts`, `bridal_workflows`, `makeup_kit_items`
- Phase 2: Face Chart Builder
- Phase 3: Bridal/Event Planner
- Phase 4: Kit Inventory Manager
- Phase 5: Skin Tone Matcher
- Phase 6: Wire makeup-admin page
- Phase 7: i18n + Smoke Test

---

## Phase 1: DB Migration

> **Zone 4 constraints**: N/A (SQL migration file).

#### Files
- `[NEW]` `supabase/migrations/XXX_makeup_dashboard.sql`

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```sql
CREATE TABLE IF NOT EXISTS makeup_face_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  foundation_brand TEXT,
  foundation_shade TEXT,
  undertone TEXT,
  zones JSONB DEFAULT '{}',
  eye_look TEXT,
  lip_colour TEXT,
  products_used JSONB DEFAULT '[]',
  reference_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bridal_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'bridal',
  trial_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  final_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  inspiration_urls TEXT[],
  approved_look_photo_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'trial_pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS makeup_kit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  shade TEXT,
  category TEXT,
  quantity INT DEFAULT 1,
  expiry_date DATE,
  cost_per_unit NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE makeup_face_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_face_charts" ON makeup_face_charts
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_bridal" ON bridal_workflows
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_kit" ON makeup_kit_items
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));

CREATE INDEX idx_face_charts_client ON makeup_face_charts(client_id, salon_id);
CREATE INDEX idx_bridal_client ON bridal_workflows(client_id, salon_id);
CREATE INDEX idx_kit_expiry ON makeup_kit_items(salon_id, expiry_date);
```

❌ **DON'T**
```sql
-- WRONG — missing RLS on kit_items (violates Rule 12b)
CREATE TABLE makeup_kit_items (...);
-- No ENABLE ROW LEVEL SECURITY

-- WRONG — no index on expiry_date (slow expiry alert queries)
```

> ⚠️ **BE CAREFUL**:
> - RLS INSERT policies mandatory (Rule 12b).
> - `bridal_workflows.status` has a defined set of valid transitions: `trial_pending → trial_done → look_approved → day_of_scheduled → completed`.
> - Product expiry index enables efficient "expiring soon" alerts.
> - Three separate tables is intentional — they serve distinct purposes.

#### Verification
```bash
cat supabase/migrations/*makeup*.sql
git add supabase/migrations/ && git commit -m "R-CD6-P1: DB migration — makeup_face_charts + bridal_workflows + makeup_kit_items"
```

---

## Phase 2: Face Chart Builder

> **Zone 4 constraints**: This is Zone 4. Zone selector buttons use `rounded-[12px]`, `border border-s-ink/[0.06]`. Selected: `border-s-coral bg-s-coral/[0.06]`. No SVG animation, no glass.

#### Files
- `[NEW]` `components/dashboard/makeup/FaceChartBuilder.tsx`
- `[NEW]` `app/api/dashboard/makeup/face-charts/route.ts`

#### Instructions
1. Simplified face zone selector (NOT detailed SVG art — same approach as waxing body zones).
2. Zones: forehead, cheekbones, jawline, temples, nose bridge, chin, eyelids, under-eye, lips.
3. Per zone, select technique: highlight, contour, blush, bronzer, shimmer.
4. Foundation details: brand, shade, undertone (warm/cool/neutral).
5. Eye look + lip colour text inputs.
6. Products used: add items from kit inventory (autocomplete).
7. Reference photo upload (uses existing Supabase Storage).
8. Saved per client per visit — timeline view for repeat clients.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const FACE_ZONES = [
  { key: "forehead", labelKey: "zones.forehead" },
  { key: "cheekbones", labelKey: "zones.cheekbones" },
  { key: "jawline", labelKey: "zones.jawline" },
  { key: "temples", labelKey: "zones.temples" },
  { key: "eyelids", labelKey: "zones.eyelids" },
  { key: "under_eye", labelKey: "zones.under_eye" },
  { key: "lips", labelKey: "zones.lips" },
];

const TECHNIQUES = ["highlight", "contour", "blush", "bronzer", "shimmer"];

{FACE_ZONES.map(zone => (
  <div key={zone.key} className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-3 bg-white dark:bg-s-dm-surface">
    <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text mb-2">{t(zone.labelKey)}</p>
    <select className="w-full rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] px-2 py-1.5 text-xs bg-transparent text-s-ink dark:text-s-dm-text">
      <option value="">{t("select_technique")}</option>
      {TECHNIQUES.map(tech => <option key={tech} value={tech}>{t(`technique.${tech}`)}</option>)}
    </select>
  </div>
))}
```

❌ **DON'T**
```tsx
// WRONG — interactive SVG face (that's R-CD7)
import FaceDiagram from "@/components/shared/FaceDiagram";
// WRONG — glass in Zone 4
<div className="backdrop-blur-lg rounded-xl shadow-lg">
// WRONG — no i18n
<option>Highlight</option>
```

> ⚠️ **BE CAREFUL**:
> - Start with checkbox/dropdown zone selection — NOT interactive SVG face (that's R-CD7).
> - Zone 4: `rounded-[12px]`, no glass, no animation.
> - Products list uses autocomplete from `makeup_kit_items` — check KitInventory is built first or handle gracefully.
> - API: `getSession()` (Rule 25), Zod validation, `{ data: ... }` format (Rule 11).

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/makeup/FaceChartBuilder.tsx
# Expected: 0 results
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P2: FaceChartBuilder — zone-based makeup chart with product tracking"
```

---

## Phase 3: Bridal/Event Planner

> **Zone 4 constraints**: This is Zone 4. Step indicators use `w-3 h-3 rounded-full` dots. Active: `bg-s-coral`. Completed: `bg-s-sage`. Pending: `bg-s-ink/10`. No animation on transitions.

#### Files
- `[NEW]` `components/dashboard/makeup/BridalPlanner.tsx`
- `[NEW]` `app/api/dashboard/makeup/bridal/route.ts`

#### Instructions
1. Multi-stage workflow: Trial Booking → Trial Done → Look Approved → Day-of Scheduled → Completed.
2. Each stage is a step indicator (horizontal progress dots).
3. Attach inspiration photos (URLs or uploads).
4. Link trial booking and final booking.
5. "Approve Look" action saves the trial face chart as the approved reference.
6. Status transitions via PATCH with Zod validation.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const STAGES = [
  { key: "trial_pending", labelKey: "stage.trial_pending" },
  { key: "trial_done", labelKey: "stage.trial_done" },
  { key: "look_approved", labelKey: "stage.look_approved" },
  { key: "day_of_scheduled", labelKey: "stage.day_of" },
  { key: "completed", labelKey: "stage.completed" },
];

<div className="flex items-center gap-2 mb-6">
  {STAGES.map((stage, i) => {
    const isCompleted = i < currentStageIndex;
    const isCurrent = i === currentStageIndex;
    return (
      <div key={stage.key} className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${
          isCompleted ? "bg-s-sage" : isCurrent ? "bg-s-coral" : "bg-s-ink/10 dark:bg-s-dm-text/10"
        }`} />
        <span className={`text-[10px] font-heading font-semibold ${
          isCurrent ? "text-s-coral" : "text-s-ink/30 dark:text-s-dm-text/30"
        }`}>{t(stage.labelKey)}</span>
        {i < STAGES.length - 1 && <div className="w-4 h-px bg-s-ink/10 dark:bg-s-dm-text/10" />}
      </div>
    );
  })}
</div>
```

❌ **DON'T**
```tsx
// WRONG — animated step transitions
<motion.div animate={{ x: currentStep * 60 }}>
// WRONG — allowing stage skipping
if (newStatus === "completed" && currentStatus === "trial_pending") // Invalid!
```

> ⚠️ **BE CAREFUL**:
> - Check existing `GroupBooking` type — bridal events might overlap with group bookings.
> - Status transitions must be sequential — can't skip stages.
> - Trial booking and final booking are separate bookings linked by IDs.
> - API: validate that transitions are sequential (e.g., can't go from `trial_pending` to `completed`).

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|motion" components/dashboard/makeup/BridalPlanner.tsx
# Expected: 0 results
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P3: BridalPlanner — multi-stage event workflow"
```

---

## Phase 4: Kit Inventory Manager

> **Zone 4 constraints**: This is Zone 4. Tab filters use `text-[10px] font-heading font-bold uppercase`. Expiry alert: `bg-s-warning-bg text-s-warning`. Low stock: `text-s-amber`.

#### Files
- `[NEW]` `components/dashboard/makeup/KitInventory.tsx`
- `[NEW]` `app/api/dashboard/makeup/kit/route.ts`

#### Instructions
1. Product CRUD: brand, product name, shade, category, quantity, expiry date, cost.
2. Category filter tabs: Foundation, Eyes, Lips, Cheeks, Brushes, Other.
3. Expiry alert: items expiring within 30 days highlighted with `text-s-warning` / `bg-s-warning-bg`.
4. Low stock alert: quantity ≤ 2 highlighted with `text-s-amber`.
5. Model after `RetailManager.tsx` in `components/dashboard/nail/`.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
{items.map(item => {
  const isExpiringSoon = item.expiry_date && daysDiff(item.expiry_date) <= 30;
  const isLowStock = item.quantity <= 2;

  return (
    <div key={item.id} className="flex items-center gap-3 py-3 border-b border-s-ink/[0.04] dark:border-s-dm-text/[0.04] last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{item.brand} — {item.product_name}</p>
        {item.shade && <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{item.shade}</span>}
      </div>
      <span className={`text-xs data-text font-bold ${isLowStock ? "text-s-amber" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>
        ×{item.quantity}
      </span>
      {isExpiringSoon && (
        <span className="text-[9px] font-heading font-bold uppercase bg-s-warning/10 text-s-warning px-1.5 py-0.5 rounded-[4px]">
          {t("expiring")}
        </span>
      )}
    </div>
  );
})}
```

❌ **DON'T**
```tsx
// WRONG — using arbitrary warning colors
<span className="bg-yellow-200 text-yellow-800"> // Use s-warning tokens
// WRONG — recreating RetailManager from scratch
// Check RetailManager.tsx first and EXTEND if it's generic enough
```

> ⚠️ **BE CAREFUL**:
> - Check `RetailManager.tsx` — if it's generic enough, EXTEND instead of duplicating.
> - Expiry calculation uses pure date math — no moment.js needed.
> - API: `getSession()` (Rule 25), Zod validation, `{ data: ... }` format (Rule 11).

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-\|yellow-\|red-\|green-" components/dashboard/makeup/KitInventory.tsx
# Expected: 0 results (no arbitrary colors)
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P4: KitInventory — makeup product tracking with expiry alerts"
```

---

## Phase 5: Skin Tone Matcher

> **Zone 4 constraints**: This is Zone 4. Selector buttons use `rounded-[12px]`, `border border-s-ink/[0.06]`. Active: `border-s-coral`. No glass, no animation.

#### Files
- `[NEW]` `components/dashboard/makeup/SkinToneMatcher.tsx`

#### Instructions
1. Simple classifier: warm/cool/neutral undertone selector.
2. Fitzpatrick scale (I-VI) dropdown.
3. Foundation shade recommendation list (manual entry, saved per client).
4. Displayed on client CRM card.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const UNDERTONES = [
  { key: "warm", labelKey: "undertone.warm", swatch: "#F5D0A9" },
  { key: "cool", labelKey: "undertone.cool", swatch: "#F0C4D4" },
  { key: "neutral", labelKey: "undertone.neutral", swatch: "#F0D4C4" },
];

const FITZPATRICK = [
  { value: "I", labelKey: "fitz.I" },
  { value: "II", labelKey: "fitz.II" },
  { value: "III", labelKey: "fitz.III" },
  { value: "IV", labelKey: "fitz.IV" },
  { value: "V", labelKey: "fitz.V" },
  { value: "VI", labelKey: "fitz.VI" },
];

{UNDERTONES.map(u => (
  <button key={u.key} onClick={() => setUndertone(u.key)}
    className={`rounded-[12px] border p-3 flex items-center gap-2 transition-colors duration-150 ${
      undertone === u.key
        ? "border-s-coral bg-s-coral/[0.06]"
        : "border-s-ink/[0.06] dark:border-s-dm-text/[0.06]"
    }`}>
    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: u.swatch }} />
    <span className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text">{t(u.labelKey)}</span>
  </button>
))}
```

❌ **DON'T**
```tsx
// WRONG — using non-clinical skin tone terminology
<option>Light skin</option> // Use Fitzpatrick scale labels
// WRONG — glass or animation
<div className="backdrop-blur-lg animate-fadeIn">
```

> ⚠️ **BE CAREFUL**:
> - Skin tone classification must be respectful and clinical. Use Fitzpatrick scale terminology only.
> - Undertone swatches are decorative hints — NOT diagnostic. Add a disclaimer.
> - Foundation shade is free-text entry. Do NOT hardcode brand-specific shade names.

#### Verification
```bash
npm run build
grep -rn "backdrop-blur\|glass\|font-display\|rounded-xl\|animate-" components/dashboard/makeup/SkinToneMatcher.tsx
# Expected: 0 results
git add components/dashboard/makeup/ && git commit -m "R-CD6-P5: SkinToneMatcher — undertone + foundation shade per client"
```

---

## Phase 6: Wire makeup-admin Page

> **Zone 4 constraints**: This is Zone 4. Tab bar: `border-b border-s-ink/[0.06]`. Active tab: `border-s-coral text-s-coral`.

#### Files
- `[MODIFY]` `app/[locale]/dashboard/makeup-admin/page.tsx`

#### Instructions
1. Replace stub with tabbed layout: "Clients" tab (FaceChart + SkinTone), "Events" tab (BridalPlanner), "Kit" tab (KitInventory).
2. Client selector on "Clients" tab.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```tsx
const TABS = ["clients", "events", "kit"] as const;

<div className="flex gap-4 border-b border-s-ink/[0.06] dark:border-s-dm-text/[0.06] mb-6">
  {TABS.map(tab => (
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

{activeTab === "clients" && (
  <>
    <FaceChartBuilder clientId={selectedClientId} />
    <SkinToneMatcher clientId={selectedClientId} />
  </>
)}
{activeTab === "events" && <BridalPlanner />}
{activeTab === "kit" && <KitInventory />}
```

❌ **DON'T**
```tsx
// WRONG — importing nonexistent component
import MakeupCalendar from "@/components/dashboard/makeup/MakeupCalendar";
// WRONG — no tab navigation, dumping all components on one page
```

> ⚠️ **BE CAREFUL**:
> - Verify all 4 component files exist before importing.
> - Kit tab is always available (no client selector needed). Clients and Events tabs need context.
> - Verify the stub page from R-CD1 exists at this path.

#### Verification
```bash
npm run build
ls components/dashboard/makeup/FaceChartBuilder.tsx
ls components/dashboard/makeup/BridalPlanner.tsx
ls components/dashboard/makeup/KitInventory.tsx
ls components/dashboard/makeup/SkinToneMatcher.tsx
grep -rn "import.*from.*makeup" app/[locale]/dashboard/makeup-admin/page.tsx
git add app/[locale]/dashboard/makeup-admin/ && git commit -m "R-CD6-P6: wire makeup-admin with face chart, bridal planner, kit inventory"
```

---

## Phase 7: i18n + Smoke Test

> **Zone 4 constraints**: Verification phase.

#### Files
- `[MODIFY]` `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

#### Instructions
Add `dashboardMakeup` namespace with all component keys.

#### ✅ DO / ❌ DON'T Examples

✅ **DO**
```json
{
  "dashboardMakeup": {
    "eyebrow": "Makeup",
    "title": "Makeup Studio",
    "zones": { "forehead": "Stirn", "cheekbones": "Wangenknochen", "jawline": "Kieferlinie", "eyelids": "Augenlider" },
    "technique": { "highlight": "Highlight", "contour": "Kontur", "blush": "Rouge", "bronzer": "Bronzer", "shimmer": "Schimmer" },
    "select_technique": "Technik wählen",
    "stage": { "trial_pending": "Probe ausstehend", "trial_done": "Probe fertig", "look_approved": "Look genehmigt", "day_of": "Tag des Events", "completed": "Abgeschlossen" },
    "undertone": { "warm": "Warm", "cool": "Kühl", "neutral": "Neutral" },
    "expiring": "Bald ablaufend",
    "tabs": { "clients": "Kunden", "events": "Events", "kit": "Kit" },
    "coming_soon": "Kommt bald"
  }
}
```

❌ **DON'T**
```json
// WRONG — only adding de.json
// WRONG — keys that don't match component usage
```

> ⚠️ **BE CAREFUL**:
> - ALL 4 locale files need the same keys.
> - Fitzpatrick scale labels (I-VI) do NOT need translation — they are universal clinical labels.
> - Run `grep -rn 't("' components/dashboard/makeup/` to find all key references.

#### Verification
```bash
npm run build && npx tsc --noEmit

ls components/dashboard/makeup/FaceChartBuilder.tsx
ls components/dashboard/makeup/BridalPlanner.tsx
ls components/dashboard/makeup/KitInventory.tsx
ls components/dashboard/makeup/SkinToneMatcher.tsx

grep -rn "FaceChartBuilder\|BridalPlanner\|KitInventory\|SkinToneMatcher" app/[locale]/dashboard/makeup-admin/page.tsx

grep -rn "backdrop-blur\|glass\|font-display\|Bebas\|rounded-xl\|rounded-2xl\|shadow-lg\|shadow-xl\|animate-\|motion" \
  components/dashboard/makeup/ \
  app/[locale]/dashboard/makeup-admin/
# Expected: 0 results

grep -rn "dashboardMakeup" messages/de.json messages/en.json messages/fr.json messages/it.json

git add messages/ && git commit -m "R-CD6-P7: i18n keys for makeup dashboard components"
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB migration | R-CD1 done |
| Phase 2 | 🤖 | FaceChartBuilder | Phase 1 |
| Phase 3 | 🤖 | BridalPlanner | Phase 1 |
| Phase 4 | 🤖 | KitInventory | Phase 1 |
| Phase 5 | 🤖 | SkinToneMatcher | Nothing |
| Phase 6 | 🤖 | Wire page | Phase 2-5 |
| Phase 7 | 🤖 | i18n + Smoke Test | All phases |

---

## R8: CLAUDE.md UPDATES

After execution, update:
- `CLAUDE.md` Section 3.2 (Directory Tree) — add `components/dashboard/makeup/` with all components
- `CLAUDE.md` Section 6 (Schema Table) — add `makeup_face_charts`, `bridal_workflows`, `makeup_kit_items`
- `_docs/category-system-map.md` §4.4 — update Makeup section with tables, routes, components
- `_rules/DB_SCHEMA.md` — add new table definitions

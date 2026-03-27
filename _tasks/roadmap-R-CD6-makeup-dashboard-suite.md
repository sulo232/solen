# R-CD6: Makeup Artist Dashboard Suite

> **Wave 4** — Depends on R-CD1 (category-aware shell).
> **Zone**: 4 (Structured) — ZERO glass, ZERO blobs, ZERO Bebas Neue, 12px MAX radius.
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

---

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: DB migration | 🟢 SAFE | New tables, additive | — |
| Phase 2: Face Chart Builder | 🟡 MEDIUM | SVG rendering complexity | Use simple zone-based face diagram, not photorealistic. Test mobile. |
| Phase 3: Bridal Planner | 🟢 SAFE | New component, additive | — |
| Phase 4: Kit Inventory | 🟢 SAFE | Extends retail pattern | Check existing `RetailManager.tsx`. |

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

#### Files
- `[NEW]` `supabase/migrations/XXX_makeup_dashboard.sql`

#### Instructions
```sql
CREATE TABLE IF NOT EXISTS makeup_face_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  foundation_brand TEXT,
  foundation_shade TEXT,
  undertone TEXT,                        -- "warm", "cool", "neutral"
  zones JSONB DEFAULT '{}',              -- {"highlight": "cheekbones,nose bridge", "contour": "jawline,temples", ...}
  eye_look TEXT,
  lip_colour TEXT,
  products_used JSONB DEFAULT '[]',      -- [{"brand": "MAC", "product": "Fix+", "shade": ""}]
  reference_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bridal_workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'bridal',      -- bridal, prom, editorial, corporate
  trial_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  final_booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  inspiration_urls TEXT[],
  approved_look_photo_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'trial_pending',   -- trial_pending, trial_done, look_approved, day_of_scheduled, completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS makeup_kit_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  product_name TEXT NOT NULL,
  shade TEXT,
  category TEXT,                          -- foundation, concealer, powder, blush, bronzer, etc.
  quantity INT DEFAULT 1,
  expiry_date DATE,
  cost_per_unit NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE makeup_face_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bridal_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE makeup_kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_face_charts" ON makeup_face_charts
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_bridal" ON bridal_workflows
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "salon_owner_kit" ON makeup_kit_items
  FOR ALL USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

> ⚠️ **BE CAREFUL**: RLS INSERT policies mandatory (Rule 12b). Product expiry tracking is optional but recommended.

#### Verification
```bash
git add supabase/migrations/ && git commit -m "R-CD6-P1: DB migration — makeup_face_charts + bridal_workflows + makeup_kit_items"
```

---

## Phase 2: Face Chart Builder

#### Files
- `[NEW]` `components/dashboard/makeup/FaceChartBuilder.tsx`
- `[NEW]` `app/api/dashboard/makeup/face-charts/route.ts`

#### Instructions
1. Simplified face zone selector (NOT detailed SVG art — same approach as waxing body zones).
2. Zones: forehead, cheekbones, jawline, temples, nose bridge, chin, eyelids, under-eye, lips.
3. Per zone, select technique: highlight, contour, blush, bronzer, shimmer.
4. Foundation details: brand, shade, undertone (warm/cool/neutral).
5. Eye look description + lip colour.
6. Products used: add items from kit inventory (autocomplete).
7. Reference photo upload (uses existing Supabase Storage).
8. Saved per client per visit — timeline view for repeat clients.

> ⚠️ **BE CAREFUL**:
> - Start with checkbox/dropdown zone selection — NOT interactive SVG face (that's R-CD7).
> - Zone 4: `rounded-[12px]`, no glass, no animation.
> - Products list uses autocomplete from `makeup_kit_items`.

#### Verification
```bash
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P2: FaceChartBuilder — zone-based makeup chart with product tracking"
npm run build
```

---

## Phase 3: Bridal/Event Planner

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

> ⚠️ **BE CAREFUL**:
> - Check existing `GroupBooking` type — bridal events might overlap with group bookings.
> - Status transitions must be sequential — can't skip stages.

#### Verification
```bash
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P3: BridalPlanner — multi-stage event workflow"
npm run build
```

---

## Phase 4: Kit Inventory Manager

#### Files
- `[NEW]` `components/dashboard/makeup/KitInventory.tsx`
- `[NEW]` `app/api/dashboard/makeup/kit/route.ts`

#### Instructions
1. Product CRUD: brand, product name, shade, category, quantity, expiry date, cost.
2. Category filter tabs: Foundation, Eyes, Lips, Cheeks, Brushes, Other.
3. Expiry alert: items expiring within 30 days highlighted with `text-s-warning` / `bg-s-warning-bg`.
4. Low stock alert: quantity ≤ 2 highlighted with `text-s-amber`.
5. Model after `RetailManager.tsx` in `components/dashboard/nail/`.

> ⚠️ **BE CAREFUL**: Check `RetailManager.tsx` — if it's generic enough, EXTEND instead of duplicating.

#### Verification
```bash
git add components/dashboard/makeup/ app/api/dashboard/makeup/ && git commit -m "R-CD6-P4: KitInventory — makeup product tracking with expiry alerts"
npm run build
```

---

## Phase 5: Skin Tone Matcher

#### Files
- `[NEW]` `components/dashboard/makeup/SkinToneMatcher.tsx`

#### Instructions
1. Simple classifier: warm/cool/neutral undertone selector.
2. Fitzpatrick scale (I-VI) dropdown.
3. Foundation shade recommendation list (manual entry, saved per client).
4. Displayed on client CRM card.

> ⚠️ **BE CAREFUL**: Skin tone classification must be respectful and clinical. Use Fitzpatrick scale terminology only.

#### Verification
```bash
git add components/dashboard/makeup/ && git commit -m "R-CD6-P5: SkinToneMatcher — undertone + foundation shade per client"
npm run build
```

---

## Phase 6: Wire makeup-admin Page

#### Files
- `[MODIFY]` `app/[locale]/dashboard/makeup-admin/page.tsx`

#### Instructions
1. Replace stub with tabbed layout: "Clients" tab (FaceChart + SkinTone), "Events" tab (BridalPlanner), "Kit" tab (KitInventory).
2. Client selector on "Clients" tab.

#### Verification
```bash
git add app/[locale]/dashboard/makeup-admin/ && git commit -m "R-CD6-P6: wire makeup-admin with face chart, bridal planner, kit inventory"
npm run build
```

---

## Phase 7: i18n + Smoke Test

```bash
npm run build && npx tsc --noEmit
ls components/dashboard/makeup/FaceChartBuilder.tsx
ls components/dashboard/makeup/BridalPlanner.tsx
ls components/dashboard/makeup/KitInventory.tsx
ls components/dashboard/makeup/SkinToneMatcher.tsx
grep -rn "FaceChartBuilder\|BridalPlanner\|KitInventory\|SkinToneMatcher" app/ --include="*.tsx"
grep -rn "backdrop-blur\|glass\|font-display" components/dashboard/makeup/
# Expected: 0 results
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
| Phase 7 | 🤖 | Smoke Test | All phases |

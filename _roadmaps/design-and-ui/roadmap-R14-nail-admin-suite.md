# R14: Nail Admin Suite

> **Wave 3** — Depends on Wave 1 (V3 design sweep on nail components).
> **Note**: This roadmap follows `ROADMAP_RULES.md` strict formatting.

## R1: BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1: Dynamic Pricing | 🔴 HIGH | Could break nail booking price calculation | Pricing rules are ADDITIVE modifiers only. Never replace base price. Test with existing bookings. |
| Phase 2: AI Art Generator UI | 🟡 MEDIUM | fal.ai API rate limits | Use existing `lib/nail/ai-budget.ts` for monthly budget tracking. Show budget remaining prominently. |
| Phase 3: Station Management UI | 🟢 SAFE | New component, uses existing lib | `lib/nail/station-availability.ts` already exists. |
| Phase 4: Retail Manager | 🟡 MEDIUM | New DB table needed | Create migration file. Test CRUD operations. |

---

## R2: SEPARATE MANUAL VS CODE PHASES

**🧑 MANUAL PHASES**
- Run Supabase migrations for `nail_pricing_rules` and `nail_retail_products` tables.
- Ensure `fal.ai` API key is set in Vercel env vars (`FAL_KEY`).

**🤖 CLAUDE CODE PHASES**
- Phase 1: Nail Dynamic Pricing (migration + API + dashboard UI + heatmap)
- Phase 2: AI Art Generator UI (admin-only)
- Phase 3: Station Management UI
- Phase 4: Retail Manager (inventory CRUD)
- Phase 5: Post-Execution Smoke Test

---

## Phase 1: Nail Dynamic Pricing

> ⚠️ **PRE-EXISTING CODE**: `components/dashboard/nail/DynamicPricingConfig.tsx` ALREADY EXISTS. Check it first — you may need to extend it rather than creating a new `DynamicPricingManager.tsx`.

#### Files
- `[NEW]` `supabase/migrations/XXX_nail_dynamic_pricing.sql`
- `[MODIFY or NEW]` `components/dashboard/nail/DynamicPricingConfig.tsx` (already exists — extend it, don't create a duplicate named `DynamicPricingManager.tsx`)
- `[NEW]` `app/api/nail-pricing/route.ts`
- `[MODIFY]` `app/[locale]/dashboard/nail-admin/page.tsx`

#### Instructions
1. **Migration**:
```sql
CREATE TABLE IF NOT EXISTS nail_pricing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('peak', 'off_peak', 'weekend', 'last_minute', 'loyalty', 'custom')),
  modifier_percent INTEGER NOT NULL CHECK (modifier_percent BETWEEN -50 AND 100),
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owners manage pricing rules" ON nail_pricing_rules FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

2. **API**: CRUD for pricing rules. Validate with Zod. Rate limit.
3. **Dashboard UI**: 
   - Rule list with toggle (active/inactive)
   - Weekly heatmap visualization (7 days × 12 hours grid, colored by price modifier)
   - Color scale: `bg-s-sage-subtle` (discount) → `bg-white` (base) → `bg-s-coral-subtle` (premium)
   - Add new rule modal with: name, type dropdown, modifier %, conditions (day/time/loyalty tier)
4. Zone 4 rules apply: `rounded-dash`, no glass.

---

## Phase 2: AI Art Generator UI

#### Files
- `[NEW]` `components/dashboard/nail/AiArtGenerator.tsx`
- `[MODIFY]` `app/[locale]/dashboard/nail-admin/page.tsx`

#### Instructions
1. **Admin-only**: Check user role before rendering. Only salon owners see this tab.
2. **Input selectors**:
   - Shape: visual SVG picker (reuse shapes from `ShapeLengthPicker`)
   - Style: dropdown (french, ombre, marble, abstract, geometric, floral, minimalist)
   - Color palette: 3-color picker
   - Skin tone: 5-level scale (fair → deep)
3. **Generate button**: calls fal.ai via existing API or creates new `/api/ai/nail-art/route.ts`
4. **Budget display**: prominently show remaining generations this month using `lib/nail/ai-budget.ts`
   - Progress bar: `bg-s-coral` fill, `bg-s-sand-subtle` track
   - Text: `"{used}/{limit} Generierungen diesen Monat"` in `data-text`
5. **Result gallery**: masonry grid of generated images with save/delete actions
6. Save to Supabase Storage bucket or `nail_designs` table

#### DO / DON'T Examples
✅ **DO**
```tsx
import { checkAiBudget, incrementAiBudget } from '@/lib/nail/ai-budget';
import { buildNailArtPrompt } from '@/lib/nail/ai-prompts';
```

❌ **DON'T**
```tsx
// Don't bypass the budget system
const result = await fal.run('fal-ai/...', { input: { prompt } }); // NO — use budget check first
```

---

## Phase 3: Station Management UI

#### Files
- `[NEW]` `components/dashboard/nail/StationManager.tsx`
- `[MODIFY]` `app/[locale]/dashboard/nail-admin/page.tsx`

#### Instructions
1. Use existing `lib/nail/station-availability.ts` for availability logic.
2. **Station config**: number input for station count (1–10).
3. **UV lamp tracking**: per-station toggle (has UV lamp yes/no). Affects which services can be assigned.
4. **Sterilization buffer**: minutes between clients (5–30 min input).
5. **Utilization bar**: horizontal bar per station showing daily utilization.
   - `bg-s-coral` for booked time, `bg-s-sand-subtle` for available, `bg-s-ink/10` for buffer
6. **Real-time status**: show which stations are currently occupied/available.

---

## Phase 4: Retail Manager (Inventory)

#### Files
- `[NEW]` `supabase/migrations/XXX_nail_retail_products.sql`
- `[NEW]` `components/dashboard/nail/RetailManager.tsx`
- `[NEW]` `app/api/nail-retail/route.ts`
- `[MODIFY]` `app/[locale]/dashboard/nail-admin/page.tsx`

#### Instructions
1. **Migration**:
```sql
CREATE TABLE IF NOT EXISTS nail_retail_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stock_count INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_retail_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salon owners manage retail products" ON nail_retail_products FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

2. **API**: CRUD for products. Validate with Zod.
3. **Dashboard UI**:
   - Product list with name, price, stock, image thumbnail
   - Add/edit product modal
   - Low-stock alerts: rows with `stock_count <= low_stock_threshold` highlighted in `bg-s-warning-bg`
   - Quick stock adjustment buttons (+1, -1, set count)
4. Connect to existing `components/nail/RetailCheckout.tsx` for POS flow.

---

## Phase 5: Smoke Test

#### Verification
```bash
npm run build
npx tsc --noEmit
# Verify new components exist:
ls components/dashboard/nail/DynamicPricingManager.tsx
ls components/dashboard/nail/AiArtGenerator.tsx
ls components/dashboard/nail/StationManager.tsx
ls components/dashboard/nail/RetailManager.tsx
# Verify imports in nail-admin page:
grep -rn "DynamicPricingManager\|AiArtGenerator\|StationManager\|RetailManager" app/[locale]/dashboard/nail-admin/ --include="*.tsx"
# Must find all 4 imports
# Verify migration files:
ls supabase/migrations/*nail_dynamic*
ls supabase/migrations/*nail_retail*
```

---

## R6: DEPENDENCY ORDERING TABLE

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Dynamic Pricing | Nothing (migration needs manual run) |
| Phase 2 | 🤖 | AI Art Generator UI | Nothing |
| Phase 3 | 🤖 | Station Management | Nothing |
| Phase 4 | 🤖 | Retail Manager | Nothing (migration needs manual run) |
| Phase 5 | 🤖 | Smoke Test | All phases |

---

## R8: FINAL UPDATES TO CLAUDE.md
- Add `nail_pricing_rules` and `nail_retail_products` tables to `_rules/DB_SCHEMA.md`
- Update CLAUDE.md §3.5 Features 44, 45, 46 to mark as ✅ implemented

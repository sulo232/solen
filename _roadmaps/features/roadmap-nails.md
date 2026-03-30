# 💅 Nail Category Mega-Build — Audited Final Roadmap (v2)

> **Audited and consolidated.** Follows CLAUDE.md R1-R10. Execute as numbered prompts.
> Each **Prompt** is one Claude Code session. Each sub-phase (1.1, 1.2...) is one commit.
> `npm run build` must pass before every commit. Read `_docs/category-system-map.md` first.

---

## AUDIT FIXES APPLIED (v2)

| # | Issue Found | Severity | Fix |
|---|---|---|---|
| 1 | `lib/hair-budget.ts` referenced in Phase 12 but doesn't exist | 🔴 CRITICAL | Create `lib/nail/ai-budget.ts` from scratch instead of reusing. Include Redis monthly cap pattern inline |
| 2 | `staff_services` table may not exist yet (megabuild not fully deployed) | 🔴 CRITICAL | Phase 1 SQL now checks `IF NOT EXISTS` for the table itself, creates if missing |
| 3 | Phase 4 says "frontend change, not API change" for chat inspo → but no UI phase covers this | 🟡 MEDIUM | Added explicit UI task in Phase 9 for "Save to inspo board" prompt in chat |
| 4 | Phase 5 modifies booking flow price display (backend) but UI is in Phase 9 → ordering gap | 🟡 MEDIUM | Moved tier pricing display logic to Phase 9 alongside other booking UI changes |
| 5 | Phase 6 infill cron creates "dashboard notification" but no notification table/API exists | 🔴 CRITICAL | Phase 6 now uses existing `client_notes` as notification channel + dashboard banner component |
| 6 | Phase 7 BNPL/Klarna not in Manual Steps | 🟡 MEDIUM | Added Manual Step D for Klarna activation |
| 7 | Phase 10 "publish to discovery" toggle has no backend route | 🟡 MEDIUM | Added `api/nail-discovery/publish` route in Phase 6 API |
| 8 | Phase 11 nail discovery admin page created but no route for admin CRUD on discovery_items | 🟡 MEDIUM | Reuses existing `api/admin/discovery` routes from hair discovery |
| 9 | `nail_inspo_images.user_id` has no FK to `auth.users` | 🟢 LOW | Added FK constraint |
| 10 | `nail_design_history.customer_id` has no FK | 🟢 LOW | Left as-is (customer may not have account — guest bookings) — added comment |
| 11 | Expanded intake (15 questions) described but not actually written out | 🟡 MEDIUM | Full 15-question array included in Phase 2 |
| 12 | `staff_portfolio_images` table exists but no migration verifies its columns | 🟢 LOW | ALTERs use `IF NOT EXISTS` — safe |
| 13 | Translations only in `de.json` example — missing en/fr/it content | 🟢 LOW | Note added: translate all 4 locales, not just copy DE |
| 14 | Phase 9 `InspoBoard` component defined but booking flow integration is vague | 🟡 MEDIUM | Added explicit modal integration spec |

---

## MANUAL STEPS (Before any code prompts)

### Manual A: Supabase Storage Buckets
Dashboard → Storage → Create:
- `nail-inspo-images` — **Private**, 5MB, `image/*` only
- `nail-portfolio-images` — **Public**, 5MB, `image/*` only
- Add RLS on both (salon owner + client for inspo)

### Manual B: Feature Flag
```sql
INSERT INTO feature_flags (key, enabled, description)
VALUES ('nail_features', false, 'Nail category extended features')
ON CONFLICT (key) DO NOTHING;
```

### Manual C: Verify `staff_services` Table Exists
Check in Supabase: `SELECT * FROM staff_services LIMIT 1;`
If it doesn't exist, the Phase 1 migration will create it.

### Manual D: Klarna Activation (P2 — do before Phase 7)
Stripe Dashboard → Settings → Payment Methods → Enable Klarna for Switzerland.

---

## PROMPT 1 — Database Foundation

### Phase 1.1: Core Nail Tables

#### [NEW] `supabase/migrations/XXX_nail_foundation.sql`

```sql
-- ============================================================
-- PREREQUISITE: Ensure staff_services exists (megabuild may not be deployed)
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_services (
  staff_member_id UUID REFERENCES staff_members(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_member_id, service_id)
);

-- ============================================================
-- NAIL DESIGN HISTORY
-- customer_id intentionally has no FK — supports guest bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_design_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  staff_member_id UUID REFERENCES staff_members(id),
  shape TEXT CHECK (shape IN ('round','square','almond','coffin','stiletto','oval','squoval','ballerina','lipstick','edge')),
  length TEXT CHECK (length IN ('natural','short','medium','long','extra_long')),
  material TEXT CHECK (material IN ('natural','gel','acrylic','dip_powder','biab','shellac','polygel','press_on','gel_x')),
  style_category TEXT CHECK (style_category IN ('french','ombre','chrome','3d','marble','minimalist','glitter','abstract','floral','geometric','solid','negative_space','encapsulated','cat_eye','aurora','velvet','glazed_donut')),
  color_primary TEXT,
  color_secondary TEXT,
  color_brand TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nail_history_customer ON nail_design_history(salon_id, customer_id);
ALTER TABLE nail_design_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nail_history_salon" ON nail_design_history FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "nail_history_customer" ON nail_design_history FOR SELECT
  USING (customer_id = auth.uid());

-- ============================================================
-- NAIL CLIENT PREFERENCES
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_client_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID NOT NULL,
  preferred_shape TEXT,
  preferred_length TEXT,
  preferred_material TEXT,
  preferred_brand TEXT,
  allergies TEXT[] DEFAULT '{}',
  allergy_severity TEXT DEFAULT 'mild' CHECK (allergy_severity IN ('mild','moderate','severe')),
  allergy_notes TEXT,
  skin_sensitivity TEXT CHECK (skin_sensitivity IN ('normal','sensitive','very_sensitive')),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, customer_id)
);
ALTER TABLE nail_client_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nail_prefs_salon" ON nail_client_preferences FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "nail_prefs_customer" ON nail_client_preferences FOR SELECT
  USING (customer_id = auth.uid());
```

> **Verify**: `npm run build` (migration doesn't affect build)
> **Commit**: `git commit -m "phase 1.1: nail_design_history + nail_client_preferences tables"`

### Phase 1.2: Inspo + Stations + Extensions

```sql
-- ============================================================
-- NAIL INSPO BOARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_inspo_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Inspo',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_inspo_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspo_boards_own" ON nail_inspo_boards FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- NAIL INSPO IMAGES (FK to auth.users fixed from audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_inspo_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES nail_inspo_boards(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id),
  image_url TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_inspo_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspo_own" ON nail_inspo_images FOR ALL USING (user_id = auth.uid());
CREATE POLICY "inspo_salon_read" ON nail_inspo_images FOR SELECT USING (
  booking_id IN (SELECT id FROM bookings WHERE salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())));

-- ============================================================
-- NAIL STATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  station_count INTEGER NOT NULL DEFAULT 4,
  has_uv_lamps BOOLEAN DEFAULT true,
  uv_lamp_count INTEGER DEFAULT 4,
  sterilization_buffer_minutes INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE nail_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stations_salon" ON nail_stations FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "stations_public_read" ON nail_stations FOR SELECT USING (true);

-- ============================================================
-- EXTEND EXISTING TABLES
-- ============================================================
ALTER TABLE staff_services ADD COLUMN IF NOT EXISTS price_override INTEGER;
ALTER TABLE staff_services ADD COLUMN IF NOT EXISTS tier_label TEXT CHECK (tier_label IN ('junior','standard','senior','master'));

ALTER TABLE services ADD COLUMN IF NOT EXISTS material_type TEXT;
ALTER TABLE services ADD COLUMN IF NOT EXISTS curing_minutes INTEGER DEFAULT 0;
ALTER TABLE services ADD COLUMN IF NOT EXISTS station_required BOOLEAN DEFAULT false;
ALTER TABLE services ADD COLUMN IF NOT EXISTS reminder_cycle_days INTEGER;

ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_style TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_shape TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS nail_material TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Feature flag
INSERT INTO feature_flags (key, enabled, description)
VALUES ('nail_features', false, 'Nail category extended features')
ON CONFLICT (key) DO NOTHING;
```

> **Commit**: `git commit -m "phase 1.2: inspo tables, stations, extend staff_services/services/portfolio"`

### Phase 1.3: P2 Tables (Dynamic Pricing + Retail)

```sql
-- ============================================================
-- NAIL DYNAMIC PRICING RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_dynamic_pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('peak','off_peak','day_special','demand','segment')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME,
  end_time TIME,
  price_modifier NUMERIC(4,2) NOT NULL CHECK (price_modifier BETWEEN 0.5 AND 2.0),
  label_de TEXT,
  label_en TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing_salon" ON nail_dynamic_pricing_rules FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "pricing_public_read" ON nail_dynamic_pricing_rules FOR SELECT USING (is_active = true);

-- ============================================================
-- NAIL RETAIL PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS nail_retail_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image_url TEXT,
  category TEXT CHECK (category IN ('cuticle_oil','hand_cream','press_on','nail_kit','polish','other')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE nail_retail_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "retail_salon" ON nail_retail_products FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "retail_public_read" ON nail_retail_products FOR SELECT USING (is_active = true);
```

> **Commit**: `git commit -m "phase 1.3: dynamic pricing rules + retail products tables"`

> ⚠️ **BE CAREFUL (all Phase 1)**:
> - `CREATE TABLE IF NOT EXISTS` on `staff_services` ensures megabuild dependency is safe
> - ALL ALTERs use `IF NOT EXISTS` — idempotent
> - `customer_id` in `nail_design_history` intentionally has no FK (guest booking support)
> - `price_modifier` has CHECK constraint (0.5-2.0) — prevents absurd prices
> - `nail_inspo_images.user_id` now has proper FK to `auth.users` (audit fix #9)

---

## PROMPT 2 — Types, Schemas, Utilities

### Phase 2.1: TypeScript Types

#### [MODIFY] `lib/types.ts` — Append (do NOT remove existing)

Add all nail types: `NailShape`, `NailLength`, `NailMaterial`, `NailStyleCategory`, `NailAllergySeverity`, `NailRetailCategory`, `DynamicPricingRuleType`, `StaffTier` union types.

Add all nail interfaces: `NailDesignHistory`, `NailClientPreferences`, `NailInspoBoard`, `NailInspoImage`, `NailStation`, `NailDynamicPricingRule`, `NailRetailProduct`.

Add `'nail_features'` to `FeatureKey` union in `lib/feature-flags.ts`.

> **Commit**: `git commit -m "phase 2.1: nail TypeScript types + feature flag key"`

### Phase 2.2: Zod Validations

#### [MODIFY] `lib/validations.ts` — Append schemas

Add: `nailDesignHistorySchema`, `nailPreferencesSchema`, `nailInspoSchema`, `nailStationSchema`, `nailDynamicPricingSchema`, `nailRetailProductSchema`, `nailPortfolioTagsSchema`.

All enums must match the SQL CHECK constraints exactly.

> **Commit**: `git commit -m "phase 2.2: nail Zod validation schemas"`

### Phase 2.3: Utility Functions

#### [NEW] `lib/nail/station-availability.ts`
Check concurrent nail bookings vs station_count. Include sterilization buffer.
Returns `{ available: boolean; used: number; total: number }`.

#### [NEW] `lib/nail/infill-calculator.ts`
Calculate next infill date from `lastBookingDate + reminderCycleDays`.
Returns `{ reminderDate: Date; daysRemaining: number; isOverdue: boolean }`.

> **Commit**: `git commit -m "phase 2.3: station availability checker + infill calculator"`

### Phase 2.4: Expanded Nail Intake Questionnaire

#### [MODIFY] `lib/intake-templates.ts`
Replace `nail_consultation` array (currently 5 questions) with 15 questions:

1. `current_nail_state` — select: natural/gel/acrylic/dip/damaged/bitten
2. `nail_type` — select: natural/gel/acrylic/dip_powder (existing)
3. `previous_treatments` — text: last treatment + date
4. `material_preference` — select: gel/acrylic/dip_powder/biab/shellac/polygel/no_preference
5. `desired_shape` — select: round/square/almond/coffin/stiletto/oval/squoval (existing)
6. `preferred_length` — select: short/medium/long/extra_long (existing)
7. `style_inspiration` — text: describe desired look or paste URL
8. `color_preferences` — text: preferred colors/brands
9. `nail_conditions` — text: lifting/breakage/ridges/discoloration (existing, expanded)
10. `allergies` — text: allergies to nail materials (existing, expanded)
11. `allergy_details` — text: specific reactions, severity
12. `skin_sensitivity` — select: normal/sensitive/very_sensitive
13. `cuticle_care` — select: regular/occasional/never
14. `lifestyle_factors` — text: manual work, sports, typing-heavy job
15. `budget_range` — select: budget/mid_range/premium/no_limit

> **Commit**: `git commit -m "phase 2.4: expanded 15-question nail intake questionnaire"`

> ⚠️ **BE CAREFUL**: `IntakeTemplateKey` already includes `'nail_consultation'` — keep the same key, just replace the array contents. Run `npx tsc --noEmit` after.

---

## PROMPT 3 — API: Nail CRM

### Phase 3.1: Design History API

#### [NEW] `app/api/clients/[id]/nail-history/route.ts`
- **GET**: Paginated design history (newest first). Salon owner only (check `salons.owner_id`).
- **POST**: Create record. Validate with `nailDesignHistorySchema`. If photo provided, upload to `client-photos` bucket. Set `staff_member_id` from booking if linked.
- All 6 security layers: feature flag → auth → ban check → rate limit → Zod → logic.

> **Commit**: `git commit -m "phase 3.1: nail design history GET/POST API"`

### Phase 3.2: Preferences + Allergies API

#### [NEW] `app/api/clients/[id]/nail-preferences/route.ts`
- **GET**: Fetch preferences for client at authenticated salon.
- **PUT**: Upsert preferences. Validate with `nailPreferencesSchema`.
- **Allergy auto-tag**: If `allergies.length > 0 && allergy_severity === 'severe'` → auto-create red `client_tag` with `tag='⚠️ {allergy}'` for each. Use existing `client_tags` insert.

#### [NEW] `app/api/clients/[id]/nail-allergies/route.ts`
- **GET**: Lightweight allergy-only endpoint for booking flow warning.
- Returns: `{ allergies: string[], severity: string, hasAllergy: boolean }`
- No auth required if the user is the customer themselves (auth.uid === id).

> **Commit**: `git commit -m "phase 3.2: nail preferences upsert + allergy API + auto-tagging"`

### Phase 3.3: Repeat Last API

#### [NEW] `app/api/clients/[id]/repeat-last/route.ts`
- **GET**: Returns most recent `nail_design_history` record for this client at this salon.
- If no history → returns `{ data: null }` (not 404).
- Used by booking flow "Repeat last" button.

> **Commit**: `git commit -m "phase 3.3: repeat-last design API for booking flow"`

---

## PROMPT 4 — API: Inspo System

### Phase 4.1: Inspo Boards API

#### [NEW] `app/api/nail-inspo/boards/route.ts`
- **GET**: List user's inspo boards. Auth required.
- **POST**: Create board. Name required. Max 10 boards per user (count check before insert).
- **DELETE**: Delete board (own only). Images stay with `board_id = NULL`.

> **Commit**: `git commit -m "phase 4.1: nail inspo boards CRUD API"`

### Phase 4.2: Inspo Images + Booking Attachment

#### [NEW] `app/api/nail-inspo/images/route.ts`
- **POST**: Upload inspo image to `nail-inspo-images` bucket. Validate: image/* only, max 5MB. Link to board_id if provided.
- **GET**: List images. Filterable by `board_id`. Paginated.
- **DELETE**: Remove image (own only). Also deletes from storage.

#### [NEW] `app/api/bookings/[id]/inspo/route.ts`
- **POST**: Attach an existing inspo image to a booking (sets `nail_inspo_images.booking_id`). Or upload new image directly attached to booking.
- **GET**: Get inspo images for a booking. Salon owner can see these during the appointment.

> **Commit**: `git commit -m "phase 4.2: inspo image upload + booking attachment API"`

---

## PROMPT 5 — API: Portfolio, Stations, Pricing

### Phase 5.1: Nail Tech Portfolio API

#### [NEW] `app/api/nail-tech/[id]/portfolio/route.ts`
- **GET**: Public. Paginated portfolio for a nail tech.
- Filterable by: `nail_style`, `nail_shape`, `nail_material`.
- Queries `staff_portfolio_images` with new metadata columns.
- Returns: image, style tags, shape, material, caption, created_at.

#### [MODIFY] `app/api/staff/portfolio/route.ts`
- **POST** (extend): When uploading a portfolio image, if `salon.categories.includes('nails')`:
  - Accept optional `nail_style`, `nail_shape`, `nail_material`, `tags` fields.
  - Call **Gemini AI Vision** (`lib/ai-vision.ts`) to auto-detect: style category, shape, material from the photo.
  - Return AI suggestions as defaults — salon owner can override before saving.

> **Commit**: `git commit -m "phase 5.1: nail tech portfolio feed + AI auto-tagging via Gemini"`

### Phase 5.2: Station Management API

#### [NEW] `app/api/salon/stations/route.ts`
- **GET**: Get station config. If no `nail_stations` row exists → return defaults `{ station_count: 4, ... }`.
- **PUT**: Upsert station config. Validate with `nailStationSchema`.
- Only for salons with `nails` in categories (check + 403).

#### [MODIFY] `app/api/cron/generate-slots/route.ts`
- **AFTER** existing slot generation, add nail station check:
  - `if (salon.categories.includes('nails'))` → call `checkStationAvailability()`
  - If concurrent bookings >= station_count → mark excess slots as `blocked`.
  - Wrap in try/catch — station check failure must NOT break slot generation for other salons.

> **Commit**: `git commit -m "phase 5.2: station management API + slot generation station limiting"`

### Phase 5.3: Tier Pricing Data

- No separate API route needed — tier pricing is read from `staff_services.price_override` and `tier_label` in the booking flow.
- Salon owner manages via existing staff settings UI (extended in Phase 10).

> **Commit**: (no commit — covered by Phase 1.2 migration + Phase 9 UI)

---

## PROMPT 6 — API: Reminders, Discovery, Publish

### Phase 6.1: Infill Reminder Cron

#### [NEW] `app/api/cron/nail-infill-reminders/route.ts`
- Runs daily. Cron secret header check (same pattern as `api/cron/reminders`).
- Query: bookings WHERE `services.category = 'nails'` AND `services.reminder_cycle_days IS NOT NULL` AND `bookings.status = 'completed'` AND `completed_at + reminder_cycle_days` is within next 2 days AND no subsequent nail booking exists for this client.
- **Semi-auto**: For each match, create a `client_note` with `note_type = 'infill_reminder'` and a structured JSON body: `{ type: 'infill_reminder', service_name, customer_name, customer_id, due_date }`.
- Dashboard reads these notes and shows a banner (Phase 10 UI).
- **Does NOT auto-send SMS/email.** Salon clicks "Send" in dashboard → calls existing SMS/email API.

> **Commit**: `git commit -m "phase 6.1: semi-auto infill reminder cron (creates dashboard notifications)"`

### Phase 6.2: Nail Discovery Feed API

#### [NEW] `app/api/discover/nails/route.ts`
- **GET**: Nail discovery feed. **Reuses existing systems entirely**:
  - Queries `discovery_items` WHERE `category = 'nails'`
  - Filters: `nail_shape`, `nail_style`, material (from tags), `gender`
  - Uses `lib/discovery-algorithm.ts` for scoring (add nail_shape/material match signals)
  - Supports pagination, sorting (trending/newest/most_saved)
- All security layers: feature flag → rate limit → Zod query params.

#### [MODIFY] `lib/discovery-algorithm.ts`
- Add nail branch: if `category === 'nails'` → weight by `nail_shape` match (user pref) + `nail_style` match + material preference.
- Keep existing hair algorithm unchanged — add `else if` branch.

> **Commit**: `git commit -m "phase 6.2: nail discovery feed API + algorithm nail signals"`

### Phase 6.3: Publish Design to Discovery

#### [NEW] `app/api/nail-discovery/publish/route.ts`
- **POST**: Salon owner publishes a `nail_design_history` photo to discovery.
- Creates `discovery_items` entry with `category='nails'`, `content_type='salon'`.
- Maps: `shape→nail_shape`, `style_category→nail_style`, `material→tags`, `photo_url→image_url`.
- Calls `lib/ai-vision.ts` (Gemini) to generate descriptions in 4 locales.
- Sets `status='published'` (salon content = instant, no moderation needed).

> **Commit**: `git commit -m "phase 6.3: publish nail design to discovery API + Gemini descriptions"`

---

## PROMPT 7 — API: Dynamic Pricing + Retail + BNPL (P2)

### Phase 7.1: Dynamic Pricing API

#### [NEW] `app/api/salon/dynamic-pricing/route.ts`
- **GET**: List rules for salon. **POST**: Create rule. **DELETE**: Deactivate rule.
- Validate with `nailDynamicPricingSchema`. Only for nail salons.
- Price calculation helper: `getAdjustedPrice(basePrice, salonId, startsAt)` → returns `{ originalPrice, adjustedPrice, modifier, label }`.

> **Commit**: `git commit -m "phase 7.1: dynamic pricing rules CRUD + price calculation helper"`

### Phase 7.2: Retail POS API

#### [NEW] `app/api/salon/retail/route.ts`
- **GET** (public): List active retail products for salon.
- **POST**: Create product. Image upload to `service-photos` bucket.
- **PUT**: Update product. **DELETE**: Deactivate (soft delete).

#### [NEW] `app/api/salon/retail/purchase/route.ts`
- **POST**: Create Stripe PaymentIntent for retail purchase. Same Connect setup as services.
- Can bundle with booking payment (add `retail_items` to existing payment intent metadata).

> **Commit**: `git commit -m "phase 7.2: retail product CRUD + Stripe purchase API"`

### Phase 7.3: BNPL (Klarna via Stripe)

#### [MODIFY] `app/api/stripe/create-payment-intent/route.ts`
- If total > CHF 100 AND salon has Klarna enabled → add `'klarna'` to `payment_method_types`.
- No new tables — Stripe handles installment plans.
- Add to PaymentIntent metadata: `{ klarna_enabled: 'true' }`.

> **Commit**: `git commit -m "phase 7.3: BNPL Klarna integration in Stripe PaymentIntent"`

---

## PROMPT 8 — UI: Tech Portfolio

### Phase 8.1: Portfolio Components

#### [NEW] `components/nail/TechPortfolio.tsx`
- Instagram-style masonry grid. Lazy load + infinite scroll.
- Filter pills: Style (French, Chrome, 3D...), Shape (Almond, Coffin...), Material (Gel, Acrylic...).
- Zone 1 tokens: `rounded-blob-d` cards, `bg-s-cream`, `shadow-card`.

#### [NEW] `components/nail/NailDesignCard.tsx`
- Image card: photo, style/shape/material badges, like count, salon name.
- "Diesen Look buchen" CTA → links to booking with `?serviceId={id}&staffId={id}`.
- Before/after toggle if both `client_photos` (before) and design history photo (after) exist.

> **Commit**: `git commit -m "phase 8.1: TechPortfolio + NailDesignCard components"`

### Phase 8.2: Tech Profile Page + Salon Integration

#### [NEW] `app/[locale]/nail-tech/[id]/page.tsx`
- Public page. Avatar, name, bio, tier badge, rating, total designs count.
- `<TechPortfolio>` grid.
- "Bei {name} buchen" CTA button.
- SEO: `generateMetadata()` with tech name, salon, OG image.

#### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`
- If `salon.categories.includes('nails')` → add "Unsere Nail Artists" section.
- Shows tech cards with 3 portfolio preview images each.
- "Alle Designs ansehen →" link to tech profile page.
- **Read the full page first** — it's large. Add section conditionally, don't restructure.

> **Commit**: `git commit -m "phase 8.2: nail tech profile page + salon page integration"`

---

## PROMPT 9 — UI: Booking Flow Extensions

### Phase 9.1: Material + Shape Selectors

#### [NEW] `components/nail/MaterialSelector.tsx`
- Visual pill buttons for each material type with icons/descriptions.
- Only shows if selected service has `category === 'nails'`.

#### [NEW] `components/nail/ShapeLengthPicker.tsx`
- 10 shape icons (round, square, almond, coffin, stiletto, oval, squoval, ballerina, lipstick, edge).
- Length slider: natural → short → medium → long → extra_long.
- Visual preview combining shape + length.

> **Commit**: `git commit -m "phase 9.1: MaterialSelector + ShapeLengthPicker components"`

### Phase 9.2: Inspo Upload + Board Browser

#### [NEW] `components/nail/InspoUploader.tsx`
- Drag-and-drop zone + camera capture button.
- Shows thumbnails of attached inspo images.
- "Aus meinem Board wählen" button → opens `InspoBoard` modal.

#### [NEW] `components/nail/InspoBoard.tsx`
- Modal/overlay. Pinterest-style grid of user's saved inspo images.
- Board selector tabs at top. Select images → attach to booking.
- "Neues Board erstellen" inline form.

#### [NEW] `components/nail/AllergyWarning.tsx`
- Red alert banner. Shows if `nail_client_preferences.allergies` has entries with `severity === 'severe'`.
- Text: "⚠️ Allergie gegen {material} — bitte informiere das Nagelstudio".
- Shows in booking flow AND salon booking detail view.

> **Commit**: `git commit -m "phase 9.2: InspoUploader + InspoBoard modal + AllergyWarning"`

### Phase 9.3: BookingCalendar Integration

#### [MODIFY] `components/BookingCalendar.tsx`
- **READ THE FULL FILE FIRST** (20KB+). Do NOT restructure existing flow.
- Add conditional block: `{selectedService?.category === 'nails' && <NailBookingSteps />}`
- Place AFTER service/staff selection, BEFORE date/time picker.

#### [NEW] `components/nail/NailBookingSteps.tsx`
Wraps all nail-specific booking steps in order:
1. `<MaterialSelector />` — if service has `material_type`
2. `<ShapeLengthPicker />` — always for nails
3. `<InspoUploader />` — with "Aus Board wählen" CTA
4. Repeat Last: fetch `/api/clients/{id}/repeat-last` → if data exists, show last design card with "Wiederholen" button (pre-fills shape/length/material)
5. `<AllergyWarning />` — auto-fetch from `/api/clients/{id}/nail-allergies`
6. Tier pricing display: if `staff_services.price_override` → show "CHF {price} · {tier_label} Nail Artist"
7. Station indicator: if `nail_stations` configured → "Noch {available} Plätze verfügbar"

#### Chat inspo integration (audit fix #3)
- In DM chat (`components/chat/` or wherever messages render), when a nail-service conversation has an image message → add small "💾 Auf Board speichern" button below the image. Calls POST `/api/nail-inspo/images` with `source_url = message.image_url`.

> **Commit**: `git commit -m "phase 9.3: NailBookingSteps integration + BookingCalendar + chat inspo save"`

> ⚠️ **BE CAREFUL**: BookingCalendar is the #1 risk. ONLY add `<NailBookingSteps>` as a conditional render. Do NOT move existing steps. Test that hair/spa/waxing/barbershop bookings still work unchanged after this change.

---

## PROMPT 10 — UI: Nail CRM Dashboard

### Phase 10.1: Dashboard Page + Sidebar

#### [NEW] `app/[locale]/dashboard/nail-clients/page.tsx`
- Client list with nail data: last design photo, preferred shape badge, allergy warning icon.
- Search by name/phone/email. Paginated.
- Click → client detail view with tabs.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`
- Add conditional sidebar item (ONLY if `salon.categories.includes('nails')`):
  ```typescript
  { label: "Nail Kunden", href: "/dashboard/nail-clients", icon: Sparkles },
  ```
- Find exact insertion position. Read file first.

> **Commit**: `git commit -m "phase 10.1: nail CRM dashboard page + sidebar item"`

### Phase 10.2: Client Detail Components

#### [NEW] `components/nail/DesignHistoryTimeline.tsx`
- Vertical timeline. Each entry: date, photo, shape/length/material badges, color swatch circle (`color_primary` as CSS bg), notes.
- "Wiederholen" button → navigates to booking with pre-filled params.
- "Auf Discovery veröffentlichen" toggle → calls `POST /api/nail-discovery/publish` (Phase 6.3).

#### [NEW] `components/dashboard/nail/NailClientTab.tsx`
- Tabs: Designs | Präferenzen | Inspiration | Notizen | Tags
- **Designs tab**: `<DesignHistoryTimeline />`
- **Präferenzen tab**: Editable preferences form (shape, length, material, brand, allergies with severity)
- **Inspiration tab**: Read-only browse of client's inspo boards (salon view during appointment)
- **Notizen tab**: Existing `client_notes` component (already works)
- **Tags tab**: Existing `client_tags` component (already works, allergy auto-tags visible)

> **Commit**: `git commit -m "phase 10.2: DesignHistoryTimeline + NailClientTab with 5 tabs"`

### Phase 10.3: Settings Components

#### [NEW] `components/dashboard/nail/InfillReminderConfig.tsx`
- Per-service config. Lists all nail services with toggle: "Erinnerung nach X Tagen".
- Default: 14 (gel), 21 (acrylic). Saves to `services.reminder_cycle_days`.
- Shows count: "{N} Kunden fällig diese Woche" with list.
- "Erinnerung senden" button per client → calls existing SMS/email send endpoint.
- Reads infill notification notes from `client_notes` (created by Phase 6.1 cron).

#### [NEW] `components/dashboard/nail/StationManager.tsx`
- Station count input, UV lamp count, sterilization buffer minutes.
- Live utilization bar: "3 von 4 Stationen belegt" (fetches from station-availability util).
- Saves to `nail_stations` via `PUT /api/salon/stations`.

#### [MODIFY] Staff settings (wherever staff_services are managed)
- Add `price_override` and `tier_label` fields per service assignment.
- Salon owner can set per-tech pricing: "Gel Maniküre — Junior: CHF 45 / Senior: CHF 65 / Master: CHF 85".

> **Commit**: `git commit -m "phase 10.3: InfillReminderConfig + StationManager + tier pricing settings"`

---

## PROMPT 11 — UI: Nail Discovery Section

### Phase 11.1: Discovery Page + Grid

#### [NEW] `app/[locale]/discover/nails/page.tsx`
- Server component. `generateMetadata()` with SEO.
- Nail masonry grid using `api/discover/nails` endpoint.

#### [NEW] `components/nail/NailDiscoveryGrid.tsx`
- Same masonry pattern as Hair Discovery (`components/hair/DiscoveryGrid.tsx`) adapted for nails.
- Three sections: "Trending", "Von Nagelstudios", "Community".
- Cards: image, style badge, salon name, like/save buttons.
- Infinite scroll, lazy load.

#### [NEW] `components/nail/NailDiscoveryFilters.tsx`
- Style pills: French, Chrome, 3D, Ombré, Marble, Minimalist, Glitter, etc.
- Shape filter with visual icons.
- Material filter pills.
- AND logic. Clear all button.

> **Commit**: `git commit -m "phase 11.1: nail discovery page + grid + filters"`

### Phase 11.2: Discovery Integration + Category Tab

#### [MODIFY] Main `/discover` page (or `components/layout/BottomNav.tsx`)
- Add "Nails" category tab alongside existing tabs on the discover page.
- Clicking "Nails" navigates to `/discover/nails`.

> **Commit**: `git commit -m "phase 11.2: nails tab on discover page"`

### Phase 11.3: Nail Admin Content Studio

#### [NEW] `app/[locale]/dashboard/nail-admin/page.tsx`
- Admin-only (check `profiles.role === 'admin'`).
- Tabs: Import | Content | Moderation
- **Import tab**: Stock photo search (`lib/stock-photos.ts`) for "nail art", "french manicure", etc. TikTok import (`lib/tiktok-embed.ts`) for nail videos. Bulk import to `discovery_staging`.
- **Content tab**: Manage published nail discovery items. Edit, deactivate, reorder.
- **Moderation tab**: Pending user-submitted nail photos. Approve/reject.
- Reuses existing admin discovery routes (`api/admin/discovery/*`) from hair discovery.

> **Commit**: `git commit -m "phase 11.3: nail admin content studio (import, content, moderation)"`

> ⚠️ **BE CAREFUL**: This reuses existing `discovery_items` and `discovery_staging` tables. Set `category='nails'` on all content. Do NOT create separate nail discovery tables. Reuse `api/admin/discovery` routes — verify they accept a `category` filter param.

---

## PROMPT 12 — AI Nail Art Generator (P2)

### Phase 12.1: AI Generation API + Prompts

#### [NEW] `lib/nail/ai-prompts.ts`
- Nail art prompt templates with variables: `[SHAPE]`, `[LENGTH]`, `[MATERIAL]`, `[STYLE]`, `[COLORS]`, `[SKIN_TONE]`, `[HAND_POSE]`.
- 3 shot types: Hero (full hand, 5 nails visible), Detail (single nail macro), Lifestyle (hand in context).

#### [NEW] `lib/nail/ai-budget.ts`
- Redis monthly spend cap. Key: `nail-ai-budget:{YYYY-MM}`.
- At 80% → `console.warn("[nail-budget] 80% threshold")`.
- At 100% → block non-admin generation.
- **Built from scratch** (audit fix #1: `hair-budget.ts` doesn't exist).

#### [NEW] `app/api/admin/nail/generate/route.ts`
- POST: Admin-only. DB role check. Shape + style + color selectors → fal.ai generation.
- Downloads image → uploads to `nail-portfolio-images` bucket → creates `discovery_items` entry via staging pipeline.
- Tracks cost per generation in Redis.
- If `FAL_KEY` not set → return 503 with "AI Generation nicht verfügbar".

> **Commit**: `git commit -m "phase 12.1: AI nail art generator API + prompts + budget tracking"`

### Phase 12.2: Admin Generate UI

#### [MODIFY] `app/[locale]/dashboard/nail-admin/page.tsx`
- Add "Generate" tab (4th tab alongside Import/Content/Moderation).
- Shape + Style + Color selectors → "Generieren" button → loading state → preview → "Veröffentlichen".
- Cost tracker: "Diesen Monat: CHF {spent} / CHF {budget}".

> **Commit**: `git commit -m "phase 12.2: AI nail generation tab in admin studio"`

---

## PROMPT 13 — UI: Retail + Dynamic Pricing + BNPL (P2)

### Phase 13.1: Retail Manager + Checkout

#### [NEW] `components/dashboard/nail/RetailManager.tsx`
- Product list with image, name, price, category badge.
- "Neues Produkt" form (name, price, category, image upload).
- Sales history summary.

#### [NEW] `components/nail/RetailCheckout.tsx`
- In-salon POS checkout. Product cart → Stripe payment.
- Can bundle with service: "Cuticle Oil hinzufügen? +CHF 15" in booking completion screen.

> **Commit**: `git commit -m "phase 13.1: RetailManager + RetailCheckout components"`

### Phase 13.2: Dynamic Pricing Config

#### [NEW] `components/dashboard/nail/DynamicPricingConfig.tsx`
- Rule editor: type selector, day picker, time range, modifier slider (0.5x–2.0x).
- Live preview: "Samstag 10:00–14:00 → +20%"
- Shows a weekly heatmap of price modifiers per time slot.

> **Commit**: `git commit -m "phase 13.2: DynamicPricingConfig component"`

### Phase 13.3: BNPL UI in Checkout

#### [MODIFY] Booking checkout component
- If `klarna_enabled` in PaymentIntent metadata AND total > CHF 100:
  - Show "oder in 3 Raten zahlen" option with Klarna logo.
  - Uses Stripe Elements Klarna payment method.
  - Shows: "3 × CHF {total/3}/Monat".

> **Commit**: `git commit -m "phase 13.3: Klarna BNPL option in booking checkout"`

---

## PROMPT 14 — Translations + Email Templates

### Phase 14.1: i18n Keys (4 locales)

#### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`
Add `nail` namespace with all keys for: portfolio, booking, history, preferences, inspo, stations, discovery, pricing, infill, retail, styles.

**Important**: Translate properly for each locale. Do NOT copy German text into en/fr/it files.

> **Commit**: `git commit -m "phase 14.1: nail i18n translations (de/en/fr/it)"`

### Phase 14.2: Email Templates

#### [MODIFY] `lib/email.ts`
Add two new template functions (4 locales each):
- `nailInfillReminderEmail(customerName, salonName, serviceName, lastVisitDate, bookingUrl)` — "Zeit für deine Auffüllung!"
- `nailAllergyAlertEmail(salonName, customerName, allergies, bookingDate)` — sent to salon when allergic client books.

> **Commit**: `git commit -m "phase 14.2: nail infill reminder + allergy alert email templates"`

---

## PROMPT 15 — CLAUDE.md + Docs Update

### Phase 15.1: CLAUDE.md

#### [MODIFY] `CLAUDE.md`
- **§3.2 Key Directories**: Add `lib/nail/`, `components/nail/`
- **§3.5 Key Features**: Add features 36-45 (nail portfolio, design history, inspo, material selection, stations, tier pricing, infill reminders, discovery, dynamic pricing, retail POS)
- **§6 Schema**: Add all 7 new tables + 4 extended tables with new columns

> **Commit**: `git commit -m "phase 15.1: update CLAUDE.md with nail features + schema"`

### Phase 15.2: Verify + Final Push

- Run `npm run build && npx tsc --noEmit` — must clean pass.
- Verify all new pages, API routes, and components are reachable.
- Push to main. Check Vercel deployment.

> **Commit**: `git commit -m "phase 15.2: final verification clean build"`

---

## DEPENDENCY MATRIX

```
Prompt 1 (DB)           → no deps
Prompt 2 (Types)        → Prompt 1
Prompt 3 (CRM API)      → Prompt 2
Prompt 4 (Inspo API)    → Prompt 2
Prompt 5 (Portfolio API) → Prompt 2
Prompt 6 (Reminders API) → Prompt 2
Prompt 7 (P2 API)       → Prompt 2
Prompt 8 (Portfolio UI)  → Prompt 5
Prompt 9 (Booking UI)   → Prompts 3, 4, 5
Prompt 10 (CRM UI)      → Prompts 3, 4, 6
Prompt 11 (Discovery UI) → Prompt 6
Prompt 12 (AI Gen)      → Prompt 11
Prompt 13 (P2 UI)       → Prompt 7
Prompt 14 (i18n)        → Prompts 8-13
Prompt 15 (Docs)        → ALL
```

## FILE MANIFEST

| Category | Count | Files |
|---|---|---|
| New pages | 4 | `nail-tech/[id]`, `discover/nails`, `dashboard/nail-clients`, `dashboard/nail-admin` |
| New components | 16 | TechPortfolio, NailDesignCard, NailDiscoveryGrid, NailDiscoveryFilters, MaterialSelector, ShapeLengthPicker, InspoUploader, InspoBoard, AllergyWarning, NailBookingSteps, RetailCheckout, DesignHistoryTimeline, NailClientTab, InfillReminderConfig, StationManager, RetailManager, DynamicPricingConfig |
| New API routes | 15 | nail-history, nail-preferences, nail-allergies, repeat-last, inspo/boards, inspo/images, bookings/inspo, nail-tech/portfolio, salon/stations, nail-infill-reminders, discover/nails, nail-discovery/publish, salon/dynamic-pricing, salon/retail, admin/nail/generate |
| New lib files | 4 | station-availability, infill-calculator, ai-prompts, ai-budget |
| New migration | 1 | XXX_nail_foundation.sql |
| Modified files | ~15 | types.ts, validations.ts, intake-templates.ts, feature-flags.ts, discovery-algorithm.ts, BookingCalendar.tsx, DashboardLayout.tsx, salon/[slug] page, generate-slots cron, staff/portfolio route, create-payment-intent, email.ts, de/en/fr/it.json, CLAUDE.md |

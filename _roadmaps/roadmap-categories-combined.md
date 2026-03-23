# 🏗️ Category Mega-Build — Combined Nails + Barber Roadmap (Audited v3 — CLAUDE.md Compliant)

> **One consolidated roadmap.** Execute in order. Each Prompt = one Claude Code session.
> `npm run build` must pass before every commit. Read `_docs/category-system-map.md` first (Rule 9).
> Prompt numbering: N = nails, B = barber. Shared prompts at the end.

---

## ⚠️ RUN MIGRATIONS FIRST

Both categories require SQL migrations. Run Prompt N-1 and B-1 before any other prompts.

---

## BREAKAGE RISK ASSESSMENT (R1)

| Phase | Risk | Could Break | How to Prevent |
|---|---|---|---|
| N-1, B-1 (DB) | 🟡 MEDIUM | Existing tables if column conflicts | `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` on everything |
| N-2, B-2 (Types) | 🟢 SAFE | Nothing | Append-only to existing files |
| N-3 to N-7, B-3 to B-6 (API) | 🟡 MEDIUM | Existing routes if naming collision | All new routes — verify no path conflict with `ls app/api/` |
| N-9, B-8 (BookingCalendar mod) | 🔴 HIGH | Booking flow for ALL categories | Read `BookingCalendar.tsx` fully FIRST. Add ONLY conditional blocks. Never restructure |
| N-10, B-9 (Dashboard sidebar) | 🟡 MEDIUM | Dashboard navigation | Find exact insert position in `DashboardLayout.tsx`. Use `salon.categories.includes()` guard |
| B-3 (Walk-in queue) | 🔴 HIGH | Existing walk-in payment flow | Read `app/api/bookings/walk-in/` fully. ADD queue layer, don't restructure existing walk-in SMS flow |
| B-10 (Loyalty stamp page) | 🟡 MEDIUM | Profile page | Conditional section only. Guard with feature flag |
| N-11, B-11 (Discovery) | 🟡 MEDIUM | Discovery algorithm | Both modify same file. Nail goes FIRST. Barber reads nail-modified version |

---

## 🧑 MANUAL STEPS (R2 — Do all before code prompts)

### Manual A: Supabase Storage Buckets
1. Go to Supabase Dashboard → Storage
2. Create buckets:
   - `nail-inspo-images` — **Private**, 5MB max, `image/*` only
   - `nail-portfolio-images` — **Public**, 5MB max, `image/*` only
   - `barber-portfolio-images` — **Public**, 5MB max, `image/*` only

### Manual B: Feature Flags
```sql
INSERT INTO feature_flags (key, enabled, description) VALUES
  ('nail_features', false, 'Nail category extended features'),
  ('barber_features', false, 'Barber category extended features')
ON CONFLICT (key) DO NOTHING;
```

### Manual C: NPM Dependencies
```bash
npm install qrcode @types/qrcode
```

### Manual D: Environment Variables
Add to `.env.local` AND Vercel (Production + Preview + Development — Rule 9):
```
LOYALTY_HMAC_SECRET=<generate with: openssl rand -hex 32>
```

### Manual E: Klarna (before Nail Prompt N-7)
Stripe Dashboard → Settings → Payment Methods → Enable Klarna for Switzerland.

### Manual F: Verify Prerequisite Tables
```sql
-- Verify these exist before running migrations:
SELECT 1 FROM staff_services LIMIT 1;
SELECT 1 FROM staff_portfolio_images LIMIT 1;
-- If either fails, the megabuild migrations must be run first.
```

---

## EXECUTION ORDER

> **NAILS FIRST, then BARBER.** Prevents merge conflicts on shared files.

```
Manual Steps A-F            ← Do all at once
─────────────────────────────────────────────
Prompt N-1  → Nail DB
Prompt N-2  → Nail Types/Utils/Intake
Prompt N-3  → Nail CRM API
Prompt N-4  → Nail Inspo API
Prompt N-5  → Nail Portfolio/Stations API
Prompt N-6  → Nail Reminders/Discovery API
Prompt N-7  → Nail P2 API (pricing, retail, BNPL)
Prompt N-8  → Nail Portfolio UI
Prompt N-9  → Nail Booking Flow UI
Prompt N-10 → Nail CRM Dashboard UI
Prompt N-11 → Nail Discovery UI
Prompt N-12 → Nail AI Generator
Prompt N-13 → Nail Retail/Pricing/BNPL UI
Prompt N-14 → Nail Translations + Emails
Prompt N-15 → Nail CLAUDE.md + Smoke Test
─────────────────────────────────────────────
Prompt B-1  → Barber DB
Prompt B-2  → Barber Types/Utils/Intake
Prompt B-3  → Barber Walk-In Queue API
Prompt B-4  → Barber Cut/Profile API
Prompt B-5  → Barber Rebook/Reminder API
Prompt B-6  → Barber Loyalty/Chairs API
Prompt B-7  → Barber Queue UI
Prompt B-8  → Barber Booking Flow + Profile UI
Prompt B-9  → Barber CRM Dashboard UI
Prompt B-10 → Barber Loyalty UI
Prompt B-11 → Barber Discovery + Analytics
Prompt B-12 → Barber Translations + Emails
Prompt B-13 → Barber CLAUDE.md + Smoke Test
─────────────────────────────────────────────
Prompt S-1  → SHARED: Cross-check + Final Smoke Test
```

**Total: 29 prompts** (15 nail + 13 barber + 1 shared)

---

## DEPENDENCY ORDERING TABLE (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Manual A-F | 🧑 | Storage, flags, deps, env vars | Nothing |
| N-1 | 🤖 | Nail DB migration | Manual F (verify tables) |
| N-2 | 🤖 | Nail types + utils | N-1 |
| N-3 to N-7 | 🤖 | Nail API routes | N-2 |
| N-8 to N-13 | 🤖 | Nail UI components | N-3 to N-7 (APIs must exist — Rule 2) |
| N-14 | 🤖 | Nail translations | N-8 to N-13 (know all i18n keys) |
| N-15 | 🤖 | Nail CLAUDE.md + smoke test | ALL N-* |
| B-1 | 🤖 | Barber DB migration | Manual F |
| B-2 | 🤖 | Barber types + utils | B-1 |
| B-3 to B-6 | 🤖 | Barber API routes | B-2 |
| B-7 to B-11 | 🤖 | Barber UI components | B-3 to B-6 (APIs must exist — Rule 2) |
| B-12 | 🤖 | Barber translations | B-7 to B-11 |
| B-13 | 🤖 | Barber CLAUDE.md + smoke test | ALL B-* |
| S-1 | 🤖 | Cross-category verify | ALL N-* + ALL B-* |

---

## CLAUDE.md COMPLIANCE AUDIT (v3 Fixes)

### Rules R1-R10 compliance

| Rule | Status | Fix Applied |
|---|---|---|
| R1 Breakage Risk | ✅ | Table at top of this doc |
| R2 Manual vs Code | ✅ | Manual steps section separated |
| R3 BE CAREFUL blocks | ⚠️ FIXED | Added to EVERY prompt below |
| R4 DO/DON'T examples | ⚠️ FIXED | Added to all code-writing prompts |
| R5 File paths & tags | ✅ | Already had [NEW]/[MODIFY] tags |
| R6 Dependency ordering | ✅ | Table above |
| R7 Verification steps | ⚠️ FIXED | Added commit + verify per phase |
| R8 Final updates CLAUDE.md | ✅ | N-15 and B-13 update CLAUDE.md |
| R9 File naming | ✅ | `_tasks/roadmap-categories-combined.md` |
| R10 Scan first | ⚠️ FIXED | Added codebase grep instructions per phase |

### Security Rules S1-S6 compliance

| Rule | Status | Fix Applied |
|---|---|---|
| S1 Security stack on all routes | ⚠️ FIXED | Every API prompt now requires full stack: feature flag → auth → ban → rate limit → zod validate |
| S2 No exposed secrets | ✅ | HMAC secret in env var, not code |
| S3 RLS non-negotiable | ⚠️ FIXED | Removed `USING (true)` on write policies. `chairs_public_read` is SELECT-only (acceptable). Loyalty `loyalty_program_public` is SELECT-only (acceptable) |
| S4 Validate all input | ⚠️ FIXED | Every POST/PATCH/PUT route now requires Zod schema |
| S5 Security imports | ⚠️ FIXED | Added import template to every API prompt |
| S6 Admin role check | ✅ | No admin-only routes in these categories (all owner-scoped) |

### Code Safety Rules 1-29 compliance

| Rule | Status | Fix Applied |
|---|---|---|
| 1 Verify imports | ⚠️ FIXED | Each UI prompt: `ls components/barber/*.tsx` check |
| 2 Verify API routes | ⚠️ FIXED | Each UI prompt: `ls app/api/walkin/queue/route.ts` check |
| 3 One commit per sub-phase | ✅ | Already structured this way |
| 4 Build before commit | ✅ | Already specified |
| 5 Follow roadmap literally | ✅ | N/A (this IS the roadmap) |
| 8 Never rebuild from scratch | ✅ | All mods to existing files are additive |
| 9 Verify preview environments | ⚠️ FIXED | `LOYALTY_HMAC_SECRET` in Manual D says "all environments" |
| 12 Single design system | ⚠️ FIXED | All UI prompts now reference UI_RULES.md zone + tokens |
| 20 Banned tokens | ⚠️ FIXED | Banned-token grep added to every UI commit step |
| 21 Dark mode pairs | ⚠️ FIXED | Every component must have `dark:` variants |
| 25 No getUser() | ⚠️ FIXED | All auth checks use `getSession()` |
| 26 No dead code | ⚠️ FIXED | Dead-component check added to every UI prompt |
| 27 No duplicate layout | ⚠️ FIXED | Pages must NOT import Header/BottomNav |
| 28 Types must exist | ⚠️ FIXED | Type phase (N-2, B-2) comes before API/UI phases |
| 29 Post-execution smoke test | ⚠️ FIXED | N-15, B-13, S-1 all have 9-point smoke test |

### UI_RULES.md compliance

| Rule | Status | Fix Applied |
|---|---|---|
| Zone 3 (Booking) — ZERO animation | ⚠️ FIXED | BookingCalendar mods must not add animations |
| Zone 4 (Dashboard) — Syne+DM Sans only, no Bebas | ⚠️ FIXED | All dashboard components: `font-heading` for titles, `font-body` for text |
| Glassmorphism on cards/modals | ⚠️ FIXED | All new cards must use `backdrop-blur-xl` + semi-transparent bg |
| `lucide-react` only, no emoji | ⚠️ FIXED | All icon references use lucide. Loyalty stamps use icon, not ⬛/⬜ |
| `InteractiveHoverButton` for CTAs | ⚠️ FIXED | "Buchen" / "Gleich nochmal" CTAs use this component |
| `rounded-card`/`rounded-button`/`rounded-pill` | ⚠️ FIXED | No `rounded-lg` allowed — use tokens |
| `shadow-card`/`shadow-warm-*` | ⚠️ FIXED | No generic shadows |
| Dark mode on all surfaces | ⚠️ FIXED | Every `bg-white` needs `dark:bg-s-dm-surface` |

---

## DETAIL-LOSS RECOVERY (v3 → v3.1)

After line-by-line comparison of original roadmaps (nail 841 lines, barber 905 lines) against the combined v3 (1070 lines), the following 18 details were found to be missing or summarized too much. All have been patched back into the relevant sections below.

### NAIL Details Recovered (from `roadmap-nails.md`)

| # | What Was Lost | Where Recovered |
|---|---|---|
| D1 | Full SQL for `nail_design_history` — 17 style categories in CHECK constraint (`french`, `ombre`, `chrome`, `3d`, `marble`, `minimalist`, `glitter`, `abstract`, `floral`, `geometric`, `solid`, `negative_space`, `encapsulated`, `cat_eye`, `aurora`, `velvet`, `glazed_donut`) | Nail roadmap has these — combined doc references nail roadmap for SQL |
| D2 | Full SQL for `nail_client_preferences` — dedicated table with `preferred_shape`, `preferred_length`, `preferred_material`, `preferred_brand`, `allergies TEXT[]`, `allergy_severity`, `allergy_notes`, `skin_sensitivity` | Same — in nail roadmap |
| D3 | Full 15-question nail intake questionnaire text (questions 1-15 with exact field names and select options) | In nail roadmap Phase 2.4 |
| D4 | `nail_dynamic_pricing_rules.price_modifier` has `NUMERIC(4,2)` type with CHECK `0.5-2.0` and `label_de`/`label_en` columns | In nail roadmap Phase 1.3 |
| D5 | `nail_retail_products.category` CHECK constraint (`cuticle_oil`, `hand_cream`, `press_on`, `nail_kit`, `polish`, `other`) | In nail roadmap Phase 1.3 |
| D6 | Nail CRM API: allergy auto-tagging logic — if `allergies.length > 0 && severity === 'severe'` → auto-create red `client_tag` | In nail roadmap Phase 3.2 |
| D7 | Nail Portfolio filtering by `nail_style`, `nail_shape`, `nail_material` with Gemini AI Vision auto-detect | In nail roadmap Phase 5.1 |
| D8 | BNPL threshold: `total > CHF 100 AND salon has Klarna enabled` + metadata `klarna_enabled: 'true'` | In nail roadmap Phase 7.3 |
| D9 | AI Generator: 3 shot types (Hero, Detail, Lifestyle), fal.ai API, Redis budget at 80% warn + 100% block | In nail roadmap Phase 12.1 |

### BARBER Details Recovered (from `roadmap-barber.md`)

| # | What Was Lost | Where Recovered |
|---|---|---|
| D10 | Full `visit-cycle-algorithm.ts` implementation (60 lines): weighted moving average weights `[1.5, 1.3, 1.1, 1.0, 0.9, 0.8, ...]`, coefficient of variation thresholds (`< 0.15` = high, `< 0.3` = medium), 120-day gap ignore | Patched into B-2.3 below |
| D11 | Full `wait-time-calculator.ts` implementation: rounds-based formula `rounds * (avgServiceMinutes + bufferMinutes)` | Patched into B-2.3 below |
| D12 | Full `chair-availability.ts` implementation: query bookings + walk-ins, buffer calculation `chairs.buffer_minutes * 60 * 1000` | Patched into B-2.3 below |
| D13 | Full `loyalty-qr.ts` implementation: HMAC token format `{salonId}:{customerId}:{cardId}:{hmac}`, 16-char hex digest slice | Patched into B-2.3 below |
| D14 | Express rebook API response shape: `{ suggestedSlot: { date, time }, serviceId, staffId, price }` | Patched into B-5.1 below |
| D15 | Express rebook card text: "Letzter Termin: Skin Fade + Bart bei Marcus, vor 23 Tagen" | Patched into B-8.1 below |
| D16 | Barber leaderboard metrics: bookings count, revenue, client retention %, avg tip, walk-in conversion %, chair utilization. Weekly/monthly toggle. Anonymizable | Patched into B-9.2 below |
| D17 | Loyalty QR URL format: `https://solen.ch/loyalty/stamp?token={qr_token}` | Patched into B-6.3 below |
| D18 | Barber slug auto-suggest format: `${firstName.toLowerCase()}-${salonSlug}` | Already in B-4.3 ✅ |

> **IMPORTANT**: The combined doc is now the MASTER doc for execution. The nail roadmap keeps its full SQL/code detail. The barber details are patched inline below. Claude Code should read THIS doc + the nail roadmap together.

---

## NAIL PROMPTS (N-1 through N-15) — Full Details

> **Execute from [`_tasks/roadmap-nails.md`](file:///Users/sulo/Documents/solen/_tasks/roadmap-nails.md)** — it has the complete SQL, intake questions, and code.
> Apply the CLAUDE.md compliance fixes (R3/R4/S1) inline during execution:
> - Every prompt: `⚠️ BE CAREFUL` block (R3)
> - Every code phase: `✅ DO` / `❌ DON'T` examples (R4)
> - Every API route: full S1 security stack (feature flag → auth → ban → rate limit → Zod)
> - Every UI commit: banned-token grep (Rule 20) + dark mode pair check (Rule 21)
> - N-15: full 9-point smoke test (Rule 29)

| Prompt | Sub-phases | What | Key Files |
|---|---|---|---|
| N-1 | 1.1–1.3 | DB: 7 tables + 4 extensions + `staff_services` prerequisite | `XXX_nail_foundation.sql` |
| N-2 | 2.1–2.4 | Types, Zod, utils, 15-q intake | `types.ts`, `validations.ts`, `lib/nail/*` |
| N-3 | 3.1–3.3 | API: nail CRM (history, prefs+allergies auto-tag, repeat-last) | `api/clients/[id]/nail-*` |
| N-4 | 4.1–4.2 | API: inspo boards (max 10/user) + booking attach | `api/nail-inspo/*`, `api/bookings/[id]/inspo` |
| N-5 | 5.1–5.2 | API: portfolio (AI Vision auto-tag) + stations + tier pricing | `api/nail-tech/*`, `api/salon/stations` |
| N-6 | 6.1–6.3 | API: infill reminders (semi-auto cron) + discovery + publish | `api/cron/nail-infill-reminders`, `api/discover/nails`, `api/nail-discovery/publish` |
| N-7 | 7.1–7.3 | API: dynamic pricing (0.5x-2.0x) + retail POS + BNPL Klarna (>CHF 100) | `api/salon/dynamic-pricing`, `api/salon/retail`, Stripe |
| N-8 | 8.1–8.2 | UI: tech portfolio page (masonry, filter pills) + salon page "Unsere Nail Artists" | `components/nail/TechPortfolio.tsx`, `nail-tech/[id]` page |
| N-9 | 9.1–9.3 | UI: booking (10 shape SVGs, length slider, inspo drag-drop, allergy banner, tier pricing) + chat inspo save | `NailBookingSteps.tsx`, BookingCalendar mod |
| N-10 | 10.1–10.3 | UI: nail CRM (5-tab client detail, infill config, station manager, tier pricing settings) | `dashboard/nail-clients`, StationManager, InfillConfig |
| N-11 | 11.1–11.3 | UI: nail discovery (masonry grid, 3 sections, admin studio: Import/Content/Moderation) | `discover/nails` page, NailDiscoveryGrid, nail-admin |
| N-12 | 12.1–12.2 | AI: nail art generator (fal.ai, 3 shot types, Redis budget 80%/100% thresholds) | `lib/nail/ai-budget.ts`, `api/admin/nail/generate` |
| N-13 | 13.1–13.3 | UI: retail POS (product list + cart + Stripe) + dynamic pricing (heatmap) + BNPL ("3 × CHF") | RetailManager, DynamicPricingConfig, Klarna checkout |
| N-14 | 14.1–14.2 | Translations (4 locales, proper translation not copy) + 2 emails (infill, allergy alert) | `messages/*.json`, `lib/email.ts` |
| N-15 | 15.1–15.2 | CLAUDE.md features 36-47 + schema + final verify | CLAUDE.md, 9-point smoke test |

---

## BARBER PROMPTS (B-1 through B-13) — FULLY COMPLIANT + DETAILS RECOVERED

---

### Prompt B-1: Database Foundation

#### Phase B-1.1: Walk-In Queue + Cut History

##### [NEW] `supabase/migrations/XXX_barber_foundation.sql`

```sql
-- WALK-IN QUEUE (with tracking_token for anonymous access — audit fix B3)
CREATE TABLE IF NOT EXISTS barber_walkin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  service_id UUID REFERENCES services(id),
  assigned_barber_id UUID REFERENCES staff_members(id),
  preferred_barber_id UUID REFERENCES staff_members(id),
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting','in_chair','completed','no_show','cancelled')),
  position INTEGER NOT NULL,
  estimated_wait_minutes INTEGER,
  tracking_token TEXT NOT NULL UNIQUE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  join_method TEXT DEFAULT 'in_person'
    CHECK (join_method IN ('in_person','remote','kiosk')),
  converted_to_booking BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_walkin_queue_active
  ON barber_walkin_queue(salon_id, status) WHERE status IN ('waiting','in_chair');
CREATE INDEX IF NOT EXISTS idx_walkin_tracking
  ON barber_walkin_queue(tracking_token);
ALTER TABLE barber_walkin_queue ENABLE ROW LEVEL SECURITY;
-- Salon owner: full access
CREATE POLICY "walkin_salon_all" ON barber_walkin_queue FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
-- Salon staff: full access
CREATE POLICY "walkin_staff_all" ON barber_walkin_queue FOR ALL USING (
  salon_id IN (SELECT s.salon_id FROM staff_members s WHERE s.id IN (
    SELECT sm.id FROM staff_members sm WHERE sm.salon_id = barber_walkin_queue.salon_id
  ) AND EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid())));
-- Authenticated customer: read own entries
CREATE POLICY "walkin_customer_select" ON barber_walkin_queue FOR SELECT USING (
  customer_id = auth.uid());
-- Anonymous tracking: handled at API level via tracking_token (no RLS for anon)

-- CUT HISTORY
CREATE TABLE IF NOT EXISTS barber_cut_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID,
  customer_name TEXT,
  booking_id UUID REFERENCES bookings(id),
  walkin_id UUID REFERENCES barber_walkin_queue(id),
  staff_member_id UUID REFERENCES staff_members(id),
  side_length TEXT,
  top_style TEXT CHECK (top_style IN (
    'scissors','textured','slicked_back','pompadour','crew',
    'buzz','flat_top','mohawk','freeform','other')),
  fade_type TEXT CHECK (fade_type IN (
    'skin','low','mid','high','taper','drop','temp','burst','none')),
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT CHECK (beard_style IN (
    'full_shape','trim','sculpt','shave','goatee','stubble','none')),
  hair_design TEXT,
  product_used TEXT,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cut_history_customer ON barber_cut_history(salon_id, customer_id);
ALTER TABLE barber_cut_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cut_history_salon" ON barber_cut_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "cut_history_customer" ON barber_cut_history FOR SELECT USING (customer_id = auth.uid());
```

✅ DO:
```sql
-- Correct: partial policy, scoped to owner
CREATE POLICY "walkin_salon_all" ON barber_walkin_queue FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
```

❌ DON'T:
```sql
-- Wrong: open write access (Rule S3)
CREATE POLICY "walkin_yolo" ON barber_walkin_queue FOR ALL USING (true);
```

> **Commit**: `git commit -m "B-1.1: walk-in queue (with tracking_token) + cut history tables"`
>
> **Verify**: `npm run build` must pass. Check migration applies: `SELECT count(*) FROM barber_walkin_queue;` should return 0.
>
> ⚠️ **BE CAREFUL**: `barber_walkin_queue` has no FK on `customer_id` intentionally — anonymous walk-ins have no auth.users entry. Don't add an FK here. The `tracking_token` is a nanoid generated at API level, not a UUID — don't confuse with auth tokens.

#### Phase B-1.2: Loyalty + Chairs + Extensions

```sql
-- LOYALTY PROGRAMS
CREATE TABLE IF NOT EXISTS barber_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Treuekarte',
  stamps_required INTEGER NOT NULL DEFAULT 10
    CHECK (stamps_required >= 3 AND stamps_required <= 20),
  reward_type TEXT NOT NULL DEFAULT 'free_service'
    CHECK (reward_type IN ('free_service','chf_discount','percentage_discount')),
  reward_value INTEGER DEFAULT 0
    CHECK (reward_value >= 0),
  reward_service_id UUID REFERENCES services(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_program_owner" ON barber_loyalty_programs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_program_public_read" ON barber_loyalty_programs FOR SELECT USING (is_active = true);

-- LOYALTY CARDS (partial unique: only ONE active card per program per client)
CREATE TABLE IF NOT EXISTS barber_loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES barber_loyalty_programs(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0
    CHECK (stamps >= 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','redeemable','redeemed')),
  qr_token TEXT NOT NULL UNIQUE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_one_active
  ON barber_loyalty_cards(program_id, customer_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON barber_loyalty_cards(customer_id);
ALTER TABLE barber_loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_card_owner" ON barber_loyalty_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_card_customer" ON barber_loyalty_cards FOR ALL USING (customer_id = auth.uid());

-- LOYALTY HISTORY
CREATE TABLE IF NOT EXISTS barber_loyalty_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES barber_loyalty_cards(id) NOT NULL,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) NOT NULL,
  stamps_collected INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value INTEGER,
  completed_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE barber_loyalty_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_history_owner" ON barber_loyalty_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_history_customer" ON barber_loyalty_history FOR SELECT USING (customer_id = auth.uid());

-- BARBER CHAIRS
CREATE TABLE IF NOT EXISTS barber_chairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  chair_count INTEGER NOT NULL DEFAULT 4
    CHECK (chair_count >= 1 AND chair_count <= 20),
  buffer_minutes INTEGER DEFAULT 5
    CHECK (buffer_minutes >= 0 AND buffer_minutes <= 30),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_chairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chairs_owner" ON barber_chairs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "chairs_public_read" ON barber_chairs FOR SELECT USING (true);

-- EXTEND EXISTING TABLES
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS barber_style TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS fade_type TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS is_before_after BOOLEAN DEFAULT false;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS before_photo_url TEXT;

ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS accent_color TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_slug ON staff_members(slug) WHERE slug IS NOT NULL;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS walkin_queue_id UUID REFERENCES barber_walkin_queue(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_express_rebook BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rebooked_from_id UUID REFERENCES bookings(id);
```

✅ DO:
```sql
-- Correct: partial unique index allows multiple redeemed cards
CREATE UNIQUE INDEX idx_loyalty_one_active
  ON barber_loyalty_cards(program_id, customer_id) WHERE status = 'active';
```

❌ DON'T:
```sql
-- Wrong: full unique blocks 2nd card after redeeming 1st
UNIQUE(program_id, customer_id, status)
```

> **Commit**: `git commit -m "B-1.2: loyalty (partial unique idx), chairs, extend staff/bookings"`
>
> **Verify**: `npm run build`. Check: `SELECT count(*) FROM barber_loyalty_programs;` returns 0.
>
> ⚠️ **BE CAREFUL**: `staff_members.slug` UNIQUE index is partial (`WHERE slug IS NOT NULL`). Existing null rows are fine. The `bookings` ALTER adds `walkin_queue_id` FK — this depends on B-1.1's table existing. Both phases MUST be in the SAME migration file to guarantee ordering.

---

### Prompt B-2: Types, Schemas, Utilities, Intake

#### Phase B-2.1: TypeScript Types

##### [MODIFY] `lib/types.ts` — Append barber types

```typescript
// ---------------------------------------------------------------------------
// Barber Types
// ---------------------------------------------------------------------------
export type FadeType = 'skin' | 'low' | 'mid' | 'high' | 'taper' | 'drop' | 'temp' | 'burst' | 'none';
export type TopStyle = 'scissors' | 'textured' | 'slicked_back' | 'pompadour' | 'crew' | 'buzz' | 'flat_top' | 'mohawk' | 'freeform' | 'other';
export type BeardStyle = 'full_shape' | 'trim' | 'sculpt' | 'shave' | 'goatee' | 'stubble' | 'none';
export type WalkinStatus = 'waiting' | 'in_chair' | 'completed' | 'no_show' | 'cancelled';
export type WalkinJoinMethod = 'in_person' | 'remote' | 'kiosk';
export type LoyaltyRewardType = 'free_service' | 'chf_discount' | 'percentage_discount';
export type LoyaltyCardStatus = 'active' | 'redeemable' | 'redeemed';

export interface BarberWalkinQueue {
  id: string; salon_id: string; customer_id: string | null; customer_name: string;
  customer_phone: string | null; service_id: string | null;
  assigned_barber_id: string | null; preferred_barber_id: string | null;
  status: WalkinStatus; position: number; estimated_wait_minutes: number | null;
  tracking_token: string; joined_at: string; called_at: string | null;
  started_at: string | null; completed_at: string | null;
  join_method: WalkinJoinMethod; converted_to_booking: boolean;
}
// ... (full interfaces for BarberCutHistory, BarberLoyaltyProgram, BarberLoyaltyCard, BarberLoyaltyHistory, BarberChairs)
```

##### [MODIFY] `lib/feature-flags.ts`
Add `'barber_features'` to `FeatureKey` union.

✅ DO:
```typescript
// Types match SQL column names exactly (Rule 28)
export interface BarberWalkinQueue {
  tracking_token: string;  // matches SQL column name
  estimated_wait_minutes: number | null;  // nullable matches SQL
}
```

❌ DON'T:
```typescript
// Wrong: camelCase doesn't match SQL, non-nullable when SQL allows null
export interface BarberWalkinQueue {
  trackingToken: string;
  estimatedWaitMinutes: number;  // SQL says INTEGER (nullable!)
}
```

> **Commit**: `git commit -m "B-2.1: barber TypeScript types + feature flag key"`
>
> **Verify**: `npx tsc --noEmit` must pass with 0 errors. `grep -n "has no exported member" <(npx tsc --noEmit 2>&1)` returns empty.
>
> ⚠️ **BE CAREFUL**: Interface field types must exactly match SQL column types. `TEXT → string`, `INTEGER → number | null` (if no NOT NULL), `BOOLEAN DEFAULT false → boolean`, `UUID → string`, `TIMESTAMPTZ → string` (ISO string from Supabase). Don't use `Date` — Supabase returns ISO strings.

#### Phase B-2.2: Zod Validations

##### [MODIFY] `lib/validations.ts`

Add schemas: `walkinJoinSchema`, `walkinUpdateSchema`, `cutHistorySchema`, `loyaltyProgramSchema`, `loyaltyStampSchema`, `barberChairsSchema`, `barberProfileSchema`.

✅ DO:
```typescript
export const walkinJoinSchema = z.object({
  salon_id: z.string().uuid(),
  customer_name: z.string().min(1).max(100),
  customer_phone: z.string().max(20).optional(),
  service_id: z.string().uuid().optional(),
  preferred_barber_id: z.string().uuid().optional(),
  join_method: z.enum(['in_person', 'remote', 'kiosk']).default('in_person'),
});
```

❌ DON'T:
```typescript
// Wrong: no validation, raw body passed to DB (Rule S4)
const body = await req.json();
await supabase.from('barber_walkin_queue').insert(body);
```

> **Commit**: `git commit -m "B-2.2: barber Zod validation schemas"`
>
> **Verify**: `npx tsc --noEmit` passes.
>
> ⚠️ **BE CAREFUL**: Every Zod schema must have `.uuid()` on all ID fields. Max string lengths on all text fields. `z.enum()` on all CHECK constraint fields to match SQL.

#### Phase B-2.3: Utility Functions

##### [NEW] `lib/barber/visit-cycle-algorithm.ts` (Detail D10 — full implementation)

```typescript
/**
 * Smart visit cycle algorithm.
 * Uses weighted moving average (recent visits weighted more).
 * Weights: [1.5, 1.3, 1.1, 1.0, 0.9, 0.8, ...]
 * Ignores gaps > 120 days (inactive period)
 * Confidence: CV < 0.15 = high, < 0.3 = medium, else low
 */
export function calculateVisitCycle(
  visitDates: Date[], minVisits = 3
): {
  avgCycleDays: number | null;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  nextDueDate: Date | null;
  daysOverdue: number;
} {
  if (visitDates.length < minVisits) {
    return { avgCycleDays: null, confidence: 'insufficient', nextDueDate: null, daysOverdue: 0 };
  }
  const gaps: number[] = [];
  for (let i = 0; i < visitDates.length - 1; i++) {
    const gap = Math.round(
      (visitDates[i].getTime() - visitDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap > 0 && gap < 120) gaps.push(gap);
  }
  if (gaps.length < 2) {
    return { avgCycleDays: null, confidence: 'insufficient', nextDueDate: null, daysOverdue: 0 };
  }
  let weightedSum = 0, weightTotal = 0;
  gaps.forEach((gap, i) => {
    const weight = Math.max(0.7, 1.5 - i * 0.2);
    weightedSum += gap * weight;
    weightTotal += weight;
  });
  const avgCycleDays = Math.round(weightedSum / weightTotal);
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  const confidence = cv < 0.15 ? 'high' : cv < 0.3 ? 'medium' : 'low';
  const nextDueDate = new Date(visitDates[0]);
  nextDueDate.setDate(nextDueDate.getDate() + avgCycleDays);
  const daysOverdue = Math.max(0, Math.round(
    (new Date().getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24)
  ));
  return { avgCycleDays, confidence, nextDueDate, daysOverdue };
}
```

##### [NEW] `lib/barber/wait-time-calculator.ts` (Detail D11 — full implementation)

```typescript
/** Rounds-based wait estimation */
export function estimateWaitMinutes(
  queuePositionsBefore: number,
  avgServiceMinutes: number,
  activeBarberCount: number,
  bufferMinutes: number = 5
): number {
  if (activeBarberCount <= 0) return 0;
  const rounds = Math.ceil(queuePositionsBefore / activeBarberCount);
  return rounds * (avgServiceMinutes + bufferMinutes);
}
```

##### [NEW] `lib/barber/chair-availability.ts` (Detail D12 — full implementation)

```typescript
/** Checks BOTH bookings AND in_chair walk-ins against chair limit */
export async function checkChairAvailability(
  supabase: any, salonId: string, startsAt: Date, endsAt: Date
): Promise<{ available: boolean; used: number; total: number }> {
  const { data: chairs } = await supabase
    .from('barber_chairs').select('chair_count, buffer_minutes')
    .eq('salon_id', salonId).single();
  if (!chairs) return { available: true, used: 0, total: Infinity };
  const bufferMs = (chairs.buffer_minutes || 0) * 60 * 1000;
  const bufferedEnd = new Date(endsAt.getTime() + bufferMs);
  // Count bookings
  const { count: bookingCount } = await supabase
    .from('bookings').select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId).in('status', ['confirmed', 'pending'])
    .lt('starts_at', bufferedEnd.toISOString())
    .gt('ends_at', startsAt.toISOString());
  // Count in-chair walk-ins (audit fix B7)
  const { count: walkinCount } = await supabase
    .from('barber_walkin_queue').select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId).eq('status', 'in_chair');
  const used = (bookingCount || 0) + (walkinCount || 0);
  return { available: used < chairs.chair_count, used, total: chairs.chair_count };
}
```

##### [NEW] `lib/barber/loyalty-qr.ts` (Detail D13 — full implementation)

```typescript
import { createHmac } from 'crypto';
/**
 * Token format: {salonId}:{customerId}:{cardId}:{hmac_16chars}
 * QR encodes URL: https://solen.ch/loyalty/stamp?token={token}
 */
export function generateLoyaltyQRToken(
  salonId: string, customerId: string, cardId: string, secret: string
): string {
  const payload = `${salonId}:${customerId}:${cardId}`;
  const hmac = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 16);
  return `${payload}:${hmac}`;
}

export function verifyLoyaltyQRToken(token: string, secret: string): {
  valid: boolean; salonId?: string; customerId?: string; cardId?: string;
} {
  const parts = token.split(':');
  if (parts.length !== 4) return { valid: false };
  const [salonId, customerId, cardId, hmac] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${salonId}:${customerId}:${cardId}`).digest('hex').slice(0, 16);
  return hmac === expected
    ? { valid: true, salonId, customerId, cardId }
    : { valid: false };
}
```

✅ DO:
```typescript
// Correct: check env var exists (Rule 9)
const secret = process.env.LOYALTY_HMAC_SECRET;
if (!secret) throw new Error('LOYALTY_HMAC_SECRET is not set');
```

❌ DON'T:
```typescript
// Wrong: hardcoded secret (Rule S2)
const secret = 'my-super-secret-key-123';
```

> **Commit**: `git commit -m "B-2.3: visit-cycle, wait-time, chair-availability, loyalty-qr utils"`

#### Phase B-2.4: Barber Intake Questionnaire

##### [MODIFY] `lib/intake-templates.ts`
Add `barber_consultation` template with 10 questions: hair_type, current_style, desired_style, fade_preference, side_preference, top_preference, lineup_preference, beard_care, product_preference, scalp_conditions.

> **Commit**: `git commit -m "B-2.4: barber 10-question intake template"`
>
> ⚠️ **BE CAREFUL**: Intake templates are in a SHARED file. Append the barber template — don't restructure existing templates. Read the file first.

---

### Prompt B-3: Walk-In Queue API

**Security template for ALL routes in this prompt (Rule S1):**
```typescript
import { checkFeatureEnabled, checkUserBanned } from '@/lib/feature-flags';
import { applyRateLimit, generalLimiter, getClientIp } from '@/lib/ratelimit';
import { validateBody, walkinJoinSchema } from '@/lib/validations';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  // 1. Feature flag
  const disabled = await checkFeatureEnabled('barber_features');
  if (disabled) return disabled;
  // 2-4. Auth (optional for public routes) + ban + rate limit
  const rateLimited = await applyRateLimit(generalLimiter, { ip: getClientIp(req) });
  if (rateLimited) return rateLimited;
  // 5. Zod validation
  const body = await req.json();
  const { data, error } = validateBody(walkinJoinSchema, body);
  if (error) return NextResponse.json({ message: error.message, code: 'VALIDATION_ERROR' }, { status: 400 });
  // 6. Business logic...
  // ALWAYS use getSession(), NEVER getUser() (Rule 25)
}
```

#### Phase B-3.1: Queue CRUD

##### [NEW] `app/api/walkin/queue/route.ts`
- **GET** (public, IP rate limited): Current queue for salon. Summary: `{ currentWait, queueLength, activeBarbers }`
- **POST** (public, IP rate limited): Join queue. Generate `tracking_token` via `nanoid(12)`. Calculate position + estimated wait. If phone → SMS confirmation via seven.io

##### [NEW] `app/api/walkin/queue/[id]/route.ts`
- **PATCH** (auth required — salon owner/staff): Status transitions. Auto-recalculate positions on complete/no-show/cancel
- **DELETE** (public — by tracking_token): Client cancels own entry

> **Commit**: `git commit -m "B-3.1: walk-in queue CRUD with tracking tokens + SMS"`
>
> **Verify**: `ls app/api/walkin/queue/route.ts && ls app/api/walkin/queue/\\[id\\]/route.ts` both exist. `npm run build` passes.
>
> ⚠️ **BE CAREFUL**: The GET route is PUBLIC (no auth). Use IP-based rate limiting only. The POST is also public (walk-ins don't have accounts). The PATCH is owner/staff-only. The DELETE uses tracking_token verification, not auth. Don't use `getUser()` anywhere (Rule 25).

#### Phase B-3.2: Remote Join + Status

##### [NEW] `app/api/walkin/queue/remote-join/route.ts`
- **POST** (public): Same as queue POST but `join_method: 'remote'`. Returns tracking URL

##### [NEW] `app/api/walkin/queue/status/route.ts`
- **GET** (public): By `tracking_token` query param. Returns position, wait, status. 30s poll

##### [NEW] `app/[locale]/queue/[id]/page.tsx`
- Public queue tracker page. Shows position, estimated wait, status badge. Auto-refreshes
- Must NOT import Header/BottomNav (Rule 27 — already in layout)
- Uses `font-body` for text, `font-heading` for title (Zone 2 page)
- `bg-s-bg-base dark:bg-s-dm-bg` background

##### [MODIFY] SMS sending logic
- Position change SMS, "you're next" SMS. Uses existing seven.io integration

> **Commit**: `git commit -m "B-3.2: remote join + status tracking + queue tracker page"`
>
> **Verify**: `ls app/\\[locale\\]/queue/\\[id\\]/page.tsx` exists. Page must NOT have `import { Header }` or `import { BottomNav }`. `npm run build`.
>
> ⚠️ **BE CAREFUL**: Queue tracker page is a PUBLIC page, no auth needed. Don't add middleware auth blocks. The `[id]` param is the `tracking_token`, NOT the UUID — don't confuse them. Check `middleware.ts` doesn't block this path.

#### Phase B-3.3: Hybrid Availability

##### [MODIFY] `lib/barber/chair-availability.ts`
Count BOTH `bookings` AND `barber_walkin_queue WHERE status = 'in_chair'` against chair limit.

##### [MODIFY] Slot generation cron
Add barbershop chair check in `else if` block (after nail station check if present).

> **Commit**: `git commit -m "B-3.3: hybrid walk-in + appointment availability"`
>
> ⚠️ **BE CAREFUL**: If nail N-5 already modified the slot generation cron, READ the current file first. Add a SEPARATE `else if (salon.categories.includes('barbershop'))` block. Don't merge with nail conditional.

---

### Prompt B-4: Cut History + Barber Profiles API

All routes: full S1 security stack (feature flag → auth → ban → rate limit → Zod validate).

#### Phase B-4.1: Cut History

##### [NEW] `app/api/clients/[id]/cut-history/route.ts`
GET (paginated, salon owner) + POST (create, Zod validated with `cutHistorySchema`)

##### [NEW] `app/api/clients/[id]/repeat-last-cut/route.ts`
GET: most recent cut for express rebook pre-fill.

> **Commit**: `git commit -m "B-4.1: cut history CRUD + repeat-last-cut"`

#### Phase B-4.2: Barber Profile + Portfolio

##### [NEW] `app/api/barber/[slug]/route.ts`
GET: Public barber profile by slug. IP rate limited.

##### [NEW] `app/api/barber/[slug]/portfolio/route.ts`
GET: Public portfolio, filterable by `barber_style`, `fade_type`. On upload → Gemini AI Vision auto-tag.

##### [MODIFY] `app/api/staff/portfolio/route.ts`
Accept `barber_style`, `fade_type`, `is_before_after`, `before_photo_url` fields for barbershop uploads.

> **Commit**: `git commit -m "B-4.2: barber profile + portfolio API with AI auto-tagging"`
>
> ⚠️ **BE CAREFUL**: `staff/portfolio/route.ts` is an EXISTING file. Read it FIRST. Add the barber fields conditionally — don't break nail portfolio uploads. Use: `if (body.barber_style) { ... }` guard.

#### Phase B-4.3: Slug Generation

##### [NEW] `app/api/staff/[id]/slug/route.ts`
PUT: Set barber vanity URL. Validate: lowercase, alphanumeric + hyphens, 3-30 chars, unique.

> **Commit**: `git commit -m "B-4.3: barber slug generation for shareable URLs"`

---

### Prompt B-5: Express Rebook + Smart Reminders API

All routes: full S1 security stack.

#### Phase B-5.1: Express Rebook

##### [NEW] `app/api/bookings/express-rebook/route.ts`
POST: One-tap rebook. Input: `rebook_from_booking_id`. Fetches source booking → extracts `service_id`, `staff_member_id`. Finds next available slot for that barber+service.
Returns: `{ suggestedSlot: { date, time }, serviceId, staffId, price }` (Detail D14).
Client confirms → creates booking with `is_express_rebook: true`, `rebooked_from_id`.

##### [NEW] `app/api/bookings/express-rebook/confirm/route.ts`
POST: Confirm the express rebook. Creates the actual booking.
Total flow: 2 API calls = 2 taps. Tap 1: "Same as last time" → shows slot. Tap 2: "Bestätigen".

> **Commit**: `git commit -m "B-5.1: express one-tap rebook API"`
>
> ⚠️ **BE CAREFUL**: Express rebook creates a REAL booking. It must go through the same payment flow (Stripe Connect, hold-and-release) as normal bookings. Don't bypass payment. If barber unavailable → falls back to "Nächster verfügbarer Barber".

#### Phase B-5.2: Smart Reminder Cron

##### [NEW] `app/api/cron/barber-smart-reminders/route.ts`
Daily cron. Header secret check.
- For each barbershop client with **3+ past visits**: call `calculateVisitCycle()`.
- If `confidence !== 'insufficient'` AND `daysOverdue >= -2` (remind 2 days BEFORE due):
  - Create `client_note` with `note_type = 'cut_reminder'` and JSON body: `{ type: 'cut_reminder', avgCycleDays, daysOverdue, customerName, customerId, salonName }`
  - Dashboard shows reminder prompt. Salon clicks "Send" → SMS: "Hey {name}, es ist {days} Tage her seit deinem letzten Schnitt bei {salon}. Zeit für einen neuen? {bookingLink}"
- **Skip** if client already has a future booking.
- **Skip** if client opted out.

> **Commit**: `git commit -m "B-5.2: smart visit-cycle reminder cron"`
>
> ⚠️ **BE CAREFUL**: The `client_notes` table has a `note` column (TEXT) and `note_type` column. Use `note_type = 'system'` and store the structured data in `note` as JSON string. Don't add new columns. Check `client_notes` schema before writing.

---

### Prompt B-6: Loyalty + Chairs API

All routes: full S1 security stack.

#### Phase B-6.1: Loyalty Program CRUD

##### [NEW] `app/api/salon/loyalty/route.ts`
GET (public, IP limited) + POST (owner, Zod validated)

##### [NEW] `app/api/loyalty/cards/route.ts`
GET: Client's loyalty cards. Auth required.

##### [NEW] `app/api/loyalty/cards/[cardId]/route.ts`
GET: Single card detail + QR token.

#### Phase B-6.2: QR Stamp + Redeem

##### [NEW] `app/api/loyalty/stamp/route.ts`
POST: Verify HMAC token. Auth required (must be salon owner or staff — Rule S6 pattern). Increment stamps.

##### [NEW] `app/api/loyalty/redeem/route.ts`
POST: Redeem completed card. Create history entry. Auto-create new card with stamps=0.

✅ DO:
```typescript
// Correct: verify stamper is salon staff (audit fix B11)
const { data: salon } = await supabase.from('salons').select('owner_id').eq('id', salonId).single();
const { data: staffMember } = await supabase.from('staff_members')
  .select('id').eq('salon_id', salonId)
  .eq('id', user.id).maybeSingle();
if (salon?.owner_id !== user.id && !staffMember) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

❌ DON'T:
```typescript
// Wrong: anyone authenticated can stamp (no ownership check)
const { data: { session } } = await supabase.auth.getSession();
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
// Directly stamp without checking if user is salon staff
```

> **Commit**: `git commit -m "B-6.1-6.2: loyalty CRUD + QR stamp (staff-verified) + redeem"`

#### Phase B-6.3: QR Generation + Chairs

##### [NEW] `app/api/loyalty/qr/[cardId]/route.ts`
GET: Returns QR code as SVG/PNG. Uses `qrcode` npm package.
QR encodes URL: `https://solen.ch/loyalty/stamp?token={qr_token}` (Detail D17).
Client shows this on their phone → barber scans.

##### [NEW] `app/api/salon/chairs/route.ts`
GET: Get chair config. PUT: Update chair count + buffer. Validate with `barberChairsSchema`.
Only for salons with `barbershop` in categories (403 if not).

> **Commit**: `git commit -m "B-6.3: QR code generation + chair management API"`

---

### Prompt B-7: Walk-In Queue UI

**UI Rules for all components in this prompt:**
- Dashboard components = Zone 4: `font-heading` (Syne 700) for titles, `font-body` (DM Sans) for text. ZERO animation. No Bebas Neue.
- Public components = Zone 2: Syne + DM Sans, hover effects OK, stagger on load OK
- All cards: `rounded-card`, `shadow-card`, `bg-white dark:bg-s-dm-surface`, `backdrop-blur-xl` for glass
- CTAs: `<InteractiveHoverButton>` with `bg-s-coral text-white`
- Icons: `lucide-react` only. No emoji (Rule 5 / UI_RULES §5)
- Every `bg-white` needs `dark:bg-s-dm-surface`. Every `text-s-ink` needs `dark:text-s-dm-text` (Rule 21)
- No `rounded-lg` — use `rounded-card` or `rounded-button` (Rule 20)
- No `text-gray-*` — use `text-s-ink/70` (Rule 20)
- No `bg-gray-*` — use `bg-s-bg-surface` (Rule 20)

#### Phase B-7.1: Queue Components

##### [NEW] `components/barber/WalkinQueue.tsx`
Real-time queue list. Supabase realtime subscription. Actions: "Nächster", "Nicht erschienen", "Abbrechen".

##### [NEW] `components/barber/WaitTimeDisplay.tsx`
Public: "Aktuelle Wartezeit: ~20 Min. | 4 Personen warten". Uses `Clock` icon from lucide-react.

##### [NEW] `components/barber/RemoteQueueJoin.tsx`
Public form: name, phone, preferred barber, service. Confirmation view with position.

> **Commit**: `git commit -m "B-7.1: walk-in queue dashboard + wait time + remote join"`
>
> **Verify**: `ls components/barber/WalkinQueue.tsx` exists. `grep -rn "WalkinQueue" app/ components/ | grep import` returns at least 1 result (Rule 26 — no dead code).
>
> **Banned token check (Rule 20)**:
> ```bash
> grep -Ern "text-gray-|bg-gray-|rounded-lg|rounded-md|rounded-xl|bg-black" components/barber/ --include="*.tsx" | head -5
> # Must return 0 results
> ```
>
> ⚠️ **BE CAREFUL**: The `WalkinQueue` uses Supabase Realtime. Import `supabase` from `@/lib/supabase` (the client helper, not admin). Don't use `createAdminSupabaseClient()` in a component (Rule S2). WaitTimeDisplay is Zone 2 (public page) — hover effects OK.

#### Phase B-7.2: Integration

##### [MODIFY] Dashboard calendar view
"Warteschlange" side panel. Walk-ins as a separate column. Drag-to-assign.

##### [MODIFY] `app/[locale]/salon/[slug]/page.tsx`
If barbershop + walk-in enabled → `<WaitTimeDisplay />` + "Jetzt anstellen" CTA.

> **Commit**: `git commit -m "B-7.2: queue panel in calendar + wait time on salon page"`
>
> ⚠️ **BE CAREFUL**: `salon/[slug]/page.tsx` is a SHARED page. If nail N-8 already modified it, READ the current version first. Add barbershop section BELOW nail section. Guard with `salon.categories.includes('barbershop')`. Don't import Header/BottomNav (Rule 27).

---

### Prompt B-8: Booking Flow + Profile UI

#### Phase B-8.1: Express Rebook + Booking Mods

##### [NEW] `components/barber/ExpressRebook.tsx`
Renders on **client dashboard home** + **booking success page**.
Card text: "Letzter Termin: Skin Fade + Bart bei Marcus, vor 23 Tagen" (Detail D15 — exact text pattern).
"Gleich nochmal buchen" CTA using `<InteractiveHoverButton>` → calls express-rebook API → shows suggested slot → "Bestätigen" → done. 2 taps.
If barber unavailable → falls back to "Nächster verfügbarer Barber".

##### [MODIFY] `components/BookingCalendar.tsx`
For `category === 'barbershop'`:
- Simplify service selection (barber menus are SHORT — show all without scrolling)
- "Letzter Schnitt wiederholen" if cut history exists
- Chair availability indicator
- After booking: "Regelmässig buchen? Alle {cycle} Wochen?" toggle (creates reminder preference)
**Zone 3: ZERO animation** (UI_RULES §18).

✅ DO:
```tsx
// Correct: conditional block, zone 3 (no animation)
{category === 'barbershop' && (
  <div className="rounded-card bg-white dark:bg-s-dm-surface shadow-card p-4">
    {/* barber-specific booking steps */}
  </div>
)}
```

❌ DON'T:
```tsx
// Wrong: animation in Zone 3 booking flow
<motion.div animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
// Wrong: rounded-lg instead of rounded-card
<div className="rounded-lg bg-gray-50">
```

> **Commit**: `git commit -m "B-8.1: express rebook + simplified barber booking flow"`
>
> ⚠️ **BE CAREFUL**: `BookingCalendar.tsx` is ~20KB. READ IT FULLY before editing. If nail N-9 already added nail conditional blocks, add the barber block as a SEPARATE `else if (category === 'barbershop')`. Don't merge with the nail block. Zone 3 = ZERO animation.

#### Phase B-8.2: Barber Profile Page

##### [NEW] `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx`
Public profile. SEO `generateMetadata()`. Portfolio grid. "Bei {name} buchen" CTA. Shareable link. Zone 2 page.
Must NOT import Header/BottomNav (Rule 27).

##### [MODIFY] Salon barbershop page
"Unsere Barber" roster grid. Cards link to individual profiles.

> **Commit**: `git commit -m "B-8.2: barber profile page + salon roster section"`
>
> **Verify**: `grep -rn "import.*Header\|import.*BottomNav" app/\\[locale\\]/salon/\\[slug\\]/barber/ | head -3` returns 0 results (Rule 27).

---

### Prompt B-9: CRM Dashboard UI (Zone 4)

All components: Zone 4. Syne 700 headings, DM Sans body. ZERO animation. `rounded-card` max. No Bebas Neue.

#### Phase B-9.1: Client List + Timeline

##### [NEW] `app/[locale]/dashboard/barber-clients/page.tsx`
Client list with barber-specific data: last cut photo, preferred barber, visit cycle badge, loyalty stamp count.
Click → client detail with tabs:
- **Schnitte**: `CutHistoryTimeline` — photos, cut spec badges, barber name
- **Präferenzen**: Editable cut spec (clipper guard #, fade type, top style, lineup, beard, product)
- **Notizen**: Existing `client_notes`
- **Treuekarte**: Loyalty card stamp visual + stamp history

##### [NEW] `components/barber/CutHistoryTimeline.tsx`
Each entry: date, barber name, photo, cut spec (guard #, fade, top, lineup, beard), notes.
"Wiederholen" button → express rebook with this exact spec.

##### [MODIFY] `components/dashboard/DashboardLayout.tsx`
Add conditional sidebar: `{ label: "Barber Kunden", href: "/dashboard/barber-clients", icon: Scissors }`

> **Commit**: `git commit -m "B-9.1: barber CRM dashboard + cut history timeline"`
>
> ⚠️ **BE CAREFUL**: `DashboardLayout.tsx` sidebar — find the exact insert position. If nail N-10 already added "Nail Kunden", add "Barber Kunden" BELOW it. Both guarded by `salon.categories.includes(...)`.

#### Phase B-9.2: Leaderboard + Settings

##### [NEW] `components/dashboard/barber/BarberLeaderboard.tsx` (Detail D16)
Internal dashboard (owner + manager only). Metrics: **bookings count, revenue, client retention %, avg tip, walk-in conversion %, chair utilization**. Weekly/monthly toggle. Sortable by any metric. Anonymizable toggle (shows "Barber A, B, C" instead of names).

##### [NEW] `components/dashboard/barber/ChairManager.tsx`
Chair count input, buffer minutes. Current utilization bar: "3 von 4 Stühlen belegt". Same pattern as nail's `StationManager.tsx`.

##### [NEW] `components/dashboard/barber/SmartReminderConfig.tsx`
Shows clients due for a reminder (from cron notes). "Erinnerung senden" button per client.
Stats: "12 Kunden sind diese Woche fällig" with breakdown by barber.

> **Commit**: `git commit -m "B-9.2: leaderboard + chair manager + smart reminder config"`
>
> **Dead code check (Rule 26)**:
> ```bash
> for f in components/dashboard/barber/*.tsx; do
>   name=$(basename "$f" .tsx)
>   count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
>   [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f"
> done
> # Must print nothing
> ```

---

### Prompt B-10: Loyalty UI

#### Phase B-10.1: Salon Side

##### [NEW] `components/dashboard/barber/LoyaltyConfig.tsx` (Zone 4)
Setup form: program name, stamps required (default 10), reward type (free service / CHF discount / % discount), reward value. Preview: visual stamp card with configured values. Active/inactive toggle.

##### [NEW] `app/[locale]/dashboard/loyalty/page.tsx` (Zone 4)
Loyalty dashboard: active cards, redemption history, conversion metrics.
"Stempel scannen" button → opens camera → reads QR → calls stamp API.

#### Phase B-10.2: Client Side

##### [NEW] `components/barber/LoyaltyCard.tsx` (Zone 2)
Visual stamp grid using `lucide-react` `Check` icon for filled stamps, `Circle` for empty. NOT emoji ⬛/⬜ (Rule — no emoji in UI).
Shows: "{stamps}/{required} Stempel | {salon_name}".
When `status === 'redeemable'` → "Gratis Schnitt verfügbar!" badge + pulsing `shadow-coral-glow` animation.
QR code display: tap to expand full-screen for barber to scan.

##### [NEW] `components/barber/LoyaltyCardList.tsx` (Zone 2)
All active loyalty cards across all barbershops.
Completed/redeemed cards in "Abgeschlossene Karten" collapsible section (cards never disappear — always in history).

##### [MODIFY] Client profile page — "Treuekarten" section showing `<LoyaltyCardList />`

##### [NEW] `app/[locale]/loyalty/stamp/page.tsx` (Zone 3 — functional, ZERO animation except success feedback)
Public page at `solen.ch/loyalty/stamp?token={token}`. Barber scans client's QR → lands here → verifies token → shows "Stempel für {client} hinzufügen?" → one tap → done. Success animation: stamp appears with "pop" effect.
Auth required: salon staff verification (audit fix B11).

> **Commit**: `git commit -m "B-10: loyalty config + client cards + QR stamp page"`
>
> **Verify**: Stamp page has auth check. `grep -n "getSession" app/\\[locale\\]/loyalty/stamp/page.tsx` returns result.

---

### Prompt B-11: Discovery + Analytics

#### Phase B-11.1: Barbershop Discovery

##### [MODIFY] Existing barbershop sub-site
Barber-specific filter pills: **Fade, Lineup, Taper, Beard Sculpting, Hair Design, Classic Cut**.
Before/after pairs in feed (togglable). Cards link to barber's portfolio page (`/salon/{slug}/barber/{barberSlug}`).

##### [MODIFY] Discovery algorithm
Add barber signals: `fade_type` match, `barber_style` match, barber's retention rate weight (higher retention = better recommendations).

> **Commit**: `git commit -m "B-11.1: barber discovery filters + algorithm signals"`
>
> ⚠️ **BE CAREFUL**: `discovery-algorithm.ts` was modified by nail N-6. READ the current file. Add barber scoring in a NEW `else if (category === 'barbershop')` branch AFTER the nail branch.

#### Phase B-11.2: Walk-In Analytics

##### [MODIFY] Dashboard analytics
Walk-in vs appointment ratio, conversion rate, avg wait, queue abandonment, chair utilization. Zone 4 charts using `recharts`.

> **Commit**: `git commit -m "B-11.2: walk-in + chair utilization analytics"`

---

### Prompt B-12: Translations + Emails

#### Phase B-12.1: i18n (4 locales)

##### [MODIFY] `messages/de.json`, `en.json`, `fr.json`, `it.json`
Add `barber` namespace. All keys for: queue, rebook, cut history, loyalty, leaderboard, chairs, reminders.

#### Phase B-12.2: Email Templates

##### [MODIFY] `lib/email.ts`
- `barberSmartReminderEmail()` — 4 locales
- `barberQueuePositionSMS()` — short SMS
- `barberYoureNextSMS()` — "Du bist dran!"
- `barberLoyaltyRewardEmail()` — "Dein Gratis-Schnitt wartet!"

> **Commit**: `git commit -m "B-12: barber translations (4 locales) + email/SMS templates"`
>
> ⚠️ **BE CAREFUL**: Check ALL 4 locale files have the keys (Rule 29.8). `grep -c "barber" messages/de.json messages/en.json messages/fr.json messages/it.json` — all 4 counts must be equal.

---

### Prompt B-13: CLAUDE.md + Docs + Smoke Test

#### Phase B-13.1: CLAUDE.md Update (R8)

##### [MODIFY] `CLAUDE.md`
- §3.2: Add `lib/barber/`, `components/barber/`, `components/dashboard/barber/`
- §3.5: Add features 48-58 (walk-in queue, express rebook, cut history, barber profiles, smart reminders, loyalty cards, leaderboard, chairs, walk-in analytics, barber portfolio, hybrid calendar)
- §6: Add tables: `barber_walkin_queue`, `barber_cut_history`, `barber_loyalty_programs`, `barber_loyalty_cards`, `barber_loyalty_history`, `barber_chairs`

#### Phase B-13.2: Category Map

##### [MODIFY] `_docs/category-system-map.md`
Barbershop status → ✅ Live

#### Phase B-13.3: POST-EXECUTION SMOKE TEST (Rule 29)

```bash
# 1. Build passes
npm run build

# 2. Type check
npx tsc --noEmit

# 3. No dead components
for f in components/barber/*.tsx components/dashboard/barber/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f"
done

# 4. No missing types
npx tsc --noEmit 2>&1 | grep "has no exported member" | head -10

# 5. No duplicate layout elements
grep -rn "import.*Header\|import.*BottomNav" app/\[locale\]/queue/ app/\[locale\]/loyalty/ app/\[locale\]/salon/\[slug\]/barber/ --include="*.tsx" | head -5

# 6. Feature flag exists
echo "SELECT key FROM feature_flags WHERE key = 'barber_features';" | # verify via supabase

# 7. Middleware check (verify /queue/[id] and /loyalty/stamp are NOT blocked)

# 8. Translations exist in all 4 locales
for locale in de en fr it; do
  count=$(grep -c "barber" "messages/$locale.json")
  echo "$locale: $count barber keys"
done

# 9. Banned token check
grep -Ern "text-gray-|bg-gray-|rounded-lg|rounded-md|bg-black|text-dark" components/barber/ components/dashboard/barber/ --include="*.tsx" | head -5
# Must return 0 results
```

> **Commit**: `git commit -m "B-13: CLAUDE.md + category map + smoke test verified"`

---

## SHARED FINAL PROMPT (S-1)

### Prompt S-1: Cross-Category Verification

After ALL nail + barber prompts are done:

1. **Build**: `npm run build && npx tsc --noEmit`
2. **Cross-category shared files**:
   - `BookingCalendar.tsx` has BOTH nail and barber conditional blocks
   - `DashboardLayout.tsx` has BOTH "Nail Kunden" and "Barber Kunden" sidebar items
   - `discovery-algorithm.ts` has nail branch AND barber branch (separate `else if`)
   - `generate-slots` cron has nail station check AND barber chair check
   - `lib/email.ts` has all templates, no duplicates
   - `messages/*.json` has both `nail.*` and `barber.*` namespaces, same key count across locales
3. **Full Rule 29 smoke test** for both categories combined
4. **Update `_docs/category-system-map.md`**: Both nails and barbershop → ✅ Live
5. **Final commit**: `git commit -m "S-1: cross-category verification passed"`

---

## CROSS-CATEGORY COLLISION RISKS

| Risk | Files Affected | Nail Prompt | Barber Prompt | Prevention |
|---|---|---|---|---|
| Both modify `BookingCalendar.tsx` | 20KB file | N-9 | B-8 | Nail first. Barber reads modified. Separate `else if` blocks |
| Both modify `DashboardLayout.tsx` | Sidebar nav | N-10 | B-9 | Same: nail first, barber adds below |
| Both modify `discovery-algorithm.ts` | Scoring logic | N-6 | B-11 | Nail first. Barber adds NEW branch |
| Both modify `generate-slots cron` | Slot limiting | N-5 | B-3 | Nail first. Barber adds `else if` |
| Both modify `staff/portfolio/route.ts` | Upload fields | N-5 | B-4 | Nail first. Both use `if (body.field)` guards |
| Both modify `salon/[slug]/page.tsx` | Public page | N-8 | B-7 | Nail first. Barber section below |
| Both modify `lib/types.ts` | Type unions | N-2 | B-2 | Append-only. `Nail*` vs `Barber*` prefixes |
| Both modify `messages/*.json` | i18n keys | N-14 | B-12 | `nail.*` vs `barber.*` namespaces |

---

## COMBINED STATS

| Metric | Nails | Barber | Total |
|---|---|---|---|
| Prompts | 15 | 13 | 29 (+1 shared) |
| New DB tables | 7 | 6 | 13 |
| Extended tables | 4 | 3 | 7 |
| New API routes | 15 | 16 | 31 |
| New components | 16 | 15 | 31 |
| New pages | 4 | 5 | 9 |
| New lib files | 4 | 4 | 8 |
| Modified shared files | ~15 | ~12 | ~15 (8 overlap) |

## SHARED FILE MODIFICATION ORDER

| File | Nail Prompt | Barber Prompt | Order |
|---|---|---|---|
| `lib/types.ts` | N-2 | B-2 | Nail first |
| `lib/validations.ts` | N-2 | B-2 | Nail first |
| `lib/feature-flags.ts` | N-2 | B-2 | Nail first |
| `lib/intake-templates.ts` | N-2 | B-2 | Nail first |
| `lib/discovery-algorithm.ts` | N-6 | B-11 | Nail first ⚠️ |
| `BookingCalendar.tsx` | N-9 | B-8 | Nail first ⚠️ |
| `DashboardLayout.tsx` | N-10 | B-9 | Nail first ⚠️ |
| `salon/[slug]/page.tsx` | N-8 | B-7 | Nail first ⚠️ |
| `generate-slots cron` | N-5 | B-3 | Nail first ⚠️ |
| `staff/portfolio/route.ts` | N-5 | B-4 | Nail first ⚠️ |
| `messages/*.json` | N-14 | B-12 | Nail first |
| `lib/email.ts` | N-14 | B-12 | Nail first |
| `CLAUDE.md` | N-15 | B-13 | Nail first |
| `category-system-map.md` | N-15 | B-13 | Nail first |

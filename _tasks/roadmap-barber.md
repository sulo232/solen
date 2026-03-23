# 💈 Barber Category Mega-Build — Audited Roadmap

> **Full barber vertical implementation.** Follows CLAUDE.md R1-R10.
> Each **Prompt** is one Claude Code session. Each sub-phase (1.1, 1.2...) is one commit.
> `npm run build` must pass before every commit. Read `_docs/category-system-map.md` first.

---

## SCOPE DECISIONS (Locked)

| # | Decision | Choice |
|---|---|---|
| S1 | Scope | P0+P1 (~15 prompts) |
| S2 | Walk-In Queue | Smart: remote join, wait estimate, hybrid calendar, "you're next" SMS |
| S3 | Booth Rental | Skip — commission-only (already exists via `commission-calculator.ts`) |
| S4 | Express Rebook | One-tap: same barber + same service + next slot, 2 taps total |
| S5 | Barber Profiles | Nested in barbershop sub-site: `/salon/{slug}/barber/{barber-slug}`. Roster on shop page |
| S6 | Smart Reminders | Algorithm-based: learn client's visit cycle from history. Custom `visit-cycle-algorithm.ts` |
| S7 | Cut Preferences | Structured: clipper guard #, fade type, top style, lineup, beard, product, notes, photo |
| S8 | Cash Workflow | Skip — card/TWINT only |
| S9 | Loyalty | Digital punch card with QR scan. Per-barbershop. Card history. Signed URL verification |
| S10 | Leaderboard | Dashboard-only (internal). Bookings, revenue, retention, avg tip |
| S11 | Product Sales | Skip |
| S12 | Promo Codes | Skip |
| S13 | Chair Mgmt | Basic chair count (like nail stations). Owner-configurable |
| S14 | Discovery | Extend existing barbershop sub-site with barber-specific content |

---

## EXISTING SYSTEMS TO REUSE

| System | File/Table | Barber Usage |
|---|---|---|
| Booking engine | `bookings`, `availability_slots` | Core booking — extend with walk-in queue |
| Walk-in SMS payments | `api/bookings/walk-in/` | Already handles walk-in basics — extend with queue |
| Staff scheduling | `staff_schedules`, `staff_breaks`, `staff_time_off` | Per-barber calendars already work |
| Commission calculator | `lib/commission-calculator.ts` | Barber commission tracking |
| Staff portfolio | `staff_portfolio_images` | Barber cut gallery — extend with barber metadata |
| Service templates | `lib/service-templates.ts` → `barbershop` | 8 services already defined |
| Intake templates | `lib/intake-templates.ts` | Extend for barber consultation |
| SMS reminders | seven.io integration | "Time for a cut" reminders |
| Client notes/tags/photos | `client_notes`, `client_tags`, `client_photos` | Cut preference notes, VIP tags, last-cut photos |
| Analytics dashboard | Revenue, heatmap, staff comparison | Extend with walk-in stats + chair util |
| ServiceCart | `components/booking/ServiceCart.tsx` | Multi-service combo (cut + beard) |
| Discovery feed | `discovery_items` | Barber-filtered content |
| Gemini AI Vision | `lib/ai-vision.ts` | Auto-tag barber portfolio photos (fade type, style) |
| nanoid | Already in stack | QR code token generation for loyalty |
| DM Chat | Conversations + messages | Client-barber communication |
| Off-peak discounts | `off_peak_slots` | Slow-hour discounts |

---

## BREAKAGE RISK ASSESSMENT

| Phase | Risk | Could Break | Prevention |
|---|---|---|---|
| P1 (DB) | 🟡 MEDIUM | Existing tables if column conflicts | `IF NOT EXISTS` on all ALTERs |
| P2 (Types) | 🟢 SAFE | Nothing | Append-only |
| P3-5 (API) | 🟢 SAFE | New routes | — |
| P6 (Walk-in Queue) | 🔴 HIGH | Existing booking/walk-in flow | Read walk-in route fully first, ADD queue layer, don't restructure |
| P7 (Booking UI) | 🔴 HIGH | BookingCalendar (20KB) | Read fully first, add conditional block only |
| P8-9 (Dashboard) | 🟡 MEDIUM | Dashboard sidebar | Exact insert position |
| P10 (Loyalty) | 🟡 MEDIUM | Profile page | Conditional section only |

---

## MANUAL STEPS

### Manual A: Supabase Storage
- `barber-portfolio-images` — **Public**, 5MB, `image/*`

### Manual B: Feature Flag
```sql
INSERT INTO feature_flags (key, enabled, description)
VALUES ('barber_features', false, 'Barber category extended features')
ON CONFLICT (key) DO NOTHING;
```

### Manual C: QR Code Library
```bash
npm install qrcode @types/qrcode
```

---

## PROMPT 1 — Database Foundation

### Phase 1.1: Walk-In Queue + Cut History Tables

#### [NEW] `supabase/migrations/XXX_barber_foundation.sql`

```sql
-- ============================================================
-- WALK-IN QUEUE
-- The core barber-specific table. Manages real-time walk-in queue.
-- ============================================================
CREATE TABLE IF NOT EXISTS barber_walkin_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID,                          -- NULL for anonymous walk-ins
  customer_name TEXT NOT NULL,               -- "Marcus" (for display on queue)
  customer_phone TEXT,                       -- for SMS notifications
  service_id UUID REFERENCES services(id),   -- what they want (optional, some walk-ins say "just a cut")
  assigned_barber_id UUID REFERENCES staff_members(id),  -- NULL = next available
  preferred_barber_id UUID REFERENCES staff_members(id), -- who they wanted
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','in_chair','completed','no_show','cancelled')),
  position INTEGER NOT NULL,                 -- queue position (1, 2, 3...)
  estimated_wait_minutes INTEGER,            -- calculated on insert
  joined_at TIMESTAMPTZ DEFAULT now(),
  called_at TIMESTAMPTZ,                     -- when "you're next" was sent
  started_at TIMESTAMPTZ,                    -- when service began
  completed_at TIMESTAMPTZ,
  join_method TEXT DEFAULT 'in_person' CHECK (join_method IN ('in_person','remote','kiosk')),
  converted_to_booking BOOLEAN DEFAULT false  -- did they become a regular booker?
);
CREATE INDEX IF NOT EXISTS idx_walkin_queue_active ON barber_walkin_queue(salon_id, status) WHERE status IN ('waiting','in_chair');
ALTER TABLE barber_walkin_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "walkin_salon" ON barber_walkin_queue FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "walkin_customer" ON barber_walkin_queue FOR SELECT USING (customer_id = auth.uid());

-- ============================================================
-- CUT PREFERENCE HISTORY (per-visit structured record)
-- customer_id has no FK — supports guest walk-ins
-- ============================================================
CREATE TABLE IF NOT EXISTS barber_cut_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID,
  customer_name TEXT,                        -- for walk-in guests without accounts
  booking_id UUID REFERENCES bookings(id),
  walkin_id UUID REFERENCES barber_walkin_queue(id),
  staff_member_id UUID REFERENCES staff_members(id),
  -- Cut details (structured)
  side_length TEXT,                          -- clipper guard: "0", "1", "2", "3", "4", "scissors"
  top_style TEXT CHECK (top_style IN ('scissors','textured','slicked_back','pompadour','crew','buzz','flat_top','mohawk','freeform','other')),
  fade_type TEXT CHECK (fade_type IN ('skin','low','mid','high','taper','drop','temp','burst','none')),
  lineup BOOLEAN DEFAULT false,
  beard_style TEXT CHECK (beard_style IN ('full_shape','trim','sculpt','shave','goatee','stubble','none')),
  hair_design TEXT,                          -- razor design/pattern description
  product_used TEXT,                         -- "Layrite pomade" / "Suavecito wax"
  photo_url TEXT,                            -- result photo
  notes TEXT,                                -- barber freeform notes
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cut_history_customer ON barber_cut_history(salon_id, customer_id);
ALTER TABLE barber_cut_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cut_history_salon" ON barber_cut_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "cut_history_customer" ON barber_cut_history FOR SELECT USING (customer_id = auth.uid());
```

> **Commit**: `git commit -m "phase 1.1: walk-in queue + cut history tables"`

### Phase 1.2: Loyalty + Chairs + Extensions

```sql
-- ============================================================
-- LOYALTY PROGRAMS (per-salon punch card config)
-- ============================================================
CREATE TABLE IF NOT EXISTS barber_loyalty_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Treuekarte',
  stamps_required INTEGER NOT NULL DEFAULT 10,
  reward_type TEXT NOT NULL DEFAULT 'free_service' CHECK (reward_type IN ('free_service','chf_discount','percentage_discount')),
  reward_value INTEGER DEFAULT 0,            -- cents for chf_discount, percentage for percentage_discount, 0 for free_service
  reward_service_id UUID REFERENCES services(id),  -- which service is free (if free_service)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_loyalty_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_program_salon" ON barber_loyalty_programs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_program_public" ON barber_loyalty_programs FOR SELECT USING (is_active = true);

-- ============================================================
-- LOYALTY CARDS (per-client-per-salon stamp tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS barber_loyalty_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES barber_loyalty_programs(id) ON DELETE CASCADE NOT NULL,
  salon_id UUID REFERENCES salons(id) NOT NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stamps INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','redeemable','redeemed')),
  qr_token TEXT NOT NULL UNIQUE,             -- HMAC-signed token for QR scanning
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(program_id, customer_id, status)    -- one active card per program per client
);
CREATE INDEX IF NOT EXISTS idx_loyalty_cards_customer ON barber_loyalty_cards(customer_id);
ALTER TABLE barber_loyalty_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_card_salon" ON barber_loyalty_cards FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_card_customer" ON barber_loyalty_cards FOR ALL USING (customer_id = auth.uid());

-- ============================================================
-- LOYALTY CARD HISTORY (completed/redeemed cards)
-- ============================================================
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
CREATE POLICY "loyalty_history_salon" ON barber_loyalty_history FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "loyalty_history_customer" ON barber_loyalty_history FOR SELECT USING (customer_id = auth.uid());

-- ============================================================
-- BARBER CHAIRS (like nail stations)
-- ============================================================
CREATE TABLE IF NOT EXISTS barber_chairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  chair_count INTEGER NOT NULL DEFAULT 4,
  buffer_minutes INTEGER DEFAULT 5,          -- cleanup time between clients
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id)
);
ALTER TABLE barber_chairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chairs_salon" ON barber_chairs FOR ALL USING (
  salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid()));
CREATE POLICY "chairs_public_read" ON barber_chairs FOR SELECT USING (true);

-- ============================================================
-- EXTEND EXISTING TABLES
-- ============================================================

-- Staff portfolio: barber-specific metadata
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS barber_style TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS fade_type TEXT;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS is_before_after BOOLEAN DEFAULT false;
ALTER TABLE staff_portfolio_images ADD COLUMN IF NOT EXISTS before_photo_url TEXT;

-- Staff members: vanity slug for shareable barber links
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS accent_color TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_slug ON staff_members(slug) WHERE slug IS NOT NULL;

-- Bookings: walk-in queue reference
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS walkin_queue_id UUID REFERENCES barber_walkin_queue(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_express_rebook BOOLEAN DEFAULT false;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rebooked_from_id UUID REFERENCES bookings(id);

-- Feature flag
INSERT INTO feature_flags (key, enabled, description)
VALUES ('barber_features', false, 'Barber category extended features')
ON CONFLICT (key) DO NOTHING;
```

> **Commit**: `git commit -m "phase 1.2: loyalty tables, chairs, extend staff/bookings for barber"`

> ⚠️ **BE CAREFUL**: `staff_members` ALTER adds `slug` — used for `/salon/{slug}/barber/{barber-slug}` URLs. UNIQUE index is partial (WHERE slug IS NOT NULL) so existing null rows are fine. `bookings` ALTER adds `walkin_queue_id` FK — verify `barber_walkin_queue` table exists first (it does from 1.1, but migration ordering matters).

---

## PROMPT 2 — Types, Schemas, Utilities

### Phase 2.1: TypeScript Types

#### [MODIFY] `lib/types.ts` — Append barber types

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

export interface BarberWalkinQueue { /* all columns from SQL */ }
export interface BarberCutHistory { /* all columns from SQL */ }
export interface BarberLoyaltyProgram { /* all columns from SQL */ }
export interface BarberLoyaltyCard { /* all columns from SQL */ }
export interface BarberLoyaltyHistory { /* all columns from SQL */ }
export interface BarberChairs { /* all columns from SQL */ }
```

Add `'barber_features'` to `FeatureKey` union in `lib/feature-flags.ts`.

> **Commit**: `git commit -m "phase 2.1: barber TypeScript types + feature flag"`

### Phase 2.2: Zod Validations

#### [MODIFY] `lib/validations.ts`

Add: `walkinJoinSchema`, `walkinUpdateSchema`, `cutHistorySchema`, `loyaltyProgramSchema`, `loyaltyStampSchema`, `barberChairsSchema`, `barberProfileSchema`.

> **Commit**: `git commit -m "phase 2.2: barber Zod validations"`

### Phase 2.3: Utility Functions

#### [NEW] `lib/barber/visit-cycle-algorithm.ts`

```typescript
/**
 * Smart visit cycle algorithm.
 * Calculates a client's natural visit frequency from booking history.
 * Uses weighted moving average (recent visits weighted more).
 *
 * @param visitDates - Array of past visit dates, newest first
 * @param minVisits - Minimum visits needed for a reliable cycle (default 3)
 * @returns { avgCycleDays, confidence, nextDueDate, daysOverdue }
 */
export function calculateVisitCycle(
  visitDates: Date[],
  minVisits = 3
): {
  avgCycleDays: number | null;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  nextDueDate: Date | null;
  daysOverdue: number;
} {
  if (visitDates.length < minVisits) {
    return { avgCycleDays: null, confidence: 'insufficient', nextDueDate: null, daysOverdue: 0 };
  }

  // Calculate gaps between visits
  const gaps: number[] = [];
  for (let i = 0; i < visitDates.length - 1; i++) {
    const gap = Math.round(
      (visitDates[i].getTime() - visitDates[i + 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (gap > 0 && gap < 120) gaps.push(gap); // ignore gaps > 4 months (likely inactive period)
  }

  if (gaps.length < 2) {
    return { avgCycleDays: null, confidence: 'insufficient', nextDueDate: null, daysOverdue: 0 };
  }

  // Weighted moving average: recent gaps count more
  // Weights: [1.5, 1.3, 1.1, 1.0, 0.9, 0.8, ...]
  let weightedSum = 0;
  let weightTotal = 0;
  gaps.forEach((gap, i) => {
    const weight = Math.max(0.7, 1.5 - i * 0.2);
    weightedSum += gap * weight;
    weightTotal += weight;
  });

  const avgCycleDays = Math.round(weightedSum / weightTotal);

  // Confidence based on consistency (standard deviation)
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - mean, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean; // coefficient of variation

  const confidence = cv < 0.15 ? 'high' : cv < 0.3 ? 'medium' : 'low';

  // Next due date
  const lastVisit = visitDates[0];
  const nextDueDate = new Date(lastVisit);
  nextDueDate.setDate(nextDueDate.getDate() + avgCycleDays);

  const now = new Date();
  const daysOverdue = Math.max(0, Math.round(
    (now.getTime() - nextDueDate.getTime()) / (1000 * 60 * 60 * 24)
  ));

  return { avgCycleDays, confidence, nextDueDate, daysOverdue };
}
```

#### [NEW] `lib/barber/wait-time-calculator.ts`

```typescript
/**
 * Estimate wait time for a walk-in based on:
 * - Number of people ahead in queue
 * - Average service duration for queue entries
 * - Number of barbers currently working
 */
export function estimateWaitMinutes(
  queuePositionsBefore: number,
  avgServiceMinutes: number,
  activeBarberCount: number,
  bufferMinutes: number = 5
): number {
  if (activeBarberCount <= 0) return 0;
  const slotsPerRound = activeBarberCount;
  const rounds = Math.ceil(queuePositionsBefore / slotsPerRound);
  return rounds * (avgServiceMinutes + bufferMinutes);
}
```

#### [NEW] `lib/barber/chair-availability.ts`

```typescript
/** Same pattern as nail station-availability.ts but for barber chairs. */
export async function checkChairAvailability(
  supabase: any, salonId: string, startsAt: Date, endsAt: Date
): Promise<{ available: boolean; used: number; total: number }> {
  const { data: chairs } = await supabase
    .from('barber_chairs').select('chair_count, buffer_minutes')
    .eq('salon_id', salonId).single();
  if (!chairs) return { available: true, used: 0, total: Infinity };

  const bufferMs = (chairs.buffer_minutes || 0) * 60 * 1000;
  const bufferedEnd = new Date(endsAt.getTime() + bufferMs);
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .in('status', ['confirmed', 'pending'])
    .lt('starts_at', bufferedEnd.toISOString())
    .gt('ends_at', startsAt.toISOString());
  return { available: (count || 0) < chairs.chair_count, used: count || 0, total: chairs.chair_count };
}
```

#### [NEW] `lib/barber/loyalty-qr.ts`

```typescript
import { createHmac } from 'crypto';
/**
 * Generate a signed QR token for loyalty stamp verification.
 * Token format: {salon_id}:{customer_id}:{card_id}:{hmac}
 * Barber scans → solen.ch verifies HMAC → adds stamp.
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

> **Commit**: `git commit -m "phase 2.3: visit-cycle algorithm, wait-time calculator, chair availability, loyalty QR"`

---

## PROMPT 3 — API: Walk-In Queue System

### Phase 3.1: Queue Management API

#### [NEW] `app/api/walkin/queue/route.ts`
- **GET** (public): Get current queue for a salon. Returns: queue entries with position, estimated wait, status. Shows `{ currentWait: 20, queueLength: 4, activeBarbers: 3 }` summary.
- **POST**: Join queue. Accepts: `customer_name`, `customer_phone` (for SMS), `service_id` (optional), `preferred_barber_id` (optional), `join_method`.
  - Auto-calculates `position` (max position + 1).
  - Auto-calculates `estimated_wait_minutes` using `wait-time-calculator.ts`.
  - If `customer_phone` provided → send confirmation SMS: "Du bist #{position} in der Warteschlange bei {salon}. Geschätzte Wartezeit: ~{wait} Min."

#### [NEW] `app/api/walkin/queue/[id]/route.ts`
- **PATCH**: Update queue entry status.
  - `status: 'in_chair'` → sets `started_at`, assigns `assigned_barber_id` (next free or preferred).
  - `status: 'completed'` → sets `completed_at`. **Auto-creates `barber_cut_history` entry.** Recalculates remaining queue positions & wait times.
  - `status: 'no_show'` → removes from queue, recalculates.
  - `status: 'cancelled'` → removes from queue, recalculates.
- **DELETE**: Cancel own queue entry (customer cancels via SMS link).

> **Commit**: `git commit -m "phase 3.1: walk-in queue CRUD + auto wait-time + SMS notifications"`

### Phase 3.2: Queue Real-Time + Remote Join

#### [NEW] `app/api/walkin/queue/remote-join/route.ts`
- **POST**: Client joins queue remotely (from their phone, not in shop). Same as POST above but `join_method: 'remote'`. Returns queue position + wait estimate + web link to track position.
- Public endpoint (no auth required — walk-ins don't have accounts).

#### [NEW] `app/api/walkin/queue/status/route.ts`
- **GET**: Public. Client checks queue status by queue ID. Returns position, estimated wait, status. Used by "Track my place" web page.
- Poll every 30 seconds from client side (or use Supabase realtime subscription for instant updates).

#### [MODIFY] SMS sending logic
- When queue position changes → send SMS update: "Du bist jetzt #{position}. Noch ~{wait} Min."
- When `position === 1` → send: "Du bist als Nächstes dran! Bitte komm zum Stuhl."
- Use existing seven.io integration, batch-send on status changes.

> **Commit**: `git commit -m "phase 3.2: remote queue join + status tracking + position SMS updates"`

### Phase 3.3: Walk-In → Appointment Hybrid

#### [MODIFY] Slot generation / booking calendar logic
- Walk-in queue entries AND booked appointments must coexist in the same calendar view.
- When a walk-in is `in_chair` → it blocks that barber's availability (prevents double-booking).
- When checking availability → count both `bookings` AND `barber_walkin_queue WHERE status = 'in_chair'` for chair count.

#### [MODIFY] `lib/barber/chair-availability.ts`
- Update to count BOTH active bookings AND `in_chair` walk-ins against chair limit.

> **Commit**: `git commit -m "phase 3.3: walk-in + appointment hybrid availability checking"`

---

## PROMPT 4 — API: Cut Preferences + Barber Profiles

### Phase 4.1: Cut History API

#### [NEW] `app/api/clients/[id]/cut-history/route.ts`
- **GET**: Paginated cut history. Salon owner only.
- **POST**: Create cut record. Validate with `cutHistorySchema`. Upload photo to `client-photos` bucket.

#### [NEW] `app/api/clients/[id]/repeat-last-cut/route.ts`
- **GET**: Returns most recent `barber_cut_history` for this client at this salon. Booking flow uses for express rebook pre-fill.

> **Commit**: `git commit -m "phase 4.1: cut history CRUD + repeat-last-cut API"`

### Phase 4.2: Barber Profile API

#### [NEW] `app/api/barber/[slug]/route.ts`
- **GET**: Public barber profile. Returns: staff member info, portfolio images, rating, total cuts, specialties. Resolves by `staff_members.slug`.

#### [NEW] `app/api/barber/[slug]/portfolio/route.ts`
- **GET**: Public. Paginated portfolio. Filterable by `barber_style`, `fade_type`.
- Uses **Gemini AI Vision** (`lib/ai-vision.ts`) on upload to auto-detect fade type, style from the photo.

#### [MODIFY] `app/api/staff/portfolio/route.ts`
- When uploading for barbershop: accept `barber_style`, `fade_type`, `is_before_after`, `before_photo_url`.

> **Commit**: `git commit -m "phase 4.2: barber profile + portfolio API with AI auto-tagging"`

### Phase 4.3: Barber Slug Generation

#### [NEW] `app/api/staff/[id]/slug/route.ts`
- **PUT**: Salon owner sets a unique slug for a barber. Validate: lowercase, alphanumeric + hyphens, 3-30 chars. Check uniqueness.
- Auto-suggest: `${firstName.toLowerCase()}-${salonSlug}`.

> **Commit**: `git commit -m "phase 4.3: barber slug generation for shareable URLs"`

---

## PROMPT 5 — API: Express Rebook + Smart Reminders

### Phase 5.1: Express Rebook API

#### [NEW] `app/api/bookings/express-rebook/route.ts`
- **POST**: One-tap rebook. Input: `rebook_from_booking_id`.
- Fetches the source booking → extracts `service_id`, `staff_member_id`.
- Finds next available slot for that barber+service.
- Returns `{ suggestedSlot: { date, time }, serviceId, staffId, price }`.
- Client confirms → creates booking with `is_express_rebook: true`, `rebooked_from_id`.

#### [NEW] `app/api/bookings/express-rebook/confirm/route.ts`
- **POST**: Confirm the express rebook. Creates the actual booking.
- Total flow: 2 API calls = 2 taps. Tap 1: "Same as last time" → shows slot. Tap 2: "Bestätigen".

> **Commit**: `git commit -m "phase 5.1: express one-tap rebook API"`

### Phase 5.2: Smart Reminder Cron

#### [NEW] `app/api/cron/barber-smart-reminders/route.ts`
- Runs daily. Cron secret header check.
- For each barbershop client with 3+ past visits:
  - Call `calculateVisitCycle()` from `lib/barber/visit-cycle-algorithm.ts`.
  - If `confidence !== 'insufficient'` AND `daysOverdue >= -2` (reminder 2 days before due):
    - Create `client_note` with `note_type = 'cut_reminder'` and structured JSON.
    - **Semi-auto**: Dashboard shows reminder prompt. Salon clicks "Send" → SMS: "Hey {name}, es ist {days} Tage her seit deinem letzten Schnitt bei {salon}. Zeit für einen neuen? {bookingLink}"
  - Skip if client already has a future booking.
  - Skip if client opted out.

> **Commit**: `git commit -m "phase 5.2: smart visit-cycle reminder cron"`

---

## PROMPT 6 — API: Loyalty System + Chair Mgmt

### Phase 6.1: Loyalty Program API

#### [NEW] `app/api/salon/loyalty/route.ts`
- **GET**: Get salon's loyalty program config. Public.
- **POST**: Create/update loyalty program. Validate with `loyaltyProgramSchema`. Owner only.

#### [NEW] `app/api/loyalty/cards/route.ts`
- **GET**: Client's loyalty cards across all salons. Auth required.
- Returns active cards with stamp count, program info, QR data.

#### [NEW] `app/api/loyalty/cards/[cardId]/route.ts`
- **GET**: Single card detail with QR token.

### Phase 6.2: QR Stamp + Redeem API

#### [NEW] `app/api/loyalty/stamp/route.ts`
- **POST**: Barber scans QR → hits this endpoint with `qr_token`.
- Verifies HMAC via `verifyLoyaltyQRToken()`.
- Increments `stamps` on the card.
- If `stamps >= program.stamps_required` → set `status = 'redeemable'`.
- Returns updated card state.

#### [NEW] `app/api/loyalty/redeem/route.ts`
- **POST**: Redeem a completed card. Sets `status = 'redeemed'`, `redeemed_at = now()`.
- Creates `barber_loyalty_history` entry.
- Creates NEW card for the same client+program with `stamps = 0` (card resets, never disappears).
- If `reward_type = 'free_service'` → creates a one-time discount code internally.

> **Commit**: `git commit -m "phase 6.1-6.2: loyalty program CRUD + QR stamp + redeem flow"`

### Phase 6.3: QR Code Generation + Chair Management API

#### [NEW] `app/api/loyalty/qr/[cardId]/route.ts`
- **GET**: Returns QR code as SVG/PNG. Uses `qrcode` npm package.
- QR encodes: `https://solen.ch/loyalty/stamp?token={qr_token}`.
- Client shows this on their phone → barber scans.

#### [NEW] `app/api/salon/chairs/route.ts`
- **GET**: Get chair config. **PUT**: Update chair count + buffer. Validate with `barberChairsSchema`.
- Only for salons with `barbershop` in categories.

#### [MODIFY] Slot generation cron
- Same pattern as nail stations: if `salon.categories.includes('barbershop')` → check `barber_chairs.chair_count`.

> **Commit**: `git commit -m "phase 6.3: QR code generation + chair management API"`

---

## PROMPT 7 — UI: Walk-In Queue Dashboard

### Phase 7.1: Queue Management Components

#### [NEW] `components/barber/WalkinQueue.tsx`
- Real-time queue list. Each entry: position #, name, service, preferred barber, wait time, join time, method badge (in-person/remote).
- Actions: "Nächster" (move to in_chair), "Nicht erschienen", "Abbrechen".
- "Neuer Walk-In" button → quick add form.
- Real-time updates via Supabase realtime subscription on `barber_walkin_queue`.

#### [NEW] `components/barber/WaitTimeDisplay.tsx`
- Public-facing component: "Aktuelle Wartezeit: ~20 Min. | 4 Personen warten"
- Embeddable on salon profile page + booking page.

#### [NEW] `components/barber/RemoteQueueJoin.tsx`
- Public form: name, phone, preferred barber (optional), service (optional).
- "In Warteschlange einreihen" button.
- Shows confirmation: "Du bist #{position}. Wir senden dir eine SMS wenn du dran bist."
- Queue tracking page: position, wait, status. Auto-refreshes.

> **Commit**: `git commit -m "phase 7.1: walk-in queue dashboard + wait time display + remote join form"`

### Phase 7.2: Queue Integration

#### [MODIFY] Dashboard calendar view
- Show walk-in queue alongside appointments. Walk-ins appear as a separate "Warteschlange" panel next to the calendar.
- Drag walk-in entry to barber column → assigns and starts service.

#### [MODIFY] Salon profile page (`app/[locale]/salon/[slug]/page.tsx`)
- If salon is barbershop AND walk-in queue is enabled → show `<WaitTimeDisplay />` component.
- "Jetzt anstellen" button → opens `<RemoteQueueJoin />`.

> **Commit**: `git commit -m "phase 7.2: queue panel in calendar + wait time on salon page"`

---

## PROMPT 8 — UI: Booking Flow + Express Rebook

### Phase 8.1: Express Rebook Component

#### [NEW] `components/barber/ExpressRebook.tsx`
- Shows on client's home/profile if they have a past barbershop booking.
- Card: "Letzter Termin: Skin Fade + Bart bei Marcus, vor 23 Tagen"
- Big CTA: "Gleich nochmal buchen" → calls express-rebook API → shows suggested slot → "Bestätigen" → done. 2 taps.
- If barber unavailable → falls back to "Nächster verfügbarer Barber".

#### [MODIFY] `components/BookingCalendar.tsx`
- For `category === 'barbershop'`:
  - Simplify service selection (barber menus are SHORT — show all services without scrolling).
  - Show "Letzter Schnitt wiederholen" if cut history exists.
  - Chair availability indicator.
  - After booking: "Regelmässig buchen? Alle {cycle} Wochen?" toggle (creates reminder preference).

> **Commit**: `git commit -m "phase 8.1: express rebook + simplified barber booking flow"`

### Phase 8.2: Barber Profile Page

#### [NEW] `app/[locale]/salon/[slug]/barber/[barberSlug]/page.tsx`
- Public barber profile. Nested under salon for SEO.
- Hero: cover photo, avatar, name, specialty badges, tier, rating, total cuts count.
- Portfolio grid (filterable: fades, lineups, beards, designs).
- Before/after toggle on cards.
- "Bei {name} buchen" CTA → opens booking pre-filled with this barber.
- Shareable link: copy button for social media sharing.
- SEO: `generateMetadata()` with barber name + salon.

#### [MODIFY] Salon barbershop page
- "Unsere Barber" section = grid of barber cards. Each card: photo, name, specialty, rating, "Buchen" CTA.
- Each card links to `/salon/{slug}/barber/{barberSlug}`.

> **Commit**: `git commit -m "phase 8.2: barber profile page + salon roster section"`

---

## PROMPT 9 — UI: CRM Dashboard

### Phase 9.1: Cut History + Client Detail

#### [NEW] `app/[locale]/dashboard/barber-clients/page.tsx`
- Client list with barber-specific data: last cut photo, preferred barber, visit cycle badge, loyalty stamp count.
- Click → client detail with tabs:
  - **Schnitte**: `CutHistoryTimeline` — vertical timeline with photos, cut spec badges, barber name.
  - **Präferenzen**: Editable cut spec (clipper guard, fade type, top style, lineup, beard, product).
  - **Notizen**: Existing `client_notes`.
  - **Treuekarte**: Loyalty card stamp visual + stamp history.

#### [NEW] `components/barber/CutHistoryTimeline.tsx`
- Each entry: date, barber name, photo, cut spec (guard #, fade, top, lineup, beard), notes.
- "Wiederholen" button → express rebook with this exact spec.

#### [MODIFY] `components/dashboard/DashboardLayout.tsx`
- Conditional sidebar item for barbershop salons:
  ```typescript
  { label: "Barber Kunden", href: "/dashboard/barber-clients", icon: Scissors },
  ```

> **Commit**: `git commit -m "phase 9.1: barber CRM dashboard + cut history timeline"`

### Phase 9.2: Leaderboard + Settings

#### [NEW] `components/dashboard/barber/BarberLeaderboard.tsx`
- Internal dashboard (owner + manager only).
- Metrics: bookings count, revenue, client retention %, avg tip, walk-in conversion %, chair utilization.
- Weekly / monthly toggle.
- Sortable by any metric. Anonymizable toggle (shows "Barber A, B, C" instead of names).

#### [NEW] `components/dashboard/barber/ChairManager.tsx`
- Chair count input, buffer minutes. Current utilization bar.
- Same pattern as nail's `StationManager.tsx`.

#### [NEW] `components/dashboard/barber/SmartReminderConfig.tsx`
- Shows clients due for a reminder (from cron notes). "Erinnerung senden" button each.
- Stats: "12 Kunden sind diese Woche fällig" with breakdown by barber.

> **Commit**: `git commit -m "phase 9.2: barber leaderboard + chair manager + smart reminder config"`

---

## PROMPT 10 — UI: Loyalty System

### Phase 10.1: Loyalty Config (Salon Side)

#### [NEW] `components/dashboard/barber/LoyaltyConfig.tsx`
- Setup form: program name, stamps required (default 10), reward type (free service / CHF discount / % discount), reward value.
- Preview: visual stamp card with the configured values.
- Active/inactive toggle.

#### [NEW] `app/[locale]/dashboard/loyalty/page.tsx`
- Loyalty dashboard: active cards, redemption history, conversion metrics.
- "Stempel scannen" button → opens camera → reads QR → calls stamp API.

> **Commit**: `git commit -m "phase 10.1: loyalty program config + salon dashboard"`

### Phase 10.2: Loyalty Card (Client Side)

#### [NEW] `components/barber/LoyaltyCard.tsx`
- Visual stamp card: grid of stamp circles. Filled = ⬛, empty = ⬜.
- Shows: "{stamps}/{required} Stempel | {salon_name}".
- When `status === 'redeemable'` → "🎉 Gratis Schnitt verfügbar!" badge + pulsing glow animation.
- QR code display: tap to expand full-screen for barber to scan.

#### [NEW] `components/barber/LoyaltyCardList.tsx`
- All active loyalty cards across all barbershops.
- Completed/redeemed cards in "Abgeschlossene Karten" collapsible section (never disappear).

#### [MODIFY] Client profile page
- Add "Treuekarten" section showing `<LoyaltyCardList />`.

#### [NEW] `app/[locale]/loyalty/stamp/page.tsx`
- Public page at `solen.ch/loyalty/stamp?token={token}`.
- Barber scans client's QR → lands here → verifies token → shows "Stempel für {client} hinzufügen?" → one tap → done.
- Success animation: stamp appears with a satisfying "pop" effect.

> **Commit**: `git commit -m "phase 10.2: loyalty card UI + QR stamp page + profile integration"`

---

## PROMPT 11 — UI: Barber Discovery + Barbershop Sub-Site

### Phase 11.1: Barbershop Discovery Integration

#### [MODIFY] Existing barbershop sub-site / discovery
- Add barber-specific filter pills: Fade, Lineup, Taper, Beard Sculpting, Hair Design, Classic Cut.
- Before/after pairs in the feed (togglable).
- Cards link to barber's portfolio page (`/salon/{slug}/barber/{barberSlug}`).

#### [MODIFY] Discovery algorithm
- Add barber-specific signals: `fade_type` match, `barber_style` match.
- Weight by barber's retention rate (higher retention = better recommendations).

> **Commit**: `git commit -m "phase 11.1: barber discovery filters + algorithm signals"`

### Phase 11.2: Walk-In Analytics

#### [MODIFY] Dashboard analytics
- New metrics for barbershops: walk-in vs appointment ratio, walk-in conversion rate (walk-in → repeat booker), avg wait time, queue abandonment rate.
- Chair utilization rate chart (per chair per day).

> **Commit**: `git commit -m "phase 11.2: walk-in + chair utilization analytics"`

---

## PROMPT 12 — Translations + Email Templates

### Phase 12.1: i18n Keys

#### [MODIFY] `messages/de.json`, `en.json`, `fr.json`, `it.json`
Add `barber` namespace: queue, rebook, cut history, loyalty, leaderboard, chairs, reminders, discovery.

> **Commit**: `git commit -m "phase 12.1: barber i18n translations (4 locales)"`

### Phase 12.2: Email Templates

#### [MODIFY] `lib/email.ts`
- `barberSmartReminderEmail(customerName, salonName, daysSinceLastCut, avgCycle, bookingUrl)` — 4 locales
- `barberQueuePositionSMS(customerName, position, waitMinutes, salonName)` — short SMS
- `barberYoureNextSMS(customerName, salonName)` — "Du bist dran!"
- `barberLoyaltyRewardEmail(customerName, salonName, rewardDescription)` — "Dein Gratis-Schnitt wartet!"

> **Commit**: `git commit -m "phase 12.2: barber email + SMS templates"`

---

## PROMPT 13 — CLAUDE.md + Docs + Final

### Phase 13.1: CLAUDE.md Update

Add §3.5 features 48-58:
- 48\. Walk-In Queue: Real-time digital queue with estimated wait, remote join, SMS position updates.
- 49\. Express Rebook: One-tap "same as last time" rebooking (2 taps total).
- 50\. Cut Preference History: Per-visit structured record (guard #, fade, top, lineup, beard, product, photo).
- 51\. Barber Profiles: Individual profile pages with vanity URLs, shareable for social media.
- 52\. Smart "Time for a Cut" Reminders: Algorithm-based visit cycle detection + semi-auto reminders.
- 53\. Digital Loyalty Cards: Punch card system with QR scanning, per-barbershop, card history.
- 54\. Barber Leaderboard: Internal dashboard gamification (bookings, revenue, retention, tips).
- 55\. Chair Management: Chair count limiting concurrent bookings + buffer time.
- 56\. Walk-In Analytics: Walk-in vs appointment ratio, conversion, wait times, chair utilization.
- 57\. Barber Portfolio: AI-tagged cut gallery with before/after, filterable by fade/style.
- 58\. Walk-In + Appointment Hybrid Calendar: Side-by-side view of queue and booked appointments.

Add schema tables to §6. Add `lib/barber/`, `components/barber/` to §3.2.

> **Commit**: `git commit -m "phase 13.1: update CLAUDE.md with barber features + schema"`

### Phase 13.2: Category Map Update

#### [MODIFY] `_docs/category-system-map.md`
- Update barbershop section (§4.6) with all implemented features.
- Status: 🔨 Building

> **Commit**: `git commit -m "phase 13.2: update category system map with barber features"`

### Phase 13.3: Final Verification

```bash
npm run build && npx tsc --noEmit
```

> **Commit**: `git commit -m "phase 13.3: clean build verification"`

---

## DEPENDENCY MATRIX

```
Prompt 1 (DB)             → no deps
Prompt 2 (Types/Utils)    → Prompt 1
Prompt 3 (Walk-In API)    → Prompt 2
Prompt 4 (Cut/Profile API)→ Prompt 2
Prompt 5 (Rebook/Remind)  → Prompts 2, 4
Prompt 6 (Loyalty/Chairs) → Prompt 2
Prompt 7 (Queue UI)       → Prompt 3
Prompt 8 (Booking/Profile)→ Prompts 4, 5
Prompt 9 (CRM Dashboard)  → Prompts 4, 5, 6
Prompt 10 (Loyalty UI)    → Prompt 6
Prompt 11 (Discovery)     → Prompt 4
Prompt 12 (i18n)          → Prompts 7-11
Prompt 13 (Docs)          → ALL
```

## FILE MANIFEST

| Category | Count | Files |
|---|---|---|
| New pages | 5 | `salon/[slug]/barber/[barberSlug]`, `dashboard/barber-clients`, `dashboard/loyalty`, `loyalty/stamp`, remote-queue-tracker |
| New components | 15 | WalkinQueue, WaitTimeDisplay, RemoteQueueJoin, ExpressRebook, CutHistoryTimeline, BarberLeaderboard, ChairManager, SmartReminderConfig, LoyaltyConfig, LoyaltyCard, LoyaltyCardList, LoyaltyStampPage |
| New API routes | 16 | walkin/queue, walkin/queue/[id], walkin/queue/remote-join, walkin/queue/status, clients/[id]/cut-history, clients/[id]/repeat-last-cut, barber/[slug], barber/[slug]/portfolio, staff/[id]/slug, bookings/express-rebook, bookings/express-rebook/confirm, salon/loyalty, loyalty/cards, loyalty/stamp, loyalty/redeem, salon/chairs |
| New lib files | 4 | visit-cycle-algorithm, wait-time-calculator, chair-availability, loyalty-qr |
| New migration | 1 | XXX_barber_foundation.sql |
| Modified files | ~12 | types.ts, validations.ts, feature-flags.ts, BookingCalendar.tsx, DashboardLayout.tsx, salon/[slug], discovery-algorithm, generate-slots cron, email.ts, de/en/fr/it.json, CLAUDE.md, category-system-map.md |

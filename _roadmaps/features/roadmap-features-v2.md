# Solen.ch — Feature Expansion Roadmap (Claude Code)

> **Every AI agent MUST read `CLAUDE.md` and `UI_RULES.md` before making ANY changes.**
> **Branch:** `main`
> **Build & safety rules:** See CLAUDE.md Section 10. ONE COMMIT PER SUB-PHASE. `npm run build` must pass before every commit.

**CRITICAL INSTRUCTIONS FOR AI EXECUTION:**
1. **DO NOT** create a new site, new layout, or new design system. **USE the existing `DashboardLayout`** from `components/dashboard/DashboardLayout.tsx` for ALL dashboard pages.
2. **MATCH** the exact styling of `app/[locale]/dashboard/page.tsx` (overview page): glassmorphic cards (`bg-white rounded-card border border-gray-100 shadow-card`), Syne headings, DM Sans body, Space Grotesk numbers, teal `#4ECDC4` / coral `#FF6B6B` / dark `#1A1A2E`.
3. **USE** existing component patterns: `Spinner` from `components/ui/Spinner`, `containerVariants`/`itemVariants` from `lib/animations`, lucide-react icons ONLY.
4. **VERIFY** all imports exist before using them (CLAUDE.md Rule 1). **VERIFY** all API routes exist before calling them (CLAUDE.md Rule 2).
5. Before editing ANY existing file, check the current content first. Do NOT overwrite working code.
6. **Read `UI_RULES.md` before writing any UI.** Light mode only, glassmorphism, no glowing borders, no emoji icons, `lucide-react` only.

**PREREQUISITE:** Phase 0 (environment variables + edge function deployment) has already been completed. The following env vars are set in Vercel:
- `SUPABASE_SERVICE_ROLE_KEY` — ✅ set, 6 edge functions deployed and active
- `RESEND_API_KEY` — ✅ set, domain `solen.ch` verified, emails working
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — ✅ set (live keys)
- `NEXT_PUBLIC_POSTHOG_KEY` — ✅ set (`phc_DnOrvshdGLZItVLwXObzHjaWR4qStwrrh8ZjlYL0CUM`)
- `STRIPE_WEBHOOK_SECRET` — ⚠️ NOT YET SET (set after first production deploy, get from Stripe Dashboard → Webhooks)
- `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` — ⚠️ NOT YET SET (config files exist: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`)

**Last existing migration:** `017_salon_analytics.sql` — all new migrations start at 018.

---

## Phase 1: Admin Dashboard Pages

**Goal:** Build the 4 remaining admin-only dashboard pages. The sidebar nav items already exist in `DashboardLayout.tsx`. The API routes already exist. You are only building the page UIs.

### 1.1 All Salons Page

**File:** `app/[locale]/dashboard/all-salons/page.tsx` (file exists — overwrite its content)

**Data source:** `GET /api/admin/salons?status=pending|active|frozen` — this route ALREADY EXISTS at `app/api/admin/salons/route.ts`. It returns `{ salons: [...] }` where each salon has: `id, name, slug, address, categories, phone, cover_photo_url, is_active, registration_completed, approved_at, rejection_reason, created_at, owner_id, owner_email`.

**UI specification:**
- Wrap entire page in `<DashboardLayout>`, same as `dashboard/page.tsx` does
- Page heading: `<h1 className="font-heading font-bold text-2xl text-dark">Alle Salons</h1>` with subtitle `<p className="text-sm text-dark/40">Alle registrierten Salons verwalten</p>`
- **Tab filters** (horizontal pills, same style as `dashboard/bookings/page.tsx` filter pills):
  - "Aktiv" → fetches `?status=active`
  - "Ausstehend" → fetches `?status=pending`
  - "Eingefroren" → fetches `?status=frozen`
  - Active pill: `bg-teal text-white`, inactive: `bg-white border border-gray-200 text-dark/60 hover:border-teal`
- **Search bar** above the list: `<input placeholder="Salon suchen..." />` styled like other dashboard inputs (`px-3 py-2.5 rounded-button border border-gray-200 text-sm focus:outline-none focus:border-teal`). Filters the displayed list client-side by salon name.
- **Salon list** — each salon is a card (same card style as approvals page):
  ```
  ┌─────────────────────────────────────────────────────┐
  │  [Cover photo thumbnail 40x40]  Salon Name          │
  │                                 owner_email          │
  │                                 address              │
  │  [category pills: teal bg]      Created: dd.mm.yyyy │
  │                                                      │
  │  [Status pill]        [Toggle active] [Bearbeiten →] │
  └─────────────────────────────────────────────────────┘
  ```
- **Status pill:** active = `bg-teal/10 text-teal` "Aktiv", frozen = `bg-coral/10 text-coral` "Eingefroren", pending = `bg-amber-100 text-amber-700` "Ausstehend"
- **Toggle active button:** When admin clicks, call `PATCH /api/admin/salons/{id}/approve` (to activate) or toggle `is_active` via the existing salon PATCH route. Show confirmation modal before deactivating: "Bist du sicher? Der Salon wird für Kunden nicht mehr sichtbar."
- **"Bearbeiten →" link:** Links to `/dashboard/all-salons/{salon.slug}` (future detail page — for now, just link to `/dashboard/settings` as a placeholder)
- **Loading state:** Same `<Spinner size="lg" />` centered pattern
- **Empty state:** Same pattern as approvals page empty state — centered icon + text

### 1.2 All Users Page

**File:** `app/[locale]/dashboard/all-users/page.tsx` (file exists — overwrite its content)

**Data source:** `GET /api/admin/users` — this route ALREADY EXISTS at `app/api/admin/users/route.ts`.

**New database column needed FIRST (create migration before building UI):**
**File:** `supabase/migrations/018_user_suspension.sql` (NEW file)
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
```

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Alle Nutzer" + subtitle "Registrierte Benutzer verwalten"
- **Search bar:** Same style, filter by name or email client-side
- **User list** — each user is a card:
  ```
  ┌─────────────────────────────────────────────────────┐
  │  [Avatar 32x32 circle]  Display Name                │
  │                         email@example.com            │
  │                         Registriert: dd.mm.yyyy      │
  │                                                      │
  │  [Role pill]    [Rolle ändern ▼]  [Sperren/Freigeben]│
  └─────────────────────────────────────────────────────┘
  ```
- **Role pill:** customer = `bg-gray-100 text-dark/50` "Kunde", salon_owner = `bg-teal/10 text-teal` "Salonbesitzer", admin = `bg-coral/10 text-coral` "Admin"
- **"Rolle ändern" dropdown:** A `<select>` or custom dropdown with 3 options: Kunde, Salonbesitzer, Admin. On change, call `PATCH /api/admin/users/{id}` with `{ role: "new_role" }`. If this API route doesn't support role change, ADD it: update the existing route to accept a PATCH method that updates `profiles.role` where caller is admin.
- **"Sperren" button:** Red outline button. Opens confirmation modal: "Benutzer {name} sperren? Der Benutzer kann sich nicht mehr anmelden." On confirm, call `PATCH /api/admin/users/{id}` with `{ is_suspended: true }`. If user is already suspended, show "Freigeben" (green outline) instead.
- **Suspended users** should have a red left border or a subtle red background tint on their card to visually distinguish them.

### 1.3 Platform Analytics Page

**File:** `app/[locale]/dashboard/platform-analytics/page.tsx` (file exists — overwrite its content)

**Data source:** `GET /api/analytics/platform` — this route ALREADY EXISTS at `app/api/analytics/platform/route.ts`. It returns: `{ total_salons, total_bookings_30d, total_revenue_30d, total_users, avg_platform_rating }`.

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Plattform Statistiken" + subtitle "Gesamtübersicht der Plattform"
- **5 stat cards** in a grid (`grid grid-cols-2 sm:grid-cols-5 gap-3`), same `StatCard` pattern as `dashboard/page.tsx`:
  - "Salons" — value: `total_salons`, icon: `Store`, bg: `bg-teal/5`, color: `text-teal`
  - "Nutzer" — value: `total_users`, icon: `UsersRound`, bg: `bg-dark/5`, color: `text-dark`
  - "Buchungen (30T)" — value: `total_bookings_30d`, icon: `Calendar`, bg: `bg-coral/5`, color: `text-coral`
  - "Umsatz (30T)" — value: `total_revenue_30d`, icon: `DollarSign`, bg: `bg-teal/5`, color: `text-teal`, format as `CHF {value}`
  - "Ø Bewertung" — value: `avg_platform_rating`, icon: `Star`, bg: `bg-amber-50`, color: `text-amber-400`, format as X.X
- Use the `useCountUp` hook from `dashboard/page.tsx` for count-up animations on all stat cards. You can copy that hook directly.
- **Charts section** (below stat cards): For now, show a placeholder card with `<BarChart3 size={36} className="mx-auto mb-3 text-teal opacity-40" />` and text "Detailierte Charts werden bald verfügbar." This is fine for V1 — the data for time-series charts needs to be added to the API later.

### 1.4 Revenue Page

**File:** `app/[locale]/dashboard/revenue/page.tsx` (file exists — overwrite its content)

**Data source:** `GET /api/admin/revenue` — this route ALREADY EXISTS at `app/api/admin/revenue/route.ts`.

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Umsatz" + subtitle "Plattform-Einnahmen"
- **3 stat cards** (same style):
  - "GMV (30T)" — total transaction value, icon: `DollarSign`
  - "Plattform-Gebühr (1%)" — `GMV × 0.01`, icon: `Percent`
  - "Transaktionen" — total count of payments, icon: `CreditCard`
- If the API doesn't return this data yet, update the route at `app/api/admin/revenue/route.ts` to query `bookings` table: `SUM(price_paid)` for GMV, `COUNT(*)` where `payment_status IS NOT NULL` for transaction count, and `SUM(platform_fee)` for platform revenue.
- Same count-up animation pattern.
- Placeholder chart section (same as 1.3).

---

## Phase 2: Badge System

**Goal:** Auto-computed + admin-manageable badge system that displays on salon cards. Badges are styled pills with Lucide icons, NOT emoji.

### 2.1 Database Migration

**File:** `supabase/migrations/019_badges.sql` (NEW file)

```sql
-- Badge definitions
CREATE TABLE IF NOT EXISTS salon_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'Star',
  color TEXT NOT NULL DEFAULT '#4ECDC4',
  bg_color TEXT NOT NULL DEFAULT 'rgba(78,205,196,0.1)',
  auto_rule JSONB,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badge assignments to salons
CREATE TABLE IF NOT EXISTS salon_badge_assignments (
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES salon_badges(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES profiles(id),
  is_override_removal BOOLEAN DEFAULT false,
  PRIMARY KEY(salon_id, badge_id)
);

-- Seed default system badges
INSERT INTO salon_badges (name_de, name_en, icon, color, bg_color, auto_rule, is_system) VALUES
  ('Beliebter Salon', 'Popular Salon', 'Star', '#D4AF77', 'rgba(212,175,119,0.1)', '{"type":"rating_and_reviews","min_rating":4.5,"min_reviews":10}', true),
  ('Trending', 'Trending', 'TrendingUp', '#FF6B6B', 'rgba(255,107,107,0.1)', '{"type":"bookings_growth","min_percent":20,"period":"week"}', true),
  ('Neu auf Solen', 'New on Solen', 'Sparkles', '#4ECDC4', 'rgba(78,205,196,0.1)', '{"type":"created_within_days","days":30}', true),
  ('Verifiziert', 'Verified', 'ShieldCheck', '#22C55E', 'rgba(34,197,94,0.1)', '{"type":"verified_within_months","months":6}', true);
```

### 2.2 Badge API Routes

**File:** `app/api/admin/badges/route.ts` (NEW file)
- `GET` — Returns all badges: `SELECT * FROM salon_badges ORDER BY is_system DESC, created_at ASC`. No auth required for GET (public data). Returns `{ badges: [...] }`.
- `POST` — Admin only. Creates a new custom badge. Body: `{ name_de, name_en, icon, color, bg_color }`. Check caller is admin. Insert into `salon_badges` with `is_system = false`. Returns `{ badge: {...} }`.

**File:** `app/api/admin/badges/[id]/route.ts` (NEW file)
- `PATCH` — Admin only. Updates badge `name_de, name_en, icon, color, bg_color`. Cannot change `auto_rule` or `is_system` on system badges.
- `DELETE` — Admin only. Deletes badge. Cannot delete system badges (`is_system = true`). Returns 403 if attempted.

**File:** `app/api/admin/badges/assign/route.ts` (NEW file)
- `POST` — Admin only. Body: `{ salon_id, badge_id, action: "assign" | "remove" | "override_removal" }`.
  - `assign`: Insert into `salon_badge_assignments` with `assigned_by = admin.id`.
  - `remove`: Delete from `salon_badge_assignments`.
  - `override_removal`: Insert into `salon_badge_assignments` with `is_override_removal = true`. This means the auto-computation will NOT re-add this badge even if the salon qualifies. It's a permanent admin override that says "this salon should NOT have this badge."

**File:** `app/api/salons/[slug]/badges/route.ts` (NEW file)
- `GET` — Public. Returns badges for a specific salon. Query: `SELECT sb.* FROM salon_badges sb JOIN salon_badge_assignments sba ON sb.id = sba.badge_id WHERE sba.salon_id = (SELECT id FROM salons WHERE slug = $1) AND sba.is_override_removal = false`. Returns `{ badges: [...] }`.

### 2.3 Admin Badge Manager Page

**File:** `app/[locale]/dashboard/badge-manager/page.tsx` (NEW file)

**Add nav item** in `components/dashboard/DashboardLayout.tsx`: Add to the `ADMIN_NAV` array:
```ts
{ label: "Badges", href: "/dashboard/badge-manager", icon: Award },
```
Import `Award` from `lucide-react` at the top of the file.

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Badge-Verwaltung" + subtitle "Salon-Badges erstellen, bearbeiten und zuweisen"
- **Two sections:**

**Section 1: "Alle Badges"** — Grid of badge cards (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`)
- Each badge card:
  ```
  ┌─────────────────────────────────────────┐
  │  [Icon preview in colored circle]       │
  │  Badge Name (DE)                        │
  │  Badge Name (EN)                        │
  │  [System badge] or [Custom badge] pill  │
  │                                         │
  │  [Bearbeiten]  [Löschen]               │
  └─────────────────────────────────────────┘
  ```
- The icon preview should render the actual Lucide icon dynamically. Use this pattern:
  ```tsx
  import * as LucideIcons from 'lucide-react';
  const IconComponent = (LucideIcons as any)[badge.icon] || LucideIcons.Star;
  ```
  Render: `<div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: badge.bg_color }}><IconComponent size={18} style={{ color: badge.color }} /></div>`
- System badges show a small `bg-gray-100 text-dark/40 text-[10px]` pill saying "System" and their delete button is disabled/hidden.
- Custom badges show a `bg-teal/10 text-teal text-[10px]` pill saying "Custom" and can be deleted.
- **"Bearbeiten" button:** Opens an edit modal (see below).
- **"Löschen" button:** Only on custom badges. Shows confirmation modal: "Badge '{name}' löschen? Es wird von allen Salons entfernt." On confirm, call `DELETE /api/admin/badges/{id}`.

**"Neues Badge erstellen" button** (top right, `bg-teal text-white rounded-button px-4 py-2 text-sm font-medium`): Opens create modal.

**Create/Edit Modal:**
```
┌─────────────────────────────────────────┐
│  × Badge erstellen / bearbeiten         │
│                                          │
│  Name (DE): [________________]           │
│  Name (EN): [________________]           │
│                                          │
│  Icon: [Dropdown with Lucide icons]      │
│  (Show dropdown with ~20 common icons:   │
│   Star, TrendingUp, Sparkles,            │
│   ShieldCheck, Award, Heart, Crown,      │
│   Flame, Zap, ThumbsUp, BadgeCheck,      │
│   Trophy, Gem, Medal, CircleCheck,       │
│   Verified, Bookmark, Eye, Gift, Target) │
│  Each option shows: [icon] + name        │
│                                          │
│  Farbe: [Color input / preset swatches]  │
│  (Presets: #D4AF77 Gold, #4ECDC4 Teal,   │
│   #FF6B6B Coral, #22C55E Green,          │
│   #8B5CF6 Purple, #F59E0B Amber)         │
│                                          │
│  Vorschau: [Live preview of badge pill]  │
│                                          │
│  [Abbrechen]  [Speichern]                │
└─────────────────────────────────────────┘
```

**Section 2: "Badge-Zuweisungen"**
- A search input to find a salon by name
- When a salon is selected, show its current badges with "Entfernen" buttons
- A dropdown to add a new badge to that salon
- A checkbox "Auto-Badge blockieren" — when checked and removed, uses `override_removal` so the auto-computation won't re-add it

### 2.4 Display Badges on Salon Cards

**File:** Modify `components/SalonCard.tsx`

**What to add:** After the salon name and before the location/distance info, add a row of badge pills.

**Data:** The salon card receives salon data as props. Add a `badges` field to the salon data. The component should:
1. Check if `salon.badges` exists and has items
2. Render up to 3 badges as pills: `<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-medium" style={{ color: badge.color, backgroundColor: badge.bg_color }}><IconComponent size={10} />{badge.name_de}</span>`
3. If more than 3 badges, show "+{n}" pill in gray

**Where to fetch badge data:** The API route `GET /api/salons` (or wherever salon cards get their data) should be extended to JOIN badge data. Add this to the salon query:
```sql
-- In the salon list API, after fetching salons, for each salon:
SELECT sb.icon, sb.name_de, sb.color, sb.bg_color
FROM salon_badge_assignments sba
JOIN salon_badges sb ON sb.id = sba.badge_id
WHERE sba.salon_id = $salon_id AND sba.is_override_removal = false
```
Or do a separate batch fetch for all displayed salons.

### 2.5 Nightly Badge Auto-Computation

**File:** Modify `supabase/functions/compute-analytics/index.ts`

**What to add:** After the existing analytics computation loop (after line ~140), add a new section:

1. Fetch all system badges: `SELECT * FROM salon_badges WHERE is_system = true AND auto_rule IS NOT NULL`
2. For each salon that was just analyzed, evaluate each badge's `auto_rule`:
   - `{"type":"rating_and_reviews","min_rating":4.5,"min_reviews":10}`: Check if `salon.average_rating >= 4.5` AND `salon.review_count >= 10`
   - `{"type":"bookings_growth","min_percent":20,"period":"week"}`: Compare this week's bookings to last week's — if growth >= 20%, qualifies
   - `{"type":"created_within_days","days":30}`: Check if `salon.created_at > now() - 30 days`
   - `{"type":"verified_within_months","months":6}`: Check if `salon.last_verified_at > now() - 6 months`
3. If salon qualifies AND no `is_override_removal = true` row exists for this badge, upsert into `salon_badge_assignments` with `assigned_by = null` (auto-assigned)
4. If salon does NOT qualify AND the existing assignment was auto-assigned (`assigned_by IS NULL`), delete the assignment. Do NOT delete manually-assigned badges.

---

## Phase 3: Content Management System (CMS)

**Goal:** Admin can edit homepage content (hero text, testimonials, FAQ, etc.) without touching code. Changes stored in DB, read by Next.js pages.

### 3.1 Database Migration

**File:** `supabase/migrations/020_site_content.sql` (NEW file)

```sql
CREATE TABLE IF NOT EXISTS site_content (
  key TEXT PRIMARY KEY,
  value_de TEXT,
  value_en TEXT,
  value_fr TEXT,
  content_type TEXT DEFAULT 'text',
  category TEXT DEFAULT 'general',
  sort_order INT DEFAULT 0,
  is_auto BOOLEAN DEFAULT false,
  auto_override TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id)
);

-- RLS: anyone can read, only admins can write
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_content_read_public" ON site_content FOR SELECT USING (true);
CREATE POLICY "site_content_write_admin" ON site_content FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Seed current hardcoded content
INSERT INTO site_content (key, value_de, value_en, content_type, category, sort_order) VALUES
  ('hero_title', 'Dein Salon. Dein Stil. Dein Termin.', 'Your Salon. Your Style. Your Appointment.', 'text', 'hero', 0),
  ('hero_subtitle', 'Entdecke die besten Salons in Basel und buche deinen nächsten Termin in Sekunden.', 'Discover the best salons in Basel and book your next appointment in seconds.', 'text', 'hero', 1),
  ('hero_cta', 'Jetzt entdecken', 'Discover now', 'text', 'hero', 2),
  ('announcement_banner', '', '', 'text', 'banner', 0),
  ('stats_bookings', '0', '0', 'number', 'stats', 0),
  ('stats_salons', '0', '0', 'number', 'stats', 1),
  ('stats_users', '0', '0', 'number', 'stats', 2)
ON CONFLICT (key) DO NOTHING;
```

### 3.2 Content API Routes

**File:** `app/api/content/route.ts` (NEW file)
- `GET /api/content?keys=hero_title,hero_subtitle,...&locale=de` — Public. Returns `{ content: { hero_title: "value", ... } }`. For each key, return the value for the requested locale (`value_de`, `value_en`, or `value_fr`). If `is_auto = true` and `auto_override` is set, return `auto_override` instead of the auto-computed value.

**File:** `app/api/admin/content/[key]/route.ts` (NEW file)
- `PUT` — Admin only. Body: `{ value_de, value_en, value_fr }` or `{ auto_override }` (for auto fields). Updates `site_content` row. Sets `updated_at = NOW()` and `updated_by = admin.id`.

### 3.3 Admin Content Editor Page

**File:** `app/[locale]/dashboard/content-editor/page.tsx` (NEW file)

**Add nav item** in `components/dashboard/DashboardLayout.tsx`: Add to `ADMIN_NAV`:
```ts
{ label: "Inhalte", href: "/dashboard/content-editor", icon: FileEdit },
```
Import `FileEdit` from `lucide-react`.

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Inhalte bearbeiten" + subtitle "Website-Texte und Inhalte verwalten"
- **Tabs** by category (use the same pill-filter pattern from bookings page):
  - "Hero" — shows `hero_title`, `hero_subtitle`, `hero_cta` as editable text inputs
  - "Statistiken" — shows `stats_bookings`, `stats_salons`, `stats_users` with an "Auto" badge and an override toggle. When auto, shows the computed value grayed out. When override enabled, shows an editable input.
  - "Testimonials" — list of testimonial entries. Each entry has: name, text, rating (1-5). Add/edit/remove buttons. Store as individual rows with keys like `testimonial_1`, `testimonial_2`. Content type: `json`, value: `{"name":"Lisa M.","text":"Toller Service!","rating":5}`.
  - "FAQ" — list of FAQ entries. Each has: question + answer. Add/edit/remove. Same json pattern.
  - "Banner" — single text input for `announcement_banner`. If empty, no banner shown. Toggle to enable/disable.
  - "Für Salonbesitzer" — editable selling points text

**For each editable field:**
- Show the field label in small caps
- Show a `<textarea>` or `<input>` pre-filled with current value
- Show "Deutsch" and "English" tabs for locale variants
- "Speichern" button per field (calls `PUT /api/admin/content/{key}`)
- Show "Zuletzt geändert: {date}" in small gray text

---

## Phase 4: Review Moderation + Auto-Mod

**Goal:** Auto-flag bad reviews (slurs, spam, fake), hide them from public, let admin approve/delete. Let salon owners respond publicly.

### 4.1 Database Migration

**File:** `supabase/migrations/021_review_moderation.sql` (NEW file)

```sql
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_response_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS salon_response TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS salon_response_at TIMESTAMPTZ;
```

### 4.2 Auto-Mod Library

**File:** `lib/automod.ts` (NEW file)

This file exports a function `checkReview(review: { comment: string; rating: number; user_id: string; salon_id: string; user_created_at: string }) => { flagged: boolean; hidden: boolean; reason: string | null }`.

**Rules (checked in order, stop at first match):**

1. **Slur filter:** Maintain a `BLOCKED_WORDS` array containing offensive/racial slurs in German, English, and French. At minimum include: common racial slurs, homophobic slurs, sexist slurs, and extreme profanity. Check if `comment.toLowerCase()` contains any of these words (word-boundary match, not substring — e.g. "grass" should not match "ass"). If matched: `{ flagged: true, hidden: true, reason: "Enthält unangemessene Sprache" }`.

2. **Too short:** If `comment.length < 10`: `{ flagged: true, hidden: false, reason: "Sehr kurzer Kommentar" }`. (Flagged for admin review but NOT hidden — customer can still see it.)

3. **Duplicate text:** Before inserting, query: `SELECT id FROM reviews WHERE user_id = $user_id AND comment = $comment AND id != $current_id`. If found: `{ flagged: true, hidden: true, reason: "Doppelter Kommentar" }`.

4. **Suspicious rating burst (fake 5-stars):** Query: `SELECT COUNT(*) FROM reviews WHERE salon_id = $salon_id AND rating = 5 AND created_at > NOW() - INTERVAL '24 hours'`. Also check how many of those reviewers have `profiles.created_at > NOW() - INTERVAL '48 hours'`. If 3+ five-star reviews from accounts less than 48h old within 24h: `{ flagged: true, hidden: true, reason: "Verdächtige Bewertungshäufung" }`.

5. **Review bombing (fake 1-stars):** Same logic but for `rating = 1`. If 3+ one-star reviews from new accounts in 24h: `{ flagged: true, hidden: true, reason: "Verdächtiges Bewertungsmuster" }`.

6. **No issues:** `{ flagged: false, hidden: false, reason: null }`.

### 4.3 Update Review Submission

**File:** Modify `app/api/reviews/route.ts`

In the `POST` handler, AFTER validating the review data but BEFORE inserting into the database:
1. Import and call `checkReview()` from `lib/automod.ts`
2. Add the returned `is_flagged`, `is_hidden`, `flag_reason` to the INSERT payload
3. The review is still inserted (not rejected) — it's just flagged/hidden

### 4.4 Update Review Display

**File:** Wherever reviews are shown to the public (monolith `index.html` or `app/api/reviews/salon/[salon_id]/route.ts`)
- Add `.eq("is_hidden", false)` to the public reviews query so hidden reviews don't show up

### 4.5 Review Moderation Admin Page

**File:** `app/[locale]/dashboard/review-moderation/page.tsx` (NEW file)

**Add nav item** in `components/dashboard/DashboardLayout.tsx`: Add to `ADMIN_NAV`:
```ts
{ label: "Bewertungen", href: "/dashboard/review-moderation", icon: MessageSquareWarning },
```
Import `MessageSquareWarning` from `lucide-react`.

**UI specification:**
- Wrap in `<DashboardLayout>`
- Page heading: "Bewertungs-Moderation" + subtitle "Gemeldete und neue Bewertungen prüfen"
- **Two tabs:** "Gemeldet ({count})" / "Alle Bewertungen"
- **Flagged tab** fetches: `GET /api/admin/reviews?flagged=true` (NEW route)
- **All tab** fetches: `GET /api/admin/reviews` (NEW route)

**Each review card:**
```
┌──────────────────────────────────────────────────┐
│  ★★★★☆  Kunde: Max M.  ·  Salon: Studio Bella   │
│  "Der Service war ok aber nichts besonderes"      │
│                                                    │
│  [Flag reason pill: "Sehr kurzer Kommentar"]       │
│  [Hidden badge: "Versteckt" in coral if hidden]    │
│                                                    │
│  Admin-Antwort: [textarea, if not yet responded]   │
│                                                    │
│  [Genehmigen]  [Verstecken]  [Löschen]            │
│                 (unflag+unhide)  (toggle hidden)  (permanent) │
└──────────────────────────────────────────────────┘
```
- **"Genehmigen"** (teal button): Sets `is_flagged = false, is_hidden = false`
- **"Verstecken"** (gray button): Sets `is_hidden = true` (keeps it flagged for record)
- **"Löschen"** (coral button): Permanently deletes. Confirmation modal: "Bewertung endgültig löschen?"
- **Admin response textarea:** Inline below the review. "Öffentliche Antwort schreiben" placeholder. Save button. Calls `PATCH /api/admin/reviews/{id}` with `{ admin_response: "...", admin_response_at: now }`.

### 4.6 Admin Reviews API

**File:** `app/api/admin/reviews/route.ts` (NEW file)
- `GET /api/admin/reviews?flagged=true` — Admin only. Returns all reviews (or filtered by flagged). Include salon name, customer name. Order by `created_at DESC`.

**File:** `app/api/admin/reviews/[id]/route.ts` (NEW file)
- `PATCH` — Admin only. Body can include: `{ is_flagged, is_hidden, admin_response, admin_response_at }`.
- `DELETE` — Admin only. Permanently removes the review. Also triggers `update_salon_rating()` to recalculate salon's average (the trigger already handles inserts — add a trigger for DELETE too if it doesn't exist).

### 4.7 Salon Owner Review Response

**File:** Add a new nav item to the salon owner's sidebar in `DashboardLayout.tsx` — add to the `NAV` array (NOT `ADMIN_NAV`):
```ts
{ label: "Bewertungen", href: "/dashboard/reviews", icon: Star },
```
Put it after "Statistiken" and before "Einstellungen".

**File:** `app/[locale]/dashboard/reviews/page.tsx` (NEW file)
- Wrap in `<DashboardLayout>`
- Page heading: "Bewertungen" + subtitle "Kundenbewertungen lesen und antworten"
- Fetches: `GET /api/reviews/salon/{salon_id}` (ALREADY EXISTS)
- Each review shows: stars, customer name, comment, date
- If `salon_response` exists: show it in a teal-tinted box below the review
- If no response yet: show a "Antwort schreiben" button that expands an inline textarea. On save, call `PATCH /api/reviews/{id}/respond` with `{ salon_response: "..." }`.

**File:** `app/api/reviews/[id]/respond/route.ts` (NEW file)
- `PATCH` — Salon owner only (verify caller owns the salon that the review belongs to). Sets `salon_response` and `salon_response_at`. Cannot edit/delete the review itself.

---

## Phase 5: Checkout Page + Cancellation Policy

**Goal:** Build the checkout UI (Stripe Payment Element), and make cancellation policies configurable per salon.

### 5.1 Database Migration

**File:** `supabase/migrations/022_cancellation_policy.sql` (NEW file)
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_type TEXT DEFAULT 'free' CHECK (cancellation_fee_type IN ('free', 'flat', 'percentage'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_fee_value NUMERIC(8,2) DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS free_cancel_hours INT DEFAULT 24;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_to TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reschedule_status TEXT CHECK (reschedule_status IN ('pending', 'approved', 'rejected'));
```

### 5.2 Cancellation Policy Settings (Enhance Existing Settings Tab)

**File:** Modify `app/[locale]/dashboard/settings/page.tsx`

Replace the existing static "Stornierung" tab content (around line 493-500) with a real form:

**UI for the Cancellation tab content:**
- **Fee type selector** — 3 radio options styled as cards (like the cancel reason radios in bookings page):
  - "Kostenlose Stornierung" — `cancellation_fee_type = 'free'`
  - "Pauschale Gebühr" — `cancellation_fee_type = 'flat'`, shows CHF input field
  - "Prozentual" — `cancellation_fee_type = 'percentage'`, shows % input field
- **Free cancellation window** — Dropdown or number input: "Kostenlose Stornierung bis X Stunden vor dem Termin". Options: 6h, 12h, 24h, 48h, 72h.
- **Save button** — calls `PATCH /api/salons/{id}` with the policy fields
- **Preview text** at the bottom: "Kunden sehen: 'Kostenlose Stornierung bis {X}h vorher. Danach wird eine Gebühr von CHF {Y} / {Z}% fällig.'"

### 5.3 Checkout Page

**File:** `app/[locale]/checkout/page.tsx` (file exists — may need full build)

**Dependencies:** Ensure `@stripe/stripe-js` and `@stripe/react-stripe-js` are installed. If not, run: `npm install @stripe/stripe-js @stripe/react-stripe-js`

**Flow:** The booking wizard (monolith) redirects here with query params: `?salon_id=X&service_id=Y&slot_id=Z&staff_id=W`

**UI layout:**
```
┌──────────────────────────────────────────┐
│  ← Zurück                               │
│                                          │
│  Buchungsübersicht                       │
├──────────────────────────────────────────┤
│  📍 Salon Name · Quartier               │
│  📅 Montag, 24. März 2026 · 14:00       │
│  👤 Staff Name (if selected)             │
├──────────────────────────────────────────┤
│                                          │
│  Service Name              CHF 45.00     │
│  ─────────────────────────────────────   │
│  Geschätzter Gesamtpreis   CHF 45.00     │
│                                          │
│  Kaution (No-Show-Schutz)  CHF 20.00     │
│  (wird bei Erscheinen verrechnet)        │
│  ─────────────────────────────────────   │
│  Jetzt zu zahlen           CHF 20.00     │
│  Restbetrag vor Ort        CHF 25.00     │
│                                          │
├──────────────────────────────────────────┤
│  Stripe Payment Element                  │
│  (Cards, Apple Pay, TWINT)               │
├──────────────────────────────────────────┤
│  [ Jetzt buchen · CHF 20.00 ]           │
│  Kostenlose Stornierung bis 24h vorher   │
└──────────────────────────────────────────┘
```

**Implementation steps:**
1. Read query params, fetch salon details from `GET /api/salons/{slug}`, service details, slot details
2. Load Stripe with `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`
3. On "Jetzt buchen" click: call `POST /api/stripe/create-payment-intent` (ALREADY EXISTS) with `{ salon_id, service_name, estimated_price, deposit_amount }`
4. Use Stripe `PaymentElement` to render the payment form
5. On payment success: create the booking via `POST /api/bookings` (ALREADY EXISTS), redirect to confirmation page
6. **Styling:** Glassmorphic card (`bg-white/80 backdrop-blur-xl rounded-card border border-gray-100 shadow-card`), teal accent on button, Space Grotesk for prices

**For salons WITHOUT online payment:** Skip checkout entirely — the booking is created directly with `payment_status: 'none'` and shows "Zahlung vor Ort" on the confirmation.

### 5.4 Reschedule API

**File:** `app/api/bookings/[id]/reschedule/route.ts` (NEW file)
- `POST` — Customer only. Body: `{ new_slot_id }`. Sets `reschedule_requested_at = NOW()`, `reschedule_to = new_slot.starts_at`, `reschedule_status = 'pending'`. Sends email to salon owner.
- `PATCH` — Salon owner only. Body: `{ action: "approve" | "reject" }`. If approved: update booking's `starts_at`, `ends_at`, `slot_id` to the new slot, set `reschedule_status = 'approved'`. If rejected: set `reschedule_status = 'rejected'`, notify customer.

---

## Phase 6: Auto-Analytics Engine Enhancement

**Goal:** Extend the existing `compute-analytics` edge function to also compute platform-wide stats and salon explore scores.

### 6.1 Database Migration

**File:** `supabase/migrations/023_platform_stats.sql` (NEW file)
```sql
CREATE TABLE IF NOT EXISTS platform_stats (
  key TEXT PRIMARY KEY,
  value NUMERIC DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salons ADD COLUMN IF NOT EXISTS explore_score NUMERIC(5,2) DEFAULT 0;
```

### 6.2 Extend compute-analytics Edge Function

**File:** Modify `supabase/functions/compute-analytics/index.ts`

**After** the existing salon analytics loop (after the `processed++` line, around line 138), add:

**Platform stats computation:**
```ts
// Platform-wide stats
const { count: totalSalons } = await admin.from("salons").select("id", { count: "exact", head: true }).eq("is_active", true);
const { count: totalUsers } = await admin.from("profiles").select("id", { count: "exact", head: true });
const { data: allBookings } = await admin.from("bookings").select("price_paid").in("status", ["confirmed", "completed"]);
const totalBookings = allBookings?.length ?? 0;
const avgSpending = totalBookings > 0 ? (allBookings ?? []).reduce((s, b) => s + (b.price_paid ?? 0), 0) / totalBookings : 0;

for (const [key, val] of Object.entries({
  total_salons: totalSalons ?? 0,
  total_users: totalUsers ?? 0,
  total_bookings: totalBookings,
  avg_spending: Math.round(avgSpending * 100) / 100,
})) {
  await admin.from("platform_stats").upsert({ key, value: val, computed_at: new Date().toISOString() }, { onConflict: "key" });
}
```

**Salon explore score computation** (add after platform stats):
```ts
// Compute explore score for each salon
for (const salon of salons) {
  const { data: analytics } = await admin.from("salon_analytics")
    .select("total_bookings, total_reviews, avg_rating")
    .eq("salon_id", salon.id)
    .order("period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { count: views7d } = await admin.from("salon_page_views")
    .select("id", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .gte("viewed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const rating = analytics?.avg_rating ?? 0;
  const bookings = analytics?.total_bookings ?? 0;
  const reviews = analytics?.total_reviews ?? 0;
  const pageViews = views7d ?? 0;

  const score = (0.4 * rating) + (0.3 * Math.min(bookings / 10, 3)) + (0.2 * Math.min(reviews / 5, 2)) + (0.1 * Math.min(pageViews / 50, 1));

  await admin.from("salons").update({ explore_score: Math.round(score * 100) / 100 }).eq("id", salon.id);
}
```

---

## Phase 7: Smart Notifications & Nudges

### 7.1 Database Migration

**File:** `supabase/migrations/024_nudge_tracking.sql` (NEW file)
```sql
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS avg_booking_interval_days INT;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS last_nudge_sent_at TIMESTAMPTZ;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS welcome_step INT DEFAULT 0;
```

### 7.2 Email Templates

**File:** Modify `lib/email.ts` — ADD these new functions (do NOT modify or delete existing functions):

```ts
export function rebookingNudge(to: string, vars: { service: string; salon: string; daysSince: number }, locale: EmailLocale = "de"): EmailPayload { /* ... DE/EN/FR templates */ }
export function reviewPrompt(to: string, vars: { service: string; salon: string; reviewUrl: string }, locale: EmailLocale = "de"): EmailPayload { /* ... */ }
export function welcomeEmail(to: string, vars: { name: string }, locale: EmailLocale = "de", step: 1 | 2 | 3): EmailPayload { /* ... */ }
```

### 7.3 Smart Nudges Edge Function

**File:** `supabase/functions/smart-nudges/index.ts` (NEW file)

Scheduled daily at 10:00 (`"0 10 * * *"`). Logic:
1. **Re-booking nudge:** For each user with `user_preferences.avg_booking_interval_days` set: if `last booking starts_at + avg_interval < NOW()` and `last_nudge_sent_at` is null or > 7 days ago: send re-booking email. Default interval: 28 days.
2. **Review prompt:** For each booking with `status = 'completed'` and `ends_at < NOW() - 2 hours` and no matching review exists: send review prompt email. Only once per booking.
3. **Welcome series:** For users with `welcome_step < 3` and `created_at` matching: step 1 = day 0, step 2 = day 3, step 3 = day 7.

---

## Phase 8: Smart Recommendations

### 8.1 Recommendations API

**File:** `app/api/salons/recommendations/route.ts` (NEW file)
- `GET /api/salons/recommendations?user_id=X` — Returns personalized salon list based on `user_preferences` (favorite quartiers + favorite services). Falls back to highest `explore_score` if no preferences exist.
- `GET /api/salons/similar?salon_id=X` — Returns 4 salons with same category + similar price range + adjacent quartier.

### 8.2 Explore Page Integration

This depends on whether modifying the monolith or Next.js pages. For the Next.js approach:
- Add a "Für dich empfohlen" section component that fetches from the recommendations API
- For logged-out users, show "Beliebt in Basel" instead (highest explore_score salons)

---

## Phase 9: Waitlist System

### 9.1 Database Migration

**File:** `supabase/migrations/025_waitlist.sql` (NEW file)
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  preferred_date DATE,
  preferred_time_range TEXT DEFAULT 'any' CHECK (preferred_time_range IN ('morning', 'afternoon', 'evening', 'any')),
  notified_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, salon_id, service_id, preferred_date)
);
```

### 9.2 Waitlist API

**File:** `app/api/waitlist/route.ts` (NEW file)
- `POST` — Authenticated. Body: `{ salon_id, service_id, preferred_date, preferred_time_range }`. Inserts into waitlist.
- `GET ?salon_id=X` — Salon owner only. Returns waitlist entries for their salon.

### 9.3 Auto-Notify on Cancellation

**File:** Modify `app/api/bookings/[id]/cancel/route.ts`
After cancelling and freeing the slot, add:
```ts
// Check waitlist for matching entries
const { data: waitlistEntries } = await admin.from("waitlist")
  .select("*, profiles!user_id(locale)")
  .eq("salon_id", booking.salon_id)
  .eq("service_id", booking.service_id)
  .eq("preferred_date", cancelledSlotDate)
  .is("notified_at", null)
  .order("created_at", { ascending: true })
  .limit(1);

if (waitlistEntries?.[0]) {
  // Send notification email, update notified_at
}
```

---

## Phase 10: Salon Comparison

### 10.1 Compare Bar Component

**File:** `components/CompareBar.tsx` (NEW file)
- Floating bar at bottom of explore page (above mobile nav): "X Salons ausgewählt — Vergleichen →"
- Uses React context or simple state lifted to explore page

### 10.2 Compare Drawer Component

**File:** `components/CompareDrawer.tsx` (NEW file)
- Slide-up drawer (framer-motion `AnimatePresence`), 85% height, glassmorphic backdrop
- Side-by-side salon cards: rating, price range, categories, opening hours, review count
- "Jetzt buchen" button per salon
- Close "×" button top right

### 10.3 SalonCard Checkbox

**File:** Modify `components/SalonCard.tsx`
- Add a small checkbox in the top-right corner of the card image
- Only visible when `showCompare` prop is true (passed from explore page)
- When checked, adds salon to comparison context (max 2)

---

## Phase 11: Customer Segments

### 11.1 Database Migration

**File:** `supabase/migrations/026_segments.sql` (NEW file)
```sql
CREATE TABLE IF NOT EXISTS customer_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  auto_rule JSONB NOT NULL,
  icon TEXT DEFAULT 'Users',
  color TEXT DEFAULT '#4ECDC4',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_segment_members (
  segment_id UUID REFERENCES customer_segments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(segment_id, user_id)
);

INSERT INTO customer_segments (name, description, auto_rule, icon, color) VALUES
  ('Power Bookers', '3+ Buchungen im letzten Monat', '{"type":"bookings_gte","value":3,"period_days":30}', 'Zap', '#FF6B6B'),
  ('High Spenders', 'Durchschnittliche Buchung > CHF 80', '{"type":"avg_price_gte","value":80}', 'DollarSign', '#D4AF77'),
  ('At Risk', 'War aktiv, aber keine Buchung seit 45+ Tagen', '{"type":"inactive_days","min_bookings":3,"inactive_days":45}', 'AlertTriangle', '#F59E0B'),
  ('New Users', 'Registriert vor weniger als 14 Tagen', '{"type":"registered_within_days","days":14}', 'UserPlus', '#4ECDC4'),
  ('Loyal', '10+ Buchungen insgesamt', '{"type":"total_bookings_gte","value":10}', 'Heart', '#EC4899');
```

### 11.2 Segments Admin Page

**File:** `app/[locale]/dashboard/segments/page.tsx` (NEW file)

**Add nav item** in `DashboardLayout.tsx` `ADMIN_NAV`:
```ts
{ label: "Segmente", href: "/dashboard/segments", icon: PieChart },
```

**UI:** Grid of segment cards with member count, click to expand member list, "E-Mail senden" button per segment.

### 11.3 Nightly Segment Computation

**File:** Extend `supabase/functions/compute-analytics/index.ts`
After badge computation, evaluate segment rules for all users and upsert into `customer_segment_members`.

---

## Build Order

```
Phase 1 → Admin pages (new pages only, zero breaking risk)
Phase 2 → Badges (new tables + new pages + SalonCard enhancement)
Phase 3 → CMS (new table + new page + new API)
Phase 4 → Review moderation (extends reviews + new pages)
Phase 5 → Checkout + cancellation (new page + extends settings)
Phase 6 → Analytics enhancement (extends edge function)
Phase 7 → Notifications (new edge function + email templates)
Phase 8 → Recommendations (new API + page section)
Phase 9 → Waitlist (new table + API + booking modification)
Phase 10 → Comparison (new components + SalonCard modification)
Phase 11 → Segments (new tables + page + edge function extension)
```

Each phase: one commit per sub-phase. `npm run build` must pass. `git push`. Verify Vercel deployment.

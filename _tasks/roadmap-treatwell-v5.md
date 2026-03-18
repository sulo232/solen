# 🏆 Solen.ch Treatwell-Beater Roadmap v5

> **~90 features from gap analysis | 15 phases | User confirmed ALL except gift cards + multi-currency + blog**
> Follows CLAUDE.md rules. Each phase separated into: 🎨 UI, 🔧 Backend, 🗄️ Migrations, ⚠️ Cautions.
> See `_tasks/MANUAL-STEPS-v5.md` for work requiring human intervention.

---

## ⚠️ CLAUDE CODE MASTER INSTRUCTIONS

```
BEFORE each phase: Re-read THIS roadmap for current phase + CLAUDE.md
DURING each phase: Only touch listed files. All new components use Tailwind from tailwind.config.js.
AFTER each sub-phase:
  1. npm run build (MUST pass)
  2. npx tsc --noEmit
  3. git add [phase files only] && git commit -m "v5-phase X.Y: [desc]"
  4. git push origin main
  5. Wait 60s, curl https://www.solen.ch/de/ → 200/307
  6. If fail: STOP, debug, fix, re-push
```

---

## Phase 1: Treatment-Level Search & Category Tree (~6h) 🔴

**Goal:** Users can search by treatment name and browse 3-level category tree.

### 🗄️ Migrations
**[NEW] Migration 044: `service_categories`**
```sql
CREATE TABLE service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_de text NOT NULL,
  name_en text,
  name_fr text,
  name_it text,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES service_categories(id),
  icon_name text, -- lucide icon name
  sort_order int DEFAULT 0,
  level int DEFAULT 1 CHECK (level >= 1 AND level <= 3)
);
-- Seed: Coiffeur > Damen > Balayage, Damen > Strähnen, Herren > Fade, etc.
-- ~80 rows covering hair, nails, spa, makeup, waxing, barbershop
```

**[NEW] Migration 045: `booking_waitlist`**
```sql
CREATE TABLE booking_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salon_id uuid NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id),
  preferred_date date,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting','notified','booked','expired')),
  created_at timestamptz DEFAULT now()
);
```

### 🔧 Backend (API Routes)

**[NEW] `app/api/search/treatments/route.ts`**
- GET: `?treatment=balayage&city=basel` → returns salons offering that service with price
- JOINs `services` + `salons` + `service_categories`, filters by category slug
- Returns: salon name, slug, photo, rating, service price, duration

**[NEW] `app/api/categories/route.ts`**
- GET: returns full category tree (3 levels deep)
- Cached 5min (salon additions are rare)

**[NEW] `app/api/bookings/waitlist/route.ts`**
- POST: add to waitlist, GET: list user's waitlists, DELETE: remove

**[MODIFY] `app/api/salons/search/route.ts`**
- Add `?min_rating=4.5` filter param
- Add `?category_slug=damen-balayage` param
- Add `?sort=price_asc|rating_desc|distance` param
- Return `min_price` (cheapest service) in each salon result

### 🎨 UI (Components + Pages)

**[NEW] `app/[locale]/behandlungen/[...slug]/page.tsx`** — Treatment results page
- Dynamic route: `/behandlungen/coiffeur/damen/balayage` or just `/behandlungen/balayage`
- Shows all salons offering that treatment, with treatment-specific price
- Sort: cheapest first / best rated / nearest
- Filters: district, price range, rating, available today

**[NEW] `components/ui/QuickPreviewSheet.tsx`** — Bottom sheet (mobile) / side panel (desktop)
- Triggered by tapping salon card in search results
- Shows: salon photo, name, rating, hours, top 3 services with prices
- Buttons: "Mehr anzeigen" (full page) + "Buchen" (start booking)
- Swipe down to close (mobile), click outside to close (desktop)
- DO NOT replace full-page navigation — this is an ADDITION

**[NEW] `components/ui/CategoryTree.tsx`** — 3-level category sidebar
- Desktop: sticky left sidebar with collapsible tree
- Mobile: horizontal scrollable chips (level 1) + dropdown (level 2+3)
- Each leaf links to `/behandlungen/[slug]`

**[MODIFY] `components/SalonCard.tsx`**
- Add `minPrice` prop → show "ab CHF X" badge
- Add `featuredServices` prop → show on hover (desktop) / expand (mobile): top 2 services with prices
- Add `onQuickPreview` callback → opens QuickPreviewSheet instead of navigating
- Add "📍 Auf Karte" link if map view is available

**[MODIFY] `components/FilterBar.tsx`**
- Add rating dropdown: "Alle / 4+ / 4.5+ / 5"
- Add sort dropdown: "Relevanz / Günstigste / Beste Bewertung / Nächster Termin"
- Add "Nebenzeiten 🏷️" chip (link to off-peak_slots)
- Wire all to URL params

> [!CAUTION]
> Don't break existing category pages (`/coiffeur`, `/barbershop` etc.) — they should redirect to or integrate with the new category tree.
> The QuickPreviewSheet must NOT prevent full-page navigation. Both must work.
> Service categories seed data must match existing `services.category` values.

---

## Phase 2: Salon Profile Premium (~4h) 🟡

**Goal:** Every salon page looks like Treatwell quality — verified reviews, hours, nearby salons.

### 🎨 UI

**[MODIFY] `app/[locale]/salon/[slug]/page.tsx`**
1. Add "✓ Verifiziert" badge on reviews that have a `booking_id`
2. Add review star breakdown (5★: 87%, 4★: 10% etc.) — horizontal bar chart
3. Add review sort dropdown: newest / highest / lowest
4. Add "Saloninfo" structured section: Atmosphäre, Expertise, Produkte, ÖV-Anbindung
5. Opening hours: desktop = full table always visible, mobile = collapsed with "Heute: 09:00–18:00" preview
6. "Ähnliche Salons in der Nähe" section (3-4 same-category salons, PostGIS distance)
7. Per-service "Buchen" button on each service row (pre-selects that service)
8. "Buchen" button + checkbox mode for multi-service cart
9. Clickable review count → smooth scroll to reviews section
10. Sticky mobile CTA: wire existing `StickyMobileCTA.tsx` to salon detail page

**[NEW] `components/ReviewBreakdown.tsx`** — Star distribution chart
**[NEW] `components/NearbySlalons.tsx`** — PostGIS distance query, 3-4 cards

### 🔧 Backend

**[NEW] `app/api/salons/[slug]/nearby/route.ts`**
- GET: returns 4 salons same category, sorted by distance
- Needs latitude/longitude on both salons

**[MODIFY] `app/api/reviews/salon/[salon_id]/route.ts`**
- Add `?sort=newest|highest|lowest` param
- Add `is_verified` computed field (boolean, true if booking_id exists)

### 🗄️ Migrations

**[NEW] Migration 046: Salon info fields**
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS atmosphere text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS expertise text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS products text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS nearest_transport text;
```

> [!CAUTION]
> Don't overwrite existing salon description. These are ADDITIONAL fields.
> The "Buchen" per-service button must pre-select that service in BookingCalendar without breaking the existing flow.

---

## Phase 3: Booking Engine Upgrade (~4h) 🔴

**Goal:** Grey out unavailable dates + waitlist, salon-controlled deposits, booking emails.

### 🎨 UI

**[MODIFY] `components/BookingCalendar.tsx`**
1. Grey out fully booked dates (disable click)
2. Small 📋 icon on greyed dates → tap opens "Warteliste" modal with "Benachrichtige mich"
3. Auto-select next available date on load
4. Show cancellation policy banner prominently before payment step
5. Add "Nach dem Termin kann der Salon den Preis anpassen. Du hast 48h zum Bestätigen." text

**[NEW] `components/WaitlistModal.tsx`** — email notification signup for booked-out dates

**[MODIFY] Checkout flow**
- Support 3 payment modes based on `salons.payment_mode`:
  - `prepay`: full Stripe payment required
  - `deposit`: Stripe holds X% (configurable per salon)
  - `at_salon`: no payment, booking confirmed immediately
- Show payment method icons (Visa, Mastercard, TWINT, Apple Pay)

### 🔧 Backend

**[MODIFY] `app/api/availability/[salon_id]/route.ts`**
- Return `fully_booked_dates[]` array for the month (dates with 0 available slots)

**[NEW] `app/api/bookings/waitlist/route.ts`** (already in Phase 1 migration)
- POST: subscribe to date, GET: user's waitlists

**Email (Resend):**
- Booking confirmation email template:
  - Salon photo + name + service + date + time + price
  - .ics calendar attachment
  - Google Maps directions link
  - Cancel/reschedule link
  - "Teilen" button (generates shareable link)
  - Review link (activates only after appointment date)

### 🗄️ Migrations

**[NEW] Migration 047: Payment modes**
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS payment_mode text DEFAULT 'at_salon'
  CHECK (payment_mode IN ('prepay', 'deposit', 'at_salon'));
ALTER TABLE salons ADD COLUMN IF NOT EXISTS deposit_percent int DEFAULT 20
  CHECK (deposit_percent >= 5 AND deposit_percent <= 100);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_hours int DEFAULT 24;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS late_cancel_fee_percent int DEFAULT 50;
```

> [!CAUTION]
> Default payment_mode = 'at_salon' (least friction). Don't break existing bookings.
> SMS reminders need seven.io or Supabase Edge Function cron — see MANUAL-STEPS-v5.md.

---

## Phase 4: SEO & Discovery Pages (~3h) 🟡

**Goal:** Google-indexable city+category pages, structured data, sitemap.

### 🎨 UI

**[NEW] `app/[locale]/[category]/[city]/page.tsx`** — City category pages
- Dynamic SSG from DB: "Coiffeur Basel", "Nails Zürich", etc.
- Pages auto-exist for any city with ≥1 active salon
- Empty cities: "Noch keine Salons in [City] — Registriere dich als Erster!" + partner CTA

**[MODIFY] `app/sitemap.xml` route**
- Dynamic sitemap listing all: published salons + categories + city pages + treatment pages
- Grouped: `<sitemap><loc>/de/coiffeur/basel</loc>...</sitemap>`

**[MODIFY] `app/[locale]/salon/[slug]/page.tsx`** — Add to `generateMetadata`:
- OG title: "Salon Name — Kategorie in Stadt | Solen"
- OG description: first 160 chars of salon description
- OG image: salon cover photo URL
- Add JSON-LD `LocalBusiness` schema (name, address, rating, hours, priceRange)

**[MODIFY] `components/layout/Footer.tsx`** — Complete footer with all links:
- Kunden: Hilfe, Impressum, AGB, Datenschutz
- Salons: Partner werden, Hilfe für Salons
- Über uns, Newsletter signup (email input)
- Payment icons: Visa, Mastercard, TWINT, Apple Pay
- Language switcher

**[NEW] `app/[locale]/impressum/page.tsx`** — Legal page (template, user fills content)
**[NEW] `app/[locale]/agb/page.tsx`** — Terms page (template)
**[NEW] `app/[locale]/datenschutz/page.tsx`** — Privacy page (template)
**[NEW] `app/[locale]/partner/page.tsx`** — Simple partner CTA page (3 selling points + register)

### 🔧 Backend

**[NEW] `app/api/cities/route.ts`**
- GET: list all cities with salon count, used for sitemap + city pages

> [!CAUTION]
> OG images must be absolute URLs (https://www.solen.ch/...), not relative paths.
> JSON-LD schema must use correct `@type: "BeautySalon"` or `"HairSalon"`.
> Impressum/AGB/Datenschutz pages have PLACEHOLDER content — user will fill in real legal text.

---

## Phase 5: Promo Codes & Referral Program (~4h) 🔴

### 🗄️ Migrations

**[NEW] Migration 048: `promo_codes`**
```sql
CREATE TABLE promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value decimal(10,2) NOT NULL,
  max_uses int,
  used_count int DEFAULT 0,
  salon_id uuid REFERENCES salons(id), -- NULL = platform-wide
  min_booking_amount decimal(10,2) DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_by uuid NOT NULL,
  is_active boolean DEFAULT true
);
```

**[NEW] Migration 049: `referrals`**
```sql
CREATE TABLE referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id),
  referral_code text NOT NULL UNIQUE,
  referred_user_id uuid REFERENCES auth.users(id),
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','credited')),
  referrer_credit decimal(10,2) DEFAULT 10.00,
  referred_credit decimal(10,2) DEFAULT 10.00,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);
-- Each user gets one referral_code on signup
```

**[NEW] Migration 050: `user_credits`**
```sql
CREATE TABLE user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  amount decimal(10,2) NOT NULL,
  source text NOT NULL, -- 'referral', 'promo', 'birthday', 'compensation'
  reference_id uuid,
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### 🔧 Backend

**[NEW] `app/api/promo/validate/route.ts`** — Validate promo code at checkout
**[NEW] `app/api/promo/route.ts`** — Admin + salon owners manage codes
**[NEW] `app/api/referral/route.ts`** — GET user's code, track referrals
**[NEW] `app/api/referral/complete/route.ts`** — Credit both users after first booking

### 🎨 UI

**[MODIFY] Checkout** — Add promo code input field + "Anwenden" button
**[NEW] `app/[locale]/profile/referral/page.tsx`** — "Freund:in einladen" page with code + share + stats
**[MODIFY] `components/ProfilePage.tsx`** — Add "Guthaben: CHF X" + "Freunde einladen" link
**[NEW] `components/dashboard/PromoManager.tsx`** — Salon promo code CRUD

> [!CAUTION]
> Anti-abuse: rate limit referral completions (max 10/month per referrer)
> Promo codes: validate server-side, never trust client-submitted discount
> Birthday codes: need `date_of_birth` on profiles (optional field, migration needed)

---

## Phase 6: Review System Upgrade (~2h) 🟡

### 🎨 UI

**[MODIFY] Review display** — "✓ Verifiziert" badge (already in Phase 2)
**[NEW] Review photo upload** — File input on review form, stored in Supabase Storage `review-photos`
**[MODIFY] `components/ProfilePage.tsx`** — "Zuletzt angesehen" section (localStorage)
**[NEW] `components/RecentlyViewed.tsx`** — Horizontal scroll of last 5 viewed salons
**[MODIFY] `components/HomePage.tsx`** — Add RecentlyViewed section for returning users

### 🗄️ Migrations

**[NEW] Migration 051: `review_photos`**
```sql
CREATE TABLE review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  sort_order int DEFAULT 0
);
```

### 🔧 Backend

**[MODIFY] `app/api/reviews/route.ts`** — Support photo_urls in review creation
- Email trigger: 24h after appointment → "Wie war dein Besuch?" with star rating link
- No incentive, just simple CTA

---

## Phase 7: SMS Reminders & Onboarding Emails (~3h) 🟡

### 🔧 Backend

**[NEW] `app/api/cron/reminders/route.ts`** — Vercel Cron (or Edge Function)
- Runs every hour
- Finds bookings in next 24h → send SMS via seven.io (if not already sent)
- Finds bookings in next 1h → send 2nd SMS
- Salon configures which reminders in dashboard settings

**[NEW] `app/api/cron/review-prompt/route.ts`** — Vercel Cron
- Runs daily
- Finds completed bookings from 24h ago → send review prompt email via Resend

**Salon onboarding drip emails (auto-adapt):**
1. Welcome email (on registration)
2. "Profil vervollständigen" (if profile < 80% complete after 2 days)
3. "Erste Behandlung hinzufügen" (if 0 services after step 2)
4. "Erstes Foto hochladen" (if no cover photo after step 3)
5. "Bereit für deine erste Buchung!" (when profile is complete)

### 🎨 UI

**[MODIFY] Dashboard settings** — SMS reminder config: checkboxes for 24h / 1h

### 🗄️ Migrations

**[NEW] Migration 052: Salon SMS settings**
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS sms_reminder_24h boolean DEFAULT true;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS sms_reminder_1h boolean DEFAULT true;
```

> [!CAUTION]
> SMS costs money (seven.io per-message). Track SMS sent count.
> Vercel Cron needs `vercel.json` config: `{ "crons": [{ "path": "/api/cron/reminders", "schedule": "0 * * * *" }] }`
> See MANUAL-STEPS-v5.md for seven.io API key setup.

---

## Phase 8: Internationalization (~3h) 🟡

**Goal:** 4 languages: DE + FR + IT + EN

### 🎨 UI

**[NEW] `components/ui/LanguageSwitcher.tsx`** — 🇩🇪 DE / 🇫🇷 FR / 🇮🇹 IT / 🇬🇧 EN dropdown in Header
**[MODIFY] `components/layout/Header.tsx`** — Add LanguageSwitcher
**[MODIFY] All hard-coded German text in components** — Replace with `useTranslations()` calls

### 🔧 Files

**[NEW] `messages/fr.json`** — French translations
**[NEW] `messages/it.json`** — Italian translations
**[MODIFY] `messages/en.json`** — Verify completeness
**[MODIFY] `messages/de.json`** — Verify completeness

> [!CAUTION]
> This is the most tedious phase. Most German strings are hardcoded.
> Priority: translate UI labels (buttons, navigation, headings) first.
> Salon content (descriptions, services) stays in original language — don't auto-translate user content.

---

## Phase 9: No-Show Protection & Deposits (~3h) 🔴

### 🎨 UI

**[MODIFY] Dashboard settings** — Payment mode selector: Vorauszahlung / Anzahlung (X%) / Zahlung im Salon
**[MODIFY] Checkout flow** — Show different payment UI based on salon's `payment_mode`
**[MODIFY] Booking confirmation** — Show deposit amount if applicable

### 🔧 Backend

**[MODIFY] `app/api/bookings/route.ts`** — Handle 3 payment modes
**[MODIFY] `app/api/stripe/create-payment-intent/route.ts`** — Support partial amount (deposit)
**[NEW] `app/api/cron/late-cancel/route.ts`** — Charge late cancel fee if booking cancelled < X hours before

> [!CAUTION]
> Stripe payment intents for deposits: capture only the deposit, hold the rest.
> Default = 'at_salon' — don't break existing salons on deploy.

---

## Phase 10: Multi-Location Chains (~2h) 🟡

### 🗄️ Migrations

**[NEW] Migration 053: `salon_groups`**
```sql
CREATE TABLE salon_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES auth.users(id)
);
ALTER TABLE salons ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES salon_groups(id);
```

### 🎨 UI

**[NEW] `app/[locale]/brand/[slug]/page.tsx`** — Brand page: "Varibelle — 3 Standorte"
**[MODIFY] `components/SalonCard.tsx`** — Show "Teil von [Brand]" if group_id exists
**[MODIFY] Search results** — Group chain salons together

---

## Phase 11: Legal & Trust (~2h) 🟢

### 🎨 UI

**[NEW] `components/ui/CookieBanner.tsx`** — Bottom banner + "Einstellungen" → modal
- Categories: Notwendig ✅ / Analytik / Marketing
- Stores consent in `localStorage` + sends to PostHog

**[MODIFY] Legal pages** (built in Phase 4) — Fill in template structure
**[NEW] `app/not-found.tsx`** — 404 with fun illustration + search + recommendations
**[NEW] `app/error.tsx`** — 500 with professional "Etwas ist schiefgelaufen" message

### 🔧 Backend

**[NEW] `app/api/newsletter/route.ts`** — Subscribe email → store + Resend welcome

---

## Phase 12: Salon Dashboard Enhancements (~3h) 🟡

### 🎨 UI

**Analytics benchmarks:** "Deine Bewertung: 4.6 (Top 15% in Basel)"
**Salon of the Month:** Admin confirms auto-suggested salon → hero card on homepage
**"Neue Salons" section** on homepage (ORDER BY created_at DESC LIMIT 6)
**AI salon info auto-fill:** Structured fields in settings → "Vorschlag generieren" button

### 🔧 Backend

**[NEW] `app/api/admin/salon-of-month/route.ts`** — GET auto-suggestion, POST confirm
**[NEW] `app/api/salons/[slug]/ai-info/route.ts`** — Generate salon description from data (Gemini/OpenAI)

---

## Phase 13: PWA & Notifications (~2h) 🟡

### 🎨 UI

**[NEW] `components/ui/PWAInstallPrompt.tsx`** — Shows after first successful booking
- "Installiere Solen für Erinnerungen" banner
- Uses `beforeinstallprompt` browser event

**[MODIFY] `notification_preferences`** — Expand with email categories:
- ✅ Buchungsbestätigung (always on)
- ✅ Nachrichten (default on)
- ☐ Angebote von Favoriten (default off)
- ☐ Neue Salons in der Nähe (default off)
- ☐ Salon Newsletter (default off)

### 🗄️ Migrations

**[NEW] Migration 054: notification preference expansion**
```sql
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS messages_enabled boolean DEFAULT true;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS deals_enabled boolean DEFAULT false;
ALTER TABLE notification_preferences ADD COLUMN IF NOT EXISTS new_salons_enabled boolean DEFAULT false;
```

---

## Phase 14: Platform Commission System (~3h) 🔴

### 🗄️ Migrations

**[NEW] Migration 055: `platform_settings` + `salon_payouts`**
```sql
CREATE TABLE platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);
-- Seed: ('commission_percent', '{"default": 15}')
-- Seed: ('subscription_tiers', '{"free": 0, "pro": 49, "premium": 99}')

CREATE TABLE salon_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES salons(id),
  booking_id uuid REFERENCES bookings(id),
  gross_amount decimal(10,2) NOT NULL,
  commission_amount decimal(10,2) NOT NULL,
  net_amount decimal(10,2) NOT NULL,
  stripe_transfer_id text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);
```

### 🔧 Backend

**[MODIFY] `app/api/stripe/webhook/route.ts`** — On successful payment:
  1. Calculate commission (15% default)
  2. Transfer net to salon's Stripe Connect account
  3. Record in `salon_payouts`

**[NEW] `app/api/admin/commission/route.ts`** — Admin configures rates

### 🎨 UI

**[MODIFY] Dashboard revenue page** — Show gross / commission / net breakdown
**[NEW] Admin platform settings page** — Commission rate config

> [!CAUTION]
> This is your BUSINESS MODEL. Test with real Stripe test transactions first.
> Start with commission only. Subscription tiers come later (Phase 15+).

---

## Phase 15: Polish & Accessibility (~2h) 🟢

### 🎨 UI

1. `aria-label` on all buttons, form inputs, nav elements
2. Focus ring styles: `focus-visible:ring-2 focus-visible:ring-teal/50`
3. Skeleton loading on all category/search pages
4. SalonCard hover animation: `group-hover:scale-[1.02] transition-transform`
5. Salon photo lightbox for cover + interior photos
6. `router.prefetch()` on SalonCard hover
7. "Zuletzt angesehen" on homepage (localStorage, already built in Phase 6)
8. Payment method icons in footer
9. Responsive image gallery lightbox on salon detail page

---

## Execution Order

| # | Phase | Time | Depends On | Risk |
|---|---|---|---|---|
| 1 | Treatment Search + Categories | 6h | — | 🔴 HIGH |
| 2 | Salon Profile Premium | 4h | Phase 1 | 🟡 |
| 3 | Booking Engine Upgrade | 4h | Phase 2 | 🔴 HIGH |
| 4 | SEO & Discovery Pages | 3h | Phase 1 | 🟡 |
| 5 | Promo Codes & Referrals | 4h | Phase 3 | 🔴 HIGH |
| 6 | Review System Upgrade | 2h | Phase 2 | 🟢 |
| 7 | SMS & Onboarding Emails | 3h | — | 🟡 |
| 8 | Internationalization (4 langs) | 3h | After UI stable | 🟡 |
| 9 | No-Show Protection | 3h | Phase 3 | 🔴 HIGH |
| 10 | Multi-Location Chains | 2h | — | 🟡 |
| 11 | Legal & Trust | 2h | — | 🟢 |
| 12 | Dashboard Enhancements | 3h | — | 🟡 |
| 13 | PWA & Notifications | 2h | Phase 7 | 🟡 |
| 14 | Platform Commission | 3h | Phase 3 | 🔴 HIGH |
| 15 | Polish & Accessibility | 2h | Last | 🟢 |

**Total: ~46 hours**

---

## New DB Migrations Summary

| # | Table/Change | Phase |
|---|---|---|
| 044 | `service_categories` (3-level tree) | 1 |
| 045 | `booking_waitlist` | 1 |
| 046 | `ALTER salons` + info fields | 2 |
| 047 | `ALTER salons` + payment mode | 3 |
| 048 | `promo_codes` | 5 |
| 049 | `referrals` | 5 |
| 050 | `user_credits` | 5 |
| 051 | `review_photos` | 6 |
| 052 | `ALTER salons` + SMS settings | 7 |
| 053 | `salon_groups` + `ALTER salons` | 10 |
| 054 | `ALTER notification_preferences` | 13 |
| 055 | `platform_settings` + `salon_payouts` | 14 |

## New Pages

| Route | What | Phase |
|---|---|---|
| `/behandlungen/[...slug]` | Treatment search results | 1 |
| `/[category]/[city]` | City category pages | 4 |
| `/impressum` | Legal impressum | 4 |
| `/agb` | Terms of use | 4 |
| `/datenschutz` | Privacy policy | 4 |
| `/partner` | Salon recruitment | 4 |
| `/profile/referral` | Referral program | 5 |
| `/brand/[slug]` | Chain brand page | 10 |
| `not-found.tsx` | Custom 404 | 11 |
| `error.tsx` | Custom 500 | 11 |

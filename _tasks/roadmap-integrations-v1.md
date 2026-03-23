# Solen.ch — Third-Party Integrations & Growth Roadmap

> **Branch:** `main` (extends Dev 1 backend)
> **Stack:** Next.js 15, Supabase, Resend, Stripe, Sentry, PostHog, Cloudflare
> **Rule:** Follow CLAUDE.md protocol. Sync `index.html` → `public/home.html` after every monolith edit. Never commit secrets.

**CRITICAL INSTRUCTIONS FOR AI EXECUTION:**
1. **Never skip ahead.** Complete one phase, verify, get user approval before next.
2. **Hybrid awareness:** Monolith (`index.html`) serves 99% of users via iframe. New features go in Next.js (`app/`) but monitoring/analytics must cover BOTH.
3. **Integration with Dev 1/2/3:** This roadmap extends the existing Dev 1 backend schema. New tables/columns are additive migrations. New API routes follow Dev 1's patterns. New pages follow Dev 2/3's component patterns.

---

## Phase 1: Activate Dead Integrations

**Goal:** Wire up already-coded features that are dormant due to missing API keys.

- [ ] **1.1 Resend Email Activation**
  - **Files:** `api/send-email.js`, `lib/email.ts`
  - **Problem:** `RESEND_API_KEY=PASTE_RESEND_KEY_HERE` in `.env.local`. All 10 email templates exist but never fire.
  - **Action:** Instruct user: create account at resend.com → add domain `solen.ch` → verify DNS (Resend gives TXT + CNAME records → add in Namecheap) → generate API key.
  - **Action:** Set `RESEND_API_KEY` in Vercel Dashboard (Settings → Environment Variables → Production + Preview + Development).
  - **Action:** Update `.env.local` with real key for local dev.
  - **Action:** Verify `lib/email.ts` `sendEmail()` gracefully logs warning (not crash) when key missing.
  - **Verify:** Trigger test booking → confirm customer AND salon receive branded HTML emails.

- [ ] **1.2 Supabase Service Role Key**
  - **Problem:** `SUPABASE_SERVICE_ROLE_KEY=PASTE_SERVICE_ROLE_KEY_HERE`. Edge Functions (`salon-verification`, `recurring-booking-processor`, `post-booking-preferences`) cannot run admin operations.
  - **Action:** Instruct user: Supabase Dashboard → Project Settings → API → copy `service_role` key.
  - **Action:** Set in Vercel Environment Variables AND `.env.local`.
  - **Action:** Deploy Edge Functions: `supabase functions deploy salon-verification`, `supabase functions deploy recurring-booking-processor`, `supabase functions deploy post-booking-preferences`.
  - **Verify:** Check Supabase Dashboard → Edge Functions → verify all 3 appear as deployed.

- [ ] **1.3 Seven.io SMS Activation**
  - **File:** `api/send-sms.js` (uses Seven.io, NOT Twilio)
  - **Action:** Instruct user: create Seven.io account → get API key → set `SEVEN_API_KEY` in Vercel.
  - **Action:** Clean up `.env.example`: remove dead `SENDGRID_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`. Add `RESEND_API_KEY`, `SEVEN_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
  - **Verify:** Send test SMS to user's phone number via `POST /api/send-sms`.

---

## Phase 2: Sentry Error Tracking

**Goal:** Catch bugs in both monolith and Next.js before users report them.

- [ ] **2.1 Sentry — Monolith (`index.html`)**
  - **Action:** Instruct user: create Sentry project (platform: "Browser JavaScript") → get DSN.
  - **Action:** Add to `index.html` `<head>`, BEFORE all other scripts:
    ```html
    <script src="https://browser.sentry-cdn.com/8.x/bundle.min.js" crossorigin="anonymous"></script>
    <script>
      Sentry.init({ dsn: "DSN_HERE", environment: "production", tracesSampleRate: 0.2 });
    </script>
    ```
  - **Action:** Wrap these critical functions in `try/catch { Sentry.captureException(err) }`:

    | Function | Purpose |
    |----------|---------|
    | `obPublish()` | Salon registration submit |
    | `bookSlot()` / booking submit handler | Booking creation |
    | `sendMessage()` | DM chat send |
    | `saveDraft()` | Auto-draft save |
    | Supabase auth callbacks | Login/register |

  - **Action:** `cp index.html public/home.html`
  - **Verify:** Intentionally throw in console → appears in Sentry dashboard within 30s.

- [ ] **2.2 Sentry — Next.js (`app/`)**
  - **Action:** `npm install @sentry/nextjs`
  - **Action:** Run `npx @sentry/wizard@latest -i nextjs` — creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, updates `next.config.ts`.
  - **Action:** Set `SENTRY_DSN` and `SENTRY_AUTH_TOKEN` in Vercel Environment Variables.
  - **Action:** Add `SENTRY_DSN` to `.env.example`.
  - **Verify:** Visit a Next.js page, trigger error → appears in Sentry.

---

## Phase 3: PostHog Analytics + UptimeRobot

**Goal:** Understand user behavior. Know when solen.ch goes down.

- [ ] **3.1 PostHog — Monolith (`index.html`)**
  - **Action:** Instruct user: create PostHog account on **EU Cloud** (`eu.posthog.com`) for GDPR/Swiss compliance → get project API key.
  - **Action:** Add PostHog snippet to `index.html` `<head>`:
    ```html
    <script>
      !function(t,e){/* PostHog loader snippet */}(document,window.posthog||[]);
      posthog.init('POSTHOG_KEY', { api_host: 'https://eu.i.posthog.com' });
    </script>
    ```
  - **Action:** Add explicit tracking calls at these points in `index.html`:

    | Event | When | Properties |
    |-------|------|------------|
    | `salon_viewed` | Salon detail modal/page opens | `{ salon_id, salon_name, category }` |
    | `booking_started` | Booking wizard opens | `{ salon_id, service_name }` |
    | `booking_step_completed` | Each wizard step completes | `{ step_number, salon_id }` |
    | `booking_completed` | Booking confirmed | `{ salon_id, service_name, price, is_first_visit }` |
    | `search_performed` | Search submitted | `{ query, category_filter, quartier_filter }` |
    | `registration_started` | Salon registration opens | `{}` |
    | `registration_completed` | Salon registration submitted | `{ salon_name, categories }` |
    | `filter_applied` | Category/quartier filter clicked | `{ filter_type, filter_value }` |

  - **Action:** `cp index.html public/home.html`

- [ ] **3.2 PostHog — Next.js (`app/`)**
  - **Action:** `npm install posthog-js`
  - **Action:** Create `components/PostHogProvider.tsx`:
    ```tsx
    'use client';
    import posthog from 'posthog-js';
    import { PostHogProvider as PHProvider } from 'posthog-js/react';
    import { useEffect } from 'react';
    export function PostHogProvider({ children }: { children: React.ReactNode }) {
      useEffect(() => {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, { api_host: 'https://eu.i.posthog.com' });
      }, []);
      return <PHProvider client={posthog}>{children}</PHProvider>;
    }
    ```
  - **Action:** Wrap `app/[locale]/layout.tsx` children in `<PostHogProvider>`.
  - **Action:** Add `NEXT_PUBLIC_POSTHOG_KEY` to Vercel + `.env.local` + `.env.example`.

- [ ] **3.3 UptimeRobot**
  - **Action:** Instruct user: uptimerobot.com → sign up → Add Monitor → HTTP(s) → `https://solen.ch` → 5 min interval → alert to email.
  - No code changes needed.

---

## Phase 4: Cloudflare DNS & Security

**Goal:** CDN caching, DDoS protection, faster global load times.

- [ ] **4.1 Cloudflare Setup**
  - **Action:** Instruct user step-by-step:
    1. Create free Cloudflare account → "Add a Site" → `solen.ch`
    2. Cloudflare auto-scans DNS records. **Verify** all existing records imported: Vercel A/CNAME records, Resend verification TXT/CNAME records.
    3. Go to Namecheap Dashboard → Domain List → `solen.ch` → Nameservers → "Custom DNS" → paste Cloudflare's two NS records.
    4. Wait for propagation (usually ~1 hour, max 48h).
  - **Action:** After propagation, configure in Cloudflare Dashboard:

    | Setting | Value | Path |
    |---------|-------|------|
    | SSL/TLS mode | Full (Strict) | SSL/TLS → Overview |
    | Auto Minify | HTML + CSS + JS | Speed → Optimization |
    | Browser Cache TTL | 4 hours | Caching → Configuration |
    | Security Level | Medium | Security → Settings |
    | Bot Fight Mode | ON | Security → Bots |
    | Always Use HTTPS | ON | SSL/TLS → Edge Certificates |

  - **⚠️ CRITICAL:** Set Vercel CNAME to **DNS Only** (grey cloud) first. Test site loads. Then switch to **Proxied** (orange cloud). If redirect loops occur → switch back to grey cloud and set SSL to "Full" instead of "Full (Strict)".
  - **Verify:** `https://solen.ch` loads, SSL padlock present, Vercel auto-deploys still work.

---

## Phase 5: Admin Panel & Salon Approval

**Goal:** Role-based admin features mixed into existing dashboard. Manual salon approval workflow.

- [ ] **5.1 Database Migration — Admin Support**
  ```sql
  -- Migration: 015_admin_approval.sql
  ALTER TABLE salons ADD COLUMN IF NOT EXISTS registration_completed BOOLEAN DEFAULT false;
  ALTER TABLE salons ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
  ALTER TABLE salons ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
  ALTER TABLE salons ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
  ```

- [ ] **5.2 Admin Role Check**
  - **File:** `app/[locale]/dashboard/page.tsx`
  - **Action:** In `DashboardLayout` (from Dev 3 Phase 1), add role detection:
    - `role === 'salon_owner'` → show salon dashboard (existing Dev 3 features)
    - `role === 'admin'` → show admin dashboard with extra nav items
  - **Admin-only nav items** (add to Dev 3's sidebar/bottom nav):

    | Label | Route | Icon | Condition |
    |-------|-------|------|-----------|
    | Genehmigungen | `/dashboard/approvals` | `ShieldCheck` | `role === 'admin'` |
    | Alle Salons | `/dashboard/all-salons` | `Store` | `role === 'admin'` |
    | Alle Nutzer | `/dashboard/all-users` | `UsersRound` | `role === 'admin'` |
    | Umsatz | `/dashboard/revenue` | `DollarSign` | `role === 'admin'` |

- [ ] **5.3 Pending Approvals Page**
  - **File:** `app/[locale]/dashboard/approvals/page.tsx`
  - **Data:** `GET /api/admin/salons?status=pending` → salons WHERE `registration_completed = true AND is_active = false AND approved_at IS NULL`
  - **UI:** Table/card list showing:

    | Column | Detail |
    |--------|--------|
    | Salon Name | From registration |
    | Owner Email | From `auth.users` via `owner_id` |
    | Public Business Email | From salon registration (the email they listed for customers) |
    | Address | Full address |
    | Categories | Pills |
    | Registered At | Timestamp |
    | Actions | **Approve** (green) · **Reject** (red, modal with reason textarea) |

  - **Approve action:** `PATCH /api/admin/salons/{id}/approve` → sets `is_active = true`, `approved_at = now()`, `approved_by = admin.id`. Sends email to salon owner via Resend: "Dein Salon ist jetzt live auf solen.ch!"
  - **Reject action:** `PATCH /api/admin/salons/{id}/reject` → sets `rejection_reason`. Sends email: "Dein Salon wurde leider nicht genehmigt. Grund: {reason}"

- [ ] **5.4 Admin API Routes**
  - **File:** `app/api/admin/salons/route.ts` — GET: list all salons with filters (status: pending/active/frozen). Auth: `role === 'admin'` check.
  - **File:** `app/api/admin/salons/[id]/approve/route.ts` — PATCH.
  - **File:** `app/api/admin/salons/[id]/reject/route.ts` — PATCH.
  - All routes must verify caller has `role === 'admin'` from profiles table.

- [ ] **5.5 Registration Flow Update**
  - **Action:** In the existing salon registration (Phase 2 of Dev 3 roadmap / monolith `obPublish()`):
    - On completion: set `registration_completed = true`, `is_active = false`.
    - Send admin notification email: "Neuer Salon wartet auf Genehmigung: {name}".
    - Show user: "Dein Salon wird überprüft. Du erhältst eine Bestätigung per E-Mail."
  - **Action:** Add admin email notification via Resend to `lib/email.ts`:
    ```ts
    export function adminNewSalonNotification(vars: { salon: string; email: string; address: string }) { ... }
    ```

---

## Phase 6: Basel Salon Directory & Claiming

**Goal:** List all Basel beauty businesses. Let real owners claim their listing. Integrate with existing category sub-pages.

- [ ] **6.1 Database — `salon_directory` Table**
  ```sql
  -- Migration: 016_salon_directory.sql
  CREATE TABLE salon_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    quartier TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    google_maps_url TEXT,
    google_place_id TEXT UNIQUE,
    google_rating DECIMAL(2,1),
    google_review_count INT DEFAULT 0,
    categories TEXT[] DEFAULT '{}',
    photo_url TEXT,
    opening_hours JSONB,
    is_claimed BOOLEAN DEFAULT false,
    claimed_salon_id UUID REFERENCES salons(id),
    claim_verification_code TEXT,
    claim_verification_expires_at TIMESTAMPTZ,
    outreach_email_sent_at TIMESTAMPTZ,
    outreach_email_opened BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  );
  CREATE INDEX idx_directory_categories ON salon_directory USING GIN(categories);
  CREATE INDEX idx_directory_quartier ON salon_directory(quartier);
  ```

- [ ] **6.2 Data Collection Script**
  - **File:** `scripts/collect-basel-salons.ts`
  - **Action:** Node.js script using Google Places API (Text Search):
    - Queries: `"coiffeur Basel"`, `"barbershop Basel"`, `"nail salon Basel"`, `"spa Basel"`, `"kosmetik Basel"`, `"waxing Basel"`, `"tattoo Basel"`
    - For each result: extract name, address, phone, website, rating, review_count, place_id, photos, opening_hours
    - Auto-categorize based on search query
    - Auto-detect quartier from address/postal code
    - Upsert into `salon_directory` (skip if `google_place_id` already exists)
  - **Env:** `GOOGLE_PLACES_API_KEY` (user gets from Google Cloud Console, ~$10-20 one-time)
  - **Run once manually:** `npx ts-node scripts/collect-basel-salons.ts`

- [ ] **6.3 Directory Integration with Category Sub-Pages**
  - **Action:** Extend Dev 2's `CategoryPage` component and the existing sub-pages (`/de/coiffeur`, `/de/barbershop`, `/de/nails`, `/de/spa`, `/de/makeup`, `/de/waxing`).
  - **Action:** Each category page fetches BOTH:
    - Active solen salons: `GET /api/salons?category={cat}` (existing Dev 1 API)
    - Directory-only listings: `GET /api/directory?category={cat}` (new API)
  - **Display rules:**

    | Type | Card Style | Actions |
    |------|-----------|---------|
    | **Active Solen Salon** | Full color `SalonCard`. Rating, distance, "ab CHF X", "Heute noch Termine frei" badge | "Jetzt buchen" → booking wizard |
    | **Directory-Only Listing** | Muted/greyed-out card. Google rating, phone, website link. Subtle "Noch nicht auf Solen" label | "Anrufen" (tel: link), "Website" (external), **"Mein Salon"** (claim button, coral outline) |

  - **Infinite scroll** with "Mehr laden" button (matches Dev 2 pattern, NOT auto-load).
  - Directory listings appear AFTER all active solen salons, in a separate section: "Weitere Salons in Basel".

- [ ] **6.4 Directory API Routes**
  - **File:** `app/api/directory/route.ts` — GET: list directory entries. Params: `category`, `quartier`, `search`, `page`, `limit`. Excludes claimed entries.
  - **File:** `app/api/directory/[id]/claim/route.ts`:
    - POST (step 1): generates 6-digit code, sends via Resend to the directory entry's `email`. Stores hashed code + expiry (15 min) in `salon_directory`.
    - POST (step 2): body `{ code }`. Verifies code. If valid: redirect to salon registration form pre-filled with directory data. Mark `is_claimed = true`.

- [ ] **6.5 Outreach Email Campaign**
  - **File:** `scripts/send-outreach-emails.ts`
  - **Action:** Batch script that:
    - Selects directory entries WHERE `email IS NOT NULL AND outreach_email_sent_at IS NULL AND is_claimed = false`
    - Sends via Resend (rate-limited: max 50/day to avoid spam flags)
    - Email template (DE):
      - Subject: "Ihr Salon ist jetzt auf solen.ch gelistet — kostenlos Buchungen aktivieren"
      - Body: salon name, preview of their listing, CTA → `https://solen.ch/de/directory?claim={id}`
      - **Must include:** unsubscribe link, business sender identification (required by Swiss nDSG)
    - Updates `outreach_email_sent_at`
  - **Add template to `lib/email.ts`:** `salonOutreachInvitation(to, vars: { salonName, claimUrl })`

---

## Phase 7: Stripe Payment System

**Goal:** Stripe Connect Express, Cards + Apple Pay + TWINT, no-show deposits, Uber-style post-service price confirmation, 1% platform commission.

- [ ] **7.1 Database Migration — Payment Columns**
  ```sql
  -- Migration: 017_payments.sql
  ALTER TABLE salons ADD COLUMN accepts_online_payment BOOLEAN DEFAULT false;
  ALTER TABLE salons ADD COLUMN stripe_account_id TEXT;
  ALTER TABLE salons ADD COLUMN no_show_deposit_amount DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE salons ADD COLUMN deposit_min DECIMAL(10,2) DEFAULT 5;
  ALTER TABLE salons ADD COLUMN deposit_max DECIMAL(10,2) DEFAULT 100;

  ALTER TABLE bookings ADD COLUMN payment_intent_id TEXT;
  ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'none';
  -- payment_status enum: none | deposit_held | charged | refunded | disputed | released
  ALTER TABLE bookings ADD COLUMN estimated_price DECIMAL(10,2);
  ALTER TABLE bookings ADD COLUMN final_price DECIMAL(10,2);
  ALTER TABLE bookings ADD COLUMN deposit_amount DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0;
  ALTER TABLE bookings ADD COLUMN price_confirmed_at TIMESTAMPTZ;
  ALTER TABLE bookings ADD COLUMN price_increase_approved BOOLEAN;
  ALTER TABLE bookings ADD COLUMN price_increase_requested_at TIMESTAMPTZ;
  ```

- [ ] **7.2 Stripe Account Setup**
  - **Action:** Instruct user: create Stripe account (Switzerland) → Dashboard → enable payment methods: Cards, Apple Pay, TWINT.
  - **Action:** For Apple Pay: download `apple-developer-merchantid-domain-association` file → place at `public/.well-known/apple-developer-merchantid-domain-association`. Verify domain in Stripe Dashboard.
  - **Action:** Set up Stripe Connect (Express) in Stripe Dashboard → Platform settings.
  - **Env vars** (Vercel + `.env.local`): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.

- [ ] **7.3 Salon Dashboard — Payment Settings**
  - **File:** `app/[locale]/dashboard/settings/payments/page.tsx` (new tab in Dev 3's settings)
  - **UI:**

    | Element | Detail |
    |---------|--------|
    | Toggle | "Online-Zahlung akzeptieren" — switches `accepts_online_payment` |
    | Connect button | "Bankkonto verknüpfen" → Stripe Connect Express onboarding (opens Stripe-hosted page for bank/identity) |
    | Status pill | Connected (green) / Not Connected (grey) / Pending (yellow) |
    | Deposit slider | "Kaution bei No-Show" — CHF 5–100, step 5. Default: CHF 20 |
    | Marketing card | Teal card: "🛡️ Schütze dich vor No-Shows. Kunden hinterlegen eine Kaution. Erscheinen sie nicht, behältst du die Kaution." |
    | Commission info | Small text: "Solen erhebt 1% Servicegebühr auf Online-Zahlungen." (legally required transparency) |

  - **API:** `POST /api/stripe/connect/create-account` → creates Express account, returns onboarding URL. `GET /api/stripe/connect/status` → checks account status.

- [ ] **7.4 Checkout Page**
  - **File:** `app/[locale]/checkout/page.tsx` (NEW Next.js page, NOT in monolith)
  - **Flow:** Booking wizard (monolith) → on "Jetzt buchen" for payment-enabled salon → redirect to `/de/checkout?booking_intent={encoded_data}`
  - **Layout (Amazon-style):**
    ```
    ┌──────────────────────────────────────────┐
    │  Buchungsübersicht                       │
    ├──────────────────────────────────────────┤
    │  📍 Salon XYZ · Kleinbasel              │
    │  📅 Montag, 24. März 2026 · 14:00       │
    │  👤 Marco (Stylist)                      │
    ├──────────────────────────────────────────┤
    │                                          │
    │  Herren Haarschnitt          CHF 45.00  │
    │  Bartpflege                  CHF 25.00  │
    │  ─────────────────────────────────────   │
    │  Geschätzter Gesamtpreis     CHF 70.00  │
    │                                          │
    │  Kaution (No-Show-Schutz)    CHF 20.00  │
    │  Wird bei Erscheinen verrechnet          │
    │  ─────────────────────────────────────   │
    │  💳 Jetzt zu zahlen          CHF 20.00  │
    │  🏪 Restbetrag vor Ort      CHF 50.00  │
    │                                          │
    ├──────────────────────────────────────────┤
    │  [Apple Pay]  [TWINT]  [💳 Karte]       │
    │  ▸ Stripe Payment Element               │
    ├──────────────────────────────────────────┤
    │  [ Jetzt buchen · CHF 20.00 ]           │
    │  Kostenlose Stornierung bis 24h vorher   │
    └──────────────────────────────────────────┘
    ```
  - **Action:** Install `@stripe/stripe-js` and `@stripe/react-stripe-js`.
  - **Action:** On submit: call `POST /api/stripe/create-payment-intent` → returns `clientSecret` → Stripe Payment Element confirms payment → deposit held → booking created with `payment_status: 'deposit_held'`.
  - **For salons WITHOUT online payment:** skip checkout page entirely. Booking confirmation shows "Zahlung vor Ort" (pay at salon). No deposit.

- [ ] **7.5 Post-Service Price Confirmation (Uber-Style)**
  - **File:** Add to `app/[locale]/dashboard/bookings/page.tsx` (extends Dev 3 Phase 4)
  - **Trigger:** After booking's `ends_at` has passed AND `payment_status = 'deposit_held'`
  - **Salon sees:** "Endpreis bestätigen" prompt on each completed booking:

    | Element | Detail |
    |---------|--------|
    | Pre-filled price | `estimated_price` from booking |
    | Editable field | Salon can adjust (added extras, different service) |
    | Deposit line | "Kaution bereits bezahlt: CHF {deposit}. Wird verrechnet." |
    | Remaining | Auto-calculated: `final_price - deposit_amount` |
    | Submit | "Bestätigen & Abrechnen" |

  - **If `final_price <= estimated_price`:** `POST /api/stripe/confirm-price` → capture PaymentIntent for `final_price`, apply deposit. Platform takes 1% fee. Customer gets email receipt.
  - **If `final_price > estimated_price`:** Customer gets notification (email + SMS):
    - "Der Salon hat den Endpreis auf CHF {new} angepasst (ursprünglich CHF {old}). Bitte bestätige innerhalb von 48 Stunden."
    - Email contains: Approve link → `POST /api/stripe/approve-increase` → charges difference.
    - After 48h without approval → hold released, flagged for admin review.
  - **If salon doesn't confirm within 72h:** Supabase cron auto-releases hold. `payment_status = 'released'`.

- [ ] **7.6 Stripe API Routes**

  | Endpoint | Method | Detail |
  |----------|--------|--------|
  | `/api/stripe/connect/create-account` | POST | Creates Express account for salon, returns onboarding URL |
  | `/api/stripe/connect/status` | GET | Returns salon's Stripe Connect status |
  | `/api/stripe/create-payment-intent` | POST | Body: `{ booking_data, deposit_amount }`. Creates hold with `capture_method: 'manual'` |
  | `/api/stripe/confirm-price` | POST | Body: `{ booking_id, final_price }`. Captures or adjusts payment |
  | `/api/stripe/approve-increase` | POST | Customer approves price increase |
  | `/api/stripe/webhook` | POST | Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `account.updated` |

- [ ] **7.7 Customer Filter**
  - **Action:** Add to Dev 2's `FilterBar` component: "Akzeptiert Online-Zahlung" toggle pill.
  - **API:** Extend `GET /api/salons` with `?accepts_payment=true` param.

---

## Phase 8: Notification Preferences & French i18n

**Goal:** Let users control notifications. Add French language support.

- [ ] **8.1 Database — Notification Preferences**
  ```sql
  -- Migration: 018_notification_prefs.sql
  ALTER TABLE profiles ADD COLUMN notification_email BOOLEAN DEFAULT true;
  ALTER TABLE profiles ADD COLUMN notification_sms BOOLEAN DEFAULT false;
  ALTER TABLE profiles ADD COLUMN phone_number TEXT;
  ALTER TABLE profiles ADD COLUMN locale TEXT DEFAULT 'de';
  -- locale enum: de | en | fr
  ```

- [ ] **8.2 Notification Settings UI**
  - **File:** Extend Dev 2's account profile page (`app/[locale]/account/page.tsx`)
  - **UI:** In "Profil" tab, add:
    - Toggle: "E-Mail-Benachrichtigungen" (default ON)
    - Toggle: "SMS-Benachrichtigungen" (default OFF)
    - Phone number input (required when SMS is ON, with Swiss format validation `+41...`)
    - Language selector: Deutsch / English / Français

- [ ] **8.3 Respect Preferences in Email/SMS Sending**
  - **Action:** Update `api/send-email.js` and `lib/email.ts`: before sending, check `profiles.notification_email`. If false, skip.
  - **Action:** Update `api/send-sms.js`: before sending, check `profiles.notification_sms` AND `profiles.phone_number`. If either missing, skip.
  - **Exception:** Admin emails and payment-related emails ALWAYS send (legal requirement).

- [ ] **8.4 French Language Support**
  - **Action:** Create `messages/fr.json` from `messages/de.json` structure (machine translate via AI, review later).
  - **Action:** Update `i18n.ts`: `locales: ['de', 'en', 'fr']`.
  - **Action:** Update `middleware.ts` locale detection to include `fr`.
  - **Action:** Add French variants to ALL email templates in `lib/email.ts` (add `fr` case to every template function alongside `de` and `en`).
  - **Action:** Add French SMS templates.
  - **Action:** Add "Français" option to language switcher in both monolith and Next.js.

---

## Phase 9: Fix Broken Features (Chat & Calendar Sync)

**Goal:** Audit and fix existing dormant code.

- [ ] **9.1 DM Chat System**
  - **Files:** `app/[locale]/account/messages/page.tsx`, `app/api/conversations/route.ts`, `app/api/conversations/[id]/messages/route.ts`
  - **Action:** Test end-to-end: create conversation → send message → verify Supabase Realtime delivers to other party.
  - **Action:** Fix unread count updates (both `unread_count_customer` and `unread_count_salon`).
  - **Action:** Wire up `newMessageNotification()` from `lib/email.ts`: when recipient hasn't been online for 5+ minutes, send email notification.
  - **Verify:** Two browser tabs, customer + salon owner. Messages appear in real-time. Unread badges update.

- [ ] **9.2 Google Calendar Sync**
  - **File:** `api/gcal-sync.js`, `api/gcal-auth.js`
  - **Action:** Instruct user: Google Cloud Console → create OAuth 2.0 credentials → Calendar API enabled → set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` in Vercel.
  - **Action:** Audit code → fix OAuth flow (redirect URI must match Vercel deployment URL).
  - **Action:** On booking confirmation: create Google Calendar event for customer. Optional: create for salon too.
  - **Verify:** Book appointment → event appears in Google Calendar with correct time/title.

- [ ] **9.3 Outlook Calendar Sync**
  - **File:** `api/outlook-sync.js`, `api/outlook-auth.js`
  - **Action:** Same pattern as Google but with Microsoft Graph API. Instruct user to register Azure AD app.
  - **Defer** if Google Cal is sufficient for MVP.

---

## API Reference (New Routes)

| Endpoint | Method | Phase |
|----------|--------|-------|
| `POST /api/admin/salons` | GET | 5 |
| `PATCH /api/admin/salons/[id]/approve` | PATCH | 5 |
| `PATCH /api/admin/salons/[id]/reject` | PATCH | 5 |
| `GET /api/directory` | GET | 6 |
| `POST /api/directory/[id]/claim` | POST | 6 |
| `POST /api/stripe/connect/create-account` | POST | 7 |
| `GET /api/stripe/connect/status` | GET | 7 |
| `POST /api/stripe/create-payment-intent` | POST | 7 |
| `POST /api/stripe/confirm-price` | POST | 7 |
| `POST /api/stripe/approve-increase` | POST | 7 |
| `POST /api/stripe/webhook` | POST | 7 |

---

## ✅ Delivery Checklist

- [ ] Resend emails firing on all booking/cancellation/reminder events
- [ ] Supabase Edge Functions deployed and running (salon-verification, recurring-booking, post-booking)
- [ ] Sentry capturing errors in BOTH monolith and Next.js
- [ ] PostHog tracking all 8 defined events in production
- [ ] UptimeRobot monitoring solen.ch with email alerts
- [ ] Cloudflare DNS active with SSL, DDoS protection, bot fight mode
- [ ] Admin sees pending salons. Approve/reject flows with email notifications
- [ ] Basel directory populated from Google Places. Category sub-pages show directory entries
- [ ] Salon claiming: 6-digit email verification → pre-filled registration → admin approval
- [ ] Outreach emails sent to Basel salons with unsubscribe links
- [ ] Stripe Connect Express: salon onboarding, bank account linking
- [ ] Checkout page: payment summary, Stripe Payment Element (Cards + Apple Pay + TWINT)
- [ ] No-show deposit: held on booking, applied toward total on confirmation
- [ ] Uber-style price confirmation: salon confirms → customer notified if increase → 48h approval window
- [ ] 1% platform commission deducted from salon payout (visible to salon)
- [ ] Notification preferences: email/SMS toggles in profile settings
- [ ] French language: `messages/fr.json`, email templates, SMS templates, language switcher
- [ ] DM chat: real-time delivery, unread counts, email notification for offline users
- [ ] Google Calendar sync: booking → calendar event

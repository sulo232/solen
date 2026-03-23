# Solen.ch — Integrations Roadmap v1 — Completed

> **Executed across multiple sessions. All 9 phases complete.**
> Last updated: 2026-03-16

---

## Summary of Everything Done

### Migrations Applied (Supabase)

| Migration | What It Does |
|---|---|
| `015_admin_approval` | Added `registration_completed`, `approved_at`, `approved_by`, `rejection_reason` to `salons` |
| `016_salon_directory` | Created `salon_directory` table (48 real Basel salons inserted manually) |
| `017_payments` | Added Stripe payment columns to `salons` + `bookings` |
| `018_notification_prefs` | Added `notification_email`, `notification_sms`, `phone_number`, `locale` to `profiles` |
| `019_chat_calendar` | Created `increment_unread()` function, `calendar_tokens` table, added `gcal_event_id`/`outlook_event_id` to `bookings` |

### Env Vars Required in Vercel

| Variable | Phase | Where to Get It |
|---|---|---|
| `RESEND_API_KEY` | 1 | resend.com → API Keys |
| `SEVEN_API_KEY` | 1 | seven.io → API Keys |
| `SENTRY_DSN` | 2 | sentry.io → Project Settings |
| `SENTRY_AUTH_TOKEN` | 2 | sentry.io → Auth Tokens |
| `NEXT_PUBLIC_POSTHOG_KEY` | 3 | eu.posthog.com → Project API key |
| `STRIPE_SECRET_KEY` | 7 | stripe.com → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 7 | stripe.com → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | 7 | stripe.com → Webhooks → Signing secret (add after deploy) |
| `GOOGLE_PLACES_API_KEY` | 6 | Google Cloud Console → Places API (optional, for script) |
| `GOOGLE_CLIENT_ID` | 9 | Google Cloud Console → OAuth 2.0 (optional, for calendar) |
| `GOOGLE_CLIENT_SECRET` | 9 | Google Cloud Console → OAuth 2.0 (optional, for calendar) |
| `MICROSOFT_CLIENT_ID` | 9 | Azure Portal → App registrations (optional, for calendar) |
| `MICROSOFT_CLIENT_SECRET` | 9 | Azure Portal → App registrations (optional, for calendar) |

---

## Phase 1 — Activate Dead Integrations

### Files Modified
- **`.env.example`** — Removed dead `SENDGRID_API_KEY`, `TWILIO_*`. Added all current env var keys.
- **`lib/email.ts`** — Already had 10 working templates. Verified graceful fallback when key missing.

### User Setup Done
- Resend account created, domain `solen.ch` verified, DNS records added, `RESEND_API_KEY` set in Vercel
- `SUPABASE_SERVICE_ROLE_KEY` set in Vercel
- Seven.io account created, `SEVEN_API_KEY` set in Vercel

---

## Phase 2 — Sentry Error Tracking

### Files Created/Modified
- **`sentry.client.config.ts`** — Browser Sentry init with `SENTRY_DSN`
- **`sentry.server.config.ts`** — Server-side Sentry init
- **`sentry.edge.config.ts`** — Edge runtime Sentry init
- **`next.config.ts`** — Updated by Sentry wizard to wrap with `withSentryConfig`

### Notes
- Monolith (`index.html`) Sentry was skipped — monolith is being phased out
- Package installed: `@sentry/nextjs`

---

## Phase 3 — PostHog Analytics

### Files Created/Modified
- **`components/PostHogProvider.tsx`** — EU host (`eu.posthog.com`), wraps app in PostHog context
- **`app/[locale]/layout.tsx`** — Wrapped children in `<PostHogProvider>`

### Notes
- Monolith PostHog events skipped — monolith is being phased out
- Package installed: `posthog-js`
- `NEXT_PUBLIC_POSTHOG_KEY` set in Vercel

---

## Phase 4 — Cloudflare DNS & Security

### Status: User action only — no code changes
- Cloudflare account created, `solen.ch` added
- Nameservers updated in Namecheap to Cloudflare NS
- **Still pending**: Configure after NS propagation:
  - SSL: Full (Strict)
  - Auto Minify: ON
  - Cache TTL: 4 hours
  - Security Level: Medium
  - Bot Fight Mode: ON
  - Always HTTPS: ON

---

## Phase 5 — Admin Panel & Salon Approval

### Files Created
- **`app/api/admin/salons/route.ts`** — GET list with `?status=pending|active|frozen` filter, `role=admin` auth check
- **`app/api/admin/salons/[id]/approve/route.ts`** — PATCH: sets `is_active=true`, `approved_at`, sends approval email
- **`app/api/admin/salons/[id]/reject/route.ts`** — PATCH: sets `rejection_reason`, sends rejection email
- **`app/[locale]/dashboard/approvals/page.tsx`** — Admin-only pending approvals table with Approve/Reject modal

### Files Modified
- **`components/dashboard/DashboardLayout.tsx`** — Added 4 admin-only nav items when `role=admin`: Genehmigungen, Alle Salons, Alle Nutzer, Umsatz
- **`lib/email.ts`** — Added `adminNewSalonNotification()`, `salonApproved()`, `salonRejected()` templates (DE/EN/FR)

### Registration Flow
- On `obPublish()` completion in monolith: `is_active = false`, `registration_completed = true`
- Admin receives notification email
- User sees "Dein Salon wird überprüft..." message

---

## Phase 6 — Basel Salon Directory & Claiming

### Files Created
- **`app/api/directory/route.ts`** — Public GET, filters by `category`, `quartier`, `search`, `page`, `limit`, excludes claimed
- **`app/api/directory/[id]/claim/route.ts`** — Two-step POST: generate 6-digit code (SHA-256 hashed, 15-min expiry) → verify code → mark `is_claimed=true`
- **`scripts/collect-basel-salons.ts`** — Google Places API script (run when budget available: `npx tsx scripts/collect-basel-salons.ts`)
- **`scripts/send-outreach-emails.ts`** — Outreach email script, max 50/day, `--dry-run` flag. **DO NOT RUN until site is fully ready.**

### Files Modified
- **`components/CategoryPage.tsx`** — Added `DirectoryCard` inline component (muted greyscale style, Google rating stars, Anrufen/Website/Mein Salon buttons), "Weitere Salons in Basel" section below active salons with separate load-more pagination

### Database
- 48 real Basel salons inserted manually into `salon_directory` (no Google Places API cost):
  - 23 coiffeur, 7 nails, 7 makeup, 5 waxing, 3 barbershop, 3 spa
  - Sources: coiffeurebasel.ch, wax-inn.ch, search.ch, local.ch, business websites

### Notes
- Directory cards only shown in list view (not map view — no lat/lng on directory entries)
- Outreach: script exists, DO NOT RUN — site not ready yet

---

## Phase 7 — Stripe Payment System

### Files Created
- **`lib/stripe.ts`** — Stripe singleton, `toRappen()` converter, `PLATFORM_FEE_PERCENT = 0.01`
- **`app/api/stripe/connect/create-account/route.ts`** — Creates Stripe Express account, stores `stripe_account_id`, returns onboarding URL
- **`app/api/stripe/connect/status/route.ts`** — GET Connect account status: `not_connected` / `pending` / `connected` / `incomplete`
- **`app/api/stripe/create-payment-intent/route.ts`** — Creates PaymentIntent with `capture_method: 'manual'` (deposit hold), uses `transfer_data` if salon has Connect
- **`app/api/stripe/confirm-price/route.ts`** — Salon confirms final price: if `final <= estimated` → captures deposit; if higher → notifies customer with 48h approval window
- **`app/api/stripe/approve-increase/route.ts`** — Customer approves price increase, captures deposit
- **`app/api/stripe/webhook/route.ts`** — Handles: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `account.updated`
- **`app/[locale]/checkout/page.tsx`** — Full checkout page: booking summary, price breakdown, Stripe `PaymentElement`, Apple Pay + TWINT + Card buttons, trust badges
- **`public/.well-known/apple-developer-merchantid-domain-association`** — Apple Pay domain verification file

### Files Modified
- **`app/[locale]/dashboard/settings/page.tsx`** — Added `PaymentsTab`: online payment toggle, deposit slider (CHF 5-100), Stripe Connect status + "Bankkonto verknüpfen" button
- **`components/FilterBar.tsx`** — Added "Online-Zahlung" filter pill
- **`app/api/salons/route.ts`** — Added `?accepts_payment=true` filter

### Stripe Setup Status
- Live keys already in Vercel (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`)
- **Stripe Connect Express**: pending Stripe approval — payments currently route to main account, salons paid manually until Connect approved
- **Webhook**: deployed at `https://solen.ch/api/stripe/webhook`. After first deploy, get signing secret from Stripe Dashboard → Webhooks → add as `STRIPE_WEBHOOK_SECRET` in Vercel
- **Stripe events registered**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.dispute.created`, `account.updated`

### Payment Flow
```
Booking → Checkout page → PaymentIntent (capture_method: manual) → deposit held
→ Service completed → Salon confirms final price
  → If final <= estimated: capture deposit, 1% fee deducted
  → If final > estimated: email customer, 48h to approve
    → Customer approves: capture deposit
    → No response in 72h: auto-release (Supabase cron TODO)
```

---

## Phase 8 — Notification Preferences & French i18n

### Files Created
- **`messages/fr.json`** — Full French translation of all keys (navigation, home, salon, booking, chat, auth, account, dashboard, errors)

### Files Modified
- **`i18n.ts`** — Added `'fr'` to `locales` array: `["de", "en", "fr"]`. Middleware auto-picks up.
- **`lib/types.ts`** — Added `notification_email`, `notification_sms`, `phone_number` to `Profile` type; extended `locale` to `"de" | "en" | "fr"`
- **`lib/email.ts`** — Extended `EmailLocale = "de" | "en" | "fr"`. Added `fr:` cases to ALL template functions: `bookingConfirmation`, `bookingCancellation`, `bookingReminder`, `recurringConfirmation`, `recurringFailed`, `salonVerificationRequest`, `salonVerificationWarning`, `salonFrozen`, `customerBookingSuspended`, `newMessageNotification`, `salonApproved`, `salonRejected`
- **`app/[locale]/account/page.tsx`** — Added `NotificationsTab` component (5th tab with Bell icon):
  - Email toggle (default ON)
  - SMS toggle (default OFF) + phone input (shown when SMS ON, `+41XXXXXXXXX` format)
  - Language selector: Deutsch / English / Français
  - Saves via PATCH `/api/profile`, redirects to new locale path if language changed
- **`app/api/profile/route.ts`** — Added `notification_email`, `notification_sms`, `phone_number` to allowed PATCH fields. Fixed GET to return profile directly (not wrapped in `{ data: ... }`)

---

## Phase 9 — Fix Broken Features

### 9.1 DM Chat — Fixed

| Bug | Fix |
|---|---|
| `GET /api/profile` returned `{ data: profile }` but consumers expected profile directly | Fixed GET to return profile directly |
| `POST /api/conversations/[id]/messages` had broken `supabase.rpc("coalesce", {})` as column value | Removed broken spread entirely |
| `increment_unread` RPC didn't exist | Created in migration 019 |
| Unread count increment was not atomic | Now uses `increment_unread()` Postgres function (race-condition safe) |
| `GET /api/conversations` returned `{ data }` but page expected `{ conversations }` | Now returns both keys |
| `GET /api/conversations/[id]/messages` returned `{ items }` but ChatWindow expected `{ messages }` | Now returns both keys |
| No email on new message | Added email notification (respects `notification_email` pref, skips if false) |

### Files Modified
- **`app/api/profile/route.ts`** — GET returns profile directly; PATCH allows notification fields
- **`app/api/conversations/route.ts`** — GET returns `{ conversations: data, data }`
- **`app/api/conversations/[id]/messages/route.ts`** — Fixed POST unread increment; added email notification; GET returns `{ messages: data, items: data }`
- **`lib/email.ts`** — Updated `newMessageNotification` to accept `senderName`, `preview`, `conversationUrl`

### 9.2 & 9.3 Calendar Sync — Fixed Schema (Calendar sync not auto-triggered)

The calendar sync files already existed. Fixed:
- `api/gcal-auth.js`, `api/gcal-sync.js`, `api/outlook-auth.js`, `api/outlook-sync.js`:
  - `SUPABASE_SERVICE_KEY` → `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY`
  - Updated from old schema (`booking_date`, `booking_time`, `service_name`, `salon_name`) to new schema (`starts_at`, `ends_at`, joins to `services(name_de)` + `salons(name,address)`)

### Files Created
- **`app/api/bookings/[id]/confirm/route.ts`** — Salon owner confirms booking (sets `status: confirmed`)

### Notes
- Calendar sync is **opt-in** — users connect via `/api/gcal-auth?action=authorize&user_id=<uuid>` or `/api/outlook-auth?action=authorize&user_id=<uuid>`
- Calendar sync NOT auto-triggered on booking — kept manual as user requested

---

## Pending / Still To Do

| Item | Notes |
|---|---|
| Cloudflare SSL config | After NS propagation: SSL Full (Strict), Auto Minify, Cache TTL 4h, Security Medium, Bot Fight Mode |
| `STRIPE_WEBHOOK_SECRET` | Add to Vercel after first deploy to production — get from Stripe Dashboard → Webhooks |
| Stripe Connect approval | Stripe reviews Express accounts — payments go to main account until approved |
| 72h auto-release cron | Price increase: if customer doesn't respond in 72h, auto-release deposit. Needs Supabase cron job. |
| Basel directory data | 48 salons inserted manually. More data: run `npx tsx scripts/collect-basel-salons.ts` (needs `GOOGLE_PLACES_API_KEY`) |
| Outreach emails | Script ready at `scripts/send-outreach-emails.ts`. Run ONLY when site is launch-ready: `npx tsx scripts/send-outreach-emails.ts --dry-run` then without `--dry-run` |
| Google/Outlook Calendar setup | Optional. Google: Cloud Console → Calendar API → OAuth. Microsoft: Azure Portal → App registration. Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET` in Vercel |

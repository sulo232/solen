# Incomplete Features

> This file tracks features that have been partially built. See CLAUDE.md Rule 45 for protocol.

---

## Netlify Migration: Cron Jobs — RESOLVED via GitHub Actions (2026-05-06)

- **Context**: Migrated deploy from Vercel to Netlify on 2026-05-06 (Vercel account blocked). `netlify.toml` covers build + headers; `vercel.json` had 19 cron jobs that do **not** transfer.
- **Backend**: All 19 `/api/cron/*` route handlers exist and are functional.
- **Status**: ✅ migrated to GitHub Actions cron. See `.github/workflows/cron-jobs.yml` + `.github/actions/ping-cron/action.yml`. Each scheduled job hits the configured `/api/...` endpoint(s) with `Authorization: Bearer ${CRON_SECRET}` (secret stored both in GitHub Actions repo secrets and in Netlify env vars).
- **HTTP method nuance**: 18 routes use GET; only `/api/admin/solen-score/recalculate` uses POST — handled per-job in the workflow.
- **What still needs verification**: After the workflow lands on `main`, watch the first scheduled run for each schedule and confirm 2xx responses. The workflow soft-fails on individual endpoint errors so a single bad endpoint doesn't suppress the others.
- **Priority** (was): HIGH — these run booking reminders, review prompts, late-cancel handling, deposit release, payment release, account deletion, SMS reminders, slot generation, no-show timeouts.
- **Affected paths** (verbatim from `vercel.json`):
  - `/api/cron/reminders` (hourly)
  - `/api/cron/review-prompt` (hourly)
  - `/api/cron/late-cancel` (every 30 min)
  - `/api/admin/solen-score/recalculate` (daily 03:00)
  - `/api/cron/welcome-series` (daily 10:00)
  - `/api/cron/rebooking-nudge` (daily 11:00)
  - `/api/cron/salon-onboarding` (daily 09:00)
  - `/api/cron/release-deposits` (every 6h)
  - `/api/cron/nail-infill-reminders` (daily 10:00)
  - `/api/cron/barber-smart-reminders` (daily 08:00)
  - `/api/cron/sms-reminders` (every 30 min)
  - `/api/cron/auto-complete` (every 15 min)
  - `/api/cron/birthday-messages` (daily 09:00)
  - `/api/cron/generate-slots` (daily 02:00)
  - `/api/cron/no-show` (every 30 min)
  - `/api/cron/pending-timeout` (every 15 min)
  - `/api/cron/pre-charge` (hourly)
  - `/api/cron/process-deletions` (daily 03:00)
  - `/api/cron/release-payments` (every 6h)

---

## Netlify Migration: Post-Deploy Manual Steps

- **Env vars**: copy from Vercel dashboard (Supabase, Stripe, Upstash, PostHog, Gemini, fal.ai, MAPBOX_API, etc.) into Netlify Site settings → Environment.
- **Stripe webhooks**: re-point to new Netlify domain at `dashboard.stripe.com/webhooks`. If left at the Vercel URL, payments break silently.
- **Supabase Auth callbacks**: update redirect URLs in Supabase project settings. Otherwise OAuth login breaks.
- **Google OAuth callbacks** (if separate from Supabase): update in Google Cloud Console.
- **Branch deploy filter**: replicate `vercel.json`'s `git.deploymentEnabled.main: false` via Netlify Site → Build & deploy → Branches.
- **Domain DNS**: cut over `solen.ch` from Vercel nameservers / A records to Netlify when the deploy is verified working.
- **Priority**: BLOCKING — site does not function correctly until env vars + Stripe + Auth callbacks are done.

---

## Last-Minute Notify Me Button

- **Backend**: `POST /api/waitlist` exists in `app/api/waitlist/route.ts` but requires `{ salon_id, service_id, preferred_date, preferred_time_range }` — not `{ email, feature }`.
- **Frontend**: Notify Me button added to `app/[locale]/angebote/page.tsx` (empty state). The button uses `prompt()` to collect email and posts to `/api/waitlist`, but the API will return 400 (validation error) because the schema doesn't match. The error is caught silently.
- **Missing**: A proper `/api/notify-me` or `/api/last-minute-waitlist` endpoint that accepts `{ email, feature }` and stores email subscriptions. Alternatively, extend the existing waitlist schema to support feature-based subscriptions.
- **Priority**: LOW — fails silently, does not crash the page.

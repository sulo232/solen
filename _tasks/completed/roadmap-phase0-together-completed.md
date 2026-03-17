# Phase 0: Browser Setup — COMPLETED ✅

> Completed: 2026-03-17

## What Was Done

| Task | Status | Notes |
|---|---|---|
| 0.1 Supabase Service Role Key | ✅ Done (previous session) | Set in Vercel |
| 0.2 Deploy Edge Functions | ✅ Done | All 6 deployed via `supabase functions deploy` with access token |
| 0.3 Resend Email API | ✅ Done (previous session) | `RESEND_API_KEY` set, domain `solen.ch` verified |
| 0.4 Stripe Keys | ✅ Done (previous session) | `STRIPE_SECRET_KEY` + publishable key set |
| 0.5 PostHog Key | ✅ Done | `NEXT_PUBLIC_POSTHOG_KEY` = `phc_DnOrvshdGLZItVLwXObzHjaWR4qStwrrh8ZjlYL0CUM` set in Vercel |
| 0.6 Sentry | ⚠️ Config files exist | DSN + Auth Token not in Vercel yet (non-blocking) |

## Edge Functions Deployed
- `compute-analytics` — nightly salon analytics
- `booking-reminder` — 24h booking reminders
- `recurring-booking-processor` — auto-creates recurring bookings
- `salon-verification` — monthly inactive salon detection
- `slot-auto-release` — frees stale bookings after 72h
- `post-booking-preferences` — updates user preferences after booking

## Still Pending (Non-Blocking)
- `SENTRY_DSN` + `SENTRY_AUTH_TOKEN` — set when Sentry project is created
- `STRIPE_WEBHOOK_SECRET` — set after first production deployment (get from Stripe Dashboard → Webhooks)

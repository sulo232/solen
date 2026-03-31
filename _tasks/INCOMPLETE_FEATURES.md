# Incomplete Features

> This file tracks features that have been partially built. See CLAUDE.md Rule 45 for protocol.

---

## Last-Minute Notify Me Button

- **Backend**: `POST /api/waitlist` exists in `app/api/waitlist/route.ts` but requires `{ salon_id, service_id, preferred_date, preferred_time_range }` — not `{ email, feature }`.
- **Frontend**: Notify Me button added to `app/[locale]/angebote/page.tsx` (empty state). The button uses `prompt()` to collect email and posts to `/api/waitlist`, but the API will return 400 (validation error) because the schema doesn't match. The error is caught silently.
- **Missing**: A proper `/api/notify-me` or `/api/last-minute-waitlist` endpoint that accepts `{ email, feature }` and stores email subscriptions. Alternatively, extend the existing waitlist schema to support feature-based subscriptions.
- **Priority**: LOW — fails silently, does not crash the page.

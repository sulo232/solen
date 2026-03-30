# Full Platform Audit & Implementation Roadmap: Data & Analytics (PostHog)

## Phase A: Audit What Exists vs What's Missing

**1. Database**
- ⚠️ PARTIAL: `bookings`, `reviews`, `profiles` hold the raw transactional data, but PostHog is not deeply connected to track state changes.

**2. API Routes**
- ❌ MISSING: PostHog server-side capture in `app/api/stripe/webhook/route.ts`, review routes, auth routes, etc.
- ⚠️ PARTIAL: `app/api/analytics/salon/[id]/route.ts` exists and fetches bookings/revenue from the database, but it lacks "profile views" and "conversion rate" which require PostHog data.
- ❌ MISSING: `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` in `.env.local` to fetch data *from* PostHog into the dashboard.

**3. Frontend Components**
- ✅ EXISTS: `components/PostHogProvider.tsx` initializes PostHog for basic `$pageview` auto-capture.
- ❌ MISSING: `posthog.capture("salon_profile_viewed")` in `app/[locale]/salon/[slug]/page.tsx`.
- ❌ MISSING: `posthog.capture("search_performed")` in `components/ui/SearchBar.tsx` or `app/[locale]/search/page.tsx`.
- ❌ MISSING: Funnel tracking (`service_selected`, `booking_initiated`) in booking wizard components.
- ⚠️ PARTIAL: `app/[locale]/dashboard/analytics/page.tsx` displays database metrics, but needs UI updates for PostHog-driven metrics.

**4. Lib Utilities**
- ❌ MISSING: `lib/posthog-server.ts` for backend tracking.
- ❌ MISSING: `posthog-node` package in `package.json`.
- ❌ MISSING: `lib/posthog-api.ts` to fetch insights from PostHog to display in the salon dashboard.

---

## Phase B: Gap Analysis

- **UI Gaps**: The Salon Dashboard (`analytics/page.tsx`) needs new KPI cards for "Profilaufrufe" (Profile Views) and "Conversion Rate" (Views to Bookings). Booking flow components need `usePostHog()` capture calls to build the analytical funnel.
- **Backend Gaps**: We need `posthog-node` to reliably capture events during API requests. API routes must be instrumented for successful booking creation, payment success/failure, review submission, and user signups. Furthermore, to feed PostHog stats back to salon owners, the backend needs a utility `lib/posthog-api.ts` to query PostHog's Insights REST API (which requires obtaining a `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID`).
- **Security & Privacy Gaps**: We must ensure no sensitive PII is sent to PostHog without consent. We must correctly handle `posthog.identify()` linking guest usage to logged-in user usage once they authenticate.

---

## Phase C: Execution Roadmap

### R1: Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| 1. Server Setup | 🟢 SAFE | Next.js server startup | Ensure `posthog-node` is in dependencies and gracefully fallback if POSTHOG_KEY is missing. |
| 2. Client Tracking | 🟢 SAFE | Frontend navigation | Wrap `usePostHog()` calls in `try/catch` or check if `posthog` is initialized. |
| 3. Server Events | 🟡 MEDIUM | Payment webhooks, bookings API | Wrap `capture` calls in `try/catch`. DO NOT block critical flows if analytics fail. |
| 4. Dashboard | 🟡 MEDIUM | Salon analytics dashboard | Provide fallback `0` metrics if PostHog API request fails or times out. |
| 5. Manual Setup | 🟢 SAFE | Nothing | Only alters PostHog dashboard. |

---

### [🤖 CODE] Phase 1: PostHog Server Setup & Tools

**Files to modify:**
- `[MODIFY] package.json`
- `[MODIFY] .env.example`
- `[NEW] lib/posthog-server.ts`
- `[NEW] lib/posthog-api.ts`

**Steps:**
1. Run `npm install posthog-node`.
2. Update `.env.example` to include `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID`.
3. Create `lib/posthog-server.ts` with a singleton `PostHog` client from `posthog-node`, configured with `NEXT_PUBLIC_POSTHOG_KEY`.
4. Create `lib/posthog-api.ts` with fetch wrappers to query `https://eu.posthog.com/api/projects/{POSTHOG_PROJECT_ID}/insights/trend/`.

> ✅ **DO:** Create a non-blocking `trackServerEvent` function that catches any network errors so analytics never crash the app.
> ❌ **DON'T:** Use `posthog-js` on the server-side.

**Verification:**
- **Commit:** `git commit -m "phase 1: add posthog server setup and api utilities"`
- **Check:** `npm run build` must pass. Ensure `lib/posthog-server.ts` exports a valid client.

> ⚠️ **BE CAREFUL:** PostHog API endpoints are on `eu.i.posthog.com` for ingestion, but `eu.posthog.com` for the REST API. Ensure `lib/posthog-api.ts` uses the correct base URL.

---

### [🤖 CODE] Phase 2: Client-Side Funnel & Event Tracking

**Files to modify:**
- `[MODIFY] app/[locale]/salon/[slug]/page.tsx`
- `[MODIFY] components/ui/SearchBar.tsx`
- `[MODIFY] components/booking/GuestBookingForm.tsx` (and other relevant booking components)

**Steps:**
1. In `app/[locale]/salon/[slug]/page.tsx`, use `useEffect` and `usePostHog` to fire `posthog.capture("salon_profile_viewed", { salon_id: salon.id, salon_name: salon.name })`.
2. In `SearchBar.tsx`, capture `search_performed` with categories/dates on submit.
3. In booking flow components, add `service_selected` and `booking_initiated` events.

> ✅ **DO:**
> ```tsx
> const posthog = usePostHog();
> useEffect(() => { posthog?.capture('salon_profile_viewed', { salon_id }); }, [salon_id]);
> ```
> ❌ **DON'T:** Track every single keystroke in the search bar. Track only the final submission.

**Verification:**
- **Commit:** `git commit -m "phase 2: implement client-side event tracking"`
- **Check:** `npm run build`. 

> ⚠️ **BE CAREFUL:** Avoid infinite loops with `useEffect` when firing tracking events. Be sure dependency arrays are exact.

---

### [🤖 CODE] Phase 3: Server-Side Core Events

**Files to modify:**
- `[MODIFY] app/api/auth/register-action/route.ts` (or relevant auth file)
- `[MODIFY] app/api/stripe/webhook/route.ts`
- `[MODIFY] app/api/reviews/[id]/respond/route.ts` (or main review posting route)

**Steps:**
1. In Auth routes: use `posthog.identify()` to map the Supabase ID, then call `posthog.capture('customer_signup' | 'salon_signup')`.
2. In Stripe Webhook: `payment_succeeded` and `payment_failed` capturing the amount and salon ID.
3. In Reviews API: `review_submitted` with rating and salon ID.
4. In Booking API (or webhook where booking is marked paid/confirmed): `booking_created` and `booking_completed` / `booking_cancelled`.

> ✅ **DO:** Use `posthogClient.capture({ distinctId: user_id, event: 'booking_completed', properties: { salon_id, value } })`.
> ❌ **DON'T:** Await the `posthogClient.capture()` if it slows down the webhook response to Stripe. Let it run async, or use `posthog.flush()` carefully.

**Verification:**
- **Commit:** `git commit -m "phase 3: implement server-side core events"`
- **Check:** `npm run build`.

> ⚠️ **BE CAREFUL:** Stripe webhooks must return a 200 quickly. Put tracking calls in an async boundary or just fire and forget them without `await`.

---

### [🤖 CODE] Phase 4: Salon Dashboard Integration

**Files to modify:**
- `[MODIFY] app/api/analytics/salon/[id]/route.ts`
- `[MODIFY] app/[locale]/dashboard/analytics/page.tsx`

**Steps:**
1. Update `app/api/analytics/salon/[id]/route.ts` to call `lib/posthog-api.ts` to fetch "Profile Views" for the given `salon_id` over the requested period.
2. Calculate `conversion_rate = (total_bookings / profile_views) * 100`.
3. Update the `AnalyticsData` interface in both backend/frontend.
4. Update `app/[locale]/dashboard/analytics/page.tsx` to display the "Profilaufrufe" and "Conversion Rate" in new KPI StatCards.

> ✅ **DO:** Handle failures gracefully. `const views = await fetchPostHogViews().catch(() => 0);`.
> ❌ **DON'T:** Expose the `POSTHOG_PERSONAL_API_KEY` to the client. Keep all PostHog REST logic on the server.

**Verification:**
- **Commit:** `git commit -m "phase 4: integrate posthog data into salon dashboard"`
- **Check:** `npm run build`. Open the dashboard page to verify it renders without crashing.

> ⚠️ **BE CAREFUL:** PostHog API limits exist. The `route.ts` should potentially cache these values later. For now, just ensure it doesn't crash if PostHog rate-limits.

---

### [🧑 MANUAL] Phase 5: PostHog Funnel Configuration

**Steps for User/Admin:**
1. Log into `eu.posthog.com`.
2. Go to Project Settings -> Create a **Personal API Key** and note the **Project ID**. Add them to `.env.local` and Vercel.
3. Go to **Insights** -> Create New Insight -> **Funnel**.
4. Define the 5 steps:
   - Step 1: `salon_profile_viewed`
   - Step 2: `service_selected`
   - Step 3: `booking_initiated`
   - Step 4: `payment_succeeded` // or `booking_completed` depending on flow
5. Save the insight to the Main Dashboard as "Customer Booking Funnel".

**Verification:**
- Complete a test booking locally and verify all 4 steps register in the PostHog UI.

---

### [🤖 CODE] Phase 6: Sync CLAUDE.md (Final Step)

**Files to modify:**
- `[MODIFY] CLAUDE.md`

**Steps:**
1. Under "2. Tech Stack", add `posthog-node` to the backend list.
2. Under "3. Key Directories", add `posthog-server.ts` and `posthog-api.ts` to the `lib/` directory section.

**Verification:**
- **Commit:** `git commit -m "phase 6: update CLAUDE.md with posthog infrastructure"`
- Verify `CLAUDE.md` formatting is preserved.

---

### Dependency Ordering (R6)

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Backend Tracking Setup | Nothing |
| Phase 2 | 🤖 | Client Event Tracking | Nothing |
| Phase 3 | 🤖 | Server Event Tracking | Phase 1 |
| Phase 4 | 🤖 | Dashboard Integration | Phase 1 |
| Phase 5 | 🧑 | PostHog Funnel Setup | Phases 2 & 3 |
| Phase 6 | 🤖 | Update CLAUDE.md | All code phases |

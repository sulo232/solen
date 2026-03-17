# Dev 1 Roadmap — Backend APIs & Integrations (Dashboard Unblocker)

> **Role:** Build the missing API routes, wire up external integrations, and fix simplified Dev 3 features.
> **Branch:** `feature/backend-dashboard-apis`

---

## ⚠️ Mission Status
Dev 3 (Dashboard) has built the frontend UI for the salon dashboard (62/62 pages), but many pages are using simplified features or erroring out because the underlying `app/api/` routes do not exist yet. 

**Your job is to build these missing APIs and wire up the missing libraries.**

---

## Phase 1 — Missing Dashboard APIs (CRUD)
*Build these routes in `app/api/...` using the `createServerSupabaseClient`.*

### 1. Staff Management (`/api/staff`)
- **`GET /api/staff?salon_id=X`**: Return all active staff for a salon.
- **`POST /api/staff`**: Insert new staff member. `body: { salon_id, name, avatar_url, specialties }`
- **`PATCH /api/staff/{id}`**: Update existing staff member.
- **`DELETE /api/staff/{id}`**: Soft delete (`is_active = false`).

### 2. Services Management (`/api/services`)
- **`GET /api/services?salon_id=X`**: Return all active services.
- **`POST /api/services`**: Insert new service. `body: { salon_id, name_de, name_en, category, duration_minutes, price }`
- **`PATCH /api/services/{id}`**: Update existing service.
- **`DELETE /api/services/{id}`**: Soft delete (`is_active = false`).

### 3. Salon Settings & Profile (`/api/salons/{id}`)
- **`PATCH /api/salons/{id}`**: Update salon details (address, hours, phone, instagram, cancellation_policy, categories).

### 4. Calendar Management (`/api/slots`)
- **`DELETE /api/slots/{id}`**: Delete a specific availability slot.
- **`POST /api/slots/bulk`**: Create weekly repeating template slots. `body: { salon_id, start_time, end_time, days_of_week, staff_member_id }`

### 5. Profile Context (`/api/profile`)
- **Fix `GET /api/profile`**: Currently it just returns customer info. It MUST check if the user owns a salon and append `salon_id`, `salon_name`, and `salon_categories` to the response payload, because every dashboard page relies on this context to load data.

### 6. Analytics (`/api/analytics/salon/{id}`)
- **`GET /api/analytics/salon/{id}`**: Return basic stats for recharts.
  - Total bookings this month vs last month.
  - Revenue sum (if applicable).
  - Most popular service booked.

---

## Phase 2 — Fixing "Simplified" Features (Integrations)

### 2.1 Drag-to-Reorder Gallery (Frontend fix in Dashboard)
Dev 3 used URL text inputs because no drag library was installed.
- **Install:** `npm install @hello-pangea/dnd`
- **Fix:** Update the Salon Settings gallery component to use a real drag-and-drop list to reorder photos.

### 2.2 Address Autocomplete
Dev 3 used a plain text input.
- **Install:** `@react-google-maps/api` or `react-places-autocomplete`. (Ensure API keys are added to `.env.local` `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`).
- **Fix:** Update the onboarding and settings address fields to use Swiss address autocomplete.

### 2.3 Confetti on Onboarding
Dev 3 skipped the confetti because the library was missing.
- **Install:** `npm install canvas-confetti @types/canvas-confetti`
- **Fix:** Fire confetti automatically when the `app/[locale]/onboarding/salon/page.tsx` wizard hits 100% completion.

### 2.4 Supabase Storage Image Uploads
Dev 3 used plain text URL inputs instead of file uploaders.
- **Setup Supabase:** Ensure `avatars` and `salon-galleries` buckets exist and are public.
- **API:** Create `POST /api/upload` (or use Supabase client directly in the browser) to accept a `FormData` file, upload it to the `salon-galleries` bucket, and return the public URL.
- **Fix:** Update the Staff form (avatar) and Settings form (gallery) to use a hidden `<input type="file">` button that uploads the image and saves the URL.

### 2.5 Vacation Mode (Date Block + Email)
Dev 3 only implemented a single-day block.
- **Fix:** Update the Calendar/Settings to allow picking a *Date Range* (start date -> end date).
- **Backend Trigger:** When saved, delete/block all slots in that range, and trigger `lib/email.ts` to email customers who had bookings in that range that their appointments were cancelled due to salon vacation.

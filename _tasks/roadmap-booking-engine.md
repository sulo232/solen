# Booking Engine Audit & Implementation Roadmap

> **Topic:** Booking Engine Execution (Phases A→D based on full-platform-audit protocol)

## Phase A & B: Audit & Gap Analysis

| Feature | Status | Details & Gap Analysis |
|---|---|---|
| **Booking creation flow** | ⚠️ PARTIAL | Frontend sends booking. Backend creates it. Gap: Creates with `pending_approval` based on salon setting, but `pending_approval` is MISSING from `BookingStatus` in `lib/types.ts`.
| **Status lifecycle** | ⚠️ PARTIAL | `BookingStatus` type missing `pending_approval`. `PATCH /api/bookings/[id]` is MISSING; the dashboard 405 errors when marking completed/no-show. |
| **Modification window** | ⚠️ PARTIAL | Reschedule route exists but lacks the `appointment_time - now() > 24 hours` check. Frontend also needs to disable the Modify button < 24h. |
| **Cancellation window** | ✅ EXISTS | Logic exists via `cancellation-policy.ts` applying 50% (or configurable) late fee if <24h. |
| **Salon approval flow** | ❌ MISSING | Missing a cron job to auto-cancel `pending_approval` bookings after a timeout (e.g. 24h) and notify the customer. |
| **Salon cancellation** | ❌ MISSING | `cancel` route explicitly checks `booking.user_id !== user.id` and 403 blocks Salon Owners. Missing `cancellation_count` increment and >3 warning logic. |
| **No-show detection** | ❌ MISSING | Missing `no-show` cron job entirely. Current `auto-complete` cron blindly completes ALL past bookings, masking no-shows! Needs complete overhaul to charge full price and track `no_show_count`. |
| **Booking completion** | ⚠️ PARTIAL | Dashboard has UI but `PATCH /api/bookings/[id]` doesn't exist. Missing payout eligibility trigger (transfer to connected account delayed by 7 days). |
| **Availability disclaimer** | ❌ MISSING | Missing disclaimer in frontend booking flow regarding non-real-time availability. |
| **Auto-cancel on suspension** | ❌ MISSING | Missing batch cancellation of bookings when an admin suspends a salon account. |

---

## Phase C: Execution Roadmap

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Types | Add missing `pending_approval` to types and adjust DB enum constraints if needed |
| Phase 2 | 🔴 HIGH | Booking Cancellation | Only remove the strict customer check for salons, don't break Stripe refunds |
| Phase 3 | 🟡 MEDIUM | Cron Jobs | Carefully replace `auto-complete` so it doesn't clash with `no-show`, don't overcharge Stripe |
| Phase 4 | 🟢 SAFE | Frontend UI | Use existing Next.js design system, don't break booking flow forms |
| Phase 5 | 🟢 SAFE | Documentation | Only modify the Schema Table in CLAUDE.md |

### 🤖 Phase 1: Database & Types
- **[MODIFY]** `lib/types.ts`: Add `"pending_approval"` to `BookingStatus` type definition.
- **[NEW]** `supabase/migrations/072_booking_engine_updates.sql`: Add `cancellation_count` (int, default 0) to `salons` table and `no_show_count` (int, default 0) to `profiles` table.

> ⚠️ **BE CAREFUL:** `BookingStatus` is used across multiple files. Adding a new enum value might require casting if DB relies on a strict text constraint, ensure we `ALTER TABLE` constraints if they exist in DB.

**✅ DO:**
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS cancellation_count integer DEFAULT 0;
```
**❌ DON'T:**
```sql
-- Don't drop and recreate the table
DROP TABLE salons;
```

**Verification:**
- `git commit -m "phase 1: add pending_approval status and tracking columns"`
- `npm run build && npx tsc --noEmit`

### 🤖 Phase 2: API Route Fixes
- **[NEW]** `app/api/bookings/[id]/route.ts` (Add `PATCH` method): Add missing `PATCH` export to handle `status` updates (`completed`, `no_show`) from the dashboard UI. Ensure payout hold trigger is initiated if `completed`.
- **[MODIFY]** `app/api/bookings/[id]/cancel/route.ts`: Allow salon owners to cancel. If cancelled by salon: process 100% refund, increment `cancellation_count` on salon by 1. Add >3 suspension warning log check.
- **[MODIFY]** `app/api/bookings/[id]/reschedule/route.ts`: Enforce `appointment_time - now() > 24 hours` before allowing customer reschedule.

> ⚠️ **BE CAREFUL:** The dashboard UI relies strongly on the `PATCH` endpoint for completing bookings. Ensure it returns the correct structure. Follow Rule S1 for all API security layers (auth, rate limit, validation).

**✅ DO:**
```typescript
import { applyRateLimit, bookingLimiter } from "@/lib/ratelimit";
```
**❌ DON'T:**
```typescript
// Don't skip security check layers
export async function PATCH() { ... }
```

**Verification:**
- `git commit -m "phase 2: booking patch endpoint and cancellation permissions"`
- `npm run build && npx tsc --noEmit`

### 🤖 Phase 3: Cron Jobs
- **[NEW]** `app/api/cron/pending-timeout/route.ts`: Find bookings in `pending_approval` older than 24 hours from creation. Auto-cancel them, release slots, notify customers.
- **[NEW]** `app/api/cron/no-show/route.ts`: Identify confirmed bookings whose `ends_at` has passed (e.g. by 24h) with no action. Mark as `no_show`, capture 100% payment (no refund), increment user's `no_show_count`. Insert warning if >3 in 6 months.
- **[MODIFY]** `app/api/cron/auto-complete/route.ts`: Change the logic so it does not prematurely mark `no_show` candidates as `completed`. (Delay to 48h to give salons manual marking window, or remove complete automation if salon must do it via dashboard).

> ⚠️ **BE CAREFUL:** Cron jobs run autonomously. If `no-show` charges mistakenly, it causes huge customer support issues. Add strict `where` clauses (`status = 'confirmed'`).

**✅ DO:**
```typescript
.eq('status', 'confirmed').lt('ends_at', twentyFourHoursAgo)
```
**❌ DON'T:**
```typescript
// Don't update without checking status
.lt('ends_at', now)
```

**Verification:**
- `git commit -m "phase 3: booking engine cron jobs (no-show, pending-timeout)"`
- `curl -H "Authorization: Bearer CRON_SECRET" http://localhost:3000/api/cron/no-show`
- `npm run build`

### 🤖 Phase 4: UI Enhancements & Admin
- **[MODIFY]** `components/booking/GuestBookingForm.tsx` (and other booking flow components): Add the availability disclaimer: "Availability shown may not be fully up to date. The salon will confirm your appointment."
- **[MODIFY]** `app/[locale]/booking-action/page.tsx` (or similar UI): Enforce disabled modification buttons for `< 24h`.
- **[MODIFY]** `app/api/admin/salons/[id]/route.ts` (or similar suspension route/logic if it exists): When `is_active` set to false, batch update all `pending_approval` and `confirmed` bookings to `cancelled`. Process Stripe refunds.

> ⚠️ **BE CAREFUL:** Batch cancellations for suspended salons need to gracefully handle Stripe errors without failing the DB transaction entirely.

**✅ DO:**
```typescript
await Promise.allSettled(bookings.map(b => stripe.refunds.create(...)))
```
**❌ DON'T:**
```typescript
// Don't throw if one refund fails
await Promise.all(...)
```

**Verification:**
- `git commit -m "phase 4: availability disclaimer and admin suspension cancellations"`
- `npm run build && npx tsc --noEmit`

### 🤖 Phase 5: Update CLAUDE.md
- **[MODIFY]** `CLAUDE.md`: Update Section 6 Schema Table to include `cancellation_count` on `salons` table and `no_show_count` on `profiles` table.

> ⚠️ **BE CAREFUL:** Only modify the designated schema section. Do not randomly delete documentation.

**✅ DO:**
```markdown
| `salons` | `id`, `cancellation_count`, ...
```
**❌ DON'T:**
```markdown
// Don't rewrite the whole table
```

**Verification:**
- `git commit -m "phase 5: update CLAUDE.md with tracking columns"`

---

### Dependency Order

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | DB Columns & Types | None |
| Phase 2 | 🤖 | API Updates | Phase 1 |
| Phase 3 | 🤖 | Cron Jobs | Phase 1 & 2 |
| Phase 4 | 🤖 | UI & Admin Logic | Phase 2 |
| Phase 5 | 🤖 | Update CLAUDE.md | Phase 1 |

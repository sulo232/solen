# Notification System Roadmap

| Risk Area | Impact | Mitigation |
| :--- | :--- | :--- |
| **Database** | Missing `notifications` table | Add new standalone migration with strict RLS policies. |
| **UI** | Notification bell might break Header layout | Ensure responsive design and test in mobile/desktop views. |
| **Email Logic** | Missing templates for various events | Add templates to `lib/email.ts` and ensure correct translation logic (DE/EN/FR/IT). |
| **Realtime** | Supabase subscriptions | Enable publication on `notifications` table to support Realtime without polling. |

---

## 🤖 PHASE 1: Database Migration

### ⚠️ BE CAREFUL
- Do not drop/recreate tables if they already exist without safety checks.
- Add `notifications` to logical replication for Supabase Realtime to work.
- Strict RLS: users can only view and update (`read` status) their own notifications. Insertions should be restricted to service_role or trigger functions.

### Actions
1. **[NEW] `supabase/migrations/075_in_app_notifications.sql`**
   - Create `public.notifications` table (id, user_id, type, title, body, read, data, created_at)
   - Add foreign key `user_id` -> `auth.users(id)` ON DELETE CASCADE
   - Enable RLS: `SELECT` using `user_id = auth.uid()`, `UPDATE` (for reading) using `user_id = auth.uid()`.
   - Add table to supabase_realtime publication: `ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;`

### ❌ DON'T
```sql
CREATE POLICY "insert_notifications" ON notifications FOR INSERT WITH CHECK (true); -- ❌ Anyone can insert
```

### ✅ DO
```sql
CREATE POLICY "read_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id); -- ✅ Secure
```

### Verification
- `npm run build`
- `git commit -m "feat(notifications): add notifications table migration"`

---

## 🤖 PHASE 2: Core Notification Utilities

### ⚠️ BE CAREFUL
- Since we have email templates directly in `lib/email.ts`, `lib/email-templates/booking-notifications.ts`, etc., we should organize them properly instead of crowding a single file.
- The new unified notification function should trigger **both** email and in-app notifications if required.

### Actions
1. **[NEW] `lib/notifications.ts`**
   - Create a unified `sendNotification(event_type, payload)` utility.
   - For a given event type, this function will:
     1. Insert a row into the new `notifications` table via service role client (`lib/supabase.ts` `supabaseAdmin`).
     2. Send the correct Email template via `sendEmail()`.
2. **[MODIFY] `lib/email.ts`** or related `lib/email-templates/...`
   - Add missing templates for: Pending approval, Approval/Reject, Booking modified, No-show charge, Late fee, Refund, New review, Review response, Review flagged, Warning, Suspension, Payout success/fail, T&S changes, Strike.

### Verification
- `npm run build`
- `git commit -m "feat(notifications): add core notification sender and email templates"`

---

## 🤖 PHASE 3: Notification UI Components

### ⚠️ BE CAREFUL
- Ensure real-time subscription is cleaned up on unmount to avoid memory leaks.
- Keep the dropdown accessible (keyboard navigation).
- Adhere to premium design UI (no pure black/white, soft shadows, inter font).

### Actions
1. **[NEW] `components/notifications/NotificationBell.tsx`**
   - Bell icon (`lucide-react` Bell).
   - Badge for unread count.
   - Popover/Dropdown showing recent notifications.
2. **[NEW] `components/notifications/NotificationItem.tsx`**
   - Renders individual notification based on `type`.
   - Uses `data` JSON for dynamic links (e.g., link to booking or review).
3. **[MODIFY] `components/Header.tsx`** or TopNav
   - Integrate `<NotificationBell />` for authenticated users.

### Verification
- `npm run build`
- `git commit -m "feat(ui): implement notification bell and realtime component"`

---

## 🤖 PHASE 4: Update Existing Workflows

### ⚠️ BE CAREFUL
- Existing handlers in `/app/api/` need to be updated to call `sendNotification(...)` instead of old direct email sends or doing nothing.

### Actions
1. **[MODIFY] `app/api/bookings/[id]/confirm/route.ts`** -> Call `sendNotification('booking_confirmed', ...)`
2. **[MODIFY] `app/api/bookings/[id]/cancel/route.ts`** -> Call `sendNotification('booking_cancelled', ...)`
3. **[MODIFY] Admin routes (`app/api/admin/salons/[id]/reject/route.ts`, etc.)** -> Call warnings / suspensions.
4. **[MODIFY] Review/Webhook handlers** -> Call appropriate payouts/review notifications.

### Verification
- `npm run build`
- `git commit -m "feat(backend): wire up new notifications utility to all endpoints"`

---

## 🧑 PHASE 5: Manual Steps & Configuration

### ⚠️ BE CAREFUL
- Test email sending and realtime subscription locally or on staging first securely.

### Actions
1. Manually apply `supabase db push` to push `075_in_app_notifications.sql` to local and production.
2. Ensure Vercel environment variables `RESEND_API_KEY` are correct.
3. Verify notification bell works by creating a dummy booking as Customer.

---

## 🤖 PHASE 6: Documentation

### Actions
1. **[MODIFY] `CLAUDE.md`**
   - Add `notifications` table reference to Database Schema section.
   - Update any new standards regarding unified `sendNotification` utility over direct `sendEmail` calls.

### Verification
- `npm run build`
- `git commit -m "docs: add notifications table and standards to CLAUDE.md"`

---

## DEPENDENCY ORDER

| Order | Phase | Blocks |
| :--- | :--- | :--- |
| 1 | Phase 1 (Database) | Phase 2, 3, 4 |
| 2 | Phase 2 (Core Utility + Emails) | Phase 4 |
| 3 | Phase 3 (UI Components) | - |
| 4 | Phase 4 (Wire up APIs) | - |
| 5 | Phase 5 (Manual Config) | Phase 6 |
| 6 | Phase 6 (Docs) | Final Release |

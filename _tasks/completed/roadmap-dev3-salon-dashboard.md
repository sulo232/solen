# Dev 3 Roadmap — Salon Dashboard & Platform
**Branch:** `feature/salon-dashboard` · Rebase on `main` daily  
**Stack:** Next.js 15, next-intl, Tailwind CSS, Lucide React, recharts, Supabase Realtime  
**Rule:** Never call Supabase directly (except Realtime). Use `fetch('/api/...')`. Import types from `lib/types.ts`. Never touch `app/api/`, `lib/`, `supabase/`. Never touch customer-facing pages/components.

> [!IMPORTANT]
> Import shared components from Dev 2 (NOT from `components/dashboard/`):
> - `import { ChatWindow } from '@/components/ChatWindow'` — use `perspective='salon'`
> - `import { Spinner } from '@/components/ui/Spinner'`
> - `import { SalonCard } from '@/components/SalonCard'` — for settings preview
>
> If Dev 2 hasn't merged a component yet: build a temporary stub in `components/dashboard/` (e.g. `TempChatWindow.tsx`) and swap when available.

---

## Current State
All `app/[locale]/dashboard/` pages are empty stubs (`return null`). No `components/dashboard/` dir. `/de/onboarding/salon/` doesn't exist yet.

---

## Phase 1 — DashboardLayout & Auth Guard
*All dashboard pages depend on this — build first.*

**File:** `components/dashboard/DashboardLayout.tsx`

| Spec | Detail |
|------|--------|
| Sidebar (desktop) | Fixed left, **240px**. Logo, nav links, salon name + avatar. Glass: `bg-white/90 backdrop-blur-lg` |
| Bottom nav (mobile) | Fixed bottom, **5 icons**: Übersicht, Termine, Nachrichten, Team, Mehr. Active = teal. |
| Unread badge | Coral dot on Nachrichten if `unread_count_salon > 0` |
| Auth guard | Dashboard only for `role = 'salon_owner'`. If customer → redirect to `/de/account`. If logged out → redirect to `/de/auth/login?redirect=/dashboard`. |

### Navigation Links (all use Lucide React icons)
| Label | Route | Icon |
|-------|-------|------|
| Übersicht | `/dashboard` | `Home` |
| Termine | `/dashboard/bookings` | `Calendar` |
| Kalender | `/dashboard/calendar` | `Clock` |
| Nachrichten | `/dashboard/messages` | `MessageCircle` |
| Team | `/dashboard/staff` | `Users` |
| Services | `/dashboard/services` | `Scissors` |
| Statistiken | `/dashboard/analytics` | `BarChart` |
| Einstellungen | `/dashboard/settings` | `Settings` |

---

## Phase 2 — Salon Onboarding Wizard
**File:** `app/[locale]/onboarding/salon/page.tsx`  
6-step wizard. Owner must already have a solen.ch account. Progress bar at top.

### Step 1: Salon Basics
- Salon name (required)
- Categories: **multi-select checkboxes** — Coiffeur, Barbershop, Nails, Spa/Massage, Make-up/Kosmetik, Waxing/Sugaring → maps to `salons.categories` array
- Quartier: dropdown (all 7 Quartiere)
- Address: text input with Swiss address autocomplete → auto-fills lat/lng
- Phone (optional)

### Step 2: Salon Profile
- Cover photo upload (Supabase Storage `salon-photos` bucket, **required**)
- Gallery photos (up to 5, drag-to-reorder)
- Description DE (textarea, max 500 chars)
- Description EN (optional)
- Instagram URL — label: "Verlinke dein Instagram für dein Portfolio"
- Opening hours: grid of 7 days. Each day: toggle open/closed + time pickers (open/close times)

### Step 3: Services
- Add services one by one
- Each service: Name DE (required) + Name EN, Category (from salon's selected categories — constrained), Duration (minutes), Price (CHF), Description, Suitable for (multi-select age groups), Gender (multi-select: male/female/non_binary)
- **Minimum 1 service required** to proceed

### Step 4: Team
- Add team members: Name, Photo, Specialties (tag input)
- "Nur ich" button for solo salons (skips adding more members)

### Step 5: Availability
- Weekly template: time blocks per staff member per day
- Auto-generates `availability_slots` for next 14 days
- Preview counter: **"42 Slots für die nächsten 2 Wochen erstellt."** (live count)

### Step 6: Last-Minute Settings
- Toggle Ja/Nein
- Discount slider: 5–50%, default 10%
- Window hours slider: 2–24 hours, default 6
- Info text: "Nicht gebuchte Termine werden automatisch als Last-Minute angezeigt."

### Completion
`POST /api/salons` → creates salon + services + staff + slots. Sets `profiles.role = 'salon_owner'`. Redirect to `/dashboard` with celebration animation.

---

## Phase 3 — Dashboard Overview
**File:** `app/[locale]/dashboard/page.tsx`

| Section | Detail |
|---------|--------|
| Today's bookings | List: time, service, customer name. **"Neukunde" coral pill badge** if `is_first_visit = true`. |
| Unread messages | Count + latest message preview. Tap → `/dashboard/messages`. |
| This week stats | Cards: Total bookings, Revenue (CHF), New customers, Average rating |
| Action required | Alerts: low slots (<5 in next 7 days), verification needed, pending cancellation requests |
| Quick actions | "Neuen Termin erstellen", "Service hinzufügen", "Nachricht lesen" |

Data: `GET /api/bookings?salon_id={id}&date=today`, `GET /api/conversations?salon_id={id}&unread=true`, `GET /api/analytics/salon/{id}?period=week`

---

## Phase 4 — Booking Management
**File:** `app/[locale]/dashboard/bookings/page.tsx`  
Data: `GET /api/bookings?salon_id={id}`, paginated, filterable.

### List View

| Spec | Detail |
|------|--------|
| Filters | Status (Alle / Bestätigt / Storniert / Abgeschlossen), Date range, Staff, Service |
| List item | Customer avatar + name, service, date/time, staff, price, status badge, **first-visit "Neukunde" badge** |
| Recurring tag | Repeat icon + "Wiederkehrend" tag if `is_recurring = true` |
| Actions | Mark completed (`PATCH status=completed`), Mark no-show (`PATCH status=no_show`), View customer profile (modal) |

### Cancellation Handling
- **Customer cancellation**: appears in "Storniert" filter with the customer's reason. **Slot auto-freed automatically.**
- **Salon-initiated cancellation**: salon provides reason via dropdown:
  - Krankheit
  - Technisches Problem
  - Personalmangel
  - Sonstiges

  `POST /api/bookings/{id}/cancel` → slot freed, **customer emailed automatically**.

---

## Phase 5 — Calendar & Slot Management
**File:** `app/[locale]/dashboard/calendar/page.tsx`

### Calendar Grid

| Spec | Detail |
|------|--------|
| Layout | Week view. 7 columns (days), rows = 30-min slots 08:00–20:00. Tabs: per-staff + "Alle" |
| Available slot | Teal block |
| Booked slot | Dark block + customer name |
| Blocked slot | Gray hatched pattern |
| Last-Minute slot | Teal + **coral border** (auto-tagged by the system) |
| Create slot | Click + drag on empty time → modal: select service(s), staff, confirm |
| Block time | **Right-click / long-press** on slot → "Zeit blockieren" |
| Delete slot | Click slot → "Löschen". If slot is booked: warn + trigger cancellation flow |
| Week navigation | Previous/next week arrows + "Heute" button |

### Bulk Create
"Wochenplan erstellen" → set weekly time template → apply to next **1 / 2 / 4 weeks** (radio choice).

### Date Blocking
- "Tag blockieren" on day column header → blocks all slots for that day
- **Urlaubsmodus** in settings (date range picker) → blocks range, displays warning to customers browsing the salon
- Blocked dates that affect recurring bookings → **rebooking email sent** to affected customers

---

## Phase 6 — Salon Messaging
**File:** `app/[locale]/dashboard/messages/page.tsx`

### Inbox
Data: `GET /api/conversations?salon_id={id}`, sorted by `last_message_at` desc.

| Spec | Detail |
|------|--------|
| List item | Customer avatar + name + preview + timestamp + unread badge + **first-visit "Neukunde" badge** |
| Chat view | `<ChatWindow conversationId={id} perspective="salon" currentUserId={ownerId} />` |

> [!NOTE]
> If Dev 2's `ChatWindow` isn't merged yet: use `components/dashboard/TempChatWindow.tsx` as a stub and replace when available.

### Quick Replies
Dropdown of pre-set templates — customizable in settings. **Default templates:**
1. "Vielen Dank für Ihre Nachricht!"
2. "Ihr Termin wurde bestätigt."
3. "Leider sind wir ausgebucht."

---

## Phase 7 — Staff Management
**File:** `app/[locale]/dashboard/staff/page.tsx`  
Data: `GET /api/staff?salon_id={id}`, `POST /api/staff`, `PATCH /api/staff/{id}`, `DELETE /api/staff/{id}`

| Spec | Detail |
|------|--------|
| List | Grid of cards: photo/initials, name, specialties tags, active toggle, edit/delete buttons |
| Add | Modal: Name, Photo, Specialties (tag input), Active toggle |
| Edit | Same modal. `PATCH /api/staff/{id}`. |
| Delete | Confirmation modal. If staff has future bookings: warn **"Diese Person hat X Termine. Diese werden storniert."** |

---

## Phase 8 — Service Management
**File:** `app/[locale]/dashboard/services/page.tsx`  
Data: `GET /api/services?salon_id={id}`, `POST /api/services`, `PATCH /api/services/{id}`, `DELETE /api/services/{id}`

| Spec | Detail |
|------|--------|
| List | Sortable table: Name, Category, Duration, Price, Suitable for, Active toggle |
| Add / Edit | Modal: Name DE (required) + EN, Category, Duration, Price, Description, Suitable for (age groups), Gender (multi-select), Active |
| Category constraint | Category must be one of the salon's selected categories |
| Delete | Warning if future bookings exist |

---

## Phase 9 — Salon Settings
**File:** `app/[locale]/dashboard/settings/page.tsx`

### Profile Tab
- Name, description DE + EN, cover photo, gallery (drag-to-reorder), address, phone, Instagram
- Categories: multi-select add/remove
- Opening hours editor (same as onboarding step 2)
- **Preview**: "So sieht dein Salon für Kunden aus" → renders `<SalonCard />` (imported from Dev 2)

### Last-Minute Tab
- Discount toggle + percentage slider (5–50%)
- Window hours slider (2–24h)
- **Preview** of what their Last-Minute card looks like to customers

### Quick Reply Templates Tab
- Editable list of quick reply templates. Add / edit / delete.
- Pre-populated with 3 defaults (see Phase 6)

### Verification Tab
- "Letzte Verifizierung: {date}" + "Nächste fällig: {date}"
- If `verification_warnings > 0`: **coral banner** "Dein Salon hat {n}/3 Warnungen. Bitte bestätige." + "Jetzt bestätigen" button
- If `is_active = false` (frozen): **full-page red overlay** "Dein Salon wurde eingefroren. Kontaktiere support@solen.ch." Dashboard becomes fully read-only — only settings page accessible.

### Cancellation Policy Tab
- Display: "Kunden können bis 24h vor dem Termin stornieren."
- **V1: Fixed at 24h (not configurable). V2: customizable.**

---

## Phase 10 — Analytics
**File:** `app/[locale]/dashboard/analytics/page.tsx`  
Data: `GET /api/analytics/salon/{id}`. Charts via **recharts**.

| Chart | Type | Detail |
|-------|------|--------|
| Bookings over time | Line chart | Daily, last 30 days |
| Revenue | Bar chart | Weekly, last 12 weeks (CHF) |
| Top services | Horizontal bar | Ranked by booking count |
| Customer breakdown | Pie chart | New vs returning |
| Cancellation rate | Number card | % last 30 days |
| Average rating | Large number | + trend arrow (up/down vs prev period) |
| Last-Minute performance | Stacked bar | Booked vs expired slots |

---

## Phase 11 — Verification UI
*Dev 1 handles the cron job + email sending. You handle the UI responses.*

| Trigger | UI |
|---------|-----|
| Owner clicks link in verification email | `/api/salons/verify?token=X` → redirects to `/dashboard/settings` with **success toast** |
| `verification_warnings > 0` | Persistent coral banner on dashboard overview AND in settings verification tab |
| `is_active = false` (frozen) | Entire dashboard read-only. **Full-page overlay** blocks all pages except settings. Customer-facing: frozen salon disappears automatically (API filters `is_active = true`) |

---

## API Reference

| Endpoint | Phase |
|----------|-------|
| `POST /api/salons` | 2 (onboarding completion) |
| `GET /api/bookings?salon_id=&date=&status=&staff=&service=` | 3, 4 |
| `PATCH /api/bookings/{id}` | 4 (complete/no-show) |
| `POST /api/bookings/{id}/cancel` | 4, 5 |
| `GET /api/slots?salon_id=&week=` | 5 |
| `POST /api/slots` | 5 (create slot) |
| `DELETE /api/slots/{id}` | 5 |
| `POST /api/slots/bulk` | 5 (weekly template) |
| `GET /api/conversations?salon_id=` | 6 |
| `GET /api/messages?conversation_id=` | 6 |
| `POST /api/messages` | 6 |
| `GET /api/staff?salon_id=` | 7 |
| `POST /api/staff` | 7 |
| `PATCH /api/staff/{id}` | 7 |
| `DELETE /api/staff/{id}` | 7 |
| `GET /api/services?salon_id=` | 8 |
| `POST /api/services` | 8 |
| `PATCH /api/services/{id}` | 8 |
| `DELETE /api/services/{id}` | 8 |
| `GET /api/salons/{id}` | 9 |
| `PATCH /api/salons/{id}` | 9 |
| `GET /api/analytics/salon/{id}?period=` | 3, 10 |
| `GET /api/salons/verify?token=` | 11 |

## Supabase Realtime (allowed)
```ts
// New messages (Messaging inbox)
supabase.channel('salon-msgs').on('postgres_changes',
  { table: 'messages', filter: `conversation_id=eq.${id}` }, handler).subscribe()

// Slot changes (Calendar live updates)
supabase.channel('salon-slots').on('postgres_changes',
  { table: 'availability_slots', filter: `salon_id=eq.${salonId}` }, handler).subscribe()
```

---

## Delivery Checklist
- [ ] Onboarding wizard: creates salon + services + staff + slots. Completion redirect + celebration.
- [ ] Dashboard overview: today's bookings with "Neukunde" badge, action alerts, stats, quick actions
- [ ] Booking list: all filters work. First-visit badge. Recurring tag. Mark completed/no-show.
- [ ] Salon cancellation: 4-option reason dropdown. Customer emailed.
- [ ] Calendar: create (click+drag), block (right-click/long-press), delete with booking warning
- [ ] Bulk slot creation: weekly template → apply to 1/2/4 weeks
- [ ] Vacation mode: blocks date range, warns customers, emails recurring customers
- [ ] Messaging: `ChatWindow` imported `perspective='salon'`. Realtime. Quick replies (3 defaults + custom).
- [ ] Staff: add/edit/delete. Delete warns with booking count.
- [ ] Services: category constraint enforced. Delete warns if bookings.
- [ ] Settings preview: SalonCard renders correctly (imported from Dev 2)
- [ ] Quick reply templates: editable, pre-populated defaults
- [ ] Verification: warnings banner, frozen full-page overlay, settings-only access when frozen
- [ ] Verification email link → redirect to settings + success toast
- [ ] Analytics: all 7 charts render with real data (recharts)
- [ ] Auth guard: `role = 'salon_owner'` only. Customers → `/de/account`
- [ ] All text localized DE + EN
- [ ] Mobile: bottom nav (5 icons), all pages usable on phone

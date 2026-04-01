# Roadmap 05 — Booking Flow Polish

> **Scope**: Audit + polish existing booking system, staff selection, multi-service cart, post-booking experience
> **DB Status**: ALL BACKEND EXISTS — `bookings` (with status, recurring, cancellation), `availability_slots` (real-time with Realtime pub/sub), `services`, `staff_members`, `staff_services` (junction table mapping which staff can do which services), `recurring_booking_rules` (weekly/biweekly/monthly). Stripe integration is live.
> **Effort**: 🔴 Large (~35 audit points)

---

## Phase 1: Audit Current Booking Flow

### 1.1 Map existing booking pages/components

**WHY**: Before building anything new, we need to know exactly what already exists and what's broken. The DB schema is complete (bookings, slots, staff, services all exist), but the frontend booking flow may be partially built, fully built but broken, or have gaps. Auditing prevents us from rebuilding something that already works and identifies the actual gaps.

**HOW**:
- **Check these files** for current state:
  - `app/[locale]/booking/` — main booking route (does it exist?)
  - `app/[locale]/salon/[slug]/page.tsx` — booking CTAs (what happens when user clicks "Buchen"?)
  - `components/booking/` — any existing booking components
  - `app/api/bookings/` — booking API routes
  - `app/api/availability/` — slot availability API
- **Document**: Which steps exist? Is it: Service select → Staff select → Date → Time → Confirm → Payment? Or something else?
- **Identify gaps**: Missing step UI, broken API connections, unconnected Stripe checkout, missing error states

---

### 1.2 Build/verify booking flow steps

**Step 1: Service Selection**

**WHY**: This is where the booking journey begins. The user needs to select exactly what service(s) they want. A clear, organized service picker sets expectations for duration and price upfront, preventing surprises at checkout.

**BENCHMARK**:
- **Fresha**: Checkbox-style service selection. Select multiple. Running total updates live at bottom. Group by category (Hair, Nails, etc.).
- **Airbnb**: N/A — lodging doesn't have service selection. But the Airbnb "Experiences" checkout is similar: select experience → date → pay.

**HOW**:
- Show all salon services organized by category (reuse `ServiceList` from Roadmap 03)
- Add a checkbox/radio per service
- Bottom bar shows running total: `"2 Services · 1h 30min · CHF 120 · Weiter"` — updating live as user adds/removes services
- "Weiter" button advances to next step
- Price format: `Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })`

---

**Step 2: Staff Selection**

**WHY**: Beauty services are deeply personal. 67% of beauty consumers have a preferred stylist. Giving users the choice between "any available person" (fastest booking) and "choose your stylist" (personal preference) caters to both user types.

**BENCHMARK**:
- **Fresha**: Toggle between "No stylist preference" (default) and selecting a specific team member. Only shows staff who can perform the selected service(s).

**HOW**:
- Default option: `"Nächste verfügbare Person"` — large radio button, selected by default. Subtext: "Schnellster Termin"
- Below: Grid of team members eligible for the selected service(s)
  - Eligibility: `JOIN staff_services WHERE service_id IN (selected_services)` to filter staff
  - Each card: avatar, name, specialties, rating, languages
- Select staff → continues to date selection
- If only 1 staff member exists → skip this step entirely

---

**Step 3: Date Selection**

**WHY**: The user needs to pick a date. A well-designed calendar reduces cognitive load — disabling unavailable dates prevents frustration, and highlighting available dates guides users toward bookable options.

**BENCHMARK**:
- **Fresha**: Month-view calendar. Unavailable dates = grayed out. Today highlighted. Selected date = round coral.
- **Airbnb**: Calendar with pricing per date. Not applicable here, but the UX pattern of disabled/enabled dates is identical.

**HOW**:
- Month-view calendar widget (build custom or use `react-day-picker`)
- Disabled dates: Query `availability_slots` — dates with zero available slots for selected services/staff → gray out
- Today highlighted with coral dot
- Selected date: coral circle background, white text
- Switchable months: left/right arrows
- Display current month name: "April 2026"

---

**Step 4: Time Selection**

**WHY**: After picking a date, users need a specific time slot. Showing available slots in a grid format is faster than a scrollable list. Grouping by time-of-day (morning/afternoon/evening) matches how people think about their schedule.

**BENCHMARK**:
- **Fresha**: Time slots in a grid. Morning / Afternoon / Evening sections. Available slots are tappable, unavailable are hidden.

**HOW**:
- **Query**: 
  ```sql
  SELECT starts_at FROM availability_slots 
  WHERE salon_id = $1 
  AND staff_member_id = $2 (or NULL for "any") 
  AND status = 'available' 
  AND DATE(starts_at) = $selected_date
  ORDER BY starts_at
  ```
- **Display**: Grid of time buttons: "09:00", "09:30", "10:00", etc. (30-min intervals)
- **Grouping**:
  - "Morgens" (08:00-12:00) — sunrise icon
  - "Nachmittags" (12:00-17:00) — sun icon
  - "Abends" (17:00-21:00) — moon icon
- **Style**: Each slot: `border border-[#EBEBEB] rounded-lg px-4 py-2 text-sm`. Hover: `border-s-coral`. Selected: `bg-s-coral text-white`
- **If no slots**: Show "Keine freien Termine an diesem Tag. Probiere einen anderen Tag." with calendar link

---

**Step 5: Confirmation**

**WHY**: Before committing, users need to review everything. Showing a clear summary with service, staff, date, time, and price prevents post-booking surprises. This is also where cancellation policy is disclosed (required for consumer protection in Switzerland).

**HOW**:
- Summary card:
  - Salon name + small photo
  - Service(s) with prices and durations
  - Staff member (with avatar if chosen)
  - Date: "Freitag, 4. April 2026"
  - Time: "14:00 – 15:30"
  - Total: "CHF 120"
  - Cancellation policy: "Kostenlose Stornierung bis 24h vorher" or "Keine Rückerstattung bei Stornierung" (from salon settings)
- "Termin buchen" coral button (full width, 48px, bold)
- Option to go back/edit any step

---

**Step 6: Payment**

**WHY**: Payment is the final conversion point. Offering both online and in-person payment options increases conversion — some users prefer paying at the salon (cash culture still strong in Switzerland). Promo codes add a delight moment.

**BENCHMARK**:
- **Fresha**: "Pay online" (Stripe) or "Pay at venue" toggle. Promo code input.
- **Airbnb**: Online only, no in-person payment option.

**HOW**:
- Two options: `"Online bezahlen"` (Stripe checkout, already integrated) or `"Vor Ort bezahlen"` (mark booking as unpaid, salon collects payment)
- **Promo code**: Collapsible "Hast du einen Gutscheincode?" input. Validation against `promo_codes` table (migration 048). Shows discount amount on valid code.
- **Stripe flow**: Use existing Stripe integration for card payments. Consider Apple Pay / Google Pay via Stripe Payment Request Button.

---

### 1.3 Post-booking confirmation

**WHY**: The moment after booking is an emotional high — the user just did something positive. A great confirmation experience reinforces the positive feeling, reduces "did my booking actually go through?" anxiety, and opens up upsell opportunities.

**BENCHMARK**:
- **Fresha**: Checkmark animation, booking summary, "Add to Calendar" button, option to rebook.
- **Airbnb**: Confetti animation, "Booking confirmed!" hero, trip details, "Explore more" suggestions.

**HOW**:
- **Confirmation screen**:
  - Large ✅ animated checkmark (Framer Motion scale spring)
  - "Termin bestätigt!" heading
  - Booking details summary (same as Step 5)
  - "Zum Kalender hinzufügen" → generates `.ics` file download (iCal format, works with Google Calendar, Apple Calendar, Outlook)
  - "Weiteren Termin buchen" → back to salon page
  - "Salon teilen" → share link
- **Email confirmation**: Triggered via API (Resend integration likely exists). Includes booking summary, salon address + Google Maps link, cancellation link
- **In-app**: Booking appears immediately in `/profile` under "Meine Buchungen"

**IMPACT**: Professional post-booking experience builds trust and reduces no-shows.

---

## Phase 2: Multi-Service Cart

### 2.1 Build service cart

**WHY**: Users often book multiple services at once — "haircut AND color AND blowdry" or "manicure AND pedicure." Without multi-service support, users have to book 3 separate appointments, which is terrible UX. A running cart with total duration and price lets users construct their perfect appointment.

**BENCHMARK**:
- **Fresha**: Multi-service selection with running total at bottom. Duration calculations account for overlap. "3 services · 2h · CHF 180"
- **Airbnb**: N/A

**HOW**:
- **File**: New `components/booking/ServiceCart.tsx`
- **State**: Array of selected services: `[{ serviceId, name_de, duration_minutes, price }]`
- **UI**: Floating bottom bar (mobile) or sidebar element (desktop):
  - `"2 Services · 1h 30min · CHF 120 · Weiter →"`
  - Animate total up/down when adding/removing services
- **Duration calculation**: Sum all `duration_minutes` — note that for multi-service bookings, we need contiguous slots from the same staff member
- **Validation**: If total duration exceeds available contiguous slots, warn user: "Diese Kombination ist leider nicht in einem Termin verfügbar"

**IMPACT**: Users can build complete appointments. Higher average order value. Better experience for beauty-conscious clients who always book multiple services.

---

## Phase 3: Booking Management

### 3.1 "Meine Buchungen" page

**WHY**: After booking, users need to see, manage, and interact with their appointments. "Where is my booking?" is the #1 support question in any booking platform. A clear booking management page eliminates this entirely.

**BENCHMARK**:
- **Fresha**: "My bookings" with tabs: Upcoming / Past. Each booking: salon, service, date, time, status. Actions: reschedule, cancel, rebook.
- **Airbnb**: "Trips" with detailed trip cards. Actions: message host, get directions, cancel.

**HOW**:
- **File**: `app/[locale]/profile/page.tsx` or new `app/[locale]/account/bookings/page.tsx`
- **Tabs**: `Anstehend | Vergangen | Storniert`
- **Each booking card**:
  - Salon name + thumbnail photo
  - Service name(s)
  - Staff member name (if chosen)
  - Date + time
  - Price
  - Status badge: "Bestätigt" (green), "Ausstehend" (yellow), "Storniert" (red), "Abgeschlossen" (gray)
- **Actions per booking**:
  - "Verschieben" → reschedule flow (pick new date/time, keep same service/staff)
  - "Stornieren" → cancellation flow with policy display and confirmation dialog
  - "Nochmal buchen" → pre-fills same service + salon, picks new date/time (shortcut for repeat customers)
  - "Wegbeschreibung" → opens Google Maps to salon address

---

### 3.2 Review prompt after completed booking

**WHY**: Reviews are the lifeblood of a marketplace. But users rarely write reviews unprompted. A well-timed prompt (after the appointment is over) catches users while the experience is fresh. This is how Fresha, Airbnb, and every successful marketplace build their review corpus.

**BENCHMARK**:
- **Fresha**: Email + in-app notification after appointment. "How was your visit?" with star rating inline.
- **Airbnb**: Pop-up prompt after checkout date. "Rate your stay" with 5-star slide.

**HOW**:
- **Trigger**: When booking status changes to `'completed'` AND no review exists for that `booking_id` in `reviews` table
- **UI prompt**: Toast notification or banner on next app visit: "Wie war dein Besuch bei [Salon Name]? ★★★★★"
- **Review flow**: 
  1. Star rating (1-5) — tap stars, filled in coral
  2. Optional comment (max 500 chars)
  3. Optional staff rating (if specific staff was booked)
  4. Submit
- **Data**: `INSERT INTO reviews (salon_id, user_id, booking_id, staff_member_id, rating, comment)`
- **Incentive**: Consider "Deine Bewertung hilft anderen" social proof message

**IMPACT**: Systematic review collection builds trust, improves search quality (sort by rating), and gives salon owners feedback. Essential for marketplace health.

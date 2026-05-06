# 📊 Post-MOAT Session 3: Dashboard + Booking UX + Emails

> **Agent Role:** Backend & Dashboard Agent
> **Estimated Time:** ~13h
> **Branch:** `main` (direct push)

---

## ⚠️ MULTI-AGENT SAFETY — READ FIRST

**You are running in PARALLEL with 2 other Claude Code sessions.**

### YOUR EXCLUSIVE FILE OWNERSHIP:
```
✅ YOU OWN (only you may edit):
  app/[locale]/dashboard/* (ALL dashboard pages and layouts)
  app/[locale]/salon/[slug]/page.tsx
  app/[locale]/bookings/*/page.tsx
  app/api/bookings/*.ts (all booking API routes)
  app/api/cron/*.ts (ALL cron routes — new and existing)
  app/api/analytics/benchmarks/route.ts        [NEW]
  app/api/quartier/subscribe/route.ts          [NEW]
  app/api/quartier/notify/route.ts             [NEW]
  app/api/salons/[slug]/ai-info/route.ts       [NEW]
  lib/email-templates/*.ts                     [NEW]
  components/ui/BottomSheet.tsx                [NEW]
  components/dashboard/MiniSparkline.tsx        [NEW]
```

### ❌ DO NOT TOUCH (owned by other sessions):
```
Session 1 owns:
  app/[locale]/onboarding/salon/page.tsx
  app/api/salons/route.ts
  app/api/translate/route.ts
  lib/service-templates.ts
  lib/registration-validation.ts
  components/ui/ImageUploader.tsx

Session 2 owns:
  components/HomePage.tsx
  components/layout/Footer.tsx
  components/layout/BottomNav.tsx
  components/ChatWindow.tsx
  components/SalonCard.tsx
  components/CategoryPage.tsx
  tailwind.config.js
  lib/animations.ts
```

### SHARED FILES (coordinate via .agent-lock.json):
```
⚠️ LOCK BEFORE EDITING:
  supabase/migrations/*  — Use migration 061+ (Session 2 uses 060)
  package.json           — Lock, add deps, unlock immediately
  components/index.ts    — Lock, add exports, unlock immediately
  vercel.json            — For cron configuration
```

### BEFORE YOU START:
1. Read `CLAUDE.md` completely + `UI_RULES.md`
2. Read `.agent-lock.json`
3. Add locks
4. Post in `.agent-comms.md`: "Session 3 starting: Dashboard + Booking + Emails. Owns: dashboard/*, salon/[slug], bookings/*, cron/*, analytics/benchmarks, email-templates, BottomSheet, MiniSparkline"

---

## Phase 5.1: Desktop Sticky Sidebar Booking (~1.5h) 🟡

**Goal:** On desktop, BookingCalendar is sticky in right sidebar of salon detail page.

### What We Want:
- On salon page (desktop ≥ 1024px): 60%/40% layout. Salon info left, booking right.
- Right column is `sticky top-24` — scrolls with page until it reaches its bounds
- Below 1024px: normal stacked layout (existing behavior unchanged)

### What We DON'T Want:
- ❌ Sidebar on mobile
- ❌ Sticky sidebar overlapping footer
- ❌ BookingCalendar losing any functionality

### Files:
- **[MODIFY]** `app/[locale]/salon/[slug]/page.tsx`

### DO:
```tsx
<div className="lg:grid lg:grid-cols-5 lg:gap-8">
  <div className="lg:col-span-3">
    {/* Salon info: hero, tabs, services, reviews, team, location */}
  </div>
  <div className="lg:col-span-2">
    <div className="lg:sticky lg:top-24">
      <BookingCalendar salonId={salon.id} />
    </div>
  </div>
</div>
```

---

## Phase 5.2: Mobile Bottom Sheet Booking (~1.5h) 🟡

**Goal:** Airbnb-style "Termin buchen" bottom sheet on mobile.

### What We Want:
- Floating bar at bottom: "Termin buchen — ab CHF {minPrice}" + teal CTA button
- Tapping opens bottom sheet with BookingCalendar
- Swipe down to close
- Spring animation on open/close

### What We DON'T Want:
- ❌ Bottom sheet on desktop (use sticky sidebar there)
- ❌ Bottom sheet covering status bar
- ❌ Background scrolling while sheet open

### Files:
- **[NEW]** `components/ui/BottomSheet.tsx`
- **[MODIFY]** `app/[locale]/salon/[slug]/page.tsx`

```tsx
// BottomSheet.tsx — reusable bottom sheet
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}
// Uses framer-motion: initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
// Backdrop: bg-black/50, click to close
// Handle bar: w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-2
```

---

## Phase 5.3: Service Gender Selection (~1h) 🟡

### What We Want:
- When salon adds service in dashboard: gender tag checkboxes (Damen / Herren / Alle)
- Default: "Alle" checked
- On salon detail page: services optionally filterable by gender
- In search results: gender filter joins services.gender_tags

### Files:
- **[NEW]** `supabase/migrations/061_service_gender.sql`
- **[MODIFY]** `app/[locale]/dashboard/*/` — service management
- **[MODIFY]** `app/[locale]/salon/[slug]/page.tsx` — display

### Migration:
```sql
-- Migration 061: Service gender tags
ALTER TABLE services ADD COLUMN IF NOT EXISTS gender_tags text[] DEFAULT '{all}';
-- Valid: 'male', 'female', 'non_binary', 'all'
```

---

## Phase 6.1: Vacation Mode (~1.5h) 🟡

### What We Want:
- Dashboard settings: "Urlaubsmodus" toggle with date range pickers
- Activating → blocks ALL slots in that range
- Warning: "Du hast X Termine in diesem Zeitraum" with auto-cancel option
- Salon card: "Im Urlaub bis {date}" badge when active
- Email notification to affected customers

### What We DON'T Want:
- ❌ Silent booking cancellations (must notify)
- ❌ Permanent slot blocking (only for date range)
- ❌ Vacation mode that can't be cancelled early

### Files:
- **[NEW]** `supabase/migrations/062_vacation_mode.sql`
- **[MODIFY]** Dashboard settings page
- **[MODIFY]** `app/api/availability/[salon_id]/route.ts` — respect vacation dates

### Migration:
```sql
-- Migration 062: Vacation mode
ALTER TABLE salons ADD COLUMN IF NOT EXISTS vacation_start date;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS vacation_end date;
```

---

## Phase 6.2: Dashboard Sparklines + "Neukunde" Badge + Quick Actions (~1.5h) 🟢

### What We Want:
- Stat cards: tiny 7-day trend sparkline (4 data points, simple SVG path or recharts Sparkline)
- Booking list: coral "Neukunde" pill badge where `is_first_visit = true`
- Quick actions section: 3 icon buttons — "Neuen Termin", "Service hinzufügen", "Nachricht lesen"

### Files:
- **[NEW]** `components/dashboard/MiniSparkline.tsx`
- **[MODIFY]** Dashboard overview page

---

## Phase 6.3: Action Alerts (~1h) 🟢

### What We Want:
- Dashboard overview: dismissible alert cards
  - 🟡 "Nur X Slots in den nächsten 7 Tagen" if available_slots < 5
  - 🔴 "Verifizierung überfällig" if last_verified > 90 days
  - 🟠 "X ausstehende Stornierungen" if pending cancellation requests
- Coral/yellow/red borders, lucide icons, action buttons

### Files:
- **[MODIFY]** Dashboard overview page

---

## Phase 6.4: Analytics Benchmarks (~1h) 🟢

### What We Want:
- "Deine Bewertung: 4.6 ⭐ (Top 15% in Basel)" on analytics page
- Percentile: `(count of salons with lower rating / total salons) × 100`
- Show 3 benchmarks: rating rank, booking volume rank, response time rank
- Glassmorphism cards with progress bars

### Files:
- **[NEW]** `app/api/analytics/benchmarks/route.ts`
- **[MODIFY]** Dashboard analytics page

---

## Phase 6.5: Settings Live Preview + Warning System + Frozen Overlay (~1.5h) 🟡

### What We Want:
- Settings page: renders a real SalonCard preview that updates live as you edit name/category/photo
- 3-warning system: DB tracks `warning_count`, 3 warnings = frozen
- Frozen: full-page coral overlay on dashboard, only settings accessible, read-only everything else

### Files:
- **[NEW]** `supabase/migrations/063_warnings.sql`
- **[MODIFY]** Dashboard settings page — live preview + frozen overlay

### Migration:
```sql
-- Migration 063: Warning system
ALTER TABLE salons ADD COLUMN IF NOT EXISTS warning_count int DEFAULT 0;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS frozen_at timestamptz;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS frozen_reason text;
```

---

## Phase 7.1: Customer Welcome Email Series (~1h) 🟢

### What We Want:
- Cron runs daily: finds users created 0/3/7 days ago → sends appropriate email
- Day 0: "Willkommen bei Solen!" intro
- Day 3: "Entdecke Salons in deiner Nähe"
- Day 7: "Dein erster Termin?"
- Locale-aware (check `profile.locale`, default "de")
- Respect notification preferences

### Files:
- **[NEW]** `app/api/cron/welcome-series/route.ts`
- **[NEW]** `lib/email-templates/welcome-series.ts`

---

## Phase 7.2: Rebooking Nudge Email (~1h) 🟢

### What We Want:
- Cron: users whose last booking was 28+ days ago → "Zeit für einen neuen Termin?"
- Shows their most recent salon with "Nochmal buchen" CTA link
- Respects `rebooking_enabled` preference
- Max 1 per 28-day cycle (add `last_rebooking_nudge_at` on profiles or check audit log)

### Files:
- **[NEW]** `app/api/cron/rebooking-nudge/route.ts`

---

## Phase 7.3: Salon Onboarding Drip (~1h) 🟢

### What We Want:
- Adaptive 5-email drip: each email only sends if the condition is met
  1. Day 0: "Willkommen als Partner!"
  2. Day 2 (if profile < 80%): "Vervollständige dein Profil"
  3. Day 4 (if 0 services): "Füge Behandlungen hinzu"
  4. Day 6 (if no cover photo): "Lade ein Foto hoch"
  5. Day 8 (if profile complete): "Bereit für deine erste Buchung! 🎉"

### Files:
- **[NEW]** `app/api/cron/salon-onboarding/route.ts`
- **[NEW]** `lib/email-templates/salon-onboarding.ts`

---

## Phase 7.4: Booking Notification Emails (~1h) 🟢

### What We Want:
- Salon confirms booking → email to customer: "Dein Termin wurde bestätigt!"
- Customer cancels → email to salon: "Stornierung: {Kunde} hat abgesagt"
- Salon cancels → email to customer with reason: "Leider wurde dein Termin abgesagt. Grund: {reason}"
- All locale-aware

### Files:
- **[MODIFY]** `app/api/bookings/[id]/confirm/route.ts`
- **[MODIFY]** `app/api/bookings/[id]/cancel/route.ts`
- **[NEW]** `lib/email-templates/booking-notifications.ts`

---

## Phase 7.5: Cron Configuration (~15min) 🟢

### Files:
- **[MODIFY]** `vercel.json` — add cron schedules

```json
{
  "crons": [
    { "path": "/api/cron/welcome-series", "schedule": "0 9 * * *" },
    { "path": "/api/cron/rebooking-nudge", "schedule": "0 10 * * *" },
    { "path": "/api/cron/salon-onboarding", "schedule": "0 11 * * *" },
    { "path": "/api/cron/release-deposits", "schedule": "0 6 * * *" }
  ]
}
```

> ⚠️ LOCK `vercel.json` before editing — it's a danger zone file per CLAUDE.md.

---

## Phase 8.1: Quartier Email Subscription (~1h) 🟢

### Files:
- **[NEW]** `supabase/migrations/064_quartier_subscriptions.sql`
- **[NEW]** `app/api/quartier/subscribe/route.ts`

### Migration:
```sql
CREATE TABLE quartier_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  quartier text NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  UNIQUE(email, quartier)
);
ALTER TABLE quartier_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quartier_sub_insert_public" ON quartier_subscriptions FOR INSERT WITH CHECK (true);
```

---

## Phase 11.1: Price Increase Approval Page (~1h) 🟢

### What We Want:
- `/bookings/[id]/approve-increase` — customer sees GlassCard with:
  - Original price, new price, difference, salon's reason
  - 48h countdown timer (JS countdown from `auto_approve_at`)
  - "Bestätigen" (teal) / "Ablehnen" (grey) buttons
- Auto-approve after 48h if no action

### Files:
- **[NEW]** `app/[locale]/bookings/[id]/approve-increase/page.tsx`

---

## Phase 11.2: 72h Deposit Auto-Release Cron (~30min) 🟢

### What We Want:
- Daily cron: deposits held > 72h without booking confirmation → release back
- Log in audit_log

### Files:
- **[NEW]** `app/api/cron/release-deposits/route.ts`

---

## Phase 11.3: Payment Emails + Premium UI (~1h) 🟢

### What We Want:
- On `payment_intent.succeeded` webhook → payment confirmation email
- On `charge.dispute.created` → admin notification email
- Checkout page: GlassCard booking summary + Shield trust badge

### Files:
- **[MODIFY]** `app/api/stripe/webhook/route.ts` — add email triggers
- **[MODIFY]** Checkout page — GlassCard + trust badges

---

## Phase 12.1: AI Salon Info Auto-Fill (~1h) 🟢

### What We Want:
- Dashboard settings: "Vorschlag generieren" button for description, atmosphere, expertise
- Calls Gemini 2.0 Flash with salon data → generates text suggestions
- Salon can accept/edit/reject
- Same Gemini API key as everything else

### Files:
- **[NEW]** `app/api/salons/[slug]/ai-info/route.ts`
- **[MODIFY]** Dashboard settings page — generate buttons

---

## Social Media Fields (~30min) 🟢

### Files:
- **[NEW]** `supabase/migrations/065_social_media.sql`
- **[MODIFY]** Dashboard settings page — social URL inputs
- **[MODIFY]** `app/[locale]/salon/[slug]/page.tsx` — social icon display

### Migration:
```sql
ALTER TABLE salons ADD COLUMN IF NOT EXISTS facebook_url text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS tiktok_url text;
ALTER TABLE salons ADD COLUMN IF NOT EXISTS website_url text;
-- instagram_url already exists
```

---

## Verify Session 3:
```bash
# Booking UX:
# - Desktop: salon page has sticky booking sidebar
# - Mobile: floating "Termin buchen" bar → bottom sheet opens
# - Service gender selection works in dashboard

# Dashboard:
# - Vacation mode: set dates → slots blocked → "Im Urlaub" badge shows
# - Sparklines on stat cards
# - "Neukunde" badge on first-visit bookings
# - Action alerts show when conditions met
# - Benchmarks: "Top 15% in Basel" shows
# - Settings live preview updates
# - Warning system: 3 warnings → frozen overlay

# Emails:
# - Welcome series cron responds 200
# - Rebooking nudge cron responds 200
# - Salon onboarding drip cron responds 200
# - Booking confirmation/cancellation emails trigger

# Other:
# - Social media fields show on salon profile
# - AI "Vorschlag generieren" creates description
# - Price increase approval page renders
# - Quartier subscribe API works
npm run build && git push origin main
```

**POST in `.agent-comms.md` when done:**
```
## Session 3 Complete
- Booking: sticky sidebar (desktop), bottom sheet (mobile), gender tags
- Dashboard: vacation mode, sparklines, "Neukunde" badge, action alerts, benchmarks, live preview, warning system, frozen overlay
- Emails: welcome series, rebooking nudge, salon onboarding drip, booking confirmation/cancellation
- Admin: price increase approval page, deposit auto-release cron, payment emails, premium checkout UI
- AI: salon info auto-fill via Gemini
- Social: Facebook/TikTok/Website fields
- Migrations: 061-065
- Cron schedules added to vercel.json
- Build passes ✅
```

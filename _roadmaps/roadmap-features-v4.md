# 🗺️ Solen.ch Master Feature Roadmap v4

> **46 features | 14 phases | ~42 hours estimated**
> This roadmap is designed for Claude Code autonomous execution.
> Follow CLAUDE.md rules. Build → test → commit → push → verify each phase.

---

## ⚠️ CLAUDE CODE MASTER INSTRUCTIONS

```
BEFORE starting ANY phase:
1. Re-read THIS ROADMAP for the current phase — do NOT rely on memory
2. Re-read CLAUDE.md (especially Rules 5, 7, 10, 12, 13)
3. Check git status is clean (no uncommitted changes from previous phase)

DURING every phase:
1. Only touch the files listed for that phase
2. Every new component MUST use Tailwind classes from tailwind.config.js
3. Every new prop MUST be optional unless stated otherwise
4. Every new page MUST have both German UI text AND English fallback
5. Never delete existing functionality — only add or enhance

AFTER every phase:
1. npm run build (MUST pass — if not, fix before moving on)
2. npx tsc --noEmit (type check)
3. git add [only files from this phase]
4. git commit -m "phase N.X: [description]"
5. git push origin main
6. Wait 60s, curl https://www.solen.ch/de/ — must return 200 or 307
7. If Vercel deploy fails: STOP, debug, fix, re-push

AFTER ALL phases:
1. Open browser, visually check every new page
2. Run Lighthouse on homepage (perf > 70, a11y > 90)
3. Test auth flow: anon → login → customer → salon → admin
4. Test full booking flow end-to-end
5. If you find minor UI bugs: fix them
6. If you find major issues: STOP and ask the user
```

---

## Breakage Risk Assessment

| Risk Level | Phase | Why |
|---|---|---|
| 🔴 HIGH | 1, 5, 7 | Auth guards can lock people out; booking engine touches payments; chat+negotiation is complex |
| 🟡 MEDIUM | 3, 4, 6, 8, 9, 12 | New UI components, DB schema changes, dark mode CSS |
| 🟢 LOW | 2, 10, 11, 13, 14 | Nav tweaks, performance, docs, help pages |

---

## Phase 1: Critical Fixes (~3h) 🔴
**Goal:** Lock down security + fix broken pages

---

### 1.1 Auth Guards (P5+P6)

**Files:**
- `middleware.ts` — role-based route protection
- `components/dashboard/DashboardLayout.tsx` — auth check
- `components/layout/BottomNav.tsx` — conditional dashboard button
- `app/[locale]/dashboard/layout.tsx` — server-side guard

**What we want:**
- Anonymous users → cannot access ANY dashboard page
- Customer users → cannot access dashboard
- Salon users → can access their own dashboard pages only
- Admin users → can access ALL dashboard pages + admin-only pages
- Dashboard button in bottom nav → ONLY visible to salon/admin users, NOT to customers or anon

**What we DON'T want:**
- ❌ Customer accounts seeing salon dashboard data
- ❌ Anonymous users browsing admin panel
- ❌ Dashboard button showing for logged-out users
- ❌ Redirect loops (login → dashboard → login → ...)

**Steps:**
1. In `middleware.ts`, add route matchers:
   - `/dashboard/*` → requires session + `role = 'salon'` OR `role = 'admin'`
   - Admin-only routes: `/dashboard/all-salons`, `/dashboard/all-users`, `/dashboard/platform-analytics`, `/dashboard/badge-manager`, `/dashboard/content-editor`, `/dashboard/segments` → requires `role = 'admin'`
   - No session → redirect to `/auth/login?redirect={current_path}`
   - Wrong role → show "Kein Zugang" page with "Zur Startseite" button
2. In `BottomNav.tsx`:
   - Fetch user session + role
   - If `role !== 'salon' && role !== 'admin'` → do NOT render dashboard nav item at all
   - The item should not exist in the DOM, not just be hidden
3. In `DashboardLayout.tsx`:
   - Double-check auth (defense in depth — don't rely only on middleware)
   - If no session → `redirect('/auth/login')`

> [!CAUTION]
> **BE CAREFUL:** The redirect URL must include the locale prefix. Don't redirect to `/auth/login`, redirect to `/${locale}/auth/login`.
> **BE CAREFUL:** Test that existing salon owners can still access their dashboard after this change.
> **TEST WITH:** 3 separate accounts — anonymous browser, customer account, salon owner account.

**DO:**
```tsx
// BottomNav.tsx — correct
if (user?.role === 'salon' || user?.role === 'admin') {
  tabs.push({ label: 'Dashboard', icon: LayoutDashboard, href: `/${locale}/dashboard` });
}
```

**DON'T:**
```tsx
// ❌ WRONG — this just hides it visually, still in DOM
<div className={user?.role === 'salon' ? '' : 'hidden'}>
  <DashboardTab />
</div>
```

**Verify:** 
- `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/dashboard` → must NOT return 200 for anonymous

---

### 1.2 Fix Profile Page (P9)

**Files:**
- `app/[locale]/account/page.tsx` OR `app/[locale]/profile/page.tsx` (check which exists)
- [NEW] `components/ProfilePage.tsx`

**What we want:**
- Full profile page with 4 sections: Nächste Termine, Vergangene Termine, Favoriten, Einstellungen
- Must work for logged-in customers
- If not logged in → redirect to login

**What we DON'T want:**
- ❌ Showing other users' bookings
- ❌ Breaking the existing profile route if it exists
- ❌ Page that errors when user has 0 bookings

**Steps:**
1. Check if `app/[locale]/account/page.tsx` exists — if yes, fix it; if no, create `app/[locale]/profile/page.tsx`
2. Component must handle empty states gracefully:
   - 0 bookings → show EmptyState "Noch keine Buchungen"
   - 0 favorites → show EmptyState "Noch keine Favoriten" (Phase 6 will fill this)
3. Settings section: name, email (read-only), phone, notification preferences
4. Fetch bookings from `/api/bookings` filtered by current user

> [!CAUTION]
> **BE CAREFUL:** The existing profile route may already render something. Don't delete it — enhance it.
> **BE CAREFUL:** RLS must ensure users only see their OWN bookings.

**Verify:** Log in as customer → navigate to profile → see empty states (no errors)

---

### 1.3 Fix Termine Page (P9)

**Files:**
- `app/[locale]/bookings/page.tsx` or [NEW] `app/[locale]/termine/page.tsx`
- [NEW] `components/TerminePage.tsx`

**What we want:**
- Split view: upcoming bookings on top (cards), past bookings below (collapsible)
- Mini calendar sidebar showing dates with bookings
- Cancel/reschedule buttons on upcoming bookings

**What we DON'T want:**
- ❌ Showing cancelled bookings mixed with active ones
- ❌ Calendar that doesn't scroll to current month
- ❌ Breaking existing booking routes

**Steps:**
1. Top section: upcoming booking cards with salon name, service, date, time, staff
2. Each card: "Absagen" (cancel) + "Verschieben" (reschedule) buttons
3. Bottom section: collapsible "Vergangene Termine" with "Nochmal buchen" button
4. Sidebar: mini calendar with dots on dates that have bookings

> [!CAUTION]
> Cancel button MUST call existing `/api/bookings/[id]/cancel` — don't create new endpoint.
> Reschedule MUST call existing `/api/bookings/[id]/reschedule` — don't create new endpoint.

**Verify:** Page loads with bookings OR empty state (no error code)

---

### 1.4 Claude Code Review Protocol (P14+P17)

**Files:** `CLAUDE.md`

**What we want:**
- New Rule 13 in CLAUDE.md: CODE REVIEW PROTOCOL
- Mandatory steps before every push, after every push, and after all phases

**Steps:**
Add this as Rule 13:
```markdown
### Rule 13: CODE REVIEW PROTOCOL
Before EVERY push:
1. `npm run build` — must pass
2. `npx tsc --noEmit` — zero type errors
3. `git diff --stat` — review changed files, ensure no unintended changes

After EVERY push:
1. Wait 60s for Vercel deploy
2. `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/` — must be 200 or 307
3. Curl critical routes: /de, /de/coiffeur, /de/barbershop, /de/dashboard

After ALL phases complete:
1. Visual browser check on every new page
2. Lighthouse: performance > 70, accessibility > 90
3. Minor UI bugs → fix immediately
4. Major design issues → STOP and ask user
```

**Verify:** `grep "Rule 13" CLAUDE.md` returns result

---

## Phase 2: Navigation Quick Wins (~2h) 🟢
**Goal:** Polish nav UX for mobile

---

### 2.1 Logo → Homepage (P1)

**Files:** `components/layout/Header.tsx`

**What we want:** Tapping the logo ALWAYS navigates to `/${locale}` (homepage)
**What we DON'T want:** ❌ Logo linking to `/` without locale prefix

**Steps:** Wrap logo element in `<Link href={\`/${locale}\`}>`. Check if already wrapped — don't double-wrap.

---

### 2.2 Profile → Login Redirect (P2)

**Files:** `components/layout/BottomNav.tsx`, `components/layout/Header.tsx`

**What we want:** Profile icon → if not logged in, go to `/auth/login`. If logged in, go to `/profile`.
**What we DON'T want:** ❌ Showing profile page to anonymous users (it will error)

**Steps:**
1. In both BottomNav AND Header: check session
2. No session → profile href = `/${locale}/auth/login`
3. Has session → profile href = `/${locale}/profile`

---

### 2.3 Larger Touch Targets (P3)

**Files:** `components/layout/BottomNav.tsx`, `components/layout/Header.tsx`, `components/FilterBar.tsx`

**What we want:** All tappable elements ≥ 48px × 48px (Google Material standard)
**What we DON'T want:** ❌ Buttons that look oversized on desktop — use `min-h-12 min-w-12` not fixed sizes

**Steps:** Add `min-h-12 min-w-12` to interactive elements. Audit: bottom nav items, header buttons, filter chips.

---

### 2.4 Scroll-Hide Bottom Nav (P4)

**Files:** `components/layout/BottomNav.tsx`

**What we want:** Instagram-style — scroll down hides, scroll up shows, always visible at top
**What we DON'T want:**
- ❌ Jittery show/hide on small scrolls (add 10px threshold)
- ❌ Hiding when already at bottom of page
- ❌ Breaking the existing nav functionality

**Steps:**
1. `useEffect` tracking `window.scrollY` with `scroll` event listener (use `passive: true`)
2. Store `lastScrollY` in ref
3. Scrolled down > 10px → add `translate-y-full` with `transition-transform duration-300`
4. Scrolled up > 10px → remove translate
5. At scroll position 0 → always show

**DO:**
```tsx
const threshold = 10;
if (currentY > lastY + threshold) setHidden(true);
if (currentY < lastY - threshold) setHidden(false);
if (currentY <= 0) setHidden(false);
```

**DON'T:**
```tsx
// ❌ No threshold — will jitter
if (currentY > lastY) setHidden(true);
```

---

### 2.5 Sub-Site Icons (P7)

**Files:** `components/layout/Header.tsx`

**What we want:** When on a category page, show category icon + text next to logo (e.g., ✂️ Coiffeur)
**What we DON'T want:** ❌ Icons on homepage. Only on category sub-pages.

**Steps:**
1. Use `usePathname()` to detect current category
2. Map: coiffeur→Scissors, barbershop→ScissorsLineDashed, nails→Paintbrush, spa→Droplets, makeup→Palette, waxing→Sparkles
3. Show `<Icon size={18} /> <span className="text-sm font-medium">{category}</span>` next to logo
4. Only render when pathname matches a category

---

### 2.6 Breadcrumb / Back (U1)

**Files:** [NEW] `components/ui/Breadcrumb.tsx`, layout files

**What we want:** Desktop: breadcrumb path. Mobile: simple back button.
**What we DON'T want:** ❌ Breadcrumb on homepage (nothing to show)

**Steps:**
1. Desktop: "Home > Coiffeur > Salon XYZ" clickable segments
2. Mobile (md:hidden): "← Zurück" button using `router.back()`
3. Auto-generate from pathname segments

**Verify Phase 2:** All nav changes visible on mobile, touch targets ≥ 48px, scroll-hide works, breadcrumb shows

---

## Phase 3: Search & Discovery (~4h) 🟡
**Goal:** Smart search, better filters, map with prices

---

### 3.1 Auto-Suggest Search (G1)

**Files:**
- [NEW] `app/api/search/suggest/route.ts`
- `components/FilterBar.tsx` or [NEW] `components/ui/SearchAutocomplete.tsx`

**What we want:**
- Typing "wax" → shows "Brazilian Waxing", "Augenbrauen Waxing" under "Behandlungen"
- Also shows top 3 matching salons with photo + rating under "Salons"
- Click service → filter results. Click salon → navigate to salon page.

**What we DON'T want:**
- ❌ Searching on every keystroke (debounce 300ms)
- ❌ Showing 50 results in dropdown (max 5 services + 3 salons)
- ❌ Dropdown staying open when clicking outside

**Steps:**
1. API: query `services` table (name ILIKE) + `salons` table (name ILIKE), limit 5+3
2. Debounce input 300ms before calling API
3. Use `useOnClickOutside` to close dropdown
4. Keyboard navigation: arrow keys + Enter to select

> [!CAUTION]
> Don't break existing FilterBar search — enhance it, don't replace it.

---

### 3.2 Granular Filters (G2)

**Files:** `components/FilterBar.tsx`

**What we want:**
- Price range slider: CHF 0 — CHF 300+
- Distance slider: 1km — 10km (needs geolocation permission)
- Amenity chips: Parkplatz, Barrierefrei, Hundefreundlich, Kinderfreundlich
- "Geschlechtsneutrale Preise" toggle
- "Verfügbar heute" pill button
- All filters → URL params (shareable)

**What we DON'T want:**
- ❌ Too many filters visible at once (use expandable "Mehr Filter" section)
- ❌ Distance filter breaking without geolocation (show "Standort aktivieren" prompt instead)
- ❌ Filters that don't update results (every filter must trigger refetch)

**Steps:**
1. Price slider: `<input type="range" min={0} max={300} step={10} />`
2. Distance: request geolocation on click, show prompt if denied
3. Amenity chips: need `amenities` column on salons table (may need migration)
4. URL sync: `router.push(pathname + '?' + newParams.toString())`

---

### 3.3 Map Toggle + Price Pins (U4)

**Files:** `components/MapView.tsx`, `components/CategoryPage.tsx`

**What we want:**
- Toggle button: 🗺️ (map) / 📋 (list) — state preserved in URL param `?view=map`
- Price badge on each map pin (cheapest service price, e.g., "ab CHF 45")
- Click pin → salon card popup with basic info + "Ansehen" button
- Filters update pins in real-time

**What we DON'T want:**
- ❌ Map loading all 500+ salons at once (use viewport bounds query)
- ❌ Price pins without a price (if no services → show pin without price)
- ❌ Map view being default (list is default, map is opt-in)

> [!IMPORTANT]
> Need `min_price` computed from services JOIN. Add to salon query as subquery or computed field.

**Verify Phase 3:** Search suggests services + salons, filters work, map shows price pins

---

## Phase 4: Salon Profile Upgrade (~3h) 🟡
**Goal:** Premium salon pages with staff portfolios

---

### 4.1 Staff Portfolios (G3)

**Files:**
- [NEW] `components/StaffPortfolio.tsx`
- Migration 032: `staff_portfolio_images` table
- Dashboard `/staff` page — add upload UI

**What we want:**
- Each staff member: Instagram-style photo grid (2×3 or 3×3)
- Below grid: bio text + specialties
- "Bei [Name] buchen" button → goes to booking with that staff pre-selected

**What we DON'T want:**
- ❌ Forcing all staff to have portfolios (optional, show bio-only if no photos)
- ❌ Huge uncompressed images (resize to max 800px width on upload)
- ❌ Breaking staff page if no photos exist

**Migration 032:**
```sql
CREATE TABLE staff_portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff_portfolio_images ENABLE ROW LEVEL SECURITY;
```

---

### 4.2 Tabbed Salon Profile (U8)

**What we want:**
- Desktop: sticky tab bar — Angebot | Bewertungen | Team | Standort
- Mobile: accordion sections (tap to expand/collapse)
- Smooth scroll when tab clicked

**What we DON'T want:**
- ❌ All sections loading at once on mobile (lazy-load below-fold sections)
- ❌ Tab bar overlapping other sticky elements

---

### 4.3 Service Enhancements (U9, U10)
- Accordion menus per service category (one open at a time)
- Staff avatar thumbnails next to each service
- Duration tag "⏱ 45 Min" + price right-aligned

### 4.4 Status Indicators (U11, U12)
- "Geöffnet" pulsing green dot if current time is within business hours
- "Geschlossen" grey dot otherwise
- ℹ️ tooltip on book button: cancellation policy text

**Verify Phase 4:** Salon page has tabs/accordions, portfolios show, open/closed dot works

---

## Phase 5: Booking Engine (~6h) 🔴
**Goal:** Premium booking flow with multi-service

---

### 5.1 Progress Dots (U13)
iOS-style dots: ● ● ○ ○ ○ — tap completed dot to go back. 5 steps.

### 5.2 Multi-Service Booking (G9)

**What we want:**
- "+ Weitere Behandlung" button after selecting first service
- System auto-calculates: service1 duration + buffer (default 10min) + service2 duration
- Cart shows all selected services + total

**What we DON'T want:**
- ❌ More than 3 services at once (cap at 3)
- ❌ Buffer time hardcoded — must be configurable per salon
- ❌ Breaking single-service booking (most common case)

> [!CAUTION]
> Build multi-service as an ADDITION to existing flow. The default single-service path must work exactly as before. Multi-service is opt-in by clicking the "+" button.

### 5.3 Add-on Suggestions (G4)
- Inline below selected service: "Olaplex dazu für CHF 30?"
- Migration 034: `service_addons (service_id, addon_service_id)`
- Quick-add button (no separate selection step)

### 5.4 Guest Checkout (U14)

**What we want:**
- Salon controls this: `allow_guest_checkout` toggle in their dashboard settings
- If salon allows guest: booking form = name + phone + email only (no account)
- If salon requires login: show "Anmelden um zu buchen" with login button
- After guest booking: soft prompt "Konto erstellen um Termine zu verfolgen?" (dismissible)

**What we DON'T want:**
- ❌ All salons having guest checkout by default (default = OFF, salon turns it on)
- ❌ Guest bookings with no contact info (require phone at minimum)
- ❌ Guest users being able to leave reviews (must have account)

**Migration 033:** `ALTER TABLE salons ADD COLUMN allow_guest_checkout boolean DEFAULT false;`

### 5.5 Booking Success (U15)
- Confetti animation (CSS or `canvas-confetti`)
- Success card with booking details
- "Zum Kalender hinzufügen" → `.ics` file download
- "Nochmal buchen" shortcut
- "Mit Freund:in teilen" → Web Share API or copy link

**Verify Phase 5:** Book single service, book multi-service, guest checkout (if salon allows), see confetti + calendar

---

## Phase 6: Favorites & Retention (~3h) 🟡

---

### 6.1 Favorites (U7)

**What we want:**
- ❤️ on every SalonCard → tapping saves to favorites
- `/profile/favorites` page showing saved salons in a grid
- Heart is filled (red) if already saved, outlined if not

**What we DON'T want:**
- ❌ Favorites working without login (prompt login on tap)
- ❌ Losing favorites on page refresh (persisted in DB, not just state)

**Migration 035:** `favorites (user_id, salon_id, created_at)`

### 6.2 Book Again + Rebooking Nudge (G5+G8)

**What we want:**
- "Nochmal buchen" button on every past booking
- Homepage widget for logged-in users: "Wieder buchen?" with last salon
- After 4 weeks: push notification from MOST RECENT salon ONLY
- User can disable via notification settings in profile

**What we DON'T want:**
- ❌ Notification spam from every salon they ever visited
- ❌ Notifications for users who disabled them
- ❌ "Book Again" for cancelled/disputed bookings

**Migration 036:** `notification_preferences (user_id, rebooking_enabled boolean DEFAULT true)`

### 6.3 Top Rated Badges (G7)
Auto-assign badge for ≥ 4.5 avg + ≥ 10 reviews. Use existing badge system.

**Verify Phase 6:** Heart saves, favorites page works, "Nochmal buchen" works

---

## Phase 7: Chat & Price Negotiation (~8h) 🔴

---

### 7.1 Media in Chat (P11)

**What we want:**
- 📎 button: upload images, video (<30s), paste IG/TikTok links
- Links auto-preview with Open Graph data (title + thumbnail)
- Images stored in Supabase Storage `chat-media` bucket

**What we DON'T want:**
- ❌ Files larger than 10MB
- ❌ Executable files (.exe, .sh)
- ❌ Breaking existing text chat

### 7.2 Price Offer (P12)

**What we want:**
- Salon creates price offer card in chat: service description + CHF amount + optional photo
- Customer sees card with "Annehmen" / "Ablehnen" buttons
- Accepting → Stripe payment intent → customer pays upfront
- Offer expires after 48h. Salon can send new offer if declined.

**What we DON'T want:**
- ❌ Offers without a price amount
- ❌ Customer accepting without payment method on file
- ❌ Multiple active offers at same time (only 1 active per conversation)

**Migration 037:**
```sql
CREATE TABLE price_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  salon_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  description text NOT NULL,
  amount_chf decimal(10,2) NOT NULL,
  photo_url text,
  status text DEFAULT 'pending', -- pending, accepted, declined, expired
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '48 hours'
);
```

### 7.3 Post-Visit Upcharge + Dispute (P13)

**What we want:**
- After appointment: salon can request price update ("Haar länger als erwartet, +CHF 20")
- Customer gets push notification
- Customer has 48h to approve or dispute
- **Auto-approved after 48h if no response** → Stripe charges difference
- If disputed → admin reviews. Admin can: approve salon charge, reject, or set compromise.
- Need admin dispute page in dashboard

**What we DON'T want:**
- ❌ Upcharge more than original booking price (cap at +50% max)
- ❌ Multiple upcharge requests for same booking
- ❌ Charging disputed amounts before admin resolves
- ❌ No paper trail — everything must be logged

**Migration 038:**
```sql
CREATE TABLE price_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id),
  original_amount decimal(10,2) NOT NULL,
  requested_amount decimal(10,2) NOT NULL,
  salon_reason text NOT NULL,
  status text DEFAULT 'pending', -- pending, auto_approved, customer_approved, disputed, resolved
  customer_response text,
  admin_decision text, -- approved, rejected, compromised
  admin_amount decimal(10,2),
  resolved_by uuid,
  resolved_at timestamptz,
  auto_approve_at timestamptz DEFAULT now() + interval '48 hours',
  created_at timestamptz DEFAULT now()
);
```

> [!CAUTION]
> **LEGAL:** Auto-charging after 48h must be disclosed in T&Cs BEFORE booking. Show a small info text during checkout: "Nach dem Termin kann der Salon den Preis anpassen. Du hast 48h zum Bestätigen."
> **NEW PAGE NEEDED:** `app/[locale]/dashboard/disputes/page.tsx` — admin dispute management interface

**Verify Phase 7:** Send image in chat, send price offer → accept → payment succeeds, request upcharge → dispute flow works

---

## Phase 8: Loyalty & Client Management (~3h) 🟡

---

### 8.1 Stamp Card (G11)

**What we want:**
- Salon opt-in: "Stempelkarte aktivieren" toggle in dashboard settings
- Salon configures: stamps needed (default 10), reward text
- Customer sees stamp card in profile: 10 circles, filled = ⭐
- Auto-stamp after completed booking at participating salon
- Full card → notification + reward code

**What we DON'T want:**
- ❌ All salons having stamp cards (opt-in only, default OFF)
- ❌ Stamps from cancelled bookings
- ❌ Stamp card cluttering profile if salon doesn't participate

**Migration 039:** `loyalty_cards`, `loyalty_stamps` tables

### 8.2 Client Notes (G12)

**What we want:**
- Booking notes: customer writes during booking ("Empfindliche Kopfhaut")
- Staff notes: salon adds permanent notes on client in dashboard CRM ("Wants quiet, prefers espresso")
- Both visible to staff before next appointment
- Notes are PRIVATE to that salon only

**What we DON'T want:**
- ❌ Customers seeing staff notes about them
- ❌ Notes visible to other salons
- ❌ Notes field being mandatory (optional always)

**Migration 040:** `client_notes (salon_id, customer_id, note text, type 'booking'|'permanent')`

### 8.3 Review Replies (U18)
- Public reply visible on salon page + private DM option
- **Migration 041:** `review_replies (review_id, salon_id, reply_text, is_public boolean)`

**Verify Phase 8:** Stamp card in profile, staff notes visible in dashboard, review reply shows

---

## Phase 9: Last-Minute & Off-Peak (~2h) 🟡

### 9.1 Last-Minute Filters (P10)
- Service category chips (multi-select) + price range filter
- "Coiffeur" + "Nails" + "Unter CHF 50"

### 9.2 Off-Peak Discounts (G6)
- Salon sets discount % for specific hours
- System auto-suggests if 80%+ empty 24h before → salon approves/rejects
- "Off-Peak" badge on search results, strikethrough price
- **Migration 042:** `off_peak_slots (salon_id, day_of_week, start_time, end_time, discount_percent)`

---

## Phase 10: Performance (~2h) 🟢
1. `next/image` with `loading="lazy"` below fold
2. `dynamic()` imports for dashboard, booking, chat pages
3. Service worker: cache salon list 5 min
4. `router.prefetch()` on salon card hover
5. Bundle analysis: fix any >100KB chunks

---

## Phase 11: Onboarding & Help (~3h) 🟢

### 11.1 Welcome Tutorial (P15)
- 4 full-screen slides + tooltip tour. Skip options: ✕ close all, → skip step, ← go back
- `localStorage` flag to not show again
- `TutorialTour.tsx` already exists — enhance, don't replace

### 11.2 Help Center (P16)
- Sections: "Für Kunden" | "Für Salons" | "Kontakt"
- Admin CMS: create/edit/delete articles from dashboard
- Markdown support, search bar
- **Migration 043:** `help_articles (slug, title, content, category, locale, published boolean)`
- [NEW] `app/[locale]/help/page.tsx` + `app/[locale]/help/[slug]/page.tsx`

---

## Phase 12: Dark Mode (~2h) 🟡

**What we want:** Auto (OS) by default + manual toggle in header + settings

**What we DON'T want:**
- ❌ Unreadable text in dark mode
- ❌ Images looking wrong on dark backgrounds
- ❌ Toggle button that doesn't exist (MUST have a button in header)

**Steps:**
1. `tailwind.config.js`: `darkMode: 'class'`
2. Dark palette: bg `#0F0F1A`, surface `#1A1A2E`, text `#E2E8F0`
3. [NEW] `components/ui/ThemeToggle.tsx` — 🌙/☀️
4. Place in Header + profile settings
5. Add `dark:` variants to ALL major components

> [!WARNING]
> Do this LAST before docs — it touches CSS on nearly every component.

---

## Phase 13: Dashboard Calendar (~2h) 🟡
- Calendar grid: color by staff, click to reschedule (no drag-and-drop yet)
- "Zeit blockieren" for breaks/sick days
- Modal: appointment details + "Verschieben" button → pick new slot

---

## Phase 14: Update Docs (~1h) 🟢
- CLAUDE.md: all new components, routes, rules
- UI_RULES.md: dark mode tokens, stamp card, chat, price offers, guest checkout

---

## Execution Order

| # | Phase | Time | Depends On |
|---|---|---|---|
| 1 | Phase 1: Critical Fixes | 3h | — |
| 2 | Phase 2: Nav Quick Wins | 2h | Phase 1 |
| 3 | Phase 3: Search & Discovery | 4h | Phase 2 |
| 4 | Phase 4: Salon Profiles | 3h | — |
| 5 | Phase 5: Booking Engine | 6h | Phase 4 |
| 6 | Phase 6: Favorites & Retention | 3h | Phase 1 |
| 7 | Phase 7: Chat & Negotiation | 8h | Phase 5 |
| 8 | Phase 8: Loyalty & CRM | 3h | Phase 5 |
| 9 | Phase 9: Last-Minute | 2h | — |
| 10 | Phase 10: Performance | 2h | After features |
| 11 | Phase 11: Onboarding & Help | 3h | After features |
| 12 | Phase 12: Dark Mode | 2h | Last before docs |
| 13 | Phase 13: Dashboard Ops | 2h | — |
| 14 | Phase 14: Docs | 1h | Last |

**Total: ~42 hours**

---

## DB Migrations Summary

| # | Table | Phase |
|---|---|---|
| 032 | `staff_portfolio_images` | 4 |
| 033 | `ALTER salons ADD allow_guest_checkout` | 5 |
| 034 | `service_addons` | 5 |
| 035 | `favorites` | 6 |
| 036 | `notification_preferences` | 6 |
| 037 | `price_offers` | 7 |
| 038 | `price_disputes` | 7 |
| 039 | `loyalty_cards`, `loyalty_stamps` | 8 |
| 040 | `client_notes` | 8 |
| 041 | `review_replies` | 8 |
| 042 | `off_peak_slots` | 9 |
| 043 | `help_articles` | 11 |

## New Pages

| Route | What | Phase |
|---|---|---|
| `/profile` | Customer profile | 1 |
| `/termine` | Booking history | 1 |
| `/profile/favorites` | Saved salons | 6 |
| `/help` + `/help/[slug]` | Help center | 11 |
| Dashboard: `/disputes` | Admin dispute mgmt | 7 |

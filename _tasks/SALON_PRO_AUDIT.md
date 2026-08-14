# Solen Pro — Dashboard Audit

> Produced 2026-05-26. Static analysis of `app/[locale]/dashboard/*`.
> Mapping target: 12-slot Fresha IA (Home / Calendar / Sales / Reviews / Catalogue / Clients / Marketing / Payments / Team / Reports / Apps / Settings).
> All status verdicts are diagnosed-from-code — app not executed.

## Executive summary

- **Total pages audited:** 41 (40 named + dashboard root)
- **By status:** Working 32 / Partial 7 / Broken 0 / Placeholder 2 (`platform-analytics` "Charts coming soon", `editor` is a 6-line re-export of a legacy component, still functional but unmaintained)
- **By audience:** Salon-facing 27 / Solen-admin (out of scope) 13 / Unclear 1 (`editor` — legacy "Visual Editor" gated by `role === "admin"` per `DashboardLayout.tsx:50` but ships under same nav)
- **Duplicate clusters:** 4 identified — (1) vertical CRMs (8 pages), (2) revenue/earnings (3 pages), (3) review surfaces (2 pages), (4) clients/segments overlap (2 pages)
- **Role gating** is enforced in `DashboardLayout.tsx:228-244`: `salon_owner`, `admin`, or staff with `staff_salon_id`. Admin gets `ADMIN_NAV` (13 items); owner gets `OWNER_NAV_GROUPS`. No per-page guard — relies on layout.
- **DashboardLayout import** is from `@/components-legacy/dashboard/DashboardLayout` across every page. The dashboard lives entirely on legacy components; no `components/dashboard/` exists.

## The 12-slot map — what survives v1

| Fresha slot | Solen page(s) | Status | Action for Solen Pro v1 |
|---|---|---|---|
| **Home** | `/dashboard` (page.tsx) | working | **keep** — already KPI grid + today bookings + alerts + activity feed |
| **Calendar** | `/dashboard/calendar` | working (deepest page, 872 lines, realtime via Supabase channel) | **keep** — drag/drop slots, walk-ins, bulk create, week/month/day view |
| **Sales (POS)** | none direct; closest is `/dashboard/bookings` "Preis bestätigen" flow | partial — no POS / sales terminal | **gap** — needs new POS module to compete with Fresha |
| **Reviews** | `/dashboard/reviews` + `/dashboard/review-moderation` (admin) | working salon-side | **keep** salon page; **drop** moderation (admin-only) |
| **Catalogue (Services)** | `/dashboard/services` | working (524 lines, CRUD + photos + buffer/processing/finishing minutes + age/gender targeting + DnD reorder) | **keep** — strong feature |
| **Clients** | `/dashboard/clients` (general) + 5 vertical-specific CRMs | working but fragmented | **consolidate** — see Vertical CRM cluster analysis |
| **Marketing** | `/dashboard/marketing` (packages/gifts/referrals/promos/last-min) | working tab shell, depends on 5 child components | **keep** — tab structure aligns with Fresha "Promote" |
| **Payments** | `/dashboard/earnings` (salon-facing) + `/dashboard/revenue` (platform-wide, admin) | working | **keep** earnings; **drop** revenue (admin-only). `loyalty` page also acts as redemption scanner |
| **Team** | `/dashboard/staff` (CRUD + invites + permissions + service assignment + commission) | working | **keep** — comprehensive |
| **Reports (Analytics)** | `/dashboard/analytics` (salon-scoped, 5 tabs) + `/dashboard/platform-analytics` (admin) | working salon-side | **keep** salon analytics; **drop** platform-analytics |
| **Apps (integrations)** | none | **missing** | **gap** — Solen has zero integrations surface |
| **Settings** | `/dashboard/settings` (12 tab modules) + adjacent `/dashboard/gallery`, `/dashboard/verification`, `/dashboard/setup` | working | **merge** gallery/verification into settings; `/setup` is onboarding wizard, keep separate |

**Survives v1 from owner nav (16 items):** dashboard, bookings, calendar, messages, staff, clients, services, marketing, analytics, reviews, gallery, settings, earnings, loyalty, marketing, setup. The 8 vertical CRMs need consolidation strategy.

**Out of v1 (admin-only, 13 items):** approvals, all-salons, all-users, revenue, platform-analytics, badge-manager, content-editor, discovery-admin, discovery-posts, homepage-admin, review-moderation, segments, editor.

---

## Page-by-page audit (full entries)

### `/dashboard` (page.tsx)
- Purpose: Salon owner home / overview with KPIs (bookings this week, revenue, new customers, rating), trend deltas vs prior period, today's bookings list, activity feed, alerts (low slots / pending cancellations / verification overdue), category-specific tool shortcuts, quick actions.
- User role: salon-owner / salon-staff
- Status: working (diagnosed-from-code)
- Vertical: general (but renders vertical-specific tool shortcuts via `getCategoryNavGroups`)
- Fresha slot: **Home**
- Duplicates: none
- Survives v1: **yes** — keep as-is
- Notes: 425 lines. Fetches `/api/profile`, `/api/bookings?date=…`, `/api/analytics/salon/{sid}?period=week`, `/api/conversations?…&unread=true`. Uses `DashboardHeaderStrip` + `TodayLiveCard` (mobile-first additive surfaces locked 2026-05-02 per `page.tsx:142-146`). Brand inconsistency: confetti banner uses `#1B4D1B` (old forest emerald) at `page.tsx:129` — does not match the current B&W palette pivot.
- File: `app/[locale]/dashboard/page.tsx`

### `/dashboard/calendar`
- Purpose: Drag-and-drop slot management, walk-in modal, bulk slot creation, week/month/day views. Realtime updates via Supabase channel.
- User role: salon-owner / salon-staff
- Status: working
- Vertical: general
- Fresha slot: **Calendar**
- Duplicates: partial overlap with `/dashboard/bookings` (lists bookings) and `/dashboard/barber-ops` (live queue)
- Survives v1: **yes** — flagship feature
- Notes: 872 lines, largest page. Uses `@hello-pangea/dnd` for slot drag. Endpoints: `/api/slots` (CRUD + bulk), `/api/services`, `/api/staff`, `/api/profile`. Realtime channel on `availability_slots` table (`page.tsx:404-414`). Service category color-coded left borders (`page.tsx:23-29`). Has its own internal modals (SlotCreate, BulkCreate, SlotDetail).
- File: `app/[locale]/dashboard/calendar/page.tsx`

### `/dashboard/bookings`
- Purpose: Booking list with status filter pills (all/confirmed/completed/cancelled/no_show), inline status transitions (complete, no_show, cancel), salon-initiated cancel with reason modal, "Preis bestätigen" upcharge flow for completed bookings (Stripe confirm-price), open disputes notification per row.
- User role: salon-owner / salon-staff
- Status: working
- Vertical: general
- Fresha slot: **Calendar** (booking management — Fresha's calendar collapses booking list + slot grid)
- Duplicates: overlap with calendar (which shows slot bookings inline)
- Survives v1: **yes** — merge concept-wise but keep as separate route
- Notes: 317 lines. Fetches `/api/bookings?status=…&limit=50`, then on row: `/api/bookings/{id}/cancel`, `/api/bookings/{id}` PATCH, `/api/stripe/confirm-price`. Inline supabase-browser import for `booking_disputes` query (`page.tsx:133-146`) — anti-pattern, should be via API route. Has ClientTags inline.
- File: `app/[locale]/dashboard/bookings/page.tsx`

### `/dashboard/messages`
- Purpose: Conversation inbox (salon perspective), dynamic ChatWindow load, hardcoded German quick replies array (`page.tsx:25-29`).
- User role: salon-owner / salon-staff
- Status: working
- Vertical: general
- Fresha slot: **Settings → Messaging** (Fresha doesn't have a dedicated inbox; Treatwell does)
- Duplicates: none
- Survives v1: **yes**
- Notes: 169 lines. `/api/profile`, `/api/conversations?salon_id={sid}`, `/api/conversations/{id}/messages` POST. Dynamic import for `ChatWindow`. Three hardcoded quick replies (German only) — should be data-driven via `/api/chat-templates`.
- File: `app/[locale]/dashboard/messages/page.tsx`

### `/dashboard/clients`
- Purpose: Client list with segment filter (Alle/VIP/Gefährdet/Neu/Regulär), search, detail view with 6 tabs (Termine, Formeln, Fotos, Notizen, Tags, Fragebogen). Add/edit notes + tags.
- User role: salon-owner
- Status: working
- Vertical: general (but has `FormulaTab` which is vertical-specific to hair color salons)
- Fresha slot: **Clients**
- Duplicates: **MAJOR** — overlaps with `nail-clients`, `barber-clients`, `coiffeur-crm`, `spa-admin`, `makeup-admin`, `waxing-admin` (each has its own client surface)
- Survives v1: **yes — make canonical**, vertical-specific tabs become conditional
- Notes: 410 lines. `/api/profile`, `/api/salon/clients?salon_id=…`, `/api/bookings?user_id=…`, `/api/client-notes`, `/api/salons/{id}/client-tags`. Mix of img/Image (img tag used at `page.tsx:290` despite Next/Image elsewhere). Hardcoded segments labels in German.
- File: `app/[locale]/dashboard/clients/page.tsx`

### `/dashboard/staff`
- Purpose: Team CRUD + invite + service assignment + permissions (can_edit_schedule / can_view_own_bookings / can_manage_portfolio) + commission rate. PendingInvites list at top.
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Team**
- Duplicates: none
- Survives v1: **yes**
- Notes: 527 lines. `/api/profile`, `/api/staff` (CRUD), `/api/staff/services` (assignment), `/api/services`. Modal handles save then chained service-assignment call (`page.tsx:115-125`). Has Invite modal (separate) and Delete modal with future-bookings check.
- File: `app/[locale]/dashboard/staff/page.tsx`

### `/dashboard/services`
- Purpose: Service catalogue CRUD with photos (max 3 per service), buffer/processing/finishing minute breakdown, age (child/teen/adult/senior) + gender (male/female/non-binary) targeting, drag-reorder via `@hello-pangea/dnd`, service templates seeding.
- User role: salon-owner
- Status: working
- Vertical: general (categories: coiffeur/barbershop/nails/spa/makeup/waxing)
- Fresha slot: **Catalogue**
- Duplicates: none — but vertical-admin pages do contain category-specific service flavors (e.g. `nail-admin` has `DynamicPricingConfig` + `StationManager` + `RetailManager`)
- Survives v1: **yes**
- Notes: 524 lines. `/api/services` CRUD + `/api/services/{id}` + `/api/services/photos`. Uses `serviceTemplates` library for seeding common services.
- File: `app/[locale]/dashboard/services/page.tsx`

### `/dashboard/marketing`
- Purpose: Tabbed marketing shell (Pakete, Geschenkkarten, Empfehlungen, Aktionen, Last-Minute) — delegates to child managers `PackageManager`, `GiftCardManager`, `ReferralDashboard`, `PromoManager`, `LastMinuteManager`.
- User role: salon-owner
- Status: working (shell), child components not audited
- Vertical: general
- Fresha slot: **Marketing**
- Duplicates: overlap with `/dashboard/loyalty` (loyalty is referrals-adjacent)
- Survives v1: **yes** — keep as Solen Pro marketing hub
- Notes: 82 lines. Inconsistent endpoint: uses `/api/salon/mine` here but `/api/profile` everywhere else. Three of five tabs need `salonId`; `aktionen` (PromoManager) does not.
- File: `app/[locale]/dashboard/marketing/page.tsx`

### `/dashboard/analytics`
- Purpose: 5-tab salon-scoped analytics (Übersicht/Bookings/Customers/Services/Team). KPIs, Recharts area/bar/line/pie, heatmap, forecast widget, CSV export, date-range picker, prior-period comparison toggle. PostHog metrics: `posthog_profile_views`, `posthog_conversion_rate`.
- User role: salon-owner
- Status: working
- Vertical: general (Team tab branches on barbershop category for `BarberLeaderboard`)
- Fresha slot: **Reports**
- Duplicates: overlap with `/dashboard/platform-analytics` (admin-scoped)
- Survives v1: **yes**
- Notes: 406 lines. `/api/profile` + `/api/analytics/salon/{sid}?from=…&to=…`. CORAL color constant set to `#1B4D1B` at `page.tsx:43` — pre-pivot forest emerald, no longer brand. Hard-codes `AMBER = "#F3A864"` too.
- File: `app/[locale]/dashboard/analytics/page.tsx`

### `/dashboard/reviews`
- Purpose: Salon-side review list. Inline reply form (max 500 chars), flag for moderation with reason, star display.
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Reviews**
- Duplicates: `/dashboard/review-moderation` is admin-side counterpart
- Survives v1: **yes**
- Notes: 232 lines. `/api/salons/mine` + `/api/reviews/salon/{id}` + `/api/reviews/{id}/respond` + `/api/reviews/{id}/flag`. Tailwind class typo at `page.tsx:132`: `hover:text-s-coral:text-s-coral`.
- File: `app/[locale]/dashboard/reviews/page.tsx`

### `/dashboard/gallery`
- Purpose: Salon photo gallery + cover photo manager + "About" editor. Delegates to `GalleryManager` and `SalonAboutEditor`.
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Settings → Profile** (Fresha bundles gallery into salon settings)
- Duplicates: overlap with `/dashboard/settings/profile` (which can take cover_photo_url)
- Survives v1: **merge into Settings**
- Notes: 78 lines. `/api/salons/mine` + `/api/salons/{id}` (via child components). If no salon, redirects to dashboard.
- File: `app/[locale]/dashboard/gallery/page.tsx`

### `/dashboard/earnings`
- Purpose: Stripe earnings — available balance + total paid out + transactions table with PDF invoice link, staff payout table per stylist (commission %, gross, staff share, house share).
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Payments / Reports**
- Duplicates: overlap with `/dashboard/revenue` (admin-side platform view) and `/dashboard/analytics → Team` tab (StaffComparison)
- Survives v1: **yes** — rename "Earnings" for clarity
- Notes: 240 lines. `/api/profile` + `/api/salon/earnings` + `/api/earnings/staff?salon_id=…`. Inline PDF link `/api/salon/invoices/{id}`.
- File: `app/[locale]/dashboard/earnings/page.tsx`

### `/dashboard/setup`
- Purpose: Onboarding wizard — 7 steps (Salon Profile / Opening Hours / Services / Team / Schedule / Payments / Go Live). Tracks progress via `/api/salon/setup-progress`.
- User role: salon-owner (new)
- Status: working
- Vertical: general
- Fresha slot: separate onboarding flow (not in 12-slot nav, similar to Fresha's "Get started" wizard)
- Duplicates: none
- Survives v1: **yes**
- Notes: 107 lines orchestrator. Delegates to `SetupWizard` shell + 7 step components.
- File: `app/[locale]/dashboard/setup/page.tsx`

### `/dashboard/verification`
- Purpose: Upload trade-license / professional-cert / hygiene-cert / ID / address proof / other. Status: approved/pending/rejected with admin_note.
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Settings → Verification**
- Duplicates: settings has a "Verifizierung" tab too (`settings/page.tsx:1173`) — but that tab renders `VerificationTab` (read-only), not this CRUD page
- Survives v1: **merge into Settings**
- Notes: 181 lines. `/api/salon/documents` GET/POST/DELETE multipart upload (10MB max).
- File: `app/[locale]/dashboard/verification/page.tsx`

### `/dashboard/settings`
- Purpose: 12-tab settings hub (Profil, Last-Minute, Zahlungen, Schnellantworten, Verifizierung, Ferien, SMS-Erinnerungen, Stornierung, Feiertage, Terminvergabe, Provision, Nebenzeiten).
- User role: salon-owner
- Status: working
- Vertical: general
- Fresha slot: **Settings**
- Duplicates: tabs overlap with standalone pages: `/dashboard/verification` (full uploader vs read-only tab), `/dashboard/marketing` (Last-Minute also a marketing tab), and earnings ("Provision" tab in settings shows commission config while earnings page shows actual payouts)
- Survives v1: **yes — but consolidate** with verification + gallery
- Notes: 1187 lines (largest file in audit). Uses `ExpandableTabs` shell. Salon-frozen overlay (`page.tsx:1134-1148`). All tabs PATCH `/api/salons/{id}`. `PaymentsTab`, `CommissionTab`, `SchedulingTab`, `ClosuresTab` are non-trivial sub-pages embedded as tab content.
- File: `app/[locale]/dashboard/settings/page.tsx`

### `/dashboard/loyalty`
- Purpose: Loyalty config + QR-code stamp scanner — manual token entry, POST to `/api/loyalty/stamp` to redeem.
- User role: salon-owner
- Status: working
- Vertical: tagged "barbershop" via API filter — `fetch("/api/dashboard/clients?category=barbershop")` at `page.tsx:27` (vertical-locked!)
- Fresha slot: **Marketing → Loyalty**
- Duplicates: overlap with marketing tab structure
- Survives v1: **yes — but un-lock vertical**
- Notes: 118 lines. Bug: fetches clients endpoint with category=barbershop just to extract `salon_id` (`page.tsx:27`) — wrong endpoint, should be `/api/profile`. Empty error handler `} catch { /* Error */ }` (`page.tsx:32-33`).
- File: `app/[locale]/dashboard/loyalty/page.tsx`

### `/dashboard/discovery-posts`
- Purpose: Salon-side discovery post creator (photo upload OR TikTok URL) + history tab with view/like counts. ToS checkbox gated.
- User role: salon-owner
- Status: working
- Vertical: general (style category dropdown: hair/beard/nails/makeup/waxing)
- Fresha slot: **Marketing** (similar to Fresha's "Posts" / Instagram-style discovery)
- Duplicates: none salon-side; `/dashboard/discovery-admin` is the admin counterpart (curation)
- Survives v1: **yes — keep**, distinct salon discovery posting feature
- Notes: 218 lines. `/api/discovery/feed?creator=me` + `/api/discovery/post`. ToS field gates publish.
- File: `app/[locale]/dashboard/discovery-posts/page.tsx`

---

### VERTICAL-SPECIFIC CRMS (consolidation candidates)

### `/dashboard/coiffeur-crm`
- Purpose: 4 tabs — FormulaBook (hair color formulas per client), ConsultationNotes, ColourCycleConfig, Metrics (avg days between visits, adherence rate, sparkline).
- User role: salon-owner
- Status: working
- Vertical: **coiffeur** (hair color salons)
- Fresha slot: **Clients** (vertical extension)
- Duplicates: overlaps with general `/dashboard/clients` (notes tab) + `formulas` tab uses `FormulaTab` component shared with clients page
- Survives v1: **merge into Clients with conditional "Coiffeur" tab cluster**
- Notes: 177 lines. `/api/profile` + `/api/dashboard/coiffeur/cycle-metrics`. AllergyAlert with `allergies={null}` hardcoded (`page.tsx:114`) — placeholder data, not wired to real allergy field.
- File: `app/[locale]/dashboard/coiffeur-crm/page.tsx`

### `/dashboard/nail-admin`
- Purpose: 7 tabs — AI Art Generator, AI Art Gallery, Dynamic Pricing Config, Station Manager (treatment chairs), Retail Manager (product inventory), Retail Sales Dashboard, Infill Reminders.
- User role: salon-owner
- Status: working
- Vertical: **nails**
- Fresha slot: **Catalogue + Apps + Reports** (mixed)
- Duplicates: overlaps with `/dashboard/services` (Dynamic Pricing) and `/dashboard/clients` (would inherit)
- Survives v1: **partial-merge** — Stations + Retail are unique nail features; AI Art is unique; Dynamic Pricing could fold into Services
- Notes: 90 lines orchestrator only. Heavy lift in 7 child components.
- File: `app/[locale]/dashboard/nail-admin/page.tsx`

### `/dashboard/nail-clients`
- Purpose: Nail-specific CRM tab (`NailClientTab`) + InfillReminderConfig.
- User role: salon-owner
- Status: working
- Vertical: **nails**
- Fresha slot: **Clients**
- Duplicates: **DEFINITELY** overlaps with `/dashboard/clients` — same concept, vertical-flavored
- Survives v1: **kill, merge into Clients**
- Notes: 51 lines. Just `/api/profile` + 2 child components.
- File: `app/[locale]/dashboard/nail-clients/page.tsx`

### `/dashboard/barber-clients`
- Purpose: Barber-specific CRM (BarberLeaderboard + SmartReminderConfig).
- User role: salon-owner
- Status: working
- Vertical: **barbershop**
- Fresha slot: **Clients / Team**
- Duplicates: leaderboard also rendered in `/dashboard/analytics → Team tab` and `/dashboard/barber-ops → Leaderboard tab`
- Survives v1: **kill, merge into Clients (or Team)**
- Notes: 51 lines.
- File: `app/[locale]/dashboard/barber-clients/page.tsx`

### `/dashboard/barber-ops`
- Purpose: 4 tabs — Live Queue panel + ExpressMenu, Walk-in Analytics (hourly chart + analytics + P&L), Fade Blueprints (saves per client), BarberLeaderboard.
- User role: salon-owner
- Status: working
- Vertical: **barbershop**
- Fresha slot: **Calendar (Queue) + Reports + Clients**
- Duplicates: Live Queue duplicated in `/dashboard/queue-display`; Leaderboard duplicated in `/dashboard/barber-clients` and analytics
- Survives v1: **partial-merge** — queue+walkins are unique barbershop ops; blueprints/leaderboard fold into clients/team
- Notes: 129 lines orchestrator.
- File: `app/[locale]/dashboard/barber-ops/page.tsx`

### `/dashboard/queue-display`
- Purpose: Full-screen black-bg "Live Queue" wall display (TV mode) for barber shops. Same `LiveQueuePanel` as barber-ops.
- User role: salon-owner / salon-staff (display kiosk)
- Status: working
- Vertical: **barbershop**
- Fresha slot: **Apps** (kiosk/display feature) or out-of-scope
- Duplicates: pure duplicate component-use with `/dashboard/barber-ops`
- Survives v1: **keep as a "display mode" route**, optionally outside the dashboard chrome
- Notes: 72 lines. Uses dark theme inline (`#0A0A0A` background) — only page in dashboard with dark mode.
- File: `app/[locale]/dashboard/queue-display/page.tsx`

### `/dashboard/waxing-admin`
- Purpose: 6 tabs — Body Zone Selector (client-scoped), Sensitivity Log (client-scoped), Regrowth Config, Zone Packages, Rebook Alerts, Zone Revenue Chart.
- User role: salon-owner
- Status: working
- Vertical: **waxing**
- Fresha slot: **Clients + Catalogue + Reports**
- Duplicates: client-scoped tabs overlap with `/dashboard/clients`
- Survives v1: **partial-merge** — zone selector + sensitivity log are unique
- Notes: 122 lines orchestrator. Requires client selection for 2 of 6 tabs.
- File: `app/[locale]/dashboard/waxing-admin/page.tsx`

### `/dashboard/spa-admin`
- Purpose: 4 tabs — Room Manager (treatment rooms), Spa Intake (medical form, client-scoped), Wellness Journal (client-scoped), Treatment Outcome (client-scoped). Includes `ContraindicationAlert`.
- User role: salon-owner
- Status: working
- Vertical: **spa**
- Fresha slot: **Catalogue (rooms) + Clients (intake/journal/outcome)**
- Duplicates: client tabs overlap heavily with `/dashboard/clients`
- Survives v1: **partial-merge** — Rooms unique; intake/journal/outcome fold into Clients
- Notes: 131 lines. ContraindicationAlert intake={null} (`page.tsx:100`) — placeholder, not wired.
- File: `app/[locale]/dashboard/spa-admin/page.tsx`

### `/dashboard/makeup-admin`
- Purpose: 4 tabs — Bridal Planner, Face Chart Builder (client-scoped), Kit Inventory, Skin Tone Matcher (client-scoped).
- User role: salon-owner
- Status: working
- Vertical: **makeup**
- Fresha slot: **Clients + Catalogue**
- Duplicates: Kit Inventory is product/retail (overlap with nail-admin RetailManager concept); Face Chart + Skin Tone fold into Clients
- Survives v1: **partial-merge** — Bridal Planner unique
- Notes: 114 lines.
- File: `app/[locale]/dashboard/makeup-admin/page.tsx`

---

### SOLEN-ADMIN PAGES (out of scope for Solen Pro v1)

### `/dashboard/approvals`
- Purpose: Approve / reject pending salon registrations with reason modal.
- User role: solen-admin
- Status: working
- Survives v1: **drop** — admin-only
- File: `app/[locale]/dashboard/approvals/page.tsx`

### `/dashboard/all-salons`
- Purpose: List all salons by status (active/pending/frozen). Activate/freeze actions. Search by name or owner email.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/all-salons/page.tsx`

### `/dashboard/all-users`
- Purpose: User admin — role changer (customer/salon_owner/admin), suspend/unsuspend, search.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/all-users/page.tsx`

### `/dashboard/revenue`
- Purpose: Platform-wide GMV, commission, staff commissions, gift card revenue, tips. Recharts AreaChart.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/revenue/page.tsx`

### `/dashboard/platform-analytics`
- Purpose: Platform-wide counts (salons, users, bookings 30d, revenue 30d, avg rating) with count-up animation.
- User role: solen-admin
- Status: **placeholder** — has "Detaillierte Charts werden bald verfügbar" message at `page.tsx:124-126`
- Survives v1: **drop**
- File: `app/[locale]/dashboard/platform-analytics/page.tsx`

### `/dashboard/badge-manager`
- Purpose: Create/edit/delete salon badges (system + custom). Assign/remove badges per salon with search.
- User role: solen-admin
- Status: working
- Survives v1: **drop** (or expose read-only "earned badges" view to salon)
- File: `app/[locale]/dashboard/badge-manager/page.tsx`

### `/dashboard/content-editor`
- Purpose: Edit homepage content rows by tab (hero/stats/banner) with DE/EN locale toggle. Marks "is_auto" with auto_override.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/content-editor/page.tsx`

### `/dashboard/discovery-admin`
- Purpose: Discovery content studio — stock import (Pexels/Unsplash search), TikTok import, manual upload, staging review, published list, flagged.
- User role: solen-admin
- Status: working (largest admin page, 693 lines)
- Survives v1: **drop**
- File: `app/[locale]/dashboard/discovery-admin/page.tsx`

### `/dashboard/disputes`
- Purpose: Booking price-upcharge disputes — list pending/disputed, approve/reject/compromise with admin amount. Includes `BookingDisputePanel`.
- User role: solen-admin
- Status: working
- Survives v1: **drop** (or salon could see "my disputes" view in Pro)
- File: `app/[locale]/dashboard/disputes/page.tsx`

### `/dashboard/help-editor`
- Purpose: Help article CRUD (slug/title/markdown/category/locale/published/sort_order).
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/help-editor/page.tsx`

### `/dashboard/homepage-admin`
- Purpose: Toggle homepage sections visibility (featured, last_minute, trending, nearby, etc.).
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/homepage-admin/page.tsx`

### `/dashboard/review-moderation`
- Purpose: Review moderation — flagged tab + all tab. Admin response, approve/hide/delete.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/review-moderation/page.tsx`

### `/dashboard/segments`
- Purpose: Display auto-calculated customer segments (icon + count + members + email blast button). Grid view.
- User role: solen-admin (likely — hits `/api/admin/segments`)
- Status: working
- Survives v1: **could be useful for Pro** as marketing-segment view, but currently admin-scoped
- File: `app/[locale]/dashboard/segments/page.tsx`

### `/dashboard/admin-sandbox`
- Purpose: Dev-only sandbox — create test salons, seed walkin/bookings/reviews/last-minute, platform test-salon seeder (Basel/Zürich/Bern), delete all.
- User role: solen-admin
- Status: working
- Survives v1: **drop**
- File: `app/[locale]/dashboard/admin-sandbox/page.tsx`

### `/dashboard/editor`
- Purpose: 6-line passthrough to `components-legacy/editor/EditorPage` — a "Visual Editor" gated to admin role per `DashboardLayout.tsx:47`.
- User role: solen-admin
- Status: working (delegated to legacy)
- Survives v1: **drop**
- Notes: This is the entire file — `export default function EditorDashboardPage() { return <EditorPage />; }`.
- File: `app/[locale]/dashboard/editor/page.tsx`

---

## Vertical CRM cluster analysis

Solen has **8 vertical-specific pages** (3 dedicated client surfaces + 5 vertical-admin tab hubs). They all repeat the same `useEffect → fetch("/api/profile") → setSalonId` pattern, then delegate to vertical components.

**Shared scaffolding:**
- `DashboardLayout` wrapper with `salonName + salonCategories` props
- `salonId` state from `/api/profile`
- `ClientSelectorDropdown` for client-scoped tabs (4 of the 8 pages need a client to function)
- Tabs nav with pill-style buttons + `s-coral` active state
- Vertical-named header label ("Coiffeur", "Nails", "Barber", "Spa", "Makeup", "Waxing")

**What is UNIQUE per vertical** (must survive consolidation):

| Vertical | Unique feature | Component path hint |
|---|---|---|
| coiffeur | Color formula book per client, colour cycle config, cycle metrics sparkline | `components-legacy/dashboard/coiffeur/FormulaBook`, `ColourCycleConfig` |
| nails | AI Art Generator + Gallery, Station Manager, Retail (POS + sales) | `components-legacy/dashboard/nail/AiArtGenerator`, `StationManager`, `RetailManager`, `RetailSalesDashboard` |
| barber | Live queue + ExpressMenu walk-in flow, Fade Blueprints, P&L comparison | `components-legacy/dashboard/barber/LiveQueuePanel`, `FadeBlueprint`, `PLComparison` |
| spa | Treatment room manager, Spa intake (medical form), Wellness journal, Contraindication alert | `components-legacy/dashboard/spa/RoomManager`, `SpaIntake`, `WellnessJournal`, `ContraindicationAlert` |
| makeup | Bridal planner, Face chart builder, Skin tone matcher, Kit inventory | `components-legacy/dashboard/makeup/BridalPlanner`, `FaceChartBuilder`, `KitInventory`, `SkinToneMatcher` |
| waxing | Body zone selector, Sensitivity log, Regrowth config, Rebook alerts, Zone revenue chart | `components-legacy/dashboard/waxing/BodyZoneSelector`, `SensitivityLog`, `RegrowthConfig`, `RebookAlerts` |

**Generic features duplicated across all 6 verticals:**
- Client selector (every page needs it)
- Reminder config (Smart/Infill/Rebook reminders are all the same notification config pattern with different copy)
- Leaderboard concept (barber-specific in code but generic concept)
- Inventory/Retail (nail + makeup share inventory concept)
- Pricing config (nail dynamic pricing vs general service pricing)

### Consolidation strategy options

**Option A — single Clients page with vertical-aware tabs (RECOMMENDED for v1)**
- Keep `/dashboard/clients` as canonical
- Add conditional tabs based on `salon_categories`: client gets Coiffeur formula book IF salon offers coiffeur, etc.
- Kills 6 pages (nail-clients, barber-clients, coiffeur-crm, and the client-scoped tabs in spa-admin/makeup-admin/waxing-admin)
- **Pros:** matches Fresha's IA, less duplication, easier maintenance, Solen Pro feels coherent
- **Cons:** large Clients page; needs careful tab visibility logic

**Option B — keep verticalized pages but extract a shared `VerticalCRMShell`**
- Make a single component that handles: profile fetch + tabs nav + client selector + layout
- Each vertical-admin page becomes ~30 lines passing in tabs config
- **Pros:** preserves brand-specific URLs (`/dashboard/nail-admin`), salon types can deep-link to their hub
- **Cons:** doesn't help Solen Pro positioning (looks like a marketplace tool, not a SaaS)

**Option C — vertical-specific MICROAPPS exposed under "Apps" slot**
- Put vertical specifics under `/dashboard/apps/nail-pos`, `/dashboard/apps/spa-intake`, etc.
- Map to Fresha's missing "Apps" slot
- **Pros:** fills the Apps gap AND solves vertical-specific bloat
- **Cons:** restructures URLs; Apps slot currently has nothing in it so this is greenfield

---

## Pages to kill or merge

| Page | Reason | Action |
|---|---|---|
| `/dashboard/nail-clients` | Pure duplicate of clients with vertical scope | merge into Clients (conditional tabs) |
| `/dashboard/barber-clients` | Pure duplicate of clients with vertical scope | merge into Clients (conditional tabs) |
| `/dashboard/coiffeur-crm` | Vertical CRM, overlaps clients | merge formulas/cycles into Clients; kill metrics tab (already in Analytics) |
| `/dashboard/spa-admin` | Mixed concerns — Rooms is unique, rest is Clients | split: Rooms→Catalogue or Apps, rest→Clients |
| `/dashboard/makeup-admin` | Mixed concerns — Kit Inventory is retail, rest is Clients | split: Kit→Catalogue, rest→Clients |
| `/dashboard/waxing-admin` | Mixed concerns — Zone+Sensitivity is Clients, rest is Catalogue | split: Zone/Sensitivity→Clients, Packages/Revenue→Catalogue/Reports |
| `/dashboard/nail-admin` | Heavy mixed concerns — AI/Retail/Stations/Pricing all distinct | split: AI→Apps, Retail→Sales/POS, Stations→Catalogue, Pricing→Services |
| `/dashboard/barber-ops` | Live queue is genuine ops feature; rest duplicates | split: Queue→Calendar add-on, rest→Clients/Analytics |
| `/dashboard/queue-display` | Pure display variant of LiveQueuePanel | keep as `?display=tv` query param or `/display/queue` outside chrome |
| `/dashboard/gallery` | Subset of Settings → Profile | merge into Settings |
| `/dashboard/verification` | Settings already has Verifizierung tab (read-only) | merge: settings tab becomes full uploader |
| `/dashboard/editor` | 6-line passthrough to legacy admin component | drop |
| `/dashboard/loyalty` | Loyalty config + scanner — overlaps Marketing | merge into Marketing tab (already has structure for it) |
| `/dashboard/segments` | Admin-scoped via `/api/admin/segments` | drop OR move under Marketing if Pro should have segments |

**Admin pages to drop entirely from Solen Pro (13):** approvals, all-salons, all-users, revenue, platform-analytics, badge-manager, content-editor, discovery-admin, disputes, help-editor, homepage-admin, review-moderation, admin-sandbox.

---

## Solen-admin pages — out of scope for Solen Pro

Confirmed admin-only (gated by `role === "admin"` in DashboardLayout and/or hits `/api/admin/*`):

- `/dashboard/approvals` — pending salon approvals queue (`/api/admin/salons?status=pending`)
- `/dashboard/all-salons` — full salon directory + freeze/activate (`/api/admin/salons`)
- `/dashboard/all-users` — user role/suspend admin (`/api/admin/users`)
- `/dashboard/revenue` — platform GMV (`/api/admin/revenue`)
- `/dashboard/platform-analytics` — platform-wide stats (`/api/analytics/platform`)
- `/dashboard/badge-manager` — badge CRUD + assignment (`/api/admin/badges`)
- `/dashboard/content-editor` — homepage content editor (`/api/admin/content-list`)
- `/dashboard/discovery-admin` — discovery curation studio (`/api/admin/discovery/*`)
- `/dashboard/disputes` — booking dispute resolution (`/api/admin/disputes`)
- `/dashboard/help-editor` — help articles CRUD (`/api/admin/help`)
- `/dashboard/homepage-admin` — homepage section toggles (`/api/admin/homepage-sections`)
- `/dashboard/review-moderation` — review flag handling (`/api/admin/reviews`)
- `/dashboard/segments` — segment view (`/api/admin/segments`) — could be Pro-elevated
- `/dashboard/admin-sandbox` — dev-only test salon seeder (`/api/admin/test-salon`, `/api/admin/seed-test-salons`)
- `/dashboard/editor` — visual editor passthrough (admin per `DashboardLayout.tsx:47`)

---

## Gaps vs Fresha 12-slot

Slots where Solen has nothing / weak coverage:

- **Sales (POS / register)** — Solen has zero. `/dashboard/bookings` has a "Preis bestätigen" upcharge button (`bookings/page.tsx:166-177`) calling `/api/stripe/confirm-price`, but there is no in-person POS, no walk-in checkout, no product sales register, no card-on-file payments, no tip workflow on POS. Treatwell Pro has this. Fresha has this (their main "Sales" tab). **Largest gap for B2B parity.**

- **Apps (integrations marketplace)** — completely missing. No Google Calendar sync, no Outlook, no Mailchimp/Klaviyo, no Zapier, no accounting integrations, no QuickBooks/Bexio, no point-of-sale terminal, no Stripe Terminal, no NFC. Fresha and Treatwell both expose marketplace tiles for integrations.

- **Payments (card-on-file / saved payment methods)** — Stripe Connect is wired for payouts (`/api/salon/earnings`) and earnings tracking, but there is no UI for managing client payment methods, no "deposit" / "no-show fee" flow visible, no recurring billing for memberships. Settings `PaymentsTab` exists but only configures the salon's Stripe Connect account, not client payments.

- **Reports — exportable reports** — analytics has CSV export per-section (`useExportCSV` hook), but no PDF reports, no scheduled reports, no comparison reports beyond the toggle. Limited compared to Fresha's "End-of-day report" / "Z-report" pattern.

- **Marketing — email campaigns** — Solen has packages/gift-cards/referrals/promos/last-minute, but no email composer, no SMS broadcast, no "send to segment" flow. `/dashboard/segments` admin page has an "E-Mail senden" button but it's a stub (no onClick handler visible at `segments/page.tsx:124-128`). Both competitors have built-in campaigns.

- **Online booking widget config** — Settings doesn't expose embed code / widget customization. Fresha has a "Online booking" widget builder. Solen relies entirely on its marketplace funnel.

- **Inventory (general retail)** — only nail-admin (`RetailManager`) and makeup-admin (`KitInventory`) have inventory. There is no general retail/inventory system tied to Services or independent. Fresha has POS-tied inventory.

- **Subscription / membership management** — no UI for memberships (e.g. "10 cuts for CHF 200" recurring). Marketing has packages but those appear to be single-buy.

- **Forms (intake / consent / waiver)** — spa-admin has `SpaIntake` form, but no generic form builder. `IntakeFormTab` exists in clients page. Fresha has a "Forms" feature.

---

## Top 5 surprises / recommendations

1. **The vertical-CRM bloat is the #1 productization problem.** 8 of 41 pages are vertical-locked variants of two concepts: "client management" and "vertical-specific operations". Selling Solen Pro to non-Solen salons means they pick a vertical and use that one. The current nav (per `DashboardLayout.tsx:53-72`) renders ALL of them at once for a hair salon, including barber-clients, nail-clients, barber-ops. This is messy and incoherent for a SaaS sale. **Recommendation:** kill the 8 vertical pages and route their unique features into the 12-slot IA conditionally based on `salon_categories`. The shared scaffolding alone (profile fetch, tabs, client selector) is identical across 8 files.

2. **There is no POS / Sales tab.** This is the single largest gap vs both Fresha and Treatwell. The only money-handling surface is `/dashboard/earnings` (read-only payout history) and the "Preis bestätigen" button on completed bookings. There's no checkout flow, no product sales, no card-on-file. Pricing Solen Pro at CHF 13–19/mo (Fresha tier) without POS is hard to defend. **Recommendation:** flag as v1 blocker or position Solen Pro as "booking + marketing without POS" at a lower price point.

3. **Brand colors in code are pre-pivot (forest emerald `#1B4D1B`).** Found hardcoded `#1B4D1B` in `revenue/page.tsx:158-160,185-189`, `analytics/page.tsx:43`, and the welcome confetti in `dashboard/page.tsx:129`. Per MEMORY.md note on B&W pivot (2026-05-25), green has been dropped from UI. Token `s-coral` is still being used as a brand accent everywhere — that token name + the hex hardcodes are stale. Productizing means rebrand pass.

4. **Settings is 1187 lines with 12 tabs — and 3 of those tabs duplicate standalone pages.** `Verifizierung` tab vs `/dashboard/verification`, `Last-Minute` tab vs `/dashboard/marketing → Last-Minute`, `Provision` tab vs `/dashboard/earnings` staff payouts. Settings has the most consolidation opportunity by far. Verification + gallery should fold in fully; last-minute and commission should pick canonical owners.

5. **Loyalty page is vertical-locked to barbershop in code** (`loyalty/page.tsx:27` hits `/api/dashboard/clients?category=barbershop`). For Solen Pro v1 sold to any salon type, this hardcoded category-filter must be removed. Also calling the clients endpoint just to extract `salon_id` is wrong — should call `/api/profile` like every other page. This is the only page with an obvious bug-level finding from static analysis.

**Honest limits on this audit:**
- Did not run the app — every "working" verdict is based on the code reading end-to-end, not on observed behavior.
- Did not deeply audit the child components (60+ in `components-legacy/dashboard/*`). The verticalized pages are mostly orchestrators delegating to them.
- Did not check RLS / API auth gating beyond the layout-level role check. Some `/api/admin/*` routes may not actually be gated server-side.
- Did not audit `/dashboard/error.tsx` and `/dashboard/loading.tsx` (boilerplate).
- "Diagnosed-from-code" status of `platform-analytics` as placeholder is based on the literal "coming soon" text in source; the stat cards above it DO fetch and render real numbers.
- Vertical "lock" inferred from page titles, label copy, and component imports — not from a `category` enforcement check at the route level.

# Dashboard + Onboarding , Phase 1 Research Synthesis (workflow w6t7f44uz, 2026-06-30)
> 12/14 competitors (Timely+Goldie rate-limited) + 4 code audits. Source of truth for the phased plan.

# Solen Owner Dashboard + Onboarding — Phase-1 Research Synthesis

## Current state (what we already have)

Solen already has a surprisingly complete owner back-office, but it runs on a frozen legacy tree (`components-legacy/dashboard/*`) with two parallel onboarding flows that don't hand off to each other.

**Onboarding is split across two wizards that overlap but never reference each other:**
- **CREATE wizard** — `app/[locale]/onboarding/salon/page.tsx` (736L) drives `OnboardingFlow.tsx` (228L+): 3 steps (Basics → Quick-Win service → Photos), `POST /api/salons` actually inserts the salon row (`is_active:false`). Reached from register, partner page, PartnerBlock, signup redirect.
- **COMPLETION wizard** — `app/[locale]/dashboard/setup/page.tsx` (106L) drives `SetupWizard.tsx` (170L): 7 steps (SalonProfile, OpeningHours, Services, Team, Schedule, Payments, GoLive), PATCHes the already-created salon. Only entry point is the dashboard `SetupBanner`.
- They overlap on profile/categories/services/photos with **different field sets and different components** (`StepPhotos`/`ImageUpload` vs `SalonProfileStep`/`ImageUploader`, two buckets: `salon-gallery` vs `salons`). An owner finishing CREATE is dropped at `/dashboard?onboarded=1` (`OnboardingFlow.tsx:527`) with **no automatic hand-off** into `/dashboard/setup`; they only find it via `SetupBanner`.

**DECISION — canonical onboarding:** The recommended resolution (from the audit) is to make `/onboarding/salon` a thin create step (auth + name + city + TOS → create `is_active:false` salon) and route immediately into `/dashboard/setup` as the single completion+go-live wizard, removing duplicated fields. This is a directional call the owner must approve.

**Dashboard shell + home are real but legacy:**
- Shell `DashboardLayout.tsx` (473L): fixed 64px desktop icon-rail (`RAIL_NAV`), mobile drawer, sticky topbar with SalonSwitcher + Cmd+K + NotificationCenter, auth guard via `/api/profile`.
- Home `dashboard/page.tsx` (322L): real metrics (revenue/bookings/newCustomers/rating + trend deltas) computed server-side from live bookings; Today list, Top services, Top team all wired with real empty states.
- All core owner routes exist and are real: services, staff, calendar (1123L), bookings, clients, reviews, analytics, settings (1554L), earnings, gallery, verification, upcharge, marketing.
- All 4 category dashboards built (nail-admin, spa-admin, coiffeur-crm, barber-ops) plus admin platform routes.
- Registry primitives (`DashPanel`/`DashStatCard`/`DashButton`/`DashStatusPill` in `app/[locale]/_components/dashboard/DashboardUI.tsx`) are built and locked, but the live dashboard still runs on the un-migrated legacy tree.

**Locked design skin:** §12 of `LOCKFILE.md:1170-1190` — operator dashboard is a separate VIBRANT skin (accent `#276EF1`, `rounded-card-lg` 20px, Inter Tight/Inter, semantic-text pills). NOT the "Zone 4 / coral / Syne" of the stale roadmaps, NOT "Aurora Azure #4A8BE9" (which appears zero times in shipped code).

---

## What's broken / fake / half-built

**Go-Live is theatre — newly created salons can never reach the marketplace from owner UI:**
- `GoLiveStep.tsx:28-33` `handleGoLive` only does `setTimeout(2000)` + confetti, then redirects to `/dashboard`. It **never calls** `POST /api/salon/go-live`, so `salons.is_active` is never flipped to true. Salons created at `salons/route.ts:647` (`is_active:false`) stay invisible (`GET /api/salons` filters `.eq('is_active',true)` at `route.ts:104`). Only an admin approve route can publish them.

**Three disagreeing "ready" contracts:**
- `setup-progress/route.ts:79` requires name+description+hours+≥1 service; `go-live/route.ts:27` requires `stripe_account_id` + cover_photo + ≥1 service; `GoLiveStep.tsx:26` checks only profile+hours+services. "Ready" is meaningless.

**Silent no-op / phantom-column bugs:**
- **Auto-apply schedule day-key mismatch** — `app/api/staff/schedule/auto-apply/route.ts:46` `dayMap` uses full day names (`monday`..`sunday`) but `opening_hours` is short-keyed (`mon`..`sun`). `hours?.[day]` always misses → **every staff member silently falls into the hardcoded 09:00-18:00 default** (`route.ts:70-78`) instead of the salon's real hours.
- **`dashboard/today` phantom column** — `app/api/dashboard/today/route.ts:76,85,130` select/sum `bookings.total_price`, which does NOT exist (real columns: `price_paid`/`paid_amount`/`final_price`). PostgREST returns null → `today_revenue` is **always 0** and the "now" card price always undefined.
- **`client_rfm_segments` table missing** from live snapshot — `app/api/salon/clients/route.ts:75-86` try/catches and degrades, so `segment_tag` is always 'Regulär'. RFM UI reads a phantom source.

**Money ledger structurally always zero:**
- `app/api/stripe/webhook/route.ts:224,343` always write `salon_payouts.status:'recorded'`; nothing ever writes `'paid'`. `earnings/route.ts:33` computes `total_earnings` only from `status==='paid'` → **lifetime earnings always shows CHF 0**.
- Three divergent revenue sources: today=`total_price` (phantom), earnings=`salon_payouts.net_amount`, clients=`price_paid` completed. Two are broken.

**Security holes (high priority):**
- **IDOR on client notes GET** — `app/api/dashboard/clients/[id]/notes/route.ts:21-27` reads with the service-role client and only checks `session != null`, NOT salon ownership. Any logged-in user can read any salon's private `client_notes`. (POST at `:47` does check owner_id; GET does not.)
- **Staff data leak** — `app/api/staff/route.ts:13-17` has NO ownership check and selects `commission_rate` + `permissions`, returning pay rates to anyone with a salon_id.

**Dead / stub / stale:**
- **Recurring bookings write-only** — `recurring_booking_rules` created via `bookings/recurring/route.ts` with `next_booking_date`, but **no cron consumes it**. Dead loop after the first manual booking.
- **Dead nav config** — `OWNER_NAV_GROUPS`, `filteredOwnerNavGroups`, `categoryNavGroups` (`DashboardLayout.tsx:55,179,200`) are computed but **never rendered**. Live nav is `RAIL_NAV` + `ADMIN_NAV` only.
- **Dead staff links** — `STAFF_NAV` (`DashboardLayout.tsx:101-106`) links `/dashboard/my-breaks` + `/dashboard/my-portfolio`, neither route exists → guaranteed 404.
- **Marketing defaults to killed gift cards** — `marketing/page.tsx:18` defaults tab to `geschenkkarten` and renders `GiftCardManager`; gift cards are KILLED/HIDDEN, so the first thing the page shows is a dead feature.
- **Single-option "prepay" radio** — `PaymentsStep.tsx:59-61` has one option in a radio group → reads as broken.
- **Dead POST fields** — `createSalonSchema` accepts `google_place_id`, `phone_verified`, `cancellation_policy` etc. but the insert **comments them out** (`salons/route.ts:637,652`); the wizard collects `google_place_id` and silently drops it.
- **Hardcoded Basel** — lat/lng default to `47.5596/7.5886` and quartier force-set `grossbasel` (`salons/route.ts:633,650`) regardless of actual city.
- **Hardcoded 3-city select** — `OnboardingFlow.tsx:135-139` offers only zuerich/basel/bern though the marketplace serves 8 cities.

**Fabricated copy:** `salon-onboarding.ts:66-69` "Salons mit Fotos erhalten 3x mehr Buchungen" — unsubstantiated stat, violates no-fabrication rule.

**Orphaned-but-real routes** (reachable only by URL/CommandPalette): loyalty, earnings, verification, gallery, reviews, nail-admin, spa-admin, coiffeur-crm, barber-clients, queue-display, setup. The rail hardcodes only barber-ops (`RAIL_NAV:117`), so a **nails/spa/coiffeur owner has no nav path to their own built tools**.

**Design drift:** rail active-state uses `bg-s-accent-bright` blue fill (`DashboardLayout.tsx:286`) — conflicts with locked calm-gray selected-state; 182 dead `s-coral` refs silently aliased to ink across 28 legacy widgets; dead green→orange gradient on `TodayLiveCard.tsx:114,144`; 13 silent catch blocks swallow API errors; i18n drift (en -11, fr -18, it -29 strings vs de).

---

## Competitor gap matrix

| Feature/Pattern | Who has it | Solen status | Why it matters | Effort | Where it lives |
|---|---|---|---|---|---|
| Card-on-file no-show/late-cancel auto-charge | Fresha, Booksy, Treatwell, StyleSeat, Square, Jane, DaySmart, Shortcuts | **missing** | Single most-cited owner feature across all 10 teardowns; recovers lost revenue | L | Backend + Dashboard-feature |
| Per-service / per-tier deposits (fixed or %) at booking | Fresha, Booksy, Square, Jane, Acuity, Setmore, StyleSeat, Shortcuts | **partial** (cols `deposit_min/max`/`no_show_deposit_amount` exist, no route enforces) | Cuts no-shows; columns already present, just unwired | M | Backend |
| Deposit targeted to new clients only | Shortcuts, Jane, Fresha | **missing** | Keeps regulars frictionless while protecting against new-client no-shows | M | Backend |
| Automated waitlist that auto-fills cancellations | Fresha, Booksy, Treatwell, Square, Jane, Mindbody, DaySmart | **partial** (`waitlist/route.ts` + cancel fan-out exist; not auto-promote/release) | Fills gaps without staff effort; Solen already has the join+email primitive | M | Backend + Dashboard-feature |
| Resumable, progress-tracked onboarding checklist with go-live gate | Square, Booksy, Treatwell, Jane, Mindbody, Shortcuts | **partial** (`SetupBanner` + `setup-progress` exist; go-live broken, no resume hand-off) | Gets owners live fast; the pieces exist but don't connect | S | Onboarding |
| Working Go-Live that flips `is_active` from owner UI | (table stakes everywhere) | **broken** (`GoLiveStep` fakes it) | Salons literally can't publish without an admin | S | Onboarding + Backend |
| Category-seeded starter service menu at signup | Booksy, Fresha, Shortcuts | **partial** (AI suggest-service exists, not category template seeding) | Lowers setup friction; Solen has the AI hook already | M | Onboarding |
| Concierge / assisted data migration (clients, appts, photos) | StyleSeat, DaySmart, Jane, Fresha | **missing** | Top switching-cost killer for acquiring salons from incumbents | L | Onboarding (ops) |
| Rich client card: history + notes + formulas + photos + LTV + tags | Fresha, Booksy, Treatwell, StyleSeat, Square, Jane, DaySmart, Shortcuts | **partial** (`client_notes`/`client_tags` exist; RFM phantom; thin surface) | Beauty-specific "client memory"; CRM depth competitors all have | M | Dashboard-feature |
| Stored color formulas / treatment notes on client card | DaySmart, Shortcuts, Jane, Treatwell | **missing** | Beauty-specific retention; differentiates from generic CRM | M | Dashboard-feature + Backend |
| Custom intake / consent / patch-test forms attached to booking | Fresha, Booksy, Treatwell, StyleSeat, Square, Jane, Acuity, Mindbody | **missing** | Near-mandatory for skin/aesthetic/wellness in CH | L | Dashboard-feature + Backend |
| Owner-run lifecycle marketing (birthday, win-back, rebook nudges) | Fresha, Booksy, StyleSeat, Square, Mindbody, Shortcuts, DaySmart | **partial** (cron `rebooking-nudge`/`review-prompt` exist; not owner-configurable campaigns) | Drives repeat revenue; Solen has the cron rails, not the owner controls | L | Dashboard-feature + Backend |
| Email + SMS blast / message-blast campaigns | Fresha, Booksy, Treatwell, Square, Mindbody, StyleSeat | **missing** | Owner-owned demand-gen; Solen only has system notifications | L | Dashboard-feature + Backend |
| AI-assisted marketing copy / social post builder | Fresha, Booksy, StyleSeat, Mindbody | **missing** (Gemini already wired for service suggest) | Cheap to add given existing Gemini integration | M | Dashboard-feature |
| Memberships / recurring subscription packages | Fresha, Booksy, Square, Mindbody, Acuity, Jane, DaySmart, Shortcuts | **missing** | Recurring revenue + retention beyond single bookings | L | Dashboard-feature + Backend |
| Gift cards as first-class owner product | Fresha, Booksy, Square, Acuity, Jane, DaySmart, Shortcuts | **killed/hidden** (intentional per memory) | Competitors monetize; Solen deliberately deferred | — | (deferred) |
| Smart / dynamic pricing (peak vs off-peak) | Fresha, StyleSeat, Mindbody | **missing** | Fresha cites ~15% revenue lift; off-peak gap-fill | L | Dashboard-feature + Backend |
| Last-minute / off-peak discount gap-filler (owner sets % + window) | Treatwell, Booksy, Fresha | **partial** (deals filter exists; no owner gap-fill scheduler) | Fills quiet slots; Solen has deals plumbing | M | Dashboard-feature |
| Deep reporting suite (staff perf, retention, no-show rate, financials) | Fresha, Booksy, Treatwell, StyleSeat, Square, Mindbody, Jane, DaySmart, Shortcuts | **partial** (analytics route computes basics; no retention/no-show/perf reports) | Owner trust + decisions; Solen has the analytics base | M | Dashboard-feature |
| Granular per-staff permission tiers | Fresha, Booksy, Square, Acuity, Jane, Mindbody, Calendly | **partial** (`permissions` column exists, leaked + not enforced as roles) | Multi-staff safety; needs the security fix anyway | M | Backend + Dashboard-core |
| First-class owner-facing POST to add a staff member | (table stakes) | **missing** (`staff/route.ts` GET-only; inserts only via salon-create/invite) | Adding team post-onboarding has no clean path | S | Backend |
| Commission / payroll automation (flat/tiered, tips) | Fresha, Booksy, Square, Mindbody, DaySmart, Shortcuts | **missing** (`commission_rate` stored, not computed) | Real beauty pain point; back-office owners expect it | L | Dashboard-feature + Backend |
| Integrated POS / retail + inventory (stock, low-stock alerts) | Fresha, Booksy, Treatwell, Square, Mindbody, DaySmart, Shortcuts | **missing** | Appointment-first marketplaces rarely track retail | L | Dashboard-feature + Backend |
| In-person Tap-to-Pay / card reader at the chair | Booksy, Treatwell, Square, StyleSeat, Acuity, Setmore | **missing** (walk-in pay-upfront only, online Stripe) | Card-present walk-in payment | L | Backend |
| Recurring appointments actually auto-booked | Square, DaySmart, Shortcuts, Jane | **broken** (rules persist, no cron consumes) | Half-built; silently stops after one booking | M | Backend |
| Two-way external calendar sync (Google/Outlook/Apple) | Acuity, Calendly, Setmore, Square, StyleSeat | **missing** | Table-stakes for owner adoption; avoids double-booking | M | Backend + Dashboard-feature |
| Booking rules surfaced to owner (min notice, buffers, advance window, daily caps) | Acuity, Calendly, Square, Setmore, Shortcuts | **partial** (some in salons PATCH allowlist, not surfaced as controls) | Owner self-service vs hardcoded | M | Dashboard-feature |
| Resource/room/chair scheduling (auto-reserve, prevent double-book) | Square, Mindbody, Shortcuts, Acuity, Jane | **partial** (`barber_chairs` exists; not general resource booking) | Spa/multi-room relevant | M | Backend |
| AI receptionist / missed-comms recovery (text-back-to-book) | Mindbody (Messenger[ai]), Square (Assistant) | **missing** (messaging killed) | Revenue recovery; but conflicts with messaging-off decision | L | (deferred) |
| Lead / sales pipeline (funnel stages + follow-up tasks) | Mindbody | **missing** | Treats prospects as CRM; lower priority for marketplace | L | Dashboard-feature |
| Owner-branded embeddable booking widget + social "Book Now" | Square, Acuity, Setmore, Booksy, StyleSeat, Calendly | **missing** (marketplace listing is the analog) | Owner reach off-platform | M | Dashboard-feature |
| Category-aware dashboard home | (Fresha/Square branch by business type) | **missing** (home never branches on `salonCategories`) | Locked-spec feature, unbuilt; child components exist | M | Dashboard-core |
| Category nav wired into rail (nails/spa/coiffeur reach their tools) | (table stakes) | **broken** (`getCategoryNavGroups` built, never imported) | ~10-line render fix; tools already built | S | Dashboard-core |
| Automated review-request after appointment | Setmore, Treatwell, StyleSeat, Jane, Shortcuts | **partial** (`review-prompt` cron exists; not owner-surfaced) | Reputation growth; rails exist | S | Dashboard-feature |

---

## Outside-the-dashboard opportunities

These are NOT owner-dashboard-scoped but surfaced repeatedly across teardowns and worth a separate decision track:

- **Demand / lead engine (Boost / New Client Connection / Google Reserve)** — Booksy, StyleSeat, Treatwell, Fresha, Mindbody all monetize via pay-per-new-client or marketplace-distribution levers. This is a **marketplace-and-pricing-model** decision, not a dashboard feature. Solen is marketplace-first, so this is its natural moat — but it needs attribution + an owner-facing ROI/Boost dashboard to be sellable. **DECISION-grade, business-model.**
- **Acquisition channels: Google Reserve / Instagram / Facebook "Book Now" booking links** — owner-side distribution beyond the marketplace listing. Cross-cuts marketing + SEO + partnerships.
- **In-person card-present hardware (Tap-to-Pay / readers) + TWINT** — a Swiss-specific payments track (StyleSeat uses Klarna BNPL; Solen would want TWINT). Hardware logistics + Stripe Terminal, not a screen.
- **Concierge migration as a sales/ops motion** — StyleSeat/Jane/DaySmart use human-assisted book migration to win salons off incumbents. This is a go-to-market play (ops team + import tooling), partly dashboard (import endpoints), partly sales.
- **Help-center "academy" / structured setup lessons** — Fresha, Mindbody, Jane, Setmore pair onboarding with lesson content + optional 1:1 kick-off call. Content + support, not a dashboard build.
- **Pricing-tier model** — every competitor gates advanced reporting/marketing/AI behind paid tiers (Fresha free+fees, Booksy $29.99, Mindbody $99-699). If Solen adds memberships/marketing/reporting, the monetization wrapper is a product/pricing decision.

---

## Proposed phased plan

Phases are ordered impact-vs-effort. Phase 2 is mostly bug-fixes that unblock a working funnel (highest ROI). Security fixes are pulled forward inside P2 because they're cheap and currently exploitable.

### P2 — Onboarding fix + critical correctness (highest ROI, mostly S)
**Goal:** make the create→complete→go-live funnel actually work and stop silent data corruption + security leaks. **Effort: S–M overall.**
- Wire `GoLiveStep.handleGoLive` (`GoLiveStep.tsx:28`) to `POST /api/salon/go-live`; surface its 400s (needs Stripe / cover photo); gate the button on the GET `can_go_live`. **(S)**
- Unify the readiness contract so `setup-progress` (`:79`), `go-live` (`:27`), and `GoLiveStep` (`:26`) consume one requirement list. **(S)**
- Fix the auto-apply day-key bug: short keys `{mon,tue,...}` in `staff/schedule/auto-apply/route.ts:46` so staff inherit real hours. **(S)**
- Replace phantom `bookings.total_price` with `paid_amount`/`price_paid` in `dashboard/today/route.ts:76/85/130`; add a column-exists test. **(S)**
- Add ownership guards to client-notes GET (`clients/[id]/notes/route.ts`) and staff GET (`staff/route.ts`); stop returning `commission_rate`/`permissions` unguarded. **(S — security, pull forward)**
- Replace hardcoded 3-city select (`OnboardingFlow.tsx:135`) with the live cities table; geocode lat/lng from chosen city instead of defaulting to Basel (`salons/route.ts:650`). **(M)**
- Stop dropping collected data: either persist `google_place_id`/`cancellation_policy` or remove them from `createSalonSchema` + wizard. **(S)**
- Add resume hand-off: `/dashboard?onboarded=1` strongly CTAs into `/dashboard/setup`; make `SetupBanner` the durable checklist. **(S)**
- **DECISION:** Collapse the two onboarding wizards into one canonical flow (thin `/onboarding/salon` create → `/dashboard/setup` complete+go-live), removing duplicated profile/services/photos and the second upload bucket. Big structural change — owner must approve the shape before building.

### P3 — Dashboard-core: nav, category-home, money truth (high ROI, S–M)
**Goal:** every owner can reach their built tools; numbers agree across screens. **Effort: M.**
- Wire `getCategoryNavGroups()` into the rendered rail + drawer so nails/spa/coiffeur owners reach nail-admin/spa-admin/coiffeur-crm (~10-line fix; registry exists). **(S)**
- Delete dead nav config (`OWNER_NAV_GROUPS`, `filteredOwnerNavGroups`, unused `categoryNavGroups`) and fix `STAFF_NAV` dead 404 links. **(S)**
- Change marketing default tab off killed gift cards (`marketing/page.tsx:18`) → promos; remove the gift-card tab. **(S)**
- Add orphan routes (earnings, loyalty, verification, reviews, gallery) to the rail or a "Mehr" overflow; earnings especially is a core payout surface. **(S)**
- Build category-aware home: branch `dashboard/page.tsx` on `salonCategories` to a category hero (barbershop→live queue, nails→infill-due, spa→room occupancy) using existing child components. **(M)**
- Fix the money ledger: write `salon_payouts.status:'paid'` on Stripe `payout.paid`, or treat `'recorded'` as realized in `earnings/route.ts:33`. **(S)**
- Consolidate the three revenue computations onto one canonical source (`paid_amount`/`net_amount` Rappen); read `tier_discount_amount` so post-loyalty numbers stop over-reporting. **(M)**
- Pass a real `salonId` into `NotificationCenter` (currently `undefined`). **(S)**

### P4 — Client / CRM depth (high differentiation, M–L)
**Goal:** turn thin booking records into a real owner-owned client file. **Effort: M–L.**
- Build the persistent client card: history + notes + tags + spend + no-show count + LTV, surfaced on one profile. **(M)**
- Create `client_rfm_segments` (table + recompute cron/RPC) or compute RFM inline; stop the silent degrade in `clients/route.ts`. **(M)**
- Add beauty-specific fields: stored color formulas / treatment notes / contraindications on the client card. **(M)**
- Custom intake / consent / patch-test forms attached to bookings, auto-sent on booking, saved to the client record. **(L)**
- First-class `POST /api/staff` (create team member) decoupled from salon-create/invite. **(S)**
- Validate `opening_hours` against the short-day-keyed schema in the salons PATCH allowlist; tighten `setup-progress` hours-completeness. **(S)**

### P5 — Money / payouts / no-show protection (highest competitor-parity value, L)
**Goal:** match the #1 owner feature every competitor has. **Effort: L.**
- Card-on-file capture via Stripe SetupIntents wired to a per-salon/per-service cancellation policy. **(L)** **DECISION:** confirm the Swiss payment model (3DS/SCA pre-auth, TWINT handling).
- Per-service deposits (fixed or %), all-services vs per-service vs new-clients-only; wire the existing `deposit_min/max`/`no_show_deposit_amount` columns into `booking-pay-intent`. **(M)**
- Late-cancel/no-show fee engine: penalty-free window + auto policy text in confirmations + auto fee capture; save failed charges as a draft (Fresha pattern). **(M)**
- Build the recurring cron (read `recurring_booking_rules` where active + `next_booking_date<=today`, book next slot, advance date) or hide the UI. **(M)**
- Owner-facing reporting: no-show rate, retention/rebook rate, staff performance, new-vs-returning mix, revenue net of fees. **(M)**
- Paginate/date-window `salon/earnings` (currently unbounded `select('*')`); surface next-payout-date from the Connect account. **(S)**

### P6 — Marketing / retention engine (revenue growth, L)
**Goal:** owner-owned demand + retention, not just system notifications. **Effort: L.**
- Owner-configurable lifecycle campaigns (birthday, win-back lapsed, rebook nudge) on top of existing crons. **(M)**
- Email + SMS message blasts with client-tag segmentation. **(L)**
- Off-peak / last-minute gap-fill discounting (owner sets % + time window) on top of the deals plumbing. **(M)**
- AI-assisted campaign copy + social post builder (reuse the existing Gemini integration). **(M)**
- Automated review-request surfaced as an owner setting (rails exist via `review-prompt` cron). **(S)**
- Replace the fabricated "3x more bookings" claim (`salon-onboarding.ts:66`) with neutral copy. **(S)**
- **DECISION:** memberships / recurring packages — adopt or stay out? Recurring revenue primitive every competitor has, but Solen killed gift cards and treats loyalty as a rank. Owner call on scope + monetization tier.

### P7 — Design consistency + legacy migration (debt paydown, M)
**Goal:** intentional styling, no dead tokens, enforced drift. **Effort: M.**
- Migrate the dashboard off `components-legacy/dashboard/*` onto `DashboardUI` registry primitives, removing 182 dead-aliased `s-coral` refs. **(M)**
- Reconcile rail active-state to locked `bg-s-bg-sunken` + `text-s-ink` (or document the dashboard exemption in LOCKFILE). **(S)**
- Re-skin `TodayLiveCard`/`DashboardHeaderStrip`/`HeadDiagram` off the dead green→orange gradient + undefined `s-coral-text`/`var(--coral)`, with a screenshot check. **(S)**
- Sweep the 13 silent catch blocks to `console.error('[Component] …', err)` + user-visible toast on payment/cancellation paths. **(S)**
- Lock the calendar service-color palette (W3 in §12.2, currently "to be locked"). **(S)**
- Reconcile stale docs: rewrite the `roadmap-dashboard-v3` / `R-CD*` headers off "Zone 4 / coral / Syne" onto locked §12; create or repoint the phantom `DASHBOARD_REBUILD_DECISIONS.md`. **(M)** **DECISION:** kill "Aurora Azure #4A8BE9" (use shipped `#276EF1`) or formally adopt it as a token — stop the three-blue ambiguity.
- Backfill i18n drift (en -11, fr -18, it -29) and add cleaned dashboard routes to `_rebuilt_routes.json` strict globs so drift is enforced going forward. **(M)**

**Sequencing note:** P5 (no-show/deposits) is the single highest competitor-parity win but depends on P2's payment/go-live fixes landing first. P4 (CRM) and P5 both depend on the P2 security guards. P7 can run in parallel with any phase since it's isolated styling/debt.
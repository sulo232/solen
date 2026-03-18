# Session 1 Prompt — Foundation (Phases 1, 2, 4, 11)

## Who You Are
You are Claude Code, Session 1 of 3. You build the FOUNDATION that Sessions 2 and 3 depend on.
- **Session 1 (YOU):** Treatment search, category tree, salon profile upgrades, SEO pages, legal pages, cookie banner
- **Session 2 (AFTER YOU):** Booking engine, promo codes, referrals, deposits, platform commission
- **Session 3 (AFTER SESSION 2):** Reviews, SMS, i18n, multi-location, dashboard, PWA, polish

Session 2 depends on your work. If you break the build, Sessions 2+3 can't start.

## Pre-Flight (DO THIS FIRST)
1. Read `CLAUDE.md` fully — especially Sections 3 (design system), 5 (rules), 6 (schema), 10, 12, 13
2. Read `UI_RULES.md` fully
3. Read `_tasks/roadmap-treatwell-v5.md` — ONLY Phases 1, 2, 4, 11
4. `git log --oneline -5` — see the latest state
5. `npm run build` — MUST pass before you start. If it fails, fix first.
6. Note the current commit hash — this is the ROLLBACK POINT

## 🚨 CRITICAL SAFETY RULES

1. NEVER rebuild, replace, or restructure existing components.
   Only ADD new props, sections, or child components to existing files.

2. NEVER delete existing files or existing code within files.
   Only MODIFY by adding or editing — never removing.

3. NEVER change the design system (colors, fonts, radii from CLAUDE.md Section 3.3).
   Use existing Tailwind classes from tailwind.config.js + CSS variables.

4. BEFORE EVERY git push:
   - `npm run build` → MUST pass
   - `npx tsc --noEmit` → ZERO errors
   - `git diff --stat` → review changed files, no surprise files
   
5. AFTER EVERY git push:
   - Wait 60s for Vercel deploy
   - `curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/` → 200 or 307
   - If FAIL → `git revert HEAD && git push` → fix → retry

6. ONE COMMIT PER SUB-PHASE (e.g., "v5-phase1.1: service_categories migration").
   Not one giant commit for the whole session.

7. If npm run build FAILS and you can't fix it in 3 attempts:
   - `git stash`
   - Note what failed in `_tasks/INCOMPLETE_FEATURES.md`
   - Move to next phase
   - DO NOT keep pushing broken code

8. ABSOLUTELY DO NOT:
   - Delete or overwrite HomePage.tsx, Header.tsx, BottomNav.tsx
   - Create a "new" version of any existing page
   - Change the color scheme, fonts, or design tokens
   - Remove any existing feature, component, route, or API
   - Touch files from `_archive/`
   - Modify `CLAUDE.md` or `UI_RULES.md`
   - Modify migrations that are already applied (001-043)

---

## Phase 1: Treatment-Level Search & Category Tree

### ⚠️ RISK: HIGH
This creates new DB tables + new page routes + modifies core search. Most likely phase to break things.

### ✅ WHAT WE WANT
- Users can search "Balayage" and see a page listing only salons offering Balayage with THAT specific price
- 3-level category tree: e.g., Coiffeur > Damen > Balayage
- FilterBar gets rating dropdown, sort dropdown (cheapest/best rated/nearest)
- SalonCards show "ab CHF X" (cheapest service price) on every card
- On hover (desktop) / tap-expand (mobile), SalonCard shows top 2 services with prices
- A QuickPreviewSheet bottom sheet (mobile) / side panel (desktop) lets users peek at salon info without navigating away
- Waitlist: if a date is fully booked, user can sign up to be notified

### ❌ WHAT WE DON'T WANT
- Don't replace the existing SalonCard layout — only ADD new elements
- Don't break existing category pages (`/coiffeur`, `/barbershop` etc.) — they should still work
- Don't make the search query so heavy it's slow (paginate, use indexes)
- Don't hardcode categories — they come from the DB
- Don't duplicate the existing search results page — treatment results should be a NEW route `/behandlungen/[...slug]`
- The QuickPreviewSheet must NOT prevent full-page navigation. Both paths must work.

### 🔧 BE CAREFUL
- `service_categories` seed data must match existing `services.category` values in the DB. Check what categories already exist in `services` table before seeding
- The `FilterBar.tsx` is used on multiple pages — changes must not break category pages
- `SalonCard.tsx` is the most-used component on the site. Additions must be backward-compatible (new props optional, not required)
- `QuickPreviewSheet` needs gesture handling (swipe down to close on mobile). Use a well-tested pattern.

### Steps
1.1. Create migration 044: `service_categories` table with 3-level tree + seed data (~80 rows)
1.2. Create migration 045: `booking_waitlist` table
1.3. Create `app/api/categories/route.ts` — GET returns full category tree (cached 5min)
1.4. Create `app/api/search/treatments/route.ts` — GET `?treatment=balayage&city=basel` → salons with that service + price
1.5. Modify `app/api/salons/search/route.ts`:
   - ADD `?min_rating=4.5` filter
   - ADD `?category_slug=damen-balayage` filter
   - ADD `?sort=price_asc|rating_desc|distance` param
   - RETURN `min_price` (cheapest service) in each salon result
   - ⚠️ Do NOT change the existing response shape — only ADD new fields
1.6. Create `components/ui/CategoryTree.tsx` — desktop: sticky sidebar, mobile: horizontal chips
1.7. Create `components/ui/QuickPreviewSheet.tsx` — bottom sheet (mobile), side panel (desktop)
1.8. Create `app/[locale]/behandlungen/[...slug]/page.tsx` — treatment results page with filters + salon list
1.9. Modify `components/SalonCard.tsx`:
   - ADD optional `minPrice` prop → shows "ab CHF X" badge
   - ADD optional `featuredServices` prop → shows on hover/expand
   - ADD optional `onQuickPreview` callback → opens sheet
   - ⚠️ ALL new props must be OPTIONAL. Existing usage without these props must not break.
1.10. Modify `components/FilterBar.tsx`:
   - ADD rating dropdown
   - ADD sort dropdown
   - ADD "Nebenzeiten" chip
   - ⚠️ Don't remove existing filters — only add new ones
1.11. Create `app/api/bookings/waitlist/route.ts` — POST subscribe, GET list, DELETE remove

→ `git add . && git commit -m "v5-phase1: treatment search + category tree" && git push`
→ Build + deploy check

---

## Phase 2: Salon Profile Premium

### ⚠️ RISK: MEDIUM
Modifies the salon detail page heavily. Risk of breaking the booking flow entry point.

### ✅ WHAT WE WANT
- "✓ Verifiziert" badge on reviews that have a `booking_id`
- Star breakdown chart: 5★: 87%, 4★: 10%, etc.
- Sort reviews: newest / highest / lowest
- Structured "Saloninfo" section: Atmosphäre, Expertise, Produkte, ÖV-Anbindung
- Opening hours: visible on desktop, collapsed on mobile with "Heute: 09:00-18:00" preview
- "Ähnliche Salons in der Nähe" section at bottom (3-4 same-category salons with distance)
- Per-service "Buchen" button AND multi-service checkbox cart (both modes)
- StickyMobileCTA wired to this page
- Review count → smooth scroll to reviews

### ❌ WHAT WE DON'T WANT
- Don't remove existing salon page sections (hero image, name, rating, description)
- Don't break the existing booking flow — per-service "Buchen" must PRE-SELECT that service in BookingCalendar, not replace the calendar
- Don't make the page too long — use tabs (desktop) or accordions (mobile) to organize
- Don't fetch all nearby salons on initial page load — lazy load that section

### 🔧 BE CAREFUL
- The salon detail page (`app/[locale]/salon/[slug]/page.tsx`) is the most complex page. Read it FULLY before editing
- Phase 1 already modified SalonCard — your NearbySalons component should use those updated props
- The PostGIS distance query needs `latitude`, `longitude` on salons table — verify these columns exist
- `StickyMobileCTA.tsx` already exists — just add it to the salon page layout, don't rebuild it

### Steps
2.1. Create migration 046: ADD atmosphere, expertise, products, nearest_transport TEXT columns to salons
2.2. Create `components/ReviewBreakdown.tsx` — horizontal bar chart (no external chart library, pure CSS/Tailwind)
2.3. Create `components/NearbySalons.tsx` — 3-4 SalonCards from PostGIS distance query
2.4. Create `app/api/salons/[slug]/nearby/route.ts` — GET returns 4 nearby same-category salons
2.5. Modify `app/api/reviews/salon/[salon_id]/route.ts`:
   - ADD `?sort=newest|highest|lowest` param
   - ADD `is_verified` computed field (true if booking_id is not null)
2.6. Modify `app/[locale]/salon/[slug]/page.tsx` — add all new sections. Read the ENTIRE file first.
   - ⚠️ This file is 500+ lines. Make SMALL, TARGETED edits. Do NOT rewrite the whole file.

→ `git add . && git commit -m "v5-phase2: salon profile premium" && git push`
→ Build + deploy check

---

## Phase 4: SEO & Discovery Pages

### ⚠️ RISK: LOW
New pages that don't touch existing ones. Main risk is dynamic route conflicts.

### ✅ WHAT WE WANT
- `/[locale]/[category]/[city]` city pages: "Coiffeur Basel", "Nails Zürich"
- Auto-generated from DB — if a salon registers in Winterthur, the page auto-exists
- Empty cities show "Noch keine Salons — sei der Erste!" + partner registration CTA
- Dynamic sitemap with ALL salon pages, category pages, treatment pages
- OG meta tags on every salon page (title, description, image → rich WhatsApp/social sharing)
- JSON-LD LocalBusiness structured data on salon pages (Google rich results)
- Complete footer with all navigation links
- Placeholder legal pages: Impressum, AGB, Datenschutz (user fills real text later)
- Simple partner landing page: 3 selling points + register CTA

### ❌ WHAT WE DON'T WANT
- Don't create route conflicts with existing pages — `/coiffeur` is a category page, not a city page. The city route is `/coiffeur/basel`
- Don't add real legal text — use clear placeholder: "[PLATZHALTER — Bitte echten Text einsetzen]"
- Don't use external SEO libraries — Next.js built-in `generateMetadata` is enough
- OG images must be ABSOLUTE URLs (https://...), not relative paths

### 🔧 BE CAREFUL
- Dynamic route `[category]/[city]` could conflict with `salon/[slug]`. Test that both work.
- The Footer.tsx is a shared layout component — changes show everywhere. Test on 3+ pages after modifying.
- `generateMetadata` on salon page must handle missing data gracefully (no salon photo → use default OG image)

### Steps
4.1. Create `app/api/cities/route.ts` — GET: all cities with ≥1 active salon
4.2. Create `app/[locale]/[category]/[city]/page.tsx` with `generateStaticParams` (or fallback dynamic)
4.3. Create `app/[locale]/impressum/page.tsx` — template with placeholder markers
4.4. Create `app/[locale]/agb/page.tsx` — template with placeholder markers
4.5. Create `app/[locale]/datenschutz/page.tsx` — template with placeholder markers
4.6. Create `app/[locale]/partner/page.tsx` — 3 benefits + register CTA button
4.7. Modify sitemap route — add dynamic salon + category + city + treatment URLs
4.8. Modify `app/[locale]/salon/[slug]/page.tsx` `generateMetadata`:
   - ADD OG title, description, image
   - ADD JSON-LD `LocalBusiness` schema (or `BeautySalon`/`HairSalon`)
4.9. Modify `components/layout/Footer.tsx`:
   - ADD Kunden links (Hilfe, Impressum, AGB, Datenschutz)
   - ADD Salon links (Partner werden)
   - ADD Newsletter email input field
   - ADD Payment method icons
   - ⚠️ Don't remove existing footer content — only ADD sections

→ `git add . && git commit -m "v5-phase4: seo + discovery pages" && git push`
→ Build + deploy check

---

## Phase 11: Legal & Trust

### ⚠️ RISK: LOW
New standalone components. Almost no modification of existing files.

### ✅ WHAT WE WANT
- Cookie consent banner at bottom of page: "Accept" / "Reject" / "Einstellungen"
- Settings modal: Necessary ✅ (locked) / Analytics / Marketing toggle
- Consent stored in localStorage AND sent to PostHog (if accepted)
- Custom 404 page: fun illustration feel + search bar + recommended salons
- Custom 500 page: professional "Etwas ist schiefgelaufen" + "Zur Startseite" button
- Newsletter subscribe API (store email)

### ❌ WHAT WE DON'T WANT
- Don't block the UI with cookie banner on every page load — show once, remember choice
- Don't make the 404 page look broken — it should feel intentional and helpful
- Don't use heavy animation libraries for cookie banner — keep it simple CSS transitions
- The 500 error page must be a SERVER component (no client hooks) — it renders when things are BROKEN

### 🔧 BE CAREFUL
- `CookieBanner` must be added to the ROOT LAYOUT (`app/layout.tsx`). Read the layout first.
- `app/not-found.tsx` is Next.js convention — it MUST be at the app root level
- `app/error.tsx` MUST have `'use client'` directive (Next.js requirement)
- PostHog integration: check if `PostHogProvider` already wraps the app. Send consent event there.

### Steps
11.1. Create `components/ui/CookieBanner.tsx` — banner + settings modal
11.2. Create `app/not-found.tsx` — fun 404 with search + recommendations
11.3. Create `app/error.tsx` — professional 500 page
11.4. Create `app/api/newsletter/route.ts` — POST email subscribe
11.5. Add CookieBanner to root layout
   - ⚠️ Read `app/layout.tsx` fully before modifying. Don't break existing providers.

→ `git add . && git commit -m "v5-phase11: legal + trust" && git push`
→ Build + deploy check

---

## Post-Session 1 Verification
```bash
npm run build && npx tsc --noEmit
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/coiffeur
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/impressum
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/agb
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/partner
```

You are DONE after Phase 11. Do NOT start any other phases. Session 2 handles Phases 3, 5, 9, 14.

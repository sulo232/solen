> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

# Session 3 Prompt — Polish + Growth (Phases 6, 7, 8, 10, 12, 13, 15)

## Who You Are
You are Claude Code, Session 3 of 3 (the FINAL session). You add polish, growth features, and i18n.
- **Session 1 (DONE):** Built treatment search, category tree, salon profiles, SEO pages, legal, cookie banner
- **Session 2 (DONE):** Built booking upgrades, promo codes, referrals, deposits, commission system
- **Session 3 (YOU):** Reviews, SMS reminders, i18n (4 languages), multi-location chains, dashboard enhancements, PWA, accessibility

Your work is mostly ADDITIVE. If anything from Sessions 1-2 is broken, note it in `_tasks/INCOMPLETE_FEATURES.md` and work around it.

## What Sessions 1+2 Already Built — DO NOT BREAK
Session 1 files (DO NOT MODIFY):
- `components/ui/QuickPreviewSheet.tsx`, `CategoryTree.tsx`, `CookieBanner.tsx`
- `components/ReviewBreakdown.tsx`, `NearbySalons.tsx`
- `app/[locale]/behandlungen/`, `/[category]/[city]/`, `/impressum/`, `/agb/`, `/datenschutz/`, `/partner/`
- `app/not-found.tsx`, `app/error.tsx`
- Modified: `SalonCard.tsx`, `FilterBar.tsx`, `Footer.tsx`, salon detail page
- Migrations 044-046

Session 2 files (DO NOT MODIFY):
- `components/WaitlistModal.tsx`
- `components/dashboard/PromoManager.tsx`
- `app/[locale]/profile/referral/page.tsx`
- `app/api/promo/`, `app/api/referral/`, `app/api/cron/late-cancel/`
- Modified: `BookingCalendar.tsx`, checkout flow, Stripe webhook, availability API, dashboard settings, revenue page
- Migrations 047-050, 055

## Pre-Flight (DO THIS FIRST)
1. Read `CLAUDE.md` fully — Sections 3, 5, 6, 10, 12, 13
2. Read `UI_RULES.md` fully
3. Read `_tasks/roadmap-treatwell-v5.md` — ONLY Phases 6, 7, 8, 10, 12, 13, 15
4. `git log --oneline -25` — verify Session 1+2 commits exist
5. `npm run build` — MUST pass before you start
6. Check `_tasks/INCOMPLETE_FEATURES.md` — note blockers from previous sessions
7. Note the current commit hash — ROLLBACK POINT

## 🚨 CRITICAL SAFETY RULES

1. NEVER rebuild, replace, or restructure existing components. Only ADD.
2. NEVER delete existing files or code. Only MODIFY or create NEW.
3. NEVER change the design system (colors, fonts, radii).
4. BEFORE EVERY git push: `npm run build` + `npx tsc --noEmit` + `git diff --stat`
5. AFTER EVERY git push: wait 60s, curl https://www.solen.ch/de/ → 200/307
6. ONE COMMIT PER SUB-PHASE.
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES, move on.
8. ABSOLUTELY DO NOT: delete/overwrite homepage, header, bottom nav, modify CLAUDE.md, touch _archive/, modify applied migrations (001-055)

---

## Phase 6: Review System + Recently Viewed

### ⚠️ RISK: LOW
New table + new component. Almost no modification of existing code.

### ✅ WHAT WE WANT
- Customers can upload photos with reviews (before/after, result photos)
- Photos stored in Supabase Storage `review-photos` bucket
- Photos displayed in review cards as thumbnail gallery (click to enlarge)
- "Zuletzt angesehen" horizontal scroll section: last 5 viewed salons from localStorage
- Shows on HomePage for returning users AND on ProfilePage

### ❌ WHAT WE DON'T WANT
- Don't allow non-image files (validate MIME type: image/jpeg, image/png, image/webp only)
- Don't store full-resolution photos — resize to max 1200px wide server-side or client-side
- Don't show "Zuletzt angesehen" for first-time visitors (empty localStorage = don't render section)
- Don't modify the existing review form layout — ADD photo upload below the text area

### 🔧 BE CAREFUL
- Supabase Storage: the bucket `review-photos` may need to be created manually first. Check if it exists. If not, add a note in INCOMPLETE_FEATURES.
- RLS on `review_photos`: only the review author can insert, public can read
- The review form is inside the salon detail page — locate it before modifying
- `localStorage` is client-only. Use `useEffect` + `useState` to avoid SSR hydration mismatch

### Steps
6.1. Create migration 051: `review_photos` table
6.2. Modify review form — add photo upload (max 3 photos) below text area
6.3. Modify review display — show photo thumbnails in review cards
6.4. Create `components/RecentlyViewed.tsx` — horizontal scroll, localStorage-backed
6.5. Add RecentlyViewed to `HomePage.tsx` (conditionally: only if localStorage has data)
6.6. Add RecentlyViewed to `ProfilePage.tsx`

→ Commit + push + verify

---

## Phase 7: SMS Reminders + Onboarding Emails

### ⚠️ RISK: MEDIUM
External service dependency (seven.io). Cron jobs need Vercel config.

### ✅ WHAT WE WANT
- SMS 24h before booking + 1h before booking via seven.io API
- Salon configures which reminders in dashboard settings (checkboxes)
- Review prompt email: 24h after completed appointment, simple "Wie war dein Besuch?" with star link
- Salon onboarding drip emails (auto-adapt): Welcome → Profile → Services → Photo → Ready
  - Each email triggers only when previous action is completed
- Cron jobs added to `vercel.json`

### ❌ WHAT WE DON'T WANT
- Don't send SMS if `SEVEN_IO_API_KEY` is not set — just log a warning and skip
- Don't send review prompt if booking was cancelled
- Don't send onboarding email if salon already completed that step
- Don't send duplicate SMS (track sent status per booking)
- Don't send more than 1 review prompt per booking

### 🔧 BE CAREFUL
- seven.io API: POST to `https://gateway.seven.io/api/sms` with `Authorization: Bearer API_KEY`
- SMS costs ~CHF 0.07 each. Track total sent per month.
- Vercel Hobby plan: only 1 cron job allowed. If user has Hobby, merge all crons into ONE handler that checks multiple tasks
- The Resend email templates should use HTML (not plain text) — match Solen branding (teal, DM Sans)
- `vercel.json` may already have settings — DON'T overwrite it, ADD the crons section

### Steps
7.1. Create migration 052: `ALTER salons ADD sms_reminder_24h BOOLEAN DEFAULT true, sms_reminder_1h BOOLEAN DEFAULT true`
7.2. Create `app/api/cron/reminders/route.ts`:
   - Query bookings in next 24h → send SMS (if not already sent)
   - Query bookings in next 1h → send 2nd SMS
   - Add `sms_sent_24h`, `sms_sent_1h` boolean flags on bookings (migration needed? or use a `sms_log` table)
7.3. Create `app/api/cron/review-prompt/route.ts`:
   - Query bookings completed 24h ago → send email via Resend
   - Skip if already sent or booking was cancelled
7.4. Modify dashboard settings — add SMS reminder checkboxes
7.5. Build onboarding email sequence (Resend templates):
   - Check salon profile completion % to determine next email
7.6. Update `vercel.json` — add cron configs
   - ⚠️ READ existing vercel.json FIRST. Don't overwrite existing config.

→ Commit + push + verify

---

## Phase 8: Internationalization (4 Languages)

### ⚠️ RISK: MEDIUM
Tedious and error-prone. Missing translation keys cause crashes.

### ✅ WHAT WE WANT
- LanguageSwitcher dropdown in Header: 🇩🇪 DE / 🇫🇷 FR / 🇮🇹 IT / 🇬🇧 EN
- All UI labels (buttons, navigation, headings, form labels) use `useTranslations()` from next-intl
- `messages/fr.json` + `messages/it.json` created (copy structure from `de.json`, translate labels)
- For FR/IT: start with UI labels, leave longer content in German for now

### ❌ WHAT WE DON'T WANT
- Don't auto-translate salon-generated content (descriptions, services) — that stays in original language
- Don't break the app by introducing missing keys — if a key is missing, it should FALLBACK to German
- Don't add translations for every single string in one go — focus on NAVIGATION and BUTTONS first
- Don't change the URL structure — `/de/`, `/en/`, `/fr/`, `/it/` should all work

### 🔧 BE CAREFUL
- `next-intl` config: check `middleware.ts` for locale handling. Make sure `fr` and `it` are in the allowed locales list
- The LanguageSwitcher must preserve the current PATH when switching (e.g., `/de/coiffeur` → `/fr/coiffeur`)
- Some components use hardcoded German strings — find them with `grep -rn "Termin\|Buchen\|Bewertung\|Suchen\|Anmelden" components/ --include="*.tsx"` then replace with translation keys
- Test that EVERY page renders in all 4 locales without crashing before pushing
- Check `i18n.ts` or equivalent config file — add new locales there

### Steps
8.1. Create `components/ui/LanguageSwitcher.tsx` — locale dropdown
8.2. Add LanguageSwitcher to `Header.tsx`
   - ⚠️ Header.tsx was modified by Session 1 — read it first
8.3. Add `fr` and `it` to middleware locale config
8.4. Create `messages/fr.json` — translate all keys from `de.json`
8.5. Create `messages/it.json` — translate all keys from `de.json`
8.6. Verify `messages/en.json` has all keys
8.7. Scan components for hardcoded German → replace with `useTranslations()` keys
   - Focus: Header, BottomNav, FilterBar, SalonCard, BookingCalendar, Auth pages
8.8. Test: navigate to `/fr/coiffeur`, `/it/coiffeur`, `/en/coiffeur` — all must render

→ Commit + push + verify

---

## Phase 10: Multi-Location Chains

### ⚠️ RISK: LOW
New tables + new page. Low impact on existing code.

### ✅ WHAT WE WANT
- Salon chains (like "Varibelle") can group locations under one brand
- Brand page `/brand/[slug]`: logo, description, location picker showing all branches
- Each individual salon page shows "Teil von [Brand Name]" with link to brand page
- Search results group chain salons together: "Varibelle — 3 Standorte"

### ❌ WHAT WE DON'T WANT
- Don't make chains a required field — 99% of salons are independent
- Don't merge chain salons into one listing — each location keeps its OWN page, reviews, bookings
- Don't change the salon registration flow — chain grouping is done post-registration in dashboard

### 🔧 BE CAREFUL
- `group_id` on salons is nullable — existing salons are null
- The brand page slug must not conflict with salon slugs. Use `/brand/` prefix path.
- Search grouping: show the highest-rated location as the "primary" card, expandable to show others

### Steps
10.1. Create migration 053: `salon_groups` table + `ALTER salons ADD group_id`
10.2. Create `app/[locale]/brand/[slug]/page.tsx` — brand page with locations
10.3. Modify `SalonCard.tsx` — show "Teil von [Brand]" badge if group_id exists
   - ⚠️ SalonCard was modified by Session 1 — read it fully first, ADD don't replace
10.4. Modify search results to group chain salons (collapsible)

→ Commit + push + verify

---

## Phase 12: Dashboard Enhancements

### ⚠️ RISK: LOW
Additive features to salon dashboard.

### ✅ WHAT WE WANT
- Analytics benchmark: "Deine Bewertung: 4.6 (Top 15% in Basel)"
- "Salon des Monats" — auto-calculate (highest booking growth + rating), admin confirms
- "Neue Salons" section on homepage: 6 most recently activated salons
- Structured info fields in salon dashboard settings (atmosphere, expertise, products, transport)
- "Vorschlag generieren" button — placeholder for AI auto-fill (just the button, says "Kommt bald")

### ❌ WHAT WE DON'T WANT
- Don't call any AI API yet — just add the placeholder button with "Kommt bald" tooltip
- Don't calculate percentiles on every page load — compute daily via cron or on-demand with caching
- Don't show "Salon des Monats" if none exists yet — gracefully hide section

### 🔧 BE CAREFUL
- The salon dashboard settings page was modified by Session 2 (payment mode). Read it before editing.
- The homepage was modified by Phase 6 (RecentlyViewed). Don't overwrite those changes.
- Percentile calculation: `SELECT COUNT(*) FROM salons WHERE average_rating <= YOUR_RATING AND city = YOUR_CITY` / total × 100

### Steps
12.1. Create `app/api/admin/salon-of-month/route.ts` — GET auto-suggest, POST confirm
12.2. Add "Neue Salons" section to HomePage
   - ⚠️ HomePage was already modified in Phase 6. Read it first.
12.3. Add analytics benchmarks to dashboard analytics page
12.4. Add structured info fields (atmosphere, etc.) to dashboard settings
   - ⚠️ Dashboard settings was modified in Sessions 1+2. Read it FULLY.
12.5. Add "Vorschlag generieren" placeholder button

→ Commit + push + verify

---

## Phase 13: PWA + Notifications

### ⚠️ RISK: LOW
New component + migration. Minimal impact on existing code.

### ✅ WHAT WE WANT
- PWA install prompt shows AFTER first successful booking: "Installiere Solen für Erinnerungen"
- Uses `beforeinstallprompt` browser event — custom banner, not native prompt
- Notification preferences expanded: Bookings ✅, Messages ✅, Deals ☐, New Salons ☐
- These are EMAIL notification preferences (no web push — user specified no web push)

### ❌ WHAT WE DON'T WANT
- Do NOT implement web push notifications — user explicitly said email only
- Don't show PWA prompt on first visit — only after first successful booking
- Don't make notification preferences block the booking flow — it's in account settings only

### 🔧 BE CAREFUL
- `beforeinstallprompt` only fires on Android Chrome + desktop Chrome. Safari has different PWA install.
- For iOS: show instructions "Tippe auf Teilen → Zum Home-Bildschirm" instead of native prompt
- Store "has seen install prompt" in localStorage to not show again

### Steps
13.1. Create migration 054: expand `notification_preferences` (messages_enabled, deals_enabled, new_salons_enabled)
13.2. Create `components/ui/PWAInstallPrompt.tsx` — triggered after first booking
13.3. Modify account notification settings — add new preference toggles
   - ⚠️ Account page has tabs. Find the notifications tab before modifying.

→ Commit + push + verify

---

## Phase 15: Polish + Accessibility

### ⚠️ RISK: LOW
Many small changes across many files. Risk is accidentally breaking something in a drive-by edit.

### ✅ WHAT WE WANT
- `aria-label` on all interactive elements (buttons, links, form inputs)
- Visible focus rings: `focus-visible:ring-2 focus-visible:ring-teal-500/50`
- Skeleton loading on all category/search result pages
- SalonCard hover: `group-hover:scale-[1.02] transition-transform duration-200`
- Salon photo lightbox for cover + interior photos (if not already implemented)
- `router.prefetch()` on SalonCard hover for instant navigation
- Payment method icons in Footer (if not done in Phase 4)

### ❌ WHAT WE DON'T WANT
- Don't change the VISUAL design — only add accessibility + polish
- Don't add heavy animation libraries — use CSS transitions and Tailwind classes
- Don't break existing animations or hover effects
- Don't add `aria-label` to decorative elements — only interactive ones

### 🔧 BE CAREFUL
- Many files were modified across Sessions 1-3. Do `git diff --stat HEAD~30` to see all changed files before touching them.
- Focus rings must work in BOTH light and dark mode
- `router.prefetch()` can cause unnecessary API calls — only prefetch visible cards
- These are micro-changes across many files. Commit after EACH group (all aria-labels = 1 commit, all focus rings = 1 commit)

### Steps
15.1. Add `aria-label` to all buttons, links, inputs across all components
15.2. Add focus-visible styles globally (can go in `globals.css` or Tailwind `@layer`)
15.3. Add Skeleton loading to category and treatment pages
15.4. Add hover animation to SalonCard
15.5. Add lightbox to salon cover photos (if not already existing)
15.6. Add router.prefetch on SalonCard hover
15.7. Final footer polish (payment icons if missing)

→ Commit + push + verify

---

## Final Post-Session 3 Verification
```bash
npm run build && npx tsc --noEmit
# Test all routes
for route in / /coiffeur /barbershop /dashboard /account /impressum /agb /datenschutz /partner /last-minute; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.solen.ch/de$route")
  echo "$code /de$route"
done
# Test language routes
for lang in de en fr it; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://www.solen.ch/$lang/")
  echo "$code /$lang/"
done
```

You are the FINAL session. After Phase 15, ALL 15 phases are complete. Push, verify, report what's done and what's in INCOMPLETE_FEATURES.md.

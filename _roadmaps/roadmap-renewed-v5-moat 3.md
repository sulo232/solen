# 🔄 Renewed Roadmap — v5 Remaining Fixes + Moat Features

**Context:** Claude Code completed v5 roadmap. Audit found a few gaps and one bug. This roadmap covers: fixes for v5 gaps → then all 8 moat feature phases.

**READ BEFORE STARTING:**
1. Read `CLAUDE.md` fully — Sections 3, 5, 6
2. Read `UI_RULES.md` fully
3. `git log --oneline -20` to see what's already built
4. `npm install` — node_modules may need clean install
5. `npm run build` — must pass before starting. If Turbopack error occurs: `rm -rf node_modules && npm install`

## 🚨 CRITICAL SAFETY RULES

1. NEVER rebuild or restructure existing components. Only ADD.
2. NEVER delete existing files or code.
3. NEVER change the design system (colors, fonts, radii).
4. BEFORE EVERY git push: `npm run build` + `npx tsc --noEmit`
5. AFTER EVERY git push: wait 60s, curl https://www.solen.ch/de/ → 200/307
6. ONE COMMIT PER PHASE.
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES.md, move on.
8. DO NOT: delete homepage/header/bottom nav, modify CLAUDE.md, touch _archive/, modify applied migrations

---

## 🐛 Phase FIX: v5 Gaps + Build Bug (~2h)

### ⚠️ RISK: MEDIUM

### ✅ WHAT WE WANT
- Fix corrupted node_modules / build errors: `rm -rf node_modules && npm install && npm run build`
- Create missing migration 054: notification preferences expansion (messages_enabled, deals_enabled, new_salons_enabled)
- Wire payment mode UI in dashboard settings: radio buttons for Vorauszahlung / Anzahlung / Zahlung im Salon
- Add Stripe env vars check: if `STRIPE_SECRET_KEY` not in .env.local, show placeholder in checkout + skip payment step
- Add more aria-labels across components (phase 15 only had 13)

### ❌ WHAT WE DON'T WANT
- Don't rebuild existing components
- Don't add real Stripe keys — code handles missing keys gracefully

### Steps
- [ ] FIX.1 Fix build: `rm -rf node_modules && npm install && npm run build`
- [ ] FIX.2 Create migration 054: `ALTER TABLE notification_preferences ADD COLUMN messages_enabled boolean DEFAULT true, deals_enabled boolean DEFAULT false, new_salons_enabled boolean DEFAULT false`
- [ ] FIX.3 Wire payment mode UI in dashboard settings page:
  - Read `salons.payment_mode` (from migration 047)
  - Show radio buttons: "Zahlung im Salon" (default) / "Anzahlung (X%)" / "Vorauszahlung"
  - If "Anzahlung" selected → show deposit % slider (5-100%)
  - Save via PATCH to salon settings API
  - ⚠️ BE CAREFUL: dashboard settings page already exists + was modified. READ IT FULLY first.
- [ ] FIX.4 Modify checkout flow: if `STRIPE_SECRET_KEY` not configured → show "Zahlung im Salon" only, skip Stripe payment form
- [ ] FIX.5 Add aria-labels to: all buttons in Header, BottomNav, FilterBar, SalonCard, BookingCalendar, CookieBanner
- [ ] FIX.6 Add focus-visible rings globally in `globals.css`: `*:focus-visible { outline: 2px solid #38B2AC; outline-offset: 2px; }`
- [ ] FIX.7 SalonCard hover: add `group-hover:scale-[1.02] transition-transform duration-200`

→ Commit: `v5-fix: build fix + payment mode UI + accessibility`

---

## 🏰 MOAT Phase 1: Chat Intelligence (~3h)

### ⚠️ RISK: MEDIUM — Modifies ChatWindow.tsx

### ✅ WHAT WE WANT
- Quick-reply template chips below message input (salon side only)
- AI suggested reply banner above input using Gemini (env var: `GEMINI_API_KEY`)
- Photo-based quoting: "📸 Angebot erstellen" button on customer's photo → price offer linked to photo
- Photo gallery tab in chat header: "💬 Chat | 📸 Fotos"

### ❌ WHAT WE DON'T WANT
- Don't rebuild ChatWindow from scratch — ADD to it
- Don't call Gemini on every keystroke — only on new customer message
- If `GEMINI_API_KEY` not set → skip AI suggestion silently
- Don't make AI suggestions mandatory

### 🔧 BE CAREFUL
- ChatWindow.tsx is complex. Read ENTIRE file before editing.
- Rate limit Gemini: max 1 suggestion per customer message, max 20/day per salon
- Price offers API at `app/api/conversations/[id]/price-offer/route.ts` already exists — only ADD the `inspiration_photo_url` field

### Steps
- [ ] M1.1 Migration 056: `CREATE TABLE chat_templates (id uuid PK, salon_id uuid FK, text text NOT NULL, sort_order int, created_at timestamptz DEFAULT now())`
- [ ] M1.2 Migration 057: `ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS inspiration_photo_url text`
- [ ] M1.3 API: `app/api/chat-templates/route.ts` — GET list, POST create, PUT update, DELETE
- [ ] M1.4 API: `app/api/chat/suggest/route.ts` — POST with message + salon services → Gemini returns reply suggestion
  - Use `@google/generative-ai` package or fetch Gemini REST API directly
  - Prompt: "You are a friendly salon assistant. Reply in German. Brief and professional."
  - If GEMINI_API_KEY not set → return 204 No Content
- [ ] M1.5 Create `components/chat/QuickReplyChips.tsx` — horizontal scrollable teal pills
  - Default templates: "Ja, das machen wir! ✓", "Leider gerade ausgebucht", "Gerne, schick ein Foto", "Preis auf Anfrage"
  - Tap → inserts text into message input (editable before send)
- [ ] M1.6 Create `components/chat/AISuggestion.tsx` — banner above input
  - "Vorgeschlagene Antwort: [text]" with ✓ accept / ✗ dismiss
- [ ] M1.7 Modify ChatWindow: add photo message "Angebot erstellen" button (salon side)
- [ ] M1.8 Create `components/chat/PhotoGallery.tsx` — grid tab in chat
- [ ] M1.9 Add "Chat-Vorlagen" section in dashboard settings

→ Commit: `moat-phase1: chat intelligence`

---

## 🏰 MOAT Phase 2: Client CRM Tags (~2h)

### ⚠️ RISK: LOW

### ✅ WHAT WE WANT
- Quick-tags: "⚠️ Keine Ammoniak", "⚠️ Empfindliche Haut", "⚠️ Latexallergie", "Mag Stille", "Mag Gespräch"
- Red ⚠️ WARNING banner on dashboard booking detail when client has allergy tags
- Small ⚠️ icon next to client name in booking list

### ❌ WHAT WE DON'T WANT
- Don't replace client_notes — tags are ADDITIONAL
- Allergy tags are salon-private, NEVER show to customers

### Steps
- [ ] M2.1 Migration 058: `CREATE TABLE client_tags (id uuid PK, salon_id uuid FK, customer_id uuid FK, tag text NOT NULL, tag_type text CHECK (tag_type IN ('allergy','preference','note')), created_at timestamptz DEFAULT now())`
- [ ] M2.2 API: `app/api/client-tags/route.ts` — CRUD
- [ ] M2.3 Create `components/dashboard/ClientTags.tsx` — colored chips (red=allergy, blue=preference, grey=note) with preset suggestions + custom input
- [ ] M2.4 Modify dashboard booking detail → allergy warning banner: `bg-red-50 dark:bg-red-950 border-l-4 border-red-500`
- [ ] M2.5 Modify dashboard booking list → ⚠️ icon on client rows with allergy tags

→ Commit: `moat-phase2: client crm tags`

---

## 🏰 MOAT Phase 3: Loyalty Stamp UX (~2h)

### ⚠️ RISK: MEDIUM — Modifies SalonCard + ProfilePage

### ✅ WHAT WE WANT
- Animated stamp card with CSS bounce + confetti on reaching reward
- "⭐ 3/5" progress pill on SalonCard (logged-in users only)
- "Stempelkarten" section on profile page
- Info box for salon on booking detail: "Kunde hat 4/5 Stempel"
- Email: "Noch 1 Besuch bis zur Belohnung!" (Resend, respect notification prefs)

### ❌ WHAT WE DON'T WANT
- No external animation libraries — CSS keyframes only
- Don't show stamps to anonymous users

### Steps
- [ ] M3.1 Create `components/loyalty/StampCard.tsx` with CSS `@keyframes stampBounce` animation
- [ ] M3.2 Modify `SalonCard.tsx` — optional `stampProgress` prop → "⭐ 3/5" pill
- [ ] M3.3 Modify profile/account page — "Stempelkarten" section
- [ ] M3.4 Modify dashboard booking detail — stamp info box
- [ ] M3.5 Booking completion → check stamp count → Resend "almost there" email

→ Commit: `moat-phase3: loyalty stamp ux`

---

## 🏰 MOAT Phase 4: Solen Score + Gold Pins (~3h)

### ⚠️ RISK: MEDIUM

### ✅ WHAT WE WANT
- Solen Score 0-100 from 6 factors: rating(30), reviews(15), response time(15), profile(15), bookings(15), activity(10)
- 4 tiers: Gold 80+ (#D4AF37 large pin), Teal 60-79, Grey 40-59, Dark 0-39
- Dashboard: "Dein Solen Score" circular SVG meter + factor breakdown
- Map: gold pins 1.3x larger with "⭐ Top Salon", gold SalonCard border
- Customers see TIER BADGE only, NOT raw score

### Steps
- [ ] M4.1 Migration 059: `ALTER TABLE salons ADD solen_score int DEFAULT 0, solen_tier text DEFAULT 'grey', score_details jsonb DEFAULT '{}'`
- [ ] M4.2 API: `app/api/admin/solen-score/recalculate/route.ts` — nightly cron
- [ ] M4.3 Create `components/dashboard/SolenScoreCard.tsx` — SVG meter + tips
- [ ] M4.4 Modify `MapView.tsx` — tier-based pin colors/sizes
- [ ] M4.5 Modify `SalonCard.tsx` — gold `ring-2 ring-yellow-400/50` + "⭐ Top Salon" badge
- [ ] M4.6 Add cron to `vercel.json`: `{ "path": "/api/admin/solen-score/recalculate", "schedule": "0 3 * * *" }`

→ Commit: `moat-phase4: solen score + gold pins`

---

## 🏰 MOAT Phase 5: Full Map Enhancement (~3h)

### ⚠️ RISK: MEDIUM — Heavy MapView modification

### ✅ WHAT WE WANT
- Mapbox clustering when zoomed out
- Category filter chips on map
- "ab CHF X" price label on pins, color-coded (green/yellow/coral)
- "📍 In diesem Bereich suchen" floating button (debounced 500ms)

### ❌ WHAT WE DON'T WANT
- Don't show 100+ pins unclustered
- Don't remove list view

### Steps
- [ ] M5.1 Enable Mapbox clustering
- [ ] M5.2 Category filter chip bar above map
- [ ] M5.3 Price labels + color coding on pins (gold tier overrides price color)
- [ ] M5.4 "In diesem Bereich suchen" button → viewport bounds search

→ Commit: `moat-phase5: full map enhancement`

---

## 🏰 MOAT Phase 6: Compare + Off-Peak + Verfügbar (~2h)

### Steps
- [ ] M6.1 Modify `CompareDrawer.tsx` → table layout + "🏆 Empfehlung" highlight
- [ ] M6.2 Off-peak countdown timer on salon detail page (real-time, coral color)
- [ ] M6.3 Off-peak email for favorited salons (event-based, max 1/week per salon per user)
- [ ] M6.4 Modify `SalonCard.tsx` → "3 Termine heute frei" green badge

→ Commit: `moat-phase6: compare + off-peak upgrades`

---

## 🏰 MOAT Phase 7: Feature Showcase + "Nur bei Solen" (~2h)

### ✅ WHAT WE WANT
- "✨ Nur bei Solen" tooltip badges on: chat icon, compare button, stamp section, map pins, photo quoting
- `/warum-solen` FULL marketing page with animated feature demos (CSS only, MUST be beautiful)
- Customer tutorial upgrade: 3 skippable steps with "Solen Extras" highlight

### 🔧 BE CAREFUL
- `/warum-solen` is the MARKETING page — full design system, glassmorphism, animations. Don't rush it.

### Steps
- [ ] M7.1 Create `components/ui/SolenExclusiveBadge.tsx` — "✨ Nur bei Solen" tooltip
- [ ] M7.2 Place badges on 5 locations
- [ ] M7.3 Create `app/[locale]/warum-solen/page.tsx` — feature showcase with sections + CTAs
- [ ] M7.4 Modify `TutorialTour.tsx` — 3 steps, per-step skip + skip-all

→ Commit: `moat-phase7: feature showcase`

---

## 🏰 MOAT Phase 8: Upcharge Reasons + Review Badges (~1h)

### Steps
- [ ] M8.1 Add predefined reason dropdown to dispute flow: "Haarlänge", "Zusätzliche Behandlung", "Material", "Zeitüberschreitung", "Sonstiges" + optional free text
- [ ] M8.2 Show "✓ Salon hat geantwortet" green badge on reviews with replies

→ Commit: `moat-phase8: upcharge reasons + review badges`

---

## Execution Summary

| # | Phase | Time | Risk | Key Deliverables |
|---|---|---|---|---|
| FIX | v5 gaps + build bug | 2h | 🟡 | Build fix, migration 054, payment mode UI, accessibility |
| M1 | Chat Intelligence | 3h | 🟡 | Templates, Gemini AI, photo-quoting, gallery |
| M2 | Client CRM Tags | 2h | 🟢 | Allergy warnings, preference chips |
| M3 | Loyalty Stamp UX | 2h | 🟡 | Animated stamps, progress on cards, emails |
| M4 | Solen Score + Gold | 3h | 🟡 | Score algorithm, dashboard meter, gold map pins |
| M5 | Map Enhancement | 3h | 🟡 | Clusters, price labels, area search |
| M6 | Compare + Off-Peak | 2h | 🟢 | Table compare, countdown, "Heute frei" badge |
| M7 | Feature Showcase | 2h | 🟢 | `/warum-solen`, "Nur bei Solen" badges |
| M8 | Upcharge + Reviews | 1h | 🟢 | Structured reasons, reply badges |

**Total: ~20 hours**

## New Migrations

| # | What | Phase |
|---|---|---|
| 054 | `ALTER notification_preferences` expansion | FIX |
| 056 | `chat_templates` | M1 |
| 057 | `ALTER price_offers ADD inspiration_photo_url` | M1 |
| 058 | `client_tags` | M2 |
| 059 | `ALTER salons ADD solen_score, solen_tier, score_details` | M4 |

> ⚠️ **STALE — REFERENCES RETIRED DESIGN SYSTEM** (flagged 2026-05-06)
>
> This file references the previous V5 design tokens (coral hexes, Bebas Neue, locked component patterns, etc.) which are currently **in flux**. **Don't cite values or rules from this file as authoritative.** Read `_tasks/SOLEN_DESIGN.md` for current state, or ask the user. Archived context: `_tasks/completed/rules-locked-design-tokens-2026-05-06.md`.

---

# Moat Session 2 — Solen Score + Map Enhancement + Compare/Off-Peak

## Who You Are
You are Claude Code, Session 2 of 3 for the Solen Moat Features roadmap.
- **Session 1 (RUNNING IN PARALLEL):** Fixes v5 gaps (build, migration 054, payment mode UI). Builds chat intelligence (quick-reply templates, Gemini AI, photo-quoting, gallery tab). Builds client CRM tags (allergy warnings, booking banners).
- **Session 2 (YOU):** Solen Score algorithm + gold map pins, full map enhancement, compare table + off-peak upgrades
- **Session 3 (RUNNING IN PARALLEL):** Loyalty stamp UX, SalonCard ALL new props, feature showcase page, "Nur bei Solen" badges, accessibility

## ⚡ PARALLEL EXECUTION — ALL 3 SESSIONS RUN SIMULTANEOUSLY

### YOUR EXCLUSIVE FILES (ONLY YOU may modify these):
- `components/MapView.tsx` — you add gold pins, clustering, price labels, area search
- `components/CompareDrawer.tsx` — you modify to table layout
- `components/dashboard/SolenScoreCard.tsx` — NEW, you create
- `app/api/admin/solen-score/recalculate/route.ts` — NEW, you create
- `app/[locale]/salon/[slug]/page.tsx` — you add off-peak countdown
- `vercel.json` — you add cron job
- Migration: 059

### DO NOT TOUCH (Session 1 owns these):
- `components/ChatWindow.tsx` — Session 1 adds chat tabs + photo quoting
- `components/chat/*` — Session 1 creates these
- `components/dashboard/ClientTags.tsx` — Session 1 creates this
- `app/[locale]/dashboard/settings/page.tsx` — Session 1 adds payment mode + templates
- `app/[locale]/dashboard/bookings/page.tsx` — Session 1 adds allergy banner
- `app/[locale]/checkout/page.tsx` — Session 1 adds Stripe fallback
- Migrations 054, 056, 057, 058

### DO NOT TOUCH (Session 3 owns these):
- `components/SalonCard.tsx` — Session 3 adds ALL new props (stampProgress, solenTier, availableToday, hover). YOU store `solen_tier` in DB, Session 3 renders it on the card.
- `components/loyalty/StampCard.tsx` — Session 3 creates
- `components/ui/SolenExclusiveBadge.tsx` — Session 3 creates
- `components/TutorialTour.tsx` — Session 3 modifies
- `app/[locale]/warum-solen/page.tsx` — Session 3 creates
- `app/[locale]/profile/page.tsx` — Session 3 modifies
- `app/globals.css` — Session 3 adds focus rings + animations
- `Header.tsx`, `BottomNav.tsx`, `FilterBar.tsx` — Session 3 adds aria-labels

### GIT RULES FOR PARALLEL EXECUTION
1. **Work on branch:** `git checkout -b moat/session2`
2. Commit frequently (after each phase)
3. Do NOT push to `main` directly
4. Do NOT run `git pull` during work
5. When DONE: `git push origin moat/session2`
6. User will merge all 3 branches into main after all sessions finish

## Pre-Flight
1. `git checkout -b moat/session2` — CREATE YOUR BRANCH
2. Read `CLAUDE.md` fully — Sections 3, 5, 6, 10
3. Read `UI_RULES.md` fully
4. `npm run build` — MUST pass before you start
5. Note commit hash: `git rev-parse HEAD`

## 🚨 CRITICAL SAFETY RULES
1. NEVER modify files in DO NOT TOUCH sections above.
2. NEVER rebuild or restructure existing components. Only ADD.
3. NEVER delete files or code.
4. NEVER change the design system.
5. BEFORE EVERY commit: `npm run build` + `npx tsc --noEmit`
6. ONE COMMIT per phase.
7. If build fails 3x → stash, note in INCOMPLETE_FEATURES.md, move on.

---

## Phase M4: Solen Score + Gold Pins (~3h)

### ⚠️ RISK: MEDIUM

### ✅ WHAT WE WANT
- Solen Score 0-100 from 6 factors: rating(30), reviews(15), response time(15), profile(15), bookings(15), activity(10)
- 4 tiers: Gold 80+, Teal 60-79, Grey 40-59, Dark 0-39
- Dashboard: "Dein Solen Score" circular SVG meter + factor breakdown + tips
- Map: gold pins 1.3x larger, #D4AF37, "⭐ Top Salon" label
- **NOTE:** SalonCard gold border is Session 3's job. You just store `solen_tier` in DB.

### ❌ WHAT WE DON'T WANT
- Don't modify SalonCard.tsx (Session 3 owns it)
- Don't show raw score to customers
- Don't compute on every page load — nightly cron
- Don't break existing pin click handlers

### Steps

#### M4.1 — Migration 059
Create `supabase/migrations/059_solen_score.sql`:
```sql
ALTER TABLE salons
  ADD COLUMN IF NOT EXISTS solen_score int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS solen_tier text DEFAULT 'grey'
    CHECK (solen_tier IN ('gold', 'teal', 'grey', 'dark')),
  ADD COLUMN IF NOT EXISTS score_details jsonb DEFAULT '{}';
COMMENT ON COLUMN salons.solen_score IS 'Solen Score 0-100, computed nightly';
CREATE INDEX idx_salons_tier ON salons(solen_tier) WHERE is_active = true;
```

#### M4.2 — Score Recalculation API
Create `app/api/admin/solen-score/recalculate/route.ts`:
- Auth: cron (`CRON_SECRET` header) or admin
- For each active salon compute 6 factors (see scoring algorithm below)
- Update `salons.solen_score`, `solen_tier`, `score_details`
- Batch in chunks of 20

**Scoring algorithm:**
```typescript
const ratingScore = Math.round((salon.average_rating || 0) / 5 * 30); // max 30
const reviewScore = Math.round(Math.min((salon.review_count || 0) / 20, 1) * 15); // max 15
const responseScore = 10; // TODO: implement response time tracking // max 15
const profileFields = ['image_url', 'description', 'phone', 'opening_hours', 'categories'];
const profileScore = Math.round(profileFields.filter(f => salon[f]).length / 5 * 15); // max 15
const bookingScore = totalBookings >= 5 ? Math.round(completedBookings / totalBookings * 15) : 0; // max 15
const activityScore = daysSinceLogin < 7 ? 10 : daysSinceLogin < 30 ? 5 : 0; // max 10
const total = ratingScore + reviewScore + responseScore + profileScore + bookingScore + activityScore;
const tier = total >= 80 ? 'gold' : total >= 60 ? 'teal' : total >= 40 ? 'grey' : 'dark';
```

#### M4.3 — SolenScoreCard Component
Create `components/dashboard/SolenScoreCard.tsx`:
- Circular SVG meter with `stroke-dashoffset` animation
- 6-row factor table with progress bars
- Improvement tip based on lowest factor
- Tier badge preview: "⭐ Top Salon" / "🔵 Verifiziert" etc.
- Dark mode support

#### M4.4 — Gold Map Pins
Open `MapView.tsx` — READ IT FULLY:
- Gold tier: `#D4AF37`, `scale(1.3)`, higher z-index, "⭐ Top Salon" text
- Teal tier: standard (existing)
- Grey tier: slightly transparent
- Dark tier: small grey

#### M4.5 — Cron in vercel.json
ADD to crons array: `{ "path": "/api/admin/solen-score/recalculate", "schedule": "0 3 * * *" }`

→ `git add . && git commit -m "moat-session2-phase1: solen score + gold map pins"`

---

## Phase M5: Full Map Enhancement (~3h)

### ✅ WHAT WE WANT
- Pin clustering (Mapbox `cluster: true`)
- Category filter chips on map
- Price labels on pins: "ab CHF 45"
- Color-coded by price (green/yellow/coral, gold overrides)
- "📍 In diesem Bereich suchen" floating button

### ❌ WHAT WE DON'T WANT
- Don't show 100+ unclustered pins
- Don't remove list view
- Don't break pin click navigation

### Steps

#### M5.1 — Pin Clustering
Refactor to GeoJSON source: `cluster: true, clusterMaxZoom: 14, clusterRadius: 50`
Cluster circles: teal `#38B2AC`, white count, 3 sizes

#### M5.2 — Category Filter Chips
Horizontal chip bar above map: `['Alle', 'Haare', 'Nails', 'Spa', 'Barber', 'Kosmetik', 'Massage', 'Waxing']`
Client-side filter on GeoJSON source data

#### M5.3 — Price Labels
Text layer below marker: "ab CHF {minPrice}"
Color: green `#22C55E` < 50, yellow `#EAB308` 50-100, coral `#FF6B6B` > 100, gold overrides

#### M5.4 — "In diesem Bereich suchen"
Floating button, 500ms debounce after pan. On click: get bounds, fetch salons in bbox, update pins + list.

→ `git add . && git commit -m "moat-session2-phase2: map clustering + price pins + area search"`

---

## Phase M6: Compare Table + Off-Peak (~2h)

### Steps

#### M6.1 — Table Compare View
Modify `CompareDrawer.tsx` → table (columns=salons, rows=metrics)
Rows: Bewertung, Günstigster Service, Öffnungszeiten, Entfernung, Anzahl Bewertungen
"🏆 Empfehlung" ribbon on best-value column

#### M6.2 — Off-Peak Countdown
On `salon/[slug]/page.tsx`: query `off_peak_slots` for today
If in off-peak window → coral countdown timer with `setInterval(1000)`
Hide when timer hits 0

#### M6.3 — Off-Peak Email
When salon updates off-peak → email favorited users (Resend)
Check `deals_enabled`, rate limit 1/salon/user/7days

→ `git add . && git commit -m "moat-session2-phase3: compare table + off-peak"`

---

## Post-Session 2
```bash
npm run build && npx tsc --noEmit
git push origin moat/session2
```

Tell the user: "Session 2 complete. Branch `moat/session2` pushed. Ready to merge."

You are DONE. Do NOT merge to main.

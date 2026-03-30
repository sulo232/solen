# 🏰 Solen Moat Features Roadmap — Competitive Advantages

**Context for AI Assistant (Claude Code / Cursor / etc.):**
You are executing the Solen Moat Features roadmap. These features are Solen's COMPETITIVE ADVANTAGES over Treatwell — things Treatwell cannot easily copy. You MUST follow CLAUDE.md rules, especially Sections 3 (design system), 5 (critical rules), 10 (security), 12 (roadmap standards), and 13 (code review).

**CRITICAL INSTRUCTIONS FOR AI EXECUTION:**
1. **Read `CLAUDE.md` + `UI_RULES.md` BEFORE starting.** Follow the design system exactly. Teal `#38B2AC`, coral `#FF6B6B`, dark `#1A1A2E`. Syne headings, DM Sans body, Space Grotesk numbers.
2. **Never skip ahead.** Complete one phase entirely, run `npm run build` + `npx tsc --noEmit`, commit, push, verify deploy.
3. **Never rebuild existing components.** Only ADD new props, sections, or child components. Never delete existing code.
4. **Dark mode:** Every new component MUST support `dark:` Tailwind classes. Test by toggling dark mode.
5. **If build fails 3 times:** `git stash`, note in `_tasks/INCOMPLETE_FEATURES.md`, move to next phase.

**What Already Exists (DO NOT REBUILD):**
- `components/ChatWindow.tsx` — In-app chat with media upload
- `components/CompareBar.tsx` + `CompareDrawer.tsx` — Compare tool
- `components/MapView.tsx` — Mapbox integration
- `components/TutorialTour.tsx` — Tutorial overlay
- `components/LastMinuteCard.tsx` — Last-minute slot feed
- `components/SalonCard.tsx` — Salon discovery cards (has minPrice, featuredServices, onQuickPreview props from v5)
- `app/api/conversations/[id]/price-offer/route.ts` — Price offers
- `app/api/bookings/[id]/dispute/route.ts` — Dispute flow
- `app/api/client-notes/route.ts` — Client CRM notes
- `app/api/loyalty/route.ts` — Loyalty stamps
- `review_replies` table — Salary replies to reviews

---

## Phase 1: Chat Intelligence (~3h)
**Goal:** Make Solen's chat the #1 reason salons prefer us. Quick-reply templates, AI suggestions, and photo-based quoting.

### ⚠️ RISK: MEDIUM
Modifies `ChatWindow.tsx` — the core communication component.

### ✅ WHAT WE WANT
- Quick-reply template chips below message input (salon side)
- AI-suggested reply banner above message input
- Photo-based quoting: salon taps a customer's photo → creates price offer linked to it
- Photo gallery tab in chat conversation

### ❌ WHAT WE DON'T WANT
- Don't rebuild ChatWindow from scratch — ADD to it
- Don't call AI on every keystroke — only when a new customer message arrives
- Don't make AI suggestions mandatory — salon can ignore them
- Don't slow down chat by adding heavy features — keep it snappy

- [ ] **1.1 Quick-Reply Template System**
  - **What to build:** Horizontal scrollable template chips below the message input on salon side only.
  - **Action:** Create `components/chat/QuickReplyChips.tsx`:
    - Default templates: "Ja, das machen wir! ✓", "Leider gerade ausgebucht", "Gerne, schick mir ein Foto", "Wir bestätigen deinen Termin!", "Preis auf Anfrage — welche Behandlung?"
    - Tap chip → inserts text into message input (editable before sending)
    - Chips are horizontally scrollable, styled with teal pill buttons
  - **Action:** Create dashboard settings section "Chat-Vorlagen" where salon can add/edit/delete/reorder templates.
  - **Action:** Migration: `CREATE TABLE chat_templates (id uuid PK, salon_id uuid FK, text text NOT NULL, sort_order int, created_at timestamptz DEFAULT now())`
  - **Action:** API: `app/api/chat-templates/route.ts` — GET (list), POST (create), PUT (update order), DELETE
  - **Where it appears:** Below message input in `ChatWindow.tsx`, only when current user is salon owner
  - ⚠️ BE CAREFUL: ChatWindow.tsx is complex. Read it FULLY. Only add the chips component as a child below the input. Don't restructure the chat layout.

- [ ] **1.2 AI Suggested Replies**
  - **What to build:** When customer sends a message, show a small banner above the message input: "Vorgeschlagene Antwort: [text]" with ✓ (accept) and ✗ (dismiss) buttons.
  - **Action:** Create `components/chat/AISuggestion.tsx`:
    - Fetch suggestion from API after customer message arrives
    - Show banner with suggested text + accept/dismiss
    - Accept → fills message input
    - Dismiss → hides banner
  - **Action:** API: `app/api/chat/suggest/route.ts` — POST with `{ message, salon_services[] }` → returns suggested reply
    - Use OpenAI/Gemini to generate. If API key not set, don't show banner at all (graceful fallback)
    - Input context: customer message + salon's service list + salon name
    - Prompt: "You are a friendly salon assistant. Reply to the customer's question in German. Keep it brief and professional."
  - ⚠️ BE CAREFUL: AI API calls cost money. Cache suggestions per conversation. Rate limit to 1 suggestion per customer message, max 20/day per salon.

- [ ] **1.3 Photo-Based Quoting**
  - **What to build:** When a customer sends a photo in chat, salon sees a "📸 Angebot für dieses Foto erstellen" button on the photo message.
  - **Action:** Modify photo message rendering in ChatWindow — add "Angebot erstellen" button (salon side only).
  - **Action:** Tapping opens existing price offer form BUT pre-links the photo URL as `inspiration_photo_url`.
  - **Action:** Migration: `ALTER TABLE price_offers ADD COLUMN IF NOT EXISTS inspiration_photo_url text;`
  - **Action:** In the price offer card (chat display), show a small thumbnail of the inspiration photo next to the offer details.
  - **Marketing angle:** "📸 Schick ein Foto, bekomm einen Preis" — this is THE headline.
  - ⚠️ BE CAREFUL: The price offers API already exists at `app/api/conversations/[id]/price-offer/route.ts`. Only ADD the `inspiration_photo_url` field. Don't change existing fields.

- [ ] **1.4 Chat Photo Gallery Tab**
  - **What to build:** In chat header, add a tab bar: "💬 Chat" | "📸 Fotos"
  - **Action:** Create `components/chat/PhotoGallery.tsx`:
    - Grid of all photos shared in the conversation (both sides)
    - Tap → fullscreen lightbox
    - On salon side: "Angebot erstellen" button in lightbox
  - **Action:** Modify ChatWindow — add tab bar at top, conditional render between chat and gallery
  - ⚠️ BE CAREFUL: Don't break existing chat scroll position when switching tabs. Use `display: none` toggle, not unmount/remount.

→ `git add . && git commit -m "moat-phase1: chat intelligence" && git push`
→ Build + deploy check

---

## Phase 2: Client CRM & Safety Tags (~2h)
**Goal:** Salon owners know their clients better than any competitor. Allergy warnings save lives.

### ⚠️ RISK: LOW
New components + DB columns. Minimal modification of existing code.

### ✅ WHAT WE WANT
- Quick-tags on clients: "⚠️ Keine Ammoniak", "⚠️ Empfindliche Haut", "⚠️ Latexallergie", "Mag Stille", "Mag Gespräch"
- ⚠️ WARNING banner on booking detail when client has allergy tags
- Tags visible when salon opens a booking on dashboard
- Small ⚠️ icon next to client name in booking list

### ❌ WHAT WE DON'T WANT
- Don't replace existing client notes — TAGS are additional to freeform notes
- Don't show allergy tags to customers — salon-private data
- Don't make tags required — they're optional quick helpers

- [ ] **2.1 Client Tag System**
  - **Action:** Migration: `CREATE TABLE client_tags (id uuid PK, salon_id uuid FK, customer_id uuid FK, tag text NOT NULL, tag_type text CHECK (tag_type IN ('allergy','preference','note')), created_at timestamptz DEFAULT now()); CREATE INDEX idx_client_tags_lookup ON client_tags(salon_id, customer_id);`
  - **Action:** API: `app/api/client-tags/route.ts` — GET (by salon+customer), POST (add tag), DELETE (remove)
  - **Action:** Create `components/dashboard/ClientTags.tsx`:
    - Chip display with color coding: red = allergy (⚠️), blue = preference, grey = note
    - Predefined suggestions: "Keine Ammoniak", "Empfindliche Haut", "Latexallergie", "Schwanger", "Mag Stille", "Mag Gespräch", "Kommt immer 5min spät"
    - Custom tag input: type your own + pick category (allergy/preference/note)
  - **Where it appears:**
    - Dashboard → client profile → "Tags" section below notes
    - Dashboard → booking detail → header warning banner if any allergy tags
    - Dashboard → booking list → small ⚠️ icon next to name

- [ ] **2.2 Booking Allergy Warning Banner**
  - **Action:** Modify dashboard booking detail page:
    - Query `client_tags` WHERE `tag_type = 'allergy'` for the booking's customer
    - If any exist → show red banner at top: "⚠️ Achtung: Keine Ammoniak, Empfindliche Haut"
    - Banner uses `bg-red-50 dark:bg-red-950 border-l-4 border-red-500` styling
  - ⚠️ BE CAREFUL: This is salon-facing only. NEVER expose allergy tags in customer-facing UI or APIs.

→ `git add . && git commit -m "moat-phase2: client crm + safety tags" && git push`

---

## Phase 3: Loyalty Stamp UX Upgrade (~3h)
**Goal:** Make collecting stamps FEEL amazing. Gamification that drives repeat bookings.

### ⚠️ RISK: MEDIUM
Modifies SalonCard + ProfilePage + salon dashboard booking view.

### ✅ WHAT WE WANT
- Animated stamp card with satisfying CSS animation + confetti burst on stamp
- Progress indicator on SalonCard: "⭐ 3/5 Stempel"
- "Deine Stempelkarten" section on profile page
- Pop-up for salon when viewing booking: "Kunde hat 4/5 — fast geschafft!"
- Email notification: "Noch 1 Besuch bis zu deiner Belohnung bei [Salon]!"

### ❌ WHAT WE DON'T WANT
- Don't add external animation libraries — CSS keyframes + Tailwind animations only
- Don't show stamp progress to users who haven't visited that salon
- Don't auto-stamp — salon confirms stamp on booking completion

- [ ] **3.1 Animated Stamp Card Component**
  - **Action:** Create `components/loyalty/StampCard.tsx`:
    - Visual card with stamp circles (filled/empty)
    - When a new stamp is added: circle fills with bounce animation (CSS `@keyframes stampBounce`)
    - On reaching reward: confetti effect (use canvas-confetti package, ~3KB, or pure CSS)
    - Shows: salon name, reward text, progress "3 von 5", next reward
    - Dark mode support
  - **Action:** Create `components/loyalty/StampAnimation.css` with keyframes

- [ ] **3.2 Stamp Progress on SalonCard**
  - **Action:** Modify `SalonCard.tsx`:
    - ADD optional `stampProgress` prop: `{ current: number, total: number } | null`
    - If not null and `current > 0`: show small pill badge "⭐ 3/5"
    - Pill positioned below rating, teal background
    - Only fetch stamp data for logged-in users (anonymous → no stamps shown)
  - ⚠️ BE CAREFUL: SalonCard was modified by v5 roadmap. Read it FULLY first. Add prop without breaking existing props.

- [ ] **3.3 Profile Stamp Cards Section**
  - **Action:** Modify `ProfilePage.tsx` or `app/[locale]/account/page.tsx`:
    - ADD "Stempelkarten" section/tab showing all active stamp cards
    - Uses StampCard component for each salon
    - If no stamps: show EmptyState "Du hast noch keine Stempel — buche jetzt!"

- [ ] **3.4 Salon Booking Pop-Up**
  - **Action:** Modify dashboard booking detail:
    - Query customer's stamp progress at this salon
    - Show info box: "⭐ Kunde hat 4/5 Stempel — fast geschafft!" or "🎉 Belohnung bereit!"
    - Teal info box styling

- [ ] **3.5 "Almost There" Email Notification**
  - **Action:** In booking completion flow (after salon confirms visit):
    - Check if customer is now at `stamps_needed - 1`
    - If yes → send Resend email: "Noch 1 Besuch bis zu deiner Belohnung bei [Salon]!"
    - Email template: salon photo + stamp progress visual + CTA "Jetzt buchen"
    - Respect `notification_preferences.rebooking_enabled` — don't send if disabled
  - ⚠️ BE CAREFUL: Check if RESEND_API_KEY exists before trying to send. If not set, skip silently.

→ `git add . && git commit -m "moat-phase3: loyalty stamp ux" && git push`

---

## Phase 4: Solen Score™ & Gold Pins (~3h)
**Goal:** Identify and reward top salons visually. Gold map pins = prestige.

### ⚠️ RISK: MEDIUM
Adds scoring logic + modifies MapView and SalonCard.

### ✅ WHAT WE WANT
- Solen Score (0-100) calculated from 6 factors
- 4 tiers: Gold (80+), Teal (60-79), Grey (40-59), Dark Grey (0-39)
- Dashboard: "Dein Solen Score" card with circular progress meter + factor breakdown
- Map: Gold pins are larger (1.3x), gold color, text "⭐ Top Salon"
- SalonCard: Gold border on search results for top salons
- Customer sees TIER BADGE only, NOT the raw number
- Salary sees full breakdown to motivate improvement

### ❌ WHAT WE DON'T WANT
- Don't show the raw score number to customers — only the tier badge
- Don't compute score on every page load — compute daily (cron/on-demand + cache)
- Don't make score gameable — response time and booking completion are hard to fake
- Don't penalize new salons unfairly — new = Grey tier, not "bad"

- [ ] **4.1 Solen Score Migration + API**
  - **Action:** Migration:
    ```sql
    ALTER TABLE salons ADD COLUMN IF NOT EXISTS solen_score int DEFAULT 0;
    ALTER TABLE salons ADD COLUMN IF NOT EXISTS solen_tier text DEFAULT 'grey'
      CHECK (solen_tier IN ('gold','teal','grey','dark'));
    ALTER TABLE salons ADD COLUMN IF NOT EXISTS score_details jsonb DEFAULT '{}';
    ```
  - **Action:** API: `app/api/admin/solen-score/recalculate/route.ts` — POST: recalculate all salons
    - Algorithm:
      - Rating: `(avg_rating / 5) × 30` (max 30)
      - Reviews: `min(review_count / 20, 1) × 15` (max 15)
      - Response time: avg conversation response time → `< 1h = 15, < 4h = 10, < 24h = 5, else 0`
      - Profile: count filled fields (photo, hours, services, description, transport) / 5 × 15
      - Bookings: `(completed_bookings / total_bookings) × 15` (min 5 bookings for this factor)
      - Activity: last login < 7d = 10, < 30d = 5, else 0
    - Store total score + per-factor breakdown in `score_details` JSON
    - Set `solen_tier` based on total
  - **Action:** Add to Vercel cron (nightly): `{ "path": "/api/admin/solen-score/recalculate", "schedule": "0 3 * * *" }`

- [ ] **4.2 Dashboard Score Card**
  - **Action:** Create `components/dashboard/SolenScoreCard.tsx`:
    - Circular progress meter (SVG arc) showing total score
    - Color matches tier: gold, teal, grey
    - Breakdown table: 6 rows showing each factor score / max
    - Tips: "Antwortzeit verbessern? Beantworte Nachrichten innerhalb 1 Stunde!"
    - Tier badge preview: "Du bist: 🟡 Top Salon"
  - **Where it appears:** Dashboard home page, prominent card

- [ ] **4.3 Gold Map Pins**
  - **Action:** Modify `MapView.tsx`:
    - Pass `solen_tier` to each pin
    - Gold tier: larger pin (1.3x scale), gold color (`#D4AF37`), label "⭐ Top Salon"
    - Teal tier: standard teal pin
    - Grey/Dark: standard grey pin, smaller
    - Gold pins render ABOVE other pins (higher z-index)
  - ⚠️ BE CAREFUL: MapView uses Mapbox markers. Check the existing marker creation code. Modify marker size/color per tier. Don't break existing pin click handlers.

- [ ] **4.4 Gold SalonCard Border**
  - **Action:** Modify `SalonCard.tsx`:
    - ADD optional `solenTier` prop
    - If `gold`: add `ring-2 ring-yellow-400/50` border + small "⭐ Top Salon" badge top-right
    - If `teal`: standard (no change)
    - If `grey`/`dark`: slightly reduced opacity `opacity-90`

→ `git add . && git commit -m "moat-phase4: solen score + gold pins" && git push`

---

## Phase 5: Full Map Enhancement (~3h)
**Goal:** Make the map the best salon discovery tool in Switzerland.

### ⚠️ RISK: MEDIUM
Heavy modification of `MapView.tsx`.

### ✅ WHAT WE WANT
- Pin clustering when zoomed out → expand on zoom in
- Category filter chips ON the map: "Haare | Nails | Spa | Barber"
- Price label on every pin: "ab CHF 45"
- Color-coded by price range: green = under CHF 50, yellow = CHF 50-100, red = CHF 100+
- "In diesem Bereich suchen" button (Airbnb-style) when user pans

### ❌ WHAT WE DON'T WANT
- Don't show ALL pins at once — cluster or paginate. 100+ pins = slow
- Don't remove the list view — map is an ALTERNATIVE, not replacement
- Don't make the filter chips redundant with FilterBar — they're map-specific, simpler

- [ ] **5.1 Pin Clustering**
  - **Action:** Use Mapbox's built-in clustering: `map.addSource('salons', { type: 'geojson', data: ..., cluster: true, clusterMaxZoom: 14, clusterRadius: 50 })`
  - **Action:** Style clusters: circle with count number, teal background, expand on click

- [ ] **5.2 Map Category Chips**
  - **Action:** Add horizontal chip bar above the map: "Alle | Haare | Nails | Spa | Barber | Kosmetik"
  - **Action:** Tapping a chip filters pins (client-side filter on the GeoJSON source)
  - **Style:** Pill chips matching FilterBar style, sticky at top of map container

- [ ] **5.3 Price Labels on Pins**
  - **Action:** Each pin shows "ab CHF X" text label below the marker icon
  - **Action:** Color-code: green pin if < CHF 50, yellow if CHF 50-100, coral/red if > CHF 100
  - **Note:** Gold tier overrides price color (gold is always gold regardless of price)

- [ ] **5.4 "In diesem Bereich suchen" Button**
  - **Action:** When user pans or zooms the map, show a floating button: "📍 In diesem Bereich suchen"
  - **Action:** Tapping triggers a new search query with the current map viewport bounds (NE + SW corners)
  - **Action:** Results update the salon list below the map
  - **Where it appears:** Center-bottom of map, floating, teal background, rounded pill
  - ⚠️ BE CAREFUL: Debounce map pan events (wait 500ms after last pan before showing button). Don't fire a query on every pixel move.

→ `git add . && git commit -m "moat-phase5: full map enhancement" && git push`

---

## Phase 6: Compare Tool & Off-Peak Upgrades (~2h)
**Goal:** Table comparison + off-peak urgency create conversion.

- [ ] **6.1 Table Compare View**
  - **Action:** Modify `CompareDrawer.tsx`:
    - Replace card-based layout with table: columns = salons, rows = rating, cheapest service, hours, distance, review count
    - Add "🏆 Empfehlung" highlight on best-value salon (highest `rating / cheapest_price` ratio)
    - Add "Teilen" button → generates shareable comparison URL
  - ⚠️ BE CAREFUL: CompareDrawer already exists. Don't create a duplicate. Modify the existing component.

- [ ] **6.2 Off-Peak Countdown**
  - **Action:** On salon detail page, if salon has active off-peak slots for today:
    - Show countdown timer: "Nebenzeiten-Rabatt endet in 2:30:15"
    - Timer in coral color, counts down in real-time (setInterval)
    - When timer hits 0 → hide discount badge
  - **Where:** Services section header on salon page

- [ ] **6.3 Off-Peak Email Notifications**
  - **Action:** Event-based (not scheduled): when a salon enables or updates off-peak hours:
    - Find users who favorited this salon
    - Send email: "Dein Lieblingssalon [Name] hat Nebenzeiten — [X]% Rabatt!"
    - Respect preferences: only send if `deals_enabled = true`
  - ⚠️ BE CAREFUL: Don't spam. Max 1 off-peak email per salon per user per week.

- [ ] **6.4 "Sofort verfügbar" Badge**
  - **Action:** Modify `SalonCard.tsx`:
    - ADD optional `availableToday` prop: number of available slots today
    - If > 0: show green pill "3 Termine heute frei"
    - Position: top-right of card image area
    - Query: on search results page, pre-fetch today's slot count per salon

→ `git add . && git commit -m "moat-phase6: compare + off-peak" && git push`

---

## Phase 7: Feature Showcase & "Nur bei Solen" Labels (~2h)
**Goal:** Make users KNOW these features are exclusive. Build the "why Solen" page.

### ⚠️ RISK: LOW
New pages and small UI additions. No core logic changes.

- [ ] **7.1 "Nur bei Solen" Tooltips**
  - **Action:** Create `components/ui/SolenExclusiveBadge.tsx`:
    - Small "✨ Nur bei Solen" label, teal gradient background, tiny badge
    - On hover/tap: tooltip explaining the feature: "Chatte direkt mit deinem Salon — nur bei Solen!"
  - **Where to place (5 locations):**
    - Chat icon in salon detail header → "✨ Direkt chatten"
    - Compare button → "✨ Salons vergleichen"
    - Stamp card section → "✨ Stempel sammeln"
    - Price on map pin → "✨ Preise auf der Karte"
    - Photo quoting in chat → "✨ Foto schicken, Preis bekommen"

- [ ] **7.2 `/warum-solen` Feature Showcase Page**
  - **Action:** Create `app/[locale]/warum-solen/page.tsx`:
    - Hero section: "Was Solen anders macht" + animated visual (CSS only, no video)
    - Section 1: "💬 Chatte direkt" — screenshot of chat with price offer, animation showing message flow
    - Section 2: "📸 Foto schicken, Preis bekommen" — animated demo: photo uploads → price offer appears
    - Section 3: "⚖️ Vergleiche Salons" — compare table screenshot with hover animation
    - Section 4: "⭐ Sammle Stempel" — stamp card animation (reuse StampCard component)
    - Section 5: "🗺️ Preise auf der Karte" — map screenshot with gold pins
    - CTA: "Jetzt ausprobieren" → `/de` homepage
    - Salon CTA: "Bist du ein Salon?" → `/partner`
  - **Style:** Full-width sections alternating white/light-teal backgrounds. Each section has text left + visual right (desktop), stacked (mobile). Smooth scroll animations on section enter.
  - **SEO:** `generateMetadata` with OG tags: "Warum Solen? — Die smarte Art Beautyhtermine zu buchen"
  - ⚠️ BE CAREFUL: This page must be BEAUTIFUL. It's the marketing page. Don't rush the design. Use glassmorphism, subtle gradients, the full design system.

- [ ] **7.3 Customer Tutorial Upgrade**
  - **Action:** Modify `TutorialTour.tsx`:
    - Change from current steps to 3 steps:
      1. "🔍 Suche" — highlight search bar: "Finde Salons nach Behandlung, Preis oder Quartier"
      2. "✨ Solen Extras" — highlight chat icon, compare button, stamp card: "Nur bei Solen: Chatten, Vergleichen, Stempel sammeln!"
      3. "📅 Buche" — highlight booking flow: "Buche in 30 Sekunden"
    - Each step has "Überspringen" (skip this step) + "Alle überspringen" (skip entire tour)
    - Store `tutorial_completed` in localStorage
    - Only show on first visit
  - ⚠️ BE CAREFUL: TutorialTour already exists. Read it fully. Modify content, don't rebuild the overlay mechanism.

→ `git add . && git commit -m "moat-phase7: feature showcase + labels" && git push`

---

## Phase 8: Upcharge Transparency & Review Reply Badges (~1h)
**Goal:** Make disputes fair with structured reasons. Make review replies visible.

### ⚠️ RISK: LOW

- [ ] **8.1 Structured Upcharge Reasons**
  - **Action:** Modify the dispute/upcharge flow:
    - Add predefined reason dropdown: "Haarlänge", "Zusätzliche Behandlung", "Material/Produkte", "Zeitüberschreitung", "Sonstiges"
    - Add optional free-text field: "Weitere Details (optional)"
    - Customer sees: "Preisanpassung: +CHF 15 — Grund: Haarlänge"
    - Store reason in `price_disputes.salon_reason` (already exists — populate with structured value)
  - **Where:** Salon dashboard booking detail → "Preis anpassen" modal

- [ ] **8.2 "Salon hat geantwortet" Badge on Reviews**
  - **Action:** Modify review display on salon page:
    - If a review has a `review_reply`, show green badge: "✓ Salon hat geantwortet"
    - Badge positioned between review text and reply text
    - Encourages salons to respond (professionalism signal for customers)

→ `git add . && git commit -m "moat-phase8: upcharge reasons + review badges" && git push`

---

## Execution Order

| # | Phase | Time | Risk | New Files | Modified Files |
|---|---|---|---|---|---|
| 1 | Chat Intelligence | 3h | 🟡 | QuickReplyChips, AISuggestion, PhotoGallery, chat API | ChatWindow, price_offers API |
| 2 | Client CRM Tags | 2h | 🟢 | ClientTags, client-tags API, migration | Dashboard booking detail |
| 3 | Loyalty Stamp UX | 3h | 🟡 | StampCard, StampAnimation | SalonCard, ProfilePage, dashboard |
| 4 | Solen Score + Gold Pins | 3h | 🟡 | SolenScoreCard, score API, migration | MapView, SalonCard |
| 5 | Full Map Enhancement | 3h | 🟡 | — | MapView (heavy) |
| 6 | Compare + Off-Peak | 2h | 🟢 | — | CompareDrawer, SalonCard, salon page |
| 7 | Feature Showcase | 2h | 🟢 | SolenExclusiveBadge, warum-solen page | TutorialTour |
| 8 | Upcharge + Review Badges | 1h | 🟢 | — | Dispute flow, review display |

**Total: ~19 hours**

---

## New DB Migrations

| # | Table/Change | Phase |
|---|---|---|
| M1 | `chat_templates` | 1 |
| M2 | `ALTER price_offers ADD inspiration_photo_url` | 1 |
| M3 | `client_tags` | 2 |
| M4 | `ALTER salons ADD solen_score, solen_tier, score_details` | 4 |

## Post-Completion Verification
```bash
npm run build && npx tsc --noEmit
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/warum-solen
# Visual checks:
# 1. Open chat → see quick reply chips (salon side)
# 2. Open salon page → see stamp progress on SalonCard
# 3. Open map → see gold pins for top salons
# 4. Open dashboard → see Solen Score card
# 5. Dark mode → all new components render correctly
```

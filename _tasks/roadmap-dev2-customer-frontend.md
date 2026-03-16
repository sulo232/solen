# Dev 2 Roadmap — Customer-Facing Frontend
**Branch:** `feature/customer-frontend` · Rebase on `main` daily  
**Stack:** Next.js 15, next-intl, Tailwind CSS, Lucide React, Mapbox GL JS, Supabase Realtime  
**Rule:** Never call Supabase directly (except Realtime). Use `fetch('/api/...')`. Import types from `lib/types.ts`. Never touch `app/api/`, `lib/`, `supabase/`. Never touch `app/[locale]/dashboard/`.

> [!NOTE]
> **Glass nav token:** `bg-white/80 backdrop-blur-lg border-b border-gray-100` — use on `Header` component.

---

## Current State
All `app/[locale]/` pages are **empty stubs** (`return null`). No `components/` dir. The entire live site runs on `public/home.html` (vanilla JS iframe). This roadmap migrates each piece to proper Next.js.

> [!IMPORTANT]
> Keep the iframe in `app/[locale]/page.tsx` until Phase 5 is done. The homepage stays as iframe until the React homepage is complete and tested.

---

## Phase 1 — Design System & Shared Foundation
*Estimated: ~1 day*

### 1.1 Tailwind Config [`tailwind.config.ts`]
```ts
colors: { teal: '#4ECDC4', coral: '#FF6B6B', dark: '#1A1A2E' }
fontFamily: { heading: ['Syne'], body: ['DM Sans'], data: ['Space Grotesk'] }
borderRadius: { card: '12px', pill: '9999px', button: '8px' }
boxShadow: { card: '0 4px 12px rgba(0,0,0,0.08)', 'coral-glow': '0 2px 8px rgba(255,107,107,0.15)' }
```

### 1.2 Fonts [`app/[locale]/layout.tsx`]
Self-host via `next/font/google`: Syne (heading), DM Sans (body), Space Grotesk (data). No `<link>` CDN tags. Apply as CSS variables to `<html>`.

### 1.3 Component Library — `components/`

| File | Description |
|------|-------------|
| `components/index.ts` | Re-exports everything |
| `components/ui/Spinner.tsx` | CSS animation only. Props: `size`, `invert`, `className` |
| `components/ui/PriceSlider.tsx` | `@radix-ui/react-slider` dual-thumb. CHF 0–200, step 5. Teal track. Space Grotesk values. Debounced 300ms → URL params |
| `components/ui/ExpandableTabs.tsx` | Account area tabs. CSS transitions only, NO framer-motion |
| `components/layout/Header.tsx` | Logo + nav + auth. Shrinks on scroll >10px. Unread coral dot. Mobile hamburger |
| `components/SalonCard.tsx` | Shared. Used by Dev 3 too. Props: `salon`, `variant?: 'default' \| 'compact'` |
| `components/QuartierTile.tsx` | ~160×100px. Name + count. Green "Bereits besucht" badge. Coral heart if favorited |
| `components/ServiceTile.tsx` | 6 tiles with Lucide icons. Name + "ab CHF X" in Space Grotesk. "Dein Favorit" badge |
| `components/LastMinuteCard.tsx` | ~200×220px. 2px coral left-border. Time in coral/Space Grotesk. Live countdown every 60s |
| `components/CategoryPage.tsx` | Template used by all 6 category pages |
| `components/FilterBar.tsx` | Sticky pills: Quartier, Preis (PriceSlider), Verfügbarkeit, Bewertung, Sortierung → URL params |
| `components/MapView.tsx` | Mapbox GL JS v3. Teal pins → coral selected. Clustering >20. Popup = mini SalonCard. `dynamic(..., { ssr: false })` |
| `components/BookingCalendar.tsx` | See Phase 4 |
| `components/ChatWindow.tsx` | See Phase 6 |

### 1.4 Install
```bash
npm install @radix-ui/react-slider mapbox-gl lucide-react driver.js
npm install -D @types/mapbox-gl
```

---

## Phase 2 — Homepage
*Estimated: ~2 days*

**File:** `app/[locale]/page.tsx` — replace iframe stub at END of this phase.

### Sections

#### Hero
- Logged-out: "Dein Beauty-Termin in Basel" | Logged-in: "Willkommen zurück, {name}"
- Full-width search bar. Autofocus desktop. Autocomplete → `GET /api/salons/search?q=` debounced 300ms. Results grouped: Salons / Services / Quartiere.
- Weather: `https://api.open-meteo.com/v1/forecast?latitude=47.56&longitude=7.59&current=precipitation`. Rain → teal coral banner "Regentag? Gönn dir was Gutes." → `/de/spa`. Dry → hidden.

#### Quartiere `"Entdecke dein Quartier"`
- Horizontal scroll `scroll-snap-type: x mandatory`. **NEVER vertical.**
- `QuartierTile` × 7. Count via `GET /api/salons?quartier={name}&count=true`
- Personalize by `user_preferences.quartier_visit_counts`. Green badge if visited.
- End pill: "Alle Quartiere →" modal.

#### Services `"Was suchst du heute?"`
- Horizontal scroll, scroll-snap. **NEVER vertical.**
- `ServiceTile` × 6. Tap → `/de/{category}`. Last-booked service first with "Dein Favorit" badge.

#### Last-Minute Teaser
- `GET /api/slots/last-minute?limit=5`
- `LastMinuteCard` × 4–5. Horizontal scroll. Pulsing coral dot.
- Hidden if 0 results. End: "Alle Last-Minute →" → `/de/last-minute`

#### Recommendations
- `GET /api/salons?sort=personalized&limit=4`
- `SalonCard` × 3 mobile (scroll) / 4 desktop (grid)
- "Alle Salons entdecken →" text link

#### Social Proof
- Count-up animation on scroll (Intersection Observer): "X Termine diese Woche gebucht"
- Review mini-carousel: 3 cards, horizontal swipe. `GET /api/reviews?featured=true`

#### Nudge (logged-in only)
- Show if predicted next booking within 7 days. Dismissible via localStorage (7-day TTL).

---

## Phase 3 — Category Sub-Pages + Last-Minute Page
*Estimated: ~1 day (template-driven)*

### Category Pages
**Files:** `app/[locale]/coiffeur/page.tsx`, `/barbershop`, `/nails`, `/spa`, `/makeup`, `/waxing`

Each file just renders: `<CategoryPage category="coiffeur" />`

#### `CategoryPage` includes:
- `<h1>` "Barbershop in Basel" (dynamic, SEO)
- Breadcrumb: Home > {Category}
- `generateMetadata()` + JSON-LD
- Sticky `FilterBar` → URL params: `?min_price=&max_price=&quartier=&sort=&rating=`
- Auto-apply user's top quartier (dismissible banner)
- View toggle Liste ↔ Karte (cookie stores preference)
- **Liste**: `SalonCard` stack. "Mehr laden" button (NOT infinite scroll).
- **Karte**: `MapView` (lazy loaded). Map + list sync (selecting a map pin highlights the list card and vice versa).
- Data: `GET /api/salons?category={cat}&{filterParams}`

### Last-Minute Page `app/[locale]/last-minute/page.tsx`
- "Last-Minute Angebote Heute" + pulsing coral dot
- Same `FilterBar`. Pre-fill from `user_preferences`.
- 2-col mobile / 3-col desktop grid. "Mehr laden" at 20+.
- Supabase Realtime: slot changes → booked fade out.
- Empty state: illustration + "Gerade keine Slots" + link to `/de/coiffeur`
- **Floating pill** (only on homepage): coral "3 Last-Minute Slots jetzt" → `/de/last-minute`. Only shown if **user has 2+ same-day bookings**. Swipe to dismiss (sessionStorage).

---

## Phase 4 — Salon Profile & BookingCalendar
*Estimated: ~2 days*

**File:** `app/[locale]/salon/[slug]/page.tsx`  
Data: `GET /api/salons/{slug}`

### Profile Layout
- Hero: horizontal swipe photo gallery (CSS scroll-snap, `next/image`)
- `<h1>` name, rating, quartier badge, address (tappable → Maps), hours, phone, Instagram link
- Category pills. Staff grid (tappable → filters calendar). Services list grouped by category.
- Reviews: star breakdown + cards. `GET /api/reviews?salon_id={id}`. "Mehr laden".
- Mini Mapbox static image + directions link.

`generateMetadata()` + JSON-LD schema.

### `components/BookingCalendar.tsx`
Props: `salonId`, `serviceId?`, `staffMemberId?`, `slotId?`

| Feature | Detail |
|---------|--------|
| Date picker | Horizontal scroll, 14 days. Today = teal ring. Fully booked = greyed |
| Time slots | Pill grid. Groups: Morgens / Nachmittags / Abends. Hide booked |
| Staff picker | Dropdown above grid. Default: "Egal (wer verfügbar ist)" |
| First-visit | Checkbox, pre-filled from `profile.is_first_visit_default` |
| Summary | Slide-up strip after all selections |
| Confirm | Logged-in → `POST /api/bookings`. Logged-out → redirect to login with params preserved |
| Recurring | Toggle → frequency picker → `POST /api/bookings/recurring` |
| Notice | "Kostenlose Stornierung bis 24h vor Termin" |
| Realtime | Subscribe `availability_slots WHERE salon_id=X`. Booked slots fade out |

---

## Phase 5 — Auth UI
*Estimated: ~0.5 days*

### `components/auth/SignIn.tsx`
- Google **primary** (large, top). Magic link secondary (no password).
- Teal accent. After auth: redirect to `searchParams.redirect`.

### Pages
- `app/[locale]/auth/login/page.tsx` → `<SignIn />`
- `app/[locale]/auth/register/page.tsx` → 3-step wizard:
  1. Name + avatar + bio
  2. Age group + gender + hair type (visual cards)
  3. Multi-select categories  
  Each step: `PATCH /api/profile`. Step 3 complete → confetti → redirect home.

---

## Phase 6 — Messaging UI
*Estimated: ~1 day*

### `app/[locale]/account/messages/page.tsx`
- `GET /api/conversations`. Sorted by `last_message_at`.
- Card: avatar + name + preview + timestamp + unread (coral badge).
- "Neue Nachricht" → salon search → `POST /api/conversations` → opens chat.

### `components/ChatWindow.tsx` — GENERIC (Dev 3 reuses)
Props: `conversationId`, `perspective: 'customer' | 'salon'`, `currentUserId`

| Feature | Detail |
|---------|--------|
| Layout | Scroll list (newest bottom) + fixed input bar |
| Bubbles | Sent = teal right. Received = grey left. Timestamp on tap. Read receipt ✓✓ |
| Input | Text + send (teal). Max 2000 chars. Enter = send (desktop) |
| Images | Paperclip → Storage upload → `POST /api/messages` with `message_type='image'` |
| Booking bubble | Card: "Termin buchen bei {Salon}" |
| Realtime | Subscribe `messages WHERE conversation_id=X`. Slide-up animation |
| Typing | Realtime presence. "{Name} tippt..." debounced 1s |

---

## Phase 7 — Customer Account & Profile
*Estimated: ~0.5 days*

### `app/[locale]/account/page.tsx`
`ExpandableTabs`: Termine · Favoriten · Nachrichten · Profil

- **Termine**: booking history. "Nochmal buchen" → `/de/salon/{slug}?service={id}&staff={id}` (2 taps total). "Stornieren" (only if >24h before): confirmation modal with optional reason → `POST /api/bookings/{id}/cancel` → slot freed, **both parties emailed**. Past deadline → button disabled with tooltip.
- **Favoriten**: `SalonCard` compact grid of saved salons.
- **Profil**: avatar, name, bio, hair type, age, gender — all editable. Language toggle DE/EN. Recurring bookings management. `PATCH /api/profile`.

---

## Smart Features (add to relevant phases)

### Search by Specific Service (Phase 2 — Hero search)
Typing e.g. "Balayage" in the search bar returns:
- Salons offering that service
- Staff members with that specialty → show **"Specialist" badge** on matching staff cards
Implement via `GET /api/salons/search?q=balayage` returning both salon + staff matches.

### Rebook Shortcut (Phase 7 — Termine tab)
Past bookings show "Nochmal buchen" → `/de/salon/{slug}?service={id}&staff={id}`. Two taps to confirmed booking.

---

## Phase 8 — First-Time Tutorial
*Estimated: ~0.5 days* · Do last

`driver.js` 4-step tooltip tour:
1. Search: "Suche nach Salons, Services oder Quartieren"
2. Service tiles: "Tippe auf eine Kategorie für mehr"
3. Last-Minute: "Dringende Termine? Hier findest du sie"
4. Message icon: "Schreib deinem Salon direkt"

Trigger: first login + `!localStorage.getItem('solen_tour_done')`. Dismiss → set flag.

---

## API Reference

| Endpoint | Phase |
|----------|-------|
| `GET /api/salons/search?q=` | 2 |
| `GET /api/salons?category=&quartier=&min_price=&max_price=&sort=&limit=&offset=` | 2, 3 |
| `GET /api/salons/{slug}` | 4 |
| `GET /api/slots/last-minute?limit=` | 2, 3 |
| `GET /api/slots?salon_id=&date=&service_id=&staff_member_id=` | 4 |
| `POST /api/bookings` | 4 |
| `POST /api/bookings/recurring` | 4 |
| `POST /api/bookings/{id}/cancel` | 7 |
| `GET /api/conversations` | 6 |
| `POST /api/conversations` | 6 |
| `GET /api/messages?conversation_id=` | 6 |
| `POST /api/messages` | 6 |
| `GET /api/profile` | 5, 7 |
| `PATCH /api/profile` | 5, 7 |
| `GET /api/reviews?salon_id=&featured=` | 2, 4 |

## Supabase Realtime (allowed)
```ts
// Slots — BookingCalendar
supabase.channel('slots').on('postgres_changes',
  { table: 'availability_slots', filter: `salon_id=eq.${salonId}` }, handler).subscribe()

// Messages — ChatWindow
supabase.channel('msgs').on('postgres_changes',
  { table: 'messages', filter: `conversation_id=eq.${id}` }, handler).subscribe()

// Typing presence
supabase.channel(`typing:${conversationId}`).track({ typing: true })
```

---

## Delivery Checklist
- [ ] Homepage <2s on 4G mobile. Lighthouse mobile >90
- [ ] All 6 sub-pages: FilterBar, MapView, pagination, URL params persistent
- [ ] Horizontal scroll-snap works iOS Safari + Android Chrome
- [ ] Max 2 taps to confirmed booking (logged-in)
- [ ] BookingCalendar: Realtime updates, recurring, cancellation notice
- [ ] Chat: messages <500ms. Typing indicator. Image sharing.
- [ ] All text via next-intl. Locale switch works everywhere.
- [ ] FilterBar params shareable as URL
- [ ] Auth: Google one-tap, magic link, redirect preserves booking intent
- [ ] Onboarding: all 3 steps save. Confetti on complete.
- [ ] Stornieren: disabled <24h before. Modal + API call.
- [ ] `ChatWindow` works for both `perspective` values
- [ ] `components/index.ts` exports all — Dev 3 depends on this

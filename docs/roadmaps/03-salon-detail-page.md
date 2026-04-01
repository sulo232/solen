# Roadmap 03 — Salon Detail Page

> **Scope**: Photo mosaic, sticky tabs, services list, team section, reviews, booking sidebar, vouchers
> **DB Status**: ALL tables exist — `salons`, `services`, `staff_members` (name, avatar, specialties, ratings), `reviews` (rating, comment, booking-linked), `bookings`, `availability_slots`. Gallery API at `/api/salons/[slug]/gallery` is fully built.
> **Effort**: 🔴 Large (~65 audit points)

---

## Phase 1: Photo Gallery Hero

### 1.1 Airbnb-style photo mosaic

**WHY**: The salon detail page hero is the first thing users see — it sets the entire emotional tone. A single image gives limited information. Airbnb's 5-photo mosaic grid is one of the most copied UX patterns in tech because it works: it shows space, atmosphere, details, and team in one glance. For beauty salons, this means: interior shot, styling station, result photo, team, and a detail shot (products, vibe).

**BENCHMARK**:
- **Airbnb**: 5-photo mosaic — 1 large left (50% width), 4 smaller right (2×2 grid). Clickable "Show all photos" button bottom-right.
- **Fresha**: Simple horizontal carousel/slider. Less impactful but simpler.

**HOW**:
- **File**: `app/[locale]/salon/[slug]/page.tsx` (the photos array is already built at line 389: `const photos = [salon.cover_photo_url, ...(salon.gallery_urls ?? [])].filter(Boolean)`)
- **Desktop layout**: CSS Grid — `grid-cols-4 grid-rows-2 gap-2 rounded-xl overflow-hidden aspect-[2/1]`
  - Photo 1 (cover): `col-span-2 row-span-2` (large, left side)
  - Photos 2-5: each `col-span-1 row-span-1` (smaller, right grid)
  - All photos: `object-cover w-full h-full`
  - Hover: subtle brightness increase on individual photos
- **Mobile layout**: Full-width horizontal swipe carousel with dots (reuse pattern from SalonCard carousel)
- **"Alle Fotos anzeigen"** button: White pill, bottom-right of mosaic, overlaid: `"📷 Alle Fotos anzeigen"` → opens lightbox
- **Fallback**: If <5 photos, adapt grid (3 photos = 1 large + 2 small, 2 photos = side by side, 1 photo = full-width)

**IMPACT**: Users immediately feel the salon's vibe. Multiple photos build confidence ("this place looks legit"). Increases time-on-page and booking conversion.

---

### 1.2 Build lightbox modal

**WHY**: Users want to see salon photos in full detail — zoomed in, without UI clutter. A lightbox provides an immersive photo viewing experience that lets users examine work quality, interior details, and team photos closely. This is standard for any listing page.

**BENCHMARK**:
- **Airbnb**: Full-screen black background gallery with counter "3 / 12", left/right arrows, close button. Swipe on mobile.
- **Fresha**: Basic photo carousel, not full-screen.

**HOW**:
- **File**: New `components/ui/PhotoLightbox.tsx`
- **Features**: Full-screen overlay, black background, white photo centered, navigation arrows (left/right), keyboard support (arrow keys, Escape), counter "3 / 12", swipe on mobile, close button (X) top-right
- **Animation**: `AnimatePresence` fade + scale from clicked photo position (shared layout animation for premium feel)
- **Performance**: Lazy-load full-res images only when lightbox opens. Show optimized thumbnails in mosaic.

**IMPACT**: Professional photo viewing experience. Users can examine salon work quality in detail before booking.

---

### 1.3 Share + Save buttons on hero

**WHY**: Sharing helps Solen grow organically ("check out this salon!"). Saving lets users shortlist salons. Both are standard on every listing page and expected by users.

**BENCHMARK**:
- **Airbnb**: Top-right of page, "Share" (arrow icon) and "Save" (heart icon), both with text labels on desktop, icons-only on mobile
- **Fresha**: Share button on salon page, no prominent save

**HOW**:
- **Share**: Uses `navigator.share()` on mobile (native share sheet — beautiful), falls back to `navigator.clipboard.writeText(window.location.href)` on desktop + toast "Link kopiert!"
- **Save (heart)**: Same logic as card heart (Roadmap 02, 1.2) — same `saved_salons` table, same auth guard, same animation

**IMPACT**: Free word-of-mouth marketing via sharing. Save creates return visits.

---

## Phase 2: Sticky Section Tabs

### 2.1 Add sticky tab navigation

**WHY**: Salon detail pages are long — services, team, reviews, about, location. Without navigation, users must scroll endlessly to find what they want. Sticky tabs let users jump to any section instantly and always know where they are on the page. Both Fresha and Airbnb use this — it's essential for content-heavy pages.

**BENCHMARK**:
- **Fresha**: Tabs: Photos | Services | Team | Reviews | Buy Voucher | About. Sticky below header. Active tab has underline.
- **Airbnb**: Tabs: Photos | Amenities | Reviews | Location. Same sticky behavior.

**HOW**:
- **File**: New `components/salon/SalonTabNav.tsx`
- **Tabs**: `Fotos | Services | Team | Bewertungen | Über | Standort`
- **Scroll-to behavior**: Click tab → `document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth', block: 'start' })`
- **Active detection**: `IntersectionObserver` on each section — when a section enters viewport (threshold 0.3), its tab becomes active
- **Sticky**: `position: sticky; top: [header-height]; z-index: 30` — sticks below main header when scrolled past hero
- **Style**: `border-b border-[#EBEBEB]` container. Each tab: `text-[14px] py-4 px-1` — active: `border-b-2 border-[#222] font-semibold`, inactive: `text-[#6A6A6A]`
- **Mobile**: Horizontally scrollable if too many tabs

**IMPACT**: Users navigate a complex page effortlessly. Reduces frustration on long pages. Professional UX signal.

---

## Phase 3: Services List

### 3.1 Build grouped service list

**WHY**: Services are the core of salons — this is what users are buying. A well-organized, scannable service list with prices and durations is essential for conversion. Users need to compare options, understand what's available, and find their specific service quickly. Fresha's service list is their strongest UX pattern.

**BENCHMARK**:
- **Fresha**: Services grouped by type ("Waxing", "Wimpern", "Maniküre"). Each row: service name left, duration + price right. Collapsible groups. "See all" link per group. Click service → starts booking.
- **Airbnb**: Not applicable (lodging doesn't have service lists)

**HOW**:
- **File**: New `components/salon/ServiceList.tsx`
- **Data**: `SELECT * FROM services WHERE salon_id = $1 AND is_active = true ORDER BY category, price ASC`
- **Grouping**: Group by `service.category` → show as accordion sections
- **Each group header**: Category label + count: `"Coiffeur (8)"` — click header toggles collapse/expand
- **Each service row**:
  - Left column: `name_de` in `font-semibold text-[15px]`, optional `description_de` below in `text-[13px] text-[#6A6A6A] line-clamp-1`
  - Right column: `duration_minutes` as `"45 Min."` in `text-[13px] text-[#6A6A6A]`, then price as `"CHF 65"` in `font-semibold`
  - If variable pricing: show `"ab CHF 35"` with "ab" prefix
  - Divider: `border-b border-[#EBEBEB]` between rows
- **"Buchen" button**: Appears on hover (desktop) or always visible (mobile) — coral text button, right-aligned. Pre-selects this service in booking flow.
- **"Alle X Services anzeigen"**: Link at bottom of each group if > 5 services — expands to show all
- **Total count header**: `"134 Services verfügbar"` above the list

**IMPACT**: Users can find and compare services with prices and durations. This is the most important information a salon detail page provides. Directly drives booking decisions.

---

## Phase 4: Team Section

### 4.1 Build team member carousel

**WHY**: Beauty services are deeply personal — users want to know WHO will be doing their hair/nails/massage. A team section with names, photos, specialties, and ratings lets users choose their preferred stylist before booking. This is a strong Fresha pattern and creates a more personal, trust-building experience.

**BENCHMARK**:
- **Fresha**: Horizontal scroll of team members. Each card: avatar (or initials), name, languages ("EN/FR"), specialization ("Nail Artist"). Click → book with this person.
- **Airbnb**: Host profile section with photo, name, response rate, about text. Simpler since there's only one "host."

**HOW**:
- **File**: New `components/salon/TeamCarousel.tsx`
- **Data**: 
  ```sql
  SELECT sm.id, sm.name, sm.avatar_url, sm.specialties, sm.average_rating, sm.review_count, sm.languages
  FROM staff_members sm 
  WHERE sm.salon_id = $1 AND sm.is_active = true
  ```
  - Also JOIN `staff_services` to get their offered services
- **Card design** (each team member):
  - Avatar: 80px circle, `object-cover rounded-full`, or initial letter with gradient background if no photo
  - Name: `font-semibold text-[15px]` below avatar
  - Specialties: horizontally scrollable chips, `text-[11px] bg-[#F7F7F7] rounded-full px-2 py-0.5`
  - Rating: `"★ 4.8 (23)"` in small text below name
  - Languages (if column exists): `"DE/EN/FR"` pills
- **Layout**: Horizontal scroll carousel, 140px wide cards with 12px gap
- **Click action**: → Start booking flow with this staff member pre-selected
- **"Alle anzeigen"**: Link if > 6 team members

**IMPACT**: Personalized bookings ("I want Jilliane for my nails") build stronger relationships and loyalty. Users return for THEIR stylist, not just the salon.

---

## Phase 5: Reviews Section

### 5.1 Build review display section

**WHY**: Reviews are the #1 trust signal in any marketplace. 88% of consumers trust online reviews as much as personal recommendations. A well-designed review section with rating breakdown, individual reviews with dates and text, and sort/filter options gives users the confidence to book. Without visible reviews, users hesitate.

**BENCHMARK**:
- **Airbnb**: Overall rating + 6 category scores (Cleanliness, Accuracy, etc.) with bar charts. Individual reviews with avatar, name, date, text. "Show all X reviews" button → full-screen modal.
- **Fresha**: Total rating + count. Individual reviews with name, location, date, full text. Chronological order.

**HOW**:
- **File**: New `components/salon/ReviewSection.tsx`
- **Data**: 
  ```sql
  SELECT r.*, p.display_name, p.avatar_url 
  FROM reviews r 
  JOIN profiles p ON p.id = r.user_id 
  WHERE r.salon_id = $1 
  ORDER BY r.created_at DESC
  ```
- **Header**: `"★ 4.9 · 123 Bewertungen"` in large `text-[22px] font-heading font-bold`
- **Rating breakdown**: 5 horizontal bars (5★ to 1★) showing count distribution. Bar fill proportional to count. Green for high, gray for low.
- **Individual review cards**:
  - Avatar (32px circle) + name (first name + last initial) + date (`"Vor 3 Tagen"` via `formatDistanceToNow()`)
  - Star icons (5 stars, filled in coral up to rating)
  - Comment text: `line-clamp-3` with `"Mehr anzeigen"` toggle to expand
  - Divider between reviews
- **Sort**: Dropdown: "Neueste zuerst" (default), "Beste zuerst", "Schlechteste zuerst"
- **Show first 6 reviews**, then `"Alle 123 Bewertungen anzeigen"` button → opens scrollable modal with all reviews
- **Salon response** (migration 041 + 076 exist): Below review comment, indented: `"Antwort von [Salon Name]:"` in italic, muted style

**IMPACT**: Builds trust, resolves hesitation, drives conversion. Users who read reviews are 2× more likely to book.

---

## Phase 6: Booking Sidebar & Mobile CTA

### 6.1 Build sticky booking sidebar (desktop)

**WHY**: The booking CTA must always be visible. If users have to scroll up to find the "Book" button, they lose momentum and abandon. Airbnb's sticky sidebar is one of the most effective conversion patterns — it follows the user as they read reviews, browse services, and compare. Every scroll position should show a clear path to booking.

**BENCHMARK**:
- **Airbnb**: Right column sidebar (380px wide), sticky to viewport. Shows price, rating, "Reserve" button, and key info. Follows user as they scroll.
- **Fresha**: Services are inline with "Book" buttons per service. No sticky sidebar.

**HOW**:
- **File**: New `components/salon/BookingSidebar.tsx`
- **Position**: Right column in a 2-column desktop layout (`grid grid-cols-[1fr_380px] gap-12`), `sticky top-[100px]`
- **Content**:
  - Price: `"ab CHF 35"` in `text-[20px] font-bold`
  - Rating: `"★ 4.9 (123)"` inline
  - Opening status: Uses `isOpenNow()` utility → `"Jetzt geöffnet · Schliesst um 19:00"` (green dot + text) or `"Geschlossen · Öffnet morgen um 09:00"` (red dot + text)
  - **"Jetzt buchen"** button: Full-width, 48px height, coral, `font-bold text-white rounded-btn`
  - Quick info below: "⚡ Sofort buchbar" / "❤️ 12× diese Woche gebucht" / "🕐 Nächster Termin: Heute 14:00"
- **Click "Jetzt buchen"**: Scrolls to services section or opens booking modal (depends on flow maturity)
- **Card shadow**: `shadow-lg rounded-2xl border border-[#EBEBEB] p-6`

**IMPACT**: Booking CTA always visible = higher conversion. The single most important conversion element on the page.

---

### 6.2 Build fixed mobile booking bar

**WHY**: On mobile, there's no sidebar — the sticky CTA must be at the bottom of the screen. This is the mobile equivalent of the desktop sidebar. Without it, mobile users have to scroll back to services to book, which kills conversion.

**BENCHMARK**:
- **Airbnb**: Fixed bottom bar, 60px height: Left shows "From $150 / night" + "★ 4.92", Right shows "Reserve" pink button. Always visible.
- **Fresha**: Similar bottom bar on some salon pages.

**HOW**:
- **File**: New `components/salon/MobileBookingBar.tsx`
- **Position**: `fixed bottom-0 left-0 right-0 z-[45]` — above BottomTabBar's z-index
- **Content**: Left: `"ab CHF 35 · ★ 4.9"`, Right: `"Buchen"` coral button
- **Visibility**: Only on `/salon/[slug]` pages. Hides BottomTabBar on this page.
- **Animation**: Framer Motion `y: 100 → 0` slide-up on mount
- **Safe area**: `pb-[env(safe-area-inset-bottom)]` for iPhone notch

**IMPACT**: Mobile booking conversion increases dramatically. Users always see the CTA.

---

## Phase 7: Additional Sections

### 7.1 "Über diesen Salon" section
**WHY**: Users want context — what makes this salon special, their philosophy, years in business. It builds emotional connection.
**HOW**: Render `salon.description_de` or `salon.description_en` (locale-aware). Truncate at 3 lines + "Mehr anzeigen" expand.

### 7.2 Opening hours table
**WHY**: Users need to know when they can visit. Critical for planning appointments.
**HOW**: Already rendered in `page.tsx` lines 646-691. Polish: clean table layout, highlight "Heute" row in bold, show "Jetzt geöffnet/geschlossen" badge using `isOpenNow()`.

### 7.3 Embedded map
**WHY**: Users need directions. A visual map is more intuitive than a text address.
**HOW**: `mapbox-gl` (already installed). Show a 400px map centered on `salon.latitude/longitude` with a single coral pin. "Route anzeigen" button opens Google Maps with `https://maps.google.com/?daddr={lat},{lng}`. Needs `NEXT_PUBLIC_MAPBOX_TOKEN` env var.

### 7.4 "Ähnliche Salons" section
**WHY**: If this salon isn't perfect, show alternatives. Keeps users on platform instead of leaving.
**HOW**: `/api/salons/[slug]/nearby` route already exists. Filter by same category + 5km radius. Show as horizontal SalonCard carousel (reuse the card from Roadmap 02).

### 7.5 Voucher/gift card section
**WHY**: Gift vouchers are pure revenue — the buyer pays, the recipient visits. Perfect for birthdays, holidays, thank-yous.
**HOW**: CTA card: "🎁 Geschenkgutschein — Verschenke einen Besuch bei [Salon Name]". Button: "Gutschein kaufen" → Stripe checkout. Needs `vouchers` table (see Roadmap 10).

### 7.6 Breadcrumb navigation
**WHY**: SEO value (BreadcrumbList schema) + user navigation context.
**HOW**: `Breadcrumb` component already imported in layout.tsx line 43. Verify it renders: `Home > Coiffeur > Basel > [Salon Name]`. Add JSON-LD BreadcrumbList.

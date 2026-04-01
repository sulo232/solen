# Roadmap 02 — Salon Cards

> **Scope**: Multi-image carousel, badges, pricing, social proof, card grid, skeleton loading
> **DB Status**: `gallery_urls text[]` exists on salons. `average_rating`, `review_count` exist. `services` table has prices + durations. `trending_aggregation` migration exists (078). `availability_slots` has real-time booking data.
> **Effort**: 🟡 Medium (~50 audit points)

---

## Phase 1: Card Image Carousel

### 1.1 Add multi-image carousel to SalonCard

**WHY**: A single static image gives users almost no visual information about a salon. Is the interior modern or dated? What does the team look like? What kind of work do they do? A carousel lets users preview 3-5 images without leaving the listing grid, which dramatically increases click-through rate. Airbnb found that listings with 5+ photos get 2× more bookings than those with 1.

**BENCHMARK**:
- **Airbnb**: Every listing card has a 5-image carousel with dot indicators. Swipe on mobile, arrow buttons on desktop hover. The carousel is the card's dominant visual element — it takes up ~60% of the card height.
- **Fresha**: Single image per listing card. No carousel. This is one of Fresha's weaker UX patterns.

**HOW**:
- **File**: Extract the card rendering from `components/ui/FeaturedSalonCarousel.tsx` into a standalone `components/ui/SalonCard.tsx`
- **Images source**: `[salon.cover_photo_url, ...salon.gallery_urls].filter(Boolean)` — this exact pattern already exists in the salon detail page at `app/[locale]/salon/[slug]/page.tsx` line 389
- **Desktop behavior**: 
  - Left/right arrow buttons appear on hover only (hidden by default to keep UI clean)
  - Arrows: 28px white circle, subtle drop shadow, centered vertically on image
  - Click arrow → slide to next image with `transform: translateX` transition (300ms ease)
- **Mobile behavior**: 
  - Horizontal scroll with `scroll-snap-type: x mandatory` on a flex container
  - Each image is `scroll-snap-align: start` and `flex-shrink: 0; width: 100%`
  - Natural swipe momentum via CSS `scroll-behavior: smooth`
- **Dot indicators**: 
  - Max 5 dots, centered below image
  - Active dot: white circle (6px), inactive: white/50% (4px)
  - If more than 5 images, dots represent "pages" not individual images
- **Image aspect ratio**: `aspect-[4/3]` — landscape orientation shows salon interiors better than square
- **Fallback states**:
  - 0 images → gradient placeholder (`bg-gradient-to-br from-[#F7F7F7] to-[#EBEBEB]`) with category icon centered
  - 1 image → no dots, no arrows
  - 2+ images → full carousel

**IMPACT**: Users can preview salon vibes without clicking through. Increases card engagement and reduces "pogo-sticking" (clicking a salon, going back, clicking another). Expected to increase salon detail page visits by 20-30%.

---

### 1.2 Add favorite heart overlay

**WHY**: The ability to save/favorite salons is fundamental to any marketplace. Users often browse many salons before booking — favorites let them shortlist without losing track. The heart icon is a universally understood pattern. It also creates emotional investment in the platform ("my saved salons").

**BENCHMARK**:
- **Airbnb**: White heart with dark stroke, top-right of image. On click: fills red with a satisfying scale-bounce animation. Requires login — shows login modal if not authenticated.
- **Fresha**: No heart/save on listing cards (only on salon detail pages). This is a missed opportunity.

**HOW**:
- **Position**: Top-right of image, 8px from top and right edges, z-index above image
- **Icon**: Lucide `Heart` icon — 20px
  - Unfavorited: white fill, dark stroke (`stroke="#222" strokeWidth={2} fill="white"`)
  - Favorited: red fill, no stroke (`fill="#FF385C"`)
- **Animation**: Framer Motion spring on toggle: `scale: [1, 1.3, 1]` with `type: "spring", stiffness: 400, damping: 10`
- **Data**: Check if `saved_salons` table exists (likely from migration 015_add_customer_preferences). If not, create:
  ```sql
  CREATE TABLE IF NOT EXISTS saved_salons (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, salon_id)
  );
  ```
- **Auth guard**: If user is not logged in → dispatch `openLoginSheet` event (same pattern as BottomTabBar login)
- **Optimistic update**: Heart fills immediately on click, API call happens in background. Revert if API fails.
- **Click event propagation**: `e.stopPropagation()` — clicking heart should NOT navigate to salon page

**IMPACT**: Users build a personal collection of salons. Creates stickiness and return visits. Essential for "Deine Favoriten" homepage section (Roadmap 06).

---

## Phase 2: Card Badges

### 2.1 Implement badge system on cards

**WHY**: Badges are visual shortcuts that help users make decisions faster. Instead of reading every card's details, a badge like "★ Top" or "−20%" instantly communicates value. Badges also create competitive dynamics among salons ("I want my salon to have the Top badge"), which incentivizes quality on the platform.

**BENCHMARK**:
- **Airbnb**: "Guest favorite" shield badge (black/white, top-left). Awarded to top 5% of listings by rating + hospitality score. Extremely effective — Airbnb says Guest Favorites get 2× the bookings.
- **Fresha**: "Featured" green badge on promoted listings. Also shows "Deals" tag for discounted services.

**HOW**:
- **File**: New `components/ui/SalonBadge.tsx`
- **Badge types** (show max 1 per card, in priority order):
  1. **"★ Top"** — Coral pill badge
     - Criteria: `average_rating >= 4.5 AND review_count >= 10`
     - Why these thresholds: 4.5 is genuinely excellent, and 10 reviews ensures statistical significance. We don't want to badge a salon with one 5-star review.
  2. **"Sofort buchbar"** — Green pill badge
     - Criteria: Has `availability_slots` with `status='available'` in next 48 hours
     - Why: Tells users they can book right now, creating urgency
  3. **"Angebot −X%"** — Orange pill badge
     - Criteria: `last_minute_discount_percent > 0`
     - Shows actual discount: "−20%" is more compelling than just "Deal"
  4. **"Neu"** — Black pill badge
     - Criteria: `created_at > NOW() - INTERVAL '30 days'`
     - Why: Highlights fresh additions, encourages users to try new salons
  5. **"Walk-in"** — Gray pill badge
     - Criteria: `walk_in_available = true`
     - Only for barbershops and some other categories, NOT coiffeur (per your instruction)
- **Design**: 
  - Position: Top-left of image, 8px offset from edges
  - Style: `rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide`
  - Shadow: `0 2px 4px rgba(0,0,0,0.15)` — ensures readability on any image background
  - Max 1 badge per card (highest priority wins)

**IMPACT**: Users can scan a grid of 20 cards and immediately identify the best options. Reduces decision paralysis. Creates aspirational quality incentives for salon owners.

---

## Phase 3: Card Metadata

### 3.1 Add "ab CHF X" pricing on cards

**WHY**: Price is the #1 deciding factor for beauty services after location. Not showing price on cards forces users to click into every salon to compare prices, which is terrible UX. Fresha shows starting prices on every card. Airbnb shows nightly rates on every card. Solen currently shows no price — this is a critical gap.

**BENCHMARK**:
- **Fresha**: Shows individual service prices on the card: "Haircut · 45 min · CHF 65". Shows 3-4 services per card.
- **Airbnb**: Shows "CHF 150 / night" on every card. Price is one of the first things users see.

**HOW**:
- **Data source**: Use `salon_min_prices` materialized view (from Phase M2 migration in Roadmap 01)
- **Query**: `SELECT min_price, service_count FROM salon_min_prices WHERE salon_id = $1`
- **Display format**: `"ab CHF 35"` — the "ab" (German "from") signals that this is the starting price, not a fixed price
- **Formatter**: `new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0 }).format(minPrice)`
- **Position**: Below salon name and type label, left-aligned
- **Style**: `text-[13px] text-[#6A6A6A]` (muted but visible)
- **Fallback**: If no services exist for a salon (data gap), show nothing (not "Preis auf Anfrage")

**IMPACT**: Users can compare prices at a glance without clicking into individual salons. Reduces frustration, increases trust (transparency), and speeds up the decision-making process.

---

### 3.2 Add business type label

**WHY**: A salon's name alone doesn't tell users what kind of business it is. "Joliz Zentrum" could be anything. Adding "Nagelstudio · Kleinbasel" instantly communicates the service type and location, helping users scan results faster.

**BENCHMARK**:
- **Airbnb**: Shows "Entire home in Kleinbasel" — type + location
- **Fresha**: Shows "Beauty Salon" or "Nail Salon" etc. — type label

**HOW**:
- **Data**: `salon.categories[0]` → map to German display labels:
  ```typescript
  const CATEGORY_LABELS: Record<string, string> = {
    coiffeur: "Coiffeur",
    nails: "Nagelstudio",
    barbershop: "Barbershop",
    spa: "Spa & Wellness",
    makeup: "Makeup Studio",
    waxing: "Waxing Studio"
  };
  ```
- **Display**: `"Nagelstudio · Kleinbasel"` — type + quartier, separated by ` · `
- **Position**: Below salon name, before price
- **Style**: `text-[13px] text-[#6A6A6A]`

**IMPACT**: Users instantly know what kind of salon it is without guessing. Particularly useful when a salon name is creative/branding-focused and doesn't describe the service.

---

### 3.3 Add rating + review count

**WHY**: Social proof is the strongest driver of trust in online marketplaces. A salon with "★ 4.9 (123)" feels safe to book. A salon with no rating feels risky. This is basic marketplace hygiene — both Fresha and Airbnb show ratings on every card.

**BENCHMARK**:
- **Airbnb**: Top-right of text area: "★ 4.92 (128)" — star is black, number is regular weight, count in parentheses
- **Fresha**: Below name: "4.9 ★ (2,961 Bewertungen)" — number first, then star, then count

**HOW**:
- **Data**: `salon.average_rating` (decimal) + `salon.review_count` (integer) — both exist in the `salons` table
- **Display format**:
  - Has reviews: `"★ 4.9 (123)"` — star icon in coral (#E8624A), rating number in #222, count in #6A6A6A
  - Zero reviews: `"Neu"` — black pill label (same as "New" badge but smaller, text-only)
- **Position**: Right-aligned on same row as salon name (Airbnb pattern — creates visual balance)
- **Precision**: 1 decimal place (4.9 not 4.92 — cleaner, and Fresha does this too)
- **Style**: `text-[14px] font-semibold`

**IMPACT**: Users trust rated salons more. Salons with high ratings get more bookings, creating a positive feedback loop. Users with no rating see "Neu" which signals freshness rather than lack of quality.

---

### 3.4 Add "Nächster Termin" (next available slot)

**WHY**: Knowing when a salon ACTUALLY has availability is incredibly valuable. "Nächster Termin: Heute 14:00" creates immediate urgency — the user feels like they should book before it's gone. This is something neither Fresha nor Airbnb shows on listing cards, so it's a competitive advantage for Solen.

**BENCHMARK**:
- **Fresha**: Shows "See available times" button but no specific slot on the card
- **Airbnb**: Shows "Available [date range]" sometimes, but not specific times

**HOW**:
- **Data**: Query `availability_slots`:
  ```sql
  SELECT starts_at FROM availability_slots 
  WHERE salon_id = $1 AND status = 'available' AND starts_at > NOW() 
  ORDER BY starts_at LIMIT 1
  ```
- **Display format**: 
  - Today: `"Nächster Termin: Heute 14:00"` — green text (#2E7D32)
  - Tomorrow: `"Nächster Termin: Morgen 10:00"`
  - Other: `"Nächster Termin: Fr. 4. Apr 09:00"` — abbreviated day + date
- **Position**: Bottom of card metadata, below price
- **Style**: `text-[12px] text-[#2E7D32] font-medium` — green signals availability
- **Fallback**: If no slots available in next 14 days, show nothing (don't show "Keine Termine")
- **Performance**: Batch-query for all visible salons, not N+1

**IMPACT**: Creates urgency and helps users find salons they can actually book. No competitor shows this on cards — unique selling point for Solen.

---

### 3.5 Add social proof: "X× diese Woche gebucht"

**WHY**: "12× diese Woche gebucht" tells users that a salon is actively in-demand and trusted by others. This is "bandwagon" social proof — the most powerful form of persuasion in marketplace UX. Booking.com pioneered this pattern ("15 people are looking at this hotel right now") and it directly increases conversion rates.

**BENCHMARK**:
- **Airbnb**: "Booked X times this week" on some listings
- **Fresha**: Shows total review count (2,961) as social proof, but not booking frequency

**HOW**:
- **Data query**: 
  ```sql
  SELECT COUNT(*) as booking_count FROM bookings 
  WHERE salon_id = $1 AND created_at > NOW() - INTERVAL '7 days'
  ```
- **Threshold**: Only show if `booking_count >= 3` — below that it looks sad rather than impressive
- **Display**: `"12× diese Woche gebucht"` in `text-[12px] text-[#6A6A6A]`
- **Existing infrastructure**: Migration `078_trending_aggregation.sql` already creates aggregation views — check if this data is already materialized there
- **Future enhancement**: Real-time counter animation when a new booking comes in (via Supabase Realtime)

**IMPACT**: Drives herd behavior — users are more likely to book a popular salon. Also signals freshness (the salon is active on the platform). Major conversion driver.

---

## Phase 4: Card Grid & Loading

### 4.1 Standardize card grid layout

**WHY**: The current grid layout is carousel-based on the homepage but needs proper grid for category/search pages. A responsive grid that looks good from mobile (1 column) to ultrawide (4 columns) ensures content is always readable and scannable. The gap between cards affects scannability — too tight and cards blend together, too loose and users scroll too much.

**BENCHMARK**:
- **Airbnb**: 4-5 columns on desktop, 2 on tablet, 1 on mobile. Cards are uniform size. Gap of ~24px.
- **Fresha**: 1-column list with sidebar map on desktop. Cards are full-width rows.

**HOW**:
- **CSS Grid**: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- **Gap**: `gap-6` (24px) — Airbnb standard
- **Card aspect**: All cards same height (consistent grid). Image is `aspect-[4/3]`, text content below.
- **Homepage**: Keep carousel (swipeable rows per category)
- **Category/search pages**: Switch to grid layout
- **Container padding**: `px-5 md:px-6 lg:px-10 xl:px-20` (matches Roadmap 07 spacing)

**IMPACT**: Clean, scannable grid that adapts to any screen size. Professional, polished feel.

---

### 4.2 Add skeleton loading cards

**WHY**: When salon data is loading, showing nothing (blank space) or a spinner makes the page feel slow and broken. Skeleton loading shows the shape of the content before it arrives, giving users a preview of the layout and making perceived load time feel 50% faster. Both Airbnb and Fresha use this extensively.

**BENCHMARK**:
- **Airbnb**: Shimmer skeleton cards that match exact card dimensions — image rectangle, title line, subtitle line, price line. Gray gradient animates left-to-right.
- **Fresha**: Similar shimmer skeletons, slightly less polished.

**HOW**:
- **File**: New `components/ui/SalonCardSkeleton.tsx`
- **Structure**: Match exact SalonCard dimensions (per your instruction):
  - Image placeholder: `aspect-[4/3] rounded-xl skeleton-shimmer`
  - Title: `h-4 w-3/4 rounded skeleton-shimmer mt-3`
  - Type + location: `h-3 w-1/2 rounded skeleton-shimmer mt-2`
  - Price: `h-3 w-1/4 rounded skeleton-shimmer mt-2`
  - Rating (top-right): `h-3 w-12 rounded skeleton-shimmer mt-3 ml-auto`
- **Shimmer CSS**: Already added to `globals.css` in the `.skeleton-shimmer` class (done in this session)
- **Usage**: Show 8 skeleton cards (filling 2 rows) while `isLoading = true`
- **Transition**: When real data loads, cards fade in with stagger animation, skeletons fade out

**IMPACT**: Page feels fast and responsive even on slow connections. Users see the layout structure immediately and know content is coming. Professional polish that separates good apps from great ones.

---

### 4.3 Empty state design

**WHY**: When filters produce zero results, or a category has no salons, showing nothing is confusing. Users wonder if the page is broken. A well-designed empty state reassures users, explains why there are no results, and suggests what to do next (broaden filters, try a different city).

**BENCHMARK**:
- **Airbnb**: Shows a map zoomed out with "Try adjusting your search" and suggestions to remove filters
- **Fresha**: Shows "No results found" with suggestion to broaden search

**HOW**:
- **File**: New `components/ui/EmptyState.tsx`
- **Design**: 
  - Playful illustration (generate with `generate_image` tool — salon-themed, matches Solen coral brand)
  - Title: `"Keine Salons gefunden"` — `text-xl font-heading font-bold`
  - Subtitle: `"Versuche andere Filter oder eine andere Stadt"` — `text-[#6A6A6A]`
  - CTA button: `"Filter zurücksetzen"` — coral button, resets all filters
  - Secondary link: `"Alle Salons in Basel anzeigen"` — text link
- **Usage**: Rendered when filtered salon list is empty. Also used on search results page with no matches.

**IMPACT**: Users never feel lost. Empty states guide them back to discoverable content instead of dead-ending.

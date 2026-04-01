# Roadmap 06 — Homepage Sections & Content

> **Scope**: Trust stats, review carousel, browse-by-city, SEO pages, 404 page, toast system, PWA
> **DB Status**: Most data exists. Aggregation queries needed. `sonner` toast library needs to be installed (unless ToastProvider already uses a different system — audit first).
> **Already exists**: PWAInstallPrompt, Breadcrumb, ToastProvider (all imported in layout.tsx)
> **Effort**: 🟡 Medium (~40 audit points)

---

## Phase 1: Trust Stats Banner

### 1.1 Add social proof stats strip on homepage

**WHY**: Users visiting Solen for the first time need to immediately understand that this is a real, active platform — not a side project. Trust statistics like "500+ Salons" and "10,000+ Buchungen" provide instant credibility. Fresha shows "450,000+ venues" on their homepage. Airbnb shows "X million stays" in their marketing. These numbers convert skeptics into users.

**BENCHMARK**:
- **Fresha**: Shows "450,000+ partner venues" and "1 billion+ appointments" to establish scale
- **Airbnb**: Shows stats in marketing materials and trust sections

**HOW**:
- **File**: `components/HomePage.tsx`
- **Position**: After the first category carousel, before the "Entdecken" section — this is where users need reassurance after seeing the first row of salons
- **Content**: 3 stats in a horizontally centered row:
  1. `"X+ Salons"` → from `SELECT COUNT(*) FROM salons WHERE is_active = true`
  2. `"X+ Bewertungen"` → from `SELECT SUM(review_count) FROM salons`
  3. `"X+ Buchungen"` → from `SELECT COUNT(*) FROM bookings`
- **Style**: Each stat:
  - Number: `text-[32px] md:text-[40px] font-heading font-bold text-[#222]`
  - Label: `text-[14px] text-[#6A6A6A]`
  - Centered vertically
- **Animation**: Numbers count up from 0 to actual value when the section enters viewport
  - Use `IntersectionObserver` (threshold 0.5) to detect viewport entry
  - Number animation: increment from 0 over 1.5 seconds using `requestAnimationFrame`
  - Each number staggers slightly (100ms delay between stat 1, 2, 3)
  - Only animates once (flag `hasAnimated`)
- **Visual**: Optional subtle coral gradient line below the stats for section separation

**IMPACT**: Instant credibility. Users see "500+ Salons" and feel confident the platform is established. The counting animation draws attention and feels premium.

---

## Phase 2: Browse by City Section

### 2.1 Add "Salons in deiner Nähe" city cards

**WHY**: Geographic browsing is a natural way users discover salons — "show me salons in Zürich." City cards provide a visual, clickable entry point to city-specific pages. This also enables SEO city landing pages (critical for organic growth). When Solen expands beyond Basel, this section automatically grows.

**BENCHMARK**:
- **Airbnb**: "Explore nearby" section with city photo cards showing distance. Each card has a city name, photo, and description.
- **Fresha**: "Popular cities" section with city names and salon counts.

**HOW**:
- **File**: `components/HomePage.tsx` — new section before Partner CTA
- **Cities**: Basel, Zürich, Bern (hardcoded for launch — per your decision)
- **Card design**: 
  - Photo card: 280×200px, `rounded-xl overflow-hidden` with image hover zoom
  - Overlay: City name in bold white text at bottom, with gradient overlay for readability
  - Salon count badge: "42 Salons" in small text below name
- **Photos**: Generate 3 city images using `generate_image` tool (wide-angle architectural shots showing city character — Basel's Rhine, Zürich's Limmat, Bern's old town)
- **Links**: Each card → `/[locale]/[city]/coiffeur` (default to top category for that city)
- **Layout**: Horizontal row of 3 cards on desktop, scrollable on mobile

### 2.2 City sub-links per category

**WHY**: Power users want to jump directly to "Nagelstudios in Zürich" without extra clicks. Category sub-links below city cards provide this shortcut and also create more SEO-valuable URLs.

**HOW**:
- Below each city card, render: `"Coiffeur · Nails · Barbershop · Spa"` as text links
- Each link goes to: `/[locale]/[city]/[category]` (the SEO landing pages from Phase 3)
- Style: `text-[13px] text-[#6A6A6A] hover:text-[#222]`, separated by ` · `

**IMPACT**: Users have multiple entry points into the platform. SEO pages get internal links (important for ranking).

---

## Phase 3: SEO Landing Pages

### 3.1 Create city×category pages

**WHY**: SEO is the #1 organic growth channel for marketplace platforms. When someone Googles "Coiffeur Basel" or "Nagelstudio Zürich", Solen should rank. To rank, we need dedicated pages with city+category content, proper H1 tags, meta descriptions, and structured data. Fresha dominates Google for "hair salon [city]" searches because they have thousands of these pages.

**BENCHMARK**:
- **Fresha**: `/hair-salon/basel-stadt/` with H1 "Hair Salons in Basel-Stadt", description paragraph, listing grid, FAQ section
- **Airbnb**: `/s/Basel/experiences` with dynamic content per city

**HOW**:
- **File**: New `app/[locale]/[city]/[category]/page.tsx`
- **Static generation**: `generateStaticParams()` for all city×category combinations (3 cities × 6 categories = 18 pages)
- **Cities**: `["basel", "zurich", "bern"]` (URL slugs)
- **Categories**: `["coiffeur", "nails", "barbershop", "spa", "makeup", "waxing"]`
- **Page content**:
  1. **H1**: `"Coiffeure in Basel"` — `text-[28px] font-heading font-bold`
  2. **Description paragraph**: Hardcoded per category, SEO-optimized, 100-200 words. Example: "Entdecke die besten Coiffeure und Friseursalons in Basel. Vergleiche Bewertungen, Preise und Verfügbarkeit von über 50 Coiffeur-Salons in Basel und Umgebung."
  3. **Sub-category chips** (from Roadmap 01, 3.1): "Balayage · Haarschnitt · Färben · Extensions"
  4. **Salon grid**: Filtered by category + city (currently by quartier for Basel)
  5. **FAQ section** (3-5 questions with schema markup): "Was kostet ein Haarschnitt in Basel?" / "Wie finde ich den besten Coiffeur?" / "Kann ich online einen Termin buchen?"
- **Dynamic metadata** (Next.js `generateMetadata`):
  ```typescript
  title: `Beste Coiffeure in Basel — Jetzt buchen | Solen`,
  description: `42 Coiffeur-Salons in Basel. ★ Bewertungen, Preise ab CHF 35, Online-Buchung.`
  ```

**IMPACT**: Each page ranks for "category + city" searches. 18 pages × hundreds of long-tail keywords = significant organic traffic growth.

---

### 3.2 JSON-LD structured data

**WHY**: Structured data (Schema.org JSON-LD) tells Google exactly what content is on the page — business name, rating, address, opening hours, price range. This enables rich snippets in search results (star ratings, prices, "Open now" badge) which dramatically increase click-through rate from Google.

**HOW**:
- **File**: `lib/seo.ts` (already exists with `openingHoursSpec`)
- **Add `LocalBusiness` schema** for each salon page:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    "name": "Joliz Zentrum",
    "address": { "@type": "PostalAddress", "streetAddress": "...", "addressLocality": "Basel" },
    "geo": { "@type": "GeoCoordinates", "latitude": 47.56, "longitude": 7.59 },
    "aggregateRating": { "@type": "AggregateRating", "ratingValue": 4.9, "reviewCount": 123 },
    "priceRange": "CHF 35–200"
  }
  ```
- **Add `BreadcrumbList`** for navigation hierarchy
- **Add `FAQPage`** for category landing pages (enables FAQ rich snippets)

---

### 3.3 Generate sitemap.xml

**WHY**: A sitemap tells Google about every URL on the site and how frequently it changes. Without one, Google discovers pages slowly through crawling. With one, all 18 SEO pages + all salon detail pages are indexed within days.

**HOW**:
- **File**: `app/sitemap.ts` (Next.js convention — auto-generates `/sitemap.xml`)
- **Entries**: All salon pages (from DB query), all city×category combos, all static pages (homepage, about, partner)
- **Dynamic**: Runs on build/ISR, queries Supabase for active salon slugs

---

## Phase 4: 404 Page

### 4.1 Build branded 404 page

**WHY**: A generic 404 page is a dead end — the user has nowhere to go. A branded 404 page maintains the Solen experience, provides helpful navigation, and even adds personality. Airbnb's 404 page has a cute illustration and helpful links. A good 404 page converts lost users back into active users.

**BENCHMARK**:
- **Airbnb**: Playful illustration (person tangled in map), "We can't seem to find the page you're looking for", link to homepage and help center
- **Fresha**: Basic 404 page with "Return to homepage" link

**HOW**:
- **File**: `app/not-found.tsx` (Next.js convention)
- **Design**:
  - Illustration: Generate with `generate_image` tool — e.g., a confused/lost character in a salon setting, Solen coral brand colors
  - Title: `"Ups! Diese Seite gibt es nicht"` — `text-[24px] font-heading font-bold`
  - Subtitle: `"Vielleicht wurde sie verschoben oder existiert nicht mehr."` — `text-[#6A6A6A]`
  - CTA: `"Zurück zur Startseite"` — coral button
  - Secondary: `"Salon suchen"` — text link → triggers search
- **Personality**: Add a casual line like `"Hast du dich verlaufen? Wir helfen dir zurück! 💇‍♀️"`

**IMPACT**: Lost users find their way back. The page maintains brand personality instead of feeling like an error.

---

## Phase 5: Toast Notification System

### 5.1 Verify and configure toast system

**WHY**: Toast notifications are the standard feedback mechanism for user actions — "Link copied!", "Saved!", "Booking confirmed!", "Error!". Without toasts, users perform actions (click save, share, submit) and get no visible confirmation, which creates anxiety ("did it work?").

**BENCHMARK**:
- Both Fresha and Airbnb use toast/snackbar notifications for all user actions.

**NOTE**: `<ToastProvider>` already exists in `app/[locale]/layout.tsx` line 32. Need to verify:
1. Is it using `sonner`, `react-hot-toast`, or a custom implementation?
2. Is it wired up and functional?
3. Are components actually using it?

**HOW** (if needs setup/enhancement):
- Check `components/ui/Toast.tsx` for current implementation
- Ensure toast is styled to match Solen brand: rounded-xl, coral accents for success, red for error
- Config: Position `bottom-right` (desktop), `top-center` (mobile)
- **Standard toast messages** to implement across the app:
  - "Link kopiert!" (share actions)
  - "Salon gespeichert ❤️" (heart/save)
  - "Buchung bestätigt ✅" (after booking)
  - "Bewertung gespeichert ⭐" (after review submit)
  - "Keine Verbindung" (offline detection)
  - Error toasts with retry option for failed API calls

---

## Phase 6: Testimonial Carousel

### 6.1 Build customer review testimonial section

**WHY**: Beyond the stats banner, real customer testimonials add emotional proof. Reading "Ich habe endlich meinen Stamm-Coiffeur gefunden!" is more persuasive than seeing "10,000+ Buchungen". This section humanizes the platform and addresses the unspoken question: "Do real people actually use this?"

**BENCHMARK**:
- **Airbnb**: "What guests are saying" with highlighted review quotes from real stays
- **Fresha**: Customer testimonials in marketing sections

**HOW**:
- **File**: New `components/homepage/TestimonialCarousel.tsx`
- **Data**: Initially hardcoded 8-10 testimonials (replace with real data from `reviews` table when volume is sufficient):
  ```typescript
  { quote: "Endlich eine App wo ich alle Salons vergleichen kann!", name: "Mira S.", city: "Basel", rating: 5 }
  ```
- **Card design**: 
  - White card with subtle shadow
  - Quote text in `text-[15px]` with opening quotation mark accent (large, coral, decorative)
  - Name + city: `"— Mira S., Basel"` in `text-[13px] text-[#6A6A6A]`
  - 5-star rating (small, coral)
- **Layout**: Auto-scrolling horizontal carousel (infinite loop, CSS animation)
  - Speed: 30px/sec, smooth `translateX` animation
  - Pause on hover (CSS `animation-play-state: paused`)
- **Position**: After trust stats, before Partner CTA

**IMPACT**: Emotional trust. Users read real stories and feel confident booking. Essential for new user conversion.

---

## Phase 7: PWA & Install

### 7.1 Verify PWA manifest

**WHY**: A PWA install prompt lets users add Solen to their home screen — it looks and feels like a native app without the App Store. This increases return visit rate dramatically, as users see the Solen icon every time they unlock their phone.

**NOTE**: `PWAInstallPrompt` component already exists and is imported in `layout.tsx` line 49. Need to verify:
1. Does `public/manifest.json` exist?
2. Are icons (192×192, 512×512) created?
3. Is the install trigger working?
4. Is `<link rel="manifest">` in the HTML head?

**HOW** (if needs creation/fix):
- **Manifest**: `public/manifest.json` with: `name: "Solen"`, `short_name: "Solen"`, `start_url: "/de"`, `display: "standalone"`, `theme_color: "#E8624A"`, `background_color: "#FFFFFF"`
- **Icons**: Generate 192×192 and 512×512 PNG icons from Solen logo
- **Install prompt**: Show after 3 page views (localStorage counter). Banner: "📱 Solen als App installieren" + "Installieren" button + "Nein danke" dismiss
- **`beforeinstallprompt`** event listener to trigger native install dialog

**IMPACT**: Users with Solen on their home screen return 3× more often than browser-only users. Free acquisition channel.

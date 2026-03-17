# 🏠 Homepage & Sub-site Overhaul Roadmap — FINAL
**For Claude Code — Each numbered section (1.1, 1.2, …) = one prompt. Do not combine.**

---

## 🛑 STOP AND READ BEFORE DOING ANYTHING 🛑

### Pre-Flight Checklist (MANDATORY before every sub-phase)
```
1. Read CLAUDE.md Section 10 (Code Safety Rules) — MANDATORY
2. Read UI_RULES.md — MANDATORY
3. Read _tasks/completed/ — check what's already been done
4. Verify that EVERY import in your code points to a file that EXISTS:
   ls -la components/[Name].tsx    ← if this returns "No such file", DO NOT import it
5. Verify that EVERY fetch("/api/...") calls a route that EXISTS:
   ls -la app/api/[route]/route.ts ← if this returns "No such file", DO NOT call it
6. npm run build MUST pass before git commit
7. ONE commit per sub-phase. NEVER combine multiple phases.
```

### 🚫 BANNED PATTERNS — Instant failure if you do any of these:
| ❌ Banned | ✅ Do Instead |
|-----------|---------------|
| `import QuartierTile from ...` (doesn't exist) | Build inline or create the file FIRST |
| `import ServiceTile from ...` (doesn't exist) | Use existing `<Link>` + lucide icons |
| `import LastMinuteCard from ...` (doesn't exist) | Use existing `<SalonCard>` or build inline |
| `import TutorialTour from ...` (doesn't exist) | SKIP — not in the roadmap |
| `fetch("/api/slots/last-minute")` (doesn't exist) | Use `fetch("/api/salons?sort=rating")` which EXISTS |
| `fetch("/api/reviews?featured=true")` (doesn't exist) | SKIP — not in the roadmap |
| `fetch("/api/salons/search")` (doesn't exist) | SKIP — not in the roadmap |
| `fetch("/api/profile")` (doesn't exist) | SKIP — not in the roadmap |
| Combining all phases into one mega-commit | ONE commit per sub-phase (1.1, 1.2, etc.) |
| Ad-libbing features not in the roadmap | Build ONLY what this roadmap specifies |
| Using emoji characters as UI icons | Use `lucide-react` icons ONLY |

### Components That EXIST (you can import these):
```
components/layout/Header.tsx     ✅ import Header from "@/components/layout/Header"
components/CategoryPage.tsx      ✅ import CategoryPage from "@/components/CategoryPage"
components/SalonCard.tsx         ✅ import SalonCard from "@/components/SalonCard"
components/FilterBar.tsx         ✅ import FilterBar from "@/components/FilterBar"
components/ui/Spinner.tsx        ✅ import Spinner from "@/components/ui/Spinner"
components/ui/EmptyState.tsx     ✅ import EmptyState from "@/components/ui/EmptyState"
components/ui/GlassCard.tsx      ✅ import GlassCard from "@/components/ui/GlassCard"
components/ui/AnimatedButton.tsx ✅ import AnimatedButton from "@/components/ui/AnimatedButton"
components/ui/Toast.tsx          ✅ import { ToastProvider } from "@/components/ui/Toast"
```

### API Routes That EXIST (you can fetch these):
```
/api/salons           ✅ GET — returns { items, total, page, limit }
/api/directory        ✅ GET — returns directory entries
/api/stripe/*         ✅ Payment routes
```

### API Routes That DO NOT EXIST (DO NOT CALL):
```
/api/slots/last-minute  ❌ DOES NOT EXIST — will return 404
/api/reviews            ❌ DOES NOT EXIST — will return 404
/api/salons/search      ❌ DOES NOT EXIST — will return 404
/api/profile            ❌ DOES NOT EXIST — will return 404
```

---

> **⚠️ DESIGN RULES ⚠️**
> - **Light Mode Only.** No dark mode. No glowing borders. Clean glassmorphism only.
> - **Fonts:** Syne (headings), DM Sans (body), Space Grotesk (data/numbers)
> - **Colors:** Teal `#4ECDC4`, Coral `#FF6B6B`, Dark `#1A1A2E`
> - **Icons:** `lucide-react` only. No emojis as UI elements.
> - **Animations:** `framer-motion` only. Smooth 300-400ms transitions. Stagger grids at 200ms.
> - **DO NOT rebuild existing components.** Reuse the ones listed above.
> - **DO NOT add duplicate navigation.** `Header.tsx` already has all nav links.
> - **DO NOT touch `supabase/` or `lib/supabase.ts` unless explicitly told.**

---

## Current Architecture

```
app/[locale]/
├── page.tsx              ← Homepage (currently iframe to monolith — REPLACE)
├── layout.tsx            ← Root layout (has body overflow:hidden — FIX)
├── barbershop/page.tsx   ← CategoryPage component
├── coiffeur/page.tsx     ← CategoryPage component
├── nails/page.tsx        ← CategoryPage component
├── spa/page.tsx          ← CategoryPage component
├── makeup/page.tsx       ← CategoryPage component
├── waxing/page.tsx       ← CategoryPage component
├── last-minute/page.tsx  ← Last-minute deals
├── salon/[slug]/page.tsx ← Individual salon detail
├── checkout/page.tsx     ← Stripe checkout (ALREADY BUILT)
├── auth/                 ← Login/register
├── account/              ← Customer account
├── dashboard/            ← Salon owner dashboard
└── onboarding/           ← Salon registration wizard

components/
├── layout/Header.tsx     ← Global nav (ALREADY BUILT — use it)
├── CategoryPage.tsx      ← Category grid (ALREADY BUILT)
├── SalonCard.tsx         ← Salon card (ALREADY BUILT)
├── FilterBar.tsx         ← Filter pills (ALREADY BUILT)
├── HomePage.tsx          ← EXISTS but unused — build new version
├── ui/Spinner.tsx        ← Loading spinner (ALREADY BUILT)
├── ui/EmptyState.tsx     ← Empty state (ALREADY BUILT)
├── ui/GlassCard.tsx      ← Glassmorphism card (ALREADY BUILT)
└── ui/AnimatedButton.tsx ← Animated button (ALREADY BUILT)

public/home.html          ← 1MB monolith (DO NOT DELETE, keep as backup)
```

---

## 🔁 Status Check Protocol
**After EVERY sub-phase, Claude Code must run this checklist:**

```bash
# ── VERIFICATION CHECKPOINT ──────────────────────────────────────────────
# 1. Build check
npm run build

# 2. If build passes, commit + push
git add -A && git commit -m "phase X.Y: [description]" && git push origin main

# 3. Wait for Vercel deployment
sleep 30
npx vercel ls 2>&1 | head -5
# Confirm status is "● Ready" (not "● Error")
# If Error: check build logs with `npx vercel inspect [URL]`

# 4. Live site check
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/
# Must return 200 or 307 (redirect to locale)

# 5. Check specific route that was changed
curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/[ROUTE]

# 6. PostHog check (if PostHog is configured)
# Verify posthog-js is loaded: check for `posthog` in page source or network tab
# ─────────────────────────────────────────────────────────────────────────
```

> **If any check fails: STOP. Fix the issue before moving to the next sub-phase. Do NOT continue with broken deploys.**

---

# 📅 PHASE 1 — Fix Layout & Global Header

## 1.1 — Fix Layout: Remove overflow:hidden
**File: `app/[locale]/layout.tsx`**

- [ ] Open `app/[locale]/layout.tsx`
- [ ] Find the `<body>` tag
- [ ] Remove `overflow: "hidden"` from the body style — this was only needed for the iframe and it breaks scrolling on ALL pages
- [ ] Keep `margin: 0, padding: 0`

> **✅ GOOD:**
> ```tsx
> <body style={{ margin: 0, padding: 0 }}>
> ```
>
> **❌ BAD:**
> ```tsx
> <body style={{ margin: 0, padding: 0, overflow: "hidden" }}>
> ```

**After 1.1 → Run Status Check Protocol. Verify all existing pages still scroll properly.**

---

## 1.2 — Add Global Header to Layout
**File: `app/[locale]/layout.tsx`**

- [ ] **Check first:** Is `<Header>` already rendered inside `layout.tsx`? If yes, skip this step entirely.
- [ ] If not: import `Header` from `@/components/layout/Header`
- [ ] Add `<Header locale={locale} />` inside the `<body>`, BEFORE `{children}`, but INSIDE the `NextIntlClientProvider`
- [ ] This makes the header automatically appear on every page (homepage, category pages, salon detail, auth, account, dashboard)

> **✅ GOOD:**
> ```tsx
> <body style={{ margin: 0, padding: 0 }}>
>   <NextIntlClientProvider messages={messages}>
>     <Header locale={locale} />
>     {children}
>   </NextIntlClientProvider>
> </body>
> ```
>
> **❌ BAD:**
> ```tsx
> // Header outside provider → translations won't work
> <Header locale={locale} />
> <NextIntlClientProvider messages={messages}>
>   {children}
> </NextIntlClientProvider>
> ```
>
> **❌ BAD:**
> ```tsx
> // Adding a SECOND header component → duplicate nav bars
> import MyNewHeader from "@/components/NewHeader";
> ```

**After 1.2 → Run Status Check Protocol. Open the live site and verify the header appears on `/de/`, `/de/barbershop`, `/de/account`.**

---

## 1.3 — Add Header i18n Keys (if missing)
**File: `messages/de.json`, `messages/en.json`, `messages/fr.json`**

- [ ] Check if the `navigation` namespace exists in each message file
- [ ] If missing, add these keys:
  ```json
  "navigation": {
    "coiffeur": "Coiffeur",
    "barbershop": "Barbershop",
    "nails": "Nails",
    "spa": "Spa & Massage",
    "makeup": "Makeup",
    "waxing": "Waxing",
    "last_minute": "Last Minute",
    "account": "Konto",
    "login": "Anmelden"
  }
  ```
- [ ] Add the same keys in EN and FR with translated values
- [ ] If keys already exist, skip this step

**After 1.3 → Run Status Check Protocol. Verify no i18n errors in console.**

---

# 📅 PHASE 2 — Build Homepage

## 2.1 — Replace Homepage Iframe with Component Shell
**File: `app/[locale]/page.tsx`**

- [ ] Remove the `<iframe src="/home.html" ...>` completely
- [ ] Replace with `<HomePage />` component (import from `@/components/HomePage`)
- [ ] Add `pt-16` to account for the fixed header height
- [ ] If `HomePage.tsx` doesn't exist yet, create a placeholder:
  ```tsx
  export default function HomePage() {
    return <div className="pt-16 min-h-screen">Homepage coming soon</div>;
  }
  ```

**After 2.1 → Run Status Check Protocol. Verify homepage no longer shows the old monolith iframe.**

---

## 2.2 — Homepage Hero Section
**File: `components/HomePage.tsx`**

- [ ] Add a `"use client"` directive at top
- [ ] Import `useLocale` from `next-intl`, `motion` from `framer-motion`
- [ ] Build the hero section:
  - Full-width section with subtle teal-to-white mesh gradient background
  - Extra top padding for the fixed header: `pt-24 pb-12` minimum
  - Big heading: `"Finde deinen Salon in Basel"` — Syne font, bold, `text-3xl sm:text-5xl`
  - Subtitle: `"Coiffeur, Barbershop, Nails, Spa & mehr"` — DM Sans, muted `text-dark/50`
  - NO search bar for V1
  - Framer Motion fade-in: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
  - Centered layout: `max-w-4xl mx-auto text-center px-4`

> **✅ GOOD:** Clean, minimal hero. Gradient background. Large heading. Premium feel. Quick to load.
> **❌ BAD:** Stock photo background. Cluttered text. Search bar that doesn't work. Dark overlay. Giant hero that pushes content below the fold.

**After 2.2 → Run Status Check Protocol. Verify homepage shows the new hero section.**

---

## 2.3 — Homepage Category Grid (Icon Cards)
**File: `components/HomePage.tsx`**

- [ ] Add a section below the hero: `"Kategorien"` heading (optional, or just show the grid)
- [ ] 6 category cards in a grid:
  - **Grid**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4`
  - Each card is a `<Link href={/${locale}/${category}}>`:
    - Glass background: `bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl`
    - `lucide-react` icon, centered, ~32px, teal color
    - Category name: Syne font, medium weight, centered
    - Subtitle: `"Entdecken"` or `"X Salons"` — DM Sans, small, muted
    - Hover: `translateY(-2px)` + subtle shadow increase
  - Use `framer-motion` stagger: `containerVariants` with 200ms between cards

**Icon mapping:**
| Category | lucide-react Icon | Label |
|----------|-------------------|-------|
| Coiffeur | `Scissors` | Coiffeur |
| Barbershop | `Scissors` | Barbershop |
| Nails | `Sparkles` | Nails |
| Spa | `Droplets` | Spa & Massage |
| Makeup | `Palette` | Makeup |
| Waxing | `Zap` | Waxing |

> **✅ GOOD:**
> ```
> ┌──────────┐  ┌──────────┐  ┌──────────┐
> │  ✂️ icon  │  │  ✂️ icon  │  │  ✨ icon  │
> │ Coiffeur │  │Barbershop│  │  Nails   │
> │Entdecken │  │Entdecken │  │Entdecken │
> └──────────┘  └──────────┘  └──────────┘
> ```
> Clean, icon-based, equal spacing, clickable. Each links to `/de/{category}`.
>
> **❌ BAD:** Giant photo tiles. Random stock images. No link to the sub-site. Cards use `<button>` instead of `<Link>`.

**After 2.3 → Run Status Check Protocol. Click each category card on the live site → verify it navigates to the correct category page.**

---

## 2.4 — Homepage Featured Salons Carousel
**File: `components/HomePage.tsx`**

- [ ] Add a section: `"Beliebte Salons"` heading (Syne, bold) + subtitle (DM Sans, muted)
- [ ] Fetch top 8 salons: `GET /api/salons?limit=8&sort=rating`
- [ ] Use `useEffect` + `useState` to fetch on mount
- [ ] Render using the EXISTING `<SalonCard>` component — do NOT create a new card
- [ ] **Horizontal swipable container** (like the Quartier section in the monolith):
  ```tsx
  <div
    className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4"
    style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
  >
    {salons.map(salon => (
      <div key={salon.id} className="snap-start shrink-0 w-[280px] sm:w-[300px]">
        <SalonCard salon={salon} locale={locale} />
      </div>
    ))}
  </div>
  ```
- [ ] Add CSS to hide scrollbar: `.overflow-x-auto::-webkit-scrollbar { display: none }`
- [ ] Optional: add left/right arrow buttons on desktop (glassmorphic circle, teal icon)
- [ ] If API returns empty: show `<EmptyState>` with `"Noch keine Salons — bald verfügbar!"`
- [ ] While loading: show `<Spinner>`

> **✅ GOOD:** Horizontal swipable row of real SalonCards. Snap-scrolls on mobile. Smooth touch interaction.
> **❌ BAD:** A vertical grid (that's for category pages, not homepage). Or a static layout that can't scroll. Or building a completely new card component instead of reusing `SalonCard`.

**After 2.4 → Run Status Check Protocol. On mobile: verify horizontal swipe works. On desktop: verify scroll/arrows work.**

---

## 2.5 — Homepage Last-Minute Teaser Section
**File: `components/HomePage.tsx`**

- [ ] Add a coral-accent section:
  - Background: `bg-gradient-to-r from-coral/5 to-coral/10` or a `GlassCard` with coral border
  - `Clock` icon (lucide-react) + Heading: `"Last-Minute Angebote"` (Syne, bold)
  - Subtitle: `"Spare bis zu 50% auf kurzfristige Termine"` (DM Sans, muted)
  - CTA button: `"Angebote ansehen →"` → `<Link href={/${locale}/last-minute}>`
  - Use `AnimatedButton` component or style the button with coral: `bg-coral text-white hover:bg-coral/90`
  - Framer Motion entrance: slide up when scrolled into view

> **✅ GOOD:** Eye-catching coral accent block with clear CTA. Premium feel. Urgency without being noisy.
> **❌ BAD:** A giant banner ad. Or an unstyled link. Or a fake countdown timer.

**After 2.5 → Run Status Check Protocol.**

---

## 2.6 — Homepage Quartier Section (Swipable Cards)
**File: `components/HomePage.tsx`**

- [ ] Add a section matching the monolith screenshot the user shared:
  - Section label: teal pill badge with `"DEIN QUARTIER"` text
  - Heading: `"Entdecke dein Quartier"` (Syne, bold)
  - Optional: `"Alle ansehen →"` link
- [ ] Horizontal swipable cards for each Basel Quartier:
  - **Quartiers:** Grossbasel, Kleinbasel, Gundeli, St. Johann, Iselin, Bruderholz, Breite
  - Each card: `w-[200px] h-[250px]` with rounded corners (`rounded-2xl`)
  - Background: gradient overlay (`bg-gradient-to-t from-dark/70 to-transparent`) over a placeholder color or photo
  - Quartier name: white, Syne font, bold, bottom-left
  - Subtitle: `"X Salons"` or `"Bald hier"` — white, DM Sans, small
  - Clicking → navigates to `/{locale}/coiffeur?quartier={quartier_slug}`
- [ ] Same horizontal scroll CSS as the Featured Salons section
- [ ] Framer Motion stagger on items

**After 2.6 → Run Status Check Protocol. Verify clicking a Quartier card navigates to the correct filtered category page.**

---

## 2.7 — Homepage Full Footer
**File: `components/layout/Footer.tsx` (NEW) + import in `HomePage.tsx`**

- [ ] Create a new `Footer.tsx` component
- [ ] Background: `#1A1A2E` (dark)
- [ ] Logo: `solen.ch` in white (Syne font)
- [ ] 4 columns (stack on mobile):
  - **Kategorien:** Coiffeur, Barbershop, Nails, Spa, Makeup, Waxing — each a `<Link>` to `/{locale}/{category}`
  - **Unternehmen:** Über uns, Kontakt, Impressum, Datenschutz — links to `#` for now (pages don't exist yet)
  - **Für Salons:** Salon registrieren (`/{locale}/onboarding/salon`), Dashboard (`/{locale}/dashboard`)
  - **Sozial:** Instagram link
- [ ] Bottom bar: `"© 2026 solen.ch — Alle Rechte vorbehalten."` — small text, centered, muted
- [ ] Mobile: columns stack vertically with spacing
- [ ] Consider: also add `<Footer>` to `layout.tsx` so it appears on ALL pages, not just the homepage. If doing this, put it AFTER `{children}`, NOT inside the homepage component.

> **✅ GOOD:** Clean dark footer. Organized columns. All links work. Looks premium.
> **❌ BAD:** A bright white footer. Missing links. No legal text. Cramped on mobile.

**After 2.7 → Run Status Check Protocol. Test all footer links. Verify footer renders on mobile and desktop.**

---

## 2.8 — Homepage Mobile Responsiveness Audit
**No new files. Just test and fix.**

- [ ] Test homepage on mobile viewport (375px wide):
  - Hero: heading `text-2xl` (not `text-5xl`), subtitle wraps cleanly
  - Category grid: 2 columns
  - Featured salons: horizontal swipe — NOT a vertical grid
  - Quartier cards: horizontal swipe
  - Last-Minute teaser: full width, readable
  - Footer: stacked columns
- [ ] Test on tablet (768px):
  - Category grid: 3 columns
  - Featured salons: 2–3 cards visible
- [ ] Header hamburger menu works (it already does via `Header.tsx`)
- [ ] No horizontal overflow on the page (common bug: swipe sections leak)
  - Fix: add `overflow-x: hidden` to the page wrapper, NOT to the scroll container

**After 2.8 → Run full Status Check Protocol. Open live site on mobile (or resize browser). Verify all sections look good.**

---

# 📅 PHASE 3 — Fix & Polish Category Sub-sites

## 3.1 — Fix API Error Handling
**Files: `app/api/salons/route.ts`, `app/api/directory/route.ts`**

- [ ] In `/api/salons/route.ts`: if Supabase returns an error, return `{ items: [], total: 0, page, limit }` with status 200 (NOT 500)
- [ ] In `/api/directory/route.ts`: same — graceful empty response
- [ ] Both: log errors server-side with `console.error("[api/salons]", error.message)` but do NOT crash the page
- [ ] Test: temporarily break the Supabase query → verify the page shows `<EmptyState>` instead of crashing

> **✅ GOOD:**
> ```ts
> if (error) {
>   console.error("[api/salons]", error.message);
>   return NextResponse.json({ items: [], total: 0, page, limit });
> }
> ```
>
> **❌ BAD:**
> ```ts
> if (error) return NextResponse.json({ message: error.message }, { status: 500 });
> ```

**After 3.1 → Run Status Check Protocol. Hit `/api/salons?category=barbershop` and `/api/directory?category=barbershop` — both should return valid JSON.**

---

## 3.2 — Directory Entries: "Nicht buchbar" Badge + Mixed Grid
**File: `components/CategoryPage.tsx`**

- [ ] Change the `DirectoryCard` badge from `"Noch nicht auf Solen"` → `"Nicht buchbar"` (more user-friendly)
- [ ] Style badge: `bg-coral text-white text-xs px-2.5 py-0.5 rounded-full font-medium` — clearly visible
- [ ] **Remove** the `"Mein Salon"` claim button from DirectoryCard — customers don't need this
- [ ] Keep: photo (or `<Building2>` icon placeholder), name, address, phone (`<a href="tel:...">Anrufen</a>`), website link, Google rating
- [ ] **Mix directory entries into the same grid** as registered salons. Registered salons first, then directory entries below — but in ONE unified grid, not two separate sections
- [ ] Make directory cards slightly muted: `opacity-80` or a subtle `bg-gray-50` tint to differentiate from registered salons

> **✅ GOOD:** One unified grid. Registered salons vibrant (full color), directory entries slightly muted with coral "Nicht buchbar" badge. User can still click to call or visit website.
>
> **❌ BAD:** Two completely separate grids. Or directory entries looking identical to registered salons (confusing).

**After 3.2 → Run Status Check Protocol. Open `/de/barbershop` → verify mixed grid with badges.**

---

## 3.3 — Sort Dropdown (4 Options)
**File: `components/FilterBar.tsx`**

- [ ] Add a sort dropdown to the FilterBar (next to existing filter pills)
- [ ] 4 options:
  1. **Beliebteste** (default) — sort by `average_rating` desc
  2. **Preis (tief → hoch)** — sort by average service price asc
  3. **Nächste** — sort by distance (skip if location API not available)
  4. **Neueste** — sort by `created_at` desc
- [ ] Style: glass pill dropdown button → opens a dropdown menu
  - Button: `bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-4 py-2 text-sm`
  - Dropdown: `bg-white shadow-lg rounded-xl border border-gray-100 py-1` with items
  - Active selection: teal text + checkmark icon
- [ ] When user selects a sort, update URL search params (`?sort=rating`) and refetch
- [ ] The `CategoryPage` should read the `sort` param from `searchParams` and pass it to the API

> **✅ GOOD:** Airbnb-style pill dropdown. Clean, compact. Updates URL for shareable links.
> **❌ BAD:** A full `<select>` HTML dropdown. Or a sidebar filter. Or sorting only client-side (breaks pagination).

**After 3.3 → Run Status Check Protocol. Test all 4 sort options on a category page. Verify URL changes.**

---

## 3.4 — Price Display on SalonCard
**File: `components/SalonCard.tsx`**

- [ ] Add an average price display to each salon card
- [ ] Data: fetch `avg_price` from the salon's services. If the API doesn't return this yet, add it to `/api/salons`:
  ```sql
  -- In the API query, add:
  .select("*, services(price)")
  -- Then compute avg in JS
  ```
- [ ] Display format: `"Ø CHF 45"` — Space Grotesk font, small text, muted color
- [ ] Position: on the info row, after the rating: `★ 4.8 (23) · Ø CHF 45`
- [ ] If no services / no price data → don't show anything (no "CHF 0")

> **✅ GOOD:** `★ 4.8 (23) · Ø CHF 45` — clean, compact, one line
> **❌ BAD:** A big CHF badge that dominates the card. Or "CHF 15 – CHF 120" range (too noisy). Or "CHF 0" when no data.

**After 3.4 → Run Status Check Protocol. Verify salon cards show price on category pages.**

---

## 3.5 — Verify All 6 Category Pages + Last-Minute
**No new files. Just test.**

- [ ] Open each page and verify it renders with Header + content + footer:
  ```bash
  for route in barbershop coiffeur nails spa makeup waxing last-minute; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://www.solen.ch/de/$route)
    echo "/de/$route → $STATUS"
  done
  ```
- [ ] All return 200
- [ ] Each page scrolls properly
- [ ] Empty state looks clean (not broken/blank)
- [ ] Sort dropdown appears and works
- [ ] Directory entries have "Nicht buchbar" badge
- [ ] Salon cards show price (if available)

**After 3.5 → Full Status Check Protocol including PostHog: verify page views are being tracked (if PostHog is configured).**

---

# 📅 PHASE 4 — Analytics Algorithm + Admin Panel

## 4.1 — Database: Analytics Tables
**File: `supabase/migrations/017_salon_analytics.sql` (NEW)**

- [ ] Create `salon_analytics` table:
  ```sql
  CREATE TABLE IF NOT EXISTS salon_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_bookings INT DEFAULT 0,
    total_revenue NUMERIC(10,2) DEFAULT 0,
    unique_customers INT DEFAULT 0,
    avg_booking_price NUMERIC(10,2) DEFAULT 0,
    new_customers INT DEFAULT 0,
    returning_customers INT DEFAULT 0,
    cancellation_count INT DEFAULT 0,
    cancellation_rate NUMERIC(5,2) DEFAULT 0,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    most_popular_service TEXT,
    most_popular_time TEXT,
    last_minute_bookings INT DEFAULT 0,
    last_minute_conversion_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(salon_id, period_start, period_end)
  );
  ```
- [ ] Create `salon_page_views` table:
  ```sql
  CREATE TABLE IF NOT EXISTS salon_page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    source TEXT -- 'category_page', 'search', 'direct', 'last_minute'
  );
  CREATE INDEX IF NOT EXISTS idx_page_views_salon ON salon_page_views(salon_id, viewed_at);
  ```
- [ ] Run migration against Supabase (if CLI is set up) or note for manual application

**After 4.1 → Run Status Check Protocol. Verify build still passes (migrations are just SQL files).**

---

## 4.2 — API: Analytics Endpoints
**Files: `app/api/analytics/salon/[id]/route.ts` (NEW), `app/api/analytics/platform/route.ts` (NEW), `app/api/analytics/track-view/route.ts` (NEW)**

- [ ] `GET /api/analytics/salon/[id]`
  - Query params: `period=week|month|quarter|year`
  - Returns aggregated data from `salon_analytics` for the given salon + period
  - Auth: salon owner (`salon.owner_id === user.id`) or admin (`role === 'admin'`)
  - If no analytics yet: return zeroed-out fields (not 404)

- [ ] `GET /api/analytics/platform`
  - Admin only — verify `role === 'admin'` from Supabase user profile
  - Returns: total salons, total bookings (30d), total revenue (30d), total users, avg platform rating
  - Query from raw tables (bookings, salons, profiles) if `salon_analytics` is empty

- [ ] `POST /api/analytics/track-view`
  - Body: `{ salon_id, source }` — source is `'category_page' | 'search' | 'direct' | 'last_minute'`
  - Insert into `salon_page_views`
  - No auth required (anonymous tracking is OK)
  - Rate-limit: max 1 view per salon per session (use cookie or IP)

**After 4.2 → Run Status Check Protocol. Test each endpoint with curl.**

---

## 4.3 — Algorithm: Nightly Analytics Computation
**File: `supabase/functions/compute-analytics/index.ts` (NEW Edge Function) OR a Postgres function**

- [ ] For each salon, compute for periods [7d, 30d, 90d]:
  - `total_bookings` = COUNT completed bookings
  - `total_revenue` = SUM of `final_price` (or `estimated_price`) from completed bookings
  - `unique_customers` = COUNT DISTINCT `user_id`
  - `avg_booking_price` = `total_revenue / total_bookings`
  - `new_customers` = customers whose FIRST-EVER booking at this salon falls within the period
  - `returning_customers` = `unique_customers - new_customers`
  - `cancellation_count` = COUNT cancelled bookings
  - `cancellation_rate` = `cancellation_count / (total_bookings + cancellation_count) * 100`
  - `most_popular_service` = service name with highest booking count
  - `most_popular_time` = hour of day with most bookings (e.g., `"14:00"`)
  - `last_minute_bookings` = bookings where `is_last_minute = true`
- [ ] UPSERT results into `salon_analytics` (conflict on `salon_id + period_start + period_end`)
- [ ] If using Supabase Edge Function: configure cron schedule in `supabase/config.toml` for nightly run (e.g., `0 3 * * *`)
- [ ] If using Postgres: create a `plpgsql` function + `pg_cron` schedule

**After 4.3 → Run Status Check Protocol. Manually trigger the function and verify `salon_analytics` table has rows.**

---

## 4.4 — Admin Panel: Platform Analytics Page
**File: `app/[locale]/dashboard/platform-analytics/page.tsx` (NEW)**

- [ ] Only accessible by `role === 'admin'` — redirect non-admins to `/dashboard`
- [ ] **Section 1: Platform Overview Cards** (4–6 glassmorphic `GlassCard`s in a row)
  - Total salons (active + inactive)
  - Total bookings this month
  - Total revenue this month (CHF)
  - Total registered users
  - Avg platform rating
  - Each card: count-up animation (number goes from 0 to real value) + optional mini sparkline
- [ ] **Section 2: Top Salons Table**
  - Sortable table columns: Salon name, Bookings (30d), Revenue (30d), Avg rating, Page views, Conversion rate
  - Each row clickable → expands to show detailed breakdown
  - Style: clean, minimal borders, Space Grotesk for numbers
- [ ] **Section 3: Charts** (install + use `recharts` if not already installed)
  - Bookings over time — line chart, last 30 days
  - Revenue over time — bar chart, last 12 weeks
  - New vs returning customers — donut/pie chart
  - Category popularity — horizontal bar chart (which categories get most bookings)
- [ ] **Section 4: Customer Insights**
  - Avg price customers spend
  - Most popular booking times — bar chart by hour
  - Customer retention rate

> **✅ GOOD:** Clean glassmorphic dashboard. Count-up animations. Interactive recharts. Real data from APIs. Premium admin feel.
> **❌ BAD:** Raw number dumps. Placeholder/fake data. No charts. Boring table-only layout.

**After 4.4 → Run Status Check Protocol. Log in as admin → navigate to platform analytics → verify data and charts load.**

---

## 4.5 — Add Admin Nav Link
**File: `components/dashboard/DashboardLayout.tsx`**

- [ ] Find the sidebar/navigation list in the dashboard layout
- [ ] Add a new link: `"Plattform Statistiken"` pointing to `/{locale}/dashboard/platform-analytics`
- [ ] Only show this link if the user has `role === 'admin'`
- [ ] Icon: `BarChart3` from `lucide-react`

**After 4.5 → Run Status Check Protocol. Verify admin sees the link; non-admin does NOT see it.**

---

# 📅 PHASE 5 — Page View Tracking + PostHog Integration

## 5.1 — Track Salon Page Views
**File: `app/[locale]/salon/[slug]/page.tsx`**

- [ ] On mount, fire: `POST /api/analytics/track-view` with `{ salon_id, source: "direct" }`
- [ ] Use `useEffect` with the salon ID as dependency — fire once per page load
- [ ] Don't block rendering — fire-and-forget (no `await`)
- [ ] Optional: use Intersection Observer on category page cards to track impressions

**After 5.1 → Run Status Check Protocol. Open a salon page → check `salon_page_views` table in Supabase → verify a row was inserted.**

---

## 5.2 — Verify PostHog is Tracking
**No code changes unless PostHog is not configured.**

- [ ] Check if `posthog-js` is already installed: `grep posthog package.json`
- [ ] If installed: verify events are flowing to PostHog dashboard
- [ ] If NOT installed:
  - `npm install posthog-js`
  - Add `PostHogProvider` in layout.tsx
  - Configure with the PostHog project API key from env: `NEXT_PUBLIC_POSTHOG_KEY`
- [ ] Verify in PostHog dashboard: page views are appearing for `/de/`, `/de/barbershop`, etc.

**After 5.2 → Run Status Check Protocol + check PostHog dashboard for live events.**

---

# 📅 PHASE 6 — Payment: TWINT + Apple Pay

## 6.1 — 🧑‍💻 MANUAL: Enable Payment Methods in Stripe Dashboard
> **The user must do these steps at https://dashboard.stripe.com. Claude Code cannot do this.**

- [ ] Go to **Settings → Payment methods**
- [ ] Enable **TWINT** (requires CHF currency enabled)
- [ ] Enable **Apple Pay**:
  - Register domains: `solen.ch` and `www.solen.ch`
  - Download the domain verification file
- [ ] Enable **Google Pay** (usually auto-enabled)
- [ ] Optional: enable **Stripe Link** for returning customers

---

## 6.2 — Apple Pay Domain Verification File
**File: `public/.well-known/apple-developer-merchantid-domain-association` (NEW)**

- [ ] Place the Apple Pay domain verification file from Stripe at this exact path
- [ ] It MUST be served at `https://solen.ch/.well-known/apple-developer-merchantid-domain-association`
- [ ] Test: `curl -s https://www.solen.ch/.well-known/apple-developer-merchantid-domain-association | head -1`
  - Should return the file content, NOT a 404

**After 6.2 → Run Status Check Protocol. Verify the file is accessible on the live site.**

---

## 6.3 — Verify Checkout UI
**File: `app/[locale]/checkout/page.tsx`**

- [ ] Verify `<PaymentElement options={{ layout: "tabs" }} />` is present — it auto-shows all enabled methods
- [ ] Update trust badges (line ~261) to include Google Pay:
  ```tsx
  <span className="flex items-center gap-1"><CreditCard size={11} /> Card, TWINT, Apple Pay, Google Pay</span>
  ```
- [ ] No other code changes needed — Stripe's `PaymentElement` automatically renders all enabled methods

**After 6.3 → Run Status Check Protocol. Open checkout page → verify payment method tabs show.**

---

## 6.4 — End-to-End Payment Test
**Manual test by user after deploy.**

- [ ] Navigate: salon page → "Jetzt buchen" → select service + time → checkout
- [ ] Checkout shows: booking summary, deposit info, payment tabs
- [ ] Test with Stripe test card: `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] After payment: redirect to success page
- [ ] Verify in Stripe Dashboard: payment appears
- [ ] Verify webhook: `payment_intent.succeeded` received
- [ ] Verify Supabase: booking `payment_status` = `deposit_held`

---

# 📅 PHASE 7 — Final Polish & Cross-Page Audit

## 7.1 — Header Consistency Check
- [ ] Open each page type and verify Header renders:
  - Homepage `/de/`
  - Category pages `/de/barbershop`, `/de/coiffeur`, etc.
  - Last-minute `/de/last-minute`
  - Salon detail `/de/salon/[any-slug]`
  - Account `/de/account`
  - Auth `/de/auth/login`, `/de/auth/register`
  - Dashboard `/de/dashboard`
- [ ] Active nav link is highlighted teal
- [ ] Scroll: transparent → solid glass transition works

---

## 7.2 — Mobile Audit
- [ ] Horizontal swipe sections work on iOS Safari and Chrome Android
- [ ] No horizontal page overflow on any page
- [ ] Touch targets: all buttons at least 44×44px
- [ ] Footer stacks properly on mobile
- [ ] Hamburger menu opens and all links work

---

## 7.3 — Remove Monolith References
- [ ] `app/[locale]/page.tsx` no longer has iframe ✓
- [ ] Keep `public/home.html` as backup (DO NOT DELETE)
- [ ] Remove `src/react-entry.tsx` reference if causing 404s
- [ ] Clean up any console errors in browser dev tools

---

## 7.4 — Final Vercel + PostHog Status Check
```bash
# Full deployment verification
npx vercel ls 2>&1 | head -5  # ● Ready

# All routes return 200
for r in "" barbershop coiffeur nails spa makeup waxing last-minute; do
  echo "/de/$r → $(curl -s -o /dev/null -w '%{http_code}' https://www.solen.ch/de/$r)"
done

# PostHog: check events flowing (login to PostHog dashboard)
# Stripe: check webhooks are being received (Stripe Dashboard → Developers → Webhooks)
```

---

## File Reference

| File | Action | Phase |
|------|--------|-------|
| `app/[locale]/layout.tsx` | FIX: overflow, add Header | 1.1–1.2 |
| `messages/de.json` etc. | ADD: navigation i18n keys | 1.3 |
| `app/[locale]/page.tsx` | REPLACE: iframe → `<HomePage />` | 2.1 |
| `components/HomePage.tsx` | REBUILD: full landing page | 2.2–2.7 |
| `components/layout/Footer.tsx` | NEW: full footer | 2.7 |
| `app/api/salons/route.ts` | FIX: graceful error handling | 3.1 |
| `app/api/directory/route.ts` | FIX: graceful error handling | 3.1 |
| `components/CategoryPage.tsx` | MODIFY: mixed grid, badges | 3.2 |
| `components/FilterBar.tsx` | MODIFY: sort dropdown | 3.3 |
| `components/SalonCard.tsx` | MODIFY: avg price display | 3.4 |
| `supabase/migrations/017_salon_analytics.sql` | NEW: analytics tables | 4.1 |
| `app/api/analytics/*/route.ts` | NEW: 3 analytics endpoints | 4.2 |
| `supabase/functions/compute-analytics/` | NEW: nightly algo | 4.3 |
| `app/[locale]/dashboard/platform-analytics/page.tsx` | NEW: admin dashboard | 4.4 |
| `components/dashboard/DashboardLayout.tsx` | MODIFY: admin nav link | 4.5 |
| `app/[locale]/salon/[slug]/page.tsx` | MODIFY: track views | 5.1 |
| `public/.well-known/apple-developer-merchantid-domain-association` | NEW: Apple Pay | 6.2 |
| `app/[locale]/checkout/page.tsx` | VERIFY: trust badges | 6.3 |

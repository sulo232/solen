# Solen — Living Component Design Specs
> **For Claude Code:** Read this file before touching ANY component. Every section maps a Solen component to a real-world reference design and gives exact pixel specs. This file is the source of truth. It grows as we design more components.

---

## How to Use This File
1. Find the component you're about to change
2. Read the reference (what it should look like and why)
3. Read the exact specs (exact values — do not guess or use defaults)
4. Implement exactly as specified — ask if unclear

---

## Design Tokens (Global — Never Deviate)

```
Colors:
  --s-coral:      #E8624A   (primary CTA, accents, active states)
  --s-ink:        #1A1209   (all body text, icons)
  --s-ink-60:     rgba(26,18,9,0.60)   (secondary text)
  --s-ink-08:     rgba(26,18,9,0.08)   (borders, dividers)
  --s-bg:         #FFFFFF   (ALL backgrounds — never use cream/beige)
  --s-sage:       #3D7A5A   (availability/success states)

Typography:
  font-display:  "Bebas Neue"  — headlines ≥40px ONLY
  font-heading:  "Syne"        — subheadings, labels, nav, card names
  font-body:     "DM Sans"     — body text, descriptions, metadata

Spacing scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64px
Border radius:
  --radius-card:   12px   (image containers, cards)
  --radius-pill:   9999px (badges, chips, buttons)
  --radius-input:  10px   (inputs, small containers)

Shadows:
  elevation-1: 0 1px 3px rgba(26,18,9,.04), 0 4px 16px rgba(26,18,9,.05)
  elevation-2: 0 2px 8px rgba(26,18,9,.08), 0 8px 32px rgba(26,18,9,.10)
```

---

## 1. HEADER / NAV
**File:** `components/layout/Header.tsx`
**Reference:** Fresha.com nav

### What Fresha does (the benchmark)
- Pure white background, no blur at top
- Logo left, minimal right actions only (Log in, CTA button, Menu)
- NO category icons in the main header navigation
- Clean sans-serif, ~14px for nav links
- On scroll: stays white, adds `box-shadow: 0 1px 0 rgba(0,0,0,0.08)`
- Category navigation lives BELOW the hero, not in the header itself

### What Solen should do
- Keep the glass blur header (it's good) BUT:
- **Remove the 3D emoji-style category icons from the header entirely**
  - Files to delete: `components/icons/category/CoiffeurIcon.tsx`, `BarberIcon.tsx`, `NailsIcon.tsx`, `SpaIcon.tsx`, `MakeupIcon.tsx`, `WaxingIcon.tsx`
- Replace with text-only nav links on desktop (Airbnb pattern)
- Category nav moves to a sticky pill-strip BELOW the hero search bar
- Keep the compact search pill that appears on scroll (this is good)

### Exact Specs
```
Header height (unscrolled): 64px
Header height (scrolled): 56px
Background: rgba(255,255,255,0.92) with backdrop-filter: blur(20px)
Border bottom scrolled: 1px solid rgba(26,18,9,0.08)
Shadow scrolled: 0 1px 0 rgba(26,18,9,0.06)

Logo: src="/logo.svg", height: 28px, margin-left: 24px (desktop)

Desktop nav links (unscrolled, centered):
  Font: DM Sans, 14px, font-weight: 500
  Color: #1A1209 (active) / rgba(26,18,9,0.55) (inactive)
  Active indicator: 2px solid #1A1209 underline (not coral)
  Gap between links: 32px
  Links: Discover · Coiffeur · Nails · Barbershop · Makeup · Waxing

Right actions:
  - Language switcher (keep as is)
  - Notification bell (keep as is)
  - Profile button (keep as is)
  - Hamburger for mobile (keep as is)
```

---

## 2. SALON CARD
**File:** `components/SalonCard.tsx`
**Reference:** Fresha.com "Recommended" section cards

### What Fresha does (the benchmark)
- Card is just an image + text below, zero border, zero shadow on the card itself
- Image: 16:9 or 4:3 landscape ratio (NOT portrait 4:5)
- Image has rounded corners: ~12px
- Below image (24px from image): 
  - Line 1: Name (bold, ~15px) + Star rating right-aligned
  - Line 2: Address/location (~13px, gray)
  - Line 3: Category type (~13px, gray)
- No price shown on the card (Fresha shows price on detail page)
- NO decorative badges/pills overlaid on image (except "Top Rated" which is subtle)
- Favorite heart: top-right of image, white fill, drop-shadow

### What Solen's SalonCard should do
- Keep the 4:5 portrait ratio (good for aesthetic)
- **Remove the `$$` price placeholder** — only show price if `priceToShow != null`, which it already does. Fix: ensure the price line only renders when there's a real value (it does, but the `$$` symbol appearing means `min_price` is being set to a mock value somewhere)
- Simplify the info section: Name + Rating | Location + Category | Price (if real) | Next slot (if today/tomorrow only)
- **Remove** the `$$ ·` currency indicator display — show just `from CHF 45` or nothing
- Keep photo carousel dots (good UX)
- Remove the overwhelming badge system for now — keep only "Top bewertet" (top rated) badge

### Exact Specs
```
Card container: no border, no shadow, no background color
  border-radius: 0 (on the card itself)
  
Image container:
  aspect-ratio: 4/5 (keep current)
  border-radius: 12px
  overflow: hidden

Info section (mt-3):
  gap between lines: 2px

Line 1 — Name + Rating:
  Name: font-family: "Syne", font-weight: 600, font-size: 15px, color: #1A1209
  Rating: font-family: "DM Sans", font-size: 14px, font-weight: 600, color: #1A1209
  Star icon: 14px, fill: #E8624A, stroke: #E8624A
  Review count: font-size: 13px, color: rgba(26,18,9,0.55)

Line 2 — Location:
  font-family: "DM Sans", font-size: 14px, color: rgba(26,18,9,0.55)
  Format: "{Category} · {Quartier}"
  
Line 3 — Price (only if priceToShow != null):
  font-family: "DM Sans", font-size: 14px, color: rgba(26,18,9,0.55)
  Format: "ab CHF {price}"

Line 4 — Next slot (only if today or tomorrow):
  font-family: "DM Sans", font-size: 13px, color: #3D7A5A (sage)

Favorite button:
  Position: absolute top-2 right-2
  Size: 36x36px touch target
  Icon: Heart, 22px, stroke: white, drop-shadow(0 1px 2px rgba(0,0,0,0.50))
  Favorited state: fill: #E8624A, stroke: #E8624A
```

---

## 3. CAROUSEL SECTION HEADER
**File:** `components/ui/FeaturedSalonCarousel.tsx`
**Reference:** Fresha.com section headers ("Recommended", "New to Fresha")

### What Fresha does
- Section title: large, bold, left-aligned, ~28-32px, black
- Subtitle/tag: small gray text below, "Top rated · Available now"
- "See all →" link: right-aligned, same row as title, ~14px, underlined on hover
- Zero decorative elements — pure typography hierarchy

### Exact Specs
```
Section container:
  padding: 0 24px (mobile) / 0 48px (desktop → match layout padding)
  margin-bottom: 40px

Title row (flex, justify-between, align-center):
  Title:
    font-family: "Syne", font-weight: 700, font-size: 24px
    color: #1A1209
    line-height: 1.2
    
  "Alle ansehen →" link:
    font-family: "DM Sans", font-size: 14px, font-weight: 500
    color: #1A1209
    text-decoration: none
    hover: text-decoration: underline
    Arrow: → (text, not an icon component)
    
Subtitle (below title):
  font-family: "DM Sans", font-size: 14px, color: rgba(26,18,9,0.55)
  Format: "Top bewertet · Sofort buchbar"
  margin-top: 4px

Gap between title row and cards: 16px
```

---

## 4. TRUST STATS BANNER
**File:** `components/TrustStatsBanner.tsx`
**Reference:** N/A — Fresha doesn't have this. Design from scratch.

### Current problem
- Background is `#FAF6EF` (cream) — creates jarring break on white page
- Cards have excessive shadow for a stats block

### Fixed design
```
Section background: #FFFFFF (white, matches page)
Border-top: 1px solid rgba(26,18,9,0.06)
Border-bottom: 1px solid rgba(26,18,9,0.06)
Padding: 40px 48px

Stat cards — remove the card wrapper entirely:
  Instead: 3 stats inline, separated by a vertical divider line
  Layout: flex, justify-center, gap: 48px
  
Each stat:
  Number: font-family: "Syne", font-weight: 800, font-size: 32px, color: #1A1209
  Label: font-family: "DM Sans", font-size: 14px, color: rgba(26,18,9,0.55)
  Number format: "500+" / "5,000+" / "10,000+"
  NO icon — remove the icon boxes entirely (they look dated)

Dividers between stats:
  width: 1px, height: 40px, background: rgba(26,18,9,0.12)
```

---

## 5. HOMEPAGE HERO
**File:** `components/ui/HomepageHero.tsx`
**Reference:** Fresha.com hero

### What Fresha does
- Gradient background (purple/blue mesh gradient) — full bleed, no card
- Headline: large serif or bold sans, centered, ~80px
- Subtitle: ~18px, lighter weight, centered, short (1 line)
- Search bar: rounded pill, white, centered below subtitle, wide (680px max)
- Trust signal: small text below search ("670,000 appointments booked today")
- NO category chips below search (they live in the category bar below the hero)

### What Solen should do
Keep the dramatic Bebas Neue headline BUT:

```
Hero background:
  gradient: radial-gradient(ellipse 120% 100% at 50% -20%, rgba(232,98,74,0.06) 0%, transparent 60%),
            #FFFFFF
  (very subtle coral tint at top, fades to pure white — no blue/purple)

Eyebrow:
  REMOVE the dot · TERMIN · dot eyebrow — it's dated
  
Headline:
  Keep Bebas Neue + coral accent word
  Reduce size: clamp(56px, 7.5vw, 88px) — currently too massive at 108px
  Line height: 0.9
  margin-bottom: 24px (was 4px, too tight)

Subtitle:
  Keep as is but: font-size: 17px, max-width: 360px, color: rgba(26,18,9,0.55)
  margin-bottom: 32px

Search bar: keep AirbnbSearchBar as is (it's good)
  max-width: 680px, margin: 0 auto

Category chips (below search):
  REMOVE — move this navigation to the sticky category strip below the hero
  
Trust signal (bottom):
  Keep the "4.8 · 2,400+ Reviews · Free booking" line
  font-size: 13px, color: rgba(26,18,9,0.45)
  margin-top: 20px
  Separator: · (middle dot, not bullet)

Hero total padding:
  padding-top: 80px (was 56px — needs more breathing room)
  padding-bottom: 40px
```

---

## 6. CATEGORY STICKY STRIP
**File:** `components/layout/CategoryStickyRow.tsx` (or inline in Header)
**Reference:** Airbnb.com category strip

### What Airbnb does
- Horizontal scrollable row of category pills
- Each pill: icon (SVG line art, ~24px) + label below
- Active pill: underline indicator (not filled/colored)
- Background: white, full width, sticky below header
- No shadow — just a 1px bottom border when scrolled

### Exact Specs
```
Container:
  position: sticky, top: 64px (header height)
  background: #FFFFFF
  border-bottom: 1px solid rgba(26,18,9,0.08)
  height: 80px
  overflow-x: auto, scrollbar-hide
  z-index: 40

Each pill (Link):
  display: flex, flex-direction: column, align-items: center
  gap: 6px
  padding: 12px 16px
  cursor: pointer
  position: relative

  Icon: SVG line art, 24x24px, stroke: rgba(26,18,9,0.55) (inactive) / #1A1209 (active)
  Label: font-family: "DM Sans", font-size: 12px, font-weight: 500
         color: rgba(26,18,9,0.55) (inactive) / #1A1209 (active)

  Active indicator:
    position: absolute, bottom: 0, left: 0, right: 0
    height: 2px, background: #1A1209, border-radius: 2px

  Category list: Entdecken · Coiffeur · Nägel · Barbershop · Makeup · Waxing
```

---

## 7. LAST MINUTE STRIP
**File:** `components/ui/LastMinuteStrip.tsx`
**Feature:** Horizontal scrollable bar showing discounted last-minute slots
**DO NOT REMOVE** — this is a core revenue feature

### Current state (keep, only restyle)
- Full-width coral (#E8624A) background bar
- Left label + scrollable slot cards + "view all" link
- Each card shows: salon name, time, category, discount badge

### What to fix
- The strip itself is good — the coral background is intentional and stands out correctly
- Only issue: slot cards use `rgba(255,255,255,.12)` bg — make slightly more visible

### Exact Specs
```
Container: keep background #E8624A, keep full-width

Slot cards:
  background: rgba(255,255,255,0.15)  (was 0.12 — slightly more contrast)
  border: 1px solid rgba(255,255,255,0.22)  (was 0.18)
  border-radius: 12px
  padding: 10px 14px
  hover: background rgba(255,255,255,0.22)

  Salon name: font-family: "Syne", 13px, font-weight: 600, color: #FFFFFF
  Time + category: font-family: "DM Sans", 11px, color: rgba(255,255,255,0.75)
  Discount badge: font-family: "Syne", 12px, font-weight: 700

Everything else: KEEP AS IS — the strip works well
```

---

## 8. DISCOVER CAROUSEL
**File:** `components/ui/DiscoverCarousel.tsx`
**Feature:** Pinterest-style TikTok/discovery content carousel
**DO NOT REMOVE** — this drives user engagement

### What to fix
- The carousel itself is fine functionally
- Only restyle the section header above it (eyebrow + title)

### Exact Specs
```
Section header (in HomePage.tsx, not the component itself):
  Eyebrow: REMOVE the coral eyebrow text — unnecessary visual clutter
  Title:
    font-family: "Syne", font-weight: 700, font-size: 24px, color: #1A1209
    (match the carousel section headers from spec #3)
  "Katalog entdecken →" link:
    font-family: "DM Sans", 14px, font-weight: 500, color: #1A1209
    hover: text-decoration: underline
    (NOT coral — match section header pattern)

Carousel cards: KEEP AS IS — the 4:5 portrait cards work
Scroll arrows: KEEP AS IS
```

---

## 9. REBOOK CARD
**File:** Inline in `components/HomePage.tsx` (~line 172-190)
**Feature:** "Wieder buchen?" prompt for logged-in users with past bookings
**DO NOT REMOVE** — this is a retention feature

### What to fix
- Card styling is fine, just align fonts to spec

### Exact Specs
```
Container:
  border: 1px solid rgba(26,18,9,0.08)
  border-radius: 16px
  background: #FFFFFF
  padding: 16px
  KEEP the RefreshCw icon in the 40x40 box

Text:
  Title: font-family: "Syne", font-weight: 600, 15px, color: #1A1209
  Subtitle: font-family: "DM Sans", 14px, color: rgba(26,18,9,0.55)

CTA button:
  background: #E8624A, color: white
  font-family: "Syne", 14px, font-weight: 600
  border-radius: 10px (not pill — it's a button, not a tag)
  height: 40px, padding: 0 20px
```

---

## 10. RECENTLY VIEWED
**File:** `components/RecentlyViewed.tsx`
**Feature:** Horizontal scroll of recently viewed salons from localStorage
**DO NOT REMOVE**

### What to fix
- Uses `dark:` classes that don't apply (no dark mode) — remove them
- Clock icon in header feels dated — remove icon, keep text only
- Card width too small (140px) — make slightly wider

### Exact Specs
```
Section header:
  REMOVE Clock icon — just the title text
  Title: font-family: "Syne", font-weight: 700, font-size: 24px, color: #1A1209
  (match other section headers)

Cards:
  width: 180px (was 140/160px)
  Image: height 120px (was 100px), border-radius: 12px
  Name: font-family: "Syne", 14px, font-weight: 600, color: #1A1209
  Rating: font-family: "DM Sans", 12px, color: rgba(26,18,9,0.55)
  Star icon: 10px, fill: #E8624A

Remove ALL dark: class variants — there is no dark mode
```

---

## 11. BROWSE BY CITY
**File:** `components/BrowseByCitySection.tsx`
**Feature:** Dark section with large city names (Basel, Zürich, Bern)
**DO NOT REMOVE** — this is SEO + navigation

### Current state
- Dark background (#100602), large Bebas Neue city names, hover animations
- Category pills at bottom
- This section actually looks GOOD — it's one of the best on the page

### What to fix
- Almost nothing — it's well-designed already
- Only fix: the "Entdecken" text in hover state should be translated (it's hardcoded German)

### Exact Specs
```
KEEP EVERYTHING AS IS except:
  - Line 107: Change hardcoded "Entdecken" to use translation: tNav("discover") or t("cities.explore")
  - Ensure the translation key exists in all 4 locale files

That's it — don't restyle this section, it works.
```

---

## 12. TESTIMONIAL CAROUSEL
**File:** `components/TestimonialCarousel.tsx`
**Feature:** 3-column grid of user testimonial cards
**DO NOT REMOVE**

### What to fix
- Background is `#FDFAF6` (warm cream) — doesn't match white page
- Eyebrow pattern is dated (small caps coral text)

### Exact Specs
```
Section background: #FFFFFF (was #FDFAF6)

Section header:
  REMOVE the coral eyebrow text
  Title: font-family: "Syne", font-weight: 700, font-size: 24px, color: #1A1209
  (match other section headers — consistent pattern)

Testimonial cards:
  background: #FFFFFF
  border: 1px solid rgba(26,18,9,0.08)
  border-radius: 16px
  padding: 24px
  shadow: 0 1px 3px rgba(26,18,9,.04)  (lighter than current)
  hover: translateY(-2px), shadow: 0 4px 16px rgba(26,18,9,.08)

  Star row: KEEP AS IS (coral filled stars)
  Quote: font-family: "DM Sans", 14px, color: #1A1209, line-height: 1.6
  Divider: 1px solid rgba(26,18,9,0.06)
  Avatar circle: KEEP (the colored initials look good)
  Name: font-family: "Syne", 13px, font-weight: 600, color: #1A1209
  City: font-family: "DM Sans", 11px, color: rgba(26,18,9,0.55)
```

---

## 13. PARTNER CTA
**File:** Inline in `components/HomePage.tsx` (~line 204-279)
**Feature:** Dark card promoting salon owner sign-up
**DO NOT REMOVE** — this is the B2B conversion block

### Current state
- Dark rounded card (#1A0806) with ambient glows
- Left: copy + checklist + CTA button
- Right: frosted stat cards
- This section looks GOOD — premium dark card design

### What to fix
- Very minor: the eyebrow pattern (small caps coral) should match — but here it works because it's on dark background
- Keep everything as is

### Exact Specs
```
KEEP EVERYTHING AS IS
This is one of the best-designed sections. Do not change it.
```

---

## 14. FOOTER
**File:** `components/layout/Footer.tsx`
**Feature:** 3-column footer with links, social, language switcher
**DO NOT REMOVE**

### Current state
- Dark background (#2C2825), 3-column grid, copyright row
- Clean and functional

### What to fix
- Background could be slightly darker for more contrast with page
- Otherwise fine

### Exact Specs
```
Background: #1A1209 (match site ink color — was #2C2825, slightly warm gray)
Otherwise KEEP EVERYTHING AS IS — footer is clean
```

---

## Execution Order (for Claude Code)

1. Trust Stats Banner (#4) — quickest win, most jarring issue
2. Homepage Hero (#5) — biggest visual impact
3. Testimonial Carousel (#12) — cream bg fix
4. Carousel Section Headers (#3) — typography hierarchy
5. Salon Card (#2) — card refinement
6. Header/Nav (#1) — icon replacement (most complex)
7. Category Sticky Strip (#6) — new component
8. Recently Viewed (#10) — cleanup
9. Last Minute Strip (#7) — minor tweak
10. Discover Section Header (#8) — header consistency
11. Rebook Card (#9) — font alignment
12. Footer (#14) — bg color tweak
13. Browse By City (#11) — translation fix only
14. Partner CTA (#13) — no changes needed

---

## Pages Remaining (to be spec'd next)

- [ ] Category listing page (`/coiffeur`, `/nails`, etc.)
- [ ] Search results page
- [ ] Salon detail page
- [ ] Booking flow

---

*Last updated: 2026-04-04 — Component count: 14*
*Reference sites: Fresha.com, Airbnb.com, Treatwell.com*

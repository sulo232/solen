# Design Study — Airbnb & Fresha

> **Purpose:** Raw design intelligence from both platforms. Use this as reference when making any design decision for Solen.
> **NOT a comparison.** Just the facts about how these two products are built.

---

## AIRBNB — Complete Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| Rausch Red | `#FF385C` | CTAs, hearts, brand accent — used VERY sparingly |
| Deep Rausch | `#E00B41` | Pressed/hover state of red |
| Near Black | `#222222` | ALL primary text |
| Focused Gray | `#3F3F3F` | Focused input text |
| Secondary Gray | `#6A6A6A` | Descriptions, secondary text |
| Disabled | `rgba(0,0,0,0.24)` | Disabled states |
| Border | `#C1C1C1` | Borders |
| Surface | `#F2F2F2` | Button backgrounds, surfaces |
| White | `#FFFFFF` | Page background — always pure white |
| Legal Blue | `#428BFF` | Links |
| Error | `#C13515` | Error text |
| Luxe Purple | `#460479` | Luxe tier only |
| Plus Magenta | `#92174D` | Plus tier only |

**Key insight:** The entire Airbnb UI is essentially 4 colors: white bg, near-black text, gray secondary, red accent. Everything else is photography.

### Typography

**Font:** Airbnb Cereal VF (variable font). Fallbacks: Circular, -apple-system, system-ui, Roboto, Helvetica Neue.

**No display font.** No serif. No condensed. No uppercase headlines. One font family, different weights.

| Role | Size | Weight | Line Height | Letter Spacing |
|---|---|---|---|---|
| Section Heading | 28px | 700 | 1.43 | normal |
| Card Heading | 22px | 600 | 1.18 | -0.44px |
| Sub-heading | 21px | 700 | 1.43 | normal |
| Feature Title | 20px | 600 | 1.20 | -0.18px |
| UI / Button | 16px | 500-600 | 1.25 | normal |
| Body / Link | 14px | 400 | 1.43 | normal |
| Body Medium | 14px | 500 | 1.29 | normal |
| Small | 13px | 400 | 1.23 | normal |
| Tag | 12px | 400-700 | 1.33 | normal |
| Badge | 11px | 600 | 1.18 | normal |
| Micro | 8px | 700 | 1.25 | 0.32px |

**Key insight:** The type scale is tight — section headings are only 28px. Card headings are 22px. Nothing is huge. The hierarchy is created through weight, not size. This makes the content feel dense and readable, not shouty.

### Spacing

**Base unit:** 8px

**Scale:** 2, 3, 4, 6, 8, 10, 11, 12, 15, 16, 22, 24, 32

**Key insight:** Airbnb's spacing is tighter than most people think. Cards are close together. The density makes it feel "full" and "real" — like a marketplace with lots of options.

### Border Radius

| Usage | Radius |
|---|---|
| Subtle (inputs) | 4px |
| Standard (buttons, tabs) | 8px |
| Badges | 14px |
| Cards | **20px** |
| Large (modals) | 32px |
| Circular (avatars) | 50% |

**Key insight:** Card radius 20px is generous. Buttons are 8px — NOT pill-shaped. Airbnb buttons are rectangular with slight rounding, not capsules.

### Shadows

**Card (resting):**
```css
box-shadow:
  rgba(0,0,0,0.02) 0px 0px 0px 1px,    /* ultra-subtle border */
  rgba(0,0,0,0.04) 0px 2px 6px,          /* soft ambient */
  rgba(0,0,0,0.1) 0px 4px 8px;           /* primary lift */
```

**Card (hover):**
```css
box-shadow: rgba(0,0,0,0.08) 0px 4px 12px;
```

**Focus ring:**
```css
box-shadow: 0 0 0 2px var(--palette-grey1000);
transform: scale(0.92);
```

**Key insight:** Three-layer shadow on cards. No warm tinting. Pure black at very low opacity. The shadow is felt, not seen. Hover doesn't add translateY — just deepens shadow.

### Cards

- **Background:** `#FFFFFF`
- **Radius:** 20px
- **Image aspect ratio:** 16:10
- **Image fills the card** — no padding between image and card edge
- **Image carousel** with dot indicators
- **Heart button** overlay on image (top-right)
- **Below image:** title (22px/600), location (14px/400 gray), price, rating
- **Badge:** "Guest Favorite" — shown on ~10% of cards, not every card
- **No border** — shadow provides the visual edge
- **Hover:** shadow deepens, no movement (no translateY, no scale)

**Key insight:** The card is 80% image. The image IS the product. Text below is minimal — name, location, price, rating. No description, no category label, no service count.

### Header & Search Bar

**Header expanded (top of page):**
- Full-width, ~80px height
- Logo (left), Search bar (center), Profile (right)
- Search bar has 3 segments: "Where" | "Check in / Check out" | "Who" + red search button
- Search bar is a pill shape (~44px height, full radius)

**Header collapsed (on scroll):**
- Search bar morphs from full 3-segment pill → compact single-line "Start your search" pill
- Transition is animated (morph, not hide/show)
- Header sticks to top
- Shows on scroll UP, hides on scroll DOWN

**Key insight:** The search bar is the HERO. Not a headline, not a tagline. The search bar IS the homepage above-the-fold experience. There's no "BOOK YOUR NEXT STAY" headline. Just the search bar.

### Category Row (removed April 2025)

Airbnb **removed their category icon row** in April 2025, replacing it with a redesigned navigation system focused on Homes, Experiences, and Services. The old row had:
- Horizontal scroll of 30+ category icons
- Each icon: line-art style, ~24px, label below
- Sticky below header on scroll
- Active state: bold text + underline

**Key insight:** Even Airbnb decided the category row was too much and removed it. They simplified to 3 top-level tabs.

### Responsive Grid

| Breakpoint | Width | Columns |
|---|---|---|
| Mobile Small | <375px | 1 |
| Mobile | 375-550px | 1 |
| Tablet Small | 550-744px | 2 |
| Tablet | 744-950px | 2 |
| Desktop Small | 950-1128px | 3 |
| Desktop | 1128-1440px | 4 |
| Large Desktop | 1440-1920px | 5 |
| Ultra-wide | >1920px | 5 |

**Key insight:** 61 total breakpoints detected. They don't use standard sm/md/lg — they have micro-breakpoints for pixel-perfect responsive behavior.

### Buttons

**Primary dark:**
- Background: `#222222` (not brand color!)
- Text: white
- Padding: 0 24px
- Radius: 8px
- Hover: transitions to brand red
- Focus: 2px ring + scale(0.92)

**Secondary:**
- Background: `#F2F2F2`
- Text: `#222222`
- Same padding/radius

**Key insight:** Primary buttons are DARK, not brand-colored. The red is reserved for the search CTA. This prevents color fatigue — when everything is coral/red, nothing stands out.

### Interactions

- **Card hover:** Shadow deepens. No translateY, no scale, no image zoom.
- **Heart press:** Scale bounce (spring animation)
- **Focus:** Scale(0.92) shrink + ring — unique, feels tactile
- **Transitions:** No specific easing documented, but spring-based for interactive elements
- **Page load:** No stagger animation on cards. Cards just appear.

**Key insight:** Interactions are SUBTLE. No dramatic entrance animations. No stagger reveals. Content appears immediately. The only animations are on direct user interaction (press, hover, focus).

### What Airbnb Does NOT Have

- No display font / no uppercase headlines
- No hero section with a tagline
- No "how it works" section
- No trust stats banner
- No testimonials section
- No partner CTA section
- No inspiration/discover section
- No glass effects
- No warm color palette
- No category pills below the hero
- No gradients on backgrounds
- No decorative elements
- No "Mehr entdecken" buttons between sections

---

## FRESHA — Design System

### Colors

| Token | Hex | Usage |
|---|---|---|
| Bunker | `#0D1619` | Primary text (functions as black) |
| Azure Radiance | `#037AFF` | Accent, CTAs, links |
| White | `#FFFFFF` | Backgrounds |

**Key insight:** Three colors total. Dark text, blue accent, white background. Even simpler than Airbnb.

### Typography

| Font | Usage | Weights |
|---|---|---|
| AktivGroteskVF | Body text, UI | Variable (100-900) |
| PlayfairDisplay | Display headlines (hero) | Variable (400-900) |
| RoobertPRO | Business page headers | 400-700 |
| Tartuffo | Business page display | 400-700 |

**Key insight:** Fresha uses a **serif** for display (PlayfairDisplay / Tartuffo) — elegant, editorial. And a clean **sans-serif** for everything else (AktivGrotesk / Roobert). The serif appears ONCE in the hero. Everything else is the sans.

### Trust & Social Proof

Stats shown as **raw big numbers**, no decorated cards:
- "1 billion+ appointments booked"
- "130,000+ partner businesses"
- "120+ countries"
- "450,000+ professionals"

Testimonials: Real reviews with names, cities, 5-star ratings. Carousel format.

Capterra: "Excellent 5/5 — Over 1,250 reviews" with logo.

**Key insight:** Fresha earns trust through SCALE numbers. They can show "1 billion" because they have it. When numbers are small (like 19 salons), showing them hurts more than helps.

### Homepage Structure (Consumer)

1. Hero — "Book local selfcare services" + search + app download CTA
2. Browse by city
3. Browse by service type
4. Trust stats (big numbers)
5. Testimonials (carousel)
6. App download CTA
7. Footer

**Key insight:** ~7 sections. Each section does ONE thing. No "how it works", no inspiration grid, no animated stats. Just: search → browse → trust → download.

### Homepage Structure (Business)

1. Hero with gradient treatment — serif headline + CTA
2. Feature grid (modular cards)
3. Partner social proof
4. Footer

**Key insight:** Even the B2B page is only 4 sections. Extreme focus.

### Search Experience

- Unified search bar (not segmented like Airbnb)
- Location-aware
- Browse by city → then by service type within city
- Service types: Hair Salons, Nail Salons, Eyebrows & Lashes, Beauty Salons, Barbers, Massages, Spas & Saunas, Waxing

### Visual Treatments

- Linear gradients for hero backgrounds (subtle, not aggressive)
- "Spotlight" gradient effects on hero imagery
- Clean card-based feature presentation
- CSS modules for styling (no utility classes visible)
- Responsive with app-first design philosophy

### What Fresha Does NOT Have

- No display font used everywhere (serif is hero-only)
- No trust stats banner with small numbers
- No "how it works" section
- No category icon row in header
- No glass/frosted effects
- No warm palette
- No animated card reveals or stagger
- No inspiration/discover section
- No city selector with Bebas Neue
- No floating navigation pill

---

## PATTERNS BOTH SHARE

1. **White backgrounds** — both use pure white, not cream or beige
2. **Minimal accent color** — one accent color (red / blue), used sparingly
3. **No display font abuse** — display font used ONCE (hero or not at all)
4. **Photography-led** — images are the content, not decoration
5. **Minimal sections** — Airbnb: 3, Fresha: 7. Neither has 14.
6. **No "how it works"** — both assume users know how booking works
7. **No animated entrances** — content appears, it doesn't fly in
8. **Restraint over decoration** — premium feel comes from what's NOT there
9. **Dark buttons** — primary CTAs are dark or accent-colored, not spread everywhere
10. **Trust through content** — ratings on cards, not banners between sections

---

## WHAT "PREMIUM" ACTUALLY MEANS

Based on studying both platforms:

1. **Premium = fewer things done better**, not more things done adequately
2. **Premium = invisible typography** — you read content, you don't notice fonts
3. **Premium = photography as product** — the image IS the selling point
4. **Premium = sparse color** — 3-4 colors max, accent used rarely
5. **Premium = no compensation** — don't add trust banners, how-it-works, or stats to make up for weak content
6. **Premium = immediate utility** — search bar is the hero, not a tagline
7. **Premium = shadow over border** — multi-layer shadows replace borders
8. **Premium = no entrance animations** — content is there, it doesn't need to announce itself
9. **Premium = tight spacing** — dense grids feel "full of options", loose grids feel "empty"
10. **Premium = confidence** — if you need to explain how your product works on the homepage, you're not confident in the product

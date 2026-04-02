# SOLEN — Definitive Claude Code Handoff V2

> **What this is:** The single source of truth for polishing Solen into a premium marketplace. Every design value verified against the actual codebase. Hand this entire file to Claude Code.
>
> **Golden rule:** POLISH existing code. NEVER rebuild from scratch. Every page already works — your job is to make it feel premium.

---

## 1. The Vision: Fresha × Airbnb Hybrid

Solen is a Swiss salon booking marketplace. It should feel like **Airbnb's discovery UX married to Fresha's booking efficiency**. Not a vibe-coded AI project — a real, authentic platform built by a $50M startup.

**Design philosophy:** Pure white backgrounds, search-first UX, zero-shadow cards at rest, coral accents, buttery 40ms stagger animations, portrait-format salon images.

---

## 2. Skills to Install BEFORE Starting

> [!IMPORTANT]
> Install these BEFORE giving Claude Code any prompts. They give it design intelligence.

### Skill 1: Emil Kowalski Design Engineering
Already installed at `.agents/skills/emil-design-eng/SKILL.md`. READ IT. It teaches:
- Never use `transition-all` (animate only `transform` + `opacity`)
- Use `cubic-bezier(0.23, 1, 0.32, 1)` for snappy interactions
- Respect `prefers-reduced-motion`

### Skill 2: Frontend Design
Already installed at `.agents/skills/frontend-design/SKILL.md`. Production-grade UI patterns.

---

## 3. The Design System (CORRECTED — Verified Against Codebase)

> [!CAUTION]
> These values are verified against `app/globals.css` and `tailwind.config.js`. Use THESE, not any other document.

### 3.1 Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FFFFFF` | Page background — ALWAYS pure white |
| `--color-heading` | `#222222` | All heading text |
| `--color-body` | `#484848` | Body text (NOT #717171 — that was wrong) |
| `--color-muted` | `#6A6A6A` | Metadata, secondary text (5.0:1 WCAG AA) |
| `--color-border` | `#EBEBEB` | Dividers, card borders |
| `--color-hover-bg` | `#F7F7F7` | Hover background |
| `--s-coral` | `#E8624A` | Primary CTA, accents, active states |
| `--s-coral-hover` | `#CC4E35` | Hover for coral (NOT #D9553E) |
| Heart favorited | `#FF385C` | Airbnb pink for heart fill |
| `--color-success` | `#2E7D32` | "Available today" green |
| Badge dark | `#222222` | "New" badge background |

**DO NOT USE:** cream `#FAF6EF`, warm grey, neon gradients, wine-red `#9B1D30`, teal, old coral `#FF6B6B`

### 3.2 Typography
| Element | Font | Weight | Size | Tracking |
|---------|------|--------|------|----------|
| H1 (page title) | Syne | 800 | 34px mobile / 48px desktop | -0.02em |
| H2 (section title) | Syne | 700 | 22px mobile / 28px desktop | -0.02em |
| Section eyebrow | Syne | 700 | 11px uppercase | 0.12em |
| Body text | DM Sans | 400 | 15px | 0 |
| Card title | DM Sans | 600 | 15px | 0 |
| Card metadata | DM Sans | 400 | 13px | 0 |
| Badge text | Syne | 700 | 11px | 0 |
| Button text | Syne | 700 | 14px | 0 |
| Display (≥40px) | Bebas Neue | 400 | 40px+ | 0.01em |

**Fonts are loaded in globals.css line 2:** Syne, DM Sans, Bebas Neue, JetBrains Mono

### 3.3 Spacing & Radius (CORRECTED)
| Token | Value | Notes |
|-------|-------|-------|
| `--radius-card` | `12px` | Salon card image corners — USE THIS |
| `rounded-card` in Tailwind | `16px` | ⚠️ MISMATCH — update tailwind.config.js to 12px |
| `--radius-card-outer` | `16px` | Dialog/sheet/modal corners |
| `--radius-pill` / `rounded-pill` | `9999px` | Buttons, badges, search bar |
| `--radius-input` / `rounded-input` | `10px` | Form inputs — update tailwind.config.js from 12px to 10px |
| `rounded-btn` | `99px` | CTA buttons (keep as-is) |
| `rounded-search` | `99px` | Search bar (keep as-is) |
| Section padding | `48px` vertical (`3rem`) |  |
| Card gap | `24px` desktop / `12px` mobile |  |
| Page horizontal padding | `20px` mobile / `40px` tablet / `80px` desktop |  |

> [!IMPORTANT]
> **First task:** Update `tailwind.config.js` line 45: `card: "16px"` → `card: "12px"` and line 51: `input: "12px"` → `input: "10px"` to match the design system tokens in globals.css.

### 3.4 Shadow Hierarchy — Zero at Rest (Pure Airbnb)
```css
/* Level 0: Default card — NO shadow, NO border */
.card-listing { box-shadow: none; border: none; }

/* Level 1: Card hover (desktop only, gated behind @media(hover:hover)) */
.card-listing:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* Level 2: Search bar, sticky header, dropdowns */
box-shadow: 0 1px 4px rgba(0,0,0,0.1);

/* Level 3: Modals, sheets, floating elements */
box-shadow: 0 8px 28px rgba(0,0,0,0.15);
```

**Existing Tailwind tokens to use:**
- `shadow-elevation-1` → Level 1 equivalent (interactive elements at rest)
- `shadow-elevation-2` → Level 2 (search bar, sticky header)  
- `shadow-elevation-3` → Level 3 (modals)
- `shadow-v5-card-hover` → Card hover state

### 3.5 Animation Rules (CRITICAL)

**Engine: framer-motion v12.6.3** — already installed, already used everywhere. Do NOT switch to CSS-only.

```
NEVER: transition-all, transition: 0.3s ease
ALWAYS: Transition specific properties only (transform, opacity)

Easing tokens (from globals.css):
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)    → cards, reveals
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)     → bouncy micro-interactions
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)         → bottom sheets

framer-motion easing array: [0.23, 1, 0.32, 1]

Duration rules:
  Micro (hover, press): 100-150ms
  Standard (reveals): 200-300ms  
  Page transitions: 350-500ms

Stagger: 40ms between children (0.04s) — STANDARDIZE EVERYWHERE
  Currently: HomePage uses 60ms, CategoryPage uses 30ms — FIX BOTH to 40ms

GPU-accelerated only: transform, opacity
NEVER animate: width, height, margin, padding, left, top
```

**Existing animation patterns (in `lib/animations.ts`):**
- `containerVariants` + `itemVariants` — grid stagger reveal
- `toastVariants` — toast notifications
- Use these. Don't create new ones unless needed.

### 3.6 Component Specs

#### Salon Card (`components/SalonCard.tsx` — 387 lines, POLISH ONLY)
```
Current state: Already has photo carousel, badges, favorites, compare, availability
What to polish:
- Image: Change to aspect-[4/5] (portrait) — currently uses aspect-[20/19]  
- Hover lift: Change to translateY(-2px) — currently uses translateY(-4px) in some variants
- Remove any shadow at rest — zero shadow, image + text only
- Gate ALL hover effects behind @media(hover:hover)
- Heart: Verify 24px icon, 44px touch target, #FF385C fill
- Stagger: Standardize to 40ms in parent grid
```

#### Header (`components/layout/Header.tsx` — 482 lines, POLISH ONLY)
```
Current state: Already has scroll-direction detection, AirbnbSearchBar, 
              6 animated SVG category icons, compact pill on scroll
What to polish:
- Background on scroll: Ensure bg-white/95 backdrop-blur-md
- Verify transition uses cubic-bezier(0.23, 1, 0.32, 1)
- Search pill transition speed: 250ms
- Remove any dark: classes (dead code)
```

#### Section Headers (STANDARDIZE)
```
Eyebrow: 11px Syne uppercase tracking-[0.12em] text-s-coral  ← CORAL, not amber
Title: 22px Syne font-bold text-[#222222]
Right action: "View all →" link, 14px DM Sans
Clean divider: 1px #EBEBEB between sections
```

---

## 4. Complete Page & Component Catalog

> [!IMPORTANT]
> **Add to CLAUDE.md section 3.5:** This catalog documents every customer-facing page and its function. When Claude Code adds a new page, append it here.

### Customer-Facing Routes (SCOPE OF THIS POLISH)
| Route | Component/File | Function | Size |
|-------|---------------|----------|------|
| `/` | `HomePage.tsx` (369 lines) | Discovery feed: featured carousel, category grid, city section, trust stats, testimonials, recently viewed | Large |
| `/[category]` (coiffeur, barbershop, nails, spa, makeup, waxing) | `CategoryPage.tsx` (676 lines) | Category listing: filter bar, search, salon grid, map toggle, directory entries, load more | Large |
| `/[city]/[category]` | `CategoryPage.tsx` (reused) | City-filtered category listing | Reused |
| `/salon/[slug]` | 13 subcomponents in `components/salon/` | Salon detail: hero photos, services, reviews, staff, sidebar, opening hours, similar salons | Large (13 files) |
| `/search` | `SearchPage` + `SearchAutocomplete` | AI-powered search with category detection, date filtering | Medium |
| `/angebote` | Deals/offers page | Last-minute slots, price range filtering | Medium |
| `/discover` | `components/discovery/` (42 files!) | Pinterest-style content discovery, masonry grid, filters | Large |
| `/compare` | `components/compare/` (3 files) | Side-by-side salon comparison | Small |
| `/confirmation` | Confirmation page | Post-booking confirmation with share/calendar links | Small |
| `/bookings` | Bookings list | User's booking history | Medium |
| `/termine` | `TerminePage.tsx` (21KB) | Appointment management | Large |
| `/profile` | `ProfilePage.tsx` (55KB!) + 7 sub-routes | User profile: beauty profile, favorites, settings, vouchers, referral, payment methods, reviews | Huge |
| `/vouchers` | Voucher purchase + redemption | Gift card system | Medium |
| `/loyalty` | Loyalty stamp cards | Per-salon loyalty programs | Small |
| `/referral` | Referral program | Share codes, reward tracking | Small |
| `/not-found` | 404 page | Custom styled 404 | Tiny |
| `/fuer-salons` | Partner landing page | B2B salon onboarding pitch | Medium |
| `/warum-solen` | "Why Solen" page | Marketing/trust page | Medium |
| `/auth/*` (4 pages) | Login, register, reset, callback | Authentication flow | Medium |

### Booking Flow Components (`components/booking/` — 16 files)
| Component | Function |
|-----------|----------|
| `BookingWizard.tsx` | Multi-step orchestrator (service → staff → date → time → confirm → payment) |
| `ServiceSelectionStep.tsx` | Service picker with categories |
| `StaffSelectionStep.tsx` | Staff avatar grid |
| `DateSelectionStep.tsx` | Calendar with available dates |
| `TimeSelectionStep.tsx` | Time slot pills |
| `ConfirmationStep.tsx` | Booking summary |
| `PaymentStep.tsx` | Payment method selection |
| `BookingCard.tsx` | Booking summary card |

### Layout Components (`components/layout/` — 7 files)
| Component | Function |
|-----------|----------|
| `Header.tsx` (482 lines) | Main nav, scroll-aware, search bar, category icons |
| `Footer.tsx` | Site footer |
| `BottomTabBar.tsx` (230 lines) | Mobile bottom nav with spring animations |
| `BottomNav.tsx` | Legacy bottom nav (may be deprecated) |
| `CategoryStickyRow.tsx` | Sticky category row on scroll |
| `PageTransition.tsx` | Page transition wrapper |

### Category-Specific Modules (DO NOT TOUCH unless polishing their customer UI)
| Directory | Files | Function |
|-----------|-------|----------|
| `components/barber/` | 8 files | Walk-in queue, rebook, loyalty, profiles |
| `components/nail/` | 14 files | Inspo boards, AI art, allergy system, design history |
| `components/coiffeur/` | 2 files | Coiffeur-specific sections |
| `components/spa/` | 1 file | Spa-specific sections |
| `components/makeup/` | 1 file | Makeup-specific sections |
| `components/waxing/` | 1 file | Waxing-specific sections |

### NOT IN SCOPE (Skip entirely)
- `components/dashboard/` (72 files) — salon owner backend
- `components/admin/` — admin tools
- `components/editor/` — visual editor
- `app/[locale]/dashboard/` (41 pages) — dashboard routes

---

## 5. Execution Waves

> [!IMPORTANT]
> **Wave 1 is ALREADY COMPLETE.** All `transition-all` eliminated (70+ instances → 0). BookingWizard i18n done. Start at Wave 2.

### WAVE 2: Design Token Alignment + Card Polish (3 prompts)

#### Prompt 2A: Design Token Sync
```
TASK: Sync design tokens between globals.css and tailwind.config.js.

1. In tailwind.config.js:
   - Line 45: Change `card: "16px"` → `card: "12px"`
   - Line 51: Change `input: "12px"` → `input: "10px"`
   
2. In components/SalonCard.tsx:
   - Change image aspect ratio from aspect-[20/19] to aspect-[4/5]
   - Change hover translateY from -4px to -2px (if present)
   - Remove any box-shadow at rest (zero shadow on cards)
   - Ensure ALL hover effects are gated: @media(hover:hover) { ... }
   - Verify heart icon: 24px (w-6 h-6), #FF385C fill, 44px touch target

3. In components/HomePage.tsx:
   - Change staggerChildren from 0.06 (60ms) to 0.04 (40ms) on ALL variants
   - Change any individual delay calculations to use 0.04 intervals

4. In components/CategoryPage.tsx:
   - Line 601: Change `delay: Math.min(i * 0.03, 0.15)` → `delay: Math.min(i * 0.04, 0.24)`

5. Standardize ALL section headers to use:
   - Eyebrow: text-s-coral (NOT text-s-amber)
   - Example: CategoryPage line 380 has text-s-amber → change to text-s-coral

RULES:
- Do NOT restructure any component
- Do NOT delete any functionality  
- Only change the specific values listed above
- Run `npm run build` after changes
```

#### Prompt 2B: i18n Sweep (Safe — No Breaking Changes)
```
TASK: Find and translate ALL hardcoded German/English strings in customer-facing components.

APPROACH: Search each file for hardcoded text. For each string:
1. Add a translation key to messages/de.json, en.json, fr.json, it.json
2. Replace the hardcoded string with t('keyName')
3. If the component doesn't have useTranslations, add it

FILES TO SWEEP (in order of priority):
1. components/CategoryPage.tsx — "Nicht buchbar", "Alle Städte", "Anrufen", "Website", 
   "Salons", "in der Schweiz", "weitere", "Karte vergrössern", "Lade mehr…", "Startseite"
2. components/HomePage.tsx — check for any remaining hardcoded text
3. components/layout/Header.tsx — check nav labels
4. components/layout/BottomTabBar.tsx — "Mit Google anmelden", "Mit E-Mail anmelden", "Schliessen"
5. components/layout/Footer.tsx — check all text
6. components/SalonCard.tsx — check badge text, metadata labels
7. components/booking/*.tsx — check ALL 16 booking components
8. app/[locale]/confirmation/page.tsx
9. app/[locale]/not-found.tsx
10. app/[locale]/vouchers/page.tsx

RULES:
- Use the existing translation namespace structure (check what namespace each component already uses)
- Do NOT change component logic, only wrap strings in t()
- If a string is already translated, skip it
- Run `npm run build` after EACH file to catch errors early
- Use `as any` cast on t() for dynamic keys if TypeScript complains
```

#### Prompt 2C: 3D Category Icons
```
TASK: Generate 6 modern 3D-style category icons and replace the current SVG icons.

Current icons are in components/icons/category/:
- CoiffeurIcon.tsx (animated scissors)
- BarberIcon.tsx
- NailsIcon.tsx
- SpaIcon.tsx
- MakeupIcon.tsx
- WaxingIcon.tsx

For each category, generate a high-quality 3D-style icon image (PNG, 128x128px):
1. Coiffeur — 3D scissors with metallic sheen
2. Barbershop — 3D barber pole or straight razor
3. Nails — 3D nail polish bottle with glossy finish
4. Spa — 3D lotus flower or hot stone
5. Makeup — 3D lipstick or makeup brush
6. Waxing — 3D wax strip or smooth leg icon

Save to public/icons/category/ as PNG files.
Update each Icon component to render an <Image> instead of SVG.
Keep the same component interface (props, className support).
Remove the CSS animation since PNGs cant animate — replace with a 
subtle framer-motion scale bounce on hover: 
  whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}

RULES:
- Icons should look modern, glossy, 3D — NOT flat/generic
- Consistent style across all 6 icons
- Keep existing component file names and exports
```

---

### WAVE 3: Page-Level Polish (3 prompts, customer pages only)

#### Prompt 3A: Homepage Polish
```
TASK: Polish components/HomePage.tsx WITHOUT rebuilding.

Read the current file first. Then:
1. Ensure consistent section headers: coral eyebrow + Syne title + "View all →" link
2. Add 1px #EBEBEB dividers between sections (if missing)
3. Verify FeaturedSalonCarousel uses SalonCard with 4:5 aspect ratio
4. Ensure stagger timing is 0.04 (40ms) on ALL motion containers
5. Hero: Keep the search-first approach (GuidedSearch). Ensure it's clean and prominent.
6. Remove any dark: classes from this file
7. Check all strings use t() — no hardcoded German

DO NOT:
- Rebuild the component from scratch
- Remove any existing sections (featured, categories, cities, trust, testimonials)
- Change the initialData prop interface
- Add new npm dependencies
```

#### Prompt 3B: Category Page Polish  
```
TASK: Polish components/CategoryPage.tsx WITHOUT rebuilding.

This is a 676-line component with: filters, search, salon grid, map toggle, directory cards.

Polish:
1. Remove the category gradient backgrounds (categoryGradients) — use pure white
2. Ensure section eyebrows use text-s-coral (currently text-s-amber)
3. Verify SalonCard renders with 4:5 aspect ratio
4. Standardize card stagger to 40ms
5. Fix hardcoded German strings (already done in Prompt 2B, verify)
6. Ensure map toggle button matches design system
7. Remove dark: classes
8. DirectoryCard: Match design system (12px radius, zero shadow at rest)

DO NOT:
- Restructure the filter system
- Remove the map toggle
- Remove directory card support
- Change the API endpoints or data fetching logic
```

#### Prompt 3C: Salon Detail + Booking Flow Polish
```
TASK: Polish the salon detail page and booking flow.

FILES (READ before editing):
- components/salon/SalonHero.tsx (photo gallery)
- components/salon/SalonServices.tsx (service list)
- components/salon/SalonReviews.tsx (15KB, reviews with star breakdown)
- components/salon/SalonSidebar.tsx (booking sidebar)
- components/salon/SalonMobileCTA.tsx (sticky mobile CTA)
- components/salon/SalonOpeningHours.tsx
- components/salon/SalonSectionNav.tsx (tab navigation)
- components/salon/StaffSection.tsx
- components/salon/SimilarSalons.tsx
- components/booking/BookingWizard.tsx (orchestrator)
- components/booking/ServiceSelectionStep.tsx — DateSelectionStep — TimeSelectionStep — PaymentStep — ConfirmationStep

Polish each file:
1. Verify 12px radius on images, zero shadow at rest
2. Verify button styles match design system (coral CTA, pill shape)
3. Check hover effects gated behind @media(hover:hover)
4. Verify framer-motion transitions use [0.23, 1, 0.32, 1] easing
5. Check for hardcoded strings → t()
6. Remove dark: classes
7. Sticky booking CTA: Verify it's prominent on mobile (bottom bar)
8. Service list: Clean formatting with name, duration, price

DO NOT:
- Restructure the booking wizard step flow
- Change the SalonCard component (already polished)
- Add new API routes or change data fetching
- Delete any existing functionality
```

---

### WAVE 4: Final Polish (2 prompts)

#### Prompt 4A: Animation & Performance Pass
```
TASK: Final animation and performance sweep across ALL customer pages.

1. Verify ALL card grids use 40ms stagger (0.04s)
2. Verify ALL section reveals use IntersectionObserver or framer-motion useInView
3. Add loading="lazy" to ALL images below the fold
4. Verify font-display: swap on Google Fonts import (globals.css line 2)
5. Remove any unused imports (components that are imported but not rendered)
6. Verify prefers-reduced-motion disables all animations:
   - Check globals.css for @media (prefers-reduced-motion: reduce) rule
   - If missing, add: *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }

DO NOT add new animation libraries or change the framer-motion patterns.
```

#### Prompt 4B: Accessibility & Final Build
```
TASK: Final quality gate — accessibility + build verification.

1. All images: descriptive alt text (not "image" or empty)
2. All buttons: aria-labels
3. Focus-visible rings: outline-2 outline-offset-2 outline-s-coral on all interactive elements
4. Color contrast: Verify #484848 on white passes 4.5:1 (it does: 7.6:1)
5. Tab order: Logical flow on homepage, category page, salon detail, booking
6. All 4 locales (de/en/fr/it) have values for ALL keys added in Wave 2
7. Build: `npm run build` — must pass with zero errors
8. No console.log statements left in production code

DELIVER: A summary of all changes made across all waves.
```

---

## 6. Anti-Patterns (NEVER DO)

```
NEVER:
- Use transition-all (already eliminated — KEEP IT THAT WAY)
- Rebuild a component from scratch (POLISH ONLY)
- Use neon/gradient backgrounds (pure white only)
- Put shadows on cards at rest (zero shadow, hover only)
- Hardcode German/English text (always use t())
- Use border-radius > 12px on card images (12px max)
- Animate width/height/margin (GPU cannot accelerate)
- Create hover effects that trigger on mobile (gate with @media(hover:hover))
- Leave console.log statements  
- Use !important (except for prefers-reduced-motion)
- Create components wider than 1440px max-width
- Delete existing functionality to "simplify"
- Change API endpoints or data fetching logic
- Touch dashboard/ components (out of scope)
- Touch dark mode classes (leave them as dead code — darkMode is false in tailwind.config.js)
```

---

## 7. Dark Mode Strategy

`darkMode: false` is already set in `tailwind.config.js`. All `dark:` classes are **dead code** — they don't render. 

**Do NOT delete them.** Leave them in place. They cause zero harm and removing 1,416 occurrences is high-risk for zero benefit.

---

## 8. File Structure Reference
```
components/
├── SalonCard.tsx          ← THE core card (387 lines)
├── CategoryPage.tsx       ← Category listing (676 lines)
├── HomePage.tsx           ← Section orchestrator (369 lines)
├── MapView.tsx            ← Mapbox integration
├── layout/
│   ├── Header.tsx         ← Scroll-aware header (482 lines)
│   ├── Footer.tsx
│   ├── BottomTabBar.tsx   ← Mobile nav with springs (230 lines)
│   └── CategoryStickyRow.tsx
├── booking/               ← 16 booking flow components
├── salon/                 ← 13 salon detail components
├── ui/                    ← 66 shared UI primitives
├── search/                ← Search components
├── profile/               ← 8 profile components
├── discovery/             ← 42 discovery components
├── icons/category/        ← 6 animated SVG category icons (→ 3D PNGs in Wave 2)
├── barber/                ← 8 barber-specific components
├── nail/                  ← 14 nail-specific components
└── [14 more directories]

app/
├── globals.css            ← Design tokens + utilities (877 lines)
├── [locale]/
│   ├── page.tsx           ← Homepage entry
│   ├── [category routes]  ← coiffeur, barbershop, nails, spa, makeup, waxing  
│   ├── [city]/[category]  ← City-filtered listings
│   ├── salon/[slug]       ← Salon detail
│   ├── search/            ← Search page
│   ├── discover/          ← Discovery platform
│   └── [29 more routes]

messages/
├── de.json  ├── en.json  ├── fr.json  ├── it.json

_rules/                    ← MANDATORY reading before any changes
├── UI_RULES.md
├── LESSONS_LEARNED.md
├── DB_SCHEMA.md
├── SECURITY_RULES.md
└── ROADMAP_RULES.md
```

---

## 9. Pre-Flight Checklist (Before ANY Prompt)

```
✅ Read CLAUDE.md (in project root — 1164 lines of rules)
✅ Read _rules/LESSONS_LEARNED.md (real bugs to avoid)
✅ Read _rules/UI_RULES.md (design enforcement)
✅ Read .agents/skills/emil-design-eng/SKILL.md (animation rules)
✅ Understand: darkMode is FALSE — ignore all dark: classes
✅ Understand: NEVER rebuild from scratch — POLISH ONLY
✅ Understand: Customer pages only — skip dashboard/
```

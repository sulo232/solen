# 🎨 Solen.ch UI & Design Rules

> **CRITICAL FOR CLAUDE CODE:** This file contains the foundational design rules for Solen.ch. These rules **must not be broken or altered** under any circumstances. Check this file before making any UI decisions.

---

## 1. Core Aesthetic
- **Light + Dark Mode:** The platform supports both light and dark mode via `darkMode: 'class'` in Tailwind. Default is system preference.
  - Dark background: `#151009` (`s-dm-bg`), Dark surface: `#1E1710` (`s-dm-surface`), Dark text: `#F5EEE4` (`s-dm-text`)
  - Use `dark:` variants on all major surfaces (cards, nav, modals, backgrounds)
  - ThemeToggle in Header cycles: light → dark → system
  - `<ThemeScript>` in layout prevents flash of wrong theme
- **Pure Glassmorphism:** All cards, modals, and overlays must use glassmorphism (`backdrop-blur-xl`, semi-transparent backgrounds with a subtle white tint).
- **No Glowing Borders:** Do not use AI-style glowing borders or generic neon shadows. Stick to clean, iPhone-widget-style glassmorphism.
- **Premium Feel:** The UI must feel like a luxury hotel booking site (Airbnb/Booking.com inspiration) but tailored for beauty services.

## 2. Colors & Branding
- **Primary Colors:**
  - Terracotta Coral: `#E8624A` (class: `s-coral`) — primary brand color
  - Amber: `#D4870A` (class: `s-amber`) — accent
  - Basel Blue: `#6BA3C8` (class: `s-blue`) — accent
  - Warm Ink: `#1A1209` (class: `s-ink`) — primary text on light backgrounds
- **Backgrounds:** Cream `#FAF6EF` (base), White `#FFFFFF` (cards), `#EDE5D8` (sunken inputs)
- **Extended Families (v1.0):**
  - Yellow: `#F2C144` (class: `s-yellow`) — tags, badges, "Top Rated"
    - Variants: `s-yellow-subtle` (#FEF8E0), `s-yellow-text` (#7A5C00)
  - Sage: `#7BA688` (class: `s-sage`) — spa/wellness category
    - Variants: `s-sage-subtle` (#EBF5EE), `s-sage-text` (#2E5E3A)
  - Sand: `#C9A96E` (class: `s-sand`) — supporting warm surfaces
    - Variants: `s-sand-subtle` (#F7F0E3), `s-sand-text` (#6B5430)
  - Plum: `#4A1E3C` (class: `s-plum`) — depth, dark blocks
    - Variants: `s-plum-hover` (#3A1630), `s-plum-subtle` (#F0E8F0), `s-plum-text` (#4A1E3C)
- **WCAG Rule:** `text-s-coral` (#E8624A) on cream FAILS AA for body text. Use `text-s-coral-text` (#7A2415) for small text (<18px). `text-s-coral` is OK for large headings, icons, badges, buttons.
- **Google Auth:** The Google login button must use the **full-color** Google G logo, not a monochrome version.

## 3. Typography
- **Display (≥40px):** `Bebas Neue` — hero headings, large impact text. Always uppercase.
- **Headings:** `Syne`
- **Body Text:** `DM Sans`
- **Data/Numbers:** `DM Sans` with `tabular-nums` (class: `data-text`). Space Grotesk is retired.
- **Playful Accents:** Use Bebas Neue for section labels, category names, or impact headers. Mix font weights to create a playful but premium hierarchy.

## 4. Animations & Interactions (`framer-motion`)
- **Speed:** All transitions must be smooth and elegant (300-400ms duration).
- **Hover States:** Cards (`SalonCard`) should have a **lift-up effect** (subtle shadow increase + `translateY -4px`).
- **Tab Switching:** Use a smooth **slide left/right** animation (like turning pages), not a simple fade.
- **Lists/Grids:** Use `containerVariants` to stagger children elements (200ms stagger) when loading grids.
- **Blob Interactive:** `.blob-interactive` class applies a 500ms spring bezier transition on `border-radius`, `transform`, `background`, and `box-shadow`. Used on CTA buttons and cards with organic morphing shapes.
- **Float Animation:** `.hero-blob` applies `solen-float` keyframes (6s ease-in-out infinite, translateY + slight rotate) for Zone 1 hero background blobs.
- **Reveal Stagger:** `.reveal-stagger` applies `solen-reveal` with 80ms delay between children for page-load entrance animations.

## 5. Structural Rules
- **Category Pages:** Must use an Airbnb-style searchable and sortable grid. Map view available via toggle button (`?view=map`) using Mapbox integration (`components/MapView.tsx`). List is default; map is opt-in.
- **Mobile Booking Flow:** Must use a mobile **bottom sheet** for booking (like Airbnb "Check availability").
- **Desktop Booking Flow:** Use a sticky sidebar calendar.
- **Global Header:** Must be present and consistent across all Next.js (`app/`) pages. It should transition from transparent to solid (with blur) on scroll.
- **Loading States:** Use `<Skeleton variant="card" />` for full-page loading (grid of shimmer cards). Use `<Spinner>` only for inline/button loading states.
- **Empty States:** Use `<EmptyState>` with lucide-react icons and helpful text. Optional `illustration` prop adds minimal teal line art SVGs above the icon.
- **Icons:** Use `lucide-react` exclusively. No raw emojis for UI elements (e.g., replace 🧒 with a User icon, replace ★ with a Star icon).

## 6. Layout Specifics
- **Login:** Centered, single glassmorphic card.
- **Salon Cards:** Must display: Cover photo + Name + Rating + Glass Category Pills + Location.
- **Dashboard Stats:** Must include count-up number animations and mini sparkline charts.
- **Last-Minute:** Must include an urgency timer counting down to when the appointment *starts*. 

## 7. 21st.dev Components
- **InteractiveHoverButton:** Use for all primary CTAs. Customized with `bg-s-coral` and `text-white`.
- **ExpandableNavTabs:** Used for mobile bottom nav. Spring animations, `s-coral` active color. Hidden on desktop.
- **Sidebar (dashboard):** Animated collapse/expand sidebar for dashboard layout.
- All 21st.dev components require shadcn CSS variables defined in `globals.css` (`--primary`, `--muted`, `--accent`, etc.).

## 8. New Components (Phase 6–14)
- **ThemeToggle** (`components/ui/ThemeToggle.tsx`): Moon/Sun icon in Header, cycles light → dark → system. Stores in `localStorage('solen_theme')`.
- **ThemeScript** (`components/ui/ThemeScript.tsx`): Inline script in `<head>` to prevent theme flash. No XSS risk (static content).
- **TutorialTour** (`components/TutorialTour.tsx`): 4 full-screen welcome slides + driver.js tooltip tour. Shows once after first login (`localStorage('solen_tour_done')`).
- **Help Center** (`app/[locale]/help/`): Public help articles grouped by category (Für Kunden, Für Salons, Kontakt) with search.
- **Help Editor** (`app/[locale]/dashboard/help-editor/`): Admin CMS for creating/editing/publishing help articles.
- **ChatWindow** (`components/ChatWindow.tsx`): Now supports media upload (Paperclip button, 10MB limit) and price offer messages.
- **Dashboard Calendar** (`app/[locale]/dashboard/calendar/`): Weekly grid with staff-colored slots, click-to-reschedule modal, day blocking.
- **SalonCard** (`components/SalonCard.tsx`): Heart button for favorites, hover prefetch, lazy image loading, dark mode surface.
- **Last-Minute Page** (`app/[locale]/last-minute/`): Category chip filters + price range pills + client-side filtering.

## 9. Dark Mode Tokens
| Token | Light | Dark |
|---|---|---|
| Background | `bg-s-bg-base` (#FAF6EF) | `dark:bg-s-dm-bg` (#151009) |
| Surface | `bg-s-bg-raised` (#FFFFFF) | `dark:bg-s-dm-surface` (#1E1710) |
| Raised | — | `dark:bg-s-dm-raised` (#26201A) |
| Text | `text-s-ink` (#1A1209) | `dark:text-s-dm-text` (#F5EEE4) |
| Secondary text | `text-s-ink/70` | `dark:text-s-dm-text-secondary` (#C8BAA8) |
| Border | `border-s-ink/5` | `dark:border-white/5` |
| Nav glass | `glass` (warm-tinted) | `dark:bg-s-dm-surface/80` |

## 10. Border Radius & Blob Physics
| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 12px | Cards, modals, sheets |
| `rounded-button` | 8px | Buttons, inputs, dropdowns |
| `rounded-pill` | 9999px | Badges, pills, chips, toggle buttons |
| `rounded-blob-a` | `40% 60% 70% 30% / 40% 50% 60% 50%` | Interactive CTA Buttons |
| `rounded-blob-b` | `60% 40% 45% 55% / 50% 60% 40% 50%` | Active state morphs for cards/buttons |
| `rounded-blob-c` | `50% 50% 40% 60% / 60% 40% 60% 40%` | Large Banner/container blocks |
| `rounded-blob-d` | `40% 60% 55% 45% / 30% 30% 70% 70%` | SalonCard resting state |
| `rounded-blob-e` | `70% 30% 50% 50% / 40% 60% 40% 60%` | Section backgrounds (e.g. Deals wrapper) |
| `.blob-interactive` | CSS Transition | 500ms spring bezier curve applied to morphing elements |

Standard Tailwind `rounded-*` should NOT be used for these — use the design tokens.

## 11. Shadows
| Token | Usage |
|---|---|
| `shadow-card` | Cards at rest |
| `shadow-card-hover` | Cards on hover |
| `shadow-glass` | Glassmorphism panels |
| `shadow-glass-hover` | Glassmorphism hover |
| `shadow-warm-sm` | Buttons, small elevations |
| `shadow-warm-md` | Active cards, dropdowns |
| `shadow-warm-lg` | Modals, sheets |
| `shadow-coral-glow` | Coral CTA pulse |

## 12. Typography
| Token | Font | Usage |
|---|---|---|
| `font-display` | Bebas Neue | Hero titles, large splash text |
| `font-heading` | Syne | Section headers, card titles, nav |
| `font-body` | DM Sans | Body text, descriptions, UI text |
| `data-text` | DM Sans / tabular nums | Prices, ratings, scores, counters |

Body default = `font-body` (set on `<body>`). You don't need `font-body` class unless overriding.

## 13. Glassmorphism
| Token | Value | Usage |
|---|---|---|
| `backdrop-blur-glass` | 20px | Modals, sheets, navbar pill |
| `backdrop-blur-xs` | 4px | Subtle overlays |
| Standard `backdrop-blur-sm/md/lg` | — | General purpose |

## 14. Z-Index Scale
| Token | Value | Used For |
|---|---|---|
| z-base | 10 | Content above bg |
| z-sticky | 20 | Sticky headers in dashboard |
| z-nav | 30 | Dashboard side/bottom nav |
| z-overlay | 40 | FilterBar sticky, CompareBar, StickyMobileCTA |
| z-header | 50 | Main Header, BottomNav, dropdowns |
| z-modal-backdrop | 55 | Modal/drawer backdrops |
| z-modal | 60 | Modals, drawers, sheets |
| z-toast | 70 | Toast notifications, CookieBanner |

## 15. Text Colors (ONLY use these)
| Light Mode | Dark Mode | Usage |
|---|---|---|
| `text-s-ink` | `dark:text-s-dm-text` | Primary text |
| `text-s-ink/70` | `dark:text-s-dm-text/70` | Secondary text |
| `text-s-ink/50` | `dark:text-s-dm-text/50` | Tertiary/muted |
| `text-s-ink/40` | `dark:text-s-dm-text/40` | Disabled/hint |
| `text-s-coral` | `dark:text-s-coral` | Accent (large text only!) |
| `text-s-coral-text` | `dark:text-s-coral` | Accent (body text) |

## 16. BANNED tokens (do not use)
- ~~`text-dark`~~ use `text-s-ink`
- ~~`bg-dark`~~ use `bg-s-ink`
- ~~`bg-black`~~ use `bg-s-ink`
- ~~`dark:text-dm-text`~~ use `dark:text-s-dm-text`
- ~~`dark:bg-dm-surface`~~ use `dark:bg-s-dm-surface`
- ~~`text-gray-*`~~ use `text-s-ink/*`
- ~~`bg-gray-*`~~ use `bg-s-bg-*` or `bg-s-sand`
- ~~`border-gray-*`~~ use `border-s-ink/*`

## 17. Currency Formatting
Always use `formatCurrency(amount, locale)` from `@/lib/format-currency` instead of hardcoded `CHF {amount}`. Pass `locale` from `useLocale()` in client components or from `params` in server components.

## 18. Typography & Color Usage Guide (Design System v1.0)

### Font Hierarchy — Which Font Where

| Context | Font | Class | Weight | Size | Extra Rules |
|---|---|---|---|---|---|
| Homepage hero heading | Bebas Neue | `font-display` | — | `clamp(64px, 9vw, 140px)` | Always uppercase. Line-height 0.88. Stack in 1-4 word lines. |
| Section numbers (01, 02) | Bebas Neue | `font-display` | — | 64px (`--s-text-4xl`) | Always uppercase. Letter-spacing 0.04em. |
| Category page hero | Bebas Neue | `font-display` | — | 96px (`--s-text-5xl`) | Only for hero text. Drop to Syne at ≤48px. |
| Page-level headings | Syne | `font-heading` | 800 | 48px (`--s-text-3xl`) | Letter-spacing -0.02em. Never italic. |
| Section titles | Syne | `font-heading` | 800 | 32px (`--s-text-2xl`) | |
| Card headings, modal titles | Syne | `font-heading` | 700 | 24px (`--s-text-xl`) | |
| Nav links | DM Sans | `font-body` | 400 | 13px (`--s-text-sm`) | |
| Lead text, intro paragraphs | DM Sans | `font-body` | 500 | 18px (`--s-text-lg`) | |
| All body text | DM Sans | `font-body` | 400 | 16px (`--s-text-base`) | Line-height 1.75-1.85. |
| Hero descriptions, pull quotes | DM Sans | `font-body` | 300 italic | 16px | Use `italic` + weight 300 for contrast. |
| Captions, metadata, tags | DM Sans | `font-body` | 400 | 13px (`--s-text-sm`) | |
| Labels, eyebrows, badges | Syne or DM Sans | `font-heading` or `font-body` | 700 or 600 | 11px (`--s-text-xs`) | Uppercase. Letter-spacing 0.12em. |
| Prices, ratings, counters | DM Sans | `data-text` | 500 | varies | Always `tabular-nums`. |
| Dashboard headings | Syne | `font-heading` | 700 | varies | Never use Bebas Neue in dashboard. |

**Rules:**
- Bebas Neue NEVER appears below 40px
- Bebas Neue is ALWAYS uppercase (add `uppercase` class)
- Syne is NEVER italic
- DM Sans italic is ONLY for hero descriptions and pull quotes
- Dashboard/admin pages: only Syne 700 for headings, DM Sans for everything else. No Bebas Neue.

### Color Usage — Which Color Where

| UI Element | Light Mode | Dark Mode | Notes |
|---|---|---|---|
| Primary CTA buttons | `bg-s-coral` + `text-white` | Same | Hover: `bg-s-coral-hover` |
| Secondary CTA buttons | `bg-s-amber` + `text-white` | Same | Hover: `bg-s-amber-hover` |
| Accent elements, map pins | `text-s-blue` or `bg-s-blue` | Same | Hover: `bg-s-blue-hover` |
| Spa/wellness category tags | `bg-s-sage-subtle` + `text-s-sage-text` | `bg-s-sage-subtle` + `text-s-sage-text` | |
| "Top Rated" / "Neu" badges | `bg-s-yellow-subtle` + `text-s-yellow-text` | Same | |
| Category tags (general) | `bg-s-coral-subtle` + `text-s-coral-text` | Same | Use `-text` variant for WCAG AA |
| Dark depth blocks, dividers | `bg-s-plum` + `text-white` | `bg-s-plum-subtle` + `text-s-plum-text` | Plum inverts in dark mode |
| Supporting warm surfaces | `bg-s-sand-subtle` | `bg-s-sand-subtle` | Warm fill for secondary cards |
| Headings (large) | `text-s-ink` | `dark:text-s-dm-text` | |
| Body text | `text-s-ink-secondary` or `text-s-ink` | `dark:text-s-dm-text` | |
| Captions, metadata | `text-s-ink-tertiary` | `dark:text-s-dm-text/50` | |
| Disabled states | `text-s-ink-disabled` | `dark:text-s-dm-text/30` | + `opacity-40` + `pointer-events-none` |
| Success states | `bg-s-success-bg` + `text-s-success` | Same tokens auto-adjust | |
| Error states | `bg-s-error-bg` + `text-s-error` | Same tokens auto-adjust | |
| Warning states | `bg-s-warning-bg` + `text-s-warning` | Same tokens auto-adjust | |

**WCAG Color Rules:**
- `text-s-coral` (#E8624A) on cream FAILS AA for body text (<18px). Use `text-s-coral-text` (#7A2415) instead.
- `text-s-coral` is OK for: icons, badges, headings ≥18px bold, buttons (white bg).
- Every `*-subtle` background has a matching `*-text` color that passes AA. Always pair them.

### Shadow Usage

| Context | Token |
|---|---|
| Cards at rest | `shadow-card` |
| Cards on hover | `shadow-card-hover` |
| Buttons, small elevations | `shadow-warm-sm` |
| Active dropdowns, popovers | `shadow-warm-md` |
| Modals, sheets, floating panels | `shadow-warm-lg` |
| Hero floating elements | `shadow-warm-float` |
| Glassmorphism panels | `shadow-glass` |
| CTA pulse effect | `shadow-coral-glow` |

### Zone Guidelines (Design Thinking)

These are NOT enforced in code but guide design decisions:

| Zone | Pages | Typography | Colors | Animation | Shapes |
|---|---|---|---|---|---|
| 1 — Maximalist | Homepage, discovery | All three fonts | Full palette, full saturation | Hover effects + blob morphing + float | `rounded-blob-*`, `rounded-card`, `rounded-pill`, `.blob-interactive` |
| 2 — Soft | Category pages, search results, reviews | Syne + DM Sans | Full palette | Hover effects, `rounded-blob-d` resting → `rounded-blob-b` hover | `rounded-blob-d`, `rounded-card` |
| 3 — Functional | Booking, payment, auth, login | Syne + DM Sans | Coral CTA + cream base only | ZERO animation | `rounded-button`, `rounded-card` |
| 4 — Structured | Dashboard, admin, calendar, settings | Syne 700 + DM Sans | Palette on borders/icons only | ZERO animation | `rounded-card` max |

---
**Rule Enforcement:** If a prompt asks for a UI component that contradicts these rules, you must **refuse the specific contradiction** and implement the component using these rules instead.

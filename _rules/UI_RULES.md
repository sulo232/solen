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
- **Category Pages:** The discovery experience (`app/[locale]/search`) MUST feature a Split View architecture on desktop (50% Map, 50% Grid). On mobile, it uses a searchable and sortable list view with a floating toggle button to swap to a Map view without a page reload.
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
- **TutorialTour** (`components/TutorialTour.tsx`): 3 driver.js tooltip steps (search, categories, last-minute). Shows once after first login (`localStorage('tutorial_completed')`).
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

## 15b. Semantic Status Colors
| Token | Value | Usage |
|---|---|---|
| `text-s-success` / `bg-s-success` | `#2E7D32` | Success states, open indicators |
| `bg-s-success-bg` | `#E8F5E9` | Success backgrounds |
| `text-s-warning` / `bg-s-warning` | `#E65100` | Warning states, caution alerts |
| `bg-s-warning-bg` | `#FFF3E0` | Warning backgrounds |
| `text-s-error` / `bg-s-error` | `#C62828` | Error states, destructive actions |
| `bg-s-error-bg` | `#FFEBEE` | Error backgrounds |

## 16. BANNED tokens (do not use)

### Legacy / generic tokens
- ~~`text-dark`~~ use `text-s-ink`
- ~~`bg-dark`~~ use `bg-s-ink`
- ~~`bg-black`~~ / ~~`bg-black/*`~~ use `bg-s-ink` / `bg-s-ink/*`
- ~~`dark:text-dm-text`~~ use `dark:text-s-dm-text`
- ~~`dark:bg-dm-surface`~~ use `dark:bg-s-dm-surface`
- ~~`text-gray-*`~~ use `text-s-ink/*`
- ~~`bg-gray-*`~~ use `bg-s-bg-*` or `bg-s-sand`
- ~~`border-gray-*`~~ use `border-s-ink/*`

### Color tokens — use design system equivalents
- ~~`bg-amber-*`~~ / ~~`text-amber-*`~~ / ~~`border-amber-*`~~ / ~~`fill-amber-*`~~ → use `s-amber` tokens (`bg-s-amber`, `text-s-amber`, `fill-s-amber`, `bg-s-amber-subtle`, `text-s-amber-text`)
- ~~`bg-yellow-*`~~ / ~~`text-yellow-*`~~ / ~~`ring-yellow-*`~~ → use `s-yellow` tokens (`bg-s-yellow`, `bg-s-yellow-subtle`, `text-s-yellow-text`)
- ~~`bg-emerald-*`~~ / ~~`text-emerald-*`~~ → use `s-success` tokens (`bg-s-success`, `text-s-success`)
- ~~`bg-green-*`~~ / ~~`text-green-*`~~ → use `s-sage` tokens (`bg-s-sage`, `bg-s-sage-subtle`, `text-s-sage-text`)
- ~~`bg-purple-*`~~ / ~~`text-purple-*`~~ → use `s-plum` tokens (`bg-s-plum-subtle`, `text-s-plum-text`)
- ~~`bg-rose-*`~~ / ~~`text-rose-*`~~ → use `s-coral` tokens (`bg-s-coral`, `bg-s-coral-subtle`)
- ~~`bg-blue-100/200/300`~~ / ~~`text-blue-*`~~ → use `s-blue` tokens (`bg-s-blue-subtle`, `text-s-blue-text`, `bg-s-blue/20`)
- ~~`bg-red-*`~~ → use `s-error` tokens

### Shadow tokens — use warm multi-layer shadows
- ~~`shadow-sm`~~ → `shadow-warm-sm`
- ~~`shadow-md`~~ → `shadow-warm-md`
- ~~`shadow-lg`~~ → `shadow-warm-lg`
- ~~`shadow-xl`~~ / ~~`shadow-2xl`~~ → `shadow-warm-lg`
- ~~`drop-shadow-sm`~~ / ~~`drop-shadow-md`~~ → avoid; use `shadow-warm-sm` if elevation needed

### Border radius tokens — use design token radii
- ~~`rounded-lg`~~ → `rounded-button` (8px)
- ~~`rounded-xl`~~ / ~~`rounded-2xl`~~ / ~~`rounded-3xl`~~ → `rounded-card` (12px)
- ~~`rounded-full`~~ → `rounded-pill` (9999px)
- ~~`rounded-sm`~~ → only acceptable for data visualization cells (heatmaps, charts)
- Standard Tailwind `rounded-*` should NOT be used — always use `rounded-card`, `rounded-button`, `rounded-pill`, or `rounded-blob-*`

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

## 19. Premium Design Enforcement Rules

> These rules enforce Apple-level premium consistency across the entire site. They are NOT optional and apply to ALL components in ALL zones.

### 19a. 8-Point Grid System (Spacing)
Every margin, padding, gap, and element size MUST be a multiple of 8px (using Tailwind's 4px base: `2` = 8px, `4` = 16px, `6` = 24px, `8` = 32px, `10` = 40px, `12` = 48px, `16` = 64px).

**Allowed spacing values:** `gap-2`, `gap-4`, `gap-6`, `gap-8`, `p-2`, `p-4`, `p-6`, `p-8`, `py-10`, `py-12`, `py-16`, `m-2`, `m-4`, `m-6`, `m-8`

**Exceptions (4px sub-grid for micro-spacing):** `gap-1` (4px), `gap-1.5` (6px), `gap-3` (12px), `p-1`, `p-1.5`, `p-3`, `py-0.5`, `px-2` — allowed ONLY inside compact elements (badges, pills, icon buttons, inline chips). NOT for section-level or card-level spacing.

**BANNED spacing:** `gap-5` (20px), `p-5` (20px), `gap-7` (28px), `p-7` (28px), `gap-9` (36px) — these break the 8pt rhythm.

### 19b. Nested Corner Radius Rule
When a rounded element contains another rounded element with padding between them, the outer radius MUST be larger:

**Formula:** `Outer Radius ≥ Inner Radius + Padding`

**Standard nesting pairs:**
- Card (12px) → Button (8px) with `p-4` (16px) → ✅ Valid (12 ≥ 8 is true, and visually harmonious)
- Pill (9999px) → Icon circle (9999px) → ✅ Valid (both fully round is acceptable)
- Card (12px) → Card (12px) → ❌ Invalid (nested cards need different radii)

### 19c. Shadow Stacking Rule (Premium Shadows)
Never use harsh, single-layer drop shadows. All shadow tokens in `tailwind.config.js` already implement multi-layer stacking. The rules:

1. **ALWAYS** use design token shadows (`shadow-card`, `shadow-warm-sm`, `shadow-warm-md`, `shadow-warm-lg`, `shadow-warm-float`, `shadow-glass`, `shadow-coral-glow`)
2. **NEVER** use generic Tailwind shadows (`shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`)
3. Shadows should use warm `rgba(26,18,9,*)` tinting, NOT cool `rgba(0,0,0,*)`
4. Cards: `shadow-card` at rest → `shadow-card-hover` on hover
5. Buttons: `shadow-warm-sm` (subtle)
6. Modals/sheets: `shadow-warm-lg`
7. Hero elements: `shadow-warm-float`

### 19d. Color Restraint — 60-30-10 Rule
| Proportion | Role | Tokens |
|---|---|---|
| 60% | Neutral base | `bg-s-bg-base` (cream), `bg-s-dm-bg` (dark) |
| 30% | Secondary surfaces | `bg-s-bg-raised` (white cards), `bg-s-bg-surface`, `bg-s-dm-surface` |
| 10% | Accent / brand | `bg-s-coral` (CTAs), `text-s-coral` (highlights), `bg-s-amber` (secondary CTA) |

**Rules:**
- Avoid pure black `#000000` — use `s-ink` (#1A1209) for dark elements
- Avoid pure white `#FFFFFF` for backgrounds — use `s-bg-base` (#FAF6EF). `bg-white` / `bg-s-bg-raised` is OK for card surfaces.
- Accent colors (coral, amber, blue) should appear on CTAs, active states, and small highlights — NOT on large surface areas
- Every page should feel 60% cream/dark base, 30% white/surface cards, 10% coral accents

### 19e. Cheap vs Premium Audit Matrix
Use this checklist when building or reviewing ANY component:

| Element | ❌ Looks Cheap | ✅ Feels Premium |
|---|---|---|
| Borders | Thick, high-contrast, solid lines | 1px `border-s-ink/5` barely-there lines |
| Buttons | Gradients, heavy shadows, all-caps body text | Solid `bg-s-coral`, subtle `hover:bg-s-coral-hover`, crisp text |
| Spacing | Cramming everything onto one screen | Whitespace — `py-12`+ between sections, `p-4`+ inside cards |
| Icons | Mixing filled and outlined icons | Consistent `lucide-react` outlined set (filled ONLY for rating stars) |
| Dividers | Heavy `<hr>` lines between content | Whitespace or `border-s-ink/5` hairlines |
| Shadows | Generic `shadow-md` | Warm `shadow-card` / `shadow-warm-*` tokens |
| Typography | Random font sizes, inconsistent weights | Strict hierarchy: display → heading → body with token sizes |
| Border radius | Mixed `rounded-lg`, `rounded-2xl`, `rounded-full` | Consistent `rounded-card`, `rounded-button`, `rounded-pill` |
| Colors | Raw Tailwind colors (`yellow-400`, `emerald-500`) | Design tokens (`s-yellow`, `s-success`) |

## 20. Next-Gen Fluidity & Urgency (Phase 2 Vision)
- **Map vs Grid Equality:** The discovery experience (`app/[locale]/search`) MUST feature a Split View architecture on desktop (50% Map, 50% Grid) and a "Coin-Flip" floating action button on mobile that instantly swaps views without a page reload.
- **Hyper-Fluid Booking Success:** Do not use full-page redirects for booking success. The `[Book Now]` button MUST use Framer Motion `layoutId` to compress, morph into a circle spinner, and then expand into a glassmorphic Receipt Card Modal containing a self-drawing premium SVG checkmark. **No Confetti.**
- **Sneaker-Drop Urgency (Last-Minute):** The Last-Minute booking section MUST enforce high urgency. Disappearing slots require `shadow-coral-glow` pulsing. Slots expiring in <2 hours require a floating translucent countdown timer.
- **Playful, Premium Micro-Delight:** Enforce `.blob-interactive` squish physics on major interactive cards. Favoriting a salon MUST trigger a haptic heart-pop animation (`scale: 1.2` bezier easing down to `scale: 1.0`).

---
**Rule Enforcement:** If a prompt asks for a UI component that contradicts these rules, you must **refuse the specific contradiction** and implement the component using these rules instead.


## 13. 🎨 DESIGN TOKEN CONSISTENCY RULES (MANDATORY)

> **CONTEXT**: A full codebase scan on 2026-03-19 revealed 1,008 refs of `text-dark` (legacy token) vs 9 refs of `text-s-ink` (design system token). Both resolved to the same hex, but the naming inconsistency made the codebase unmaintainable. These rules prevent this from happening again.

### Rule 20: BANNED TOKEN LIST — NEVER USE THESE

The following CSS classes are BANNED. If you write ANY of these, the code is wrong. No exceptions.

| ❌ BANNED | ✅ USE INSTEAD | Why |
|---|---|---|
| `text-dark` (any opacity) | `text-s-ink` / `text-s-ink/50` etc. | Legacy token, use design system |
| `bg-dark` (any opacity) | `bg-s-ink` / `bg-s-ink/40` etc. | Legacy token |
| `border-dark` | `border-s-ink/10` | Legacy token |
| `bg-black` | `bg-s-ink` | Violates warm palette rule |
| `bg-gray-*` | `bg-s-bg-surface` / `bg-s-sand` | Cold gray, use warm |
| `text-gray-*` | `text-s-ink/*` (opacity) | Cold gray, use warm |
| `border-gray-*` | `border-s-ink/*` (opacity) | Cold gray, use warm |
| `dark:bg-dm-*` | `dark:bg-s-dm-*` | Missing `s-` prefix |
| `dark:text-dm-*` | `dark:text-s-dm-*` | Missing `s-` prefix |
| `dark:border-dm-*` | `dark:border-s-dm-*` | Missing `s-` prefix |
| `dark:text-white` (on non-buttons) | `dark:text-s-dm-text` | Use warm off-white |
| `dark:bg-black` | `dark:bg-s-dm-bg` | Use warm dark |
| `shadow-teal-glow` | `shadow-warm-sm` | Old branding |
| `bg-mesh-teal` | `bg-s-bg-base` | Old branding |
| `accent-teal` | `accent-s-coral` | Old branding |
| `border-t-teal` | `border-t-s-coral` | Old branding (found in Spinner.tsx) |
| `bg-amber-*` / `border-amber-*` / `fill-amber-*` | `bg-s-amber-subtle` / `border-s-amber/20` / `fill-s-amber` | Generic Tailwind, use design tokens |
| `bg-yellow-*` / `text-yellow-*` / `ring-yellow-*` | `bg-s-yellow-subtle` / `text-s-yellow-text` | Generic Tailwind, use design tokens |
| `bg-emerald-*` / `text-emerald-*` | `bg-s-success` / `text-s-success` | Generic Tailwind, use semantic token |
| `bg-green-*` / `text-green-*` | `bg-s-sage` / `text-s-sage-text` | Generic Tailwind, use design tokens |
| `bg-purple-*` / `text-purple-*` | `bg-s-plum-subtle` / `text-s-plum-text` | Generic Tailwind, use design tokens |
| `bg-rose-*` / `text-rose-*` | `bg-s-coral-subtle` / `text-s-coral-text` | Generic Tailwind, use design tokens |
| `bg-blue-100/200/300` / `text-blue-*` | `bg-s-blue-subtle` / `text-s-blue-text` | Generic Tailwind, use design tokens |
| `bg-red-*` | `bg-s-error-bg` / `bg-s-error` | Generic Tailwind, use semantic token |
| `shadow-sm` / `shadow-md` / `shadow-lg` | `shadow-warm-sm` / `shadow-warm-md` / `shadow-warm-lg` | Cold shadows → warm design tokens |
| `shadow-xl` / `shadow-2xl` | `shadow-warm-lg` | Cold shadows → warm design tokens |
| `rounded-lg/xl/2xl/3xl` | `rounded-card` / `rounded-button` / `rounded-pill` | Use design token radii (see UI_RULES §10) |
| `rounded-full` | `rounded-pill` | Use design token (9999px) |
| Any emoji in JSX | Lucide React icon | UI_RULES §5: no emoji in UI |

**Enforcement**: After EVERY commit, run:
```bash
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|dark:bg-dm-|dark:text-dm-|shadow-teal|accent-teal|bg-mesh-teal|border-t-teal|bg-amber-|border-amber-|fill-amber-|bg-yellow-|text-yellow-|ring-yellow-|bg-emerald-|text-emerald-|bg-green-|text-green-|bg-purple-|text-purple-|bg-rose-|text-rose-|shadow-sm[^a]|shadow-md|shadow-lg|shadow-xl|shadow-2xl|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink\|s-amber\|s-yellow\|s-success\|shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob" | head -10
```
If this returns ANY results, fix them before pushing.

### Rule 21: DESIGN TOKEN VALIDATION — BEFORE EVERY COMMIT

Before committing ANY `.tsx` file change, you MUST verify:

1. **No banned tokens introduced** (Run the grep from Rule 20)
2. **Every `bg-white` has a `dark:bg-s-dm-*` pair** (unless on a coral button or toggle knob)
3. **Every `text-s-ink` has a `dark:text-s-dm-text` pair** (for primary text)
4. **No hardcoded hex colors** — all colors must use tailwind.config tokens (exception: SVG brand logos like Google)
5. **No hardcoded `CHF`** — use `formatCurrency()` from `lib/format-currency.ts`
6. **No new `style={{}}` for values achievable with Tailwind**

```bash
# Quick validation script — run after every commit:
echo "=== Banned tokens ===" && \
grep -Ercn "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-t-teal|bg-amber-|border-amber-" components/ app/ --include="*.tsx" | grep -v "s-ink\|s-dm\|s-amber\|darkMode" | wc -l && \
echo "=== Dark mode pairs ===" && \
grep -rn "bg-white" components/ --include="*.tsx" | grep -v "dark:\\|toggle\\|CookieBanner\\|//\\|knob" | wc -l && \
echo "=== Hardcoded hex ===" && \
grep -Ern "#[0-9a-fA-F]{3,6}" components/ --include="*.tsx" | grep -v "//\|import\|svg" | wc -l && \
echo "=== All should be 0 ==="
```

### Rule 22: NEW TOKENS REQUIRE UI_RULES.md DOCUMENTATION

If you add ANY new:
- Color token to `tailwind.config.js`
- Custom utility class (like `rounded-card`, `shadow-glass`)
- Font family or typography class
- z-index value

You MUST also update `UI_RULES.md` with:
1. The token name, value, and purpose
2. Which components should use it
3. What it replaces (if deprecating an old token)

**Never introduce a parallel naming system.** Before creating a new token, check if an existing one serves the same purpose. If `s-ink` already means `#1A1209`, don't create `dark` with the same value.

### Rule 23: DOCUMENTATION-CODE CONSISTENCY CHECK

> **CONTEXT**: On 2026-03-19, `UI_RULES.md` documented dark mode colors (`#0F0F1A`) that didn't match `tailwind.config.js` (`#151009`). The docs and code were out of sync for months without anyone noticing.

Whenever you modify ANY of these files, you MUST cross-check ALL FOUR for consistency:
- `tailwind.config.js` (colors, shadows, radii)
- `globals.css` (CSS variables)
- `UI_RULES.md` (design tokens documentation)
- `CLAUDE.md` Section 13 (design rules)

Checks:
1. Every color hex in `tailwind.config.js` must match its documentation in `UI_RULES.md`
2. Every CSS variable in `globals.css` must correspond to a Tailwind token
3. Every banned token in `CLAUDE.md` Rule 20 must also appear in `UI_RULES.md` Section 16
4. The dark mode colors in all files must be identical

```bash
# Cross-check dark mode values:
grep -n "151009\|1E1710\|F5EEE4" tailwind.config.js UI_RULES.md CLAUDE.md
# All files should show the SAME hex values
```

### Rule 24: DUPLICATE CONSTANT DETECTION

> **CONTEXT**: On 2026-03-19, `LanguageSwitcher.tsx` had `LOCALE_FLAGS` and `LOCALE_LABELS` with identical values, causing the `DE DE` duplication bug. `ClientTags.tsx` had a key named `teal` that actually mapped to coral styles.

Before committing, check for:
1. Two `Record<string, string>` constants in the SAME file with identical keys → delete one
2. A constant key that doesn't match its actual meaning (e.g., `teal` mapping to coral) → rename it
3. If renaming a key that may be stored in the database → add backward compatibility mapping

```bash
# Check for files with multiple Record<string, string> constants:
grep -rn "Record<string, string>" components/ --include="*.tsx" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -5
# If any file appears 2+ times, inspect for duplicates
```

### Rule 25: NEVER USE `getUser()` IN API ROUTES OR MIDDLEWARE

> **CONTEXT**: This bug has been fixed TWICE (2026-03-18 and 2026-03-19). `supabase.auth.getUser()` makes a **network call** from Vercel Edge → Supabase to validate the JWT. This call **times out** on Vercel's edge network, returning `user: null` even when the session cookie is valid. This kills ALL session persistence — users log in successfully but get bounced to the login page on every subsequent navigation.

**ALWAYS use `getSession()`** — it reads the JWT directly from cookies with **zero network calls**.

```typescript
// ✅ CORRECT — reads JWT from cookies, no network call:
const { data: { session } } = await supabase.auth.getSession();
const user = session?.user ?? null;

// ❌ BANNED — makes network call that TIMES OUT on Vercel Edge:
const { data: { user } } = await supabase.auth.getUser();
```

**This applies to:**
- `middleware.ts` (runs on EVERY request)
- ALL files in `app/api/` (route handlers)
- `lib/supabase.ts` `getSessionUser()` helper

**Enforcement:**
```bash
grep -rn "auth.getUser()" middleware.ts app/api/ lib/supabase.ts --include="*.ts"
# Must return 0 results. If ANY results found, change to getSession().
```

### Rule 26: NO DEAD CODE — EVERY COMPONENT MUST BE IMPORTED AND RENDERED

> **CONTEXT**: On 2026-03-20, Claude Code executed the Discovery roadmap and created 15+ components (PostFromDiscover, FilterDrawer, FeaturedBoards, etc.) as standalone files but NEVER imported or rendered them on any page. The components were "built" but invisible to users — pure dead code.

When creating a new component:
1. **CREATING** the file is NOT enough. You MUST also import and render it on the target page.
2. After building each component, immediately `grep -rn "ComponentName" app/ components/` to verify it's imported somewhere.
3. If a component is conditionally rendered (e.g., floating button), it still MUST be imported and placed in the JSX tree with its condition.
4. At the END of each phase, run: `grep -rn "from.*discovery" app/ components/ | grep -c import` and compare against the number of files in the feature directory. If there are more files than imports → you have dead code.

```bash
# Verify no orphan components:
for f in components/discovery/*.tsx; do
  name=$(basename "$f" .tsx)
  count=$(grep -rn "$name" app/ components/ --include="*.tsx" | grep -v "^$f" | wc -l)
  [ "$count" -eq 0 ] && echo "⚠️ DEAD CODE: $f is never imported"
done
```

**This rule applies to ALL new features, not just Discovery.**

### Rule 27: PAGES MUST NOT DUPLICATE ROOT LAYOUT ELEMENTS

> **CONTEXT**: On 2026-03-20, the Discovery page rendered its own `<Header />` and `<BottomNav />` on top of the ones already rendered by `app/[locale]/layout.tsx`. This caused a duplicate navigation bar, and the page-level Header had no `locale` prop, producing `/undefined/coiffeur` links.

**The root layout (`app/[locale]/layout.tsx`) already renders:**
- `<Header locale={locale} />`
- `<BottomNav />`
- `<CookieBanner />`
- `<PWAInstallPrompt />`

**Rules:**
1. **NEVER** import or render `Header`, `BottomNav`, `CookieBanner`, or `PWAInstallPrompt` inside any page component under `app/[locale]/`. They are already there.
2. Page components should render ONLY their content (e.g., `<main>...</main>`), not layout wrappers.
3. If a page needs to opt OUT of the header (like dashboard pages), use the existing `isHidden` check in `Header.tsx` — don't add/remove Header instances.

```typescript
// ❌ WRONG — page duplicates layout elements
export default function SomePage() {
  return (
    <>
      <Header />        {/* DUPLICATE — already in layout.tsx */}
      <main>...</main>
      <BottomNav />      {/* DUPLICATE — already in layout.tsx */}
    </>
  );
}

// ✅ CORRECT — page renders only its content
export default function SomePage() {
  return (
    <main className="min-h-screen ...">
      {/* page content only */}
    </main>
  );
}
```

### Rule 28: EVERY TYPE REFERENCED MUST EXIST IN `lib/types.ts`

> **CONTEXT**: On 2026-03-20, Claude Code created 15+ files referencing `DiscoveryItem`, `DiscoveryCategory`, `DiscoveryGender` from `@/lib/types`, but never added those types to the file. Every component had import errors. The types were silently missing across the entire feature.

**Rules:**
1. Before writing `import type { Foo } from "@/lib/types"` in ANY file, verify `Foo` is actually exported from `lib/types.ts`.
2. If introducing a new type for a feature, define it in `lib/types.ts` FIRST (Phase 0 / infrastructure), then import it in later phases.
3. After creating all files for a feature, verify: `npx tsc --noEmit 2>&1 | grep "has no exported member" | head -10` — must return 0 results.
4. Type definitions should match the database schema exactly (column names, nullable fields, array types).

```bash
# Verify all type imports resolve:
npx tsc --noEmit 2>&1 | grep "has no exported member"
# Must return 0 results.
```


### Rule 29: POST-EXECUTION SMOKE TEST (MANDATORY)

> **CONTEXT**: On 2026-03-20, a 10-phase feature was "completed" but: the feed API returned 500 (table didn't exist), the admin page 404'd (middleware blocked it), types were missing (never defined), navigation showed wrong language (locale not passed), and 4 components were never imported anywhere. None of this was caught because there was no smoke test phase.

**After completing ALL phases of any feature roadmap, you MUST perform a smoke test:**

1. **Build passes**: `npm run build` with 0 errors
2. **Type check passes**: `npx tsc --noEmit` with 0 errors  
3. **No dead components**: Every new `.tsx` file is imported at least once
4. **No missing types**: No `has no exported member` errors
5. **No duplicate layout elements**: New pages don't import Header/BottomNav
6. **Feature flag exists**: If using `checkFeatureEnabled("x")`, verify `x` is in `feature_flags` table
7. **Middleware updated**: If creating admin-only pages, verify path is in `adminOnlyPaths` in `middleware.ts`
8. **Translations exist**: If using `t("key")`, verify key exists in ALL 4 locale files (de/en/fr/it)
9. **Migrations noted**: If SQL migrations are required, add a prominent `⚠️ RUN MIGRATION FIRST` section at the top of the roadmap

**A feature is NOT complete until all 9 checks pass.**

### Rule 30: PREMIUM DESIGN ENFORCEMENT (MANDATORY)

> **CONTEXT**: A design audit on 2026-03-23 found ~125 violations of the premium design system. Generic Tailwind classes were used instead of design tokens, breaking Apple-level consistency.

**Before writing ANY UI code, you MUST follow `UI_RULES.md` §19 (Premium Design Enforcement Rules):**

1. **8-Point Grid**: ALL spacing must be 8px multiples. NEVER use `gap-5`, `p-5`, `gap-7`, `p-7`, `gap-9`
2. **Design Token Shadows**: NEVER use `shadow-sm/md/lg/xl/2xl`. ALWAYS use `shadow-card`, `shadow-warm-sm/md/lg`, `shadow-warm-float`, `shadow-glass`
3. **Design Token Radii**: NEVER use `rounded-lg/xl/2xl/3xl/full`. ALWAYS use `rounded-card`, `rounded-button`, `rounded-pill`, `rounded-blob-*`
4. **Design Token Colors**: NEVER use raw Tailwind colors (`yellow-400`, `emerald-500`, `green-300`, `purple-300`, `rose-300`, `blue-200`). ALWAYS use `s-*` tokens.
5. **60-30-10 Color Rule**: 60% neutral base, 30% card surfaces, 10% accent colors
6. **Cheap vs Premium Matrix**: Check every new component against the audit matrix in `UI_RULES.md` §19e

```bash
# Quick premium audit — run before every push:
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg[^a]|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|bg-yellow-|bg-emerald-|bg-green-|bg-purple-|bg-rose-|bg-blue-[0-3]|gap-5|gap-7|gap-9" components/ app/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|s-dm\|//\|node_modules" | head -10
# Must return 0 results.
```


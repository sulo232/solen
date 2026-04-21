# 🎨 Solen.ch UI & Design Rules

> **CRITICAL FOR CLAUDE CODE:** This file contains the foundational design rules for Solen.ch. These rules **must not be broken or altered** under any circumstances. Check this file before making any UI decisions.

---

## 1. Core Aesthetic
- **Light + Dark Mode:** The platform supports both light and dark mode via `[data-theme="dark"]` on the `<html>` element. Default is system preference.
  - Dark background: `#151009` (`s-dm-bg`), Dark surface: `#1E1710` (`s-dm-surface`), Dark text: `#F5EEE4` (`s-dm-text`)
  - Dark mode is toggled via: `document.documentElement.setAttribute('data-theme', 'dark')`
  - Preference stored in `localStorage('solen-theme')`, read before first render to prevent flash
  - All dark surfaces stay warm — never pure black (#000), never grey
  - Brand colours brighten in dark mode (coral→#F07560, amber→#E8A030, blue→#85BCD8)
  - Plum INVERTS to lavender (#C090B4) in dark mode
  - Transition: `html { transition: background-color 300ms ease, color 300ms ease }` — only these two properties
- **V5 Glass System (Intentional, Not Universal):**
  - **Rule**: Glass = floating UI **only** (header on scroll, search dropdown, modals). Cards = solid white. NEVER glass on content cards.
  - **`.glass-frost`** (Floating overlays): `backdrop-filter: blur(20px) saturate(1.4)`, bg `rgba(255,255,255,0.72)`, border `rgba(255,255,255,0.50)` — used on header pill (scrolled), modals, dropdown overlays
  - **`.glass-search`** (Search inputs): `backdrop-filter: blur(16px) saturate(1.3)`, coral focus ring `rgba(232,98,74,0.40)` — used on search bar container
  - **`.glass-toolbar`** (Filter bar): `backdrop-filter: blur(16px) saturate(1.2)`, bottom border — sticky filter bar below header
  - **`.card-v4`** (Content cards): **Solid white** `#ffffff`, NO glass, NO backdrop-filter — 16px radius, layered shadow, CSS hover lift
  - **Zone restrictions:** Glass allowed in Zone 1 + Zone 2 floating overlays only. **NO glass in Zone 3 or Zone 4 ever.** NO glass on content cards in ANY zone.
  - Always pair `backdrop-filter` with `-webkit-backdrop-filter` for Safari/iOS.
  - Never stack more than 3 glass elements visible simultaneously.
  - **Blobs are RETIRED**: `<BlobBackground>`, `.blob-interactive`, decorative blob shapes — all purged. Use `.ambient-v5` radial gradients instead.
- **No Glowing Borders:** Do not use AI-style glowing borders or generic neon shadows. Stick to clean, Apple-depth shadow system.
- **Premium Feel:** The UI must feel like Airbnb × Fresha — multi-layer warm shadows, solid surfaces for content, glass exclusively for floating UI, consistent light source.

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
- **Display (≥36px):** `Bebas Neue` — hero headings, large impact text. Always uppercase. Line-height: 0.85–0.92. **Exceptions:** 22px nav logo (context makes it readable), 22px category tile labels (gradient bg gives context).
- **Headings:** `Syne`
- **Body Text:** `DM Sans`
- **Data/Numbers:** `DM Sans` with `tabular-nums` (class: `data-text`). Space Grotesk is retired.
- **Playful Accents:** Use Bebas Neue for section labels, category names, or impact headers. Mix font weights to create a playful but premium hierarchy.

## 4. Animations & Interactions
- **V5 Motion System:**
  - **150ms (fast):** Colour changes, hover backgrounds, immediate feedback
  - **250ms (mid):** Shadow transitions, button press, transform-based hover
  - **400ms (slow):** Card hover lift + shadow. V5 easing: `cubic-bezier(0.23, 1, 0.32, 1)`
  - **500ms (image):** Image zoom inside cards on hover (`img-hover-zoom` → `scale(1.03)`)
- **V5 Easing:** Standard `cubic-bezier(.4,0,.2,1)`, V5 deceleration `cubic-bezier(0.23, 1, 0.32, 1)` for card/reveal transitions.
- **Springs — ALLOWED ONLY FOR**: Category icon micro-animations, heart bounce on favorite, avatar pop on login. Max params: `stiffness: 400, damping: 25`. Use `framer-motion` spring. **NEVER** use springs for layout/position transitions (page loads, card reveals, grid stagger).
- **Stagger:** 60ms between children in grids and the category row (Airbnb-style load animation). All items start at `{ opacity: 0, y: 20 }`.
- **Page-load category animation:** On homepage mount, the category row items animate in sequentially with 60ms stagger. Animation plays once on load, then idles.
- **Icon idle animation:** Category icons play a 1-cycle micro-animation on page-load stagger. On desktop, it replays on hover. E.g. scissors snip, nails drip, lotus ripples.
- **V5 Card Hover:** `.card-v4:hover` → `translateY(-4px)` + layered shadow upgrade, 400ms `cubic-bezier(0.23, 1, 0.32, 1)`. Image zoom begins on hover, continues smoothly.
- **Button Hover:** `hover:brightness-[1.06]`, 150ms. **Active:** `active:scale-[0.98]`, 100ms.
- **Tab Switching:** Use a smooth **slide left/right** animation (like turning pages), not a simple fade.
  - **Exception — Filter/Category tabs:** When a tab switch changes a **filter state** (not a page section), use a 150ms `opacity` fade on the content grid only — NOT a slide animation.
- **V5 Stagger Reveals:** Cards stagger with **60ms delay** between children. Section headings slide-in from bottom, 0.5s. Uses `cubic-bezier(0.23, 1, 0.32, 1)` easing.
- **Blobs RETIRED:** `.hero-blob`, `.blob-interactive`, all blob animations — completely removed. Ambient backgrounds use `.ambient-v5` static radial gradients.
- **Zone restrictions:** Reveals/stagger = Zone 1+2. Card hover = Zone 1+2. **NO animation in Zone 3 or Zone 4.**
- **prefers-reduced-motion:** MANDATORY global wrapper that makes all animations instant. Not optional. Not per-component.

## 5. Structural Rules
- **Category Pages:** The discovery experience (`app/[locale]/search`) MUST feature a Split View architecture on desktop (50% Map, 50% Grid). On mobile, it uses a searchable and sortable list view with a floating toggle button to swap to a Map view without a page reload.
- **Mobile Booking Flow:** Must use a mobile **bottom sheet** for booking (like Airbnb "Check availability").
- **Desktop Booking Flow:** Use a sticky sidebar calendar.
- **Global Header:** Must be present and consistent across all Next.js (`app/`) pages. It should transition from transparent to solid (with blur) on scroll.
- **Loading States:** Use `<Skeleton variant="card" />` for full-page loading (grid of shimmer cards). Use `<Spinner>` only for inline/button loading states.
- **Empty States:** Use `<EmptyState>` with SVG icons and helpful text. Optional `illustration` prop adds minimal line art SVGs above the icon.
- **Mobile Navigation (V5 UPDATED):** `<BottomTabBar />` at `components/layout/BottomTabBar.tsx` — max 4 tabs (Discover, Search, Saved, Account). Uses `.glass-frost` with `border-t border-white/20`. The hamburger menu in `Header.tsx` is **deprecated on mobile** — hide it on `md:` breakpoint. Desktop header keeps the pill nav unchanged.
- **Icons:** Use SVG icons (lucide-react preferred). No raw emojis for functional UI elements (emoji render differently on every OS, don't scale, don't inherit CSS colour). Use SVG icons or gradient colour fills instead.

## 6. Layout Specifics
- **Login:** Centered, single glassmorphic card.
- **Salon Cards:** Must display: Cover photo + Name + Rating + Glass Category Pills + Location. The cover photo MUST use a strict **1:1 square** aspect ratio (`aspect-square relative overflow-hidden`) with `object-cover` — enforced on all viewports, no responsive breakpoint variants. Skeletons must match (`aspect-square`) for CLS parity.
- **Category Icons/Tiles:** Must use a strict `1:1` aspect ratio (`aspect-square relative overflow-hidden`) with `object-cover` so images fit like a profile picture without stretching.
- **Dashboard Stats:** Must include count-up number animations and mini sparkline charts.
- **Last-Minute:** Must include an urgency timer counting down to when the appointment *starts*. 

## 7. 21st.dev Components
- **InteractiveHoverButton:** Use for all primary CTAs. Customized with `bg-s-coral` and `text-white`.
- **ExpandableNavTabs:** RETIRED. We now use a single top-bar navigation architecture across all devices.
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
Applied via `[data-theme="dark"]` on the `<html>` element. All dark surfaces stay warm — never pure black, never grey.

| Token | Light | Dark |
|---|---|---|
| Background | `--bg` (#FAF6EF) | `--bg` (#151009) deep warm black |
| Surface | `--sur` (#F3EDE2) | `--sur` (#1E1710) |
| Raised | `--raised` (#FFFFFF) | `--raised` (#26201A) |
| Sunken | `--sunken` (#EDE5D8) | `--sunken` (#120D07) |
| Text | `--ink` (#1A1209) | `--ink` (#F5EEE4) warm white |
| Secondary text | `--ink2` (#4A3D2E) | `--ink2` (#C8BAA8) |
| Muted text | `--ink3` (#8A7A66) | `--ink3` (#8A7A66) same |
| Disabled text | `--ink4` (#C4B8A6) | `--ink4` (#4A4035) |
| Coral | `--coral` (#E8624A) | `--coral` (#F07560) brighter |
| Amber | `--amber` (#D4870A) | `--amber` (#E8A030) brighter |
| Blue | `--blue` (#6BA3C8) | `--blue` (#85BCD8) lighter |
| Plum | `--plum` (#4A1E3C) | `--plum` (#C090B4) inverts to lavender |
| Sage | `--sage` (#7BA688) | `--sage` (#96C0A0) |
| Yellow | `--yellow` (#F2C144) | `--yellow` (#F5CC60) |
| Border | `--b` rgba(26,18,9,.08) | `--b` rgba(245,238,228,.08) |
| Nav glass | Tier 1: rgba(250,246,239,.82) | rgba(21,16,9,.88) |
| Grain blend | multiply | overlay |

## 10. Border Radius — V5 Shape System

### ~~Tier 1 — Blob shapes~~ → **RETIRED (V5)**
> All blob shape tokens (`rounded-blob-a/b/c/d/e`) and `.blob-interactive` have been purged from the codebase as part of the V5 overhaul. Do NOT add them back.

### Tier 2 — Containers (V5 updated radii from `tailwind.config.js`)
| Token | Value | Usage |
|---|---|---|
| `rounded-card` | **16px** | Salon cards, listing cards, content blocks |
| `rounded-card-lg` | **20px** | Hero cards, feature cards, modals |
| `rounded-panel` | 16px | Inner panels within a card, review cards, section content blocks |
| `rounded-input` | **12px** | Form inputs, select dropdowns, dashboard cards (Zone 4), toast, dropdown menus |
| `rounded-search` | **99px** | Search bar outer container (fully rounded) |

### Tier 3 — Interactive (Pill) — ALL interactive elements
| Token | Value | Usage |
|---|---|---|
| `rounded-pill` | **9999px** | Availability pills, tags, nav pill, filter chips |
| `rounded-btn` | **99px** | ALL CTA buttons, action buttons |

**CRITICAL RULES:**
- **NEVER** use blob shapes anywhere — they are retired
- **NEVER** morph a card's border-radius on hover (cards translate only, radius stays fixed)
- **NEVER** use sharp corners (0px radius) anywhere
- Standard Tailwind `rounded-*` should NOT be used — use the design tokens

## 11. Shadows — Apple 5-Level System
All shadows use warm tinting `rgba(26,18,9,x)` — NEVER `rgba(0,0,0,x)`. Two layers minimum (contact + ambient). 1:3 offset:blur ratio.

| Token | CSS Value | Usage |
|---|---|---|
| `--sh-xs` / `shadow-card` | `0 1px 2px rgba(26,18,9,.06)` | Tags, availability pills, badges, minor UI labels |
| `--sh-sm` / `shadow-warm-sm` | `0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)` | All buttons at rest, nav pill, card resting, form inputs |
| `--sh-md` / `shadow-warm-md` | `0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)` | Glass stat/review cards, search bar at rest, dropdowns, tooltips |
| `--sh-lg` / `shadow-warm-lg` | `0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07)` | Search bar on :focus-within, modals, bottom sheet, active engagement |
| `--sh-xl` / `shadow-card-hover` | `0 8px 16px rgba(26,18,9,.10), 0 20px 60px rgba(26,18,9,.08)` | Card on :hover, category tile hover, primary CTA hover. NEVER at rest. |
| `--sh-pressed` | `0 1px 1px rgba(26,18,9,.12), inset 0 1px 2px rgba(26,18,9,.06)` | All buttons :active state + translateY(+1px) |
| `--sh-coral` / `shadow-coral-glow` | `0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)` | btn-coral resting (colour-matched glow) |
| `--sh-coral-h` | `0 4px 8px rgba(232,98,74,.32), 0 8px 28px rgba(232,98,74,.22)` | btn-coral :hover |
| `--sh-amber` | `0 2px 4px rgba(212,135,10,.22), 0 4px 16px rgba(212,135,10,.14)` | btn-amber resting |
| Glass inset highlight | `inset 0 1px 0 rgba(255,255,255,.70)` | All glass elements (top-edge light highlight) |

Transition: `box-shadow 220ms cubic-bezier(.4,0,.2,1)` — slightly slower than background transitions.

## 12. Typography
| Token | Font | Usage |
|---|---|---|
| `font-display` | Bebas Neue | Hero titles, large splash text |
| `font-heading` | Syne | Section headers, card titles, nav |
| `font-body` | DM Sans | Body text, descriptions, UI text |
| `data-text` | DM Sans / tabular nums | Prices, ratings, scores, counters |

Body default = `font-body` (set on `<body>`). You don't need `font-body` class unless overriding.

## 13. V5 Glass System — Intentional, Not Universal

**RULE:** Glass = floating UI **only** (header on scroll, search pill, modals, pills/tags in Zone 1+2). Content listing cards use solid white. NEVER apply `backdrop-filter` to listing cards.

| Class | Blur | Background | Border | Usage | Zone |
|---|---|---|---|---|---|
| **`.glass-frost`** | `blur(20px) saturate(1.4)` | `rgba(255,255,255,0.72)` | `rgba(255,255,255,0.50)` | Header pill (scrolled), modals, dropdown overlays, **bottom tab bar** | Zone 1+2 |
| **`.glass-search`** | `blur(16px) saturate(1.3)` | `rgba(255,255,255,0.82)` | `rgba(26,18,9,0.06)` + coral focus | Search bar container (ALWAYS visible — not hover-only) | Zone 1+2 |
| **`.glass-toolbar`** | `blur(16px) saturate(1.2)` | `rgba(255,255,255,0.88)` | bottom `rgba(26,18,9,0.04)` | Sticky filter bar below header | Zone 1+2 |
| **`.glass-pill`** | `blur(12px) saturate(1.2)` | `rgba(255,255,255,0.55)` | `rgba(26,18,9,0.08)` | **NEW** — Filter pills, cancel tags, chip buttons in Zone 1+2 | Zone 1+2 |
| **`.card-v4`** | **NONE** | `#ffffff` solid | `rgba(26,18,9,0.05)` | Salon cards, listing cards | ALL zones |

**Dark variants:** All glass classes have `.dark` variants using `rgba(30,23,16,...)` backgrounds.

**Performance rules:**
- Never stack more than 3 glass elements visible simultaneously
- Always pair `backdrop-filter` with `-webkit-backdrop-filter` for Safari/iOS
- **glass-pill** is allowed on interactive filter chips and cancel/close buttons in Zone 1+2 only
- **NO glass in Zone 3** (trust/payment — glass looks unstable) or **Zone 4** (dashboard — glass obscures data)
- **NO glass on content listing cards in ANY zone** — use `.card-v4` (solid white) instead

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

### Border radius tokens — use V5 design token radii
- ~~`rounded-lg`~~ → `rounded-input` (12px) for inputs, or `rounded-panel` (16px) for inner panels
- ~~`rounded-xl`~~ / ~~`rounded-2xl`~~ / ~~`rounded-3xl`~~ → `rounded-card` (16px) or `rounded-card-lg` (20px)
- ~~`rounded-full`~~ → `rounded-pill` (9999px)
- ~~`rounded-sm`~~ → only acceptable for data visualization cells (heatmaps, charts)
- Standard Tailwind `rounded-*` should NOT be used — always use `rounded-card`, `rounded-card-lg`, `rounded-input`, `rounded-panel`, `rounded-search`, `rounded-pill`, or `rounded-btn`
- ~~`rounded-blob-*`~~ → **RETIRED in V5.** All blob shape tokens purged from codebase. Buttons: `rounded-btn` (99px). Cards: `rounded-card` (16px).

## 17. Currency Formatting
Always use `formatCurrency(amount, locale)` from `@/lib/format-currency` instead of hardcoded `CHF {amount}`. Pass `locale` from `useLocale()` in client components or from `params` in server components.

## 18. Typography & Color Usage Guide (Design System v1.0)

### Font Hierarchy — Which Font Where

| Context | Font | Class | Weight | Size | Extra Rules |
|---|---|---|---|---|---|
| Homepage hero heading | Bebas Neue | `font-display` | — | `clamp(64px, 9vw, 130px)` | Always uppercase. Line-height 0.85-0.92. Stack in 1-4 word lines. |
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
- Bebas Neue NEVER appears below 36px (exception: 22px nav logo, 22px category tile labels — context makes them readable)
- Bebas Neue is ALWAYS uppercase (the font is all-caps by nature, never use mixed-case)
- Syne is NEVER italic (use DM Sans italic instead when expressive/descriptive italic is needed)
- DM Sans italic is ONLY for hero descriptions, hero subheadings, and pull quotes
- Dashboard/admin pages (Zone 4): only Syne 700 for headings, DM Sans for everything else. Bebas Neue NEVER appears in Zone 4.
- Never use system-ui, Inter, Roboto, or Arial anywhere — they have zero brand personality.

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

| Zone | Pages | Typography | Colors | Animation | Shapes | Glass |
|---|---|---|---|---|---|---|
| 1 — Full Maximalist | Homepage, discovery, category pages, splash/landing, marketing | All three fonts (Bebas hero + Syne headings + DM Sans body) | Full palette, full saturation, `.ambient-v5` radial gradients | V5 stagger reveals (50ms) + Card hover lift + Section heading slide-in | `rounded-card` (16px), `rounded-pill` (9999px) | `.glass-frost` on floating overlays only |
| 2 — Soft Maximalist | Salon profile, search results grid, map view, review sections, photo gallery | Syne + DM Sans (Bebas Neue allowed ONCE for page title H1) | Full palette, `.ambient-v5` at reduced opacity | Card hover lift + Section heading slide-in. NO stagger | `rounded-card` (16px), `rounded-pill` (9999px) | `.glass-frost` on dropdowns only |
| 3 — Clean Functional | Booking flow, date/time picker, payment (TWINT), login, signup, password reset, account settings | Syne + DM Sans (no Bebas except nav logo) | Coral CTAs + amber accents + cream base. Shadows sm-md only (no xl) | **ZERO animation** | `rounded-input` (12px), `rounded-card` (16px), `rounded-pill` (9999px) | **NO glass** |
| 4 — Pure Structured | Dashboard, admin, calendar, analytics, settings | Syne 700 + DM Sans. **No Bebas Neue ever** | Palette on borders/status/icons only. 12px max radius | **ZERO animation** | `rounded-input` (12px) max | **NO glass** |

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
| Border radius | Mixed `rounded-lg`, `rounded-2xl`, `rounded-full` | Consistent `rounded-card` (16px), `rounded-btn` (99px), `rounded-pill` (9999px) |
| Colors | Raw Tailwind colors (`yellow-400`, `emerald-500`) | Design tokens (`s-yellow`, `s-success`) |

### 19f. Strict Font Scaling & Line Heights
- **NEVER** use arbitrary `leading-*` (line-height) classes that decouple from the defined font sizes, unless explicitly needed for a hero overlap or specific design element. Let the base text sizes (`text-sm`, `text-base`, `text-lg`) dictate their default `leading` as defined in the type scale.
- **Placeholders:** Input placeholders MUST inherit the exact same line-height and font-family as the input body text to prevent vertical misalignment while typing.

## 20. Next-Gen Fluidity & Urgency (Phase 2 Vision)
- **Map vs Grid Equality:** The discovery experience (`app/[locale]/search`) MUST feature a Split View architecture on desktop (50% Map, 50% Grid) and a "Coin-Flip" floating action button on mobile that instantly swaps views without a page reload.
- **Hyper-Fluid Booking Success:** Do not use full-page redirects for booking success. The `[Book Now]` button MUST use Framer Motion `layoutId` to compress, morph into a circle spinner, and then expand into a glassmorphic Receipt Card Modal containing a self-drawing premium SVG checkmark. **No Confetti.**
- **Sneaker-Drop Urgency (Last-Minute):** The Last-Minute booking section MUST enforce high urgency. Disappearing slots require `shadow-coral-glow` pulsing. Slots expiring in <2 hours require a floating translucent countdown timer.
- **Heart Animation:** Favoriting a salon MUST trigger a heartBounce keyframe (`scale: 1 → 1.3 → 0.9 → 1.1 → 0.95 → 1`, 500ms ease-out).

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
| `rounded-lg/xl/2xl/3xl` | `rounded-card` (16px) / `rounded-card-lg` (20px) / `rounded-input` (12px) | Use V5 design token radii (see UI_RULES §10) |
| `rounded-full` | `rounded-pill` (9999px) | Use design token |
| `rounded-blob-*` | **FULLY RETIRED in V5** — purged from codebase | Do NOT add back. No blob shapes anywhere |
| `rounded-button` (8px) | `rounded-btn` (99px) for buttons, `rounded-input` (12px) for inputs | Old 8px token retired |
| `.blob-interactive` | **FULLY RETIRED in V5** — purged from codebase | No blob morphing anywhere |
| `<BlobBackground>` | `.ambient-v5` radial gradients | V5 replaces decorative blobs with subtle gradients |
| `transition-all` | `transition-[transform,box-shadow]`, `transition-colors`, `transition-opacity` | Name exact CSS properties (see §21-A) |
| Any emoji in JSX | Lucide React icon | UI_RULES §5: no emoji in UI |
| `#00A19C` | `bg-s-coral` / `text-s-coral` / `s-blue` | Old teal brand hex (BANNED) |
| `#F59E0B` | `s-warning` / `s-yellow` | Generic Tailwind warning orange (BANNED) |
| `#6B7280` | `text-s-ink/50` | Cool gray text (BANNED) |
| `#0F0F0F` / `#1A1A1A` / `#2D2D2D` | `bg-s-dm-bg` / `s-dm-surface` | Pure black/cold dark grays (BANNED) |
| `#E5E7EB` | `border-s-ink/10` | Light cold gray border (BANNED) |

**Enforcement**: After EVERY commit, run:
```bash
grep -Ern "text-dark[^M]|bg-dark[^M]|bg-black|bg-gray-|text-gray-|border-gray-|dark:bg-dm-|dark:text-dm-|shadow-teal|accent-teal|bg-mesh-teal|border-t-teal|bg-amber-|border-amber-|fill-amber-|bg-yellow-|text-yellow-|ring-yellow-|bg-emerald-|text-emerald-|bg-green-|text-green-|bg-purple-|text-purple-|bg-rose-|text-rose-|shadow-sm[^a]|shadow-md|shadow-lg|shadow-xl|shadow-2xl|rounded-lg|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|#00A19C|#F59E0B|#6B7280|#0F0F0F|#1A1A1A|#2D2D2D|#E5E7EB" components/ app/ --include="*.tsx" | grep -v "node_modules\|darkMode\|//\|s-dm\|s-ink\|s-amber\|s-yellow\|s-success\|shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob" | head -10
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

### Rule 31: FILTER COMPONENT ZONE COMPLIANCE (MANDATORY)

> **CONTEXT**: The `FilterBar` and `FilterBottomSheet` are shared components used across Zone 1 (discovery/search), Zone 2 (category pages), Zone 3 (booking flow), and Zone 4 (dashboard). A single implementation that uses glassmorphism or slide animations will **violate zone rules** the moment it appears in Zone 3 or Zone 4.

**All shared filter components MUST accept a `zone` prop (1 | 2 | 3 | 4) and apply the following behaviour:**

| Feature | Zone 1 | Zone 2 | Zone 3 | Zone 4 |
|---|---|---|---|---|
| Glass on bottom sheet | ✅ Tier 2 glass | ✅ Tier 3 glass | ❌ Solid surface only | ❌ Solid surface only |
| Slide/reveal animations | ✅ 220–400ms | ✅ 220ms max | ❌ ZERO animation | ❌ ZERO animation |
| `.ambient-v5` background | ✅ | ✅ | ❌ | ❌ |
| Expand drawer animation | ✅ | ✅ | ❌ | ❌ |

**Implementation contract:**
```tsx
// ✅ CORRECT — zone-aware filter
<FilterBar zone={1} />         // Discovery/search — full glass + animation
<FilterBar zone={3} />         // Booking flow — solid bg, no animation

// ❌ BANNED — same static component used everywhere without zone prop
<FilterBar />                  // Missing zone = unknown behaviour = rule violation
```

**Rules:**
1. **NEVER** render a glassmorphic bottom sheet in Zone 3 or Zone 4 pages.
2. **NEVER** add slide/reveal/expand animations to filter components in Zone 3 or Zone 4.
3. The `zone` prop defaults to `1` only as a DX convenience — always pass it explicitly.
4. In Zone 3/4: bottom sheet becomes a plain `rounded-input` (12px) modal with `bg-[--raised]`, `shadow-warm-lg`, and ZERO backdrop-filter.
5. When building a new page that uses `FilterBar`, declare its zone in a comment above the import.

```bash
# Verify no zone violations — Zone 3/4 pages must not have backdrop-filter in filter components:
grep -rn "backdrop-blur\|backdrop-filter\|glass-tier" \
  app/\[locale\]/booking/ app/\[locale\]/checkout/ app/\[locale\]/auth/ \
  --include="*.tsx"
# Expected: 0 results
```

---

### Rule 30: PREMIUM DESIGN ENFORCEMENT (MANDATORY)

> **CONTEXT**: A design audit on 2026-03-23 found ~125 violations of the premium design system. Generic Tailwind classes were used instead of design tokens, breaking Apple-level consistency.

**Before writing ANY UI code, you MUST follow `UI_RULES.md` §19 (Premium Design Enforcement Rules):**

1. **8-Point Grid**: ALL spacing must be 8px multiples. NEVER use `gap-5`, `p-5`, `gap-7`, `p-7`, `gap-9`
2. **Design Token Shadows**: NEVER use `shadow-sm/md/lg/xl/2xl`. ALWAYS use `shadow-card`, `shadow-warm-sm/md/lg`, `shadow-warm-float`, `shadow-glass`
3. **Design Token Radii**: NEVER use `rounded-lg/xl/2xl/3xl/full`. ALWAYS use `rounded-card` (16px), `rounded-card-lg` (20px), `rounded-input` (12px), `rounded-panel` (16px), `rounded-search` (99px), `rounded-pill` (9999px), `rounded-btn` (99px). Blob shapes are RETIRED.
4. **Design Token Colors**: NEVER use raw Tailwind colors (`yellow-400`, `emerald-500`, `green-300`, `purple-300`, `rose-300`, `blue-200`). ALWAYS use `s-*` tokens.
5. **60-30-10 Color Rule**: 60% neutral base, 30% card surfaces, 10% accent colors
6. **Cheap vs Premium Matrix**: Check every new component against the audit matrix in `UI_RULES.md` §19e

```bash
# Quick premium audit — run before every push:
grep -Ern "shadow-sm[^a]|shadow-md|shadow-lg[^a]|shadow-xl|shadow-2xl|rounded-lg[^a]|rounded-xl|rounded-2xl|rounded-3xl|rounded-full|bg-yellow-|bg-emerald-|bg-green-|bg-purple-|bg-rose-|bg-blue-[0-3]|gap-5|gap-7|gap-9" components/ app/ --include="*.tsx" | grep -v "shadow-warm\|shadow-card\|shadow-glass\|shadow-coral\|rounded-card\|rounded-button\|rounded-pill\|rounded-blob\|s-dm\|//\|node_modules" | head -10
# Must return 0 results.
```

### Rule 32: NO HARDCODED MARKETING STATS
> **CONTEXT**: On 2026-03-25, an audit revealed that "247 Buchungen diese Woche" was hardcoded into a decorative hero component, while right next to it the `SocialProofStrip` displayed "0+ Buchungen" from a live API, creating a direct data contradiction.

**Rules:**
1. **NEVER** hardcode metric numbers (like bookings, salon counts, ratings) in production UI components without clearly labeling them as decorative/illustrative (e.g., using a "~" prefix or faded watermark styling).
2. If a number looks like real data, it MUST pull from a real API or database query.

### Rule 33: BADGE DATA INTEGRITY
> **CONTEXT**: An audit revealed that the "Solen Top Pick" badge was hardcoded onto specific salon cards, meaning it could never be updated or removed without a code deployment.

**Rules:**
1. **NEVER** hardcode conditional badges (like "Top Pick", "Neu", "Premium") into UI components.
2. If a badge implies a shifting status, it MUST be conditionally rendered based on a database flag (e.g., `salons.is_top_pick`).

---

## 21. 🎬 INTERACTION CONSISTENCY PATTERNS (MANDATORY — EVERY COMPONENT)

> **CONTEXT**: A 2026-03-28 audit found `transition-all` used 50+ times (animates layout, triggering expensive repaints), `duration-500` in UI components (too slow), 3 different cancel button visual patterns, modals missing Escape-key support, and tab switches using different easing curves. These rules establish a single source of truth for every micro-interaction across all subsites.

---

### §21-A. Transition Specificity (Emil Rule — NO `transition-all`)

Always name the exact CSS properties being animated. `transition-all` causes the browser to watch every animatable property and recompute layout on each frame.

| Context | ✅ Required class | ❌ Banned |
|---|---|---|
| Card hover (lift + shadow) | `transition-[transform,box-shadow] duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)]` | `transition-all` |
| Button press / hover | `transition-[transform,filter] duration-150` | `transition-all` |
| Color/bg change (tabs, badges, links) | `transition-colors duration-150` | `transition-all duration-200` |
| Opacity fade (tooltips, overlays) | `transition-opacity duration-150` | `transition-all` |
| Border color change (inputs on focus) | `transition-[border-color,box-shadow] duration-150` | `transition-all` |
| Background + text color (pill tabs) | `transition-[background-color,color] duration-150` | `transition-all` |

---

### §21-B. Timing Standards

| Use case | Duration | Easing |
|---|---|---|
| Tab highlight, badge, link color | `150ms` | `ease-out` (default) |
| Button press active feedback | `100ms` | `ease-out` |
| Card hover lift | `250ms` | `cubic-bezier(.4,0,.2,1)` |
| Dropdown / small popover | `150–200ms` | `cubic-bezier(0.23,1,0.32,1)` |
| Modal/dialog enter | `350ms` via Framer spring `[0.34,1.2,0.64,1]` | spring |
| Modal/dialog exit | `180ms` `[0.23,1,0.32,1]` — always faster than enter | fast ease-out |
| Bottom sheet enter | `300ms` `cubic-bezier(0.32,0.72,0,1)` iOS-drawer curve | iOS-drawer |
| Bottom sheet exit | `200ms` `[0.23,1,0.32,1]` | fast ease-out |
| **BANNED in all UI** | `500ms+` | any |
| **BANNED easing** | `ease-in` on any interactive element — feels sluggish | — |

---

### §21-C. Modal / Dialog Standard

**Rule:** Every overlay MUST use `<GlassModal>` from `components/ui/GlassModal.tsx`. No raw custom modals.
**Rule:** Every modal MUST support ALL THREE close methods: Escape key + backdrop click + X button.

```tsx
// ✅ Correct — always wrap with GlassModal
<GlassModal open={isOpen} title={t("title")} onClose={onClose} maxWidth="max-w-md">
  {/* content */}
</GlassModal>

// ❌ Banned — raw fixed overlay
<div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40">
  <div className="bg-white rounded-[16px] p-6">...</div>
</div>
```

**Backdrop class** (inside GlassModal — do not override): `bg-s-ink/40 backdrop-blur-[6px]`
**Animation** (from `lib/animations.ts` `modalVariants`):
- Enter: `{ opacity: 0, y: 32, scale: 0.97 }` → `{ opacity: 1, y: 0, scale: 1 }`, spring `[0.34,1.2,0.64,1]` 350ms
- Exit: `{ opacity: 0, y: 24, scale: 0.97, filter: "blur(2px)" }`, ease-out `[0.23,1,0.32,1]` 180ms

---

### §21-D. Close (X) Button Standard

The X close button sits in the top-right of every modal, drawer, and sheet.

```tsx
// ✅ Standard X close button
<button
  onClick={onClose}
  aria-label={t("close")}
  className="p-2 rounded-pill hover:bg-s-ink/5 dark:hover:bg-white/5 transition-colors duration-150"
>
  <X size={18} className="text-s-ink/40 dark:text-s-dm-text/40" />
</button>
```

| Property | Value | Why |
|---|---|---|
| Padding | `p-2` (32×32 hit area) | Meets 44px touch target with surrounding space |
| Shape | `rounded-pill` | Consistent with all interactive elements |
| Hover bg | `hover:bg-s-ink/5` | Barely-there — doesn't compete with content |
| Icon size | `18px` | Not too big, not invisible |
| Icon color | `text-s-ink/40` | Recessive — user's eye goes to content, not the X |
| Transition | `transition-colors duration-150` | Color only — no scale/translate on a close button |

---

### §21-E. Cancel Button Standard (text form)

Used inside forms and confirmation dialogs alongside the primary action button.

```tsx
// ✅ Standard cancel button
<button
  type="button"
  onClick={onClose}
  className="flex-1 py-2.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:border-s-coral/40 hover:text-s-coral active:scale-[0.98] transition-[transform,border-color,color] duration-150"
>
  {t("cancel")}
</button>
```

**Pattern:** Ghost/outline → coral hint on hover. Same `active:scale-[0.98]` feedback as primary buttons.
**NEVER:** different border-radius, different opacity level, or a plain text link `<button>` with no border for cancel.

---

### §21-F. Submit / Primary Action Button Standard

```tsx
// ✅ Standard submit button
<button
  type="submit"
  disabled={loading}
  className="flex-1 py-2.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-[transform,filter] duration-150 shadow-coral-glow"
>
  {loading && <Spinner size="sm" invert />}
  {t("save")}
</button>
```

**Rules:**
- Transition: `transition-[transform,filter]` — NOT `transition-all`
- Hover: `hover:brightness-[1.06]` — NOT `hover:bg-s-coral/90` or `hover:opacity-*`
- Active: `active:scale-[0.98]` — always present, gives press feedback
- Disabled: `disabled:opacity-50 disabled:cursor-not-allowed` — no other disabled pattern
- Shadow: `shadow-coral-glow` — color-matched warm glow, not generic shadow

---

### §21-G. Tab Switching Standard

Two distinct tab patterns. NEVER mix them.

**Pattern A — Filter / State tabs** (changes data shown on same page: discover category, dashboard section):
```tsx
// Active
"bg-s-coral text-white shadow-coral-glow"

// Inactive
"bg-s-ink/[0.05] dark:bg-white/[0.05] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-white/[0.09]"

// On the button element itself:
"transition-[background-color,color,box-shadow] duration-150"
// ❌ BANNED: transition-all, transition-colors (color only), any slide/translate animation
```

**Pattern B — Navigation tabs** (moves between page sections: profile tabs, booking steps):
- Use `slideSwitch` Framer Motion variant from `lib/animations.ts`
- Active underline: `absolute bottom-0 left-0 right-0 h-[2px] bg-s-coral` with `layoutId="tabUnderline"`
- Tab button itself: `transition-colors duration-150` only

---

### §21-H. Form Input Focus Standard

Every `<input>`, `<textarea>`, `<select>`:
```tsx
className="... border border-s-ink/[0.08] dark:border-white/[0.08] focus:border-s-coral focus:ring-2 focus:ring-s-coral/15 outline-none transition-[border-color,box-shadow] duration-150"
```

**Rules:**
- Transition: `transition-[border-color,box-shadow]` — NOT `transition-all`
- Focus ring: `ring-s-coral/15` — NOT `ring-blue-500` or generic `ring-2`
- No `outline` (replaced by focus ring)

---

### §21-I. Success / Error Feedback Banner Standard

Inline banners that appear after save/submit actions. Auto-dismiss after 2000ms.

```tsx
// ✅ Success banner
<div className="flex items-center gap-2 bg-s-success-bg text-s-success px-3 py-2 rounded-input text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-[200ms]">
  <Check size={14} />
  {t("saved")}
</div>

// ✅ Error banner
<div className="flex items-center gap-2 bg-s-error-bg text-s-error px-3 py-2 rounded-input text-sm font-medium animate-in fade-in slide-in-from-top-1 duration-[200ms]">
  <AlertCircle size={14} />
  {errorMessage}
</div>
```

**Rules:**
- Auto-dismiss: `setTimeout(clearStatus, 2000)` — not 3000ms or persistent
- Radius: `rounded-input` (12px) — NOT `rounded-[12px]` inline
- Entrance animation: `animate-in fade-in slide-in-from-top-1 duration-[200ms]` — subtle slide, not full bounce
- NO toast library calls for inline form feedback — use this pattern instead

---

### §21-J. Inline Edit Toggle Standard

Pattern for components with a "view" and "edit" state (e.g., salon about editor).

```tsx
// Pencil button to enter edit mode
<button
  onClick={() => setEditing(true)}
  aria-label={t("edit")}
  className="p-1.5 rounded-pill text-s-ink/30 hover:text-s-coral hover:bg-s-coral/5 transition-[color,background-color] duration-150"
>
  <Pencil size={14} />
</button>

// On save: show success banner, auto-clear after 2000ms
// On cancel: instantly revert (no exit animation needed)
```

---

### §21-K. Quick-Reference Audit Commands

Run these before and after touching any component to verify compliance:

```bash
# Find remaining transition-all violations
grep -rn "transition-all" components/ app/ --include="*.tsx" | grep -v "node_modules"

# Find slow duration-500 in UI
grep -rn "duration-500\|duration-700\|duration-1000" components/ app/ --include="*.tsx" | grep -v "blob\|float\|marquee\|confetti"

# Find banned ease-in
grep -rn '"ease-in"\\|ease-in[^-]' components/ app/ --include="*.tsx"

# Expected for all: 0 results (except decorative animations like confetti)
```

## 22. Homepage UI/UX Overhaul Spec (V5)

> **CONTEXT:** The following rules enforce the new V5 design standards introduced for the homepage overhaul.

### 22a. Core Aesthetics
- **Shapes & Shadows:** No shadows on cards (use simple 1px borders). ALL interactive elements must be pill shapes (`rounded-pill` / `rounded-btn`).
- **Blobs & Splashes:** Blobs are strictly retired. Use `.ambient-v5` gradients for empty space.
- **Backgrounds:** Set the page background to Warm Beige (`#F5F0EB`) instead of stark white.

### 22b. Header & Navigation Refinements
- **1.1 Zurück (Back) Button:** Must NEVER render on the root (homepage) path. Ensure the Breadcrumb skips rendering.
- **1.3 Sticky Header:**
  - Height: Target max height `56px`.
  - Background: `#F5F0EB` with `backdrop-filter: blur(12px)` and `1px solid rgba(0,0,0,0.06)` border. (No shadow).
  - Navigation Collapse: Delete `<CategoryStickyRow />` entirely from the header component.
  - Morphing state: When the hero search bar scrolls out of view, the header must morph into a centered Search Pill (`[🔍 Was · Basel · Wann]`).

### 22c. Hero & Category Grid
- **Hero Background:** Delete the static background image and fade-up animations. The hero uses a solid `#F5F0EB` background.
- **Hero Title:** Must use Bebas Neue 42px header (`DEIN NÄCHSTER. TERMIN.`) + DM Sans 17px subhead.
- **Featured Salon Carousel:** Must feature an Airbnb-style horizontal scroll carousel (`width: 260px`, `scroll-snap-type: x mandatory`).
- **Category Icons:** Icons (`SpaIcon.tsx`, `MakeupIcon.tsx`, etc) must render perfectly solid in Coral (`#E8735A`) with no opacity layers.
- **Category Grid:** Strip out the old rounded box backgrounds wrapping the icons; icons should float over their labels natively.

### 22d. Footer & Tab Bars
- **Footer Cleanup:** Set background solid `#2C2825`, remove leftover trust badge grids, reposition Instagram into legal links, and strip redundant boilerplate links.
- **Mobile Bottom Tab Bar:** `backdrop-filter` on `#FFFFFF`, top border `1px solid rgba(0,0,0,0.06)` (no shadow). Ensure `z-index: 50` and exclusively use Coral (`#E8735A`) for active states.


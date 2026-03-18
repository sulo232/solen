# 🎨 Solen.ch UI & Design Rules

> **CRITICAL FOR CLAUDE CODE:** This file contains the foundational design rules for Solen.ch. These rules **must not be broken or altered** under any circumstances. Check this file before making any UI decisions.

---

## 1. Core Aesthetic
- **Light + Dark Mode:** The platform supports both light and dark mode via `darkMode: 'class'` in Tailwind. Default is system preference.
  - Dark background: `#0F0F1A` (`dm-bg`), Dark surface: `#1A1A2E` (`dm-surface`), Dark text: `#E2E8F0` (`dm-text`)
  - Use `dark:` variants on all major surfaces (cards, nav, modals, backgrounds)
  - ThemeToggle in Header cycles: light → dark → system
  - `<ThemeScript>` in layout prevents flash of wrong theme
- **Pure Glassmorphism:** All cards, modals, and overlays must use glassmorphism (`backdrop-blur-xl`, semi-transparent backgrounds with a subtle white tint).
- **No Glowing Borders:** Do not use AI-style glowing borders or generic neon shadows. Stick to clean, iPhone-widget-style glassmorphism.
- **Premium Feel:** The UI must feel like a luxury hotel booking site (Airbnb/Booking.com inspiration) but tailored for beauty services.

## 2. Colors & Branding
- **Primary Colors:** 
  - Teal: `#38B2AC`
  - Coral: `#FF6B6B` (Use for urgency, e.g., Last-Minute countdowns)
  - Dark: `#1A1A2E` (Use for primary text on light backgrounds)
- **Google Auth:** The Google login button must use the **full-color** Google G logo, not a monochrome version.

## 3. Typography
- **Headings:** `Syne`
- **Body Text:** `DM Sans`
- **Data/Numbers:** `Space Grotesk`
- **Playful Accents:** Use an **Instagram-style squeeze/condensed font** for section labels, category names, or impact headers. Mix font weights to create a playful but premium hierarchy.

## 4. Animations & Interactions (`framer-motion`)
- **Speed:** All transitions must be smooth and elegant (300-400ms duration).
- **Hover States:** Cards (`SalonCard`) should have a **lift-up effect** (subtle shadow increase + `translateY -4px`).
- **Tab Switching:** Use a smooth **slide left/right** animation (like turning pages), not a simple fade.
- **Lists/Grids:** Use `containerVariants` to stagger children elements (200ms stagger) when loading grids.

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
- **InteractiveHoverButton:** Use for all primary CTAs. Customized with `bg-teal` and `text-white`.
- **ExpandableNavTabs:** Used for mobile bottom nav. Spring animations, teal active color. Hidden on desktop.
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
| Background | `bg-white` | `dark:bg-dm-bg` (#0F0F1A) |
| Surface | `bg-white` | `dark:bg-dm-surface` (#1A1A2E) |
| Text | `text-dark` | `dark:text-dm-text` (#E2E8F0) |
| Border | `border-gray-100` | `dark:border-white/5` |
| Nav glass | `bg-white/80` | `dark:bg-dm-surface/80` |

---
**Rule Enforcement:** If a prompt asks for a UI component that contradicts these rules, you must **refuse the specific contradiction** and implement the component using these rules instead.

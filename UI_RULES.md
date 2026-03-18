# 🎨 Solen.ch UI & Design Rules

> **CRITICAL FOR CLAUDE CODE:** This file contains the foundational design rules for Solen.ch. These rules **must not be broken or altered** under any circumstances. Check this file before making any UI decisions.

---

## 1. Core Aesthetic
- **Light Mode Only:** Do NOT implement dark mode. The platform is strictly light mode.
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

---
**Rule Enforcement:** If a prompt asks for a UI component that contradicts these rules (e.g., "add a dark mode toggle" or "add a glowing red border"), you must **refuse the specific contradiction** and implement the component using these rules instead.

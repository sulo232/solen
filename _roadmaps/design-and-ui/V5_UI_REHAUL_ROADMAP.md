# Solen V5 — Structural UI Rehaul Roadmap (Fresha × Airbnb)

> **Goal**: Move beyond CSS tokens (spacing, glass, shadows) and rehaul the actual **component layout and structural UX** to match the premium, high-conversion standards of Airbnb and Fresha.

---

## Phase 1: Salon Profile Redesign (The "Airbnb" Layout)
**Target**: `app/[locale]/salon/[slug]/page.tsx`

Currently, the salon profile uses a basic 16/7 image slider and standard content flow. We need the massive, premium feel of an Airbnb listing.

### 1A. "Bento Box" Photo Gallery (Desktop)
- **Current**: Single image slider.
- **Rehaul**: Implement a 5-image grid. One massive featured image on the left, and a 2x2 grid of smaller images on the right. 
- **Action**: Add a "Zeige alle Fotos" (Show all photos) button in the bottom right of the grid that opens a full-screen, buttery smooth lightbox.
- **Mobile**: Keep the swipeable carousel but add an Airbnb-style `1 / 5` pill indicator.

### 1B. Sticky Booking Widget (Right Column)
- **Current**: Booking CTA is mostly buried or reliant on a bottom bar.
- **Rehaul**: In the `lg:grid-cols-3` layout, make the right column (`lg:col-span-1`) a strictly **sticky widget** (using `sticky top-24`).
- **Content**: Include the Salon Name, Rating (`4.8 ★`), "Geöffnet" status, a mini map snippet, and a massive coral "Termin buchen" button. 

### 1C. Fresha-Style Service Menu
- **Target**: The Services Tab.
- **Rehaul**: Remove boxed backgrounds for individual services. Use a purely typographic, high-contrast list. Service Name on the left, dotted leader line `...................`, Price and Duration on the right. Wrap these in clean accordions divided by Category.

---

## Phase 2: Listing Cards (Edge-to-Edge)
**Target**: `components/SalonCard.tsx`

Airbnb cards feel premium because the image is the hero.

### 2A. In-Card Image Carousel
- **Current**: Static cover photo with a hover zoom.
- **Rehaul**: If a salon has multiple gallery images, allow the user to swipe/click arrows to flip through images *directly on the card* without leaving the search page.
- **Indicators**: Add pagination dots inside the image at the bottom.

### 2B. Edge-to-Edge Layout
- **Current**: The card has a border and sometimes padding.
- **Rehaul**: Make the image touch the exact top, left, and right edges of the card. The text content sits directly below it on a stark white background.
- **Typography**: Stack it cleanly: 
  - **Line 1 (Bold)**: Salon Name & Rating aligned left/right.
  - **Line 2 (Gray)**: Distance & Neighborhood.
  - **Line 3 (Gray)**: "Ab CHF 35" (Starting price).

---

## Phase 3: Search & Discovery Experience
**Target**: `components/CategoryPage.tsx` & `components/ui/FilterBar.tsx`

### 3A. Sticky Split-Screen Map (Desktop)
- **Current**: Toggle between List and Map.
- **Rehaul**: On desktop, use a 50/50 split screen. Scrollable salon list on the left half, interactive sticky Map on the right half. When you hover a card on the left, the map marker bounces on the right (and vice versa).

### 3B. Icon-Driven Horizontal Filters
- **Current**: Pill-shaped text buttons.
- **Rehaul**: Add distinct, premium line-icons above the category labels (e.g., Hair, Nails, Spa, Brows) in a frictionless horizontal swipe row (hide scrollbar). Selected state gets a stark underline (Airbnb style) instead of a solid background block.

---

## Phase 4: Mobile App Feel (Navigation)
**Target**: `components/layout/Header.tsx` & `components/layout/Footer.tsx`

### 4A. iOS-Style Bottom Tab Bar
- **Current**: Mobile navigation relies on a Hamburger menu inside the Header.
- **Rehaul**: Implement a sticky bottom tab bar specifically for mobile (`md:hidden`). 
  - Tabs: Search (Magnifying Glass), Saved (Heart), Bookings (Calendar), Profile (User).
  - This instantly transforms the web mobile experience into a native app feel.

### 4B. Fluid Pull-to-Close Modals
- **Target**: `components/ui/BottomSheet.tsx`
- **Rehaul**: Ensure every mobile drawer uses `framer-motion` drag constraints so users can organically swipe down to dismiss them, with the background opacity fading linearly based on the drag distance.

---

## Execution Priority for Claude Code

1. **Phase 1A & 1B (Salon Profile)**: The highest leverage page for conversions. The layout needs to scream "Premium".
2. **Phase 2 (Salon Cards)**: The first thing users see on search. In-card carousels drastically increase engagement.
3. **Phase 4A (Mobile Bottom Bar)**: Immediate wins for mobile usability and "app-like" feel.
4. **Phase 3A (Split-Screen Map)**: The golden standard for directory sites on Desktop.

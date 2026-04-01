# Solen PC-Specific UI/UX Architecture Spec (Airbnb Native Target)
*Target: To be implemented by Claude Code*

> [!CAUTION]
> **TO CLAUDE CODE (THE IMPLEMENTING AGENT):**
> Do **NOT** build a new website from scratch. Do **NOT** create a new routing architecture. Do **NOT** generate generic new layout files like `NewHeader` or `SearchWidget`.
> You are to **REFACTOR THE EXISTING CODEBASE**.
> 
> **MANDATORY FILE SCOPE MATRIX:**
> You must apply the specs to these EXACT existing files:
> - **Header & Overlay:** `components/layout/Header.tsx`
> - **Search Bar Pill:** `components/ui/AirbnbSearchBar.tsx`
> - **SVG Strip:** `components/layout/CategoryStickyRow.tsx`
> - **Grid Layout:** `components/HomePage.tsx`
> - **Card Design:** `components/SalonCard.tsx`
> - **Popovers:** `components/ui/DatePopover.tsx`, `components/ui/GuestPopover.tsx`, etc.
> 
> Read the local codebase to understand the current schema, and inject this exact UI polish directly into the existing functional components.

This document is the absolute, pixel-perfect technical constitution for turning `Solen (localhost:3001/de)` into an exact `Airbnb` desktop experience. All values map directly to Airbnb's live DOM. 

**DO NOT DEVIATE from the hex codes, font weights, shadows, or DOM layouts detailed below.**

---

## 1. The Global Header Architecture

The Header operates in two primary states: **Expanded** (Hero state, active search) and **Collapsed** (Scrolled state).

### 1.1 The "Lights Out" Overlay & SVG Strip Visibility
- **Rule:** Whenever the Search Bar is in the "Expanded / Active" state, an overlay must cover the rest of the application body.
- **Structure:**
  ```tsx
  <div className="fixed inset-0 top-[headerHeight] z-40 bg-black/25 transition-opacity duration-300 pointer-events-auto" />
  ```
- **Visibility Impact:** The `<CategoryStickyRow>` (SVG Strip) sits *below* the Header in the DOM. Therefore, when the header expands and this `bg-black/25` overlay activates, the SVG strip will be dimmed out by the overlay along with the rest of the page. It does not unmount.
- **Interaction:** Clicking this black overlay cancels the active search and returns the Header to the Collapsed state.

### 1.2 "Row 1" – Categories Above Search (Expanded State Only)
- **Problem:** In Airbnb, the text above the search bar represents high-level modes (`Stays` vs `Experiences`). 
- **Fix:** If Solen has global modes in the future (e.g., `Im Salon` vs `Hausbesuche` (Home visits)), put them here. 
- **Important Note:** If Solen currently only operates in ONE global mode, **completely omit "Row 1"**. Do not put "Coiffeur" and "Nails" here, because those belong in the SVG strip below.
- **Tailwind Classes (If used):**
  - Container: `flex items-center justify-center gap-6 pb-6`
  - Inactive Item: `text-[16px] text-[#222222] hover:bg-[#F7F7F7] px-4 py-2 rounded-full cursor-pointer transition-colors font-normal`
  - Active Item: `text-[16px] text-[#222222] px-4 py-2 rounded-full cursor-default font-medium`

---

## 2. The Guided Search Bar (The "Pill")

The Expanded Search Bar must be structurally divided into exactly 3 horizontal segments: `Kategorie` | `Ort` | `Datum`.

### 2.1 The Container & Background State
- **State Machine Rules:** The bar must track `activeSegment = 'category' | 'city' | 'date' | null`.
- **Expanded (Inactive / Default) Container:**
  - Background: `bg-white`
  - Border: `border border-[#DDDDDD]`
  - Shadow: `shadow-md` (Standard Tailwind)
  - Radius: `rounded-[32px]`
- **Expanded (Active / Searching) Container:**
  - Background: `bg-[#EBEBEB]` (Crucial: The container dims so the active segment can pop)
  - Box Shadow: `none`
  - Radius: `rounded-[32px]`

### 2.2 The Individual Segments
- **Inactive Segment (while another is active):**
  - Hover: `hover:bg-[#DDDDDD] rounded-full`
- **Active Segment (The item the user clicked):**
  - Background: `bg-white`
  - Box Shadow: `shadow-[0px_2px_16px_0px_rgba(0,0,0,0.12)]`
  - Radius: `rounded-[32px]`

### 2.3 The Red Search Button Morph
- **Collapsed/Inactive State:** A 48x48 circular button (`w-12 h-12 rounded-full`). Background uses a vivid radial gradient: `bg-gradient-to-r from-[#FF385C] to-[#BD1E59]`. Contains only a white `<Search size={16} strokeWidth={3} />` icon.
- **Expanded State:** The circle morphs into an elongated pill (`rounded-full py-3 px-5`). Next to the magnifying glass, the word `Suchen` fades in.
- **Micro-interaction:** Utilize Framer Motion's `<motion.button layout>` for the morph width. Apply `active:scale-[0.96]` for 150ms on click.

---

## 3. Popover Components & Physics

Every single popup menu (the Date Picker calendar, the Category dropdown, the User Profile dropdown) must share the identical shadow and physics.

### 3.1 Global Popup Styling
- **CSS Values:**
  - Box Shadow: `shadow-[0px_2px_16px_0px_rgba(0,0,0,0.12)]`
  - Border: `border border-[#DDDDDD]`
  - Radius: `rounded-[12px]`
  - Background: `bg-white`

### 3.2 Framer Motion Reusable Config
Do not use standard linear animations. Implement this exact config for all popovers:
```tsx
const airbnbPopoverVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { duration: 0.25, ease: [0.2, 0, 0, 1] } 
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 10, 
    transition: { duration: 0.15, ease: "easeOut" } 
  }
};
```

### 3.3 Transform Origins (Critical for Native Feel)
The expansion origin must feel like it's blooming from the user's mouse click. Set the `transform-origin` dynamically on the motion variant:
- Clicked `Kategorie` (Left side) -> `transformOrigin: "top left"`
- Clicked `Ort / Datum` (Center) -> `transformOrigin: "top center"`
- Clicked `Profile Menu` (Far Right) -> `transformOrigin: "top right"`

---

## 4. The SVG Category Strip (Below the Header)

### 4.1 Data Source and Styling Rules
- **Data:** This strip strictly uses the **existing main categories** (`Coiffeur`, `Nails`, `Barbershop`, `Spa`, etc.). It does not use static demo tags.
- **Rules:** Apply the new styling states below to `CategoryStickyRow.tsx`.
- **Inactive:** Text and SVG icon are `#717171`. No border. Remove *any* bounce or `<motion.div>` scaling from the icons (`scale-110` is banned).
- **Hover:** Text and SVG icon turn `#000000`. A solid `2px` bottom border of `#DDDDDD` appears.
- **Active:** Text and SVG icon are `#000000`. A solid `2px` bottom border of `#222222` is locked.

### 4.2 PC Horizontal Scroll Controls
- **Structure:** Desktop users must not rely on trackpad swiping. Provide absolute positioned `<` and `>` arrow buttons.
- **The Gradient Masks:**
  - Left edge mask: `absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none z-10`
  - Right edge mask: `absolute right-[80px] top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none z-10`
- **The Arrow Buttons:** Sit on top of the gradient. Small white circles with `border border-[#DDDDDD]`, `shadow-sm`, and `hover:scale-105`.

### 4.3 The Persistent Advanced Filter Button
- **Structure:** Sits statically on the far right edge of the SVG strip (`absolute right-0 top-0 h-full bg-white z-20 flex items-center pl-4`).
- **Styling:** A button containing a slider icon and the text "Filter". `border border-[#DDDDDD]`, `rounded-[12px]`, `text-[12px]`, `px-4 py-2`, `hover:bg-[#F7F7F7]`.

---

## 5. Salon Cards (The CSS Grid View)

**GLOBAL SCOPE WARNING:** The typography, sizes, and layout rules in Section 5 apply to `SalonCard.tsx` **GLOBALLY**. Whether the card renders on the homepage carousel, a search results page, or a category listing page, it MUST follow these exact rules.

### 5.1 The Desktop Grid Layout
- Container: `grid grid-cols-4 lg:grid-cols-5 gap-6` (24px gap between cards).
- Internal Image Wrapper: `aspect-square w-full rounded-[12px] overflow-hidden relative cursor-pointer`.

### 5.2 The 'Save' Button (Bookmark Ribbon, NO HEART)
- **Problem:** Currently nested in a glass pill and uses a Heart icon instead of a Save icon.
- **Airbnb Fix:** Use a `<Bookmark>` / Ribbon icon (DO NOT USE A HEART). It must sit totally naked in the top right corner (`absolute top-3 right-3 z-10`).
- **SVG Styling:**
  - Stroke: `stroke-white stroke-[2px]` (White border to ensure visibility on all photos).
  - Fill (Inactive): `fill-[rgba(0,0,0,0.5)]` (Semi-transparent black inner).
  - Fill (Active/Saved): `fill-[#222222] stroke-none` (Solid black when saved).
  - Shadow filter: `filter: drop-shadow(0px 2px 6px rgba(0,0,0,0.25))`

### 5.3 The Hover-Only Carousel & Image Zoom
- **Carousel UI:** The dots (`•••••`) and the Left/Right photo swipe arrows must be wrapped in a container that is `opacity-0` by default. It only transitions to `opacity-100` when the user hovers over the card image on desktop.
- **Zoom Physics:** The card container itself *does not mutate*. Only apply `group-hover:scale-105 transition-transform duration-300 ease-out` directly to the `next/image` component.

### 5.4 Exact 4-Line Typography Hierarchy
Every line must be fixed height or have truncations to preserve vertical rhythm across the grid. Use font family `Airbnb Cereal VF` if available, or fallback to Inter.

1. **Line 1 (Title Header):**
   - Left side: Salon Name truncate (`text-[13px] font-medium text-[#222222]`)
   - Right side: Star icon `<Star size={11} className="fill-[#222222]" />` + Rating (`text-[12px] font-medium text-[#222222]`)
2. **Line 2 (Location):**
   - The City Name only. Specifically, DO NOT USE DISTANCE.
   - Styling: `text-[12px] font-normal text-[#6A6A6A] truncate`
3. **Line 3 (Category SVG + Availability):**
   - An inline flex-row.
   - Bounding an SVG for the specific category + the earliest availability. (e.g. `[✂️ SVG] Nächster Termin: Heute 14:00`).
   - Styling: `flex items-center gap-1.5 text-[12px] font-normal text-[#6A6A6A] truncate`
4. **Line 4 (Pricing):**
   - The computed Average Spending Price.
   - Styling: `text-[12px] font-normal text-[#222222]`. (Note: The price is NOT bolded). Example output: `Ø CHF 65`.

---

## 6. Global Interaction Mechanics
- **Press Effect:** Apply `.solen-press-effect` to the Filter button, Profile button, Search button, category row items, and Date pills.
- **Implementation:**
  ```css
  .solen-press-effect:active {
    transform: scale(0.96);
    transition: transform 150ms ease-out;
  }
  ```
- **Keyboard Focus:** Default browser focus rings look amateur. Globally set `outline: 2px solid #222222; outline-offset: 2px;` on all focus-visible elements.

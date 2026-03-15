# Solen Mobile & Homepage UI Fix Roadmap

This roadmap focuses entirely on resolving the UI/UX issues present on mobile devices and the homepage, ensuring a premium, consistent, and smooth user experience as described in the Solen design guidelines.

---

## 📱 Phase 1: Mobile UI & Responsive Fixes
**Goal:** Address major layout breaks, overflow issues, and component squishing on mobile screens (`< 768px`).

### Action Items
- [ ] **Fix Navigation & Header:** Ensure the mobile menu, hamburger icon, and search/location inputs don't overlap or break out of the container on small screens.
- [ ] **Salon Registration Wizard (Mobile):** Fix layout of the onboarding wizard on mobile devices. Ensure inputs, especially the category multi-select and photo uploads, scale correctly.
- [ ] **Horizontal Scrolls & Overflow:** Identify and fix instances where content causes horizontal scrolling on mobile (e.g., in the trending carousels or store grid).
- [ ] **Touch Targets:** Increase clickable areas for buttons and links to improve accessibility on touch screens.
- [ ] **Glassmorphism Consistency:** Ensure the glassmorphism backdrop blurs perform well on mobile Safari/Chrome without causing rendering lag. Apply fallback colors if necessary.

---

## 🏠 Phase 2: Homepage UI Polish
**Goal:** Clean up the visual presentation of the homepage to achieve a "WOW" factor.

### Action Items
- [ ] **Hero Section Re-alignment:** Ensure the main search bar, location radius, and "Social Proof Numbers" are perfectly aligned and legible against the hero background.
- [ ] **Spacing & Typography:** Review padding and margins between sections (Trending, Categories, Stores List) to create better visual hierarchy. Ensure heading and paragraph font sizes scale beautifully.
- [ ] **Map vs List View Toggle:** Polish the UI of the map/list toggle buttons so they look prominent and native.
- [ ] **React Component Integration Polish:** Ensure recently added components (`ActionSearchBar`, `ExpandableTabs`, `SlidingNumber`) correctly fetch their styling (`shadcn/ui` + `tailwind`) and meld visually with the legacy CSS.

---

## 🐛 Phase 3: Registration Bug Fix & Backend Hardening ✅ [IN PROGRESS]
**Goal:** Fix the remaining critical crashes in the user flows.

### Action Items
- [x] **Store Registration Crash:** Fix the `null value in column "cat" of relation "stores" violates not-null constraint` error by dynamically pulling the primary category into the `cat` field during `obPublish()`.
- [ ] **Email/Auth Errors:** Monitor for any remaining "Email address invalid or already registered" logic bugs during customer-to-salon-owner conversions.

---

## 🚀 Execution Strategy
We will execute these phases methodically. Please provide any additional screenshots or specify exactly which homepage and mobile UI elements are bothering you the most, so we can prioritize them!

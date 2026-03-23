# 🎯 Solen UI/UX Polish & Interactivity Roadmap

This roadmap is specifically designed for Claude Code to execute. It focuses on responsive menus, fixing tap bugs, applying selective glassmorphism, enhancing dark/light mode contrast, and adding dynamic interaction feedback across the app.

---

## 📱 Phase 1: Responsive Menus & Tap Bug Fixes (Profile & Add Salon)

**Goal:** Ensure the Profile Menu and "Add Salon" menu work flawlessly on both mobile and desktop, with no un-tappable buttons.

### Tasks for Claude Code:
1. **Audit Profile Menu Responsiveness**:
   - Check the HTML/CSS for the Profile dropdown/modal.
   - Ensure it acts as a floating dropdown on Desktop and a bottom-sheet or full-screen modal on Mobile.
   - Fix `z-index` and overlay issues to prevent clicks from bleeding through.
2. **Audit "Add Salon" Menu**:
   - Ensure the multi-step form or overlay is fully scrollable on mobile without hidden inputs.
   - Check all input fields for Apple's minimum 44px tap target height rule.
3. **Fix Button Tap Bugs (CRITICAL)**:
   - Identify any buttons covered by invisible `::before`/`::after` elements or overlapping containers.
   - Verify `cursor: pointer` on desktop and remove generic `pointer-events: none` issues that disable taps.
   - Run tests specifically on Mobile view (width < 768px) to verify tap targets actually work.

**Prompt to start:** *"Claude, execute Phase 1 of CLAUDE_UX_ROADMAP.md. Fix the Profile and Add Salon menus to be perfectly responsive on PC/Mobile and resolve any untappable button bugs."*

---

## 🔮 Phase 2: Consistent & Selective Glassmorphism

**Goal:** Apply a premium "glassmorphic" feel selectively to UI components like notifications, modals, and floating navs on the homepage and across the app, while avoiding overuse that hurts readability.

### Tasks for Claude Code:
1. **Apply Existing Glassmorphism Tokens**:
   - Use the pre-existing Tailwind tokens defined in `UI_RULES.md`, specifically `backdrop-blur-glass` (20px) or `backdrop-blur-xs` (4px).
   - Use `shadow-glass` and `shadow-glass-hover` for multi-layered premium depth. Do not create raw `rgba` borders; rely on `border-s-ink/5` for light mode and `dark:border-white/5` for dark mode.
2. **Apply to Notifications & Alerts**:
   - Update toast notifications, temporary alerts, and floating badges to use the design system's glassmorphism style.
3. **Apply to Floating Menus & Sticky Navs**:
   - Ensure the sticky mobile bottom nav, desktop header (when scrolled out of transparent mode), and dropdown menus correctly implement `backdrop-blur-glass`.
4. **Remove Glassmorphism Overuse**:
   - Ensure standard content cards (like the main Salon directory cards) do *not* use heavy glassmorphism so they remain focused, readable, and performant. Instead, use standard elevated cards with `bg-s-bg-raised` (light) or `dark:bg-s-dm-surface` (dark).

**Prompt to start:** *"Claude, execute Phase 2 of CLAUDE_UX_ROADMAP.md. Apply our official glassmorphism design tokens selectively to notifications, floating menus, and headers."*

---

## 🌗 Phase 3: High-Contrast Dark & Light Mode

**Goal:** Ensure a significant, undeniable, and beautiful difference between Dark and Light mode, utilizing the standardized `UI_RULES.md` color tokens.

### Tasks for Claude Code:
1. **Enforce `UI_RULES.md` Tailwind Dark Mode Tokens**:
   - Do NOT use `[data-theme="dark"]` or create new generic variables. Rely entirely on Tailwind's `dark:` classes and our custom `s-*` color families.
   - **Light Mode**: Ensure usage of `bg-s-bg-base` (#FAF6EF), `bg-s-bg-raised` (white), and primary text `text-s-ink` (#1A1209).
   - **Dark Mode**: Strictly apply `dark:bg-s-dm-bg` (#151009), `dark:bg-s-dm-surface` (#1E1710), and text `dark:text-s-dm-text`.
2. **Update Component Backgrounds**:
   - Audit all standard cards, modals, and dropdowns inside the Next.js App Router (`app/[locale]/...`) to ensure they perfectly utilize `dark:` variants instead of hardcoded generic hexes.
3. **Enhance Shadows & Borders for Depth**:
   - Strictly apply premium multi-layered shadows like `shadow-card`, `shadow-warm-md`, and `shadow-warm-lg`. In dark mode, ensure borders use `dark:border-white/5` for separation.
4. **Test the Toggle Transition**:
   - Ensure changing themes via the `ThemeToggle` (`<ThemeScript>`) creates a smooth and performant visual change across all major layout containers.

**Prompt to start:** *"Claude, execute Phase 3 of CLAUDE_UX_ROADMAP.md. Audit and enforce our official `UI_RULES.md` deep dark mode and pure light mode tokens across all major components."*

---

## ✨ Phase 4: Dynamic & Interactive Feedback (No "Silent" Changes)

**Goal:** Provide clear, dynamic visual feedback for every user interaction. When clicking a filter or a button, the UI should react immediately.

### Tasks for Claude Code:
1. **Filter & Search Interactivity**:
   - When a filter (e.g., category pill, radius slider) is clicked, immediately apply a visual active state (e.g., color fill, border pulse).
   - Add a subtle `<Skeleton variant="card" />` while search results are updating. **No more silent DOM replacements.** The user needs to realize the content is refreshing.
2. **Universal "Apple-Level" Button Active/Hover States**:
   - Ensure every primary button utilizes the `InteractiveHoverButton` from `21st.dev` for fluid hover morphing.
   - Example Mobile active state must implement physical "pressed" scales (`active:scale-95`).
3. **Premium Transitions (`blob-interactive` & Framer Motion)**:
   - Apply the `.blob-interactive` class (500ms spring bezier curve) to morphing elements instead of using basic CSS transitions.
   - Ensure all `SalonCards` have a lift-up effect using `shadow-card-hover` on hover (`-translate-y-1`).
4. **Micro-animations & Interactive Components**:
   - Use Framer Motion and the `InteractiveHoverButton` for actions. Implement premium UI rules for success states (e.g., fluid `framer-motion` layout transitions for favoriting a salon with a heart pop). Use the designated UI Rules corner radiuses appropriately (`rounded-blob-a`, `rounded-blob-b`).

**Prompt to start:** *"Claude, execute Phase 4 of CLAUDE_UX_ROADMAP.md. Add our official blob-interactive spring animations, Framer Motion transitions, and 21st.dev button interactions across the site."*

---

## 👤 Phase 5: Fix Profile & Termine Duplication and Scrolling
**Goal:** Ensure the Profile page only shows user data and the Termine page only shows bookings. Fix overlapping UI bugs within the Next.js layouts.

### Tasks for Claude Code:
1. **Fix Profile & Bookings Component Duplication**:
   - Audit the App Router pages (`app/[locale]/dashboard/profile/page.tsx` and `app/[locale]/dashboard/calendar/page.tsx` or similar). 
   - Ensure Server and Client components are correctly fetching specialized user data vs. booking data from Supabase uniquely, rather than mirroring states.
2. **Fix Scroll & Blank Space Issues**:
   - Investigate the dashboard layout or specific sub-pages for missing `overflow-hidden` or `<div className="pb-24">` bottom padding, which causes scrolling issues un the mobile navigation tab.
   - Look for hidden UI elements like modals (`<Dialog>`, `<Sheet>`) taking up interactive space and disable/hide them properly.
3. **Prevent Component Bleed-Through**:
   - Ensure modals use correct `z-index` (e.g. `z-modal`, `z-overlay`) from `UI_RULES.md` to prevent background layout shift or bleed-through when scrolling down.

**Prompt to start:** *"Claude, execute Phase 5 of CLAUDE_UX_ROADMAP.md. Fix the standard Next.js profile/booking pages duplication and solve overlay/scroll issues."*

---

## 🏪 Phase 6: Restore "Add Salon" Flow
**Goal:** Make it easy to find and successfully complete the "Partner/Add Salon" Next.js onboarding flow.

### Tasks for Claude Code:
1. **Fix Next.js Navigation Flow**:
   - Ensure the "Deinen Salon eintragen" button (in Auth Modals or Header) properly routes the user via Next.js `<Link>` to `app/[locale]/onboarding/salon/page.tsx` or similar setup flow.
2. **Fix Form Submission Stability**:
   - Audit the registration forms. Ensure the Next.js Server Actions or API routes successfully insert the new salon data into the Supabase `stores` table. Include standard `UI_RULES.md` success states upon completion.

**Prompt to start:** *"Claude, execute Phase 6 of CLAUDE_UX_ROADMAP.md. Fix the Next.js navigation flow to the Partner page and ensure Supabase onboarding submissions work flawlessly."*

---

## 🛡️ Phase 7: Fix the Admin Panel
**Goal:** Ensure the admin dashboard correctly authenticates users and correctly loads dashboard metrics.

### Tasks for Claude Code:
1. **Server-Side Permissions**:
   - Audit `middleware.ts` or layout protections for the `app/[locale]/admin` component tree. Verify that it properly redirects malicious or standard users away from the dashboard securely.
2. **Fix Infinite Spinners in Client Components**:
   - Inspect the React fetching hooks for the Admin tabs. If they get stuck mapping data over `<Spinner />` components, fix the Supabase RLS policies or queries so data for Salons, Services, Bookings properly populate.

**Prompt to start:** *"Claude, execute Phase 7 of CLAUDE_UX_ROADMAP.md. Fix the Next.js server-side permissions for the Admin panel and ensure the Supabase data properly mounts on the client."*

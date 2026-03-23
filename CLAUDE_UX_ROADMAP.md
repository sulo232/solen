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
1. **Define a Global Glassmorphism CSS Utility**:
   - Create or update a `.glass-panel` utility class in `index.css`.
   - Ensure it has the correct `backdrop-filter: blur(16px)` (or similar), a semi-transparent background color (using `rgba`), and a subtle border (e.g. `1px solid rgba(255,255,255,0.1)`).
2. **Apply to Notifications & Alerts**:
   - Update toast notifications, temporary alerts, and floating badges to use the `.glass-panel` style.
3. **Apply to Floating Menus & Sticky Navs**:
   - Use glassmorphism on the sticky mobile bottom nav, desktop header (when scrolled), and dropdown menus.
4. **Remove Glassmorphism Overuse**:
   - Ensure standard content cards (like the main Salon directory cards) do *not* use heavy glassmorphism so they remain focused, readable, and performant.

**Prompt to start:** *"Claude, execute Phase 2 of CLAUDE_UX_ROADMAP.md. Create a standard glassmorphism utility and apply it selectively to notifications, floating menus, and headers."*

---

## 🌗 Phase 3: High-Contrast Dark & Light Mode

**Goal:** Ensure a significant, undeniable, and beautiful difference between Dark and Light mode. The current change is too subtle.

### Tasks for Claude Code:
1. **Redefine CSS Color Tokens (`:root` vs `[data-theme="dark"]`)**:
   - **Light Mode**: Pure whites, soft light grays (`#f8fafc`) for backgrounds, high-contrast dark text (`#0f172a`).
   - **Dark Mode**: Deep, rich dark backgrounds (e.g., `#09090b` or `#18181b`), elevated card colors (`#27272a`), bright white text, and glowing accents.
2. **Update Component Backgrounds**:
   - Ensure all cards, modals, and dropdowns explicitly use these themed CSS variables instead of hardcoded hex values that don't flip.
3. **Enhance Shadows & Borders for Depth**:
   - Use distinct shadows for Light Mode (soft multi-layered shadows) and Dark Mode (no shadow, but instead use a subtle colored glow or border like `border: 1px solid rgba(255,255,255,0.1)`).
4. **Test the Toggle Transition**:
   - Add `transition: background-color 0.3s ease, color 0.3s ease` to all major structural elements so flipping the switch feels smooth, not fully abrupt.

**Prompt to start:** *"Claude, execute Phase 3 of CLAUDE_UX_ROADMAP.md. Revamp our Dark and Light mode CSS variables so there is a drastic, high-contrast difference between the two themes."*

---

## ✨ Phase 4: Dynamic & Interactive Feedback (No "Silent" Changes)

**Goal:** Provide clear, dynamic visual feedback for every user interaction. When clicking a filter or a button, the UI should react immediately.

### Tasks for Claude Code:
1. **Filter & Search Interactivity**:
   - When a filter (e.g., category pill, radius slider) is clicked, immediately apply a visual active state (e.g., color fill, border pulse).
   - Add a subtle loading skeleton or CSS spinner/layer-fade while search results are updating. **No more silent DOM replacements.** The user needs to realize the content is refreshing.
2. **Universal Button Active/Hover States**:
   - Ensure *every* button and interactive element has a `:hover` (for PC) and an `:active` (for Mobile) state.
   - Example Mobile active state: `transform: scale(0.96)` to give a physical "pressed" feel.
3. **Smooth Transitions Everywhere**:
   - Add `transition: all 0.2s ease-in-out` to all interactive elements (chips, buttons, inputs) so they fade into their active states smoothly.
4. **Micro-animations for Actions**:
   - Use micro-animations for success states (e.g., a checkmark scale animation when an action succeeds, or a heart pop animation when favoriting).

**Prompt to start:** *"Claude, execute Phase 4 of CLAUDE_UX_ROADMAP.md. Add physical pressed states to all buttons, interactive loading states to all filters so no changes happen silently, and fluid transitions everywhere."*

---

## 👤 Phase 5: Fix Profile & Termine Duplication and Scrolling
**Goal:** Ensure the Profile page only shows user data and the Termine page only shows bookings. Fix the overlapping/blank space bugs that occur while scrolling.

### Tasks for Claude Code:
1. **Fix `renderProfile()` and `renderBookings()`**:
   - Check `index.html` and `app.js`. Ensure that when navigating to Profile (`#pageProfile`), it loads user data. When navigating to Termine (`#pageBookings`), ensure it loads the list of bookings. Stop them from mirroring each other.
2. **Fix Scroll & Blank Space Issues**:
   - Investigate `.page`, `#pageProfile`, and `#pageBookings` for missing `overflow: hidden` or `padding-bottom` that causes blank spaces when scrolling up or down on mobile.
   - Look for hidden elements like `#storeOverlay`, `#calOverlay`, or maps taking up interactive space and disable/hide them properly (`display: none` or pointer-events).
3. **Remove Background Bleed-Through**:
   - Make sure inactive pages have `display: none` and are not just hidden via z-index, which causes "stuff that shouldn't be there" to appear when scrolling down.

**Prompt to start:** *"Claude, execute Phase 5 of CLAUDE_UX_ROADMAP.md. Fix the Profile and Termine page duplication bug, and fix the mobile scrolling bugs where blank spaces or wrong elements appear."*

---

## 🏪 Phase 6: Restore "Add Salon" Flow
**Goal:** Make it easy to find and successfully use the "Add Salon" feature.

### Tasks for Claude Code:
1. **Fix Navigation to `#pagePartner` or Setup Flow**:
   - Ensure the "Deinen Salon eintragen" button (in the Auth modal) or in the Mobile Navigation correctly routes the user to the salon setup form.
2. **Fix the Form Submission (`submitSalonProfile`)**:
   - Ensure the multi-step form properly inserts the new salon data into the Supabase `stores` table without throwing silent errors. Provide a clear success message once finished.

**Prompt to start:** *"Claude, execute Phase 6 of CLAUDE_UX_ROADMAP.md. Fix the Add Salon navigation and ensure the setup form submission works without silent errors."*

---

## 🛡️ Phase 7: Fix the Admin Panel
**Goal:** Restore functionality to the `/admin` routing and ensure the 4 tabs load correctly.

### Tasks for Claude Code:
1. **Permissions & Routing**:
   - Check `showPage('admin')`. Ensure that if a user has admin privileges, they are allowed to see the page.
2. **Fix Infinite Spinners**:
   - Inspect `showAdminTab()` and functions like `renderAdminStores()`. The tabs currently get stuck on `<div class="spinner"></div>`. Fix the Supabase queries to properly load and display the data for Salons, Services, Bookings, and Users.

**Prompt to start:** *"Claude, execute Phase 7 of CLAUDE_UX_ROADMAP.md. Fix the Admin panel route and ensure the data loads in the tabs instead of spinning infinitely."*

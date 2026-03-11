# Solen.ch Roadmap

## Phase 1: Stabilization & Bug Fixes (In Progress)
- [x] **Mobile UI Fixes** (partial):
  - [x] Broad audit of all `touchend`/`touchstart`/`preventDefault()` handlers in `index.html`
  - [x] Remove/replace the destructive global `touchend` delegation script (lines ~10957-11050)
  - [ ] Verify no invisible overlay divs (`#toastContainer`, `body::after`) intercept pointer events
- [ ] **Accessibility (a11y)**: Ensure all touch targets meet the minimum 44x44px requirement.
- [ ] **Modal Scrolling**: Fix overflow behaviors on modals (Booking Wizard, Store Detail) so they don't block the main page scrolling incorrectly on iOS/Android.

## Phase 2: Refactoring & Code Quality (In Progress)
- [x] **Build Tooling**: Introduced Vite as bundler. Run `npm install` then `npm run dev`.
- [x] **CSS Extraction**: All styles extracted to `src/styles/` (variables, base, layout, components, utilities).
- [x] **API Layer**: All Supabase calls centralized into `src/services/` (auth, bookings, salons, supabase client).
- [x] **Vite Entry Point**: `<script type="module" src="/src/main.js">` wired into `index.html`.
- [ ] **Full Modularization**: Incrementally move inline JS from `index.html` into ES modules under `src/`.
- [ ] **State Management**: Implement structured UI state handling (Booking flow, Auth, Search filters).
- [ ] **Env Vars**: Move hardcoded Supabase keys to `.env` (see `.env.example`).

## Phase 3: Feature Enhancements
- [ ] **Enhanced Provider Dashboard**: Expand the `salon-dashboard` view to give owners more control over schedules, staff, and services.
- [ ] **Advanced Filtering**: Implement map-based searching and dynamic filtering by price, rating, and specific treatments.
- [ ] **User Reviews**: Allow verified users to leave reviews and ratings for salons they have visited.
- [ ] **PWA Polish**: Enhance the PWA manifest and Service Worker for better offline support and native-app feel.

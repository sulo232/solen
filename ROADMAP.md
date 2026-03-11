# Solen.ch Roadmap

## Phase 1: Stabilization & Bug Fixes (Current)
- [ ] **Mobile UI Fixes**: Remove problematic `z-index: 1` global reset to restore tap functionality on mobile devices.
- [ ] **Accessibility (a11y)**: Ensure all touch targets meet the minimum 44x44px requirement.
- [ ] **Modal Scrolling**: Fix overflow behaviors on modals (Booking Wizard, Store Detail) so they don't block the main page scrolling incorrectly on iOS/Android.

## Phase 2: Refactoring & Code Quality
- [ ] **Modularization**: Break down the monolithic `index.html` (currently 13,000+ lines) into separate components (e.g., separate CSS files, JS modules, and HTML templates or use a framework like Vite/Next.js/React if scaling is needed).
- [ ] **State Management**: Implement a structured way to handle UI state (Booking flow, Auth state, Search filters) instead of directly mutating the DOM.
- [ ] **API Layer**: Centralize Supabase data fetching logic into dedicated service files.

## Phase 3: Feature Enhancements
- [ ] **Enhanced Provider Dashboard**: Expand the `salon-dashboard` view to give owners more control over their schedules, staff, and services.
- [ ] **Advanced Filtering**: Implement map-based searching and dynamic filtering by price, rating, and specific treatments.
- [ ] **User Reviews**: Allow verified users to leave reviews and ratings for salons they have visited.
- [ ] **PWA Polish**: Enhance the Progressive Web App (PWA) manifest and Service Worker for better offline support and native-app feel.

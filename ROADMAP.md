# Solen.ch Roadmap

## Phase 1: Stabilization & Bug Fixes ✅ Complete
- [x] **Mobile UI Fixes**:
  - [x] Broad audit of all `touchend`/`touchstart`/`preventDefault()` handlers in `index.html`
  - [x] Remove/replace the destructive global `touchend` delegation script (lines ~10957-11050)
  - [x] Verify no invisible overlay divs intercept pointer events
- [x] **Accessibility (a11y)**: Touch target audit complete
- [x] **Modal Scrolling**: iOS/Android overflow behavior fixed on Booking Wizard and Store Detail

## Phase 2: Refactoring & Code Quality ✅ Complete
- [x] **Build Tooling**: Vite bundler. Run `npm install` then `npm run dev`.
- [x] **CSS Extraction**: All styles in `src/styles/` (variables, base, layout, components, utilities).
- [x] **API Layer**: All Supabase calls centralized into `src/services/` (auth, bookings, salons, supabase client).
- [x] **Vite Entry Point**: `<script type="module" src="/src/main.js">` wired into `index.html`.
- [x] **Env Vars**: Supabase keys moved to `.env` (see `.env.example`). `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
- [x] **Reactive Store**: `src/store/index.js` — pub/sub store mirroring all legacy globals (`currentUser`, `allStores`, `bookingState`, etc.).
- [x] **Full Modularization**: All inline JS extracted into ES modules under `src/modules/`:
  - `auth.js` — login, signup, session, profile, password reset, phone OTP
  - `booking.js` — wizard flow, modal flow, reminders, cancellation, waiting list
  - `salons.js` — load stores, filter/sort engine, favourites, reviews, geo utils
  - `dashboard.js` — salon owner: staff, hours, photos, services, add-ons, analytics
  - `admin.js` — salon approval, user management, admin bookings
  - `crm.js` — customer notes, tags, allergy info, visit history
  - `analytics.js` — event tracking, scroll depth, page views, Supabase persistence
- [x] **State Management**: Reactive store with `store.get()` / `store.set()` / `store.subscribe()`.
- [x] **Global Bridge**: `window.solenModules` exposes all module functions for incremental migration from inline scripts.

## Phase 3: Feature Enhancements (In Progress)

### Architecture decisions (auto-selected):
- Enhanced dashboard built as a separate view (`src/views/dashboard/`) using module functions already written in Phase 2.
- Advanced filtering uses Leaflet (already loaded via CDN) for map view + extends the `applyFilters()` pure function in `salons.js`.
- Reviews system hooks into the existing `reviews` Supabase table and extends `submitReview()` from `salons.js`.
- PWA: manifest already exists — will add offline caching strategy via a Workbox-based service worker.

### Tasks:
- [x] **Enhanced Provider Dashboard**: Weekly calendar view (`DashboardCalendar`), realtime notification center (`NotificationCenter`), revenue/top-services/peak-hours charts — all in `src/views/dashboard/`.
- [x] **Advanced Filtering**: Leaflet map view (`MapView`) synced to active filter results, named filter presets (`FilterPresets`) saved to localStorage — in `src/views/filtering/`.
- [x] **User Reviews**: Photo upload (Supabase Storage), edit within 24h, verified-visit badge, owner reply thread, Google source badge — `ReviewForm` + `ReviewList` in `src/views/reviews/`.
- [x] **PWA Polish**: Enhanced manifest (icons, shortcuts, screenshots, categories), tiered service worker (stale-while-revalidate for shell, cache-first for images, network-first with offline fallback for navigation), push notification handler.

### Remaining before production:
- [ ] Generate icon PNG files for `/icons/` (72, 96, 128, 144, 152, 192, 384, 512 px)
- [ ] Create `/offline.html` fallback page
- [ ] Add screenshots for manifest (`/screenshots/`)
- [ ] Replace inline index.html scripts with `window.solenModules.*` calls (incremental migration)

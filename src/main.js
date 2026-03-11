/**
 * src/main.js — Application entry point.
 *
 * Module structure:
 *
 *   src/
 *   ├── main.js                  ← you are here
 *   ├── services/
 *   │   ├── supabase.js          — shared Supabase client singleton
 *   │   ├── auth.js              — sign-in / sign-out / session helpers
 *   │   ├── bookings.js          — booking CRUD (create, fetch, update, cancel)
 *   │   └── salons.js            — salon / provider data fetching
 *   ├── utils/
 *   │   ├── dom.js               — querySelector wrappers, element helpers
 *   │   └── events.js            — safe event listeners, touch-friendly onTap
 *   └── styles/
 *       ├── main.css             — CSS entry point (imports below layers)
 *       ├── variables.css        — design tokens / CSS custom properties
 *       └── components.css       — per-component styles
 *
 * This file bootstraps the app:
 *   1. Imports the CSS bundle so Vite processes and injects it.
 *   2. Imports service / utility modules as they are implemented.
 *   3. Calls init() once the DOM is ready.
 *
 * NOTE: During the migration phase index.html still contains the full legacy
 * app. This module coexists without interfering — it is not yet referenced by
 * index.html. Once modules are ready, a <script type="module" src="/src/main.js">
 * tag will replace the inline scripts.
 */

import './styles/main.css';

// ---------------------------------------------------------------------------
// Future imports — uncomment as each module is implemented
// ---------------------------------------------------------------------------
// import { supabase }               from '@/services/supabase.js';
// import { getSession, onAuthChange } from '@/services/auth.js';
// import { fetchSalons }            from '@/services/salons.js';
// import { fetchUserBookings }      from '@/services/bookings.js';
// import { qs, qsa }               from '@/utils/dom.js';
// import { onTap, delegate }        from '@/utils/events.js';

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

/**
 * init — top-level application bootstrap.
 *
 * Called once the DOM is interactive. Wire up services, render initial state,
 * and attach event listeners here.
 */
function init() {
  console.log('Solen app initialized');

  // TODO: restore session, load initial data, register service worker, etc.
}

document.addEventListener('DOMContentLoaded', init);

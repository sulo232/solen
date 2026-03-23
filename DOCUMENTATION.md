# Solen.ch Technical Documentation

## Overview
Solen.ch is a web application designed for booking beauty and wellness services (haircuts, nails, spa, makeup, etc.) in the Basel area. It provides a platform for users to discover venues and for salon owners to manage bookings.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript. No heavy frontend frameworks are currently used.
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage).
- **Hosting**: Configured for Vercel deployment (`vercel.json`).
- **PWA**: Includes a Web App Manifest (`manifest.json`) and a Service Worker (`sw.js`).

## Architecture & Structure (CRITICAL)
**DO NOT USE VITE, WEBPACK, OR NPM TO BUILD THIS PROJECT.**
The user's local MacOS environment has severe NPM permission restrictions (`EPERM` / `EACCES` on `~/.npm`). We cannot compile code locally, and GitHub Actions is unavailable or hidden for this repository. 

Because of this, the application MUST remain structured as a **Vanilla HTML/CSS/JS Monolith**. All application logic, styling, and markup MUST be housed directly within `index.html` or served as static `<script>`/`<link>` tags from the root directory. 

If you extract code into a `src/` folder that requires compilation, the live GitHub Pages site will ignore it because it only serves the root `index.html`.

### Theming & Design System
- **CSS Variables**: Extensive use of CSS variables (tokens) handles the color palette, typography, spacing, and theming.
- **Glassmorphism**: The UI heavily features frosted glass effects (`backdrop-filter: blur`), soft shadows, and rounded corners to achieve a premium "warm Swiss" aesthetic.
- **Dark Mode**: Fully supported via the `[data-theme="dark"]` attribute and `prefers-color-scheme` media queries.

### Key Features
1. **Dynamic Routing (SPA-like)**: The application hides and shows different "pages" (`.page` class) within the same HTML document to simulate a Single Page Application without reloading.
2. **Booking Wizard**: A complex modular modal flow (`#bookingModal`) that guides users through selecting services, dates, times, and optional add-ons.
3. **Direct Messaging (DM)**: An integrated, Instagram-style chat UI allowing users to communicate directly with salon owners.
4. **Authentication**: Handled via Supabase (Magic Link/Email or Google OAuth).

## Known Technical Debt
- **Mobile Tap Issue**: A custom JavaScript global `touchend` event delegation script aggressively called `e.preventDefault()`, stopping native clicks. This has been removed. A secondary WebKit bug regarding `backdrop-filter` clipping has also been patched by moving those filters to `::before` pseudo-elements.
- **Monolith Size**: Maintaining a 13,000+ line HTML file presents challenges for debugging and collaboration. However, due to the deployment pipeline restrictions (no build step permitted), you must deal with the monolith as-is. Do not attempt to modularize it into a build pipeline.

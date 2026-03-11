# Solen.ch Technical Documentation

## Overview
Solen.ch is a web application designed for booking beauty and wellness services (haircuts, nails, spa, makeup, etc.) in the Basel area. It provides a platform for users to discover venues and for salon owners to manage bookings.

## Tech Stack
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript. No heavy frontend frameworks are currently used.
- **Backend/Database**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage).
- **Hosting**: Configured for Vercel deployment (`vercel.json`).
- **PWA**: Includes a Web App Manifest (`manifest.json`) and a Service Worker (`sw.js`).

## Architecture & Structure
Currently, the application is structured as a monolith. The majority of the application logic, styling, and markup is housed within `index.html`.

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
- **Mobile Tap Issue**: A custom JavaScript global `touchend` event delegation script (Lines 10957-11050) aggressively calls `e.preventDefault()`, stopping native clicks and causing touch unresponsiveness on mobile devices. **(Currently pending fix: remove this script)**
- **Monolith Size**: Maintaining a 13,000+ line HTML file presents challenges for debugging and collaboration. Splitting this into distinct files (HTML, CSS, JS) should be a priority.

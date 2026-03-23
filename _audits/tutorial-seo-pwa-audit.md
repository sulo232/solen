# Audit Report: Tutorial & Onboarding UX + SEO & Performance

**Date:** 2026-03-22
**Scope:** TutorialTour, PWAInstallPrompt, sitemap, robots, SEO utility, Service Worker, manifest

---

## Section A: UI Issues

| # | Issue | File | Severity | Fix |
|---|---|---|---|---|
| A1 | `rounded-xl` on PWA icon container (banned token) | components/ui/PWAInstallPrompt.tsx:67 | 🟡 | → `rounded-card` |
| A2 | TutorialTour overlay color `rgba(26,26,46,0.5)` uses cool blue-grey — violates warm palette | components/TutorialTour.tsx:40 | 🟡 | → `rgba(26,18,9,0.5)` (warm ink) |
| A3 | PWA dismiss button missing `dark:text-s-dm-text/30 dark:hover:text-s-dm-text/60` | components/ui/PWAInstallPrompt.tsx:79 | 🟡 | Add dark mode pair |
| A4 | Tour button labels hardcoded in German only — no i18n | components/TutorialTour.tsx:43-45 | 🟡 | Use `useTranslations` or pass locale labels |
| A5 | PWA prompt text hardcoded in German only — no i18n | components/ui/PWAInstallPrompt.tsx:72-76 | 🟡 | Use `useTranslations` |

## Section B: Backend / API Issues

| # | Issue | Endpoint/File | Severity | Fix |
|---|---|---|---|---|
| B1 | `sitemap.ts` uses `createServerSupabaseClient()` with `force-dynamic` — forces runtime Supabase auth cookie init on every crawl hit | app/sitemap.ts:4,44 | 🟡 | Use `createAdminSupabaseClient()` (service role) instead — sitemaps are public, no user session needed |

## Section C: Feature Flow Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| C1 | `#tour-services` and `#tour-last-minute` element IDs don't exist on any component — tour steps 2 & 3 silently fail (driver.js skips missing targets) | 🔴 | Add `id="tour-services"` and `id="tour-last-minute"` to the appropriate elements on HomePage |
| C2 | TutorialTour is exported from `components/index.ts` but **never imported/rendered** on any page — dead code | 🔴 | Import and render in HomePage or layout (only for logged-in users) |
| C3 | `generateSalonSchema()` from `lib/seo.ts` is **never called** anywhere — dead code, no JSON-LD on salon pages | 🔴 | Import and inject as `<script type="application/ld+json">` on salon/[slug] page |
| C4 | Service Worker pre-caches `/index.html` and `/offline.html` — `/index.html` doesn't exist (Next.js App Router), `/offline.html` doesn't exist in `public/` | 🟡 | Remove `/index.html` from SHELL_ASSETS, create `public/offline.html` or remove reference |
| C5 | Manifest shortcuts use `/?view=salons` and `/?view=bookings` — these query params are not handled anywhere in the app | 🟡 | Update shortcuts to valid locale-prefixed routes (e.g., `/de/coiffeur`, `/de/account/bookings`) |
| C6 | UI_RULES.md §8 says TutorialTour has "4 full-screen welcome slides" but component only has 3 tooltip steps — doc/code mismatch | 🟢 | Update UI_RULES.md to match reality (3 driver.js tooltip steps, no welcome slides) |
| C7 | UI_RULES.md says localStorage key is `solen_tour_done` but code uses `tutorial_completed` — doc/code mismatch | 🟢 | Update UI_RULES.md |

## Section D: Data Integrity Issues

| # | Issue | Severity | Fix |
|---|---|---|---|
| D1 | `sitemap.ts` queries `service_categories` table — verify this table exists in Supabase (not in CLAUDE.md schema) | 🟡 | Verify table exists; if not, remove that sitemap section or create migration |

## Section E: Cross-Component / i18n Issues

| # | Issue | Components | Severity | Fix |
|---|---|---|---|---|
| E1 | `robots.ts` only disallows `/de/dashboard/`, `/en/dashboard/`, `/de/account/`, `/en/account/` — missing `/fr/` and `/it/` locale variants | 🔴 | Add all 4 locale prefixes for dashboard and account |
| E2 | `lib/seo.ts` only accepts `locale: "de" | "en"` — missing `fr` and `it` support | 🟡 | Extend to accept all 4 locales |
| E3 | `manifest.json` `start_url` is `/` — should be `/de/` or dynamically set per locale | 🟢 | Minor — `/` redirects to locale anyway |
| E4 | SW offline fallback has hardcoded German text ("Du bist offline") — no i18n | 🟡 | Accept-Language based or bilingual fallback |
| E5 | `manifest.json` description is German-only | 🟢 | Acceptable — PWA manifest doesn't support i18n natively |
| E6 | `markFirstBooking()` exported from PWAInstallPrompt but never called after bookings | 🟡 | Call `markFirstBooking()` in booking success flow |

---

## Fix Priority Order

### 🔴 Critical (4)
1. **C1** — Add missing tour target IDs (`#tour-services`, `#tour-last-minute`)
2. **C2** — Wire TutorialTour into the app (render it on HomePage or layout)
3. **C3** — Wire `generateSalonSchema()` into salon detail page
4. **E1** — robots.ts: add `/fr/` and `/it/` dashboard/account disallow rules

### 🟡 Medium (9)
5. **A1** — PWA `rounded-xl` → `rounded-card`
6. **A2** — Tour overlay warm color
7. **A3** — PWA dismiss button dark mode
8. **A4** — TutorialTour i18n
9. **A5** — PWAInstallPrompt i18n
10. **B1** — Sitemap: use admin client
11. **C4** — SW stale pre-cache paths
12. **E2** — SEO locale expansion
13. **E6** — Call `markFirstBooking()`

### 🟢 Low (4)
14. **C5** — Manifest shortcut URLs
15. **C6** — UI_RULES.md tour description mismatch
16. **C7** — UI_RULES.md localStorage key mismatch
17. **E3** — Manifest start_url

# Solen.ch — Supplementary Sitewide Audit (3 of 3)

> **Date**: 2026-03-29  
> **Scope**: Everything NOT covered in previous audits (SEO/PWA, Payments, Design System).  
> **Covers**: i18n, booking flow safety, orphaned features, middleware, accessibility, dashboard debt, data integrity.

---

## 01 · I18N — Hardcoded German Across Core Flows

The most pervasive issue on the platform. Dozens of components ship raw German strings instead of `useTranslations()`.

| # | Component | Hardcoded Strings | Severity |
|---|---|---|---|
| 1 | `TerminePage.tsx` (entire 473-line file) | "Meine Termine", "Nächste Termine", "Vergangene Termine", "Absagen", "Verschieben", "Stornieren", "Nochmal buchen", all status labels, cancel modal text, calendar day labels `["Mo","Di","Mi",...]` | 🔴 CRITICAL |
| 2 | `BookingCalendar.tsx` | "Morgens"/"Nachmittags"/"Abends", "Wöchentlich"/"Zweiwöchentlich"/"Monatlich", "Zahlung", "Jetzt bezahlen", "Verschlüsselt durch Stripe · nDSG-konform", "Buchung bestätigt", "Alles klar!", "Erster Besuch in diesem Salon", "Regelmässig buchen?", "Serienbuchung", "Auf Warteliste setzen", acquisition source labels | 🔴 CRITICAL |
| 3 | `BookingCalendar.tsx` StripePaymentForm | "Zahlung fehlgeschlagen", "Verarbeitung…", step labels `["Termin","Details","Zahlung"]` | 🔴 CRITICAL |
| 4 | `ProfilePage.tsx` ReferralSection | "Freunde einladen", "Eingeladen", "Verdient" — uses `t()` for most strings but misses these | 🟡 HIGH |
| 5 | `BookingCalendar.tsx` barbershop banner | "Letzter Schnitt wiederholen", "Gleicher Schnitt", "Stühle", "Min Puffer" | 🟡 HIGH |

**Impact**: `TerminePage.tsx` has ZERO `useTranslations` calls. Any user on `/en/`, `/fr/`, or `/it/` sees full German on their bookings page.

**Fix**: Add `useTranslations("termine")` / `useTranslations("booking")` and move every string to all 4 locale files. ~2hr per component.

---

## 02 · Booking Flow — Structural Risks

| # | Issue | File:Line | Severity |
|---|---|---|---|
| 1 | **`handlePaymentSuccess` creates booking AFTER payment** — if the booking API call fails after payment succeeds, the customer is charged but has no booking. No compensation/retry flow exists. | `BookingCalendar.tsx:492-514` | 🔴 CRITICAL |
| 2 | **Stripe publishable key loaded with empty string fallback** — `loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")`. If env var is missing, `loadStripe("")` silently fails. Booking flow shows payment step with broken Stripe Elements, no error. | `BookingCalendar.tsx:28` | 🔴 CRITICAL |
| 3 | **Cancel modal has no error handling** — `catch { /* ignore */ }` silently swallows failures. User gets no feedback if cancellation API fails. | `TerminePage.tsx:72` | 🟡 HIGH |
| 4 | **Double-submit risk on booking confirmation** — no debounce/disabled state on the confirm button during the async gap between `handleProceedToPayment` setting `confirming=true` and the state update completing. | `BookingCalendar.tsx:401` | 🟡 HIGH |
| 5 | **Booking success links use raw `<a>` tag** — `<a href={/${locale}/profile}>` bypasses Next.js routing, causing full page reload instead of client-side navigation. | `BookingCalendar.tsx:558` | 🟡 HIGH |
| 6 | **Error messages are hardcoded German** — "Zahlung konnte nicht initialisiert werden", "Buchung fehlgeschlagen", "Fehler" used as fallbacks throughout the booking flow. | `BookingCalendar.tsx:485,507,510,535` | 🟡 HIGH |

---

## 03 · Orphaned Features & Dead Wiring

Features that exist in code but have no frontend integration or user-facing entry point.

| # | Feature | What Exists | What's Missing | Severity |
|---|---|---|---|---|
| 1 | **Service Packages "Buy" button** | `/salon/[slug]/packages` page renders packages, API routes exist | `onClick` handler is empty — button does nothing. Identified in payments audit, still unfixed. | 🔴 CRITICAL |
| 2 | **TutorialTour** | Full component at `components/TutorialTour.tsx`, exported from barrel | Never rendered on any page. Tour target IDs (`#tour-services`, `#tour-last-minute`) don't exist on any DOM element. | 🔴 CRITICAL |
| 3 | **JSON-LD SEO structured data** | `lib/seo.ts` has `generateSalonSchema()` function that builds full LocalBusiness schema | Never called — no `<script type="application/ld+json">` on any salon page. Google can't show rich snippets (ratings, hours, pricing). | 🔴 CRITICAL |
| 4 | **Voucher system** | Migration `084_voucher_system.sql` created tables, `/vouchers/buy` page exists | No `/vouchers` landing page, no redemption flow, no "my vouchers" section in profile. Dead-end feature. | 🟡 HIGH |
| 5 | **Group bookings** | `GroupBookingModal.tsx` component exists, `group_booking_id` column in bookings table | No entry point or button on any salon page to trigger group booking. | 🟡 HIGH |
| 6 | **PWA first-booking trigger** | `markFirstBooking()` exported from `PWAInstallPrompt.tsx` | Never called after booking success in `handlePaymentSuccess`. | 🟡 HIGH |

---

## 04 · Middleware & Auth — Edge Cases

| # | Issue | File:Line | Severity |
|---|---|---|---|
| 1 | **Middleware makes 2-3 DB queries on every dashboard request** — `getUser()` + `profiles.select("role")` + potentially `salons.select("id")` for auto-fix. No caching. On cold starts adds 300-800ms to every page load. | `middleware.ts:121-170` | 🟡 HIGH |
| 2 | **Auth timeout of 4 seconds** — Vercel Edge has 25s limit, but users perceive >2s as broken. A 4s auth timeout means some requests take 4s+ before rendering starts. | `middleware.ts:123` | 🟡 HIGH |
| 3 | **`/api` routes skip Supabase session refresh** — middleware returns early for API routes (L45-72), meaning API calls don't refresh expiring tokens. Long sessions get 401s on API while page nav works fine. | `middleware.ts:45` | 🟡 HIGH |
| 4 | **ProfilePage uses `/api/profile` fetch for auth gate** — if the API returns non-JSON or a network error, the catch block redirects to login unconditionally, even for connectivity blips. | `TerminePage.tsx:232` | 🟢 MEDIUM |

---

## 05 · Accessibility

| # | Issue | File:Line | Severity |
|---|---|---|---|
| 1 | **Mini-calendar has no `aria-label` on day cells** — screen readers can't distinguish booking dots from empty days. Calendar nav buttons have no labels. | `TerminePage.tsx:176-196` | 🟡 HIGH |
| 2 | **Booking time slots lack `role="radiogroup"`** — slots behave as a single-select radio group but are rendered as individual buttons with no group context for screen readers. | `BookingCalendar.tsx:658-742` | 🟡 HIGH |
| 3 | **Cancel modal may lack focus trap** — user can tab behind the modal overlay. `GlassModal` should handle this, but verify it implements `inert` or `focus-trap`. | `TerminePage.tsx:77-111` | 🟡 HIGH |
| 4 | **Recurring frequency dropdown has custom arrow SVG** — hardcoded `stroke-opacity='0.4'` doesn't adapt to dark mode. | `BookingCalendar.tsx:799` | 🟢 MEDIUM |

---

## 06 · Dashboard & Admin Debt

| # | Issue | Severity |
|---|---|---|
| 1 | **6 category admin pages** (`nail-admin`, `spa-admin`, `barber-ops`, `coiffeur-crm`, `waxing-admin`, `makeup-admin`) each reimplement identical tab pill logic independently instead of using a shared `<AdminTabs>` component. | 🟡 HIGH |
| 2 | **CLAUDE.md Rule 38b mandates dashboard i18n** but multiple dashboard pages still use hardcoded German for table headers, metric names, and internal labels. | 🟡 HIGH |
| 3 | **120+ migration files** with some duplicate sequence numbers (e.g., `005_`, `060_`, `068_`, `072_`, `075-078_`) — potential ordering conflicts during fresh deploys. | 🟡 HIGH |

---

## 07 · Data Integrity & Schema Risks

| # | Issue | Severity |
|---|---|---|
| 1 | **ProfilePage loyalty query likely broken** — queries `loyalty_stamps` but `.select()` includes fields like `stamps_needed` and `reward_text` which exist on `loyalty_cards` table, not `loyalty_stamps`. This query probably fails silently and the loyalty section renders empty. | 🔴 CRITICAL |
| 2 | **BookingCalendar queries `/api/clients/${userId}/repeat-last-cut`** — barbershop-only feature. Verify this API route actually exists. | 🟡 HIGH |
| 3 | **BookingCalendar queries `/api/salon/chairs`** — verify this route exists in `app/api/salon/`. | 🟡 HIGH |
| 4 | **Multiple components fetch `/api/profile` without response shape validation** — if API response format changes, entire profile/termine pages break with no error message. | 🟢 MEDIUM |

---

## 08 · Strengths — Keep These

| # | What | Why It's Good |
|---|---|---|
| 1 | Middleware uses `getUser()` not `getSession()` for auth | Correct JWT verification server-side |
| 2 | Supabase env var check with early exit in middleware | Prevents `MIDDLEWARE_INVOCATION_FAILED` crash |
| 3 | Realtime slot updates via Supabase channels | Prevents double-booking UX |
| 4 | Skeleton loading states in TerminePage and BookingCalendar | Good perceived performance |
| 5 | `ProfilePage` uses `useTranslations` for most copy | Good i18n foundation |
| 6 | Booking flow supports guest checkout | Good conversion — no forced signup |
| 7 | `formatCurrency()` utility used consistently | Better than hardcoded `CHF .toFixed(2)` |
| 8 | Auth role auto-fix in middleware | Self-healing for stuck onboarding users |

---

## Score Summary

| Category | 🔴 Critical | 🟡 High | 🟢 Medium |
|---|---|---|---|
| I18N | 3 | 2 | — |
| Booking Flow | 2 | 4 | — |
| Orphaned Features | 3 | 3 | — |
| Middleware/Auth | — | 3 | 1 |
| Accessibility | — | 3 | 1 |
| Dashboard Debt | — | 3 | — |
| Data Integrity | 1 | 2 | 1 |
| **Total** | **9** | **20** | **3** |

---

## Priority Execution Order

### Tier 1 — Do Immediately
1. Fix payment-then-booking race condition (`BookingCalendar.tsx:492`)
2. Add Stripe key missing error UI (`BookingCalendar.tsx:28`)
3. Fix loyalty_stamps query joining wrong table (`ProfilePage.tsx:706`)
4. TerminePage full i18n — 473 lines of German-only booking management
5. BookingCalendar i18n — core revenue flow is German-only

### Tier 2 — This Sprint
6. Wire `generateSalonSchema()` JSON-LD into salon pages
7. Wire or remove TutorialTour dead code
8. Cancel modal error handling
9. Service Packages buy button wiring
10. Middleware role-check caching

### Tier 3 — Next Sprint
11. Dashboard shared `<AdminTabs>` component extraction
12. Group booking entry point
13. Voucher redemption flow
14. Accessibility aria improvements
15. Migration file renumbering

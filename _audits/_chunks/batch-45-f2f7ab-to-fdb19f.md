# Batch 45 — Audit Report

**Date range:** 2026-04-02 00:01 – 2026-04-02 10:39  
**Branch:** claude/vigorous-spence-0e9aa7

## Commit Table

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | f2f7ab | 2026-04-02 00:01 | phase 1.1 (update): fix PaymentStep redirect to confirmation page | 1 | +1/-1 | bug-fix | NO | YES | NO | One-line redirect fix: changed destination from `/bookings/[id]/confirm` to `/confirmation?booking_id=[id]` to match new route structure. No design impact. |
| 2 | 7b9cbd | 2026-04-02 00:02 | docs: add lesson learned about nested i18n namespace paths | 1 | +7/-0 | docs-only | NO | YES | NO | Appended next-intl dot-notation lesson to LESSONS_LEARNED.md. No code or design change. |
| 3 | 609aef | 2026-04-02 00:08 | phase 3.1: create my bookings page with listing and card UI | 9 | +596/-0 | add | NO | YES | YES | Introduced BookingCard.tsx (236 lines), BookingsList.tsx (136 lines), profile/bookings page, and user bookings API route. Uses lucide-react icons and locale-aware date formatting. Design tokens not verified against design system doc; status badge colors hardcoded inline. |
| 4 | 3b2859 | 2026-04-02 00:08 | docs: add lesson learned about component barrel imports | 1 | +7/-0 | docs-only | NO | YES | NO | Appended barrel import lesson to LESSONS_LEARNED.md. No code or design change. |
| 5 | 01b5c2 | 2026-04-02 00:11 | phase 3.2: add review prompt component for completed bookings | 6 | +192/-0 | add | NO | YES | YES | Added ReviewPrompt.tsx (159 lines) for post-booking review prompting with i18n keys across all 4 locales. Design tokens and star rating UI should be verified against SOLEN_DESIGN.md. |
| 6 | 391d8b | 2026-04-02 10:32 | feat: implement micro-animations & accessibility improvements (Phase 3.2) | 52 | +5206/-1080 | add | NO | PARTIAL | YES | Massive multi-phase commit: introduces framer-motion animations, ARIA live regions, new salon sub-components (SalonHero, SalonReviews, BookingSidebar, SalonOpeningHours, SalonSidebar, SalonServices, MobileBookingBar, SalonMobileCTA), and PhotoLightbox. Also adds globals.css rules for testimonial scroll, focus-visible ring (uses `#222222` hardcoded — not a design token). References "Zone 1/2/3/4" language which is listed as retired in CLAUDE.md. Adds 4 roadmap task files. app/[locale]/salon/[slug]/page.tsx significantly rewritten (1340→~260 lines effective). |
| 7 | a5b8e5 | 2026-04-02 10:34 | i18n: replace hardcoded German strings in ReviewBreakdown, HomePage, Breadcrumb | 1 | +3/-2 | bug-fix | NO | YES | NO | Small Breadcrumb.tsx fix replacing hardcoded German label with translation key. Commit message overstates scope (mentions ReviewBreakdown and HomePage but only Breadcrumb.tsx changed). |
| 8 | 1d5fbd | 2026-04-02 10:37 | seo: wire hreflang alternates on pages (search, confirmation, profile/bookings, city pages) | 7 | +146/-11 | add | NO | YES | YES | Adds hreflang alternate links to multiple pages for i18n SEO. Also creates _tasks/TODO-type-fixes.md (119 lines) cataloguing outstanding TypeScript issues. Multiple page files touched. |
| 9 | a2f059 | 2026-04-02 10:37 | seo: add city×category pages to sitemap for local SEO | 1 | +26/-0 | add | NO | YES | NO | Expands app/sitemap.ts to include city×category URL combinations. Self-contained, no design impact. |
| 10 | fdb19f | 2026-04-02 10:39 | fix: remove ignoreBuildErrors and fix critical TypeScript errors (Phase 1) | 3 | +16/-10 | bug-fix | NO | YES | NO | Removes `ignoreBuildErrors: true` from next.config.mjs and fixes 15 TypeScript errors across confirmation page, booking page, API routes (Stripe API version bump 2024-11-20 → 2026-02-25.clover). Remaining 20 i18n namespace errors documented in TODO-type-fixes.md. |

---

## Summary

**Date range:** 2026-04-02 00:01 to 10:39 (single day, two work sessions)

**Defining theme:** Feature build-out for the consumer booking flow — "My Bookings" page, post-booking review prompting, micro-animations with accessibility pass, and SEO infrastructure (hreflang + sitemap expansion). The day ends with a TypeScript cleanup pass re-enabling strict build checks.

### Components Introduced
- `components/booking/BookingCard.tsx` — booking list card
- `components/booking/BookingsList.tsx` — bookings list container
- `components/booking/ReviewPrompt.tsx` — post-booking review CTA
- `components/salon/BookingSidebar.tsx` — desktop booking sidebar
- `components/salon/MobileBookingBar.tsx` — mobile booking bar
- `components/salon/SalonHero.tsx` — salon page hero section
- `components/salon/SalonMobileCTA.tsx` — mobile CTA overlay
- `components/salon/SalonOpeningHours.tsx` — hours display
- `components/salon/SalonReviews.tsx` — reviews section
- `components/salon/SalonSectionNav.tsx` — section navigation
- `components/salon/SalonServices.tsx` — services listing
- `components/salon/SalonSidebar.tsx` — sidebar wrapper
- `components/ui/PhotoLightbox.tsx` — full-screen photo viewer
- `app/[locale]/profile/bookings/page.tsx` — My Bookings page
- `app/api/bookings/user/route.ts` — user bookings API route

### Components Rewritten
- `app/[locale]/salon/[slug]/page.tsx` — substantially reduced/restructured (1340 lines → ~260 net effective), salon sub-components extracted

### Design Tokens Added/Modified
- `app/globals.css`: testimonial scroll keyframe animation, `*:focus-visible` ring using hardcoded `#222222` (not a design token — should use `var(--ink)` or equivalent)

### Design Tokens Removed
- None explicitly removed

### Patterns Adopted
- framer-motion `AnimatePresence` + `motion.div` for dropdown animations
- `layoutId` sliding tab indicator pattern
- `useInView` scroll-triggered bar animations
- ARIA live regions (`aria-live="polite"`) for dynamic content announcements
- `role="radiogroup"` / `role="radio"` for star rating accessibility

### Patterns Flagged / Concerns
- Commit 6 (391d8bf) references "Zone 1+2" and "Zone 3+4" animation zones — this language is listed as **retired** in CLAUDE.md (V5 zones). The zone concept appears to still be driving decisions in EmptyState.tsx.
- Hardcoded `#222222` in globals.css focus-visible rule — not a design token from SOLEN_DESIGN.md palette.
- Commit message for commit 7 (a5b8e5) overstates scope; only Breadcrumb.tsx was actually changed despite mentioning ReviewBreakdown and HomePage.
- Status badge colors in BookingCard.tsx likely hardcoded inline (not verified against design token palette).

---

## Commits Flagged for Drill-Down

| sha | reason |
|-----|--------|
| 391d8b | Massive 52-file commit (+5206/-1080); introduces retired Zone 1/2/3/4 language; touches globals.css with hardcoded hex; significantly rewrites salon page; multiple new salon sub-components need design token audit |
| 609aef | New BookingCard.tsx (236 lines) — status badge colors, spacing, typography need design token verification |
| 01b5c2 | ReviewPrompt.tsx (159 lines) — star rating UI needs verification against SOLEN_DESIGN.md |
| 1d5fbd | Multi-page SEO change + creates TODO-type-fixes.md; hreflang wiring needs correctness check |

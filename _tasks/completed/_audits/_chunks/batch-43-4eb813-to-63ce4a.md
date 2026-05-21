# Batch 43 — Commit Audit
**Range:** 4eb813 → 63ce4a  
**Date range:** 2026-04-01 17:23 → 23:10  
**Branch:** claude/vigorous-spence-0e9aa7

| # | sha | date | message | files | +/- | kind | lost? | alive? | drill? | notes |
|---|-----|------|---------|-------|-----|------|-------|--------|--------|-------|
| 1 | 4eb813 | 2026-04-01 17:23 | feat: roadmap 08 — image upload system | 18 | +697/-122 | add | NO | YES | YES | Introduces `ImageUpload` component (394 lines) with drag-drop, canvas resize, per-file progress. Uses `next/image` across 11 pages. GalleryManager wired; no design-token violations (lucide icons, no color tokens visible). Also replaces raw `<img>` tags with `next/image` — clean improvement. |
| 2 | 5da4d3 | 2026-04-01 22:28 | phase 1.1: trust stats banner with animated counters | 67 | +10426/-173 | add | NO | YES | YES | Creates `TrustStatsBanner` (139 lines) with IntersectionObserver counter animation. Commit is very large (67 files) due to roadmap docs, tmp files (`tmp2.tsx`, `tmp3.tsx`, `tmp_out.tsx`, `tmp_header.tsx`, `tmp_log.txt`), and many `_roadmaps/*.md` files committed alongside. Banner itself uses standard Solen tokens. tmp files are junk-commit pollution but not design risks. |
| 3 | 9260aa | 2026-04-01 22:35 | phase 2.1-2.2: browse by city section with gradient cards | 10 | +838/-8 | add | NO | YES | YES | Creates `BrowseByCitySection` with hardcoded `salonCount` (42/38/28). Uses `from-s-coral to-s-amber`, `from-s-blue to-indigo-600`, `from-s-sage to-teal-600` gradients — the `indigo-600` and `teal-600` are non-system Tailwind classes; `s-blue`/`s-sage` tokens are in use. Design: decorative gradient cards on city sections contradict Q16 lock (kill decorative gradients) — flagged. |
| 4 | 12148f | 2026-04-01 22:39 | phase 3.1: seo landing pages for city×category | 1 | +162/-94 | add | NO | YES | YES | Rewrites `app/[locale]/[city]/[category]/page.tsx` from 94 to 256 lines. Generates 72 static SEO pages. Uses `force-dynamic` to avoid build-time Supabase calls. No design-token audit needed (server rendering). Functional SEO infrastructure. |
| 5 | c4d4b5 | 2026-04-01 22:40 | feat: roadmap 10 phase 2 — gift vouchers and promo code enhancements | 4 | +174/-65 | add | NO | YES | YES | Adds `TestimonialCarousel` (88 lines), touches not-found page and voucher API validation. Commit message scope (vouchers + promo) is misleading vs actual diff (carousel + 404 tweak + voucher validate). `TestimonialCarousel` uses hardcoded testimonials, no real data. CSS animation for infinite scroll — design-safe but static content. |
| 6 | 972f89 | 2026-04-01 22:42 | phases 4-7: 404 page, testimonial carousel, toast verified, pwa confirmed | 2 | +109/-0 | add | NO | YES | YES | Adds checkout page (107 lines) and two lines to not-found page. Commit message (404, carousel, toast, PWA) does not match diff — actual changes are checkout page and a 2-line not-found edit. High discrepancy between stated scope and actual diff content. |
| 7 | d71c8e | 2026-04-01 22:48 | feat(homepage): wire testimonial carousel + i18n keys | 8 | +506/-8 | add | NO | YES | YES | Wires `TestimonialCarousel` into `HomePage`. Also adds `/profile/vouchers` page (275 lines) and `/api/profile/vouchers` route — substantial unreferenced additions bundled with a "wire carousel + i18n" message. i18n keys for 404 and testimonials added to all 4 locales. |
| 8 | 357269 | 2026-04-01 22:53 | Phase 3.2: add sorting toggle to last-minute deals page | 1 | +61/-12 | add | NO | YES | NO | Adds sort-by selector (discount %, price, time) to `angebote/page.tsx`. Focused single-file change; no design-token concerns. Sort logic purely client-side. |
| 9 | 7d95ca | 2026-04-01 22:57 | Phase 3.3: salon last-minute deals dashboard settings | 9 | +576/-4 | add | NO | YES | YES | Creates `LastMinuteManager` (362 lines) — global toggle, per-service discount overrides, preview calculator. New Supabase table `salon_last_minute_settings` with RLS. API route created. Large new component merits drill. Functional and complete. |
| 10 | 63ce4a | 2026-04-01 23:10 | phase 1.1: add service selection step component | 7 | +2770/-4 | add | NO | YES | YES | Adds `ServiceSelectionStep` (184 lines) and a massive `docs/` file (2543 lines booking flow spec). Component uses `useBooking` context, `formatCurrency`, lucide icons (Plus, X) — design-compliant. The 2543-line docs dump is the bulk of the diff and a junk addition pattern seen repeatedly this batch. |

---

## Summary

**Date range:** 2026-04-01 17:23 → 23:10 (same day, ~6 hours of work)

**Defining theme:** Rapid homepage enrichment + roadmap feature push. A single day's session added the image upload system, three new homepage sections (trust stats, city browse, testimonials), SEO landing pages, gift voucher infrastructure, last-minute deals sorting and dashboard settings, and a booking service-selection step component.

---

### Components introduced
- `components/ui/ImageUpload.tsx` — drag-drop + canvas resize upload, 394 lines
- `components/TrustStatsBanner.tsx` — animated counters, IntersectionObserver, 139 lines
- `components/BrowseByCitySection.tsx` — city gradient cards with sub-links, 107 lines
- `components/TestimonialCarousel.tsx` — hardcoded auto-scrolling testimonials, 88 lines
- `components/dashboard/LastMinuteManager.tsx` — per-service discount dashboard, 362 lines
- `components/booking/ServiceSelectionStep.tsx` — service picker for booking flow, 184 lines

### Components rewritten
- `components/dashboard/GalleryManager.tsx` — refactored to use ImageUpload, auth headers fixed

### Pages introduced
- `app/[locale]/vouchers/page.tsx` — 3-step gift voucher purchase flow
- `app/[locale]/profile/vouchers/page.tsx` — voucher history
- `app/[locale]/checkout/page.tsx` — checkout UI (partially built this batch)

### API routes introduced
- `app/api/vouchers/route.ts`, `app/api/vouchers/confirm/route.ts`, `app/api/vouchers/validate/route.ts`
- `app/api/salon/last-minute-settings/route.ts`
- `app/api/profile/vouchers/route.ts`

### Database migrations introduced
- `supabase/migrations/20260401_gift_vouchers.sql` — vouchers table + RLS
- `supabase/migrations/20260402_last_minute_settings.sql` — last_minute settings + RLS

---

### Design tokens added
- None new; existing `s-coral`, `s-amber`, `s-blue`, `s-sage` tokens referenced

### Design tokens removed
- None

### Patterns adopted
- IntersectionObserver for animation triggers (TrustStatsBanner)
- Canvas-based client-side image resize before upload

### Patterns of concern
- **Decorative gradient cards** in `BrowseByCitySection` (`from-s-coral to-s-amber` etc.) — conflicts with Q16 lock (kill decorative gradients). These are `bg-gradient-to-br` purely decorative backgrounds.
- **Non-system Tailwind classes** alongside system tokens: `indigo-600`, `teal-600` used in city cards as gradient targets.
- **Hardcoded static data**: city salon counts (42/38/28) and testimonials hardcoded — not fetched from DB.
- **Junk files committed**: `tmp2.tsx`, `tmp3.tsx`, `tmp_out.tsx`, `tmp_header.tsx`, `tmp_log.txt` (commit 5da4d3) — scratch files from development included in history.
- **Commit message mismatch**: commits 5 (c4d4b5) and 6 (972f89) describe much broader scope than their actual diffs. Commit 7 (d71c8e) bundles voucher profile page into a "wire carousel" commit.

---

### Commits flagged for drill-down
| sha | reason |
|-----|--------|
| 4eb813 | `ImageUpload` 394 lines, new upload architecture, GalleryManager rewrite |
| 5da4d3 | 67-file commit with tmp junk, many roadmap docs; TrustStatsBanner itself is small |
| 9260aa | `BrowseByCitySection` gradient cards conflict with Q16 lock |
| 12148f | SEO page rewrite 162+94 lines, city×category routing architecture |
| c4d4b5 | `TestimonialCarousel` introduced; commit scope mismatch |
| 972f89 | Checkout page 107 lines added silently under misleading commit message |
| d71c8e | Profile vouchers page (275 lines) bundled into carousel wiring commit |
| 7d95ca | `LastMinuteManager` 362 lines, new DB table, new API route |
| 63ce4a | `ServiceSelectionStep` + 2543-line docs dump |

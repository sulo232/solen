# Reviews & Ratings — UI Audit Report (2026-03-21)

## Summary

Full audit of the Reviews & Ratings system: 2 components, 6 API routes, 2 dashboard pages, 1 cron job, 1 automod lib.

### Fixed (this session)

| # | Severity | Issue | Fix |
|---|---|---|---|
| B1 | 🔴 | `/api/reviews/salon/[salon_id]` route MISSING — dashboard 404'd | Created route with pagination, sorting, rate limiting |
| B2 | 🔴 | `/api/reviews/[id]/respond` route MISSING — salon respond 404'd | Created route with ownership check + dual-write to `review_replies` table |
| B4 | 🔴 | `review_photos` not in salon slug query — photos never loaded | Added `review_photos(id, photo_url, sort_order)` to select |
| A3 | 🟡 | ReviewCarousel had no loading skeleton — content popped in | Added 3-card shimmer skeleton while loading |
| A6 | 🟡 | Dashboard review response was single-line `<input>` | Changed to `<textarea>` with char counter (500 max) |
| A7 | 🟡 | Salon page used `(rev as any)` for review_replies (3 places) | Added `ReviewReply` interface, typed properly |
| C4 | 🟢 | Carousel fetched 6 reviews but only rendered 3 | Now renders all fetched reviews |
| E1 | 🔴 | Two separate reply systems (`review_replies` table vs `salon_response` column) | Respond route now writes to both — salon page and dashboard stay in sync |

### Remaining (lower priority / future work)

| # | Severity | Issue | Status |
|---|---|---|---|
| A1/A2 | 🟢 | Hardcoded German labels in ReviewBreakdown + ReviewCarousel | Future: add i18n |
| B3 | 🟡 | No review photo upload API route exists | Future: customers can't attach photos yet |
| B6 | 🟡 | Cron review-prompt hardcodes `/de/` locale | Future: use user locale preference |
| B7 | 🟢 | Cron sends prompts to banned users | Future: filter banned users |
| D1-D3 | 🟡 | CLAUDE.md §6 missing `salon_response`, `admin_response`, moderation columns | Doc update needed |
| E2 | 🟢 | `Stars` component duplicated in 3 files | Future: extract to `components/ui/Stars.tsx` |

## Files Changed

- `[NEW]` `app/api/reviews/salon/[salon_id]/route.ts` — salon-specific reviews with pagination
- `[NEW]` `app/api/reviews/[id]/respond/route.ts` — salon owner respond to review
- `[MODIFY]` `app/api/salons/[slug]/route.ts` — added review_photos to query
- `[MODIFY]` `components/ReviewCarousel.tsx` — loading skeleton, removed unused import, render all reviews
- `[MODIFY]` `app/[locale]/dashboard/reviews/page.tsx` — textarea + char counter
- `[MODIFY]` `app/[locale]/salon/[slug]/page.tsx` — typed ReviewReply, removed `as any` casts

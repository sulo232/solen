# Roadmap: Broken Features Hotfixes (8A, 8B, 8C)

## 8A — Review System
**Context**: Users cannot submit new reviews due to RLS policy issues. The average rating ("★ 4.9 Ø") displays even for salons with 1 review, looking suspicious.
**Requirements**:
1. Check/Add `INSERT` RLS policy to `public.reviews` for authenticated users. Users can only insert reviews for salons they've booked (validated by joining with reservations).
2. Minimum review threshold of 5 before displaying the `average_rating`. If under 5, show "Neu" or hide the average on `SalonCard` and `ReviewBreakdown`.

## 8B — Map
**Context**: Mapbox component fails to load or crashes if the API token is missing or network fails.
**Requirements**:
1. Detect absent or invalid `NEXT_PUBLIC_MAPBOX_TOKEN`.
2. Fallback UI: Display Address + "Open in Google Maps" `a` link using `href="https://www.google.com/maps/search/?api=1&query={encoded_address}"`.

## 8C — Language Toggle
**Context**: The toggle updates the cookie and url, but server content isn't translating actively without a hard reload.
**Requirements**:
1. In `components/ui/LanguageSwitcher.tsx`, call `router.refresh()` alongside `router.push()` to ensure server components re-fetch locale.

## CLAUDE.md Updates
1. **Security Rules**: MANDATORY RLS INSERTS.
2. **Code Safety Rules**: THIRD-PARTY FALLBACKS.
3. **Next.js Routing**: ROUTER REFRESH when changing locale/theme cookies.

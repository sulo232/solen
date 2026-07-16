# MAKE IT REAL , homepage rows lose every fabricated value (owner 2026-07-16: "ye make it all real")

Owner verbatim: "ye make it all real" , replying to the parked list (ForYou city=Basel hardcode, Nearby fake distances) after the card-data wiring landed (a506224fd). Scope = the homepage card rows: every rendered value is DB-real or the element goes away.

DB ground truth (live queries 2026-07-16): all 17 row salon ids are real + active, ALL have cover_photo_url, all have ratings/reviews/addresses/min prices; hardcoded forYouSalons addresses/prices are WRONG vs DB (Muse: hardcoded Augustinergasse 22 / 80 CHF, DB Ruemelinsplatz 4 / 35 CHF); 0 active salons have a real last-minute discount; 19 active salons have >= 8 reviews.

## Boxes

- [x] salonCardData.ts extended: name, slug, category (safeCategory bridge over salons.categories), photoUrl (cover_photo_url) in SalonCardData; getTopSalonIds(limit) (is_active, review_count >= 8, order avg rating desc); getNearbyTeaserCount() (active salons with coordinates) , verified: 82c288691; salonCardData.ts:73 select + safeCategory bridge via salon/_shared.ts:181 (SalonOfMonth deduped), getTopSalonIds error->[] , getNearbyTeaserCount error->null
- [x] forYouSalons.ts de-fabricated: FORYOU_SALONS entries keep identity only (id/slug/name/category); fabricated rating/priceFromCHF/address/photoUrl fields DELETED; dead FORYOU_DEALS + DealSalon (fabricated discounts, zero consumers) DELETED , verified: 82c288691; identity-only entries, PHOTO/DealSalon/FORYOU_DEALS deleted, grep FORYOU_DEALS = 0 hits
- [x] ForYouSalonRows.tsx fully live: photo/price/address/postal/city/rating/reviewCount from salonData; sort by real rating; city=Basel hardcode gone; dead wantsDeals plumbing gone , verified: 82c288691; all fields from salonData, city=Basel gone, null-safe sort (missing rating last), wantsDeals plumbing removed
- [x] Nearby.tsx fully live: DEMO array deleted, rows built from NEARBY_SALON_IDS + salonData; distance/nextSlot/freeToday/isSaved fabrications + formatNextSlot/resolveAvailability dead helpers deleted; map teaser count "14 Salons" replaced by the real count (prop from page.tsx) or count omitted when unknown , verified: 82c288691; DEMO deleted, rows = NEARBY_SALON_IDS + salonData, teaser renders real count (SSR: '20 Salons in der Naehe') or no number
- [x] RecentlyViewed.tsx honest fallback: DEMO_SALONS + availabilityRow/pickOneSlot deleted; "Top auf Solen" fallback = getTopSalonIds(4) passed from page.tsx, all fields from salonData; real localStorage history path unchanged; empty topIds + no history = section hides , verified: 82c288691; DEMO_SALONS/availabilityRow/pickOneSlot deleted, fallback = getTopSalonIds(4) via props, history path unchanged, empty = null
- [x] recentlyViewedIds.ts deleted (obsolete once the fallback is computed) , verified: df234a21d (D status), zero references remain
- [x] page.tsx: one batch fetch over the union (FORYOU ids + NEARBY ids + top ids), passes salonData + topSalonIds + nearbyCount , verified: 82c288691; page.tsx:179-183 union fetch, topSalonIds:203 + nearbyCount:204 threaded, stays a Server Component
- [x] tsc --noEmit 0; SSR proof: no "Augustinergasse 22" / "14 Salons" / hardcoded 4.9x anywhere in rendered /de; sample values match DB (first/last/weirdest) , verified: verified: tsc 0 at df234a21d; SSR /de shows real postals 4001-4059 Basel, '20 Salons in der Naehe', no fake times/addresses; reviewer cross-checked Old Town Barbers rating 4.25/reviews 12 + per-salon cover_photo_url byte-identical to live Supabase rows
- [x] loop-reviewer PASS (round cap 3) , verified: verified: PASS 9/9 round 1, punch empty (agent a7760c037ad9db6db)

## Parked / out of scope
- Logged-in saved-state prefetch for hearts on homepage rows (pre-existing app-wide limitation; initial false is a default, not a fabrication)
- Real geolocation distance for Nearby (Phase-2 feature per component docs; no distance renders meanwhile)
- Concurrent session's confirmation-page edits in this checkout: untouched

## Extra box (found mid-task)
- [x] searchCategories.ts fabricated counts (42/18/31/14 Salons vs 20 active total) removed, omit-and-flag arm , verified: df234a21d, sub-line dropped in SearchOverlay + dev/search-morph, real per-category counts parked (needs server thread)

## Round 2 boxes (owner: "isnt ths maiking up fake sh a reccuring pattern" , 12-agent sweep 2026-07-16, 5 confirmed live fabrications)

- [x] salon/[slug]/layout.tsx:48 , const city = "Basel" in generateMetadata: every salon title/description claims Basel; fix = postalToCity(salon.postal_code), the helper already used on the same PDP , verified: 1fe729173; postalToCity wired, omit-arm on null postal, live curl: title 'Old Town Barbers - Barbershop in Basel | Solen' from postal 4051
- [x] searchFeatured.ts FEATURED_SALONS , 3 hardcoded street addresses render in SearchOverlay's idle "Beliebte Store" rows (DB cross-check: Muse is Ruemelinsplatz 4, code says Spalenberg 12 = WRONG); fix = wire live or drop the address sub-line; also delete the dead average_rating/badge fields on the same array , verified: 1fe729173; identity-only + live /api/salons?ids= fetch (reviewer verified the route .in() discriminates and returned Ruemelinsplatz 4 etc.), sub-line omitted while loading
- [x] welcome-series emails , "hunderte Salons" (day 0) + "ueber 200 Salons" (day 3) in 4 locales vs 20 real salons, sent by a live scheduled cron; fix = numberless reword (or real count passed from the cron route) , verified: 1fe729173; numberless reword all 4 locales, subjects + cron untouched, grep zero scale claims
- [x] RoomManager.tsx:286 , utilization = 0 placeholder renders a fake 0% bar to every spa owner; fix = omit the bar + flag for real booking-density wiring , verified: 1fe729173; fake 0% bar removed, comment flags real booking-density wiring
- [x] searchTrending.ts TRENDING ("127 Buchungen heute", "42%...") , dev-only today (only dev/search-morph imports it) but a landmine; flagged, delete or mark , verified: 1fe729173; fabricated meta field deleted, port-back warning added, dev page compiles
- [x] fabricated-value-gate.py live (commit 522c71ee1, selftest 15/15) so the class is blocked at edit time going forward , verified: commit 522c71ee1, wired in 3 PreToolUse matcher groups

- Reviewer round 2 (sweep fixes): PASS 8/8 (agent a47f923da0d471b85, live curls). Pre-existing out-of-scope: .next/types ANON_CACHE_HEADERS tsc error (chip task_09435e75); useRecentlyViewed.ts dev-only DEMO (NODE_ENV-gated, stale address, acceptable); RoomManager middot separator (taste rule 2, pre-existing).

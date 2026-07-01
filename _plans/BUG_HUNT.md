# BUG_HUNT , customer + onboarding + admin (dashboard EXCLUDED)

> Status: **PAUSED** (2026-06-29, for the Homepage design pass + the hook/meta work). Resume here.
> RECONSTRUCTED 2026-06-29 from the last SessionStart snapshot , the disk original was overwritten and was never committed, so it was lost from git. Re-verify the OPEN items still reproduce before fixing; the FIXED items are real (commits below).
>
> Dynamic /loop: exercise live (dev-login `GET /api/dev/login?to=<path>` + curl/load on localhost:3000), fix backend/logic/functional straight through (council auto-reviews each), mockup+PARK frontend VISUAL. Stop after 2 consecutive full passes find 0 new bugs. Hunt+fix+commit on MAIN (/Users/sulo/Documents/solen).

## Surfaces (order) , dashboard EXCLUDED
1. customer frontend  2. customer APIs/backend  3. salon onboarding  4. admin

## Pass tracking
- Pass 1: [~] customer FE (home/inspo/angebote/Reviews/PDP/booking hunted; account/favorites/walk-in PENDING) · [~] customer APIs (/api/salons, reviews/featured, discovery/feed, salons/[slug], bookings, availability hunted; search/promo/favorites/walk-in PENDING) · [ ] onboarding · [ ] admin
- Pass 2: [ ] all. Stop when a full pass adds 0 new bugs twice running.

## FIXED (committed)
- [x] iter2 `c4215276e`: /api/salons unknown-city -> {items,total,page,limit}; angebote category chip; homepage locale-aware links (Entdecken/MobileCategoriesRow/Nearby/Reviews); Reviews dateText.
- [x] iter3 `8cf715a75`: Reviews homepage shows REAL reviews via /api/reviews/featured (admin client, real names, created_at, ?limit, customer-visible filter, slugify, locale dates).

## BUGS , to FIX (queued)
- [ ] HIGH **i18n-leak BATCH** (German on /en /fr /it): angebote hero/sort/price/reset/load-more; Nearby 'Nur X heute'; Reviews title/'Alle Bewertungen'/aria/'Anonym'; + add `locale` to the Reviews fetch deps.
- [ ] HIGH **dedup /api/reviews/featured vs /api/reviews/homepage**: /homepage is BROKEN (phantom `reviewer_name` col) + its only caller is the dead `components-legacy/TestimonialCarousel.tsx`. Consolidate to /featured, delete /homepage + archive carousel + REMOVED.md; move the salon-visibility gate to a DB predicate; name the 20/6/1/120 magic numbers.
- [ ] HIGH **angebote FilterBar dead** (page writes URL params /api/slots/last-minute never reads). Unverifiable until discount data exists.
- [ ] MED /api/salons sort=price pagination (DB created_at vs JS page re-sort; cheapest hidden >20). route.ts:326,482.
- [ ] MED /api/salons RPC `search_salons_ranked` failure -> empty vs graceful fallback. :79-81.
- [ ] MED /api/salons date pre-filter makes post-query availableIds dead. :295-305 vs 354-367.
- [ ] LOW timeToMinutes dup vs lib/salon-hours (:704); nextSlots no .limit (:370); hardcoded Basel coords (:570); angebote client-filter breaks Load-More count.

## OWNER-RESOLVED (to implement)
- [ ] inspo sort -> consolidate "Neu"+"Beliebt" into ONE "Trending" chip (drop the two dead ones); wire a trending signal in the feed RPC, or reuse an existing one, else client-sort by a proxy.
- [ ] angebote Sparkles icon (banned) -> swap for the Nails category icon (or a non-banned Lucide).

## PARKED , frontend VISUAL (owner mockup; do NOT auto-restyle)
- angebote BANNED Sparkles icon; window.prompt() notify-me; inspo empty-state hides reset on category-0; home Nearby/RecentlyViewed FABRICATED "Heute 15:30" demo times (no-fab violation); Reviews hand-rolled stars vs <RatingStars>; angebote hand-rolled skeleton vs <Skeleton>.

## PDP + BOOKING findings (iter4 hunt)
FIX-clear:
- [ ] HIGH PDP /reviews sub-page empty (anon client + profiles RLS) -> admin client. `salon/[slug]/reviews/page.tsx:70-80`.
- [ ] HIGH PDP per-staff ratings never show (API returns average_rating/review_count but type/component expect staff_average_rating/staff_review_count) -> remap in /api/salons/[slug]. `_shared.ts:29`, `SalonTeam.tsx:168`.
- [ ] HIGH booking online-pay hidden (booking salon query omits `accepts_online_payment`) -> add to select. `salon/[slug]/booking/page.tsx:41-50`, `PayConfirmStep.tsx:133`.
- [ ] MED booking "change stylist" pill -> goToStep('staff') not 'services-staff' on multi-staff. `DateTimeStep.tsx:156`.
FIX-careful (legal / booking-state):
- [ ] HIGH booking VAT 8.1% hardcoded for ALL salons incl non-`vat_registered` -> select vat_registered + gate the line `PayConfirmStep.tsx:396`; + write `vat_rate` to bookings INSERT `/api/bookings/route.ts:320-344`.
- [ ] MED booking multi-service locks only the PRIMARY service slot -> extras double-bookable. `/api/bookings/route.ts:139-158`.
- [ ] MED booking pending booking not cancelled on PI-failure/Back -> 409 blocks rebooking same slot. `PayConfirmStep.tsx:262,602`.

## STATUS RECONCILE 2026-07-01 (avoid re-doing done work)
Discovered via git that the **FIX-clear + FIX-careful batches are ALREADY DONE** , do NOT redo:
- `a884f01c6` PDP+booking FIX-clear batch: reviews-subpage admin client, per-staff rating aliases (`/api/salons/[slug]` lines 96-98 `staff_average_rating`/`staff_review_count`), `accepts_online_payment` in booking page select, change-stylist pill (`HairStep.tsx:207` -> `goToStep("services-staff")`). Verified present.
- `12bf4d33d` council fix: review_replies is_public privacy leak (SalonReviews gates at render). 
- VAT: `api/bookings/route.ts:413` gates VAT on `salonVat?.vat_registered` + writes vat_rate. DONE.
- Multi-service slot locking + PI-failure/back cancel: part of a884f01c6 batch (booking).
REGRESSION REPAIRED this session: `bfa385699` (a perf commit) reverted the reviews sub-page from the admin client back to the anon client -> page went empty/"Anonym" again. Re-fixed in `c63008dd2` (admin client) + `e188106e3` (stop forwarding reviewer user_id/booking_id to the client , low-sev privacy). Verified live: /de/salon/cuts-and-culture/reviews shows 16 real reviews (Luca M etc.).
GENUINELY-UNDONE (next hunt): account/favorites/walk-in customer pages + remaining customer APIs (search/promo/favorites/walk-in), then onboarding, then admin. NOT yet hunted.
NOTE: subagents run in the WORKTREE (elated-raman-2dda12) which lacks MAIN's latest commits , a council-security agent reviewed a STALE copy of the reviews page. Verify council findings against MAIN before acting.

## FAVORITES SURFACE HUNT 2026-07-01
- FIXED (7fccf8c25): favorites rendered in arbitrary order , `.in("id", ids)` doesn't preserve order, losing the created_at-desc recency. Re-sorted to the favorites order.
- PARKED (visual, mockup-first): FavoritesList uses the LEGACY `components-legacy/SalonCard` which renders a "★ TOP" priority badge via `SalonBadge` + imports the BANNED `Zap` icon , violates `project_card_badges` (no Top/Neu/Beliebt/#1 badges) + `feedback_no_zap_icon`. Rest of the app uses the clean `SalonResultCard`. Fix = swap FavoritesList to SalonResultCard (or strip the badge), but it's a customer-visible card change -> mockup-first + owner approval. `FavoritesList.tsx:103`, `components-legacy/SalonCard.tsx:11,164-172`.
- Favorites data path otherwise clean: session-scoped, is_active gate. (Minor: no is_test/listed_on_marketplace gate, but favorites are the user's own explicit picks.)
NEXT: profile/bookings + walk-in (queue/[token], walk-in-join/pay) + remaining customer APIs (search/promo), then onboarding, then admin.

## BOOKINGS SURFACE HUNT 2026-07-01 , HIGH-VALUE FIX (1ed22c6f8)
CONFIRMED bug via DB (execute_sql): 11 confirmed-past + 84 no_show bookings were INVISIBLE to customers , the "Vergangen" tab filtered status='completed' only, and past confirmed bookings only auto-complete for salons with auto_complete_enabled=true. So a booking a customer actually had vanished from BOTH tabs (fails upcoming's starts_at>=now AND past's completed).
FIXED: past tab = status in (completed, confirmed, no_show) + starts_at<now; BookingCard gained a no_show status config + defensive fallback (was `statusConfig[status]` unguarded , would crash on no_show) + gated reschedule/cancel to confirmed AND upcoming (past-confirmed shows rebook-only); no_show i18n added de/en/fr/it (competent, flag owner copy). Verified live: Old Town Barbers 11-Jun confirmed-past now visible in Vergangen, rebook-only, no crash.
NEXT: walk-in flow (queue/[token], walk-in-join/pay/verify) + remaining customer APIs (search/promo/favorites-toggle), then onboarding, then admin.

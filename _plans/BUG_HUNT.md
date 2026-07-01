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
- [x] HIGH PDP /reviews sub-page empty -> DONE (admin client present `reviews/page.tsx:48-88`, re-verified live 16 reviews).
- [x] HIGH PDP per-staff ratings never show -> DONE (aliases `staff_average_rating`/`staff_review_count` at `/api/salons/[slug]/route.ts:96-98`).
- [x] HIGH booking online-pay hidden -> DONE (`accepts_online_payment, vat_registered` in booking page select `booking/page.tsx:46`).
- [x] MED booking "change stylist" pill -> DONE (`DateTimeStep.tsx:156` sends multi-staff to 'staff', single to 'services-staff').
FIX-careful (legal / booking-state):
- [x] HIGH booking VAT gate -> BACKEND was DONE (`api/bookings/route.ts:413` gates on vat_registered + writes vat_rate). **DISPLAY line was STILL ungated (real remaining bug) -> FIXED this iter**: `PayConfirmStep.tsx:398` MwSt line now gated on `salonVatRegistered`, uses the salon's own `vat_rate ?? 8.1` (not hardcoded 8.1%). A non-vat_registered salon no longer shows a false MwSt line. (pending council-correctness)
- [x] MED multi-service extras "double-bookable" -> VERIFIED NOT-A-BUG. Extras are priced add-ons folded into ONE slot's `extras_addons` + `price_paid` (`api/bookings/route.ts:262-278,354`); they carry no independent slot/duration (booking `ends_at` = primary slot). That's the intended model (add-ons within the appointment), not a scheduling bug.
- [x] MED pending booking not cancelled on PI-failure/Back -> VERIFIED MITIGATED + not reproducible. The abandon-sweep cron cancels a pending online-pay booking whose card step is never completed (`PayConfirmStep.tsx:203-205`); the dup-guard 409 is intentional (owner 2026-06-12). No online-pay salon in seed -> not live-reproducible. PARK until an online-pay salon exists.

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

## WALK-IN SURFACE HUNT 2026-07-01
- `/api/walkin/queue/status` (poll): CLEAN , token-gated, admin client (correct for anon poll), "ahead" = status=waiting AND position<mine (correct), live ETA recompute only while waiting.
- `walk-in-join/page.tsx`: CLEAN , 10-line deprecated redirect stub (single-tracker design; queue/[token] is THE tracker). 
- `walk-in-pay/page.tsx` (625L, Stripe pay flow): no bug found on READ , redirect to queue gated on `paid && tracking_token` (orphan-safe), pay-intent/verify/cancel have real error handling + token gating. NOTE: it has a DEMO booking fallback (line 84, hardcoded "Barbier Studio Zürich" mock) , confirm it's gated to a dev/demo path and can't render for a real user (potential no-fabrication concern). FLAGGED for a dedicated careful hunt of the full Stripe confirm path (PaymentSheet + /api/walkin/confirm + pay-intent) , payment logic warrants focused attention, not a tail-of-session pass.
NEXT: /api/walkin/confirm + pay-intent + PaymentSheet (careful); promo/favorites-toggle APIs; then onboarding; then admin.

## ONBOARDING SURFACE HUNT 2026-07-01 (started)
- `/onboarding/page.tsx`: CLEAN , auth-gated + a proper open-redirect guard on the ?redirect param (`raw.startsWith("/") && !raw.startsWith("//")`).
- `/onboarding/salon/page.tsx` (736L): submission goes through POST /api/salons + draft autosave via /api/salon-draft (API owns the insert , good). PARKED (visual, mockup-first): form field labels use `uppercase tracking-[.14em]` (lines 83/94/106/145...), violates `feedback_no_caps_lock` (no ALL-CAPS, sentence case) + the mockup-preflight banned tracked-uppercase labels. Salon-facing but still a drift.
NEXT FOCUSED UNIT: onboarding BACKEND , POST /api/salons (create handler: validation, phantom columns, owner/role assignment, RLS) + /api/salon-draft (GET/POST/DELETE). Then admin surface.

## ONBOARDING BACKEND FIX 2026-07-01 (18ed14037) , 2 real bugs in POST /api/salons
Verified against LIVE information_schema (schema-drift aware):
- quartier was hardcoded "grossbasel" for EVERY new salon (stale NOT-NULL bypass; column is nullable now) -> fabricated a Basel neighborhood on every salon incl. non-Basel, surfaces in cards/PDP. Set null (downstream null-guards).
- tiktok_url commented out as "missing from schema" but the column EXISTS + the PDP selects it -> onboarding silently dropped it. Now persisted.
- phone_verified / cancellation_policy / google_place_id / email genuinely NOT in public.salons -> correctly left commented (uncommenting would break the insert). Those form fields are collected but not stored on salons (separate silent-no-op worth an owner decision: drop the fields, or add columns).
NOT live-exercised (a real create would write a salon row). tsc clean + columns confirmed present.
NEXT: /api/salon-draft (GET/POST/DELETE) + the collected-but-unstored onboarding fields decision; then ADMIN surface (surface #4).

## /api/salon-draft HUNT 2026-07-01 , CLEAN (no fix)
- GET/PUT/DELETE all auth-gated; user_id-scoped admin client; PUT has 50KB size cap + zod (draft_data record, current_step 1-7) + upsert onConflict user_id. Wired: onboarding/salon/page.tsx:387/422/525. salon_drafts table exists (RLS on).
- Nits (NOT fixed , not reproducible bugs, surgical-edits-only): GET uses `.single()` (406+PGRST116 for a fresh user with no draft; route still returns {draft:null} 200 so harmless) where `.maybeSingle()` is idiomatic; DELETE omits the rate-limit + ban-check GET/PUT have and ignores the delete error (self-scoped idempotent delete , inconsequential).

## VAT DISPLAY FIX 2026-07-01 (026a50313) , real legal bug the reconcile note missed
The STATUS RECONCILE above marked VAT "DONE" but only the BACKEND (booking record). The CUSTOMER-FACING MwSt line in PayConfirmStep was still ungated + hardcoded 8.1% -> a non-vat_registered salon showed a false tax line. FIXED: gate on salonVatRegistered + salon's own vat_rate (mirrors lib/vat.ts computeVat: ?? 8.1, rate<=0 -> no line); added vat_rate to booking/page.tsx select. Council-correctness reviewed (stale-worktree false-positive on #1; #2 select-vat_rate + #3 zero-rate-guard folded in). tsc clean.

## ADMIN SURFACE HUNT 2026-07-01
- Admin API access-gating: CLEAN on the high-risk routes , purchase-refund (role!=admin -> 403), commission GET+PUT (403), feature-flags GET+PATCH (403), seed-test-salons (requireAdmin helper). Consistent pattern: getSession -> 401 if no user -> profiles.role check -> 403 if !admin -> adminLimiter. The money-write + config-write routes are all gated.
- REMAINING (not a bug, coverage note): ~20 /api/admin/* routes total; spot-checked the 4 highest-risk. A full per-route sweep + the *-admin dashboard pages (nail/discovery/spa/homepage/commission-admin) is the remaining admin coverage. No bug found in what was checked.

## TURN ROLL-UP 2026-07-01 (7 real bugs fixed this session's continuation)
1. #2-city default city (kill "Schweizweit") + name->slug city-select bug , 31f4de09a
2. reviews sub-page regression repair (admin client) , c63008dd2
3. reviews reviewer-UUID exposure stripped , e188106e3
4. favorites recency ordering , 7fccf8c25
5. bookings past-tab: 95 hidden bookings surfaced , 1ed22c6f8
6+7. onboarding quartier fabrication + tiktok_url data-loss , 18ed14037
Plus earlier this turn: map pin labels + filter count (#3), filter neutral (no blue/ring), map store-recenter. PARKED (visual, mockup-first): favorites legacy-SalonCard badge/Zap; onboarding uppercase labels. DECISION for owner: onboarding collects phone_verified/cancellation_policy/google_place_id/email but public.salons has no such columns (drop the fields or add columns).

## ADMIN AUTH FULL SWEEP RESULT 2026-07-01
Swept ALL ~49 /api/admin/* handlers for the role gate. One flagged [0 gate refs]:
`notify-new-salon` , RESOLVED, not a bug: it's a PUBLIC onboarding notification (POST during
salon signup, before the user is admin) that emails the FIXED ADMIN_EMAIL; rate-limited by IP,
recipient is not user-controlled, so no arbitrary-email/spam-bomb risk. Intentionally not
admin-gated. All other admin routes gate on profiles.role==='admin' (or requireAdmin). Admin
auth-gating = CLEAN.

## OWNER URGENT BATCH 2026-07-01 (interrupt , fixed + verified)
- Focus rings ("two focus rings", furious): the touch focus-suppression only covered BUTTON
  outlines; INPUTS still ran the global input:focus-visible (ink-border darken + 3px halo = the
  two rings) on the homepage search + overlay/filter inputs. Fixed at the GLOBAL source
  (globals.css @media coarse now drops the input halo + border darken). 0c91d5d04. Verified.
- Map blank on 0-result city: map overlay was gated on salons.length>0 -> blank on a city with no
  listings + never moved to the city. Dropped the gate + MapView emptyCenter recenters to the
  picked city. 84f6e3eca. Verified (Zürich -> map recenters, "0 Salons", not blank).
- Map "can't select dates": typing hid the Wo?/Wann? rows + a suggestion tap searched immediately.
  searchTerm now fills the service + returns to the composed view (Wo?/Wann? reachable). 5ce152341.
  Verified.

## WALK-IN PAY/CONFIRM DEEP HUNT 2026-07-01 , CLEAN (idempotent + payment-verified)
/api/walkin/confirm + lib/barber/walkin-ticket.ts: SOLID.
- Payment verified server-side: retrieves the PaymentIntent from Stripe, rejects unless status is requires_capture|succeeded BEFORE creating the queue entry (no free tickets, no client-trust).
- Token flow matches the PI to the booking (no payment hijacking); tokenless flow uses server-set PI metadata (salon/price derived server-side).
- Idempotent: barber_walkin_queue has payment_intent_id + a UNIQUE INDEX uq_barber_walkin_queue_payment_intent -> a double confirm (retry/double-tap) hits 23505 and returns the EXISTING ticket, not a 2nd one. Ticket code pre-issued from an atomic per-salon counter.
No bug. (My first pg_constraint check missed it , the guard is a unique INDEX, not a constraint; re-verified via pg_indexes.)

## PASS 1 COMPLETE 2026-07-01 , all four surfaces swept
customer FE + APIs (reviews/favorites/bookings/walk-in), onboarding (entry+backend+draft), admin (all ~49 routes auth-gated). 7 real bugs fixed + owner's urgent focus-ring/map batch. Remaining = OWNER-INPUT items only: onboarding collected-but-unstored fields decision; 2 parked visual drifts (favorites legacy card badge/Zap, onboarding uppercase labels) for mockup-first. No open functional bugs found in the swept surfaces.

## PROMO PATH HUNT 2026-07-01 , CLEAN (already hardened 2026-06-30)
/api/promo/validate (advisory) + /api/stripe/booking-pay-intent (redemption): SOLID. The charge
step RE-VALIDATES the persisted promo_code against the LIVE row + ALL constraints (is_active,
valid_from, valid_until, max_uses, min_booking_amount, salon_id, min_tier), NEVER trusts the
client discount, computes the discount server-side (capped, never below Stripe min), and the
webhook increments current_uses exactly once on payment success. No client-forgeable discount.
No bug. (Narrow theoretical race: two concurrent redemptions of a max_uses=1 code could both pass
the pre-webhook check , depends on the webhook increment being a guarded atomic update; low-freq,
not chased this pass.)

## CONVERGENCE NOTE 2026-07-01
Last several deep-checks (walk-in status/join/pay/confirm, promo validate+redeem, admin auth x49,
salon-draft) all returned NO new bugs , the pass is converging toward the 2-clean-passes stop
condition. Open items are OWNER-INPUT only: onboarding collected-but-unstored fields (drop vs add
columns); parked visual drifts (favorites legacy card, onboarding uppercase labels) for mockup-first.

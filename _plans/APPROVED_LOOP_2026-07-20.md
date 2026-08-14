# Approved multi-hour loop (owner 2026-07-20: "all approved ... jst start the multi hour loop")

Owner constraints: PARK decisions, never stop (owner at work). CAREFUL with git: main carries owner
commits from another session (verified diverged: branch +90 / main +198) , NEVER merge/fast-forward
main, commit ONLY in this worktree. Mockups explicitly PARKED ("okay mockups park it").

## Active loop items

- [x] L1 FIXED-ALREADY, verified: live index `bookings_one_active_per_slot` exists (pg_indexes 2026-07-20,
      partial unique on slot_id, active statuses, group bookings excluded), repo file
      `supabase/migrations/20260707155609_bookings_one_active_per_slot.sql` present, and the code maps
      23505 to 409 SLOT_TAKEN at `app/api/bookings/route.ts:599`. Live dupe probe: 0 rows. The
      INCOMPLETE_FEATURES "no DB guard" entry is STALE (predates 2026-07-07).
- [x] L2 verified: bug was real (DB ordered by created_at, .range() paginated, price sort ran per-page only).
      FIXED via `priceSortMode` (app/api/salons/route.ts:501): full matched set fetched, sorted by real
      min_price, THEN sliced, so page1+page2 is globally monotonic by construction (same pattern as
      semanticMode). Reviewer PASS r1; tsc clean (re-run by orchestrator). Live curl proof blocked in
      subagent sandbox (next dev listen EPERM), logic proof accepted + flagged. NOTE for a future pass:
      sort=distance has the SAME bug class, not in scope this loop (coder flagged it, left surgical).
- [x] L3 verified: bug real (RPC fail -> ids.length 0 -> emptyResult, indistinguishable from a real empty
      search). FIXED: on rErr skip the empty-return, rankIndex stays null -> semanticMode=false -> explicit
      degrade to structured search, error still console.error'd (route.ts:148-159). Reviewer PASS.
- [x] L4 FIXED-ALREADY, verified: date pre-filter IS applied via query.in("id", dayIds) before .range()
      (landed 120588c33); the later availableIds Set is deliberately for available_on_date labels, not a
      filter (commented as such). No edit.
- [x] L5 verified: angebote leak N/A (page owner-deleted 2026-06-29, REMOVED.md:9, graveyard, not recreated).
      Nearby (4 strings) + Reviews (5 strings) leaks REAL + FIXED via home.nearbySection/home.reviewsSection
      keys in ALL 4 messages/*.json (orchestrator-verified: grep counts 2/2/2/2 across de/en/fr/it), ICU
      interpolation for count/name. Reviewer PASS; tsc clean.
- [x] L6 verified clean: /api/reviews/homepage gone, zero TestimonialCarousel/reviews-homepage refs repo-wide,
      homepage Reviews.tsx fetches the live /api/reviews/featured. REMOVED.md:38-39 documents the deletion. No edit.
- [x] L7 verified: timeToMinutes single definition in-file (route.ts:930; a separate lib/salon-hours.ts
      toMinutes flagged as cross-file dedup candidate, out of scope); nextSlots FIXED-ALREADY (earliest_slots_by_service
      RPC with p_per:3, 63b0be639); Basel-coords fallback FIXED: || -> ?? (a real 0 coord no longer treated
      as missing) + console.error when coords missing (route.ts:~795). Reviewer PASS.
- [x] L8 CLOSED as superseded, correctly NOT built: the 2026-06 "one Trending chip" decision was OVERRIDDEN by
      the owner's LATER 2026-06-29 call (REMOVED.md:40 + commit 8ae227da6): ALL sort chips removed, "removed
      pending real engagement data", feed API has no sort param, so a Trending chip today would be a
      wired-looking dead control (the exact silent-no-op doctrine bans). Latest dated owner decision wins
      (precedence chain). PARKED question for owner: re-add Trending only when engagement data + a real sort
      param exist.
- [x] L9 FIXED-ALREADY + moot, verified: Sparkles -> Hand swap landed 9db0b7bbe while /angebote existed;
      the whole standalone page was then owner-deleted 0dbf39cbf (2026-06-29, REMOVED.md:9). No Sparkles in
      any current angebote surface (the dir does not exist). No edit.
- [x] L10 re-verified: current inspo mount fan-out is 5 client fetches max (4 unconditional:
      chip-terms, category-meta, category-order, feed; +1 conditional: /api/profile when a
      session exists), all already independent/parallel useEffects (no waterfall). The original
      ~9-call fan-out (5 parallel per-category discovery_feed RPCs + chip-terms + category-order
      + profile + feed) was already fixed in commit b437fee68 (2026-06-30, category-meta batch
      endpoint). No further safe consolidation found: merging category-order (per-user) into
      category-meta (public, s-maxage=300 CDN-cached) would leak personalized data into a shared
      cache, so left separate. No code change made (already-fixed, confirmed via git history).
- [x] L11 fixed, verified: `lib/salon-detail.ts:112` (staff_members!inner(salon_id) embedded join), committed 0a4e67b82. Detail: staff_services query was a 3rd sequential DB wave (waited on
      staffRes to get staff IDs for .in()). Rewired to an embedded join filter
      (staff_members!inner(salon_id)) so it runs in the SAME Promise.all as
      services/staff/reviews, collapsing salon -> [services,staff,reviews] -> staff_services (3
      waves) into salon -> [services,staff,reviews,staff_services] (2 waves). Verified the new
      join-filter query returns byte-identical rows to the old .in(ids) query (48/48 match) +
      no cross-salon leak, against the live DB. Raw Supabase round-trip timing (dev server
      couldn't bind in this sandbox, EPERM on listen): median 279ms (old, 3 waves) -> 178ms (new,
      2 waves) across 5 runs on a real salon with 4 staff / 48 staff_services rows.
- [x] L12 verified: 2 genuinely independent sequential awaits folded into the existing Promise.all,
      get_nearby_salon_ids as nearbyTask (route.ts:395-397) + the date-label RPC as dateLabelTask
      (route.ts:369-371, replacing a post-query sequential fallback RPC). Reviewer PASS (one low:
      measurement blocked by subagent sandbox listen EPERM, logic bound accepted: Promise.all waits
      max not sum). tsc clean.

- [x] L13 FIXED, verified: `app/api/salons/route.ts:510` distanceSortMode (!semanticMode && sort===distance
      && distanceMap), range skipped at :528, full-set sort + slice block at :707 (identical count/offset
      semantics to priceSortMode), old page-only re-sort removed, no-lat/lng requests untouched (solen_score
      fallback commented :520-522). Reviewer PASS round 1; orchestrator re-verified on disk + fresh tsc exit 0.

- [x] L14 verified: retired navy/orange hex -> `var(--color-heading)` (s-ink) on all 4 rows,
      `app/[locale]/_components/homepage/CategoryStack.tsx:49,55,61,67`; grep 142F4A|E58840 = 0.
- [x] L15 verified: Sparkles -> Gift, `app/[locale]/_components/salon/SalonLoyalty.tsx:4,36`; grep Sparkles = 0.
- [x] L16 verified: lightning glyph -> Timer (not CalendarClock, already taken by the slots perk row; Timer
      export confirmed in installed lucide-react), `app/[locale]/rewards/RewardsView.tsx:7,30`; grep Zap = 0.
      All three: tsc exit 0. (L14+L15 landed by the drift-law coder before its workflow was stopped;
      L16 + comment hygiene finished directly. Workflow wf_78762a3a-ac7 stopped to avoid two writers.)

## BUILD phase (owner "ok go build" 2026-07-21, after re-viewing the 3 mockups)

Scope read: build the two approved mockup systems. Direction C accepted for admin reviews (my rec,
owner did not counter-pick). Dashboard traced.html NOT built: approving it requires the owner to
supersede LOCKFILE 12.1/12.2 BY NAME (frozen-row rule); "ok go build" does not name them, so it
stays parked and is flagged in the report.

- [x] B1 GROUND done, verified: full schema+file map delivered (agent abc7bc89b2060408b, 2026-07-21); key corrections it produced: salons.payment_mode ALREADY exists (at_salon/deposit/prepay), reviews.moderation_status ALREADY exists (active/under_review/removed), PayConfirmStep already had a Pay-at-salon card, review-moderation lives in the admin-only nav of the dashboard chrome (no separate /admin group).
- [x] B2 DONE, verified: migration supabase/migrations/20260721100000_salon_payment_mode_admin_enforce.sql APPLIED live ({"success":true}); information_schema confirms payment_mode_admin (text, CHECK) + payment_mode_enforced (boolean default false). Reviews needed NO schema change (reuses under_review + is_hidden, no-visit = both FKs null). Committed 08de2499d.
- [x] B3 DONE, verified LIVE end-to-end (browser session, real API calls, 2026-07-21): no-visit POST -> 201 with booking_id null + moderation_status under_review + is_hidden true (review 1ffe99fb); salon rating UNCHANGED while pending (3.78/9); duplicate POST -> 409 REVIEW_EXISTS; /api/admin/reviews?status=pending -> exactly the 1 pending row; PATCH active -> 200, review became (active, visible) and salon recomputed to EXACTLY (3.78*9+5)/10 = 3.90/10. Test review deleted + seed restored to 3.78/9. Coder+reviewer PASS r1; RLS note: no-visit insert goes through the admin client past reviews_insert_own (which requires a booking), same pattern as walkin/review. Committed 8b8474a59.
- [x] B4 DONE, verified LIVE: effectivePaymentMode resolver (lib/bookings/payment-mode.ts); admin PATCH /api/admin/salons/[id]/payment-mode -> 200 (enforce prepay on the test salon, DB read-back confirmed); the salon-side lock is SERVER-REAL and discriminates: as plain salon_owner the own PATCH payment_mode -> 403 PAYMENT_MODE_ENFORCED, as admin -> 200 bypass (by design). Booking page + server backstop + admin list carry the 2 new columns. Coder+reviewer PASS r2. Committed a8953c7f8.
- [x] B5 DONE, verified RENDERED (screenshot): third tab "Ohne Besuch" in review-moderation, fetches ?status=pending, TabPill gray-sunken selected (ink-fill drift removed from the tab row; aria-pressed + class-string + screenshot all consistent; the one contrary getComputedStyle read was the documented preview-tab throttle lie). Empty state "Keine Bewertungen ohne Besuch zur Pruefung." renders. Committed 0add92653.
- [x] B6 DONE, verified RENDERED (screenshot, enforced state): "Von Solen festgelegt" note, all three mode cards disabled+grayed, the EFFECTIVE admin mode (Vorauszahlung) shown selected via gray treatment while the salon own mode differed; save excludes payment_mode when enforced. Blue-border selected removed from THIS block (other settings blocks pre-existing drift, parked). Committed 0add92653.
- [x] B7 DONE, verified: PayConfirmStep imports + calls effectivePaymentMode (PayConfirmStep.tsx:20,141); booking page selects the 2 new columns; grep shows no stale raw payment_mode read on the pay step. Appointment ONLINE pay untouched (G2 stays separate). Committed a8953c7f8.
- [x] B8 DONE, verified via API round-trip + reviewer PASS: all-salons per-row expander (own-mode display, payment_mode_admin picker, Erzwingen toggle, lock badge) PATCHes the new admin route; the enforce round-trip was proven live (200 + DB read-back + the 403 lock downstream). Rendered check limited to the API layer (the seed user role was restored to salon_owner after verification, so the admin nav is not visible to it; the owner own admin account sees it post-merge). Committed 0add92653.
- [x] B9 DONE: fresh tsc exit 0 (types dir wiped first); law greps clean in edited blocks (TabPill x2 in the tab row, effectivePaymentMode wired, PAYMENT_MODE_ENFORCED 403 present); B3 lifecycle + B4 lock proven live (above); 2 screenshots captured (moderation tab, enforced settings); seed DB restored exactly (salon 3.78/9, payment fields at_salon/null/false, seed user role salon_owner as found). Commits: 08de2499d, 8b8474a59, a8953c7f8, 0add92653.

## Parked (owner decisions / owner-ordered parks , do NOT stop for these)

- RESOLVED 2026-07-20 (owner caught it): the search-overlay port is ALREADY SHIPPED on main, verified:
  main's app/[locale]/_components/search/SearchOverlay.tsx:3 header says "port of LOCKED search-morph
  mockup" + gesture-linked EXPAND_DIST scroll expand at :63. The worktree's SEARCH_BACKEND.md "only gap:
  not ported yet" was STALE (main is +198 commits from other sessions). No port decision needed anymore.
- PARKED (owner "mockups park it"): dashboard traced.html re-show
  (restored from git 9c2110d66 to main checkout public/_mockups/dashboard-overhaul/traced.html);
  admin reviews-without-visit approval section mockup; payment-model surfaces mockup (salon chooses
  pay-in-store, admin can select, admin ENFORCED , owner direction 2026-07-20).
- PARKED: reviews-without-visit BUILD (owner: allowed + admin approval section) , mockup-first, waits on mockups.
- PARKED: appointment-payment-model BUILD , same, mockup-first.
- PARKED: merge worktree -> main (diverged +90/+198 with owner's other-session commits; owner merges).
- PARKED (design judgment, not mechanical law): SalonReviews.tsx:88 shadow-float on white (elevation call)
  + ItemCard.tsx:107 chip rounded-full vs LOCKFILE 10px (geometry call) , surfaced by the SWEEP-backlog
  re-verify, left for a mockup/owner pass per "mockups park it".
- NOT STARTED on purpose (never approved this loop): the getSession->getUser 236-route migration was the
  "runner-up" offer the owner did not pick; it stays its own ACTIVE workstream, untouched here.

# CARD REDESIGN (owner dictation 2026-07-13)

Salon card ("store code") redesign + a from-price question. Environment note: this session's sandbox has revoked .git writes (EPERM) AND intermittently revokes listen(), so commits + live verify may be blocked; mockups (public/_mockups, writable) + node-served tunnel are the deliverable path.

## Batch
- [x] C1. CODE done: `aspect-[3/2]` -> `aspect-[5/4]` at SalonCard.tsx:400 (homepage), components-legacy/SalonCard.tsx:158 (was aspect-square), and all 3 salon-card photo instances in SalonResultCard.tsx (grid/card/feed variants, lines 380/471/614). tsc clean (0 new errors).
- [x] C2. verified (coder abde9c5eaac6c19b1, tsc clean): AvailabilityPill + availVariants + AvailabilityProps + tealStyle/inkStyle/urgentStyle/greenStyle deleted from app/[locale]/_components/homepage/SalonCard.tsx; `availability` prop removed from SalonCardProps + its only live caller Nearby.tsx (resolveAvailability(), provably always-null per the 2026-07-08 audit); NextSlotText + Row-3 next-slot render deleted. Graveyard line added to _design-system/REMOVED.md. Not committed (sandbox denies .git).
- [x] C3. verified: mockup section #c3 in public/_mockups/card-redesign.html (narrow 165px before/after, address gets its own row with real 4px margin, price on a separate line); served + node-verified live HTTP 200 (32134 bytes) at the tunnel this turn.
- [x] C4. verified: mockup section #c4 in public/_mockups/card-redesign.html, 3 distinct variations with the 4 real ForYou salons + real prices (15/20/35/15); node-verified 200.
  - [x] C4a. verified: card-redesign.html #c4 Variation A (name left + price right-aligned same row, address full-width line 2). Rating omitted, no verified reviewCount source (SalonCard B15 gate).
  - [x] C4b. verified: card-redesign.html #c4 Variation B (2-row two-column, address/category left + price right).
  - [x] C4c. verified: card-redesign.html #c4 Variation C (price as persistent vertically-centered right column, own best; fills the right side the owner called empty).
- [x] Q5. ANSWERED (no build): per-haircut treatment-accurate from-price ALREADY SHIPPED 2026-07-01 (migration 20260701140000; SEARCH_BACKEND.md:107-109; search_synonyms.price_canonical). SEARCH results scope from-price to the searched treatment (buzzcut ab 35, fade 35, balayage 220); HOMEPAGE uses the venue floor (no query to scope to). Both correct.

## Owner card refinements (2026-07-13, second round)
- [x] C5. verified: mockup section #c5 in public/_mockups/card-redesign.html; star + review count with REAL live-queried average_rating/review_count for all 12 For-You ids (e.g. Nail Studio Bliss 4.5/13, Muse 4.2/11), count in blue s-accent per LOCKFILE. Served + node-verified live HTTP 200 at the tunnel this turn. CODE step (thread reviewCount) open, same blocker as C1/C2.
- [x] C6. verified: mockup section #c6, address conditional on city selection, both states side by side, node-verified 200.
  - [x] C6a. verified: card-redesign.html #c6 city-unselected state = "POSTAL CODE + CITY" (real postal_code e.g. "4051 Basel").
  - [x] C6b. verified: card-redesign.html #c6 city-selected state = STREET ADDRESS (real `address`, city stripped, e.g. "Steinenvorstadt 5"). Real DB address differs from the C1-C4 demo placeholders; flagged inline as a contradiction (rule 18), not silently reconciled. CODE step open, same blocker as C1/C2.

## Owner card refinements (2026-07-13, third round)
- [x] C7. verified: mockup section #c7 in public/_mockups/card-redesign.html, right-side two-column layout (name+address left, rating+count over price right, right-aligned) on all 4 real ForYou salons with real ratings/counts/prices from C5. Playwright-rendered, 0 console/page errors, 0 unexpected overflow (RatingStars.tsx:190-199 / SalonCard.tsx:573 cited for grounding).
- [x] C8. verified: font-fix diagnosed by LIVE Playwright measurement on #c5's existing rating span this turn (value + count both render 12px/weight 400 today, only colour differs, rgb(107,107,107) vs rgb(39,110,241)) , not assumed from CSS. Fixed in #c7: value 12px/weight 500 grey, count 11px/weight 400 blue (measured post-edit to confirm). Before/Fixed/Comparison-only (grey) trio + a magnified legibility panel shown side by side, labeled, for the owner to compare.
- [x] C9. verified: mockup section #c7 "C9" subsection, hypothetical 1'240-review card (only the count is hypothetical, rest of the card is Nail Studio Bliss's real data). Primary format picked: Swiss thousands separator via `count.toLocaleString("de-CH")` , the format ALREADY shipped in 4 real components (SalonSidebar.tsx:131, SalonReviews.tsx:112, SalonHeader.tsx:107, SalonServicesSheet.tsx:427), reused here instead of inventing a comma or k-abbrev the codebase has never shipped. Playwright-verified: card width stays 210px, 0 wrap, address gracefully ellipsis-truncates (same pattern as every other card in this file).

## Owner card refinements (2026-07-13, fourth round , Airbnb reference)
Owner shared an Airbnb "Popular homes in Paris" card screenshot + said "make like this, not exactly (we don't have individual hosts n sh), gimme ideas." Airbnb card structure (from the screenshot): photo (heart + "Guest favorite" badge) -> row1 title bold ("Apartment in Paris") -> row2 grey meta ("Jul 24-26 . Individual host") -> row3 grey "Fr. 209 total . star 5.0" (price + INLINE grey star + rating, NO separate review count).
- [x] C10. verified: mockup section #c10 in public/_mockups/card-redesign.html, all 3 ideas (12 cards total) render the star + value only, grey `#6B6B6B`, no `.cnt` blue count anywhere in the section (grep-checked: 0 `accent`/`#276EF1`/`cnt` hits inside #c10). Flagged as a divergence from the file's shipped gold star and the CLAUDE.md "rating = yellow star" contract row.
- [x] C11. verified: every idea in #c10 renders exactly 3 rows under the photo (name / meta / price+rating), same structure across A/B/C.
- [x] C12. verified: mockup section #c10 in public/_mockups/card-redesign.html, 3 Airbnb-adapted ideas (12 cards) with real data; served + node-verified live HTTP 200 (98946 bytes) at the tunnel this turn.
  - [x] C12a. verified: card-redesign.html #c10 Idea A (name bold / "Nagelstudio in Basel" grey / price + inline grey star, spacing-separated, no middot).
  - [x] C12b. verified: card-redesign.html #c10 Idea B (name / category + street / price left, star+rating right-aligned).
  - [x] C12c. Idea C: name / category+address (as B) / price (bold ink, divergence flagged) + rating grouped adjacent on one line, matching Airbnb's real row grouping. "Guest favorite" badge investigated (real `CurationBadge` type="top-bewertet" found, `SalonCard.tsx:257-278/264`, wired via `ForYouSalonRows.tsx:57`) but deliberately NOT rendered: it is a relative per-row-position flag, not an absolute per-salon threshold, and a dated owner decision on the mobile card family already rejected this badge type outright, contradiction flagged inline rather than silently resolved.

## Owner card refinements (2026-07-13, fifth round , CONVERGED card)
Owner is now specifying THE layout (not picking A/B/C). Build one recommended "converged" card:
- [x] C13. verified: mockup section #c11 in public/_mockups/card-redesign.html, row 1 = `.r1` (name flex:1 left + `.rating` right, same row), measured live via Playwright this turn on the reused #c5 pattern before editing (name right edge 213px, rating left edge 221px, 8px gap, no overlap). No `.cnt` count span anywhere in #c11 (grep-checked).
- [x] C14. verified: #c11's star SVG is `fill="#FFC32B"` (measured live 11x11px, matches this file's own root token `--star:#FFC32B`), not C10's grey `#6B6B6B`. All 8 card renders in #c11 (4 salons x 2 address states) use the gold fill.
- [x] C15. verified: #c11 row 2 = `.meta` category label on its own row for all 8 renders (Nagelstudio / Spa & Wellness / Coiffeur / Barbershop), reusing C10's real category strings.
- [x] C16. verified: #c11 shows BOTH C6 address states side by side in two labeled blocks ("CITY: ALL" = postal code + city, e.g. "4051 Basel"; "CITY: BASEL (selected)" = street address, e.g. "Steinenvorstadt 5"), same 4 real salons in both, real `postal_code`/`address` values reused verbatim from C6.
- [x] C17. verified: #c11 assembles the converged card, exactly 3 text rows under the 5:4 photo throughout , row1 name + gold star-rating (right), row2 category (grey), row3 conditional address + price sharing one line via the same `.r1` + `justify-content:space-between` pairing this file's own Variation B already used (measured live this turn: grey rgb(107,107,107) both sides, 8px gap, no overlap). Marked with a bordered "this is the one" callout distinct from the A/B/C comparison sections above. Real data throughout (ratings/prices from C5, addresses from C6). Mockup only, no real .tsx touched.

## APPROVED 2026-07-13 , converged card (#c11) is the design. CODE step unblocked (owner "ok approved").
The owner-fork blocker is CLEARED. Real-code build dispatched. Remaining constraint: sandbox denies .git commit + dev-server verify, so code is written + tsc-checked now, commit + live-verify owed to a stable session.

## BLOCKER on C1 / C2 / Z (concrete, not a skip)
The code step (wire 5:4 + remove availability + chosen layout into every card call-site, + C2 REMOVED.md line) is blocked on TWO named dependencies:
1. OWNER FORK: pick a C4 layout variation (A / B / C) , mockup-first law: I do not code a layout the owner has not chosen. Mockup delivered this turn (link + file).
2. ENVIRONMENT: this session's sandbox denies .git writes (EPERM, re-tested) and intermittently revokes listen(), so I cannot commit or live-verify the real-code change from here. Needs a stable session.
Both are real blockers, not deferred low-value work. The moment the owner picks a layout AND the environment can commit/verify, C1+C2+Z execute in one pass (mechanical: aspect class + remove AvailabilityPill + apply chosen meta layout across SalonCard homepage + components-legacy + SalonResultCard).

## Close
- [x] Z. verified (coder abde9c5eaac6c19b1, tsc clean 0 new errors + drift-check clean): aspect 5/4 (SalonCard.tsx:400, components-legacy/SalonCard.tsx:158, SalonResultCard.tsx:380/471/614) + availability removal (C2) + the 3-row converged layout (name+gold-star-rating / category / conditional address+price) on SalonCard.tsx, `citySelected` threaded SearchTemplate -> CategoryBrowseRails -> SalonCard, REMOVED.md line added. Price uses the locked PriceFrom primitive = "ab 15 CHF" (default applied; owner may request CHF-first). FOLLOW-ONS (dispatched / held): For-You real-data wiring (in flight), search+legacy full-layout port (needs own approval). Commit owed to a non-sandboxed session.

## For-You real-data wiring , DONE (coder a1ca807500337f921, tsc clean)
- [x] Homepage For-You + Nearby cards now show REAL data: one server batch query in app/[locale]/page.tsx:159 via app/[locale]/_components/homepage/salonCardData.ts:51-96 (salons: average_rating/review_count/postal_code/address + services min price, 17 unique IDs), threaded as `salonData` prop -> ForYouSalonRows/Nearby -> SalonCard, citySelected={false}. Missing field = omit (no fabrication). Removed the fabricated CATEGORY_DEFAULT_PRICE/NEARBY_ADDRESSES constants. tsc clean. Commit owed (sandbox).

## Notes
- Binary trigger: measurement complaint (ratio) -> the ratio is read from source (SalonCard:490 = 3/2); target 5/4.
- C4 dislike -> mockup-variations law: 3+ distinct layout directions, not 1.
- Aspect 3/2 was owner-approved 2026-07-02 (/dev/card-ratio); this turn supersedes it to 5/4 (dated owner decision).

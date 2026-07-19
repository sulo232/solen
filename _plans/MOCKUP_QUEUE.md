<!-- batch: mockups for every improvable/inconsistent frontend surface (owner 2026-07-19 "make mockups for all, 100+, dont stop") -->
# Mockup queue , every improvable surface (LOOP, don't stop)

Owner 2026-07-19: "make me [a mockup] for all the inconsistent or like improvable frontend, idc if its one hundred or more mockup, just make and dont stop." No parallel frontend agents (memory) -> built sequentially by the orchestrator. Delivered via the growing GALLERY INDEX: `/_mockups/sweep-gallery/index.html`.

## Mockup recipe (proven, passes all gates)
Per file `public/_mockups/sweep-<slug>/index.html`: `<!-- Base: elicitation --><!-- Scale: component -->` + `Grounded-in: <real path.tsx>` (slug MUST share a token with the path) + an `Exists-check:` line + run `npm run exists <kw>` that turn + real-Lucide `class="lucide ..."` on any SVG + real tokens/data + NO "(optional)"/parenthetical qualifiers + English chrome + no em-dash. Standing flags this session: ss-measured, mockup-real-base-skip, mockup-approved. Then add a row to sweep-gallery/index.html MOCKS[].

## Built
- [x] sweep-categories-tile , homepage category tile selected state (gray-fill vs border+check)
- [x] sweep-queue-feedback , walk-in queue low-rating feedback CTA (ink vs blue-ghost)

## Queue (design-decision / improvable surfaces , grow as tiers get audited)
- [ ] sweep-products-cta , SalonProducts.tsx:230 retail checkout CTA: 2nd ink CTA on PDP -> keep ink vs demote to neutral (booking is the one primary)
- [ ] sweep-pdp-section-wrapper , SalonReviews:88 + SalonBundles: only 2 of ~9 PDP sections wrapped in a floating card -> wrap all / unwrap these / keep
- [ ] sweep-search-empty , SearchTemplate.tsx:2165 cause-aware empty chip: rounded-full 68 -> error-family rounded-[14]/48 vs empty-family rounded-[20]
- [ ] sweep-walkin-skeleton , walk-in-pay:367 / queue:162 loading: mechanical spinner/dots -> tracker-shaped Skeleton (1-2 dir)
- [ ] sweep-salon-card , homepage SalonCard.tsx superseded pre-CARD_REDESIGN_2026-07-13 (aspect 3/2->5/4, drop blue review count, drop next-slot row) , VET vs the stranded branch first
- [ ] sweep-salon-team , SalonTeam.tsx:111 team carousel rounded-3xl + shadow-float (group card of PEOPLE) -> individual cards? (ties to the group-vs-individual principle) / or rounded-2xl match
- [ ] Tier 2-4 surfaces , audit each tier, add its design-decisions here (account, notifications, termine, vouchers, rewards, referral, profile subs, marketing pages, dashboards)

## Notes
- Mechanical/objective drift (token/radius/shadow/em-dash/states/touch-target) is NOT a mockup , it's a fix-now (see FRONTEND_SWEEP.md). Only genuine DESIGN CHOICES get a mockup.
- Each mockup = an A/B(/C) probe with a recommendation, for the owner to pick, then apply the pick.

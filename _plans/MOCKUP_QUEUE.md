<!-- batch: mockups for every improvable/inconsistent frontend surface (owner 2026-07-19 "make mockups for all, 100+, dont stop") -->
# Mockup queue , every improvable surface (LOOP, don't stop)

Owner 2026-07-19: "make me [a mockup] for all the inconsistent or like improvable frontend, idc if its one hundred or more mockup, just make and dont stop." No parallel frontend agents (memory) -> built sequentially by the orchestrator. Delivered via the growing GALLERY INDEX: `/_mockups/sweep-gallery/index.html`.

## Mockup recipe (proven, passes all gates)
Per file `public/_mockups/sweep-<slug>/index.html`: `<!-- Base: elicitation --><!-- Scale: component -->` + `Grounded-in: <real path.tsx>` (slug MUST share a token with the path) + an `Exists-check:` line + run `npm run exists <kw>` that turn + real-Lucide `class="lucide ..."` on any SVG + real tokens/data + NO "(optional)"/parenthetical qualifiers + English chrome + no em-dash. Standing flags this session: ss-measured, mockup-real-base-skip, mockup-approved. Then add a row to sweep-gallery/index.html MOCKS[].

## Built
- [x] sweep-categories-tile , homepage category tile selected state (gray-fill vs border+check)
- [x] sweep-queue-feedback , walk-in queue low-rating feedback CTA (ink vs blue-ghost)

## Queue (design-decision / improvable surfaces , grow as tiers get audited)
- [x] sweep-products-cta , SalonProducts.tsx:230 retail checkout CTA (neutral vs keep-ink) , BUILT
- [x] sweep-salon-sections , PDP section-wrapper rhythm (flat vs all-carded) , BUILT (was sweep-pdp-section-wrapper)
- [x] sweep-search-empty , SearchTemplate.tsx C1State empty chip (rounded-square vs full-circle) , BUILT
- [x] sweep-queue-skeleton , walk-in tracker skeleton vs spinner , BUILT
- [ ] sweep-salon-card , homepage SalonCard.tsx superseded pre-CARD_REDESIGN_2026-07-13 (aspect 3/2->5/4, drop blue review count, drop next-slot row) , VET vs the stranded branch first
- [ ] sweep-salon-team , SalonTeam.tsx:111 team carousel rounded-3xl + shadow-float (group card of PEOPLE) -> individual cards? (ties to the group-vs-individual principle) / or rounded-2xl match
- [ ] Tier 2-4 surfaces , audit each tier, add its design-decisions here (account, notifications, termine, vouchers, rewards, referral, profile subs, marketing pages, dashboards)

## Tier-2/3 decisions (audit wtvjz5xdt, 2026-07-19) , 25 mockup-worthy + 11 mechanical
Build order = HIGH impact first. (arch/behavior/copy items are DECISIONS, not A/B visual mockups , flag to owner.)
- [x] sweep-rewards-hero-gradient [HIGH] , HeroStampCard gradient: A ink card / B keep gradient , BUILT
- [x] sweep-referral-buttons [HIGH] , referral share buttons: A WhatsApp=ink primary / B two fills , BUILT
- [ ] sweep-partner-cta [HIGH] , partner/page.tsx:495 three divergent CTA destinations: A one funnel to the lead form. rec A.
- [x] sweep-help-h1 [HIGH] , help/info H1 scale: A one scale / B two-tier , BUILT
- [ ] sweep-stampcard-generation [HIGH] , StampCard.tsx:43 stamp surfaces a generation behind RewardsView (uppercase/off-token/radius) , mostly mechanical + a layout call.
- [x] sweep-ueber-uns [HIGH] , light polish vs bare stub , BUILT
- [ ] (DECISION, not mockup) sweep-nail-tech-dup [HIGH] , nail-tech/[id] DUPLICATES StaffProfilePage (rule 12) , retire+extend. dedup, not a mockup.
- [ ] (COPY, not mockup) stamps 'Eingeloest' mislabel [HIGH] , profile/stamps:167 no redemption schema , rename honestly.
- [ ] (BEHAVIOR, not mockup) referral 5-sec auto-redirect [HIGH] , referral/[code]:36 , remove the forced redirect.
- [x] sweep-notif-grouping [MED] , notifications flat edge-to-edge rows vs grouped card , BUILT
- [ ] (IA DECISION, not visual mockup) sweep-partner-cta [HIGH] , partner 3 CTAs all ink but 3 destinations , unify to one funnel (lead form). Investigated: not a visual A/B (they look identical); a written funnel recommendation, not a mockup.
- [x] sweep-rewards-tier-ladder [MED] , ink tiers vs green stepper , BUILT
- [x] sweep-referral-hero [MED] , gradient vs flat , BUILT
- [x] sweep-partner-cards [MED] , feature vs category card chrome , BUILT
- [x] sweep-partner-faq [MED] , accordion vs swipe cards , BUILT
- [x] sweep-warum-badge [MED] , say-once vs badge-on-each , BUILT
- [x] sweep-help-rows [MED] , grouped card vs flat link list , BUILT
- [x] sweep-nail-tech-badge [MED] , neutral vs colour-coded tier , BUILT
- [ ] sweep-hairtype-dup [MED] , settings/BeautyProfileForm:92 hair_type editable in 2 places , canonicalize to Haarprofil.
- [x] sweep-profile-loading [MED] , per-route vs shared skeleton , BUILT
- [x] sweep-bookings-skeleton [MED] , spinner vs layout skeleton , BUILT
- [x] sweep-brand-hero [LOW] , PDP-scale vs Section-title hero , BUILT
- [x] sweep-profile-loyalty-meta [LOW] , rank word vs blank , BUILT
- [ ] (+ mechanical fixes: notif Skeleton/EmptyState/blue-icon, referral states, help Spinner->Skeleton , feed FRONTEND_SWEEP fix-now)

## Notes
- Mechanical/objective drift (token/radius/shadow/em-dash/states/touch-target) is NOT a mockup , it's a fix-now (see FRONTEND_SWEEP.md). Only genuine DESIGN CHOICES get a mockup.
- Each mockup = an A/B(/C) probe with a recommendation, for the owner to pick, then apply the pick.

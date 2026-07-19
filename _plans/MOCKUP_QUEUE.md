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
- [ ] sweep-walkin-skeleton , walk-in-pay:367 / queue:162 loading: mechanical spinner/dots -> tracker-shaped Skeleton (1-2 dir)
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
- [ ] sweep-ueber-uns-stub [HIGH] , ueber-uns/page.tsx bare stub vs the richer marketing grammar: A leave / B upgrade / C light polish. rec C.
- [ ] (DECISION, not mockup) sweep-nail-tech-dup [HIGH] , nail-tech/[id] DUPLICATES StaffProfilePage (rule 12) , retire+extend. dedup, not a mockup.
- [ ] (COPY, not mockup) stamps 'Eingeloest' mislabel [HIGH] , profile/stamps:167 no redemption schema , rename honestly.
- [ ] (BEHAVIOR, not mockup) referral 5-sec auto-redirect [HIGH] , referral/[code]:36 , remove the forced redirect.
- [x] sweep-notif-grouping [MED] , notifications flat edge-to-edge rows vs grouped card , BUILT
- [ ] (IA DECISION, not visual mockup) sweep-partner-cta [HIGH] , partner 3 CTAs all ink but 3 destinations , unify to one funnel (lead form). Investigated: not a visual A/B (they look identical); a written funnel recommendation, not a mockup.
- [x] sweep-rewards-tier-ladder [MED] , ink tiers vs green stepper , BUILT
- [x] sweep-referral-hero [MED] , gradient vs flat , BUILT
- [ ] sweep-partner-cards [MED] , partner:110 feature-grid vs category-grid cards differ. rec A unify.
- [ ] sweep-partner-faq [MED] , partner:415 bespoke swipe cards vs shared FAQItem accordion. rec A.
- [ ] sweep-warum-badge [MED] , warum-solen:229 'Nur bei Solen' x5 + banned Sparkles. rec drop-to-once + kill Sparkles.
- [ ] sweep-help-rows [MED] , help/page.tsx:149 flat rows vs grouped-list-card. rec B/C (link list is lighter).
- [ ] sweep-nail-tech-badge [MED] , nail-tech:68 color-coded tier chips vs neutral (category-tag law). rec A neutral.
- [ ] sweep-hairtype-dup [MED] , settings/BeautyProfileForm:92 hair_type editable in 2 places , canonicalize to Haarprofil.
- [ ] sweep-profile-loading [MED] , profile/loading.tsx one stale shared skeleton across 4 pages , per-route.
- [ ] sweep-bookings-skeleton [MED] , BookingsList:177 spinner vs BookingCard-shaped skeleton.
- [ ] sweep-brand-hero [LOW] , brand/[slug]:79 PDP-scale H1 for a directory index , demote?
- [ ] sweep-profile-loyalty-meta [LOW] , profile/page.tsx:204 loyalty row blank meta , show rank word?
- [ ] (+ mechanical fixes: notif Skeleton/EmptyState/blue-icon, referral states, help Spinner->Skeleton , feed FRONTEND_SWEEP fix-now)

## Notes
- Mechanical/objective drift (token/radius/shadow/em-dash/states/touch-target) is NOT a mockup , it's a fix-now (see FRONTEND_SWEEP.md). Only genuine DESIGN CHOICES get a mockup.
- Each mockup = an A/B(/C) probe with a recommendation, for the owner to pick, then apply the pick.

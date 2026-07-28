<!-- batch: mockups for every improvable/inconsistent frontend surface (owner 2026-07-19 "make mockups for all, 100+, dont stop"; RE-ARMED 2026-07-20 "jst make these mockup for everywhere as a loop" in FORMAT v2) -->
# Mockup queue , every improvable surface (LOOP, don't stop)

## V2 LOOP (owner 2026-07-20 "make these mockups for everywhere as a loop") , the validated format ONLY
Format per mockup: BOTH panes live iframes of the SAME real route; After = the change INJECTED + measured;
Diagnosis manifest (measured | violates | target) from a same-turn measurement; verify + LOOK before commit; no flag-spam.
Defects come from the session audits (all measured findings). Gallery: sweep-gallery-v2/index.html. RESUME after
compaction: `grep -L "applyChange" public/_mockups/sweep-*/index.html` = not yet v2; continue down this list.

- [x] v2-1 sweep-reviews-direction , reviews direction A (bare blue count -> folded into pill). VERIFIED + committed.
- [x] v2-2 sweep-auth-grammar REBUILT as injection , DONE + verified (measured: 3 defects stripped , eyebrows normal-case, orange wordmark -> ink, CTA 15px; screenshot-checked).
- [x] v2-3 sweep-cookie-consent REBUILT as injection , DONE + verified (banner forced visible via consent-key clear; badge measured neutral sunken/ink-2; screenshot-checked).
- [x] v2-4 sweep-empty-consolidation , REROUTED to the FIX phase (measured live: /de/reviews has real reviews, the empty state , where the invisible sunken-on-sunken disc lives , does not render on live data; the registry-EmptyState consolidation is an already-decided mechanical class, not an A/B).
- [x] v2-5 sweep-dash-vibrancy REBUILT as injection , DONE + verified on /de/dashboard/calendar (203 dead-token elements; text measured rgb(39,110,241) after; screenshot-checked). NOTE: panes need the dev session , open /api/dev/login?to=/de/dashboard once if they show login.
- [x] v2-6 sweep-voucher-status-chip , REROUTED to the FIX phase (measured live: the seed user's wallet is EMPTY, no status chips render; the fix is the written rule-6 pattern , pastel bg + ink label + saturated icon , mechanical, no A/B needed).
- [x] v2-7 sweep-selected-ink-pill REBUILT as injection , DONE + verified (Deutsch pill: ink-fill -> gray sunken + semibold + hairline, auto-scrolls into view; measured + screenshot-checked).
- [x] v2-8 sweep-city-picker-selected , REROUTED to the FIX phase. DISCOVERY (measured live): the logged-in MobileMenu picker ALREADY renders the correct sunken+semibold selected option (rgb(244,244,245)+600); only DesktopCitySelector + the logged-out MobileCityChip lag it (weight-only). That is drift toward an existing in-app reference , mechanical, no A/B. (The old panel mockup was also superseded.)
- [x] v2-9 sweep-modal-scrim , REROUTED to the FIX phase (measured live: on MOBILE the settings modal renders full-screen white, the veil never shows, so the retint is invisible on the owner's device; the fix is one literal in Modal.tsx + Sheet.tsx: rgba(26,18,9,.4) -> rgba(10,10,10,.4)). The injection shell stays at sweep-modal-scrim for desktop review.
- [x] v2-10 sweep-nav-hover , REROUTED to the FIX phase (a desktop-only HOVER cannot render on the phone the owner reviews on; the fix is unifying the About-us frosted bloom to the sibling gray hover , the 3 siblings are the in-app reference, mechanical).
- [x] `verified:` sha 37673276b , CLOSED as a meta-item; its concrete children are the 6 items below, each ticked with its own file:line. Then: continue down the audit fix-list , CLOSED 2026-07-25. This was a meta-item, not a bounded task; the concrete children are the "Tier-2/3 decisions" items below (sweep-partner-cta, stamps mislabel, referral auto-redirect, sweep-hairtype-dup, sweep-nail-tech-dup, notif/referral/help mechanical fixes), all resolved or explicitly blocked in that section.

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
- [~] sweep-salon-card , APPLY the stranded-APPROVED CARD_REDESIGN_2026-07-13 (aspect 5/4, drop blue review count + next-slot). NOT an A/B mockup , an owner-approved design to APPLY (vet vs the stranded branch first). Flagged for the fix phase.
- [x] sweep-salon-team , Team section wrapper (match rhythm vs float) , BUILT
- [~] Tier 2-4 surfaces , audit each tier, add its design-decisions here (account, notifications, termine, vouchers, rewards, referral, profile subs, marketing pages, dashboards). DONE: notifications, rewards, referral, profile(loading+loyalty-meta), marketing(partner/warum/ueber-uns/help/brand).
- [~] Customer-tier-2 sweep IN PROGRESS (audit wf_d412c0e9-428, 2026-07-19) , un-covered customer surfaces: booking flow (5 steps), profile subpages (bookings/favorites/looks/intake-forms/haarprofil/settings), termine, vouchers, tip, auth, onboarding, inspo, reviews, category landings. Findings feed the build queue below.
### Customer tier-2 audit RESULTS (wf_d412c0e9-428) , 33 findings, 19 worthMockup -> 6 distinct decisions BUILT + rest flagged as fix
BUILT: #25 sweep-booking-payment-selected, #26 sweep-booking-panel-radii, #27 sweep-selected-ink-pill, #28 sweep-voucher-status-chip, #29 sweep-auth-grammar, #30 sweep-empty-consolidation.
FLAGGED AS APPLY-AN-ALREADY-DECIDED-CALL (not new mockups , would be near-dupes of built ones):
- bare-spinner -> shaped Skeleton (decided 3x already): intake-forms:70, walk-in-tip:40, tip:39, recently-viewed:77, inspo append-dots:656.
- tracked-uppercase eyebrow (BANNED treatment, mechanical fix): intake-forms h2:93, inspo board eyebrow:75, reset-password 3 eyebrows:85/108/123.
- icon-button 40 -> 44px (a11y floor): inspo:450, saved:67, board:69.
- mechanical harmony (worthMockup=false): profile container widths (settings md vs haarprofil 2xl vs intake 3xl), profile page-bg token (bookings bg-[--base] vs siblings), intake entry-card radius 12->16, recently-viewed thumb radius 14, board empty/error -> registry, Sparkles icon on intake AI block.
-> These go to the FIX phase (coder + reviewer), not the mockup gallery.

### DASHBOARD TIER audit RESULTS (wf_637dfd30-8a5) , 48 findings, 22 worthMockup -> 4 distinct decisions BUILT + rest flagged as fix
BUILT: #31 sweep-dash-vibrancy, #32 sweep-dash-selected-state, #33 sweep-dash-status-pill, #34 sweep-dash-card-signature.
**BIGGEST FINDING (systemic BUG, high priority for the fix phase):** the RETIRED token `s-coral` is aliased to `#0A0A0A` (ink) in tailwind.config.js:81 but still used across revenue/earnings/calendar/platform-analytics/loyalty/settings, so the "vibrant" dashboard SILENTLY RENDERS MONOCHROME INK , the owner's exact "too monochrome" complaint, caused by a dead token. Also `s-blue-subtle`/`s-blue-text`/`s-star-text` are UNDEFINED -> some status pills emit no CSS (colourless). #31 + #33 show these.
FLAGGED AS FIX (not new mockups , same call recurring / mechanical):
- dead/undefined tokens -> live tokens (s-coral->s-accent-bright/semantic; undefined pill tokens -> DashStatusPill): revenue, earnings, calendar, platform-analytics, loyalty, settings (VAT/warning/sliders/commission).
- ink primary CTA -> DashButton blue: home Neuer-Termin, services/bundles/staff Add+Save, calendar create, reviews Send-reply, sales-ops upcharge/refunds/bookings, settings Save (ink tabs).
- muted s-sage success -> s-success #16A34A: loyalty scan, verification approved.
- bare-spinner -> Skeleton: clients, segments, all 5 sales-ops, marketing/reviews/content-editor.
- hand-rolled empty/error -> registry: refunds/upcharge/bookings, content-editor/discovery.
- tracked-uppercase eyebrow: coiffeur/barber/nail CRM, settings category chips.
- card radius/shadow -> DashPanel (rounded-card-lg 20 + hairline + elevation): analytics/revenue/earnings/segments/sales-ops/marketing/settings/approvals (warm-shadow 12/14/16 drift).
- banned Zap icon (segments).
-> FIX phase (coder + reviewer), not mockups. `dev/*` (~40 scratch routes) EXCLUDED. Super-admin utility pages (all-users/feature-flags/cities-admin/...) covered by the 4 SYSTEMIC decisions above; no per-page mockup needed.

### COMPONENT LAYER audit RESULTS (wf_cf4be4ec-8ae) , 14 findings, 11 worthMockup -> 5 distinct BUILT + 1 dropped-as-fix + rest flagged
BUILT: #35 sweep-result-card-variants, #36 sweep-city-picker-selected, #37 sweep-nav-hover, #38 sweep-cookie-consent, #39 sweep-overlay-scrim.
DROPPED-AS-FIX (not a mockup): SalonCard discount pill , direction is SETTLED (pale-green %-pill in price row, memory project_card_badges) + the rose photo-tag is REJECTED (resurrection gate blocked rendering it, correctly). Also remove the auto "Top bewertet"/"Beliebt"/"Neu" CurationBadge (rejected). Both dormant-but-baked in SalonCard.tsx -> FIX phase, apply the settled green-pill + delete the rejected badges.
FLAGGED AS FIX: MobileMenu Schnellzugriff tracked-uppercase eyebrow; ReviewCard border+shadow double-edge; Entdecken dashed see-all end-cap; Sheet/CookieConsent warm rgba(50,47,44) shadows.

## SWEEP COMPLETE (2026-07-19) , 39 distinct design-decision mockups, gallery=39
Three full audits (customer pages, operator dashboard, shared components) -> every DISTINCT design decision is now a mockup. What remains is NOT mockups, it is the FIX phase (coder + reviewer): apply the picked directions + the mechanical/systemic fixes flagged above. Headline systemic bug for the fix phase: dead `s-coral` token renders the dashboard monochrome (#31/#33). Further audits would only return more mechanical fixes, not new decisions, so the mockup loop is genuinely done. Gallery: /_mockups/sweep-gallery/index.html.

## Tier-2/3 decisions (audit wtvjz5xdt, 2026-07-19) , 25 mockup-worthy + 11 mechanical
Build order = HIGH impact first. (arch/behavior/copy items are DECISIONS, not A/B visual mockups , flag to owner.)
- [x] sweep-rewards-hero-gradient [HIGH] , HeroStampCard gradient: A ink card / B keep gradient , BUILT
- [x] sweep-referral-buttons [HIGH] , referral share buttons: A WhatsApp=ink primary / B two fills , BUILT
- [x] sweep-partner-cta [HIGH] , partner/page.tsx:495 three divergent CTA destinations: A one funnel to the lead form. rec A. DONE 2026-07-25 (see the de-duped row below for the applied fix + evidence, this row was the duplicate).
- [x] sweep-help-h1 [HIGH] , help/info H1 scale: A one scale / B two-tier , BUILT
- [x] sweep-stampcard-generation [HIGH] , on-system vs current gen , BUILT
- [x] sweep-ueber-uns [HIGH] , light polish vs bare stub , BUILT
- [x] RESOLVED BY THE OWNER 2026-07-28, no mockup was ever needed. Asked whether tier badges should stay, the owner said no: "i dont think we need to always like junior senior something because kinda like make the customer like im not good, theyre just gonna choose, thats gonna be unfair." `verified:` sha fbfb42709 deleted app/[locale]/nail-tech/[id]/page.tsx (161 lines) and app/api/nail-tech/[id]/portfolio/route.ts (57 lines), confirmed with `git log --diff-filter=D`; both paths absent from disk now after confirming ZERO inbound links and nail_features=false; two REMOVED.md lines added, one with --route-outcome. Original: BLOCKED-ON-OWNER (DECISION, not mockup) sweep-nail-tech-dup [HIGH] , nail-tech/[id] DUPLICATES StaffProfilePage (rule 12) , retire+extend. dedup, not a mockup. INVESTIGATED 2026-07-25, findings below, left unticked pending an owner decision:
  - **What each renders:** `app/[locale]/nail-tech/[id]/page.tsx` (161 lines) is a nail-tech-only profile: avatar, name, a tier badge (junior/senior/master/specialist, colour-coded), specialties, rating, a design-count stat, a book-with-this-tech CTA, and a portfolio grid via `TechPortfolio` (style/shape/material filter pills + infinite scroll + `NailDesignCard`). `components-legacy/staff/StaffProfilePage.tsx` (501 lines, mounted at `app/[locale]/salon/[slug]/staff/[staffId]/page.tsx`) is the generic staff profile for ANY category: About/Services/Portfolio/Reviews scroll-spy tabs, a flat 9-image portfolio preview + lightbox, no style/shape/material filters, no tier badge, no design-count stat.
  - **How much genuinely differs:** the nail-tech page's OWN data source, `/api/nail-tech/[id]/portfolio`, only returns `{ staff: { id, name, avatar_url, specialties, salon_id } }` (route.ts:44-48), never `salon_slug`, `avg_rating`, `review_count`, `tier_label`, or `design_count`. The page's `TechProfile` interface expects all five. Net effect: the tier badge, rating, design-count stat, and book CTA NEVER render today, that part of the difference is already dead code. The one piece that is genuinely alive and different: `TechPortfolio`'s style/shape/material filter UI (StaffProfilePage has no equivalent), and it is REUSED elsewhere (`app/[locale]/dev/pdp/_overhaul/SalonImageGalleryOverhaul.tsx`), so it survives either way this route is decided.
  - **Who links to `nail-tech/[id]`:** nobody. `grep -rn "/nail-tech/" --include=*.tsx --include=*.ts` (excluding this route's own files and worktrees) returns zero `href`/`Link` references anywhere in the app. It is only reachable by typing the URL directly.
  - **Feature-flag state:** the portfolio API is gated behind `checkFeatureEnabled("nail_features")`, which defaults to `false` (`supabase/migrations/072_nail_foundation.sql:179`, and memory `project_nail_retention_loop.md` records it as still disabled). While disabled, the page's fetch never succeeds, so it always renders "not found" for every visitor today, independent of the dup question.
  - **What retiring it would break:** nothing reachable in the live product right now (unlinked + flag-disabled). The open question is forward-looking: is the tier badge / design-count concept still wanted once `nail_features` ships? If yes, the honest move is to extend `StaffProfilePage` + wire `TechPortfolio` into its portfolio tab and delete this route; if no, delete this route outright.
  - **Concrete question for the owner:** keep a nail-tech-specific profile route long-term (and if so, fix the API to actually return `salon_slug`/`avg_rating`/`review_count`/`tier_label`/`design_count`, and link to it from somewhere), or retire `nail-tech/[id]` and fold `TechPortfolio`'s filtering into `StaffProfilePage`'s portfolio tab as the one canonical profile?
- [x] (COPY, not mockup) stamps redeemed-label mislabel [HIGH] , profile/stamps:167 no redemption schema , rename honestly. DONE 2026-07-25: renamed the section header from the German word for "redeemed" (asserts a redemption event that has no schema behind it) to the German word for "completed", reusing the wording key already established elsewhere in the loyalty feature (`loyalty_completed_cards`/`completedCards`). The per-card badge text (reward-available) was already honest and is unchanged. `app/[locale]/profile/stamps/page.tsx:8,171`.
- [x] `verified:` sha 37673276b , the setInterval countdown, secondsLeft/stored state and the redirect notice are removed from app/[locale]/referral/[code]/page.tsx; the user continues via the existing explicit CTA. (BEHAVIOR, not mockup) referral 5-sec auto-redirect [HIGH] , referral/[code]:36 , remove the forced redirect. DONE 2026-07-25: removed the `setInterval` countdown and the `secondsLeft`/`stored`-driven redirect notice; the user now stays on the page and continues only via the existing explicit CTA button (`handleCta`, unchanged). `app/[locale]/referral/[code]/page.tsx`.
- [x] sweep-notif-grouping [MED] , notifications flat edge-to-edge rows vs grouped card , BUILT
- [x] (IA DECISION, not visual mockup) sweep-partner-cta [HIGH] , partner 3 CTAs all ink but 3 destinations , unify to one funnel (lead form). Investigated: not a visual A/B (they look identical); a written funnel recommendation, not a mockup. DONE 2026-07-25. Before: (1) hero signup-form submit posts the lead directly, (2) sticky bottom-bar CTA `href="#contact"` scrolls to the hero form, (3) bottom-of-page CTA `Link href="/onboarding/salon?utm_source=partner_page..."` navigated straight into the salon signup wizard, bypassing the lead form entirely. After: CTA (3) now points at `#contact`, the same anchor as the sticky CTA, so all three ink actions funnel to the ONE lead form; the mailto "book a consult" link stays the one secondary text link, unchanged rung. `app/[locale]/partner/page.tsx:494-506` (also dropped the now-unused `Link`/`useLocale` imports this CTA fix orphaned).
- [x] sweep-rewards-tier-ladder [MED] , ink tiers vs green stepper , BUILT
- [x] sweep-referral-hero [MED] , gradient vs flat , BUILT
- [x] sweep-partner-cards [MED] , feature vs category card chrome , BUILT
- [x] sweep-partner-faq [MED] , accordion vs swipe cards , BUILT
- [x] sweep-warum-badge [MED] , say-once vs badge-on-each , BUILT
- [x] sweep-help-rows [MED] , grouped card vs flat link list , BUILT
- [x] sweep-nail-tech-badge [MED] , neutral vs colour-coded tier , BUILT
- [x] sweep-hairtype-dup [MED] , settings/BeautyProfileForm:92 hair_type editable in 2 places , canonicalize to Haarprofil. VERIFIED ALREADY DONE 2026-07-25 (this box was never ticked, but the dedup itself dates to 2026-07-21 per the file's own header comment). Kept the profile/haarprofil page as the sole editor: `BeautyProfileForm.tsx` no longer renders a hair_type chip row at all (comment at lines 3-9 and 89-90 records the removal), and `app/[locale]/profile/settings/page.tsx:93` links out to `/profile/haarprofil` as its own settings row. No data or column touched, this was a pure UI de-duplication, already shipped.
- [x] sweep-profile-loading [MED] , per-route vs shared skeleton , BUILT
- [x] sweep-bookings-skeleton [MED] , spinner vs layout skeleton , BUILT
- [x] sweep-brand-hero [LOW] , PDP-scale vs Section-title hero , BUILT
- [x] sweep-profile-loyalty-meta [LOW] , rank word vs blank , BUILT
- [x] `verified:` sha 37673276b , NotificationsClient.tsx Spinner->shaped Skeleton + hand-rolled empty->EmptyState + 2 blue type-icon discs neutralised; profile/referral/page.tsx Spinner->Skeleton + EmptyState; help/page.tsx and help/[slug]/page.tsx Spinner->Skeleton. Routes re-rendered 200 with 0 page errors. (+ mechanical fixes: notif Skeleton/EmptyState/blue-icon, referral states, help Spinner->Skeleton , feed FRONTEND_SWEEP fix-now). DONE 2026-07-25, per file:
  - `app/[locale]/notifications/NotificationsClient.tsx`: the centered `<Spinner>` loading state -> a shaped `<Skeleton>` list (icon disc + 2 text lines per row, matching the real `Row`); the hand-rolled empty block -> the registry `<EmptyState>`; the `review_response` and `voucher_purchased` type-icon discs dropped from blue (`bg-s-accent-pale text-s-accent`) to neutral (`bg-s-bg-sunken text-s-ink-2`), blue is a clickable-accent color only per LOCKFILE taste rule 4 and these icons carry no click affordance of their own.
  - `app/[locale]/profile/referral/page.tsx`: the centered `<Spinner>` loading state -> a shaped `<Skeleton>` block (hero/code/share/stats outline matching the populated layout); the hand-rolled "please sign in" block -> the registry `<EmptyState>` with the existing sign-in CTA passed as its `action`.
  - `app/[locale]/help/page.tsx` and `app/[locale]/help/[slug]/page.tsx`: both centered `<Spinner>` loading states -> shaped `<Skeleton>` blocks (grouped-list shape on the index, title+meta+paragraph-line shape on the article). The empty/not-found states in both files already used the registry `<EmptyState>`, unchanged.

## Notes
- Mechanical/objective drift (token/radius/shadow/em-dash/states/touch-target) is NOT a mockup , it's a fix-now (see FRONTEND_SWEEP.md). Only genuine DESIGN CHOICES get a mockup.
- Each mockup = an A/B(/C) probe with a recommendation, for the owner to pick, then apply the pick.

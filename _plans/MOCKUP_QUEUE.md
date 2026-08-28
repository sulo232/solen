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
- [x] sweep-rewards-tier-ladder [MED] `33310f594` v2, superseded by V3-C3 `67cd05bee` , ink tiers vs green stepper , BUILT in v2 format. NOT a contradiction with V3-C3 below, which shows the same name unticked: this line records the v2 mockup existing, V3-C3 records it needing a rebuild in section-scope format after the owner banned the iframe-switcher on 2026-08-15. Both are now done.
- [x] sweep-referral-hero [MED] `68ac713ce` v2, superseded by V3-C5 `aea75ac33` , gradient vs flat , BUILT in v2 format; rebuilt as V3-C5 below.
- [x] sweep-partner-cards [MED] `fc53aa9be` v2, superseded by V3-C6 `d3dcbbde1` , feature vs category card chrome , BUILT in v2 format; rebuilt as V3-C6 below.
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

---

## V3 REMAINDER (opened 2026-08-10, after the disk was checked instead of the checkboxes)

The v2 list above reads 41 done / 1 open. The DISK says something else: 51 `sweep-*` mockups exist and
only **11** carry the v2 injection format. The other 40 are still the sparse hand-drawn After the owner
rejected. Many v2 ticks above are honest but mean "this item was RESOLVED", usually by rerouting it to a
straight code fix, not "the mockup was rebuilt". `MOCKUP_FORMAT_CORRECTION.md:22` has been carrying
"REBUILD ALL 39 in FORMAT v2" open since 2026-07-19.

- [x] V3-A. **Reviews directions built and shown** , `public/_mockups/reviews-abc/`, commit d2466f942.
  FINDING: direction A had already SHIPPED (measured live: zero bare parenthesised counts, the see-all
  already carries the count), so Before IS A and only B and C were open. Both built as live injections
  on atelier-haarwerk (blade-and-stone renders no review cards at all), verified by screenshot on all
  three panes. B and C are derived by me from three measured defects, not owner-specified. AWAITING HIS PICK.
  Original ask: Owner asked by name: *"where are the
  directions mockup?"* (`MOCKUP_ROOTCAUSE.md:6`). Only direction A exists
  (`sweep-reviews-direction`, v2). B and C were described in prose and never drawn.
  `review-directions.html` predates this (2026-06-29) and carries no A/B/C.
- [ ] V3-B. **Triage the 40 non-v2 sweeps: still-open question, or closed?** For each, decide REBUILD
  (the question is still live) or RETIRE-BY-NAME (the decision already shipped, so a rebuilt mockup
  would re-ask something settled). Every retire is listed by name in this file, never dropped quietly.
- [ ] V3-C. **Rebuild the REBUILD subset in v2 format**, one at a time, each committed.
- [ ] V3-D. Close `MOCKUP_FORMAT_CORRECTION.md:22` once V3-B and V3-C land, since that box is the
  same work stated a month earlier.

### V3-B RESULT , the 40 triaged 2026-08-10 (30 retired by name, 8 rebuild, 2 infra)

Retired means: the question that mockup asked has since been ANSWERED in writing, so rebuilding it
would re-ask a settled decision. Each is named here rather than quietly dropped, with what answers it.
If any of these is still a live question for you, say the name and it comes straight back.

**RETIRED , the law already answers it (30):**
`sweep-booking-panel-radii` (form/summary card radius 16 is locked) · `sweep-bookings-skeleton`,
`sweep-queue-skeleton`, `sweep-profile-loading` (loading is locked to Skeleton shaped like the final
layout, never a spinner) · `sweep-categories-tile` (selected = calm gray fill, locked) ·
`sweep-dash-selected-state` (dashboard keeps the blue skin by name) · `sweep-help-rows`,
`sweep-notif-grouping` (list content on white with no photo anchor requires the sunken tray, FLOORS 4) ·
`sweep-partner-faq` (a locked FAQItem accordion already exists) · `sweep-nail-tech-badge` (category tags
are neutral, no per-category colour) · `sweep-referral-buttons`, `sweep-queue-feedback`,
`sweep-products-cta` (one ink commit CTA, secondary neutral outline) · `sweep-profile-loyalty-meta`
(density floor: render the full stack when the data exists) · `sweep-help-h1` (one locked page-title
scale) · `sweep-warum-badge` (a badge repeated identically five times adds nothing) · `sweep-search-empty`
(use the locked EmptyState, do not hand-roll) · `sweep-stampcard-generation` (tracked-uppercase is
banned) · `sweep-empty-consolidation`, `sweep-city-picker-selected`, `sweep-modal-scrim`,
`sweep-nav-hover`, `sweep-voucher-status-chip`, `sweep-dash-status-pill`, `sweep-dash-card-signature`
(all rerouted to code fixes above, no A/B left) · `sweep-payment-methods`, `sweep-profile-pinterest`,
`sweep-settings-pinterest`, `sweep-profile-faithful`, `sweep-profile-rebook` (owner-picked and SHIPPED;
ProfileTabs and the settings B2 direction are the built result).

**INFRA, not a design question (2):** `sweep-gallery`, `sweep-gallery-v2` are the index pages.

**REBUILD , still a live question (8), each its own box:**
- [x] V3-C1 REBUILT as `public/_mockups/sweep-card-count-dupe/`, commit dda50f687. The price question
  answered itself on measurement: the card ALREADY ships recessive grey rgb(107,107,107) while the
  locked row says bold ink, so the code quietly won and nobody noticed. Measuring also turned up a
  defect nobody had reported: **the review count renders TWICE on every one of the 32 cards**, a long
  spelled-out line at 13px grey (154x20px) and a short parenthesised one at 14px blue (29x21px). Plus
  the name at font-weight 500, a third weight. All three undone in the After pane, verified by a
  dispatched click with the values read back. AWAITING HIS PICK on price ink vs grey; the duplicate
  count is a straight bug, not a taste question.
- [x] V3-C2 REBUILT 2026-08-28, `16d27c37d`. Ink border as shipped versus the locked gray fill, stacked at real size. REMOVED.md:41 carries an owner rejection of ink and black selected fills sitewide dated 2026-06-29, LATER than the in-code comment claiming a 2026-06-12 payment approval, and its offender list does not name PayConfirmStep, so payment reads as missed by that sweep rather than carved out as a fifth exception.
  Original question: `sweep-booking-payment-selected` , the payment step's selected state: gray fill like every
  other pill, or the ink border this mockup says you approved in "mockup 24d". That approval could not
  be found in writing and the four named ink exceptions do not include payment.
- [x] V3-C3 REBUILT 2026-08-28, `67cd05bee`. Ink node versus green node at the real 24px dot and 10px track geometry, values read out of RewardsView.tsx. Replaced a 2026-08-18 file that was a hand-drawn redraw behind a live-iframe switcher, the banned format, and which only ever rendered ONE outcome with its recommendation baked into its caption.
  Original question: `sweep-rewards-tier-ladder` , loyalty rank ladder: ink ladder or green stepper. The stepper
  law covers progress trackers and bans green on a node; a rank ladder is neither side of that.
- [x] V3-C4 REBUILT 2026-08-28, `8fb53b36f`. THE PREMISE WAS FALSE, so the question could not be
  answered as written. There is no gradient on the rewards hero and there never has been one:
  `app/[locale]/rewards/RewardsView.tsx:117` is `bg-white` with a hairline and `shadow-elevation-1`,
  and `git log --follow` back to that file's first commit shows no gradient at any point. The
  gradient the question meant lives on a DIFFERENT route, `components-legacy/loyalty/HeroStampCard.tsx:50`
  (`linear-gradient(135deg,#1B4D1B,#F3A864)`) on `/profile/stamps`. Verified by the builder with a
  control and re-verified here.
  AND THE GRADIENT ARM IS NOT A TASTE CHOICE ANYWAY: white text on that gradient's light stop
  measures **1.98:1**, under even the 3:1 large-text floor, and the star icon on it is 1.24:1.
  Ink on white is 19.80:1. WCAG AA is precedence tier 2 and outranks taste, so the mockup shows
  the comparison and states that only one arm is legal, rather than putting an illegal option to him.
  SEPARATE DEFECT FOUND IN PASSING, recorded not fixed: the rewards page carries **9 readable text
  sizes** (10.5 / 11 / 11.5 / 12.5 / 13.5 / 15 / 15.5 / 16 / 34) against a ceiling of 4, plus a
  decorative 150px `aria-hidden` watermark, and **3 rendered weights** (400 on four unstyled lines,
  600, 700) against a ceiling of 2. Two independent counts disagreed at first, 10 versus 8-9, and
  the instrument was changed rather than a side picked: the gap is entirely the watermark and the
  unstyled-default weight. Not fixed here because it is a real-code change and he has approved none.
  Original question: rewards hero, ink or the current saturated gradient.
- [x] V3-C5 REBUILT 2026-08-28, `aea75ac33`. The real gradient captured as a live Playwright screenshot versus the flat recipe the SAME page already ships 12px below it. Measured live: the subtitle reads 4.29:1 at the gradient's dark corner, under the 4.5:1 AA floor, and 5.33:1 uniformly on the flat version. Replaced a file carrying fabricated counts.
  Original question: `sweep-referral-hero` , referral hero: gradient or flat white cards.
- [x] V3-C6 REBUILT 2026-08-28, `d3dcbbde1`. THE FINDING OUTRANKED THE QUESTION. The two grids already share 7 of 9 class tokens and differ on exactly two things, the fill (sunken versus white) and one hover behaviour. Each clears the Edge-Visibility floor alone, so the defect is FLOORS LAW 8, they do not match EACH OTHER.
  Original question: `sweep-partner-cards` , partner page: do the feature grid and category grid share sunken
  chrome or white plus hairline.
- [x] V3-C7 REBUILT 2026-08-28, `8db61707a`. Replaced a stale 2026-07-19 iframe-toggle version that
  used an invented name and invented locations. Variant A is the real locked salon-detail H1 at
  30px/600, ratio 2.14x to the 14px body, which clears the >=28px display anchor and the >=1.8x
  ratio. Variant B is this page's own section-H2 at 18px/600, ratio 1.29x, which fails both. The
  page ships 22px/600 at ratio 1.57x today, so it fails both floors right now and there is no
  photographic focal in that section to exempt it. Section height measured by a real Playwright
  render through the public tunnel: 241px (28.6% of an 844 viewport) for A against 230px (27.2%)
  for B, so the floor compliance is the trade, not screen space.
  **AND A PRODUCT FINDING THAT OUTRANKS THE MOCKUP: `/[locale]/brand/[slug]` CANNOT RENDER FOR
  ANYONE.** `salon_groups` has ZERO rows, so every brand URL falls through to its not-found branch.
  Reported by the builder off the admin client, then re-verified by me against the file this
  project names as column truth: `_inventory/_db-snapshot.json`, captured 2026-08-23, records
  `{"name": "salon_groups", "rows": 0, "rls": true}` while `salons` in the same list carries 28.
  (My first reading of that snapshot said the table did not exist at all. That was my traversal
  being broken, caught by controlling on `bookings` and `salons`, which it also failed to find.
  The table exists and is empty, which is a different and smaller problem than a missing table.) WHY, per the missing-things protocol: HALF-LANDED. The
  migration `053_salon_groups.sql` shipped and the route shipped; the seed step was never written.
  Not a graveyard hit, not superseded, not a design defect. THE FIX FOLLOWS THE REASON: seed it,
  which taste rule 1 names explicitly as the fix rather than fabrication, since a row read through
  the UI's normal query is a live source. Until then the hero question is decided on a page no
  customer can reach, so the mockup is correct and the seeding is the blocker in front of it.
  Original question: brand directory page: full PDP-scale hero or a lighter section title.
- [ ] V3-C8 `sweep-ueber-uns` , STILL OPEN, and NOT because the work was not done. 2026-08-28: the
  diagnosis is finished and the file could not be written, so this stays unticked rather than
  claiming a mockup that does not exist on disk.
  **THE DEFECT FOUND, source-certain and needing no render: every non-heading character on the
  About page, 507 of 507, carries `text-s-ink-2` (#6B6B6B).** Re-verified by me at the element
  level, which is the sharper cut: the page has exactly 5 `text-s-ink` and 5 `text-s-ink-2`, and
  they split perfectly by role. Ink is on the three headings only (`page.tsx:16`, `:25`, `:36`);
  ink-2 is on the subtitle (`:19`), the paragraphs (`:28`) and the promise list (`:39`). Every
  body element, no exceptions. **CONTROL, and it makes this an outlier rather than a house style:**
  the two sibling marketing pages go the other way, `warum-solen` at 49 ink against 32 ink-2 and
  `partner` at 67 against 38. FLOORS LAW 6 says that token is for
  chevrons, placeholders, timestamps and hints and "stays forbidden on load-bearing copy", and an
  About page's body IS its load-bearing copy. `app/globals.css:63-64` sets the sitewide body colour
  to full ink #0A0A0A, and this page opts every paragraph out of that default into the hint grey.
  Its type is otherwise clean: 3 sizes (36/18/14) and 2 weights (600/400), inside both ceilings.
  **A LIVE CONTRADICTION INSIDE OUR OWN LOCKED DOCS, surfaced rather than resolved silently:**
  `LOCKFILE.md` §2.5's Type Role Registry (2026-05-28) locks a "Body" role TO `s-ink-2`/400, which
  is the exact thing FLOORS LAW 6 (2026-07-21, refined 07-27) forbids on load-bearing prose. By the
  precedence chain the later dated rule wins, but two locked documents disagree in writing and that
  is a decision for him, not for a builder.
  **WHY IT COULD NOT BE WRITTEN, and this is a gate bug, not a missing requirement:**
  `mockup-preflight-manifest.py`'s exists-check arm refused all five attempts saying `npm run exists`
  had not run that turn. It had, immediately before each. The builder imported the gate's own
  `npm_exists_ran()` and called it against its real subagent transcript, which returned True, so the
  live hook is not resolving `transcript_path` to that file for a Task-spawned subagent. It refused
  the skip flag, refused a `cp` that would have bypassed PreToolUse entirely, and reverted the repo
  clean. That is the correct behaviour and the reason this box is honest instead of ticked.
